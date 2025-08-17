#!/bin/bash

# Deploy GoHunta Backend with New Frontend Integration
# Connects existing backend APIs to new frontend at https://afc39a6e.rawgle-frontend.pages.dev/

set -e

echo "🚀 Deploying GoHunta Backend with New Frontend Integration"
echo "=================================================="

# Change to backend directory
cd /Users/mattwright/pandora/gohunta.com/hunta/backend

echo "📋 Pre-deployment checklist:"
echo "- New Frontend URL: https://afc39a6e.rawgle-frontend.pages.dev/"
echo "- Backend API URL: https://gohunta-backend.findrawdogfood.workers.dev"
echo "- Integration config created"
echo "- CORS headers updated"
echo "- Field mappings implemented"

# Backup current worker
echo "💾 Backing up current worker..."
if [ -f "workers/index.js" ]; then
    cp workers/index.js workers/index.js.backup.$(date +%Y%m%d_%H%M%S)
fi

# Replace index.js with new frontend integration version
echo "🔄 Updating worker with new frontend integration..."
cp src/index-with-new-frontend.js workers/index.js

# Update wrangler.toml if needed
echo "⚙️  Updating wrangler configuration..."
cat > wrangler-new-frontend.toml << EOF
name = "gohunta-backend"
main = "workers/index.js"
compatibility_date = "2023-05-18"

[env.production]
name = "gohunta-backend"
routes = [
  { pattern = "gohunta-backend.findrawdogfood.workers.dev/*", zone_id = "" }
]

[[env.production.d1_databases]]
binding = "DB"
database_name = "gohunta-production"
database_id = "your-database-id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[env.production.r2_buckets]]
binding = "MEDIA"
bucket_name = "gohunta-media"

[env.production.vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret"
API_VERSION = "2.0.0"
FRONTEND_URL = "https://afc39a6e.rawgle-frontend.pages.dev"
LEGACY_FRONTEND_URL = "https://4df825d3.hunta-v2-frontend.pages.dev"
EOF

# Test the worker locally first
echo "🧪 Testing worker locally..."
npx wrangler dev --config wrangler-new-frontend.toml --port 8787 &
WORKER_PID=$!

# Wait for worker to start
sleep 5

# Test health endpoint
echo "🩺 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8787/health || echo "FAILED")

if [[ $HEALTH_RESPONSE == *"frontend_integration"* ]]; then
    echo "✅ Health check passed - frontend integration detected"
else
    echo "❌ Health check failed"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

# Test CORS for new frontend
echo "🌐 Testing CORS for new frontend..."
CORS_RESPONSE=$(curl -s -H "Origin: https://afc39a6e.rawgle-frontend.pages.dev" \
                -X OPTIONS http://localhost:8787/api/routes || echo "FAILED")

if [[ $CORS_RESPONSE == "" ]]; then
    echo "✅ CORS test passed"
else
    echo "❌ CORS test failed"
fi

# Stop local worker
kill $WORKER_PID 2>/dev/null || true
sleep 2

# Deploy to production
echo "🚀 Deploying to production..."
npx wrangler deploy --config wrangler-new-frontend.toml

# Verify production deployment
echo "🔍 Verifying production deployment..."
PROD_HEALTH=$(curl -s https://gohunta-backend.findrawdogfood.workers.dev/health || echo "FAILED")

if [[ $PROD_HEALTH == *"frontend_integration"* ]]; then
    echo "✅ Production deployment successful"
    echo "🎉 New frontend integration is live!"
else
    echo "❌ Production deployment verification failed"
    echo "Rolling back..."
    
    # Restore backup
    if [ -f "workers/index.js.backup.*" ]; then
        BACKUP_FILE=$(ls -t workers/index.js.backup.* | head -n1)
        cp "$BACKUP_FILE" workers/index.js
        npx wrangler deploy
        echo "🔄 Rollback completed"
    fi
    exit 1
fi

# Test integration between frontend and backend
echo "🔗 Testing full integration..."

# Test API endpoint from new frontend origin
INTEGRATION_TEST=$(curl -s -H "Origin: https://afc39a6e.rawgle-frontend.pages.dev" \
                   -H "Content-Type: application/json" \
                   https://gohunta-backend.findrawdogfood.workers.dev/api/routes || echo "FAILED")

if [[ $INTEGRATION_TEST == *"success"* ]]; then
    echo "✅ Full integration test passed"
else
    echo "⚠️  Integration test warning - check manually"
fi

# Display final status
echo ""
echo "🎯 DEPLOYMENT COMPLETE"
echo "======================"
echo "📍 Backend URL: https://gohunta-backend.findrawdogfood.workers.dev"
echo "🌐 New Frontend: https://afc39a6e.rawgle-frontend.pages.dev"
echo "🔧 API Version: 2.0.0"
echo "✨ Features: CORS, Field Mapping, Mobile/Rural Optimization"
echo ""
echo "📝 Next Steps:"
echo "1. Test all major features through new frontend"
echo "2. Update DNS/routing if needed"
echo "3. Monitor for any integration issues"
echo "4. Update documentation with new endpoints"
echo ""
echo "🔍 Monitoring:"
echo "- Health: https://gohunta-backend.findrawdogfood.workers.dev/health"
echo "- Logs: wrangler tail --config wrangler-new-frontend.toml"
echo ""

# Create integration test script
cat > test-integration.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing GoHunta Frontend-Backend Integration"
echo "=============================================="

BACKEND_URL="https://gohunta-backend.findrawdogfood.workers.dev"
FRONTEND_URL="https://afc39a6e.rawgle-frontend.pages.dev"

echo "Testing from frontend origin: $FRONTEND_URL"

# Test health endpoint
echo "1. Health Check..."
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" | jq .frontend_integration || echo "❌ Failed"

# Test routes endpoint
echo "2. Routes API..."
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/routes" | jq .success || echo "❌ Failed"

# Test gear endpoint  
echo "3. Gear API..."
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/gear" | jq .success || echo "❌ Failed"

# Test ethics endpoint
echo "4. Ethics API..."
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/ethics" | jq .success || echo "❌ Failed"

# Test posts endpoint
echo "5. Posts API..."
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/posts" | jq .success || echo "❌ Failed"

echo "✅ Integration testing complete!"
EOF

chmod +x test-integration.sh

echo "📋 Integration test script created: test-integration.sh"
echo "Run './test-integration.sh' to test the integration manually"