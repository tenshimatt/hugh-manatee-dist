#!/usr/bin/env node
/**
 * RAWGLE Database Monitoring and Alerting System
 * 
 * Comprehensive database health monitoring with performance metrics,
 * connection pooling monitoring, replication lag tracking, and alerting
 * for operational excellence.
 * 
 * Usage:
 *   npm run db:monitor              - Run full monitoring suite
 *   npm run db:monitor:health       - Health check only
 *   npm run db:monitor:performance  - Performance metrics only
 *   npm run db:monitor:connections  - Connection monitoring
 *   npm run db:monitor:alerts       - Check and send alerts
 * 
 * Created: 2025-09-07
 * Component: Database Operations & Monitoring
 */

import { db } from '../config/database';
import { logger } from '../config/logger';

// Monitoring thresholds (configurable via environment)
const THRESHOLDS = {
  CONNECTION_USAGE_WARNING: parseInt(process.env.DB_CONNECTION_WARNING_THRESHOLD || '80'), // %
  CONNECTION_USAGE_CRITICAL: parseInt(process.env.DB_CONNECTION_CRITICAL_THRESHOLD || '95'), // %
  QUERY_DURATION_WARNING: parseInt(process.env.DB_QUERY_WARNING_MS || '5000'), // ms
  QUERY_DURATION_CRITICAL: parseInt(process.env.DB_QUERY_CRITICAL_MS || '30000'), // ms
  REPLICATION_LAG_WARNING: parseInt(process.env.DB_REPLICATION_WARNING_SECONDS || '10'), // seconds
  REPLICATION_LAG_CRITICAL: parseInt(process.env.DB_REPLICATION_CRITICAL_SECONDS || '60'), // seconds
  DISK_USAGE_WARNING: parseInt(process.env.DB_DISK_WARNING_PERCENT || '80'), // %
  DISK_USAGE_CRITICAL: parseInt(process.env.DB_DISK_CRITICAL_PERCENT || '90'), // %
  MEMORY_USAGE_WARNING: parseInt(process.env.DB_MEMORY_WARNING_PERCENT || '85'), // %
  MEMORY_USAGE_CRITICAL: parseInt(process.env.DB_MEMORY_CRITICAL_PERCENT || '95'), // %
  TABLE_BLOAT_WARNING: parseInt(process.env.DB_BLOAT_WARNING_PERCENT || '25'), // %
  TABLE_BLOAT_CRITICAL: parseInt(process.env.DB_BLOAT_CRITICAL_PERCENT || '50'), // %
};

interface DatabaseMetrics {
  timestamp: Date;
  connections: ConnectionMetrics;
  performance: PerformanceMetrics;
  storage: StorageMetrics;
  replication?: ReplicationMetrics;
  health: HealthMetrics;
  security: SecurityMetrics;
}

interface ConnectionMetrics {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  max_connections: number;
  usage_percentage: number;
  connections_by_state: Record<string, number>;
  long_running_queries: number;
  blocked_queries: number;
}

interface PerformanceMetrics {
  queries_per_second: number;
  average_query_duration_ms: number;
  slow_queries_count: number;
  deadlocks_count: number;
  cache_hit_ratio: number;
  index_hit_ratio: number;
  sequential_scans: number;
  temp_files_created: number;
  temp_files_size_mb: number;
}

interface StorageMetrics {
  database_size_mb: number;
  table_sizes_mb: Record<string, number>;
  index_sizes_mb: Record<string, number>;
  disk_usage_percentage: number;
  available_space_mb: number;
  table_bloat: Record<string, number>;
  index_bloat: Record<string, number>;
}

interface ReplicationMetrics {
  is_primary: boolean;
  replication_lag_seconds: number;
  replica_count: number;
  replica_status: Record<string, string>;
}

interface HealthMetrics {
  is_healthy: boolean;
  uptime_seconds: number;
  last_vacuum: Record<string, Date>;
  last_analyze: Record<string, Date>;
  autovacuum_running: boolean;
  maintenance_needed: string[];
}

interface SecurityMetrics {
  failed_login_attempts_last_hour: number;
  suspicious_activity: string[];
  privilege_escalations: number;
  unusual_queries: number;
}

interface Alert {
  level: 'warning' | 'critical' | 'info';
  category: 'connection' | 'performance' | 'storage' | 'replication' | 'health' | 'security';
  message: string;
  metric_value?: number;
  threshold?: number;
  timestamp: Date;
}

class DatabaseMonitor {
  private alerts: Alert[] = [];

  /**
   * Run comprehensive database monitoring
   */
  async runFullMonitoring(): Promise<DatabaseMetrics> {
    logger.info('Starting comprehensive database monitoring');

    try {
      const metrics: DatabaseMetrics = {
        timestamp: new Date(),
        connections: await this.collectConnectionMetrics(),
        performance: await this.collectPerformanceMetrics(),
        storage: await this.collectStorageMetrics(),
        replication: await this.collectReplicationMetrics(),
        health: await this.collectHealthMetrics(),
        security: await this.collectSecurityMetrics()
      };

      // Check thresholds and generate alerts
      await this.checkThresholds(metrics);

      // Log summary
      this.logMetricsSummary(metrics);

      return metrics;

    } catch (error) {
      logger.error('Database monitoring failed:', error);
      this.alerts.push({
        level: 'critical',
        category: 'health',
        message: `Database monitoring system failure: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Collect connection pool and session metrics
   */
  async collectConnectionMetrics(): Promise<ConnectionMetrics> {
    logger.debug('Collecting connection metrics');

    // Current connections by state
    const connectionsResult = await db.query(`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
      GROUP BY state
    `);

    const connectionsByState = connectionsResult.reduce((acc, row) => {
      acc[row.state || 'unknown'] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Connection limits and totals
    const totalConnections = await db.query(`
      SELECT COUNT(*) as total
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
    `);

    const maxConnectionsResult = await db.query(`
      SHOW max_connections
    `);

    const maxConnections = parseInt(maxConnectionsResult[0].max_connections);
    const currentConnections = parseInt(totalConnections[0].total);

    // Long running queries (> 5 minutes)
    const longRunningResult = await db.query(`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE state = 'active'
      AND now() - query_start > interval '5 minutes'
      AND pid != pg_backend_pid()
    `);

    // Blocked queries
    const blockedResult = await db.query(`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE wait_event_type IS NOT NULL
      AND state = 'active'
      AND pid != pg_backend_pid()
    `);

    return {
      total_connections: currentConnections,
      active_connections: connectionsByState['active'] || 0,
      idle_connections: connectionsByState['idle'] || 0,
      max_connections: maxConnections,
      usage_percentage: Math.round((currentConnections / maxConnections) * 100),
      connections_by_state: connectionsByState,
      long_running_queries: parseInt(longRunningResult[0].count),
      blocked_queries: parseInt(blockedResult[0].count)
    };
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    logger.debug('Collecting performance metrics');

    // Database statistics
    const dbStatsResult = await db.query(`
      SELECT 
        tup_returned,
        tup_fetched,
        tup_inserted,
        tup_updated,
        tup_deleted,
        conflicts,
        temp_files,
        temp_bytes,
        deadlocks,
        blk_read_time,
        blk_write_time
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    const dbStats = dbStatsResult[0];

    // Cache hit ratios
    const cacheHitResult = await db.query(`
      SELECT 
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_read) as heap_read,
        sum(idx_blks_hit) as idx_hit,
        sum(idx_blks_read) as idx_read
      FROM pg_statio_user_tables
    `);

    const cacheStats = cacheHitResult[0];
    const cacheHitRatio = cacheStats.heap_hit > 0 ? 
      Math.round((cacheStats.heap_hit / (cacheStats.heap_hit + cacheStats.heap_read)) * 100) : 0;
    const indexHitRatio = cacheStats.idx_hit > 0 ?
      Math.round((cacheStats.idx_hit / (cacheStats.idx_hit + cacheStats.idx_read)) * 100) : 0;

    // Sequential scans
    const seqScanResult = await db.query(`
      SELECT SUM(seq_scan) as total_seq_scans
      FROM pg_stat_user_tables
    `);

    // Current query performance
    const currentQueryResult = await db.query(`
      SELECT 
        COUNT(*) as active_queries,
        AVG(EXTRACT(EPOCH FROM (now() - query_start))) * 1000 as avg_duration_ms
      FROM pg_stat_activity
      WHERE state = 'active'
      AND pid != pg_backend_pid()
      AND query_start IS NOT NULL
    `);

    // Slow queries count (queries running > warning threshold)
    const slowQueriesResult = await db.query(`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE state = 'active'
      AND now() - query_start > interval '${THRESHOLDS.QUERY_DURATION_WARNING / 1000} seconds'
      AND pid != pg_backend_pid()
    `);

    const currentQuery = currentQueryResult[0];

    return {
      queries_per_second: 0, // Would need pg_stat_statements extension for accurate QPS
      average_query_duration_ms: parseFloat(currentQuery.avg_duration_ms) || 0,
      slow_queries_count: parseInt(slowQueriesResult[0].count),
      deadlocks_count: parseInt(dbStats.deadlocks) || 0,
      cache_hit_ratio: cacheHitRatio,
      index_hit_ratio: indexHitRatio,
      sequential_scans: parseInt(seqScanResult[0].total_seq_scans) || 0,
      temp_files_created: parseInt(dbStats.temp_files) || 0,
      temp_files_size_mb: Math.round((parseInt(dbStats.temp_bytes) || 0) / (1024 * 1024))
    };
  }

  /**
   * Collect storage and disk usage metrics
   */
  async collectStorageMetrics(): Promise<StorageMetrics> {
    logger.debug('Collecting storage metrics');

    // Database size
    const dbSizeResult = await db.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size_pretty,
             pg_database_size(current_database()) as size_bytes
    `);

    // Table sizes
    const tableSizesResult = await db.query(`
      SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `);

    const tableSizes = tableSizesResult.reduce((acc, row) => {
      acc[row.tablename] = Math.round(row.size_bytes / (1024 * 1024)); // Convert to MB
      return acc;
    }, {} as Record<string, number>);

    // Index sizes
    const indexSizesResult = await db.query(`
      SELECT 
        indexname,
        pg_relation_size(indexname) as size_bytes
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);

    const indexSizes = indexSizesResult.reduce((acc, row) => {
      acc[row.indexname] = Math.round(row.size_bytes / (1024 * 1024)); // Convert to MB
      return acc;
    }, {} as Record<string, number>);

    // Table bloat estimation
    const tableBloatResult = await db.query(`
      SELECT 
        schemaname,
        tablename,
        ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END,1) AS bloat_ratio
      FROM (
        SELECT 
          schemaname, tablename, cc.reltuples, cc.relpages, otta,
          ROUND(CASE WHEN cc.reltuples = 0 THEN 0.0 ELSE sml.relpages/cc.reltuples::numeric END,1) AS bloat_ratio
        FROM (
          SELECT 
            schemaname, tablename, 
            CEIL((cc.reltuples*((datahdr+ma-
              (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
          FROM (
            SELECT
              schemaname, tablename, (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
              (maxfracsum*(nullhdr-ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
            FROM (
              SELECT
                schemaname, tablename, hdr, ma, bs,
                SUM((1-null_frac)*avg_width) AS datawidth,
                MAX(null_frac) AS maxfracsum,
                hdr+(
                  SELECT 1+count(*)/8
                  FROM pg_stats s2
                  WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                ) AS nullhdr
              FROM pg_stats s, (
                SELECT
                  (SELECT current_setting('block_size')::numeric) AS bs,
                  CASE WHEN SUBSTRING(SPLIT_PART(v, ' ', 2) FROM '#"[0-9]+.[0-9]+#"%' for '#') IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                  CASE WHEN v ~ 'mingw32' OR v ~ '64-bit' THEN 8 ELSE 4 END AS ma
                FROM (SELECT version() AS v) AS foo
              ) AS constants
              WHERE schemaname='public'
              GROUP BY schemaname, tablename, hdr, ma, bs
            ) AS foo
          ) AS rs
          JOIN pg_class cc ON cc.relname = rs.tablename
          JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname AND nn.nspname <> 'information_schema'
        ) AS sml
      ) AS sml
      WHERE schemaname = 'public'
    `);

    const tableBloat = tableBloatResult.reduce((acc, row) => {
      acc[row.tablename] = parseFloat(row.bloat_ratio) || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      database_size_mb: Math.round(dbSizeResult[0].size_bytes / (1024 * 1024)),
      table_sizes_mb: tableSizes,
      index_sizes_mb: indexSizes,
      disk_usage_percentage: 0, // Would need filesystem access for accurate disk usage
      available_space_mb: 0, // Would need filesystem access
      table_bloat: tableBloat,
      index_bloat: {} // Simplified for now
    };
  }

  /**
   * Collect replication metrics (if applicable)
   */
  async collectReplicationMetrics(): Promise<ReplicationMetrics | undefined> {
    logger.debug('Collecting replication metrics');

    try {
      // Check if this is a primary server
      const recoveryResult = await db.query(`
        SELECT pg_is_in_recovery() as in_recovery
      `);

      const isPrimary = !recoveryResult[0].in_recovery;

      if (isPrimary) {
        // Get replication status for primary
        const replicationResult = await db.query(`
          SELECT 
            client_addr,
            state,
            pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) as lag_bytes
          FROM pg_stat_replication
        `);

        const replicaStatus = replicationResult.reduce((acc, row) => {
          acc[row.client_addr || 'unknown'] = row.state;
          return acc;
        }, {} as Record<string, string>);

        const maxLagBytes = Math.max(...replicationResult.map(r => parseInt(r.lag_bytes) || 0), 0);

        return {
          is_primary: true,
          replication_lag_seconds: Math.round(maxLagBytes / 1024), // Rough estimation
          replica_count: replicationResult.length,
          replica_status: replicaStatus
        };
      } else {
        // Get replication lag for replica
        const lagResult = await db.query(`
          SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds
        `);

        return {
          is_primary: false,
          replication_lag_seconds: parseFloat(lagResult[0].lag_seconds) || 0,
          replica_count: 0,
          replica_status: {}
        };
      }

    } catch (error) {
      logger.debug('Replication metrics not available (likely single server setup)');
      return undefined;
    }
  }

  /**
   * Collect health and maintenance metrics
   */
  async collectHealthMetrics(): Promise<HealthMetrics> {
    logger.debug('Collecting health metrics');

    // Database uptime
    const uptimeResult = await db.query(`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime_seconds
    `);

    // Last vacuum and analyze times
    const maintenanceResult = await db.query(`
      SELECT 
        schemaname,
        tablename,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    `);

    const lastVacuum = maintenanceResult.reduce((acc, row) => {
      const lastVacDate = row.last_vacuum || row.last_autovacuum;
      if (lastVacDate) {
        acc[row.tablename] = lastVacDate;
      }
      return acc;
    }, {} as Record<string, Date>);

    const lastAnalyze = maintenanceResult.reduce((acc, row) => {
      const lastAnalyzeDate = row.last_analyze || row.last_autoanalyze;
      if (lastAnalyzeDate) {
        acc[row.tablename] = lastAnalyzeDate;
      }
      return acc;
    }, {} as Record<string, Date>);

    // Check if autovacuum is running
    const autovacuumResult = await db.query(`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE query LIKE '%autovacuum%'
      AND pid != pg_backend_pid()
    `);

    // Identify maintenance needs
    const maintenanceNeeded: string[] = [];
    
    // Check for tables that haven't been vacuumed in 7 days
    for (const [tableName, lastVacDate] of Object.entries(lastVacuum)) {
      const daysSinceVacuum = (Date.now() - lastVacDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVacuum > 7) {
        maintenanceNeeded.push(`Table ${tableName} needs vacuum (${Math.round(daysSinceVacuum)} days since last vacuum)`);
      }
    }

    return {
      is_healthy: maintenanceNeeded.length === 0,
      uptime_seconds: parseFloat(uptimeResult[0].uptime_seconds),
      last_vacuum: lastVacuum,
      last_analyze: lastAnalyze,
      autovacuum_running: parseInt(autovacuumResult[0].count) > 0,
      maintenance_needed: maintenanceNeeded
    };
  }

  /**
   * Collect security metrics
   */
  async collectSecurityMetrics(): Promise<SecurityMetrics> {
    logger.debug('Collecting security metrics');

    // Failed login attempts (if logging is enabled)
    // This would require log analysis in a real implementation
    const failedLogins = 0;

    // Check for suspicious activity patterns
    const suspiciousActivity: string[] = [];

    // Check for privilege escalations
    const privilegeEscalations = 0;

    // Check for unusual queries (would need pg_stat_statements)
    const unusualQueries = 0;

    return {
      failed_login_attempts_last_hour: failedLogins,
      suspicious_activity: suspiciousActivity,
      privilege_escalations: privilegeEscalations,
      unusual_queries: unusualQueries
    };
  }

  /**
   * Check metrics against thresholds and generate alerts
   */
  async checkThresholds(metrics: DatabaseMetrics): Promise<void> {
    this.alerts = []; // Reset alerts

    // Connection usage alerts
    if (metrics.connections.usage_percentage >= THRESHOLDS.CONNECTION_USAGE_CRITICAL) {
      this.alerts.push({
        level: 'critical',
        category: 'connection',
        message: `Database connection usage critical: ${metrics.connections.usage_percentage}% (${metrics.connections.total_connections}/${metrics.connections.max_connections})`,
        metric_value: metrics.connections.usage_percentage,
        threshold: THRESHOLDS.CONNECTION_USAGE_CRITICAL,
        timestamp: new Date()
      });
    } else if (metrics.connections.usage_percentage >= THRESHOLDS.CONNECTION_USAGE_WARNING) {
      this.alerts.push({
        level: 'warning',
        category: 'connection',
        message: `Database connection usage warning: ${metrics.connections.usage_percentage}% (${metrics.connections.total_connections}/${metrics.connections.max_connections})`,
        metric_value: metrics.connections.usage_percentage,
        threshold: THRESHOLDS.CONNECTION_USAGE_WARNING,
        timestamp: new Date()
      });
    }

    // Long running queries
    if (metrics.connections.long_running_queries > 0) {
      this.alerts.push({
        level: 'warning',
        category: 'performance',
        message: `${metrics.connections.long_running_queries} long-running queries detected (>5 minutes)`,
        metric_value: metrics.connections.long_running_queries,
        timestamp: new Date()
      });
    }

    // Blocked queries
    if (metrics.connections.blocked_queries > 0) {
      this.alerts.push({
        level: 'warning',
        category: 'performance',
        message: `${metrics.connections.blocked_queries} blocked queries detected`,
        metric_value: metrics.connections.blocked_queries,
        timestamp: new Date()
      });
    }

    // Slow queries
    if (metrics.performance.slow_queries_count > 0) {
      this.alerts.push({
        level: 'warning',
        category: 'performance',
        message: `${metrics.performance.slow_queries_count} slow queries detected (>${THRESHOLDS.QUERY_DURATION_WARNING}ms)`,
        metric_value: metrics.performance.slow_queries_count,
        threshold: THRESHOLDS.QUERY_DURATION_WARNING,
        timestamp: new Date()
      });
    }

    // Cache hit ratio
    if (metrics.performance.cache_hit_ratio < 95) {
      this.alerts.push({
        level: 'warning',
        category: 'performance',
        message: `Low cache hit ratio: ${metrics.performance.cache_hit_ratio}% (expected >95%)`,
        metric_value: metrics.performance.cache_hit_ratio,
        threshold: 95,
        timestamp: new Date()
      });
    }

    // Table bloat
    for (const [tableName, bloatRatio] of Object.entries(metrics.storage.table_bloat)) {
      if (bloatRatio >= THRESHOLDS.TABLE_BLOAT_CRITICAL) {
        this.alerts.push({
          level: 'critical',
          category: 'storage',
          message: `Critical table bloat detected: ${tableName} (${bloatRatio}x normal size)`,
          metric_value: bloatRatio,
          threshold: THRESHOLDS.TABLE_BLOAT_CRITICAL,
          timestamp: new Date()
        });
      } else if (bloatRatio >= THRESHOLDS.TABLE_BLOAT_WARNING) {
        this.alerts.push({
          level: 'warning',
          category: 'storage',
          message: `Table bloat warning: ${tableName} (${bloatRatio}x normal size)`,
          metric_value: bloatRatio,
          threshold: THRESHOLDS.TABLE_BLOAT_WARNING,
          timestamp: new Date()
        });
      }
    }

    // Replication lag
    if (metrics.replication) {
      if (metrics.replication.replication_lag_seconds >= THRESHOLDS.REPLICATION_LAG_CRITICAL) {
        this.alerts.push({
          level: 'critical',
          category: 'replication',
          message: `Critical replication lag: ${metrics.replication.replication_lag_seconds} seconds`,
          metric_value: metrics.replication.replication_lag_seconds,
          threshold: THRESHOLDS.REPLICATION_LAG_CRITICAL,
          timestamp: new Date()
        });
      } else if (metrics.replication.replication_lag_seconds >= THRESHOLDS.REPLICATION_LAG_WARNING) {
        this.alerts.push({
          level: 'warning',
          category: 'replication',
          message: `Replication lag warning: ${metrics.replication.replication_lag_seconds} seconds`,
          metric_value: metrics.replication.replication_lag_seconds,
          threshold: THRESHOLDS.REPLICATION_LAG_WARNING,
          timestamp: new Date()
        });
      }
    }

    // Health issues
    if (!metrics.health.is_healthy) {
      this.alerts.push({
        level: 'warning',
        category: 'health',
        message: `Database maintenance needed: ${metrics.health.maintenance_needed.join(', ')}`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Send alerts via configured channels
   */
  async sendAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      logger.info('No alerts to send');
      return;
    }

    logger.info(`Sending ${this.alerts.length} alerts`);

    for (const alert of this.alerts) {
      // Log alert
      const logLevel = alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warn' : 'info';
      logger[logLevel](`DATABASE ALERT [${alert.category.toUpperCase()}]: ${alert.message}`);

      // Here you would integrate with your alerting system:
      // - Email notifications
      // - Slack/Teams webhooks  
      // - PagerDuty/OpsGenie
      // - SMS alerts
      // - Custom webhook endpoints
      
      await this.sendAlert(alert);
    }
  }

  /**
   * Send individual alert (implement your alerting integration here)
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // Example webhook integration
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const payload = {
          level: alert.level,
          category: alert.category,
          message: alert.message,
          metric_value: alert.metric_value,
          threshold: alert.threshold,
          timestamp: alert.timestamp.toISOString(),
          service: 'rawgle-database'
        };

        // You would use fetch or axios here to send the webhook
        logger.debug(`Would send alert webhook: ${JSON.stringify(payload)}`);
        
      } catch (error) {
        logger.error('Failed to send alert webhook:', error);
      }
    }

    // Example email integration
    const alertEmail = process.env.ALERT_EMAIL;
    if (alertEmail) {
      // You would integrate with your email service here
      logger.debug(`Would send alert email to: ${alertEmail}`);
    }
  }

  /**
   * Log metrics summary
   */
  private logMetricsSummary(metrics: DatabaseMetrics): void {
    logger.info('📊 Database Metrics Summary:');
    logger.info(`   Connections: ${metrics.connections.usage_percentage}% (${metrics.connections.total_connections}/${metrics.connections.max_connections})`);
    logger.info(`   Cache Hit Ratio: ${metrics.performance.cache_hit_ratio}%`);
    logger.info(`   Database Size: ${metrics.storage.database_size_mb} MB`);
    logger.info(`   Slow Queries: ${metrics.performance.slow_queries_count}`);
    logger.info(`   Long Running: ${metrics.connections.long_running_queries}`);
    logger.info(`   Blocked: ${metrics.connections.blocked_queries}`);
    
    if (metrics.replication) {
      logger.info(`   Replication Lag: ${metrics.replication.replication_lag_seconds}s`);
      logger.info(`   Replicas: ${metrics.replication.replica_count}`);
    }
    
    logger.info(`   Health Status: ${metrics.health.is_healthy ? '✅ Healthy' : '⚠️ Issues Detected'}`);
    logger.info(`   Alerts Generated: ${this.alerts.length}`);
  }

  /**
   * Get current alerts
   */
  getAlerts(): Alert[] {
    return this.alerts;
  }

  /**
   * Quick health check
   */
  async quickHealthCheck(): Promise<boolean> {
    try {
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const monitor = new DatabaseMonitor();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'health':
        const isHealthy = await monitor.quickHealthCheck();
        console.log(`Database Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
        process.exit(isHealthy ? 0 : 1);
        break;
        
      case 'performance':
        const perfMetrics = await monitor.collectPerformanceMetrics();
        console.log('\n🚀 Performance Metrics:');
        console.log(`   Average Query Duration: ${perfMetrics.average_query_duration_ms}ms`);
        console.log(`   Slow Queries: ${perfMetrics.slow_queries_count}`);
        console.log(`   Cache Hit Ratio: ${perfMetrics.cache_hit_ratio}%`);
        console.log(`   Index Hit Ratio: ${perfMetrics.index_hit_ratio}%`);
        console.log(`   Sequential Scans: ${perfMetrics.sequential_scans}`);
        console.log(`   Temp Files: ${perfMetrics.temp_files_created} (${perfMetrics.temp_files_size_mb} MB)`);
        break;
        
      case 'connections':
        const connMetrics = await monitor.collectConnectionMetrics();
        console.log('\n🔌 Connection Metrics:');
        console.log(`   Usage: ${connMetrics.usage_percentage}% (${connMetrics.total_connections}/${connMetrics.max_connections})`);
        console.log(`   Active: ${connMetrics.active_connections}`);
        console.log(`   Idle: ${connMetrics.idle_connections}`);
        console.log(`   Long Running: ${connMetrics.long_running_queries}`);
        console.log(`   Blocked: ${connMetrics.blocked_queries}`);
        break;
        
      case 'alerts':
        await monitor.runFullMonitoring();
        await monitor.sendAlerts();
        break;
        
      case undefined:
      default:
        const metrics = await monitor.runFullMonitoring();
        await monitor.sendAlerts();
        
        // Return appropriate exit code based on alerts
        const criticalAlerts = monitor.getAlerts().filter(a => a.level === 'critical');
        process.exit(criticalAlerts.length > 0 ? 1 : 0);
        break;
    }
  } catch (error) {
    logger.error('Database monitoring failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Export for programmatic use
export { DatabaseMonitor };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Database monitoring failed:', error);
    process.exit(1);
  });
}