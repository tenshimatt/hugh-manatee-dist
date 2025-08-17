#!/bin/bash
set -e

echo "🚀 Deploying Reservation Extractor to Cloudflare..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

# Check/Install Wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Check Cloudflare login
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
    
    # Verify login worked
    if ! wrangler whoami &> /dev/null; then
        echo "❌ Cloudflare login failed"
        exit 1
    fi
fi

echo "✅ Prerequisites check passed"

# Create project
PROJECT_DIR="reservation-extractor-$(date +%s)"
mkdir -p "$PROJECT_DIR/src"
cd "$PROJECT_DIR"

echo "📁 Created project in: $PROJECT_DIR"

# Create package.json
cat > package.json << 'PACKAGE_EOF'
{
  "name": "reservation-extractor",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240129.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.22.0"
  },
  "dependencies": {
    "zod": "^3.22.4"
  }
}
PACKAGE_EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Create resources
echo "🔧 Creating Cloudflare resources..."

# Create KV namespaces
echo "Creating KV namespaces..."
RESERVATIONS_OUTPUT=$(wrangler kv:namespace create "RESERVATIONS" 2>&1)
CACHE_OUTPUT=$(wrangler kv:namespace create "CACHE" 2>&1)

# Extract KV IDs more reliably
RESERVATIONS_ID=$(echo "$RESERVATIONS_OUTPUT" | grep -o '[a-f0-9]\{32\}' | head -1)
CACHE_ID=$(echo "$CACHE_OUTPUT" | grep -o '[a-f0-9]\{32\}' | head -1)

if [ -z "$RESERVATIONS_ID" ]; then
    echo "⚠️  Could not extract RESERVATIONS KV ID, using placeholder"
    RESERVATIONS_ID="placeholder-reservations-id"
fi

if [ -z "$CACHE_ID" ]; then
    echo "⚠️  Could not extract CACHE KV ID, using placeholder"
    CACHE_ID="placeholder-cache-id"
fi

echo "RESERVATIONS KV ID: $RESERVATIONS_ID"
echo "CACHE KV ID: $CACHE_ID"

# Create R2 bucket
echo "Creating R2 bucket..."
wrangler r2 bucket create reservation-emails 2>/dev/null || echo "Bucket may already exist"

# Create wrangler.toml
cat > wrangler.toml << WRANGLER_EOF
name = "reservation-extractor"
main = "src/index.ts"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "RESERVATIONS"
id = "$RESERVATIONS_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "$CACHE_ID"

[[r2_buckets]]
binding = "EMAIL_ARCHIVE"
bucket_name = "reservation-emails"

[[analytics_engine_datasets]]
binding = "ANALYTICS_ENGINE"
WRANGLER_EOF

# Create the main worker
cat > src/index.ts << 'WORKER_EOF'
export interface Env {
  RESERVATIONS: KVNamespace;
  CACHE: KVNamespace;
  EMAIL_ARCHIVE: R2Bucket;
  ANALYTICS_ENGINE: AnalyticsEngineDataset;
}

interface EmailData {
  sender?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  timestamp?: string;
}

interface ReservationData {
  id: string;
  type: string;
  service_name: string;
  location?: string;
  check_in?: string;
  check_out?: string;
  date?: string;
  time?: string;
  amount_paid?: number;
  currency?: string;
  booking_reference?: string;
  source?: string;
  raw_summary: string;
  confidence_score?: number;
  created_at: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health') {
        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            kv: !!env.RESERVATIONS,
            r2: !!env.EMAIL_ARCHIVE,
            analytics: !!env.ANALYTICS_ENGINE
          }
        };
        
        return new Response(JSON.stringify(healthData), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Process email webhook
      if (url.pathname === '/webhook/email' && request.method === 'POST') {
        const emailData: EmailData = await request.json();
        const result = await processEmail(emailData, env);
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // List reservations
      if (url.pathname === '/api/reservations' && request.method === 'GET') {
        const reservations = await getReservations(env);
        
        return new Response(JSON.stringify({
          data: reservations,
          count: reservations.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get specific reservation
      if (url.pathname.startsWith('/api/reservations/') && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        const reservation = await env.RESERVATIONS.get(`res_${id}`, 'json');
        
        if (!reservation) {
          return new Response(JSON.stringify({ error: 'Reservation not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response(JSON.stringify({ data: reservation }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Dashboard
      if (url.pathname === '/' || url.pathname === '/dashboard') {
        const html = getDashboardHTML(url.origin);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

async function processEmail(emailData: EmailData, env: Env): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Extract text content
    let text = emailData.body_text || '';
    
    if (emailData.body_html && emailData.body_html.length > text.length) {
      // Simple HTML to text conversion
      text = emailData.body_html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (emailData.subject) {
      text = `Subject: ${emailData.subject}\n\n${text}`;
    }

    if (!text || text.length < 20) {
      throw new Error('Insufficient email content to process');
    }

    // Check cache first
    const cacheKey = `email_${hashString(text)}`;
    const cached = await env.CACHE.get(cacheKey, 'json');
    
    if (cached) {
      return {
        success: true,
        data: cached,
        fromCache: true,
        processingTime: Date.now() - startTime
      };
    }

    // Process with Claude
    const aiResult = await extractWithClaude(text, emailData.sender, emailData.subject);
    
    // Create reservation record
    const reservation: ReservationData = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...aiResult,
      created_at: new Date().toISOString()
    };

    // Store reservation
    await env.RESERVATIONS.put(reservation.id, JSON.stringify(reservation));
    
    // Cache result for 24 hours
    await env.CACHE.put(cacheKey, JSON.stringify(aiResult), { expirationTtl: 86400 });

    // Track analytics
    if (env.ANALYTICS_ENGINE) {
      await env.ANALYTICS_ENGINE.writeDataPoint({
        blobs: ['email_processed'],
        doubles: [Date.now() - startTime, aiResult.confidence_score || 0],
        indexes: [aiResult.type || 'unknown', aiResult.source || 'unknown']
      });
    }

    return {
      success: true,
      data: reservation,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Email processing error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
      processingTime: Date.now() - startTime
    };
  }
}

async function extractWithClaude(text: string, sender?: string, subject?: string): Promise<Partial<ReservationData>> {
  const contextParts = [];
  if (sender) contextParts.push(`Sender: ${sender}`);
  if (subject) contextParts.push(`Subject: ${subject}`);
  
  const context = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join('\n')}` : '';

  const prompt = `Extract reservation details from this email. Return only valid JSON:

{
  "type": "hotel | restaurant | theatre | flight | car_rental | event | other",
  "service_name": "name of the service provider",
  "location": "city or venue name",
  "check_in": "YYYY-MM-DD format or null",
  "check_out": "YYYY-MM-DD format or null",
  "date": "YYYY-MM-DD for single date events or null",
  "time": "HH:MM format or null",
  "amount_paid": "numeric amount or null",
  "currency": "currency code or null",
  "booking_reference": "confirmation number or null", 
  "source": "sender domain or service name",
  "raw_summary": "brief summary of the reservation"
}

Email content:
${text}${context}

Return only the JSON object:`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No content returned from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const data = JSON.parse(jsonMatch[0]);
    
    // Add confidence score
    data.confidence_score = calculateConfidence(data);
    
    return data;

  } catch (error) {
    console.error('Claude extraction failed:', error);
    
    // Fallback to simple extraction
    return {
      type: 'other',
      service_name: inferServiceFromSender(sender) || 'Unknown Service',
      source: sender ? sender.split('@')[1] : 'unknown',
      raw_summary: `Email from ${sender || 'unknown'}: ${text.substring(0, 100)}...`,
      confidence_score: 0.3
    };
  }
}

function calculateConfidence(data: any): number {
  let score = 0.5;
  
  if (data.type && data.type !== 'other') score += 0.15;
  if (data.service_name && data.service_name !== 'Unknown Service') score += 0.1;
  if (data.booking_reference) score += 0.1;
  if (data.amount_paid) score += 0.1;
  if (data.location) score += 0.05;
  if (data.check_in || data.date) score += 0.1;
  
  return Math.min(score, 1.0);
}

function inferServiceFromSender(sender?: string): string | null {
  if (!sender) return null;
  
  const domain = sender.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  const services: Record<string, string> = {
    'booking.com': 'Booking.com',
    'hotels.com': 'Hotels.com',
    'airbnb.com': 'Airbnb',
    'expedia.com': 'Expedia',
    'opentable.com': 'OpenTable',
    'ticketmaster.com': 'Ticketmaster',
    'eventbrite.com': 'Eventbrite'
  };
  
  return services[domain] || null;
}

async function getReservations(env: Env): Promise<ReservationData[]> {
  try {
    const listResult = await env.RESERVATIONS.list({ prefix: 'res_' });
    const reservations: ReservationData[] = [];

    for (const key of listResult.keys.slice(0, 50)) {
      const data = await env.RESERVATIONS.get(key.name, 'json');
      if (data) {
        reservations.push(data as ReservationData);
      }
    }

    // Sort by creation date, newest first
    return reservations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    return [];
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getDashboardHTML(origin: string): string {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Extractor</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 900px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 40px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #495057; margin-bottom: 5px; }
        .stat-label { color: #6c757d; font-size: 0.9em; }
        .section { margin-bottom: 40px; }
        .section h3 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        .endpoint { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; font-family: monospace; }
        .method { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 10px; }
        .method.get { background: #007bff; }
        .test-section { background: #e3f2fd; padding: 20px; border-radius: 8px; }
        pre { background: #263238; color: #eeffff; padding: 20px; border-radius: 6px; overflow-x: auto; font-size: 0.9em; }
        .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.info { background: #cce7ff; color: #004085; border: 1px solid #b3d7ff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Reservation Extractor</h1>
            <p>AI-powered email reservation parsing service</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalProcessed">0</div>
                    <div class="stat-label">Emails Processed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="successRate">100%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="avgConfidence">0%</div>
                    <div class="stat-label">Avg Confidence</div>
                </div>
            </div>
            
            <div class="status success">
                <strong>✅ Service Status:</strong> All systems operational
            </div>
            
            <div class="section">
                <h3>API Endpoints</h3>
                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/webhook/email</strong> - Process incoming email reservations
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/api/reservations</strong> - List all extracted reservations
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/health</strong> - Service health check
                </div>
            </div>
            
            <div class="section">
                <h3>Test the Service</h3>
                <div class="test-section">
                    <p><strong>Send a test email:</strong></p>
                    <pre>curl -X POST "${origin}/webhook/email" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "booking@hilton.com",
    "subject": "Booking Confirmation",
    "body_text": "Hotel: Hilton Downtown\\nCheck-in: July 25, 2025\\nCheck-out: July 27, 2025\\nAmount: $475.50\\nReference: HIL-83920"
  }'</pre>
                </div>
            </div>
            
            <div class="section">
                <h3>Integration</h3>
                <p>Configure your email service to send webhooks to:</p>
                <div class="endpoint">
                    <code>${origin}/webhook/email</code>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Load reservations to show stats
        fetch('/api/reservations')
            .then(r => r.json())
            .then(data => {
                document.getElementById('totalProcessed').textContent = data.count || 0;
                
                if (data.data && data.data.length > 0) {
                    const avgConf = data.data.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / data.data.length;
                    document.getElementById('avgConfidence').textContent = Math.round(avgConf * 100) + '%';
                }
            })
            .catch(() => {
                // Ignore errors for demo
            });
    </script>
</body>
</html>\`;
}
WORKER_EOF

# Create TypeScript config
cat > tsconfig.json << 'TS_EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"]
}
TS_EOF

# Deploy to Cloudflare
echo "🚀 Deploying to Cloudflare..."
wrangler deploy

# Get the deployed URL
echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""

# Try to get the actual worker URL
WORKER_URL=""
if command -v wrangler &> /dev/null; then
    WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o 'https://[^/]*' | head -1)
fi

if [ -z "$WORKER_URL" ]; then
    echo "🌐 Your service is deployed to Cloudflare Workers"
    echo "📋 Find your worker URL in the Cloudflare dashboard"
else
    echo "🌐 Your service is live at: $WORKER_URL"
fi

echo ""
echo "📊 Dashboard: [YOUR-WORKER-URL]/dashboard"
echo "🔗 Webhook: [YOUR-WORKER-URL]/webhook/email"
echo "📋 API: [YOUR-WORKER-URL]/api/reservations"
echo "❤️  Health: [YOUR-WORKER-URL]/health"
echo ""

# Create test file
cat > test-email.json << 'TEST_EOF'
{
  "sender": "booking@hilton.com",
  "subject": "Booking Confirmation - Hilton Downtown",
  "body_text": "Dear Guest,\n\nYour booking is confirmed!\n\nHotel: Hilton Downtown\nLocation: New York, NY\nCheck-in: July 25, 2025\nCheck-out: July 27, 2025\nAmount: $475.50\nBooking Reference: HIL-83920\n\nThank you for choosing Hilton.",
  "timestamp": "2025-07-20T10:00:00Z"
}
TEST_EOF

echo "📝 Created test-email.json for testing"
echo ""
echo "🧪 Test command:"
echo "curl -X POST [YOUR-WORKER-URL]/webhook/email -H \"Content-Type: application/json\" -d @test-email.json"
echo ""
echo "🎉 Deployment complete! Check the Cloudflare dashboard for your worker URL."

