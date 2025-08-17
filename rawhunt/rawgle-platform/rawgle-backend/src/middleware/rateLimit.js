import { DatabaseUtils } from '../utils/database.js';

/**
 * Rate limiting middleware
 */

export async function rateLimit(request, env, options = {}) {
  const {
    windowMs = parseInt(env.RATE_LIMIT_WINDOW) * 1000 || 60000, // 1 minute default
    maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS) || 100,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => getClientIP(req)
  } = options;

  const key = keyGenerator(request);
  const endpoint = new URL(request.url).pathname;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  try {
    // Get current request count for this window
    const existing = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT request_count FROM rate_limits WHERE ip_address = ? AND endpoint = ? AND window_start = ?',
      [key, endpoint, windowStart.toISOString()]
    );

    let requestCount = existing ? existing.request_count : 0;

    // Check if limit exceeded
    if (requestCount >= maxRequests) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil((windowStart.getTime() + windowMs) / 1000).toString(),
          'Retry-After': Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000).toString()
        }
      });
    }

    // Increment counter
    requestCount++;
    
    if (existing) {
      await DatabaseUtils.executeUpdate(
        env.DB,
        'UPDATE rate_limits SET request_count = ? WHERE ip_address = ? AND endpoint = ? AND window_start = ?',
        [requestCount, key, endpoint, windowStart.toISOString()]
      );
    } else {
      await DatabaseUtils.executeUpdate(
        env.DB,
        'INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start, created_at) VALUES (?, ?, ?, ?, ?)',
        [key, endpoint, requestCount, windowStart.toISOString(), new Date().toISOString()]
      );
    }

    // Add rate limit headers to response context
    request.rateLimitHeaders = {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - requestCount).toString(),
      'X-RateLimit-Reset': Math.ceil((windowStart.getTime() + windowMs) / 1000).toString()
    };

    return null; // No rate limit violation
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow request to proceed
    return null;
  }
}

export async function strictRateLimit(request, env) {
  return await rateLimit(request, env, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  });
}

export async function authRateLimit(request, env) {
  return await rateLimit(request, env, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 auth attempts per 15 minutes
    keyGenerator: (req) => {
      // Rate limit by IP + endpoint for auth routes
      const ip = getClientIP(req);
      const endpoint = new URL(req.url).pathname;
      return `${ip}:${endpoint}`;
    }
  });
}

export async function cleanupOldRateLimits(env) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 2); // Keep only last 2 hours

  await DatabaseUtils.executeUpdate(
    env.DB,
    'DELETE FROM rate_limits WHERE window_start < ?',
    [cutoff.toISOString()]
  );
}

function getClientIP(request) {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown';
}

export function addRateLimitHeaders(response, request) {
  if (request.rateLimitHeaders) {
    Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}