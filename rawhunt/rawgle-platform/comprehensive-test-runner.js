#!/usr/bin/env node

/**
 * Comprehensive Rawgle Platform Test Runner
 * Executes all test categories and generates detailed reports
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ComprehensiveTestRunner {
  constructor() {
    this.testResults = [];
    this.categories = {
      'Infrastructure': [],
      'Authentication': [],
      'PAWS': [],
      'Security': [],
      'Performance': [],
      'Integration': [],
      'API': []
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Rawgle Platform Test Suite');
    console.log('=' .repeat(60));
    
    // Load and execute test scripts
    await this.loadTestScripts();
    await this.executeTests();
    await this.generateReport();
  }

  async loadTestScripts() {
    const testScriptsDir = join(__dirname, 'rawgle-pure/tests/test-scripts');
    
    try {
      const files = await readdir(testScriptsDir);
      const jsFiles = files.filter(f => f.endsWith('.js')).sort();
      
      console.log(`📂 Found ${jsFiles.length} test scripts`);
      
      for (const file of jsFiles) {
        try {
          const filePath = join(testScriptsDir, file);
          const module = await import(`file://${filePath}`);
          if (module.default && typeof module.default.execute === 'function') {
            this.testResults.push({
              file,
              test: module.default,
              status: 'pending'
            });
          }
        } catch (error) {
          console.log(`⚠️  Failed to load ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load test scripts: ${error.message}`);
    }
  }

  async executeTests() {
    let passed = 0;
    let failed = 0;
    let executed = 0;
    
    console.log(`\n🧪 Executing ${this.testResults.length} tests...\n`);
    
    for (const testItem of this.testResults) {
      const { test, file } = testItem;
      executed++;
      
      console.log(`[${executed}/${this.testResults.length}] ${test.name || file}`);
      
      try {
        const startTime = Date.now();
        const results = await test.execute();
        const duration = Date.now() - startTime;
        
        const testPassed = results.every(r => r.status === 'passed');
        
        testItem.status = testPassed ? 'passed' : 'failed';
        testItem.results = results;
        testItem.duration = duration;
        
        if (testPassed) {
          passed++;
          console.log(`  ✅ PASSED (${duration}ms)`);
        } else {
          failed++;
          console.log(`  ❌ FAILED (${duration}ms)`);
          // Show first failure reason
          const firstFailure = results.find(r => r.status === 'failed');
          if (firstFailure) {
            console.log(`     ${firstFailure.details}`);
          }
        }
        
        // Categorize test
        const category = test.category || 'Other';
        if (!this.categories[category]) {
          this.categories[category] = [];
        }
        this.categories[category].push(testItem);
        
      } catch (error) {
        testItem.status = 'error';
        testItem.error = error.message;
        failed++;
        console.log(`  💥 ERROR: ${error.message}`);
      }
      
      // Brief pause to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Test Execution Complete:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const errorTests = this.testResults.filter(t => t.status === 'error').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE RAWGLE PLATFORM TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📈 OVERALL METRICS:');
    console.log(`   Total Tests Executed: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   💥 Errors: ${errorTests}`);
    console.log(`   🎯 Success Rate: ${successRate}%`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    
    console.log('\n📂 RESULTS BY CATEGORY:');
    
    for (const [category, tests] of Object.entries(this.categories)) {
      if (tests.length > 0) {
        const categoryPassed = tests.filter(t => t.status === 'passed').length;
        const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(1);
        
        console.log(`\n   ${category}:`);
        console.log(`     Tests: ${tests.length}`);
        console.log(`     Passed: ${categoryPassed}`);
        console.log(`     Success Rate: ${categoryRate}%`);
        
        // Show failed tests
        const failed = tests.filter(t => t.status === 'failed' || t.status === 'error');
        if (failed.length > 0) {
          console.log(`     Failed Tests:`);
          failed.forEach(test => {
            console.log(`       - ${test.test.name || test.file} (${test.status})`);
          });
        }
      }
    }
    
    console.log('\n🏥 SYSTEM HEALTH ASSESSMENT:');
    
    // Critical infrastructure tests
    const infraTests = this.categories['Infrastructure'] || [];
    const infraPassed = infraTests.filter(t => t.status === 'passed').length;
    const infraRate = infraTests.length > 0 ? (infraPassed / infraTests.length) * 100 : 0;
    
    console.log(`   🔧 Infrastructure Health: ${infraRate.toFixed(1)}% (${infraPassed}/${infraTests.length})`);
    
    // Authentication system
    const authTests = this.categories['Authentication'] || [];
    const authPassed = authTests.filter(t => t.status === 'passed').length;
    const authRate = authTests.length > 0 ? (authPassed / authTests.length) * 100 : 0;
    
    console.log(`   🔐 Authentication System: ${authRate.toFixed(1)}% (${authPassed}/${authTests.length})`);
    
    // PAWS system
    const pawsTests = this.categories['PAWS'] || [];
    const pawsPassed = pawsTests.filter(t => t.status === 'passed').length;
    const pawsRate = pawsTests.length > 0 ? (pawsPassed / pawsTests.length) * 100 : 0;
    
    console.log(`   🐾 PAWS System: ${pawsRate.toFixed(1)}% (${pawsPassed}/${pawsTests.length})`);
    
    // Security tests
    const securityTests = this.categories['Security'] || [];
    const securityPassed = securityTests.filter(t => t.status === 'passed').length;
    const securityRate = securityTests.length > 0 ? (securityPassed / securityTests.length) * 100 : 0;
    
    console.log(`   🛡️  Security: ${securityRate.toFixed(1)}% (${securityPassed}/${securityTests.length})`);
    
    console.log('\n🚀 PRODUCTION READINESS ASSESSMENT:');
    
    const readinessScore = this.calculateReadinessScore();
    console.log(`   📊 Overall Readiness Score: ${readinessScore}/100`);
    
    if (readinessScore >= 95) {
      console.log(`   🟢 READY FOR PRODUCTION - All systems operational`);
    } else if (readinessScore >= 85) {
      console.log(`   🟡 CAUTION - Minor issues detected, review recommended`);
    } else {
      console.log(`   🔴 NOT READY - Critical issues require resolution`);
    }
    
    console.log('\n🔍 KEY FINDINGS:');
    await this.analyzeCriticalFailures();
    
    console.log('\n' + '='.repeat(80));
    console.log('End of Comprehensive Test Report');
    console.log('='.repeat(80));
  }

  calculateReadinessScore() {
    // Weight categories by importance
    const weights = {
      'Infrastructure': 30,
      'Authentication': 25,
      'Security': 20,
      'PAWS': 15,
      'Performance': 5,
      'Integration': 3,
      'API': 2
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, tests] of Object.entries(this.categories)) {
      if (tests.length > 0 && weights[category]) {
        const categoryPassed = tests.filter(t => t.status === 'passed').length;
        const categoryRate = (categoryPassed / tests.length) * 100;
        
        totalScore += categoryRate * weights[category];
        totalWeight += weights[category];
      }
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  async analyzeCriticalFailures() {
    const criticalFailures = this.testResults.filter(t => 
      (t.status === 'failed' || t.status === 'error') && 
      (t.test.priority === 'Critical' || t.test.category === 'Infrastructure')
    );
    
    if (criticalFailures.length === 0) {
      console.log(`   ✅ No critical failures detected`);
      return;
    }
    
    console.log(`   ⚠️  ${criticalFailures.length} critical failures detected:`);
    
    criticalFailures.forEach(failure => {
      console.log(`     - ${failure.test.name || failure.file}`);
      if (failure.error) {
        console.log(`       Error: ${failure.error}`);
      } else if (failure.results) {
        const failedStep = failure.results.find(r => r.status === 'failed');
        if (failedStep) {
          console.log(`       Issue: ${failedStep.details}`);
        }
      }
    });
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests().catch(console.error);
}

export { ComprehensiveTestRunner };