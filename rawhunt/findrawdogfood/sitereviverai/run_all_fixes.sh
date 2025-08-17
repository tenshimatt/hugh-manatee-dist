#!/bin/bash

echo "🚀 RUNNING ALL FIXES - FindRawDogFood Production Test"
echo "======================================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai
source venv/bin/activate

echo "🔧 Fix 1: Testing D1 Connection..."
cd /Users/mattwright/pandora/findrawdogfood
wrangler d1 execute findrawdogfood-db --command "SELECT COUNT(*) as total FROM suppliers WHERE website IS NOT NULL LIMIT 1;"

echo ""
echo "🔧 Fix 2: Running Simple Working Test..."
cd /Users/mattwright/pandora/findrawdogfood/sitereviverai
python3 simple_working_test.py

echo ""
echo "🔧 Fix 3: Running Fixed Production Test..."
python3 fixed_production_test.py

echo ""
echo "✅ ALL FIXES COMPLETE!"
echo "📊 View final results:"
echo "sqlite3 batch_analysis_results.db \"SELECT business_name, analysis_score, business_potential FROM analysis_results WHERE status='completed' ORDER BY analysis_score DESC;\""
