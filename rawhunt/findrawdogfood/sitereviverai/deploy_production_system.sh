#!/bin/bash
# FindRawDogFood - Complete Production System Deployment
# Focus: Website modernization opportunities for pet businesses

echo "🚀 FINDRAWDOGFOOD PRODUCTION SYSTEM DEPLOYMENT"
echo "============================================================"
echo "Focus: Website modernization opportunities for pet businesses"
echo ""

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📚 Installing requirements..."
pip install flask openai aiohttp python-dotenv sqlite3

# Check OpenAI API key
echo "🔑 Checking OpenAI API configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OpenAI API key configured"
    else
        echo "❌ OpenAI API key missing in .env file"
        exit 1
    fi
else
    echo "❌ .env file missing - create from .env.example"
    exit 1
fi

echo ""
echo "🎯 PRODUCTION SYSTEM READY!"
echo "============================================================"
echo ""
echo "STEP 1: Run Modernization Analysis"
echo "   python3 fixed_scoring_system.py"
echo ""
echo "STEP 2: Start Approval Dashboard"
echo "   python3 fixed_approval_dashboard.py"
echo ""
echo "STEP 3: Access Dashboard"
echo "   http://localhost:5001"
echo ""
echo "============================================================"
echo ""

# Ask user what to run
echo "What would you like to do?"
echo "1) Run modernization analysis on 3 real suppliers"
echo "2) Start approval dashboard"
echo "3) Both (analysis then dashboard)"
echo "4) Exit"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔍 Running modernization analysis..."
        python3 fixed_scoring_system.py
        ;;
    2)
        echo "📊 Starting approval dashboard..."
        python3 fixed_approval_dashboard.py
        ;;
    3)
        echo "🔍 Running analysis first..."
        python3 fixed_scoring_system.py
        echo ""
        echo "📊 Starting dashboard..."
        python3 fixed_approval_dashboard.py
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
