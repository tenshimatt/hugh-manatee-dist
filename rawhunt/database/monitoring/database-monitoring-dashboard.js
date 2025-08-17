// Database Monitoring & Analytics Dashboard for GoHunta.com
// Real-time monitoring, performance tracking, and health analytics for Cloudflare D1

export class DatabaseMonitoringDashboard {
    constructor(database, config = {}) {
        this.db = database;
        this.config = {
            alertThresholds: {
                slowQueryTime: 100, // ms
                highCpuUsage: 80, // percentage
                lowDiskSpace: 85, // percentage
                highConnectionCount: 90, // percentage of max
                errorRate: 5 // percentage
            },
            refreshInterval: 30000, // 30 seconds
            retentionPeriods: {
                realtime: 24, // hours
                daily: 30, // days
                weekly: 12, // weeks
                monthly: 24 // months
            },
            ...config
        };

        this.metrics = {
            queries: new Map(),
            performance: new Map(),
            health: new Map(),
            alerts: []
        };

        this.isMonitoring = false;
    }

    // =============================================================================
    // MONITORING SYSTEM INITIALIZATION
    // =============================================================================

    async initializeMonitoring() {
        console.log('Initializing database monitoring system...');

        // Create monitoring tables if they don't exist
        await this.createMonitoringTables();
        
        // Initialize metrics collection
        await this.initializeMetrics();
        
        // Start background monitoring
        this.startMonitoring();
        
        console.log('Database monitoring system initialized');
        
        return {
            status: 'initialized',
            config: this.config,
            startTime: new Date().toISOString()
        };
    }

    async createMonitoringTables() {
        // Query performance metrics
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS query_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query_hash TEXT NOT NULL,
                query_type TEXT NOT NULL,
                table_names TEXT, -- JSON array
                execution_time_ms REAL NOT NULL,
                rows_examined INTEGER,
                rows_returned INTEGER,
                index_usage TEXT, -- JSON object
                cache_hit BOOLEAN DEFAULT FALSE,
                edge_location TEXT,
                user_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_partition DATE GENERATED ALWAYS AS (date(timestamp)) STORED
            )
        `).run();

        // Database health metrics
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS health_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_unit TEXT,
                metric_type TEXT CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
                labels TEXT, -- JSON object for additional labels
                edge_location TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_partition DATE GENERATED ALWAYS AS (date(timestamp)) STORED
            )
        `).run();

        // Alert history
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                title TEXT NOT NULL,
                description TEXT,
                metric_name TEXT,
                threshold_value REAL,
                actual_value REAL,
                edge_location TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                resolved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Connection pool metrics
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS connection_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                active_connections INTEGER NOT NULL,
                idle_connections INTEGER NOT NULL,
                total_connections INTEGER NOT NULL,
                max_connections INTEGER NOT NULL,
                connection_wait_time_ms REAL,
                edge_location TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // User activity patterns
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS user_activity_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                session_id TEXT,
                page_path TEXT,
                query_count INTEGER DEFAULT 0,
                total_query_time_ms REAL DEFAULT 0,
                cache_hit_rate REAL,
                edge_location TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                hour_partition INTEGER GENERATED ALWAYS AS (cast(strftime('%H', timestamp) as integer)) STORED
            )
        `).run();

        // Create indexes for monitoring tables
        await this.createMonitoringIndexes();
    }

    async createMonitoringIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_query_metrics_timestamp ON query_metrics(timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_query_metrics_hash ON query_metrics(query_hash)',
            'CREATE INDEX IF NOT EXISTS idx_query_metrics_slow ON query_metrics(execution_time_ms) WHERE execution_time_ms > 50',
            'CREATE INDEX IF NOT EXISTS idx_query_metrics_partition ON query_metrics(date_partition)',
            
            'CREATE INDEX IF NOT EXISTS idx_health_metrics_name_time ON health_metrics(metric_name, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_health_metrics_partition ON health_metrics(date_partition)',
            
            'CREATE INDEX IF NOT EXISTS idx_alert_history_unresolved ON alert_history(resolved, created_at) WHERE resolved = FALSE',
            'CREATE INDEX IF NOT EXISTS idx_alert_history_severity ON alert_history(severity, created_at)',
            
            'CREATE INDEX IF NOT EXISTS idx_connection_metrics_time ON connection_metrics(timestamp DESC)',
            
            'CREATE INDEX IF NOT EXISTS idx_user_activity_time ON user_activity_metrics(timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_metrics(user_id, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_user_activity_partition ON user_activity_metrics(hour_partition)'
        ];

        for (const indexSql of indexes) {
            await this.db.prepare(indexSql).run();
        }
    }

    async initializeMetrics() {
        // Initialize baseline metrics
        const baselineMetrics = [
            { name: 'db_connections_total', value: 0, type: 'gauge', unit: 'connections' },
            { name: 'query_count_total', value: 0, type: 'counter', unit: 'queries' },
            { name: 'query_duration_avg', value: 0, type: 'gauge', unit: 'milliseconds' },
            { name: 'error_rate', value: 0, type: 'gauge', unit: 'percentage' },
            { name: 'cache_hit_rate', value: 0, type: 'gauge', unit: 'percentage' },
            { name: 'active_users', value: 0, type: 'gauge', unit: 'users' }
        ];

        for (const metric of baselineMetrics) {
            await this.recordHealthMetric(metric.name, metric.value, metric.unit, metric.type);
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.collectMetrics();
            await this.checkAlerts();
            await this.cleanupOldMetrics();
        }, this.config.refreshInterval);
        
        console.log(`Database monitoring started with ${this.config.refreshInterval}ms interval`);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.isMonitoring = false;
            console.log('Database monitoring stopped');
        }
    }

    // =============================================================================
    // METRICS COLLECTION
    // =============================================================================

    async collectMetrics() {
        try {
            const metrics = await Promise.all([
                this.collectQueryMetrics(),
                this.collectConnectionMetrics(),
                this.collectUserActivityMetrics(),
                this.collectSystemHealthMetrics(),
                this.collectPerformanceMetrics()
            ]);

            // Update in-memory metrics cache
            this.updateMetricsCache(metrics);
            
            return metrics;
        } catch (error) {
            console.error('Error collecting metrics:', error);
            await this.createAlert('metrics_collection_error', 'medium', 'Metrics Collection Failed', error.message);
        }
    }

    async collectQueryMetrics() {
        // Get query performance data from the last interval
        const recentQueries = await this.db.prepare(`
            SELECT 
                query_type,
                COUNT(*) as query_count,
                AVG(execution_time_ms) as avg_execution_time,
                MAX(execution_time_ms) as max_execution_time,
                COUNT(CASE WHEN execution_time_ms > ? THEN 1 END) as slow_queries,
                AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate
            FROM query_metrics 
            WHERE timestamp >= datetime('now', '-' || ? || ' seconds')
            GROUP BY query_type
        `).bind(this.config.alertThresholds.slowQueryTime, this.config.refreshInterval / 1000).all();

        // Record aggregated metrics
        for (const row of recentQueries.results || []) {
            await this.recordHealthMetric('queries_per_minute', row.query_count, 'queries/min', 'counter', {
                query_type: row.query_type
            });
            
            await this.recordHealthMetric('avg_query_time', row.avg_execution_time, 'ms', 'gauge', {
                query_type: row.query_type
            });
            
            if (row.slow_queries > 0) {
                await this.recordHealthMetric('slow_queries', row.slow_queries, 'queries', 'counter', {
                    query_type: row.query_type
                });
            }
            
            await this.recordHealthMetric('cache_hit_rate', row.cache_hit_rate, 'percentage', 'gauge', {
                query_type: row.query_type
            });
        }

        return recentQueries.results;
    }

    async collectConnectionMetrics() {
        // Simulate connection pool metrics (would be actual in production)
        const connectionData = {
            active_connections: Math.floor(Math.random() * 50) + 10,
            idle_connections: Math.floor(Math.random() * 20) + 5,
            total_connections: 0,
            max_connections: 100,
            connection_wait_time_ms: Math.random() * 10
        };

        connectionData.total_connections = connectionData.active_connections + connectionData.idle_connections;

        await this.db.prepare(`
            INSERT INTO connection_metrics (
                active_connections, idle_connections, total_connections, 
                max_connections, connection_wait_time_ms, edge_location
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            connectionData.active_connections,
            connectionData.idle_connections,
            connectionData.total_connections,
            connectionData.max_connections,
            connectionData.connection_wait_time_ms,
            'auto' // Would be actual edge location
        ).run();

        return connectionData;
    }

    async collectUserActivityMetrics() {
        // Get user activity patterns
        const activeUsers = await this.db.prepare(`
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM user_sessions 
            WHERE last_accessed >= datetime('now', '-15 minutes')
              AND is_active = TRUE
        `).first();

        const recentActivity = await this.db.prepare(`
            SELECT 
                COUNT(*) as total_operations,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(CASE WHEN session_token IS NOT NULL THEN 1 ELSE 0 END) * 100 as authenticated_rate
            FROM user_sessions
            WHERE last_accessed >= datetime('now', '-' || ? || ' seconds')
        `).bind(this.config.refreshInterval / 1000).first();

        await this.recordHealthMetric('active_users', activeUsers?.active_users || 0, 'users', 'gauge');
        await this.recordHealthMetric('user_operations_per_minute', recentActivity?.total_operations || 0, 'operations/min', 'counter');
        await this.recordHealthMetric('authentication_rate', recentActivity?.authenticated_rate || 0, 'percentage', 'gauge');

        return {
            activeUsers: activeUsers?.active_users || 0,
            totalOperations: recentActivity?.total_operations || 0,
            uniqueUsers: recentActivity?.unique_users || 0,
            authenticationRate: recentActivity?.authenticated_rate || 0
        };
    }

    async collectSystemHealthMetrics() {
        // Database size and growth metrics
        const dbStats = await this.getTableSizeStats();
        
        // Record table sizes
        for (const [tableName, size] of Object.entries(dbStats.tableSizes)) {
            await this.recordHealthMetric('table_size_mb', size, 'MB', 'gauge', { table: tableName });
        }

        await this.recordHealthMetric('total_database_size', dbStats.totalSize, 'MB', 'gauge');
        
        // Error rate calculation
        const errorRate = await this.calculateErrorRate();
        await this.recordHealthMetric('error_rate', errorRate, 'percentage', 'gauge');

        return {
            databaseSize: dbStats.totalSize,
            tableSizes: dbStats.tableSizes,
            errorRate
        };
    }

    async collectPerformanceMetrics() {
        // Index usage statistics
        const indexStats = await this.db.prepare(`
            SELECT name, tbl_name 
            FROM sqlite_master 
            WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
        `).all();

        // Query plan analysis for recent queries
        const recentSlowQueries = await this.db.prepare(`
            SELECT query_hash, execution_time_ms, index_usage
            FROM query_metrics
            WHERE execution_time_ms > ?
              AND timestamp >= datetime('now', '-1 hour')
            ORDER BY execution_time_ms DESC
            LIMIT 10
        `).bind(this.config.alertThresholds.slowQueryTime).all();

        return {
            indexCount: indexStats.results?.length || 0,
            slowQueries: recentSlowQueries.results || []
        };
    }

    // =============================================================================
    // REAL-TIME QUERY MONITORING
    // =============================================================================

    async monitorQuery(queryHash, queryType, tableNames, executionTimeMs, rowsExamined, rowsReturned, indexUsage, cacheHit = false, userId = null) {
        // Record query metrics
        await this.db.prepare(`
            INSERT INTO query_metrics (
                query_hash, query_type, table_names, execution_time_ms,
                rows_examined, rows_returned, index_usage, cache_hit, user_id, edge_location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            queryHash,
            queryType,
            JSON.stringify(tableNames),
            executionTimeMs,
            rowsExamined,
            rowsReturned,
            JSON.stringify(indexUsage),
            cacheHit,
            userId,
            'auto' // Would be actual edge location
        ).run();

        // Check for slow query alert
        if (executionTimeMs > this.config.alertThresholds.slowQueryTime) {
            await this.createAlert(
                'slow_query',
                'medium',
                'Slow Query Detected',
                `Query executed in ${executionTimeMs}ms (threshold: ${this.config.alertThresholds.slowQueryTime}ms)`,
                executionTimeMs
            );
        }

        // Update real-time metrics
        this.updateQueryMetrics(queryType, executionTimeMs, cacheHit);
    }

    updateQueryMetrics(queryType, executionTime, cacheHit) {
        if (!this.metrics.queries.has(queryType)) {
            this.metrics.queries.set(queryType, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                cacheHits: 0,
                cacheRate: 0
            });
        }

        const queryMetrics = this.metrics.queries.get(queryType);
        queryMetrics.count++;
        queryMetrics.totalTime += executionTime;
        queryMetrics.avgTime = queryMetrics.totalTime / queryMetrics.count;
        
        if (cacheHit) {
            queryMetrics.cacheHits++;
        }
        queryMetrics.cacheRate = (queryMetrics.cacheHits / queryMetrics.count) * 100;
    }

    // =============================================================================
    // ALERTING SYSTEM
    // =============================================================================

    async checkAlerts() {
        const checks = [
            this.checkSlowQueries(),
            this.checkHighConnectionUsage(),
            this.checkErrorRate(),
            this.checkDatabaseGrowth(),
            this.checkConnectionPoolHealth()
        ];

        await Promise.all(checks);
    }

    async checkSlowQueries() {
        const slowQueryCount = await this.db.prepare(`
            SELECT COUNT(*) as count
            FROM query_metrics
            WHERE execution_time_ms > ?
              AND timestamp >= datetime('now', '-5 minutes')
        `).bind(this.config.alertThresholds.slowQueryTime).first();

        if (slowQueryCount?.count > 10) { // More than 10 slow queries in 5 minutes
            await this.createAlert(
                'high_slow_query_rate',
                'high',
                'High Slow Query Rate',
                `${slowQueryCount.count} slow queries detected in the last 5 minutes`,
                slowQueryCount.count
            );
        }
    }

    async checkHighConnectionUsage() {
        const latestConnections = await this.db.prepare(`
            SELECT active_connections, max_connections
            FROM connection_metrics
            ORDER BY timestamp DESC
            LIMIT 1
        `).first();

        if (latestConnections) {
            const usagePercent = (latestConnections.active_connections / latestConnections.max_connections) * 100;
            
            if (usagePercent > this.config.alertThresholds.highConnectionCount) {
                await this.createAlert(
                    'high_connection_usage',
                    'high',
                    'High Connection Usage',
                    `Connection pool usage at ${usagePercent.toFixed(1)}%`,
                    usagePercent
                );
            }
        }
    }

    async checkErrorRate() {
        const errorRate = await this.calculateErrorRate();
        
        if (errorRate > this.config.alertThresholds.errorRate) {
            await this.createAlert(
                'high_error_rate',
                'critical',
                'High Error Rate',
                `Error rate is ${errorRate.toFixed(2)}% (threshold: ${this.config.alertThresholds.errorRate}%)`,
                errorRate
            );
        }
    }

    async checkDatabaseGrowth() {
        const currentSize = await this.getCurrentDatabaseSize();
        const weekAgoSize = await this.getDatabaseSizeWeekAgo();
        
        if (weekAgoSize > 0) {
            const growthRate = ((currentSize - weekAgoSize) / weekAgoSize) * 100;
            
            if (growthRate > 50) { // 50% growth in a week
                await this.createAlert(
                    'rapid_database_growth',
                    'medium',
                    'Rapid Database Growth',
                    `Database size increased by ${growthRate.toFixed(1)}% in the past week`,
                    growthRate
                );
            }
        }
    }

    async checkConnectionPoolHealth() {
        const avgWaitTime = await this.db.prepare(`
            SELECT AVG(connection_wait_time_ms) as avg_wait
            FROM connection_metrics
            WHERE timestamp >= datetime('now', '-10 minutes')
        `).first();

        if (avgWaitTime?.avg_wait > 100) { // 100ms average wait time
            await this.createAlert(
                'high_connection_wait_time',
                'medium',
                'High Connection Wait Time',
                `Average connection wait time is ${avgWaitTime.avg_wait.toFixed(2)}ms`,
                avgWaitTime.avg_wait
            );
        }
    }

    async createAlert(alertType, severity, title, description, actualValue = null) {
        // Check if similar alert exists and is unresolved
        const existingAlert = await this.db.prepare(`
            SELECT id FROM alert_history
            WHERE alert_type = ? AND resolved = FALSE
              AND created_at >= datetime('now', '-1 hour')
        `).bind(alertType).first();

        if (existingAlert) {
            return; // Don't create duplicate alerts
        }

        await this.db.prepare(`
            INSERT INTO alert_history (
                alert_type, severity, title, description, actual_value, edge_location
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(alertType, severity, title, description, actualValue, 'auto').run();

        // Add to in-memory alerts
        this.metrics.alerts.push({
            type: alertType,
            severity,
            title,
            description,
            value: actualValue,
            timestamp: new Date().toISOString()
        });

        console.warn(`[${severity.toUpperCase()} ALERT] ${title}: ${description}`);
    }

    // =============================================================================
    // DASHBOARD DATA PROVIDERS
    // =============================================================================

    async getDashboardData(timeRange = '24h') {
        const dashboard = {
            summary: await this.getSummaryMetrics(timeRange),
            queryPerformance: await this.getQueryPerformanceData(timeRange),
            systemHealth: await this.getSystemHealthData(timeRange),
            userActivity: await this.getUserActivityData(timeRange),
            alerts: await this.getActiveAlerts(),
            topSlowQueries: await this.getTopSlowQueries(timeRange),
            connectionMetrics: await this.getConnectionMetricsData(timeRange)
        };

        return dashboard;
    }

    async getSummaryMetrics(timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const summary = await this.db.prepare(`
            SELECT 
                COUNT(*) as total_queries,
                AVG(execution_time_ms) as avg_query_time,
                COUNT(CASE WHEN execution_time_ms > ? THEN 1 END) as slow_queries,
                AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
                COUNT(DISTINCT user_id) as active_users
            FROM query_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
        `).bind(this.config.alertThresholds.slowQueryTime, timeFilter).first();

        const alerts = await this.db.prepare(`
            SELECT COUNT(*) as alert_count
            FROM alert_history
            WHERE resolved = FALSE
        `).first();

        return {
            totalQueries: summary?.total_queries || 0,
            avgQueryTime: summary?.avg_query_time || 0,
            slowQueries: summary?.slow_queries || 0,
            cacheHitRate: summary?.cache_hit_rate || 0,
            activeUsers: summary?.active_users || 0,
            activeAlerts: alerts?.alert_count || 0,
            healthScore: this.calculateHealthScore()
        };
    }

    async getQueryPerformanceData(timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const performanceData = await this.db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                query_type,
                COUNT(*) as query_count,
                AVG(execution_time_ms) as avg_time,
                MAX(execution_time_ms) as max_time,
                COUNT(CASE WHEN execution_time_ms > ? THEN 1 END) as slow_queries
            FROM query_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
            GROUP BY hour, query_type
            ORDER BY hour DESC
        `).bind(this.config.alertThresholds.slowQueryTime, timeFilter).all();

        return this.formatTimeSeriesData(performanceData.results);
    }

    async getSystemHealthData(timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const healthData = await this.db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                metric_name,
                AVG(metric_value) as avg_value,
                MAX(metric_value) as max_value,
                MIN(metric_value) as min_value
            FROM health_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
            GROUP BY hour, metric_name
            ORDER BY hour DESC
        `).bind(timeFilter).all();

        return this.formatTimeSeriesData(healthData.results);
    }

    async getUserActivityData(timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const activityData = await this.db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                COUNT(DISTINCT user_id) as active_users,
                SUM(query_count) as total_queries,
                AVG(total_query_time_ms) as avg_session_time
            FROM user_activity_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
            GROUP BY hour
            ORDER BY hour DESC
        `).bind(timeFilter).all();

        return this.formatTimeSeriesData(activityData.results);
    }

    async getActiveAlerts() {
        const alerts = await this.db.prepare(`
            SELECT *
            FROM alert_history
            WHERE resolved = FALSE
            ORDER BY created_at DESC
            LIMIT 50
        `).all();

        return alerts.results;
    }

    async getTopSlowQueries(timeRange, limit = 10) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const slowQueries = await this.db.prepare(`
            SELECT 
                query_hash,
                query_type,
                AVG(execution_time_ms) as avg_time,
                MAX(execution_time_ms) as max_time,
                COUNT(*) as frequency,
                MAX(timestamp) as last_seen
            FROM query_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
              AND execution_time_ms > ?
            GROUP BY query_hash, query_type
            ORDER BY avg_time DESC
            LIMIT ?
        `).bind(timeFilter, this.config.alertThresholds.slowQueryTime, limit).all();

        return slowQueries.results;
    }

    async getConnectionMetricsData(timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);
        
        const connectionData = await this.db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                AVG(active_connections) as avg_active,
                MAX(active_connections) as max_active,
                AVG(connection_wait_time_ms) as avg_wait_time
            FROM connection_metrics
            WHERE timestamp >= datetime('now', '-' || ?)
            GROUP BY hour
            ORDER BY hour DESC
        `).bind(timeFilter).all();

        return this.formatTimeSeriesData(connectionData.results);
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    getTimeFilter(timeRange) {
        const timeFilters = {
            '1h': '1 hour',
            '6h': '6 hours',
            '24h': '1 day',
            '7d': '7 days',
            '30d': '30 days'
        };
        
        return timeFilters[timeRange] || '1 day';
    }

    formatTimeSeriesData(data) {
        // Group data by time and format for charting libraries
        const grouped = {};
        
        for (const row of data) {
            if (!grouped[row.hour]) {
                grouped[row.hour] = { timestamp: row.hour };
            }
            Object.assign(grouped[row.hour], row);
        }
        
        return Object.values(grouped).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    async recordHealthMetric(name, value, unit, type = 'gauge', labels = {}) {
        await this.db.prepare(`
            INSERT INTO health_metrics (metric_name, metric_value, metric_unit, metric_type, labels, edge_location)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(name, value, unit, type, JSON.stringify(labels), 'auto').run();
    }

    calculateHealthScore() {
        // Simple health score calculation based on current metrics
        let score = 100;
        
        // Deduct points for active alerts
        const criticalAlerts = this.metrics.alerts.filter(a => a.severity === 'critical').length;
        const highAlerts = this.metrics.alerts.filter(a => a.severity === 'high').length;
        const mediumAlerts = this.metrics.alerts.filter(a => a.severity === 'medium').length;
        
        score -= (criticalAlerts * 30) + (highAlerts * 15) + (mediumAlerts * 5);
        
        return Math.max(0, score);
    }

    async calculateErrorRate() {
        // Calculate error rate based on failed queries/operations
        const errorCount = await this.db.prepare(`
            SELECT COUNT(*) as errors
            FROM alert_history
            WHERE created_at >= datetime('now', '-1 hour')
              AND severity IN ('high', 'critical')
        `).first();

        const totalQueries = await this.db.prepare(`
            SELECT COUNT(*) as total
            FROM query_metrics
            WHERE timestamp >= datetime('now', '-1 hour')
        `).first();

        if (!totalQueries?.total || totalQueries.total === 0) return 0;
        
        return ((errorCount?.errors || 0) / totalQueries.total) * 100;
    }

    async getTableSizeStats() {
        // Get table size statistics
        const tables = ['users', 'dogs', 'hunt_logs', 'training_sessions', 'community_posts', 'game_harvested'];
        const tableSizes = {};
        let totalSize = 0;

        for (const table of tables) {
            try {
                const count = await this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
                const estimatedSize = (count?.count || 0) * 0.001; // Rough estimate: 1KB per row
                tableSizes[table] = parseFloat(estimatedSize.toFixed(2));
                totalSize += estimatedSize;
            } catch (error) {
                tableSizes[table] = 0;
            }
        }

        return {
            tableSizes,
            totalSize: parseFloat(totalSize.toFixed(2))
        };
    }

    async getCurrentDatabaseSize() {
        const stats = await this.getTableSizeStats();
        return stats.totalSize;
    }

    async getDatabaseSizeWeekAgo() {
        // This would typically come from historical metrics
        const weekAgoMetric = await this.db.prepare(`
            SELECT metric_value
            FROM health_metrics
            WHERE metric_name = 'total_database_size'
              AND timestamp <= datetime('now', '-7 days')
            ORDER BY timestamp DESC
            LIMIT 1
        `).first();

        return weekAgoMetric?.metric_value || 0;
    }

    updateMetricsCache(metrics) {
        // Update in-memory cache for real-time dashboard updates
        this.metrics.performance.set('last_update', new Date().toISOString());
        this.metrics.performance.set('metrics_collected', metrics.length);
    }

    async cleanupOldMetrics() {
        // Clean up old metrics based on retention policy
        const cleanupTasks = [
            // Remove old query metrics (keep detailed data for 24 hours)
            this.db.prepare(`
                DELETE FROM query_metrics 
                WHERE timestamp < datetime('now', '-' || ? || ' hours')
            `).bind(this.config.retentionPeriods.realtime).run(),
            
            // Remove old health metrics (keep detailed data for 30 days)
            this.db.prepare(`
                DELETE FROM health_metrics 
                WHERE timestamp < datetime('now', '-' || ? || ' days')
            `).bind(this.config.retentionPeriods.daily).run(),
            
            // Remove old connection metrics (keep for 7 days)
            this.db.prepare(`
                DELETE FROM connection_metrics 
                WHERE timestamp < datetime('now', '-7 days')
            `).run(),
            
            // Remove resolved alerts older than 30 days
            this.db.prepare(`
                DELETE FROM alert_history 
                WHERE resolved = TRUE 
                  AND resolved_at < datetime('now', '-30 days')
            `).run()
        ];

        await Promise.all(cleanupTasks);
    }

    // =============================================================================
    // API FOR EXTERNAL MONITORING
    // =============================================================================

    async getMetricsEndpoint(format = 'json') {
        const metrics = await this.getDashboardData('1h');
        
        if (format === 'prometheus') {
            return this.formatPrometheusMetrics(metrics);
        }
        
        return {
            timestamp: new Date().toISOString(),
            metrics,
            health_score: this.calculateHealthScore(),
            monitoring_status: this.isMonitoring ? 'active' : 'inactive'
        };
    }

    formatPrometheusMetrics(metrics) {
        // Format metrics in Prometheus exposition format
        let output = '';
        
        output += `# HELP gohunta_db_query_total Total number of database queries\n`;
        output += `# TYPE gohunta_db_query_total counter\n`;
        output += `gohunta_db_query_total ${metrics.summary.totalQueries}\n\n`;
        
        output += `# HELP gohunta_db_query_duration_avg Average query duration in milliseconds\n`;
        output += `# TYPE gohunta_db_query_duration_avg gauge\n`;
        output += `gohunta_db_query_duration_avg ${metrics.summary.avgQueryTime}\n\n`;
        
        output += `# HELP gohunta_db_cache_hit_rate Cache hit rate percentage\n`;
        output += `# TYPE gohunta_db_cache_hit_rate gauge\n`;
        output += `gohunta_db_cache_hit_rate ${metrics.summary.cacheHitRate}\n\n`;
        
        output += `# HELP gohunta_db_active_users Number of active users\n`;
        output += `# TYPE gohunta_db_active_users gauge\n`;
        output += `gohunta_db_active_users ${metrics.summary.activeUsers}\n\n`;
        
        output += `# HELP gohunta_db_health_score Overall database health score\n`;
        output += `# TYPE gohunta_db_health_score gauge\n`;
        output += `gohunta_db_health_score ${this.calculateHealthScore()}\n\n`;
        
        return output;
    }
}