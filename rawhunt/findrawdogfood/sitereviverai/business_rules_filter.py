#!/usr/bin/env python3
"""
FindRawDogFood - Business Rules Filter
Filters out chain stores and prioritizes worst websites
"""

import sqlite3
import re
from urllib.parse import urlparse

class BusinessRulesFilter:
    def __init__(self, db_path="batch_analysis_results.db"):
        self.db_path = db_path
        
        # Chain store URL patterns to exclude
        self.chain_indicators = [
            '/pages/',
            '/locations/',
            '/stores/',
            '/branches/',
            '/outlets/',
            '/franchises/',
            '/location/',
            '/store/',
            '/branch/'
        ]
        
        # Known chain domains to exclude entirely
        self.known_chains = [
            'petco.com',
            'petsmart.com',
            'chewy.com',
            'amazon.com',
            'walmart.com',
            'target.com',
            'tomlinsons.com',  # Adding Tomlinsons as known chain
            'petland.com',
            'petclub.com'
        ]
        
        # Franchise indicators in business names
        self.franchise_patterns = [
            r'\s-\s.+branch',
            r'\s-\s.+location', 
            r'\s-\s.+store',
            r'\(.+location\)',
            r'\(.+branch\)',
            r'\(.+outlet\)',
            r'#\d+',  # Store numbers like "Store #123"
            r'location\s+\d+',
            r'branch\s+\d+'
        ]
    
    def is_independent_business(self, website_url, business_name):
        """
        Check if this is an independent business (not a chain store subpage)
        Returns True if we should process, False if we should skip
        """
        
        # Extract domain
        try:
            parsed = urlparse(website_url)
            domain = parsed.netloc.lower().replace('www.', '')
            path = parsed.path.lower()
        except:
            return False
        
        # Rule 1: Skip known chain domains entirely
        if any(chain in domain for chain in self.known_chains):
            print(f"❌ FILTERED: {business_name} - Known chain domain: {domain}")
            return False
        
        # Rule 2: Skip URLs with chain store indicators in path
        if any(indicator in website_url.lower() for indicator in self.chain_indicators):
            print(f"❌ FILTERED: {business_name} - Chain store subpage detected: {website_url}")
            return False
        
        # Rule 3: Skip business names that suggest franchise/chain locations
        for pattern in self.franchise_patterns:
            if re.search(pattern, business_name, re.IGNORECASE):
                print(f"❌ FILTERED: {business_name} - Franchise pattern detected")
                return False
        
        # Rule 4: Skip if URL has multiple path segments (likely subpages)
        path_segments = [seg for seg in path.split('/') if seg]
        if len(path_segments) > 2:  # Allow some depth but not deep subpages
            print(f"❌ FILTERED: {business_name} - Deep subpage URL: {website_url}")
            return False
        
        print(f"✅ APPROVED: {business_name} - Independent business")
        return True
    
    def get_priority_rank(self, analysis_score):
        """
        Get priority rank based on analysis score (worst websites first)
        Lower analysis score = worse website = higher priority
        """
        if analysis_score is None:
            return {'rank': 6, 'label': 'UNKNOWN', 'value': '$0', 'should_process': False}
        
        if analysis_score <= 10:
            return {'rank': 1, 'label': 'CRITICAL - Broken/Terrible', 'value': '$20k-$30k', 'should_process': True}
        elif analysis_score <= 30:
            return {'rank': 2, 'label': 'URGENT - Very Poor', 'value': '$15k-$25k', 'should_process': True}
        elif analysis_score <= 50:
            return {'rank': 3, 'label': 'HIGH - Poor Website', 'value': '$10k-$18k', 'should_process': True}
        elif analysis_score <= 70:
            return {'rank': 4, 'label': 'MEDIUM - Needs Work', 'value': '$8k-$12k', 'should_process': True}
        elif analysis_score <= 85:
            return {'rank': 5, 'label': 'LOW - Minor Issues', 'value': '$5k-$8k', 'should_process': False}
        else:
            return {'rank': 6, 'label': 'SKIP - Good Website', 'value': '$0', 'should_process': False}
    
    def apply_business_rules(self):
        """
        Apply business rules to existing analysis results
        Filters out chain stores and ranks by priority
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Add new columns for business rules if they don't exist
        try:
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN is_independent BOOLEAN DEFAULT 1")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN priority_rank INTEGER")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN priority_label TEXT")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN should_process BOOLEAN DEFAULT 1")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN filter_reason TEXT")
        except:
            pass  # Columns already exist
        
        # Get all completed analysis results
        cursor.execute("""
            SELECT id, business_name, website_url, analysis_score 
            FROM analysis_results 
            WHERE status='completed'
        """)
        
        results = cursor.fetchall()
        
        print(f"🔍 APPLYING BUSINESS RULES TO {len(results)} PROSPECTS")
        print("=" * 60)
        
        filtered_count = 0
        processed_count = 0
        
        for result_id, business_name, website_url, analysis_score in results:
            
            # Apply Rule 1: Independent business check
            is_independent = self.is_independent_business(website_url, business_name)
            
            # Apply Rule 2: Priority ranking  
            priority = self.get_priority_rank(analysis_score)
            
            # Determine if we should process this prospect
            should_process = is_independent and priority['should_process']
            
            # Set filter reason if filtered
            filter_reason = None
            if not is_independent:
                filter_reason = "Chain store or franchise location"
            elif not priority['should_process']:
                filter_reason = f"Website too good (score: {analysis_score})"
            
            # Update database with business rules
            cursor.execute("""
                UPDATE analysis_results 
                SET is_independent=?, 
                    priority_rank=?, 
                    priority_label=?, 
                    should_process=?,
                    filter_reason=?
                WHERE id=?
            """, (is_independent, priority['rank'], priority['label'], should_process, filter_reason, result_id))
            
            if should_process:
                processed_count += 1
            else:
                filtered_count += 1
        
        conn.commit()
        conn.close()
        
        print("\n📊 BUSINESS RULES SUMMARY:")
        print(f"   ✅ Qualified prospects: {processed_count}")
        print(f"   ❌ Filtered out: {filtered_count}")
        print(f"   📋 Total analyzed: {len(results)}")
        print(f"   📈 Qualification rate: {processed_count/len(results)*100:.1f}%")
        
        return processed_count, filtered_count
    
    def get_qualified_prospects(self, limit=20):
        """
        Get qualified prospects ranked by priority (worst websites first)
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, business_name, website_url, email, phone, city, state,
                   analysis_score, business_potential, outreach_email, processed_at,
                   priority_rank, priority_label, filter_reason
            FROM analysis_results 
            WHERE status='completed' 
            AND should_process=1
            AND (approval_status='pending' OR approval_status IS NULL)
            ORDER BY priority_rank ASC, analysis_score ASC
            LIMIT ?
        """, (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return results

if __name__ == '__main__':
    filter_system = BusinessRulesFilter()
    processed, filtered = filter_system.apply_business_rules()
    
    print("\n🎯 TOP QUALIFIED PROSPECTS (Worst Websites First):")
    print("-" * 60)
    
    qualified = filter_system.get_qualified_prospects(10)
    for i, prospect in enumerate(qualified, 1):
        name, url, score, priority_label = prospect[1], prospect[2], prospect[7], prospect[12]
        print(f"{i:2d}. {name}")
        print(f"    Score: {score}/100 - {priority_label}")
        print(f"    URL: {url}")
        print()
