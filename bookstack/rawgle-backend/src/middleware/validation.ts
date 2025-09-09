import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { z, ZodError } from 'zod';
import { createError } from './errorHandler';

// Express-validator error handler
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    throw createError.validation('Validation failed', { errors: formattedErrors });
  }
  
  next();
};

// Zod validation middleware factory
export const validateSchema = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate request params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'received' in err ? err.received : undefined,
        }));

        throw createError.validation('Validation failed', { errors: formattedErrors });
      }
      throw error;
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID parameter validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination query validation
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Email validation
  email: z.string().email('Invalid email format').toLowerCase(),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  // Pet type validation
  petType: z.enum(['dog', 'cat'], {
    errorMap: () => ({ message: 'Pet type must be either dog or cat' }),
  }),

  // Activity level validation
  activityLevel: z.enum(['low', 'moderate', 'high', 'very-high'], {
    errorMap: () => ({ message: 'Activity level must be low, moderate, high, or very-high' }),
  }),

  // Weight unit validation
  weightUnit: z.enum(['lbs', 'kg'], {
    errorMap: () => ({ message: 'Weight unit must be lbs or kg' }),
  }),
};

// Express-validator rules
export const validationRules = {
  // Email validation
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: () => body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Name validation
  name: (field: string = 'name') => body(field)
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(`${field} must be between 1 and 100 characters`),

  // UUID parameter validation
  uuidParam: (paramName: string) => param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),

  // Numeric validation
  numeric: (field: string, options?: { min?: number; max?: number }) => body(field)
    .isNumeric()
    .withMessage(`${field} must be a number`)
    .custom((value) => {
      if (options?.min && value < options.min) {
        throw new Error(`${field} must be at least ${options.min}`);
      }
      if (options?.max && value > options.max) {
        throw new Error(`${field} must be at most ${options.max}`);
      }
      return true;
    }),

  // Optional field validation
  optional: (rule: any) => rule.optional({ nullable: true, checkFalsy: true }),

  // File upload validation
  fileUpload: (field: string, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }) => (req: Request, res: Response, next: NextFunction) => {
    const file = req.file || (req.files && typeof req.files === 'object' && field in req.files ? (req.files as any)[field] : undefined);
    
    if (!file) {
      return next();
    }

    const fileToCheck = Array.isArray(file) ? file[0] : file;

    // Check file size
    if (options?.maxSize && fileToCheck.size > options.maxSize) {
      throw createError.validation(`File size must be less than ${options.maxSize} bytes`);
    }

    // Check file type
    if (options?.allowedTypes && !options.allowedTypes.includes(fileToCheck.mimetype)) {
      throw createError.validation(`File type must be one of: ${options.allowedTypes.join(', ')}`);
    }

    next();
  },
};

// Sanitization helpers
export const sanitize = {
  // Remove HTML tags and trim whitespace
  text: (value: string): string => {
    return value.replace(/<[^>]*>/g, '').trim();
  },

  // Sanitize email
  email: (value: string): string => {
    return value.toLowerCase().trim();
  },

  // Sanitize search query
  search: (value: string): string => {
    return value.replace(/[<>]/g, '').trim();
  },
};