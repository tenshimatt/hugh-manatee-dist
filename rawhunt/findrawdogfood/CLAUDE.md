# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FindRawDogFood is a Cloudflare Workers-based application that helps users find raw dog food suppliers. The project consists of:

1. **Main Application**: A Cloudflare Worker serving a web interface with location-based supplier search
2. **Data Collection**: Google Places API scraper for gathering supplier information
3. **Database**: Cloudflare D1 SQLite database for storing supplier data
4. **SiteReviverAI**: A subsidiary tool for website analysis and redesign recommendations

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Deploy to production
npm run deploy

# Run Google Places scraper (daily data collection)
npm run scrape
```

### Database Operations
```bash
# Setup database schema and indexes
npm run db:setup

# Import scraped data in batches
npm run db:import

# Reset database (destructive)
npm run db:reset

# Fix remote database issues
npm run db:fix
```

### Deployment Scripts
```bash
# Production deployment with optimizations
./deploy-production.sh

# Deploy with blog integration
./deploy-with-blog.sh

# Deploy styled version with enhanced UI
./deploy-styled-website.sh
```

## Architecture

### Core Worker (src/index.js)
- Handles HTTP requests and routing
- Serves main web interface with supplier search
- Includes voice interface endpoints for Claude integration
- Manages CORS headers for cross-origin requests
- Integrates with D1 database for supplier queries

### Data Collection System
- **google-places-scraper.js**: Multi-API-key scraper with rate limiting
- **scripts/**: Batch processing tools for data import/export
- **Daily automation**: Proxmox-based scheduled data collection

### Database Schema (scripts/d1-schema.sql)
```sql
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT, state TEXT, country TEXT,
    latitude REAL, longitude REAL,
    phone_number TEXT, website TEXT,
    rating REAL, user_ratings_total INTEGER,
    types TEXT, keyword TEXT,
    created_at TEXT
);
```

### SiteReviverAI Subsystem
Located in `sitereviverai/` directory:
- Website analysis and redesign tool
- Email template generation for client proposals
- Dual design comparison system (Professional vs Science-Backed)
- Python-based backend with HTML/JS frontend
- SQLite database for analysis results

## Configuration Files

### wrangler.toml (Development)
- Development environment configuration
- Local D1 database binding
- KV namespace for voice transcripts

### wrangler-production.toml (Production)
- Production environment with custom domain routing
- Remote D1 database (findrawdogfood-db)
- R2 bucket for static assets
- Domain: findrawdogfood.com, www.findrawdogfood.com

## Key Features

### Location-Based Search
- Geographic supplier discovery using lat/lng coordinates
- City/state-based filtering
- Distance calculations for nearest suppliers

### SEO Optimization
- Dynamic sitemap generation
- Location-specific landing pages
- Structured data markup for rich snippets
- Google Analytics integration

### Voice Interface
- Speech-to-text processing
- Claude AI integration for voice queries
- Text-to-speech responses
- Audio transcription storage in KV

## Data Flow

1. **Collection**: Google Places scraper runs daily, collecting supplier data
2. **Processing**: Scripts batch-process CSV exports into SQL imports
3. **Storage**: D1 database stores normalized supplier information
4. **Serving**: Worker queries database based on user location/search criteria
5. **Response**: JSON API or HTML interface returned to user

## Development Notes

### API Keys Management
- Google Places API keys stored in scraper with usage tracking
- Multiple keys with free tier limits (1000 calls/day each)
- Automatic key rotation to prevent quota exhaustion

### Database Scaling
- Batch import system for large datasets (177+ SQL files in scripts/)
- Indexed queries on location (latitude/longitude) for performance
- CSV export/import pipeline for data portability

### Deployment Strategy
- Separate development and production Wrangler configurations
- Custom domain routing in production
- Asset optimization and caching strategies
- SEO-focused deployment with monitoring dashboard

### SiteReviverAI Integration
- Independent Python application in subdirectory
- Shares supplier database for website analysis
- Generates client proposals with before/after comparisons
- Email automation for lead generation

## Testing

The codebase includes various test files and monitoring tools:
- `seo-monitor.html`: SEO performance dashboard
- `test-*.js`: API key and functionality testing
- `deployment-checklist.md`: Production deployment validation steps

## Security Considerations

- API keys are committed to repository (consider environment variables)
- CORS headers allow all origins (production may need restrictions)
- No authentication layer on main application (public directory)
- Voice interface endpoints require API key validation