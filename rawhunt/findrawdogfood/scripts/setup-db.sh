#!/bin/bash

# Get database ID from Wrangler
echo "Getting database ID..."
DB_ID=$(wrangler d1 list | grep "findrawdogfood-db" | awk '{print $2}')

if [ -z "$DB_ID" ]; then
    echo "Error: Database not found. Creating new database..."
    wrangler d1 create findrawdogfood-db
    DB_ID=$(wrangler d1 list | grep "findrawdogfood-db" | awk '{print $2}')
fi

echo "Database ID: $DB_ID"

# Update wrangler.toml with the correct database ID
sed -i '' "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml

echo "Updated wrangler.toml with database ID"

# Apply schema
echo "Applying database schema..."
wrangler d1 execute findrawdogfood-db --file=./scripts/schema.sql

echo "Database setup complete!"
