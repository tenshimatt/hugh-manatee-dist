#!/bin/bash

echo "🚀 RAWGLE.COM Backend Deployment"
echo "================================="

# Step 1: Backup current configuration
echo "📁 Backing up current configuration..."
cp wrangler.toml wrangler-backup-$(date +%Y%m%d-%H%M%S).toml 2>/dev/null || echo "No existing wrangler.toml found"

# Step 2: Use RAWGLE configuration
echo "🔧 Setting up RAWGLE.COM configuration..."
cp wrangler-rawgle.toml wrangler.toml

# Step 3: Test the worker locally (optional)
echo "🧪 Do you want to test the worker locally first? (y/n)"
read -r test_response

if [ "$test_response" = "y" ] || [ "$test_response" = "Y" ]; then
    echo "🔄 Starting local development server..."
    echo "Visit http://localhost:8787 to test"
    echo "Press Ctrl+C when ready to deploy to production"
    npx wrangler dev --env development
fi

echo ""
echo "🚀 Deploying RAWGLE.COM to production..."

# Step 4: Deploy to production
npx wrangler deploy --env production

echo ""
echo "✅ RAWGLE.COM Backend Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Your new primary domain: https://rawgle.com"
echo "🔄 Redirect domain: https://findrawdogfood.com → https://rawgle.com"
echo ""
echo "📊 API Endpoints Available:"
echo "   • https://rawgle.com/api/search?q=london"
echo "   • https://rawgle.com/api/nearby?lat=51.5&lng=-0.1"
echo "   • https://rawgle.com/api/stats"
echo "   • https://rawgle.com/api/supplier?id=xyz"
echo "   • https://rawgle.com/api/location"
echo ""
echo "🧪 Test Commands:"
echo "   curl https://rawgle.com/api/stats"
echo "   curl 'https://rawgle.com/api/search?q=london'"
echo "   curl https://findrawdogfood.com/ (should redirect)"
echo ""

# Step 5: Test the deployment
echo "🧪 Testing deployment..."

echo "Testing RAWGLE.COM stats API..."
curl -s https://rawgle.com/api/stats | jq . || echo "Stats API test failed"

echo ""
echo "Testing findrawdogfood.com redirect..."
curl -s -I https://findrawdogfood.com/ | grep -i location || echo "Redirect test - check manually"

echo ""
echo "Testing search with Jersey test data..."
curl -s "https://rawgle.com/api/search?q=TEST-JSY" | jq . || echo "Search test failed"

echo ""
echo "🎯 Backend Updates Complete:"
echo "   ✅ Primary domain: RAWGLE.COM"
echo "   ✅ 301 redirects: findrawdogfood.com → rawgle.com"
echo "   ✅ Updated branding throughout API responses"
echo "   ✅ Cloudflare geolocation API integrated"
echo "   ✅ Enhanced search and nearby APIs"
echo "   ✅ Complete supplier detail endpoints"
echo ""
echo "🎨 Ready for your new layout!"
echo "The backend is now optimized for RAWGLE.COM branding."
