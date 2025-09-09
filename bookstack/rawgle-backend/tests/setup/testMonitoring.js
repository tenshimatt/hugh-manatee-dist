/**
 * Test Monitoring and Quality Gates
 * Following TDD_DOCUMENTATION.md specifications for test monitoring
 */

const fs = require('fs').promises;
const path = require('path');

class TestMonitoring {
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.qualityGates = new QualityGates();
    this.reportGenerator = new TestReportGenerator();
  }

  async startMonitoring() {
    console.log('Starting test monitoring...');
    
    // Initialize monitoring systems
    await this.metricsCollector.initialize();
    await this.qualityGates.loadConfiguration();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Test monitoring started successfully');
  }

  setupEventListeners() {
    // Listen for test events
    process.on('testStart', (testInfo) => {
      this.metricsCollector.recordTestStart(testInfo);
    });

    process.on('testEnd', (testInfo) => {
      this.metricsCollector.recordTestEnd(testInfo);
    });

    process.on('testSuite', (suiteInfo) => {
      this.metricsCollector.recordTestSuite(suiteInfo);
    });

    // Listen for performance events
    process.on('performanceMetric', (metric) => {
      this.metricsCollector.recordPerformanceMetric(metric);
    });
  }

  async generateReport() {
    const metrics = await this.metricsCollector.getMetrics();
    const qualityGateResults = await this.qualityGates.evaluate(metrics);
    
    return this.reportGenerator.generate(metrics, qualityGateResults);
  }

  async cleanup() {
    await this.metricsCollector.cleanup();
    console.log('Test monitoring cleanup completed');
  }
}

class MetricsCollector {
  constructor() {
    this.metrics = {
      testExecution: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        flakyTests: [],
        executionTimes: [],
        averageExecutionTime: 0
      },
      coverage: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      },
      performance: {
        apiResponseTimes: [],
        databaseQueryTimes: [],
        memoryUsage: [],
        cpuUsage: []
      },
      quality: {
        codeComplexity: 0,
        technicalDebt: 0,
        securityVulnerabilities: []
      }
    };
  }

  async initialize() {
    // Initialize metrics collection
    this.startTime = Date.now();
    
    // Create metrics directory if it doesn't exist
    await fs.mkdir('metrics', { recursive: true });
  }

  recordTestStart(testInfo) {
    testInfo.startTime = Date.now();
    
    // Emit custom metric
    this.emit('customStat', 'test.started', 1);
  }

  recordTestEnd(testInfo) {
    testInfo.endTime = Date.now();
    testInfo.duration = testInfo.endTime - testInfo.startTime;
    
    this.metrics.testExecution.totalTests++;
    this.metrics.testExecution.executionTimes.push(testInfo.duration);
    
    if (testInfo.status === 'passed') {
      this.metrics.testExecution.passedTests++;
      this.emit('customStat', 'test.passed', 1);
    } else if (testInfo.status === 'failed') {
      this.metrics.testExecution.failedTests++;
      this.emit('customStat', 'test.failed', 1);
      
      // Track flaky tests
      if (this.isFlaky(testInfo)) {
        this.metrics.testExecution.flakyTests.push(testInfo);
        this.emit('customStat', 'test.flaky', 1);
      }
    } else {
      this.metrics.testExecution.skippedTests++;
      this.emit('customStat', 'test.skipped', 1);
    }
    
    // Calculate average execution time
    this.metrics.testExecution.averageExecutionTime = 
      this.metrics.testExecution.executionTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.testExecution.executionTimes.length;
  }

  recordTestSuite(suiteInfo) {
    this.emit('customStat', `suite.${suiteInfo.name}.completed`, 1);
    this.emit('customStat', `suite.${suiteInfo.name}.duration`, suiteInfo.duration);
  }

  recordPerformanceMetric(metric) {
    switch (metric.type) {
      case 'api_response_time':
        this.metrics.performance.apiResponseTimes.push(metric.value);
        this.emit('customStat', 'performance.api_response_time', metric.value);
        break;
      
      case 'database_query_time':
        this.metrics.performance.databaseQueryTimes.push(metric.value);
        this.emit('customStat', 'performance.database_query_time', metric.value);
        break;
      
      case 'memory_usage':
        this.metrics.performance.memoryUsage.push(metric.value);
        this.emit('customStat', 'performance.memory_usage', metric.value);
        break;
      
      case 'cpu_usage':
        this.metrics.performance.cpuUsage.push(metric.value);
        this.emit('customStat', 'performance.cpu_usage', metric.value);
        break;
    }
  }

  recordCoverageMetrics(coverage) {
    this.metrics.coverage = {
      lines: coverage.lines.pct,
      functions: coverage.functions.pct,
      branches: coverage.branches.pct,
      statements: coverage.statements.pct
    };
    
    this.emit('customStat', 'coverage.lines', coverage.lines.pct);
    this.emit('customStat', 'coverage.functions', coverage.functions.pct);
    this.emit('customStat', 'coverage.branches', coverage.branches.pct);
    this.emit('customStat', 'coverage.statements', coverage.statements.pct);
  }

  isFlaky(testInfo) {
    // Simple flaky test detection - test that failed but passed in previous runs
    return testInfo.retryCount > 0 && testInfo.status === 'failed';
  }

  emit(event, metric, value) {
    // Emit metrics to monitoring systems
    if (process.env.NODE_ENV === 'test' && global.testMetrics) {
      global.testMetrics[metric] = (global.testMetrics[metric] || 0) + value;
    }
  }

  async getMetrics() {
    return this.metrics;
  }

  async saveMetrics() {
    const metricsFile = path.join('metrics', `test-metrics-${Date.now()}.json`);
    await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
  }

  async cleanup() {
    await this.saveMetrics();
  }
}

class QualityGates {
  constructor() {
    this.gates = {};
  }

  async loadConfiguration() {
    // Load quality gates configuration based on TDD_DOCUMENTATION.md
    this.gates = {
      coverage: {
        lines: { min: 90, critical: true },
        functions: { min: 90, critical: true },
        branches: { min: 85, critical: true },
        statements: { min: 90, critical: true }
      },
      performance: {
        apiResponseTime: { p95: 200, p99: 500, critical: true },
        databaseQueryTime: { p95: 100, p99: 300, critical: true },
        averageTestExecutionTime: { max: 30000, critical: false } // 30 seconds
      },
      reliability: {
        testPassRate: { min: 99, critical: true },
        flakyTestThreshold: { max: 5, critical: false }, // Max 5% flaky tests
        testStability: { min: 95, critical: true }
      },
      security: {
        vulnerabilities: { high: 0, medium: 5, critical: true },
        auditLevel: { level: 'moderate', critical: true }
      },
      accessibility: {
        wcagCompliance: { level: 'AA', critical: true },
        axeViolations: { max: 0, critical: true }
      }
    };
  }

  async evaluate(metrics) {
    const results = {
      passed: true,
      gates: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical_failed: 0
      }
    };

    // Evaluate coverage gates
    results.gates.coverage = await this.evaluateCoverageGates(metrics.coverage);
    
    // Evaluate performance gates
    results.gates.performance = await this.evaluatePerformanceGates(metrics.performance);
    
    // Evaluate reliability gates
    results.gates.reliability = await this.evaluateReliabilityGates(metrics.testExecution);
    
    // Calculate summary
    Object.values(results.gates).forEach(gateResult => {
      Object.values(gateResult).forEach(check => {
        results.summary.total++;
        if (check.passed) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
          if (check.critical) {
            results.summary.critical_failed++;
            results.passed = false;
          }
        }
      });
    });

    return results;
  }

  async evaluateCoverageGates(coverage) {
    const gates = this.gates.coverage;
    
    return {
      lines: {
        passed: coverage.lines >= gates.lines.min,
        actual: coverage.lines,
        expected: gates.lines.min,
        critical: gates.lines.critical,
        message: `Line coverage: ${coverage.lines}% (min: ${gates.lines.min}%)`
      },
      functions: {
        passed: coverage.functions >= gates.functions.min,
        actual: coverage.functions,
        expected: gates.functions.min,
        critical: gates.functions.critical,
        message: `Function coverage: ${coverage.functions}% (min: ${gates.functions.min}%)`
      },
      branches: {
        passed: coverage.branches >= gates.branches.min,
        actual: coverage.branches,
        expected: gates.branches.min,
        critical: gates.branches.critical,
        message: `Branch coverage: ${coverage.branches}% (min: ${gates.branches.min}%)`
      },
      statements: {
        passed: coverage.statements >= gates.statements.min,
        actual: coverage.statements,
        expected: gates.statements.min,
        critical: gates.statements.critical,
        message: `Statement coverage: ${coverage.statements}% (min: ${gates.statements.min}%)`
      }
    };
  }

  async evaluatePerformanceGates(performance) {
    const gates = this.gates.performance;
    
    const apiP95 = this.calculatePercentile(performance.apiResponseTimes, 95);
    const apiP99 = this.calculatePercentile(performance.apiResponseTimes, 99);
    const dbP95 = this.calculatePercentile(performance.databaseQueryTimes, 95);
    const dbP99 = this.calculatePercentile(performance.databaseQueryTimes, 99);
    
    return {
      apiResponseTimeP95: {
        passed: apiP95 <= gates.apiResponseTime.p95,
        actual: apiP95,
        expected: gates.apiResponseTime.p95,
        critical: gates.apiResponseTime.critical,
        message: `API P95 response time: ${apiP95}ms (max: ${gates.apiResponseTime.p95}ms)`
      },
      apiResponseTimeP99: {
        passed: apiP99 <= gates.apiResponseTime.p99,
        actual: apiP99,
        expected: gates.apiResponseTime.p99,
        critical: gates.apiResponseTime.critical,
        message: `API P99 response time: ${apiP99}ms (max: ${gates.apiResponseTime.p99}ms)`
      },
      databaseQueryTimeP95: {
        passed: dbP95 <= gates.databaseQueryTime.p95,
        actual: dbP95,
        expected: gates.databaseQueryTime.p95,
        critical: gates.databaseQueryTime.critical,
        message: `DB P95 query time: ${dbP95}ms (max: ${gates.databaseQueryTime.p95}ms)`
      }
    };
  }

  async evaluateReliabilityGates(testExecution) {
    const gates = this.gates.reliability;
    
    const passRate = (testExecution.passedTests / testExecution.totalTests) * 100;
    const flakyRate = (testExecution.flakyTests.length / testExecution.totalTests) * 100;
    
    return {
      testPassRate: {
        passed: passRate >= gates.testPassRate.min,
        actual: passRate,
        expected: gates.testPassRate.min,
        critical: gates.testPassRate.critical,
        message: `Test pass rate: ${passRate.toFixed(2)}% (min: ${gates.testPassRate.min}%)`
      },
      flakyTests: {
        passed: flakyRate <= gates.flakyTestThreshold.max,
        actual: flakyRate,
        expected: gates.flakyTestThreshold.max,
        critical: gates.flakyTestThreshold.critical,
        message: `Flaky test rate: ${flakyRate.toFixed(2)}% (max: ${gates.flakyTestThreshold.max}%)`
      }
    };
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
}

class TestReportGenerator {
  async generate(metrics, qualityGateResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(metrics, qualityGateResults),
      metrics: metrics,
      qualityGates: qualityGateResults,
      recommendations: this.generateRecommendations(metrics, qualityGateResults)
    };

    // Save report to file
    const reportFile = path.join('reports', `test-report-${Date.now()}.json`);
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);

    return report;
  }

  generateSummary(metrics, qualityGateResults) {
    return {
      testExecution: {
        total: metrics.testExecution.totalTests,
        passed: metrics.testExecution.passedTests,
        failed: metrics.testExecution.failedTests,
        passRate: ((metrics.testExecution.passedTests / metrics.testExecution.totalTests) * 100).toFixed(2),
        averageExecutionTime: metrics.testExecution.averageExecutionTime
      },
      coverage: metrics.coverage,
      qualityGates: {
        total: qualityGateResults.summary.total,
        passed: qualityGateResults.summary.passed,
        failed: qualityGateResults.summary.failed,
        criticalFailed: qualityGateResults.summary.critical_failed,
        overallPassed: qualityGateResults.passed
      }
    };
  }

  generateRecommendations(metrics, qualityGateResults) {
    const recommendations = [];

    // Coverage recommendations
    if (metrics.coverage.lines < 90) {
      recommendations.push({
        category: 'coverage',
        priority: 'high',
        message: `Line coverage is ${metrics.coverage.lines}%. Add more unit tests to reach 90% target.`,
        action: 'Identify uncovered code paths and write targeted unit tests'
      });
    }

    // Performance recommendations
    const avgApiTime = metrics.performance.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.performance.apiResponseTimes.length;
    if (avgApiTime > 100) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        message: `Average API response time is ${avgApiTime.toFixed(2)}ms. Consider optimization.`,
        action: 'Profile slow endpoints and optimize database queries or caching'
      });
    }

    // Flaky test recommendations
    if (metrics.testExecution.flakyTests.length > 0) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        message: `${metrics.testExecution.flakyTests.length} flaky tests detected.`,
        action: 'Investigate and fix flaky tests to improve test stability'
      });
    }

    return recommendations;
  }

  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .metric { margin: 10px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .critical { font-weight: bold; color: darkred; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">Total Tests: ${report.summary.testExecution.total}</div>
        <div class="metric">Pass Rate: ${report.summary.testExecution.passRate}%</div>
        <div class="metric">Line Coverage: ${report.summary.coverage.lines}%</div>
        <div class="metric">Quality Gates: ${report.summary.qualityGates.passed}/${report.summary.qualityGates.total} passed</div>
    </div>
    
    <h2>Quality Gates</h2>
    <table>
        <tr><th>Gate</th><th>Status</th><th>Details</th></tr>
        ${this.generateQualityGateRows(report.qualityGates)}
    </table>
    
    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="metric">
                <strong>${rec.category.toUpperCase()}</strong> (${rec.priority}): ${rec.message}
                <br><em>Action: ${rec.action}</em>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;

    const htmlFile = path.join('reports', `test-report-${Date.now()}.html`);
    await fs.writeFile(htmlFile, htmlTemplate);
  }

  generateQualityGateRows(qualityGates) {
    let rows = '';
    
    Object.entries(qualityGates.gates).forEach(([category, gates]) => {
      Object.entries(gates).forEach(([gate, result]) => {
        const status = result.passed ? 
          '<span class="passed">✅ PASSED</span>' : 
          result.critical ? 
            '<span class="critical">❌ CRITICAL FAILURE</span>' :
            '<span class="failed">⚠️ FAILED</span>';
        
        rows += `<tr><td>${category}.${gate}</td><td>${status}</td><td>${result.message}</td></tr>`;
      });
    });
    
    return rows;
  }
}

module.exports = {
  TestMonitoring,
  MetricsCollector,
  QualityGates,
  TestReportGenerator
};