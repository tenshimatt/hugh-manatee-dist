-- API Analytics Database Schema
-- Tables for storing real-time API metrics and monitoring data

-- API Requests Log
CREATE TABLE IF NOT EXISTS api_requests (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    full_path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL, -- in milliseconds
    user_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    request_size INTEGER DEFAULT 0,
    response_size INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Endpoints Summary
CREATE TABLE IF NOT EXISTS api_endpoints (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    endpoint TEXT UNIQUE NOT NULL,
    method TEXT NOT NULL,
    total_calls INTEGER DEFAULT 0,
    success_calls INTEGER DEFAULT 0,
    error_calls INTEGER DEFAULT 0,
    total_response_time INTEGER DEFAULT 0, -- sum for calculating averages
    min_response_time INTEGER DEFAULT 0,
    max_response_time INTEGER DEFAULT 0,
    last_called DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily API Stats
CREATE TABLE IF NOT EXISTS api_daily_stats (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    total_response_time INTEGER DEFAULT 0,
    status_200 INTEGER DEFAULT 0,
    status_201 INTEGER DEFAULT 0,
    status_400 INTEGER DEFAULT 0,
    status_401 INTEGER DEFAULT 0,
    status_404 INTEGER DEFAULT 0,
    status_500 INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- User Activity Tracking
CREATE TABLE IF NOT EXISTS user_activity (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_requests INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Error Log
CREATE TABLE IF NOT EXISTS error_log (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id TEXT,
    request_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    request_body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON api_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_status ON api_requests(status_code);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_api_endpoints_endpoint ON api_endpoints(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_last_called ON api_endpoints(last_called);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON api_daily_stats(date);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen);

CREATE INDEX IF NOT EXISTS idx_error_log_timestamp ON error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_log_endpoint ON error_log(endpoint);

-- Views for commonly used queries
CREATE VIEW IF NOT EXISTS recent_requests AS
SELECT 
    endpoint,
    method,
    status_code,
    response_time,
    timestamp,
    user_id,
    error_message
FROM api_requests 
WHERE timestamp >= datetime('now', '-24 hours')
ORDER BY timestamp DESC;

CREATE VIEW IF NOT EXISTS endpoint_performance AS
SELECT 
    endpoint,
    method,
    COUNT(*) as total_calls,
    AVG(response_time) as avg_response_time,
    MIN(response_time) as min_response_time,
    MAX(response_time) as max_response_time,
    SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
    (SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
FROM api_requests 
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY endpoint, method
ORDER BY total_calls DESC;