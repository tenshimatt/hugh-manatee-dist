# GoHunta.com - Performance Specification

## Performance Architecture Overview

GoHunta.com must deliver exceptional performance for hunters using mobile devices in remote areas with limited connectivity. Performance is critical for real-time GPS tracking, offline functionality, and quick data access in field conditions.

## Performance Requirements & SLAs

### Core Performance Targets
```
Load Times:
- Initial page load: <2 seconds on 3G
- Critical path rendering: <1 second
- Time to interactive: <3 seconds
- Offline app boot: <500ms

Response Times:
- API responses: <300ms (95th percentile)
- Database queries: <100ms (95th percentile)
- GPS tracking updates: <50ms
- Image uploads: <5 seconds per 5MB

Throughput:
- Concurrent users: 10,000 during peak hunting seasons
- API requests: 50,000 per minute
- GPS updates: 1,000 per second
- File uploads: 500 concurrent

Resource Usage:
- Mobile battery impact: <5% per hour of tracking
- Mobile data usage: <10MB per hunt session
- Memory usage: <100MB on mobile devices
- CPU usage: <20% on average mobile device
```

## Frontend Performance Optimization

### Progressive Web App Performance

#### Positive Test Cases
```gherkin
Feature: PWA Performance Optimization

Scenario: Service worker caching efficiency
  Given user visits GoHunta for first time
  When app assets are cached by service worker
  Then critical resources cache within 500ms
  And subsequent visits load from cache in <200ms
  And cache size remains under 50MB
  And cache updates work seamlessly
  And offline functionality is immediate

Scenario: Code splitting and lazy loading
  Given user navigating through app sections
  When different features are accessed
  Then only required code bundles load
  And route transitions complete in <300ms
  And bundle sizes remain under 200KB
  And JavaScript execution time is minimized
  And loading states provide clear feedback

Scenario: Image optimization and lazy loading
  Given hunt photos and dog images loading
  When user scrolls through content
  Then images load progressively
  And WebP format serves when supported
  And responsive images match device size
  And lazy loading preserves bandwidth
  And loading placeholders prevent layout shift
```

#### Negative Test Cases
```gherkin
Scenario: Performance under poor network conditions
  Given user on slow 2G connection
  When app attempts to load
  Then critical content loads first
  And non-essential features degrade gracefully
  And loading times remain reasonable
  And user can still access core functions
  And offline mode activates appropriately

Scenario: Performance with large datasets
  Given user with 100+ hunt logs
  When viewing hunt history
  Then pagination prevents memory overload
  And virtualization handles large lists
  And search remains responsive
  And data loading is optimized
  And UI remains smooth during scrolling

Scenario: Performance on low-end devices
  Given user on older Android device
  When using resource-intensive features
  Then app remains responsive
  And memory usage stays within limits
  And battery drain is minimized
  And features degrade gracefully if needed
  And core functionality always works
```

#### Step Classes (Frontend Performance)
```typescript
// frontend-performance-steps.ts
export class FrontendPerformanceSteps {
  private performanceObserver: PerformanceObserver;
  private metrics: PerformanceEntry[] = [];

  async measurePageLoadPerformance() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      timeToInteractive: this.calculateTTI(),
      firstContentfulPaint: this.getFCP(),
      largestContentfulPaint: this.getLCP(),
      cumulativeLayoutShift: this.getCLS(),
      firstInputDelay: this.getFID()
    };

    // Assert performance targets
    expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(metrics.timeToInteractive).toBeLessThan(3000); // 3 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(1000); // 1 second
    expect(metrics.largestContentfulPaint).toBeLessThan(2500); // LCP target
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1); // CLS target
    expect(metrics.firstInputDelay).toBeLessThan(100); // FID target

    return metrics;
  }

  async testServiceWorkerCaching() {
    // Clear all caches first
    await this.clearAllCaches();

    const startTime = performance.now();
    
    // Load app for first time (network)
    await this.loadApp();
    const firstLoadTime = performance.now() - startTime;

    // Verify cache was populated
    const cacheEntries = await this.getCacheEntries();
    expect(cacheEntries.length).toBeGreaterThan(10);

    // Load app second time (from cache)
    await this.clearMemory();
    const cacheStartTime = performance.now();
    await this.loadApp();
    const cacheLoadTime = performance.now() - cacheStartTime;

    // Cache should be significantly faster
    expect(cacheLoadTime).toBeLessThan(firstLoadTime * 0.3);
    expect(cacheLoadTime).toBeLessThan(200); // Absolute target
  }

  async testCodeSplitting() {
    const bundleSizes = await this.getBundleSizes();
    
    // Main bundle should be small
    expect(bundleSizes.main).toBeLessThan(200 * 1024); // 200KB
    
    // Feature bundles should load on demand
    const routeTransitionTime = await this.measureRouteTransition('/hunt-logs');
    expect(routeTransitionTime).toBeLessThan(300);
    
    // Verify only required bundles are loaded
    const loadedBundles = await this.getLoadedBundles();
    expect(loadedBundles.includes('hunt-logs')).toBe(true);
    expect(loadedBundles.includes('community')).toBe(false); // Shouldn't be loaded yet
  }

  async testImageOptimization() {
    const testImages = [
      { src: '/test-hunt-photo.jpg', expectedFormat: 'webp' },
      { src: '/test-dog-photo.png', expectedFormat: 'webp' }
    ];

    for (const testImage of testImages) {
      const startTime = performance.now();
      
      const img = new Image();
      img.src = testImage.src;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // 1 second max

      // Check if WebP was served (browser support dependent)
      if (this.supportsWebP()) {
        expect(img.src).toContain('.webp');
      }
    }
  }

  async measureMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      
      const memoryUsage = {
        used: memInfo.usedJSHeapSize,
        allocated: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit
      };

      // Should use less than 100MB
      expect(memoryUsage.used).toBeLessThan(100 * 1024 * 1024);
      
      // Should not exceed 50% of available heap
      expect(memoryUsage.used / memoryUsage.limit).toBeLessThan(0.5);

      return memoryUsage;
    }
    
    return null;
  }

  private calculateTTI(): number {
    // Implementation of Time to Interactive calculation
    const longTasks = performance.getEntriesByType('longtask');
    const lastLongTask = longTasks[longTasks.length - 1];
    return lastLongTask ? lastLongTask.startTime + lastLongTask.duration : 0;
  }

  private getFCP(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  private getLCP(): number {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }
}
```

## Backend Performance Optimization

### Cloudflare Workers Performance

#### Positive Test Cases
```gherkin
Feature: Backend API Performance

Scenario: Database query optimization
  Given user requesting hunt logs
  When API endpoint is called
  Then database query executes in <50ms
  And proper indexes are used
  And query plan is optimized
  And response payload is minimal
  And caching headers are set appropriately

Scenario: Edge caching efficiency
  Given static content requests
  When content is requested multiple times
  Then CDN serves cached content
  And cache hit ratio exceeds 90%
  And cache invalidation works correctly
  And edge locations serve content
  And TTFB is under 100ms globally

Scenario: Concurrent request handling
  Given 1000 simultaneous API requests
  When requests hit backend workers
  Then all requests complete successfully
  And response times remain consistent
  And no requests timeout
  And error rate stays under 0.1%
  And system auto-scales appropriately
```

#### Negative Test Cases
```gherkin
Scenario: Performance under high load
  Given traffic spike during hunting season opening
  When request volume increases 10x
  Then response times increase gracefully
  And rate limiting protects backend
  And critical functions remain available
  And users receive appropriate feedback
  And system recovers automatically

Scenario: Database connection exhaustion
  Given maximum database connections reached
  When new requests arrive
  Then connection pooling manages load
  And requests queue appropriately
  And timeout handling works correctly
  And error messages are helpful
  And connections are recycled efficiently

Scenario: Large payload handling
  Given user uploading large hunt video
  When processing 100MB file
  Then upload streams correctly
  And memory usage remains controlled
  And progress reporting works
  And timeouts are appropriate
  And cleanup occurs on failure
```

#### Step Classes (Backend Performance)
```typescript
// backend-performance-steps.ts
export class BackendPerformanceSteps {
  private loadTestConfig = {
    baseURL: process.env.API_BASE_URL,
    authToken: process.env.TEST_AUTH_TOKEN
  };

  async testDatabaseQueryPerformance() {
    const queries = [
      { endpoint: '/api/dogs', expectedTime: 50 },
      { endpoint: '/api/hunts', expectedTime: 100 },
      { endpoint: '/api/community/posts', expectedTime: 150 },
      { endpoint: '/api/training/sessions', expectedTime: 75 }
    ];

    for (const query of queries) {
      const startTime = performance.now();
      
      const response = await fetch(`${this.loadTestConfig.baseURL}${query.endpoint}`, {
        headers: { 'Authorization': `Bearer ${this.loadTestConfig.authToken}` }
      });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(query.expectedTime);

      // Check for proper caching headers
      expect(response.headers.get('Cache-Control')).toBeDefined();
      expect(response.headers.get('ETag')).toBeDefined();
    }
  }

  async testConcurrentRequestHandling() {
    const concurrentRequests = 1000;
    const requestPromises = [];

    const startTime = performance.now();

    for (let i = 0; i < concurrentRequests; i++) {
      requestPromises.push(this.makeTestRequest());
    }

    const results = await Promise.allSettled(requestPromises);
    const endTime = performance.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const successRate = (successful / concurrentRequests) * 100;

    expect(successRate).toBeGreaterThan(99); // 99% success rate
    expect(endTime - startTime).toBeLessThan(5000); // Complete within 5 seconds
  }

  async testEdgeCachingEfficiency() {
    const cacheableEndpoint = '/api/public/hunting-areas';
    
    // First request (cache miss)
    const firstRequest = await this.makeTimedRequest(cacheableEndpoint);
    expect(firstRequest.headers.get('CF-Cache-Status')).toBe('MISS');

    // Second request (should be cache hit)
    const secondRequest = await this.makeTimedRequest(cacheableEndpoint);
    expect(secondRequest.headers.get('CF-Cache-Status')).toBe('HIT');
    
    // Cache hit should be significantly faster
    expect(secondRequest.responseTime).toBeLessThan(firstRequest.responseTime * 0.5);
    expect(secondRequest.responseTime).toBeLessThan(100); // Under 100ms
  }

  async testLoadSpike() {
    const normalLoad = 100; // requests per second
    const spikeLoad = 1000; // 10x spike

    // Establish baseline performance
    const baselineMetrics = await this.measureThroughput(normalLoad, 30); // 30 seconds
    
    // Test spike performance
    const spikeMetrics = await this.measureThroughput(spikeLoad, 60); // 60 seconds

    // Performance should degrade gracefully
    expect(spikeMetrics.averageResponseTime).toBeLessThan(baselineMetrics.averageResponseTime * 3);
    expect(spikeMetrics.errorRate).toBeLessThan(1); // Under 1% error rate
    expect(spikeMetrics.p95ResponseTime).toBeLessThan(1000); // Under 1 second
  }

  async measureThroughput(requestsPerSecond: number, durationSeconds: number) {
    const responseTimes: number[] = [];
    const errors: number[] = [];
    const startTime = Date.now();

    while ((Date.now() - startTime) < (durationSeconds * 1000)) {
      const requestPromises = [];
      
      for (let i = 0; i < requestsPerSecond; i++) {
        requestPromises.push(this.makeTimedRequest('/api/health'));
      }

      const results = await Promise.allSettled(requestPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          responseTimes.push(result.value.responseTime);
        } else {
          errors.push(index);
        }
      });

      await this.sleep(1000); // Wait 1 second
    }

    return {
      averageResponseTime: this.average(responseTimes),
      p95ResponseTime: this.percentile(responseTimes, 95),
      errorRate: (errors.length / (responseTimes.length + errors.length)) * 100,
      totalRequests: responseTimes.length + errors.length
    };
  }

  private async makeTimedRequest(endpoint: string) {
    const startTime = performance.now();
    
    const response = await fetch(`${this.loadTestConfig.baseURL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${this.loadTestConfig.authToken}` }
    });
    
    const endTime = performance.now();

    return {
      response,
      responseTime: endTime - startTime,
      headers: response.headers,
      status: response.status
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private percentile(numbers: number[], p: number): number {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

## Mobile Performance Optimization

### GPS and Location Performance

#### Positive Test Cases
```gherkin
Feature: GPS Tracking Performance

Scenario: Efficient GPS tracking
  Given user starts hunt with GPS tracking
  When location updates are captured
  Then GPS polling uses optimal frequency
  And battery usage is minimized
  And location accuracy is maintained
  And data is buffered efficiently
  And background processing is optimized

Scenario: Offline GPS performance
  Given user hunting in no-signal area
  When GPS data is captured offline
  Then local storage remains efficient
  And data compression is applied
  And sync queues are managed properly
  And storage limits are respected
  And cleanup happens automatically
```

#### Step Classes (Mobile Performance)
```typescript
// mobile-performance-steps.ts
export class MobilePerformanceSteps {
  async testGPSTrackingEfficiency() {
    const trackingOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    const positions: GeolocationPosition[] = [];
    const startTime = Date.now();
    const testDuration = 60000; // 1 minute

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        positions.push(position);
      },
      (error) => {
        console.error('GPS Error:', error);
      },
      trackingOptions
    );

    await this.sleep(testDuration);
    navigator.geolocation.clearWatch(watchId);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // Verify reasonable number of position updates
    const expectedUpdates = actualDuration / 5000; // Every 5 seconds
    expect(positions.length).toBeGreaterThan(expectedUpdates * 0.8);

    // Check accuracy
    const accuracies = positions.map(p => p.coords.accuracy);
    const averageAccuracy = this.average(accuracies);
    expect(averageAccuracy).toBeLessThan(20); // Within 20 meters

    return {
      positionCount: positions.length,
      averageAccuracy,
      duration: actualDuration
    };
  }

  async testBatteryUsageOptimization() {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      const initialLevel = battery.level;
      const startTime = Date.now();

      // Simulate 1 hour of typical usage
      await this.simulateHuntSession();

      const endTime = Date.now();
      const finalLevel = battery.level;
      const sessionDuration = (endTime - startTime) / (1000 * 60 * 60); // hours

      const batteryDrain = (initialLevel - finalLevel) / sessionDuration;
      
      // Should use less than 5% battery per hour
      expect(batteryDrain).toBeLessThan(0.05);

      return {
        initialBattery: initialLevel,
        finalBattery: finalLevel,
        drainPerHour: batteryDrain,
        sessionDuration
      };
    }

    return null; // Battery API not available
  }

  async testOfflineStoragePerformance() {
    const testData = this.generateHuntData(100); // 100 hunt logs
    
    // Test storage write performance
    const writeStartTime = performance.now();
    
    for (const hunt of testData) {
      await this.storeOfflineData('hunts', hunt);
    }
    
    const writeEndTime = performance.now();
    const writeTime = writeEndTime - writeStartTime;

    expect(writeTime).toBeLessThan(1000); // Under 1 second for 100 items

    // Test storage read performance
    const readStartTime = performance.now();
    const retrievedData = await this.getOfflineData('hunts');
    const readEndTime = performance.now();
    const readTime = readEndTime - readStartTime;

    expect(readTime).toBeLessThan(500); // Under 500ms to read
    expect(retrievedData.length).toBe(testData.length);

    // Test storage size efficiency
    const storageSize = await this.getStorageSize();
    expect(storageSize).toBeLessThan(50 * 1024 * 1024); // Under 50MB

    return {
      writeTime,
      readTime,
      storageSize,
      itemCount: testData.length
    };
  }

  async testDataCompressionEfficiency() {
    const largeHuntData = this.generateLargeHuntData();
    const originalSize = JSON.stringify(largeHuntData).length;

    // Test compression
    const compressedData = await this.compressData(largeHuntData);
    const compressedSize = compressedData.length;

    const compressionRatio = compressedSize / originalSize;
    expect(compressionRatio).toBeLessThan(0.3); // At least 70% compression

    // Test decompression performance
    const decompressStartTime = performance.now();
    const decompressedData = await this.decompressData(compressedData);
    const decompressTime = performance.now() - decompressStartTime;

    expect(decompressTime).toBeLessThan(100); // Under 100ms
    expect(JSON.stringify(decompressedData)).toBe(JSON.stringify(largeHuntData));

    return {
      originalSize,
      compressedSize,
      compressionRatio,
      decompressTime
    };
  }

  private async simulateHuntSession() {
    // Simulate typical 1-hour hunt activities
    const activities = [
      () => this.simulateGPSTracking(3600), // 1 hour of GPS
      () => this.simulatePhotoCapture(10), // 10 photos
      () => this.simulateDataEntry(5), // 5 data entries
      () => this.simulateMapViewing(600) // 10 minutes of map viewing
    ];

    await Promise.all(activities.map(activity => activity()));
  }

  private async storeOfflineData(collection: string, data: any) {
    // Use IndexedDB for offline storage
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GoHuntaOffline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([collection], 'readwrite');
        const store = transaction.objectStore(collection);
        
        const addRequest = store.add(data);
        addRequest.onsuccess = () => resolve(addRequest.result);
        addRequest.onerror = () => reject(addRequest.error);
      };
    });
  }
}
```

## Database Performance Optimization

### Query Performance Testing

#### Positive Test Cases
```gherkin
Feature: Database Query Performance

Scenario: Optimized hunt log queries
  Given database with 100,000 hunt logs
  When querying user's recent hunts
  Then query executes in under 50ms
  And proper indexes are utilized
  And result set is properly limited
  And pagination works efficiently
  And cache invalidation is handled

Scenario: Complex aggregation performance
  Given large dataset for analytics
  When generating performance statistics
  Then aggregation queries complete quickly
  And memory usage remains reasonable
  And results are cached appropriately
  And concurrent queries don't interfere
  And query plan is optimized
```

#### Step Classes (Database Performance)
```typescript
// database-performance-steps.ts
export class DatabasePerformanceSteps {
  async testQueryPerformance() {
    const queries = [
      {
        name: 'user_hunts',
        sql: 'SELECT * FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT 20',
        expectedTime: 50
      },
      {
        name: 'dog_performance',
        sql: 'SELECT AVG(performance_rating) FROM training_sessions WHERE dog_id = ? AND session_date > ?',
        expectedTime: 30
      },
      {
        name: 'community_posts',
        sql: 'SELECT * FROM community_posts WHERE region = ? ORDER BY created_at DESC LIMIT 10',
        expectedTime: 75
      }
    ];

    for (const query of queries) {
      const startTime = performance.now();
      
      const result = await this.executeQuery(query.sql, this.getTestParams(query.name));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(query.expectedTime);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    }
  }

  async testIndexUtilization() {
    const indexQueries = [
      'EXPLAIN QUERY PLAN SELECT * FROM hunt_logs WHERE user_id = ?',
      'EXPLAIN QUERY PLAN SELECT * FROM dogs WHERE user_id = ? AND breed = ?',
      'EXPLAIN QUERY PLAN SELECT * FROM training_sessions WHERE dog_id = ? ORDER BY session_date DESC'
    ];

    for (const query of indexQueries) {
      const plan = await this.executeQuery(query, ['test_param']);
      
      // Verify index is being used (not doing table scan)
      const planText = plan.map((row: any) => row.detail).join(' ');
      expect(planText).not.toContain('SCAN TABLE');
      expect(planText).toContain('USING INDEX');
    }
  }

  async testConcurrentQueryPerformance() {
    const concurrentQueries = 100;
    const queryPromises = [];

    const startTime = performance.now();

    for (let i = 0; i < concurrentQueries; i++) {
      queryPromises.push(this.executeTestQuery(i));
    }

    const results = await Promise.allSettled(queryPromises);
    const endTime = performance.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const successRate = (successful / concurrentQueries) * 100;

    expect(successRate).toBeGreaterThan(95); // 95% success rate
    expect(endTime - startTime).toBeLessThan(2000); // Complete within 2 seconds
  }

  async testLargeDatasetPerformance() {
    // Create large test dataset
    await this.createLargeTestDataset();

    const performanceQueries = [
      {
        name: 'paginated_hunts',
        query: 'SELECT * FROM hunt_logs ORDER BY hunt_date DESC LIMIT 20 OFFSET ?',
        params: [1000]
      },
      {
        name: 'filtered_search',
        query: 'SELECT * FROM hunt_logs WHERE location LIKE ? AND hunt_date > ?',
        params: ['%Montana%', '2023-01-01']
      },
      {
        name: 'aggregated_stats',
        query: 'SELECT user_id, COUNT(*) as hunt_count, AVG(success_rating) as avg_rating FROM hunt_logs GROUP BY user_id',
        params: []
      }
    ];

    for (const testQuery of performanceQueries) {
      const startTime = performance.now();
      
      const result = await this.executeQuery(testQuery.query, testQuery.params);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(200); // Under 200ms even with large dataset
      expect(result).toBeDefined();
    }
  }

  private async createLargeTestDataset() {
    const batchSize = 1000;
    const totalRecords = 100000;

    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < totalRecords; j++) {
        batch.push(this.generateTestHuntLog(i + j));
      }

      await this.insertBatch('hunt_logs', batch);
    }
  }

  private generateTestHuntLog(index: number) {
    return {
      id: `hunt_${index}`,
      user_id: `user_${index % 1000}`, // 1000 different users
      hunt_date: new Date(2023, 0, 1 + (index % 365)).toISOString(),
      location: `Location ${index % 100}`,
      duration: 120 + (index % 180),
      success_rating: 1 + (index % 5),
      created_at: new Date().toISOString()
    };
  }
}
```

## Real-User Monitoring (RUM)

### Performance Monitoring Implementation

```typescript
// performance-monitoring.ts
export class PerformanceMonitoring {
  private metrics: Map<string, number[]> = new Map();

  initializeRUM() {
    // Web Vitals monitoring
    this.observeWebVitals();
    
    // Custom performance monitoring
    this.observeCustomMetrics();
    
    // Resource timing monitoring
    this.observeResourceTiming();
    
    // User interaction monitoring
    this.observeUserInteractions();
  }

  private observeWebVitals() {
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('first_input_delay', entry.processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.recordMetric('cumulative_layout_shift', clsValue);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeCustomMetrics() {
    // Hunt log creation time
    this.measureAsyncOperation('hunt_log_creation', async () => {
      // Implemented when hunt log is created
    });

    // GPS lock time
    this.measureAsyncOperation('gps_lock_time', async () => {
      // Implemented when GPS gets first fix
    });

    // Offline sync time
    this.measureAsyncOperation('offline_sync_time', async () => {
      // Implemented when offline data syncs
    });
  }

  private async measureAsyncOperation(metricName: string, operation: () => Promise<void>) {
    const startTime = performance.now();
    
    try {
      await operation();
      const duration = performance.now() - startTime;
      this.recordMetric(metricName, duration);
    } catch (error) {
      this.recordMetric(`${metricName}_error`, 1);
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(value);
    
    // Send to analytics if significant metric
    if (this.isSignificantMetric(name, value)) {
      this.sendToAnalytics(name, value);
    }
  }

  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds = {
      'first_input_delay': 100,
      'largest_contentful_paint': 2500,
      'cumulative_layout_shift': 0.1,
      'hunt_log_creation': 1000,
      'gps_lock_time': 10000
    };

    return value > (thresholds[name] || 1000);
  }

  private sendToAnalytics(metricName: string, value: number) {
    // Send performance data to analytics service
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metricName,
        value: value,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        connection: this.getConnectionInfo()
      })
    }).catch(err => console.warn('Analytics failed:', err));
  }

  getPerformanceReport() {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      report[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    });

    return report;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return null;
  }
}
```

This performance specification provides comprehensive testing and monitoring for all aspects of the GoHunta platform, ensuring optimal performance for hunters in challenging field conditions.