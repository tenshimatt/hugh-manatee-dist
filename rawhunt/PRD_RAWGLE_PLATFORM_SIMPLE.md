# Rawgle Platform - Simplified Product Requirements Document
**Version**: 2.0 - Simplified Architecture  
**Date**: August 21, 2025  
**Principle**: Use the simplest possible Cloudflare architecture

---

## 🎯 Core Principle: KISS (Keep It Simple, Stupid)

**NO OVERENGINEERING** - Use Cloudflare's simplest patterns:
- Single Worker for all API endpoints
- D1 for database (no complex migrations)
- KV for sessions/cache (no Redis)
- R2 for images only when needed
- Basic HTML/JS frontend (no complex build process)

---

## 📋 Executive Summary

### What We're Building
A simple raw pet food directory and community platform. Think "Yelp for raw pet food" with basic AI chat.

### Current Reality
- Platform is 18% complete
- Backend doesn't work
- Database is empty
- We have 9,137 supplier records to import

### Simple Solution
1. Fix the backend API (one Worker file)
2. Import supplier data
3. Connect frontend to backend
4. Add Claude chat (one endpoint)
5. Ship it

---

## 🛠️ Technical Architecture (SIMPLIFIED)

### The Entire Backend = One Cloudflare Worker

```javascript
// wrangler.toml - That's it, one Worker
name = "rawgle-api"
main = "src/index.js"

[[d1_databases]]
binding = "DB"
database_name = "rawgle"
database_id = "your-db-id"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-id"

[vars]
CLAUDE_API_KEY = "sk-ant-..."
JWT_SECRET = "your-secret"
```

### Database = One D1 Instance
```sql
-- Just 5 simple tables, no complex relations
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  paws_balance INTEGER DEFAULT 0
);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  lat REAL,
  lng REAL,
  phone TEXT,
  website TEXT,
  rating REAL DEFAULT 0
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  supplier_id TEXT,
  rating INTEGER,
  text TEXT,
  created_at TEXT
);

CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  breed TEXT,
  age_years INTEGER
);

CREATE TABLE paws_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount INTEGER,
  type TEXT, -- 'earned' or 'spent'
  reason TEXT,
  created_at TEXT
);
```

### Frontend = Static HTML + Vanilla JS
```html
<!-- No React complexity, just plain HTML -->
<!DOCTYPE html>
<html>
<head>
  <title>Rawgle - Raw Pet Food Directory</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app">
    <!-- Simple DOM manipulation with vanilla JS -->
  </div>
  <script src="app.js"></script>
</body>
</html>
```

---

## 🔧 Functional Requirements (MVP ONLY)

### 1. User Authentication (SIMPLE)
```javascript
// Just email/password, no OAuth complexity
POST /api/register - Create account
POST /api/login - Get JWT token
GET /api/me - Get user info
```

### 2. Supplier Directory (BASIC)
```javascript
GET /api/suppliers?lat=X&lng=Y&radius=50 - Find nearby suppliers
GET /api/suppliers/:id - Get supplier details
// That's it - no complex filtering
```

### 3. Reviews (MINIMAL)
```javascript
POST /api/reviews - Add review (1-5 stars + text)
GET /api/suppliers/:id/reviews - Get reviews
// No moderation, no voting, just reviews
```

### 4. PAWS Tokens (SIMPLIFIED)
```javascript
// Just track balance, no blockchain
GET /api/paws/balance - Get balance
POST /api/paws/earn - Add points (for reviews)
POST /api/paws/spend - Use points (for discounts)
// No transfers, no complex economics
```

### 5. Claude Chat (ONE ENDPOINT)
```javascript
POST /api/chat - Send message, get response
// That's it - one Claude endpoint for all AI features
```

---

## 🚫 What We're NOT Building (Avoid Complexity)

### NOT in MVP:
- ❌ OAuth/social login (just email/password)
- ❌ Real-time features (no WebSockets)
- ❌ Complex search filters (just location radius)
- ❌ Order management (suppliers handle this)
- ❌ Payment processing (external links only)
- ❌ Email notifications (maybe later)
- ❌ Mobile app (responsive web only)
- ❌ Admin panel (direct database edits)
- ❌ Analytics dashboard (use Cloudflare Analytics)
- ❌ A/B testing (ship one version)
- ❌ Microservices (one Worker does everything)
- ❌ GraphQL (REST is simpler)
- ❌ TypeScript (JavaScript is fine)
- ❌ Complex state management (localStorage)
- ❌ Service workers/PWA (regular web app)

---

## 📅 Simple Implementation Plan

### Week 1: Fix Backend
```javascript
// One developer, one file, one week
- Set up D1 database with 5 tables
- Create 10 API endpoints total
- Import 9,137 suppliers
- Test with Postman
```

### Week 2: Connect Frontend
```javascript
// Make existing UI actually work
- Connect login/register forms
- Display real suppliers on map
- Show supplier details
- Add review form
```

### Week 3: Add Claude & Deploy
```javascript
// Minimal AI integration
- Add one chat endpoint
- Simple chat UI
- Deploy to production
- Done
```

---

## 💰 Simple Budget

### Development (3 weeks)
- 1 Backend Developer: 3 weeks × $3,000 = $9,000
- 1 Frontend Developer: 2 weeks × $2,500 = $5,000
- **Total Development**: $14,000

### Infrastructure (Monthly)
- Cloudflare Workers: $5/month
- D1 Database: Free tier
- KV Storage: Free tier
- Claude API: ~$100/month
- **Total Monthly**: $105

### Annual Cost
- Development: $14,000 (one-time)
- Infrastructure: $1,260/year
- **Total First Year**: $15,260

---

## 🎯 Success Metrics (Keep It Simple)

### Launch Goals (Month 1)
- [ ] 100 registered users
- [ ] 50 reviews submitted
- [ ] Platform stays online
- [ ] Claude chat works

### Growth Goals (Month 6)
- [ ] 1,000 registered users
- [ ] 500 reviews submitted
- [ ] 5,000 monthly visits
- [ ] Break even on costs

---

## ⚡ Implementation Checklist

### Backend (index.js - One File)
```javascript
□ Set up Cloudflare Worker
□ Connect D1 database
□ Add user registration/login
□ Add supplier search endpoint
□ Add review endpoints
□ Add PAWS balance tracking
□ Add Claude chat endpoint
□ Deploy to production
```

### Frontend (index.html + app.js)
```javascript
□ Create simple HTML layout
□ Add login/register forms
□ Add supplier map (use Leaflet)
□ Add supplier detail pages
□ Add review submission
□ Add Claude chat box
□ Deploy to Cloudflare Pages
```

### Data
```javascript
□ Export suppliers from old system
□ Clean data (remove duplicates)
□ Import to D1 database
□ Verify data integrity
```

---

## 🚀 Why This Will Work

1. **Simple = Fast**: Can build in 3 weeks, not 12
2. **Simple = Cheap**: $15k, not $92k
3. **Simple = Maintainable**: One developer can handle everything
4. **Simple = Reliable**: Fewer moving parts = fewer failures
5. **Simple = Scalable**: Cloudflare handles scaling automatically

---

## 📝 Final Notes

### Core Philosophy
"Do one thing well" - We're a supplier directory with reviews and basic AI chat. That's it.

### What Makes This Different
- Previous plan: 12 weeks, $92k, 5 developers, complex architecture
- This plan: 3 weeks, $15k, 1-2 developers, dead simple architecture

### The Secret
Most users just want to:
1. Find nearby suppliers
2. Read reviews
3. Ask basic questions
4. Get rewards for participating

We deliver exactly that, nothing more.

### Remember
- Every feature that isn't "find suppliers" or "read reviews" is optional
- Claude integration is just one endpoint, not a complex AI system
- PAWS tokens are just points in a database, not blockchain
- The frontend can be plain HTML if it works

**Ship something simple that works, not something complex that doesn't.**