// Middleware Collection
// Rate limiting, analytics, error handling, authentication middleware

import { verify } from '@hono/jwt';

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} keyGenerator - Function to generate rate limit key
 * @returns {Function} Middleware function
 */
export function rateLimiter(maxRequests = 100, windowMs = 60000, keyGenerator = null) {
  return async (c, next) => {
    try {
      const kv = c.env.KV;
      
      // Generate rate limit key
      const key = keyGenerator ? 
        keyGenerator(c) : 
        `rate_limit:${c.req.header('cf-connecting-ip') || 'unknown'}`;
      
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const rateLimitKey = `${key}:${windowStart}`;
      
      // Get current request count
      const currentCount = await kv.get(rateLimitKey);
      const requestCount = currentCount ? parseInt(currentCount) : 0;
      
      if (requestCount >= maxRequests) {
        return c.json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((windowStart + windowMs - now) / 1000)
          }
        }, 429);
      }
      
      // Increment request count
      await kv.put(rateLimitKey, (requestCount + 1).toString(), {
        expirationTtl: Math.ceil(windowMs / 1000)
      });
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - requestCount - 1).toString());
      c.header('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000).toString());
      
      await next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue on rate limiter error - don't block requests
      await next();
    }
  };
}

/**
 * Authentication middleware
 * @param {boolean} optional - Whether authentication is optional
 * @returns {Function} Middleware function
 */
export function authenticate(optional = false) {
  return async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader) {
        if (optional) {
          c.set('user', null);
          await next();
          return;
        }
        
        return c.json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authorization header is required'
          }
        }, 401);
      }
      
      if (!authHeader.startsWith('Bearer ')) {
        return c.json({
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Authorization header must start with "Bearer "'
          }
        }, 401);
      }
      
      const token = authHeader.slice(7);
      const jwtSecret = c.env.JWT_SECRET || 'your-super-secret-jwt-key';
      
      try {
        const payload = await verify(token, jwtSecret);
        
        if (!payload || payload.exp < Date.now() / 1000) {
          return c.json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired'
            }
          }, 401);
        }
        
        // Verify session exists in KV
        const kv = c.env.KV;
        const sessionData = await kv.get(`session:${token}`, 'json');
        
        if (!sessionData) {
          return c.json({
            error: {
              code: 'INVALID_SESSION',
              message: 'Session not found or expired'
            }
          }, 401);
        }
        
        // Add user info to context
        c.set('user', {
          id: payload.sub,
          platform: payload.platform,
          sessionToken: token
        });
        
        await next();
      } catch (jwtError) {
        return c.json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or malformed token'
          }
        }, 401);
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return c.json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed'
        }
      }, 500);
    }
  };
}

/**
 * Platform access middleware
 * @param {'rawgle' | 'gohunta' | 'both'} requiredPlatform 
 * @returns {Function} Middleware function
 */
export function requirePlatform(requiredPlatform) {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      }, 401);
    }
    
    const userPlatform = user.platform;
    
    if (userPlatform !== requiredPlatform && userPlatform !== 'both') {
      return c.json({
        error: {
          code: 'PLATFORM_ACCESS_DENIED',
          message: `Access denied. This endpoint requires ${requiredPlatform} platform access.`
        }
      }, 403);
    }
    
    await next();
  };
}

/**
 * Request logging middleware
 * @returns {Function} Middleware function
 */
export function requestLogger() {
  return async (c, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    c.set('requestId', requestId);
    
    // Log request start
    const logData = {
      requestId,
      method: c.req.method,
      url: c.req.url,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip'),
      timestamp: new Date().toISOString(),
      userId: c.get('user')?.id || null
    };
    
    console.log(JSON.stringify({
      type: 'REQUEST_START',
      ...logData
    }));
    
    try {
      await next();
    } catch (error) {
      console.error(JSON.stringify({
        type: 'REQUEST_ERROR',
        requestId,
        error: error.message,
        stack: error.stack
      }));
      throw error;
    }
    
    // Log request completion
    const duration = Date.now() - start;
    const status = c.res.status;
    
    console.log(JSON.stringify({
      type: 'REQUEST_COMPLETE',
      requestId,
      status,
      duration,
      timestamp: new Date().toISOString()
    }));
    
    // Add performance headers
    c.header('X-Request-ID', requestId);
    c.header('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(JSON.stringify({
        type: 'SLOW_REQUEST',
        requestId,
        duration,
        url: c.req.url,
        method: c.req.method
      }));
    }
  };
}

/**
 * Error handling middleware
 * @returns {Function} Middleware function
 */
export function errorHandler() {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId') || 'unknown';
      
      console.error(JSON.stringify({
        type: 'UNHANDLED_ERROR',
        requestId,
        error: error.message,
        stack: error.stack,
        url: c.req.url,
        method: c.req.method,
        userId: c.get('user')?.id || null,
        timestamp: new Date().toISOString()
      }));
      
      // Determine error type and status code
      let statusCode = 500;
      let errorCode = 'INTERNAL_SERVER_ERROR';
      let message = 'An unexpected error occurred';
      
      if (error.message.includes('required')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = error.message;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = error.message;
      } else if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
        statusCode = 403;
        errorCode = 'ACCESS_DENIED';
        message = error.message;
      } else if (error.message.includes('Invalid') || error.message.includes('must be')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = error.message;
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        statusCode = 409;
        errorCode = 'CONFLICT';
        message = error.message;
      } else if (error.message.includes('Too many')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_EXCEEDED';
        message = error.message;
      }
      
      return c.json({
        error: {
          code: errorCode,
          message: message,
          requestId: requestId,
          timestamp: new Date().toISOString()
        }
      }, statusCode);
    }
  };
}

/**
 * Analytics middleware
 * @returns {Function} Middleware function
 */
export function analytics() {
  return async (c, next) => {
    const start = Date.now();
    let analyticsData = null;
    
    try {
      await next();
      
      const duration = Date.now() - start;
      const user = c.get('user');
      
      analyticsData = {
        timestamp: new Date().toISOString(),
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        duration,
        userId: user?.id || null,
        platform: user?.platform || null,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('cf-connecting-ip'),
        country: c.req.header('cf-ipcountry'),
        requestId: c.get('requestId')
      };
      
      // Store analytics data in KV for processing
      const kv = c.env.KV;
      const analyticsKey = `analytics:${Date.now()}:${crypto.randomUUID()}`;
      
      await kv.put(analyticsKey, JSON.stringify(analyticsData), {
        expirationTtl: 7 * 24 * 60 * 60 // 7 days
      });
      
    } catch (error) {
      console.warn('Analytics middleware error:', error);
      // Don't let analytics errors affect the request
    }
  };
}

/**
 * CORS middleware
 * @param {Object} options - CORS configuration
 * @returns {Function} Middleware function
 */
export function cors(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = ['X-Request-ID', 'X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials = false,
    maxAge = 86400
  } = options;
  
  return async (c, next) => {
    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Methods', methods.join(', '));
      c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        c.header('Access-Control-Allow-Credentials', 'true');
      }
      
      c.header('Access-Control-Max-Age', maxAge.toString());
      
      return c.text('', 204);
    }
    
    // Set CORS headers for actual requests
    c.header('Access-Control-Allow-Origin', origin);
    
    if (exposedHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }
    
    if (credentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }
    
    await next();
  };
}

/**
 * Content validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} Middleware function
 */
export function validateContent(schema) {
  return async (c, next) => {
    try {
      const contentType = c.req.header('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const body = await c.req.json();
        
        // Basic validation - in a real app, use a proper validation library like Zod
        for (const [key, rules] of Object.entries(schema)) {
          const value = body[key];
          
          if (rules.required && (value === undefined || value === null || value === '')) {
            return c.json({
              error: {
                code: 'VALIDATION_ERROR',
                message: `${key} is required`,
                field: key
              }
            }, 400);
          }
          
          if (value !== undefined && rules.type) {
            if (rules.type === 'email' && !isValidEmail(value)) {
              return c.json({
                error: {
                  code: 'VALIDATION_ERROR',
                  message: `${key} must be a valid email`,
                  field: key
                }
              }, 400);
            }
            
            if (rules.type === 'string' && typeof value !== 'string') {
              return c.json({
                error: {
                  code: 'VALIDATION_ERROR',
                  message: `${key} must be a string`,
                  field: key
                }
              }, 400);
            }
            
            if (rules.type === 'number' && typeof value !== 'number') {
              return c.json({
                error: {
                  code: 'VALIDATION_ERROR',
                  message: `${key} must be a number`,
                  field: key
                }
              }, 400);
            }
          }
          
          if (value && rules.minLength && value.length < rules.minLength) {
            return c.json({
              error: {
                code: 'VALIDATION_ERROR',
                message: `${key} must be at least ${rules.minLength} characters`,
                field: key
              }
            }, 400);
          }
          
          if (value && rules.maxLength && value.length > rules.maxLength) {
            return c.json({
              error: {
                code: 'VALIDATION_ERROR',
                message: `${key} must be at most ${rules.maxLength} characters`,
                field: key
              }
            }, 400);
          }
        }
        
        // Add validated body to context
        c.set('validatedBody', body);
      }
      
      await next();
    } catch (error) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body'
        }
      }, 400);
    }
  };
}

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}