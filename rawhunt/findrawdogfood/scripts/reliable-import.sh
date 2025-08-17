#!/bin/bash

echo "🌐 Importing data to D1 Remote database (single-row method)..."
echo "This will take 15-20 minutes but is very reliable..."

# Count batch files from original method
batch_count=$(ls scripts/d1_batch_*.sql 2>/dev/null | wc -l)

if [ $batch_count -eq 0 ]; then
    echo "No single-row batch files found. Creating them now..."
    
    # Create single-row INSERT files
    python3 << 'EOF'
import csv

def clean_value(value):
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    if value.startswith('{') or value.startswith('['):
        escaped = value.replace("'", "''")
        return f"'{escaped}'"
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

with open('suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    rows = list(reader)

batch_size = 50
total_batches = (len(rows) + batch_size - 1) // batch_size

for batch_num in range(total_batches):
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, len(rows))
    batch_rows = rows[start_idx:end_idx]
    
    filename = f"scripts/d1_batch_{batch_num + 1}.sql"
    with open(filename, 'w', encoding='utf-8') as batch_file:
        batch_file.write("-- Single-row INSERT batch\n")
        
        for row in batch_rows:
            columns = list(row.keys())
            values = [clean_value(row[col]) for col in columns]
            insert_sql = f"INSERT OR IGNORE INTO suppliers ({', '.join(columns)}) VALUES ({', '.join(values)});\n"
            batch_file.write(insert_sql)
    
    print(f"Created {filename} with {len(batch_rows)} rows")
EOF
    
    batch_count=$(ls scripts/d1_batch_*.sql 2>/dev/null | wc -l)
fi

echo "Found $batch_count batch files (50 records each)"
echo "Estimated time: $((batch_count * 3)) seconds (~$((batch_count / 20)) minutes)"

start_time=$(date +%s)

# Import each batch with auto-approval (no prompts)
for i in $(seq 1 $batch_count); do
    batch_file="scripts/d1_batch_${i}.sql"
    if [ -f "$batch_file" ]; then
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        progress=$((i * 100 / batch_count))
        
        echo "[$elapsed s] [$progress%] Batch $i/$batch_count..."
        
        # Execute with timeout and error handling
        timeout 30s npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file" --compatibility-date=2025-01-15 >/dev/null 2>&1
        
        exit_code=$?
        if [ $exit_code -eq 0 ]; then
            echo "✅ Batch $i imported successfully"
        elif [ $exit_code -eq 124 ]; then
            echo "⏰ Batch $i timed out (continuing...)"
        else
            echo "❌ Batch $i error (continuing...)"
        fi
        
        # 3-second delay for reliability
        sleep 3
    fi
done

end_time=$(date +%s)
total_time=$((end_time - start_time))
minutes=$((total_time / 60))
seconds=$((total_time % 60))

echo ""
echo "🎉 Import completed in ${minutes}m ${seconds}s!"

# Verify import
echo "Verifying data..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"

# Check for any duplicates that might have been skipped
echo "Checking for potential duplicates..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(DISTINCT place_id) as unique_places, COUNT(*) as total_records FROM suppliers;"

echo ""
echo "Remote database ready! 🚀"
echo "Test API: curl https://findrawdogfood.findrawdogfood.workers.dev/api/stats"
