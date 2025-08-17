/**
 * Rate Limiter Middleware for Rawgle
 * Implements rate limiting using Cloudflare KV storage
 */

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} Middleware function
 */
export const rateLimiter = async (c, next) => {
  try {
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const user = c.get('user');
    const path = c.req.path;
    const method = c.req.method;
    
    // Different limits for different types of requests
    const limits = getRateLimits(path, method, user?.subscriptionTier);
    
    if (!limits) {
      // No rate limiting for this endpoint
      await next();
      return;
    }
    
    const { windowMs, maxRequests, keyPrefix } = limits;
    
    // Create rate limit key
    const identifier = user?.id || ip;
    const window = Math.floor(Date.now() / windowMs);
    const key = `${keyPrefix}:${identifier}:${window}`;
    
    // Get current request count
    const currentCount = await c.env.KV.get(key);
    const requestCount = currentCount ? parseInt(currentCount) : 0;
    
    // Check if limit exceeded
    if (requestCount >= maxRequests) {
      const resetTime = (window + 1) * windowMs;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      // Set rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', resetTime.toString());
      c.header('Retry-After', retryAfter.toString());
      
      return c.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.floor(windowMs / 1000)} seconds.`,
        retry_after: retryAfter
      }, 429);
    }
    
    // Increment request count
    const newCount = requestCount + 1;
    const ttl = Math.ceil(windowMs / 1000);
    
    await c.env.KV.put(key, newCount.toString(), {
      expirationTtl: ttl
    });
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - newCount).toString());
    c.header('X-RateLimit-Reset', ((window + 1) * windowMs).toString());
    
    await next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Continue without rate limiting on error to avoid blocking legitimate requests
    await next();
  }
};

/**
 * Get rate limits for specific endpoints
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @param {string} subscriptionTier - User subscription tier
 * @returns {Object|null} Rate limit configuration
 */
function getRateLimits(path, method, subscriptionTier = 'free') {
  // Higher limits for premium users
  const tierMultipliers = {
    'free': 1,
    'premium': 2,
    'pro': 3,
    'business': 5,
    'admin': 10,
    'super_admin': 50
  };
  
  const multiplier = tierMultipliers[subscriptionTier] || 1;
  
  // Authentication endpoints (stricter limits)
  if (path.includes('/auth/')) {
    if (path.includes('/login') || path.includes('/register')) {
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: Math.floor(5 * multiplier), // 5 attempts per 15 minutes for free users
        keyPrefix: 'auth_strict'
      };
    }
    
    if (path.includes('/forgot-password') || path.includes('/reset-password')) {
      return {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: Math.floor(3 * multiplier), // 3 attempts per hour
        keyPrefix: 'password_reset'
      };
    }
    
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(10 * multiplier), // 10 requests per minute
      keyPrefix: 'auth_general'
    };
  }
  
  // File upload endpoints (stricter limits)
  if (path.includes('/photos') || path.includes('/upload')) {
    return {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: Math.floor(20 * multiplier), // 20 uploads per 5 minutes
      keyPrefix: 'file_upload'
    };
  }
  
  // PAWS token endpoints
  if (path.includes('/paws/')) {
    if (path.includes('/transfer')) {
      return {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: Math.floor(10 * multiplier), // 10 transfers per hour
        keyPrefix: 'paws_transfer'
      };
    }
    
    if (path.includes('/earn')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: Math.floor(30 * multiplier), // 30 earn requests per minute
        keyPrefix: 'paws_earn'
      };
    }
    
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(60 * multiplier), // 60 requests per minute
      keyPrefix: 'paws_general'
    };
  }
  
  // NFT endpoints (stricter limits due to blockchain operations)
  if (path.includes('/nft/')) {
    return {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: Math.floor(5 * multiplier), // 5 NFT operations per 10 minutes
      keyPrefix: 'nft_operations'
    };
  }
  
  // Community endpoints
  if (path.includes('/community/')) {
    if (method === 'POST') {
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: Math.floor(10 * multiplier), // 10 posts per 15 minutes
        keyPrefix: 'community_post'
      };
    }
    
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(100 * multiplier), // 100 reads per minute
      keyPrefix: 'community_read'
    };
  }
  
  // Feeding logs endpoints
  if (path.includes('/feeding/')) {
    if (method === 'POST') {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: Math.floor(20 * multiplier), // 20 feeding logs per minute
        keyPrefix: 'feeding_create'
      };
    }
    
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(120 * multiplier), // 120 requests per minute
      keyPrefix: 'feeding_general'
    };
  }
  
  // Pet management endpoints
  if (path.includes('/pets/')) {
    if (method === 'POST' || method === 'PUT') {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: Math.floor(30 * multiplier), // 30 modifications per minute
        keyPrefix: 'pets_modify'
      };
    }
    
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(120 * multiplier), // 120 reads per minute
      keyPrefix: 'pets_read'
    };
  }
  
  // Analytics and reports (can be resource intensive)
  if (path.includes('/analytics') || path.includes('/reports')) {
    return {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: Math.floor(20 * multiplier), // 20 analytics requests per 5 minutes
      keyPrefix: 'analytics'
    };
  }
  
  // General API endpoints
  if (path.startsWith('/api/')) {
    if (method === 'GET') {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: Math.floor(200 * multiplier), // 200 GET requests per minute
        keyPrefix: 'api_read'
      };
    } else {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: Math.floor(100 * multiplier), // 100 write requests per minute
        keyPrefix: 'api_write'
      };
    }
  }
  
  // No rate limiting for other endpoints
  return null;
}

/**
 * Get rate limit status for a user
 * @param {string} identifier - User ID or IP address
 * @param {string} keyPrefix - Rate limit key prefix
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests allowed
 * @param {Object} kv - KV storage instance
 * @returns {Object} Rate limit status
 */
export const getRateLimitStatus = async (identifier, keyPrefix, windowMs, maxRequests, kv) => {
  try {
    const window = Math.floor(Date.now() / windowMs);
    const key = `${keyPrefix}:${identifier}:${window}`;
    
    const currentCount = await kv.get(key);
    const requestCount = currentCount ? parseInt(currentCount) : 0;
    
    const resetTime = (window + 1) * windowMs;
    const remaining = Math.max(0, maxRequests - requestCount);
    
    return {
      limit: maxRequests,
      remaining,
      resetTime,
      retryAfter: remaining === 0 ? Math.ceil((resetTime - Date.now()) / 1000) : null
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
      retryAfter: null
    };
  }
};

/**
 * Clear rate limits for a user (admin function)
 * @param {string} identifier - User ID or IP address
 * @param {string} keyPrefix - Rate limit key prefix (optional, clears all if not provided)
 * @param {Object} kv - KV storage instance
 */
export const clearRateLimits = async (identifier, keyPrefix, kv) => {
  try {
    if (keyPrefix) {
      // Clear specific rate limit type
      const window = Math.floor(Date.now() / (60 * 1000)); // Assume 1-minute windows
      const key = `${keyPrefix}:${identifier}:${window}`;
      await kv.delete(key);
    } else {
      // Clear all rate limits for user (would need to list and delete all keys)
      // This is more complex with KV storage and might require a different approach
      console.warn('Clearing all rate limits not implemented yet');
    }
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    throw error;
  }
};

/**
 * Custom rate limiter for specific use cases
 * @param {Object} config - Custom rate limit configuration
 * @returns {Function} Middleware function
 */
export const customRateLimiter = (config) => {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    keyPrefix = 'custom',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached = null
  } = config;
  
  return async (c, next) => {
    try {
      const ip = c.req.header('cf-connecting-ip') || 'unknown';
      const user = c.get('user');
      const identifier = user?.id || ip;
      
      const window = Math.floor(Date.now() / windowMs);
      const key = `${keyPrefix}:${identifier}:${window}`;
      
      const currentCount = await c.env.KV.get(key);
      const requestCount = currentCount ? parseInt(currentCount) : 0;
      
      if (requestCount >= maxRequests) {
        if (onLimitReached) {
          await onLimitReached(c, { identifier, requestCount, maxRequests });
        }
        
        const resetTime = (window + 1) * windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        
        return c.json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Custom rate limit exceeded. Maximum ${maxRequests} requests per ${Math.floor(windowMs / 1000)} seconds.`,
          retry_after: retryAfter
        }, 429);
      }
      
      await next();
      
      // Only count request if it should be counted
      const response = c.res;
      const shouldCount = (
        (!skipSuccessfulRequests || response.status >= 400) &&
        (!skipFailedRequests || response.status < 400)
      );
      
      if (shouldCount) {
        const newCount = requestCount + 1;
        const ttl = Math.ceil(windowMs / 1000);
        
        await c.env.KV.put(key, newCount.toString(), {
          expirationTtl: ttl
        });
      }
    } catch (error) {
      console.error('Custom rate limiter error:', error);
      // Continue without rate limiting on error
    }
  };
};