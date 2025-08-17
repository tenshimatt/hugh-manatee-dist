#!/bin/bash
# Deploy all Cloudflare Workers - Architect-GPT Auto-Deploy

echo "🚀 Deploying All Cloudflare Workers..."

# Backend API
echo "📡 Deploying Backend API..."
cd backend && npx wrangler deploy --env production && cd ..

# Hunta v2 Backend
echo "🎯 Deploying Hunta v2 Backend..."
cd hunta-v2/backend && npx wrangler deploy --env production && cd ../..

# Rawgle Platform
echo "🔍 Deploying Rawgle Platform..."
cd rawgle-pure && npx wrangler deploy --env production && cd ..

echo "✅ All deployments complete!"
echo "📊 Check status: npx wrangler deployments list"
