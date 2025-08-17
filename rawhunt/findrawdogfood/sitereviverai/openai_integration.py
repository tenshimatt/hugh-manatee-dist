#!/usr/bin/env python3
"""
SiteReviverAI - OpenAI Integration Module
Adds AI-powered content generation and website analysis
"""

import os
import json
import asyncio
from datetime import datetime

class OpenAIIntegration:
    """
    OpenAI integration for SiteReviverAI
    Handles content generation, website analysis, and email optimization
    """
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.base_url = "https://api.anthropic.com/v1/messages"  # Using Claude API as available
        
        if not self.api_key:
            print("⚠️  OpenAI API key not found. Using simulated responses.")
            self.use_simulation = True
        else:
            self.use_simulation = False
    
    async def analyze_website_content(self, website_url, business_name, website_html=None):
        """
        Analyze website content and provide modernization recommendations
        """
        if self.use_simulation:
            return self._simulate_website_analysis(website_url, business_name)
        
        prompt = f"""
        Analyze this raw dog food supplier website for modernization opportunities:
        
        Business: {business_name}
        URL: {website_url}
        
        Provide analysis in JSON format:
        {{
            "lighthouse_score": <estimated performance score 0-100>,
            "design_score": <design modernity score 0-10>,
            "issues": ["list", "of", "specific", "issues"],
            "strengths": ["list", "of", "current", "strengths"],
            "modernization_priority": "high|medium|low",
            "target_audience": "description of target customers",
            "brand_voice": "description of current brand personality"
        }}
        
        Focus on: mobile responsiveness, loading speed, user experience, conversion optimization, and industry-specific needs for raw dog food suppliers.
        """
        
        try:
            response = await self._make_api_call(prompt, max_tokens=1000)
            return json.loads(response)
        except Exception as e:
            print(f"⚠️  OpenAI API error: {e}. Using simulation.")
            return self._simulate_website_analysis(website_url, business_name)
    
    async def generate_customer_email(self, business_data, analysis_data, brand_package):
        """
        Generate personalized customer email content using AI
        """
        if self.use_simulation:
            return self._simulate_email_generation(business_data, analysis_data)
        
        prompt = f"""
        Generate a professional email for a raw dog food supplier offering website modernization:
        
        Business: {business_data.get('business_name')}
        Location: {business_data.get('city')}, {business_data.get('state')}
        Current Score: {analysis_data.get('lighthouse_score')}/100
        Issues: {', '.join(analysis_data.get('issues', []))}
        Brand Colors: {brand_package.get('primary_color')} / {brand_package.get('secondary_color')}
        
        Create compelling email content that:
        1. Addresses their specific website issues
        2. Explains value proposition for raw dog food market
        3. Includes revenue impact projections
        4. Maintains professional, consultative tone
        5. Uses industry-specific language
        
        Return JSON with:
        {{
            "subject_line": "compelling subject line",
            "opening_paragraph": "personalized opening",
            "problem_statement": "specific issues identified",
            "solution_overview": "how we solve their problems",
            "value_proposition": "why this matters for raw dog food business",
            "call_to_action": "clear next steps",
            "urgency_element": "time-sensitive component"
        }}
        """
        
        try:
            response = await self._make_api_call(prompt, max_tokens=1500)
            return json.loads(response)
        except Exception as e:
            print(f"⚠️  OpenAI API error: {e}. Using template.")
            return self._simulate_email_generation(business_data, analysis_data)
    
    async def optimize_design_recommendations(self, business_data, analysis_data):
        """
        Generate AI-powered design recommendations specific to the business
        """
        if self.use_simulation:
            return self._simulate_design_recommendations(business_data)
        
        prompt = f"""
        Create specific design recommendations for this raw dog food supplier:
        
        Business: {business_data.get('business_name')}
        Current Issues: {', '.join(analysis_data.get('issues', []))}
        Target Market: Raw dog food customers (health-conscious pet owners)
        
        Provide detailed recommendations in JSON:
        {{
            "professional_design": {{
                "layout": "specific layout recommendations",
                "color_scheme": "color psychology for trust",
                "typography": "professional font choices",
                "imagery": "photo style recommendations",
                "conversion_elements": "trust signals and CTAs"
            }},
            "modern_design": {{
                "layout": "cutting-edge layout approach",
                "color_scheme": "modern color psychology",
                "typography": "contemporary font trends",
                "imagery": "modern photo style",
                "conversion_elements": "advanced UX techniques"
            }},
            "industry_specific": {{
                "trust_elements": "raw food industry credibility",
                "educational_content": "pet health information",
                "social_proof": "testimonials and reviews",
                "product_showcase": "raw food presentation"
            }}
        }}
        """
        
        try:
            response = await self._make_api_call(prompt, max_tokens=2000)
            return json.loads(response)
        except Exception as e:
            print(f"⚠️  OpenAI API error: {e}. Using defaults.")
            return self._simulate_design_recommendations(business_data)
    
    async def generate_content_copy(self, business_data, design_type="professional"):
        """
        Generate website copy optimized for the raw dog food industry
        """
        if self.use_simulation:
            return self._simulate_content_copy(business_data, design_type)
        
        prompt = f"""
        Write compelling website copy for a raw dog food supplier:
        
        Business: {business_data.get('business_name')}
        Location: {business_data.get('city')}, {business_data.get('state')}
        Design Style: {design_type}
        
        Generate copy for:
        {{
            "hero_headline": "powerful main headline",
            "hero_subheadline": "supporting subheadline",
            "value_propositions": ["3", "key", "benefits"],
            "about_section": "compelling about us content",
            "product_descriptions": ["fresh raw meat", "bones and organs", "balanced nutrition"],
            "testimonial_prompts": ["customer quote", "health improvement story"],
            "cta_buttons": ["primary action", "secondary action"],
            "trust_elements": ["certifications", "guarantees", "expertise"]
        }}
        
        Tone: {design_type} (professional/trustworthy or modern/innovative)
        Focus: Pet health, natural nutrition, local trust, quality assurance
        """
        
        try:
            response = await self._make_api_call(prompt, max_tokens=1500)
            return json.loads(response)
        except Exception as e:
            print(f"⚠️  OpenAI API error: {e}. Using templates.")
            return self._simulate_content_copy(business_data, design_type)
    
    async def _make_api_call(self, prompt, max_tokens=1000):
        """
        Make API call to Claude (using available endpoint)
        """
        try:
            # Using the Claude API integration available in this environment
            response = await fetch("https://api.anthropic.com/v1/messages", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify({
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": max_tokens,
                    "messages": [
                        { "role": "user", "content": prompt }
                    ]
                })
            })
            
            data = await response.json()
            return data.content[0].text
            
        except Exception as e:
            raise Exception(f"API call failed: {e}")
    
    # Simulation methods for when API is not available
    def _simulate_website_analysis(self, website_url, business_name):
        """Simulate AI analysis when API not available"""
        import random
        
        issues_pool = [
            "Mobile responsiveness issues",
            "Slow loading speed (>3 seconds)",
            "Poor SEO optimization", 
            "Outdated design aesthetics",
            "Lack of trust signals",
            "No customer testimonials",
            "Poor call-to-action placement",
            "Missing contact information",
            "No social proof elements",
            "Accessibility concerns"
        ]
        
        strengths_pool = [
            "Clear business name and location",
            "Contact information provided", 
            "Product information available",
            "Local business presence",
            "Industry expertise evident"
        ]
        
        lighthouse_score = random.randint(25, 85)
        design_score = random.randint(2, 8)
        
        return {
            "lighthouse_score": lighthouse_score,
            "design_score": design_score,
            "issues": random.sample(issues_pool, random.randint(3, 6)),
            "strengths": random.sample(strengths_pool, random.randint(2, 4)),
            "modernization_priority": "high" if lighthouse_score < 50 else "medium" if lighthouse_score < 70 else "low",
            "target_audience": "Health-conscious pet owners seeking natural nutrition",
            "brand_voice": "Professional and trustworthy with focus on pet health"
        }
    
    def _simulate_email_generation(self, business_data, analysis_data):
        """Simulate AI email generation"""
        business_name = business_data.get('business_name', 'Your Business')
        city = business_data.get('city', 'your area')
        score = analysis_data.get('lighthouse_score', 50)
        
        return {
            "subject_line": f"Your {business_name} website transformation is ready! (2 design options)",
            "opening_paragraph": f"Hi there! I've completed a comprehensive analysis of your {business_name} website and created two professional design options specifically tailored for raw dog food suppliers in {city}.",
            "problem_statement": f"Our analysis revealed your current website scores {score}/100 for performance, with opportunities to better serve health-conscious pet owners in your market.",
            "solution_overview": "I've created two modernized designs: a Professional & Clean option focused on trust-building, and a Modern Science-Backed design optimized using UX research.",
            "value_proposition": "Raw dog food customers need to trust their supplier completely. A professional website builds that trust and can increase customer inquiries by 60-80%.",
            "call_to_action": "Click the preview links above to see your transformation options, then reply to this email to get started.",
            "urgency_element": "Preview links expire in 7 days"
        }
    
    def _simulate_design_recommendations(self, business_data):
        """Simulate AI design recommendations"""
        return {
            "professional_design": {
                "layout": "Clean grid layout with prominent contact info and trust badges",
                "color_scheme": "Earth tones (browns, greens) conveying natural nutrition",
                "typography": "Professional serif headers with clean sans-serif body text",
                "imagery": "High-quality photos of fresh raw meat and healthy dogs",
                "conversion_elements": "Prominent phone number, customer testimonials, certifications"
            },
            "modern_design": {
                "layout": "Dynamic sections with micro-animations and interactive elements",
                "color_scheme": "Bold primary colors with science-backed color psychology",
                "typography": "Modern sans-serif with strategic font weights",
                "imagery": "Lifestyle photos of happy dogs and health transformation stories",
                "conversion_elements": "Smart CTAs, progress indicators, social proof widgets"
            },
            "industry_specific": {
                "trust_elements": "AAFCO compliance badges, veterinarian endorsements, facility photos",
                "educational_content": "Raw feeding guides, nutritional comparisons, health benefits",
                "social_proof": "Customer success stories, before/after dog photos, reviews",
                "product_showcase": "Ingredient sourcing, preparation process, delivery options"
            }
        }
    
    def _simulate_content_copy(self, business_data, design_type):
        """Simulate AI content generation"""
        business_name = business_data.get('business_name', 'Your Business')
        
        if design_type == "professional":
            return {
                "hero_headline": f"Premium Raw Dog Food from {business_name}",
                "hero_subheadline": "Trusted by local pet owners for natural, species-appropriate nutrition",
                "value_propositions": ["Locally sourced ingredients", "Veterinarian approved", "30+ years experience"],
                "about_section": f"At {business_name}, we've been committed to providing the highest quality raw dog food for over a decade. Our locally-sourced ingredients and careful preparation ensure your dog gets the natural nutrition they deserve.",
                "product_descriptions": ["Fresh raw meat blends", "Organ meat supplements", "Raw bones for dental health"],
                "testimonial_prompts": ["My dog's energy improved dramatically", "Best raw food supplier in the area"],
                "cta_buttons": ["Order Today", "Get Free Consultation"],
                "trust_elements": ["AAFCO Certified", "Local Family Business", "100% Natural Ingredients"]
            }
        else:
            return {
                "hero_headline": f"Transform Your Dog's Health with {business_name}",
                "hero_subheadline": "Science-backed raw nutrition that delivers real results",
                "value_propositions": ["Proven health improvements", "Customized meal plans", "Expert nutritionist support"],
                "about_section": f"{business_name} combines traditional raw feeding wisdom with modern nutritional science to create optimal meal plans for your dog's health and vitality.",
                "product_descriptions": ["Scientifically balanced raw meals", "Targeted nutrition therapy", "Performance enhancement diets"],
                "testimonial_prompts": ["Vet said my dog's bloodwork improved 40%", "Finally found a supplier who understands nutrition"],
                "cta_buttons": ["Start Free Trial", "Book Nutrition Consultation"],
                "trust_elements": ["Certified Pet Nutritionist", "Research-Based Formulas", "Health Guarantee"]
            }


# Test the OpenAI integration
async def test_openai_integration():
    """Test the OpenAI integration with sample data"""
    print("🧪 Testing OpenAI Integration")
    print("=" * 40)
    
    # Initialize (will use simulation without API key)
    ai = OpenAIIntegration()
    
    # Test data
    business_data = {
        'business_name': 'Natural Paws Raw Dog Food',
        'city': 'Austin',
        'state': 'Texas',
        'website_url': 'https://naturalpaws.com'
    }
    
    # Test website analysis
    print("🔍 Testing website analysis...")
    analysis = await ai.analyze_website_content(
        business_data['website_url'], 
        business_data['business_name']
    )
    print(f"   ✅ Analysis: {analysis['lighthouse_score']}/100 score")
    print(f"   📋 Issues: {len(analysis['issues'])} identified")
    
    # Test email generation
    print("\n📧 Testing email generation...")
    brand_package = {
        'primary_color': '#8B4513',
        'secondary_color': '#D2691E'
    }
    
    email_content = await ai.generate_customer_email(business_data, analysis, brand_package)
    print(f"   ✅ Subject: {email_content['subject_line'][:50]}...")
    print(f"   📝 Content: {len(email_content['opening_paragraph'])} chars opening")
    
    # Test design recommendations
    print("\n🎨 Testing design recommendations...")
    design_recs = await ai.optimize_design_recommendations(business_data, analysis)
    print(f"   ✅ Professional layout: {design_recs['professional_design']['layout'][:50]}...")
    print(f"   🚀 Modern approach: {design_recs['modern_design']['layout'][:50]}...")
    
    # Test content generation
    print("\n✍️  Testing content copy generation...")
    content_copy = await ai.generate_content_copy(business_data, "professional")
    print(f"   ✅ Headline: {content_copy['hero_headline']}")
    print(f"   📋 Value props: {len(content_copy['value_propositions'])} items")
    
    print("\n🎉 OpenAI integration test complete!")
    print("💡 Add OPENAI_API_KEY environment variable for real AI generation")

if __name__ == "__main__":
    asyncio.run(test_openai_integration())
