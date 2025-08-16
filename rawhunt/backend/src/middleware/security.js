/**
 * Security middleware for enhanced protection
 */

export function addSecurityHeaders(response) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.openai.com; " +
    "frame-ancestors 'none';"
  );
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  
  return response;
}

export function validateRequestOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    env.FRONTEND_URL,
    'https://rawgle.com',
    'https://www.rawgle.com',
    'http://localhost:3000', // Development
    'http://127.0.0.1:3000'  // Development
  ].filter(Boolean);
  
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({
      error: 'Origin not allowed',
      code: 'FORBIDDEN_ORIGIN'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return null;
}

export function validateContentType(request) {
  const contentType = request.headers.get('Content-Type');
  const method = request.method;
  
  // For POST/PUT/PATCH requests, ensure Content-Type is application/json
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'Invalid Content-Type header',
        code: 'INVALID_CONTENT_TYPE',
        expected: 'application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return null;
}

export async function validateRequestSize(request, maxSizeBytes = 1024 * 1024) { // 1MB default
  const contentLength = request.headers.get('Content-Length');
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return new Response(JSON.stringify({
      error: 'Request too large',
      code: 'REQUEST_TOO_LARGE',
      maxSize: maxSizeBytes
    }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return null;
}

export function detectSuspiciousActivity(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const url = request.url;
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
    /burpsuite/i,
    /\.\.\/\.\.\//,  // Path traversal
    /<script/i,      // XSS attempts
    /union\s+select/i, // SQL injection
    /base64_decode/i,
    /eval\(/i,
    /system\(/i,
    /exec\(/i,
    /passthru\(/i
  ];
  
  const containsSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) || pattern.test(url)
  );
  
  if (containsSuspiciousPattern) {
    console.warn('Suspicious activity detected:', {
      userAgent,
      url,
      ip: request.headers.get('CF-Connecting-IP'),
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({
      error: 'Request blocked',
      code: 'SECURITY_VIOLATION'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return null;
}

export async function applySecurityMiddleware(request, env) {
  // Check for suspicious activity
  const suspiciousResponse = detectSuspiciousActivity(request);
  if (suspiciousResponse) return suspiciousResponse;
  
  // Validate origin
  const originResponse = validateRequestOrigin(request, env);
  if (originResponse) return originResponse;
  
  // Validate content type
  const contentTypeResponse = validateContentType(request);
  if (contentTypeResponse) return contentTypeResponse;
  
  // Validate request size
  const sizeResponse = await validateRequestSize(request);
  if (sizeResponse) return sizeResponse;
  
  return null; // All checks passed
}