#!/bin/bash

echo "🔧 Adding Website Column to D1 Database"
echo "======================================="

cd /Users/mattwright/pandora/findrawdogfood

# Add website column to suppliers table
echo "📊 Adding website column to suppliers table..."
wrangler d1 execute findrawdogfood-db --command "ALTER TABLE suppliers ADD COLUMN website TEXT;"

# Add some sample website data for testing
echo "🌐 Adding sample website data for testing..."

# Get a few supplier IDs and add test websites
wrangler d1 execute findrawdogfood-db --command "
UPDATE suppliers 
SET website = 'https://petsupplieschicago.com' 
WHERE id = 1;
"

wrangler d1 execute findrawdogfood-db --command "
UPDATE suppliers 
SET website = 'https://petfooddirect.com' 
WHERE id = 2;
"

wrangler d1 execute findrawdogfood-db --command "
UPDATE suppliers 
SET website = 'https://rawfeedingmiami.com' 
WHERE id = 3;
"

# Check the results
echo "✅ Checking updated suppliers with websites:"
wrangler d1 execute findrawdogfood-db --command "SELECT id, name, website FROM suppliers WHERE website IS NOT NULL LIMIT 5;"

echo ""
echo "🎯 Ready to run analysis test!"
