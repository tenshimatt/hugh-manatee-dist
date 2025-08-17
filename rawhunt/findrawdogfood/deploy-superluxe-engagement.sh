#!/bin/bash

# SUPERLUXE Community Engagement Bot Deployment Script
# Deploys the autonomous Reddit monitoring and engagement system

set -e

echo "🚀 SUPERLUXE Community Engagement Bot Deployment"
echo "================================================"

# Check dependencies
if ! command -v wrangler >/dev/null 2>&1; then
    echo "❌ Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI found"

# Ensure we're in the right directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"

# Step 1: Setup database schema
echo ""
echo "📊 Setting up community engagement database schema..."
wrangler d1 execute findrawdogfood-db --file=./scripts/community-engagement-schema.sql
echo "✅ Database schema deployed"

# Step 2: Deploy to development first
echo ""
echo "🧪 Deploying to development environment..."
wrangler deploy --config wrangler-superluxe-engagement.toml --env dev
echo "✅ Development deployment complete"

# Step 3: Test development deployment
echo ""
echo "🔍 Testing development deployment..."
sleep 5

# Test API endpoints
DEV_URL="https://superluxe-engagement-bot-dev.your-account.workers.dev"

echo "Testing queue status endpoint..."
curl -s "$DEV_URL/api/queue/status" | head -100

echo ""
echo "Testing dashboard endpoint..."
curl -s "$DEV_URL/api/dashboard" | head -100

# Step 4: Deploy to production (with confirmation)
echo ""
read -p "🚀 Deploy to production? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    wrangler deploy --config wrangler-superluxe-engagement.toml --env production
    echo "✅ Production deployment complete"
    
    # Set up secrets (if not already set)
    echo ""
    echo "🔐 Reminder: Set up secrets if not already configured:"
    echo "  wrangler secret put REDDIT_CLIENT_ID --config wrangler-superluxe-engagement.toml --env production"
    echo "  wrangler secret put REDDIT_CLIENT_SECRET --config wrangler-superluxe-engagement.toml --env production"
    echo "  wrangler secret put OPENAI_API_KEY --config wrangler-superluxe-engagement.toml --env production"
    
else
    echo "⏸️  Production deployment skipped"
fi

echo ""
echo "🎯 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Database schema: Deployed"
echo "✅ Development environment: Ready"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Production environment: Ready"
    echo ""
    echo "🔗 Production URLs:"
    echo "   Dashboard: https://superluxe-engagement-bot-prod.your-account.workers.dev/api/dashboard"
    echo "   Queue Status: https://superluxe-engagement-bot-prod.your-account.workers.dev/api/queue/status"
else
    echo "⏸️  Production environment: Not deployed"
fi

echo ""
echo "📈 MONITORING DASHBOARD"
echo "======================"
echo "The bot will automatically:"
echo "  • Monitor 14 art subreddits every 15 minutes"
echo "  • Analyze opportunities every 2 hours"
echo "  • Generate daily insights at midnight"
echo "  • Respect rate limits and brand guidelines"

echo ""
echo "🎉 SUPERLUXE Engagement Bot deployment complete!"
echo "🎯 Ready to drive authentic art community engagement!"