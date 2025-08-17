#!/bin/bash
# SiteReviverAI - Complete Setup Script

echo "🤖 Setting up SiteReviverAI - Autonomous Website Modernization Tool"

# Create Python virtual environment
python3 -m venv sitereviver-env
source sitereviver-env/bin/activate

# Install Python dependencies
cat > requirements.txt << 'EOF'
aiohttp==3.9.0
beautifulsoup4==4.12.2
openai==1.3.0
requests==2.31.0
selenium==4.15.0
Pillow==10.1.0
python-dotenv==1.0.0
playwright==1.40.0
EOF

python3 -m pip install -r requirements.txt

# Install Node.js dependencies for site generation
npm init -y
npm install --save-dev \
  @next/bundle-analyzer \
  tailwindcss \
  postcss \
  autoprefixer

# Install system dependencies
echo "📦 Installing system dependencies..."

# Install Lighthouse CLI (requires Node.js)
npm install -g lighthouse

# Install Playwright browsers
playwright install

echo "🗄️  Setting up database schema..."

# Create database schema for SiteReviverAI
cat > schema.sql << 'EOF'
-- SiteReviverAI Database Schema

CREATE TABLE IF NOT EXISTS preview_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    original_url TEXT NOT NULL,
    city TEXT,
    state TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'preview', -- 'preview', 'active', 'expired'
    lighthouse_score REAL,
    design_score REAL,
    mobile_responsive BOOLEAN,
    modernization_reasons TEXT, -- JSON array of issues
    preview_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    activated_at DATETIME,
    customer_email TEXT,
    payment_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS email_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_slug TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'promotional', 'reminder', 'activation'
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    subject TEXT,
    recipient_email TEXT,
    status TEXT DEFAULT 'sent', -- 'sent', 'opened', 'clicked', 'bounced'
    FOREIGN KEY (site_slug) REFERENCES preview_sites(slug)
);

CREATE TABLE IF NOT EXISTS email_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_slug TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'email_opened', 'email_clicked', 'preview_viewed'
    user_agent TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_slug) REFERENCES preview_sites(slug)
);

CREATE TABLE IF NOT EXISTS preview_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_slug TEXT NOT NULL,
    user_agent TEXT,
    referer TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_slug) REFERENCES preview_sites(slug)
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_slug TEXT NOT NULL,
    stripe_session_id TEXT,
    amount INTEGER, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT, -- 'pending', 'completed', 'failed', 'refunded'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (site_slug) REFERENCES preview_sites(slug)
);

CREATE TABLE IF NOT EXISTS automation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    sites_processed INTEGER DEFAULT 0,
    sites_modernized INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_log TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_sites_status ON preview_sites(status);
CREATE INDEX IF NOT EXISTS idx_preview_sites_created ON preview_sites(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_site ON email_events(site_slug);
CREATE INDEX IF NOT EXISTS idx_preview_views_site ON preview_views(site_slug);
EOF

echo "🔧 Setting up Cloudflare infrastructure..."

# Create Cloudflare D1 database for SiteReviverAI
wrangler d1 create sitereviver-db

# Create wrangler.toml for the worker
cat > wrangler.toml << 'EOF'
name = "sitereviver-dashboard"
main = "dashboard-worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "SITEREVIVER_DB"
database_name = "sitereviver-db"
database_id = "" # Will be filled by wrangler

[vars]
ENVIRONMENT = "production"

# Secrets to set via wrangler secret put:
# OPENAI_API_KEY
# SENDGRID_API_KEY  
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
EOF

echo "🔑 Environment setup..."

# Create .env file template
cat > .env.example << 'EOF'
# OpenAI API for content rewriting and design analysis
OPENAI_API_KEY=sk-your-openai-api-key

# SendGrid for email automation
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Stripe for payment processing
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Cloudflare API for site deployment
CLOUDFLARE_API_TOKEN=your-cloudflare-token

# Database connection (for local development)
DATABASE_URL=./sitereviver.db
EOF

echo "📋 Usage Instructions:"
echo ""
echo "1. Copy .env.example to .env and fill in your API keys"
echo "2. Run the automation: python sitereviver.py"
echo "3. Deploy the dashboard: wrangler deploy"
echo "4. Monitor at: https://sitereviver-dashboard.your-subdomain.workers.dev"
echo ""
echo "🎯 Automation Flow:"
echo "├── Scan FindRawDogFood database for sites with URLs"
echo "├── Analyze each site (Lighthouse + GPT-4 design scoring)"
echo "├── Extract and rewrite content (low-temp GPT-4)"
echo "├── Build modern Next.js + Tailwind sites"
echo "├── Deploy previews to Cloudflare Pages"
echo "├── Generate personalized promotional emails"
echo "├── Send emails with preview links and pricing"
echo "├── Track email opens, clicks, and preview views"
echo "├── Handle Stripe payments and site activation"
echo "└── Monitor conversion rates and revenue"
echo ""
echo "💰 Revenue Model:"
echo "• One-time setup: $499"
echo "• Monthly hosting: $10"
echo "• Target: 20 conversions/month = $10K+ MRR"
echo ""
echo "✅ SiteReviverAI setup complete!"
echo "Ready to modernize the web, one raw dog food supplier at a time 🐕"
