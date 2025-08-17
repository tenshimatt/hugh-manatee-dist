#!/bin/bash

echo "🚀 FindRawDogFood - Cloudflare D1 Production Test"
echo "================================================="

cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

# Activate virtual environment
source venv/bin/activate

# Check we're in the right directory for wrangler commands
echo "📂 Working from: $(pwd)"
echo "🔍 Checking Cloudflare D1 connection..."

# Test D1 connection first
cd /Users/mattwright/pandora/findrawdogfood
echo "📡 Testing D1 database connection..."
wrangler d1 execute findrawdogfood-db --command "SELECT COUNT(*) as total_suppliers FROM suppliers;"

if [ $? -eq 0 ]; then
    echo "✅ D1 connection successful!"
    
    echo ""
    echo "🧪 Running production analysis on 3 real suppliers from D1..."
    cd /Users/mattwright/pandora/findrawdogfood/sitereviverai
    python3 d1_production_test.py
    
    echo ""
    echo "📊 View D1 Production Results:"
    echo "sqlite3 batch_analysis_results.db \"SELECT business_name, website_url, analysis_score, business_potential FROM analysis_results ORDER BY processed_at DESC LIMIT 3;\""
    
    echo ""
    echo "📧 View Generated Outreach Emails:"
    echo "sqlite3 batch_analysis_results.db \"SELECT business_name, substr(outreach_email, 1, 200) || '...' FROM analysis_results WHERE status='completed' ORDER BY processed_at DESC LIMIT 3;\""
    
else
    echo "❌ D1 connection failed. Make sure you're authenticated with Cloudflare:"
    echo "   wrangler auth login"
fi
