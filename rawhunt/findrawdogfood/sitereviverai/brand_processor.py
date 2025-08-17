#!/usr/bin/env python3
"""
SiteReviverAI - Brand Processing System
Extracts logos and brand colors, applies them consistently across all content
"""

import asyncio
import aiohttp
import base64
import requests
from PIL import Image, ImageDraw
import numpy as np
from urllib.parse import urljoin, urlparse
import os
import json
from pathlib import Path

class BrandProcessor:
    def __init__(self):
        self.fallback_logo = "/Users/mattwright/pandora/findrawdogfood/logomin.png"
        self.output_dir = Path("extracted_brands")
        self.output_dir.mkdir(exist_ok=True)
        
    async def extract_brand_package(self, website_url, business_name):
        """
        Extract complete brand package: logo, colors, typography
        Returns dict with all brand elements for consistent application
        """
        print(f"🎨 Extracting brand package for {business_name}")
        
        # 1. Try to extract logo from website
        logo_path = await self.extract_logo_from_website(website_url, business_name)
        
        # 2. Fallback to logomin.png if extraction fails
        if not logo_path or not os.path.exists(logo_path):
            print(f"   📂 Using fallback logo: {self.fallback_logo}")
            logo_path = self.fallback_logo
        
        # 3. Extract colors from logo
        primary_color, secondary_color = self.extract_colors_from_logo(logo_path)
        
        # 4. Process logo for different contexts
        logo_variants = self.generate_logo_variants(logo_path, business_name)
        
        # 5. Generate complete brand package
        brand_package = {
            'business_name': business_name,
            'website_url': website_url,
            'logo_path': logo_path,
            'logo_variants': logo_variants,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'logo_base64_email': self.logo_to_base64(logo_variants['email']),
            'logo_base64_website': self.logo_to_base64(logo_variants['website']),
            'css_variables': self.generate_css_variables(primary_color, secondary_color)
        }
        
        print(f"   ✅ Brand package ready: {primary_color} / {secondary_color}")
        return brand_package
    
    async def extract_logo_from_website(self, website_url, business_name):
        """
        Scrape website to find and download logo
        """
        try:
            print(f"   🕷️  Scanning website for logo...")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(website_url, timeout=10) as response:
                    if response.status != 200:
                        return None
                    
                    html = await response.text()
                    
            # Common logo selectors
            logo_selectors = [
                'img[class*="logo"]',
                'img[id*="logo"]', 
                'img[alt*="logo"]',
                'img[src*="logo"]',
                '.logo img',
                '#logo img',
                'header img:first-child',
                '.header img:first-child',
                '.navbar img:first-child',
                'nav img:first-child'
            ]
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            for selector in logo_selectors:
                try:
                    logo_img = soup.select_one(selector.replace('[', '').replace(']', ''))
                    if logo_img and logo_img.get('src'):
                        logo_url = urljoin(website_url, logo_img['src'])
                        
                        # Download and save logo
                        logo_path = await self.download_logo(logo_url, business_name)
                        if logo_path:
                            print(f"   ✅ Logo extracted: {logo_url}")
                            return logo_path
                except:
                    continue
            
            # Try favicon as fallback
            favicon_links = soup.find_all('link', rel=['icon', 'shortcut icon', 'apple-touch-icon'])
            for link in favicon_links:
                if link.get('href'):
                    favicon_url = urljoin(website_url, link['href'])
                    logo_path = await self.download_logo(favicon_url, business_name)
                    if logo_path:
                        print(f"   ✅ Favicon used as logo: {favicon_url}")
                        return logo_path
            
            return None
            
        except Exception as e:
            print(f"   ⚠️  Logo extraction failed: {e}")
            return None
    
    async def download_logo(self, logo_url, business_name):
        """
        Download logo image and save locally
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(logo_url, timeout=10) as response:
                    if response.status != 200:
                        return None
                    
                    content = await response.read()
                    
                    # Determine file extension
                    content_type = response.headers.get('content-type', '')
                    if 'image/png' in content_type:
                        ext = '.png'
                    elif 'image/jpeg' in content_type or 'image/jpg' in content_type:
                        ext = '.jpg'
                    elif 'image/svg' in content_type:
                        ext = '.svg'
                    else:
                        ext = '.png'  # Default
                    
                    # Save file
                    safe_name = "".join(c for c in business_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
                    logo_path = self.output_dir / f"{safe_name}_logo{ext}"
                    
                    with open(logo_path, 'wb') as f:
                        f.write(content)
                    
                    # Validate it's a proper image
                    try:
                        with Image.open(logo_path) as img:
                            if img.size[0] > 10 and img.size[1] > 10:  # Minimum size check
                                return str(logo_path)
                    except:
                        os.remove(logo_path)
                        return None
                        
        except Exception as e:
            print(f"   ⚠️  Logo download failed: {e}")
            return None
    
    def extract_colors_from_logo(self, logo_path):
        """
        Extract dominant colors from logo image
        """
        try:
            print(f"   🎨 Extracting colors from logo...")
            
            with Image.open(logo_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize for processing
                img = img.resize((150, 150))
                
                # Get pixel data
                pixels = list(img.getdata())
                
                # Remove white/light pixels (likely background)
                filtered_pixels = [
                    pixel for pixel in pixels 
                    if sum(pixel) < 700  # Exclude very light pixels
                ]
                
                if not filtered_pixels:
                    filtered_pixels = pixels  # Use all if no dark pixels
                
                # Calculate most common colors
                from collections import Counter
                color_counts = Counter(filtered_pixels)
                
                # Get dominant colors
                dominant_colors = color_counts.most_common(5)
                
                # Convert to hex
                primary = self.rgb_to_hex(dominant_colors[0][0])
                
                # Find complementary secondary color
                if len(dominant_colors) > 1:
                    secondary = self.rgb_to_hex(dominant_colors[1][0])
                else:
                    # Generate complementary color
                    secondary = self.generate_complementary_color(primary)
                
                print(f"   ✅ Colors extracted: {primary} (primary), {secondary} (secondary)")
                return primary, secondary
                
        except Exception as e:
            print(f"   ⚠️  Color extraction failed: {e}")
            # Return default business-appropriate colors
            return '#2563eb', '#7c3aed'  # Blue/Purple
    
    def generate_logo_variants(self, logo_path, business_name):
        """
        Generate different sizes/formats of logo for various contexts
        """
        try:
            variants = {}
            
            with Image.open(logo_path) as img:
                # Email header logo (40px height)
                email_logo = img.copy()
                email_logo.thumbnail((200, 40), Image.Resampling.LANCZOS)
                email_path = self.output_dir / f"{business_name}_email_logo.png"
                email_logo.save(email_path, 'PNG')
                variants['email'] = str(email_path)
                
                # Website header logo (60px height)
                website_logo = img.copy()
                website_logo.thumbnail((300, 60), Image.Resampling.LANCZOS)
                website_path = self.output_dir / f"{business_name}_website_logo.png"
                website_logo.save(website_path, 'PNG')
                variants['website'] = str(website_path)
                
                # Large logo for design appendix (100px height)
                large_logo = img.copy()
                large_logo.thumbnail((500, 100), Image.Resampling.LANCZOS)
                large_path = self.output_dir / f"{business_name}_large_logo.png"
                large_logo.save(large_path, 'PNG')
                variants['large'] = str(large_path)
            
            print(f"   ✅ Generated logo variants: email, website, large")
            return variants
            
        except Exception as e:
            print(f"   ⚠️  Logo variant generation failed: {e}")
            # Return original logo for all variants
            return {
                'email': logo_path,
                'website': logo_path,
                'large': logo_path
            }
    
    def logo_to_base64(self, logo_path):
        """
        Convert logo to base64 for email embedding
        """
        try:
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                return base64.b64encode(logo_data).decode('utf-8')
        except:
            return None
    
    def rgb_to_hex(self, rgb):
        """
        Convert RGB tuple to hex color
        """
        return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    
    def generate_complementary_color(self, hex_color):
        """
        Generate a complementary color for variety
        """
        try:
            # Remove # if present
            hex_color = hex_color.lstrip('#')
            
            # Convert to RGB
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            
            # Generate complementary (opposite on color wheel)
            comp_r = 255 - r
            comp_g = 255 - g
            comp_b = 255 - b
            
            # Adjust brightness if too similar
            if abs(comp_r - r) + abs(comp_g - g) + abs(comp_b - b) < 150:
                comp_r = (comp_r + 100) % 255
                comp_g = (comp_g + 100) % 255
                comp_b = (comp_b + 100) % 255
            
            return f"#{comp_r:02x}{comp_g:02x}{comp_b:02x}"
            
        except:
            return '#7c3aed'  # Default purple
    
    def generate_css_variables(self, primary_color, secondary_color):
        """
        Generate CSS custom properties for consistent styling
        """
        return f"""
        :root {{
            --brand-primary: {primary_color};
            --brand-secondary: {secondary_color};
            --brand-primary-rgb: {self.hex_to_rgb_string(primary_color)};
            --brand-secondary-rgb: {self.hex_to_rgb_string(secondary_color)};
            --brand-gradient: linear-gradient(135deg, {primary_color} 0%, {secondary_color} 100%);
        }}
        """
    
    def hex_to_rgb_string(self, hex_color):
        """
        Convert hex to RGB string for CSS
        """
        try:
            hex_color = hex_color.lstrip('#')
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return f"{r}, {g}, {b}"
        except:
            return "37, 99, 235"  # Default blue


class BrandedTemplateGenerator:
    """
    Apply brand package to email and website templates
    """
    
    def __init__(self, brand_package):
        self.brand = brand_package
    
    def generate_branded_email(self, email_template, preview_urls):
        """
        Apply branding to email template
        """
        print(f"   📧 Generating branded email for {self.brand['business_name']}")
        
        # Replace template variables with brand data
        branded_email = email_template
        
        # Brand variables
        replacements = {
            '{{business_name}}': self.brand['business_name'],
            '{{logo_base64}}': self.brand['logo_base64_email'],
            '{{primary_color}}': self.brand['primary_color'],
            '{{secondary_color}}': self.brand['secondary_color'],
            '{{brand_gradient}}': f"linear-gradient(135deg, {self.brand['primary_color']} 0%, {self.brand['secondary_color']} 100%)",
            '{{preview_url_1}}': preview_urls.get('professional', '#'),
            '{{preview_url_2}}': preview_urls.get('modern', '#'),
            '{{website_url}}': self.brand['website_url']
        }
        
        for placeholder, value in replacements.items():
            branded_email = branded_email.replace(placeholder, value)
        
        print(f"   ✅ Branded email generated with logo and {self.brand['primary_color']} theme")
        return branded_email
    
    def generate_branded_website(self, site_template, content_data):
        """
        Apply branding to website template
        """
        print(f"   🌐 Generating branded website for {self.brand['business_name']}")
        
        # Replace template variables
        branded_site = site_template
        
        replacements = {
            '{{business_name}}': self.brand['business_name'],
            '{{logo_base64}}': self.brand['logo_base64_website'],
            '{{primary_color}}': self.brand['primary_color'],
            '{{secondary_color}}': self.brand['secondary_color'],
            '{{brand_css_variables}}': self.brand['css_variables'],
            '{{website_content}}': content_data.get('content', ''),
            '{{business_phone}}': content_data.get('phone', ''),
            '{{business_address}}': content_data.get('address', ''),
            '{{business_email}}': content_data.get('email', '')
        }
        
        for placeholder, value in replacements.items():
            branded_site = branded_site.replace(placeholder, value)
        
        print(f"   ✅ Branded website generated with {self.brand['primary_color']} theme")
        return branded_site


# Test the brand processing system
async def test_brand_processor():
    """
    Test brand extraction with real examples
    """
    print("🧪 Testing Brand Processing System")
    print("=" * 50)
    
    processor = BrandProcessor()
    
    # Test with actual logomin.png
    test_cases = [
        {
            'url': 'https://naturalpaws.com',
            'business': 'Natural Paws Raw Dog Food'
        },
        {
            'url': 'https://www.findrawdogfood.com',
            'business': 'Find Raw Dog Food'
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
        print(f"      Base64 ready: {len(brand_package['logo_base64_email'])} chars")
        
        # Save brand package for later use
        package_file = f"brand_package_{test['business'].replace(' ', '_')}.json"
        with open(package_file, 'w') as f:
            # Remove base64 data for JSON serialization
            save_package = brand_package.copy()
            save_package['logo_base64_email'] = '[BASE64_DATA]'
            save_package['logo_base64_website'] = '[BASE64_DATA]'
            json.dump(save_package, f, indent=2)
        
        print(f"   💾 Saved: {package_file}")

if __name__ == "__main__":
    asyncio.run(test_brand_processor())
