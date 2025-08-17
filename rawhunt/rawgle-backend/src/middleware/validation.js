/**
 * Request Validation Middleware for Rawgle
 * Handles input validation using Zod schemas
 */

import { z } from 'zod';

/**
 * Validate request data against a Zod schema
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} source - Where to get data from
 * @returns {Function} Middleware function
 */
export const validateRequest = (schema, source = 'body') => {
  return async (c, next) => {
    try {
      let data;
      
      switch (source) {
        case 'query':
          data = c.req.query();
          break;
        case 'params':
          data = c.req.param();
          break;
        case 'body':
        default:
          try {
            data = await c.req.json();
          } catch (jsonError) {
            return c.json({
              success: false,
              error: 'INVALID_JSON',
              message: 'Invalid JSON in request body'
            }, 400);
          }
          break;
      }
      
      // Validate data against schema
      const validationResult = schema.safeParse(data);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return c.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        }, 400);
      }
      
      // Set validated data for use in route handlers
      c.set('validatedData', validationResult.data);
      
      await next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return c.json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Request validation failed due to internal error'
      }, 500);
    }
  };
};

/**
 * Validate file uploads
 * @param {Object} options - Upload validation options
 * @returns {Function} Middleware function
 */
export const validateFileUpload = (options = {}) => {
  const {
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;
  
  return async (c, next) => {
    try {
      const formData = await c.req.formData();
      const files = formData.getAll('files') || formData.getAll('file') || formData.getAll('photos');
      
      if (required && (!files || files.length === 0)) {
        return c.json({
          success: false,
          error: 'FILES_REQUIRED',
          message: 'At least one file is required'
        }, 400);
      }
      
      if (files && files.length > 0) {
        if (files.length > maxFiles) {
          return c.json({
            success: false,
            error: 'TOO_MANY_FILES',
            message: `Maximum ${maxFiles} files allowed`
          }, 400);
        }
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Check file size
          if (file.size > maxSize) {
            return c.json({
              success: false,
              error: 'FILE_TOO_LARGE',
              message: `File ${i + 1} exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
            }, 400);
          }
          
          // Check file type
          if (!allowedTypes.includes(file.type)) {
            return c.json({
              success: false,
              error: 'INVALID_FILE_TYPE',
              message: `File ${i + 1} has invalid type. Allowed: ${allowedTypes.join(', ')}`
            }, 400);
          }
        }
        
        c.set('validatedFiles', files);
      }
      
      await next();
    } catch (error) {
      console.error('File validation error:', error);
      return c.json({
        success: false,
        error: 'FILE_VALIDATION_FAILED',
        message: 'File validation failed'
      }, 500);
    }
  };
};

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination parameters
  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.string().default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Date range parameters
  dateRange: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional()
  }).refine((data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  }, {
    message: "start_date must be before or equal to end_date",
    path: ["start_date"]
  }),
  
  // Email validation
  email: z.string().email('Invalid email format').toLowerCase(),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Phone number validation (basic)
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Coordinates validation
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  
  // Rating validation (1-5 stars)
  rating: z.number().int().min(1).max(5),
  
  // Weight validation (in pounds)
  weightLbs: z.number().positive().max(300),
  
  // Weight validation (in kilograms)
  weightKg: z.number().positive().max(136),
  
  // Pet age validation
  petAge: z.object({
    years: z.number().int().min(0).max(30),
    months: z.number().int().min(0).max(11)
  }),
  
  // Nutrition values
  nutrition: z.object({
    protein_grams: z.number().positive().optional(),
    fat_grams: z.number().positive().optional(),
    carb_grams: z.number().positive().optional(),
    calories: z.number().int().positive().optional(),
    calcium_mg: z.number().positive().optional(),
    phosphorus_mg: z.number().positive().optional()
  }),
  
  // Tags validation
  tags: z.array(z.string().min(1).max(50)).max(10),
  
  // JSON metadata validation
  metadata: z.record(z.any()).optional(),
  
  // File upload validation
  photo: z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number().positive(),
    type: z.string(),
    uploaded_at: z.string().datetime()
  })
};

/**
 * Sanitize input data
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    // Remove potential XSS attempts
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Rate limiting validation
 * @param {string} key - Rate limit key
 * @param {number} limit - Request limit
 * @param {number} window - Time window in seconds
 * @returns {Function} Middleware function
 */
export const validateRateLimit = (key, limit, window) => {
  return async (c, next) => {
    try {
      const user = c.get('user');
      const ip = c.req.header('cf-connecting-ip') || 'unknown';
      const rateLimitKey = `rate_limit:${key}:${user?.id || ip}`;
      
      const current = await c.env.KV.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;
      
      if (count >= limit) {
        return c.json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Maximum ${limit} requests per ${window} seconds`,
          retry_after: window
        }, 429);
      }
      
      // Increment counter
      await c.env.KV.put(rateLimitKey, (count + 1).toString(), {
        expirationTtl: window
      });
      
      await next();
    } catch (error) {
      console.error('Rate limit validation error:', error);
      // Continue on error to avoid blocking legitimate requests
      await next();
    }
  };
};