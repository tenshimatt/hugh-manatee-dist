import { Router } from 'itty-router';
import { ValidationUtils, supplierCreateSchema, supplierUpdateSchema, supplierSearchSchema } from '../utils/validation.js';
import { SupplierQueries, DatabaseUtils } from '../utils/database.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';

const suppliersRouter = Router({ base: '/api/suppliers' });

/**
 * GET /api/suppliers
 * Search and filter suppliers
 */
suppliersRouter.get('/', async (request, env) => {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, env);
    if (rateLimitResponse) return rateLimitResponse;

    // Optional authentication (for personalized results)
    const auth = await optionalAuth(request, env);

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = {};
    
    // Only include parameters that are actually provided
    const category = url.searchParams.get('category');
    if (category) searchParams.category = category;
    
    const latitude = url.searchParams.get('latitude');
    if (latitude) searchParams.latitude = parseFloat(latitude);
    
    const longitude = url.searchParams.get('longitude');
    if (longitude) searchParams.longitude = parseFloat(longitude);
    
    const radius = url.searchParams.get('radius');
    searchParams.radius = radius ? parseFloat(radius) : 10;
    
    const priceRange = url.searchParams.get('priceRange');
    if (priceRange) searchParams.priceRange = priceRange;
    
    const rating = url.searchParams.get('rating');
    if (rating) searchParams.rating = parseFloat(rating);
    
    const search = url.searchParams.get('search');
    if (search) searchParams.search = search;
    
    const page = url.searchParams.get('page');
    searchParams.page = page ? parseInt(page) : 1;
    
    const limit = url.searchParams.get('limit');
    searchParams.limit = limit ? parseInt(limit) : 20;

    // Validate search parameters
    const validatedParams = ValidationUtils.validateRequest(supplierSearchSchema, searchParams);

    // Search suppliers
    const suppliers = await SupplierQueries.search(env.DB, validatedParams);

    // Parse JSON fields
    const processedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      specialties: supplier.specialties ? JSON.parse(supplier.specialties) : [],
      businessHours: supplier.business_hours ? JSON.parse(supplier.business_hours) : {},
      images: supplier.images ? JSON.parse(supplier.images) : []
    }));

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM rawgle_suppliers s 
      WHERE s.is_active = 1
    `;
    const countParams = [];

    if (validatedParams.category) {
      countQuery += ' AND s.category = ?';
      countParams.push(validatedParams.category);
    }

    if (validatedParams.rating) {
      countQuery += ' AND s.rating_average >= ?';
      countParams.push(validatedParams.rating);
    }

    if (validatedParams.priceRange) {
      countQuery += ' AND s.price_range = ?';
      countParams.push(validatedParams.priceRange);
    }

    if (validatedParams.search) {
      countQuery += ' AND (s.name LIKE ? OR s.description LIKE ? OR s.specialties LIKE ?)';
      const searchTerm = DatabaseUtils.escapeSearchTerm(validatedParams.search);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await DatabaseUtils.executeQueryFirst(env.DB, countQuery, countParams);
    const totalCount = countResult.total;

    return createCorsResponse({
      success: true,
      data: {
        suppliers: processedSuppliers,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validatedParams.limit)
        },
        filters: validatedParams
      }
    });

  } catch (error) {
    console.error('Suppliers search error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Invalid search parameters',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to search suppliers',
      code: 'SEARCH_ERROR'
    }, 500);
  }
});

/**
 * GET /api/suppliers/categories
 * Get all supplier categories
 */
suppliersRouter.get('/categories', async (request, env) => {
  try {
    const categories = await DatabaseUtils.executeQuery(
      env.DB,
      'SELECT * FROM supplier_categories WHERE is_active = 1 ORDER BY name',
      []
    );

    return createCorsResponse({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return createCorsResponse({
      error: 'Failed to get categories',
      code: 'GET_CATEGORIES_ERROR'
    }, 500);
  }
});

/**
 * GET /api/suppliers/nearby
 * Get suppliers near a location
 */
suppliersRouter.get('/nearby', async (request, env) => {
  try {
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude'));
    const longitude = parseFloat(url.searchParams.get('longitude'));
    const radius = parseFloat(url.searchParams.get('radius')) || 10;
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      return createCorsResponse({
        error: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES'
      }, 400);
    }

    if (!ValidationUtils.validateCoordinates(latitude, longitude)) {
      return createCorsResponse({
        error: 'Invalid coordinates',
        code: 'INVALID_COORDINATES'
      }, 400);
    }

    const suppliers = await SupplierQueries.search(env.DB, {
      latitude,
      longitude,
      radius,
      limit,
      page: 1
    });

    return createCorsResponse({
      success: true,
      data: { suppliers }
    });

  } catch (error) {
    console.error('Get nearby suppliers error:', error);
    return createCorsResponse({
      error: 'Failed to get nearby suppliers',
      code: 'NEARBY_SUPPLIERS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/suppliers/:id
 * Get supplier details
 */
suppliersRouter.get('/:id', async (request, env) => {
  try {
    const supplierId = parseInt(request.params.id);
    
    if (isNaN(supplierId)) {
      return createCorsResponse({
        error: 'Invalid supplier ID',
        code: 'INVALID_ID'
      }, 400);
    }

    const supplier = await SupplierQueries.findById(env.DB, supplierId);
    
    if (!supplier) {
      return createCorsResponse({
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    // Parse JSON fields
    const processedSupplier = {
      ...supplier,
      specialties: supplier.specialties ? JSON.parse(supplier.specialties) : [],
      businessHours: supplier.business_hours ? JSON.parse(supplier.business_hours) : {},
      images: supplier.images ? JSON.parse(supplier.images) : []
    };

    // Get recent reviews
    const reviews = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.supplier_id = ? 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [supplierId]
    );

    const processedReviews = reviews.map(review => ({
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      userName: `${review.first_name} ${review.last_name.charAt(0)}.`
    }));

    return createCorsResponse({
      success: true,
      data: {
        supplier: processedSupplier,
        reviews: processedReviews
      }
    });

  } catch (error) {
    console.error('Get supplier error:', error);
    return createCorsResponse({
      error: 'Failed to get supplier',
      code: 'GET_SUPPLIER_ERROR'
    }, 500);
  }
});

/**
 * POST /api/suppliers
 * Create a new supplier (admin only)
 */
suppliersRouter.post('/', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(supplierCreateSchema, body);

    // Create supplier
    const supplierId = await SupplierQueries.create(env.DB, {
      ...validatedData,
      userId: validatedData.userId || null
    });

    // Get created supplier
    const supplier = await SupplierQueries.findById(env.DB, supplierId);
    
    return createCorsResponse({
      success: true,
      data: { supplier },
      message: 'Supplier created successfully'
    }, 201);

  } catch (error) {
    console.error('Create supplier error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to create supplier',
      code: 'CREATE_SUPPLIER_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/suppliers/:id
 * Update supplier (admin only)
 */
suppliersRouter.put('/:id', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const supplierId = parseInt(request.params.id);
    
    if (isNaN(supplierId)) {
      return createCorsResponse({
        error: 'Invalid supplier ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if supplier exists
    const existingSupplier = await SupplierQueries.findById(env.DB, supplierId);
    if (!existingSupplier) {
      return createCorsResponse({
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(supplierUpdateSchema, body);

    // Build update query
    const updates = {};
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'specialties' || key === 'businessHours' || key === 'images') {
          updates[key] = JSON.stringify(value);
        } else {
          updates[key] = value;
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return createCorsResponse({
        error: 'No updates provided',
        code: 'NO_UPDATES'
      }, 400);
    }

    // Update supplier
    const fields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbField} = ?`);
      params.push(value);
    });

    fields.push('updated_at = ?');
    params.push(DatabaseUtils.formatDateForDB());
    params.push(supplierId);

    const updateQuery = `UPDATE rawgle_suppliers SET ${fields.join(', ')} WHERE id = ?`;
    await DatabaseUtils.executeUpdate(env.DB, updateQuery, params);

    // Get updated supplier
    const supplier = await SupplierQueries.findById(env.DB, supplierId);
    
    return createCorsResponse({
      success: true,
      data: { supplier },
      message: 'Supplier updated successfully'
    });

  } catch (error) {
    console.error('Update supplier error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to update supplier',
      code: 'UPDATE_SUPPLIER_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/suppliers/:id
 * Delete/deactivate supplier (admin only)
 */
suppliersRouter.delete('/:id', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const supplierId = parseInt(request.params.id);
    
    if (isNaN(supplierId)) {
      return createCorsResponse({
        error: 'Invalid supplier ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if supplier exists
    const existingSupplier = await SupplierQueries.findById(env.DB, supplierId);
    if (!existingSupplier) {
      return createCorsResponse({
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    // Soft delete by setting is_active to false
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE rawgle_suppliers SET is_active = 0, updated_at = ? WHERE id = ?',
      [DatabaseUtils.formatDateForDB(), supplierId]
    );

    return createCorsResponse({
      success: true,
      message: 'Supplier deactivated successfully'
    });

  } catch (error) {
    console.error('Delete supplier error:', error);
    return createCorsResponse({
      error: 'Failed to delete supplier',
      code: 'DELETE_SUPPLIER_ERROR'
    }, 500);
  }
});

export { suppliersRouter };