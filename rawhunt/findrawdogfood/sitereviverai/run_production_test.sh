#!/bin/bash

echo "🚀 FindRawDogFood - Production Database Test"
echo "============================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Activate virtual environment
source venv/bin/activate

# Check production database first
echo "🔍 Analyzing production database structure..."
python3 check_production_db.py

echo ""
echo "🧪 Running production test with 3 real suppliers..."
echo "This will analyze actual websites from your database..."

# Run production test
python3 production_test.py

echo ""
echo "📊 View Production Results:"
echo "sqlite3 batch_analysis_results.db \"SELECT business_name, website_url, analysis_score, business_potential FROM analysis_results ORDER BY analysis_score DESC;\""

echo ""
echo "📧 View Generated Outreach Emails:"
echo "sqlite3 batch_analysis_results.db \"SELECT business_name, substr(outreach_email, 1, 300) || '...' FROM analysis_results WHERE status='completed' ORDER BY analysis_score DESC;\""
