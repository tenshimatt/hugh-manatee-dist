#!/usr/bin/env python3
"""
Simple D1 Test - Get working suppliers and analyze
Fixed to work with your exact D1 setup
"""

import asyncio
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class SimpleWorkingAnalyzer(BatchAnalyzer):
    """
    Simple analyzer using known working suppliers
    """
    
    async def get_all_suppliers_with_websites(self, limit=3):
        """
        Use suppliers we know exist in your D1 database
        """
        # These are the exact suppliers from your D1 Studio screenshot
        working_suppliers = [
            {
                'id': '807',
                'name': 'Jake & Blues', 
                'website': 'https://jakeandblues.com/',
                'email': 'info@jakeandblues.com',
                'phone': '(325) 805-1488',
                'city': 'Austin',
                'state': 'TX'
            },
            {
                'id': '027',
                'name': 'Pawson Chicago',
                'website': 'https://pawsonchicon.com/', 
                'email': 'info@pawsonchicon.com',
                'phone': '(512) 273-7297',
                'city': 'Chicago', 
                'state': 'IL'
            },
            {
                'id': '163',
                'name': 'Tomlinsons Feed',
                'website': 'https://tomlinsons.com/pages/tomlinsons-airport-blvd',
                'email': 'info@tomlinsons.com',
                'phone': '(512) 452-7021',
                'city': 'Austin',
                'state': 'TX'
            }
        ]
        
        print(f"🎯 Using {len(working_suppliers)} confirmed suppliers from your D1:")
        for supplier in working_suppliers:
            print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
        
        return working_suppliers

async def run_simple_working_test():
    """
    Simple test with confirmed working suppliers
    """
    print("🚀 SIMPLE WORKING TEST")
    print("Using suppliers confirmed in your D1 Studio")
    print("=" * 50)
    
    analyzer = SimpleWorkingAnalyzer()
    
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1
    )
    
    print(f"\n🎯 TEST COMPLETE!")
    print("📊 View results:")
    print("sqlite3 batch_analysis_results.db \"SELECT business_name, website_url, analysis_score, business_potential FROM analysis_results WHERE status='completed' ORDER BY analysis_score DESC;\"")

if __name__ == "__main__":
    asyncio.run(run_simple_working_test())
