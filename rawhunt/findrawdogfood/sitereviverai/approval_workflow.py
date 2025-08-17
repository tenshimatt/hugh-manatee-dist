#!/usr/bin/env python3
"""
SiteReviverAI - Manual Approval Workflow
Crawl websites → Save to database → Manual approval → Send emails
"""

import asyncio
import json
import os
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional
import colorsys

class SiteReviverAIApprovalWorkflow:
    def __init__(self):
        self.db_path = "/Users/mattwright/pandora/findrawdogfood/sitereviverai/approval_database.db"
        self.logo_path = "/Users/mattwright/pandora/findrawdogfood/logomin.png"
        
    async def setup_database(self):
        """Create approval workflow database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables for approval workflow
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS website_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                website_url TEXT NOT NULL,
                city TEXT,
                state TEXT,
                phone TEXT,
                
                -- Analysis Results
                lighthouse_score INTEGER,
                mobile_responsive BOOLEAN,
                design_age_score INTEGER,
                issues_found TEXT, -- JSON array
                
                -- Brand Analysis
                primary_color TEXT,
                secondary_color TEXT,
                logo_extracted BOOLEAN,
                brand_palette TEXT, -- JSON array of colors
                
                -- Content Analysis
                original_content TEXT, -- JSON object
                rewritten_content TEXT, -- JSON object
                
                -- Generated Designs
                design1_url TEXT,
                design2_url TEXT,
                appendix_url TEXT,
                
                -- Approval Workflow
                status TEXT DEFAULT 'pending_review', -- pending_review, approved, rejected, email_sent
                reviewed_at DATETIME,
                approved_by TEXT,
                rejection_reason TEXT,
                
                -- Email Tracking
                email_subject TEXT,
                email_content TEXT,
                email_sent_at DATETIME,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create approval tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS approval_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER,
                approval_token TEXT UNIQUE,
                reviewer_email TEXT,
                status TEXT DEFAULT 'pending', -- pending, approved, rejected
                approved_at DATETIME,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (analysis_id) REFERENCES website_analysis (id)
            )
        """)
        
        conn.commit()
        conn.close()
        print("✅ Approval workflow database initialized")
        
    async def crawl_and_analyze_websites(self, limit: int = 10):
        """Step 1: Crawl all websites and save analysis to database"""
        print(f"🕷️ Starting website crawl and analysis (limit: {limit})")
        
        # Mock supplier data (replace with real D1 query)
        suppliers = [
            {"name": "Natural Paws Raw Dog Food", "website": "https://naturalpaws.com", "city": "Austin", "state": "TX", "phone": "(512) 555-0198"},
            {"name": "Healthy Hounds Raw Kitchen", "website": "https://healthyhoundsraw.com", "city": "Portland", "state": "OR", "phone": "(503) 555-0147"},
            {"name": "Prime K9 Nutrition", "website": "https://primek9nutrition.net", "city": "Denver", "state": "CO", "phone": "(303) 555-0156"},
            {"name": "Raw Dog Food Company", "website": "https://rawdogfoodco.com", "city": "Seattle", "state": "WA", "phone": "(206) 555-0123"},
            {"name": "Paws & Claws Raw", "website": "https://pawsclawsraw.com", "city": "Phoenix", "state": "AZ", "phone": "(602) 555-0189"},
        ]
        
        for i, supplier in enumerate(suppliers[:limit]):
            print(f"\n📊 Analyzing {i+1}/{limit}: {supplier['name']}")
            
            # Analyze website
            analysis = await self.analyze_website_comprehensive(supplier)
            
            # Extract brand colors and logo
            brand_data = await self.extract_brand_elements(supplier['website'])
            
            # Generate content
            content_data = await self.generate_content(supplier, analysis)
            
            # Generate dual designs
            designs = await self.generate_designs_with_branding(supplier, content_data, brand_data)
            
            # Save to database
            analysis_id = await self.save_analysis_to_database(supplier, analysis, brand_data, content_data, designs)
            
            print(f"   ✅ Saved analysis ID: {analysis_id}")
            
        print(f"\n🎯 Crawl complete! {len(suppliers[:limit])} websites analyzed")
        print("📧 Ready for manual review and approval")
        
    async def analyze_website_comprehensive(self, supplier: Dict) -> Dict:
        """Comprehensive website analysis"""
        url = supplier['website']
        
        # Mock comprehensive analysis (replace with real tools)
        url_hash = abs(hash(url))
        
        analysis = {
            'lighthouse_score': 35 + (url_hash % 40),  # 35-75
            'mobile_responsive': (url_hash % 3) > 0,  # 66% mobile ready
            'design_age_score': 2 + (url_hash % 5),   # 2-6
            'page_speed': 2.5 + (url_hash % 30) / 10, # 2.5-5.5 seconds
            'ssl_certificate': (url_hash % 4) > 0,    # 75% have SSL
            'seo_issues': [
                "Missing meta descriptions",
                "No structured data markup", 
                "Images missing alt text",
                "Slow loading speed",
                "No XML sitemap",
                "Poor mobile experience"
            ][:3 + (url_hash % 4)],  # 3-6 issues
            'accessibility_score': 60 + (url_hash % 30), # 60-90
            'estimated_monthly_loss': 150 + (url_hash % 300), # $150-450
        }
        
        return analysis
        
    async def extract_brand_elements(self, website_url: str) -> Dict:
        """Extract brand colors, logo, and visual elements"""
        print(f"   🎨 Extracting brand elements...")
        
        # Mock brand extraction (replace with real web scraping + image analysis)
        url_hash = abs(hash(website_url))
        
        # Generate realistic brand colors
        primary_hue = (url_hash % 360) / 360
        primary_color = self.hsv_to_hex(primary_hue, 0.7, 0.8)
        secondary_color = self.hsv_to_hex((primary_hue + 0.3) % 1, 0.5, 0.9)
        
        brand_data = {
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'logo_found': (url_hash % 3) > 0,  # 66% have extractable logos
            'logo_url': f"{website_url}/logo.png" if (url_hash % 3) > 0 else None,
            'brand_palette': [primary_color, secondary_color, '#FFFFFF', '#F8F9FA'],
            'font_families': ['Arial', 'Helvetica', 'sans-serif'],
            'brand_style': ['professional', 'modern', 'friendly', 'rustic'][url_hash % 4]
        }
        
        return brand_data
        
    def hsv_to_hex(self, h, s, v):
        """Convert HSV to hex color"""
        rgb = colorsys.hsv_to_rgb(h, s, v)
        return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))
        
    async def generate_content(self, supplier: Dict, analysis: Dict) -> Dict:
        """Generate rewritten content"""
        print(f"   📝 Generating optimized content...")
        
        content = {
            'headline': f"Transform Your Dog's Health with Premium Raw Nutrition",
            'subheading': f"Trusted by {supplier['city']} dog owners for optimal canine health",
            'value_proposition': f"At {supplier['name']}, we provide scientifically-formulated raw dog food that delivers measurable health improvements.",
            'services': [
                {'title': 'Premium Raw Dog Food', 'description': 'Human-grade ingredients, locally sourced'},
                {'title': 'Nutritional Consultation', 'description': 'Expert guidance for your dog\'s needs'},
                {'title': 'Custom Diet Plans', 'description': 'Personalized nutrition based on breed and age'},
                {'title': 'Convenient Delivery', 'description': 'Fresh meals delivered to your door'}
            ],
            'testimonial': {
                'text': f"Switching to {supplier['name']} transformed our dog's energy and health completely!",
                'author': 'Sarah M., Dog Owner'
            },
            'cta': 'Ready to see the difference? Start with a free consultation today.'
        }
        
        return content
        
    async def generate_designs_with_branding(self, supplier: Dict, content: Dict, brand_data: Dict) -> Dict:
        """Generate designs incorporating brand colors and logo"""
        print(f"   🎨 Generating branded designs...")
        
        business_slug = supplier['name'].lower().replace(' ', '-').replace('&', 'and')[:20]
        
        designs = {
            'design1': {
                'title': 'Professional & Clean',
                'description': f'Trustworthy design using your brand colors ({brand_data["primary_color"]}) for credibility and conversions.',
                'preview_url': f"https://{business_slug}-professional.sitereviver.pages.dev",
                'brand_integration': {
                    'primary_color': brand_data['primary_color'],
                    'secondary_color': brand_data['secondary_color'],
                    'logo_placement': 'top-left header',
                    'color_usage': 'CTA buttons, headers, accents'
                }
            },
            'design2': {
                'title': 'Modern Science-Backed UI',
                'description': f'Cutting-edge design with your brand identity ({brand_data["brand_style"]}) and color psychology optimization.',
                'preview_url': f"https://{business_slug}-science.sitereviver.pages.dev",
                'brand_integration': {
                    'primary_color': brand_data['primary_color'],
                    'secondary_color': brand_data['secondary_color'],
                    'logo_placement': 'floating nav, footer',
                    'color_usage': 'Gradients, interactive elements, trust signals'
                }
            },
            'appendix_url': f"https://design-science-{business_slug}.sitereviver.pages.dev"
        }
        
        return designs
        
    async def save_analysis_to_database(self, supplier: Dict, analysis: Dict, brand_data: Dict, content: Dict, designs: Dict) -> int:
        """Save complete analysis to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO website_analysis (
                business_name, website_url, city, state, phone,
                lighthouse_score, mobile_responsive, design_age_score, issues_found,
                primary_color, secondary_color, logo_extracted, brand_palette,
                original_content, rewritten_content,
                design1_url, design2_url, appendix_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            supplier['name'], supplier['website'], supplier['city'], supplier['state'], supplier['phone'],
            analysis['lighthouse_score'], analysis['mobile_responsive'], analysis['design_age_score'], 
            json.dumps(analysis['seo_issues']),
            brand_data['primary_color'], brand_data['secondary_color'], brand_data['logo_found'],
            json.dumps(brand_data['brand_palette']),
            json.dumps({}), json.dumps(content),  # original content would be scraped
            designs['design1']['preview_url'], designs['design2']['preview_url'], designs['appendix_url']
        ))
        
        analysis_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return analysis_id
        
    async def generate_approval_emails(self, reviewer_email: str = "tenshimatt@gmail.com"):
        """Step 2: Generate approval emails for manual review"""
        print(f"📧 Generating approval emails for: {reviewer_email}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get pending analyses
        cursor.execute("""
            SELECT * FROM website_analysis 
            WHERE status = 'pending_review'
            ORDER BY created_at DESC
        """)
        
        pending_analyses = cursor.fetchall()
        
        if not pending_analyses:
            print("✅ No pending analyses found")
            return
            
        for analysis in pending_analyses:
            analysis_id = analysis[0]
            business_name = analysis[1]
            
            # Generate unique approval token
            approval_token = f"approve_{analysis_id}_{abs(hash(business_name))}"
            
            # Create approval request
            cursor.execute("""
                INSERT INTO approval_requests (analysis_id, approval_token, reviewer_email)
                VALUES (?, ?, ?)
            """, (analysis_id, approval_token, reviewer_email))
            
            # Generate approval email
            approval_email = self.create_approval_email(analysis, approval_token)
            
            # Save email to file for review
            email_file = f"/Users/mattwright/pandora/findrawdogfood/sitereviverai/approval_email_{analysis_id}.html"
            with open(email_file, 'w') as f:
                f.write(approval_email)
                
            print(f"✅ Approval email generated: {business_name}")
            print(f"   📄 File: {email_file}")
            
        conn.commit()
        conn.close()
        
        print(f"\n🎯 Generated {len(pending_analyses)} approval emails")
        print("📧 Review emails and click Approve/Reject buttons")
        
    def create_approval_email(self, analysis, approval_token: str) -> str:
        """Create manual approval email with analysis details"""
        
        # Parse JSON fields (handle database column indices)
        issues = json.loads(analysis[9]) if analysis[9] and isinstance(analysis[9], str) else []
        brand_palette = json.loads(analysis[13]) if analysis[13] and isinstance(analysis[13], str) else []
        content = json.loads(analysis[15]) if analysis[15] and isinstance(analysis[15], str) else {}
        
        # Generate HTML strings to avoid f-string escaping issues
        issues_list_html = ''.join([f'<li>{issue}</li>' for issue in issues])
        brand_swatches_html = ''.join([f'<span class="color-swatch" style="background: {color};"></span>' for color in brand_palette])
        default_value_prop = f'At {analysis[1]}, we provide scientifically-formulated raw dog food.'
        default_headline = 'Transform Your Dog\'s Health with Premium Raw Nutrition'
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>SiteReviverAI - Manual Approval Required</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
        .container {{ max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .analysis-section {{ background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }}
        .approval-buttons {{ text-align: center; margin: 30px 0; }}
        .approve-btn {{ background: #28a745; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; margin: 0 10px; font-weight: bold; }}
        .reject-btn {{ background: #dc3545; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; margin: 0 10px; font-weight: bold; }}
        .metric {{ display: inline-block; background: white; padding: 10px 15px; border-radius: 6px; margin: 5px; text-align: center; }}
        .color-swatch {{ display: inline-block; width: 30px; height: 30px; border-radius: 50%; margin: 0 5px; vertical-align: middle; }}
        .issue-list {{ list-style: none; padding: 0; }}
        .issue-list li {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
        .issue-list li:before {{ content: "❌ "; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Manual Approval Required</h1>
            <h2>{analysis[1]} - Website Analysis</h2>
            <p>Review analysis and approve/reject for email campaign</p>
        </div>
        
        <div class="content">
            <div class="analysis-section">
                <h3>📊 Website Analysis Results</h3>
                <div>
                    <div class="metric">
                        <strong>{analysis[5]}/100</strong><br>
                        <small>Performance</small>
                    </div>
                    <div class="metric">
                        <strong>{analysis[7]}/10</strong><br>
                        <small>Design Age</small>
                    </div>
                    <div class="metric">
                        <strong>{'✅' if analysis[6] else '❌'}</strong><br>
                        <small>Mobile Ready</small>
                    </div>
                </div>
                
                <h4>Issues Found:</h4>
                <ul class="issue-list">
                    {issues_list_html}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>🎨 Brand Analysis</h3>
                <p><strong>Primary Color:</strong> 
                   <span class="color-swatch" style="background: {analysis[10]};"></span>
                   {analysis[10]}
                </p>
                <p><strong>Secondary Color:</strong> 
                   <span class="color-swatch" style="background: {analysis[11]};"></span>
                   {analysis[11]}
                </p>
                <p><strong>Logo Found:</strong> {'✅ Yes' if analysis[12] else '❌ No'}</p>
                <p><strong>Brand Palette:</strong></p>
                <div>
                    {brand_swatches_html}
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>📝 Generated Content Preview</h3>
                <h4>Headline:</h4>
                <p>"{content.get('headline', default_headline)}"</p>
                
                <h4>Value Proposition:</h4>
                <p>"{content.get('value_proposition', default_value_prop)}"</p>
            </div>
            
            <div class="analysis-section">
                <h3>🌐 Generated Design Previews</h3>
                <p><strong>Design 1:</strong> <a href="{analysis[15]}" target="_blank">Professional & Clean →</a></p>
                <p><strong>Design 2:</strong> <a href="{analysis[16]}" target="_blank">Modern Science-Backed UI →</a></p>
                <p><strong>Appendix:</strong> <a href="{analysis[17]}" target="_blank">Design Science Explanation →</a></p>
            </div>
            
            <div class="approval-buttons">
                <h3>🎯 Approval Decision</h3>
                <p>Review the analysis above and decide:</p>
                
                <a href="mailto:sitereviver-approval@findrawdogfood.com?subject=APPROVE-{approval_token}&body=Analysis looks good, proceed with email campaign." 
                   class="approve-btn">
                   ✅ APPROVE & SEND EMAIL
                </a>
                
                <a href="mailto:sitereviver-approval@findrawdogfood.com?subject=REJECT-{approval_token}&body=Please reject this analysis. Reason: " 
                   class="reject-btn">
                   ❌ REJECT & SKIP
                </a>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h4>📋 Approval Process:</h4>
                <ol>
                    <li>Review website analysis and brand extraction quality</li>
                    <li>Check design preview links work correctly</li>
                    <li>Verify content is appropriate and compelling</li>
                    <li>Click APPROVE to send email to business owner</li>
                    <li>Click REJECT if analysis needs improvement</li>
                </ol>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                <p><strong>Business Details:</strong></p>
                <p>{analysis[1]} • {analysis[2]} • {analysis[3]}, {analysis[4]} • {analysis[8]}</p>
                <p><strong>Analysis ID:</strong> {analysis[0]} • <strong>Token:</strong> {approval_token}</p>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
    async def process_approval_response(self, approval_token: str, decision: str, notes: str = ""):
        """Step 3: Process approval/rejection and send emails accordingly"""
        print(f"⚖️ Processing approval: {approval_token} - {decision}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update approval request
        cursor.execute("""
            UPDATE approval_requests 
            SET status = ?, approved_at = ?, notes = ?
            WHERE approval_token = ?
        """, (decision, datetime.now(), notes, approval_token))
        
        # Get analysis details
        cursor.execute("""
            SELECT wa.* FROM website_analysis wa
            JOIN approval_requests ar ON wa.id = ar.analysis_id
            WHERE ar.approval_token = ?
        """, (approval_token,))
        
        analysis = cursor.fetchone()
        
        if analysis and decision == 'approved':
            # Update analysis status
            cursor.execute("""
                UPDATE website_analysis 
                SET status = 'approved', reviewed_at = ?, approved_by = ?
                WHERE id = ?
            """, (datetime.now(), "tenshimatt@gmail.com", analysis[0]))
            
            # Generate and send customer email
            await self.send_customer_email(analysis)
            
            print(f"✅ Approved and email sent: {analysis[1]}")
            
        elif analysis and decision == 'rejected':
            cursor.execute("""
                UPDATE website_analysis 
                SET status = 'rejected', reviewed_at = ?
                WHERE id = ?
            """, (datetime.now(), analysis[0]))
            
            print(f"❌ Rejected: {analysis[1]} - {notes}")
            
        conn.commit()
        conn.close()
        
    async def send_customer_email(self, analysis):
        """Send final email to customer with approved designs"""
        # This would integrate with the production email template
        # but with the extracted brand colors and logo
        print(f"📧 Sending customer email: {analysis[1]}")
        # Implementation would use the brand-aware email template

if __name__ == "__main__":
    async def main():
        workflow = SiteReviverAIApprovalWorkflow()
        
        print("🚀 SiteReviverAI - Manual Approval Workflow")
        print("=" * 50)
        
        # Setup database
        await workflow.setup_database()
        
        # Step 1: Crawl and analyze websites
        await workflow.crawl_and_analyze_websites(limit=5)
        
        # Step 2: Generate approval emails
        await workflow.generate_approval_emails("tenshimatt@gmail.com")
        
        print("\n🎯 Workflow Ready!")
        print("📧 Check approval emails and click Approve/Reject")
        print("⚡ On approval, customer emails will be sent automatically")
    
    asyncio.run(main())
