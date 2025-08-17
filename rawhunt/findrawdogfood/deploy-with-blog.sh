#!/bin/bash

echo "🚀 Deploying FindRawDogFood with blog content to production..."

# Backup current file
cp src/index.js src/backup-index.js

# Update to version with your blog post
cp src/production-index-with-blog.js src/index.js

# Deploy to production
echo "🌐 Deploying to production (findrawdogfood.com)..."
npx wrangler deploy --config wrangler-production.toml --env production

deployment_result=$?

if [ $deployment_result -eq 0 ]; then
    echo "✅ Production deployment successful!"
    echo ""
    echo "🌍 Your website is now live with blog content:"
    echo "   • Homepage: https://www.findrawdogfood.com"
    echo "   • Blog: https://www.findrawdogfood.com/blog"
    echo "   • BARF Article: https://www.findrawdogfood.com/blog/the-raw-truth-why-dogs-thrive-on-barf-diet"
    echo "   • Search: https://www.findrawdogfood.com/search"
    echo "   • API: https://www.findrawdogfood.com/api/stats"
    echo ""
    echo "📝 Blog Features Deployed:"
    echo "   ✅ Your complete BARF diet article"
    echo "   ✅ Professional blog layout with sidebar"
    echo "   ✅ Author bio with 13 years experience"
    echo "   ✅ Related tools and supplier search integration"
    echo "   ✅ SEO optimized with meta tags"
    echo "   ✅ Mobile responsive design"
    echo ""
    echo "🎯 Content Added:"
    echo "   ✅ 'The Raw Truth: Why Dogs Thrive on a BARF Diet'"
    echo "   ✅ Complete article with your exact text"
    echo "   ✅ Coming soon posts listed"
    echo "   ✅ Newsletter signup form"
    echo "   ✅ Cross-links to supplier search"
    echo ""
    echo "📊 Blog Structure:"
    echo "   • /blog - Main blog page"
    echo "   • /blog/the-raw-truth-why-dogs-thrive-on-barf-diet - Your article"
    echo "   • Ready for more posts (just add new functions)"
    echo ""
else
    echo "❌ Deployment failed"
    echo "Restoring original index.js..."
    cp src/backup-index.js src/index.js
    exit 1
fi

echo "🔧 Domain Configuration:"
echo "Make sure your DNS points www.findrawdogfood.com to Cloudflare Workers"
echo ""
echo "🎉 Your professional raw dog food website with blog is now live!"
echo "🔍 Test your blog at: https://www.findrawdogfood.com/blog"
