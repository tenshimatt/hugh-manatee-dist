/**
 * CORS middleware for Cloudflare Workers
 */

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://rawgle.app',
    'https://www.rawgle.app',
    'https://app.rawgle.com',
    'https://rawgle-frontend.pages.dev',
    'https://2c4665bc.rawgle-frontend.pages.dev',
    'https://2630fcbc.rawgle-frontend.pages.dev',
    'https://77867e79.rawgle-frontend.pages.dev',
    'https://ecb2d4e5.rawgle-frontend.pages.dev',
    'https://rawhunt-frontend.pages.dev',
    'https://ad5dabdb.rawhunt-frontend.pages.dev'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export function setCorsHeaders(response, request) {
  const origin = request.headers.get('Origin');
  
  // Check if origin is allowed
  if (origin && corsOptions.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (corsOptions.origin.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  
  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export function handleCorsPrelight(request) {
  const origin = request.headers.get('Origin');
  const method = request.headers.get('Access-Control-Request-Method');
  const headers = request.headers.get('Access-Control-Request-Headers');

  // Check if origin is allowed
  if (!origin || !corsOptions.origin.includes(origin)) {
    return new Response('CORS not allowed', { status: 403 });
  }

  // Check if method is allowed
  if (!method || !corsOptions.methods.includes(method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  // Create preflight response
  const response = new Response(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
  
  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export function createCorsResponse(data, status = 200, headers = {}) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

  return response;
}