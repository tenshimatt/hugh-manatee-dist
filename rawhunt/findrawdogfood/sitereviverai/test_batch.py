#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

async def test_run():
    analyzer = BatchAnalyzer()
    
    # Override the supplier loading for testing
    async def get_test_suppliers():
        return [
            {
                'id': 1,
                'name': 'Your Best Friend Pet Supply',
                'website': 'http://petsupplieschicago.com/',
                'email': 'info@petsupplieschicago.com',
                'phone': '(773) 661-1054',
                'city': 'Chicago',
                'state': 'IL'
            },
            {
                'id': 2,
                'name': 'Test Pet Store',
                'website': 'https://example-pet-store.com',
                'email': 'info@example-pet-store.com',
                'phone': '(555) 123-4567',
                'city': 'Austin',
                'state': 'TX'
            }
        ]
    
    # Replace method for testing
    analyzer.get_all_suppliers_with_websites = get_test_suppliers
    
    # Run small batch
    await analyzer.run_batch_analysis(batch_size=2, max_concurrent=1)

if __name__ == "__main__":
    asyncio.run(test_run())
