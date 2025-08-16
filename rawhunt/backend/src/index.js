import { Router } from 'itty-router';
import { setCorsHeaders, handleCorsPrelight } from './middleware/cors.js';
import { addRateLimitHeaders, cleanupOldRateLimits } from './middleware/rateLimit.js';
import { cleanupExpiredSessions } from './middleware/auth.js';
import { applySecurityMiddleware, addSecurityHeaders } from './middleware/security.js';
import { trackRequestPerformance, addPerformanceHeaders, performanceMonitor } from './middleware/performance.js';

// Import route handlers
import { authRouter } from './routes/auth.js';
import { suppliersRouter } from './routes/suppliers.js';
import { pawsRouter } from './routes/paws.js';
import { reviewsRouter } from './routes/reviews.js';
import { ordersRouter } from './routes/orders.js';
import { notificationsRouter } from './routes/notifications.js';
import { aiMedicalRouter } from './routes/ai-medical.js';

/**
 * Rawgle Platform Backend API
 * Built on Cloudflare Workers with D1 Database
 */

// Create main router
const router = Router();

// Basic health check endpoint
router.get('/health', async (request, env) => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION || 'v1',
    environment: env.ENVIRONMENT || 'development',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Comprehensive health check
router.get('/health/detailed', async (request, env) => {
  const healthChecks = {
    database: { status: 'unknown', responseTime: 0 },
    cache: { status: 'unknown', responseTime: 0 },
    external: { status: 'unknown', responseTime: 0 }
  };

  try {
    // Test database connection
    const dbStart = Date.now();
    await env.DB.prepare('SELECT 1').first();
    healthChecks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    healthChecks.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message
    };
  }

  // Test cache if available (KV storage is optional)
  try {
    if (env.CACHE) {
      const cacheStart = Date.now();
      await env.CACHE.get('health_check');
      healthChecks.cache = {
        status: 'healthy',
        responseTime: Date.now() - cacheStart
      };
    } else {
      healthChecks.cache = { status: 'not_configured', responseTime: 0 };
    }
  } catch (error) {
    // KV not available or misconfigured - this is non-critical
    healthChecks.cache = {
      status: 'not_available',
      responseTime: 0,
      message: 'KV storage not available (optional feature)'
    };
  }

  // Overall health status
  const overallHealthy = Object.values(healthChecks).every(
    check => check.status === 'healthy' || check.status === 'not_configured' || check.status === 'not_available'
  );

  const responseStatus = overallHealthy ? 200 : 503;

  return new Response(JSON.stringify({
    status: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION || 'v1',
    environment: env.ENVIRONMENT || 'development',
    checks: healthChecks,
    uptime: process.uptime ? Math.floor(process.uptime()) : 0
  }), {
    status: responseStatus,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Database specific health check
router.get('/health/database', async (request, env) => {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await env.DB.prepare('SELECT 1 as test').first();
    
    // Test write capability
    await env.DB.prepare(
      'INSERT OR REPLACE INTO rate_limits (ip_address, endpoint, request_count, window_start) VALUES (?, ?, ?, ?)'
    ).bind('health_check', '/health', 1, new Date().toISOString()).run();
    
    // Get basic stats
    const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const supplierCount = await env.DB.prepare('SELECT COUNT(*) as count FROM rawgle_suppliers').first();
    
    const responseTime = Date.now() - start;
    
    return new Response(JSON.stringify({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount.count,
        suppliers: supplierCount.count
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Metrics endpoint
router.get('/metrics', async (request, env) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        users: await env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
        suppliers: await env.DB.prepare('SELECT COUNT(*) as count FROM rawgle_suppliers WHERE is_active = 1').first(),
        orders: await env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE created_at > date(\'now\', \'-7 days\')').first(),
        reviews: await env.DB.prepare('SELECT COUNT(*) as count FROM reviews WHERE created_at > date(\'now\', \'-7 days\')').first(),
        aiConsultations: await env.DB.prepare('SELECT COUNT(*) as count FROM ai_consultations WHERE created_at > date(\'now\', \'-7 days\')').first()
      },
      performance: performanceMonitor.getMetrics(),
      system: {
        environment: env.ENVIRONMENT || 'development',
        version: env.API_VERSION || 'v1',
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
      }
    };
    
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to retrieve metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// API info endpoint
router.get('/api', async (request, env) => {
  return new Response(JSON.stringify({
    name: 'Rawgle Platform API',
    version: env.API_VERSION || 'v1',
    description: 'Backend API for the Rawgle pet services platform',
    documentation: 'https://docs.rawgle.com/api',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'PUT /api/auth/profile',
        'POST /api/auth/change-password'
      ],
      suppliers: [
        'GET /api/suppliers',
        'GET /api/suppliers/:id',
        'POST /api/suppliers (admin)',
        'PUT /api/suppliers/:id (admin)',
        'DELETE /api/suppliers/:id (admin)',
        'GET /api/suppliers/categories',
        'GET /api/suppliers/nearby'
      ],
      paws: [
        'GET /api/paws/balance',
        'GET /api/paws/transactions',
        'POST /api/paws/transfer',
        'POST /api/paws/earn',
        'POST /api/paws/spend',
        'GET /api/paws/leaderboard'
      ],
      reviews: [
        'POST /api/reviews',
        'GET /api/reviews/supplier/:supplierId',
        'GET /api/reviews/user',
        'PUT /api/reviews/:id',
        'DELETE /api/reviews/:id',
        'POST /api/reviews/:id/helpful'
      ],
      orders: [
        'POST /api/orders',
        'GET /api/orders',
        'GET /api/orders/:id',
        'PUT /api/orders/:id',
        'DELETE /api/orders/:id',
        'POST /api/orders/:id/complete',
        'GET /api/orders/stats'
      ],
      notifications: [
        'GET /api/notifications',
        'POST /api/notifications (admin)',
        'PUT /api/notifications/:id/read',
        'PUT /api/notifications/read-all',
        'DELETE /api/notifications/:id',
        'GET /api/notifications/types'
      ],
      'ai-medical': [
        'POST /api/ai-medical/consultation',
        'GET /api/ai-medical/consultations',
        'GET /api/ai-medical/consultation/:id',
        'POST /api/ai-medical/emergency-check'
      ]
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Handle CORS preflight requests
router.options('*', handleCorsPrelight);

// Mount route handlers
router.all('/api/auth/*', authRouter.handle);
router.all('/api/suppliers/*', suppliersRouter.handle);
router.all('/api/paws/*', pawsRouter.handle);
router.all('/api/reviews/*', reviewsRouter.handle);
router.all('/api/orders/*', ordersRouter.handle);
router.all('/api/notifications/*', notificationsRouter.handle);
router.all('/api/ai-medical/*', aiMedicalRouter.handle);

// Admin endpoints
router.get('/api/admin/stats', async (request, env) => {
  try {
    // This would require admin authentication in a real implementation
    const stats = await env.DB.prepare(`
      SELECT 
        'users' as metric, COUNT(*) as value FROM users
      UNION ALL
      SELECT 'rawgle_suppliers' as metric, COUNT(*) as value FROM rawgle_suppliers
      UNION ALL
      SELECT 'orders' as metric, COUNT(*) as value FROM orders
      UNION ALL
      SELECT 'reviews' as metric, COUNT(*) as value FROM reviews
      UNION ALL
      SELECT 'transactions' as metric, COUNT(*) as value FROM transactions
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: stats.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Cleanup endpoint (for maintenance)
router.post('/api/admin/cleanup', async (request, env) => {
  try {
    // Clean up expired sessions
    await cleanupExpiredSessions(env);
    
    // Clean up old rate limit records
    await cleanupOldRateLimits(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Cleanup completed successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

/**
 * Main request handler
 */
async function handleRequest(request, env, ctx) {
  try {
    // Add request ID for tracing
    request.id = crypto.randomUUID();
    
    // Track performance
    trackRequestPerformance(request);
    
    // Log request
    console.log(`[${request.id}] ${request.method} ${request.url}`);
    
    // Apply security middleware
    const securityResponse = await applySecurityMiddleware(request, env);
    if (securityResponse) return securityResponse;
    
    // Handle the request
    const response = await router.handle(request, env, ctx);
    
    // Track performance metrics
    const duration = request.performance.end();
    const url = new URL(request.url);
    performanceMonitor.recordRequest(
      request.method, 
      url.pathname, 
      duration, 
      response.status
    );
    
    // Add CORS headers
    const corsResponse = setCorsHeaders(response, request);
    
    // Add rate limit headers if available
    addRateLimitHeaders(corsResponse, request);
    
    // Add performance headers
    addPerformanceHeaders(corsResponse, request);
    
    // Add security headers
    addSecurityHeaders(corsResponse);
    corsResponse.headers.set('X-Request-ID', request.id);
    corsResponse.headers.set('X-Powered-By', 'Rawgle-API');
    
    return corsResponse;
    
  } catch (error) {
    console.error(`[${request.id}] Error:`, error);
    
    const errorResponse = new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: request.id
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return setCorsHeaders(errorResponse, request);
  }
}

/**
 * Scheduled event handler for periodic cleanup
 */
async function handleScheduled(event, env, ctx) {
  try {
    // Run cleanup tasks
    await cleanupExpiredSessions(env);
    await cleanupOldRateLimits(env);
    
    console.log('Scheduled cleanup completed successfully');
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
  }
}

// Cloudflare Workers entry point
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    return await handleScheduled(event, env, ctx);
  }
};