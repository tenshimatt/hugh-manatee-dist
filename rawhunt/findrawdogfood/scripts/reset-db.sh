#!/bin/bash

echo "Checking current database schema..."

# Check existing tables and schema
npx wrangler d1 execute findrawdogfood-db --command="SELECT name FROM sqlite_master WHERE type='table';"

echo "Getting suppliers table schema..."
npx wrangler d1 execute findrawdogfood-db --command="PRAGMA table_info(suppliers);"

echo "Dropping existing tables to start fresh..."
npx wrangler d1 execute findrawdogfood-db --command="DROP TABLE IF EXISTS suppliers;"
npx wrangler d1 execute findrawdogfood-db --command="DROP TABLE IF EXISTS searches;"
npx wrangler d1 execute findrawdogfood-db --command="DROP TABLE IF EXISTS affiliate_clicks;"

echo "Applying fresh schema..."
npx wrangler d1 execute findrawdogfood-db --file=./scripts/schema.sql

echo "Verifying new schema..."
npx wrangler d1 execute findrawdogfood-db --command="PRAGMA table_info(suppliers);"
