#!/bin/bash

echo "🚀 Fast importing data to D1 Remote database..."

# Count fast batch files
batch_count=$(ls scripts/fast_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "No fast batch files found. Run ./scripts/create-fast-import.sh first"
    exit 1
fi

echo "Found $batch_count batch files (1000 records each)"
echo "Estimated time: $((batch_count * 2)) seconds"

start_time=$(date +%s)

# Import each batch with minimal delays
for i in $(seq 1 $batch_count); do
    batch_file="scripts/fast_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        echo "[$elapsed s] Importing batch $i of $batch_count (1000 records)..."
        
        npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Batch $i imported successfully"
        else
            echo "❌ Error importing batch $i"
            echo "Continuing with next batch..."
        fi
        
        # Minimal delay to avoid overwhelming D1
        sleep 2
    fi
done

end_time=$(date +%s)
total_time=$((end_time - start_time))

echo "🎉 Fast import completed in $total_time seconds!"

# Verify import
echo "Verifying data..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name, city, state, rating FROM suppliers ORDER BY rating DESC LIMIT 5;"

echo "Remote database ready! 🚀"
