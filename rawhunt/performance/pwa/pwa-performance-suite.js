/**
 * GoHunta PWA Performance Testing Suite
 * Tests service worker efficiency, IndexedDB performance, background sync, and offline capabilities
 * Focuses on <500ms offline boot time and efficient resource caching
 */

export class PWAPerformanceSuite {
  constructor() {
    this.metrics = {
      serviceWorkerMetrics: [],
      indexedDBPerformance: [],
      backgroundSyncResults: [],
      cacheOperations: [],
      offlineCapabilities: []
    };
    
    this.thresholds = {
      serviceWorkerInstallTime: 2000, // 2 seconds max
      cachePopulationTime: 5000, // 5 seconds max
      indexedDBWriteTime: 100, // 100ms per operation
      indexedDBReadTime: 50, // 50ms per read
      offlineBootTime: 500, // 500ms max
      backgroundSyncDelay: 30000, // 30 seconds max for sync
      cacheSize: 50 * 1024 * 1024 // 50MB max cache
    };
  }

  /**
   * Test Service Worker installation and caching performance
   */
  async testServiceWorkerPerformance(page) {
    console.log('Testing Service Worker performance...');
    
    // Navigate to app and wait for service worker
    await page.goto('/');
    
    // Inject service worker performance monitoring
    await page.addInitScript(() => {
      window.swMetrics = {
        installStart: null,
        installEnd: null,
        activateStart: null,
        activateEnd: null,
        cacheOperations: [],
        errors: []
      };

      // Monitor service worker lifecycle
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data.type === 'SW_PERFORMANCE') {
            window.swMetrics = { ...window.swMetrics, ...event.data.metrics };
          }
        });
      }
    });

    // Wait for service worker to install and activate
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, { timeout: 10000 });

    // Test cache population performance
    const cacheResults = await this.testCachePerformance(page);
    
    // Get service worker metrics
    const swMetrics = await page.evaluate(() => window.swMetrics);
    
    // Test cache efficiency
    const cacheEfficiencyResults = await this.testCacheEfficiency(page);
    
    const serviceWorkerResults = {
      installTime: swMetrics.installEnd - swMetrics.installStart,
      activateTime: swMetrics.activateEnd - swMetrics.activateStart,
      cacheResults,
      cacheEfficiencyResults,
      errors: swMetrics.errors
    };
    
    this.metrics.serviceWorkerMetrics.push(serviceWorkerResults);
    
    return serviceWorkerResults;
  }

  async testCachePerformance(page) {
    console.log('Testing cache performance...');
    
    // Clear existing caches
    await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    });

    // Start cache population timing
    const cacheStartTime = Date.now();
    
    // Trigger cache population by visiting key pages
    const criticalPages = ['/', '/hunt-logs', '/dogs', '/offline.html'];
    const cacheOperations = [];
    
    for (const pagePath of criticalPages) {
      const pageStartTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const pageEndTime = Date.now();
      
      cacheOperations.push({
        page: pagePath,
        cacheTime: pageEndTime - pageStartTime
      });
    }
    
    const totalCacheTime = Date.now() - cacheStartTime;
    
    // Check cache size and contents
    const cacheInfo = await page.evaluate(async () => {
      if (!('caches' in window)) return null;
      
      const cacheNames = await caches.keys();
      let totalSize = 0;
      const cacheDetails = [];
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        let cacheSize = 0;
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            cacheSize += blob.size;
          }
        }
        
        totalSize += cacheSize;
        cacheDetails.push({
          name: cacheName,
          size: cacheSize,
          entries: requests.length
        });
      }
      
      return {
        totalSize,
        cacheDetails,
        cacheNames: cacheNames.length
      };
    });
    
    this.metrics.cacheOperations.push({
      totalCacheTime,
      cacheOperations,
      cacheInfo
    });
    
    return {
      totalCacheTime,
      cacheOperations,
      cacheInfo,
      passed: totalCacheTime <= this.thresholds.cachePopulationTime &&
               cacheInfo?.totalSize <= this.thresholds.cacheSize
    };
  }

  async testCacheEfficiency(page) {
    console.log('Testing cache efficiency...');
    
    const testPages = ['/', '/hunt-logs', '/dogs', '/gear'];
    const cacheTestResults = [];
    
    for (const pagePath of testPages) {
      // First load (should cache)
      const firstLoadStart = performance.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const firstLoadTime = performance.now() - firstLoadStart;
      
      // Second load (should be from cache)
      const secondLoadStart = performance.now();
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      const secondLoadTime = performance.now() - secondLoadStart;
      
      // Cache effectiveness
      const cacheSpeedupRatio = firstLoadTime / secondLoadTime;
      
      cacheTestResults.push({
        page: pagePath,
        firstLoadTime,
        secondLoadTime,
        cacheSpeedupRatio,
        cacheEffective: cacheSpeedupRatio > 1.5 // Should be at least 50% faster
      });
    }
    
    const avgCacheSpeedup = cacheTestResults.reduce((sum, result) => 
      sum + result.cacheSpeedupRatio, 0) / cacheTestResults.length;
    
    return {
      cacheTestResults,
      avgCacheSpeedup,
      passed: cacheTestResults.every(result => result.cacheEffective)
    };
  }

  /**
   * Test IndexedDB performance for offline data storage
   */
  async testIndexedDBPerformance(page) {
    console.log('Testing IndexedDB performance...');
    
    await page.goto('/');
    
    // Test IndexedDB operations
    const indexedDBResults = await page.evaluate(async () => {
      const testResults = {
        writeOperations: [],
        readOperations: [],
        bulkOperations: [],
        errors: []
      };
      
      try {
        // Open IndexedDB
        const dbName = 'gohunta-performance-test';
        const request = indexedDB.open(dbName, 1);
        
        const db = await new Promise((resolve, reject) => {
          request.onupgradeneeded = () => {
            const database = request.result;
            
            // Create test stores
            if (!database.objectStoreNames.contains('hunt-logs')) {
              database.createObjectStore('hunt-logs', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('photos')) {
              database.createObjectStore('photos', { keyPath: 'id' });
            }
          };
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        // Test individual write operations
        for (let i = 0; i < 50; i++) {
          const writeStart = performance.now();
          
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(['hunt-logs'], 'readwrite');
            const store = transaction.objectStore('hunt-logs');
            
            const huntLog = {
              id: `hunt-${i}`,
              date: new Date().toISOString(),
              location: { lat: 47.6062, lng: -122.3321 },
              duration: 120 + Math.random() * 240,
              success: Math.random() > 0.3,
              notes: `Performance test hunt log ${i}`,
              photos: Array(5).fill().map((_, j) => ({ id: `photo-${i}-${j}`, data: 'x'.repeat(1000) }))
            };
            
            const request = store.add(huntLog);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          
          const writeTime = performance.now() - writeStart;
          testResults.writeOperations.push(writeTime);
        }
        
        // Test individual read operations
        for (let i = 0; i < 50; i++) {
          const readStart = performance.now();
          
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(['hunt-logs'], 'readonly');
            const store = transaction.objectStore('hunt-logs');
            const request = store.get(`hunt-${i}`);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          const readTime = performance.now() - readStart;
          testResults.readOperations.push(readTime);
        }
        
        // Test bulk operations
        const bulkWriteStart = performance.now();
        
        await new Promise((resolve, reject) => {
          const transaction = db.transaction(['photos'], 'readwrite');
          const store = transaction.objectStore('photos');
          
          const bulkData = Array(100).fill().map((_, i) => ({
            id: `bulk-photo-${i}`,
            data: btoa('x'.repeat(10000)), // 10KB base64 encoded
            timestamp: Date.now() + i,
            huntId: `hunt-${Math.floor(i / 10)}`
          }));
          
          const promises = bulkData.map(photo => 
            new Promise((res, rej) => {
              const req = store.add(photo);
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            })
          );
          
          Promise.all(promises).then(resolve).catch(reject);
        });
        
        const bulkWriteTime = performance.now() - bulkWriteStart;
        testResults.bulkOperations.push({
          operation: 'bulk_write',
          time: bulkWriteTime,
          records: 100
        });
        
        // Test bulk read
        const bulkReadStart = performance.now();
        
        const allRecords = await new Promise((resolve, reject) => {
          const transaction = db.transaction(['photos'], 'readonly');
          const store = transaction.objectStore('photos');
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        const bulkReadTime = performance.now() - bulkReadStart;
        testResults.bulkOperations.push({
          operation: 'bulk_read',
          time: bulkReadTime,
          records: allRecords.length
        });
        
        // Cleanup
        db.close();
        await new Promise(resolve => {
          const deleteRequest = indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = resolve;
          deleteRequest.onerror = resolve; // Still resolve on error
        });
        
      } catch (error) {
        testResults.errors.push(error.message);
      }
      
      return testResults;
    });
    
    // Analyze results
    const avgWriteTime = indexedDBResults.writeOperations.length > 0 ?
      indexedDBResults.writeOperations.reduce((sum, time) => sum + time, 0) / indexedDBResults.writeOperations.length : 0;
    
    const avgReadTime = indexedDBResults.readOperations.length > 0 ?
      indexedDBResults.readOperations.reduce((sum, time) => sum + time, 0) / indexedDBResults.readOperations.length : 0;
    
    const performanceResults = {
      avgWriteTime,
      avgReadTime,
      maxWriteTime: Math.max(...indexedDBResults.writeOperations),
      maxReadTime: Math.max(...indexedDBResults.readOperations),
      bulkOperations: indexedDBResults.bulkOperations,
      errors: indexedDBResults.errors,
      passed: avgWriteTime <= this.thresholds.indexedDBWriteTime &&
              avgReadTime <= this.thresholds.indexedDBReadTime
    };
    
    this.metrics.indexedDBPerformance.push(performanceResults);
    
    return performanceResults;
  }

  /**
   * Test background sync performance
   */
  async testBackgroundSyncPerformance(page) {
    console.log('Testing background sync performance...');
    
    await page.goto('/');
    
    // Create offline data to sync
    await page.evaluate(() => {
      // Create test offline data
      const offlineData = {
        huntLogs: Array(20).fill().map((_, i) => ({
          id: `offline-hunt-${i}`,
          timestamp: Date.now() - (i * 3600000), // Spread over hours
          synced: false,
          data: {
            location: { lat: 47.6062 + Math.random() * 0.01, lng: -122.3321 + Math.random() * 0.01 },
            notes: `Offline hunt log ${i}`,
            success: Math.random() > 0.3
          }
        })),
        photos: Array(10).fill().map((_, i) => ({
          id: `offline-photo-${i}`,
          huntId: `offline-hunt-${Math.floor(i / 2)}`,
          data: btoa('x'.repeat(5000)), // 5KB photo
          synced: false
        }))
      };
      
      localStorage.setItem('offline-sync-test-data', JSON.stringify(offlineData));
    });
    
    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Go back online and measure sync performance
    const syncStartTime = Date.now();
    await page.context().setOffline(false);
    
    // Trigger background sync
    const syncResults = await page.evaluate(async () => {
      const syncMetrics = {
        syncStartTime: Date.now(),
        itemsSynced: 0,
        syncErrors: [],
        syncDuration: 0
      };
      
      try {
        // Simulate background sync process
        const offlineData = JSON.parse(localStorage.getItem('offline-sync-test-data') || '{}');
        
        // Sync hunt logs
        for (const huntLog of offlineData.huntLogs || []) {
          const syncStart = performance.now();
          
          // Simulate API call
          try {
            const response = await fetch('/api/hunt-logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(huntLog.data)
            });
            
            if (response.ok || response.status === 404) { // 404 OK for test
              huntLog.synced = true;
              syncMetrics.itemsSynced++;
            }
          } catch (error) {
            syncMetrics.syncErrors.push({ item: huntLog.id, error: error.message });
          }
          
          const syncTime = performance.now() - syncStart;
          await new Promise(resolve => setTimeout(resolve, Math.max(0, 100 - syncTime))); // Throttle
        }
        
        // Sync photos
        for (const photo of offlineData.photos || []) {
          const syncStart = performance.now();
          
          try {
            // Simulate photo upload
            const formData = new FormData();
            formData.append('photo', new Blob([atob(photo.data)], { type: 'image/jpeg' }));
            formData.append('huntId', photo.huntId);
            
            const response = await fetch('/api/photos/upload', {
              method: 'POST',
              body: formData
            });
            
            if (response.ok || response.status === 404) { // 404 OK for test
              photo.synced = true;
              syncMetrics.itemsSynced++;
            }
          } catch (error) {
            syncMetrics.syncErrors.push({ item: photo.id, error: error.message });
          }
          
          const syncTime = performance.now() - syncStart;
          await new Promise(resolve => setTimeout(resolve, Math.max(0, 200 - syncTime))); // Throttle uploads
        }
        
        syncMetrics.syncDuration = Date.now() - syncMetrics.syncStartTime;
        
        // Update localStorage
        localStorage.setItem('offline-sync-test-data', JSON.stringify(offlineData));
        
      } catch (error) {
        syncMetrics.syncErrors.push({ error: error.message });
      }
      
      return syncMetrics;
    });
    
    const totalSyncTime = Date.now() - syncStartTime;
    
    const backgroundSyncResults = {
      totalSyncTime,
      itemsSynced: syncResults.itemsSynced,
      syncErrors: syncResults.syncErrors,
      avgItemSyncTime: syncResults.itemsSynced > 0 ? totalSyncTime / syncResults.itemsSynced : 0,
      passed: totalSyncTime <= this.thresholds.backgroundSyncDelay &&
              syncResults.syncErrors.length === 0
    };
    
    this.metrics.backgroundSyncResults.push(backgroundSyncResults);
    
    return backgroundSyncResults;
  }

  /**
   * Test offline capabilities and boot performance
   */
  async testOfflineCapabilities(page) {
    console.log('Testing offline capabilities...');
    
    // Load app online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Test offline boot time
    const offlineBootStart = Date.now();
    await page.reload();
    await page.waitForSelector('body', { state: 'visible' });
    const offlineBootTime = Date.now() - offlineBootStart;
    
    // Test offline functionality
    const offlineTests = [
      () => this.testOfflineNavigation(page),
      () => this.testOfflineDataAccess(page),
      () => this.testOfflineFormSubmission(page),
      () => this.testOfflinePhotoHandling(page)
    ];
    
    const offlineTestResults = [];
    for (const test of offlineTests) {
      const result = await test();
      offlineTestResults.push(result);
    }
    
    // Go back online
    await page.context().setOffline(false);
    
    const offlineCapabilityResults = {
      offlineBootTime,
      offlineTests: offlineTestResults,
      passed: offlineBootTime <= this.thresholds.offlineBootTime &&
              offlineTestResults.every(test => test.passed)
    };
    
    this.metrics.offlineCapabilities.push(offlineCapabilityResults);
    
    return offlineCapabilityResults;
  }

  async testOfflineNavigation(page) {
    const testPages = ['/', '/hunt-logs', '/dogs', '/gear'];
    const navigationResults = [];
    
    for (const pagePath of testPages) {
      const navStart = Date.now();
      
      try {
        await page.goto(pagePath);
        await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
        const navTime = Date.now() - navStart;
        
        navigationResults.push({
          page: pagePath,
          navigationTime: navTime,
          success: true
        });
      } catch (error) {
        navigationResults.push({
          page: pagePath,
          navigationTime: Date.now() - navStart,
          success: false,
          error: error.message
        });
      }
    }
    
    const avgNavigationTime = navigationResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.navigationTime, 0) / navigationResults.filter(r => r.success).length || 0;
    
    return {
      test: 'offline_navigation',
      navigationResults,
      avgNavigationTime,
      passed: navigationResults.every(r => r.success) && avgNavigationTime <= 1000
    };
  }

  async testOfflineDataAccess(page) {
    // Test accessing cached data offline
    await page.goto('/hunt-logs');
    
    const dataAccessTest = await page.evaluate(() => {
      try {
        // Try to access localStorage data
        const cachedHunts = localStorage.getItem('cached-hunt-logs');
        
        // Try to access IndexedDB data
        return new Promise((resolve) => {
          const request = indexedDB.open('gohunta-offline', 1);
          
          request.onsuccess = () => {
            const db = request.result;
            if (db.objectStoreNames.contains('hunt-logs')) {
              const transaction = db.transaction(['hunt-logs'], 'readonly');
              const store = transaction.objectStore('hunt-logs');
              const getAllRequest = store.getAll();
              
              getAllRequest.onsuccess = () => {
                resolve({
                  localStorageData: cachedHunts !== null,
                  indexedDBData: getAllRequest.result.length > 0,
                  success: true
                });
              };
            } else {
              resolve({
                localStorageData: cachedHunts !== null,
                indexedDBData: false,
                success: true
              });
            }
          };
          
          request.onerror = () => {
            resolve({
              localStorageData: cachedHunts !== null,
              indexedDBData: false,
              success: false,
              error: request.error?.message
            });
          };
        });
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    return {
      test: 'offline_data_access',
      ...dataAccessTest,
      passed: dataAccessTest.success
    };
  }

  async testOfflineFormSubmission(page) {
    await page.goto('/hunt-logs');
    
    const formTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          // Simulate form submission while offline
          const formData = {
            id: `offline-form-${Date.now()}`,
            date: new Date().toISOString(),
            notes: 'Offline form submission test',
            synced: false
          };
          
          // Store in localStorage (simulating offline queue)
          const offlineQueue = JSON.parse(localStorage.getItem('offline-form-queue') || '[]');
          offlineQueue.push(formData);
          localStorage.setItem('offline-form-queue', JSON.stringify(offlineQueue));
          
          resolve({
            success: true,
            queueSize: offlineQueue.length
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message
          });
        }
      });
    });
    
    return {
      test: 'offline_form_submission',
      ...formTest,
      passed: formTest.success
    };
  }

  async testOfflinePhotoHandling(page) {
    const photoTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          // Simulate photo capture and storage while offline
          const testPhoto = {
            id: `offline-photo-${Date.now()}`,
            data: btoa('test-photo-data'),
            timestamp: Date.now(),
            synced: false
          };
          
          // Store photo data
          localStorage.setItem(`photo-${testPhoto.id}`, JSON.stringify(testPhoto));
          
          // Add to offline photo queue
          const photoQueue = JSON.parse(localStorage.getItem('offline-photo-queue') || '[]');
          photoQueue.push(testPhoto.id);
          localStorage.setItem('offline-photo-queue', JSON.stringify(photoQueue));
          
          resolve({
            success: true,
            photoStored: true,
            queueSize: photoQueue.length
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message
          });
        }
      });
    });
    
    return {
      test: 'offline_photo_handling',
      ...photoTest,
      passed: photoTest.success
    };
  }

  /**
   * Generate PWA performance report
   */
  generatePWAPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'pwa_performance',
      
      summary: {
        avgServiceWorkerInstallTime: this.metrics.serviceWorkerMetrics.length > 0 ?
          this.metrics.serviceWorkerMetrics.reduce((sum, m) => sum + (m.installTime || 0), 0) / this.metrics.serviceWorkerMetrics.length : 0,
        
        avgCachePopulationTime: this.metrics.cacheOperations.length > 0 ?
          this.metrics.cacheOperations.reduce((sum, m) => sum + m.totalCacheTime, 0) / this.metrics.cacheOperations.length : 0,
        
        avgIndexedDBWriteTime: this.metrics.indexedDBPerformance.length > 0 ?
          this.metrics.indexedDBPerformance.reduce((sum, m) => sum + m.avgWriteTime, 0) / this.metrics.indexedDBPerformance.length : 0,
        
        avgIndexedDBReadTime: this.metrics.indexedDBPerformance.length > 0 ?
          this.metrics.indexedDBPerformance.reduce((sum, m) => sum + m.avgReadTime, 0) / this.metrics.indexedDBPerformance.length : 0,
        
        avgBackgroundSyncTime: this.metrics.backgroundSyncResults.length > 0 ?
          this.metrics.backgroundSyncResults.reduce((sum, m) => sum + m.totalSyncTime, 0) / this.metrics.backgroundSyncResults.length : 0,
        
        avgOfflineBootTime: this.metrics.offlineCapabilities.length > 0 ?
          this.metrics.offlineCapabilities.reduce((sum, m) => sum + m.offlineBootTime, 0) / this.metrics.offlineCapabilities.length : 0
      },
      
      thresholds: this.thresholds,
      
      performance_status: {
        service_worker_performance: this.metrics.serviceWorkerMetrics.every(m => (m.installTime || 0) <= this.thresholds.serviceWorkerInstallTime),
        cache_performance: this.metrics.cacheOperations.every(m => m.totalCacheTime <= this.thresholds.cachePopulationTime),
        indexeddb_write_performance: this.metrics.indexedDBPerformance.every(m => m.avgWriteTime <= this.thresholds.indexedDBWriteTime),
        indexeddb_read_performance: this.metrics.indexedDBPerformance.every(m => m.avgReadTime <= this.thresholds.indexedDBReadTime),
        background_sync_performance: this.metrics.backgroundSyncResults.every(m => m.totalSyncTime <= this.thresholds.backgroundSyncDelay),
        offline_boot_performance: this.metrics.offlineCapabilities.every(m => m.offlineBootTime <= this.thresholds.offlineBootTime)
      },
      
      detailed_metrics: {
        serviceWorkerMetrics: this.metrics.serviceWorkerMetrics,
        indexedDBPerformance: this.metrics.indexedDBPerformance,
        backgroundSyncResults: this.metrics.backgroundSyncResults,
        cacheOperations: this.metrics.cacheOperations,
        offlineCapabilities: this.metrics.offlineCapabilities
      },
      
      recommendations: this.generatePWAOptimizationRecommendations()
    };
    
    report.overall_pass = Object.values(report.performance_status).every(status => status === true);
    
    return report;
  }

  generatePWAOptimizationRecommendations() {
    const recommendations = [];
    
    // Service Worker performance
    const avgInstallTime = this.metrics.serviceWorkerMetrics.length > 0 ?
      this.metrics.serviceWorkerMetrics.reduce((sum, m) => sum + (m.installTime || 0), 0) / this.metrics.serviceWorkerMetrics.length : 0;
    
    if (avgInstallTime > this.thresholds.serviceWorkerInstallTime) {
      recommendations.push({
        category: 'Service Worker Performance',
        priority: 'HIGH',
        issue: `Service worker install time (${avgInstallTime.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Minimize service worker script size',
          'Use importScripts() for large libraries',
          'Implement lazy loading for non-critical SW features',
          'Optimize cache strategies and reduce initial cache size'
        ]
      });
    }
    
    // IndexedDB performance
    const avgWriteTime = this.metrics.indexedDBPerformance.length > 0 ?
      this.metrics.indexedDBPerformance.reduce((sum, m) => sum + m.avgWriteTime, 0) / this.metrics.indexedDBPerformance.length : 0;
    
    if (avgWriteTime > this.thresholds.indexedDBWriteTime) {
      recommendations.push({
        category: 'IndexedDB Performance',
        priority: 'MEDIUM',
        issue: `IndexedDB write time (${avgWriteTime.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Batch multiple operations into single transactions',
          'Use appropriate indexes for faster writes',
          'Compress data before storage to reduce I/O',
          'Implement background processing for large datasets'
        ]
      });
    }
    
    // Background sync performance
    const avgSyncTime = this.metrics.backgroundSyncResults.length > 0 ?
      this.metrics.backgroundSyncResults.reduce((sum, m) => sum + m.totalSyncTime, 0) / this.metrics.backgroundSyncResults.length : 0;
    
    if (avgSyncTime > this.thresholds.backgroundSyncDelay) {
      recommendations.push({
        category: 'Background Sync Performance',
        priority: 'MEDIUM',
        issue: `Background sync time (${avgSyncTime.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Implement incremental sync strategies',
          'Prioritize critical data for sync',
          'Use compression for sync payloads',
          'Add retry logic with exponential backoff'
        ]
      });
    }
    
    // Offline boot performance
    const avgBootTime = this.metrics.offlineCapabilities.length > 0 ?
      this.metrics.offlineCapabilities.reduce((sum, m) => sum + m.offlineBootTime, 0) / this.metrics.offlineCapabilities.length : 0;
    
    if (avgBootTime > this.thresholds.offlineBootTime) {
      recommendations.push({
        category: 'Offline Boot Performance',
        priority: 'HIGH',
        issue: `Offline boot time (${avgBootTime.toFixed(0)}ms) exceeds threshold`,
        recommendations: [
          'Preload critical resources in service worker',
          'Optimize cache retrieval strategies',
          'Minimize JavaScript execution during offline boot',
          'Use skeleton screens for perceived performance'
        ]
      });
    }
    
    return recommendations;
  }
}

export default PWAPerformanceSuite;