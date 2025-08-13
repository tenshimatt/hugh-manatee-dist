#!/bin/bash

echo "🚀 Deploying Hunta v2 to Production"

# Build frontend
echo "📦 Building frontend..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npm run build

# Deploy backend to API subdomain
echo "🔧 Deploying backend API..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/backend
npx wrangler deploy --config wrangler-production.toml

# Deploy frontend to main domain
echo "🎨 Deploying frontend..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npx wrangler pages deploy dist --project-name hunta-v2-frontend

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://hunta-v2-frontend.pages.dev"
echo "🔗 Backend: https://hunta-v2-backend.findrawdogfood.workers.dev"
echo ""
echo "🎯 Complete Hunta v2 Platform is now live!"