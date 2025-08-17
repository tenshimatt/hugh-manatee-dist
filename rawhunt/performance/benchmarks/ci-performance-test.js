/**
 * GoHunta CI/CD Performance Test Integration
 * Integrates performance benchmarks with GitHub Actions, GitLab CI, and other CI/CD systems
 */

import { chromium } from 'playwright';
import PerformanceBenchmarkRunner from './performance-benchmark-runner.js';

class CIPerformanceTest {
  constructor() {
    this.config = {
      // CI-specific configuration
      outputDirectory: process.env.PERFORMANCE_OUTPUT_DIR || './performance-reports',
      baselineUrl: process.env.PERFORMANCE_BASELINE_URL || null,
      slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
      discordWebhook: process.env.DISCORD_WEBHOOK_URL || null,
      failureThreshold: process.env.PERFORMANCE_FAILURE_THRESHOLD || 70,
      
      // Test configuration
      suites: this.parseSuites(process.env.PERFORMANCE_SUITES || 'mobile,api,pwa,edge,scalability'),
      reportFormat: ['json', 'html', 'junit'],
      
      // Environment specific
      apiBaseUrl: process.env.API_BASE_URL || 'https://api.gohunta.com',
      frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'https://gohunta.com',
      
      // Performance thresholds from environment
      thresholds: {
        apiResponseTime: parseInt(process.env.PERF_API_RESPONSE_TIME) || 500,
        pageLoadTime: parseInt(process.env.PERF_PAGE_LOAD_TIME) || 2000,
        mobileGPSLockTime: parseInt(process.env.PERF_GPS_LOCK_TIME) || 10000,
        batteryDrainRate: parseFloat(process.env.PERF_BATTERY_DRAIN_RATE) || 0.05,
        offlineBootTime: parseInt(process.env.PERF_OFFLINE_BOOT_TIME) || 500,
        workerResponseTime: parseInt(process.env.PERF_WORKER_RESPONSE_TIME) || 100
      }
    };
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting CI Performance Test Suite');
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'unknown'}`);
      console.log(`🌐 API Base URL: ${this.config.apiBaseUrl}`);
      console.log(`💻 Frontend Base URL: ${this.config.frontendBaseUrl}`);
      console.log(`🧪 Test Suites: ${this.config.suites.join(', ')}`);
      
      // Launch browser
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      
      try {
        // Initialize benchmark runner
        const runner = new PerformanceBenchmarkRunner({
          ...this.config,
          ciMode: true
        });
        
        // Download baseline if URL provided
        if (this.config.baselineUrl) {
          await this.downloadBaseline();
        }
        
        // Run performance benchmarks
        const result = await runner.runBenchmarks({ chromium: { launch: () => browser } });
        
        // Process results
        await this.processResults(result);
        
        // Upload artifacts
        await this.uploadArtifacts();
        
        // Send notifications
        await this.sendNotifications(result);
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Performance tests completed in ${duration.toFixed(1)}s`);
        
        // Set exit code based on results
        process.exit(result.passed ? 0 : 1);
        
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      console.error('💥 Performance test suite failed:', error);
      
      // Send failure notification
      await this.sendFailureNotification(error);
      
      process.exit(1);
    }
  }

  async downloadBaseline() {
    try {
      console.log(`📥 Downloading baseline from ${this.config.baselineUrl}`);
      
      const response = await fetch(this.config.baselineUrl);
      if (!response.ok) {
        throw new Error(`Failed to download baseline: ${response.status}`);
      }
      
      const baseline = await response.json();
      
      // Save baseline locally
      const fs = await import('fs');
      const path = await import('path');
      
      const baselinePath = path.join(this.config.outputDirectory, 'baseline.json');
      fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
      
      // Update config to use local baseline
      this.config.baseline = baselinePath;
      
      console.log('✅ Baseline downloaded successfully');
      
    } catch (error) {
      console.warn(`⚠️ Failed to download baseline: ${error.message}`);
    }
  }

  async processResults(result) {
    console.log('\n📊 Processing Performance Results:');
    console.log(`Overall Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Performance Score: ${result.report.summary.performance_score}/100`);
    console.log(`Suites Passed: ${result.report.summary.passed_suites}/${result.report.summary.total_suites}`);
    
    // Set GitHub Actions outputs
    this.setGitHubOutputs(result);
    
    // Set environment variables for subsequent steps
    this.setEnvironmentVariables(result);
    
    // Generate performance badges
    await this.generatePerformanceBadges(result);
    
    // Update performance trends
    await this.updatePerformanceTrends(result);
  }

  setGitHubOutputs(result) {
    if (!process.env.GITHUB_OUTPUT) return;
    
    const fs = require('fs');
    const outputs = [
      `performance-passed=${result.passed}`,
      `performance-score=${result.report.summary.performance_score}`,
      `suites-passed=${result.report.summary.passed_suites}`,
      `suites-total=${result.report.summary.total_suites}`,
      `critical-issues=${result.report.summary.critical_issues.length}`
    ];
    
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
  }

  setEnvironmentVariables(result) {
    // Set environment variables for other CI systems
    process.env.PERFORMANCE_PASSED = result.passed.toString();
    process.env.PERFORMANCE_SCORE = result.report.summary.performance_score.toString();
    process.env.PERFORMANCE_REPORT_PATH = `${this.config.outputDirectory}/performance-report-latest.json`;
  }

  async generatePerformanceBadges(result) {
    try {
      const badges = {
        performance: {
          label: 'Performance',
          message: `${result.report.summary.performance_score}/100`,
          color: this.getScoreColor(result.report.summary.performance_score)
        },
        status: {
          label: 'Tests',
          message: result.passed ? 'passing' : 'failing',
          color: result.passed ? 'brightgreen' : 'red'
        },
        suites: {
          label: 'Suites',
          message: `${result.report.summary.passed_suites}/${result.report.summary.total_suites}`,
          color: result.report.summary.passed_suites === result.report.summary.total_suites ? 'brightgreen' : 'yellow'
        }
      };
      
      const fs = await import('fs');
      const path = await import('path');
      
      const badgesPath = path.join(this.config.outputDirectory, 'badges.json');
      fs.writeFileSync(badgesPath, JSON.stringify(badges, null, 2));
      
      console.log('🏷️ Performance badges generated');
      
    } catch (error) {
      console.warn('Failed to generate badges:', error.message);
    }
  }

  async updatePerformanceTrends(result) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const trendsPath = path.join(this.config.outputDirectory, 'performance-trends.json');
      let trends = [];
      
      // Load existing trends
      if (fs.existsSync(trendsPath)) {
        trends = JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
      }
      
      // Add current result to trends
      trends.push({
        timestamp: result.report.metadata.timestamp,
        commit: result.report.metadata.commit,
        branch: result.report.metadata.branch,
        score: result.report.summary.performance_score,
        passed: result.passed,
        keyMetrics: result.report.summary.key_metrics
      });
      
      // Keep only last 100 entries
      if (trends.length > 100) {
        trends = trends.slice(-100);
      }
      
      fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2));
      
      console.log('📈 Performance trends updated');
      
    } catch (error) {
      console.warn('Failed to update trends:', error.message);
    }
  }

  async uploadArtifacts() {
    if (!process.env.CI) return;
    
    console.log('📤 Uploading performance artifacts...');
    
    // GitHub Actions artifacts are automatically uploaded from the reports directory
    // For other CI systems, implement specific upload logic
    
    if (process.env.GITLAB_CI) {
      await this.uploadGitLabArtifacts();
    }
    
    if (process.env.CIRCLECI) {
      await this.uploadCircleCIArtifacts();
    }
  }

  async uploadGitLabArtifacts() {
    // GitLab CI artifacts are defined in .gitlab-ci.yml
    console.log('GitLab CI will collect artifacts from reports directory');
  }

  async uploadCircleCIArtifacts() {
    // CircleCI artifacts need to be stored in specific directory
    const fs = await import('fs');
    const path = await import('path');
    
    const artifactsDir = path.join(process.env.CIRCLE_ARTIFACTS || '/tmp/artifacts');
    
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    // Copy reports to artifacts directory
    const reportsDir = this.config.outputDirectory;
    if (fs.existsSync(reportsDir)) {
      fs.cpSync(reportsDir, path.join(artifactsDir, 'performance-reports'), { recursive: true });
    }
  }

  async sendNotifications(result) {
    if (this.config.slackWebhook) {
      await this.sendSlackNotification(result);
    }
    
    if (this.config.discordWebhook) {
      await this.sendDiscordNotification(result);
    }
  }

  async sendSlackNotification(result) {
    try {
      const message = {
        text: `GoHunta Performance Test Results`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🎯 GoHunta Performance Results`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Status:* ${result.passed ? '✅ PASSED' : '❌ FAILED'}`
              },
              {
                type: 'mrkdwn',
                text: `*Score:* ${result.report.summary.performance_score}/100`
              },
              {
                type: 'mrkdwn',
                text: `*Suites:* ${result.report.summary.passed_suites}/${result.report.summary.total_suites}`
              },
              {
                type: 'mrkdwn',
                text: `*Branch:* ${result.report.metadata.branch}`
              }
            ]
          }
        ]
      };
      
      if (!result.passed && result.report.summary.critical_issues.length > 0) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Critical Issues:*\n${result.report.summary.critical_issues.slice(0, 3).map(issue => `• ${issue}`).join('\n')}`
          }
        });
      }
      
      const response = await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('📢 Slack notification sent');
      }
      
    } catch (error) {
      console.warn('Failed to send Slack notification:', error.message);
    }
  }

  async sendDiscordNotification(result) {
    try {
      const embed = {
        title: '🎯 GoHunta Performance Test Results',
        color: result.passed ? 0x00ff00 : 0xff0000,
        fields: [
          {
            name: 'Status',
            value: result.passed ? '✅ PASSED' : '❌ FAILED',
            inline: true
          },
          {
            name: 'Performance Score',
            value: `${result.report.summary.performance_score}/100`,
            inline: true
          },
          {
            name: 'Suites Passed',
            value: `${result.report.summary.passed_suites}/${result.report.summary.total_suites}`,
            inline: true
          },
          {
            name: 'Branch',
            value: result.report.metadata.branch,
            inline: true
          },
          {
            name: 'Commit',
            value: result.report.metadata.commit.substring(0, 8),
            inline: true
          }
        ],
        timestamp: new Date().toISOString()
      };
      
      const message = { embeds: [embed] };
      
      const response = await fetch(this.config.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('📢 Discord notification sent');
      }
      
    } catch (error) {
      console.warn('Failed to send Discord notification:', error.message);
    }
  }

  async sendFailureNotification(error) {
    const message = `🚨 GoHunta Performance Test Suite Failed\n\nError: ${error.message}\n\nBranch: ${process.env.GITHUB_REF_NAME || 'unknown'}\nCommit: ${process.env.GITHUB_SHA || 'unknown'}`;
    
    if (this.config.slackWebhook) {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      }).catch(() => {});
    }
  }

  // Helper methods
  parseSuites(suitesString) {
    return suitesString.split(',').map(s => s.trim()).filter(s => s);
  }

  getScoreColor(score) {
    if (score >= 90) return 'brightgreen';
    if (score >= 80) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 60) return 'orange';
    return 'red';
  }
}

// Main execution
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const ciTest = new CIPerformanceTest();
  ciTest.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default CIPerformanceTest;