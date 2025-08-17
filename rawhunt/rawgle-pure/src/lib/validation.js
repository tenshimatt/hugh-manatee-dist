// Request validation utilities

export async function validateRequest(request, env) {
  const url = new URL(request.url);
  const contentType = request.headers.get('content-type');
  
  // Check content length
  const contentLength = request.headers.get('content-length');
  const maxSize = parseInt(env.MAX_PAYLOAD_SIZE) || 10485760; // 10MB default
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return { valid: false, error: 'Payload too large' };
  }
  
  // Validate JSON content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (!contentType || !contentType.includes('application/json')) {
      return { valid: false, error: 'Invalid content type' };
    }
  }
  
  // Basic path validation
  if (url.pathname.includes('..') || url.pathname.includes('//')) {
    return { valid: false, error: 'Invalid path' };
  }
  
  return { valid: true };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function validateSolanaAddress(address) {
  // Basic Solana address validation (Base58, 32-44 characters)
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}