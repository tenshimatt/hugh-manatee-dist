/**
 * GoHunta Performance Benchmark Runner
 * Orchestrates all performance test suites and generates comprehensive reports
 * Integrates with CI/CD pipelines for continuous performance monitoring
 */

import MobilePerformanceSuite from '../mobile/mobile-performance-suite.js';
import APIPerformanceSuite from '../api/api-performance-suite.js';
import PWAPerformanceSuite from '../pwa/pwa-performance-suite.js';
import EdgePerformanceSuite from '../edge/edge-performance-suite.js';
import ScalabilityTestSuite from '../scalability/scalability-test-suite.js';

export class PerformanceBenchmarkRunner {
  constructor(config = {}) {
    this.config = {
      suites: config.suites || ['mobile', 'api', 'pwa', 'edge', 'scalability'],
      reportFormat: config.reportFormat || ['json', 'html', 'junit'],
      outputDirectory: config.outputDirectory || './performance-reports',
      baseline: config.baseline || null,
      thresholds: config.thresholds || {},
      ciMode: config.ciMode || process.env.CI === 'true',
      ...config
    };
    
    this.results = {};
    this.baseline = null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run all performance benchmarks
   */
  async runBenchmarks(playwright) {
    console.log('🚀 Starting GoHunta Performance Benchmark Suite');
    this.startTime = Date.now();
    
    try {
      // Load baseline if provided
      if (this.config.baseline) {
        this.baseline = await this.loadBaseline(this.config.baseline);
      }
      
      // Run each test suite
      for (const suiteName of this.config.suites) {
        console.log(`\n📊 Running ${suiteName} performance tests...`);
        
        try {
          const suiteResults = await this.runTestSuite(suiteName, playwright);
          this.results[suiteName] = suiteResults;
          
          console.log(`✅ ${suiteName} tests completed`);
        } catch (error) {
          console.error(`❌ ${suiteName} tests failed:`, error.message);
          this.results[suiteName] = {
            error: error.message,
            passed: false,
            timestamp: Date.now()
          };
        }
      }
      
      this.endTime = Date.now();
      
      // Generate comprehensive report
      const report = await this.generateComprehensiveReport();
      
      // Save reports in various formats
      await this.saveReports(report);
      
      // Check if benchmarks passed
      const passed = this.evaluateResults(report);
      
      console.log(`\n🏁 Performance benchmarks completed in ${((this.endTime - this.startTime) / 1000).toFixed(1)}s`);
      console.log(passed ? '✅ All benchmarks PASSED' : '❌ Some benchmarks FAILED');
      
      return {
        passed,
        report,
        results: this.results
      };
      
    } catch (error) {
      console.error('💥 Benchmark runner failed:', error);
      throw error;
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suiteName, playwright) {
    const context = await playwright.chromium.launch({ headless: true });
    const page = await context.newPage();
    
    try {
      let suite, results;
      
      switch (suiteName) {
        case 'mobile':
          suite = new MobilePerformanceSuite();
          results = await this.runMobileSuite(suite, page);
          break;
          
        case 'api':
          suite = new APIPerformanceSuite();
          results = await this.runApiSuite(suite);
          break;
          
        case 'pwa':
          suite = new PWAPerformanceSuite();
          results = await this.runPwaSuite(suite, page);
          break;
          
        case 'edge':
          suite = new EdgePerformanceSuite();
          results = await this.runEdgeSuite(suite);
          break;
          
        case 'scalability':
          suite = new ScalabilityTestSuite();
          results = await this.runScalabilitySuite(suite);
          break;
          
        default:
          throw new Error(`Unknown test suite: ${suiteName}`);
      }
      
      return {
        suite: suiteName,
        results,
        report: suite.generatePerformanceReport ? suite.generatePerformanceReport() : results,
        timestamp: Date.now(),
        passed: this.evaluateSuiteResults(results)
      };
      
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Run mobile performance suite
   */
  async runMobileSuite(suite, page) {
    const results = {};
    
    // GPS Performance Test
    console.log('  📍 Testing GPS performance...');
    results.gpsPerformance = await suite.testGPSPerformance(page);
    
    // 3G Network Performance Test
    console.log('  📶 Testing 3G network performance...');
    results.networkPerformance = await suite.test3GNetworkPerformance(page);
    
    // Battery Optimization Test
    console.log('  🔋 Testing battery optimization...');
    results.batteryOptimization = await suite.testBatteryOptimization(page);
    
    // Offline Performance Test
    console.log('  📴 Testing offline performance...');
    results.offlinePerformance = await suite.testOfflinePerformance(page);
    
    // Memory Usage Test
    console.log('  💾 Testing memory usage...');
    results.memoryUsage = await suite.testMemoryUsageInField(page);
    
    return results;
  }

  /**
   * Run API performance suite
   */
  async runApiSuite(suite) {
    const results = {};
    
    // Endpoint Performance Test
    console.log('  🔗 Testing API endpoint performance...');
    results.endpointPerformance = await suite.testEndpointPerformance();
    
    // Database Query Performance Test
    console.log('  🗄️ Testing database query performance...');
    results.databasePerformance = await suite.testDatabaseQueryPerformance();
    
    // Concurrent User Handling Test
    console.log('  👥 Testing concurrent user handling...');
    results.concurrentUsers = await suite.testConcurrentUserHandling();
    
    // Caching Efficiency Test
    console.log('  💨 Testing caching efficiency...');
    results.cachingEfficiency = await suite.testCachingEfficiency();
    
    // Rate Limiting Test
    console.log('  🚦 Testing rate limiting...');
    results.rateLimiting = await suite.testRateLimiting();
    
    return results;
  }

  /**
   * Run PWA performance suite
   */
  async runPwaSuite(suite, page) {
    const results = {};
    
    // Service Worker Performance Test
    console.log('  ⚙️ Testing service worker performance...');
    results.serviceWorkerPerformance = await suite.testServiceWorkerPerformance(page);
    
    // IndexedDB Performance Test
    console.log('  💾 Testing IndexedDB performance...');
    results.indexedDBPerformance = await suite.testIndexedDBPerformance(page);
    
    // Background Sync Performance Test
    console.log('  🔄 Testing background sync performance...');
    results.backgroundSyncPerformance = await suite.testBackgroundSyncPerformance(page);
    
    // Offline Capabilities Test
    console.log('  📴 Testing offline capabilities...');
    results.offlineCapabilities = await suite.testOfflineCapabilities(page);
    
    return results;
  }

  /**
   * Run edge computing performance suite
   */
  async runEdgeSuite(suite) {
    const results = {};
    
    // Worker Performance Test
    console.log('  ⚡ Testing Cloudflare Workers performance...');
    results.workerPerformance = await suite.testWorkerPerformance();
    
    // Global Latency Test
    console.log('  🌍 Testing global latency...');
    results.globalLatency = await suite.testGlobalLatency();
    
    // Edge Caching Test
    console.log('  💨 Testing edge caching...');
    results.edgeCaching = await suite.testEdgeCaching();
    
    // CDN Optimization Test
    console.log('  🚀 Testing CDN optimization...');
    results.cdnOptimization = await suite.testCDNOptimization();
    
    // Rural Coverage Test
    console.log('  🏞️ Testing rural coverage...');
    results.ruralCoverage = await suite.testRuralCoverage();
    
    return results;
  }

  /**
   * Run scalability test suite
   */
  async runScalabilitySuite(suite) {
    const results = {};
    
    // Load Tests
    console.log('  📈 Running load tests...');
    results.loadTests = await suite.runLoadTests();
    
    // Stress Tests
    console.log('  🔥 Running stress tests...');
    results.stressTests = await suite.runStressTests();
    
    // Spike Tests
    console.log('  ⚡ Running spike tests...');
    results.spikeTests = await suite.runSpikeTests();
    
    // Endurance Tests
    console.log('  ⏳ Running endurance tests...');
    results.enduranceTests = await suite.runEnduranceTests();
    
    return results;
  }

  /**
   * Generate comprehensive performance report
   */
  async generateComprehensiveReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.endTime - this.startTime,
        version: process.env.npm_package_version || 'unknown',
        commit: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'unknown',
        branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_BRANCH || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        ci: this.config.ciMode
      },
      
      summary: this.generateExecutiveSummary(),
      
      suites: {},
      
      regression_analysis: this.baseline ? this.generateRegressionAnalysis() : null,
      
      recommendations: this.generateOverallRecommendations(),
      
      thresholds: this.config.thresholds,
      
      pass_fail_status: {}
    };
    
    // Add individual suite reports
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (suiteData.report) {
        report.suites[suiteName] = suiteData.report;
        report.pass_fail_status[suiteName] = suiteData.passed;
      }
    }
    
    // Calculate overall pass/fail
    report.overall_pass = Object.values(report.pass_fail_status).every(passed => passed === true);
    
    return report;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const summary = {
      total_suites: this.config.suites.length,
      passed_suites: 0,
      failed_suites: 0,
      critical_issues: [],
      key_metrics: {},
      performance_score: 0
    };
    
    let totalScore = 0;
    let scoreCount = 0;
    
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (suiteData.error) {
        summary.failed_suites++;
        summary.critical_issues.push(`${suiteName}: ${suiteData.error}`);
        continue;
      }
      
      if (suiteData.passed) {
        summary.passed_suites++;
      } else {
        summary.failed_suites++;
      }
      
      // Extract key metrics from each suite
      if (suiteData.report) {
        const report = suiteData.report;
        
        switch (suiteName) {
          case 'mobile':
            if (report.summary) {
              summary.key_metrics.avgGPSLockTime = report.summary.averageGPSLockTime;
              summary.key_metrics.avgBatteryDrain = report.summary.averageBatteryDrainPerHour;
              summary.key_metrics.avg3GLoadTime = report.summary.average3GLoadTime;
            }
            break;
            
          case 'api':
            if (report.summary) {
              summary.key_metrics.avgApiResponseTime = report.summary.avgResponseTime;
              summary.key_metrics.p95ApiResponseTime = report.summary.p95ResponseTime;
              summary.key_metrics.maxConcurrentUsers = report.summary.maxConcurrentUsersHandled;
            }
            break;
            
          case 'pwa':
            if (report.summary) {
              summary.key_metrics.avgOfflineBootTime = report.summary.avgOfflineBootTime;
              summary.key_metrics.avgIndexedDBWriteTime = report.summary.avgIndexedDBWriteTime;
            }
            break;
            
          case 'edge':
            if (report.summary) {
              summary.key_metrics.avgWorkerProcessingTime = report.summary.avgWorkerProcessingTime;
              summary.key_metrics.globalAvgLatency = report.summary.globalAvgLatency;
              summary.key_metrics.ruralCoverageRate = report.summary.ruralCoverageRate;
            }
            break;
            
          case 'scalability':
            if (report.summary) {
              summary.key_metrics.maxUsersHandled = report.summary.maxConcurrentUsersHandled;
              summary.key_metrics.systemBreakingPoint = report.summary.systemBreakingPoint;
            }
            break;
        }
        
        // Calculate performance score if available
        if (report.overall_pass !== undefined) {
          totalScore += report.overall_pass ? 100 : 0;
          scoreCount++;
        }
      }
    }
    
    summary.performance_score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    
    return summary;
  }

  /**
   * Generate regression analysis against baseline
   */
  generateRegressionAnalysis() {
    if (!this.baseline) return null;
    
    const analysis = {
      baseline_version: this.baseline.metadata.version,
      baseline_timestamp: this.baseline.metadata.timestamp,
      regressions: [],
      improvements: [],
      unchanged: []
    };
    
    // Compare key metrics
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (!suiteData.report || !this.baseline.suites[suiteName]) continue;
      
      const current = suiteData.report.summary || {};
      const baseline = this.baseline.suites[suiteName].summary || {};
      
      for (const [metricName, currentValue] of Object.entries(current)) {
        const baselineValue = baseline[metricName];
        if (typeof currentValue === 'number' && typeof baselineValue === 'number') {
          const change = ((currentValue - baselineValue) / baselineValue) * 100;
          
          if (Math.abs(change) > 5) { // 5% threshold
            const entry = {
              suite: suiteName,
              metric: metricName,
              current: currentValue,
              baseline: baselineValue,
              change: change,
              changeType: change > 0 ? 'increase' : 'decrease'
            };
            
            // Determine if this is a regression based on metric type
            if (this.isPerformanceRegression(metricName, change)) {
              analysis.regressions.push(entry);
            } else if (this.isPerformanceImprovement(metricName, change)) {
              analysis.improvements.push(entry);
            } else {
              analysis.unchanged.push(entry);
            }
          }
        }
      }
    }
    
    return analysis;
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations() {
    const recommendations = [];
    
    // Collect recommendations from all suites
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (suiteData.report && suiteData.report.recommendations) {
        for (const recommendation of suiteData.report.recommendations) {
          recommendations.push({
            ...recommendation,
            suite: suiteName
          });
        }
      }
    }
    
    // Sort by priority (HIGH, MEDIUM, LOW)
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    recommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Add overall recommendations based on cross-suite analysis
    const overallRecommendations = this.generateCrossSuiteRecommendations();
    
    return [...overallRecommendations, ...recommendations];
  }

  /**
   * Generate cross-suite recommendations
   */
  generateCrossSuiteRecommendations() {
    const recommendations = [];
    
    // Check for consistent issues across suites
    const commonIssues = this.identifyCommonIssues();
    
    if (commonIssues.includes('high_response_times')) {
      recommendations.push({
        category: 'Overall Performance',
        priority: 'HIGH',
        issue: 'High response times detected across multiple test suites',
        recommendations: [
          'Implement comprehensive caching strategy across all layers',
          'Review and optimize database queries and indexes',
          'Consider upgrading infrastructure resources',
          'Implement performance monitoring and alerting'
        ],
        suites: ['api', 'edge', 'pwa']
      });
    }
    
    if (commonIssues.includes('memory_issues')) {
      recommendations.push({
        category: 'Memory Optimization',
        priority: 'MEDIUM',
        issue: 'Memory-related issues detected in multiple areas',
        recommendations: [
          'Implement memory profiling and monitoring',
          'Review object lifecycle management',
          'Add memory cleanup procedures',
          'Consider memory pooling for frequently used objects'
        ],
        suites: ['mobile', 'scalability', 'pwa']
      });
    }
    
    if (commonIssues.includes('rural_connectivity')) {
      recommendations.push({
        category: 'Rural User Experience',
        priority: 'HIGH',
        issue: 'Suboptimal performance for rural/remote users',
        recommendations: [
          'Implement progressive enhancement for slow connections',
          'Add more aggressive offline-first capabilities',
          'Optimize for low-bandwidth scenarios',
          'Expand edge presence in rural areas'
        ],
        suites: ['mobile', 'edge']
      });
    }
    
    return recommendations;
  }

  /**
   * Save reports in various formats
   */
  async saveReports(report) {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDirectory)) {
      fs.mkdirSync(this.config.outputDirectory, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save JSON report
    if (this.config.reportFormat.includes('json')) {
      const jsonPath = path.join(this.config.outputDirectory, `performance-report-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report saved: ${jsonPath}`);
    }
    
    // Save HTML report
    if (this.config.reportFormat.includes('html')) {
      const htmlPath = path.join(this.config.outputDirectory, `performance-report-${timestamp}.html`);
      const htmlContent = this.generateHTMLReport(report);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`🌐 HTML report saved: ${htmlPath}`);
    }
    
    // Save JUnit XML report
    if (this.config.reportFormat.includes('junit')) {
      const junitPath = path.join(this.config.outputDirectory, `performance-junit-${timestamp}.xml`);
      const junitContent = this.generateJUnitReport(report);
      fs.writeFileSync(junitPath, junitContent);
      console.log(`📋 JUnit report saved: ${junitPath}`);
    }
    
    // Save latest report (for CI artifacts)
    const latestJsonPath = path.join(this.config.outputDirectory, 'performance-report-latest.json');
    fs.writeFileSync(latestJsonPath, JSON.stringify(report, null, 2));
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHunta Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .status-pass { color: #059669; font-weight: bold; }
        .status-fail { color: #dc2626; font-weight: bold; }
        .metric-card { background: #f8fafc; padding: 20px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
        .suite-section { margin: 30px 0; }
        .recommendations { background: #fff7ed; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-medium { color: #d97706; font-weight: bold; }
        .priority-low { color: #059669; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        .chart { width: 100%; height: 300px; background: #f8fafc; border-radius: 6px; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 GoHunta Performance Benchmark Report</h1>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <div>
                    <strong>Timestamp:</strong> ${new Date(report.metadata.timestamp).toLocaleString()}<br>
                    <strong>Duration:</strong> ${(report.metadata.duration / 1000).toFixed(1)}s<br>
                    <strong>Environment:</strong> ${report.metadata.environment}
                </div>
                <div>
                    <strong>Version:</strong> ${report.metadata.version}<br>
                    <strong>Commit:</strong> ${report.metadata.commit.substring(0, 8)}<br>
                    <strong>Branch:</strong> ${report.metadata.branch}
                </div>
                <div class="${report.overall_pass ? 'status-pass' : 'status-fail'}">
                    ${report.overall_pass ? '✅ PASSED' : '❌ FAILED'}
                </div>
            </div>
        </div>

        <div class="metric-card">
            <h2>📊 Executive Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div><strong>Performance Score:</strong> ${report.summary.performance_score}/100</div>
                <div><strong>Suites Passed:</strong> ${report.summary.passed_suites}/${report.summary.total_suites}</div>
                <div><strong>Critical Issues:</strong> ${report.summary.critical_issues.length}</div>
            </div>
        </div>

        <div class="suite-section">
            <h2>🧪 Test Suite Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Suite</th>
                        <th>Status</th>
                        <th>Key Metrics</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.suites).map(([suiteName, suiteData]) => `
                        <tr>
                            <td><strong>${suiteName.toUpperCase()}</strong></td>
                            <td class="${suiteData.overall_pass ? 'status-pass' : 'status-fail'}">
                                ${suiteData.overall_pass ? '✅ PASS' : '❌ FAIL'}
                            </td>
                            <td>${this.formatKeyMetrics(suiteData.summary)}</td>
                            <td>${suiteData.recommendations?.length || 0} recommendations</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${report.regression_analysis ? `
        <div class="suite-section">
            <h2>📈 Regression Analysis</h2>
            <p><strong>Baseline:</strong> ${report.regression_analysis.baseline_version} (${new Date(report.regression_analysis.baseline_timestamp).toLocaleDateString()})</p>
            
            ${report.regression_analysis.regressions.length > 0 ? `
            <h3>⚠️ Performance Regressions</h3>
            <table>
                <thead>
                    <tr><th>Suite</th><th>Metric</th><th>Change</th><th>Current</th><th>Baseline</th></tr>
                </thead>
                <tbody>
                    ${report.regression_analysis.regressions.map(reg => `
                        <tr>
                            <td>${reg.suite}</td>
                            <td>${reg.metric}</td>
                            <td style="color: #dc2626;">${reg.change.toFixed(1)}%</td>
                            <td>${reg.current}</td>
                            <td>${reg.baseline}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}
            
            ${report.regression_analysis.improvements.length > 0 ? `
            <h3>🚀 Performance Improvements</h3>
            <table>
                <thead>
                    <tr><th>Suite</th><th>Metric</th><th>Change</th><th>Current</th><th>Baseline</th></tr>
                </thead>
                <tbody>
                    ${report.regression_analysis.improvements.map(imp => `
                        <tr>
                            <td>${imp.suite}</td>
                            <td>${imp.metric}</td>
                            <td style="color: #059669;">${imp.change.toFixed(1)}%</td>
                            <td>${imp.current}</td>
                            <td>${imp.baseline}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}
        </div>
        ` : ''}

        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.slice(0, 10).map(rec => `
                <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong>${rec.category}</strong>
                        <span class="priority-${rec.priority.toLowerCase()}">${rec.priority}</span>
                    </div>
                    <p><strong>Issue:</strong> ${rec.issue}</p>
                    <ul>
                        ${rec.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JUnit XML report
   */
  generateJUnitReport(report) {
    const totalTests = Object.keys(report.suites).length;
    const failures = Object.values(report.pass_fail_status).filter(passed => !passed).length;
    const duration = report.metadata.duration / 1000;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="GoHunta Performance Tests" tests="${totalTests}" failures="${failures}" time="${duration.toFixed(3)}">`;
    
    for (const [suiteName, suiteData] of Object.entries(report.suites)) {
      const passed = report.pass_fail_status[suiteName];
      const suiteTime = 10; // Approximate time per suite
      
      xml += `
    <testsuite name="${suiteName}" tests="1" failures="${passed ? 0 : 1}" time="${suiteTime}">
        <testcase name="${suiteName}_performance" classname="GoHuntaPerformance" time="${suiteTime}">`;
      
      if (!passed) {
        xml += `
            <failure message="Performance benchmarks failed" type="PerformanceFailure">
                Performance thresholds not met. Check detailed report for specific issues.
            </failure>`;
      }
      
      xml += `
        </testcase>
    </testsuite>`;
    }
    
    xml += `
</testsuites>`;
    
    return xml;
  }

  // Helper methods
  formatKeyMetrics(summary) {
    if (!summary) return 'N/A';
    
    const metrics = [];
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value === 'number') {
        metrics.push(`${key}: ${value.toFixed(1)}${this.getMetricUnit(key)}`);
      }
    }
    
    return metrics.slice(0, 3).join(', ');
  }

  getMetricUnit(metric) {
    if (metric.includes('Time') || metric.includes('time')) return 'ms';
    if (metric.includes('Rate') || metric.includes('ratio')) return '%';
    if (metric.includes('Users') || metric.includes('users')) return '';
    return '';
  }

  evaluateResults(report) {
    return report.overall_pass && report.summary.performance_score >= 70;
  }

  evaluateSuiteResults(results) {
    // Simple heuristic - suite passes if no major errors
    return !results.error;
  }

  isPerformanceRegression(metricName, change) {
    // Metrics where increase is bad
    const increaseIsBad = ['responseTime', 'loadTime', 'errorRate', 'memoryUsage', 'batteryDrain'];
    // Metrics where decrease is bad  
    const decreaseIsBad = ['throughput', 'cacheHitRatio', 'successRate', 'coverageRate'];
    
    const metricLower = metricName.toLowerCase();
    
    if (increaseIsBad.some(bad => metricLower.includes(bad.toLowerCase())) && change > 0) {
      return true;
    }
    
    if (decreaseIsBad.some(bad => metricLower.includes(bad.toLowerCase())) && change < 0) {
      return true;
    }
    
    return false;
  }

  isPerformanceImprovement(metricName, change) {
    return this.isPerformanceRegression(metricName, -change); // Opposite of regression
  }

  identifyCommonIssues() {
    const issues = [];
    
    // Check for high response times across suites
    let highResponseTimes = 0;
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (suiteData.report && suiteData.report.summary) {
        const summary = suiteData.report.summary;
        for (const [key, value] of Object.entries(summary)) {
          if (key.toLowerCase().includes('responsetime') && typeof value === 'number' && value > 500) {
            highResponseTimes++;
            break;
          }
        }
      }
    }
    if (highResponseTimes >= 2) issues.push('high_response_times');
    
    // Check for memory issues
    let memoryIssues = 0;
    for (const [suiteName, suiteData] of Object.entries(this.results)) {
      if (suiteData.report && suiteData.report.recommendations) {
        for (const rec of suiteData.report.recommendations) {
          if (rec.category.toLowerCase().includes('memory')) {
            memoryIssues++;
            break;
          }
        }
      }
    }
    if (memoryIssues >= 2) issues.push('memory_issues');
    
    // Check for rural connectivity issues
    const mobileResults = this.results.mobile;
    const edgeResults = this.results.edge;
    
    if (mobileResults?.report?.summary?.average3GLoadTime > 2000 || 
        edgeResults?.report?.summary?.ruralCoverageRate < 0.9) {
      issues.push('rural_connectivity');
    }
    
    return issues;
  }

  async loadBaseline(baselinePath) {
    try {
      const fs = await import('fs');
      const baselineContent = fs.readFileSync(baselinePath, 'utf8');
      return JSON.parse(baselineContent);
    } catch (error) {
      console.warn(`Failed to load baseline from ${baselinePath}:`, error.message);
      return null;
    }
  }
}

export default PerformanceBenchmarkRunner;