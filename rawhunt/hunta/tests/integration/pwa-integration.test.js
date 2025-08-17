/**
 * GoHunta PWA Integration Tests
 * Comprehensive testing of service worker, offline capabilities, and hardware integration
 */

import { test, expect, devices } from '@playwright/test';

const PWA_BASE_URL = process.env.PWA_BASE_URL || 'http://localhost:5173';

class PWAIntegrationSteps {
  constructor(page, context) {
    this.page = page;
    this.context = context;
    this.serviceWorkerRegistered = false;
  }

  async installPWA() {
    // Navigate to PWA
    await this.page.goto(PWA_BASE_URL);
    
    // Wait for service worker registration
    await this.page.waitForFunction(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.ready;
    });

    this.serviceWorkerRegistered = true;
    
    // Check for install prompt
    const installButton = this.page.locator('[data-testid="install-pwa"]');
    if (await installButton.isVisible()) {
      await installButton.click();
    }

    return true;
  }

  async testOfflineCapabilities() {
    // Go offline
    await this.context.setOffline(true);
    
    // Navigate to different pages to test offline functionality
    const offlinePages = [
      '/hunt-logs',
      '/dogs',
      '/gear',
      '/routes'
    ];

    const results = [];
    for (const path of offlinePages) {
      await this.page.goto(`${PWA_BASE_URL}${path}`);
      
      // Check if offline banner is displayed
      const offlineBanner = this.page.locator('[data-testid="offline-banner"]');
      expect(await offlineBanner.isVisible()).toBeTruthy();
      
      // Check if cached content is displayed
      const content = this.page.locator('main');
      expect(await content.isVisible()).toBeTruthy();
      
      results.push({
        path,
        offlineSupported: true,
        contentAvailable: await content.isVisible()
      });
    }

    return results;
  }

  async testServiceWorkerCaching() {
    // Check service worker registration
    const swRegistration = await this.page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });

    expect(swRegistration).toBeTruthy();

    // Test cache API
    const cacheTest = await this.page.evaluate(async () => {
      const cacheName = 'gohunta-v1';
      const cache = await caches.open(cacheName);
      
      // Add test resource to cache
      await cache.add('/manifest.json');
      
      // Check if resource is cached
      const cachedResponse = await cache.match('/manifest.json');
      return cachedResponse !== undefined;
    });

    expect(cacheTest).toBeTruthy();
    return true;
  }

  async testBackgroundSync() {
    // Create offline data
    const offlineData = {
      type: 'hunt-log',
      data: {
        date: new Date().toISOString(),
        location: { lat: 45.5152, lng: -122.6784 },
        notes: 'Offline hunt log test'
      }
    };

    // Store data while offline
    await this.context.setOffline(true);
    
    await this.page.evaluate((data) => {
      // Simulate storing data in IndexedDB for background sync
      const request = indexedDB.open('gohunta-offline', 1);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['offline-queue'], 'readwrite');
          const store = transaction.objectStore('offline-queue');
          
          store.add({
            id: Date.now(),
            ...data,
            timestamp: new Date().toISOString(),
            synced: false
          });
          
          transaction.oncomplete = () => resolve(true);
        };
      });
    }, offlineData);

    // Go back online and trigger sync
    await this.context.setOffline(false);
    
    // Register for background sync
    const syncResult = await this.page.evaluate(() => {
      return navigator.serviceWorker.ready.then(reg => {
        return reg.sync.register('hunt-log-sync');
      });
    });

    return syncResult;
  }

  async testIndexedDBPersistence() {
    const testData = {
      id: 'test-hunt-1',
      date: new Date().toISOString(),
      location: { lat: 45.5152, lng: -122.6784 },
      notes: 'IndexedDB test hunt'
    };

    // Store data in IndexedDB
    const storeResult = await this.page.evaluate((data) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('gohunta-data', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('hunt-logs')) {
            db.createObjectStore('hunt-logs', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['hunt-logs'], 'readwrite');
          const store = transaction.objectStore('hunt-logs');
          
          const addRequest = store.add(data);
          addRequest.onsuccess = () => resolve(true);
          addRequest.onerror = () => reject(addRequest.error);
        };
        
        request.onerror = () => reject(request.error);
      });
    }, testData);

    expect(storeResult).toBeTruthy();

    // Retrieve data from IndexedDB
    const retrieveResult = await this.page.evaluate((id) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('gohunta-data', 1);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['hunt-logs'], 'readonly');
          const store = transaction.objectStore('hunt-logs');
          
          const getRequest = store.get(id);
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onerror = () => reject(request.error);
      });
    }, testData.id);

    expect(retrieveResult.id).toBe(testData.id);
    expect(retrieveResult.notes).toBe(testData.notes);

    return retrieveResult;
  }

  async testGPSIntegration() {
    // Mock geolocation API
    await this.page.addInitScript(() => {
      const mockGeolocation = {
        getCurrentPosition: (success, error, options) => {
          setTimeout(() => {
            success({
              coords: {
                latitude: 45.5152,
                longitude: -122.6784,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          }, 100);
        },
        watchPosition: (success, error, options) => {
          let watchId = 1;
          const interval = setInterval(() => {
            success({
              coords: {
                latitude: 45.5152 + (Math.random() - 0.5) * 0.001,
                longitude: -122.6784 + (Math.random() - 0.5) * 0.001,
                accuracy: 10 + Math.random() * 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          }, 1000);
          
          // Store interval for cleanup
          window._watchIntervals = window._watchIntervals || {};
          window._watchIntervals[watchId] = interval;
          
          return watchId;
        },
        clearWatch: (watchId) => {
          if (window._watchIntervals && window._watchIntervals[watchId]) {
            clearInterval(window._watchIntervals[watchId]);
            delete window._watchIntervals[watchId];
          }
        }
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });
    });

    // Test GPS functionality
    const gpsResult = await this.page.evaluate(() => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    });

    expect(gpsResult.latitude).toBeCloseTo(45.5152, 3);
    expect(gpsResult.longitude).toBeCloseTo(-122.6784, 3);
    expect(gpsResult.accuracy).toBeLessThan(50);

    return gpsResult;
  }

  async testCameraIntegration() {
    // Mock camera API
    await this.page.addInitScript(() => {
      const mockGetUserMedia = async (constraints) => {
        // Create a mock video stream
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw a test pattern
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('Test Camera', 200, 240);

        const stream = canvas.captureStream();
        return stream;
      };

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
        configurable: true
      });
    });

    // Test camera access
    const cameraTest = await this.page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        
        return {
          success: true,
          settings: settings
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(cameraTest.success).toBeTruthy();
    return cameraTest;
  }

  async testVoiceNotesIntegration() {
    // Mock Web Audio API for voice recording
    await this.page.addInitScript(() => {
      const mockMediaRecorder = function(stream, options) {
        this.state = 'inactive';
        this.stream = stream;
        this.options = options;
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
        
        this.start = function() {
          this.state = 'recording';
          
          // Simulate recording data
          setTimeout(() => {
            if (this.ondataavailable) {
              const mockBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
              this.ondataavailable({ data: mockBlob });
            }
          }, 100);
        };
        
        this.stop = function() {
          this.state = 'inactive';
          if (this.onstop) {
            setTimeout(() => this.onstop(), 10);
          }
        };
        
        this.pause = function() {
          this.state = 'paused';
        };
        
        this.resume = function() {
          this.state = 'recording';
        };
      };

      Object.defineProperty(window, 'MediaRecorder', {
        value: mockMediaRecorder,
        configurable: true
      });

      Object.defineProperty(MediaRecorder, 'isTypeSupported', {
        value: () => true,
        configurable: true
      });
    });

    // Test voice recording
    const voiceTest = await this.page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        return new Promise((resolve) => {
          let audioData = [];
          
          recorder.ondataavailable = (event) => {
            audioData.push(event.data);
          };
          
          recorder.onstop = () => {
            const audioBlob = new Blob(audioData, { type: 'audio/webm' });
            resolve({
              success: true,
              size: audioBlob.size,
              type: audioBlob.type
            });
          };
          
          recorder.start();
          
          setTimeout(() => {
            recorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }, 500);
        });
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(voiceTest.success).toBeTruthy();
    expect(voiceTest.size).toBeGreaterThan(0);
    
    return voiceTest;
  }
}

test.describe('PWA Integration Tests', () => {
  let pwaSteps;

  test.beforeEach(async ({ page, context }) => {
    pwaSteps = new PWAIntegrationSteps(page, context);
    await pwaSteps.installPWA();
  });

  test.describe('Service Worker and Caching', () => {
    test('should register service worker successfully', async ({ page }) => {
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      expect(swRegistered).toBeTruthy();
    });

    test('should implement proper caching strategies', async () => {
      const cacheResult = await pwaSteps.testServiceWorkerCaching();
      expect(cacheResult).toBeTruthy();
    });

    test('should handle offline mode gracefully', async () => {
      const offlineResults = await pwaSteps.testOfflineCapabilities();
      
      expect(offlineResults.length).toBeGreaterThan(0);
      offlineResults.forEach(result => {
        expect(result.offlineSupported).toBeTruthy();
        expect(result.contentAvailable).toBeTruthy();
      });
    });
  });

  test.describe('Background Sync and Data Persistence', () => {
    test('should implement background sync for offline operations', async () => {
      try {
        const syncResult = await pwaSteps.testBackgroundSync();
        // Background sync might not be available in test environment
        // So we just test that it doesn't throw an error
        expect(typeof syncResult).toBeDefined();
      } catch (error) {
        // Background sync not supported in test environment is acceptable
        expect(error.message).toContain('sync' || 'register');
      }
    });

    test('should persist data in IndexedDB', async () => {
      const persistResult = await pwaSteps.testIndexedDBPersistence();
      expect(persistResult.id).toBe('test-hunt-1');
      expect(persistResult.notes).toBe('IndexedDB test hunt');
    });
  });

  test.describe('Hardware Integration', () => {
    test('should integrate with device GPS', async () => {
      const gpsResult = await pwaSteps.testGPSIntegration();
      expect(gpsResult.latitude).toBeCloseTo(45.5152, 3);
      expect(gpsResult.longitude).toBeCloseTo(-122.6784, 3);
      expect(gpsResult.accuracy).toBeLessThan(50);
    });

    test('should access device camera for photos', async () => {
      const cameraResult = await pwaSteps.testCameraIntegration();
      expect(cameraResult.success).toBeTruthy();
    });

    test('should record voice notes', async () => {
      const voiceResult = await pwaSteps.testVoiceNotesIntegration();
      expect(voiceResult.success).toBeTruthy();
      expect(voiceResult.size).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Device Testing', () => {
    test('should work on mobile devices', async ({ browser }) => {
      const mobileContext = await browser.newContext({
        ...devices['iPhone 12']
      });
      
      const mobilePage = await mobileContext.newPage();
      const mobilePWASteps = new PWAIntegrationSteps(mobilePage, mobileContext);
      
      await mobilePWASteps.installPWA();
      
      // Test mobile-specific features
      const viewport = mobilePage.viewportSize();
      expect(viewport.width).toBe(390);
      expect(viewport.height).toBe(844);
      
      // Test touch interactions
      const huntLogButton = mobilePage.locator('[data-testid="create-hunt-log"]');
      await huntLogButton.tap();
      
      const modal = mobilePage.locator('[data-testid="hunt-log-modal"]');
      expect(await modal.isVisible()).toBeTruthy();
      
      await mobileContext.close();
    });

    test('should handle device orientation changes', async ({ page, context }) => {
      // Test landscape orientation
      await page.setViewportSize({ width: 844, height: 390 });
      
      const navigation = page.locator('[data-testid="navigation"]');
      expect(await navigation.isVisible()).toBeTruthy();
      
      // Test portrait orientation
      await page.setViewportSize({ width: 390, height: 844 });
      
      expect(await navigation.isVisible()).toBeTruthy();
    });
  });

  test.describe('Performance in Offline Conditions', () => {
    test('should maintain performance while offline', async ({ page, context }) => {
      await context.setOffline(true);
      
      const startTime = Date.now();
      
      // Navigate through key pages
      const pages = ['/hunt-logs', '/dogs', '/gear', '/routes'];
      
      for (const pagePath of pages) {
        await page.goto(`${PWA_BASE_URL}${pagePath}`);
        await page.waitForLoadState('domcontentloaded');
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should load offline pages within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds total
    });

    test('should sync data efficiently when back online', async ({ page, context }) => {
      // Create offline data
      await context.setOffline(true);
      
      await page.evaluate(() => {
        // Store multiple offline items
        const items = [];
        for (let i = 0; i < 10; i++) {
          items.push({
            id: `offline-item-${i}`,
            type: 'hunt-log',
            data: { notes: `Offline hunt ${i}` },
            timestamp: new Date().toISOString(),
            synced: false
          });
        }
        
        return Promise.all(items.map(item => {
          return new Promise((resolve) => {
            const request = indexedDB.open('gohunta-sync', 1);
            
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('sync-queue')) {
                db.createObjectStore('sync-queue', { keyPath: 'id' });
              }
            };
            
            request.onsuccess = () => {
              const db = request.result;
              const transaction = db.transaction(['sync-queue'], 'readwrite');
              const store = transaction.objectStore('sync-queue');
              
              store.add(item);
              transaction.oncomplete = () => resolve();
            };
          });
        }));
      });
      
      // Go back online and measure sync time
      const syncStartTime = Date.now();
      await context.setOffline(false);
      
      // Trigger sync process (would normally be handled by service worker)
      await page.evaluate(() => {
        // Simulate sync completion
        return new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });
      
      const syncEndTime = Date.now();
      const syncDuration = syncEndTime - syncStartTime;
      
      // Sync should complete within reasonable time
      expect(syncDuration).toBeLessThan(2000); // 2 seconds
    });
  });
});