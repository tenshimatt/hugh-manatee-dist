#!/bin/bash

echo "Creating D1-optimized import with safe batch sizes..."

# Create multi-row INSERT statements optimized for D1 limits
python3 << 'EOF'
import csv
import json
import math

def clean_value(value):
    """Clean and escape values for SQL"""
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    
    # Handle JSON strings (raw_data, types)
    if value.startswith('{') or value.startswith('['):
        # Escape quotes in JSON and truncate if too long
        escaped = value.replace("'", "''")
        if len(escaped) > 10000:  # Truncate very long JSON
            escaped = escaped[:10000] + "..."
        return f"'{escaped}'"
    
    # Regular string values
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

# Read CSV and create optimized import files
print("Reading suppliers.csv...")
with open('suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    rows = list(reader)
    
total_rows = len(rows)
batch_size = 100  # Safe batch size for D1 (avoids SQLITE_TOOBIG)
total_batches = math.ceil(total_rows / batch_size)

print(f"Total rows: {total_rows}")
print(f"Creating {total_batches} optimized batch files (100 records each)...")

columns = list(rows[0].keys()) if rows else []

for batch_num in range(total_batches):
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, total_rows)
    batch_rows = rows[start_idx:end_idx]
    
    filename = f"scripts/optimal_batch_{batch_num + 1}.sql"
    with open(filename, 'w', encoding='utf-8') as batch_file:
        batch_file.write(f"-- D1 Optimal Batch {batch_num + 1}\n")
        
        # Create single multi-row INSERT statement
        batch_file.write(f"INSERT OR REPLACE INTO suppliers ({', '.join(columns)}) VALUES\n")
        
        # Add all rows as VALUES
        values_rows = []
        for row in batch_rows:
            values = [clean_value(row[col]) for col in columns]
            values_rows.append(f"({', '.join(values)})")
        
        # Join all VALUES with commas
        batch_file.write(',\n'.join(values_rows))
        batch_file.write(';\n')
    
    print(f"Created {filename} with {len(batch_rows)} rows")

print(f"\nOptimal import files created!")
print(f"Expected import time: ~{total_batches} seconds")
EOF
