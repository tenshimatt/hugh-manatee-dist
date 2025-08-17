#!/bin/bash

echo "=== CSV Import Process ==="

# Create a smaller test import first (100 rows)
echo "Creating test import file..."
head -101 suppliers.csv > test_suppliers.csv

# Generate SQL for test data
python3 << 'EOF'
import csv
import json

def escape_sql(value):
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    # Escape single quotes and handle JSON
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

print("-- Test import of first 100 suppliers")
print("BEGIN TRANSACTION;")

with open('test_suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    for i, row in enumerate(reader):
        if i >= 100:  # Limit to 100 rows for testing
            break
            
        # Build INSERT statement
        columns = list(reader.fieldnames)
        values = []
        
        for column in columns:
            value = row.get(column, '')
            values.append(escape_sql(value))
        
        columns_str = ', '.join(columns)
        values_str = ', '.join(values)
        
        print(f"INSERT OR REPLACE INTO suppliers ({columns_str}) VALUES ({values_str});")

print("COMMIT;")
print("-- Test import complete")
EOF

echo "Test SQL generated. Importing to remote database..."

# Import test data to remote database
python3 -c "
import csv
import json

def escape_sql(value):
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    escaped = str(value).replace("'", "''")
    return f\"'{escaped}'\"

with open('test_suppliers.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    with open('test_import.sql', 'w') as sql_file:
        sql_file.write('BEGIN TRANSACTION;\n')
        
        for i, row in enumerate(reader):
            if i >= 100:
                break
                
            columns = list(reader.fieldnames)
            values = []
            
            for column in columns:
                value = row.get(column, '')
                values.append(escape_sql(value))
            
            columns_str = ', '.join(columns)
            values_str = ', '.join(values)
            
            sql_file.write(f'INSERT OR REPLACE INTO suppliers ({columns_str}) VALUES ({values_str});\n')
        
        sql_file.write('COMMIT;\n')
"

# Execute the test import
npx wrangler d1 execute findrawdogfood-db --remote --file=test_import.sql

# Check if import worked
echo "Testing import..."
npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as count, name FROM suppliers LIMIT 5;"

echo "=== Test import complete! ==="
