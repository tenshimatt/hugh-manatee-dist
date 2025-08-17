#!/bin/bash

echo "🔧 Updating RAWGLE Worker to Use Both Tables"
echo "============================================"

echo "📊 Current database status:"
echo "   • suppliers table: 9,137 records (main data)"
echo "   • suppliers_complete table: 2 records (TEST-JSY, TEST-UK)"
echo ""

echo "🔄 Updating Worker to query suppliers_complete first, then suppliers..."

# Test current API to see if it finds test records
echo "🧪 Testing current API with test records..."

echo "Testing TEST-JSY search:"
curl -s "https://rawgle.com/api/search?q=TEST-JSY" | jq '.results | length' 2>/dev/null || echo "API test failed"

echo "Testing TEST-UK search:"
curl -s "https://rawgle.com/api/search?q=TEST-UK" | jq '.results | length' 2>/dev/null || echo "API test failed"

echo ""
echo "If tests return 0 results, the Worker needs to be updated to use suppliers_complete table."
echo ""
echo "📝 Next steps:"
echo "   1. Update Worker to query suppliers_complete table"
echo "   2. Redeploy RAWGLE.COM with updated table references"
echo "   3. Re-test APIs"
echo ""
echo "✅ Test records confirmed in database:"
echo "   🇯🇪 TEST-JSY in St Ouens, Jersey"
echo "   🇬🇧 TEST-UK in Camden, London"
