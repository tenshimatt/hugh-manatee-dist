#!/bin/bash

echo "🔧 Fixing remote database schema..."

# Check if table exists
echo "Checking current remote database state..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

echo "Dropping any existing tables..."
npx wrangler d1 execute findrawdogfood-db --remote --command="DROP TABLE IF EXISTS suppliers;" 2>/dev/null
npx wrangler d1 execute findrawdogfood-db --remote --command="DROP TABLE IF EXISTS searches;" 2>/dev/null  
npx wrangler d1 execute findrawdogfood-db --remote --command="DROP TABLE IF EXISTS affiliate_clicks;" 2>/dev/null

echo "Creating fresh schema..."
npx wrangler d1 execute findrawdogfood-db --remote --file=./scripts/d1-schema.sql

echo "Verifying table creation..."
npx wrangler d1 execute findrawdogfood-db --remote --command="PRAGMA table_info(suppliers);"

echo "Remote database schema fixed! ✅"
