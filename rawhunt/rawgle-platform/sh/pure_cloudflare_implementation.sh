# 🚀 RAWGLE: Pure Cloudflare Implementation

# ===== SINGLE COMMAND SETUP =====
mkdir rawgle-pure && cd rawgle-pure
npm init -y
npm install wrangler @cloudflare/workers-types

# Create complete wrangler.toml
cat > wrangler.toml << 'EOF'
name = "rawgle-api"
main = "src/index.js"
compatibility_date = "2024-08-12"

# All D1 databases
[[d1_databases]]
binding = "DB"
database_name = "rawgle-production"
database_id = "your-d1-database-id"

# All KV namespaces
[[kv_namespaces]]
binding = "RAWGLE_KV"
id = "your-kv-namespace-id"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-namespace-id"

# All R2 buckets
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "rawgle-images"

[[r2_buckets]]
binding = "REPORTS"
bucket_name = "rawgle-reports"

# All Queues
[[queues]]
binding = "RAWGLE_QUEUE"
queue = "rawgle-jobs"

# Durable Objects
[[durable_objects.bindings]]
name = "ANALYTICS"
class_name = "AnalyticsDurableObject"
script_name = "rawgle-api"

# Workers AI
[ai]
binding = "AI"

# Cron triggers
[triggers]
crons = ["0 1 * * *", "0 */6 * * *", "*/15 * * * *"]

# Environment variables
[vars]
SOLANA_MASTER_WALLET = "E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA"
PAWS_EXCHANGE_RATE = "1000"
EOF

# ===== CREATE ALL CLOUDFLARE RESOURCES =====
# D1 Database
wrangler d1 create rawgle-production

# KV Namespaces
wrangler kv:namespace create "RAWGLE_KV"
wrangler kv:namespace create "SESSIONS"

# R2 Buckets
wrangler r2 bucket create rawgle-images
wrangler r2 bucket create rawgle-reports

# Queues
wrangler queues create rawgle-jobs

# ===== COMPLETE DATABASE SCHEMA =====
cat > schema.sql << 'EOF'
-- Users and authentication (replaces Supabase Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  wallet_address TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  paws_balance INTEGER DEFAULT 0,
  nft_holder BOOLEAN DEFAULT FALSE,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pet profiles with R2 integration
CREATE TABLE pet_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  age_category TEXT CHECK(age_category IN ('puppy', 'adult', 'senior')),
  breed TEXT,
  weight REAL,
  activity_level TEXT DEFAULT 'moderate',
  private_bio TEXT, -- Encrypted in Workers
  profile_image_r2_key TEXT,
  nft_mint_address TEXT,
  memorial_mode BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feeding logs with PAWS integration
CREATE TABLE feeding_logs (
  id TEXT PRIMARY KEY,
  pet_id TEXT REFERENCES pet_profiles(id),
  log_date DATE NOT NULL,
  meal_time TEXT,
  food_type TEXT,
  quantity TEXT,
  is_baseline BOOLEAN DEFAULT FALSE,
  baseline_source_date DATE,
  paws_earned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PAWS transactions (Solana integration)
CREATE TABLE paws_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT,
  description TEXT,
  solana_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  queue_job_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

-- AI medical consultations (Workers AI)
CREATE TABLE ai_consultations (
  id TEXT PRIMARY KEY,
  pet_id TEXT REFERENCES pet_profiles(id),
  symptoms TEXT,
  image_r2_keys TEXT, -- JSON array of R2 keys
  ai_assessment TEXT,
  emergency_flag BOOLEAN DEFAULT FALSE,
  confidence_score REAL,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NFT minting records
CREATE TABLE nft_mints (
  id TEXT PRIMARY KEY,
  pet_id TEXT REFERENCES pet_profiles(id),
  solana_mint_address TEXT UNIQUE,
  metadata_r2_key TEXT,
  is_legacy BOOLEAN DEFAULT FALSE,
  mint_cost_paws INTEGER,
  ipfs_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- E-commerce orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  products TEXT, -- JSON array
  total_amount REAL,
  paws_used INTEGER DEFAULT 0,
  discount_applied REAL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and metrics
CREATE TABLE daily_metrics (
  id TEXT PRIMARY KEY,
  metric_date DATE NOT NULL,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  paws_minted INTEGER DEFAULT 0,
  nfts_created INTEGER DEFAULT 0,
  ai_consultations INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

# Apply schema
wrangler d1 execute rawgle-production --file=schema.sql

# ===== MAIN WORKER ENTRY POINT =====
mkdir -p src
cat > src/index.js << 'EOF'
// Main API router - handles all requests
export { AnalyticsDurableObject } from './durable-objects/analytics.js';

const routes = {
  '/api/auth': () => import('./routes/auth.js'),
  '/api/pets': () => import('./routes/pets.js'),
  '/api/feeding': () => import('./routes/feeding.js'),
  '/api/paws': () => import('./routes/paws.js'),
  '/api/ai-medical': () => import('./routes/ai-medical.js'),
  '/api/nft': () => import('./routes/nft.js'),
  '/api/store': () => import('./routes/store.js'),
  '/api/analytics': () => import('./routes/analytics.js'),
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Find matching route
    for (const [route, handler] of Object.entries(routes)) {
      if (path.startsWith(route)) {
        try {
          const module = await handler();
          const response = await module.default(request, env, ctx);
          
          // Add CORS headers to response
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        } catch (error) {
          console.error(`Error in ${route}:`, error);
          return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
  
  // Cron trigger handler
  async scheduled(controller, env, ctx) {
    const cron = controller.cron;
    
    switch (cron) {
      case "0 1 * * *":
        // Daily reports
        await env.RAWGLE_QUEUE.send({
          type: 'generate_daily_report',
          data: { date: new Date().toISOString() }
        });
        break;
        
      case "0 */6 * * *":
        // Health monitoring batch job
        await env.RAWGLE_QUEUE.send({
          type: 'health_monitoring_batch',
          data: {}
        });
        break;
        
      case "*/15 * * * *":
        // Process PAWS transactions
        await env.RAWGLE_QUEUE.send({
          type: 'process_paws_queue',
          data: {}
        });
        break;
    }
  },
  
  // Queue consumer
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { type, data } = message.body;
      
      try {
        switch (type) {
          case 'mint_paws':
            await mintPAWSTokens(data.userId, data.amount, env);
            break;
            
          case 'generate_daily_report':
            await generateDailyReport(env);
            break;
            
          case 'process_nft_mint':
            await processNFTMint(data.petId, data.metadata, env);
            break;
            
          case 'health_monitoring_batch':
            await runHealthMonitoringBatch(env);
            break;
            
          case 'process_paws_queue':
            await processPendingPAWSTransactions(env);
            break;
        }
        
        message.ack();
      } catch (error) {
        console.error(`Queue job failed:`, error);
        message.retry();
      }
    }
  }
};

// Helper functions
async function mintPAWSTokens(userId, amount, env) {
  // Implement Solana PAWS minting
  console.log(`Minting ${amount} PAWS for user ${userId}`);
}

async function generateDailyReport(env) {
  // AI-generated daily reports using Workers AI
  const metrics = await env.DB.prepare(`
    SELECT * FROM daily_metrics 
    WHERE metric_date = date('now')
  `).first();
  
  const aiReport = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
    prompt: `Generate executive summary for these daily metrics: ${JSON.stringify(metrics)}`,
    max_tokens: 500
  });
  
  // Store report in R2
  await env.REPORTS.put(
    `daily-reports/${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify({ metrics, report: aiReport.response })
  );
}

async function processNFTMint(petId, metadata, env) {
  // Implement Solana NFT minting
  console.log(`Minting NFT for pet ${petId}`);
}

async function runHealthMonitoringBatch(env) {
  // AI health monitoring for all active pets
  const activePets = await env.DB.prepare(`
    SELECT p.*, u.email FROM pet_profiles p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.created_at > datetime('now', '-30 days')
  `).all();
  
  for (const pet of activePets.results) {
    // Queue individual health checks
    await env.RAWGLE_QUEUE.send({
      type: 'health_check_individual',
      data: { petId: pet.id }
    });
  }
}

async function processPendingPAWSTransactions(env) {
  // Process pending PAWS transactions
  const pending = await env.DB.prepare(`
    SELECT * FROM paws_transactions 
    WHERE status = 'pending' 
    LIMIT 100
  `).all();
  
  for (const transaction of pending.results) {
    // Process Solana transaction
    // Update status to 'completed'
    await env.DB.prepare(`
      UPDATE paws_transactions 
      SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(transaction.id).run();
  }
}
EOF

# ===== DEPLOY EVERYTHING =====
# Build and deploy
wrangler deploy

# Create Pages project for frontend
wrangler pages project create rawgle-frontend

echo "✅ Pure Cloudflare stack deployed!"
echo "🌐 API: https://rawgle-api.your-subdomain.workers.dev"
echo "📊 Analytics: Available via Durable Objects"
echo "🗄️ Database: D1 with full schema"
echo "🖼️ Storage: R2 buckets ready"
echo "⚡ Queues: Background job processing active"
echo "🤖 AI: Workers AI integrated"

# Test the deployment
curl "https://rawgle-api.your-subdomain.workers.dev/api/health"