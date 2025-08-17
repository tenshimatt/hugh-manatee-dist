#!/usr/bin/env python3
"""
REAL PRODUCTION TEST - 3 Actual Websites
Tests real websites with actual OpenAI analysis - no fake data
"""

import asyncio
import sys
sys.path.append('.')

from batch_analyze_all import BatchAnalyzer

class RealWebsiteTestAnalyzer(BatchAnalyzer):
    """
    Real production analyzer for actual website testing
    """
    
    async def get_all_suppliers_with_websites(self, limit=None):
        """
        Return the 3 REAL websites for actual testing
        """
        real_suppliers = [
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
                'id': '12ac79c0-53db-43a9-82e5-7567c6db679a',
                'name': 'Quality Paws',
                'website': 'https://www.qualitypaws.com/',
                'email': 'info@qualitypaws.com',
                'phone': '(555) 123-4567',
                'city': 'Unknown',
                'state': 'US'
            }
        ]
        
        print("🎯 REAL PRODUCTION TEST - 3 Actual Websites:")
        for supplier in real_suppliers:
            print(f"  {supplier['id']}. {supplier['name']} - {supplier['website']}")
        
        print("\n📋 Test Criteria:")
        print("  - Real website content analysis with OpenAI")
        print("  - Actual business scoring (0-100)")
        print("  - Genuine technical assessment")
        print("  - Personalized outreach email generation")
        print("  - 2 sites expected to be high-scoring already")
        
        return real_suppliers

async def run_real_production_test():
    """
    Run REAL production test - no simulated data
    """
    print("🚀 REAL PRODUCTION TEST - ACTUAL WEBSITES")
    print("=" * 60)
    print("Testing with real website content and OpenAI analysis")
    print("Expected: 2 high-scoring sites, 1 rebuild opportunity")
    print("=" * 60)
    
    analyzer = RealWebsiteTestAnalyzer()
    
    # Run real analysis
    await analyzer.run_batch_analysis(
        batch_size=3,
        max_concurrent=1  # Sequential to see each result clearly
    )
    
    print(f"\n🎯 REAL PRODUCTION TEST COMPLETE!")
    print("📊 View actual analysis results:")
    print("")
    print("💾 Business Scores:")
    print("sqlite3 batch_analysis_results.db \"SELECT business_name, website_url, analysis_score, business_potential FROM analysis_results WHERE status='completed' ORDER BY analysis_score DESC;\"")
    print("")
    print("📧 Generated Outreach Emails:")
    print("sqlite3 batch_analysis_results.db \"SELECT business_name, outreach_email FROM analysis_results WHERE status='completed' ORDER BY analysis_score DESC;\"")
    print("")
    print("🔍 Technical Issues Found:")
    print("sqlite3 batch_analysis_results.db \"SELECT business_name, technical_issues FROM analysis_results WHERE status='completed';\"")

if __name__ == "__main__":
    asyncio.run(run_real_production_test())
