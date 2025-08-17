#!/bin/bash

# Check if --remote flag is passed
REMOTE_FLAG=""
if [ "$1" = "--remote" ]; then
    REMOTE_FLAG="--remote"
    echo "🌐 Importing to REMOTE database..."
else
    echo "💻 Importing to LOCAL database..."
fi

echo "Importing all batches to D1 database..."

# Count batch files
batch_count=$(ls scripts/import_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "No batch files found. Run ./scripts/create-import.sh first"
    exit 1
fi

echo "Found $batch_count batch files to import"

# Import each batch
for i in $(seq 1 $batch_count); do
    batch_file="scripts/import_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        echo "Importing batch $i of $batch_count..."
        npx wrangler d1 execute findrawdogfood-db $REMOTE_FLAG --file="$batch_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Batch $i imported successfully"
        else
            echo "❌ Error importing batch $i"
            exit 1
        fi
        
        # Longer delay for remote to avoid rate limits
        if [ "$REMOTE_FLAG" = "--remote" ]; then
            sleep 3
        else
            sleep 1
        fi
    fi
done

echo "🎉 All batches imported successfully!"

# Verify import
echo "Verifying data..."
npx wrangler d1 execute findrawdogfood-db $REMOTE_FLAG --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"
npx wrangler d1 execute findrawdogfood-db $REMOTE_FLAG --command="SELECT name, city, state, rating FROM suppliers LIMIT 5;"
