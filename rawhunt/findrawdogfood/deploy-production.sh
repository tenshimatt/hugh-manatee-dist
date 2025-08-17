#!/bin/bash

echo "🚀 Deploying FindRawDogFood to production domain..."

# Copy API handlers from existing index.js
echo "📋 Copying API handlers..."
cp src/index.js src/backup-index.js

# Update main file to production version
cp src/production-index.js src/index.js

# Deploy to production with custom domain
echo "🌐 Deploying to production (findrawdogfood.com)..."
npx wrangler deploy --config wrangler-production.toml --env production

deployment_result=$?

if [ $deployment_result -eq 0 ]; then
    echo "✅ Production deployment successful!"
    echo ""
    echo "🌍 Your website is now live at:"
    echo "   • https://www.findrawdogfood.com"
    echo "   • https://findrawdogfood.com"
    echo ""
    echo "🧪 Test your production site:"
    echo "   • Homepage: https://www.findrawdogfood.com"
    echo "   • API Stats: https://www.findrawdogfood.com/api/stats"
    echo "   • Search: https://www.findrawdogfood.com/api/search?city=Austin&state=TX"
    echo ""
    echo "📝 Features deployed:"
    echo "   ✅ Customer-friendly homepage with your welcome text"
    echo "   ✅ Interactive supplier search"
    echo "   ✅ Live database stats"
    echo "   ✅ Blog structure ready"
    echo "   ✅ Mobile responsive design"
    echo "   ✅ SEO optimized"
    echo ""
else
    echo "❌ Deployment failed"
    echo "Restoring original index.js..."
    cp src/backup-index.js src/index.js
    exit 1
fi

echo "🔧 DNS Configuration Check:"
echo "Make sure your domain DNS is configured:"
echo "1. Go to Cloudflare Dashboard"
echo "2. Add findrawdogfood.com to Cloudflare"
echo "3. Set nameservers with your domain registrar"
echo "4. Add A/CNAME records pointing to Workers"
echo ""
echo "📞 If you need help with DNS setup, let me know!"
