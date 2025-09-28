-- ============================================================================
-- PANDORA CI/CD PIPELINE DATABASE SCHEMA
-- ============================================================================
-- Comprehensive tracking for builds, tests, coverage, and deployments
-- Enforces quality gates with mandatory test coverage
-- ============================================================================

-- Create CI/CD schema
CREATE SCHEMA IF NOT EXISTS cicd;

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    repository_url VARCHAR(500) NOT NULL,
    branch VARCHAR(100) DEFAULT 'main',
    language VARCHAR(50),
    framework VARCHAR(100),
    minimum_coverage_percent DECIMAL(5,2) DEFAULT 80.00,
    required_test_types JSONB DEFAULT '["unit", "integration"]',
    ai_agent VARCHAR(50) DEFAULT 'claude-code', -- claude-code, qwen, etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- BUILD PIPELINE RUNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.pipeline_runs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES cicd.projects(id),
    run_number INTEGER NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- push, pull_request, manual, scheduled
    commit_sha VARCHAR(100) NOT NULL,
    commit_message TEXT,
    commit_author VARCHAR(255),
    branch VARCHAR(100),

    -- Pipeline stages
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, success, failed, cancelled
    stage VARCHAR(50) DEFAULT 'initializing', -- initializing, building, testing, coverage, deploying, complete

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Results
    build_success BOOLEAN,
    tests_passed BOOLEAN,
    coverage_met BOOLEAN,
    deployment_success BOOLEAN,

    -- Definition of Done flags
    code_complete BOOLEAN DEFAULT false,
    documentation_updated BOOLEAN DEFAULT false,
    tests_green BOOLEAN DEFAULT false,
    coverage_adequate BOOLEAN DEFAULT false,
    definition_of_done_met BOOLEAN DEFAULT false,

    -- AI Agent tracking
    ai_agent_used VARCHAR(50),
    ai_tokens_used INTEGER,
    ai_cost_estimate DECIMAL(10,4),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',

    UNIQUE(project_id, run_number)
);

-- ============================================================================
-- TEST EXECUTION RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.test_results (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id) ON DELETE CASCADE,
    test_suite VARCHAR(100) NOT NULL, -- unit, integration, e2e, smoke, regression
    test_file VARCHAR(500),
    test_name VARCHAR(500),
    status VARCHAR(20) NOT NULL, -- passed, failed, skipped, error
    duration_ms INTEGER,
    error_message TEXT,
    stack_trace TEXT,

    -- Test metadata
    assertions_count INTEGER,
    assertions_passed INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- CODE COVERAGE METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.coverage_reports (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id) ON DELETE CASCADE,

    -- Overall coverage
    line_coverage_percent DECIMAL(5,2) NOT NULL,
    branch_coverage_percent DECIMAL(5,2),
    function_coverage_percent DECIMAL(5,2),
    statement_coverage_percent DECIMAL(5,2),

    -- Coverage details
    total_lines INTEGER,
    covered_lines INTEGER,
    total_branches INTEGER,
    covered_branches INTEGER,
    total_functions INTEGER,
    covered_functions INTEGER,
    total_statements INTEGER,
    covered_statements INTEGER,

    -- Coverage by type
    unit_test_coverage DECIMAL(5,2),
    integration_test_coverage DECIMAL(5,2),
    e2e_test_coverage DECIMAL(5,2),

    -- Uncovered files
    uncovered_files JSONB DEFAULT '[]',
    coverage_gaps JSONB DEFAULT '[]',

    -- Quality gate
    meets_minimum_threshold BOOLEAN NOT NULL,
    threshold_used DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_report JSONB
);

-- ============================================================================
-- BUILD ARTIFACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.build_artifacts (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL, -- binary, docker-image, package, report
    artifact_name VARCHAR(255) NOT NULL,
    artifact_path VARCHAR(500),
    artifact_size_bytes BIGINT,
    checksum VARCHAR(255),

    -- Storage location
    storage_type VARCHAR(50), -- local, s3, docker-registry, npm-registry
    storage_url VARCHAR(500),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- QUALITY GATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.quality_gates (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id) ON DELETE CASCADE,
    gate_name VARCHAR(100) NOT NULL,
    gate_type VARCHAR(50) NOT NULL, -- coverage, tests, linting, security, performance
    required_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    passed BOOLEAN NOT NULL,
    is_blocking BOOLEAN DEFAULT true,
    failure_reason TEXT,

    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- DEPLOYMENT RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.deployments (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id),
    environment VARCHAR(50) NOT NULL, -- development, staging, production
    deployment_type VARCHAR(50), -- rolling, blue-green, canary, direct
    target_url VARCHAR(500),

    -- Deployment status
    status VARCHAR(50) NOT NULL, -- pending, deploying, success, failed, rolled_back
    deployed_by VARCHAR(255),

    -- Version info
    version_tag VARCHAR(100),
    previous_version VARCHAR(100),

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Rollback info
    rollback_available BOOLEAN DEFAULT true,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    rollback_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- CI/CD NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.notifications (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id),
    notification_type VARCHAR(50) NOT NULL, -- email, slack, webhook, github_status
    recipient VARCHAR(255),
    subject VARCHAR(500),
    message TEXT,
    status VARCHAR(20) NOT NULL, -- pending, sent, failed, retry

    sent_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- DOCUMENTATION TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.documentation_updates (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id),
    doc_type VARCHAR(50) NOT NULL, -- readme, api, changelog, wiki, inline
    file_path VARCHAR(500),

    -- Documentation checks
    exists BOOLEAN NOT NULL,
    updated BOOLEAN NOT NULL,
    auto_generated BOOLEAN DEFAULT false,

    -- Content analysis
    sections_required JSONB DEFAULT '[]',
    sections_present JSONB DEFAULT '[]',
    completeness_percent DECIMAL(5,2),

    -- AI documentation
    ai_generated BOOLEAN DEFAULT false,
    ai_reviewed BOOLEAN DEFAULT false,

    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- REPORTING SUMMARIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.build_reports (
    id SERIAL PRIMARY KEY,
    pipeline_run_id INTEGER REFERENCES cicd.pipeline_runs(id) UNIQUE,

    -- Summary status
    overall_status VARCHAR(20) NOT NULL, -- success, failed, partial
    report_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Test summary
    total_tests INTEGER,
    tests_passed INTEGER,
    tests_failed INTEGER,
    tests_skipped INTEGER,
    test_success_rate DECIMAL(5,2),

    -- Coverage summary
    coverage_percent DECIMAL(5,2),
    coverage_delta DECIMAL(5,2), -- change from previous build
    new_uncovered_lines INTEGER,

    -- Code quality
    code_smells INTEGER,
    technical_debt_minutes INTEGER,
    maintainability_rating VARCHAR(5), -- A, B, C, D, E

    -- Definition of Done summary
    dod_criteria_total INTEGER,
    dod_criteria_met INTEGER,
    dod_percentage DECIMAL(5,2),

    -- Performance metrics
    build_time_seconds INTEGER,
    test_time_seconds INTEGER,
    total_time_seconds INTEGER,

    -- Report URL
    full_report_url VARCHAR(500),

    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cicd.scheduled_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL UNIQUE,
    job_type VARCHAR(50) NOT NULL, -- build, test, deploy, report
    project_id INTEGER REFERENCES cicd.projects(id),

    -- Schedule
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT true,

    -- Execution
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(20),
    next_run_at TIMESTAMP WITH TIME ZONE,

    -- Configuration
    config JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_pipeline_runs_project_status ON cicd.pipeline_runs(project_id, status);
CREATE INDEX idx_pipeline_runs_created_at ON cicd.pipeline_runs(created_at DESC);
CREATE INDEX idx_test_results_pipeline_run ON cicd.test_results(pipeline_run_id);
CREATE INDEX idx_test_results_status ON cicd.test_results(status);
CREATE INDEX idx_coverage_reports_pipeline ON cicd.coverage_reports(pipeline_run_id);
CREATE INDEX idx_quality_gates_failed ON cicd.quality_gates(pipeline_run_id, passed) WHERE passed = false;
CREATE INDEX idx_deployments_environment ON cicd.deployments(environment, status);
CREATE INDEX idx_notifications_pending ON cicd.notifications(status) WHERE status = 'pending';

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Latest pipeline run per project
CREATE OR REPLACE VIEW cicd.latest_pipeline_runs AS
SELECT DISTINCT ON (project_id)
    pr.*,
    p.name as project_name,
    p.minimum_coverage_percent
FROM cicd.pipeline_runs pr
JOIN cicd.projects p ON pr.project_id = p.id
ORDER BY project_id, created_at DESC;

-- Build success rate by project
CREATE OR REPLACE VIEW cicd.project_success_rates AS
SELECT
    p.id,
    p.name,
    COUNT(pr.id) as total_runs,
    COUNT(CASE WHEN pr.status = 'success' THEN 1 END) as successful_runs,
    ROUND(COUNT(CASE WHEN pr.status = 'success' THEN 1 END)::DECIMAL / NULLIF(COUNT(pr.id), 0) * 100, 2) as success_rate,
    AVG(pr.duration_seconds) as avg_duration_seconds,
    MAX(pr.created_at) as last_run_at
FROM cicd.projects p
LEFT JOIN cicd.pipeline_runs pr ON p.id = pr.project_id
GROUP BY p.id, p.name;

-- Test coverage trends
CREATE OR REPLACE VIEW cicd.coverage_trends AS
SELECT
    p.name as project_name,
    DATE(pr.created_at) as date,
    AVG(cr.line_coverage_percent) as avg_coverage,
    MIN(cr.line_coverage_percent) as min_coverage,
    MAX(cr.line_coverage_percent) as max_coverage,
    COUNT(pr.id) as builds_count
FROM cicd.pipeline_runs pr
JOIN cicd.projects p ON pr.project_id = p.id
LEFT JOIN cicd.coverage_reports cr ON pr.id = cr.pipeline_run_id
WHERE pr.created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.name, DATE(pr.created_at)
ORDER BY p.name, date DESC;

-- Definition of Done compliance
CREATE OR REPLACE VIEW cicd.dod_compliance AS
SELECT
    p.name as project_name,
    COUNT(pr.id) as total_builds,
    COUNT(CASE WHEN pr.definition_of_done_met THEN 1 END) as dod_met_count,
    ROUND(COUNT(CASE WHEN pr.definition_of_done_met THEN 1 END)::DECIMAL / NULLIF(COUNT(pr.id), 0) * 100, 2) as dod_compliance_rate,
    COUNT(CASE WHEN NOT pr.code_complete THEN 1 END) as incomplete_code,
    COUNT(CASE WHEN NOT pr.documentation_updated THEN 1 END) as missing_docs,
    COUNT(CASE WHEN NOT pr.tests_green THEN 1 END) as failing_tests,
    COUNT(CASE WHEN NOT pr.coverage_adequate THEN 1 END) as insufficient_coverage
FROM cicd.projects p
LEFT JOIN cicd.pipeline_runs pr ON p.id = pr.project_id
WHERE pr.created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.name;

-- ============================================================================
-- FUNCTIONS FOR CI/CD OPERATIONS
-- ============================================================================

-- Check if Definition of Done is met
CREATE OR REPLACE FUNCTION cicd.check_definition_of_done(
    p_pipeline_run_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_code_complete BOOLEAN;
    v_docs_updated BOOLEAN;
    v_tests_green BOOLEAN;
    v_coverage_adequate BOOLEAN;
    v_min_coverage DECIMAL;
BEGIN
    -- Get pipeline run details
    SELECT
        pr.build_success,
        pr.tests_passed,
        pr.coverage_met,
        p.minimum_coverage_percent
    INTO
        v_code_complete,
        v_tests_green,
        v_coverage_adequate,
        v_min_coverage
    FROM cicd.pipeline_runs pr
    JOIN cicd.projects p ON pr.project_id = p.id
    WHERE pr.id = p_pipeline_run_id;

    -- Check documentation
    SELECT EXISTS(
        SELECT 1 FROM cicd.documentation_updates
        WHERE pipeline_run_id = p_pipeline_run_id
        AND updated = true
    ) INTO v_docs_updated;

    -- Update pipeline run with DOD status
    UPDATE cicd.pipeline_runs SET
        code_complete = v_code_complete,
        documentation_updated = v_docs_updated,
        tests_green = v_tests_green,
        coverage_adequate = v_coverage_adequate,
        definition_of_done_met = (
            v_code_complete AND
            v_docs_updated AND
            v_tests_green AND
            v_coverage_adequate
        )
    WHERE id = p_pipeline_run_id;

    RETURN (v_code_complete AND v_docs_updated AND v_tests_green AND v_coverage_adequate);
END;
$$ LANGUAGE plpgsql;

-- Generate build report
CREATE OR REPLACE FUNCTION cicd.generate_build_report(
    p_pipeline_run_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_total_tests INTEGER;
    v_passed_tests INTEGER;
    v_coverage DECIMAL;
BEGIN
    -- Calculate test totals
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'passed' THEN 1 END)
    INTO v_total_tests, v_passed_tests
    FROM cicd.test_results
    WHERE pipeline_run_id = p_pipeline_run_id;

    -- Get coverage
    SELECT line_coverage_percent INTO v_coverage
    FROM cicd.coverage_reports
    WHERE pipeline_run_id = p_pipeline_run_id
    LIMIT 1;

    -- Insert or update report
    INSERT INTO cicd.build_reports (
        pipeline_run_id,
        overall_status,
        total_tests,
        tests_passed,
        test_success_rate,
        coverage_percent
    ) VALUES (
        p_pipeline_run_id,
        CASE
            WHEN EXISTS(SELECT 1 FROM cicd.pipeline_runs WHERE id = p_pipeline_run_id AND definition_of_done_met)
            THEN 'success'
            ELSE 'failed'
        END,
        v_total_tests,
        v_passed_tests,
        ROUND(v_passed_tests::DECIMAL / NULLIF(v_total_tests, 0) * 100, 2),
        v_coverage
    )
    ON CONFLICT (pipeline_run_id)
    DO UPDATE SET
        overall_status = EXCLUDED.overall_status,
        total_tests = EXCLUDED.total_tests,
        tests_passed = EXCLUDED.tests_passed,
        test_success_rate = EXCLUDED.test_success_rate,
        coverage_percent = EXCLUDED.coverage_percent,
        report_generated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL CONFIGURATION
-- ============================================================================

-- Insert default projects
INSERT INTO cicd.projects (name, repository_url, minimum_coverage_percent, ai_agent) VALUES
    ('pandora-automation', 'https://github.com/tenshimatt/pandora', 80.00, 'claude-code'),
    ('superluxe-tradeart', 'https://github.com/SUPERLUXE/tradeart', 75.00, 'claude-code'),
    ('rawgle-backend', 'https://github.com/tenshimatt/rawgle', 85.00, 'qwen')
ON CONFLICT (name) DO NOTHING;

-- Insert default scheduled jobs
INSERT INTO cicd.scheduled_jobs (job_name, job_type, cron_expression, timezone) VALUES
    ('nightly-build-all', 'build', '0 2 * * *', 'America/Chicago'),
    ('morning-tests', 'test', '0 6 * * *', 'America/Chicago'),
    ('weekly-coverage-report', 'report', '0 9 * * MON', 'America/Chicago')
ON CONFLICT (job_name) DO NOTHING;