#!/bin/bash

echo "🚀 FINDRAWDOGFOOD PRODUCTION SYSTEM STARTUP"
echo "=========================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Activate virtual environment
source venv/bin/activate

# Install additional dependencies for Flask dashboard
pip install flask > /dev/null 2>&1

echo "✅ Environment ready"
echo ""

echo "📋 PRODUCTION WORKFLOW URLS:"
echo "=============================="
echo "📊 Approval Dashboard:    http://localhost:5001"
echo "📈 Campaign Stats:        http://localhost:5001/campaign-stats" 
echo "📄 Export Approved:       http://localhost:5001/export-approved"
echo ""

echo "🔧 AVAILABLE COMMANDS:"
echo "======================"
echo "1. 📦 Run Single Batch Analysis (20 suppliers):"
echo "   python3 production_batch_analyzer.py --batch-size 20"
echo ""
echo "2. 🔄 Run Continuous Analysis (auto-batch every 5 mins):"
echo "   python3 production_batch_analyzer.py --continuous"
echo ""
echo "3. 📊 Start Approval Dashboard:"
echo "   python3 approval_dashboard.py"
echo ""
echo "4. 🧪 Test System:"
echo "   python3 simple_working_test.py"
echo ""

echo "🎯 RECOMMENDED STARTUP SEQUENCE:"
echo "================================"
echo "TERMINAL 1: Start approval dashboard"
echo "python3 approval_dashboard.py"
echo ""
echo "TERMINAL 2: Run batch analysis" 
echo "python3 production_batch_analyzer.py --batch-size 20"
echo ""

echo "📖 For complete workflow documentation:"
echo "cat PRODUCTION_WORKFLOW.md"
echo ""

# Check if user wants to start dashboard immediately
read -p "🚀 Start approval dashboard now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🌐 Starting approval dashboard at http://localhost:5001..."
    python3 approval_dashboard.py
fi
