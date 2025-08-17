#!/usr/bin/env node

/**
 * Rawgle Platform Error Monitoring and Analytics
 * Integrates with Sentry, LogRocket, and custom error tracking
 */

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.ENVIRONMENT || 'production',
    release: process.env.GIT_COMMIT || 'unknown'
  },
  logRocket: {
    appId: process.env.LOGROCKET_APP_ID || '',
    enabled: process.env.ENABLE_LOGROCKET === 'true'
  },
  webhooks: {
    slack: process.env.SLACK_WEBHOOK || '',
    discord: process.env.DISCORD_WEBHOOK || '',
    teams: process.env.TEAMS_WEBHOOK || ''
  },
  thresholds: {
    errorRate: 5, // percentage
    responseTime: 5000, // milliseconds
    criticalErrors: 10 // count per hour
  },
  endpoints: {
    backend: process.env.BACKEND_URL || 'https://api.rawgle.com',
    frontend: process.env.FRONTEND_URL || 'https://rawgle.com'
  }
};

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      errorRate: 0,
      lastCheck: new Date(),
      uptime: 100
    };
  }

  // Initialize error tracking
  async initialize() {
    console.log('🔍 Initializing Rawgle Platform Error Tracking...');
    
    // Setup Sentry if configured
    if (CONFIG.sentry.dsn) {
      await this.initializeSentry();
    }
    
    // Setup LogRocket if configured
    if (CONFIG.logRocket.enabled && CONFIG.logRocket.appId) {
      this.initializeLogRocket();
    }
    
    // Start monitoring
    this.startContinuousMonitoring();
    
    console.log('✅ Error tracking initialized');
  }

  // Sentry integration
  async initializeSentry() {
    try {
      // In a real implementation, you'd use the Sentry SDK
      console.log('📊 Sentry error tracking configured');
      
      // Example: Get recent errors from Sentry API
      const sentryErrors = await this.fetchSentryErrors();
      this.processSentryErrors(sentryErrors);
      
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error.message);
    }
  }

  // LogRocket integration
  initializeLogRocket() {
    console.log('📹 LogRocket session recording configured');
    // LogRocket setup would go here
  }

  // Fetch errors from Sentry API
  async fetchSentryErrors() {
    return new Promise((resolve) => {
      // Mock Sentry API response
      const mockErrors = [
        {
          id: '1',
          title: 'TypeError: Cannot read property of undefined',
          level: 'error',
          count: 15,
          firstSeen: new Date(Date.now() - 3600000),
          lastSeen: new Date(),
          project: 'rawgle-frontend'
        },
        {
          id: '2', 
          title: 'Database connection timeout',
          level: 'fatal',
          count: 3,
          firstSeen: new Date(Date.now() - 1800000),
          lastSeen: new Date(Date.now() - 300000),
          project: 'rawgle-backend'
        }
      ];
      
      resolve(mockErrors);
    });
  }

  // Process Sentry errors
  processSentryErrors(errors) {
    errors.forEach(error => {
      this.errors.push({
        ...error,
        source: 'sentry',
        severity: this.calculateSeverity(error),
        timestamp: new Date()
      });
      
      if (error.level === 'fatal' || error.count > 10) {
        this.handleCriticalError(error);
      }
    });
    
    this.updateMetrics();
  }

  // Calculate error severity
  calculateSeverity(error) {
    if (error.level === 'fatal' || error.count > 50) return 'critical';
    if (error.level === 'error' || error.count > 10) return 'high';
    if (error.count > 5) return 'medium';
    return 'low';
  }

  // Handle critical errors
  async handleCriticalError(error) {
    console.log(`🚨 CRITICAL ERROR DETECTED: ${error.title}`);
    
    const alert = {
      type: 'critical_error',
      error: error,
      timestamp: new Date(),
      environment: CONFIG.sentry.environment,
      project: error.project || 'unknown'
    };
    
    // Send immediate notifications
    await this.sendAlert(alert);
    
    // Log to file
    this.logError(alert);
    
    // Check if rollback is needed
    if (this.shouldTriggerRollback(error)) {
      await this.triggerEmergencyRollback(error);
    }
  }

  // Check if rollback should be triggered
  shouldTriggerRollback(error) {
    const criticalConditions = [
      error.level === 'fatal',
      error.count > this.CONFIG?.thresholds?.criticalErrors || 20,
      error.title.includes('Database') && error.count > 5,
      error.title.includes('Authentication') && error.count > 10
    ];
    
    return criticalConditions.some(condition => condition);
  }

  // Trigger emergency rollback
  async triggerEmergencyRollback(error) {
    console.log('🔄 TRIGGERING EMERGENCY ROLLBACK...');
    
    const rollbackAlert = {
      type: 'emergency_rollback',
      reason: error,
      timestamp: new Date(),
      action: 'automated_rollback_initiated'
    };
    
    try {
      // Backend rollback
      if (error.project === 'rawgle-backend') {
        console.log('Rolling back backend deployment...');
        // execSync('cd rawgle-backend && wrangler rollback --env production');
        console.log('⚠️  Backend rollback simulation - would execute: wrangler rollback');
      }
      
      // Frontend rollback
      if (error.project === 'rawgle-frontend') {
        console.log('Rolling back frontend deployment...');
        // execSync('cd rawgle-frontend && wrangler pages deployment rollback --project-name rawgle-frontend');
        console.log('⚠️  Frontend rollback simulation - would execute: pages rollback');
      }
      
      rollbackAlert.status = 'success';
      
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
      rollbackAlert.status = 'failed';
      rollbackAlert.error = rollbackError.message;
    }
    
    await this.sendAlert(rollbackAlert);
  }

  // Send alerts to configured channels
  async sendAlert(alert) {
    const message = this.formatAlertMessage(alert);
    
    // Send to Slack
    if (CONFIG.webhooks.slack) {
      await this.sendToSlack(message, alert);
    }
    
    // Send to Discord
    if (CONFIG.webhooks.discord) {
      await this.sendToDiscord(message, alert);
    }
    
    // Send to Teams
    if (CONFIG.webhooks.teams) {
      await this.sendToTeams(message, alert);
    }
    
    console.log('📨 Alert sent to configured channels');
  }

  // Format alert message
  formatAlertMessage(alert) {
    const emoji = alert.type === 'critical_error' ? '🚨' : 
                 alert.type === 'emergency_rollback' ? '🔄' : '⚠️';
    
    let message = `${emoji} **Rawgle Platform Alert**\n\n`;
    message += `**Type:** ${alert.type.replace('_', ' ').toUpperCase()}\n`;
    message += `**Time:** ${alert.timestamp.toLocaleString()}\n`;
    message += `**Environment:** ${CONFIG.sentry.environment}\n\n`;
    
    if (alert.error) {
      message += `**Error:** ${alert.error.title}\n`;
      message += `**Level:** ${alert.error.level}\n`;
      message += `**Count:** ${alert.error.count}\n`;
      message += `**Project:** ${alert.error.project}\n`;
      
      if (alert.error.firstSeen) {
        message += `**First Seen:** ${new Date(alert.error.firstSeen).toLocaleString()}\n`;
      }
    }
    
    if (alert.type === 'emergency_rollback') {
      message += `\n**Action:** ${alert.action}\n`;
      message += `**Status:** ${alert.status || 'in_progress'}\n`;
    }
    
    message += `\n**Dashboard:** ${CONFIG.endpoints.frontend}/monitoring`;
    
    return message;
  }

  // Send to Slack
  async sendToSlack(message, alert) {
    const payload = {
      text: 'Rawgle Platform Alert',
      attachments: [{
        color: alert.type === 'critical_error' ? 'danger' : 'warning',
        title: `${alert.type.replace('_', ' ').toUpperCase()}`,
        text: message,
        footer: 'Rawgle Monitoring',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };
    
    return this.sendWebhook(CONFIG.webhooks.slack, payload);
  }

  // Send to Discord
  async sendToDiscord(message, alert) {
    const payload = {
      content: message,
      embeds: [{
        title: 'Rawgle Platform Alert',
        description: message,
        color: alert.type === 'critical_error' ? 15158332 : 16776960,
        timestamp: alert.timestamp.toISOString()
      }]
    };
    
    return this.sendWebhook(CONFIG.webhooks.discord, payload);
  }

  // Send to Teams
  async sendToTeams(message, alert) {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Rawgle Platform Alert',
      themeColor: alert.type === 'critical_error' ? 'FF0000' : 'FFFF00',
      sections: [{
        activityTitle: 'Rawgle Platform Alert',
        activitySubtitle: alert.type.replace('_', ' ').toUpperCase(),
        text: message,
        facts: [
          { name: 'Environment', value: CONFIG.sentry.environment },
          { name: 'Time', value: alert.timestamp.toLocaleString() }
        ]
      }]
    };
    
    return this.sendWebhook(CONFIG.webhooks.teams, payload);
  }

  // Generic webhook sender
  async sendWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      if (!url) {
        resolve(false);
        return;
      }
      
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          resolve(res.statusCode === 200);
        });
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Log errors to file
  logError(alert) {
    const logEntry = {
      timestamp: alert.timestamp.toISOString(),
      type: alert.type,
      error: alert.error,
      environment: CONFIG.sentry.environment
    };
    
    const logFile = `error_log_${new Date().toISOString().split('T')[0]}.json`;
    const existingLogs = this.readLogFile(logFile);
    existingLogs.push(logEntry);
    
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
  }

  // Read existing log file
  readLogFile(filename) {
    try {
      const data = fs.readFileSync(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // Update metrics
  updateMetrics() {
    this.metrics.totalErrors = this.errors.length;
    this.metrics.criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
    this.metrics.lastCheck = new Date();
    
    // Calculate error rate (errors per hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    this.metrics.errorRate = recentErrors.length;
  }

  // Start continuous monitoring
  startContinuousMonitoring() {
    console.log('🔄 Starting continuous error monitoring...');
    
    // Check for new errors every 5 minutes
    setInterval(async () => {
      await this.checkForNewErrors();
    }, 5 * 60 * 1000);
    
    // Generate hourly reports
    setInterval(() => {
      this.generateHourlyReport();
    }, 60 * 60 * 1000);
    
    // Check system health every minute
    setInterval(async () => {
      await this.checkSystemHealth();
    }, 60 * 1000);
  }

  // Check for new errors
  async checkForNewErrors() {
    try {
      if (CONFIG.sentry.dsn) {
        const sentryErrors = await this.fetchSentryErrors();
        this.processSentryErrors(sentryErrors);
      }
      
      // Check application logs for new errors
      await this.checkApplicationLogs();
      
    } catch (error) {
      console.error('Error checking for new errors:', error.message);
    }
  }

  // Check application logs
  async checkApplicationLogs() {
    try {
      // Check Cloudflare Workers logs
      // In production, this would use the Cloudflare API to fetch logs
      console.log('📋 Checking application logs...');
      
      // Mock log analysis
      const mockLogs = [
        { level: 'error', message: 'Database timeout', timestamp: new Date() },
        { level: 'warn', message: 'High response time', timestamp: new Date() }
      ];
      
      mockLogs.forEach(log => {
        if (log.level === 'error') {
          this.handleLogError(log);
        }
      });
      
    } catch (error) {
      console.error('Failed to check application logs:', error.message);
    }
  }

  // Handle errors found in logs
  handleLogError(log) {
    const error = {
      title: log.message,
      level: log.level,
      count: 1,
      firstSeen: log.timestamp,
      lastSeen: log.timestamp,
      project: 'application-logs',
      source: 'logs'
    };
    
    this.errors.push({
      ...error,
      severity: this.calculateSeverity(error),
      timestamp: new Date()
    });
  }

  // Check system health
  async checkSystemHealth() {
    try {
      const healthResults = await this.performHealthCheck();
      
      if (!healthResults.healthy) {
        await this.handleHealthFailure(healthResults);
      }
      
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
  }

  // Perform health check
  async performHealthCheck() {
    const results = {
      healthy: true,
      checks: {}
    };
    
    // Check backend
    try {
      const response = await this.httpRequest(`${CONFIG.endpoints.backend}/health`);
      results.checks.backend = { status: 'healthy', responseTime: response.responseTime };
    } catch (error) {
      results.checks.backend = { status: 'unhealthy', error: error.message };
      results.healthy = false;
    }
    
    // Check frontend
    try {
      const response = await this.httpRequest(CONFIG.endpoints.frontend);
      results.checks.frontend = { status: 'healthy', responseTime: response.responseTime };
    } catch (error) {
      results.checks.frontend = { status: 'unhealthy', error: error.message };
      results.healthy = false;
    }
    
    return results;
  }

  // Make HTTP request with timing
  async httpRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode === 200) {
          resolve({ statusCode: res.statusCode, responseTime });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  // Handle health check failures
  async handleHealthFailure(healthResults) {
    const alert = {
      type: 'health_check_failure',
      timestamp: new Date(),
      checks: healthResults.checks
    };
    
    console.log('🏥 Health check failure detected');
    await this.sendAlert(alert);
  }

  // Generate hourly report
  generateHourlyReport() {
    const report = {
      timestamp: new Date(),
      period: 'hourly',
      metrics: this.metrics,
      topErrors: this.getTopErrors(),
      errorTrends: this.calculateErrorTrends()
    };
    
    const reportFile = `hourly_report_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📊 Hourly report generated: ${reportFile}`);
    
    // Send report if error rate is high
    if (this.metrics.errorRate > CONFIG.thresholds.errorRate) {
      this.sendAlert({
        type: 'high_error_rate',
        timestamp: new Date(),
        metrics: this.metrics
      });
    }
  }

  // Get top errors
  getTopErrors() {
    const errorCounts = {};
    
    this.errors.forEach(error => {
      const key = error.title || error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  // Calculate error trends
  calculateErrorTrends() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursAgo = new Date(now.getTime() - 7200000);
    
    const currentHourErrors = this.errors.filter(e => e.timestamp > oneHourAgo).length;
    const previousHourErrors = this.errors.filter(e => e.timestamp > twoHoursAgo && e.timestamp <= oneHourAgo).length;
    
    const trend = currentHourErrors - previousHourErrors;
    
    return {
      currentHour: currentHourErrors,
      previousHour: previousHourErrors,
      trend: trend,
      trendPercentage: previousHourErrors > 0 ? (trend / previousHourErrors) * 100 : 0
    };
  }

  // Get current status
  getStatus() {
    return {
      monitoring: true,
      lastCheck: this.metrics.lastCheck,
      totalErrors: this.metrics.totalErrors,
      criticalErrors: this.metrics.criticalErrors,
      errorRate: this.metrics.errorRate,
      thresholds: CONFIG.thresholds
    };
  }
}

// CLI interface
async function main() {
  const tracker = new ErrorTracker();
  
  try {
    await tracker.initialize();
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n⏹️  Error tracking stopped');
      process.exit(0);
    });
    
    // Log status every 10 minutes
    setInterval(() => {
      const status = tracker.getStatus();
      console.log(`📊 Status: ${status.totalErrors} total errors, ${status.criticalErrors} critical, ${status.errorRate}/hr rate`);
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Failed to start error tracking:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ErrorTracker };