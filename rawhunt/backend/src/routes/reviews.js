import { Router } from 'itty-router';
import { ValidationUtils, reviewCreateSchema, reviewUpdateSchema } from '../utils/validation.js';
import { SupplierQueries, DatabaseUtils } from '../utils/database.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';

const reviewsRouter = Router({ base: '/api/reviews' });

/**
 * POST /api/reviews
 * Create a new review
 */
reviewsRouter.post('/', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    // Rate limiting for reviews
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5 // 5 reviews per hour
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(reviewCreateSchema, body);

    // Check if supplier exists
    const supplier = await SupplierQueries.findById(env.DB, validatedData.supplierId);
    if (!supplier) {
      return createCorsResponse({
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    // Check if user already reviewed this supplier
    const existingReview = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id FROM reviews WHERE user_id = ? AND supplier_id = ?',
      [auth.user.id, validatedData.supplierId]
    );

    if (existingReview) {
      return createCorsResponse({
        error: 'You have already reviewed this supplier',
        code: 'DUPLICATE_REVIEW'
      }, 409);
    }

    // Create review
    const reviewId = await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO reviews (
        user_id, supplier_id, rating, comment, images, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        auth.user.id,
        validatedData.supplierId,
        validatedData.rating,
        validatedData.comment || null,
        JSON.stringify(validatedData.images || []),
        DatabaseUtils.formatDateForDB(),
        DatabaseUtils.formatDateForDB()
      ]
    );

    // Update supplier rating
    await SupplierQueries.updateRating(env.DB, validatedData.supplierId);

    // Award PAWS for review submission
    const pawsEarned = 5; // 5 PAWS for review
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE users SET paws_balance = paws_balance + ?, updated_at = ? WHERE id = ?',
      [pawsEarned, DatabaseUtils.formatDateForDB(), auth.user.id]
    );

    // Record PAWS transaction
    const user = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT paws_balance FROM users WHERE id = ?',
      [auth.user.id]
    );

    await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO transactions (
        user_id, type, amount, description, reference_type,
        reference_id, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auth.user.id,
        'earned',
        pawsEarned,
        'Review submission reward',
        'review',
        reviewId.meta.last_row_id,
        user.paws_balance,
        DatabaseUtils.formatDateForDB()
      ]
    );

    // Get created review with user info
    const review = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [reviewId.meta.last_row_id]
    );

    const processedReview = {
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      userName: `${review.first_name} ${review.last_name.charAt(0)}.`
    };

    return createCorsResponse({
      success: true,
      data: {
        review: processedReview,
        pawsEarned
      },
      message: 'Review created successfully'
    }, 201);

  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to create review',
      code: 'CREATE_REVIEW_ERROR'
    }, 500);
  }
});

/**
 * GET /api/reviews/supplier/:supplierId
 * Get reviews for a supplier
 */
reviewsRouter.get('/supplier/:supplierId', async (request, env) => {
  try {
    const supplierId = parseInt(request.params.supplierId);
    
    if (isNaN(supplierId)) {
      return createCorsResponse({
        error: 'Invalid supplier ID',
        code: 'INVALID_ID'
      }, 400);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;

    // Get reviews with user info
    const reviews = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.supplier_id = ? 
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [supplierId, limit, offset]
    );

    // Get total count
    const countResult = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as total FROM reviews WHERE supplier_id = ?',
      [supplierId]
    );

    // Get rating distribution
    const ratingDistribution = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT rating, COUNT(*) as count 
       FROM reviews 
       WHERE supplier_id = ? 
       GROUP BY rating 
       ORDER BY rating DESC`,
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
        reviews: processedReviews,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        },
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get supplier reviews error:', error);
    return createCorsResponse({
      error: 'Failed to get reviews',
      code: 'GET_REVIEWS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/reviews/user
 * Get current user's reviews
 */
reviewsRouter.get('/user', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;

    const reviews = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT r.*, s.name as supplier_name, s.category as supplier_category
       FROM reviews r 
       JOIN rawgle_suppliers s ON r.supplier_id = s.id 
       WHERE r.user_id = ? 
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [auth.user.id, limit, offset]
    );

    const countResult = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
      [auth.user.id]
    );

    const processedReviews = reviews.map(review => ({
      ...review,
      images: review.images ? JSON.parse(review.images) : []
    }));

    return createCorsResponse({
      success: true,
      data: {
        reviews: processedReviews,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    return createCorsResponse({
      error: 'Failed to get user reviews',
      code: 'GET_USER_REVIEWS_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review (only by the author)
 */
reviewsRouter.put('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const reviewId = parseInt(request.params.id);
    
    if (isNaN(reviewId)) {
      return createCorsResponse({
        error: 'Invalid review ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if review exists and belongs to user
    const existingReview = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, auth.user.id]
    );

    if (!existingReview) {
      return createCorsResponse({
        error: 'Review not found or not authorized',
        code: 'REVIEW_NOT_FOUND'
      }, 404);
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(reviewUpdateSchema, body);

    // Build update query
    const updates = {};
    if (validatedData.rating !== undefined) updates.rating = validatedData.rating;
    if (validatedData.comment !== undefined) updates.comment = validatedData.comment;
    if (validatedData.images !== undefined) updates.images = JSON.stringify(validatedData.images);

    if (Object.keys(updates).length === 0) {
      return createCorsResponse({
        error: 'No updates provided',
        code: 'NO_UPDATES'
      }, 400);
    }

    // Update review
    const fields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      params.push(value);
    });

    fields.push('updated_at = ?');
    params.push(DatabaseUtils.formatDateForDB());
    params.push(reviewId);

    await DatabaseUtils.executeUpdate(
      env.DB,
      `UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    // Update supplier rating if rating changed
    if (validatedData.rating !== undefined) {
      await SupplierQueries.updateRating(env.DB, existingReview.supplier_id);
    }

    // Get updated review
    const review = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT r.*, u.first_name, u.last_name, s.name as supplier_name
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN rawgle_suppliers s ON r.supplier_id = s.id
       WHERE r.id = ?`,
      [reviewId]
    );

    const processedReview = {
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      userName: `${review.first_name} ${review.last_name.charAt(0)}.`
    };

    return createCorsResponse({
      success: true,
      data: { review: processedReview },
      message: 'Review updated successfully'
    });

  } catch (error) {
    console.error('Update review error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to update review',
      code: 'UPDATE_REVIEW_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (only by the author)
 */
reviewsRouter.delete('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const reviewId = parseInt(request.params.id);
    
    if (isNaN(reviewId)) {
      return createCorsResponse({
        error: 'Invalid review ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if review exists and belongs to user
    const existingReview = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, auth.user.id]
    );

    if (!existingReview) {
      return createCorsResponse({
        error: 'Review not found or not authorized',
        code: 'REVIEW_NOT_FOUND'
      }, 404);
    }

    // Delete review
    await DatabaseUtils.executeUpdate(
      env.DB,
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );

    // Update supplier rating
    await SupplierQueries.updateRating(env.DB, existingReview.supplier_id);

    return createCorsResponse({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    return createCorsResponse({
      error: 'Failed to delete review',
      code: 'DELETE_REVIEW_ERROR'
    }, 500);
  }
});

/**
 * POST /api/reviews/:id/helpful
 * Mark a review as helpful
 */
reviewsRouter.post('/:id/helpful', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const reviewId = parseInt(request.params.id);
    
    if (isNaN(reviewId)) {
      return createCorsResponse({
        error: 'Invalid review ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if review exists
    const review = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (!review) {
      return createCorsResponse({
        error: 'Review not found',
        code: 'REVIEW_NOT_FOUND'
      }, 404);
    }

    // Cannot mark own review as helpful
    if (review.user_id === auth.user.id) {
      return createCorsResponse({
        error: 'Cannot mark your own review as helpful',
        code: 'SELF_HELPFUL'
      }, 400);
    }

    // Update helpful count
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [reviewId]
    );

    return createCorsResponse({
      success: true,
      message: 'Review marked as helpful'
    });

  } catch (error) {
    console.error('Mark review helpful error:', error);
    return createCorsResponse({
      error: 'Failed to mark review as helpful',
      code: 'HELPFUL_ERROR'
    }, 500);
  }
});

export { reviewsRouter };