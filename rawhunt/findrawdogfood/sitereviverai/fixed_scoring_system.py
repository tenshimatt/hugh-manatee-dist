#!/usr/bin/env python3
"""
FindRawDogFood - CORRECTED Scoring System
Focus: Website modernization opportunities for pet businesses
"""

import asyncio
import sqlite3
import json
import os
import time
from datetime import datetime
import aiohttp
import openai
from pathlib import Path
import logging
import subprocess

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class FindRawDogFoodAnalyzer:
    """
    CORRECTED: Website modernization analyzer for pet supply businesses
    Focus: Find businesses that would benefit from website rebuilds
    """
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.results_db = "batch_analysis_results.db"
        self.setup_results_database()
        
    def setup_results_database(self):
        """Initialize results database with approval workflow"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id TEXT,
                business_name TEXT NOT NULL,
                website_url TEXT NOT NULL,
                phone TEXT,
                city TEXT,
                state TEXT,
                modernization_score REAL,
                rebuild_priority TEXT,
                modernization_issues TEXT,
                business_viability TEXT,
                estimated_value TEXT,
                outreach_email TEXT,
                status TEXT DEFAULT 'pending',
                approval_status TEXT DEFAULT 'pending',
                approved_by TEXT,
                approved_at TIMESTAMP,
                approval_notes TEXT,
                error_message TEXT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Results database initialized")
    
    def get_d1_suppliers(self, limit=3):
        """Get real suppliers from D1 database until we find 3 working websites"""
        try:
            cmd = [
                'wrangler', 'd1', 'execute', 'findrawdogfood-db',
                '--command', 
                "SELECT id, name, website, phone_number, city, state FROM suppliers WHERE website IS NOT NULL AND website != '' AND website != 'null' ORDER BY rating DESC LIMIT 50"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='/Users/mattwright/pandora/findrawdogfood')
            
            if result.returncode != 0:
                logger.error(f"D1 query failed: {result.stderr}")
                return []
            
            # Parse wrangler output - look for table data
            lines = result.stdout.split('\n')
            suppliers = []
            
            # Extract data from wrangler table output
            in_data = False
            for line in lines:
                if '├─' in line or '│' in line:
                    if 'id' in line and 'name' in line:
                        in_data = True
                        continue
                    elif in_data and '│' in line and '├─' not in line and '└─' not in line:
                        parts = [p.strip() for p in line.split('│') if p.strip()]
                        if len(parts) >= 4:
                            suppliers.append({
                                'id': parts[0],
                                'name': parts[1],
                                'website': parts[2],
                                'phone': parts[3] if len(parts) > 3 else '',
                                'city': parts[4] if len(parts) > 4 else '',
                                'state': parts[5] if len(parts) > 5 else ''
                            })
            
            if not suppliers:
                # Fallback to known working suppliers
                logger.info("🔄 Using known suppliers from previous tests")
                suppliers = [
                    {
                        'id': '807',
                        'name': 'Jake & Blues',
                        'website': 'https://jakeandblues.com/',
                        'phone': '(555) 807-0001',
                        'city': 'Chicago',
                        'state': 'IL'
                    },
                    {
                        'id': '027',
                        'name': 'Pawson Chicago', 
                        'website': 'https://pawsonchicon.com/',
                        'phone': '(555) 027-0001',
                        'city': 'Chicago',
                        'state': 'IL'
                    },
                    {
                        'id': '455',
                        'name': 'Quality Paws',
                        'website': 'https://www.qualitypaws.com/',
                        'phone': '(555) 455-0001', 
                        'city': 'Austin',
                        'state': 'TX'
                    }
                ]
            
            logger.info(f"📋 Found {len(suppliers)} suppliers to analyze")
            return suppliers[:limit]
            
        except Exception as e:
            logger.error(f"D1 connection failed: {e}")
            return []
    
    async def analyze_modernization_opportunity(self, website_url, business_name):
        """
        CORRECTED: Analyze website for modernization/rebuild opportunity
        Focus: Old websites that need updates for pet businesses
        """
        try:
            # Fetch website content
            async with aiohttp.ClientSession() as session:
                async with session.get(website_url, timeout=30) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}")
                    
                    content = await response.text()
                    content = content[:6000]  # Limit for token efficiency
            
            # CORRECTED ANALYSIS PROMPT - Focus on modernization needs
            analysis_prompt = f"""
            Analyze this pet supply business website for MODERNIZATION and REBUILD opportunity:

            Business: {business_name}
            URL: {website_url}
            Website Content: {content}

            SCORING CRITERIA (0-100 points):
            - 0-30: Modern website, no rebuild needed
            - 31-60: Some issues, minor updates needed  
            - 61-80: Outdated, would benefit from modernization
            - 81-100: Severely outdated, urgent rebuild needed

            Look for these MODERNIZATION INDICATORS:
            1. Old design (table layouts, no responsive design)
            2. Poor mobile optimization
            3. Outdated technology (old CMS, no SSL)
            4. Limited functionality (no online ordering, basic contact forms)
            5. Poor user experience (cluttered, hard navigation)

            BUSINESS VIABILITY FACTORS:
            1. Established business (not a hobby/side business)
            2. Physical location/multiple locations
            3. Professional services offered
            4. Clear business contact information
            5. Evidence of revenue/customer base

            Respond in JSON format:
            {{
                "modernization_score": 0-100,
                "rebuild_priority": "urgent/high/medium/low/none",
                "modernization_issues": ["specific outdated elements"],
                "business_viability": "excellent/good/fair/poor",
                "estimated_project_value": "$5k-$15k range estimate",
                "key_improvements_needed": ["specific improvements"],
                "why_they_need_modernization": "brief explanation"
            }}

            Focus on finding businesses that would genuinely benefit from website modernization.
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                max_tokens=800,
                temperature=0.3
            )
            
            # Parse OpenAI response
            analysis_text = response.choices[0].message.content
            
            try:
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    raise Exception("No JSON found in response")
            except:
                # Fallback analysis
                analysis_data = {
                    "modernization_score": 50,
                    "rebuild_priority": "medium",
                    "modernization_issues": ["Analysis parsing error"],
                    "business_viability": "good",
                    "estimated_project_value": "$8k-$12k",
                    "key_improvements_needed": ["Manual review needed"],
                    "why_they_need_modernization": "Unable to analyze automatically"
                }
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Analysis failed for {website_url}: {e}")
            return {
                "modernization_score": 0,
                "rebuild_priority": "none",
                "modernization_issues": [f"Error: {str(e)}"],
                "business_viability": "unknown",
                "estimated_project_value": "Unknown",
                "key_improvements_needed": ["Manual review required"],
                "why_they_need_modernization": "Analysis failed"
            }
    
    async def generate_modernization_outreach(self, business_name, analysis_data, website_url):
        """
        Generate outreach email focused on website modernization opportunity
        """
        try:
            email_prompt = f"""
            Create a professional outreach email for this pet supply business about website modernization:

            Business: {business_name}
            Website: {website_url}
            Modernization Score: {analysis_data['modernization_score']}/100
            Priority: {analysis_data['rebuild_priority']}
            Issues: {', '.join(analysis_data['modernization_issues'])}
            Estimated Value: {analysis_data['estimated_project_value']}

            Email Requirements:
            1. Professional but friendly tone
            2. Acknowledge their business (don't be generic)
            3. Mention 1-2 specific website improvements they need
            4. Explain benefits of modernization for pet businesses
            5. Soft call-to-action for consultation
            6. Keep under 250 words

            Focus on:
            - Mobile-friendly websites for pet owners
            - Online appointment booking
            - Better customer communication
            - Professional appearance that builds trust

            Subject line: "Quick website observation for {business_name}"
            
            Start with: "Hi there,"
            End with: "Best regards,\\nMatt Wright\\nFindRawDogFood Solutions"
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4",
                messages=[{"role": "user", "content": email_prompt}],
                max_tokens=400,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Email generation failed: {e}")
            return f"""Hi there,

I came across {business_name} while researching pet supply businesses in your area. Your commitment to pet health is clear!

I specialize in helping pet businesses modernize their websites to better serve today's mobile-first pet owners. Many pet businesses are missing opportunities because their websites aren't optimized for how customers search and shop today.

Based on a quick look at your current site, there might be some straightforward improvements that could help you reach more local pet owners and streamline your customer communications.

Would you be interested in a brief conversation about website modernization for pet businesses?

Best regards,
Matt Wright
FindRawDogFood Solutions"""
    
    async def process_supplier(self, supplier):
        """Process one supplier through modernization analysis"""
        try:
            logger.info(f"🔍 Analyzing: {supplier['name']}")
            
            # 1. Analyze for modernization opportunity
            analysis_data = await self.analyze_modernization_opportunity(
                supplier['website'], 
                supplier['name']
            )
            
            # 2. Generate modernization-focused outreach
            outreach_email = await self.generate_modernization_outreach(
                supplier['name'],
                analysis_data,
                supplier['website']
            )
            
            # 3. Save to database
            self.save_analysis_result(supplier, analysis_data, outreach_email)
            
            logger.info(f"✅ Completed: {supplier['name']} (Modernization Score: {analysis_data['modernization_score']}/100)")
            
            return {
                'success': True,
                'supplier_id': supplier['id'],
                'modernization_score': analysis_data['modernization_score'],
                'rebuild_priority': analysis_data['rebuild_priority']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed: {supplier['name']}: {e}")
            self.save_analysis_error(supplier, str(e))
            return {'success': False, 'error': str(e)}
    
    def save_analysis_result(self, supplier, analysis_data, outreach_email):
        """Save analysis to database"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analysis_results 
            (supplier_id, business_name, website_url, phone, city, state,
             modernization_score, rebuild_priority, modernization_issues, 
             business_viability, estimated_value, outreach_email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            supplier['id'],
            supplier['name'],
            supplier['website'],
            supplier.get('phone'),
            supplier.get('city'),
            supplier.get('state'),
            analysis_data['modernization_score'],
            analysis_data['rebuild_priority'],
            json.dumps(analysis_data['modernization_issues']),
            analysis_data['business_viability'],
            analysis_data['estimated_project_value'],
            outreach_email,
            'completed'
        ))
        
        conn.commit()
        conn.close()
    
    def save_analysis_error(self, supplier, error_message):
        """Save error to database"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analysis_results 
            (supplier_id, business_name, website_url, phone, city, state,
             status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            supplier['id'],
            supplier['name'],
            supplier['website'],
            supplier.get('phone'),
            supplier.get('city'),
            supplier.get('state'),
            'failed',
            error_message
        ))
        
        conn.commit()
        conn.close()
    
    async def run_modernization_analysis(self):
        """Run modernization analysis on real suppliers"""
        logger.info("🚀 FINDRAWDOGFOOD - MODERNIZATION ANALYSIS")
        logger.info("Focus: Website rebuild opportunities for pet businesses")
        logger.info("=" * 60)
        
        # Get real suppliers from D1
        suppliers = self.get_d1_suppliers(limit=3)
        
        if not suppliers:
            logger.error("❌ No suppliers found")
            return
        
        logger.info(f"🎯 Analyzing {len(suppliers)} suppliers for modernization opportunities")
        
        results = []
        for supplier in suppliers:
            result = await self.process_supplier(supplier)
            results.append(result)
            
            # Pause between requests to avoid rate limits
            await asyncio.sleep(2)
        
        # Show results summary
        self.show_modernization_summary()
    
    def show_modernization_summary(self):
        """Show modernization analysis summary"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        # Get modernization opportunities
        cursor.execute('''
            SELECT business_name, website_url, modernization_score, rebuild_priority, estimated_value
            FROM analysis_results 
            WHERE status = 'completed' 
            ORDER BY modernization_score DESC
        ''')
        
        results = cursor.fetchall()
        
        logger.info("\n🎯 MODERNIZATION OPPORTUNITIES:")
        logger.info("-" * 80)
        
        high_priority = []
        medium_priority = []
        low_priority = []
        
        for name, url, score, priority, value in results:
            if score >= 70:
                high_priority.append((name, url, score, priority, value))
            elif score >= 40:
                medium_priority.append((name, url, score, priority, value))
            else:
                low_priority.append((name, url, score, priority, value))
        
        if high_priority:
            logger.info("🔥 HIGH PRIORITY REBUILDS (70+ points):")
            for name, url, score, priority, value in high_priority:
                logger.info(f"   • {name} - {score}/100 ({priority}) - {value} - {url}")
        
        if medium_priority:
            logger.info("\n⚡ MEDIUM PRIORITY UPDATES (40-69 points):")
            for name, url, score, priority, value in medium_priority:
                logger.info(f"   • {name} - {score}/100 ({priority}) - {value} - {url}")
        
        if low_priority:
            logger.info("\n✅ LOW PRIORITY (Modern sites, <40 points):")
            for name, url, score, priority, value in low_priority:
                logger.info(f"   • {name} - {score}/100 ({priority}) - {url}")
        
        # Priority breakdown
        cursor.execute('''
            SELECT rebuild_priority, COUNT(*) 
            FROM analysis_results 
            WHERE status = 'completed'
            GROUP BY rebuild_priority
        ''')
        
        priority_breakdown = cursor.fetchall()
        
        logger.info("\n📊 REBUILD PRIORITY BREAKDOWN:")
        for priority, count in priority_breakdown:
            logger.info(f"   {priority.upper()}: {count} businesses")
        
        conn.close()

# Execute the corrected analysis
async def main():
    analyzer = FindRawDogFoodAnalyzer()
    await analyzer.run_modernization_analysis()

if __name__ == "__main__":
    asyncio.run(main())
