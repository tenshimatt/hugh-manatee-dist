/**
 * GoHunta Real User Monitoring (RUM) Implementation
 * Tracks Web Vitals, performance metrics, and user experience data in production
 * Specialized for hunting app usage patterns and rural network conditions
 */

export class RealUserMonitoring {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/analytics/performance',
      sessionSampleRate: config.sessionSampleRate || 0.1, // Monitor 10% of sessions
      batchSize: config.batchSize || 50,
      batchInterval: config.batchInterval || 30000, // 30 seconds
      enableAutoFlush: config.enableAutoFlush !== false,
      enableOfflineStorage: config.enableOfflineStorage !== false,
      maxOfflineStorageSize: config.maxOfflineStorageSize || 5 * 1024 * 1024, // 5MB
      ...config
    };
    
    this.metrics = [];
    this.session = this.initializeSession();
    this.observers = new Map();
    this.isInitialized = false;
    this.offlineStorage = this.config.enableOfflineStorage ? this.initializeOfflineStorage() : null;
    
    // Bind methods to preserve context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initialize RUM monitoring
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if session should be monitored (sampling)
      if (!this.shouldMonitorSession()) {
        console.log('RUM: Session not selected for monitoring');
        return;
      }
      
      console.log('RUM: Initializing performance monitoring');
      
      // Initialize Web Vitals monitoring
      this.initializeWebVitals();
      
      // Initialize custom performance monitoring
      this.initializeCustomMetrics();
      
      // Initialize navigation and resource timing
      this.initializeNavigationTiming();
      this.initializeResourceTiming();
      
      // Initialize user interaction monitoring
      this.initializeUserInteractionMonitoring();
      
      // Initialize network and connection monitoring
      this.initializeNetworkMonitoring();
      
      // Initialize error monitoring
      this.initializeErrorMonitoring();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start batch processing
      if (this.config.enableAutoFlush) {
        this.startBatchProcessor();
      }
      
      // Record initial page load
      this.recordPageLoad();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('RUM: Failed to initialize:', error);
    }
  }

  /**
   * Initialize session tracking
   */
  initializeSession() {
    const sessionId = this.generateSessionId();
    const userId = this.getUserId();
    
    return {
      id: sessionId,
      userId: userId,
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0
      },
      connection: this.getConnectionInfo(),
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
      huntingContext: this.getHuntingContext()
    };
  }

  /**
   * Web Vitals monitoring (Core Web Vitals + additional metrics)
   */
  initializeWebVitals() {
    // First Contentful Paint (FCP)
    this.observePerformanceEntries('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('web_vitals', 'first_contentful_paint', {
            value: entry.startTime,
            rating: this.rateWebVital('FCP', entry.startTime),
            timestamp: Date.now()
          });
        }
      }
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntries('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordMetric('web_vitals', 'largest_contentful_paint', {
          value: lastEntry.startTime,
          rating: this.rateWebVital('LCP', lastEntry.startTime),
          element: lastEntry.element?.tagName || 'unknown',
          timestamp: Date.now()
        });
      }
    });

    // First Input Delay (FID)
    this.observePerformanceEntries('first-input', (entries) => {
      for (const entry of entries) {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('web_vitals', 'first_input_delay', {
          value: fid,
          rating: this.rateWebVital('FID', fid),
          inputType: entry.name,
          timestamp: Date.now()
        });
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntries('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('web_vitals', 'cumulative_layout_shift', {
            value: clsValue,
            rating: this.rateWebVital('CLS', clsValue),
            timestamp: Date.now()
          });
        }
      }
    });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.recordMetric('web_vitals', 'time_to_first_byte', {
        value: ttfb,
        rating: this.rateWebVital('TTFB', ttfb),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Custom performance metrics for hunting app
   */
  initializeCustomMetrics() {
    // GPS lock time monitoring
    if ('geolocation' in navigator) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      const originalWatchPosition = navigator.geolocation.watchPosition;
      
      navigator.geolocation.getCurrentPosition = (success, error, options) => {
        const startTime = performance.now();
        
        const wrappedSuccess = (position) => {
          const lockTime = performance.now() - startTime;
          this.recordMetric('custom', 'gps_lock_time', {
            value: lockTime,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
          success(position);
        };
        
        const wrappedError = (err) => {
          const lockTime = performance.now() - startTime;
          this.recordMetric('custom', 'gps_lock_failure', {
            value: lockTime,
            error: err.code,
            message: err.message,
            timestamp: Date.now()
          });
          if (error) error(err);
        };
        
        return originalGetCurrentPosition.call(this, wrappedSuccess, wrappedError, options);
      };
    }

    // IndexedDB operation timing
    if ('indexedDB' in window) {
      this.monitorIndexedDBOperations();
    }

    // Service Worker performance
    if ('serviceWorker' in navigator) {
      this.monitorServiceWorkerPerformance();
    }

    // Photo upload performance
    this.monitorPhotoUploadPerformance();

    // Offline sync performance
    this.monitorOfflineSyncPerformance();
  }

  /**
   * Navigation timing monitoring
   */
  initializeNavigationTiming() {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      this.recordMetric('navigation', 'page_load_timing', {
        dns_lookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
        tcp_connect: navigationEntry.connectEnd - navigationEntry.connectStart,
        ssl_negotiation: navigationEntry.secureConnectionStart > 0 ? 
          navigationEntry.connectEnd - navigationEntry.secureConnectionStart : 0,
        request_time: navigationEntry.responseStart - navigationEntry.requestStart,
        response_time: navigationEntry.responseEnd - navigationEntry.responseStart,
        dom_processing: navigationEntry.domComplete - navigationEntry.domLoading,
        load_complete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        total_time: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Resource timing monitoring
   */
  initializeResourceTiming() {
    this.observePerformanceEntries('resource', (entries) => {
      for (const entry of entries) {
        // Focus on critical resources
        if (this.isCriticalResource(entry.name)) {
          this.recordMetric('resource', 'resource_timing', {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || entry.decodedBodySize,
            cache_status: entry.transferSize === 0 ? 'cache_hit' : 'cache_miss',
            timestamp: Date.now()
          });
        }
      }
    });
  }

  /**
   * User interaction monitoring
   */
  initializeUserInteractionMonitoring() {
    // Click response time
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      // Monitor for response within reasonable time
      const checkResponse = () => {
        const responseTime = performance.now() - startTime;
        this.recordMetric('interaction', 'click_response_time', {
          element: event.target.tagName,
          element_id: event.target.id || null,
          element_class: event.target.className || null,
          response_time: responseTime,
          page: location.pathname,
          timestamp: Date.now()
        });
      };
      
      // Check after next frame
      requestAnimationFrame(checkResponse);
    });

    // Form submission timing
    document.addEventListener('submit', (event) => {
      const startTime = performance.now();
      const formData = new FormData(event.target);
      
      this.recordMetric('interaction', 'form_submission', {
        form_id: event.target.id || null,
        form_action: event.target.action || null,
        field_count: formData.keys() ? Array.from(formData.keys()).length : 0,
        start_time: startTime,
        page: location.pathname,
        timestamp: Date.now()
      });
    });

    // Long task monitoring
    this.observePerformanceEntries('longtask', (entries) => {
      for (const entry of entries) {
        this.recordMetric('interaction', 'long_task', {
          duration: entry.duration,
          start_time: entry.startTime,
          attribution: entry.attribution?.[0]?.name || 'unknown',
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Network and connection monitoring
   */
  initializeNetworkMonitoring() {
    // Monitor connection changes
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      const recordConnectionInfo = () => {
        this.recordMetric('network', 'connection_info', {
          effective_type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          save_data: connection.saveData,
          timestamp: Date.now()
        });
      };
      
      // Record initial connection
      recordConnectionInfo();
      
      // Monitor connection changes
      connection.addEventListener('change', recordConnectionInfo);
    }

    // Monitor online/offline events
    window.addEventListener('online', () => {
      this.recordMetric('network', 'connectivity_change', {
        status: 'online',
        timestamp: Date.now()
      });
      
      // Try to flush offline stored metrics
      if (this.offlineStorage) {
        this.flushOfflineMetrics();
      }
    });

    window.addEventListener('offline', () => {
      this.recordMetric('network', 'connectivity_change', {
        status: 'offline',
        timestamp: Date.now()
      });
    });
  }

  /**
   * Error monitoring
   */
  initializeErrorMonitoring() {
    // JavaScript errors
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleError);

    // Resource loading errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordMetric('error', 'resource_error', {
          resource: event.target.src || event.target.href,
          element: event.target.tagName,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  /**
   * Monitor IndexedDB operations
   */
  monitorIndexedDBOperations() {
    const originalIDBRequest = window.IDBRequest;
    if (!originalIDBRequest) return;
    
    const rumInstance = this;
    
    // Override IDBRequest to monitor operations
    const originalAddEventListener = originalIDBRequest.prototype.addEventListener;
    
    originalIDBRequest.prototype.addEventListener = function(type, listener, options) {
      if (type === 'success' && this.source) {
        const operationType = this.source.constructor.name === 'IDBObjectStore' ? 'objectstore' : 'index';
        const startTime = performance.now();
        
        const wrappedListener = function(event) {
          const duration = performance.now() - startTime;
          
          rumInstance.recordMetric('indexeddb', 'operation_timing', {
            operation: operationType,
            duration,
            success: true,
            timestamp: Date.now()
          });
          
          return listener.call(this, event);
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Monitor Service Worker performance
   */
  monitorServiceWorkerPerformance() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
          this.recordMetric('service_worker', event.data.metric, {
            ...event.data.data,
            timestamp: Date.now()
          });
        }
      });

      // Monitor service worker installation and activation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.recordMetric('service_worker', 'controller_change', {
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * Monitor photo upload performance
   */
  monitorPhotoUploadPerformance() {
    // Override fetch to monitor photo uploads
    const originalFetch = window.fetch;
    const rumInstance = this;
    
    window.fetch = function(resource, init) {
      const url = typeof resource === 'string' ? resource : resource.url;
      
      if (url.includes('/photos/upload') || url.includes('/images/upload')) {
        const startTime = performance.now();
        
        return originalFetch.call(this, resource, init)
          .then(response => {
            const duration = performance.now() - startTime;
            
            rumInstance.recordMetric('photo_upload', 'upload_timing', {
              duration,
              success: response.ok,
              status: response.status,
              size: init?.body?.size || 0,
              timestamp: Date.now()
            });
            
            return response;
          })
          .catch(error => {
            const duration = performance.now() - startTime;
            
            rumInstance.recordMetric('photo_upload', 'upload_error', {
              duration,
              error: error.message,
              timestamp: Date.now()
            });
            
            throw error;
          });
      }
      
      return originalFetch.call(this, resource, init);
    };
  }

  /**
   * Monitor offline sync performance
   */
  monitorOfflineSyncPerformance() {
    // Monitor sync events from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('sync', (event) => {
        this.recordMetric('offline_sync', 'sync_event', {
          tag: event.tag,
          timestamp: Date.now()
        });
      });
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleUnload);
    window.addEventListener('pagehide', this.handleUnload);
  }

  /**
   * Start batch processing for metrics
   */
  startBatchProcessor() {
    this.batchProcessor = setInterval(() => {
      this.flushMetrics();
    }, this.config.batchInterval);
  }

  /**
   * Record a performance metric
   */
  recordMetric(category, name, data) {
    const metric = {
      id: this.generateMetricId(),
      sessionId: this.session.id,
      userId: this.session.userId,
      category,
      name,
      data,
      page: location.pathname,
      timestamp: Date.now(),
      connection: this.getConnectionInfo()
    };
    
    this.metrics.push(metric);
    
    // Store offline if needed
    if (!navigator.onLine && this.offlineStorage) {
      this.storeMetricOffline(metric);
    }
    
    // Auto-flush if batch size reached
    if (this.metrics.length >= this.config.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Flush metrics to server
   */
  async flushMetrics(force = false) {
    if (this.metrics.length === 0 && !force) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    try {
      await this.sendMetrics(metricsToSend);
    } catch (error) {
      console.warn('RUM: Failed to send metrics:', error);
      
      // Store failed metrics offline if possible
      if (this.offlineStorage) {
        for (const metric of metricsToSend) {
          this.storeMetricOffline(metric);
        }
      } else {
        // Re-add to queue for next attempt
        this.metrics.unshift(...metricsToSend);
      }
    }
  }

  /**
   * Send metrics to server
   */
  async sendMetrics(metrics) {
    const payload = {
      session: this.session,
      metrics: metrics,
      timestamp: Date.now()
    };
    
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.status}`);
    }
  }

  /**
   * Initialize offline storage
   */
  initializeOfflineStorage() {
    if (!('indexedDB' in window)) return null;
    
    const request = indexedDB.open('gohunta-rum', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('metrics')) {
        const store = db.createObjectStore('metrics', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store metric offline
   */
  async storeMetricOffline(metric) {
    if (!this.offlineStorage) return;
    
    try {
      const db = await this.offlineStorage;
      const transaction = db.transaction(['metrics'], 'readwrite');
      const store = transaction.objectStore('metrics');
      
      await new Promise((resolve, reject) => {
        const request = store.add(metric);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Clean up old metrics if storage getting full
      this.cleanupOfflineStorage(db);
      
    } catch (error) {
      console.warn('RUM: Failed to store metric offline:', error);
    }
  }

  /**
   * Flush offline metrics when back online
   */
  async flushOfflineMetrics() {
    if (!this.offlineStorage) return;
    
    try {
      const db = await this.offlineStorage;
      const transaction = db.transaction(['metrics'], 'readonly');
      const store = transaction.objectStore('metrics');
      
      const request = store.getAll();
      const offlineMetrics = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (offlineMetrics.length > 0) {
        await this.sendMetrics(offlineMetrics);
        
        // Clear offline storage after successful send
        const deleteTransaction = db.transaction(['metrics'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('metrics');
        deleteStore.clear();
      }
      
    } catch (error) {
      console.warn('RUM: Failed to flush offline metrics:', error);
    }
  }

  /**
   * Clean up old offline metrics
   */
  async cleanupOfflineStorage(db) {
    try {
      const transaction = db.transaction(['metrics'], 'readonly');
      const store = transaction.objectStore('metrics');
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        if (countRequest.result > 1000) { // Keep only 1000 most recent metrics
          const deleteTransaction = db.transaction(['metrics'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('metrics');
          const index = deleteStore.index('timestamp');
          
          // Delete oldest 500 metrics
          const range = IDBKeyRange.upperBound(Date.now() - 86400000); // Older than 24 hours
          index.openCursor(range).onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            }
          };
        }
      };
    } catch (error) {
      console.warn('RUM: Failed to cleanup offline storage:', error);
    }
  }

  // Helper methods
  shouldMonitorSession() {
    return Math.random() < this.config.sessionSampleRate;
  }

  generateSessionId() {
    return 'rum_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateMetricId() {
    return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserId() {
    // Try to get user ID from localStorage, cookies, or other auth source
    return localStorage.getItem('userId') || 'anonymous_' + this.generateSessionId();
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  getDeviceInfo() {
    return {
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  getLocationInfo() {
    // Don't track actual location for privacy, just general info
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages
    };
  }

  getHuntingContext() {
    // Extract hunting-specific context from page or app state
    return {
      huntingMode: localStorage.getItem('huntingMode') || null,
      currentSeason: localStorage.getItem('currentSeason') || null,
      offlineMode: !navigator.onLine,
      gpsEnabled: 'geolocation' in navigator
    };
  }

  observePerformanceEntries(type, callback) {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`RUM: Failed to observe ${type} entries:`, error);
    }
  }

  rateWebVital(metric, value) {
    const thresholds = {
      'FCP': { good: 1800, poor: 3000 }, // ms
      'LCP': { good: 2500, poor: 4000 }, // ms
      'FID': { good: 100, poor: 300 }, // ms
      'CLS': { good: 0.1, poor: 0.25 }, // score
      'TTFB': { good: 800, poor: 1800 } // ms
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  isCriticalResource(url) {
    const criticalPatterns = [
      '/main.bundle.js',
      '/main.css',
      '/sw.js',
      '/manifest.json',
      '/api/',
      '.woff',
      '.woff2'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    return 'other';
  }

  recordPageLoad() {
    this.recordMetric('navigation', 'page_load', {
      url: location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  handleVisibilityChange() {
    this.recordMetric('interaction', 'visibility_change', {
      visibilityState: document.visibilityState,
      timestamp: Date.now()
    });
    
    if (document.visibilityState === 'hidden') {
      this.flushMetrics(true);
    }
  }

  handleUnload() {
    this.recordMetric('navigation', 'page_unload', {
      url: location.href,
      timestamp: Date.now()
    });
    
    // Try to send metrics before page unloads
    if (navigator.sendBeacon && this.metrics.length > 0) {
      const payload = JSON.stringify({
        session: this.session,
        metrics: this.metrics,
        timestamp: Date.now()
      });
      
      navigator.sendBeacon(this.config.apiEndpoint, payload);
    }
  }

  handleError(event) {
    let errorInfo;
    
    if (event.type === 'error') {
      errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      };
    } else if (event.type === 'unhandledrejection') {
      errorInfo = {
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        promise: true
      };
    }
    
    this.recordMetric('error', 'javascript_error', {
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: location.href,
      timestamp: Date.now()
    });
  }

  /**
   * Public API for manual metric recording
   */
  recordCustomMetric(name, data) {
    this.recordMetric('custom', name, data);
  }

  /**
   * Record hunt-specific events
   */
  recordHuntEvent(eventType, data) {
    this.recordMetric('hunt_event', eventType, {
      ...data,
      huntingContext: this.getHuntingContext(),
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup and destroy RUM instance
   */
  destroy() {
    // Clear intervals
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
    }
    
    // Disconnect observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleUnload);
    window.removeEventListener('pagehide', this.handleUnload);
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleError);
    
    // Final flush
    this.flushMetrics(true);
    
    this.isInitialized = false;
  }
}

// Export singleton instance for easy integration
let rumInstance = null;

export const initializeRUM = (config) => {
  if (!rumInstance) {
    rumInstance = new RealUserMonitoring(config);
    rumInstance.initialize();
  }
  return rumInstance;
};

export const getRUM = () => rumInstance;

export default RealUserMonitoring;