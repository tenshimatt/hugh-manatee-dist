/**
 * GoHunta Performance Integration Tests
 * Load testing, stress testing, and performance benchmarking
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';
const PWA_BASE_URL = process.env.PWA_BASE_URL || 'http://localhost:5173';

class PerformanceTestSuite {
  constructor() {
    this.metrics = {
      apiResponseTimes: [],
      pageLoadTimes: [],
      memoryUsage: [],
      concurrentUserResults: [],
      offlineSyncTimes: []
    };
  }

  async measureApiPerformance(page) {
    const endpointTests = [
      { endpoint: '/api/auth/login', method: 'POST', payload: { email: 'test@example.com', password: 'password' } },
      { endpoint: '/api/dogs', method: 'GET' },
      { endpoint: '/api/hunt-logs', method: 'GET' },
      { endpoint: '/api/gear', method: 'GET' },
      { endpoint: '/api/routes', method: 'GET' },
      { endpoint: '/api/events', method: 'GET' }
    ];

    const results = [];

    for (const test of endpointTests) {
      const measurements = [];
      
      // Run each endpoint test 10 times for statistical significance
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        try {
          const response = await page.evaluate(async ({ url, endpoint, method, payload }) => {
            const fetchOptions = {
              method,
              headers: { 'Content-Type': 'application/json' }
            };
            
            if (payload) {
              fetchOptions.body = JSON.stringify(payload);
            }
            
            const response = await fetch(`${url}${endpoint}`, fetchOptions);
            return {
              status: response.status,
              ok: response.ok,
              timing: Date.now()
            };
          }, { url: API_BASE_URL, endpoint: test.endpoint, method: test.method, payload: test.payload });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          measurements.push({
            responseTime,
            status: response.status,
            success: response.ok
          });
          
        } catch (error) {
          measurements.push({
            responseTime: 5000, // Timeout
            status: 0,
            success: false,
            error: error.message
          });
        }
        
        // Small delay between requests
        await page.waitForTimeout(100);
      }
      
      const successfulMeasurements = measurements.filter(m => m.success);
      const avgResponseTime = successfulMeasurements.length > 0 
        ? successfulMeasurements.reduce((sum, m) => sum + m.responseTime, 0) / successfulMeasurements.length 
        : 0;
      
      results.push({
        endpoint: test.endpoint,
        method: test.method,
        avgResponseTime,
        minResponseTime: Math.min(...successfulMeasurements.map(m => m.responseTime)),
        maxResponseTime: Math.max(...successfulMeasurements.map(m => m.responseTime)),
        successRate: (successfulMeasurements.length / measurements.length) * 100,
        totalRequests: measurements.length
      });
      
      this.metrics.apiResponseTimes.push(...successfulMeasurements.map(m => m.responseTime));
    }

    return results;
  }

  async measurePageLoadPerformance(page) {
    const pages = [
      '/',
      '/hunt-logs',
      '/dogs',
      '/gear',
      '/routes',
      '/events',
      '/profile'
    ];

    const results = [];

    for (const pagePath of pages) {
      const measurements = [];
      
      // Measure each page 5 times
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await page.goto(`${PWA_BASE_URL}${pagePath}`);
        
        // Wait for main content to load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle');
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        // Get performance metrics
        const performanceMetrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
        
        measurements.push({
          totalLoadTime: loadTime,
          ...performanceMetrics
        });
        
        await page.waitForTimeout(500);
      }
      
      const avgLoadTime = measurements.reduce((sum, m) => sum + m.totalLoadTime, 0) / measurements.length;
      const avgDomContentLoaded = measurements.reduce((sum, m) => sum + m.domContentLoaded, 0) / measurements.length;
      const avgFirstPaint = measurements.reduce((sum, m) => sum + m.firstPaint, 0) / measurements.length;
      
      results.push({
        page: pagePath,
        avgLoadTime,
        avgDomContentLoaded,
        avgFirstPaint,
        measurements: measurements.length
      });
      
      this.metrics.pageLoadTimes.push(avgLoadTime);
    }

    return results;
  }

  async measureMemoryUsage(page) {
    const memoryTests = [];
    
    // Navigate to app
    await page.goto(PWA_BASE_URL);
    
    // Initial memory measurement
    let initialMemory = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    if (!initialMemory) {
      return [{ message: 'Performance.memory API not available' }];
    }
    
    memoryTests.push({
      phase: 'initial',
      ...initialMemory,
      timestamp: Date.now()
    });
    
    // Create memory pressure by adding large amounts of data
    for (let i = 0; i < 5; i++) {
      await page.evaluate((iteration) => {
        // Create offline hunt logs with photos and GPS data
        const request = indexedDB.open(`memory-test-${iteration}`, 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('hunt-data', { keyPath: 'id' });
        };
        
        return new Promise((resolve) => {
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['hunt-data'], 'readwrite');
            const store = transaction.objectStore('hunt-data');
            
            // Add 50 records with large data each
            const promises = [];
            for (let j = 0; j < 50; j++) {
              const data = {
                id: `hunt-${iteration}-${j}`,
                photos: Array(10).fill().map(() => ({
                  data: 'x'.repeat(10000), // 10KB per photo
                  timestamp: new Date().toISOString()
                })),
                gpsTrack: Array(1000).fill().map(() => ({
                  lat: 47 + Math.random(),
                  lng: -109 + Math.random(),
                  timestamp: Date.now()
                })),
                notes: 'x'.repeat(5000) // 5KB of notes
              };
              
              promises.push(new Promise(r => {
                const addRequest = store.add(data);
                addRequest.onsuccess = () => r();
                addRequest.onerror = () => r();
              }));
            }
            
            Promise.all(promises).then(() => {
              db.close();
              resolve();
            });
          };
        });
      }, i);
      
      // Measure memory after each iteration
      const memoryAfterIteration = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });
      
      if (memoryAfterIteration) {
        memoryTests.push({
          phase: `iteration-${i + 1}`,
          ...memoryAfterIteration,
          timestamp: Date.now(),
          memoryIncrease: memoryAfterIteration.usedJSHeapSize - initialMemory.usedJSHeapSize
        });
        
        this.metrics.memoryUsage.push(memoryAfterIteration.usedJSHeapSize);
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Final memory measurement after cleanup attempt
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    if (finalMemory) {
      memoryTests.push({
        phase: 'final-after-cleanup',
        ...finalMemory,
        timestamp: Date.now(),
        memoryIncrease: finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      });
    }
    
    return memoryTests;
  }

  async measureConcurrentUsers(context) {
    const concurrentUserCount = 20;
    const testDuration = 30000; // 30 seconds
    const results = [];
    
    // Create multiple browser contexts to simulate different users
    const userSessions = [];
    
    for (let i = 0; i < concurrentUserCount; i++) {
      userSessions.push(this.simulateUserSession(context, i, testDuration));
    }
    
    const startTime = Date.now();
    const sessionResults = await Promise.all(userSessions);
    const endTime = Date.now();
    
    const successfulSessions = sessionResults.filter(result => result.success).length;
    const totalRequests = sessionResults.reduce((sum, result) => sum + result.requestCount, 0);
    const averageResponseTime = sessionResults
      .filter(result => result.success)
      .reduce((sum, result) => sum + result.averageResponseTime, 0) / successfulSessions;
    
    const concurrentResult = {
      totalUsers: concurrentUserCount,
      successfulUsers: successfulSessions,
      successRate: (successfulSessions / concurrentUserCount) * 100,
      totalRequests,
      testDuration: endTime - startTime,
      averageResponseTime,
      throughput: totalRequests / ((endTime - startTime) / 1000) // requests per second
    };
    
    this.metrics.concurrentUserResults.push(concurrentResult);
    return concurrentResult;
  }

  async simulateUserSession(context, userId, duration) {
    try {
      const page = await context.newPage();
      
      const sessionResults = {
        userId,
        success: true,
        requestCount: 0,
        responseTimes: [],
        errors: []
      };
      
      const sessionStartTime = Date.now();
      
      // Simulate typical user behavior
      const userActions = [
        () => this.simulateLogin(page, sessionResults),
        () => this.simulateViewHuntLogs(page, sessionResults),
        () => this.simulateCreateHuntLog(page, sessionResults),
        () => this.simulateViewDogs(page, sessionResults),
        () => this.simulateViewGear(page, sessionResults)
      ];
      
      while (Date.now() - sessionStartTime < duration) {
        try {
          const randomAction = userActions[Math.floor(Math.random() * userActions.length)];
          await randomAction();
          
          // Random delay between actions (1-5 seconds)
          await page.waitForTimeout(1000 + Math.random() * 4000);
          
        } catch (error) {
          sessionResults.errors.push(error.message);
        }
      }
      
      sessionResults.averageResponseTime = sessionResults.responseTimes.length > 0
        ? sessionResults.responseTimes.reduce((sum, time) => sum + time, 0) / sessionResults.responseTimes.length
        : 0;
      
      await page.close();
      return sessionResults;
      
    } catch (error) {
      return {
        userId,
        success: false,
        requestCount: 0,
        responseTimes: [],
        errors: [error.message],
        averageResponseTime: 0
      };
    }
  }

  async simulateLogin(page, sessionResults) {
    const startTime = Date.now();
    
    await page.goto(PWA_BASE_URL);
    
    // Simulate login if login form is present
    const loginForm = page.locator('form:has(input[type="password"])');
    if (await loginForm.isVisible({ timeout: 2000 })) {
      await page.fill('input[type="email"]', `user${sessionResults.userId}@test.com`);
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    const endTime = Date.now();
    sessionResults.requestCount++;
    sessionResults.responseTimes.push(endTime - startTime);
  }

  async simulateViewHuntLogs(page, sessionResults) {
    const startTime = Date.now();
    
    await page.goto(`${PWA_BASE_URL}/hunt-logs`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const endTime = Date.now();
    sessionResults.requestCount++;
    sessionResults.responseTimes.push(endTime - startTime);
  }

  async simulateCreateHuntLog(page, sessionResults) {
    const startTime = Date.now();
    
    await page.goto(`${PWA_BASE_URL}/hunt-logs`);
    
    // Look for create button
    const createButton = page.locator('button:text("Create"), button:text("New"), button:text("+")').first();
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      
      // Fill form if modal appears
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.fill('input[name="notes"], textarea[name="notes"]', `Test hunt log from user ${sessionResults.userId}`);
        
        const submitButton = modal.locator('button:text("Save"), button:text("Create"), button[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click();
        }
      }
    }
    
    const endTime = Date.now();
    sessionResults.requestCount++;
    sessionResults.responseTimes.push(endTime - startTime);
  }

  async simulateViewDogs(page, sessionResults) {
    const startTime = Date.now();
    
    await page.goto(`${PWA_BASE_URL}/dogs`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const endTime = Date.now();
    sessionResults.requestCount++;
    sessionResults.responseTimes.push(endTime - startTime);
  }

  async simulateViewGear(page, sessionResults) {
    const startTime = Date.now();
    
    await page.goto(`${PWA_BASE_URL}/gear`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const endTime = Date.now();
    sessionResults.requestCount++;
    sessionResults.responseTimes.push(endTime - startTime);
  }

  async measureOfflineSyncPerformance(page) {
    const syncTests = [];
    
    // Navigate to app
    await page.goto(PWA_BASE_URL);
    
    // Create offline data
    const offlineDataSizes = [10, 50, 100, 200]; // Number of records
    
    for (const recordCount of offlineDataSizes) {
      // Go offline
      await page.context().setOffline(true);
      
      // Create offline data
      const createStartTime = Date.now();
      
      await page.evaluate((count) => {
        const promises = [];
        
        for (let i = 0; i < count; i++) {
          promises.push(new Promise((resolve) => {
            const request = indexedDB.open('sync-test', 1);
            
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('offline-data')) {
                db.createObjectStore('offline-data', { keyPath: 'id' });
              }
            };
            
            request.onsuccess = () => {
              const db = request.result;
              const transaction = db.transaction(['offline-data'], 'readwrite');
              const store = transaction.objectStore('offline-data');
              
              store.add({
                id: `offline-record-${i}`,
                type: 'hunt-log',
                data: {
                  notes: `Offline hunt log ${i}`,
                  location: { lat: 47 + Math.random(), lng: -109 + Math.random() },
                  timestamp: new Date().toISOString(),
                  photos: Array(5).fill().map(() => ({ data: 'x'.repeat(1000) }))
                },
                synced: false,
                createdAt: new Date().toISOString()
              });
              
              transaction.oncomplete = () => {
                db.close();
                resolve();
              };
            };
          }));
        }
        
        return Promise.all(promises);
      }, recordCount);
      
      const createEndTime = Date.now();
      const creationTime = createEndTime - createStartTime;
      
      // Go back online
      await page.context().setOffline(false);
      
      // Measure sync time
      const syncStartTime = Date.now();
      
      // Simulate sync process
      const syncResult = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('sync-test', 1);
          
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['offline-data'], 'readonly');
            const store = transaction.objectStore('offline-data');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const records = getAllRequest.result;
              // Simulate sync processing time
              setTimeout(() => {
                resolve({
                  recordCount: records.length,
                  totalDataSize: JSON.stringify(records).length
                });
              }, records.length * 10); // 10ms per record
            };
          };
        });
      });
      
      const syncEndTime = Date.now();
      const syncTime = syncEndTime - syncStartTime;
      
      const testResult = {
        recordCount,
        creationTime,
        syncTime,
        totalTime: creationTime + syncTime,
        syncedRecords: syncResult.recordCount,
        dataSize: syncResult.totalDataSize,
        syncRate: syncResult.recordCount / (syncTime / 1000) // records per second
      };
      
      syncTests.push(testResult);
      this.metrics.offlineSyncTimes.push(syncTime);
      
      // Cleanup
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const deleteRequest = indexedDB.deleteDatabase('sync-test');
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => resolve();
        });
      });
      
      await page.waitForTimeout(1000);
    }
    
    return syncTests;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        avgResponseTime: this.metrics.apiResponseTimes.length > 0 
          ? this.metrics.apiResponseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.apiResponseTimes.length 
          : 0,
        avgPageLoadTime: this.metrics.pageLoadTimes.length > 0
          ? this.metrics.pageLoadTimes.reduce((sum, time) => sum + time, 0) / this.metrics.pageLoadTimes.length
          : 0,
        peakMemoryMB: this.metrics.memoryUsage.length > 0
          ? Math.max(...this.metrics.memoryUsage) / (1024 * 1024)
          : 0,
        maxConcurrentUsers: this.metrics.concurrentUserResults.length > 0
          ? Math.max(...this.metrics.concurrentUserResults.map(r => r.successfulUsers))
          : 0,
        avgOfflineSyncTime: this.metrics.offlineSyncTimes.length > 0
          ? this.metrics.offlineSyncTimes.reduce((sum, time) => sum + time, 0) / this.metrics.offlineSyncTimes.length
          : 0
      },
      details: {
        apiResponseTimes: this.metrics.apiResponseTimes,
        pageLoadTimes: this.metrics.pageLoadTimes,
        memoryUsage: this.metrics.memoryUsage,
        concurrentUserResults: this.metrics.concurrentUserResults,
        offlineSyncTimes: this.metrics.offlineSyncTimes
      },
      thresholds: {
        acceptableResponseTime: 500, // ms
        acceptablePageLoadTime: 3000, // ms
        acceptableMemoryUsage: 512 * 1024 * 1024, // 512MB
        minimumConcurrentUsers: 50,
        acceptableOfflineSyncTime: 2000 // ms
      }
    };

    // Add pass/fail status
    report.status = {
      responseTimePass: report.summary.avgResponseTime <= report.thresholds.acceptableResponseTime,
      pageLoadTimePass: report.summary.avgPageLoadTime <= report.thresholds.acceptablePageLoadTime,
      memoryUsagePass: report.summary.peakMemoryMB <= report.thresholds.acceptableMemoryUsage / (1024 * 1024),
      concurrentUsersPass: report.summary.maxConcurrentUsers >= report.thresholds.minimumConcurrentUsers,
      offlineSyncPass: report.summary.avgOfflineSyncTime <= report.thresholds.acceptableOfflineSyncTime
    };

    report.overallPass = Object.values(report.status).every(status => status === true);

    return report;
  }
}

test.describe('Performance Integration Tests', () => {
  let performanceTestSuite;

  test.beforeEach(async () => {
    performanceTestSuite = new PerformanceTestSuite();
  });

  test('should measure API response times', async ({ page }) => {
    const apiResults = await performanceTestSuite.measureApiPerformance(page);
    
    expect(apiResults.length).toBeGreaterThan(0);
    
    apiResults.forEach(result => {
      expect(result.avgResponseTime).toBeLessThan(2000); // 2 seconds max
      expect(result.successRate).toBeGreaterThan(80); // 80% success rate minimum
    });
  });

  test('should measure page load performance', async ({ page }) => {
    const pageResults = await performanceTestSuite.measurePageLoadPerformance(page);
    
    expect(pageResults.length).toBeGreaterThan(0);
    
    pageResults.forEach(result => {
      expect(result.avgLoadTime).toBeLessThan(5000); // 5 seconds max
      expect(result.avgFirstPaint).toBeLessThan(2000); // 2 seconds for first paint
    });
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    const memoryResults = await performanceTestSuite.measureMemoryUsage(page);
    
    expect(memoryResults.length).toBeGreaterThan(0);
    
    const finalMemory = memoryResults[memoryResults.length - 1];
    const initialMemory = memoryResults[0];
    
    if (finalMemory.memoryIncrease) {
      expect(finalMemory.memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    }
  });

  test('should support concurrent users', async ({ context }) => {
    const concurrentResult = await performanceTestSuite.measureConcurrentUsers(context);
    
    expect(concurrentResult.successRate).toBeGreaterThan(70); // 70% success rate under load
    expect(concurrentResult.averageResponseTime).toBeLessThan(3000); // 3 seconds max under load
    expect(concurrentResult.throughput).toBeGreaterThan(1); // At least 1 request per second
  });

  test('should sync offline data efficiently', async ({ page }) => {
    const syncResults = await performanceTestSuite.measureOfflineSyncPerformance(page);
    
    expect(syncResults.length).toBeGreaterThan(0);
    
    syncResults.forEach(result => {
      expect(result.syncTime).toBeLessThan(10000); // 10 seconds max for sync
      expect(result.syncRate).toBeGreaterThan(1); // At least 1 record per second
      expect(result.syncedRecords).toBe(result.recordCount); // All records should sync
    });
  });

  test('should generate comprehensive performance report', async ({ page, context }) => {
    // Run all performance tests
    await performanceTestSuite.measureApiPerformance(page);
    await performanceTestSuite.measurePageLoadPerformance(page);
    await performanceTestSuite.measureMemoryUsage(page);
    await performanceTestSuite.measureOfflineSyncPerformance(page);
    
    const report = performanceTestSuite.generatePerformanceReport();
    
    expect(report.timestamp).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.status).toBeDefined();
    expect(report.thresholds).toBeDefined();
    
    console.log('Performance Report:', JSON.stringify(report, null, 2));
    
    // Save report for CI/CD
    if (process.env.CI) {
      await page.evaluate((reportData) => {
        const fs = require('fs');
        fs.writeFileSync('performance-results.json', JSON.stringify(reportData, null, 2));
      }, report);
    }
  });
});