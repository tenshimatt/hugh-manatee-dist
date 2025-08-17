#!/usr/bin/env python3
"""
Cloudflare D1 Database Connector for FindRawDogFood
Gets real suppliers from Cloudflare D1 production database
"""

import asyncio
import subprocess
import json
import os
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class CloudflareD1Analyzer(BatchAnalyzer):
    """
    Production analyzer that connects to Cloudflare D1 database
    """
    
    def __init__(self):
        super().__init__()
        self.d1_database_id = "9dcf8539-f274-486c-807b-7e265146ce6b"
        self.database_name = "findrawdogfood-db"
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Get real suppliers from Cloudflare D1 database using wrangler
        """
        try:
            # First check table structure
            print("🔍 Checking D1 database structure...")
            
            # Get table info
            table_cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--command', "SELECT name FROM sqlite_master WHERE type='table';",
                '--json'
            ]
            
            result = subprocess.run(table_cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error checking tables: {result.stderr}")
                return []
            
            try:
                tables_data = json.loads(result.stdout)
                print("📊 D1 Database Tables:")
                if tables_data and 'results' in tables_data:
                    for row in tables_data['results']:
                        print(f"  - {row['name']}")
            except:
                print("  Could not parse table list")
            
            # Get sample suppliers with websites
            limit_clause = f"LIMIT {limit}" if limit else "LIMIT 10"
            
            suppliers_cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--command', f"""
                    SELECT id, name, website, email, phone, city, state 
                    FROM suppliers 
                    WHERE website IS NOT NULL 
                    AND website != '' 
                    AND website != 'N/A'
                    AND (website LIKE 'http%' OR website LIKE 'www.%')
                    ORDER BY id
                    {limit_clause}
                """,
                '--json'
            ]
            
            result = subprocess.run(suppliers_cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error querying suppliers: {result.stderr}")
                return []
            
            try:
                data = json.loads(result.stdout)
                
                if not data or 'results' not in data:
                    print("❌ No results from D1 query")
                    return []
                
                suppliers = []
                for row in data['results']:
                    # Ensure website has protocol
                    website = row.get('website', '')
                    if website and not website.startswith('http'):
                        website = f"https://{website}"
                    
                    supplier = {
                        'id': row.get('id'),
                        'name': row.get('name'),
                        'website': website,
                        'email': row.get('email'),
                        'phone': row.get('phone'),
                        'city': row.get('city'),
                        'state': row.get('state')
                    }
                    suppliers.append(supplier)
                
                print(f"📊 Loaded {len(suppliers)} suppliers from Cloudflare D1")
                
                # Show sample data
                print("\n🏢 Sample Suppliers:")
                for supplier in suppliers[:3]:
                    print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
                
                return suppliers
                
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing D1 response: {e}")
                print(f"Raw output: {result.stdout}")
                return []
            
        except Exception as e:
            print(f"❌ D1 database error: {e}")
            return []
    
    async def get_total_supplier_count(self):
        """Get total count of suppliers with websites"""
        try:
            count_cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--command', """
                    SELECT COUNT(*) as count 
                    FROM suppliers 
                    WHERE website IS NOT NULL 
                    AND website != '' 
                    AND website != 'N/A'
                """,
                '--json'
            ]
            
            result = subprocess.run(count_cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                if data and 'results' in data and len(data['results']) > 0:
                    return data['results'][0]['count']
            
            return 0
            
        except Exception as e:
            print(f"❌ Error getting count: {e}")
            return 0

async def run_d1_production_test():
    """
    Run production test with 3 real suppliers from Cloudflare D1
    """
    print("🚀 CLOUDFLARE D1 PRODUCTION TEST")
    print("=" * 50)
    
    # Initialize D1 analyzer
    analyzer = CloudflareD1Analyzer()
    
    # Get total count first
    print("📊 Getting total supplier count...")
    total_count = await analyzer.get_total_supplier_count()
    print(f"📈 Total suppliers with websites in D1: {total_count}")
    
    print("\n🧪 Running analysis on 3 real suppliers from D1...")
    
    # Override the method to limit to 3 for testing
    original_method = analyzer.get_all_suppliers_with_websites
    
    async def get_test_suppliers():
        return await original_method(limit=3)
    
    analyzer.get_all_suppliers_with_websites = get_test_suppliers
    
    # Run analysis
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1
    )
    
    print(f"\n🎯 D1 PRODUCTION TEST COMPLETE!")
    print(f"📊 Analyzed 3 suppliers from {total_count} total in database")
    print("📊 Results saved to: batch_analysis_results.db")

if __name__ == "__main__":
    asyncio.run(run_d1_production_test())
