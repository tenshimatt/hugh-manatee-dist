import { Request, Response, NextFunction } from 'express';
import { logger, auditLogger } from '../config/logger';
import { config } from '../config/env';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Custom error classes
export class ValidationError extends Error implements APIError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements APIError {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements APIError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements APIError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements APIError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error implements APIError {
  statusCode = 429;
  code = 'RATE_LIMITED';

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends Error implements APIError {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp: string;
  };
}

// Global error handler middleware
export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle known error types
  if (error.statusCode) {
    statusCode = error.statusCode;
  }

  if (error.code) {
    code = error.code;
  }

  if (error.message) {
    message = error.message;
  }

  if (error.details) {
    details = error.details;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError' || error.name === 'TypeError') {
    statusCode = 400;
    code = 'INVALID_INPUT';
    message = 'Invalid input data';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  } else if (error.message?.includes('duplicate key')) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else if (error.message?.includes('foreign key')) {
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'Invalid resource reference';
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(req.id && { requestId: req.id }),
      timestamp: new Date().toISOString(),
    },
  };

  // Log error with appropriate level
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code,
      statusCode,
    },
    request: {
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    user: (req as any).user?.id || 'anonymous',
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error', logData);
  }

  // Audit security-related errors
  if (statusCode === 401 || statusCode === 403) {
    auditLogger.security(code, {
      request: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, (req as any).user?.id);
  }

  // Don't expose internal errors in production
  if (config.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.error.message = 'Internal server error';
    delete errorResponse.error.details;
  }

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper utility
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error factory functions
export const createError = {
  validation: (message: string, details?: any) => new ValidationError(message, details),
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
  notFound: (message?: string) => new NotFoundError(message),
  conflict: (message?: string) => new ConflictError(message),
  rateLimit: (message?: string) => new RateLimitError(message),
  internal: (message?: string) => new InternalServerError(message),
};