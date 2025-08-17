#!/usr/bin/env python3
"""
Quick test to populate the dashboard with sample data
"""

import asyncio
import os

async def populate_dashboard():
    """Add some sample data to test the dashboard"""
    print("🧪 Populating dashboard with test data...")
    
    # Change to correct directory
    os.chdir('/Users/mattwright/pandora/findrawdogfood/sitereviverai')
    
    try:
        from simplified_production import SimplifiedSiteReviverAI
        
        system = SimplifiedSiteReviverAI()
        print("   📊 Processing 3 sample suppliers...")
        
        results = await system.process_supplier_batch(limit=3)
        
        print(f"   ✅ Generated {len(results)} analyses for dashboard")
        print("   📧 Approval emails created")
        print("   👀 Customer email previews ready")
        print("")
        print("🎯 Dashboard is now ready with data!")
        print("🌐 Open http://localhost:5001 to view")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(populate_dashboard())
