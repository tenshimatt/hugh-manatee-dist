#!/usr/bin/env python3
"""
Production Batch Analyzer - Continuous Workflow System
Analyzes suppliers and feeds approval dashboard
"""

import asyncio
import argparse
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer
import subprocess
import json

class ProductionBatchAnalyzer(BatchAnalyzer):
    """
    Production analyzer for continuous workflow
    """
    
    def __init__(self):
        super().__init__()
        self.database_name = "findrawdogfood-db"
        self.processed_suppliers = set()
    
    async def get_unprocessed_suppliers(self, batch_size=50, offset=0):
        """
        Get suppliers that haven't been analyzed yet
        """
        # Get already processed supplier IDs
        try:
            conn = self.get_results_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT supplier_id FROM analysis_results WHERE supplier_id IS NOT NULL")
            processed_ids = {str(row[0]) for row in cursor.fetchall()}
            conn.close()
        except:
            processed_ids = set()
        
        # Get suppliers from D1 (fallback to known suppliers for now)
        suppliers = await self.get_fallback_suppliers_batch(batch_size, offset)
        
        # Filter out already processed
        unprocessed = [s for s in suppliers if str(s['id']) not in processed_ids]
        
        print(f"📊 Found {len(unprocessed)} unprocessed suppliers (out of {len(suppliers)} total)")
        
        return unprocessed
    
    async def get_fallback_suppliers_batch(self, batch_size, offset):
        """
        Get batch of suppliers (using fallback data for now)
        """
        all_suppliers = [
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
            },
            {
                'id': '455',
                'name': 'Healthy Pet Austin',
                'website': 'http://healthypetaustin.com/',
                'email': 'info@healthypetaustin.com',
                'phone': '(512) 215-2368',
                'city': 'Austin',
                'state': 'TX'
            },
            {
                'id': '533',
                'name': 'The Dog Mom Store',
                'website': 'https://www.thedogmomstore.com/',
                'email': 'info@thedogmomstore.com',
                'phone': '(555) 123-4567',
                'city': 'Dallas',
                'state': 'TX'
            },
            {
                'id': '999',
                'name': 'Pet Supplies Plus',
                'website': 'https://www.petsuppliesplus.com/',
                'email': 'info@petsuppliesplus.com',
                'phone': '(555) 987-6543',
                'city': 'Chicago',
                'state': 'IL'
            },
            {
                'id': '1001',
                'name': 'Natural Pet Pantry',
                'website': 'https://naturalpetpantry.com/',
                'email': 'info@naturalpetpantry.com',
                'phone': '(555) 456-7890',
                'city': 'Denver',
                'state': 'CO'
            },
            {
                'id': '1002',
                'name': 'Raw Dog Food Co',
                'website': 'https://rawdogfoodco.com/',
                'email': 'info@rawdogfoodco.com',
                'phone': '(555) 234-5678',
                'city': 'Seattle',
                'state': 'WA'
            }
        ]
        
        # Simulate pagination
        start_idx = offset
        end_idx = offset + batch_size
        return all_suppliers[start_idx:end_idx]
    
    def get_results_connection(self):
        """Get connection to results database"""
        import sqlite3
        return sqlite3.connect(self.results_db)
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Override to get unprocessed suppliers
        """
        batch_size = limit or 50
        return await self.get_unprocessed_suppliers(batch_size)

async def run_production_batch(batch_size=50, continuous=False):
    """
    Run production batch analysis
    """
    print("🚀 PRODUCTION BATCH ANALYZER")
    print("=" * 60)
    print(f"📊 Batch size: {batch_size}")
    print(f"🔄 Continuous mode: {continuous}")
    print("=" * 60)
    
    analyzer = ProductionBatchAnalyzer()
    
    if continuous:
        print("🔄 Starting continuous analysis mode...")
        print("Press Ctrl+C to stop")
        
        iteration = 1
        while True:
            try:
                print(f"\n📦 BATCH {iteration} - Processing {batch_size} suppliers...")
                
                # Override to get next batch
                async def get_next_batch():
                    return await analyzer.get_unprocessed_suppliers(batch_size, (iteration-1) * batch_size)
                
                analyzer.get_all_suppliers_with_websites = get_next_batch
                
                await analyzer.run_batch_analysis(
                    batch_size=batch_size,
                    max_concurrent=3
                )
                
                print(f"✅ Batch {iteration} complete!")
                print("📊 Results available in approval dashboard: http://localhost:5001")
                
                iteration += 1
                
                # Wait between batches to avoid rate limits
                print("⏸️  Waiting 5 minutes before next batch...")
                await asyncio.sleep(300)  # 5 minutes
                
            except KeyboardInterrupt:
                print("\n🛑 Stopping continuous analysis...")
                break
            except Exception as e:
                print(f"❌ Batch {iteration} failed: {e}")
                print("⏸️  Waiting 2 minutes before retry...")
                await asyncio.sleep(120)
    else:
        # Single batch
        await analyzer.run_batch_analysis(
            batch_size=batch_size,
            max_concurrent=3
        )
        
        print(f"\n✅ BATCH ANALYSIS COMPLETE!")
        print("📊 Results ready for approval review")
        print("🌐 Open approval dashboard: http://localhost:5001")

def main():
    parser = argparse.ArgumentParser(description='Production Batch Analyzer')
    parser.add_argument('--batch-size', type=int, default=50, help='Number of suppliers per batch')
    parser.add_argument('--continuous', action='store_true', help='Run continuously with breaks between batches')
    
    args = parser.parse_args()
    
    asyncio.run(run_production_batch(args.batch_size, args.continuous))

if __name__ == "__main__":
    main()
