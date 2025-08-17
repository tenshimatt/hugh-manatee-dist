#!/bin/bash

echo "🌐 Importing data to D1 Remote database..."

# Count D1 batch files
batch_count=$(ls scripts/d1_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "No D1 batch files found. Run ./scripts/create-d1-import.sh first"
    exit 1
fi

echo "Found $batch_count batch files to import"

# Import each batch with longer delays for D1 remote
for i in $(seq 1 $batch_count); do
    batch_file="scripts/d1_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        echo "Importing batch $i of $batch_count..."
        npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Batch $i imported successfully"
        else
            echo "❌ Error importing batch $i"
            echo "Continuing with next batch..."
        fi
        
        # Longer delay for D1 remote to avoid rate limits
        echo "Waiting 5 seconds before next batch..."
        sleep 5
    fi
done

echo "🎉 Import process completed!"

# Verify import
echo "Verifying data..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name, city, state, rating FROM suppliers LIMIT 5;"

echo "Remote database import complete! 🚀"
