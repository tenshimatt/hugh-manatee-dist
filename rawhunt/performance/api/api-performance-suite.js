/**
 * GoHunta API Performance Testing Suite
 * Tests backend API performance, database query optimization, and Cloudflare Workers efficiency
 * Focuses on <500ms response times and handling 50+ concurrent users
 */

export class APIPerformanceSuite {
  constructor(baseURL = process.env.API_BASE_URL || 'http://localhost:8787') {
    this.baseURL = baseURL;
    this.authToken = process.env.TEST_AUTH_TOKEN || 'test-token';
    
    this.metrics = {
      responseeTimes: [],
      databaseQueryTimes: [],
      concurrentUserResults: [],
      cachingEfficiency: [],
      rateLimitingResults: []
    };
    
    // Performance thresholds based on spec
    this.thresholds = {
      apiResponseTime: 300, // 300ms for 95th percentile
      databaseQueryTime: 100, // 100ms for 95th percentile
      concurrentUsers: 50, // Must handle 50+ concurrent users
      cacheHitRatio: 0.90, // 90% cache hit ratio
      errorRateThreshold: 0.001 // 0.1% error rate max
    };
    
    // Critical API endpoints for performance testing
    this.endpoints = [
      { path: '/api/auth/login', method: 'POST', critical: true, expectedTime: 200 },
      { path: '/api/auth/refresh', method: 'POST', critical: true, expectedTime: 100 },
      { path: '/api/users/profile', method: 'GET', critical: true, expectedTime: 150 },
      { path: '/api/dogs', method: 'GET', critical: true, expectedTime: 200 },
      { path: '/api/dogs/:id', method: 'GET', critical: true, expectedTime: 100 },
      { path: '/api/hunt-logs', method: 'GET', critical: true, expectedTime: 250 },
      { path: '/api/hunt-logs', method: 'POST', critical: true, expectedTime: 300 },
      { path: '/api/hunt-logs/:id', method: 'GET', critical: false, expectedTime: 150 },
      { path: '/api/gear', method: 'GET', critical: false, expectedTime: 200 },
      { path: '/api/routes', method: 'GET', critical: false, expectedTime: 300 },
      { path: '/api/routes/:id', method: 'GET', critical: false, expectedTime: 150 },
      { path: '/api/events', method: 'GET', critical: false, expectedTime: 200 },
      { path: '/api/community/posts', method: 'GET', critical: false, expectedTime: 250 },
      { path: '/api/training/sessions', method: 'GET', critical: false, expectedTime: 200 },
      { path: '/api/analytics/performance', method: 'POST', critical: false, expectedTime: 100 }
    ];
  }

  /**
   * Test individual API endpoint performance
   */
  async testEndpointPerformance() {
    console.log('Testing API endpoint performance...');
    
    const results = [];
    
    for (const endpoint of this.endpoints) {
      const endpointResults = await this.measureEndpoint(endpoint);
      results.push(endpointResults);
      
      // Store metrics
      this.metrics.responseeTimes.push(...endpointResults.responseTimes);
      
      // Validate performance
      if (endpoint.critical) {
        if (endpointResults.p95ResponseTime > this.thresholds.apiResponseTime) {
          throw new Error(`Critical endpoint ${endpoint.path} P95 response time ${endpointResults.p95ResponseTime}ms exceeds threshold ${this.thresholds.apiResponseTime}ms`);
        }
      }
    }
    
    return results;
  }

  async measureEndpoint(endpoint, iterations = 20) {
    const responseTimes = [];
    const errors = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        // Prepare request based on endpoint
        const requestData = this.generateRequestData(endpoint);
        const response = await fetch(`${this.baseURL}${endpoint.path}`, requestData);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
          responseTimes.push(responseTime);
        } else {
          errors.push({
            status: response.status,
            statusText: response.statusText,
            responseTime
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        errors.push({
          error: error.message,
          responseTime: 5000 // Timeout/error penalty
        });
      }
    }
    
    // Calculate statistics
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
    
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);
    
    const successRate = (responseTimes.length / iterations) * 100;
    const errorRate = (errors.length / iterations) * 100;
    
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      critical: endpoint.critical,
      expectedTime: endpoint.expectedTime,
      iterations,
      responseTimes,
      avgResponseTime,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime,
      p99ResponseTime,
      successRate,
      errorRate,
      errors,
      passed: p95ResponseTime <= (endpoint.expectedTime || this.thresholds.apiResponseTime)
    };
  }

  generateRequestData(endpoint) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    };
    
    const requestData = {
      method: endpoint.method,
      headers
    };
    
    // Add test payloads for POST/PUT requests
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      requestData.body = JSON.stringify(this.getTestPayload(endpoint.path));
    }
    
    return requestData;
  }

  getTestPayload(path) {
    const payloads = {
      '/api/auth/login': {
        email: 'test@gohunta.com',
        password: 'testpassword123'
      },
      '/api/auth/refresh': {
        refreshToken: 'test-refresh-token'
      },
      '/api/hunt-logs': {
        date: new Date().toISOString(),
        location: {
          latitude: 47.6062,
          longitude: -122.3321,
          name: 'Test Location'
        },
        duration: 240,
        success: true,
        notes: 'Test hunt log for performance testing',
        weather: {
          temperature: 65,
          conditions: 'Clear'
        }
      },
      '/api/dogs': {
        name: 'Test Dog',
        breed: 'Labrador',
        age: 3,
        weight: 65,
        training_level: 'Advanced'
      },
      '/api/community/posts': {
        title: 'Test Post',
        content: 'This is a test post for performance testing',
        category: 'general'
      },
      '/api/analytics/performance': {
        metric: 'test_metric',
        value: 123.45,
        timestamp: Date.now(),
        metadata: { test: true }
      }
    };
    
    return payloads[path] || {};
  }

  /**
   * Test database query performance
   */
  async testDatabaseQueryPerformance() {
    console.log('Testing database query performance...');
    
    const databaseQueries = [
      {
        name: 'user_hunt_logs_paginated',
        endpoint: '/api/hunt-logs?limit=20&offset=0',
        expectedQueryTime: 50
      },
      {
        name: 'dog_profile_with_stats',
        endpoint: '/api/dogs/123?include=stats,training',
        expectedQueryTime: 75
      },
      {
        name: 'hunt_logs_with_filters',
        endpoint: '/api/hunt-logs?date_from=2024-01-01&location_radius=50&success=true',
        expectedQueryTime: 100
      },
      {
        name: 'community_posts_recent',
        endpoint: '/api/community/posts?sort=recent&limit=10',
        expectedQueryTime: 60
      },
      {
        name: 'training_session_aggregates',
        endpoint: '/api/training/sessions/analytics?dog_id=123&period=30days',
        expectedQueryTime: 150
      },
      {
        name: 'gear_recommendations',
        endpoint: '/api/gear/recommendations?user_id=123&hunt_type=waterfowl',
        expectedQueryTime: 200
      }
    ];
    
    const results = [];
    
    for (const query of databaseQueries) {
      const queryResults = await this.measureDatabaseQuery(query);
      results.push(queryResults);
      
      // Store metrics
      this.metrics.databaseQueryTimes.push(...queryResults.queryTimes);
      
      // Validate performance
      if (queryResults.p95QueryTime > this.thresholds.databaseQueryTime) {
        console.warn(`Database query ${query.name} P95 time ${queryResults.p95QueryTime}ms exceeds threshold ${this.thresholds.databaseQueryTime}ms`);
      }
    }
    
    return results;
  }

  async measureDatabaseQuery(query, iterations = 10) {
    const queryTimes = [];
    const errors = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        const response = await fetch(`${this.baseURL}${query.endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'X-Request-ID': `perf-test-${Date.now()}-${i}`
          }
        });
        
        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        if (response.ok) {
          // Check for database timing headers if available
          const dbTime = response.headers.get('X-Database-Time');
          const actualQueryTime = dbTime ? parseFloat(dbTime) : queryTime;
          
          queryTimes.push(actualQueryTime);
        } else {
          errors.push({
            status: response.status,
            queryTime
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors.push({ error: error.message });
      }
    }
    
    const p95QueryTime = this.calculatePercentile(queryTimes, 95);
    const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
    
    return {
      query: query.name,
      endpoint: query.endpoint,
      expectedQueryTime: query.expectedQueryTime,
      iterations,
      queryTimes,
      avgQueryTime,
      p95QueryTime,
      minQueryTime: Math.min(...queryTimes),
      maxQueryTime: Math.max(...queryTimes),
      errors,
      passed: p95QueryTime <= query.expectedQueryTime
    };
  }

  /**
   * Test concurrent user handling
   */
  async testConcurrentUserHandling() {
    console.log('Testing concurrent user handling...');
    
    const concurrencyLevels = [10, 25, 50, 75, 100];
    const testDuration = 60000; // 1 minute per test
    
    const results = [];
    
    for (const concurrentUsers of concurrencyLevels) {
      console.log(`Testing ${concurrentUsers} concurrent users...`);
      
      const concurrencyResult = await this.measureConcurrentLoad(concurrentUsers, testDuration);
      results.push(concurrencyResult);
      
      this.metrics.concurrentUserResults.push(concurrencyResult);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return results;
  }

  async measureConcurrentLoad(concurrentUsers, duration) {
    const startTime = Date.now();
    const userSessions = [];
    
    // Start concurrent user sessions
    for (let i = 0; i < concurrentUsers; i++) {
      userSessions.push(this.simulateUserSession(i, duration));
    }
    
    // Wait for all sessions to complete
    const sessionResults = await Promise.allSettled(userSessions);
    const endTime = Date.now();
    
    // Analyze results
    const successfulSessions = sessionResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    
    const totalRequests = sessionResults.reduce((sum, result) => {
      return sum + (result.value?.requestCount || 0);
    }, 0);
    
    const totalErrors = sessionResults.reduce((sum, result) => {
      return sum + (result.value?.errorCount || 0);
    }, 0);
    
    const avgResponseTime = sessionResults
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .reduce((sum, result) => sum + result.value.avgResponseTime, 0) / successfulSessions.length;
    
    const actualDuration = endTime - startTime;
    const throughput = totalRequests / (actualDuration / 1000);
    const successRate = (successfulSessions.length / concurrentUsers) * 100;
    const errorRate = totalErrors / totalRequests * 100;
    
    return {
      concurrentUsers,
      plannedDuration: duration,
      actualDuration,
      successfulSessions: successfulSessions.length,
      successRate,
      totalRequests,
      totalErrors,
      errorRate,
      avgResponseTime,
      throughput,
      passed: successRate > 95 && errorRate < this.thresholds.errorRateThreshold * 100
    };
  }

  async simulateUserSession(userId, duration) {
    const session = {
      userId,
      success: true,
      requestCount: 0,
      errorCount: 0,
      responseTimes: []
    };
    
    const sessionStart = Date.now();
    
    try {
      // Simulate typical user behavior patterns
      const userBehaviors = [
        () => this.makeRequest('/api/users/profile', 'GET', session),
        () => this.makeRequest('/api/dogs', 'GET', session),
        () => this.makeRequest('/api/hunt-logs?limit=10', 'GET', session),
        () => this.makeRequest('/api/gear', 'GET', session),
        () => this.makeRequest('/api/routes', 'GET', session),
        () => this.makeRequest('/api/events', 'GET', session)
      ];
      
      while (Date.now() - sessionStart < duration) {
        // Random behavior selection
        const behavior = userBehaviors[Math.floor(Math.random() * userBehaviors.length)];
        await behavior();
        
        // Random delay between requests (1-5 seconds)
        const delay = 1000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      session.avgResponseTime = session.responseTimes.length > 0 ?
        session.responseTimes.reduce((sum, time) => sum + time, 0) / session.responseTimes.length : 0;
      
    } catch (error) {
      session.success = false;
      session.error = error.message;
    }
    
    return session;
  }

  async makeRequest(endpoint, method, session) {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      session.requestCount++;
      session.responseTimes.push(responseTime);
      
      if (!response.ok) {
        session.errorCount++;
      }
      
    } catch (error) {
      session.errorCount++;
    }
  }

  /**
   * Test caching efficiency
   */
  async testCachingEfficiency() {
    console.log('Testing caching efficiency...');
    
    const cacheableEndpoints = [
      '/api/dogs',
      '/api/gear',
      '/api/routes',
      '/api/events',
      '/api/community/posts?limit=10'
    ];
    
    const cachingResults = [];
    
    for (const endpoint of cacheableEndpoints) {
      const cachingResult = await this.measureCachingPerformance(endpoint);
      cachingResults.push(cachingResult);
      
      this.metrics.cachingEfficiency.push(cachingResult);
    }
    
    return cachingResults;
  }

  async measureCachingPerformance(endpoint, requests = 20) {
    const responseTimes = [];
    const cacheStatuses = [];
    
    // First request (cache miss)
    const firstResponse = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    
    const firstCacheStatus = firstResponse.headers.get('CF-Cache-Status') || 'UNKNOWN';
    cacheStatuses.push(firstCacheStatus);
    
    // Subsequent requests (should be cache hits)
    for (let i = 1; i < requests; i++) {
      const startTime = performance.now();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      responseTimes.push(responseTime);
      
      const cacheStatus = response.headers.get('CF-Cache-Status') || 'UNKNOWN';
      cacheStatuses.push(cacheStatus);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const cacheHits = cacheStatuses.filter(status => status === 'HIT').length;
    const cacheHitRatio = cacheHits / cacheStatuses.length;
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const avgCacheHitTime = responseTimes.filter((_, index) => 
      cacheStatuses[index + 1] === 'HIT'
    ).reduce((sum, time) => sum + time, 0) / cacheHits || 0;
    
    return {
      endpoint,
      totalRequests: requests,
      cacheHits,
      cacheMisses: cacheStatuses.length - cacheHits,
      cacheHitRatio,
      cacheStatuses,
      avgResponseTime,
      avgCacheHitTime,
      passed: cacheHitRatio >= this.thresholds.cacheHitRatio
    };
  }

  /**
   * Test rate limiting performance
   */
  async testRateLimiting() {
    console.log('Testing rate limiting performance...');
    
    const rateLimitTests = [
      {
        endpoint: '/api/hunt-logs',
        method: 'POST',
        requestsPerSecond: 100, // Above normal rate limit
        duration: 10000 // 10 seconds
      },
      {
        endpoint: '/api/auth/login',
        method: 'POST',
        requestsPerSecond: 50, // Above login rate limit
        duration: 5000 // 5 seconds
      }
    ];
    
    const results = [];
    
    for (const test of rateLimitTests) {
      const rateLimitResult = await this.measureRateLimiting(test);
      results.push(rateLimitResult);
      
      this.metrics.rateLimitingResults.push(rateLimitResult);
    }
    
    return results;
  }

  async measureRateLimiting(test) {
    const startTime = Date.now();
    const responses = [];
    const rateLimitedResponses = [];
    
    const requestInterval = 1000 / test.requestsPerSecond;
    
    // Send requests at specified rate
    const requestPromises = [];
    let requestCount = 0;
    
    const intervalId = setInterval(() => {
      if (Date.now() - startTime >= test.duration) {
        clearInterval(intervalId);
        return;
      }
      
      const requestPromise = this.makeRateLimitTestRequest(test.endpoint, test.method)
        .then(result => {
          responses.push(result);
          if (result.status === 429) {
            rateLimitedResponses.push(result);
          }
        });
      
      requestPromises.push(requestPromise);
      requestCount++;
    }, requestInterval);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, test.duration + 1000));
    clearInterval(intervalId);
    
    // Wait for all requests to complete
    await Promise.all(requestPromises);
    
    const successfulRequests = responses.filter(r => r.status < 400).length;
    const rateLimitedCount = rateLimitedResponses.length;
    const errorRate = rateLimitedCount / responses.length * 100;
    
    return {
      endpoint: test.endpoint,
      method: test.method,
      requestsPerSecond: test.requestsPerSecond,
      duration: test.duration,
      totalRequests: responses.length,
      successfulRequests,
      rateLimitedRequests: rateLimitedCount,
      errorRate,
      avgResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length,
      rateLimitingWorking: rateLimitedCount > 0, // Rate limiting should kick in
      systemStable: errorRate < 90 // System should remain stable even under load
    };
  }

  async makeRateLimitTestRequest(endpoint, method) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify(this.getTestPayload(endpoint)) : undefined
      });
      
      const endTime = performance.now();
      
      return {
        status: response.status,
        responseTime: endTime - startTime,
        rateLimited: response.status === 429
      };
      
    } catch (error) {
      return {
        status: 0,
        responseTime: performance.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Utility function to calculate percentiles
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate comprehensive API performance report
   */
  generateAPIPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'api_performance',
      baseURL: this.baseURL,
      
      summary: {
        totalRequests: this.metrics.responseeTimes.length,
        avgResponseTime: this.metrics.responseeTimes.length > 0 ?
          this.metrics.responseeTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseeTimes.length : 0,
        p95ResponseTime: this.calculatePercentile(this.metrics.responseeTimes, 95),
        p99ResponseTime: this.calculatePercentile(this.metrics.responseeTimes, 99),
        
        avgDatabaseQueryTime: this.metrics.databaseQueryTimes.length > 0 ?
          this.metrics.databaseQueryTimes.reduce((sum, time) => sum + time, 0) / this.metrics.databaseQueryTimes.length : 0,
        p95DatabaseQueryTime: this.calculatePercentile(this.metrics.databaseQueryTimes, 95),
        
        maxConcurrentUsersHandled: Math.max(
          ...this.metrics.concurrentUserResults
            .filter(r => r.successRate > 95)
            .map(r => r.concurrentUsers),
          0
        ),
        
        avgCacheHitRatio: this.metrics.cachingEfficiency.length > 0 ?
          this.metrics.cachingEfficiency.reduce((sum, c) => sum + c.cacheHitRatio, 0) / this.metrics.cachingEfficiency.length : 0
      },
      
      performance_status: {
        api_response_time: this.calculatePercentile(this.metrics.responseeTimes, 95) <= this.thresholds.apiResponseTime,
        database_query_time: this.calculatePercentile(this.metrics.databaseQueryTimes, 95) <= this.thresholds.databaseQueryTime,
        concurrent_user_handling: this.metrics.concurrentUserResults.some(r => r.concurrentUsers >= this.thresholds.concurrentUsers && r.successRate > 95),
        caching_efficiency: this.metrics.cachingEfficiency.every(c => c.cacheHitRatio >= this.thresholds.cacheHitRatio),
        rate_limiting_functional: this.metrics.rateLimitingResults.some(r => r.rateLimitingWorking)
      },
      
      thresholds: this.thresholds,
      
      detailed_metrics: {
        responseeTimes: this.metrics.responseeTimes,
        databaseQueryTimes: this.metrics.databaseQueryTimes,
        concurrentUserResults: this.metrics.concurrentUserResults,
        cachingEfficiency: this.metrics.cachingEfficiency,
        rateLimitingResults: this.metrics.rateLimitingResults
      },
      
      recommendations: this.generateAPIOptimizationRecommendations()
    };
    
    report.overall_pass = Object.values(report.performance_status).every(status => status === true);
    
    return report;
  }

  generateAPIOptimizationRecommendations() {
    const recommendations = [];
    
    const p95ResponseTime = this.calculatePercentile(this.metrics.responseeTimes, 95);
    if (p95ResponseTime > this.thresholds.apiResponseTime) {
      recommendations.push({
        category: 'API Response Time',
        priority: 'HIGH',
        issue: `P95 response time (${p95ResponseTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.apiResponseTime}ms)`,
        recommendations: [
          'Optimize database queries with proper indexing',
          'Implement database connection pooling',
          'Add Redis caching for frequently accessed data',
          'Use Cloudflare Workers edge computing for static responses'
        ]
      });
    }
    
    const p95DatabaseTime = this.calculatePercentile(this.metrics.databaseQueryTimes, 95);
    if (p95DatabaseTime > this.thresholds.databaseQueryTime) {
      recommendations.push({
        category: 'Database Performance',
        priority: 'HIGH',
        issue: `P95 database query time (${p95DatabaseTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.databaseQueryTime}ms)`,
        recommendations: [
          'Add composite indexes for complex queries',
          'Optimize JOIN operations and reduce N+1 queries',
          'Implement query result caching',
          'Consider database sharding for large datasets'
        ]
      });
    }
    
    const maxConcurrentUsers = Math.max(...this.metrics.concurrentUserResults.map(r => r.concurrentUsers), 0);
    if (maxConcurrentUsers < this.thresholds.concurrentUsers) {
      recommendations.push({
        category: 'Concurrent User Handling',
        priority: 'HIGH',
        issue: `Maximum concurrent users handled (${maxConcurrentUsers}) below requirement (${this.thresholds.concurrentUsers})`,
        recommendations: [
          'Implement horizontal scaling with multiple Workers',
          'Optimize resource usage and memory management',
          'Add request queuing for peak load management',
          'Implement circuit breaker pattern for failure handling'
        ]
      });
    }
    
    const avgCacheHitRatio = this.metrics.cachingEfficiency.length > 0 ?
      this.metrics.cachingEfficiency.reduce((sum, c) => sum + c.cacheHitRatio, 0) / this.metrics.cachingEfficiency.length : 0;
    
    if (avgCacheHitRatio < this.thresholds.cacheHitRatio) {
      recommendations.push({
        category: 'Caching Efficiency',
        priority: 'MEDIUM',
        issue: `Average cache hit ratio (${(avgCacheHitRatio * 100).toFixed(1)}%) below target (${this.thresholds.cacheHitRatio * 100}%)`,
        recommendations: [
          'Optimize cache TTL settings for different content types',
          'Implement smarter cache invalidation strategies',
          'Use edge caching for static and semi-static content',
          'Add application-level caching for computed results'
        ]
      });
    }
    
    return recommendations;
  }
}

export default APIPerformanceSuite;