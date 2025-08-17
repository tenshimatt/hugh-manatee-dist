#!/bin/bash

echo "🚀 Optimal importing data to D1 Remote database..."

# Count optimal batch files
batch_count=$(ls scripts/optimal_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "No optimal batch files found. Run ./scripts/create-optimal-import.sh first"
    exit 1
fi

echo "Found $batch_count batch files (100 records each)"
echo "Estimated time: $batch_count seconds"
echo "Starting import..."

start_time=$(date +%s)

# Import each batch with 1-second delays
for i in $(seq 1 $batch_count); do
    batch_file="scripts/optimal_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        # Progress indicator
        progress=$((i * 100 / batch_count))
        echo "[$elapsed s] [$progress%] Batch $i/$batch_count..."
        
        npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file" >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Batch $i imported"
        else
            echo "❌ Error importing batch $i (continuing...)"
        fi
        
        # 1-second delay
        sleep 1
    fi
done

end_time=$(date +%s)
total_time=$((end_time - start_time))

echo ""
echo "🎉 Import completed in $total_time seconds!"

# Verify import
echo "Verifying data..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"

# Show sample data
echo "Sample suppliers:"
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT name, city, state, rating FROM suppliers WHERE rating > 4.0 LIMIT 3;"

echo ""
echo "Remote database ready! 🚀"
echo "Test API: curl https://findrawdogfood.findrawdogfood.workers.dev/api/stats"
