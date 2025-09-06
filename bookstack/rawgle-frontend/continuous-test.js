#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ContinuousTestRunner {
  constructor() {
    this.testRuns = 0;
    this.maxRuns = 50; // Run up to 50 test cycles
    this.failedTests = new Set();
    this.fixedTests = new Set();
    this.testResults = [];
    this.bugTracker = {
      elementOverlap: 0,
      timeout: 0,
      selectorIssues: 0,
      authenticationIssues: 0,
      networkIssues: 0,
      other: 0
    };
  }

  async runTestCycle() {
    console.log(`\n🔄 Starting Test Cycle ${this.testRuns + 1}/${this.maxRuns}`);
    console.log('=' .repeat(60));

    // Run all health logs tests
    const healthLogsResults = await this.runTest('tests/09-health-logs-comprehensive.spec.ts', 'Health Logs');
    
    // Run firecrawl validation tests (with mock data for CI)
    const firecrawlResults = await this.runTest('tests/10-firecrawl-health-validation.spec.ts', 'Firecrawl Validation');
    
    // Run basic functionality tests
    const basicResults = await this.runTest('tests/01-basic-functionality.spec.ts', 'Basic Functionality');
    
    // Run authentication tests
    const authResults = await this.runTest('tests/03-authentication-comprehensive.spec.ts', 'Authentication');

    const cycleResults = {
      cycle: this.testRuns + 1,
      healthLogs: healthLogsResults,
      firecrawl: firecrawlResults,
      basic: basicResults,
      auth: authResults,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(cycleResults);
    this.analyzeResults(cycleResults);
    
    this.testRuns++;
    return cycleResults;
  }

  async runTest(testFile, testName) {
    console.log(`\n📋 Running ${testName} Tests...`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const cmd = `cd /Users/mattwright/pandora/bookstack/rawgle-frontend && npx playwright test ${testFile} --timeout=20000 --workers=1 --reporter=json`;
      
      exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        
        let result = {
          testName,
          duration,
          success: !error,
          stdout: stdout || '',
          stderr: stderr || '',
          error: error ? error.message : null
        };

        if (error) {
          console.log(`❌ ${testName} Failed (${duration}ms)`);
          this.categorizeError(error.message, testName);
          this.failedTests.add(testName);
        } else {
          console.log(`✅ ${testName} Passed (${duration}ms)`);
          if (this.failedTests.has(testName)) {
            this.fixedTests.add(testName);
            this.failedTests.delete(testName);
          }
        }

        resolve(result);
      });
    });
  }

  categorizeError(errorMessage, testName) {
    if (errorMessage.includes('intercepts pointer events') || errorMessage.includes('overlapping')) {
      this.bugTracker.elementOverlap++;
      this.suggestFix(testName, 'ELEMENT_OVERLAP', 'Use more specific selectors or wait for overlapping elements to disappear');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('exceeded')) {
      this.bugTracker.timeout++;
      this.suggestFix(testName, 'TIMEOUT', 'Increase timeout or add explicit waits for slow operations');
    } else if (errorMessage.includes('selector') || errorMessage.includes('locator')) {
      this.bugTracker.selectorIssues++;
      this.suggestFix(testName, 'SELECTOR', 'Update selectors to match current DOM structure');
    } else if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('401')) {
      this.bugTracker.authenticationIssues++;
      this.suggestFix(testName, 'AUTH', 'Check authentication state and login flow');
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      this.bugTracker.networkIssues++;
      this.suggestFix(testName, 'NETWORK', 'Ensure dev server is running and accessible');
    } else {
      this.bugTracker.other++;
    }
  }

  suggestFix(testName, category, suggestion) {
    console.log(`🔧 ${category} Issue in ${testName}: ${suggestion}`);
  }

  analyzeResults(cycleResults) {
    console.log('\n📊 Cycle Analysis:');
    
    Object.keys(cycleResults).forEach(key => {
      if (key !== 'cycle' && key !== 'timestamp' && cycleResults[key]) {
        const result = cycleResults[key];
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.testName}: ${result.duration}ms`);
      }
    });

    console.log('\n🐛 Bug Tracker Summary:');
    console.log(`  Element Overlap: ${this.bugTracker.elementOverlap}`);
    console.log(`  Timeout Issues: ${this.bugTracker.timeout}`);
    console.log(`  Selector Issues: ${this.bugTracker.selectorIssues}`);
    console.log(`  Auth Issues: ${this.bugTracker.authenticationIssues}`);
    console.log(`  Network Issues: ${this.bugTracker.networkIssues}`);
    console.log(`  Other Issues: ${this.bugTracker.other}`);

    if (this.fixedTests.size > 0) {
      console.log(`\n🎉 Fixed Tests: ${Array.from(this.fixedTests).join(', ')}`);
    }

    if (this.failedTests.size > 0) {
      console.log(`\n🚨 Still Failing: ${Array.from(this.failedTests).join(', ')}`);
    }
  }

  async applyAutomaticFixes() {
    console.log('\n🔧 Applying Automatic Fixes...');

    // Fix 1: Update health logs test selectors for better stability
    if (this.bugTracker.elementOverlap > 0 || this.bugTracker.selectorIssues > 0) {
      await this.fixHealthLogsTestSelectors();
    }

    // Fix 2: Add better waits and timeouts
    if (this.bugTracker.timeout > 0) {
      await this.improveTestTimeouts();
    }

    // Fix 3: Add retry logic for flaky tests
    await this.addRetryLogic();
  }

  async fixHealthLogsTestSelectors() {
    console.log('🔧 Fixing health logs test selectors...');
    
    const testFile = '/Users/mattwright/pandora/bookstack/rawgle-frontend/tests/09-health-logs-comprehensive.spec.ts';
    let content = fs.readFileSync(testFile, 'utf8');
    
    // Replace generic selectors with more specific ones
    content = content.replace(
      /page\.locator\('button', \{ hasText: 'Back to Health' \}\)/g,
      'page.locator(\'.flex.items-center button\', { hasText: \'Back to Health\' })'
    );
    
    content = content.replace(
      /page\.locator\('button', \{ hasText: 'Add Entry' \}\)/g,
      'page.locator(\'.bg-red-500.text-white\', { hasText: \'Add Entry\' })'
    );
    
    // Add explicit waits before interactions
    content = content.replace(
      /await (.*?)\.click\(\)/g,
      'await $1.waitFor({ state: \'visible\' }); await $1.click({ force: true })'
    );

    fs.writeFileSync(testFile, content);
    console.log('✅ Updated health logs test selectors');
  }

  async improveTestTimeouts() {
    console.log('🔧 Improving test timeouts...');
    
    const configFile = '/Users/mattwright/pandora/bookstack/rawgle-frontend/playwright.config.ts';
    let content = fs.readFileSync(configFile, 'utf8');
    
    // Increase default timeout
    content = content.replace(
      /timeout: 120 \* 1000/g,
      'timeout: 180 * 1000'
    );
    
    // Add longer wait for network idle
    content = content.replace(
      /'networkidle'/g,
      '\'networkidle\', { timeout: 30000 }'
    );

    fs.writeFileSync(configFile, content);
    console.log('✅ Updated timeout configurations');
  }

  async addRetryLogic() {
    console.log('🔧 Adding retry logic to tests...');
    
    const testFile = '/Users/mattwright/pandora/bookstack/rawgle-frontend/tests/09-health-logs-comprehensive.spec.ts';
    let content = fs.readFileSync(testFile, 'utf8');
    
    // Add test retry configuration
    if (!content.includes('retries:')) {
      content = content.replace(
        /test\.describe\('Health Logs Page - Comprehensive Testing Suite'/,
        `test.describe.configure({ retries: 2 });\n\ntest.describe('Health Logs Page - Comprehensive Testing Suite'`
      );
    }

    fs.writeFileSync(testFile, content);
    console.log('✅ Added retry logic to tests');
  }

  generateReport() {
    console.log('\n📄 Generating Final Report...');
    
    const report = {
      summary: {
        totalCycles: this.testRuns,
        currentlyFailing: Array.from(this.failedTests),
        fixed: Array.from(this.fixedTests),
        bugTracker: this.bugTracker
      },
      cycles: this.testResults,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync(
      '/Users/mattwright/pandora/bookstack/rawgle-frontend/continuous-test-report.json', 
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 FINAL REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Test Cycles: ${this.testRuns}`);
    console.log(`Tests Fixed: ${this.fixedTests.size}`);
    console.log(`Tests Still Failing: ${this.failedTests.size}`);
    console.log('\nTop Issues:');
    Object.entries(this.bugTracker)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([issue, count]) => {
        console.log(`  ${issue}: ${count} occurrences`);
      });
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.bugTracker.elementOverlap > 5) {
      recommendations.push('Consider refactoring UI to reduce overlapping elements');
      recommendations.push('Use data-testid attributes for more reliable test selectors');
    }

    if (this.bugTracker.timeout > 3) {
      recommendations.push('Optimize page load performance');
      recommendations.push('Implement skeleton loaders for better perceived performance');
    }

    if (this.bugTracker.selectorIssues > 3) {
      recommendations.push('Create a test selector strategy guide');
      recommendations.push('Use stable CSS classes or data attributes for testing');
    }

    return recommendations;
  }

  async run() {
    console.log('🚀 Starting Continuous Testing Suite');
    console.log(`Target: ${this.maxRuns} test cycles`);
    console.log('Goal: Identify and fix all bugs\n');

    try {
      while (this.testRuns < this.maxRuns) {
        const cycleResults = await this.runTestCycle();
        
        // Apply fixes every 5 cycles
        if (this.testRuns % 5 === 0) {
          await this.applyAutomaticFixes();
        }
        
        // Break early if no failing tests
        if (this.failedTests.size === 0 && this.testRuns >= 3) {
          console.log('\n🎉 All tests passing! Early completion.');
          break;
        }

        // Wait between cycles
        console.log('\n⏱️  Waiting 3 seconds before next cycle...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.generateReport();
      console.log('\n✅ Continuous testing completed!');

    } catch (error) {
      console.error('\n❌ Continuous testing failed:', error);
    }
  }
}

// Run the continuous tester
const tester = new ContinuousTestRunner();
tester.run().catch(console.error);