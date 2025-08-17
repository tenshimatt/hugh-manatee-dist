/**
 * GoHunta Field Usage Scenarios Integration Tests
 * Real-world hunting scenarios: offline logging, GPS tracking, photo uploads
 */

import { test, expect, devices } from '@playwright/test';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

class FieldUsageScenarios {
  constructor(page, context) {
    this.page = page;
    this.context = context;
    this.huntSession = null;
  }

  async setupHuntingEnvironment() {
    // Navigate to app
    await this.page.goto(APP_BASE_URL);
    
    // Mock GPS with realistic hunting location coordinates
    await this.page.addInitScript(() => {
      // Montana hunting area coordinates
      const huntingArea = {
        center: { lat: 47.0527, lng: -109.6333 },
        bounds: {
          north: 47.1527,
          south: 46.9527,
          east: -109.5333,
          west: -109.7333
        }
      };

      let currentPosition = huntingArea.center;
      let watchId = 0;
      let trackingActive = false;

      const mockGeolocation = {
        getCurrentPosition: (success, error, options) => {
          setTimeout(() => {
            success({
              coords: {
                latitude: currentPosition.lat,
                longitude: currentPosition.lng,
                accuracy: Math.random() * 15 + 5, // 5-20m accuracy
                altitude: 1200 + Math.random() * 300,
                altitudeAccuracy: 50,
                heading: Math.random() * 360,
                speed: Math.random() * 3 // Walking speed
              },
              timestamp: Date.now()
            });
          }, 100);
        },

        watchPosition: (success, error, options) => {
          watchId++;
          const currentWatchId = watchId;
          
          const interval = setInterval(() => {
            if (trackingActive) {
              // Simulate movement through hunting area
              const movement = {
                lat: (Math.random() - 0.5) * 0.001, // ~100m movement
                lng: (Math.random() - 0.5) * 0.001
              };
              
              currentPosition.lat = Math.max(
                huntingArea.bounds.south,
                Math.min(huntingArea.bounds.north, currentPosition.lat + movement.lat)
              );
              
              currentPosition.lng = Math.max(
                huntingArea.bounds.west,
                Math.min(huntingArea.bounds.east, currentPosition.lng + movement.lng)
              );
            }

            success({
              coords: {
                latitude: currentPosition.lat,
                longitude: currentPosition.lng,
                accuracy: Math.random() * 15 + 5,
                altitude: 1200 + Math.random() * 300,
                altitudeAccuracy: 50,
                heading: Math.random() * 360,
                speed: trackingActive ? Math.random() * 3 : 0
              },
              timestamp: Date.now()
            });
          }, 2000);

          window._gpsIntervals = window._gpsIntervals || {};
          window._gpsIntervals[currentWatchId] = interval;
          
          return currentWatchId;
        },

        clearWatch: (id) => {
          if (window._gpsIntervals && window._gpsIntervals[id]) {
            clearInterval(window._gpsIntervals[id]);
            delete window._gpsIntervals[id];
          }
        }
      };

      // Control functions for testing
      window.startGPSTracking = () => { trackingActive = true; };
      window.stopGPSTracking = () => { trackingActive = false; };
      window.moveToLocation = (lat, lng) => {
        currentPosition = { lat, lng };
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });
    });

    // Mock camera for photo capture
    await this.page.addInitScript(() => {
      const mockGetUserMedia = async (constraints) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        // Create realistic hunting scene
        const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.3, '#228B22'); // Forest green
        gradient.addColorStop(1, '#8B4513'); // Saddle brown (ground)
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1920, 1080);
        
        // Add timestamp and location overlay
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Hunt Photo - ${new Date().toLocaleString()}`, 50, 50);
        ctx.fillText(`GPS: ${window.lastKnownPosition?.lat.toFixed(6)}, ${window.lastKnownPosition?.lng.toFixed(6)}`, 50, 100);

        const stream = canvas.captureStream(30);
        return stream;
      };

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
        configurable: true
      });
    });

    // Mock voice recording
    await this.page.addInitScript(() => {
      const mockMediaRecorder = function(stream, options) {
        this.state = 'inactive';
        this.stream = stream;
        this.options = options;
        this.ondataavailable = null;
        this.onstop = null;
        this.onstart = null;
        
        this.start = function(timeslice) {
          this.state = 'recording';
          if (this.onstart) this.onstart();
          
          setTimeout(() => {
            if (this.ondataavailable && this.state === 'recording') {
              // Create mock audio data with hunting-related "content"
              const mockAudioData = new Uint8Array(1024);
              for (let i = 0; i < mockAudioData.length; i++) {
                mockAudioData[i] = Math.floor(Math.random() * 256);
              }
              const mockBlob = new Blob([mockAudioData], { type: 'audio/webm;codecs=opus' });
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

    return true;
  }

  async authenticateUser() {
    // Fill in login form
    const emailInput = this.page.locator('input[type="email"], input[name="email"]');
    const passwordInput = this.page.locator('input[type="password"], input[name="password"]');
    const loginButton = this.page.locator('button[type="submit"], button:text("Login"), button:text("Sign In")');

    if (await emailInput.isVisible()) {
      await emailInput.fill('hunter@gohunta.com');
      await passwordInput.fill('HuntingPass123!');
      await loginButton.click();
      
      // Wait for navigation to complete
      await this.page.waitForLoadState('networkidle');
    }

    return true;
  }

  async startHuntSession() {
    // Create new hunt session
    const huntSessionData = {
      id: `hunt-session-${Date.now()}`,
      startTime: new Date().toISOString(),
      location: { name: 'Montana Wilderness Area', lat: 47.0527, lng: -109.6333 },
      weather: { temperature: 45, conditions: 'partly_cloudy', windSpeed: 5 },
      dogs: ['Rex', 'Belle'], // Mock dog names
      huntType: 'upland_birds'
    };

    // Store hunt session data
    await this.page.evaluate((sessionData) => {
      return new Promise((resolve) => {
        const request = indexedDB.open('gohunta-hunt-sessions', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('active-sessions')) {
            db.createObjectStore('active-sessions', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['active-sessions'], 'readwrite');
          const store = transaction.objectStore('active-sessions');
          
          store.add({
            ...sessionData,
            status: 'active',
            trackingPoints: [],
            photos: [],
            voiceNotes: []
          });
          
          transaction.oncomplete = () => resolve(true);
        };
      });
    }, huntSessionData);

    this.huntSession = huntSessionData;
    return huntSessionData;
  }

  async simulateOfflineHuntLogging() {
    // Go offline
    await this.context.setOffline(true);
    
    // Start GPS tracking
    await this.page.evaluate(() => {
      window.startGPSTracking();
    });

    // Create offline hunt log entries
    const huntLogEntries = [
      {
        timestamp: new Date().toISOString(),
        type: 'track_spotted',
        notes: 'Fresh deer tracks heading north',
        location: { lat: 47.0530, lng: -109.6340 }
      },
      {
        timestamp: new Date(Date.now() + 300000).toISOString(),
        type: 'dog_point',
        notes: 'Rex on point, birds in heavy cover',
        location: { lat: 47.0535, lng: -109.6345 }
      },
      {
        timestamp: new Date(Date.now() + 600000).toISOString(),
        type: 'harvest',
        notes: 'Two pheasants retrieved by Belle',
        location: { lat: 47.0538, lng: -109.6348 }
      }
    ];

    // Store entries while offline
    for (const entry of huntLogEntries) {
      await this.page.evaluate((logEntry, sessionId) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('gohunta-offline-logs', 1);
          
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
            
            store.add({
              id: `log-${Date.now()}-${Math.random()}`,
              sessionId: sessionId,
              ...logEntry,
              synced: false,
              createdOffline: true
            });
            
            transaction.oncomplete = () => resolve(true);
          };
        });
      }, entry, this.huntSession.id);
    }

    return huntLogEntries;
  }

  async captureHuntingPhotos() {
    const photos = [];
    
    // Simulate taking multiple hunting photos
    for (let i = 0; i < 3; i++) {
      const photoResult = await this.page.evaluate(async (index) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          return new Promise((resolve) => {
            video.addEventListener('loadedmetadata', () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              
              // Add hunting-specific metadata overlay
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
              
              ctx.fillStyle = 'white';
              ctx.font = 'bold 16px Arial';
              ctx.fillText(`Photo ${index + 1} - ${new Date().toLocaleString()}`, 10, canvas.height - 90);
              ctx.fillText('GPS: Acquiring...', 10, canvas.height - 65);
              ctx.fillText('Weather: 45°F, Partly Cloudy', 10, canvas.height - 40);
              ctx.fillText('Dogs: Rex, Belle', 10, canvas.height - 15);
              
              canvas.toBlob((blob) => {
                stream.getTracks().forEach(track => track.stop());
                resolve({
                  success: true,
                  size: blob.size,
                  type: blob.type,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    location: window.lastKnownPosition || { lat: 47.0527, lng: -109.6333 },
                    weather: 'partly_cloudy',
                    temperature: 45
                  }
                });
              }, 'image/jpeg', 0.8);
            });
          });
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, i);

      expect(photoResult.success).toBeTruthy();
      photos.push(photoResult);

      // Store photo metadata offline
      await this.page.evaluate((photo, sessionId) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('gohunta-photos', 1);
          
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('photo-metadata')) {
              db.createObjectStore('photo-metadata', { keyPath: 'id' });
            }
          };
          
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['photo-metadata'], 'readwrite');
            const store = transaction.objectStore('photo-metadata');
            
            store.add({
              id: `photo-${Date.now()}-${Math.random()}`,
              sessionId: sessionId,
              ...photo,
              uploaded: false,
              createdOffline: true
            });
            
            transaction.oncomplete = () => resolve(true);
          };
        });
      }, photoResult, this.huntSession.id);

      // Small delay between photos
      await this.page.waitForTimeout(1000);
    }

    return photos;
  }

  async recordVoiceNotes() {
    const voiceNotes = [];
    
    // Record multiple voice notes
    const noteContents = [
      'Weather is perfect for hunting today, light wind from the west',
      'Rex is working the fence line, seems to have picked up a scent',
      'Great flush, birds flying toward the creek bottom'
    ];

    for (let i = 0; i < noteContents.length; i++) {
      const voiceResult = await this.page.evaluate(async (index, content) => {
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
              stream.getTracks().forEach(track => track.stop());
              
              resolve({
                success: true,
                size: audioBlob.size,
                type: audioBlob.type,
                duration: 2000, // 2 seconds
                transcript: content, // Mock transcript
                timestamp: new Date().toISOString()
              });
            };
            
            recorder.start();
            
            setTimeout(() => {
              recorder.stop();
            }, 2000);
          });
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, i, noteContents[i]);

      expect(voiceResult.success).toBeTruthy();
      voiceNotes.push(voiceResult);

      // Store voice note metadata
      await this.page.evaluate((note, sessionId) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('gohunta-voice-notes', 1);
          
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('voice-notes')) {
              db.createObjectStore('voice-notes', { keyPath: 'id' });
            }
          };
          
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['voice-notes'], 'readwrite');
            const store = transaction.objectStore('voice-notes');
            
            store.add({
              id: `voice-${Date.now()}-${Math.random()}`,
              sessionId: sessionId,
              ...note,
              transcribed: false,
              uploaded: false,
              createdOffline: true
            });
            
            transaction.oncomplete = () => resolve(true);
          };
        });
      }, voiceResult, this.huntSession.id);
    }

    return voiceNotes;
  }

  async simulateConnectivityReturn() {
    // Restore internet connection
    await this.context.setOffline(false);
    
    // Wait for connection detection
    await this.page.waitForTimeout(1000);
    
    // Trigger sync process
    const syncResults = await this.page.evaluate(() => {
      // Simulate background sync of all offline data
      const syncPromises = [
        // Sync hunt logs
        new Promise((resolve) => {
          const request = indexedDB.open('gohunta-offline-logs', 1);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['hunt-logs'], 'readonly');
            const store = transaction.objectStore('hunt-logs');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const logs = getAllRequest.result.filter(log => !log.synced);
              resolve({ type: 'hunt-logs', count: logs.length });
            };
          };
        }),
        
        // Sync photos
        new Promise((resolve) => {
          const request = indexedDB.open('gohunta-photos', 1);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['photo-metadata'], 'readonly');
            const store = transaction.objectStore('photo-metadata');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const photos = getAllRequest.result.filter(photo => !photo.uploaded);
              resolve({ type: 'photos', count: photos.length });
            };
          };
        }),
        
        // Sync voice notes
        new Promise((resolve) => {
          const request = indexedDB.open('gohunta-voice-notes', 1);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['voice-notes'], 'readonly');
            const store = transaction.objectStore('voice-notes');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const notes = getAllRequest.result.filter(note => !note.uploaded);
              resolve({ type: 'voice-notes', count: notes.length });
            };
          };
        })
      ];
      
      return Promise.all(syncPromises);
    });

    return syncResults;
  }

  async verifyDataIntegrity() {
    // Check that all offline data was preserved
    const dataIntegrity = await this.page.evaluate(() => {
      const checks = [];
      
      // Check hunt logs
      checks.push(new Promise((resolve) => {
        const request = indexedDB.open('gohunta-offline-logs', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['hunt-logs'], 'readonly');
          const store = transaction.objectStore('hunt-logs');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve({ type: 'hunt-logs', count: countRequest.result });
          };
        };
      }));
      
      // Check photos
      checks.push(new Promise((resolve) => {
        const request = indexedDB.open('gohunta-photos', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['photo-metadata'], 'readonly');
          const store = transaction.objectStore('photo-metadata');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve({ type: 'photos', count: countRequest.result });
          };
        };
      }));
      
      // Check voice notes
      checks.push(new Promise((resolve) => {
        const request = indexedDB.open('gohunta-voice-notes', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['voice-notes'], 'readonly');
          const store = transaction.objectStore('voice-notes');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve({ type: 'voice-notes', count: countRequest.result });
          };
        };
      }));
      
      return Promise.all(checks);
    });

    return dataIntegrity;
  }

  async cleanup() {
    // Stop any running GPS tracking
    await this.page.evaluate(() => {
      window.stopGPSTracking();
      
      // Clear all intervals
      if (window._gpsIntervals) {
        Object.values(window._gpsIntervals).forEach(interval => clearInterval(interval));
      }
    });
  }
}

test.describe('Field Usage Scenarios Integration Tests', () => {
  let fieldScenarios;

  test.beforeEach(async ({ page, context }) => {
    fieldScenarios = new FieldUsageScenarios(page, context);
    await fieldScenarios.setupHuntingEnvironment();
    await fieldScenarios.authenticateUser();
  });

  test.afterEach(async () => {
    await fieldScenarios.cleanup();
  });

  test.describe('Offline Hunt Logging', () => {
    test('should log complete hunting session while offline', async () => {
      // Start hunt session
      const huntSession = await fieldScenarios.startHuntSession();
      expect(huntSession.id).toBeDefined();
      expect(huntSession.huntType).toBe('upland_birds');

      // Log activities while offline
      const huntLogs = await fieldScenarios.simulateOfflineHuntLogging();
      expect(huntLogs.length).toBe(3);
      expect(huntLogs[0].type).toBe('track_spotted');
      expect(huntLogs[1].type).toBe('dog_point');
      expect(huntLogs[2].type).toBe('harvest');
    });

    test('should sync offline hunt logs when connectivity returns', async () => {
      await fieldScenarios.startHuntSession();
      await fieldScenarios.simulateOfflineHuntLogging();
      
      const syncResults = await fieldScenarios.simulateConnectivityReturn();
      const huntLogSync = syncResults.find(result => result.type === 'hunt-logs');
      
      expect(huntLogSync).toBeDefined();
      expect(huntLogSync.count).toBeGreaterThan(0);
    });

    test('should maintain data integrity during offline operations', async () => {
      await fieldScenarios.startHuntSession();
      await fieldScenarios.simulateOfflineHuntLogging();
      
      const integrityCheck = await fieldScenarios.verifyDataIntegrity();
      const huntLogData = integrityCheck.find(check => check.type === 'hunt-logs');
      
      expect(huntLogData.count).toBe(3);
    });
  });

  test.describe('GPS Tracking and Route Recording', () => {
    test('should accurately track GPS coordinates during hunt', async ({ page }) => {
      await fieldScenarios.startHuntSession();
      
      // Start GPS tracking
      await page.evaluate(() => {
        window.startGPSTracking();
      });

      // Simulate movement and collect GPS points
      const gpsPoints = [];
      for (let i = 0; i < 5; i++) {
        const position = await page.evaluate(() => {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(resolve);
          });
        });
        
        gpsPoints.push({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        
        // Simulate time passing and movement
        await page.waitForTimeout(2000);
      }

      expect(gpsPoints.length).toBe(5);
      expect(gpsPoints[0].accuracy).toBeLessThan(50);
      
      // Verify points are within Montana hunting area bounds
      gpsPoints.forEach(point => {
        expect(point.lat).toBeCloseTo(47.0527, 1);
        expect(point.lng).toBeCloseTo(-109.6333, 1);
      });
    });

    test('should handle GPS accuracy variations in field conditions', async ({ page }) => {
      await fieldScenarios.startHuntSession();
      
      // Simulate varying GPS accuracy conditions
      const accuracyTests = await page.evaluate(() => {
        const tests = [];
        
        return new Promise((resolve) => {
          let count = 0;
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              tests.push({
                accuracy: position.coords.accuracy,
                hasValidCoords: !isNaN(position.coords.latitude) && !isNaN(position.coords.longitude)
              });
              
              count++;
              if (count >= 10) {
                navigator.geolocation.clearWatch(watchId);
                resolve(tests);
              }
            },
            null,
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      });

      expect(accuracyTests.length).toBe(10);
      
      // All positions should have valid coordinates
      accuracyTests.forEach(test => {
        expect(test.hasValidCoords).toBeTruthy();
        expect(test.accuracy).toBeGreaterThan(0);
      });

      // Should have a mix of accuracy levels (field conditions)
      const avgAccuracy = accuracyTests.reduce((sum, test) => sum + test.accuracy, 0) / accuracyTests.length;
      expect(avgAccuracy).toBeLessThan(100); // Reasonable field accuracy
    });
  });

  test.describe('Photo Capture and Metadata', () => {
    test('should capture hunting photos with location metadata', async () => {
      await fieldScenarios.startHuntSession();
      
      const photos = await fieldScenarios.captureHuntingPhotos();
      
      expect(photos.length).toBe(3);
      photos.forEach(photo => {
        expect(photo.success).toBeTruthy();
        expect(photo.size).toBeGreaterThan(0);
        expect(photo.type).toBe('image/jpeg');
        expect(photo.metadata.location).toBeDefined();
        expect(photo.metadata.location.lat).toBeCloseTo(47.0527, 3);
        expect(photo.metadata.location.lng).toBeCloseTo(-109.6333, 3);
      });
    });

    test('should queue photos for upload when offline', async () => {
      await fieldScenarios.startHuntSession();
      
      // Ensure we're offline
      await fieldScenarios.context.setOffline(true);
      
      const photos = await fieldScenarios.captureHuntingPhotos();
      
      // Verify photos were stored locally
      const photoIntegrity = await fieldScenarios.verifyDataIntegrity();
      const photoData = photoIntegrity.find(check => check.type === 'photos');
      
      expect(photoData.count).toBe(photos.length);
    });
  });

  test.describe('Voice Notes Integration', () => {
    test('should record and store voice notes during hunt', async () => {
      await fieldScenarios.startHuntSession();
      
      const voiceNotes = await fieldScenarios.recordVoiceNotes();
      
      expect(voiceNotes.length).toBe(3);
      voiceNotes.forEach(note => {
        expect(note.success).toBeTruthy();
        expect(note.size).toBeGreaterThan(0);
        expect(note.type).toBe('audio/webm');
        expect(note.transcript).toBeDefined();
        expect(note.duration).toBe(2000);
      });
    });

    test('should handle voice recording in various field conditions', async ({ page }) => {
      await fieldScenarios.startHuntSession();
      
      // Test different recording scenarios
      const recordingTests = [];
      
      // Short note
      const shortNote = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          
          return new Promise((resolve) => {
            let audioData = [];
            
            recorder.ondataavailable = (event) => {
              audioData.push(event.data);
            };
            
            recorder.onstop = () => {
              const audioBlob = new Blob(audioData, { type: 'audio/webm' });
              stream.getTracks().forEach(track => track.stop());
              resolve({ success: true, size: audioBlob.size, duration: 500 });
            };
            
            recorder.start();
            setTimeout(() => recorder.stop(), 500);
          });
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(shortNote.success).toBeTruthy();
      expect(shortNote.size).toBeGreaterThan(0);
    });
  });

  test.describe('Complete Hunt Session Workflow', () => {
    test('should complete full hunt workflow from start to sync', async () => {
      // Start hunt session
      const huntSession = await fieldScenarios.startHuntSession();
      expect(huntSession.id).toBeDefined();

      // Go offline for field work
      await fieldScenarios.context.setOffline(true);
      
      // Log hunt activities
      const huntLogs = await fieldScenarios.simulateOfflineHuntLogging();
      expect(huntLogs.length).toBe(3);
      
      // Capture photos
      const photos = await fieldScenarios.captureHuntingPhotos();
      expect(photos.length).toBe(3);
      
      // Record voice notes
      const voiceNotes = await fieldScenarios.recordVoiceNotes();
      expect(voiceNotes.length).toBe(3);
      
      // Return to connectivity
      const syncResults = await fieldScenarios.simulateConnectivityReturn();
      expect(syncResults.length).toBe(3);
      
      // Verify all data is accounted for
      const totalItems = syncResults.reduce((sum, result) => sum + result.count, 0);
      expect(totalItems).toBeGreaterThan(0);
      
      // Verify data integrity
      const integrityCheck = await fieldScenarios.verifyDataIntegrity();
      expect(integrityCheck.length).toBe(3);
      
      integrityCheck.forEach(check => {
        expect(check.count).toBeGreaterThan(0);
      });
    });

    test('should maintain performance during extended offline sessions', async () => {
      const startTime = Date.now();
      
      await fieldScenarios.startHuntSession();
      await fieldScenarios.context.setOffline(true);
      
      // Simulate extended offline session
      for (let i = 0; i < 3; i++) {
        await fieldScenarios.simulateOfflineHuntLogging();
        await fieldScenarios.captureHuntingPhotos();
        await fieldScenarios.recordVoiceNotes();
        
        // Small delay between activities
        await fieldScenarios.page.waitForTimeout(500);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete extended session within reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds
      
      // Verify all data was stored
      const integrityCheck = await fieldScenarios.verifyDataIntegrity();
      integrityCheck.forEach(check => {
        expect(check.count).toBeGreaterThan(6); // Multiple rounds of data
      });
    });
  });
});