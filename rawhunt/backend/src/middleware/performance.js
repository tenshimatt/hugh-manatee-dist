/**
 * Performance monitoring middleware
 */

export function trackRequestPerformance(request) {
  const startTime = Date.now();
  
  // Add performance tracking to request object
  request.performance = {
    startTime,
    track: function(event, metadata = {}) {
      const duration = Date.now() - this.startTime;
      console.log(`[PERF] ${request.method} ${request.url} - ${event}: ${duration}ms`, metadata);
      return duration;
    },
    end: function() {
      const totalDuration = Date.now() - this.startTime;
      
      // Log performance metrics
      console.log(`[PERF] Request completed: ${request.method} ${request.url} - ${totalDuration}ms`);
      
      // Add performance headers
      request.performanceHeaders = {
        'X-Response-Time': `${totalDuration}ms`,
        'X-Processing-Time': `${totalDuration}ms`
      };
      
      return totalDuration;
    }
  };
  
  return request;
}

export function addPerformanceHeaders(response, request) {
  if (request.performanceHeaders) {
    Object.entries(request.performanceHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export async function trackDatabaseQuery(queryName, queryFn) {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log slow queries (>100ms)
    if (duration > 100) {
      console.warn(`[SLOW QUERY] ${queryName}: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY ERROR] ${queryName}: ${duration}ms`, error);
    throw error;
  }
}

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.requestCounts = new Map();
    this.errorCounts = new Map();
    this.responseTimes = new Map();
  }

  recordRequest(method, path, duration, status) {
    const key = `${method}_${path}`;
    
    // Count requests
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // Track errors
    if (status >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
    
    // Track response times
    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, []);
    }
    this.responseTimes.get(key).push(duration);
    
    // Keep only last 100 response times per endpoint
    if (this.responseTimes.get(key).length > 100) {
      this.responseTimes.get(key).shift();
    }
  }

  getMetrics() {
    const metrics = {};
    
    for (const [key, count] of this.requestCounts.entries()) {
      const responseTimes = this.responseTimes.get(key) || [];
      const errorCount = this.errorCounts.get(key) || 0;
      
      metrics[key] = {
        requests: count,
        errors: errorCount,
        errorRate: count > 0 ? (errorCount / count * 100).toFixed(2) : 0,
        avgResponseTime: responseTimes.length > 0 
          ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
          : 0,
        minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
      };
    }
    
    return metrics;
  }

  reset() {
    this.requestCounts.clear();
    this.errorCounts.clear();
    this.responseTimes.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

export function cacheResponse(key, data, ttl = 300) {
  // Simple in-memory cache with TTL
  const cacheItem = {
    data,
    expires: Date.now() + (ttl * 1000)
  };
  
  // This would be replaced with KV storage in production
  global._cache = global._cache || new Map();
  global._cache.set(key, cacheItem);
}

export function getCachedResponse(key) {
  global._cache = global._cache || new Map();
  const item = global._cache.get(key);
  
  if (!item) return null;
  
  if (Date.now() > item.expires) {
    global._cache.delete(key);
    return null;
  }
  
  return item.data;
}

export function generateCacheKey(request, additionalParams = []) {
  const url = new URL(request.url);
  const baseKey = `${request.method}_${url.pathname}`;
  
  // Include query parameters that affect caching
  const relevantParams = ['page', 'limit', 'category', 'search', ...additionalParams];
  const params = [];
  
  for (const param of relevantParams) {
    const value = url.searchParams.get(param);
    if (value) {
      params.push(`${param}=${value}`);
    }
  }
  
  return params.length > 0 ? `${baseKey}?${params.join('&')}` : baseKey;
}