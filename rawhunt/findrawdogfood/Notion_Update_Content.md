# RAWGLE.COM - Project Documentation (Copy to Notion)

## How to Update Your Notion Page:

1. Go to: https://www.notion.so/tenshimatt/FindRawDogFood-Website-Modernization-Platform-Production-Status-2379eccaddb18115bb5ee7b39b4ad3cf

2. Update the page title to: "RAWGLE.COM - Complete Project Documentation & Production Status"

3. Replace all content with the documentation below:

---

# 🎯 Project Overview

**Current Domain:** RAWGLE.COM (Primary) + FindRawDogFood.com (301 Redirect)  
**Status:** Production Ready - Minor deployment fixes needed  
**Database:** 9,137+ verified raw dog food suppliers globally  
**Technology Stack:** Cloudflare Workers + D1 Database + Modern Web UI  

## 📋 Executive Summary

RAWGLE.COM is a comprehensive raw dog food supplier directory that has evolved from FindRawDogFood.com. The platform helps pet owners find local raw food suppliers, BARF diet retailers, and natural pet nutrition stores. The backend infrastructure is complete with a robust API system, while the frontend requires final deployment coordination.

---

## 🏗️ Technical Architecture

### Infrastructure Overview
- **Frontend:** Modern responsive web application
- **Backend:** Cloudflare Workers (serverless)  
- **Database:** Cloudflare D1 (SQLite-based)
- **CDN:** Cloudflare global edge network
- **Domain:** RAWGLE.COM (primary) + FindRawDogFood.com (redirect)

### Current File Structure
```
/Users/mattwright/pandora/findrawdogfood/
├── src/
│   ├── rawgle-worker.js          # Main worker (NEEDS FIX)
│   ├── improved-index.js         # Working UI code
│   └── original-worker.js        # Legacy worker
├── wrangler.toml                 # Production config
├── wrangler-rawgle.toml         # RAWGLE config template
├── test-records.sql             # Test data
├── deploy-rawgle.sh             # Deployment script
└── debug-database.sh            # Database tools
```

---

## 📊 Database Architecture

### Primary Tables

#### suppliers (Production Data)
- **Records:** 9,137 verified suppliers
- **Schema:** 21 columns including geo-coordinates
- **Purpose:** Main production data from Google Places API
- **Key Fields:** id, name, address, city, state, country, latitude, longitude, rating, phone_number, website

#### suppliers_complete (Enhanced Data)
- **Records:** 2 test records + future enhanced data
- **Schema:** 52 columns with full Google Places details
- **Purpose:** Rich data with photos, reviews, opening hours
- **Key Fields:** All suppliers fields + photos, reviews, opening_hours, business_status, services

#### Supporting Tables
- **searches:** Query logging and analytics
- **affiliate_clicks:** Revenue tracking
- **_cf_KV:** Cloudflare key-value storage

### Test Data Coordinates
- **Jersey Test (TEST-JSY):** 49.2247, -2.2047 (St Ouens, Jersey)
- **London Test (TEST-UK):** 51.5408, -0.1426 (Camden, London)

---

## 🌐 Domain & DNS Configuration

### Domain Strategy
- **Primary:** RAWGLE.COM (main branding, SEO focus)
- **Legacy:** FindRawDogFood.com (301 redirect for SEO preservation)
- **Subdomain:** www.rawgle.com (redirects to apex)

### DNS Records (Cloudflare)
```
Type    Name         Content        Proxy    Status
A       rawgle.com   192.0.2.1     Proxied  ✅ Active
CNAME   www          rawgle.com    Proxied  ✅ Active
```

### Worker Routes
```
rawgle.com/*
www.rawgle.com/*
findrawdogfood.com/*        # 301 → rawgle.com
www.findrawdogfood.com/*    # 301 → rawgle.com
```

---

## 🔧 API Endpoints & Functionality

### Search API `/api/search`
**Purpose:** Universal search across suppliers  
**Parameters:**
- `q`: Query string (searches name, city, state, address)
- `limit`: Results limit (default: 20, max: 100)
- `minRating`: Minimum rating filter (default: 0)

**Example:**
```bash
curl "https://rawgle.com/api/search?q=london&limit=10"
```

### Nearby Search API `/api/nearby`
**Purpose:** Geolocation-based supplier discovery  
**Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)  
- `radius`: Search radius in miles (default: 25, max: 100)
- `limit`: Results limit (default: 10, max: 50)

**Features:**
- Haversine distance calculation
- Travel time estimates (walking/driving)
- Distance sorting

**Example:**
```bash
curl "https://rawgle.com/api/nearby?lat=51.5408&lng=-0.1426&radius=10"
```

### Other APIs
- **Statistics API** `/api/stats` - Real-time database metrics
- **Supplier Details API** `/api/supplier` - Individual supplier information
- **Location Detection API** `/api/location` - IP-based geolocation

---

## 🎨 UI/UX Design System

### Brand Identity: RAWGLE
- **Logo:** "RAWGLE" wordmark with optional paw print
- **Colors:** Golden retriever inspired palette
  - Primary Golden: #D4A574
  - Primary Brown: #8B6914  
  - Accent Green: #7A9B76
  - Background Cream: #FDF8F0

### Dark Mode Support
- **Base:** Claude-style grey (#2D2D2D)
- **System preference detection**
- **Manual toggle with localStorage persistence**
- **CSS custom properties for instant switching**

---

## 🚀 Current Status & Issues

### Immediate Issues to Fix
1. **Database Mismatch:** Worker pointing to test DB instead of production
2. **UI Missing:** API-only worker deployed, lost full website
3. **Route Configuration:** Minor conflicts resolved

### Immediate Fix Required
```bash
cd /Users/mattwright/pandora/findrawdogfood

# Use working UI code as main worker
cp src/improved-index.js src/rawgle-worker.js

# Deploy to production
npx wrangler deploy --env production

# Verify functionality
curl https://rawgle.com/api/stats
curl "https://rawgle.com/api/search?q=TEST-JSY"
```

---

## 🧪 Testing & QA

### Test Records Available
- **TEST-JSY:** Jersey supplier for European testing
- **TEST-UK:** London supplier for UK testing

### API Testing Commands
```bash
# Search functionality
curl "https://rawgle.com/api/search?q=TEST-JSY"
curl "https://rawgle.com/api/search?q=london"

# Geolocation testing  
curl "https://rawgle.com/api/nearby?lat=49.2247&lng=-2.2047&limit=5"
curl "https://rawgle.com/api/nearby?lat=51.5408&lng=-0.1426&limit=5"

# Statistics & health check
curl "https://rawgle.com/api/stats"
```

---

## 🎯 Next Phase Roadmap

### Phase 0.3: Enhanced Geolocation
- Real-time location detection
- Travel time calculations
- Proximity-based recommendations

### Phase 0.4: Interactive Maps
- Google Maps integration
- Custom dog-themed markers
- Route planning to suppliers

### Phase 1.0: Mobile App
- Progressive Web App (PWA)
- Offline supplier caching
- Push notifications

---

## 📞 Key Resources

### Technical Resources
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **D1 Database ID:** 9dcf8539-f274-486c-807b-7e265146ce6b
- **Worker Name:** findrawdogfood-production
- **Domain:** RAWGLE.COM

### Project Files Location
- **Local Path:** `/Users/mattwright/pandora/findrawdogfood/`

---

## 🏁 Current Status Summary

**Status:** 95% Complete - Final Deployment Pending  
**Database:** Production Ready (9,137 suppliers)  
**Domain:** Active (rawgle.com)  
**Infrastructure:** Fully Configured  

**Immediate Action Required:**
1. Deploy corrected worker code (5 minutes)
2. Verify API functionality (10 minutes)  
3. Test search and geolocation features (15 minutes)

**Timeline to Full Production:** 30 minutes maximum

---

*Last Updated: July 23, 2025*  
*Project Status: Ready for Production Launch*
