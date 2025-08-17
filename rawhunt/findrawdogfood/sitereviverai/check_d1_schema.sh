#!/bin/bash

echo "🔍 Checking D1 Database Schema and Sample Data"
echo "=============================================="

cd /Users/mattwright/pandora/findrawdogfood

# Check table schema
echo "📊 Getting suppliers table schema..."
wrangler d1 execute findrawdogfood-db --command "PRAGMA table_info(suppliers);"

echo ""
echo "📋 Getting sample data to see column names..."
wrangler d1 execute findrawdogfood-db --command "SELECT * FROM suppliers LIMIT 3;"

echo ""
echo "🌐 Looking for any website-related columns..."
wrangler d1 execute findrawdogfood-db --command "SELECT * FROM suppliers WHERE (website IS NOT NULL OR url IS NOT NULL OR web IS NOT NULL) LIMIT 5;" 2>/dev/null

echo ""
echo "🔍 Checking all column names that might contain website data..."
wrangler d1 execute findrawdogfood-db --command "SELECT * FROM suppliers LIMIT 1;" | head -1
