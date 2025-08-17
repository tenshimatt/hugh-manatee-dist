#!/bin/bash

echo "=== Wrangler Update & Database Reset ==="

# Update Wrangler
echo "Updating Wrangler..."
npm install -g wrangler@latest

# Delete existing database to start fresh
echo "Deleting existing database..."
npx wrangler d1 delete findrawdogfood-db --force

# Create new database
echo "Creating new database..."
npx wrangler d1 create findrawdogfood-db

# Get the new database ID
echo "Getting database ID..."
DB_ID=$(npx wrangler d1 list | grep "findrawdogfood-db" | awk '{print $2}')
echo "Database ID: $DB_ID"

# Update wrangler.toml
echo "Updating wrangler.toml..."
sed -i '' "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml

# Apply schema to remote database
echo "Applying schema to REMOTE database..."
npx wrangler d1 execute findrawdogfood-db --remote --file=./scripts/schema.sql

echo "=== Database setup complete! ==="
echo "Next: Run import script to load CSV data"
