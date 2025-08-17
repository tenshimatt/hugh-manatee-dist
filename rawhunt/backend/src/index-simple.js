import { Router } from 'itty-router';

/**
 * Simplified Rawgle Backend API for Testing
 */

const router = Router();

// Root endpoint
router.get('/', async (request, env) => {
  return new Response(JSON.stringify({
    name: 'Rawgle Platform API',
    version: env.API_VERSION || 'v1',
    status: 'online',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    message: 'Welcome to the Rawgle Platform API! 🐾'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Simple health check
router.get('/health', async (request, env) => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION || 'v1',
    environment: env.ENVIRONMENT || 'development'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Database health check
router.get('/health/database', async (request, env) => {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({
        status: 'no_database',
        message: 'Database binding not configured'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare('SELECT 1 as test').first();
    
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      test_result: result.test
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

// API info
router.get('/api', async (request, env) => {
  return new Response(JSON.stringify({
    name: 'Rawgle Platform API',
    version: env.API_VERSION || 'v1',
    description: 'Backend API for the Rawgle pet services platform',
    endpoints: {
      root: '/',
      health: '/health',
      database_health: '/health/database',
      api_info: '/api'
    },
    status: 'operational'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// CORS headers
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// 404 handler
router.all('*', () => {
  const response = new Response(JSON.stringify({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    available_endpoints: ['/', '/health', '/health/database', '/api']
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
  return addCorsHeaders(response);
});

/**
 * Main request handler
 */
async function handleRequest(request, env, ctx) {
  try {
    console.log(`${request.method} ${request.url}`);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const response = new Response(null, { status: 200 });
      return addCorsHeaders(response);
    }
    
    const response = await router.handle(request, env, ctx);
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return addCorsHeaders(errorResponse);
  }
}

// Cloudflare Workers entry point
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  }
};