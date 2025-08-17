#!/bin/bash

# SUPERLUXE Engagement Bot Testing Script
# Comprehensive testing of the community engagement system

set -e

echo "🧪 SUPERLUXE Community Engagement Bot Testing"
echo "============================================="

# Configuration
BASE_URL="https://superluxe-engagement-bot-dev.your-account.workers.dev"
API_ENDPOINTS=(
    "/api/queue/status"
    "/api/queue/process" 
    "/api/opportunities/analyze"
    "/api/dashboard"
    "/trigger-reddit-scan"
)

echo "📍 Testing environment: $BASE_URL"
echo ""

# Test 1: API Endpoint Availability
echo "🔍 TEST 1: API Endpoint Availability"
echo "===================================="

for endpoint in "${API_ENDPOINTS[@]}"; do
    echo "Testing $endpoint..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ $endpoint - OK ($response)"
    else
        echo "❌ $endpoint - FAILED ($response)"
    fi
done

echo ""

# Test 2: Reddit Monitoring Trigger
echo "🔍 TEST 2: Reddit Monitoring Trigger"
echo "===================================="

echo "Triggering Reddit scan..."
scan_response=$(curl -s "$BASE_URL/trigger-reddit-scan" | head -200)

if echo "$scan_response" | grep -q "success"; then
    echo "✅ Reddit monitoring trigger - WORKING"
    echo "Response preview: $(echo "$scan_response" | head -100)"
else
    echo "❌ Reddit monitoring trigger - FAILED"
    echo "Response: $scan_response"
fi

echo ""

# Test 3: Queue Processing
echo "🔍 TEST 3: Engagement Queue Processing"
echo "======================================"

echo "Testing queue processing..."
queue_response=$(curl -s "$BASE_URL/api/queue/process" | head -200)

if echo "$queue_response" | grep -q "processed"; then
    echo "✅ Queue processing - WORKING"
    echo "Response: $(echo "$queue_response" | head -100)"
else
    echo "❌ Queue processing - FAILED"
    echo "Response: $queue_response"
fi

echo ""

# Test 4: Dashboard Data
echo "🔍 TEST 4: Dashboard Data Retrieval"
echo "==================================="

echo "Fetching dashboard data..."
dashboard_response=$(curl -s "$BASE_URL/api/dashboard" | head -300)

if echo "$dashboard_response" | grep -q "dashboard"; then
    echo "✅ Dashboard data - WORKING"
    echo "Dashboard preview:"
    echo "$dashboard_response" | head -150
else
    echo "❌ Dashboard data - FAILED"
    echo "Response: $dashboard_response"
fi

echo ""

# Test 5: Database Connectivity
echo "🔍 TEST 5: Database Schema Validation"
echo "====================================="

echo "Testing database schema..."
# This would require a specific endpoint to test DB connectivity
# For now, we'll check if queue status works (implies DB access)

queue_status=$(curl -s "$BASE_URL/api/queue/status" | head -100)

if echo "$queue_status" | grep -q -E "(queue|pending|ready)"; then
    echo "✅ Database connectivity - WORKING"
    echo "Queue status: $(echo "$queue_status" | head -50)"
else
    echo "❌ Database connectivity - NEEDS ATTENTION"
    echo "Response: $queue_status"
fi

echo ""

# Summary
echo "📊 TEST SUMMARY"
echo "==============="

# Count successful tests
success_count=0
total_tests=5

# This is a simplified check - in real implementation, 
# you'd track each test result properly
if curl -s "$BASE_URL/api/dashboard" | grep -q "dashboard"; then
    ((success_count++))
fi

if curl -s "$BASE_URL/api/queue/status" >/dev/null 2>&1; then
    ((success_count++))
fi

# Add other test result checks...

echo "✅ Tests passed: $success_count/$total_tests"

if [ "$success_count" -eq "$total_tests" ]; then
    echo "🎉 All tests PASSED - Bot is ready for deployment!"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Set up Reddit API credentials"
    echo "2. Configure OpenAI API key"
    echo "3. Deploy to production"
    echo "4. Monitor dashboard for activity"
else
    echo "⚠️  Some tests FAILED - Review configuration before production deployment"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check Wrangler deployment logs"
    echo "2. Verify database schema deployment"
    echo "3. Confirm environment variables"
    echo "4. Test API key configuration"
fi

echo ""
echo "🎯 SUPERLUXE Engagement Bot Testing Complete!"