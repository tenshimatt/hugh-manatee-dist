#!/bin/bash

echo "Creating D1-compatible CSV import..."

# Create individual INSERT statements without transactions
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
        # Escape quotes in JSON
        escaped = value.replace("'", "''")
        return f"'{escaped}'"
    
    # Regular string values
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

# Read CSV and create individual import files
print("Reading suppliers.csv...")
with open('suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    rows = list(reader)
    
total_rows = len(rows)
batch_size = 50  # Much smaller batches for D1 remote
total_batches = math.ceil(total_rows / batch_size)

print(f"Total rows: {total_rows}")
print(f"Creating {total_batches} batch files...")

for batch_num in range(total_batches):
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, total_rows)
    batch_rows = rows[start_idx:end_idx]
    
    filename = f"scripts/d1_batch_{batch_num + 1}.sql"
    with open(filename, 'w', encoding='utf-8') as batch_file:
        batch_file.write("-- D1 Remote Import Batch\n")
        
        for row in batch_rows:
            # Create INSERT statement
            columns = list(row.keys())
            values = [clean_value(row[col]) for col in columns]
            
            insert_sql = f"INSERT OR REPLACE INTO suppliers ({', '.join(columns)}) VALUES ({', '.join(values)});\n"
            batch_file.write(insert_sql)
    
    print(f"Created {filename} with {len(batch_rows)} rows")

print(f"\nD1 import files created in scripts/ directory")
print("Run import with: ./scripts/import-d1-remote.sh")
EOF
