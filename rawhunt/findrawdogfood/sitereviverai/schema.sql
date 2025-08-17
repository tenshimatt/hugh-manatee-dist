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
