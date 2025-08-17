#!/bin/bash
# 🧪 Architect-GPT: Post-Deployment Testing Suite

echo "🧪 Testing Deployed Cloudflare Workers..."
echo "========================================"

# Test functions
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo "Testing $name: $url"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "✅ $name: HTTP $http_code"
        echo "   Response: $(echo $body | head -c 100)..."
    else
        echo "❌ $name: HTTP $http_code (expected $expected_status)"
        echo "   Response: $body"
    fi
    echo ""
}

# Test all deployed workers
echo "🔍 Testing Backend API..."
test_endpoint "https://rawgle-backend-prod.findrawdogfood.workers.dev/" "Backend Root"
test_endpoint "https://rawgle-backend-prod.findrawdogfood.workers.dev/health" "Backend Health"
test_endpoint "https://rawgle-backend-prod.findrawdogfood.workers.dev/api" "Backend API Info"

echo "🔍 Testing Rawgle Pure Platform..."
test_endpoint "https://rawgle-api-production.findrawdogfood.workers.dev/" "Rawgle Pure Root"
test_endpoint "https://rawgle-api-production.findrawdogfood.workers.dev/health" "Rawgle Pure Health"

echo "🔍 Testing FindRawDogFood Platform..."
test_endpoint "https://rawgle-com-production.findrawdogfood.workers.dev/" "FindRawDogFood Root"

echo "🔍 Testing Additional Workers..."
test_endpoint "https://hunta-backend-prod.findrawdogfood.workers.dev/" "Hunta Backend" 200

echo "📊 Deployment Status Check..."
echo "=========================="
wrangler deployments list | head -20

echo ""
echo "🎯 All tests complete!"
echo "📝 Check logs with: wrangler tail --env production"
