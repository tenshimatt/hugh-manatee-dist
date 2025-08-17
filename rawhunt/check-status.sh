#!/bin/bash
# 🔍 Architect-GPT: Deployment Status Checker

echo "🔍 Checking Cloudflare Workers Deployment Status..."
echo "=================================================="

# Check Wrangler is working
echo "📋 Wrangler Version:"
wrangler --version

echo ""
echo "📊 Current Deployments:"
wrangler deployments list | head -10

echo ""
echo "🌐 Active Workers:"  
wrangler list

echo ""
echo "💾 D1 Databases:"
wrangler d1 list

echo ""
echo "🗄️ KV Namespaces:"
wrangler kv:namespace list

echo ""
echo "📦 R2 Buckets:"
wrangler r2 bucket list

echo ""
echo "🔧 Account Info:"
wrangler whoami

echo ""
echo "📁 Project Structure Check:"
echo "Backend config exists: $([ -f backend/wrangler.toml ] && echo 'YES' || echo 'NO')"
echo "Rawgle Pure config exists: $([ -f rawgle-pure/wrangler.toml ] && echo 'YES' || echo 'NO')" 
echo "FindRawDogFood config exists: $([ -f findrawdogfood/wrangler.toml ] && echo 'YES' || echo 'NO')"

echo ""
echo "🚀 If deployments failed, check individual projects:"
echo "cd backend && wrangler deploy --env production --dry-run"
echo "cd rawgle-pure && wrangler deploy --env production --dry-run"
echo "cd findrawdogfood && wrangler deploy --env production --dry-run"
