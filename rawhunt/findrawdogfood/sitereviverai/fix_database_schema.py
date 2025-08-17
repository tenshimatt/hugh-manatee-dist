#!/usr/bin/env python3
"""
Fix database schema - add missing columns for business rules and approval workflow
"""

import sqlite3
from datetime import datetime

def fix_database_schema():
    db_path = "batch_analysis_results.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔧 Fixing database schema...")
    
    # Get current table structure
    cursor.execute("PRAGMA table_info(analysis_results)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    print(f"📋 Existing columns: {existing_columns}")
    
    # Add missing columns for approval workflow
    new_columns = [
        ("approval_status", "TEXT DEFAULT 'pending'"),
        ("approved_by", "TEXT"),
        ("approved_at", "TIMESTAMP"),
        ("approval_notes", "TEXT"),
        ("recipient_email", "TEXT"),
        ("email_sent_at", "TIMESTAMP"),
        # Business rules columns
        ("is_independent", "BOOLEAN DEFAULT 1"),
        ("priority_rank", "INTEGER"),
        ("priority_label", "TEXT"),
        ("should_process", "BOOLEAN DEFAULT 1"),
        ("filter_reason", "TEXT")
    ]
    
    for column_name, column_type in new_columns:
        if column_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE analysis_results ADD COLUMN {column_name} {column_type}")
                print(f"✅ Added column: {column_name}")
            except Exception as e:
                print(f"⚠️  Column {column_name} might already exist: {e}")
    
    # Update existing records with default values
    cursor.execute("""
        UPDATE analysis_results 
        SET approval_status = 'pending',
            is_independent = 1,
            should_process = 1
        WHERE approval_status IS NULL
    """)
    
    conn.commit()
    
    # Verify the fix
    cursor.execute("PRAGMA table_info(analysis_results)")
    updated_columns = [row[1] for row in cursor.fetchall()]
    print(f"✅ Updated columns: {updated_columns}")
    
    # Show sample data
    cursor.execute("""
        SELECT business_name, website_url, analysis_score, approval_status 
        FROM analysis_results 
        WHERE status='completed' 
        LIMIT 5
    """)
    
    print("\n📊 Sample data after schema fix:")
    for row in cursor.fetchall():
        print(f"   {row[0]} - Score: {row[2]} - Status: {row[3]}")
    
    conn.close()
    print("\n✅ Database schema fixed successfully!")

if __name__ == '__main__':
    fix_database_schema()
