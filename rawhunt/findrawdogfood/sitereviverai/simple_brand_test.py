#!/usr/bin/env python3
"""
SiteReviverAI - Simple Brand Test
Test brand processing with minimal dependencies
"""

import asyncio
import base64
import os
import json
from pathlib import Path

class SimpleBrandProcessor:
    """Simplified brand processor for testing"""
    
    def __init__(self):
        self.fallback_logo = "/Users/mattwright/pandora/findrawdogfood/logomin.png"
        self.output_dir = Path("extracted_brands")
        self.output_dir.mkdir(exist_ok=True)
        
    async def extract_brand_package(self, website_url, business_name):
        """Extract brand package using fallback logo"""
        print(f"🎨 Extracting brand package for {business_name}")
        
        # Use fallback logo (logomin.png)
        logo_path = self.fallback_logo
        print(f"   📂 Using logo: {logo_path}")
        
        # Extract colors from business name (simple heuristic)
        primary_color, secondary_color = self.generate_brand_colors(business_name)
        
        # Convert logo to base64
        logo_base64 = self.logo_to_base64(logo_path)
        
        # Generate brand package
        brand_package = {
            'business_name': business_name,
            'website_url': website_url,
            'logo_path': logo_path,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'logo_base64_email': logo_base64,
            'logo_base64_website': logo_base64,
            'brand_gradient': f"linear-gradient(135deg, {primary_color} 0%, {secondary_color} 100%)"
        }
        
        print(f"   ✅ Brand package ready: {primary_color} / {secondary_color}")
        return brand_package
    
    def generate_brand_colors(self, business_name):
        """Generate brand colors based on business name"""
        # Simple color generation based on business name hash
        name_hash = hash(business_name.lower()) % 1000000
        
        # Color palettes for raw dog food businesses
        color_palettes = [
            ('#8B4513', '#D2691E'),  # Brown/Orange (earthy)
            ('#228B22', '#32CD32'),  # Green (natural)
            ('#4682B4', '#87CEEB'),  # Blue (trust)
            ('#8B0000', '#DC143C'),  # Red (energy)
            ('#800080', '#9370DB'),  # Purple (premium)
        ]
        
        palette_index = name_hash % len(color_palettes)
        return color_palettes[palette_index]
    
    def logo_to_base64(self, logo_path):
        """Convert logo to base64"""
        try:
            if os.path.exists(logo_path):
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    return base64.b64encode(logo_data).decode('utf-8')
            else:
                print(f"   ⚠️  Logo file not found: {logo_path}")
                return None
        except Exception as e:
            print(f"   ⚠️  Logo conversion failed: {e}")
            return None


async def test_simple_brand_processor():
    """Test the simple brand processor"""
    print("🧪 Testing Simple Brand Processing System")
    print("=" * 50)
    
    processor = SimpleBrandProcessor()
    
    # Test cases
    test_cases = [
        {
            'url': 'https://naturalpaws.com',
            'business': 'Natural Paws Raw Dog Food'
        },
        {
            'url': 'https://rawfeedingmiami.com',
            'business': 'Raw Feeding Miami'
        },
        {
            'url': 'https://pnwraw.com',
            'business': 'Pacific Northwest Raw'
        }
    ]
    
    for test in test_cases:
        print(f"\n🎯 Testing: {test['business']}")
        
        brand_package = await processor.extract_brand_package(
            test['url'], 
            test['business']
        )
        
        print(f"   📦 Brand Package:")
        print(f"      Logo: {brand_package['logo_path']}")
        print(f"      Primary: {brand_package['primary_color']}")
        print(f"      Secondary: {brand_package['secondary_color']}")
        print(f"      Base64 ready: {'Yes' if brand_package['logo_base64_email'] else 'No'}")
        
        # Save brand package
        package_file = f"brand_package_{test['business'].replace(' ', '_')}.json"
        with open(package_file, 'w') as f:
            # Remove base64 for readability
            save_package = brand_package.copy()
            if save_package['logo_base64_email']:
                save_package['logo_base64_email'] = f"[BASE64_DATA_{len(save_package['logo_base64_email'])}_chars]"
                save_package['logo_base64_website'] = f"[BASE64_DATA_{len(save_package['logo_base64_website'])}_chars]"
            json.dump(save_package, f, indent=2)
        
        print(f"   💾 Saved: {package_file}")
        
        # Test email template generation
        await test_email_generation(brand_package)

async def test_email_generation(brand_package):
    """Test generating branded email"""
    print(f"   📧 Testing email generation...")
    
    # Simple email template
    email_template = """
<!DOCTYPE html>
<html>
<head>
    <title>{{business_name}} - Website Transformation Ready!</title>
    <style>
        .header { background: {{brand_gradient}}; color: white; padding: 20px; text-align: center; }
        .logo { height: 40px; margin-bottom: 10px; }
        .btn { background: {{primary_color}}; color: white; padding: 10px 20px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <img src="data:image/png;base64,{{logo_base64}}" class="logo" alt="Logo">
        <h1>{{business_name}} - Website Transformation Ready!</h1>
    </div>
    <div style="padding: 20px;">
        <h2>🎨 Your Two Design Options</h2>
        <a href="{{preview_url_1}}" class="btn">View Professional Design</a>
        <a href="{{preview_url_2}}" class="btn" style="background: {{secondary_color}};">View Modern Design</a>
    </div>
</body>
</html>
    """
    
    # Apply branding
    branded_email = email_template
    replacements = {
        '{{business_name}}': brand_package['business_name'],
        '{{logo_base64}}': brand_package['logo_base64_email'] or '',
        '{{primary_color}}': brand_package['primary_color'],
        '{{secondary_color}}': brand_package['secondary_color'],
        '{{brand_gradient}}': brand_package['brand_gradient'],
        '{{preview_url_1}}': f"https://preview.sitereviver.ai/professional/{brand_package['business_name'].replace(' ', '-').lower()}",
        '{{preview_url_2}}': f"https://preview.sitereviver.ai/modern/{brand_package['business_name'].replace(' ', '-').lower()}"
    }
    
    for placeholder, value in replacements.items():
        branded_email = branded_email.replace(placeholder, str(value))
    
    # Save branded email
    email_filename = f"test_email_{brand_package['business_name'].replace(' ', '_')}.html"
    with open(email_filename, 'w') as f:
        f.write(branded_email)
    
    print(f"   ✅ Branded email saved: {email_filename}")


if __name__ == "__main__":
    asyncio.run(test_simple_brand_processor())
