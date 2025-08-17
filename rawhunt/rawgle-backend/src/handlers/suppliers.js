/**
 * Suppliers Handler for Rawgle
 * Handles raw food suppliers, pet stores, and marketplace functionality
 * Works with existing 9000+ supplier records in the production database
 */

import { Hono } from 'hono';
import { SupplierService } from '../services/supplier-service.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const searchSuppliersSchema = z.object({
  query: z.string().optional(),
  category: z.array(z.string()).optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  radius_miles: z.coerce.number().min(1).max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  verified_only: z.coerce.boolean().default(false),
  accepts_paws: z.coerce.boolean().optional(),
  offers_delivery: z.coerce.boolean().optional(),
  offers_pickup: z.coerce.boolean().optional(),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  price_range: z.enum(['budget', 'moderate', 'premium', 'luxury']).optional(),
  sort: z.enum(['relevance', 'rating', 'distance', 'name', 'newest']).default('relevance'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

const supplierContactSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier ID'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  contact_method: z.enum(['email', 'phone', 'website']).default('email'),
  urgency: z.enum(['low', 'normal', 'high']).default('normal')
});

const reviewSupplierSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier ID'),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review too long'),
  pros: z.string().max(500).optional(),
  cons: z.string().max(500).optional(),
  verified_purchase: z.boolean().default(false),
  order_id: z.string().optional(),
  purchase_date: z.string().date().optional(),
  // Detailed ratings
  quality_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  freshness_rating: z.number().int().min(1).max(5).optional(),
  packaging_rating: z.number().int().min(1).max(5).optional(),
  delivery_rating: z.number().int().min(1).max(5).optional(),
  // Recommendation
  would_recommend: z.boolean(),
  photos: z.array(z.string().url()).max(5).optional()
});

// GET /api/suppliers - Search and browse suppliers
app.get('/', optionalAuthMiddleware, validateRequest(searchSuppliersSchema, 'query'), async (c) => {
  try {
    const user = c.get('user');
    const searchParams = c.get('validatedData');
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const result = await supplierService.searchSuppliers(searchParams, user?.id);
    
    return c.json({
      success: true,
      data: {
        suppliers: result.suppliers,
        total: result.total,
        pagination: {
          limit: searchParams.limit,
          offset: searchParams.offset,
          total: result.total,
          pages: Math.ceil(result.total / searchParams.limit)
        },
        filters: {
          applied: searchParams,
          available: result.availableFilters
        }
      }
    });
  } catch (error) {
    console.error('Search suppliers error:', error);
    return c.json({
      success: false,
      error: 'SEARCH_FAILED',
      message: 'Failed to search suppliers'
    }, 500);
  }
});

// GET /api/suppliers/featured - Get featured suppliers
app.get('/featured', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { limit = 10, category } = query;
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const featuredSuppliers = await supplierService.getFeaturedSuppliers({
      limit: parseInt(limit),
      category,
      userId: user?.id
    });
    
    return c.json({
      success: true,
      data: {
        suppliers: featuredSuppliers,
        total: featuredSuppliers.length
      }
    });
  } catch (error) {
    console.error('Get featured suppliers error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve featured suppliers'
    }, 500);
  }
});

// GET /api/suppliers/categories - Get supplier categories
app.get('/categories', async (c) => {
  try {
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const categories = await supplierService.getCategories();
    
    return c.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve categories'
    }, 500);
  }
});

// GET /api/suppliers/locations - Get supplier locations/regions
app.get('/locations', async (c) => {
  try {
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const locations = await supplierService.getLocations();
    
    return c.json({
      success: true,
      data: {
        locations
      }
    });
  } catch (error) {
    console.error('Get locations error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve locations'
    }, 500);
  }
});

// GET /api/suppliers/nearby - Get suppliers near user location
app.get('/nearby', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { 
      latitude, 
      longitude, 
      radius = 50, 
      limit = 20,
      category,
      verified_only = false 
    } = query;
    
    if (!latitude || !longitude) {
      return c.json({
        success: false,
        error: 'LOCATION_REQUIRED',
        message: 'Latitude and longitude are required'
      }, 400);
    }
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const nearbySuppliers = await supplierService.getNearbySuppliers({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMiles: parseInt(radius),
      limit: parseInt(limit),
      category,
      verifiedOnly: verified_only === 'true',
      userId: user?.id
    });
    
    return c.json({
      success: true,
      data: {
        suppliers: nearbySuppliers,
        search_location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseInt(radius)
        }
      }
    });
  } catch (error) {
    console.error('Get nearby suppliers error:', error);
    return c.json({
      success: false,
      error: 'SEARCH_FAILED',
      message: 'Failed to find nearby suppliers'
    }, 500);
  }
});

// GET /api/suppliers/:id - Get specific supplier details
app.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const supplier = await supplierService.getSupplierById(supplierId, user?.id);
    
    return c.json({
      success: true,
      data: {
        supplier
      }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    
    if (error.message.includes('not found')) {
      return c.json({
        success: false,
        error: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve supplier'
    }, 500);
  }
});

// GET /api/suppliers/:id/products - Get supplier's products
app.get('/:id/products', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    const query = c.req.query();
    
    const {
      category,
      search,
      min_price,
      max_price,
      in_stock = true,
      sort = 'featured',
      limit = 20,
      offset = 0
    } = query;
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const result = await supplierService.getSupplierProducts(supplierId, {
      category,
      search,
      minPrice: min_price ? parseFloat(min_price) : undefined,
      maxPrice: max_price ? parseFloat(max_price) : undefined,
      inStock: in_stock === 'true',
      sort,
      limit: parseInt(limit),
      offset: parseInt(offset),
      userId: user?.id
    });
    
    return c.json({
      success: true,
      data: {
        products: result.products,
        total: result.total,
        supplier: result.supplier,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get supplier products error:', error);
    
    if (error.message.includes('not found')) {
      return c.json({
        success: false,
        error: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve supplier products'
    }, 500);
  }
});

// GET /api/suppliers/:id/reviews - Get supplier reviews
app.get('/:id/reviews', async (c) => {
  try {
    const supplierId = c.req.param('id');
    const query = c.req.query();
    
    const {
      sort = 'newest',
      rating,
      verified_only = false,
      limit = 20,
      offset = 0
    } = query;
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const result = await supplierService.getSupplierReviews(supplierId, {
      sort,
      rating: rating ? parseInt(rating) : undefined,
      verifiedOnly: verified_only === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return c.json({
      success: true,
      data: {
        reviews: result.reviews,
        total: result.total,
        summary: result.summary,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get supplier reviews error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve supplier reviews'
    }, 500);
  }
});

// POST /api/suppliers/:id/contact - Contact a supplier
app.post('/:id/contact', authMiddleware, validateRequest(supplierContactSchema), async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    const contactData = c.get('validatedData');
    
    // Verify supplier exists
    const supplierCheck = await c.env.DB
      .prepare('SELECT id, name, email FROM suppliers WHERE id = ? AND active = TRUE')
      .bind(supplierId)
      .first();
    
    if (!supplierCheck) {
      return c.json({
        success: false,
        error: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found'
      }, 404);
    }
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const result = await supplierService.contactSupplier(user.id, supplierId, contactData);
    
    return c.json({
      success: true,
      message: 'Contact message sent successfully',
      data: {
        contact_id: result.contactId,
        supplier_name: supplierCheck.name
      }
    });
  } catch (error) {
    console.error('Contact supplier error:', error);
    return c.json({
      success: false,
      error: 'CONTACT_FAILED',
      message: 'Failed to send contact message'
    }, 500);
  }
});

// POST /api/suppliers/:id/reviews - Review a supplier
app.post('/:id/reviews', authMiddleware, validateRequest(reviewSupplierSchema), async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    const reviewData = c.get('validatedData');
    
    // Verify supplier exists
    const supplierCheck = await c.env.DB
      .prepare('SELECT id, name FROM suppliers WHERE id = ? AND active = TRUE')
      .bind(supplierId)
      .first();
    
    if (!supplierCheck) {
      return c.json({
        success: false,
        error: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found'
      }, 404);
    }
    
    // Check if user has already reviewed this supplier
    const existingReview = await c.env.DB
      .prepare('SELECT id FROM reviews WHERE user_id = ? AND target_id = ? AND review_type = "supplier"')
      .bind(user.id, supplierId)
      .first();
    
    if (existingReview) {
      return c.json({
        success: false,
        error: 'REVIEW_EXISTS',
        message: 'You have already reviewed this supplier'
      }, 409);
    }
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const review = await supplierService.createSupplierReview(user.id, supplierId, reviewData);
    
    // Award PAWS tokens for reviewing
    try {
      const PAWSService = (await import('../services/paws-service.js')).PAWSService;
      const pawsService = new PAWSService(c.env.DB, c.env.KV);
      await pawsService.awardTokens(user.id, 15, 'supplier_review_created', {
        supplier_id: supplierId,
        review_id: review.id
      });
    } catch (pawsError) {
      console.warn('Failed to award PAWS tokens:', pawsError);
    }
    
    return c.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        review,
        paws_awarded: 15
      }
    }, 201);
  } catch (error) {
    console.error('Create supplier review error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'REVIEW_FAILED',
      message: 'Failed to submit review'
    }, 500);
  }
});

// POST /api/suppliers/:id/favorite - Add supplier to favorites
app.post('/:id/favorite', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    await supplierService.addToFavorites(user.id, supplierId);
    
    return c.json({
      success: true,
      message: 'Supplier added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    
    if (error.message.includes('not found')) {
      return c.json({
        success: false,
        error: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found'
      }, 404);
    }
    
    if (error.message.includes('already')) {
      return c.json({
        success: false,
        error: 'ALREADY_FAVORITED',
        message: 'Supplier is already in favorites'
      }, 409);
    }
    
    return c.json({
      success: false,
      error: 'FAVORITE_FAILED',
      message: 'Failed to add supplier to favorites'
    }, 500);
  }
});

// DELETE /api/suppliers/:id/favorite - Remove supplier from favorites
app.delete('/:id/favorite', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supplierId = c.req.param('id');
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    await supplierService.removeFromFavorites(user.id, supplierId);
    
    return c.json({
      success: true,
      message: 'Supplier removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return c.json({
      success: false,
      error: 'UNFAVORITE_FAILED',
      message: 'Failed to remove supplier from favorites'
    }, 500);
  }
});

// GET /api/suppliers/favorites - Get user's favorite suppliers
app.get('/favorites', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { limit = 20, offset = 0 } = query;
    
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    const result = await supplierService.getFavoriteSuppliers(user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return c.json({
      success: true,
      data: {
        suppliers: result.suppliers,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get favorite suppliers error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve favorite suppliers'
    }, 500);
  }
});

export default app;