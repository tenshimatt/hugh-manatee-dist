#!/bin/bash

echo "📊 FindRawDogFood Database Analysis"
echo "=================================="

# Check current database size
echo "🔍 Current database status:"
npx wrangler d1 execute findrawdogfood-db --remote --command="
SELECT 
    COUNT(*) as total_suppliers,
    COUNT(DISTINCT state) as states_covered,
    COUNT(DISTINCT city) as cities_covered,
    AVG(rating) as avg_rating,
    MAX(created_at) as last_added
FROM suppliers;"

echo ""
echo "📈 Growth analysis:"
npx wrangler d1 execute findrawdogfood-db --remote --command="
SELECT 
    DATE(created_at) as date,
    COUNT(*) as daily_additions
FROM suppliers 
WHERE created_at > datetime('now', '-7 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;"

echo ""
echo "🌎 Geographic distribution:"
npx wrangler d1 execute findrawdogfood-db --remote --command="
SELECT 
    state,
    COUNT(*) as supplier_count
FROM suppliers 
GROUP BY state 
ORDER BY supplier_count DESC 
LIMIT 10;"

echo ""
echo "💡 Recommendations:"
echo "• Current collection rate appears sustainable on free tier"
echo "• Geographic expansion should target states with <100 suppliers"
echo "• Consider quality over quantity - focus on verified, active businesses"
echo "• Monitor for diminishing returns in major cities"
