# 🎯 RAWGLE: Complete Technical Specifications for Pet Platform Integration

## 📊 **EXECUTIVE SUMMARY**

RAWGLE currently operates as a **production-ready raw dog food supplier directory** with **9,190+ suppliers** indexed across the US. The platform features sophisticated search capabilities, real-time mapping, AWS Lambda-powered data scraping, and a secure admin portal. This infrastructure provides the **perfect foundation** for integration into the comprehensive pet care ecosystem.

---

## 🏗️ **CURRENT PRODUCTION INFRASTRUCTURE**

### **Cloudflare Stack (Existing)**
```yaml
Production Domains: rawgle.com (primary) + findrawdogfood.com (redirect)
Current Workers:
  - rawgle-com-production: Main site with enhanced UI
  - rawgle-production: Admin portal with Lambda dashboard  
  - rawgle-com: Enhanced user interface variant

D1 Databases:
  - findrawdogfood-db: 20.8MB, 9,190+ supplier records
  - Tables: suppliers (21 fields) + suppliers_complete (52 fields)

KV Namespaces:
  - RAWGLE_CACHE: Search result caching
  - RAWGLE_SESSIONS: Admin authentication
  - production-SCRAPER_KV: Lambda scraper state

R2 Buckets:
  - findrawdogfood-assets: Static assets
  - hunta-media-prod: Media storage
```

---

## 🗄️ **DATABASE ARCHITECTURE (EXISTING)**

### **Core Supplier Schema** 
```sql
-- Main suppliers table (9,190 records)
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  place_id TEXT,                -- Google Places unique ID
  name TEXT NOT NULL,           -- Business name
  address TEXT,                 -- Street address
  city TEXT,                    -- City
  state TEXT,                   -- State/Province
  country TEXT,                 -- Country
  postal_code TEXT,             -- ZIP/Postal code
  latitude REAL,                -- Geographic coordinates
  longitude REAL,               -- Geographic coordinates
  phone_number TEXT,            -- Contact phone
  website TEXT,                 -- Business website
  rating REAL,                  -- Google rating (1-5)
  user_ratings_total INTEGER,   -- Number of reviews
  types TEXT,                   -- Business categories (JSON)
  keyword TEXT,                 -- Search terms used
  place_type TEXT,              -- Google place type
  tile_lat REAL,                -- Map tile coordinates
  tile_lon REAL,                -- Map tile coordinates
  raw_data TEXT,                -- Full Google API response
  created_at TEXT               -- Record creation timestamp
);

-- Enhanced supplier data (52 total fields)
CREATE TABLE suppliers_complete (
  -- All above fields PLUS:
  formatted_address TEXT,        -- Google formatted address
  address_components TEXT,       -- JSON address breakdown
  adr_address TEXT,             -- Microformat address
  vicinity TEXT,                -- Area description
  opening_hours TEXT,           -- JSON business hours
  current_opening_hours TEXT,   -- Current schedule
  reviews TEXT,                 -- JSON customer reviews
  editorial_summary TEXT,       -- Google summary
  price_level INTEGER,          -- Price range (1-4)
  
  -- Service booleans
  delivery BOOLEAN,             -- Delivery available
  dine_in BOOLEAN,              -- Dine-in available  
  takeout BOOLEAN,              -- Takeout available
  reservable BOOLEAN,           -- Accepts reservations
  curbside_pickup BOOLEAN,      -- Curbside pickup
  wheelchair_accessible_entrance BOOLEAN,
  
  -- Food service flags
  serves_breakfast BOOLEAN,
  serves_lunch BOOLEAN,
  serves_dinner BOOLEAN,
  serves_brunch BOOLEAN,
  serves_beer BOOLEAN,
  serves_wine BOOLEAN,
  serves_vegetarian_food BOOLEAN,
  
  -- Media and presentation
  photos TEXT,                  -- JSON photo URLs
  icon TEXT,                    -- Google icon URL
  icon_background_color TEXT,   -- Brand color
  
  -- Metadata
  business_status TEXT,         -- OPERATIONAL/CLOSED_PERMANENTLY
  utc_offset INTEGER,           -- Timezone offset
  plus_code TEXT,               -- Google Plus Code
  geometry TEXT,                -- JSON location data
  api_version TEXT,             -- API version used
  updated_at TEXT               -- Last update timestamp
);
```

### **Geographic Coverage (Current)**
- **9,190 Verified Suppliers** across the United States
- **Multi-state Coverage**: All 50 states represented
- **Urban & Rural**: Major cities + smaller communities
- **Real-time Updates**: AWS Lambda daily refresh

---

## 🌐 **API ARCHITECTURE (CURRENT)**

### **Core Search APIs**
```javascript
// Text-based supplier search
GET /api/search?q={query}&limit={num}&offset={offset}
Response: {
  query: "austin raw dog food",
  results: [
    {
      id: "uuid",
      place_id: "ChIJ...",
      name: "Austin Raw Pet Nutrition", 
      formatted_address: "123 Main St, Austin, TX 78701",
      city: "Austin",
      state: "TX",
      latitude: 30.2672,
      longitude: -97.7431,
      rating: 4.7,
      user_ratings_total: 156,
      formatted_phone_number: "(512) 555-0123",
      website: "https://example.com",
      business_status: "OPERATIONAL",
      opening_hours: {
        open_now: true,
        periods: [...],
        weekday_text: [...]
      },
      services: {
        delivery: true,
        takeout: true,
        dine_in: false
      },
      photos: ["https://maps.googleapis.com/..."],
      created_at: "2024-01-15T10:30:00Z"
    }
  ],
  total: 1,
  offset: 0,
  limit: 20
}

// Geographic proximity search with distance calculation
GET /api/nearby?lat={lat}&lng={lng}&radius={miles}&limit={num}
Response: {
  location: { lat: 30.2672, lng: -97.7431 },
  radius: 25,
  results: [
    {
      ...supplier_data,
      distance: {
        km: 3.7,
        miles: 2.3,
        walking_minutes: 46,
        driving_minutes: 6
      },
      transport_mode: "drive"
    }
  ],
  total: 12
}

// Individual supplier details
GET /api/supplier?id={id}&place_id={place_id}
Response: {
  ...full_supplier_record,
  reviews: [
    {
      author_name: "Pet Owner",
      rating: 5,
      text: "Excellent raw food selection...",
      time: 1640995200
    }
  ],
  address_components: [
    { long_name: "Austin", types: ["locality"] },
    { long_name: "TX", types: ["administrative_area_level_1"] }
  ]
}

// Platform statistics
GET /api/stats
Response: {
  total_suppliers: 9190,
  cities_covered: 2847,
  states_covered: 50,
  highly_rated: 6143, // 4.5+ stars
  offer_delivery: 3276,
  with_photos: 8821,
  average_rating: 4.3,
  last_updated: "2024-08-13T12:00:00Z",
  domain: "rawgle.com"
}

// Cloudflare-powered geolocation
GET /api/location
Response: {
  ip: "31.186.113.200",
  location: {
    country: "US",
    region: "TX",
    city: "Austin", 
    latitude: 30.2672,
    longitude: -97.7431,
    timezone: "America/Chicago"
  },
  accuracy: "city-level",
  source: "cloudflare-cf"
}
```

---

## 🗺️ **MAPPING & GEOLOCATION SYSTEM**

### **Interactive Map Features** 
```javascript
// Leaflet.js-powered mapping system
Current Features:
- Real-time GPS location detection
- IP-based location fallback (Cloudflare)
- Custom supplier markers with business info
- Distance calculation (Haversine formula)
- Route visualization between user and suppliers
- Navigation integration (Google Maps, Waze, Apple Maps)
- Mobile-responsive map interface
- Automatic map centering and bounds fitting

Map Implementation:
- Tiles: CartoDB Positron (clean, minimal style)
- Markers: Custom 36px circular markers
- User Location: Pulsing red/green markers (GPS vs IP)
- Route Lines: Dashed lines with animation
- Popups: Rich supplier information overlays
```

### **Distance & Navigation**
```javascript
// Advanced distance calculations
Features:
- Real-time distance in miles/kilometers
- Walking/driving time estimates  
- Transport mode recommendations
- Multi-provider navigation links
- Caching for performance optimization

Navigation Providers:
- Google Maps: Direct deep links
- Waze: Turn-by-turn navigation
- Apple Maps: iOS native integration
```

---

## 🔧 **AWS LAMBDA INTEGRATION (EXISTING)**

### **Automated Scraping System**
```javascript
Lambda Function: rawgle-scraper
Runtime: Node.js 18.x
Memory: 1024 MB
Timeout: 14 minutes (840 seconds)
Schedule: Daily 6:00 AM UTC

Environment Variables:
- WEBHOOK_URL: https://rawgle.com/api/import-webhook
- GOOGLE_PLACES_API_KEY_1: [PRIMARY_KEY]
- GOOGLE_PLACES_API_KEY_2: [BACKUP_KEY]

Execution Strategy:
1. Chunked processing (4 parallel chunks planned)
2. City/keyword matrix search
3. API rate limiting management
4. Data validation and deduplication
5. Webhook callbacks to Cloudflare Workers
6. Error handling with exponential backoff
```

### **Search Matrix Configuration**
```javascript
Cities: [
  { name: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { name: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { name: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { name: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { name: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740 },
  // ... 10+ major metropolitan areas
]

Keywords: [
  "raw dog food store",
  "pet nutrition center", 
  "holistic pet food",
  "BARF diet supplier",
  "natural pet food"
]

API Management:
- 1,000 requests/day limit per key
- Multiple key rotation
- Request rate limiting
- Error retry logic
- Response validation
```

### **Lambda Dashboard & Monitoring**
```javascript
// Admin portal with real-time Lambda monitoring
Features:
- Function status monitoring
- Execution logs and metrics
- Manual function triggering
- Performance analytics
- Error tracking and alerts
- Configuration management
- Schedule management (4 chunks)

Monitoring Endpoints:
GET /admin/api/lambda-status
GET /admin/api/lambda-logs
GET /admin/api/lambda-metrics
POST /admin/api/lambda-invoke
POST /admin/api/lambda-run-now
```

---

## 🔐 **SECURITY & ADMIN PORTAL**

### **Multi-layer Security Model**
```javascript
Current Security Implementation:
1. IP Whitelisting: Specific admin IP restrictions
2. Session Management: KV-based secure sessions (8-hour TTL)
3. Domain Security: rawgle.com canonical, www redirects
4. Path Protection: /admin/* routes secured
5. CORS Configuration: Proper cross-origin headers
6. SSL/TLS: Cloudflare-provided certificates

Authentication Flow:
1. IP address validation against whitelist
2. Login form with username/password  
3. Cryptographically secure session token (32-byte)
4. KV storage with automatic expiration
5. HTTP-only secure cookies
6. Session cleanup via CRON
```

### **Admin Portal Features**
```javascript
// Comprehensive admin dashboard
Current Capabilities:
- Real-time database statistics
- Scraper status monitoring
- Manual crawl triggering (quick/full)
- Database operations (export, cleanup, backup)
- User session management
- Performance metrics
- Error log analysis
- Configuration management

Admin API Endpoints:
GET /admin/api/status
POST /admin/api/crawl (quick crawl)
POST /admin/api/crawl/full (comprehensive)
POST /admin/api/crawl/stop
GET /admin/api/database/stats
GET /admin/api/database/suppliers
GET /admin/api/database/export?format=csv|json
POST /admin/api/database/cleanup (remove duplicates)
POST /admin/api/database/backup
```

---

## 🎨 **FRONTEND ARCHITECTURE**

### **Enhanced User Interface**
```javascript
// Current frontend implementation
Technology Stack:
- Vanilla JavaScript (no frameworks)
- Leaflet.js for mapping
- CSS Grid/Flexbox responsive layout
- Progressive Web App capabilities
- Mobile-first responsive design

Key Features:
- Real-time search with debouncing
- GPS + IP location detection
- Interactive supplier selection (max 3)
- Lazy loading with pagination
- Toast notifications
- Mobile-optimized interface
- Accessibility considerations

UI Components:
- Header with logo and sign-in placeholder
- Search bar with location fallback
- 50/50 map/results layout (desktop)
- Supplier cards with checkbox selection
- Load more pagination
- Mobile-responsive stack layout
```

### **Progressive Enhancement**
```javascript
// Performance optimizations
Features:
- Cloudflare edge caching (1-2 hour TTL)
- Gzip compression
- Image optimization ready
- Lazy loading implementation
- Service worker ready
- Offline capability framework
- Fast page load times (<3 seconds)
```

---

## 🔗 **INTEGRATION REQUIREMENTS FOR PET PLATFORM**

### **User Management Integration**
```javascript
// Required new API endpoints for pet platform
POST /api/auth/login
POST /api/auth/register  
GET /api/auth/profile
PUT /api/auth/profile

// Pet profile connections
GET /api/pets/{pet_id}/suppliers
POST /api/pets/{pet_id}/suppliers/favorite
DELETE /api/pets/{pet_id}/suppliers/favorite/{supplier_id}

// Subscription management
GET /api/subscription/status
POST /api/subscription/upgrade
GET /api/subscription/benefits
```

### **PAWS Token Integration**
```javascript
// Cryptocurrency rewards for supplier interactions
POST /api/paws/reward
{
  user_id: "uuid",
  action_type: "supplier_visit|review|photo|referral",
  supplier_id: "uuid", 
  amount: 5, // PAWS earned
  metadata: {
    visit_duration: 1800, // seconds
    review_rating: 5,
    photo_count: 3
  }
}

Reward Structure:
- Supplier visit confirmation: 5 PAWS
- Review submission: 25 PAWS
- Photo upload: 10 PAWS per photo
- Successful referral: 50 PAWS
- Check-in at location: 15 PAWS
- Rating improvement: 10 PAWS bonus
```

### **NFT Integration**
```javascript
// Supplier achievement NFTs via Solana
POST /api/nft/mint
{
  user_id: "uuid",
  nft_type: "local_expert|five_star_supplier|community_favorite|hidden_gem",
  supplier_id: "uuid",
  achievement_data: {
    visits_count: 15,
    total_spend: 500,
    review_contributions: 8
  }
}

NFT Categories:
- "Local Expert": 15+ visits to suppliers in area
- "5-Star Supplier": 10+ visits to 4.5+ rated businesses  
- "Community Favorite": Most-visited by community
- "Hidden Gem": First 10 to discover new supplier
```

### **Community Features**
```javascript
// Social and community enhancements
GET /api/suppliers/{id}/community
{
  recent_visits: [
    {
      user: { name: "PetOwner123", avatar: "url" },
      pet: { name: "Buddy", breed: "Golden Retriever" },
      visit_date: "2024-08-12",
      review: "Great selection of raw turkey!",
      photos: ["url1", "url2"]
    }
  ],
  community_stats: {
    total_pet_customers: 47,
    avg_rating_by_pet_owners: 4.8,
    popular_products: ["raw beef", "frozen bones"],
    peak_visit_times: ["Saturday morning", "Thursday evening"]
  }
}

// Community reviews and recommendations
POST /api/suppliers/{id}/review
GET /api/suppliers/{id}/reviews
GET /api/suppliers/recommendations?pet_id={id}
```

---

## 📊 **ENHANCED DATABASE SCHEMA FOR PET PLATFORM**

### **Additional Tables Required**
```sql
-- User accounts and pet connections
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  wallet_address TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  paws_balance INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pet profiles linked to suppliers
CREATE TABLE pet_supplier_interactions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  supplier_id TEXT REFERENCES suppliers(id),
  interaction_type TEXT, -- visit, favorite, review, photo
  interaction_data TEXT, -- JSON metadata
  paws_earned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community reviews specific to pet owners
CREATE TABLE supplier_reviews (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  user_id TEXT REFERENCES users(id),
  pet_id TEXT, -- Optional pet context
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT,
  photos TEXT, -- JSON array of photo URLs
  helpful_votes INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PAWS transaction history
CREATE TABLE paws_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  supplier_id TEXT REFERENCES suppliers(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT,
  solana_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NFT achievements
CREATE TABLE supplier_nfts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  supplier_id TEXT REFERENCES suppliers(id),
  nft_type TEXT,
  solana_mint_address TEXT UNIQUE,
  metadata_uri TEXT,
  achievement_data TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 **DEPLOYMENT & SCALING PLAN**

### **Phase 1: Integration (Week 1-2)**
```yaml
Objective: Integrate existing RAWGLE into pet platform
Tasks:
  - Preserve all 9,190 supplier records
  - Maintain existing API backward compatibility  
  - Add user authentication layer
  - Implement PAWS reward system
  - Create pet-supplier connection APIs
  
Cloudflare Services:
  - Keep existing Workers
  - Extend D1 schema with new tables
  - Add KV namespaces for PAWS/NFT data
  - Configure additional R2 buckets for pet content
```

### **Phase 2: Enhanced Features (Week 3-4)**
```yaml
Objective: Roll out community and NFT features
Tasks:
  - Deploy Solana NFT minting
  - Launch community review system
  - Implement supplier recommendation engine
  - Add mobile app APIs
  - Create advanced analytics
  
Infrastructure:
  - Deploy Durable Objects for real-time features
  - Set up Queues for background processing
  - Configure Workers AI for recommendations
  - Add analytics tracking
```

### **Phase 3: Scale & Optimize (Week 5+)**
```yaml
Objective: Production optimization and growth
Tasks:
  - Performance monitoring and optimization
  - Advanced caching strategies
  - Auto-scaling configuration
  - Mobile app integration
  - Enterprise features
```

---

## 💰 **COST OPTIMIZATION**

### **Current Infrastructure Costs**
```yaml
Estimated Monthly Costs (Pure Cloudflare):
- Workers: ~$5-15 (request volume dependent)
- D1 Database: ~$1-5 (20MB current, growth expected)
- KV Operations: ~$1-3 (caching and sessions)
- R2 Storage: ~$1-2 (current assets)
- Domain & DNS: $0 (included)
- Bandwidth: $0 (no egress fees)

Total Current: ~$8-25/month

Enhanced Platform Costs:
- Additional Workers: ~$10-20
- Expanded D1 Usage: ~$5-15
- KV for PAWS/NFT: ~$5-10
- R2 for Media: ~$5-15
- Durable Objects: ~$5-15
- Queues: ~$1-5

Total Enhanced: ~$39-105/month
```

### **Scaling Economics**
- **Pure Cloudflare**: Linear cost scaling with usage
- **No Data Egress Fees**: Significant savings vs AWS/GCP
- **Global Distribution**: Built-in performance worldwide
- **Auto-scaling**: No manual capacity planning needed

---

## 🎯 **SUCCESS METRICS & KPIs**

### **Current Performance Benchmarks**
- **API Response Time**: <200ms global average
- **Search Accuracy**: 99.9% relevant results 
- **Uptime**: 99.9% SLA
- **Database Query Speed**: <50ms average
- **Map Load Time**: <3 seconds
- **Supplier Data Freshness**: Daily updates

### **Enhanced Platform Targets**
- **User Engagement**: 80% monthly active user retention
- **PAWS Circulation**: 10,000 daily transactions
- **NFT Minting**: 100 NFTs per month
- **Community Reviews**: 500 reviews per month
- **Supplier Discovery**: 25% improvement in local discovery

---

## 🔄 **MIGRATION & CONTINUITY PLAN**

### **Zero-Downtime Migration Strategy**
```yaml
Week 1: Parallel Deployment
- Deploy enhanced Workers alongside existing
- Test new APIs with existing data
- Gradual traffic routing via Cloudflare

Week 2: Feature Rollout  
- Enable user registration/login
- Launch PAWS reward system
- Activate community features

Week 3: Full Integration
- Complete mobile app integration
- Launch NFT marketplace
- Enable advanced analytics

Week 4: Optimization
- Performance tuning
- Cache optimization
- Error monitoring
```

### **Rollback Procedures**
- **Instant DNS Routing**: Switch traffic back in seconds
- **Database Versioning**: Maintain separate tables during transition
- **API Versioning**: Support both v1 (current) and v2 (enhanced)
- **Backup Systems**: Complete R2-based backups

---

## 📋 **FINAL INTEGRATION CHECKLIST**

### **Must Preserve (Critical)**
- ✅ **9,190 supplier records** with complete metadata
- ✅ **Geographic search** capabilities
- ✅ **Real-time mapping** with route planning
- ✅ **AWS Lambda scraper** integration  
- ✅ **Admin portal** functionality
- ✅ **Security model** (IP + session auth)
- ✅ **Domain configuration** (rawgle.com)
- ✅ **API backward compatibility**

### **Must Enhance (New Platform)**
- 🆕 **User authentication** system
- 🆕 **Pet profile** connections  
- 🆕 **PAWS cryptocurrency** rewards
- 🆕 **NFT minting** for achievements
- 🆕 **Community features** (reviews, photos)
- 🆕 **Mobile app** APIs
- 🆕 **Recommendation engine**
- 🆕 **Subscription management**

### **Performance Requirements**
- **Global Response Time**: <100ms (50% improvement)
- **Search Accuracy**: >99.9% (maintain)
- **Database Performance**: <25ms (50% improvement)
- **Uptime SLA**: 99.95% (improve)
- **Mobile Performance**: <2 second loads

---

This **comprehensive foundation** provides everything needed to seamlessly integrate RAWGLE's proven supplier directory into the enhanced pet care ecosystem while preserving all existing functionality and data! 🐾