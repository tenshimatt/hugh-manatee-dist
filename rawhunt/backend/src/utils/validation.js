import { z } from 'zod';

/**
 * Validation schemas and utilities using Zod
 */

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional()
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  locationLatitude: z.number().min(-90).max(90).optional(),
  locationLongitude: z.number().min(-180).max(180).optional(),
  locationAddress: z.string().max(500).optional()
});

// Supplier validation schemas
export const supplierCreateSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, 'Category is required'),
  specialties: z.array(z.string()).optional(),
  locationLatitude: z.number().min(-90).max(90),
  locationLongitude: z.number().min(-180).max(180),
  locationAddress: z.string().min(1, 'Address is required').max(500),
  contactPhone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  contactEmail: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
  priceRange: z.enum(['low', 'medium', 'high']).optional(),
  businessHours: z.object({}).optional(),
  images: z.array(z.string().url()).optional()
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export const supplierSearchSchema = z.object({
  category: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0.1).max(100).default(10), // km
  priceRange: z.enum(['low', 'medium', 'high']).nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  search: z.string().max(100).nullable().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20)
});

// Review validation schemas
export const reviewCreateSchema = z.object({
  supplierId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  images: z.array(z.string().url()).optional()
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  images: z.array(z.string().url()).optional()
});

// Order validation schemas
export const orderCreateSchema = z.object({
  supplierId: z.number().int().positive(),
  amount: z.number().positive(),
  serviceType: z.string().min(1, 'Service type is required'),
  serviceDescription: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
});

export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  serviceDescription: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
});

// PAWS transaction schemas
export const pawsTransferSchema = z.object({
  toUserId: z.number().int().positive(),
  amount: z.number().int().positive().max(10000), // Max 10,000 PAWS per transfer
  description: z.string().min(1).max(200)
});

export const pawsEarnSchema = z.object({
  type: z.enum(['order_completion', 'review_submission', 'referral', 'bonus']),
  amount: z.number().int().positive(),
  referenceId: z.number().int().optional(),
  description: z.string().max(200)
});

// Notification schemas
export const notificationCreateSchema = z.object({
  userId: z.number().int().positive(),
  type: z.enum(['order', 'review', 'paws', 'system', 'promotion']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  data: z.object({}).optional()
});

// Location validation
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional()
});

/**
 * Validation utilities
 */
export class ValidationUtils {
  static validateRequest(schema, data) {
    try {
      return schema.parse(data);
    } catch (error) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new Error(JSON.stringify(formattedErrors));
    }
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Comprehensive XSS prevention
    return input
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove data: protocols (except safe image types)
      .replace(/data:(?!image\/(png|jpe?g|gif|webp|svg\+xml))[^;]*;/gi, '')
      // Remove event handlers
      .replace(/\bon\w+\s*=/gi, '')
      // Remove potential SQL injection patterns (more targeted)
      .replace(/(\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE)\s+\w+)/gi, '')
      .replace(/(--|\/\*|\*\/|;)/g, '')
      // Remove potential NoSQL injection patterns
      .replace(/(\$where|\$regex|\$gt|\$lt|\$ne|\$in|\$nin)/gi, '')
      .trim();
  }

  static sanitizeJson(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeInput(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeJson(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both keys and values
      const cleanKey = this.sanitizeInput(key);
      sanitized[cleanKey] = this.sanitizeJson(value);
    }
    return sanitized;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateCoordinates(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
}