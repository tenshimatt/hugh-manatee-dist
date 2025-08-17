#!/bin/bash

echo "Deploying database schema and data to production..."

# Apply schema to remote database
echo "Creating tables in production database..."
npx wrangler d1 execute findrawdogfood-db --remote --file=./scripts/schema.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to create schema"
    exit 1
fi

echo "✅ Schema created successfully"

# Count batch files
batch_count=$(ls scripts/import_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "❌ No batch files found. Run ./scripts/create-import.sh first"
    exit 1
fi

echo "Importing $batch_count batches to production database..."

# Import each batch to remote database
for i in $(seq 1 $batch_count); do
    batch_file="scripts/import_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        echo "Importing batch $i of $batch_count to production..."
        npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Batch $i imported successfully"
        else
            echo "❌ Error importing batch $i to production"
            exit 1
        fi
        
        # Delay to avoid rate limits
        sleep 2
    fi
done

echo "🎉 Production database deployment complete!"

# Verify production data
echo "Verifying production database..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"
