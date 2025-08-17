# Rawgle.com Master Implementation Prompt - Complete Platform Blueprint

## 🎯 Context for AI Implementation

You are building Rawgle.com, a world-class raw feeding community platform that addresses real user needs discovered through Reddit r/rawdogfood analysis. This platform combines education, commerce, community, and AI-powered assistance to become the definitive resource for raw dog feeding.

## 🧱 Core Modules to Implement

### 1. Education Hub - "Raw Academy"
Build a trust-first educational platform addressing the top concerns from Reddit:

**10 Essential Topics** (Ordered by Reddit frequency):
1. **What is Raw Feeding?** - BARF vs PMR models, benefits, risks
2. **Safe Transition Guide** - Step-by-step protocols, troubleshooting
3. **Finding Quality Suppliers** - Verification checklist, red flags
4. **Personalized Selection** - Breed, age, activity considerations  
5. **Calcium/Phosphorus Balance** - Critical ratios, calculation tools
6. **Budget Optimization** - Bulk buying, co-ops, cost strategies
7. **Safety & Handling** - Bacterial concerns, family safety
8. **Common Issues** - Loose stools, refusing food, weight loss
9. **Vet Relationships** - Research papers, finding supportive vets
10. **Advanced Techniques** - Prey model, organ ratios, supplements

**Implementation Requirements**:
- Video-first content (embed YouTube/Vimeo)
- Downloadable PDF guides and calculators
- Interactive quizzes for knowledge validation
- Progress tracking with badges
- Comments with expert moderation
- Related content suggestions
- Mobile-optimized viewing

**Key CTAs**:
- "Calculate Your Dog's Needs" → Pet profile creation
- "Find Suppliers Near Me" → Location capture
- "Download Starter Guide" → Email capture

### 2. Smart Pet Profile & Recommendation Engine

**Data Model**:
```typescript
interface PetProfile {
  // Basic Information
  id: string;
  userId: string;
  name: string;
  photos: string[];
  
  // Demographics
  breed: string[];  // Support mixed breeds
  age: { years: number; months: number };
  sex: 'male' | 'female' | 'neutered_male' | 'spayed_female';
  weight: { current: number; ideal: number; unit: 'lbs' | 'kg' };
  
  // Health & Activity
  activityLevel: 1 | 2 | 3 | 4 | 5;
  healthConditions: string[];
  allergies: string[];
  medications: string[];
  
  // Feeding History
  currentDiet: string;
  transitionStage: 'considering' | 'transitioning' | 'established';
  previousFoods: FoodHistory[];
  pickiness: 1 | 2 | 3 | 4 | 5;
  gulper: boolean;  // Important for bone safety
  
  // Preferences
  budgetRange: 'tight' | 'moderate' | 'flexible' | 'premium';
  mealFrequency: number;
  treatTypes: string[];
}
```

**Recommendation Algorithm**:
```python
def generate_recommendations(pet: PetProfile, location: Location):
    """
    Generate personalized food recommendations based on:
    1. Nutritional requirements (breed, age, activity)
    2. Health considerations (conditions, allergies)
    3. Local availability (supplier proximity)
    4. Budget constraints
    5. Transition readiness
    """
    
    recommendations = {
        "primary": [],      # Top 3 perfect matches
        "alternatives": [], # 3 good backup options
        "avoid": [],       # Products to avoid with reasons
        "transitional": [] # For beginners
    }
    
    # Core factors from Reddit concerns:
    # - Calcium/phosphorus balance (1.2-1.5:1)
    # - Appropriate bone content (10-15%)
    # - Novel proteins for allergies
    # - Cost per meal calculation
    # - Supplier reliability score
    # - Bacterial safety protocols
    
    return recommendations
```

**Implementation Features**:
- Multi-pet support per account
- Progress photos with timeline
- Weight tracking graphs
- Feeding log integration
- Health outcome tracking
- Vet record storage
- Reminder notifications
- QR code pet tags

### 3. AI-Powered Chatbot - "Raw Guide"

**Core Capabilities** (Based on Reddit's top 50 questions):

1. **Instant Answers** (Pre-programmed responses):
   - How much to feed (2-3% body weight)
   - Is it safe (yes, with proper handling)
   - Calcium/phosphorus ratios
   - Transition timelines
   - Dealing with skeptical vets
   - Common troubleshooting

2. **Interactive Calculators**:
   - Daily portion calculator
   - Calcium ratio analyzer  
   - Transition timeline generator
   - Monthly cost estimator
   - Nutritional balance checker

3. **Intelligent Routing**:
   - Simple questions → Instant response
   - Complex questions → GPT-4 integration
   - Health concerns → Community/expert escalation
   - Emergencies → Vet directory + warning

**Implementation Stack**:
- Cloudflare Workers for hosting
- Durable Objects for conversation state
- OpenAI GPT-4 for complex queries
- Vector database for knowledge retrieval
- Analytics for continuous improvement

### 4. Review System 2.0

**Review Categories**:
1. **Product Reviews**:
   - Quality (freshness, packaging, consistency)
   - Pet response (palatability, digestion)
   - Value (price per meal, portion size)
   - Health outcomes (coat, energy, stool)

2. **Supplier Reviews**:
   - Reliability (delivery, stock)
   - Communication (responsiveness)
   - Transparency (sourcing info)
   - Problem resolution

**Trust Features**:
- Verified purchase badges
- "Feeding for X months" indicators
- Before/after photo uploads
- Video testimonials option
- Helpful vote system
- Supplier response capability
- Fake review ML detection

**Implementation**:
- Star ratings with detailed criteria
- Photo/video upload to R2
- Moderation queue for quality
- Reward system for reviewers
- API for supplier responses
- Analytics dashboard

### 5. Community Hub - "The Pack"

**Channel Structure** (From Reddit patterns):
1. **Beginners Corner** - Safe space for new feeders
2. **Transition Support** - Daily troubleshooting
3. **Budget Raw** - Money-saving strategies  
4. **Breed Specific** - Auto-created based on users
5. **Health & Allergies** - Special needs support
6. **Senior Dogs** - Age-specific considerations
7. **Puppies** - Growth and development
8. **Local Groups** - Regional coordination
9. **Success Stories** - Motivation and proof
10. **Ask the Expert** - Verified nutritionist Q&A

**Features**:
- Real-time chat (Cloudflare Durable Objects)
- Threading for organization
- Rich media sharing
- Mention notifications
- Expert verification badges
- Moderation tools
- Report/flag system
- Weekly AMAs
- Pinned resources

### 6. E-commerce Marketplace

**Product Categories**:
1. **Raw Food** (via supplier integration)
2. **Equipment**:
   - Digital scales
   - Storage containers
   - Prep tools (knives, boards)
   - Freezer organizers
3. **Feeding Accessories**:
   - Slow feeder bowls
   - Puzzle feeders
   - Lick mats
   - Travel containers
4. **Safety Gear**:
   - Gloves
   - Sanitizers
   - First aid kits
5. **Supplements**:
   - Omega oils
   - Probiotics
   - Joint support
   - Digestive aids
6. **Educational Materials**:
   - Books
   - Courses
   - Meal plans
   - Consultation credits
7. **Branded Merchandise**:
   - Apparel
   - Stickers
   - Dog accessories

**Features**:
- Stripe integration
- Subscription management
- Bundle deals
- Wishlist functionality
- Gift options
- Affiliate tracking
- Inventory sync
- Shipping calculations

### 7. Supplier Portal

**Features for Suppliers**:
- Business verification process
- Product catalog management
- Real-time inventory API
- Order management system
- Customer messaging
- Performance analytics
- Promotional tools
- Delivery zone mapping
- Batch tracking
- Recall management

**Requirements**:
- API documentation
- Onboarding wizard
- Training materials
- Support ticket system
- Revenue reporting
- Marketing assets

## 📊 Data Models & Architecture

### Database Schema (PostgreSQL via Supabase)
```sql
-- Core tables (see database/schema.sql for complete implementation)
- users (with subscription tiers)
- pets (with health tracking)
- food_products (with nutritional data)
- suppliers (with verification status)
- reviews (with verified purchase flags)
- recommendations (with ML scores)
- forum_posts (with threading)
- orders (with tracking)
- educational_content (with progress tracking)
```

### API Architecture (Cloudflare Workers)
```typescript
// Main API routes
GET    /api/pets                      // List user's pets
POST   /api/pets                      // Create pet profile
GET    /api/pets/:id/recommendations  // Get food matches
POST   /api/chatbot/chat             // AI assistant
GET    /api/products/search          // Search products
POST   /api/reviews                  // Submit review
GET    /api/education/:slug          // Get content
WS     /api/chat/:channel           // Real-time chat
```

### State Management
- **Frontend**: Zustand for global state
- **Real-time**: Cloudflare Durable Objects
- **Cache**: Cloudflare KV
- **Media**: Cloudflare R2
- **Search**: D1 with vector embeddings

## 🎯 Key Performance Indicators (KPIs)

### User Engagement
- Profile completion rate (target: 80%)
- Chatbot resolution rate (target: 75%)
- Community posts per user (target: 5/month)
- Review submission rate (target: 30%)
- Course completion rate (target: 60%)

### Business Metrics
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Churn rate (target: <5%)
- Transaction take rate (5%)

### Platform Health
- Page load time (<2s)
- API response time (<100ms)
- Uptime (99.9%)
- Chatbot accuracy (>90%)
- Search relevance score

## 💰 Monetization Strategy

### Subscription Tiers
1. **Free**
   - 1 pet profile
   - Basic recommendations
   - Community access
   - Limited chat support

2. **Premium** ($9.99/mo)
   - Unlimited pets
   - Advanced matching
   - Priority support
   - All educational content
   - Ad-free experience

3. **Professional** ($29.99/mo)
   - Breeder tools
   - Bulk ordering
   - Custom meal plans
   - API access
   - White-label options

4. **Business** ($99.99/mo)
   - Supplier account
   - Analytics dashboard
   - Featured listings
   - Marketing tools
   - Lead generation

### Additional Revenue
- Transaction fees (5%)
- Featured placements
- Sponsored content
- Affiliate commissions
- Digital product sales
- Consultation bookings
- Data insights (anonymized)

## 🚀 Implementation Phases

### Phase 1: MVP (Weeks 1-2)
- [ ] Deploy Cloudflare Workers
- [ ] Set up Supabase database
- [ ] Basic pet profiles
- [ ] Simple matching algorithm
- [ ] Chatbot v1 (50 questions)
- [ ] 10 founding suppliers

### Phase 2: Community (Weeks 3-4)
- [ ] Launch forums
- [ ] Review system
- [ ] Educational videos (10)
- [ ] Mobile optimization
- [ ] Email automation

### Phase 3: Intelligence (Weeks 5-6)
- [ ] Advanced recommendations
- [ ] Chatbot v2 (calculators)
- [ ] Personalization engine
- [ ] Analytics dashboard
- [ ] A/B testing

### Phase 4: Commerce (Weeks 7-8)
- [ ] Full marketplace
- [ ] Payment processing
- [ ] Subscription billing
- [ ] Supplier tools
- [ ] Affiliate program

### Phase 5: Scale (Weeks 9-12)
- [ ] Mobile apps
- [ ] International expansion
- [ ] White-label platform
- [ ] API marketplace
- [ ] B2B tools

## 🎨 Design Principles

1. **Mobile-First**: 70% of users on mobile
2. **Trust Signals**: Verification badges everywhere
3. **Progressive Disclosure**: Don't overwhelm beginners
4. **Visual Learning**: Videos and infographics
5. **Social Proof**: Reviews, testimonials, success stories
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Performance**: <2s load time globally

## 🔧 Technical Requirements

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS + Shadcn/ui
- React Query for data fetching
- Zustand for state management

### Backend
- Cloudflare Workers (edge compute)
- Supabase (PostgreSQL + Auth)
- OpenAI API (chatbot)
- Stripe (payments)
- SendGrid (email)

### DevOps
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- PostHog (analytics)
- Cloudflare Analytics
- Uptime monitoring

## 🌟 Success Criteria

You'll know the platform is succeeding when:
1. Users spend 10+ minutes per session
2. 50% of free users create pet profiles
3. 20% convert to paid subscriptions
4. Suppliers report increased sales
5. Community generates valuable content
6. Chatbot handles 80% of questions
7. Platform breaks even in 6 months

## 🎬 Remember

Every feature should:
- Address a real pain point from Reddit
- Reduce friction for beginners
- Build trust through transparency
- Create value for all stakeholders
- Scale globally without changes

This is more than a website—it's the future of pet nutrition. Build it with the passion of a pet owner, the precision of an engineer, and the vision of an entrepreneur.

**Now go build something amazing! 🐕🥩✨**