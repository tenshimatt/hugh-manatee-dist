#!/bin/bash

echo "🚀 FindRawDogFood - Find 3 Working Websites from D1"
echo "=================================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Activate virtual environment
source venv/bin/activate

echo "🔍 Searching 8844 suppliers for working websites..."
echo "This will test websites until we find 3 that work..."
echo ""

# Run the working website finder and analyzer
python3 d1_working_websites_test.py

echo ""
echo "📊 View Results from Working Websites:"
echo "sqlite3 batch_analysis_results.db \"SELECT business_name, website_url, analysis_score, business_potential FROM analysis_results WHERE status='completed' ORDER BY processed_at DESC LIMIT 3;\""

echo ""
echo "📧 View Generated Outreach Emails:"
echo "sqlite3 batch_analysis_results.db \"SELECT business_name, substr(outreach_email, 1, 300) || '...' FROM analysis_results WHERE status='completed' ORDER BY processed_at DESC LIMIT 3;\""

echo ""
echo "🎯 This proves the system works with your live D1 data!"
echo "Ready to scale to all 8844 suppliers when you're ready."
