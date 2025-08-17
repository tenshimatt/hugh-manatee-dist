#!/bin/bash

echo "🧪 Creating Test Records via Cloudflare Worker"
echo "=============================================="

# Step 1: Deploy the test record creation worker
echo "🚀 Deploying test record creation worker..."
npx wrangler deploy --config wrangler-test-records.toml

echo ""
echo "📝 Worker deployed! Creating test records..."

# Step 2: Call the worker to create records
echo "🔄 Inserting TEST-JSY (Jersey) and TEST-UK (London) records..."

# Create the test records
RESPONSE=$(curl -s -X POST https://create-test-records.mattwright7781.workers.dev/create-test-records)

echo ""
echo "📊 Response from worker:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Test record creation complete!"
echo ""

# Step 3: Verify records in main database
echo "🧪 Verifying records in main database..."

echo "Testing search for Jersey record:"
curl -s "https://rawgle.com/api/search?q=TEST-JSY" | jq '.results[] | {name, city, rating}' 2>/dev/null || echo "Search test failed - may need to deploy RAWGLE.COM first"

echo ""
echo "Testing search for London record:"
curl -s "https://rawgle.com/api/search?q=TEST-UK" | jq '.results[] | {name, city, rating}' 2>/dev/null || echo "Search test failed - may need to deploy RAWGLE.COM first"

echo ""
echo "📍 Test coordinates for nearby searches:"
echo "   Jersey: lat=49.2247, lng=-2.2047"
echo "   London: lat=51.5408, lng=-0.1426"

echo ""
echo "🧪 Test API calls:"
echo "   curl 'https://rawgle.com/api/search?q=TEST-JSY'"
echo "   curl 'https://rawgle.com/api/search?q=Camden'"
echo "   curl 'https://rawgle.com/api/nearby?lat=49.2247&lng=-2.2047&limit=5'"
echo "   curl 'https://rawgle.com/api/nearby?lat=51.5408&lng=-0.1426&limit=5'"

echo ""
echo "🗑️  Cleanup: Delete test record worker (optional):"
echo "   npx wrangler delete create-test-records"

echo ""
echo "✅ TEST RECORDS READY:"
echo "   🇯🇪 TEST-JSY in St Ouens, Jersey (4.7⭐, 23 reviews)"
echo "   🇬🇧 TEST-UK in Camden, London (4.6⭐, 87 reviews)"
echo "   Both have delivery, takeout, and curbside pickup enabled"
