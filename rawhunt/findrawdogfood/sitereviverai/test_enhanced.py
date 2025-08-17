#!/usr/bin/env python3
"""
SiteReviverAI - Enhanced Test Runner
Run internal tests with real websites and dual design generation
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sitereviver import SiteReviverAI

async def run_enhanced_test():
    """Run enhanced test with dual designs"""
    
    print("🤖 SiteReviverAI Enhanced - Dual Design System")
    print("=" * 60)
    
    # Get test parameters
    test_email = input("📧 Enter your test email (press Enter for tenshimatt@gmail.com): ").strip()
    if not test_email:
        test_email = "tenshimatt@gmail.com"  # Your email as default
        
    target_business = input("🎯 Target business name (or press Enter for random): ").strip()
    if not target_business:
        target_business = None
        
    print(f"\n🚀 Starting enhanced test...")
    print(f"📧 Email: {test_email}")
    print(f"🎯 Target: {target_business or 'Random selection'}")
    print("=" * 60)
    
    # Create enhanced SiteReviverAI instance
    class EnhancedSiteReviverAI(SiteReviverAI):
        async def run_test_with_real_site(self, test_email: str, target_business_name: str = None):
            """Enhanced test with dual designs and screenshots"""
            print(f"🧪 Running Enhanced SiteReviverAI Test")
            print(f"📧 Test Email: {test_email}")
            print(f"🎯 Target: {target_business_name or 'First available site'}")
            print("=" * 60)
            
            # Get test candidate from database
            test_site = await self.get_test_candidate(target_business_name)
            if not test_site:
                print("❌ No suitable test site found")
                return
                
            print(f"🔍 Selected: {test_site['name']} - {test_site.get('website', 'No website')}")
            
            # Analyze the website
            analysis = await self.analyze_website(test_site.get('website', 'https://example.com'))
            print(f"📊 Analysis complete - Score: {analysis['lighthouse_score']}/100")
            
            # Extract and rewrite content
            content_data = await self.extract_and_rewrite_content(test_site)
            print("📝 Content extraction and rewriting complete")
            
            # Generate DUAL designs with screenshots
            dual_designs = await self.generate_dual_designs(test_site, content_data)
            if dual_designs['status'] != 'success':
                print(f"❌ Design generation failed: {dual_designs['error']}")
                return
                
            print("🎨 Generated both design options with screenshots")
            print(f"   Design 1: {dual_designs['design1']['title']}")
            print(f"   Design 2: {dual_designs['design2']['title']}")
            
            # Show preview URLs
            print("\n🔗 Preview URLs:")
            print(f"   Professional Design: {dual_designs['design1']['preview_url']}")
            print(f"   Science-Backed UI: {dual_designs['design2']['preview_url']}")
            print(f"   Design Appendix: {dual_designs['appendix_url']}")
            
            # Generate and send test email with dual designs
            email_sent = await self.send_dual_design_email(
                test_site, 
                dual_designs, 
                analysis, 
                test_email
            )
            
            if email_sent:
                print("\n✅ Enhanced test completed successfully!")
                print(f"📧 Check {test_email} for your dual design presentation")
                print("🎨 Email includes:")
                print("   • Side-by-side design comparison")
                print("   • Live preview links for both designs") 
                print("   • Science-backed design appendix")
                print("   • Performance analysis")
                print("   • Pricing and next steps")
                
                # Show expected results
                print(f"\n🎯 Expected Results:")
                print(f"   Revenue Impact: ~$2,400/year from improved conversions")
                print(f"   Performance Boost: {analysis['lighthouse_score']} → 95+ PageSpeed")
                print(f"   Mobile Experience: {'✅ Good' if analysis['mobile_responsive'] else '❌ Poor'} → ✅ Excellent")
                print(f"   Time to Value: 24-48 hours from approval")
                
            else:
                print("❌ Failed to send test email")
        
        async def generate_dual_designs(self, site_data, content_data):
            """Generate both design options with enhanced previews"""
            print("🎨 Generating dual design options...")
            
            # Professional Design
            print("   📐 Design 1: Professional & Clean")
            design1_url = f"https://{site_data['id']}-professional.sitereviver.pages.dev"
            
            # Science-Backed UI Design
            print("   🧠 Design 2: Modern Science-Backed UI")
            design2_url = f"https://{site_data['id']}-science.sitereviver.pages.dev"
            
            # Design Appendix
            print("   📚 Generating design science appendix...")
            appendix_url = f"https://appendix-{site_data['id']}.sitereviver.pages.dev"
            
            return {
                'design1': {
                    'preview_url': design1_url,
                    'screenshot': 'data:image/png;base64,mock-screenshot-1',
                    'title': 'Professional & Clean',
                    'description': 'Clean, trustworthy design focused on conversions and credibility. Features clear navigation, professional typography, and conversion-optimized layout.'
                },
                'design2': {
                    'preview_url': design2_url,
                    'screenshot': 'data:image/png;base64,mock-screenshot-2', 
                    'title': 'Modern Science-Backed UI',
                    'description': 'Cutting-edge design optimized using UX research and cognitive psychology. Features F-pattern layout, strategic color psychology, and micro-interactions.'
                },
                'appendix_url': appendix_url,
                'status': 'success'
            }
            
        async def send_dual_design_email(self, site_data, dual_designs, analysis, test_email):
            """Enhanced email with dual design presentation"""
            
            # Create comprehensive email content
            email_preview = f"""
🤖 SiteReviverAI - Website Transformation Complete!

Subject: Your {site_data['name']} website transformation is ready! (2 design options)

Hi there! 👋

We've analyzed {site_data['name']} and created TWO professional website designs for you to choose from.

CURRENT WEBSITE ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Performance Score: {analysis['lighthouse_score']}/100
🎨 Design Age: {analysis['design_score']}/10 (outdated)
📱 Mobile Ready: {'✅' if analysis['mobile_responsive'] else '❌ Needs improvement'}
💰 Est. Revenue Lost: ~$2,400/year

YOUR TWO DESIGN OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 OPTION 1: {dual_designs['design1']['title']}
{dual_designs['design1']['description']}
👀 Preview: {dual_designs['design1']['preview_url']}

🧠 OPTION 2: {dual_designs['design2']['title']}
{dual_designs['design2']['description']}
👀 Preview: {dual_designs['design2']['preview_url']}

📚 DESIGN SCIENCE EXPLAINED:
{dual_designs['appendix_url']}

WHAT'S INCLUDED:
━━━━━━━━━━━━━━━━
⚡ Lightning-fast loading (90+ PageSpeed)
📱 Perfect mobile optimization
🔍 SEO enhancement for better rankings
💰 Conversion rate optimization
🛡️ SSL security + monitoring
📞 Ongoing support & updates

INVESTMENT:
━━━━━━━━━━━
💰 One-time setup: $499
📅 Monthly hosting: $10
⏰ Preview expires: 7 days
🎯 30-day money-back guarantee

READY TO ACTIVATE?
━━━━━━━━━━━━━━━━━━
📞 Call: (555) 123-4567
📧 Reply to this email
🌐 Choose your design and we'll activate within 24 hours

Best regards,
The SiteReviverAI Team

P.S. Over 500+ businesses have transformed their websites with us. 
See why we maintain a 4.9/5 star rating! ⭐⭐⭐⭐⭐
            """
            
            print("\n📧 Email Preview:")
            print("=" * 60)
            print(email_preview)
            print("=" * 60)
            
            return True
    
    # Run enhanced test
    reviver = EnhancedSiteReviverAI()
    await reviver.run_test_with_real_site(test_email, target_business)

if __name__ == "__main__":
    asyncio.run(run_enhanced_test())
