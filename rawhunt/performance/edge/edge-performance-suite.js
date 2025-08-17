/**
 * GoHunta Edge Computing Performance Testing Suite
 * Tests Cloudflare Workers performance, global latency, edge caching, and CDN optimization
 * Focuses on minimizing rural area coverage gaps and optimizing global response times
 */

export class EdgePerformanceSuite {
  constructor() {
    this.cloudflareRegions = [
      { name: 'Los Angeles, CA', code: 'lax', rural: false },
      { name: 'Denver, CO', code: 'den', rural: true },
      { name: 'Chicago, IL', code: 'ord', rural: false },
      { name: 'Atlanta, GA', code: 'atl', rural: false },
      { name: 'Seattle, WA', code: 'sea', rural: true },
      { name: 'Phoenix, AZ', code: 'phx', rural: true },
      { name: 'Dallas, TX', code: 'dfw', rural: false },
      { name: 'Miami, FL', code: 'mia', rural: false }
    ];
    
    this.metrics = {
      workerPerformance: [],
      globalLatency: [],
      edgeCaching: [],
      cdnOptimization: [],
      ruralCoverage: []
    };
    
    this.thresholds = {
      workerResponseTime: 100, // 100ms max for edge processing
      globalLatency: 200, // 200ms max global average
      ruralLatency: 500, // 500ms max for rural areas
      cacheHitRatio: 0.95, // 95% cache hit ratio
      ttfb: 100, // 100ms Time To First Byte
      cdnEfficiency: 0.80 // 80% requests should be served from edge
    };
  }

  /**
   * Test Cloudflare Workers performance across regions
   */
  async testWorkerPerformance() {
    console.log('Testing Cloudflare Workers performance...');
    
    const workerTests = [
      {
        name: 'authentication',
        endpoint: '/api/auth/verify',
        method: 'POST',
        payload: { token: 'test-token' },
        expectedProcessingTime: 50
      },
      {
        name: 'hunt_data_processing',
        endpoint: '/api/hunt-logs/process',
        method: 'POST',
        payload: {
          location: { lat: 47.6062, lng: -122.3321 },
          duration: 180,
          success: true
        },
        expectedProcessingTime: 75
      },
      {
        name: 'gps_data_validation',
        endpoint: '/api/gps/validate',
        method: 'POST',
        payload: {
          track: Array(100).fill().map((_, i) => ({
            lat: 47.6062 + Math.sin(i * 0.1) * 0.01,
            lng: -122.3321 + Math.cos(i * 0.1) * 0.01,
            timestamp: Date.now() + i * 1000
          }))
        },
        expectedProcessingTime: 100
      },
      {
        name: 'image_optimization',
        endpoint: '/api/images/optimize',
        method: 'POST',
        payload: { 
          imageUrl: 'https://example.com/test-hunt-photo.jpg',
          format: 'webp',
          quality: 80
        },
        expectedProcessingTime: 150
      }
    ];
    
    const results = [];
    
    for (const test of workerTests) {
      const testResults = await this.measureWorkerOperation(test);
      results.push(testResults);
      
      this.metrics.workerPerformance.push(testResults);
    }
    
    return results;
  }

  async measureWorkerOperation(test, iterations = 10) {
    const measurements = [];
    const errors = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        // Add worker performance headers to track edge processing time
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${test.endpoint}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Performance-Test': 'true',
            'X-Request-ID': `perf-test-${Date.now()}-${i}`
          },
          body: JSON.stringify(test.payload)
        });
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Extract edge processing time from headers
        const edgeProcessingTime = response.headers.get('CF-Edge-Processing-Time') || 
                                  response.headers.get('X-Worker-Processing-Time') ||
                                  totalTime;
        
        const measurement = {
          totalTime,
          edgeProcessingTime: parseFloat(edgeProcessingTime),
          networkTime: totalTime - parseFloat(edgeProcessingTime),
          status: response.status,
          region: response.headers.get('CF-Ray')?.split('-')[1] || 'unknown',
          cacheStatus: response.headers.get('CF-Cache-Status') || 'UNKNOWN'
        };
        
        measurements.push(measurement);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors.push({ error: error.message, iteration: i });
      }
    }
    
    const avgEdgeTime = measurements.reduce((sum, m) => sum + m.edgeProcessingTime, 0) / measurements.length;
    const avgTotalTime = measurements.reduce((sum, m) => sum + m.totalTime, 0) / measurements.length;
    const p95EdgeTime = this.calculatePercentile(measurements.map(m => m.edgeProcessingTime), 95);
    
    return {
      test: test.name,
      endpoint: test.endpoint,
      iterations: measurements.length,
      avgEdgeProcessingTime: avgEdgeTime,
      avgTotalTime: avgTotalTime,
      p95EdgeProcessingTime: p95EdgeTime,
      expectedProcessingTime: test.expectedProcessingTime,
      measurements,
      errors,
      passed: p95EdgeTime <= test.expectedProcessingTime,
      edgeEfficiency: measurements.length > 0 ? 
        (measurements.filter(m => m.cacheStatus !== 'MISS').length / measurements.length) : 0
    };
  }

  /**
   * Test global latency and regional performance
   */
  async testGlobalLatency() {
    console.log('Testing global latency across regions...');
    
    const latencyTests = [];
    
    // Test key endpoints from different simulated regions
    const endpoints = [
      '/api/health',
      '/api/auth/status',
      '/api/hunt-logs?limit=5',
      '/api/dogs',
      '/api/routes/nearby'
    ];
    
    for (const region of this.cloudflareRegions) {
      const regionResults = await this.measureRegionalLatency(region, endpoints);
      latencyTests.push(regionResults);
      
      this.metrics.globalLatency.push(regionResults);
    }
    
    // Calculate global statistics
    const allLatencies = latencyTests.flatMap(r => r.endpointResults.map(e => e.avgLatency));
    const globalAvgLatency = allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length;
    const globalP95Latency = this.calculatePercentile(allLatencies, 95);
    
    // Check rural coverage
    const ruralResults = latencyTests.filter(r => r.region.rural);
    const ruralAvgLatency = ruralResults.length > 0 ? 
      ruralResults.flatMap(r => r.endpointResults.map(e => e.avgLatency))
        .reduce((sum, lat) => sum + lat, 0) / 
      ruralResults.flatMap(r => r.endpointResults).length : 0;
    
    return {
      latencyTests,
      globalStats: {
        avgLatency: globalAvgLatency,
        p95Latency: globalP95Latency,
        ruralAvgLatency,
        passedGlobalThreshold: globalAvgLatency <= this.thresholds.globalLatency,
        passedRuralThreshold: ruralAvgLatency <= this.thresholds.ruralLatency
      }
    };
  }

  async measureRegionalLatency(region, endpoints, iterations = 5) {
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      const latencies = [];
      const ttfbs = [];
      
      for (let i = 0; i < iterations; i++) {
        try {
          const startTime = performance.now();
          
          // Simulate request from different regions by adding headers
          const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${endpoint}`, {
            headers: {
              'CF-Connecting-IP': this.getRegionIP(region.code),
              'CF-IPCountry': 'US',
              'CF-Region': region.code.toUpperCase(),
              'X-Simulated-Region': region.name
            }
          });
          
          const endTime = performance.now();
          const totalLatency = endTime - startTime;
          
          // Extract TTFB if available
          const ttfb = response.headers.get('Server-Timing')?.match(/ttfb;dur=([0-9.]+)/)?.[1] || totalLatency;
          
          latencies.push(totalLatency);
          ttfbs.push(parseFloat(ttfb));
          
        } catch (error) {
          console.warn(`Error measuring latency for ${region.name} ${endpoint}:`, error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const avgTTFB = ttfbs.reduce((sum, ttfb) => sum + ttfb, 0) / ttfbs.length;
      
      endpointResults.push({
        endpoint,
        avgLatency,
        avgTTFB,
        minLatency: Math.min(...latencies),
        maxLatency: Math.max(...latencies),
        p95Latency: this.calculatePercentile(latencies, 95),
        measurements: latencies.length
      });
    }
    
    return {
      region,
      endpointResults,
      avgRegionalLatency: endpointResults.reduce((sum, e) => sum + e.avgLatency, 0) / endpointResults.length
    };
  }

  /**
   * Test edge caching performance
   */
  async testEdgeCaching() {
    console.log('Testing edge caching performance...');
    
    const cacheableResources = [
      {
        path: '/api/hunting-areas/public',
        type: 'api_data',
        expectedTTL: 300, // 5 minutes
        cacheable: true
      },
      {
        path: '/images/dog-breeds/labrador.jpg',
        type: 'image',
        expectedTTL: 86400, // 24 hours
        cacheable: true
      },
      {
        path: '/static/hunting-regulations.json',
        type: 'static_data',
        expectedTTL: 3600, // 1 hour
        cacheable: true
      },
      {
        path: '/api/weather/current',
        type: 'dynamic_data',
        expectedTTL: 600, // 10 minutes
        cacheable: true
      },
      {
        path: '/api/user/profile',
        type: 'private_data',
        expectedTTL: 0,
        cacheable: false
      }
    ];
    
    const cachingResults = [];
    
    for (const resource of cacheableResources) {
      const cacheResult = await this.measureEdgeCaching(resource);
      cachingResults.push(cacheResult);
      
      this.metrics.edgeCaching.push(cacheResult);
    }
    
    // Calculate overall cache efficiency
    const cacheableTests = cachingResults.filter(r => r.resource.cacheable);
    const avgCacheHitRatio = cacheableTests.length > 0 ?
      cacheableTests.reduce((sum, r) => sum + r.cacheHitRatio, 0) / cacheableTests.length : 0;
    
    return {
      cachingResults,
      overallStats: {
        avgCacheHitRatio,
        passedCacheThreshold: avgCacheHitRatio >= this.thresholds.cacheHitRatio
      }
    };
  }

  async measureEdgeCaching(resource, requests = 20) {
    const results = [];
    
    // First request (cache miss expected)
    const firstResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${resource.path}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'X-Cache-Test': 'first-request'
      }
    });
    
    const firstCacheStatus = firstResponse.headers.get('CF-Cache-Status') || 'UNKNOWN';
    results.push({
      requestNum: 1,
      cacheStatus: firstCacheStatus,
      responseTime: 0 // Not measuring first request time
    });
    
    // Wait for cache propagation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Subsequent requests (cache hits expected)
    for (let i = 2; i <= requests; i++) {
      const startTime = performance.now();
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${resource.path}`, {
        headers: {
          'X-Cache-Test': `request-${i}`
        }
      });
      
      const responseTime = performance.now() - startTime;
      const cacheStatus = response.headers.get('CF-Cache-Status') || 'UNKNOWN';
      const age = response.headers.get('Age') || '0';
      
      results.push({
        requestNum: i,
        cacheStatus,
        responseTime,
        age: parseInt(age),
        ttfb: responseTime // Simplified TTFB measurement
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Analyze cache performance
    const cacheHits = results.filter(r => r.cacheStatus === 'HIT').length;
    const cacheHitRatio = cacheHits / results.length;
    
    const cacheHitTimes = results.filter(r => r.cacheStatus === 'HIT').map(r => r.responseTime);
    const avgCacheHitTime = cacheHitTimes.length > 0 ?
      cacheHitTimes.reduce((sum, time) => sum + time, 0) / cacheHitTimes.length : 0;
    
    const cacheMissTimes = results.filter(r => r.cacheStatus === 'MISS').map(r => r.responseTime);
    const avgCacheMissTime = cacheMissTimes.length > 0 ?
      cacheMissTimes.reduce((sum, time) => sum + time, 0) / cacheMissTimes.length : 0;
    
    return {
      resource,
      totalRequests: results.length,
      cacheHits,
      cacheMisses: results.length - cacheHits,
      cacheHitRatio,
      avgCacheHitTime,
      avgCacheMissTime,
      cacheSpeedup: avgCacheMissTime > 0 ? avgCacheMissTime / avgCacheHitTime : 0,
      results,
      passed: resource.cacheable ? 
        cacheHitRatio >= this.thresholds.cacheHitRatio :
        cacheHitRatio < 0.1 // Non-cacheable should have low hit ratio
    };
  }

  /**
   * Test CDN optimization and asset delivery
   */
  async testCDNOptimization() {
    console.log('Testing CDN optimization...');
    
    const assetTypes = [
      {
        name: 'app_bundle',
        path: '/static/js/main.bundle.js',
        type: 'javascript',
        compressionExpected: true,
        maxSize: 200 * 1024 // 200KB max
      },
      {
        name: 'css_styles',
        path: '/static/css/main.css',
        type: 'stylesheet',
        compressionExpected: true,
        maxSize: 50 * 1024 // 50KB max
      },
      {
        name: 'hunt_photo',
        path: '/images/sample-hunt-photo.jpg',
        type: 'image',
        compressionExpected: true,
        optimizationExpected: true
      },
      {
        name: 'app_manifest',
        path: '/manifest.json',
        type: 'json',
        compressionExpected: true,
        maxSize: 5 * 1024 // 5KB max
      },
      {
        name: 'service_worker',
        path: '/sw.js',
        type: 'javascript',
        compressionExpected: true,
        maxSize: 100 * 1024 // 100KB max
      }
    ];
    
    const cdnResults = [];
    
    for (const asset of assetTypes) {
      const assetResult = await this.measureCDNPerformance(asset);
      cdnResults.push(assetResult);
      
      this.metrics.cdnOptimization.push(assetResult);
    }
    
    // Calculate overall CDN efficiency
    const totalRequests = cdnResults.length;
    const optimizedRequests = cdnResults.filter(r => r.optimized).length;
    const cdnEfficiency = optimizedRequests / totalRequests;
    
    return {
      cdnResults,
      overallStats: {
        cdnEfficiency,
        passedEfficiencyThreshold: cdnEfficiency >= this.thresholds.cdnEfficiency
      }
    };
  }

  async measureCDNPerformance(asset, iterations = 5) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${asset.path}`, {
        headers: {
          'Accept': this.getAcceptHeader(asset.type),
          'Accept-Encoding': 'gzip, deflate, br',
          'X-CDN-Test': `iteration-${i + 1}`
        }
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Analyze response headers for optimization
      const contentLength = parseInt(response.headers.get('Content-Length') || '0');
      const contentEncoding = response.headers.get('Content-Encoding');
      const contentType = response.headers.get('Content-Type') || '';
      const cacheControl = response.headers.get('Cache-Control') || '';
      const vary = response.headers.get('Vary') || '';
      
      // Check for image optimization
      const isImageOptimized = asset.type === 'image' && 
        (contentType.includes('webp') || response.headers.get('CF-Polished'));
      
      const measurement = {
        responseTime,
        contentLength,
        compressed: !!contentEncoding,
        compressionType: contentEncoding,
        cacheControl,
        imageOptimized: isImageOptimized,
        status: response.status
      };
      
      measurements.push(measurement);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Analyze measurements
    const avgResponseTime = measurements.reduce((sum, m) => sum + m.responseTime, 0) / measurements.length;
    const avgContentLength = measurements.reduce((sum, m) => sum + m.contentLength, 0) / measurements.length;
    const compressionRate = measurements.filter(m => m.compressed).length / measurements.length;
    
    // Determine if asset is optimized
    const optimized = this.evaluateAssetOptimization(asset, measurements);
    
    return {
      asset,
      avgResponseTime,
      avgContentLength,
      compressionRate,
      optimized,
      measurements,
      passed: optimized.overall && avgResponseTime <= 1000, // Should load in under 1 second
      optimizationDetails: optimized.details
    };
  }

  evaluateAssetOptimization(asset, measurements) {
    const details = [];
    let score = 0;
    const maxScore = 5;
    
    // Check compression
    const compressionRate = measurements.filter(m => m.compressed).length / measurements.length;
    if (asset.compressionExpected && compressionRate >= 0.8) {
      score++;
      details.push('✓ Compression enabled');
    } else if (asset.compressionExpected) {
      details.push('✗ Compression not consistent');
    }
    
    // Check size limits
    const avgSize = measurements.reduce((sum, m) => sum + m.contentLength, 0) / measurements.length;
    if (asset.maxSize && avgSize <= asset.maxSize) {
      score++;
      details.push('✓ Size within limits');
    } else if (asset.maxSize) {
      details.push(`✗ Size (${(avgSize / 1024).toFixed(1)}KB) exceeds limit (${(asset.maxSize / 1024).toFixed(1)}KB)`);
    }
    
    // Check image optimization
    if (asset.optimizationExpected) {
      const imageOptimized = measurements.some(m => m.imageOptimized);
      if (imageOptimized) {
        score++;
        details.push('✓ Image optimization applied');
      } else {
        details.push('✗ Image optimization not detected');
      }
    }
    
    // Check caching headers
    const hasCaching = measurements.some(m => 
      m.cacheControl && (m.cacheControl.includes('max-age') || m.cacheControl.includes('public'))
    );
    if (hasCaching) {
      score++;
      details.push('✓ Proper caching headers');
    } else {
      details.push('✗ Missing or inadequate caching headers');
    }
    
    // Check performance
    const avgResponseTime = measurements.reduce((sum, m) => sum + m.responseTime, 0) / measurements.length;
    if (avgResponseTime <= 500) {
      score++;
      details.push('✓ Fast response time');
    } else {
      details.push(`✗ Slow response time (${avgResponseTime.toFixed(0)}ms)`);
    }
    
    return {
      overall: score >= maxScore * 0.7, // 70% threshold
      score,
      maxScore,
      details
    };
  }

  /**
   * Test rural area coverage and performance
   */
  async testRuralCoverage() {
    console.log('Testing rural area coverage...');
    
    const ruralScenarios = [
      {
        name: 'remote_montana_ranch',
        location: { lat: 47.0527, lng: -109.6333 },
        connectionType: '3G',
        expectedLatency: 400
      },
      {
        name: 'wyoming_hunting_grounds',
        location: { lat: 43.0759, lng: -107.2903 },
        connectionType: '4G',
        expectedLatency: 300
      },
      {
        name: 'alaska_wilderness',
        location: { lat: 64.0685, lng: -152.2782 },
        connectionType: '3G',
        expectedLatency: 500
      },
      {
        name: 'idaho_backcountry',
        location: { lat: 45.7772, lng: -115.9980 },
        connectionType: '4G',
        expectedLatency: 350
      }
    ];
    
    const ruralResults = [];
    
    for (const scenario of ruralScenarios) {
      const scenarioResult = await this.measureRuralPerformance(scenario);
      ruralResults.push(scenarioResult);
      
      this.metrics.ruralCoverage.push(scenarioResult);
    }
    
    // Analyze rural coverage
    const avgRuralLatency = ruralResults.reduce((sum, r) => sum + r.avgLatency, 0) / ruralResults.length;
    const ruralCoverageRate = ruralResults.filter(r => r.accessible).length / ruralResults.length;
    
    return {
      ruralResults,
      overallStats: {
        avgRuralLatency,
        ruralCoverageRate,
        passedRuralThreshold: avgRuralLatency <= this.thresholds.ruralLatency,
        adequateCoverage: ruralCoverageRate >= 0.9 // 90% rural areas should be accessible
      }
    };
  }

  async measureRuralPerformance(scenario) {
    const criticalEndpoints = [
      '/api/health',
      '/api/auth/status',
      '/api/hunt-logs/emergency',
      '/api/gps/location',
      '/offline.html'
    ];
    
    const endpointResults = [];
    let accessible = true;
    
    for (const endpoint of criticalEndpoints) {
      try {
        const startTime = performance.now();
        
        // Simulate rural network conditions
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}${endpoint}`, {
          headers: {
            'X-Rural-Test': scenario.name,
            'X-Connection-Type': scenario.connectionType,
            'X-Simulated-Location': `${scenario.location.lat},${scenario.location.lng}`
          }
        });
        
        const responseTime = performance.now() - startTime;
        
        // Add simulated network delay for rural conditions
        const simulatedDelay = scenario.connectionType === '3G' ? 200 : 100;
        const totalTime = responseTime + simulatedDelay;
        
        endpointResults.push({
          endpoint,
          responseTime: totalTime,
          status: response.status,
          accessible: response.ok
        });
        
        if (!response.ok) {
          accessible = false;
        }
        
      } catch (error) {
        endpointResults.push({
          endpoint,
          responseTime: 5000, // Timeout
          status: 0,
          accessible: false,
          error: error.message
        });
        accessible = false;
      }
    }
    
    const avgLatency = endpointResults
      .filter(r => r.accessible)
      .reduce((sum, r) => sum + r.responseTime, 0) / 
      endpointResults.filter(r => r.accessible).length || 0;
    
    return {
      scenario,
      endpointResults,
      avgLatency,
      accessible,
      passedLatencyThreshold: avgLatency <= scenario.expectedLatency
    };
  }

  // Utility methods
  getRegionIP(regionCode) {
    const regionIPs = {
      'lax': '104.16.1.1',
      'den': '104.16.2.1',
      'ord': '104.16.3.1',
      'atl': '104.16.4.1',
      'sea': '104.16.5.1',
      'phx': '104.16.6.1',
      'dfw': '104.16.7.1',
      'mia': '104.16.8.1'
    };
    return regionIPs[regionCode] || '104.16.0.1';
  }

  getAcceptHeader(assetType) {
    const acceptHeaders = {
      'javascript': 'application/javascript,text/javascript,*/*',
      'stylesheet': 'text/css,*/*',
      'image': 'image/webp,image/apng,image/*,*/*',
      'json': 'application/json,*/*'
    };
    return acceptHeaders[assetType] || '*/*';
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate Edge Computing Performance Report
   */
  generateEdgePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'edge_computing_performance',
      
      summary: {
        avgWorkerProcessingTime: this.metrics.workerPerformance.length > 0 ?
          this.metrics.workerPerformance.reduce((sum, w) => sum + w.avgEdgeProcessingTime, 0) / this.metrics.workerPerformance.length : 0,
        
        globalAvgLatency: this.metrics.globalLatency.length > 0 ?
          this.metrics.globalLatency.reduce((sum, g) => sum + g.avgRegionalLatency, 0) / this.metrics.globalLatency.length : 0,
        
        avgCacheHitRatio: this.metrics.edgeCaching.length > 0 ?
          this.metrics.edgeCaching.reduce((sum, c) => sum + c.cacheHitRatio, 0) / this.metrics.edgeCaching.length : 0,
        
        cdnOptimizationRate: this.metrics.cdnOptimization.length > 0 ?
          this.metrics.cdnOptimization.filter(c => c.optimized.overall).length / this.metrics.cdnOptimization.length : 0,
        
        ruralCoverageRate: this.metrics.ruralCoverage.length > 0 ?
          this.metrics.ruralCoverage.filter(r => r.accessible).length / this.metrics.ruralCoverage.length : 0,
        
        ruralAvgLatency: this.metrics.ruralCoverage.length > 0 ?
          this.metrics.ruralCoverage.filter(r => r.accessible)
            .reduce((sum, r) => sum + r.avgLatency, 0) / 
          this.metrics.ruralCoverage.filter(r => r.accessible).length || 0 : 0
      },
      
      thresholds: this.thresholds,
      
      performance_status: {
        worker_performance: this.metrics.workerPerformance.every(w => w.p95EdgeProcessingTime <= this.thresholds.workerResponseTime),
        global_latency: this.metrics.globalLatency.length === 0 || 
          this.metrics.globalLatency.reduce((sum, g) => sum + g.avgRegionalLatency, 0) / this.metrics.globalLatency.length <= this.thresholds.globalLatency,
        edge_caching: this.metrics.edgeCaching.length === 0 ||
          this.metrics.edgeCaching.reduce((sum, c) => sum + c.cacheHitRatio, 0) / this.metrics.edgeCaching.length >= this.thresholds.cacheHitRatio,
        cdn_optimization: this.metrics.cdnOptimization.length === 0 ||
          this.metrics.cdnOptimization.filter(c => c.optimized.overall).length / this.metrics.cdnOptimization.length >= this.thresholds.cdnEfficiency,
        rural_coverage: this.metrics.ruralCoverage.length === 0 ||
          this.metrics.ruralCoverage.filter(r => r.accessible).length / this.metrics.ruralCoverage.length >= 0.9
      },
      
      detailed_metrics: {
        workerPerformance: this.metrics.workerPerformance,
        globalLatency: this.metrics.globalLatency,
        edgeCaching: this.metrics.edgeCaching,
        cdnOptimization: this.metrics.cdnOptimization,
        ruralCoverage: this.metrics.ruralCoverage
      },
      
      recommendations: this.generateEdgeOptimizationRecommendations()
    };
    
    report.overall_pass = Object.values(report.performance_status).every(status => status === true);
    
    return report;
  }

  generateEdgeOptimizationRecommendations() {
    const recommendations = [];
    
    // Worker performance
    const avgWorkerTime = this.metrics.workerPerformance.length > 0 ?
      this.metrics.workerPerformance.reduce((sum, w) => sum + w.avgEdgeProcessingTime, 0) / this.metrics.workerPerformance.length : 0;
    
    if (avgWorkerTime > this.thresholds.workerResponseTime) {
      recommendations.push({
        category: 'Worker Performance',
        priority: 'HIGH',
        issue: `Average worker processing time (${avgWorkerTime.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Optimize worker code for faster execution',
          'Implement caching for computed results',
          'Use WebAssembly for CPU-intensive operations',
          'Minimize external API calls from workers'
        ]
      });
    }
    
    // Global latency
    const globalLatency = this.metrics.globalLatency.length > 0 ?
      this.metrics.globalLatency.reduce((sum, g) => sum + g.avgRegionalLatency, 0) / this.metrics.globalLatency.length : 0;
    
    if (globalLatency > this.thresholds.globalLatency) {
      recommendations.push({
        category: 'Global Latency',
        priority: 'HIGH',
        issue: `Global average latency (${globalLatency.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Deploy to additional Cloudflare regions',
          'Implement smarter routing based on user location',
          'Use edge caching for more content types',
          'Optimize database queries to reduce processing time'
        ]
      });
    }
    
    // Edge caching
    const avgCacheHitRatio = this.metrics.edgeCaching.length > 0 ?
      this.metrics.edgeCaching.reduce((sum, c) => sum + c.cacheHitRatio, 0) / this.metrics.edgeCaching.length : 0;
    
    if (avgCacheHitRatio < this.thresholds.cacheHitRatio) {
      recommendations.push({
        category: 'Edge Caching',
        priority: 'MEDIUM',
        issue: `Cache hit ratio (${(avgCacheHitRatio * 100).toFixed(1)}%) below threshold`,
        recommendations: [
          'Increase cache TTL for appropriate content',
          'Implement cache warming strategies',
          'Add Vary headers for better cache segmentation',
          'Use cache tags for more efficient invalidation'
        ]
      });
    }
    
    // Rural coverage
    const ruralCoverage = this.metrics.ruralCoverage.length > 0 ?
      this.metrics.ruralCoverage.filter(r => r.accessible).length / this.metrics.ruralCoverage.length : 1;
    
    if (ruralCoverage < 0.9) {
      recommendations.push({
        category: 'Rural Coverage',
        priority: 'HIGH',
        issue: `Rural coverage (${(ruralCoverage * 100).toFixed(1)}%) below 90% target`,
        recommendations: [
          'Deploy to rural-focused edge locations',
          'Implement progressive enhancement for slow connections',
          'Add offline-first capabilities for critical features',
          'Use satellite-friendly protocols and compression'
        ]
      });
    }
    
    return recommendations;
  }
}

export default EdgePerformanceSuite;