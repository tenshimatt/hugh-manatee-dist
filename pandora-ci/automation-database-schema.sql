-- Production Automation Database Schema
-- For Proxmox Stack Auto-Update System

-- Main update log table
CREATE TABLE IF NOT EXISTS update_log (
    id SERIAL PRIMARY KEY,
    container_id VARCHAR(10) NOT NULL,
    container_name VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('checking', 'updating', 'completed', 'failed', 'skipped')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP WITH TIME ZONE,
    available_updates INTEGER DEFAULT 0,
    execution_time INTEGER DEFAULT 0, -- in seconds
    success BOOLEAN DEFAULT NULL,
    error_message TEXT,
    update_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System health metrics table
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    container_id VARCHAR(10) NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_status BOOLEAN DEFAULT TRUE,
    service_status JSONB,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automation execution summary
CREATE TABLE IF NOT EXISTS automation_summary (
    id SERIAL PRIMARY KEY,
    execution_date DATE NOT NULL,
    total_containers INTEGER NOT NULL,
    containers_checked INTEGER NOT NULL,
    containers_updated INTEGER NOT NULL,
    successful_updates INTEGER NOT NULL,
    failed_updates INTEGER NOT NULL,
    execution_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    execution_end_time TIMESTAMP WITH TIME ZONE,
    total_execution_time INTEGER, -- in seconds
    overall_status VARCHAR(20) CHECK (overall_status IN ('running', 'completed', 'partial_failure', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert configuration table
CREATE TABLE IF NOT EXISTS alert_config (
    id SERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL UNIQUE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('email', 'slack', 'webhook', 'dashboard')),
    enabled BOOLEAN DEFAULT TRUE,
    conditions JSONB NOT NULL,
    recipients JSONB,
    template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Container metadata table
CREATE TABLE IF NOT EXISTS container_metadata (
    container_id VARCHAR(10) PRIMARY KEY,
    container_name VARCHAR(100) NOT NULL,
    container_type VARCHAR(50),
    os_type VARCHAR(50),
    critical_level VARCHAR(20) CHECK (critical_level IN ('low', 'medium', 'high', 'critical')),
    auto_update_enabled BOOLEAN DEFAULT TRUE,
    maintenance_window VARCHAR(100),
    last_manual_update TIMESTAMP WITH TIME ZONE,
    update_strategy VARCHAR(50) DEFAULT 'standard',
    backup_required BOOLEAN DEFAULT TRUE,
    dependencies JSONB,
    owner VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_update_log_container_timestamp ON update_log(container_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_update_log_status ON update_log(status);
CREATE INDEX IF NOT EXISTS idx_update_log_date ON update_log(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_system_health_container_timestamp ON system_health(container_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_automation_summary_date ON automation_summary(execution_date);

-- Views for common queries
CREATE OR REPLACE VIEW latest_container_status AS
SELECT DISTINCT ON (container_id)
    container_id,
    container_name,
    status,
    timestamp,
    success,
    available_updates
FROM update_log
ORDER BY container_id, timestamp DESC;

CREATE OR REPLACE VIEW daily_update_summary AS
SELECT
    DATE(timestamp) as update_date,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_updates,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_updates,
    COUNT(CASE WHEN available_updates > 0 THEN 1 END) as containers_needing_updates,
    AVG(execution_time) as avg_execution_time
FROM update_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY update_date DESC;

-- Insert default alert configurations
INSERT INTO alert_config (alert_name, alert_type, enabled, conditions, recipients, template) VALUES
('update_failure', 'slack', true,
 '{"condition": "status = failed", "threshold": 1}',
 '{"webhook_url": "slack-webhook-placeholder"}',
 '🚨 Container {{container_id}} update failed: {{error_message}}'
),
('low_disk_space', 'email', true,
 '{"condition": "disk_usage > 85", "threshold": 1}',
 '{"emails": ["admin@example.com"]}',
 '⚠️ Low disk space on container {{container_id}}: {{disk_usage}}%'
),
('update_summary', 'dashboard', true,
 '{"condition": "daily_summary", "schedule": "daily"}',
 '{}',
 'Daily update summary: {{successful_updates}}/{{total_containers}} containers updated successfully'
) ON CONFLICT (alert_name) DO NOTHING;

-- Insert default container metadata for known containers
INSERT INTO container_metadata (container_id, container_name, container_type, critical_level, auto_update_enabled) VALUES
('100', 'postoffice', 'mail_server', 'high', true),
('102', 'pbs', 'backup_server', 'critical', false), -- Manual updates for backup server
('105', 'authentik-proxy', 'auth_service', 'high', true),
('106', 'docker', 'container_host', 'critical', false), -- No auto-updates for docker host
('107', 'npmplus', 'proxy_manager', 'medium', true),
('108', 'bookstack', 'documentation', 'low', true),
('109', 'wazuh', 'security_monitoring', 'high', true),
('115', 'stream', 'media_service', 'low', true),
('117', 'dev1rawgle', 'development', 'low', true),
('118', 'test-stack', 'testing', 'low', true),
('119', 'jupyter-notebook', 'development', 'low', true),
('150', 'apt-cacher', 'caching_service', 'medium', true),
('888', 'docker', 'container_host', 'critical', false) -- No auto-updates for docker host
ON CONFLICT (container_id) DO NOTHING;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_container_metadata_updated_at BEFORE UPDATE ON container_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_config_updated_at BEFORE UPDATE ON alert_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO n8n_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n8n_user;