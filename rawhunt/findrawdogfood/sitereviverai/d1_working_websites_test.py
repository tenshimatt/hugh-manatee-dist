#!/usr/bin/env python3
"""
Cloudflare D1 Database Connector - Find 3 Working Websites
Keeps trying suppliers until we find 3 with working websites
"""

import asyncio
import subprocess
import json
import aiohttp
import os
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class CloudflareD1WorkingWebsiteAnalyzer(BatchAnalyzer):
    """
    Analyzer that finds suppliers with working websites from D1
    """
    
    def __init__(self):
        super().__init__()
        self.d1_database_id = "9dcf8539-f274-486c-807b-7e265146ce6b"
        self.database_name = "findrawdogfood-db"
    
    async def test_website_accessibility(self, url):
        """Test if a website is accessible"""
        if not url:
            return False
            
        # Clean up URL
        if not url.startswith('http'):
            url = f"https://{url}"
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url) as response:
                    return response.status == 200
        except:
            # Try HTTP if HTTPS fails
            if url.startswith('https://'):
                try:
                    http_url = url.replace('https://', 'http://')
                    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                        async with session.get(http_url) as response:
                            return response.status == 200
                except:
                    return False
            return False
    
    async def find_suppliers_with_working_websites(self, target_count=3):
        """
        Find suppliers with working websites by testing them
        """
        print(f"🔍 Searching for {target_count} suppliers with working websites...")
        
        working_suppliers = []
        offset = 0
        batch_size = 20  # Check 20 at a time
        
        while len(working_suppliers) < target_count and offset < 500:  # Max 500 attempts
            print(f"📦 Checking batch starting at position {offset}...")
            
            # Get batch of suppliers
            batch_cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--command', f"""
                    SELECT id, name, website, email, phone, city, state 
                    FROM suppliers 
                    WHERE website IS NOT NULL 
                    AND website != '' 
                    AND website != 'N/A'
                    AND website != 'null'
                    AND LENGTH(website) > 5
                    ORDER BY id 
                    LIMIT {batch_size} OFFSET {offset}
                """,
                '--json'
            ]
            
            result = subprocess.run(batch_cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error querying batch: {result.stderr}")
                break
            
            try:
                data = json.loads(result.stdout)
                
                if not data or 'results' not in data or not data['results']:
                    print("📭 No more suppliers found")
                    break
                
                batch_suppliers = data['results']
                print(f"🔎 Testing {len(batch_suppliers)} websites for accessibility...")
                
                # Test each website
                for row in batch_suppliers:
                    if len(working_suppliers) >= target_count:
                        break
                    
                    website = row.get('website', '').strip()
                    if not website:
                        continue
                    
                    # Clean up common website issues
                    if website.startswith('www.') and not website.startswith('http'):
                        website = f"https://{website}"
                    elif not website.startswith('http'):
                        website = f"https://{website}"
                    
                    print(f"  🌐 Testing: {row.get('name', 'Unknown')} - {website}")
                    
                    # Test if website works
                    is_working = await self.test_website_accessibility(website)
                    
                    if is_working:
                        supplier = {
                            'id': row.get('id'),
                            'name': row.get('name'),
                            'website': website,
                            'email': row.get('email'),
                            'phone': row.get('phone'),
                            'city': row.get('city'),
                            'state': row.get('state')
                        }
                        working_suppliers.append(supplier)
                        print(f"  ✅ WORKING: {supplier['name']} - {website}")
                    else:
                        print(f"  ❌ Failed: {website}")
                
                offset += batch_size
                
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing batch response: {e}")
                break
        
        print(f"\n🎯 Found {len(working_suppliers)} working websites out of {offset} checked")
        
        for i, supplier in enumerate(working_suppliers, 1):
            print(f"  {i}. {supplier['name']} - {supplier['website']}")
        
        return working_suppliers
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Override to find working websites
        """
        target_count = limit if limit else 3
        return await self.find_suppliers_with_working_websites(target_count)

async def run_working_website_test():
    """
    Find and analyze 3 suppliers with working websites
    """
    print("🚀 CLOUDFLARE D1 - WORKING WEBSITES TEST")
    print("=" * 60)
    
    # Initialize analyzer
    analyzer = CloudflareD1WorkingWebsiteAnalyzer()
    
    print("🔍 Searching D1 database for suppliers with working websites...")
    print("This may take a few minutes as we test website accessibility...")
    
    # Find working websites first
    working_suppliers = await analyzer.find_suppliers_with_working_websites(3)
    
    if not working_suppliers:
        print("❌ No working websites found in database")
        return
    
    print(f"\n🎯 Found {len(working_suppliers)} working websites! Starting analysis...")
    
    # Override method to use our found suppliers
    async def get_working_suppliers():
        return working_suppliers
    
    analyzer.get_all_suppliers_with_websites = get_working_suppliers
    
    # Run analysis on working websites
    await analyzer.run_batch_analysis(
        batch_size=len(working_suppliers),
        max_concurrent=1
    )
    
    print(f"\n🎉 WORKING WEBSITE TEST COMPLETE!")
    print(f"📊 Successfully analyzed {len(working_suppliers)} real websites from D1")

if __name__ == "__main__":
    asyncio.run(run_working_website_test())
