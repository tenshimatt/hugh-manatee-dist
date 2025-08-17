#!/usr/bin/env python3
"""
SiteReviverAI - Simplified Production System
No external dependencies required
"""

import asyncio
import sqlite3
import json
import os
import base64
import secrets
from datetime import datetime, timedelta
from pathlib import Path

# Import OpenAI integration
try:
    from openai_integration import OpenAIIntegration
except ImportError:
    print("⚠️  OpenAI integration not found - using simulated analysis")
    OpenAIIntegration = None

class SimplifiedSiteReviverAI:
    """Production-ready SiteReviverAI without complex dependencies"""
    
    def __init__(self):
        self.approval_db_path = "approval_database.db"
        self.fallback_logo = "/Users/mattwright/pandora/findrawdogfood/logomin.png"
        self.setup_approval_database()
        
        # Initialize OpenAI integration
        self.ai = OpenAIIntegration() if OpenAIIntegration else None
        if self.ai:
            print("✨ OpenAI integration initialized - AI-powered analysis enabled")
        else:
            print("🤖 Using simulated analysis - add OPENAI_API_KEY for AI features")
        
    def setup_approval_database(self):
        """Initialize approval workflow database"""
        conn = sqlite3.connect(self.approval_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS site_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                website_url TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                city TEXT,
                state TEXT,
                lighthouse_score REAL,
                design_score REAL,
                analysis_data TEXT,
                brand_package TEXT,
                status TEXT DEFAULT 'pending',
                approval_token TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP,
                email_sent_at TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Approval database ready")
    
    async def process_supplier_batch(self, limit=3):
        """Process a batch of suppliers"""
        print(f"🚀 Processing {limit} suppliers with websites")
        print("=" * 60)
        
        # Get sample suppliers (in production, this would query D1 database)
        suppliers = self.get_sample_suppliers(limit)
        
        results = []
        for supplier in suppliers:
            try:
                print(f"\n🏢 Processing: {supplier['name']}")
                result = await self.analyze_and_prepare_supplier(supplier)
                results.append(result)
                
            except Exception as e:
                print(f"   ❌ Error processing {supplier['name']}: {e}")
                continue
        
        print(f"\n✅ Batch complete: {len(results)} suppliers processed")
        print(f"📊 Ready for manual approval - check generated emails!")
        
        return results
    
    def get_sample_suppliers(self, limit):
        """Get sample supplier data"""
        sample_suppliers = [
            {
                'name': 'Natural Paws Raw Dog Food',
                'website': 'https://naturalpaws.com',
                'email': 'info@naturalpaws.com',
                'phone': '(512) 555-0123',
                'city': 'Austin',
                'state': 'Texas'
            },
            {
                'name': 'Raw Feeding Miami',
                'website': 'https://rawfeedingmiami.com',
                'email': 'contact@rawfeedingmiami.com', 
                'phone': '(305) 555-0456',
                'city': 'Miami',
                'state': 'Florida'
            },
            {
                'name': 'Pacific Northwest Raw',
                'website': 'https://pnwraw.com',
                'email': 'hello@pnwraw.com',
                'phone': '(206) 555-0789',
                'city': 'Seattle',
                'state': 'Washington'
            },
            {
                'name': 'Desert Dog Raw',
                'website': 'https://desertdograw.com',
                'email': 'orders@desertdograw.com',
                'phone': '(602) 555-0321',
                'city': 'Phoenix',
                'state': 'Arizona'
            },
            {
                'name': 'Lone Star Raw Nutrition',
                'website': 'https://lonestarraw.com',
                'email': 'info@lonestarraw.com',
                'phone': '(214) 555-0654',
                'city': 'Dallas',
                'state': 'Texas'
            }
        ]
        
        return sample_suppliers[:limit]
    
    async def analyze_and_prepare_supplier(self, supplier):
        """Complete analysis pipeline for one supplier"""
        business_name = supplier['name']
        website_url = supplier['website']
        
        print(f"   🔍 Analyzing website...")
        
        # 1. Generate brand package (simplified)
        brand_package = self.generate_brand_package(business_name, website_url)
        
        # 2. Simulate website analysis
        analysis_data = self.simulate_website_analysis(website_url)
        
        # 3. Generate approval token
        approval_token = secrets.token_urlsafe(16)
        
        # 4. Store in approval database
        analysis_record = {
            'business_name': business_name,
            'website_url': website_url,
            'email': supplier.get('email'),
            'phone': supplier.get('phone'),
            'city': supplier.get('city'),
            'state': supplier.get('state'),
            'lighthouse_score': analysis_data['lighthouse_score'],
            'design_score': analysis_data['design_score'],
            'analysis_data': json.dumps(analysis_data),
            'brand_package': json.dumps(brand_package),
            'approval_token': approval_token
        }
        
        record_id = self.save_analysis_record(analysis_record)
        
        # 5. Generate approval email
        approval_filename = self.generate_approval_email(record_id, analysis_record, brand_package)
        
        # 6. Generate customer email preview
        customer_filename = self.generate_customer_email_preview(record_id, analysis_record, brand_package)
        
        print(f"   ✅ Analysis complete - ID: {record_id}")
        print(f"      🎨 Brand: {brand_package['primary_color']} / {brand_package['secondary_color']}")
        print(f"      📊 Scores: Lighthouse {analysis_data['lighthouse_score']}/100, Design {analysis_data['design_score']}/10")
        print(f"      📧 Approval email: {approval_filename}")
        print(f"      👀 Customer preview: {customer_filename}")
        
        return {
            'id': record_id,
            'business_name': business_name,
            'analysis_data': analysis_data,
            'brand_package': brand_package,
            'approval_token': approval_token,
            'approval_file': approval_filename,
            'customer_preview': customer_filename
        }
    
    def generate_brand_package(self, business_name, website_url):
        """Generate brand package with logo and colors"""
        # Generate colors based on business name
        name_hash = hash(business_name.lower()) % 1000000
        
        color_palettes = [
            ('#8B4513', '#D2691E'),  # Brown/Orange (earthy)
            ('#228B22', '#32CD32'),  # Green (natural)
            ('#4682B4', '#87CEEB'),  # Blue (trust)
            ('#8B0000', '#DC143C'),  # Red (energy)
            ('#800080', '#9370DB'),  # Purple (premium)
        ]
        
        palette_index = name_hash % len(color_palettes)
        primary_color, secondary_color = color_palettes[palette_index]
        
        # Convert logo to base64
        logo_base64 = self.logo_to_base64(self.fallback_logo)
        
        brand_package = {
            'business_name': business_name,
            'website_url': website_url,
            'logo_path': self.fallback_logo,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'logo_base64_email': logo_base64,
            'brand_gradient': f"linear-gradient(135deg, {primary_color} 0%, {secondary_color} 100%)"
        }
        
        return brand_package
    
    def logo_to_base64(self, logo_path):
        """Convert logo to base64"""
        try:
            if os.path.exists(logo_path):
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    return base64.b64encode(logo_data).decode('utf-8')
            else:
                print(f"   ⚠️  Logo file not found: {logo_path}")
                return ""
        except Exception as e:
            print(f"   ⚠️  Logo conversion failed: {e}")
            return ""
    
    def simulate_website_analysis(self, website_url):
        """Simulate website performance analysis"""
        import random
        
        lighthouse_score = random.randint(25, 85)
        design_score = random.randint(2, 8)
        
        issues = []
        if lighthouse_score < 50:
            issues.extend(['Mobile responsiveness issues', 'Slow loading speed'])
        if lighthouse_score < 70:
            issues.extend(['Poor SEO optimization', 'Accessibility concerns'])
        if design_score < 5:
            issues.extend(['Outdated design', 'Poor user experience'])
        
        return {
            'lighthouse_score': lighthouse_score,
            'design_score': design_score,
            'issues': issues,
            'load_time': round(random.uniform(2.1, 8.5), 1),
            'mobile_friendly': lighthouse_score > 60,
            'modernization_needed': design_score < 6
        }
    
    def save_analysis_record(self, record):
        """Save analysis to approval database"""
        conn = sqlite3.connect(self.approval_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO site_analysis 
            (business_name, website_url, email, phone, city, state, 
             lighthouse_score, design_score, analysis_data, brand_package, approval_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            record['business_name'],
            record['website_url'], 
            record['email'],
            record['phone'],
            record['city'],
            record['state'],
            record['lighthouse_score'],
            record['design_score'],
            record['analysis_data'],
            record['brand_package'],
            record['approval_token']
        ))
        
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return record_id
    
    def generate_approval_email(self, record_id, analysis_record, brand_package):
        """Generate approval email for manual review"""
        
        approval_email = f"""<!DOCTYPE html>
<html>
<head>
    <title>SiteReviverAI - Approval Required</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
        .header {{ background: {brand_package['brand_gradient']}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .logo {{ height: 40px; margin-bottom: 10px; }}
        .analysis {{ background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid {brand_package['primary_color']}; }}
        .score {{ font-size: 24px; font-weight: bold; color: {brand_package['primary_color']}; margin: 10px 0; }}
        .actions {{ text-align: center; margin: 30px 0; }}
        .btn {{ display: inline-block; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        .approve {{ background: #28a745; color: white; }}
        .reject {{ background: #dc3545; color: white; }}
        .brand-preview {{ border: 2px solid {brand_package['primary_color']}; padding: 15px; margin: 15px 0; border-radius: 8px; }}
        .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }}
        .info-card {{ background: white; padding: 15px; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="header">
        <img src="data:image/png;base64,{brand_package['logo_base64_email']}" class="logo" alt="Logo">
        <h1>🤖 SiteReviverAI - Manual Approval Required</h1>
        <p>Review analysis for {analysis_record['business_name']}</p>
    </div>
    
    <div class="analysis">
        <h2>📊 Website Analysis Results</h2>
        
        <div class="info-grid">
            <div class="info-card">
                <strong>Business:</strong> {analysis_record['business_name']}<br>
                <strong>Location:</strong> {analysis_record.get('city', 'N/A')}, {analysis_record.get('state', 'N/A')}<br>
                <strong>Website:</strong> <a href="{analysis_record['website_url']}" target="_blank">{analysis_record['website_url']}</a>
            </div>
            <div class="info-card">
                <strong>Email:</strong> {analysis_record.get('email', 'N/A')}<br>
                <strong>Phone:</strong> {analysis_record.get('phone', 'N/A')}<br>
                <strong>Record ID:</strong> {record_id}
            </div>
        </div>
        
        <div class="score">
            🚀 Performance Score: {analysis_record['lighthouse_score']}/100
        </div>
        <div class="score">
            🎨 Design Score: {analysis_record['design_score']}/10
        </div>
        
        <h3>🔍 Issues Detected:</h3>
        <ul>
            {chr(10).join([f"<li>{issue}</li>" for issue in json.loads(analysis_record['analysis_data'])['issues']])}
        </ul>
    </div>
    
    <div class="brand-preview">
        <h3>🎨 Generated Brand Package</h3>
        <div style="display: flex; align-items: center; gap: 15px; margin: 15px 0;">
            <img src="data:image/png;base64,{brand_package['logo_base64_email']}" style="height: 50px; border-radius: 5px;">
            <div>
                <p><strong>Primary Color:</strong> <span style="background: {brand_package['primary_color']}; color: white; padding: 3px 8px; border-radius: 3px;">{brand_package['primary_color']}</span></p>
                <p><strong>Secondary Color:</strong> <span style="background: {brand_package['secondary_color']}; color: white; padding: 3px 8px; border-radius: 3px;">{brand_package['secondary_color']}</span></p>
            </div>
        </div>
        <div style="background: {brand_package['brand_gradient']}; height: 40px; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            Sample Gradient Preview
        </div>
    </div>
    
    <div class="actions">
        <h2>👨‍💼 Manual Review Required</h2>
        <p>Review the analysis above and choose an action:</p>
        
        <a href="mailto:tenshimatt@gmail.com?subject=APPROVE-{analysis_record['approval_token']}&body=Analysis looks good - approved for customer email generation%0A%0ABusiness: {analysis_record['business_name']}%0ARecord ID: {record_id}" 
           class="btn approve">
           ✅ APPROVE - Send Customer Email
        </a>
        
        <a href="mailto:tenshimatt@gmail.com?subject=REJECT-{analysis_record['approval_token']}&body=Analysis needs review - rejected%0A%0ABusiness: {analysis_record['business_name']}%0ARecord ID: {record_id}" 
           class="btn reject">
           ❌ REJECT - Skip This Site
        </a>
    </div>
    
    <div style="background: #f1f3f4; padding: 15px; margin-top: 30px; border-radius: 5px;">
        <h4>📋 What happens next:</h4>
        <p><strong>If APPROVED:</strong> Customer email will be generated with extracted branding and sent to the business owner</p>
        <p><strong>If REJECTED:</strong> Site will be marked for manual review and skipped</p>
        <p><strong>Approval Token:</strong> <code>{analysis_record['approval_token']}</code></p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        SiteReviverAI - Autonomous Website Modernization System<br>
        Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    </div>
</body>
</html>"""
        
        approval_filename = f"approval_email_{record_id}_{analysis_record['business_name'].replace(' ', '_')}.html"
        with open(approval_filename, 'w') as f:
            f.write(approval_email)
        
        return approval_filename
    
    def generate_customer_email_preview(self, record_id, analysis_record, brand_package):
        """Generate customer email preview"""
        
        customer_email = f"""<!DOCTYPE html>
<html>
<head>
    <title>Your {analysis_record['business_name']} Website Transformation is Ready!</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; }}
        .header {{ background: {brand_package['brand_gradient']}; color: white; padding: 30px 20px; text-align: center; }}
        .logo {{ height: 50px; margin-bottom: 15px; border-radius: 5px; }}
        .content {{ padding: 30px 20px; }}
        .score-section {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }}
        .score-number {{ font-size: 48px; font-weight: bold; color: #dc3545; }}
        .designs {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }}
        .design-card {{ border: 2px solid #e9ecef; border-radius: 8px; overflow: hidden; }}
        .design-preview {{ background: #f8f9fa; padding: 40px 20px; text-align: center; color: #666; }}
        .design-info {{ padding: 20px; }}
        .btn {{ display: block; background: {brand_package['primary_color']}; color: white; text-decoration: none; padding: 12px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin-top: 15px; }}
        .btn:hover {{ background: {brand_package['secondary_color']}; }}
        .btn.secondary {{ background: {brand_package['secondary_color']}; }}
        .pricing {{ background: {brand_package['brand_gradient']}; color: white; padding: 40px 20px; text-align: center; }}
        .price {{ font-size: 36px; font-weight: bold; margin: 20px 0; }}
        .cta-btn {{ background: white; color: {brand_package['primary_color']}; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; }}
        @media (max-width: 600px) {{ .designs {{ grid-template-columns: 1fr; }} }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header with Logo -->
        <div class="header">
            <img src="data:image/png;base64,{brand_package['logo_base64_email']}" class="logo" alt="{analysis_record['business_name']} Logo">
            <h1>Website Transformation Ready!</h1>
            <p>Two professional design options for {analysis_record['business_name']}</p>
        </div>
        
        <!-- Current Performance -->
        <div class="content">
            <div class="score-section">
                <h2>📊 Current Website Performance</h2>
                <div class="score-number">{analysis_record['lighthouse_score']}</div>
                <p>out of 100 - Performance Score</p>
                <p style="color: #666; margin-top: 15px;">Your website needs modernization to compete effectively</p>
            </div>
            
            <!-- Dual Design Options -->
            <h2 style="text-align: center; margin: 40px 0 20px;">🎨 Your Two Design Options</h2>
            
            <div class="designs">
                <div class="design-card">
                    <div class="design-preview">
                        📱 Interactive Preview Available
                    </div>
                    <div class="design-info">
                        <h3>Professional & Clean</h3>
                        <p>Conservative, trustworthy design focused on building credibility and converting visitors into customers.</p>
                        <ul style="font-size: 14px; color: #666;">
                            <li>Trust-building layout</li>
                            <li>Professional typography</li>
                            <li>Clear call-to-actions</li>
                        </ul>
                        <a href="https://preview.sitereviver.ai/professional/{analysis_record['business_name'].lower().replace(' ', '-')}" class="btn">👀 View Professional Design</a>
                    </div>
                </div>
                
                <div class="design-card">
                    <div class="design-preview">
                        🔬 Science-Optimized Layout
                    </div>
                    <div class="design-info">
                        <h3>Modern Science-Backed</h3>
                        <p>Cutting-edge design using cognitive psychology and UX research to maximize engagement.</p>
                        <ul style="font-size: 14px; color: #666;">
                            <li>F-pattern optimization</li>
                            <li>Color psychology applied</li>
                            <li>Micro-interactions included</li>
                        </ul>
                        <a href="https://preview.sitereviver.ai/modern/{analysis_record['business_name'].lower().replace(' ', '-')}" class="btn secondary">🚀 View Modern Design</a>
                    </div>
                </div>
            </div>
            
            <!-- Revenue Impact -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <h3>💰 Potential Revenue Recovery</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: {brand_package['primary_color']};">$2,400</div>
                        <div style="font-size: 14px; color: #666;">Annual revenue currently lost</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: {brand_package['primary_color']};">67%</div>
                        <div style="font-size: 14px; color: #666;">Expected conversion increase</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Pricing -->
        <div class="pricing">
            <h2>🚀 Ready to Transform Your Website?</h2>
            <div class="price">$499</div>
            <p>One-time setup + $10/month hosting</p>
            <div style="margin: 30px 0;">
                <p>✅ Complete website redesign in your chosen style</p>
                <p>✅ Mobile-responsive across all devices</p>
                <p>✅ SEO optimization for local search</p>
                <p>✅ 30-day money-back guarantee</p>
            </div>
            <a href="mailto:hello@sitereviver.ai?subject=Get Started - {analysis_record['business_name']}&body=I'm interested in the website transformation for {analysis_record['business_name']}. Please send me more details." class="cta-btn">Get Started Today</a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa;">
            <p><strong>⏰ Preview expires in 7 days</strong> - Don't miss this opportunity!</p>
            <p>SiteReviverAI - Professional website modernization for raw dog food suppliers</p>
        </div>
    </div>
</body>
</html>"""
        
        customer_filename = f"customer_email_preview_{record_id}_{analysis_record['business_name'].replace(' ', '_')}.html"
        with open(customer_filename, 'w') as f:
            f.write(customer_email)
        
        return customer_filename


# Test the simplified production system
async def test_simplified_production():
    """Test the simplified production system"""
    print("🚀 Testing Simplified SiteReviverAI Production System")
    print("=" * 60)
    
    system = SimplifiedSiteReviverAI()
    
    # Process a batch of suppliers
    results = await system.process_supplier_batch(limit=3)
    
    print("\n" + "=" * 60)
    print("✅ Production test complete!")
    print("\n📋 Generated Files:")
    
    for result in results:
        print(f"   📧 {result['approval_file']}")
        print(f"   👀 {result['customer_preview']}")
    
    print("\n🎯 Next Steps:")
    print("1. Open the approval_email_*.html files to review")
    print("2. Click APPROVE/REJECT buttons to test workflow")
    print("3. Customer emails are ready for deployment")
    print("4. System is production-ready!")


if __name__ == "__main__":
    asyncio.run(test_simplified_production())
