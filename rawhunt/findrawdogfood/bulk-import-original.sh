#!/bin/bash

echo "🚀 Bulk importing original 8,000+ suppliers to D1..."

# Check if suppliers.csv exists
if [ ! -f "suppliers.csv" ]; then
    echo "❌ suppliers.csv not found in current directory"
    echo "Current files:"
    ls -la *.csv 2>/dev/null || echo "No CSV files found"
    exit 1
fi

# Get record count
record_count=$(wc -l < suppliers.csv)
echo "📊 Found $record_count total lines in suppliers.csv"

# Split into smaller files for reliable import
echo "📄 Splitting CSV into manageable chunks..."

# Split into 1000-record files (including header)
split_size=1000
header=$(head -n 1 suppliers.csv)

# Create chunks directory
mkdir -p csv_chunks
rm -f csv_chunks/chunk_*.csv

# Get total data lines (excluding header)
data_lines=$((record_count - 1))
total_chunks=$(((data_lines + split_size - 1) / split_size))

echo "📦 Creating $total_chunks chunk files..."

for i in $(seq 1 $total_chunks); do
    start_line=$(((i - 1) * split_size + 2))  # +2 to skip header on first chunk
    end_line=$((i * split_size + 1))
    
    chunk_file="csv_chunks/chunk_$(printf "%03d" $i).csv"
    
    # Add header to each chunk
    echo "$header" > "$chunk_file"
    
    # Add data lines
    sed -n "${start_line},${end_line}p" suppliers.csv >> "$chunk_file"
    
    actual_lines=$(wc -l < "$chunk_file")
    echo "📄 Created $chunk_file with $actual_lines lines"
done

echo ""
echo "🔄 Importing chunks to D1 database..."

success_count=0
error_count=0

for chunk_file in csv_chunks/chunk_*.csv; do
    if [ -f "$chunk_file" ]; then
        echo "📤 Importing $(basename $chunk_file)..."
        
        # Import with timeout
        if timeout 60 npx wrangler d1 execute findrawdogfood-db --remote --file="<(tail -n +2 $chunk_file | awk -F',' 'BEGIN{OFS=","} {for(i=1;i<=NF;i++) if($i!="") gsub(/\047/,"\047\047",$i); print "INSERT OR IGNORE INTO suppliers VALUES (" $0 ");"}' )" 2>/dev/null; then
            echo "✅ $(basename $chunk_file) imported successfully"
            ((success_count++))
        else
            echo "❌ $(basename $chunk_file) failed to import"
            ((error_count++))
        fi
        
        # Small delay to avoid overwhelming D1
        sleep 2
    fi
done

echo ""
echo "📊 Import Summary:"
echo "   Successful chunks: $success_count"
echo "   Failed chunks: $error_count"
echo "   Total chunks: $total_chunks"

# Verify final count
echo ""
echo "🔍 Verifying database count..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total_suppliers FROM suppliers;"

echo ""
echo "🧹 Cleaning up chunk files..."
rm -rf csv_chunks

echo "✅ Bulk import process completed!"
