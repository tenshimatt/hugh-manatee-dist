#!/bin/bash

# Import CSV data to D1 database
echo "Importing suppliers.csv to D1 database..."

# Convert CSV to SQL INSERT statements
python3 << 'EOF'
import csv
import json
import uuid

def escape_sql(value):
    if value is None or value == '':
        return 'NULL'
    # Escape single quotes by doubling them
    return "'" + str(value).replace("'", "''") + "'"

print("-- Generated SQL INSERT statements from suppliers.csv")
print("BEGIN TRANSACTION;")

with open('suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    batch_size = 100
    batch_count = 0
    
    for i, row in enumerate(reader):
        if i % batch_size == 0:
            if i > 0:
                print("COMMIT;")
                print("BEGIN TRANSACTION;")
            batch_count += 1
            print(f"-- Batch {batch_count}")
        
        # Prepare values, handling NULL/empty values
        values = []
        for column in reader.fieldnames:
            value = row.get(column, '')
            if value == '' or value == 'NULL':
                values.append('NULL')
            else:
                values.append(escape_sql(value))
        
        print(f"INSERT OR REPLACE INTO suppliers ({', '.join(reader.fieldnames)}) VALUES ({', '.join(values)});")

print("COMMIT;")
print("-- Import complete")
EOF

echo "SQL import file generated as import.sql"
