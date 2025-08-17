#!/usr/bin/env python3
"""
Simple D1 Test - Get 3 real suppliers and add test websites for analysis
"""

import asyncio
import subprocess
import json
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class SimpleD1TestAnalyzer(BatchAnalyzer):
    """
    Simple test analyzer for D1 with manual website assignment
    """
    
    def __init__(self):
        super().__init__()
        self.database_name = "findrawdogfood-db"
    
    async def get_all_suppliers_with_websites(self, limit=3):
        """
        Get 3 real suppliers and assign test websites for analysis
        """
        try:
            # Get real suppliers from D1
            cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--command', f"SELECT id, name, city, state, phone_number as phone FROM suppliers LIMIT {limit}",
                '--json'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error querying D1: {result.stderr}")
                return []
            
            data = json.loads(result.stdout)
            
            if not data or 'results' not in data:
                print("❌ No results from D1")
                return []
            
            # Assign test websites to real suppliers
            test_websites = [
                'http://petsupplieschicago.com/',
                'https://www.petfooddirect.com/',
                'https://rawfeedingmiami.com/'
            ]
            
            suppliers = []
            for i, row in enumerate(data['results'][:limit]):
                supplier = {
                    'id': row.get('id'),
                    'name': row.get('name', f'Pet Supplier {i+1}'),
                    'website': test_websites[i] if i < len(test_websites) else 'https://example-pet-store.com',
                    'email': f"info@supplier{i+1}.com",
                    'phone': row.get('phone'),
                    'city': row.get('city', 'Unknown'),
                    'state': row.get('state', 'US')
                }
                suppliers.append(supplier)
            
            print(f"📊 Prepared {len(suppliers)} suppliers for testing:")
            for supplier in suppliers:
                print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
            
            return suppliers
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return []

async def run_simple_d1_test():
    """
    Simple test with real D1 suppliers and test websites
    """
    print("🚀 SIMPLE D1 TEST - Real Suppliers + Test Websites")
    print("=" * 60)
    
    analyzer = SimpleD1TestAnalyzer()
    
    print("🔍 Getting real suppliers from D1 and assigning test websites...")
    
    # Run analysis
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1
    )
    
    print(f"\n🎯 SIMPLE D1 TEST COMPLETE!")
    print("📊 Results show real supplier names with analyzed websites")

if __name__ == "__main__":
    asyncio.run(run_simple_d1_test())
