#!/bin/bash

echo "🚀 Bulk importing original 8,000+ suppliers to D1..."

# Check if suppliers.csv exists
if [ ! -f "suppliers.csv" ]; then
    echo "❌ suppliers.csv not found in current directory"
    exit 1
fi

# Get record count
record_count=$(wc -l < suppliers.csv)
echo "📊 Found $record_count total lines in suppliers.csv"

echo "📄 Converting CSV to SQL INSERT statements..."

# Create SQL import file using Python (more reliable than awk)
python3 << 'EOF'
import csv
import sys

def clean_value(value):
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    # Escape single quotes
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

print("-- Bulk import of original suppliers")
print("-- Converting CSV to SQL...")

batch_size = 500
batch_count = 0

try:
    with open('suppliers.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        current_batch = []
        for i, row in enumerate(reader):
            if i % batch_size == 0 and current_batch:
                # Write current batch
                with open(f'import_batch_{batch_count + 1}.sql', 'w') as batch_file:
                    batch_file.write(f"-- Batch {batch_count + 1}\n")
                    for sql_line in current_batch:
                        batch_file.write(sql_line + '\n')
                print(f"Created import_batch_{batch_count + 1}.sql with {len(current_batch)} records")
                current_batch = []
                batch_count += 1
            
            # Create INSERT statement
            columns = list(row.keys())
            values = [clean_value(row[col]) for col in columns]
            
            sql = f"INSERT OR IGNORE INTO suppliers ({', '.join(columns)}) VALUES ({', '.join(values)});"
            current_batch.append(sql)
        
        # Write final batch
        if current_batch:
            batch_count += 1
            with open(f'import_batch_{batch_count}.sql', 'w') as batch_file:
                batch_file.write(f"-- Final batch {batch_count}\n")
                for sql_line in current_batch:
                    batch_file.write(sql_line + '\n')
            print(f"Created import_batch_{batch_count}.sql with {len(current_batch)} records")
    
    print(f"Total batches created: {batch_count}")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

# Check if Python script succeeded
if [ $? -ne 0 ]; then
    echo "❌ Failed to convert CSV to SQL"
    exit 1
fi

# Count generated batch files
batch_files=$(ls import_batch_*.sql 2>/dev/null | wc -l)
echo "📦 Generated $batch_files SQL batch files"

if [ $batch_files -eq 0 ]; then
    echo "❌ No batch files were created"
    exit 1
fi

echo ""
echo "🔄 Importing batches to D1 database..."

success_count=0
error_count=0

# Import each batch file
for batch_file in import_batch_*.sql; do
    if [ -f "$batch_file" ]; then
        echo "📤 Importing $batch_file..."
        
        # Import with proper error handling
        if npx wrangler d1 execute findrawdogfood-db --remote --file="$batch_file" >/dev/null 2>&1; then
            echo "✅ $batch_file imported successfully"
            ((success_count++))
        else
            echo "❌ $batch_file failed to import"
            ((error_count++))
        fi
        
        # Small delay between batches
        sleep 3
    fi
done

echo ""
echo "📊 Import Summary:"
echo "   Successful batches: $success_count"
echo "   Failed batches: $error_count"
echo "   Total batches: $batch_files"

# Verify final count
echo ""
echo "🔍 Verifying database count..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"

echo ""
echo "🧹 Cleaning up batch files..."
rm -f import_batch_*.sql
rm -rf csv_chunks

echo "✅ Bulk import process completed!"
