#!/bin/bash

# Get Server Logs for Debugging

echo "🔍 Rawgle Server Logs Collection"
echo "================================"
echo ""

echo "📊 Collecting server-side debugging information..."
echo ""

# 1. Test live API endpoints
echo "1️⃣ TESTING LIVE API ENDPOINTS:"
echo "------------------------------"

echo "Health check:"
curl -s https://rawgle-api.findrawdogfood.workers.dev/api/health | jq '.' 2>/dev/null || curl -s https://rawgle-api.findrawdogfood.workers.dev/api/health

echo ""
echo "Dashboard API (with admin token):"
curl -s -H "X-Admin-Token: rawgle-admin-2025" https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard | jq '.' 2>/dev/null || curl -s -H "X-Admin-Token: rawgle-admin-2025" https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard

echo ""
echo "CORS test:"
curl -s -H "Origin: http://localhost:8080" -X OPTIONS https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard -I

echo ""
echo ""

# 2. Check Cloudflare Workers logs
echo "2️⃣ CLOUDFLARE WORKERS LOGS:"
echo "---------------------------"
echo "Getting recent logs from Cloudflare Workers..."

wrangler tail --format=pretty 2>/dev/null || echo "❌ Cannot access Cloudflare logs (wrangler tail not available)"

echo ""
echo ""

# 3. Test database connectivity
echo "3️⃣ DATABASE CONNECTIVITY TEST:"
echo "------------------------------"

echo "Testing D1 database health:"
curl -s https://rawgle-api.findrawdogfood.workers.dev/api/health/db | jq '.' 2>/dev/null || curl -s https://rawgle-api.findrawdogfood.workers.dev/api/health/db

echo ""
echo ""

# 4. Environment check
echo "4️⃣ ENVIRONMENT STATUS:"
echo "----------------------"

echo "Current environment variables:"
echo "CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:-'Not set'}"
echo "CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:0:10}... (${#CLOUDFLARE_API_TOKEN} chars)"
echo ""

echo "Wrangler authentication:"
wrangler whoami 2>/dev/null || echo "❌ Wrangler not authenticated"

echo ""
echo ""

# 5. Check secret status
echo "5️⃣ SECRETS STATUS:"
echo "------------------"
echo "Checking if secrets are properly deployed..."

wrangler secret list 2>/dev/null || echo "❌ Cannot list secrets"

echo ""
echo ""

echo "📋 DEBUG INFORMATION COLLECTED"
echo "=============================="
echo ""
echo "🔧 NEXT STEPS FOR USER:"
echo "1. Run this command and share the output"
echo "2. Open browser DevTools (F12)"
echo "3. Go to Network tab"
echo "4. Try loading the dashboard"
echo "5. Share any failed network requests"
echo ""
echo "🌐 If dashboard still fails, also run in browser console:"
echo "   Copy and paste contents of: debug-dashboard.js"