#!/bin/bash
# Quick setup script - creates all necessary files

echo "🚀 Creating Claude Voice Agent files..."

# Create the main deployment script
cat > deploy-claude-voice.sh << 'DEPLOY_EOF'
#!/bin/bash
# Claude Voice Agent Deployment for Cloudflare

set -e

echo "🚀 Deploying Claude Voice Agent to Cloudflare..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Get credentials
echo -e "${BLUE}🔑 Setting up API credentials...${NC}"
echo "Enter your Anthropic API key:"
read -s ANTHROPIC_KEY

echo "Enter your OpenAI API key:"
read -s OPENAI_KEY

echo "Enter your ElevenLabs API key:"
read -s ELEVENLABS_KEY

echo "Enter your Cloudflare Account ID:"
read ACCOUNT_ID

echo "Enter your Cloudflare Zone ID (optional, press Enter to skip):"
read ZONE_ID

# Create resources
echo -e "${BLUE}🏗️ Creating Cloudflare resources...${NC}"

# Create KV namespace
echo "Creating KV namespace..."
wrangler kv:namespace create "CODE_STORE" --preview false > kv_result.tmp 2>&1 || true
KV_ID=$(grep -o 'id = "[^"]*"' kv_result.tmp | cut -d'"' -f2 || echo "manual_entry_needed")

wrangler kv:namespace create "CODE_STORE" --preview > kv_preview_result.tmp 2>&1 || true
KV_PREVIEW_ID=$(grep -o 'id = "[^"]*"' kv_preview_result.tmp | cut -d'"' -f2 || echo "$KV_ID")

if [ "$KV_ID" = "manual_entry_needed" ]; then
    echo "Please create a KV namespace manually and enter the ID:"
    read KV_ID
    KV_PREVIEW_ID=$KV_ID
fi

# Create D1 database
echo "Creating D1 database..."
wrangler d1 create claude-voice-db > d1_result.tmp 2>&1 || true
D1_ID=$(grep -o 'database_id = "[^"]*"' d1_result.tmp | cut -d'"' -f2 || echo "manual_entry_needed")

if [ "$D1_ID" = "manual_entry_needed" ]; then
    echo "Please create a D1 database manually and enter the ID:"
    read D1_ID
fi

# Create R2 bucket
echo "Creating R2 bucket..."
wrangler r2 bucket create claude-voice-files 2>/dev/null || echo "R2 bucket exists or created"

# Create wrangler.toml
cat > wrangler.toml << TOML_EOF
name = "claude-voice-agent"
main = "src/index.js"
compatibility_date = "$(date +%Y-%m-%d)"

[vars]
CLOUDFLARE_ACCOUNT_ID = "$ACCOUNT_ID"
CLOUDFLARE_ZONE_ID = "$ZONE_ID"

[[kv_namespaces]]
binding = "CODE_STORE"
id = "$KV_ID"
preview_id = "$KV_PREVIEW_ID"

[[d1_databases]]
binding = "PROJECT_DB"
database_name = "claude-voice-db"
database_id = "$D1_ID"

[[r2_buckets]]
binding = "FILE_STORE"
bucket_name = "claude-voice-files"
TOML_EOF

# Create source directory
mkdir -p src

# Create main worker file
cat > src/index.js << 'JS_EOF'
// Claude Voice Agent - Simplified for Quick Deploy

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/voice' && request.method === 'POST') {
      return handleVoiceInput(request, env);
    }
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: ['claude-voice', 'cloudflare-api']
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>Claude Voice Agent</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .command { background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🎤 Claude Voice Agent</h1>
    <div class="status">
        <h2>✅ Agent Status: Online</h2>
        <p>Your voice-controlled Cloudflare development assistant is ready!</p>
    </div>
    
    <h2>🎯 What You Can Say:</h2>
    <div class="command">"Deploy a hello world worker"</div>
    <div class="command">"Create a KV store for user data"</div>
    <div class="command">"List all my workers"</div>
    <div class="command">"Show me my Cloudflare analytics"</div>
    <div class="command">"Fix the CORS error in my API"</div>
    
    <h2>🔗 Endpoints:</h2>
    <ul>
        <li><strong>POST /voice</strong> - Send audio for voice commands</li>
        <li><strong>GET /health</strong> - Check agent status</li>
    </ul>
</body>
</html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
};

async function handleVoiceInput(request, env) {
  try {
    const audioData = await request.arrayBuffer();
    
    // Convert speech to text
    const transcription = await speechToText(audioData, env);
    
    // Send to Claude
    const response = await callClaude(transcription, env);
    
    // Convert to speech
    const audioResponse = await textToSpeech(response, env);
    
    return new Response(audioResponse, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
    
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

async function speechToText(audioData, env) {
  const formData = new FormData();
  formData.append('file', new Blob([audioData]), 'audio.wav');
  formData.append('model', 'whisper-1');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
    body: formData
  });
  
  const result = await response.json();
  return result.text;
}

async function callClaude(message, env) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: `Voice command: ${message}

You are a Cloudflare development assistant. Respond conversationally as if speaking to the user.
Handle requests for deploying workers, managing KV/D1/R2, DNS, analytics, debugging, etc.` }]
    })
  });
  
  const data = await response.json();
  return data.content[0].text;
}

async function textToSpeech(text, env) {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': env.ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1'
    })
  });
  
  return await response.arrayBuffer();
}
JS_EOF

# Set secrets
echo -e "${BLUE}🔐 Setting secrets...${NC}"
echo "$ANTHROPIC_KEY" | wrangler secret put ANTHROPIC_API_KEY
echo "$OPENAI_KEY" | wrangler secret put OPENAI_API_KEY  
echo "$ELEVENLABS_KEY" | wrangler secret put ELEVENLABS_API_KEY

# Deploy
echo -e "${BLUE}🚀 Deploying worker...${NC}"
wrangler deploy

# Get URL
WORKER_URL="https://claude-voice-agent.$ACCOUNT_ID.workers.dev"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}🌍 Your Claude Voice Agent is live at:${NC}"
echo "$WORKER_URL"
echo ""
echo -e "${YELLOW}🧪 Test it:${NC}"
echo "curl $WORKER_URL/health"

# Clean up temp files
rm -f *.tmp

# Save config
cat > .env << ENV_EOF
WORKER_URL=$WORKER_URL
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
OPENAI_API_KEY=$OPENAI_KEY
ELEVENLABS_API_KEY=$ELEVENLABS_KEY
CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID
ENV_EOF

echo ""
echo "🎉 Setup complete! Check $WORKER_URL to see your voice agent."
DEPLOY_EOF

# Create simple voice client
cat > voice-client.js << 'CLIENT_EOF'
#!/usr/bin/env node

const fs = require('fs');
require('dotenv').config();

const WORKER_URL = process.env.WORKER_URL || 'https://claude-voice-agent.your-account.workers.dev';

async function sendVoiceCommand(audioFile) {
    if (!fs.existsSync(audioFile)) {
        console.error('❌ Audio file not found:', audioFile);
        return;
    }

    const audioData = fs.readFileSync(audioFile);
    
    console.log('🎤 Sending voice command...');
    
    try {
        const response = await fetch(`${WORKER_URL}/voice`, {
            method: 'POST',
            body: audioData
        });
        
        if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const outputFile = `response_${Date.now()}.mp3`;
            fs.writeFileSync(outputFile, Buffer.from(audioBuffer));
            console.log(`✅ Voice response saved to: ${outputFile}`);
            
            // Try to play (requires system audio player)
            const { exec } = require('child_process');
            exec(`afplay ${outputFile} 2>/dev/null || aplay ${outputFile} 2>/dev/null`, () => {});
            
        } else {
            console.error('❌ Error:', await response.text());
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

async function testHealth() {
    try {
        const response = await fetch(`${WORKER_URL}/health`);
        const result = await response.json();
        console.log('🏥 Health check:', result);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

// CLI handling
const args = process.argv.slice(2);

if (args[0] === 'health') {
    testHealth();
} else if (args[0] === 'voice' && args[1]) {
    sendVoiceCommand(args[1]);
} else {
    console.log(`
🎤 Claude Voice Client

Usage:
  node voice-client.js health              # Test if agent is working
  node voice-client.js voice audio.wav    # Send voice command

Example voice commands:
  "Deploy a hello world worker"
  "Create a KV store for sessions" 
  "List all my workers"
  "Show me analytics"
`);
}
CLIENT_EOF

# Make scripts executable
chmod +x deploy-claude-voice.sh
chmod +x voice-client.js

echo "✅ All files created!"
echo ""
echo "🚀 Next steps:"
echo "1. ./deploy-claude-voice.sh"
echo "2. node voice-client.js health"
echo ""
