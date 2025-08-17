/**
 * Global Error Handler for Rawgle
 * Handles and formats all application errors consistently
 */

/**
 * Global error handler middleware
 * @param {Error} error - The error object
 * @param {Context} c - Hono context
 * @returns {Response} Error response
 */
export const errorHandler = (error, c) => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString(),
    user: c.get('user')?.id || 'anonymous'
  });

  // Database errors
  if (error.message.includes('D1_ERROR') || error.message.includes('SQLite')) {
    return c.json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Database operation failed',
      timestamp: new Date().toISOString()
    }, 500);
  }

  // KV storage errors
  if (error.message.includes('KV_ERROR')) {
    return c.json({
      success: false,
      error: 'STORAGE_ERROR',
      message: 'Storage operation failed',
      timestamp: new Date().toISOString()
    }, 500);
  }

  // R2 storage errors
  if (error.message.includes('R2_ERROR')) {
    return c.json({
      success: false,
      error: 'FILE_STORAGE_ERROR',
      message: 'File storage operation failed',
      timestamp: new Date().toISOString()
    }, 500);
  }

  // Validation errors (should be caught by validation middleware)
  if (error.name === 'ZodError') {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return c.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: validationErrors,
      timestamp: new Date().toISOString()
    }, 400);
  }

  // JWT errors (should be caught by auth middleware)
  if (error.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
      timestamp: new Date().toISOString()
    }, 401);
  }

  if (error.name === 'TokenExpiredError') {
    return c.json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      timestamp: new Date().toISOString()
    }, 401);
  }

  // Network timeout errors
  if (error.message.includes('timeout') || error.name === 'TimeoutError') {
    return c.json({
      success: false,
      error: 'REQUEST_TIMEOUT',
      message: 'Request timed out. Please try again.',
      timestamp: new Date().toISOString()
    }, 408);
  }

  // Rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return c.json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString()
    }, 429);
  }

  // File upload errors
  if (error.message.includes('file') && (error.message.includes('too large') || error.message.includes('invalid'))) {
    return c.json({
      success: false,
      error: 'FILE_UPLOAD_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 400);
  }

  // Business logic errors (custom application errors)
  if (error.code) {
    const statusCode = getStatusCodeFromErrorCode(error.code);
    return c.json({
      success: false,
      error: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    }, statusCode);
  }

  // Network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return c.json({
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Network operation failed. Please check your connection.',
      timestamp: new Date().toISOString()
    }, 503);
  }

  // Memory/resource errors
  if (error.message.includes('memory') || error.message.includes('resource')) {
    return c.json({
      success: false,
      error: 'RESOURCE_ERROR',
      message: 'Insufficient resources to complete request',
      timestamp: new Date().toISOString()
    }, 503);
  }

  // Generic server errors
  return c.json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: c.env.ENVIRONMENT === 'development' 
      ? error.message 
      : 'An unexpected error occurred. Please try again.',
    ...(c.env.ENVIRONMENT === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString()
  }, 500);
};

/**
 * Map error codes to HTTP status codes
 * @param {string} errorCode - Application error code
 * @returns {number} HTTP status code
 */
function getStatusCodeFromErrorCode(errorCode) {
  const statusMap = {
    // Authentication errors (401)
    'AUTHENTICATION_REQUIRED': 401,
    'INVALID_CREDENTIALS': 401,
    'TOKEN_EXPIRED': 401,
    'TOKEN_INVALID': 401,
    'EMAIL_NOT_VERIFIED': 401,

    // Authorization errors (403)
    'ACCESS_DENIED': 403,
    'INSUFFICIENT_PERMISSIONS': 403,
    'PREMIUM_REQUIRED': 403,
    'EMAIL_VERIFICATION_REQUIRED': 403,

    // Not found errors (404)
    'USER_NOT_FOUND': 404,
    'PET_NOT_FOUND': 404,
    'FEEDING_LOG_NOT_FOUND': 404,
    'RESOURCE_NOT_FOUND': 404,

    // Conflict errors (409)
    'EMAIL_EXISTS': 409,
    'DUPLICATE_ENTRY': 409,
    'RESOURCE_CONFLICT': 409,

    // Validation errors (400)
    'INVALID_INPUT': 400,
    'MISSING_REQUIRED_FIELD': 400,
    'INVALID_FORMAT': 400,
    'VALIDATION_FAILED': 400,

    // Business logic errors (422)
    'INSUFFICIENT_BALANCE': 422,
    'OPERATION_NOT_ALLOWED': 422,
    'QUOTA_EXCEEDED': 422,

    // Rate limiting (429)
    'RATE_LIMIT_EXCEEDED': 429,
    'TOO_MANY_REQUESTS': 429,

    // Server errors (500)
    'DATABASE_ERROR': 500,
    'EXTERNAL_SERVICE_ERROR': 502,
    'SERVICE_UNAVAILABLE': 503
  };

  return statusMap[errorCode] || 500;
}

/**
 * Create a custom application error
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error} Custom error object
 */
export class AppError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Async error wrapper for route handlers
 * @param {Function} handler - Route handler function
 * @returns {Function} Wrapped handler
 */
export const asyncHandler = (handler) => {
  return async (c, next) => {
    try {
      return await handler(c, next);
    } catch (error) {
      return errorHandler(error, c);
    }
  };
};

/**
 * Log error to external service (implement as needed)
 * @param {Error} error - Error object
 * @param {Context} c - Hono context
 */
export const logError = async (error, c) => {
  try {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN',
      url: c.req.url,
      method: c.req.method,
      userAgent: c.req.header('user-agent'),
      userId: c.get('user')?.id,
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT
    };

    // Log to KV storage for debugging (with expiration)
    await c.env.KV.put(
      `error_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      JSON.stringify(errorLog),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // TODO: Integrate with external logging service (Sentry, LogRocket, etc.)
    // if (c.env.SENTRY_DSN) {
    //   await sendToSentry(errorLog);
    // }

  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
};

/**
 * Health check for error handling system
 * @param {Context} c - Hono context
 * @returns {Object} Health status
 */
export const getErrorHandlerHealth = async (c) => {
  try {
    // Test KV storage
    const testKey = `health_check:${Date.now()}`;
    await c.env.KV.put(testKey, 'test', { expirationTtl: 60 });
    await c.env.KV.delete(testKey);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        error_logging: 'operational',
        kv_storage: 'operational'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      components: {
        error_logging: 'degraded',
        kv_storage: error.message.includes('KV') ? 'down' : 'operational'
      }
    };
  }
};