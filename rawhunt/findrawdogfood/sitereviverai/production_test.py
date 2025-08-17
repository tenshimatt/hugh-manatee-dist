#!/usr/bin/env python3
"""
Production Database Connector for FindRawDogFood
Connects to real supplier database and runs analysis on 3 real websites
"""

import asyncio
import sqlite3
import json
import os
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class ProductionDatabaseAnalyzer(BatchAnalyzer):
    """
    Production analyzer that connects to real FindRawDogFood database
    """
    
    def __init__(self):
        super().__init__()
        self.production_db_path = '/Users/mattwright/pandora/findrawdogfood/findrawdogfood.db'
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Get real suppliers from production database
        """
        try:
            conn = sqlite3.connect(self.production_db_path)
            cursor = conn.cursor()
            
            # Query real suppliers with websites
            query = """
                SELECT id, name, website, email, phone, city, state 
                FROM suppliers 
                WHERE website IS NOT NULL 
                AND website != '' 
                AND website != 'N/A'
                AND website LIKE 'http%'
                ORDER BY id
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            suppliers = []
            for row in rows:
                supplier = {
                    'id': row[0],
                    'name': row[1],
                    'website': row[2],
                    'email': row[3],
                    'phone': row[4],
                    'city': row[5],
                    'state': row[6]
                }
                suppliers.append(supplier)
            
            conn.close()
            
            self.logger.info(f"📊 Loaded {len(suppliers)} suppliers from production database")
            return suppliers
            
        except Exception as e:
            self.logger.error(f"❌ Production database error: {e}")
            return []

async def run_production_test():
    """
    Run production test with 3 real suppliers from database
    """
    print("🚀 PRODUCTION DATABASE TEST")
    print("=" * 50)
    
    # First, check database connection
    print("🔍 Checking production database...")
    os.system("python3 check_production_db.py")
    
    print("\n" + "=" * 50)
    print("🧪 Running analysis on 3 real suppliers...")
    
    # Initialize production analyzer
    analyzer = ProductionDatabaseAnalyzer()
    
    # Run analysis on 3 suppliers
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1  # Conservative for testing
    )
    
    print("\n🎯 PRODUCTION TEST COMPLETE!")
    print("📊 Results saved to: batch_analysis_results.db")

if __name__ == "__main__":
    asyncio.run(run_production_test())
