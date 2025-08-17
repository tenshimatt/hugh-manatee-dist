#!/usr/bin/env python3
"""
Check production database structure and get real suppliers
"""

import sqlite3
import json

# Connect to production database
db_path = '/Users/mattwright/pandora/findrawdogfood/findrawdogfood.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get table structure
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("📊 Database Tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check suppliers table structure
    cursor.execute("PRAGMA table_info(suppliers);")
    columns = cursor.fetchall()
    
    print("\n🏢 Suppliers Table Schema:")
    for col in columns:
        print(f"  {col[1]}: {col[2]}")
    
    # Get sample data with websites
    cursor.execute("""
        SELECT id, name, website, email, phone, city, state 
        FROM suppliers 
        WHERE website IS NOT NULL AND website != '' AND website != 'N/A'
        LIMIT 10
    """)
    
    rows = cursor.fetchall()
    
    print("\n📋 Sample Suppliers with Websites:")
    for row in rows:
        print(f"  {row[0]}. {row[1]} - {row[2]}")
    
    # Count total suppliers with websites
    cursor.execute("""
        SELECT COUNT(*) 
        FROM suppliers 
        WHERE website IS NOT NULL AND website != '' AND website != 'N/A'
    """)
    
    count = cursor.fetchone()[0]
    print(f"\n📊 Total suppliers with websites: {count}")
    
    # Export first 3 for testing
    cursor.execute("""
        SELECT id, name, website, email, phone, city, state 
        FROM suppliers 
        WHERE website IS NOT NULL AND website != '' AND website != 'N/A'
        LIMIT 3
    """)
    
    test_suppliers = cursor.fetchall()
    
    print("\n🧪 Test Suppliers for Production Test:")
    test_data = []
    for row in test_suppliers:
        supplier = {
            'id': row[0],
            'name': row[1],
            'website': row[2],
            'email': row[3],
            'phone': row[4],
            'city': row[5],
            'state': row[6]
        }
        test_data.append(supplier)
        print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
    
    # Save test data to JSON for the script
    with open('/Users/mattwright/pandora/findrawdogfood/sitereviverai/production_test_suppliers.json', 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"\n✅ Test data saved to production_test_suppliers.json")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Database error: {e}")
