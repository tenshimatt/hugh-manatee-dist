#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const API_URL = process.env.TEST_MANAGEMENT_API || 'http://localhost:8787';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token';

// Test suite configurations
const TEST_SUITES = {
  unit: {
    command: 'npm run test:unit',
    type: 'unit',
    description: 'Unit tests'
  },
  integration: {
    command: 'npm run test:integration',
    type: 'integration',
    description: 'Integration tests'
  },
  e2e: {
    command: 'npm run test:e2e',
    type: 'e2e',
    description: 'End-to-end tests'
  },
  security: {
    command: 'npm run test:security',
    type: 'security',
    description: 'Security tests'
  },
  performance: {
    command: 'npm run test:load',
    type: 'performance',
    description: 'Performance tests'
  },
  all: {
    command: null,
    type: 'all',
    description: 'All test suites'
  }
};

class TestRunner {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      reportToApi: true,
      ...options
    };
    this.runId = this.generateRunId();
    this.startTime = new Date().toISOString();
  }

  generateRunId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const commitShort = commit.substring(0, 8);
      return { branch, commit, commitShort };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown', commitShort: 'unknown' };
    }
  }

  async reportToApi(data) {
    if (!this.options.reportToApi) return;

    try {
      const response = await fetch(`${API_URL}/api/test-management/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': ADMIN_TOKEN
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.warn(`Failed to report to API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Failed to report to API: ${error.message}`);
    }
  }

  parseVitestOutput(output) {
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null,
      errors: [],
      warnings: []
    };

    try {
      // Parse test results
      const testResultMatch = output.match(/Tests\\s+(\\d+)\\s+passed\\s*(?:\\|(\\d+)\\s+failed)?\\s*(?:\\|(\\d+)\\s+skipped)?/);
      if (testResultMatch) {
        results.passed = parseInt(testResultMatch[1]) || 0;
        results.failed = parseInt(testResultMatch[2]) || 0;
        results.skipped = parseInt(testResultMatch[3]) || 0;
      }

      // Parse coverage
      const coverageMatch = output.match(/All files\\s*\\|\\s*(\\d+\\.\\d+)\\s*\\|\\s*(\\d+\\.\\d+)\\s*\\|\\s*(\\d+\\.\\d+)\\s*\\|\\s*(\\d+\\.\\d+)/);
      if (coverageMatch) {
        results.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }

      // Extract errors and warnings
      const errorMatches = output.match(/Error:.*$/gm);
      if (errorMatches) {
        results.errors = errorMatches.map(error => error.trim());
      }

      const warningMatches = output.match(/Warning:.*$/gm);
      if (warningMatches) {
        results.warnings = warningMatches.map(warning => warning.trim());
      }

    } catch (error) {
      console.warn('Failed to parse test output:', error.message);
    }

    return results;
  }

  async runTestSuite(suiteName) {
    const suite = TEST_SUITES[suiteName];
    if (!suite) {
      throw new Error(`Unknown test suite: ${suiteName}`);
    }

    console.log(`\\n🧪 Running ${suite.description}...`);

    const gitInfo = await this.getGitInfo();
    const suiteRunId = `${this.runId}-${suiteName}`;

    // Report test start
    await this.reportToApi({
      runId: suiteRunId,
      testSuite: suiteName,
      testType: suite.type,
      status: 'running',
      startTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      branch: gitInfo.branch,
      commit: gitInfo.commit,
      metadata: {
        command: suite.command,
        nodeVersion: process.version,
        platform: process.platform
      }
    });

    const startTime = Date.now();
    let output = '';
    let status = 'passed';
    let results = { passed: 0, failed: 0, skipped: 0 };

    try {
      if (this.options.verbose) {
        console.log(`Command: ${suite.command}`);
      }

      // Execute test command
      output = execSync(suite.command, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      // Parse output for results
      results = this.parseVitestOutput(output);
      status = results.failed > 0 ? 'failed' : 'passed';

    } catch (error) {
      status = 'failed';
      results.errors = results.errors || [];
      results.errors.push(error.message);
      output = error.stdout || error.message;

      if (error.stdout) {
        const parsedResults = this.parseVitestOutput(error.stdout);
        results = { ...results, ...parsedResults };
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Report test completion
    await this.reportToApi({
      runId: suiteRunId,
      testSuite: suiteName,
      testType: suite.type,
      status,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      coverage: results.coverage,
      environment: process.env.NODE_ENV || 'development',
      branch: gitInfo.branch,
      commit: gitInfo.commit,
      errors: results.errors,
      warnings: results.warnings,
      metadata: {
        command: suite.command,
        nodeVersion: process.version,
        platform: process.platform,
        output: this.options.verbose ? null : output // Only store output if not verbose
      }
    });

    // Print summary
    const statusIcon = status === 'passed' ? '✅' : '❌';
    const durationStr = `${Math.round(duration / 1000)}s`;
    
    console.log(`${statusIcon} ${suite.description} ${status} in ${durationStr}`);
    
    if (results.coverage) {
      console.log(`   Coverage: ${results.coverage.statements}% statements, ${results.coverage.lines}% lines`);
    }
    
    console.log(`   Results: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);

    if (results.errors.length > 0 && !this.options.verbose) {
      console.log('   Errors:');
      results.errors.forEach(error => console.log(`     - ${error}`));
    }

    return {
      suite: suiteName,
      status,
      duration,
      results,
      coverage: results.coverage
    };
  }

  async runAllSuites(suites) {
    console.log(`🚀 Starting test run: ${this.runId}`);
    console.log(`Branch: ${(await this.getGitInfo()).branch}`);
    console.log(`Commit: ${(await this.getGitInfo()).commitShort}`);

    const suitesToRun = suites || ['unit', 'integration', 'e2e'];
    const results = [];

    for (const suiteName of suitesToRun) {
      try {
        const result = await this.runTestSuite(suiteName);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to run ${suiteName} tests: ${error.message}`);
        results.push({
          suite: suiteName,
          status: 'failed',
          duration: 0,
          results: { passed: 0, failed: 1, skipped: 0 },
          error: error.message
        });
      }
    }

    // Summary
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.results.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.results.failed, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.results.skipped, 0);
    const overallStatus = results.some(r => r.status === 'failed') ? 'failed' : 'passed';

    console.log(`\\n📊 Test Run Summary`);
    console.log(`Run ID: ${this.runId}`);
    console.log(`Overall Status: ${overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Total Tests: ${totalPassed + totalFailed + totalSkipped}`);
    console.log(`  - Passed: ${totalPassed}`);
    console.log(`  - Failed: ${totalFailed}`);
    console.log(`  - Skipped: ${totalSkipped}`);

    // Report overall results
    const gitInfo = await this.getGitInfo();
    await this.reportToApi({
      runId: this.runId,
      testSuite: 'all',
      testType: 'all',
      status: overallStatus,
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      duration: totalDuration,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      environment: process.env.NODE_ENV || 'development',
      branch: gitInfo.branch,
      commit: gitInfo.commit,
      metadata: {
        suites: results.map(r => ({ 
          suite: r.suite, 
          status: r.status, 
          duration: r.duration 
        })),
        nodeVersion: process.version,
        platform: process.platform
      }
    });

    return {
      runId: this.runId,
      status: overallStatus,
      results,
      totalDuration,
      totalPassed,
      totalFailed,
      totalSkipped
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    reportToApi: !args.includes('--no-report'),
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`
🧪 Rawgle Test Runner

Usage: node scripts/test-runner.js [command] [options]

Commands:
  all                Run all test suites (default)
  unit               Run unit tests only
  integration        Run integration tests only
  e2e                Run end-to-end tests only
  security           Run security tests only
  performance        Run performance tests only

Options:
  --verbose, -v      Show verbose output
  --no-report        Don't report to test management API
  --suite=name       Run specific test suite
  --help, -h         Show this help message

Examples:
  node scripts/test-runner.js
  node scripts/test-runner.js unit --verbose
  node scripts/test-runner.js --suite=integration
  node scripts/test-runner.js all --no-report

Environment Variables:
  TEST_MANAGEMENT_API    API URL for test management (default: http://localhost:8787)
  ADMIN_TOKEN           Admin token for API authentication
  NODE_ENV              Environment (development, staging, production)
    `);
    process.exit(0);
  }

  const runner = new TestRunner(options);

  try {
    let result;

    if (options.suite) {
      result = await runner.runTestSuite(options.suite);
    } else if (command === 'all' || !TEST_SUITES[command]) {
      result = await runner.runAllSuites(command === 'all' ? undefined : [command]);
    } else {
      result = await runner.runTestSuite(command);
    }

    // Exit with appropriate code
    const exitCode = (result.status || result.results?.[0]?.status) === 'passed' ? 0 : 1;
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    
    if (options.verbose) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default TestRunner;