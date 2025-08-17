#!/usr/bin/env node

/**
 * Rawgle Platform Health Check and Monitoring Script
 * Monitors the health of all deployed components and alerts on failures
 */

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  endpoints: [
    {
      name: 'Backend API Health',
      url: process.env.BACKEND_URL || 'https://rawgle-backend-prod.example.workers.dev/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      critical: true
    },
    {
      name: 'Backend API Auth',
      url: process.env.BACKEND_URL || 'https://rawgle-backend-prod.example.workers.dev/api/auth/status',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      critical: true
    },
    {
      name: 'Frontend Application',
      url: process.env.FRONTEND_URL || 'https://rawgle-frontend.pages.dev',
      method: 'GET',
      expectedStatus: 200,
      timeout: 15000,
      critical: true
    },
    {
      name: 'Database Connection',
      url: process.env.BACKEND_URL || 'https://rawgle-backend-prod.example.workers.dev/api/health/database',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      critical: true
    }
  ],
  notifications: {
    webhook: process.env.NOTIFICATION_WEBHOOK || '',
    email: process.env.NOTIFICATION_EMAIL || '',
    slack: process.env.SLACK_WEBHOOK || ''
  },
  thresholds: {
    responseTime: 5000, // 5 seconds
    availability: 99.5,  // 99.5%
    errorRate: 1        // 1%
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class HealthMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, color = colors.reset) {
    console.log(`${color}${new Date().toISOString()} - ${message}${colors.reset}`);
  }

  async checkEndpoint(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(endpoint.url);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: endpoint.method,
        timeout: endpoint.timeout,
        headers: {
          'User-Agent': 'Rawgle-Health-Monitor/1.0'
        }
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const result = {
            name: endpoint.name,
            url: endpoint.url,
            status: res.statusCode,
            responseTime,
            success: res.statusCode === endpoint.expectedStatus,
            error: null,
            critical: endpoint.critical,
            timestamp: new Date().toISOString(),
            responseSize: data.length
          };

          if (result.success) {
            this.log(`✅ ${endpoint.name}: ${res.statusCode} (${responseTime}ms)`, colors.green);
          } else {
            this.log(`❌ ${endpoint.name}: ${res.statusCode} (expected ${endpoint.expectedStatus})`, colors.red);
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        const result = {
          name: endpoint.name,
          url: endpoint.url,
          status: 0,
          responseTime,
          success: false,
          error: error.message,
          critical: endpoint.critical,
          timestamp: new Date().toISOString(),
          responseSize: 0
        };

        this.log(`❌ ${endpoint.name}: ${error.message}`, colors.red);
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        const result = {
          name: endpoint.name,
          url: endpoint.url,
          status: 0,
          responseTime,
          success: false,
          error: 'Timeout',
          critical: endpoint.critical,
          timestamp: new Date().toISOString(),
          responseSize: 0
        };

        this.log(`❌ ${endpoint.name}: Timeout after ${endpoint.timeout}ms`, colors.red);
        resolve(result);
      });

      req.end();
    });
  }

  async checkAllEndpoints() {
    this.log('🔍 Starting health checks...', colors.blue);
    
    const promises = CONFIG.endpoints.map(endpoint => this.checkEndpoint(endpoint));
    this.results = await Promise.all(promises);
    
    return this.results;
  }

  analyzeResults() {
    const totalChecks = this.results.length;
    const successfulChecks = this.results.filter(r => r.success).length;
    const criticalFailures = this.results.filter(r => !r.success && r.critical).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks;
    
    const analysis = {
      totalChecks,
      successfulChecks,
      failedChecks: totalChecks - successfulChecks,
      criticalFailures,
      successRate: (successfulChecks / totalChecks) * 100,
      avgResponseTime,
      status: criticalFailures === 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    };

    return analysis;
  }

  generateReport() {
    const analysis = this.analyzeResults();
    const duration = Date.now() - this.startTime;

    const report = {
      summary: analysis,
      details: this.results,
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
        monitor_version: '1.0.0'
      }
    };

    // Save to file
    const reportPath = `./health-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Report saved to: ${reportPath}`, colors.cyan);
    
    return report;
  }

  async sendNotifications(analysis) {
    if (analysis.criticalFailures > 0) {
      const message = `🚨 CRITICAL: Rawgle Platform health check failed!\n` +
                     `Critical failures: ${analysis.criticalFailures}\n` +
                     `Success rate: ${analysis.successRate.toFixed(2)}%\n` +
                     `Timestamp: ${analysis.timestamp}`;

      this.log('📧 Sending failure notifications...', colors.yellow);
      
      // Log notification (in production, implement actual notification services)
      console.log('NOTIFICATION:', message);
      
      // Here you would implement actual notification sending:
      // - Webhook POST requests
      // - Email sending
      // - Slack notifications
      // - PagerDuty alerts
    }
  }

  printSummary(analysis) {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 RAWGLE PLATFORM HEALTH SUMMARY');
    console.log('='.repeat(60));
    
    const statusColor = analysis.status === 'healthy' ? colors.green : colors.red;
    console.log(`Status: ${statusColor}${analysis.status.toUpperCase()}${colors.reset}`);
    console.log(`Success Rate: ${analysis.successRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${analysis.avgResponseTime.toFixed(0)}ms`);
    console.log(`Critical Failures: ${analysis.criticalFailures}`);
    console.log(`Total Checks: ${analysis.totalChecks}`);
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      const statusIcon = result.success ? '✅' : '❌';
      const criticalFlag = result.critical ? ' [CRITICAL]' : '';
      console.log(`${statusIcon} ${result.name}: ${result.status} (${result.responseTime}ms)${criticalFlag}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('='.repeat(60) + '\n');
  }

  async rollbackIfNeeded(analysis) {
    if (analysis.criticalFailures >= 2) {
      this.log('🔄 Critical failure threshold met. Initiating rollback procedures...', colors.yellow);
      
      try {
        // In a real scenario, you would implement rollback logic here:
        // 1. Revert to previous Worker deployment
        // 2. Switch to backup database
        // 3. Redirect traffic to backup infrastructure
        
        this.log('⚠️  Rollback simulation - would execute:', colors.yellow);
        console.log('  - wrangler rollback --env production');
        console.log('  - Update DNS to backup servers');
        console.log('  - Notify incident response team');
        
        return true;
      } catch (error) {
        this.log(`❌ Rollback failed: ${error.message}`, colors.red);
        return false;
      }
    }
    
    return false;
  }
}

// Database-specific health checks
class DatabaseMonitor {
  static async checkD1Health() {
    try {
      // In production, this would be an actual API call to a health endpoint
      // that tests database connectivity
      const result = await execSync('wrangler d1 execute rawgle-db --command "SELECT 1" --env production', 
        { encoding: 'utf8', timeout: 10000 });
      
      return {
        success: true,
        responseTime: 100, // Would be actual measurement
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        message: error.message
      };
    }
  }
}

// Performance monitoring
class PerformanceMonitor {
  static checkThresholds(results) {
    const warnings = [];
    
    results.forEach(result => {
      if (result.responseTime > CONFIG.thresholds.responseTime) {
        warnings.push(`High response time for ${result.name}: ${result.responseTime}ms`);
      }
    });
    
    return warnings;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Rawgle Platform Health Check\n');
  
  const monitor = new HealthMonitor();
  
  try {
    // Run health checks
    await monitor.checkAllEndpoints();
    
    // Analyze results
    const analysis = monitor.analyzeResults();
    
    // Generate report
    const report = monitor.generateReport();
    
    // Print summary
    monitor.printSummary(analysis);
    
    // Check performance thresholds
    const warnings = PerformanceMonitor.checkThresholds(monitor.results);
    if (warnings.length > 0) {
      console.log('⚠️  Performance Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }
    
    // Send notifications if needed
    await monitor.sendNotifications(analysis);
    
    // Auto-rollback if critical
    const rolledBack = await monitor.rollbackIfNeeded(analysis);
    
    // Exit with appropriate code
    if (analysis.criticalFailures > 0) {
      process.exit(1);
    } else if (warnings.length > 0) {
      process.exit(2); // Warning status
    } else {
      process.exit(0); // Success
    }
    
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏹️  Health check interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Health check terminated');
  process.exit(143);
});

// CLI interface
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HealthMonitor, DatabaseMonitor, PerformanceMonitor };