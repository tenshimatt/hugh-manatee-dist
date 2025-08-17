# Rawgle.com Implementation Prompt - World-Class Raw Feeding Platform

## Context
You are building a comprehensive raw feeding community platform that combines education, commerce, community, and personalized recommendations. The platform should be the definitive resource for raw dog food feeding, creating a thriving ecosystem that connects pet owners, suppliers, and experts.

## Core Platform Requirements

### 1. Multi-Pet Profile System
- **Data to Capture**: Pet name, age, breed (with mixed breed support), weight, sex, activity level, health conditions, dietary restrictions, microchip ID, photos
- **Advanced Features**: Weight tracking graphs, feeding logs, health records, vaccination schedules, vet appointment reminders
- **Location Services**: User location for supplier matching, delivery zone detection, local community groups

### 2. Intelligent Food Matching Engine
**User Flow**:
1. User creates detailed pet profiles
2. System analyzes breed-specific nutritional requirements
3. Cross-references with available products in user's location
4. Generates personalized recommendations in 3 categories:
   - **Recommended** (up to 3 products)
   - **Alternative Options** (up to 3 products)
   - **Avoid** (products that don't meet requirements)

**Matching Criteria**:
- Breed-specific nutritional needs
- Age-appropriate formulations (puppy/adult/senior)
- Activity level caloric requirements
- Health condition accommodations
- Allergen avoidance
- Price range preferences
- Supplier proximity and delivery options

### 3. Review & Rating System
**Review Types**:
- Product reviews (with verified purchase badges)
- Supplier reviews (reliability, freshness, service)
- Feeding outcome tracking (coat quality, energy levels, digestive health)

**Features**:
- Photo/video uploads
- Pros/cons lists
- Helpful vote system
- ML-powered fake review detection
- Response capabilities for suppliers

### 4. Community Hub
**Channels to Create**:
- Breed-specific groups (auto-suggested based on user's pets)
- Regional/local groups
- Topic channels: Beginners, Transitioning, Senior Dogs, Puppies, Health Issues
- Expert Q&A (verified nutritionists/vets)
- Success Stories
- Recipe Sharing

**Features**:
- Real-time chat with typing indicators
- Direct messaging between users
- Expert verification badges
- Moderation tools and reporting
- Rich media sharing

### 5. Educational Platform
**Content Categories** (10 Core Topics):
1. **What is Raw Feeding?** - Complete beginner's guide
2. **Getting Started** - Step-by-step transition guide
3. **Finding Suppliers** - How to evaluate and choose
4. **Choosing for Your Dog** - Personalized selection guide
5. **Age-Specific Guides** - Puppies, adults, seniors
6. **Breed-Specific Nutrition** - 350+ breed guides
7. **Nutritional Science** - Proteins, fats, carbs, supplements
8. **Food Types Comparison** - Raw vs kibble, different raw types
9. **Safety & Handling** - Storage, preparation, hygiene
10. **Cost Optimization** - Bulk buying, meal prep strategies

**Content Formats**:
- Video tutorials (hosted on Cloudflare Stream)
- Interactive calculators (portion sizes, transition schedules)
- Downloadable PDFs and meal plans
- Infographics and visual guides
- Expert interviews and webinars

### 6. E-commerce Marketplace
**Product Categories**:
- **Merchandise**: T-shirts, caps, hoodies (dog & human)
- **Equipment**: Scales, storage containers, prep tools
- **Feeding Accessories**: Bowls, slow feeders, puzzle feeders
- **Supplements**: Joint support, probiotics, omega oils
- **Raw Food**: Direct supplier integration, subscription boxes
- **Books & Courses**: Educational materials

**Features**:
- Subscription management
- Auto-reorder options
- Bulk discount calculations
- Wishlist and favorites
- Gift subscriptions
- Affiliate program for influencers

### 7. Supplier Portal
**Capabilities**:
- Inventory management API
- Real-time availability updates
- Delivery zone mapping
- Order management
- Customer communication
- Performance analytics
- Promotional tools

### 8. Monetization Strategy
**Revenue Streams**:
1. **Subscriptions**:
   - Basic (Free): Limited features, 1 pet profile
   - Premium ($9.99/mo): Unlimited pets, advanced matching
   - Professional ($29.99/mo): Breeder tools, bulk ordering
   - Business ($99.99/mo): Supplier account

2. **Transaction Fees**:
   - 5% marketplace commission
   - Payment processing (2.9% + $0.30)
   - Featured product placement

3. **Advertising**:
   - Sponsored listings
   - Banner ads (non-intrusive)
   - Newsletter sponsorships

4. **Additional Services**:
   - Consultation bookings
   - Custom meal plan creation
   - White-label platform licensing
   - API access for developers

### 9. Technical Implementation

**Frontend Requirements**:
- Responsive design (mobile-first)
- Progressive Web App capabilities
- Offline functionality for core features
- Real-time updates (chat, inventory)
- Interactive data visualizations
- AR for portion size visualization

**Performance Targets**:
- Page load: <2 seconds
- Time to interactive: <3 seconds
- 99.9% uptime
- <100ms API response time

**SEO & Marketing**:
- Schema markup for all products
- Local SEO for supplier pages
- Blog content optimization
- Social media integration
- Email marketing automation
- Referral program tracking

### 10. Advanced Features

**AI-Powered Tools**:
- Breed detection from photos
- Portion size recommendations
- Price trend predictions
- Seasonal feeding adjustments
- Health issue early warning system

**Integrations**:
- Vet clinic partnerships
- Pet insurance connections
- Fitness tracker compatibility
- Calendar sync for feeding schedules
- Accounting software exports

**Analytics Dashboard**:
- Feeding cost tracking
- Nutritional balance reports
- Health improvement metrics
- Community engagement stats
- Supplier performance comparisons

## Implementation Architecture

```
Frontend: Cloudflare Pages + React
API: Cloudflare Workers
Database: Supabase PostgreSQL
Real-time: Cloudflare Durable Objects
Storage: Cloudflare R2
CDN: Cloudflare
Video: Cloudflare Stream
Search: Cloudflare D1 + Vector embeddings
ML/AI: AWS SageMaker via Workers
Payments: Stripe via Workers
Email: SendGrid via Workers
SMS: Twilio via Workers
Analytics: Cloudflare Analytics + Custom
Monitoring: Sentry + Custom Dashboards
```

## Success Metrics

1. **User Engagement**:
   - Daily active users
   - Average session duration
   - Community posts per day
   - Review submissions

2. **Business Metrics**:
   - Monthly recurring revenue
   - Transaction volume
   - Supplier retention
   - Customer lifetime value

3. **Platform Health**:
   - API response times
   - Error rates
   - Search relevance scores
   - Recommendation accuracy

## Launch Strategy

**Phase 1 (MVP - Weeks 1-4)**:
- Basic pet profiles
- Simple food matching
- Core supplier directory
- Essential educational content

**Phase 2 (Community - Weeks 5-8)**:
- Forum launch
- Review system
- Expert verification
- Mobile optimization

**Phase 3 (Commerce - Weeks 9-12)**:
- Full marketplace
- Payment processing
- Subscription tiers
- Supplier tools

**Phase 4 (Intelligence - Weeks 13-16)**:
- AI recommendations
- Advanced analytics
- Predictive features
- API launch

**Phase 5 (Scale - Weeks 17-20)**:
- Performance optimization
- International expansion
- White-label offerings
- Partner integrations

## Key Differentiators

1. **Comprehensive Ecosystem**: Not just a directory or forum, but a complete platform
2. **Data-Driven Matching**: Scientific approach to food recommendations
3. **Community-First**: Building trust through transparency and peer support
4. **Education Focus**: Empowering owners with knowledge
5. **Supplier Partnership**: Not competing but enabling suppliers
6. **Mobile Excellence**: Best-in-class mobile experience
7. **Global Scalability**: Architecture ready for worldwide expansion

This prompt provides the complete blueprint for building Rawgle.com as the definitive raw feeding platform. Execute each component with the Cloudflare-first approach, ensuring scalability, performance, and user experience excellence at every step.
