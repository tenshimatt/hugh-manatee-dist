-- Cloudflare D1 Database Optimization Strategies
-- SQLite optimizations specifically for edge deployment
-- Performance-focused configurations for hunting platform

-- =============================================================================
-- D1 SPECIFIC OPTIMIZATIONS
-- =============================================================================

-- Enable Write-Ahead Logging for better concurrency
-- Note: This is automatically handled by D1, but documented for reference
-- PRAGMA journal_mode = WAL;

-- Optimize for read-heavy workloads (common in hunting apps)
-- PRAGMA synchronous = NORMAL;

-- Memory optimization for edge environments
-- PRAGMA cache_size = 2048;  -- 2MB cache
-- PRAGMA temp_store = MEMORY;

-- =============================================================================
-- PARTITIONING STRATEGY FOR TIME-SERIES DATA
-- =============================================================================

-- Hunt logs partitioning by year (for historical data management)
CREATE TABLE hunt_logs_2024 (
    LIKE hunt_logs INCLUDING ALL
);

CREATE TABLE hunt_logs_2025 (
    LIKE hunt_logs INCLUDING ALL
);

-- Partition trigger for hunt logs (automatically route to correct partition)
CREATE TRIGGER hunt_logs_partition_trigger
    INSTEAD OF INSERT ON hunt_logs
    FOR EACH ROW
BEGIN
    INSERT INTO hunt_logs_2024 
    SELECT * FROM (SELECT NEW.*) 
    WHERE strftime('%Y', NEW.hunt_date) = '2024';
    
    INSERT INTO hunt_logs_2025 
    SELECT * FROM (SELECT NEW.*) 
    WHERE strftime('%Y', NEW.hunt_date) = '2025';
END;

-- Training sessions partitioning
CREATE TABLE training_sessions_2024 (
    LIKE training_sessions INCLUDING ALL
);

CREATE TABLE training_sessions_2025 (
    LIKE training_sessions INCLUDING ALL
);

-- Partition view for unified access
CREATE VIEW hunt_logs_unified AS
    SELECT * FROM hunt_logs_2024
    UNION ALL
    SELECT * FROM hunt_logs_2025;

-- =============================================================================
-- READ REPLICA OPTIMIZATION STRATEGIES
-- =============================================================================

-- Materialized views for common aggregations (updated via triggers)
CREATE TABLE user_stats_materialized (
    user_id TEXT PRIMARY KEY,
    total_hunts INTEGER DEFAULT 0,
    total_game_harvested INTEGER DEFAULT 0,
    avg_success_rating REAL DEFAULT 0,
    total_training_sessions INTEGER DEFAULT 0,
    dogs_count INTEGER DEFAULT 0,
    last_hunt_date DATE,
    last_training_date DATE,
    reputation_score INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dog_stats_materialized (
    dog_id TEXT PRIMARY KEY,
    total_hunts INTEGER DEFAULT 0,
    game_retrieved INTEGER DEFAULT 0,
    training_sessions INTEGER DEFAULT 0,
    avg_performance_rating REAL DEFAULT 0,
    last_hunt_date DATE,
    last_training_date DATE,
    achievements_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- EDGE-SPECIFIC INDEXING STRATEGIES
-- =============================================================================

-- Covering indexes to reduce I/O at the edge
CREATE INDEX idx_hunt_logs_covering_recent ON hunt_logs(
    user_id, hunt_date DESC, hunting_type, success_rating, location_region
) WHERE hunt_date >= date('now', '-30 days');

CREATE INDEX idx_dogs_covering_active ON dogs(
    owner_id, is_active, name, breed, hunting_style, training_level
) WHERE is_active = TRUE;

CREATE INDEX idx_posts_covering_feed ON community_posts(
    visibility, moderation_status, created_at DESC, title, post_type, likes_count
) WHERE visibility = 'public' AND moderation_status = 'active';

-- Partial indexes for edge performance
CREATE INDEX idx_hunt_logs_successful ON hunt_logs(hunt_date DESC, user_id) 
WHERE success_rating >= 4 AND shared_publicly = TRUE;

CREATE INDEX idx_training_excellent ON training_sessions(session_date DESC, dog_id)
WHERE overall_performance >= 4;

CREATE INDEX idx_posts_trending ON community_posts(created_at DESC, likes_count DESC)
WHERE created_at >= datetime('now', '-7 days') AND likes_count > 5;

-- =============================================================================
-- CONNECTION POOLING OPTIMIZATION
-- =============================================================================

-- Connection settings for D1 (reference for workers)
-- These would be implemented in the Cloudflare Worker code

/*
D1 Connection Best Practices:
1. Use prepared statements for all queries
2. Batch operations when possible
3. Implement connection retry logic
4. Use transactions for multi-step operations
5. Monitor query execution time at edge locations

Example Worker Implementation:

export default {
  async fetch(request, env, ctx) {
    const db = env.DB;
    
    // Use prepared statements
    const stmt = db.prepare("SELECT * FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT ?");
    const results = await stmt.bind(userId, limit).all();
    
    // Batch operations
    const batch = [
      db.prepare("UPDATE users SET last_active = ? WHERE id = ?").bind(now, userId),
      db.prepare("INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)").bind(userId, token)
    ];
    await db.batch(batch);
    
    return new Response(JSON.stringify(results));
  }
};
*/

-- =============================================================================
-- TRIGGERS FOR MAINTAINING MATERIALIZED VIEWS
-- =============================================================================

-- Update user stats when hunt logs change
CREATE TRIGGER update_user_stats_hunt_insert
    AFTER INSERT ON hunt_logs
    FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO user_stats_materialized (
        user_id, total_hunts, last_hunt_date, updated_at
    ) VALUES (
        NEW.user_id,
        COALESCE((SELECT total_hunts FROM user_stats_materialized WHERE user_id = NEW.user_id), 0) + 1,
        NEW.hunt_date,
        CURRENT_TIMESTAMP
    );
END;

-- Update user stats when training sessions change
CREATE TRIGGER update_user_stats_training_insert
    AFTER INSERT ON training_sessions
    FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO user_stats_materialized (
        user_id, total_training_sessions, last_training_date, updated_at
    ) SELECT 
        NEW.user_id,
        COUNT(*),
        MAX(session_date),
        CURRENT_TIMESTAMP
    FROM training_sessions 
    WHERE user_id = NEW.user_id;
END;

-- Update dog stats when involved in hunts
CREATE TRIGGER update_dog_stats_hunt_insert
    AFTER INSERT ON hunt_logs
    FOR EACH ROW
    WHEN NEW.dogs_present IS NOT NULL
BEGIN
    -- This would need to be implemented with JSON extraction
    -- for dogs present in the hunt
    UPDATE dog_stats_materialized 
    SET total_hunts = total_hunts + 1,
        last_hunt_date = NEW.hunt_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE dog_id IN (SELECT value FROM json_each(NEW.dogs_present));
END;

-- =============================================================================
-- QUERY OPTIMIZATION PATTERNS
-- =============================================================================

-- Optimized queries for common operations

-- Recent hunts for user dashboard (with limit for edge performance)
CREATE VIEW user_recent_hunts AS
SELECT 
    hl.id,
    hl.hunt_date,
    hl.hunting_type,
    hl.location_region,
    hl.success_rating,
    COUNT(gh.id) as game_count,
    hl.created_at
FROM hunt_logs hl
LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
WHERE hl.hunt_date >= date('now', '-90 days')
GROUP BY hl.id
ORDER BY hl.hunt_date DESC
LIMIT 50;

-- Dog training progress for mobile app
CREATE VIEW dog_training_progress AS
SELECT 
    d.id,
    d.name,
    d.training_level,
    COUNT(ts.id) as sessions_last_30_days,
    AVG(ts.overall_performance) as avg_performance,
    MAX(ts.session_date) as last_session,
    (
        SELECT COUNT(*) 
        FROM training_goals tg 
        WHERE tg.dog_id = d.id AND tg.status = 'completed'
    ) as goals_completed
FROM dogs d
LEFT JOIN training_sessions ts ON d.id = ts.dog_id 
    AND ts.session_date >= date('now', '-30 days')
WHERE d.is_active = TRUE
GROUP BY d.id;

-- Community feed for public timeline
CREATE VIEW community_feed AS
SELECT 
    cp.id,
    cp.title,
    cp.post_type,
    cp.category,
    cp.created_at,
    cp.likes_count,
    cp.comments_count,
    u.display_name,
    u.experience_level,
    -- First media item for preview
    (
        SELECT pm.thumbnail_url 
        FROM post_media pm 
        WHERE pm.post_id = cp.id 
        ORDER BY pm.display_order 
        LIMIT 1
    ) as preview_image
FROM community_posts cp
JOIN users u ON cp.user_id = u.id
WHERE cp.visibility = 'public' 
  AND cp.moderation_status = 'active'
  AND u.is_active = TRUE
ORDER BY cp.created_at DESC;

-- =============================================================================
-- EDGE LOCATION OPTIMIZATION
-- =============================================================================

-- Regional data distribution strategy
CREATE TABLE edge_regions (
    region_code TEXT PRIMARY KEY,
    region_name TEXT NOT NULL,
    country_codes TEXT, -- JSON array of countries served
    primary_location TEXT,
    backup_location TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- Insert common regions
INSERT INTO edge_regions (region_code, region_name, country_codes, primary_location) VALUES
('us-east', 'US East Coast', '["US"]', 'Virginia'),
('us-central', 'US Central', '["US"]', 'Iowa'),
('us-west', 'US West Coast', '["US"]', 'California'),
('europe', 'Europe', '["GB","FR","DE","IT","ES"]', 'London'),
('asia-pacific', 'Asia Pacific', '["AU","NZ","SG"]', 'Singapore');

-- User region affinity (for query routing optimization)
CREATE TABLE user_region_affinity (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    primary_region TEXT NOT NULL,
    last_region TEXT,
    access_pattern TEXT, -- mobile, web, api
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE MONITORING TABLES
-- =============================================================================

-- Query performance tracking
CREATE TABLE query_performance_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT NOT NULL,
    query_type TEXT, -- SELECT, INSERT, UPDATE, DELETE
    table_name TEXT,
    execution_time_ms INTEGER,
    rows_affected INTEGER,
    edge_location TEXT,
    user_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index usage statistics
CREATE TABLE index_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    index_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    avg_selectivity REAL,
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Database health metrics
CREATE TABLE db_health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    edge_location TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- BACKUP AND REPLICATION STRATEGIES
-- =============================================================================

-- Backup metadata tracking
CREATE TABLE backup_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type TEXT NOT NULL, -- full, incremental, point_in_time
    backup_size_bytes INTEGER,
    tables_included TEXT, -- JSON array
    backup_location TEXT,
    checksum TEXT,
    compression_ratio REAL,
    backup_duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME
);

-- Replication lag monitoring
CREATE TABLE replication_lag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_region TEXT NOT NULL,
    target_region TEXT NOT NULL,
    lag_ms INTEGER,
    last_sync_id TEXT,
    sync_status TEXT CHECK (sync_status IN ('healthy', 'warning', 'critical')),
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MIGRATION TRACKING SYSTEM
-- =============================================================================

-- Enhanced migration tracking with rollback support
CREATE TABLE migration_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_id TEXT UNIQUE NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    migration_type TEXT CHECK (migration_type IN ('schema', 'data', 'index', 'trigger')),
    up_sql TEXT NOT NULL,
    down_sql TEXT, -- For rollbacks
    checksum_before TEXT,
    checksum_after TEXT,
    execution_time_ms INTEGER,
    applied_by TEXT, -- Worker/user that applied it
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rolled_back_at DATETIME,
    rollback_reason TEXT
);

-- =============================================================================
-- ANALYTICS AND REPORTING OPTIMIZATION
-- =============================================================================

-- Pre-aggregated analytics tables for dashboard performance
CREATE TABLE daily_hunt_stats (
    date DATE PRIMARY KEY,
    total_hunts INTEGER DEFAULT 0,
    successful_hunts INTEGER DEFAULT 0,
    total_game_harvested INTEGER DEFAULT 0,
    avg_success_rating REAL DEFAULT 0,
    unique_hunters INTEGER DEFAULT 0,
    popular_species TEXT, -- JSON array with counts
    popular_regions TEXT, -- JSON array with counts
    weather_conditions TEXT, -- JSON summary
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monthly_user_engagement (
    year INTEGER,
    month INTEGER,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    training_sessions INTEGER DEFAULT 0,
    avg_session_duration REAL DEFAULT 0,
    top_activities TEXT, -- JSON array
    PRIMARY KEY (year, month)
);

-- Triggers to maintain analytics tables
CREATE TRIGGER update_daily_hunt_stats
    AFTER INSERT ON hunt_logs
    FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO daily_hunt_stats (
        date, total_hunts, successful_hunts, calculated_at
    ) VALUES (
        NEW.hunt_date,
        COALESCE((SELECT total_hunts FROM daily_hunt_stats WHERE date = NEW.hunt_date), 0) + 1,
        COALESCE((SELECT successful_hunts FROM daily_hunt_stats WHERE date = NEW.hunt_date), 0) + 
        CASE WHEN NEW.success_rating >= 4 THEN 1 ELSE 0 END,
        CURRENT_TIMESTAMP
    );
END;