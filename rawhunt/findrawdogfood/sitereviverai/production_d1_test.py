#!/usr/bin/env python3
"""
Production D1 Database Test - 3 Real Websites
Connects to remote D1 production database for real supplier analysis
"""

import asyncio
import subprocess
import json
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class ProductionD1Analyzer(BatchAnalyzer):
    """
    Production analyzer using remote D1 database
    """
    
    def __init__(self):
        super().__init__()
        self.database_name = "findrawdogfood-db"
    
    async def get_all_suppliers_with_websites(self, limit=3):
        """
        Get real suppliers with websites from production D1 database
        """
        try:
            # Query production D1 database with --remote flag
            cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--remote',  # Use production database
                '--command', f"""
                    SELECT id, name, website, phone_number, city, state 
                    FROM suppliers 
                    WHERE website IS NOT NULL 
                    AND website != '' 
                    AND website != 'null'
                    AND (website LIKE 'http%' OR website LIKE 'www.%')
                    ORDER BY rating DESC
                    LIMIT {limit}
                """,
                '--json'
            ]
            
            print(f"🔍 Querying production D1 for {limit} suppliers with websites...")
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error querying production D1: {result.stderr}")
                return []
            
            try:
                data = json.loads(result.stdout)
                
                if not data or 'results' not in data:
                    print("❌ No results from production D1")
                    return []
                
                suppliers = []
                for row in data['results']:
                    # Clean up website URL
                    website = row.get('website', '').strip()
                    if website and not website.startswith('http'):
                        website = f"https://{website}"
                    
                    supplier = {
                        'id': row.get('id'),
                        'name': row.get('name'),
                        'website': website,
                        'email': f"info@{row.get('name', 'supplier').lower().replace(' ', '')}.com",  # Generate email
                        'phone': row.get('phone_number'),
                        'city': row.get('city'),
                        'state': row.get('state')
                    }
                    suppliers.append(supplier)
                
                print(f"📊 Found {len(suppliers)} suppliers from production D1:")
                for supplier in suppliers:
                    print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
                
                return suppliers
                
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing D1 response: {e}")
                print(f"Raw output: {result.stdout}")
                return []
            
        except Exception as e:
            print(f"❌ Production D1 error: {e}")
            return []

async def run_production_d1_test():
    """
    Run production test with 3 real suppliers from remote D1
    """
    print("🚀 PRODUCTION D1 DATABASE TEST")
    print("=" * 50)
    
    # Initialize production analyzer
    analyzer = ProductionD1Analyzer()
    
    print("🔍 Connecting to production D1 database...")
    
    # Get suppliers and run analysis
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1
    )
    
    print(f"\n🎯 PRODUCTION D1 TEST COMPLETE!")
    print("📊 Analyzed real suppliers from production database")

if __name__ == "__main__":
    asyncio.run(run_production_d1_test())
