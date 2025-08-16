#!/usr/bin/env node

/**
 * Comprehensive test runner with reporting and metrics
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, coverage: 0 },
      integration: { passed: 0, failed: 0, coverage: 0 },
      security: { passed: 0, failed: 0, vulnerabilities: 0 },
      performance: { passed: 0, failed: 0, avgResponseTime: 0 },
      e2e: { passed: 0, failed: 0, browsers: [] }
    };
    
    this.startTime = Date.now();
    this.reportDir = './test-results';
    
    // Create report directory
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      performance: '⚡'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const { timeout = 300000, env = process.env } = options;
      
      this.log(`Running: ${command}`);
      
      const child = spawn('sh', ['-c', command], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...env, FORCE_COLOR: '1' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${command}\n${stderr}`));
        }
      });
    });
  }

  async runUnitTests() {
    this.log('Running unit tests...', 'info');
    
    try {
      const result = await this.runCommand('npm run test:unit -- --coverage --reporter=json --outputFile=./test-results/unit-results.json');
      
      // Parse results
      if (fs.existsSync('./test-results/unit-results.json')) {
        const results = JSON.parse(fs.readFileSync('./test-results/unit-results.json', 'utf8'));
        this.testResults.unit.passed = results.numPassedTests || 0;
        this.testResults.unit.failed = results.numFailedTests || 0;
      }
      
      // Parse coverage
      if (fs.existsSync('./coverage/coverage-summary.json')) {
        const coverage = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf8'));
        this.testResults.unit.coverage = coverage.total.lines.pct || 0;
      }
      
      this.log(`Unit tests completed: ${this.testResults.unit.passed} passed, ${this.testResults.unit.failed} failed`, 'success');
      this.log(`Coverage: ${this.testResults.unit.coverage}%`, this.testResults.unit.coverage >= 95 ? 'success' : 'warning');
      
    } catch (error) {
      this.log(`Unit tests failed: ${error.message}`, 'error');
      this.testResults.unit.failed += 1;
    }
  }

  async runIntegrationTests() {
    this.log('Running integration tests...', 'info');
    
    try {
      await this.runCommand('npm run test:integration -- --reporter=json --outputFile=./test-results/integration-results.json');
      
      if (fs.existsSync('./test-results/integration-results.json')) {
        const results = JSON.parse(fs.readFileSync('./test-results/integration-results.json', 'utf8'));
        this.testResults.integration.passed = results.numPassedTests || 0;
        this.testResults.integration.failed = results.numFailedTests || 0;
      }
      
      this.log(`Integration tests completed: ${this.testResults.integration.passed} passed, ${this.testResults.integration.failed} failed`, 'success');
      
    } catch (error) {
      this.log(`Integration tests failed: ${error.message}`, 'error');
      this.testResults.integration.failed += 1;
    }
  }

  async runSecurityTests() {
    this.log('Running security tests...', 'info');
    
    try {
      // Run security test suite
      await this.runCommand('npm run test:security -- --reporter=json --outputFile=./test-results/security-results.json');
      
      // Run npm audit
      try {
        await this.runCommand('npm audit --audit-level=moderate --json > ./test-results/npm-audit.json');
      } catch (auditError) {
        this.log('NPM audit found vulnerabilities', 'warning');
      }
      
      // Parse security results
      if (fs.existsSync('./test-results/security-results.json')) {
        const results = JSON.parse(fs.readFileSync('./test-results/security-results.json', 'utf8'));
        this.testResults.security.passed = results.numPassedTests || 0;
        this.testResults.security.failed = results.numFailedTests || 0;
      }
      
      // Parse audit results
      if (fs.existsSync('./test-results/npm-audit.json')) {
        const audit = JSON.parse(fs.readFileSync('./test-results/npm-audit.json', 'utf8'));
        this.testResults.security.vulnerabilities = audit.metadata?.totalVulnerabilities || 0;
      }
      
      this.log(`Security tests completed: ${this.testResults.security.passed} passed, ${this.testResults.security.failed} failed`, 'success');
      this.log(`Vulnerabilities found: ${this.testResults.security.vulnerabilities}`, this.testResults.security.vulnerabilities === 0 ? 'success' : 'warning');
      
    } catch (error) {
      this.log(`Security tests failed: ${error.message}`, 'error');
      this.testResults.security.failed += 1;
    }
  }

  async runPerformanceTests() {
    this.log('Running performance tests...', 'performance');
    
    try {
      // Start the application in background
      this.log('Starting application for performance testing...', 'info');
      const appProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Wait for app to start
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        // Run performance tests with Artillery
        const result = await this.runCommand('npm run test:performance', { timeout: 180000 });
        
        // Parse performance results
        if (fs.existsSync('./artillery-report.json')) {
          const perf = JSON.parse(fs.readFileSync('./artillery-report.json', 'utf8'));
          this.testResults.performance.avgResponseTime = perf.aggregate?.latency?.mean || 0;
          this.testResults.performance.passed = perf.aggregate?.latency?.mean < 100 ? 1 : 0;
          this.testResults.performance.failed = perf.aggregate?.latency?.mean >= 100 ? 1 : 0;
        }
        
        this.log(`Performance tests completed. Avg response time: ${this.testResults.performance.avgResponseTime}ms`, 
          this.testResults.performance.avgResponseTime < 100 ? 'success' : 'warning');
        
      } finally {
        // Kill the application process
        appProcess.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      this.log(`Performance tests failed: ${error.message}`, 'error');
      this.testResults.performance.failed += 1;
    }
  }

  async runE2ETests() {
    this.log('Running E2E tests...', 'info');
    
    try {
      // Install Playwright browsers if needed
      await this.runCommand('npx playwright install');
      
      // Start application
      this.log('Starting application for E2E testing...', 'info');
      const appProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Wait for app to be ready
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      try {
        const browsers = ['chromium', 'firefox', 'webkit'];
        
        for (const browser of browsers) {
          try {
            this.log(`Running E2E tests on ${browser}...`, 'info');
            await this.runCommand(`npx playwright test --project=${browser} --reporter=json --output-dir=./test-results/e2e-${browser}`, { timeout: 300000 });
            
            this.testResults.e2e.browsers.push({ browser, status: 'passed' });
            this.testResults.e2e.passed += 1;
            
          } catch (browserError) {
            this.log(`E2E tests failed on ${browser}: ${browserError.message}`, 'error');
            this.testResults.e2e.browsers.push({ browser, status: 'failed' });
            this.testResults.e2e.failed += 1;
          }
        }
        
      } finally {
        // Kill the application process
        appProcess.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      this.log(`E2E tests setup failed: ${error.message}`, 'error');
      this.testResults.e2e.failed += 1;
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalTests = Object.values(this.testResults).reduce((sum, result) => sum + result.passed + result.failed, 0);
    const totalPassed = Object.values(this.testResults).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, result) => sum + result.failed, 0);

    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0
      },
      results: this.testResults,
      coverage: {
        unit: this.testResults.unit.coverage,
        threshold: 95,
        meets_threshold: this.testResults.unit.coverage >= 95
      },
      performance: {
        avgResponseTime: this.testResults.performance.avgResponseTime,
        threshold: 100,
        meets_threshold: this.testResults.performance.avgResponseTime < 100
      },
      security: {
        vulnerabilities: this.testResults.security.vulnerabilities,
        critical_threshold: 0,
        meets_threshold: this.testResults.security.vulnerabilities === 0
      }
    };

    // Write JSON report
    fs.writeFileSync(`${this.reportDir}/test-report.json`, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    // Generate console summary
    this.printSummary(report);

    return report;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - Rawgle Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-section { margin-bottom: 30px; }
        .test-section h3 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.875em; }
        .badge-success { background-color: #d4edda; color: #155724; }
        .badge-danger { background-color: #f8d7da; color: #721c24; }
        .progress-bar { width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background-color: #28a745; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - Rawgle Platform</h1>
        <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Duration: ${(report.duration / 1000).toFixed(2)} seconds</p>
    </div>

    <div class="summary">
        <div class="card">
            <div class="metric ${report.summary.successRate >= 95 ? 'success' : report.summary.successRate >= 80 ? 'warning' : 'danger'}">${report.summary.successRate}%</div>
            <div>Success Rate</div>
        </div>
        <div class="card">
            <div class="metric success">${report.summary.passed}</div>
            <div>Tests Passed</div>
        </div>
        <div class="card">
            <div class="metric ${report.summary.failed === 0 ? 'success' : 'danger'}">${report.summary.failed}</div>
            <div>Tests Failed</div>
        </div>
        <div class="card">
            <div class="metric ${report.coverage.meets_threshold ? 'success' : 'warning'}">${report.coverage.unit}%</div>
            <div>Code Coverage</div>
        </div>
    </div>

    <div class="test-section">
        <h3>Test Results by Category</h3>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Status</th>
                    <th>Metrics</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Unit Tests</td>
                    <td class="success">${report.results.unit.passed}</td>
                    <td class="${report.results.unit.failed === 0 ? 'success' : 'danger'}">${report.results.unit.failed}</td>
                    <td><span class="badge ${report.results.unit.failed === 0 ? 'badge-success' : 'badge-danger'}">${report.results.unit.failed === 0 ? 'PASSED' : 'FAILED'}</span></td>
                    <td>Coverage: ${report.results.unit.coverage}%</td>
                </tr>
                <tr>
                    <td>Integration Tests</td>
                    <td class="success">${report.results.integration.passed}</td>
                    <td class="${report.results.integration.failed === 0 ? 'success' : 'danger'}">${report.results.integration.failed}</td>
                    <td><span class="badge ${report.results.integration.failed === 0 ? 'badge-success' : 'badge-danger'}">${report.results.integration.failed === 0 ? 'PASSED' : 'FAILED'}</span></td>
                    <td>Workflows: Complete</td>
                </tr>
                <tr>
                    <td>Security Tests</td>
                    <td class="success">${report.results.security.passed}</td>
                    <td class="${report.results.security.failed === 0 ? 'success' : 'danger'}">${report.results.security.failed}</td>
                    <td><span class="badge ${report.results.security.failed === 0 && report.results.security.vulnerabilities === 0 ? 'badge-success' : 'badge-danger'}">${report.results.security.failed === 0 && report.results.security.vulnerabilities === 0 ? 'PASSED' : 'FAILED'}</span></td>
                    <td>Vulnerabilities: ${report.results.security.vulnerabilities}</td>
                </tr>
                <tr>
                    <td>Performance Tests</td>
                    <td class="success">${report.results.performance.passed}</td>
                    <td class="${report.results.performance.failed === 0 ? 'success' : 'danger'}">${report.results.performance.failed}</td>
                    <td><span class="badge ${report.performance.meets_threshold ? 'badge-success' : 'badge-danger'}">${report.performance.meets_threshold ? 'PASSED' : 'FAILED'}</span></td>
                    <td>Avg Response: ${report.results.performance.avgResponseTime}ms</td>
                </tr>
                <tr>
                    <td>E2E Tests</td>
                    <td class="success">${report.results.e2e.passed}</td>
                    <td class="${report.results.e2e.failed === 0 ? 'success' : 'danger'}">${report.results.e2e.failed}</td>
                    <td><span class="badge ${report.results.e2e.failed === 0 ? 'badge-success' : 'badge-danger'}">${report.results.e2e.failed === 0 ? 'PASSED' : 'FAILED'}</span></td>
                    <td>Browsers: ${report.results.e2e.browsers.map(b => b.browser).join(', ')}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="test-section">
        <h3>Quality Gates</h3>
        <table>
            <thead>
                <tr>
                    <th>Gate</th>
                    <th>Threshold</th>
                    <th>Actual</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Code Coverage</td>
                    <td>≥ 95%</td>
                    <td>${report.coverage.unit}%</td>
                    <td><span class="badge ${report.coverage.meets_threshold ? 'badge-success' : 'badge-danger'}">${report.coverage.meets_threshold ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr>
                    <td>Performance</td>
                    <td>< 100ms</td>
                    <td>${report.performance.avgResponseTime}ms</td>
                    <td><span class="badge ${report.performance.meets_threshold ? 'badge-success' : 'badge-danger'}">${report.performance.meets_threshold ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr>
                    <td>Security</td>
                    <td>0 vulnerabilities</td>
                    <td>${report.security.vulnerabilities} vulnerabilities</td>
                    <td><span class="badge ${report.security.meets_threshold ? 'badge-success' : 'badge-danger'}">${report.security.meets_threshold ? 'PASS' : 'FAIL'}</span></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="test-section">
        <h3>Coverage Progress</h3>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.coverage.unit}%"></div>
        </div>
        <p>${report.coverage.unit}% / ${report.coverage.threshold}% required</p>
    </div>
</body>
</html>`;

    fs.writeFileSync(`${this.reportDir}/test-report.html`, html);
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`📊 Overall: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.successRate}%)`);
    console.log(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)} seconds`);
    console.log(`📈 Coverage: ${report.coverage.unit}% (${report.coverage.meets_threshold ? '✅' : '❌'} ${report.coverage.threshold}% required)`);
    console.log(`⚡ Performance: ${report.performance.avgResponseTime}ms avg (${report.performance.meets_threshold ? '✅' : '❌'} <100ms required)`);
    console.log(`🔒 Security: ${report.security.vulnerabilities} vulnerabilities (${report.security.meets_threshold ? '✅' : '❌'} 0 required)`);
    
    console.log('\n📋 Test Categories:');
    Object.entries(report.results).forEach(([category, result]) => {
      const status = result.failed === 0 ? '✅' : '❌';
      console.log(`   ${status} ${category}: ${result.passed} passed, ${result.failed} failed`);
    });
    
    const allGatesPassed = report.coverage.meets_threshold && 
                          report.performance.meets_threshold && 
                          report.security.meets_threshold;
    
    console.log('\n🚀 Deployment Status:');
    console.log(allGatesPassed ? '   ✅ READY FOR DEPLOYMENT' : '   ❌ NOT READY FOR DEPLOYMENT');
    
    console.log('\n📄 Reports generated:');
    console.log(`   📊 JSON: ${this.reportDir}/test-report.json`);
    console.log(`   🌐 HTML: ${this.reportDir}/test-report.html`);
    console.log('='.repeat(80));
  }

  async runAll() {
    this.log('Starting comprehensive test suite for Rawgle platform...', 'info');
    
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runSecurityTests();
    await this.runPerformanceTests();
    await this.runE2ETests();
    
    const report = this.generateReport();
    
    // Exit with error code if any tests failed or quality gates not met
    const allGatesPassed = report.coverage.meets_threshold && 
                          report.performance.meets_threshold && 
                          report.security.meets_threshold;
    
    process.exit(report.summary.failed === 0 && allGatesPassed ? 0 : 1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  if (args.includes('--help')) {
    console.log(`
Usage: node test-runner.js [options]

Options:
  --unit         Run only unit tests
  --integration  Run only integration tests
  --security     Run only security tests
  --performance  Run only performance tests
  --e2e          Run only E2E tests
  --help         Show this help message

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js --unit            # Run only unit tests
  node test-runner.js --performance     # Run only performance tests
`);
    process.exit(0);
  }

  (async () => {
    try {
      if (args.includes('--unit')) {
        await runner.runUnitTests();
      } else if (args.includes('--integration')) {
        await runner.runIntegrationTests();
      } else if (args.includes('--security')) {
        await runner.runSecurityTests();
      } else if (args.includes('--performance')) {
        await runner.runPerformanceTests();
      } else if (args.includes('--e2e')) {
        await runner.runE2ETests();
      } else {
        await runner.runAll();
      }
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = TestRunner;