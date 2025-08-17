#!/bin/bash

echo "🧪 Creating Test Records via Direct SQL"
echo "======================================="

# Check current table structure first
echo "📋 Checking existing table structure..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

echo ""
echo "🔍 Checking existing suppliers table..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total FROM suppliers" 2>/dev/null && TABLE_NAME="suppliers" || TABLE_NAME="suppliers_complete"

echo "Using table: $TABLE_NAME"

echo ""
echo "📝 Inserting Jersey test record (TEST-JSY)..."

# Insert Jersey record using the existing table structure
npx wrangler d1 execute findrawdogfood-db --remote --command="
INSERT OR IGNORE INTO $TABLE_NAME (
  id, place_id, name, address, city, state, country, 
  latitude, longitude, phone_number, website, rating, 
  user_ratings_total, keyword, created_at
) VALUES (
  'test-jersey-001',
  'test_place_id_jersey_001',
  'TEST-JSY',
  'La Route de St Ouens, St Ouens, Jersey JE3 2AB, UK',
  'St Ouens',
  'Jersey',
  'United Kingdom',
  49.2247,
  -2.2047,
  '+44 1534 123456',
  'https://test-jsy-rawfood.je',
  4.7,
  23,
  'raw dog food',
  '$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'
)"

echo ""
echo "📝 Inserting London test record (TEST-UK)..."

# Insert London record
npx wrangler d1 execute findrawdogfood-db --remote --command="
INSERT OR IGNORE INTO $TABLE_NAME (
  id, place_id, name, address, city, state, country,
  latitude, longitude, phone_number, website, rating,
  user_ratings_total, keyword, created_at  
) VALUES (
  'test-london-001',
  'test_place_id_london_001',
  'TEST-UK', 
  '123 Camden High Street, Camden, London NW1 7JR, UK',
  'London',
  'England', 
  'United Kingdom',
  51.5408,
  -0.1426,
  '+44 20 7123 4567',
  'https://test-uk-rawpetfood.co.uk',
  4.6,
  87,
  'raw dog food',
  '$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'
)"

echo ""
echo "✅ Records inserted! Verifying..."

# Verify the records were created
npx wrangler d1 execute findrawdogfood-db --remote --command="
SELECT name, city, state, latitude, longitude, rating, phone_number 
FROM $TABLE_NAME 
WHERE name IN ('TEST-JSY', 'TEST-UK')
ORDER BY name
"

echo ""
echo "📊 Total supplier count:"
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total FROM $TABLE_NAME"

echo ""
echo "🧪 Test your records:"
echo "   Search Jersey: https://rawgle.com/api/search?q=TEST-JSY"
echo "   Search London: https://rawgle.com/api/search?q=TEST-UK"
echo "   Nearby Jersey: https://rawgle.com/api/nearby?lat=49.2247&lng=-2.2047"
echo "   Nearby London: https://rawgle.com/api/nearby?lat=51.5408&lng=-0.1426"

echo ""
echo "✅ Test records created:"
echo "   🇯🇪 TEST-JSY in St Ouens, Jersey"
echo "   🇬🇧 TEST-UK in Camden, London"
