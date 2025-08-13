#!/bin/bash

# Deploy Hunta Frontend to Cloudflare Pages
set -e

echo "🎨 Building and deploying Hunta frontend to Cloudflare Pages..."

FRONTEND_DIR="/Users/mattwright/pandora/gohunta.com/hunta/frontend"
cd "$FRONTEND_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building for production..."
NODE_ENV=production npm run build

# Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo "📁 Build output in: $FRONTEND_DIR/dist"

# Create Pages project using wrangler
echo "🚀 Creating Cloudflare Pages project..."

wrangler pages project create hunta-frontend --compatibility-date=2024-11-01 || echo "Project may already exist"

# Deploy to Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=hunta-frontend --compatibility-date=2024-11-01

echo ""
echo "🎉 HUNTA FRONTEND DEPLOYED!"
echo "=========================================="
echo "📱 Frontend: Available on Cloudflare Pages"
echo "🔗 Backend:  https://hunta-backend-prod.findrawdogfood.workers.dev"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Configure custom domain gohunta.com in Cloudflare Pages dashboard"
echo "2. Set up DNS records for gohunta.com"
echo "3. Enable SSL certificate"
echo "4. Test the complete system"

EOF