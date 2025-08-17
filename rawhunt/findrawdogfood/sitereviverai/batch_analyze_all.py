#!/usr/bin/env python3
"""
FindRawDogFood - Batch Website Analysis
Production script to analyze ALL 8000+ suppliers using OpenAI
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

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('batch_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class BatchAnalyzer:
    """
    Production batch analyzer for all FindRawDogFood suppliers
    """
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.results_db = "batch_analysis_results.db"
        self.setup_results_database()
        
    def setup_results_database(self):
        """Initialize results database"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER,
                business_name TEXT NOT NULL,
                website_url TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                city TEXT,
                state TEXT,
                analysis_score REAL,
                business_potential TEXT,
                technical_issues TEXT,
                recommended_actions TEXT,
                outreach_email TEXT,
                status TEXT DEFAULT 'pending',
                error_message TEXT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Results database initialized")
    
    async def analyze_website_with_openai(self, website_url, business_name):
        """
        Use OpenAI to analyze website comprehensively
        """
        try:
            # First, fetch website content
            async with aiohttp.ClientSession() as session:
                async with session.get(website_url, timeout=30) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}")
                    
                    content = await response.text()
                    # Limit content to avoid token limits
                    content = content[:8000]
            
            # Analyze with OpenAI
            analysis_prompt = f"""
            Analyze this pet supply business website for modernization potential:

            Business: {business_name}
            URL: {website_url}
            Website Content: {content}

            Provide analysis in this JSON format:
            {{
                "analysis_score": 0-100,
                "business_potential": "high/medium/low",
                "technical_issues": ["issue1", "issue2", "issue3"],
                "strengths": ["strength1", "strength2"],
                "recommended_actions": ["action1", "action2", "action3"],
                "target_customer": "description",
                "modernization_priority": "urgent/medium/low"
            }}

            Focus on:
            1. Website design quality (mobile-friendly, modern styling)
            2. Business viability (established, good location, clear services)
            3. Technical issues (SSL, speed, SEO, functionality)
            4. Modernization potential (would they benefit from updates?)
            5. Target market appeal (local vs national, premium vs budget)
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4",
                messages=[{
                    "role": "user", 
                    "content": analysis_prompt
                }],
                max_tokens=1000,
                temperature=0.3
            )
            
            # Parse OpenAI response
            analysis_text = response.choices[0].message.content
            
            # Try to extract JSON from response
            try:
                # Find JSON in response
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    # Fallback if no JSON found
                    analysis_data = {
                        "analysis_score": 50,
                        "business_potential": "medium",
                        "technical_issues": ["Unable to parse detailed analysis"],
                        "strengths": ["Business appears operational"],
                        "recommended_actions": ["Manual review needed"],
                        "target_customer": "Pet owners",
                        "modernization_priority": "medium"
                    }
            except json.JSONDecodeError:
                # Fallback analysis
                analysis_data = {
                    "analysis_score": 40,
                    "business_potential": "medium",
                    "technical_issues": ["Analysis parsing error"],
                    "strengths": ["Website accessible"],
                    "recommended_actions": ["Technical review needed"],
                    "target_customer": "Pet owners",
                    "modernization_priority": "medium"
                }
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Analysis failed for {website_url}: {e}")
            return {
                "analysis_score": 0,
                "business_potential": "unknown",
                "technical_issues": [f"Analysis error: {str(e)}"],
                "strengths": [],
                "recommended_actions": ["Manual review required"],
                "target_customer": "Unknown",
                "modernization_priority": "unknown",
                "error": str(e)
            }
    
    async def generate_outreach_email(self, business_name, analysis_data, website_url):
        """
        Generate personalized outreach email using OpenAI
        """
        try:
            email_prompt = f"""
            Create a personalized outreach email for this pet supply business:

            Business: {business_name}
            Website: {website_url}
            Analysis Score: {analysis_data['analysis_score']}/100
            Business Potential: {analysis_data['business_potential']}
            Issues Found: {', '.join(analysis_data['technical_issues'])}
            Strengths: {', '.join(analysis_data['strengths'])}

            Create a professional but friendly email that:
            1. Acknowledges their business strengths
            2. Mentions specific issues we found (if any)
            3. Explains how modernization could help them
            4. Includes a soft call-to-action for a consultation
            5. Keeps tone helpful, not pushy

            Make it specific to pet supply businesses and their challenges.
            Length: 200-300 words maximum.
            
            Start with: "Hi there,"
            End with: "Best regards, Matt Wright, Pandora CI Solutions"
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4",
                messages=[{
                    "role": "user",
                    "content": email_prompt
                }],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Email generation failed for {business_name}: {e}")
            return f"""Hi there,

I noticed {business_name} while researching pet supply businesses in your area. Your dedication to serving pet owners is evident!

I specialize in helping pet businesses modernize their online presence to reach more customers and streamline operations. 

Based on a quick review of your website, there might be some opportunities to enhance your digital presence and attract more local pet owners.

Would you be interested in a brief conversation about how modern web solutions could benefit your business?

Best regards,
Matt Wright
Pandora CI Solutions"""
    
    async def get_all_suppliers_with_websites(self):
        """
        Get all suppliers with websites from the FindRawDogFood database
        This should connect to your actual database
        """
        # TODO: Replace with actual database connection
        # For now, we'll simulate with expanded sample data
        
        logger.info("📊 Loading suppliers from database...")
        
        # This should be replaced with your actual D1/Supabase query
        # Example query would be:
        # SELECT id, name, website, email, phone, city, state 
        # FROM suppliers 
        # WHERE website IS NOT NULL AND website != ''
        
        # Simulated data for testing - replace with real DB query
        sample_suppliers = []
        
        # Generate realistic test data
        cities = ['Austin', 'Miami', 'Seattle', 'Denver', 'Portland', 'Chicago', 'Atlanta', 'Phoenix']
        states = ['TX', 'FL', 'WA', 'CO', 'OR', 'IL', 'GA', 'AZ']
        
        for i in range(50):  # Start with 50 for testing, then scale to 8000+
            sample_suppliers.append({
                'id': i + 1,
                'name': f'Pet Supply Store {i + 1}',
                'website': f'https://petsupply{i + 1}.com',
                'email': f'info@petsupply{i + 1}.com',
                'phone': f'(555) {str(i).zfill(3)}-{str(i * 2).zfill(4)}',
                'city': cities[i % len(cities)],
                'state': states[i % len(states)]
            })
        
        logger.info(f"📋 Found {len(sample_suppliers)} suppliers with websites")
        return sample_suppliers
    
    async def process_single_supplier(self, supplier):
        """
        Process one supplier through the complete analysis pipeline
        """
        try:
            logger.info(f"🔍 Analyzing: {supplier['name']}")
            
            # 1. Analyze website with OpenAI
            analysis_data = await self.analyze_website_with_openai(
                supplier['website'], 
                supplier['name']
            )
            
            # 2. Generate outreach email
            outreach_email = await self.generate_outreach_email(
                supplier['name'],
                analysis_data, 
                supplier['website']
            )
            
            # 3. Save results to database
            self.save_analysis_result(supplier, analysis_data, outreach_email)
            
            logger.info(f"✅ Completed: {supplier['name']} (Score: {analysis_data['analysis_score']}/100)")
            
            return {
                'success': True,
                'supplier_id': supplier['id'],
                'analysis_score': analysis_data['analysis_score'],
                'business_potential': analysis_data['business_potential']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed processing {supplier['name']}: {e}")
            
            # Save error to database
            self.save_analysis_error(supplier, str(e))
            
            return {
                'success': False,
                'supplier_id': supplier['id'],
                'error': str(e)
            }
    
    def save_analysis_result(self, supplier, analysis_data, outreach_email):
        """Save successful analysis to database"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analysis_results 
            (supplier_id, business_name, website_url, email, phone, city, state,
             analysis_score, business_potential, technical_issues, recommended_actions,
             outreach_email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            supplier['id'],
            supplier['name'],
            supplier['website'],
            supplier.get('email'),
            supplier.get('phone'),
            supplier.get('city'),
            supplier.get('state'),
            analysis_data['analysis_score'],
            analysis_data['business_potential'],
            json.dumps(analysis_data['technical_issues']),
            json.dumps(analysis_data['recommended_actions']),
            outreach_email,
            'completed'
        ))
        
        conn.commit()
        conn.close()
    
    def save_analysis_error(self, supplier, error_message):
        """Save failed analysis to database"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analysis_results 
            (supplier_id, business_name, website_url, email, phone, city, state,
             status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            supplier['id'],
            supplier['name'],
            supplier['website'],
            supplier.get('email'),
            supplier.get('phone'),
            supplier.get('city'),
            supplier.get('state'),
            'failed',
            error_message
        ))
        
        conn.commit()
        conn.close()
    
    async def run_batch_analysis(self, batch_size=10, max_concurrent=5):
        """
        Run the complete batch analysis on all suppliers
        """
        logger.info("🚀 Starting batch analysis of all suppliers")
        logger.info("=" * 60)
        
        # Get all suppliers
        suppliers = await self.get_all_suppliers_with_websites()
        
        if not suppliers:
            logger.error("❌ No suppliers found with websites")
            return
        
        total_suppliers = len(suppliers)
        completed = 0
        failed = 0
        
        logger.info(f"📊 Processing {total_suppliers} suppliers")
        logger.info(f"⚙️  Batch size: {batch_size}, Max concurrent: {max_concurrent}")
        
        # Process in batches to avoid overwhelming OpenAI API
        for i in range(0, total_suppliers, batch_size):
            batch = suppliers[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_suppliers + batch_size - 1) // batch_size
            
            logger.info(f"\n📦 Processing batch {batch_num}/{total_batches} ({len(batch)} suppliers)")
            
            # Process batch with concurrency limit
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def process_with_semaphore(supplier):
                async with semaphore:
                    return await self.process_single_supplier(supplier)
            
            batch_results = await asyncio.gather(
                *[process_with_semaphore(supplier) for supplier in batch],
                return_exceptions=True
            )
            
            # Count results
            batch_completed = sum(1 for r in batch_results if isinstance(r, dict) and r.get('success'))
            batch_failed = len(batch) - batch_completed
            
            completed += batch_completed
            failed += batch_failed
            
            logger.info(f"✅ Batch {batch_num} complete: {batch_completed} succeeded, {batch_failed} failed")
            
            # Rate limiting - pause between batches
            if i + batch_size < total_suppliers:
                logger.info("⏸️  Pausing 30 seconds between batches...")
                await asyncio.sleep(30)
        
        # Final summary
        logger.info("\n" + "=" * 60)
        logger.info("🎯 BATCH ANALYSIS COMPLETE!")
        logger.info(f"📊 Total processed: {total_suppliers}")
        logger.info(f"✅ Successful: {completed}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"📈 Success rate: {(completed/total_suppliers)*100:.1f}%")
        logger.info(f"💾 Results saved to: {self.results_db}")
        
        # Show top opportunities
        self.show_analysis_summary()
    
    def show_analysis_summary(self):
        """Show summary of analysis results"""
        conn = sqlite3.connect(self.results_db)
        cursor = conn.cursor()
        
        # Top opportunities
        cursor.execute('''
            SELECT business_name, website_url, analysis_score, business_potential
            FROM analysis_results 
            WHERE status = 'completed' AND analysis_score >= 70
            ORDER BY analysis_score DESC
            LIMIT 10
        ''')
        
        top_opportunities = cursor.fetchall()
        
        if top_opportunities:
            logger.info("\n🌟 TOP 10 OPPORTUNITIES:")
            for i, (name, url, score, potential) in enumerate(top_opportunities, 1):
                logger.info(f"  {i}. {name} - {score}/100 ({potential}) - {url}")
        
        # Business potential breakdown
        cursor.execute('''
            SELECT business_potential, COUNT(*) 
            FROM analysis_results 
            WHERE status = 'completed'
            GROUP BY business_potential
        ''')
        
        potential_breakdown = cursor.fetchall()
        
        if potential_breakdown:
            logger.info("\n📊 BUSINESS POTENTIAL BREAKDOWN:")
            for potential, count in potential_breakdown:
                logger.info(f"  {potential.upper()}: {count} businesses")
        
        conn.close()


# Production execution
async def main():
    """
    Main execution function
    """
    analyzer = BatchAnalyzer()
    
    # Run with production settings
    await analyzer.run_batch_analysis(
        batch_size=20,      # Process 20 at a time
        max_concurrent=3    # Max 3 concurrent OpenAI calls
    )

if __name__ == "__main__":
    asyncio.run(main())
