# RAWGLE Technical Architecture Guide
*Last Updated: September 5, 2025 - 11:07 UTC*

## 🏛️ System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Next.js 14    │◄──►│   Express TS    │◄──►│   PostgreSQL    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       └──────────────►│     Redis       │
         │                                      │   Port: 6379    │
         │                                      └─────────────────┘
         │
┌─────────────────┐
│   CDN/Assets    │
│   Static Files  │
└─────────────────┘
```

## 🎯 Frontend Architecture

### Next.js 14.1.0 Configuration
**Framework:** Next.js with App Router  
**Language:** TypeScript (Strict Mode)  
**Styling:** Tailwind CSS  
**Status:** ⚠️ Operational with ReactQuery Issue  

#### Directory Structure
```
rawgle-frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx         # Root layout ✅
│   │   ├── page.tsx           # Homepage ✅
│   │   ├── globals.css        # Global styles ✅
│   │   ├── chat/              # Chat functionality ✅
│   │   ├── shop/              # E-commerce pages ✅
│   │   ├── blog/              # Content management ✅
│   │   ├── community/         # Community features ✅
│   │   ├── locations/         # Store locator ✅
│   │   └── pricing/           # Pricing pages ✅
│   │
│   ├── components/            # Reusable UI Components
│   │   ├── ui/               # Base UI components ✅
│   │   ├── layout/           # Layout components ✅
│   │   ├── auth/             # Authentication UI ✅
│   │   ├── chat/             # Chat components ✅
│   │   ├── feeding/          # Pet feeding tools ✅
│   │   ├── home/             # Homepage sections ✅
│   │   └── store-locator/    # Location finding ✅
│   │
│   ├── lib/                  # Utilities & Configuration
│   │   ├── utils.ts          # Helper functions ✅
│   │   └── validations.ts    # Form validation ✅
│   │
│   ├── hooks/                # Custom React hooks ✅
│   ├── services/             # API service layer ✅
│   ├── types/                # TypeScript definitions ✅
│   └── data/                 # Static data & constants ✅
│
├── public/                   # Static assets ✅
├── tests/                    # Playwright tests ✅
└── configuration files       # Various config files ✅
```

#### Frontend Technology Stack
```typescript
// Core Framework
Next.js: 14.1.0 (App Router)
React: 18.x (Server Components + Client Components)
TypeScript: 5.x (Strict mode enabled)

// State Management  
React Query: ⚠️ CRITICAL CONFIGURATION ISSUE
Zustand: Planned for global state
React Hook Form: Form handling

// Styling & UI
Tailwind CSS: 3.x (Utility-first CSS)
Headless UI: Accessible components
Framer Motion: Animations (planned)

// Development Tools
ESLint: Code linting ✅
Prettier: Code formatting ✅
TypeScript: Type checking ✅
```

#### Critical Frontend Issue
```typescript
// ReactQuery DevTools Error - BLOCKING NAVIGATION
Location: node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:19:15
Error: No QueryClient set, use QueryClientProvider to set one
Impact: All page navigation blocked
Status: 🚨 CRITICAL - Requires immediate fix
Root Cause: Missing or misconfigured QueryClientProvider in app layout
```

## 🖥️ Backend Architecture

### Express TypeScript Server
**Framework:** Express.js with TypeScript  
**Language:** TypeScript (Strict)  
**Status:** ✅ Operational with Graceful Fallbacks  

#### Backend Directory Structure
```
rawgle-backend/
├── src/
│   ├── server.ts             # Main server entry ✅
│   ├── config/               # Configuration
│   │   ├── database.ts       # DB connection ✅
│   │   ├── redis.ts          # Redis config ✅
│   │   └── environment.ts    # Env variables ✅
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # Authentication ✅
│   │   ├── cors.ts          # CORS handling ✅
│   │   ├── security.ts      # Security headers ✅
│   │   ├── logging.ts       # Request logging ✅
│   │   └── validation.ts    # Input validation ✅
│   │
│   ├── routes/              # API routes
│   │   ├── index.ts         # Route aggregator ✅
│   │   ├── auth.ts          # Authentication endpoints ✅
│   │   ├── users.ts         # User management ✅
│   │   ├── suppliers.ts     # Supplier directory ✅
│   │   └── health.ts        # Health checks ✅
│   │
│   ├── services/            # Business logic
│   │   ├── authService.ts   # Authentication logic ✅
│   │   ├── userService.ts   # User operations ✅
│   │   └── supplierService.ts # Supplier logic ✅
│   │
│   ├── models/              # Data models
│   │   ├── User.ts          # User model ✅
│   │   ├── Supplier.ts      # Supplier model ✅
│   │   └── Product.ts       # Product model ✅
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Winston logger ✅
│   │   ├── validation.ts    # Data validation ✅
│   │   └── helpers.ts       # General helpers ✅
│   │
│   └── types/               # TypeScript definitions ✅
│
├── logs/                    # Log files ✅
└── configuration files      # Various config files ✅
```

#### Backend Technology Stack
```typescript
// Core Framework
Express.js: 4.x (Web framework)
TypeScript: 5.x (Static typing)
Node.js: 24.4.1 (Runtime)

// Database & Cache
PostgreSQL: pg library (✅ configured, ❌ not connected)
Redis: ioredis (✅ configured, ❌ not connected)
Database Pooling: pg-pool (✅ active)

// Authentication & Security  
JWT: jsonwebtoken (✅ configured)
bcrypt: Password hashing (✅ configured)
helmet: Security headers (✅ active)
cors: Cross-origin requests (✅ configured)

// Logging & Monitoring
Winston: Structured logging (✅ active)
Morgan: HTTP request logging (✅ active)

// Development Tools
tsx: TypeScript execution (✅ hot reload active)
nodemon: Development server (✅ file watching)
```

#### Backend Service Status
```typescript
// Server Status - OPERATIONAL ✅
Port: 8000
Environment: development  
Hot Reload: ✅ tsx watch active
Memory Usage: 182MB RSS, 23MB heap
Uptime: Active since startup

// Database Status - FALLBACK MODE ⚠️
PostgreSQL: ❌ ECONNREFUSED (expected in dev)
Connection Pool: ✅ Initialized with graceful error handling
Retry Logic: ✅ Connection attempts with exponential backoff
Schema: ⚠️ Not created (database offline)

// Cache Status - FALLBACK MODE ⚠️  
Redis: ❌ ECONNREFUSED (expected in dev)
Retry Attempts: ✅ 10 attempts with 50ms+ backoff
Fallback Cache: ✅ In-memory caching active
Session Storage: ✅ Fallback to memory

// API Endpoints - ACTIVE ✅
Health Check: ✅ GET /health
API Base: ✅ /api/v1/*
CORS: ✅ Development origins allowed
Security Headers: ✅ Helmet middleware active
Request Logging: ✅ Winston + Morgan active
```

## 💾 Data Layer Architecture

### Database Design (PostgreSQL)
**Status:** ❌ Not Connected (Development Mode)  
**Planned Schema:** Multi-tenant SaaS architecture  

#### Core Tables (Planned)
```sql
-- User Management
users (id, email, password_hash, created_at, updated_at)
profiles (user_id, name, location, preferences)
roles (id, name, permissions)
user_roles (user_id, role_id)

-- Supplier Directory  
suppliers (id, name, location, contact_info, verified)
products (id, supplier_id, name, description, price)
reviews (id, user_id, supplier_id, rating, comment)

-- Community Features
forums (id, name, description, moderators)
posts (id, forum_id, user_id, title, content, created_at)
comments (id, post_id, user_id, content, created_at)

-- Content Management
articles (id, author_id, title, content, published_at)
categories (id, name, slug, description)
tags (id, name, slug)
```

### Cache Layer (Redis)
**Status:** ❌ Not Connected (Development Mode)  
**Fallback:** In-memory caching active  

#### Planned Cache Strategy
```typescript
// Session Management
"session:{sessionId}": user session data (TTL: 24h)
"user:{userId}": user profile cache (TTL: 1h)

// Content Caching  
"suppliers:list": supplier directory (TTL: 15min)
"products:{supplierId}": product lists (TTL: 30min)
"reviews:{supplierId}": review summaries (TTL: 5min)

// Rate Limiting
"rate_limit:{userId}": API rate limiting (TTL: 1min)
"auth_attempts:{ip}": Failed login tracking (TTL: 15min)
```

## 🔗 Integration Patterns

### Frontend-Backend Communication
```typescript
// API Client Configuration
Base URL: http://localhost:8000/api/v1
Authentication: JWT Bearer tokens
Error Handling: Axios interceptors with retry logic
State Management: React Query with cache invalidation

// Request Flow
1. Frontend component triggers API call
2. React Query checks cache first  
3. Axios sends HTTP request with auth headers
4. Backend validates JWT and processes request
5. Response cached by React Query
6. UI updates with new data
```

### Error Handling Strategy
```typescript
// Frontend Error Handling
- Network errors: Retry with exponential backoff
- Authentication errors: Redirect to login
- Validation errors: Display inline form errors
- Server errors: Show user-friendly error messages

// Backend Error Handling  
- Database errors: Graceful fallback responses
- Validation errors: Structured error responses
- Authentication errors: Clear 401/403 responses
- Server errors: Logged with Winston + generic user response
```

## 🧪 Testing Architecture

### Test Infrastructure
**Framework:** Playwright for E2E testing  
**Status:** ⏳ Currently running comprehensive test suite  

#### Test Strategy
```typescript
// Test Pyramid
Unit Tests: Jest + React Testing Library (planned)
Integration Tests: Playwright API testing (planned) 
E2E Tests: Playwright browser automation (✅ active)
Visual Tests: Playwright screenshots (✅ active)

// Browser Coverage
Chromium: ✅ Chrome/Edge equivalent
Firefox: ✅ Mozilla Firefox  
WebKit: ✅ Safari equivalent

// Test Categories
- Page rendering and visibility
- Navigation and routing
- Form interactions and validation
- API integration and error handling
- Cross-browser compatibility
- Performance and accessibility
```

## 🚀 Deployment Architecture (Planned)

### Production Environment Design
```typescript
// Frontend Deployment
Platform: Vercel/Netlify (static generation)
CDN: Global edge distribution
Build: next build + next export
Caching: Edge caching with revalidation

// Backend Deployment  
Platform: Railway/Render/AWS (containerized)
Database: Managed PostgreSQL (AWS RDS/Supabase)
Cache: Managed Redis (AWS ElastiCache/Redis Cloud)
Monitoring: Application performance monitoring

// CI/CD Pipeline
Version Control: Git with feature branches
Testing: Playwright tests on PR
Build: Automated builds on main branch
Deploy: Blue-green deployment strategy
```

## 🔧 Development Environment

### Local Development Setup
```bash
# Frontend Development
cd rawgle-frontend
npm install
npm run dev          # http://localhost:3000

# Backend Development  
cd rawgle-backend
npm install  
npm run dev          # http://localhost:8000

# Testing
npm run test         # Playwright E2E tests
npm run test:unit    # Jest unit tests (planned)
```

### Development Tools Integration
```typescript
// Code Quality
TypeScript: Strict type checking across both layers
ESLint: Consistent code style and error detection
Prettier: Code formatting automation
Husky: Pre-commit hooks for quality gates

// Development Experience
Hot Reload: Next.js + tsx watch for instant feedback
Type Safety: Full-stack TypeScript integration
Error Reporting: Winston logs + browser DevTools
API Testing: REST client integration
```

## 📊 Performance Considerations

### Frontend Performance
```typescript
// Next.js Optimizations
- Server-side rendering for SEO
- Image optimization with next/image
- Code splitting with dynamic imports
- Bundle analysis and tree shaking

// React Query Benefits
- Request deduplication and caching
- Background refetching strategies
- Optimistic updates for better UX
- Offline support with cache persistence
```

### Backend Performance  
```typescript
// Express Optimizations
- Connection pooling for database efficiency
- Redis caching for frequent queries
- Compression middleware for response sizes
- Rate limiting for API protection

// Database Strategy
- Indexed queries for fast lookups
- Connection pooling to prevent overload
- Read replicas for scaling (production)
- Query optimization and monitoring
```

---

*This architecture guide reflects the current implementation state and future roadmap. All components are designed for scalability and maintainability.*