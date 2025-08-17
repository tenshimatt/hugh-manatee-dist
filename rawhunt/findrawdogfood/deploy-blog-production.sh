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
    echo ""
    echo "📝 Blog Features Deployed:"
    echo "   ✅ Your complete BARF diet article"
    echo "   ✅ Professional blog layout"
    echo "   ✅ Author bio with 13 years experience"
    echo "   ✅ SEO optimized blog post"
    echo "   ✅ Related tools sidebar"
    echo "   ✅ Mobile responsive design"
    echo "   ✅ Social sharing ready"
    echo ""
    echo "🔗 Direct Links to Test:"
    echo "   Blog Post: https://www.findrawdogfood.com/blog/the-raw-truth-why-dogs-thrive-on-barf-diet"
    echo "   API Stats: https://www.findrawdogfood.com/api/stats"
    echo "   Search Test: https://www.findrawdogfood.com/api/search?city=Austin&state=TX"
    echo ""
    echo "📊 Your blog post includes:"
    echo "   • Complete BARF diet explanation"
    echo "   • Benefits from 13 years experience"  
    echo "   • Safety guidelines"
    echo "   • Age recommendations"
    echo "   • Ingredient breakdowns"
    echo "   • Call-to-action to find suppliers"
    echo ""
else
    echo "❌ Deployment failed"
    echo "Restoring original index.js..."
    cp src/backup-index.js src/index.js
    exit 1
fi

echo "🎯 Next Steps:"
echo "1. Test your blog post at the URL above"
echo "2. Share the article to drive traffic"
echo "3. Add more blog posts using the same format"
echo "4. Monitor analytics for engagement"
echo ""
echo "💡 To add more blog posts:"
echo "   • Create new function like getBlogPostBarfDiet()"
echo "   • Add route in main fetch handler"
echo "   • Update blog page with new post preview"
echo "   • Redeploy with ./deploy-blog-production.sh"
