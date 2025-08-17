#!/bin/bash

# SiteReviverAI Enhanced Test - Dual Design System
echo "🤖 SiteReviverAI Enhanced - Starting Test with Real Website"
echo "Email will be sent to: tenshimatt@gmail.com (or specify different)"
echo "=========================================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Check if we're in the right directory
if [ ! -f "sitereviver.py" ]; then
    echo "❌ Error: sitereviver.py not found. Make sure you're in the correct directory."
    exit 1
fi

echo "✅ Found SiteReviverAI files"

# Make the test script executable
chmod +x test_enhanced.py

# Run the enhanced test
echo "🚀 Running enhanced dual design test..."
echo ""

python3 test_enhanced.py

echo ""
echo "🎯 Test completed!"
echo ""
echo "📋 What just happened:"
echo "   • Analyzed a real website from your database"
echo "   • Generated 2 distinct design options"
echo "   • Created side-by-side comparison email"
echo "   • Generated science-backed design appendix"
echo "   • Simulated professional email delivery"
echo ""
echo "🔄 Next steps:"
echo "   1. Review the email preview above"
echo "   2. Check the dual design approach"
echo "   3. Examine the science appendix concept"
echo "   4. Consider any adjustments needed"
echo ""
echo "💡 To run full automation:"
echo "   python3 sitereviver.py"
echo ""
echo "✨ Enhanced SiteReviverAI is ready for production!"
