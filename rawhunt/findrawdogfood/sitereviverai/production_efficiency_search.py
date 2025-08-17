#!/usr/bin/env python3
"""
Production Efficiency Script - Find 3 Websites Needing Work
Saves OpenAI credits by aborting analysis on high-scoring sites
"""

import asyncio
import subprocess
import json
import aiohttp
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class ProductionEfficiencyAnalyzer(BatchAnalyzer):
    """
    Efficient analyzer that stops on high-scoring sites to save credits
    """
    
    def __init__(self):
        super().__init__()
        self.database_name = "findrawdogfood-db"
        self.websites_needing_work = []
        self.websites_already_good = []
        self.target_count = 3
    
    async def quick_website_check(self, url, business_name):
        """
        Quick initial check to see if site is obviously high-quality
        Saves full OpenAI analysis for sites that actually need work
        """
        try:
            print(f"    🔍 Quick check: {url}")
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        print(f"    ❌ Site unreachable (HTTP {response.status})")
                        return "needs_work", "Site unreachable"
                    
                    content = await response.text()
                    content_lower = content.lower()
                    
                    # Quick indicators of a high-quality site
                    quality_indicators = [
                        'bootstrap' in content_lower,
                        'responsive' in content_lower, 
                        'viewport' in content_lower,
                        len(content) > 50000,  # Substantial content
                        'https://' in url,
                        'ssl' in content_lower or 'secure' in content_lower,
                        'meta name="description"' in content_lower,
                        'og:' in content_lower,  # Open Graph tags
                        'json-ld' in content_lower or 'schema.org' in content_lower
                    ]
                    
                    quality_score = sum(quality_indicators)
                    
                    # If 6+ quality indicators, likely already good
                    if quality_score >= 6:
                        print(f"    ✅ High-quality site detected ({quality_score}/9 indicators)")
                        return "already_good", f"Modern site with {quality_score}/9 quality indicators"
                    else:
                        print(f"    🎯 Potential rebuild candidate ({quality_score}/9 indicators)")
                        return "needs_work", f"Limited quality indicators ({quality_score}/9)"
            
        except Exception as e:
            print(f"    ⚠️  Check failed: {str(e)}")
            return "needs_work", f"Analysis needed: {str(e)}"
    
    async def get_suppliers_batch(self, offset=0, batch_size=20):
        """
        Get batch of suppliers from D1 database
        """
        try:
            cmd = [
                'wrangler', 'd1', 'execute', self.database_name,
                '--remote',
                '--command', f"""
                    SELECT id, name, website, phone_number, city, state 
                    FROM suppliers 
                    WHERE website IS NOT NULL 
                    AND website != '' 
                    AND website != 'null'
                    AND (website LIKE 'http%' OR website LIKE 'www.%')
                    ORDER BY id
                    LIMIT {batch_size} OFFSET {offset}
                """,
                '--json'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                print(f"❌ Error querying D1: {result.stderr}")
                return []
            
            try:
                data = json.loads(result.stdout)
                if not data or 'results' not in data:
                    return []
                
                suppliers = []
                for row in data['results']:
                    website = row.get('website', '').strip()
                    if website and not website.startswith('http'):
                        website = f"https://{website}"
                    
                    supplier = {
                        'id': row.get('id'),
                        'name': row.get('name'),
                        'website': website,
                        'email': f"info@{row.get('name', 'supplier').lower().replace(' ', '').replace('&', '').replace('.', '')[:20]}.com",
                        'phone': row.get('phone_number'),
                        'city': row.get('city'),
                        'state': row.get('state')
                    }
                    suppliers.append(supplier)
                
                return suppliers
                
            except json.JSONDecodeError:
                print("❌ Error parsing D1 response")
                return []
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            return []
    
    async def find_websites_needing_work(self):
        """
        Efficiently find websites that need work, skipping high-quality ones
        """
        print("🎯 PRODUCTION SEARCH: Finding 3 websites needing work")
        print("💰 Credit-saving mode: Skip full analysis on high-quality sites")
        print("=" * 70)
        
        offset = 0
        batch_size = 20
        total_checked = 0
        
        while len(self.websites_needing_work) < self.target_count and total_checked < 200:
            print(f"\n📦 Checking batch starting at position {offset}...")
            
            batch = await self.get_suppliers_batch(offset, batch_size)
            
            if not batch:
                print("📭 No more suppliers found")
                break
            
            for supplier in batch:
                total_checked += 1
                print(f"\n🏢 {total_checked}. {supplier['name']} - {supplier['website']}")
                
                # Quick quality check first
                quality_status, reason = await self.quick_website_check(
                    supplier['website'], 
                    supplier['name']
                )
                
                if quality_status == "already_good":
                    self.websites_already_good.append({
                        'supplier': supplier,
                        'reason': reason
                    })
                    print(f"    ⏭️  SKIPPED: {reason} (saving credits)")
                    
                elif quality_status == "needs_work":
                    self.websites_needing_work.append(supplier)
                    print(f"    ✅ SELECTED: {reason}")
                    
                    if len(self.websites_needing_work) >= self.target_count:
                        print(f"\n🎯 Found {self.target_count} websites needing work!")
                        break
            
            offset += batch_size
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 SEARCH SUMMARY:")
        print(f"   🔍 Total websites checked: {total_checked}")
        print(f"   ✅ Found needing work: {len(self.websites_needing_work)}")
        print(f"   ⏭️  Skipped (already good): {len(self.websites_already_good)}")
        print(f"   💰 Credits saved: ~{len(self.websites_already_good) * 2} OpenAI calls")
        
        return self.websites_needing_work
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Override to return only the websites that need work
        """
        return await self.find_websites_needing_work()

async def run_production_efficiency_search():
    """
    Production search for websites needing work
    """
    print("🚀 PRODUCTION EFFICIENCY SEARCH")
    print("Find 3 websites needing work, skip high-quality sites")
    print("=" * 70)
    
    analyzer = ProductionEfficiencyAnalyzer()
    
    # Find websites needing work
    websites_needing_work = await analyzer.find_websites_needing_work()
    
    if not websites_needing_work:
        print("❌ No websites needing work found in search range")
        return
    
    print(f"\n🎯 FOUND {len(websites_needing_work)} WEBSITES NEEDING WORK:")
    for i, supplier in enumerate(websites_needing_work, 1):
        print(f"  {i}. {supplier['name']} - {supplier['website']}")
    
    print(f"\n💡 SKIPPED {len(analyzer.websites_already_good)} HIGH-QUALITY SITES:")
    for skip in analyzer.websites_already_good[:5]:  # Show first 5
        print(f"  ⏭️  {skip['supplier']['name']} - {skip['reason']}")
    
    # Now run full OpenAI analysis only on the websites that need work
    print(f"\n🔬 Running full OpenAI analysis on {len(websites_needing_work)} selected websites...")
    print("This will use OpenAI credits for detailed analysis and email generation")
    
    # Override method to use found websites
    async def get_selected_websites():
        return websites_needing_work
    
    analyzer.get_all_suppliers_with_websites = get_selected_websites
    
    # Run detailed analysis
    await analyzer.run_batch_analysis(
        batch_size=len(websites_needing_work),
        max_concurrent=1
    )
    
    print(f"\n🎉 PRODUCTION EFFICIENCY SEARCH COMPLETE!")
    print(f"💰 Saved ~{len(analyzer.websites_already_good) * 2} OpenAI API calls")
    print("📊 View results:")
    print("sqlite3 batch_analysis_results.db \"SELECT business_name, analysis_score, business_potential FROM analysis_results WHERE status='completed' ORDER BY analysis_score ASC;\"")

if __name__ == "__main__":
    asyncio.run(run_production_efficiency_search())
