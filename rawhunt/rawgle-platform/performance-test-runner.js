#!/usr/bin/env node

/**
 * Performance Test Runner for Rawgle Platform
 * Tests API response times, concurrent loads, and system performance
 */

class PerformanceTestRunner {
  constructor() {
    this.API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    this.results = [];
    this.startTime = Date.now();
  }

  async runPerformanceTests() {
    console.log('⚡ Starting Performance Test Suite');
    console.log('=' .repeat(50));
    
    await this.testAPIResponseTimes();
    await this.testConcurrentRequests();
    await this.testLoadCapacity();
    await this.testEndpointPerformance();
    
    this.generatePerformanceReport();
  }

  async testAPIResponseTimes() {
    console.log('\n🕐 Testing API Response Times...');
    
    const endpoints = [
      { name: 'Health Check', path: '/api/health', target: 100 },
      { name: 'User Registration', path: '/api/auth/register', method: 'POST', target: 500 },
      { name: 'User Login', path: '/api/auth/login', method: 'POST', target: 300 },
      { name: 'PAWS Balance', path: '/api/paws/balance', target: 200 },
      { name: 'Suppliers List', path: '/api/suppliers', target: 300 }
    ];

    for (const endpoint of endpoints) {
      const times = [];
      const testCount = 5;
      
      console.log(`  Testing ${endpoint.name}...`);
      
      for (let i = 0; i < testCount; i++) {
        try {
          const startTime = Date.now();
          
          const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
            method: endpoint.method || 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            ...(endpoint.method === 'POST' && {
              body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpass'
              })
            })
          });
          
          const duration = Date.now() - startTime;
          times.push(duration);
          
        } catch (error) {
          times.push(5000); // Penalty for errors
        }
        
        // Brief pause between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      const passed = avgTime <= endpoint.target;
      
      this.results.push({
        category: 'Response Time',
        name: endpoint.name,
        status: passed ? 'passed' : 'failed',
        avgTime: Math.round(avgTime),
        maxTime,
        minTime,
        target: endpoint.target,
        details: `Avg: ${Math.round(avgTime)}ms (target: ${endpoint.target}ms)`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${endpoint.name}: ${Math.round(avgTime)}ms (target: ${endpoint.target}ms)`);
    }
  }

  async testConcurrentRequests() {
    console.log('\n🔄 Testing Concurrent Request Handling...');
    
    const concurrencyLevels = [5, 10, 25];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`  Testing ${concurrency} concurrent requests...`);
      
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < concurrency; i++) {
        promises.push(
          fetch(`${this.API_BASE}/api/health?concurrent=${i}&timestamp=${Date.now()}`)
            .then(response => ({
              success: response.ok,
              status: response.status,
              time: Date.now() - startTime
            }))
            .catch(error => ({
              success: false,
              error: error.message,
              time: Date.now() - startTime
            }))
        );
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const successRate = (successful / concurrency) * 100;
      
      const passed = successRate >= 90; // 90% success rate threshold
      
      this.results.push({
        category: 'Concurrency',
        name: `${concurrency} Concurrent Requests`,
        status: passed ? 'passed' : 'failed',
        successRate: Math.round(successRate),
        avgTime: Math.round(avgTime),
        details: `${successful}/${concurrency} successful (${Math.round(successRate)}%)`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${concurrency} concurrent: ${successful}/${concurrency} successful (${Math.round(successRate)}%)`);
    }
  }

  async testLoadCapacity() {
    console.log('\n📈 Testing Load Capacity...');
    
    // Sustained load test
    console.log('  Testing sustained load...');
    
    const loadTestDuration = 10000; // 10 seconds
    const requestInterval = 100; // Request every 100ms
    const startTime = Date.now();
    const requests = [];
    
    while (Date.now() - startTime < loadTestDuration) {
      const requestStart = Date.now();
      
      requests.push(
        fetch(`${this.API_BASE}/api/health?load-test=${Date.now()}`)
          .then(response => ({
            success: response.ok,
            time: Date.now() - requestStart,
            timestamp: Date.now()
          }))
          .catch(error => ({
            success: false,
            time: Date.now() - requestStart,
            error: error.message,
            timestamp: Date.now()
          }))
      );
      
      await new Promise(resolve => setTimeout(resolve, requestInterval));
    }
    
    const results = await Promise.all(requests);
    const successful = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const requestsPerSecond = (results.length / (loadTestDuration / 1000)).toFixed(1);
    
    const passed = successful / results.length >= 0.95; // 95% success rate
    
    this.results.push({
      category: 'Load',
      name: 'Sustained Load Test',
      status: passed ? 'passed' : 'failed',
      totalRequests: results.length,
      successful,
      avgResponseTime: Math.round(avgResponseTime),
      requestsPerSecond: parseFloat(requestsPerSecond),
      details: `${successful}/${results.length} successful, ${requestsPerSecond} req/s`
    });
    
    console.log(`    ${passed ? '✅' : '❌'} Sustained Load: ${successful}/${results.length} successful, ${requestsPerSecond} req/s`);
  }

  async testEndpointPerformance() {
    console.log('\n🎯 Testing Critical Endpoint Performance...');
    
    // Test database-heavy endpoints
    const endpoints = [
      { name: 'User Authentication', path: '/api/auth/login', method: 'POST' },
      { name: 'PAWS Transaction', path: '/api/paws/transfer', method: 'POST' },
      { name: 'Supplier Search', path: '/api/suppliers?query=food' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      
      const times = [];
      for (let i = 0; i < 3; i++) {
        try {
          const startTime = Date.now();
          
          await fetch(`${this.API_BASE}${endpoint.path}`, {
            method: endpoint.method || 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            ...(endpoint.method === 'POST' && {
              body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpass',
                amount: 10,
                toUserId: 'test-user'
              })
            })
          });
          
          times.push(Date.now() - startTime);
        } catch (error) {
          times.push(1000); // Penalty time
        }
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const passed = avgTime < 1000; // 1 second threshold
      
      this.results.push({
        category: 'Endpoint Performance',
        name: endpoint.name,
        status: passed ? 'passed' : 'failed',
        avgTime: Math.round(avgTime),
        details: `Average: ${Math.round(avgTime)}ms`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${endpoint.name}: ${Math.round(avgTime)}ms`);
    }
  }

  generatePerformanceReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('⚡ PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));
    
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    
    console.log(`\n📊 Performance Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Test Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    console.log('\n📂 Results by Category:');
    
    for (const [category, tests] of Object.entries(categories)) {
      const categoryPassed = tests.filter(t => t.status === 'passed').length;
      const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(1);
      
      console.log(`\n   ${category}:`);
      console.log(`     Success Rate: ${categoryRate}% (${categoryPassed}/${tests.length})`);
      
      tests.forEach(test => {
        const status = test.status === 'passed' ? '✅' : '❌';
        console.log(`     ${status} ${test.name}: ${test.details}`);
      });
    }

    // Performance benchmarks
    console.log('\n🎯 Performance Benchmarks:');
    
    const responseTimeTests = this.results.filter(r => r.category === 'Response Time');
    if (responseTimeTests.length > 0) {
      const avgResponseTime = responseTimeTests.reduce((sum, t) => sum + t.avgTime, 0) / responseTimeTests.length;
      console.log(`   📊 Average API Response Time: ${Math.round(avgResponseTime)}ms`);
      
      const meetingTargets = responseTimeTests.filter(t => t.status === 'passed').length;
      console.log(`   🎯 APIs Meeting Performance Targets: ${meetingTargets}/${responseTimeTests.length}`);
    }
    
    const concurrencyTests = this.results.filter(r => r.category === 'Concurrency');
    if (concurrencyTests.length > 0) {
      const maxConcurrency = Math.max(...concurrencyTests.map(t => parseInt(t.name.split(' ')[0])));
      const maxConcurrencyResult = concurrencyTests.find(t => t.name.includes(maxConcurrency.toString()));
      
      console.log(`   🔄 Maximum Tested Concurrency: ${maxConcurrency} requests`);
      if (maxConcurrencyResult) {
        console.log(`   📈 Success Rate at Max Concurrency: ${maxConcurrencyResult.successRate}%`);
      }
    }
    
    const loadTests = this.results.filter(r => r.category === 'Load');
    if (loadTests.length > 0) {
      const loadTest = loadTests[0];
      console.log(`   🚀 Sustained Load Capacity: ${loadTest.requestsPerSecond} req/s`);
      console.log(`   ⏱️  Average Response Under Load: ${loadTest.avgResponseTime}ms`);
    }

    console.log('\n🏆 Performance Rating:');
    
    const performanceScore = this.calculatePerformanceScore();
    console.log(`   📊 Overall Performance Score: ${performanceScore}/100`);
    
    if (performanceScore >= 90) {
      console.log(`   🟢 EXCELLENT - System performance exceeds expectations`);
    } else if (performanceScore >= 75) {
      console.log(`   🟡 GOOD - System performance meets requirements`);
    } else if (performanceScore >= 60) {
      console.log(`   🟠 FAIR - Performance issues detected, optimization needed`);
    } else {
      console.log(`   🔴 POOR - Critical performance issues require immediate attention`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('End of Performance Test Report');
    console.log('='.repeat(60));
  }

  calculatePerformanceScore() {
    const weights = {
      'Response Time': 40,
      'Concurrency': 30,
      'Load': 20,
      'Endpoint Performance': 10
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });
    
    for (const [category, tests] of Object.entries(categories)) {
      if (weights[category]) {
        const categoryPassed = tests.filter(t => t.status === 'passed').length;
        const categoryRate = (categoryPassed / tests.length) * 100;
        
        totalScore += categoryRate * weights[category];
        totalWeight += weights[category];
      }
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new PerformanceTestRunner();
  runner.runPerformanceTests().catch(console.error);
}

export { PerformanceTestRunner };