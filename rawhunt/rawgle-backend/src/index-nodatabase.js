import { Router } from 'itty-router';
import { setCorsHeaders, handleCorsPrelight } from './middleware/cors.js';

/**
 * Rawgle Platform Backend API - Standalone Version (No Database)
 * For testing deployment without D1 database
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
    message: 'Rawgle API is running successfully!',
    deployment: 'production'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// API info endpoint
router.get('/api', async (request, env) => {
  return new Response(JSON.stringify({
    name: 'Rawgle Platform API',
    version: env.API_VERSION || 'v1',
    description: 'Backend API for the Rawgle pet services platform',
    status: 'deployed',
    deployment: {
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'production',
      features: [
        'Authentication endpoints',
        'Suppliers search and management',
        'PAWS cryptocurrency system',
        'Reviews and ratings',
        'Order management',
        'Notifications'
      ]
    },
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
      ]
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Authentication endpoints (mock implementation for frontend testing)
router.post('/api/auth/login', async (request, env) => {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock successful login (in real app, validate against database)
    const mockUser = {
      id: 1,
      email: email,
      name: email.split('@')[0],
      pawsBalance: 1250,
      createdAt: '2024-01-01T00:00:00Z'
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    return new Response(JSON.stringify({
      success: true,
      token: mockToken,
      user: mockUser,
      message: 'Login successful'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid request body'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/auth/register', async (request, env) => {
  try {
    const { email, password, name, phone } = await request.json();

    // Basic validation
    if (!email || !password || !name) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email, password, and name are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock successful registration
    const mockUser = {
      id: Math.floor(Math.random() * 1000),
      email: email,
      name: name,
      phone: phone || null,
      pawsBalance: 500, // Welcome bonus
      createdAt: new Date().toISOString()
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    return new Response(JSON.stringify({
      success: true,
      token: mockToken,
      user: mockUser,
      message: 'Registration successful! Welcome to Rawgle!'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid request body'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.post('/api/auth/logout', async (request, env) => {
  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out successfully'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/auth/me', async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mock user profile
  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    pawsBalance: 1250,
    createdAt: '2024-01-01T00:00:00Z'
  };

  return new Response(JSON.stringify({
    success: true,
    user: mockUser
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Demo endpoints for testing
router.get('/api/suppliers', async (request, env) => {
  const url = new URL(request.url);
  const latitude = parseFloat(url.searchParams.get('latitude') || '40.7128');
  const longitude = parseFloat(url.searchParams.get('longitude') || '-74.0060');
  const category = url.searchParams.get('category');
  const radius = parseFloat(url.searchParams.get('radius') || '10');

  // Mock supplier data
  const mockSuppliers = [
    {
      id: 1,
      name: 'Pet Grooming Plus',
      category: 'Pet Grooming',
      location_latitude: 40.7128,
      location_longitude: -74.0060,
      location_address: '123 Main St, New York, NY 10001',
      rating_average: 4.5,
      rating_count: 127,
      distance: 0.5,
      price_range: 'medium',
      description: 'Professional pet grooming services with experienced groomers',
      contact_phone: '+1-555-0123',
      website_url: 'https://petgroomingplus.com',
      is_verified: true
    },
    {
      id: 2,
      name: 'Downtown Veterinary Clinic',
      category: 'Veterinary',
      location_latitude: 40.7589,
      location_longitude: -73.9851,
      location_address: '456 Park Ave, New York, NY 10016',
      rating_average: 4.8,
      rating_count: 203,
      distance: 2.3,
      price_range: 'high',
      description: '24/7 emergency veterinary care and routine checkups',
      contact_phone: '+1-555-0456',
      website_url: 'https://downtownvet.com',
      is_verified: true
    },
    {
      id: 3,
      name: 'Happy Tails Pet Training',
      category: 'Pet Training',
      location_latitude: 40.6892,
      location_longitude: -74.0445,
      location_address: '789 Broadway, Brooklyn, NY 11201',
      rating_average: 4.2,
      rating_count: 89,
      distance: 3.1,
      price_range: 'low',
      description: 'Positive reinforcement training for dogs and cats',
      contact_phone: '+1-555-0789',
      website_url: 'https://happytailstraining.com',
      is_verified: false
    }
  ];

  let filteredSuppliers = mockSuppliers;

  if (category) {
    filteredSuppliers = filteredSuppliers.filter(s => 
      s.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Sort by distance
  filteredSuppliers.sort((a, b) => a.distance - b.distance);

  return new Response(JSON.stringify({
    success: true,
    data: {
      suppliers: filteredSuppliers,
      searchParams: {
        latitude,
        longitude,
        category,
        radius
      },
      pagination: {
        page: 1,
        limit: 20,
        total: filteredSuppliers.length,
        totalPages: 1
      }
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/suppliers/categories', async (request, env) => {
  const categories = [
    { id: 1, name: 'Pet Grooming', description: 'Professional pet grooming services', icon: 'scissors' },
    { id: 2, name: 'Veterinary', description: 'Veterinary clinics and animal hospitals', icon: 'medical' },
    { id: 3, name: 'Pet Training', description: 'Pet training and behavior modification', icon: 'graduation-cap' },
    { id: 4, name: 'Pet Sitting', description: 'Pet sitting and boarding services', icon: 'home' },
    { id: 5, name: 'Pet Walking', description: 'Dog walking and exercise services', icon: 'walk' },
    { id: 6, name: 'Pet Food', description: 'Pet food stores and suppliers', icon: 'shopping-cart' },
    { id: 7, name: 'Pet Supplies', description: 'Pet accessories and supplies', icon: 'gift' },
    { id: 8, name: 'Emergency Care', description: '24/7 emergency veterinary services', icon: 'ambulance' }
  ];

  return new Response(JSON.stringify({
    success: true,
    data: { categories }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/paws/balance', async (request, env) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({
      error: 'userId parameter is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mock response
  return new Response(JSON.stringify({
    userId,
    balance: 2500,
    exchangeRate: '1000',
    usdValue: 2.50,
    lastUpdated: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Handle CORS preflight requests
router.options('*', handleCorsPrelight);

// Test endpoint that requires database (will return mock data)
router.get('/api/test/database', async (request, env) => {
  return new Response(JSON.stringify({
    message: 'Database connection test',
    status: 'mocked',
    note: 'This is a mock response for demonstration. Full database functionality requires D1 setup.',
    mockData: {
      users: 150,
      suppliers: 45,
      orders: 289,
      reviews: 672
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// CORS preflight handler
router.options('*', (request) => {
  return handleCorsPrelight(request);
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'GET /api/suppliers',
      'GET /api/suppliers/categories',
      'GET /api/paws/balance',
      'GET /api/test/database'
    ]
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
    
    // Log request
    console.log(`[${request.id}] ${request.method} ${request.url}`);
    
    // Handle the request
    const response = await router.handle(request, env, ctx);
    
    // Add CORS headers
    const corsResponse = setCorsHeaders(response, request);
    
    // Add security headers
    corsResponse.headers.set('X-Request-ID', request.id);
    corsResponse.headers.set('X-Powered-By', 'Rawgle-API');
    corsResponse.headers.set('X-Deployment', 'production');
    
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

// Cloudflare Workers entry point
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  }
};