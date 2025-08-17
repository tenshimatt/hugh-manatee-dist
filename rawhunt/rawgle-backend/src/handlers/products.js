/**
 * Products Handler for Rawgle
 * Handles raw food products and supplies marketplace
 */

import { Hono } from 'hono';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const productFiltersSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
  protein_source: z.string().optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  available_only: z.boolean().default(true),
  featured_only: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(['price', 'rating', 'name', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// GET /api/products - Get products (public)
app.get('/', optionalAuthMiddleware, validateRequest(productFiltersSchema, 'query'), async (c) => {
  try {
    const user = c.get('user');
    const filters = c.get('validatedData');
    
    let whereClause = 'WHERE p.active = TRUE';
    const bindings = [];
    
    if (filters.available_only) {
      whereClause += ' AND p.available = TRUE';
    }
    
    if (filters.featured_only) {
      whereClause += ' AND p.featured = TRUE';
    }
    
    if (filters.category) {
      whereClause += ' AND p.category = ?';
      bindings.push(filters.category);
    }
    
    if (filters.subcategory) {
      whereClause += ' AND p.subcategory = ?';
      bindings.push(filters.subcategory);
    }
    
    if (filters.supplier_id) {
      whereClause += ' AND p.supplier_id = ?';
      bindings.push(filters.supplier_id);
    }
    
    if (filters.protein_source) {
      whereClause += ' AND p.protein_source = ?';
      bindings.push(filters.protein_source);
    }
    
    if (filters.min_price) {
      whereClause += ' AND p.price_cents >= ?';
      bindings.push(filters.min_price * 100); // Convert to cents
    }
    
    if (filters.max_price) {
      whereClause += ' AND p.price_cents <= ?';
      bindings.push(filters.max_price * 100); // Convert to cents
    }
    
    // Add supplier active filter
    whereClause += ' AND s.active = TRUE';
    
    const sortField = filters.sort === 'rating' ? 'p.rating_average' : 
                     filters.sort === 'price' ? 'p.price_cents' :
                     filters.sort === 'name' ? 'p.name' : 'p.created_at';
    
    const products = await c.env.DB
      .prepare(`
        SELECT p.id, p.name, p.description, p.category, p.subcategory,
               p.price_cents, p.price_currency, p.unit, p.unit_size,
               p.brand, p.protein_source, p.cut_type, p.bone_content,
               p.images, p.rating_average, p.review_count, p.featured,
               p.stock_quantity, p.available, p.created_at,
               s.id as supplier_id, s.name as supplier_name, s.verified as supplier_verified
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.featured DESC, ${sortField} ${filters.order.toUpperCase()}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, filters.limit, filters.offset)
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    const productsData = (products.results || []).map(product => ({
      ...product,
      price_dollars: product.price_cents / 100,
      images: JSON.parse(product.images || '[]')
    }));
    
    return c.json({
      success: true,
      data: {
        products: productsData,
        pagination: {
          total: totalCount?.count || 0,
          limit: filters.limit,
          offset: filters.offset,
          pages: Math.ceil((totalCount?.count || 0) / filters.limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({
      success: false,
      error: 'PRODUCTS_FETCH_FAILED',
      message: 'Failed to retrieve products'
    }, 500);
  }
});

// GET /api/products/:id - Get specific product details
app.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');
    
    const product = await c.env.DB
      .prepare(`
        SELECT p.*, s.name as supplier_name, s.business_name, s.email as supplier_email,
               s.phone as supplier_phone, s.website as supplier_website,
               s.verified as supplier_verified, s.rating_average as supplier_rating,
               s.address, s.city, s.state, s.country
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ? AND p.active = TRUE AND s.active = TRUE
      `)
      .bind(productId)
      .first();
    
    if (!product) {
      return c.json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      }, 404);
    }
    
    // Get product reviews
    const reviews = await c.env.DB
      .prepare(`
        SELECT r.id, r.rating, r.title, r.content, r.pros, r.cons,
               r.quality_rating, r.value_rating, r.freshness_rating,
               r.verified_purchase, r.purchase_date, r.helpful_votes,
               r.total_votes, r.created_at,
               u.name as reviewer_name, u.avatar_url as reviewer_avatar
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.target_id = ? AND r.review_type = 'product' AND r.approved = TRUE
        ORDER BY r.helpful_votes DESC, r.created_at DESC
        LIMIT 10
      `)
      .bind(productId)
      .all();
    
    const productData = {
      ...product,
      price_dollars: product.price_cents / 100,
      images: JSON.parse(product.images || '[]'),
      videos: JSON.parse(product.videos || '[]'),
      nutritional_analysis: JSON.parse(product.nutritional_analysis || '{}'),
      allergens: JSON.parse(product.allergens || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      ingredients: JSON.parse(product.ingredients || '[]'),
      bulk_pricing: JSON.parse(product.bulk_pricing || '[]'),
      supplier: {
        id: product.supplier_id,
        name: product.supplier_name,
        business_name: product.business_name,
        verified: product.supplier_verified,
        rating: product.supplier_rating,
        contact: {
          email: product.supplier_email,
          phone: product.supplier_phone,
          website: product.supplier_website
        },
        location: {
          address: product.address,
          city: product.city,
          state: product.state,
          country: product.country
        }
      },
      reviews: (reviews.results || []).map(review => ({
        ...review,
        helpfulness_ratio: review.total_votes > 0 ? review.helpful_votes / review.total_votes : 0
      }))
    };
    
    return c.json({
      success: true,
      data: {
        product: productData
      }
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return c.json({
      success: false,
      error: 'PRODUCT_FETCH_FAILED',
      message: 'Failed to retrieve product details'
    }, 500);
  }
});

// GET /api/products/:id/reviews - Get product reviews
app.get('/:id/reviews', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');
    const query = c.req.query();
    const {
      rating,
      verified_only = false,
      sort = 'helpful',
      limit = 20,
      offset = 0
    } = query;
    
    // Verify product exists
    const product = await c.env.DB
      .prepare('SELECT id FROM products WHERE id = ? AND active = TRUE')
      .bind(productId)
      .first();
    
    if (!product) {
      return c.json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      }, 404);
    }
    
    let whereClause = 'WHERE r.target_id = ? AND r.review_type = ? AND r.approved = TRUE';
    const bindings = [productId, 'product'];
    
    if (rating) {
      whereClause += ' AND r.rating = ?';
      bindings.push(parseInt(rating));
    }
    
    if (verified_only === 'true') {
      whereClause += ' AND r.verified_purchase = TRUE';
    }
    
    const sortField = sort === 'helpful' ? 'r.helpful_votes DESC' :
                     sort === 'recent' ? 'r.created_at DESC' :
                     sort === 'rating_high' ? 'r.rating DESC' :
                     sort === 'rating_low' ? 'r.rating ASC' : 'r.created_at DESC';
    
    const reviews = await c.env.DB
      .prepare(`
        SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar,
               p.name as pet_name, p.species as pet_species
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN pets p ON r.pet_id = p.id
        ${whereClause}
        ORDER BY ${sortField}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, parseInt(limit), parseInt(offset))
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM reviews r
        ${whereClause}
      `)
      .bind(...bindings.slice(0, -2))
      .first();
    
    // Get rating breakdown
    const ratingBreakdown = await c.env.DB
      .prepare(`
        SELECT rating, COUNT(*) as count
        FROM reviews
        WHERE target_id = ? AND review_type = 'product' AND approved = TRUE
        GROUP BY rating
        ORDER BY rating DESC
      `)
      .bind(productId)
      .all();
    
    const reviewsData = (reviews.results || []).map(review => ({
      ...review,
      helpfulness_ratio: review.total_votes > 0 ? review.helpful_votes / review.total_votes : 0,
      images: JSON.parse(review.images || '[]')
    }));
    
    const ratingStats = {};
    let totalReviews = 0;
    let totalRating = 0;
    
    (ratingBreakdown.results || []).forEach(item => {
      ratingStats[item.rating] = item.count;
      totalReviews += item.count;
      totalRating += item.rating * item.count;
    });
    
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    return c.json({
      success: true,
      data: {
        reviews: reviewsData,
        statistics: {
          total_reviews: totalReviews,
          average_rating: Math.round(averageRating * 10) / 10,
          rating_breakdown: ratingStats
        },
        pagination: {
          total: totalCount?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((totalCount?.count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    return c.json({
      success: false,
      error: 'REVIEWS_FETCH_FAILED',
      message: 'Failed to retrieve product reviews'
    }, 500);
  }
});

// GET /api/products/categories - Get product categories
app.get('/categories', async (c) => {
  try {
    const categories = await c.env.DB
      .prepare(`
        SELECT category, subcategory, COUNT(*) as product_count
        FROM products
        WHERE active = TRUE AND available = TRUE
        GROUP BY category, subcategory
        ORDER BY category, subcategory
      `)
      .all();
    
    // Group by category
    const categoryData = {};
    (categories.results || []).forEach(item => {
      if (!categoryData[item.category]) {
        categoryData[item.category] = {
          name: item.category,
          subcategories: [],
          total_products: 0
        };
      }
      
      if (item.subcategory) {
        categoryData[item.category].subcategories.push({
          name: item.subcategory,
          product_count: item.product_count
        });
      }
      
      categoryData[item.category].total_products += item.product_count;
    });
    
    return c.json({
      success: true,
      data: {
        categories: Object.values(categoryData)
      }
    });
  } catch (error) {
    console.error('Get product categories error:', error);
    return c.json({
      success: false,
      error: 'CATEGORIES_FETCH_FAILED',
      message: 'Failed to retrieve product categories'
    }, 500);
  }
});

// GET /api/products/search - Search products
app.get('/search', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { 
      q, // search query
      category,
      min_price,
      max_price,
      limit = 20,
      offset = 0 
    } = query;
    
    if (!q || q.length < 2) {
      return c.json({
        success: false,
        error: 'INVALID_SEARCH_QUERY',
        message: 'Search query must be at least 2 characters'
      }, 400);
    }
    
    let whereClause = `WHERE p.active = TRUE AND p.available = TRUE AND s.active = TRUE
                       AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? 
                            OR p.protein_source LIKE ? OR s.name LIKE ?)`;
    
    const searchTerm = `%${q}%`;
    const bindings = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    
    if (category) {
      whereClause += ' AND p.category = ?';
      bindings.push(category);
    }
    
    if (min_price) {
      whereClause += ' AND p.price_cents >= ?';
      bindings.push(parseFloat(min_price) * 100);
    }
    
    if (max_price) {
      whereClause += ' AND p.price_cents <= ?';
      bindings.push(parseFloat(max_price) * 100);
    }
    
    const products = await c.env.DB
      .prepare(`
        SELECT p.id, p.name, p.description, p.category, p.subcategory,
               p.price_cents, p.price_currency, p.unit, p.brand,
               p.protein_source, p.images, p.rating_average, p.review_count,
               p.featured, p.available,
               s.name as supplier_name, s.verified as supplier_verified
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.featured DESC, p.rating_average DESC, p.name ASC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, parseInt(limit), parseInt(offset))
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM products p
        JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    const productsData = (products.results || []).map(product => ({
      ...product,
      price_dollars: product.price_cents / 100,
      images: JSON.parse(product.images || '[]')
    }));
    
    return c.json({
      success: true,
      data: {
        query: q,
        products: productsData,
        pagination: {
          total: totalCount?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((totalCount?.count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    return c.json({
      success: false,
      error: 'SEARCH_FAILED',
      message: 'Failed to search products'
    }, 500);
  }
});

export default app;