#!/bin/bash

# Rawgle Platform Production Deployment Script
# Follows the same pattern as findrawdogfood deployment

echo "🚀 Deploying Rawgle Platform to production..."
echo "=================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found, using defaults"
fi

# Create production wrangler config with env vars
cat > wrangler-production.toml << EOF
name = "rawgle-api"
main = "src/index.js"
compatibility_date = "2024-08-12"
compatibility_flags = ["nodejs_compat"]

# KV Namespaces
[[kv_namespaces]]
binding = "RAWGLE_KV"
id = "${RAWGLE_KV_NAMESPACE_ID}"

[[kv_namespaces]]
binding = "SESSIONS"
id = "${SESSIONS_KV_NAMESPACE_ID}"

# Environment Variables from .env
[vars]
ENVIRONMENT = "${ENVIRONMENT}"
PRIMARY_DOMAIN = "${PRIMARY_DOMAIN}"
SOLANA_MASTER_WALLET = "${SOLANA_MASTER_WALLET}"
PAWS_EXCHANGE_RATE = "${PAWS_EXCHANGE_RATE}"
MAX_DAILY_PAWS = "${MAX_DAILY_PAWS}"
LOG_LEVEL = "${LOG_LEVEL}"
RATE_LIMIT_PER_MINUTE = "${RATE_LIMIT_PER_MINUTE}"
MAX_PAYLOAD_SIZE = "${MAX_PAYLOAD_SIZE}"
SESSION_TIMEOUT_HOURS = "${SESSION_TIMEOUT_HOURS}"
ENABLE_NFT_MINTING = "${ENABLE_NFT_MINTING}"
ENABLE_AI_CONSULTATIONS = "${ENABLE_AI_CONSULTATIONS}"
ENABLE_MARKETPLACE = "${ENABLE_MARKETPLACE}"
ENABLE_SUBSCRIPTION_FEATURES = "${ENABLE_SUBSCRIPTION_FEATURES}"

# Production environment config
[env.production]
name = "rawgle-api-production"

[env.production.vars]
ENVIRONMENT = "production"

# Add routes when domain is ready
# [[env.production.routes]]
# pattern = "rawgle.com/*"
# zone_name = "rawgle.com"
# 
# [[env.production.routes]]
# pattern = "www.rawgle.com/*"
# zone_name = "rawgle.com"
EOF

echo "📝 Created production configuration"

# Deploy to Cloudflare
echo "🌐 Deploying to Cloudflare Workers..."
npx wrangler deploy --config wrangler-production.toml

deployment_result=$?

if [ $deployment_result -eq 0 ]; then
    echo ""
    echo "✅ Production deployment successful!"
    echo "=================================="
    echo ""
    echo "🌍 Your API is now live at:"
    echo "   • ${WORKER_URL}"
    echo ""
    echo "📊 Test endpoints:"
    echo "   • Health: ${WORKER_URL}/api/health"
    echo "   • Pets: ${WORKER_URL}/api/pets"
    echo "   • PAWS: ${WORKER_URL}/api/paws"
    echo "   • AI Medical: ${WORKER_URL}/api/ai-medical"
    echo ""
    echo "📝 Features deployed:"
    echo "   ✅ Authentication system"
    echo "   ✅ Pet profile management"
    echo "   ✅ PAWS cryptocurrency rewards"
    echo "   ✅ AI medical consultations"
    echo "   ✅ NFT minting capability"
    echo "   ✅ Real-time analytics"
    echo "   ✅ Rate limiting & security"
    echo ""
    echo "🔐 Secrets Management:"
    echo "   To add sensitive API keys as secrets (not in vars):"
    echo "   wrangler secret put OPENAI_API_KEY"
    echo "   wrangler secret put ANTHROPIC_API_KEY"
    echo "   wrangler secret put SOLANA_PRIVATE_KEY"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🔧 Next steps:"
echo "1. Add secrets for sensitive keys: wrangler secret put <KEY_NAME>"
echo "2. Create D1 database: wrangler d1 create rawgle-production"
echo "3. Create R2 buckets: wrangler r2 bucket create rawgle-images"
echo "4. Configure custom domain when ready"
echo ""
echo "📈 Monitor at: https://dash.cloudflare.com"