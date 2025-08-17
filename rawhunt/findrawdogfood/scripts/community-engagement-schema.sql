-- Community Engagement Database Schema Extension
-- Adds Reddit monitoring and engagement tracking to existing RAWGLE.COM infrastructure

-- Reddit Opportunities Table
-- Tracks potential engagement opportunities from Reddit posts
CREATE TABLE IF NOT EXISTS reddit_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reddit_id TEXT UNIQUE NOT NULL,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    content TEXT,
    relevance_score INTEGER DEFAULT 0,
    sentiment TEXT CHECK(sentiment IN ('positive', 'negative', 'neutral')),
    engagement_potential TEXT CHECK(engagement_potential IN ('high', 'medium', 'low')),
    created_at TEXT NOT NULL,
    discovered_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'engaged', 'ignored', 'flagged')),
    response_generated_at TEXT,
    response_posted_at TEXT,
    engagement_result TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SUPERLUXE Brand Mentions Table  
-- Tracks direct brand mentions across platforms
CREATE TABLE IF NOT EXISTS brand_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL, -- 'reddit', 'instagram', 'twitter', etc.
    platform_id TEXT NOT NULL,
    platform_url TEXT NOT NULL,
    mention_type TEXT CHECK(mention_type IN ('direct', 'indirect', 'competitor', 'keyword')),
    content TEXT NOT NULL,
    author TEXT,
    sentiment TEXT CHECK(sentiment IN ('positive', 'negative', 'neutral')),
    engagement_metrics TEXT, -- JSON: likes, shares, comments, etc.
    priority_score INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    discovered_at TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'responded', 'archived')),
    response_strategy TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, platform_id)
);

-- Engagement Queue Table
-- Manages the queue of posts awaiting AI-generated responses
CREATE TABLE IF NOT EXISTS engagement_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id INTEGER,
    mention_id INTEGER,
    priority INTEGER DEFAULT 0, -- Higher = more urgent
    engagement_type TEXT CHECK(engagement_type IN ('comment', 'dm', 'post', 'share')),
    target_platform TEXT NOT NULL,
    target_url TEXT NOT NULL,
    context_data TEXT, -- JSON: additional context for AI generation
    status TEXT DEFAULT 'queued' CHECK(status IN ('queued', 'generating', 'ready', 'posted', 'failed')),
    scheduled_for TEXT, -- When to post (for optimal timing)
    generated_response TEXT,
    ai_model_used TEXT,
    generation_attempt_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES reddit_opportunities(id),
    FOREIGN KEY (mention_id) REFERENCES brand_mentions(id)
);

-- Community Insights Table
-- Tracks patterns and insights about art communities
CREATE TABLE IF NOT EXISTS community_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subreddit TEXT NOT NULL,
    insight_type TEXT CHECK(insight_type IN ('trending_topic', 'peak_time', 'audience_preference', 'competitor_activity')),
    insight_data TEXT NOT NULL, -- JSON: detailed insight information
    confidence_score REAL DEFAULT 0.0,
    date_observed TEXT NOT NULL,
    impact_level TEXT CHECK(impact_level IN ('high', 'medium', 'low')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SUPERLUXE Response Templates Table
-- Stores brand-appropriate response templates for different scenarios
CREATE TABLE IF NOT EXISTS response_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name TEXT UNIQUE NOT NULL,
    scenario TEXT NOT NULL, -- 'art_critique', 'technique_question', 'material_recommendation', etc.
    template_content TEXT NOT NULL,
    tone TEXT CHECK(tone IN ('helpful', 'encouraging', 'informative', 'casual', 'professional')),
    brand_voice_compliance REAL DEFAULT 1.0, -- 0.0 - 1.0 scale
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Engagement Analytics Table
-- Tracks performance metrics for posted engagements
CREATE TABLE IF NOT EXISTS engagement_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_queue_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    post_url TEXT,
    metrics_snapshot TEXT, -- JSON: likes, comments, shares at time of capture
    engagement_rate REAL DEFAULT 0.0,
    sentiment_response TEXT CHECK(sentiment_response IN ('positive', 'negative', 'mixed', 'neutral')),
    brand_lift_score REAL DEFAULT 0.0,
    captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (engagement_queue_id) REFERENCES engagement_queue(id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_reddit_opportunities_subreddit ON reddit_opportunities(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_opportunities_status ON reddit_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_reddit_opportunities_engagement_potential ON reddit_opportunities(engagement_potential);
CREATE INDEX IF NOT EXISTS idx_reddit_opportunities_discovered_at ON reddit_opportunities(discovered_at);

CREATE INDEX IF NOT EXISTS idx_brand_mentions_platform ON brand_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_status ON brand_mentions(status);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_priority_score ON brand_mentions(priority_score);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_discovered_at ON brand_mentions(discovered_at);

CREATE INDEX IF NOT EXISTS idx_engagement_queue_status ON engagement_queue(status);
CREATE INDEX IF NOT EXISTS idx_engagement_queue_priority ON engagement_queue(priority);
CREATE INDEX IF NOT EXISTS idx_engagement_queue_scheduled_for ON engagement_queue(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_community_insights_subreddit ON community_insights(subreddit);
CREATE INDEX IF NOT EXISTS idx_community_insights_date_observed ON community_insights(date_observed);

-- Initial SUPERLUXE Response Templates
INSERT OR IGNORE INTO response_templates (template_name, scenario, template_content, tone, brand_voice_compliance) VALUES
('art_technique_help', 'technique_question', 'That''s a great question about {technique}! I''ve found that using premium materials really makes a difference in the final result. Have you considered trying {suggestion}? The investment in quality supplies often pays off in the richness and longevity of your work.', 'helpful', 0.9),

('canvas_recommendation', 'material_recommendation', 'For work like this, I''d highly recommend investing in museum-quality canvas. The texture and archival properties make such a difference in how colors develop and how the piece ages. {specific_recommendation} has served me well for similar projects.', 'professional', 0.95),

('art_appreciation', 'positive_feedback', 'This is absolutely stunning! The {specific_element} really draws the eye and creates such beautiful depth. You can see the quality and care that went into this piece. It has that gallery-worthy presence that makes art truly special.', 'encouraging', 0.85),

('collector_perspective', 'investment_discussion', 'From a collector''s perspective, pieces like this represent the kind of quality and vision that appreciate over time. The attention to detail and premium execution suggest an artist who understands both craft and market value.', 'professional', 0.92),

('luxury_materials', 'supply_discussion', 'I''ve always believed that exceptional art starts with exceptional materials. When you''re investing your time and creativity, using premium supplies isn''t just about the end result - it''s about honoring the artistic process itself.', 'informative', 0.88);