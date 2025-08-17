#!/bin/bash

echo "🔍 Debugging Database Structure"
echo "==============================="

echo "📋 1. Checking all tables..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

echo ""
echo "📋 2. Checking if suppliers table exists..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total FROM suppliers" 2>/dev/null || echo "suppliers table not found"

echo ""
echo "📋 3. Checking if suppliers_complete table exists..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total FROM suppliers_complete" 2>/dev/null || echo "suppliers_complete table not found"

echo ""
echo "📋 4. If suppliers table exists, show structure..."
npx wrangler d1 execute findrawdogfood-db --remote --command="PRAGMA table_info(suppliers)" 2>/dev/null || echo "No suppliers table"

echo ""
echo "📋 5. If suppliers_complete table exists, show structure..."
npx wrangler d1 execute findrawdogfood-db --remote --command="PRAGMA table_info(suppliers_complete)" 2>/dev/null || echo "No suppliers_complete table"

echo ""
echo "📋 6. Show sample of any existing data..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name, city FROM suppliers LIMIT 5" 2>/dev/null || echo "No data in suppliers"
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name, city FROM suppliers_complete LIMIT 5" 2>/dev/null || echo "No data in suppliers_complete"
