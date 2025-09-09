import express from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import { db } from '../config/database';
import { authenticate, requireAdmin, requireUser, optionalAuth } from '../middleware/authMiddleware';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for search endpoints
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const ArticleStatus = z.enum(['draft', 'published', 'archived', 'deleted']);
const ArticleContentType = z.enum(['markdown', 'html', 'text']);
const ArticlePriority = z.enum(['low', 'medium', 'high', 'urgent']);

const CreateArticleSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(500, 'Title must be less than 500 characters'),
  excerpt: z.string()
    .max(1000, 'Excerpt must be less than 1000 characters')
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters'),
  content_type: ArticleContentType.default('markdown'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  subcategory: z.string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  status: ArticleStatus.default('draft'),
  priority: ArticlePriority.default('medium'),
  featured: z.boolean().default(false),
  sticky: z.boolean().default(false),
  meta_title: z.string()
    .max(60, 'Meta title must be less than 60 characters')
    .optional(),
  meta_description: z.string()
    .max(160, 'Meta description must be less than 160 characters')
    .optional(),
  canonical_url: z.string().url('Invalid canonical URL').optional(),
  scheduled_publish_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  featured_image_url: z.string().url('Invalid featured image URL').optional(),
  gallery_images: z.array(z.string().url()).default([]),
  video_urls: z.array(z.string().url()).default([]),
  document_attachments: z.array(z.string().url()).default([]),
  related_articles: z.array(z.string().uuid()).default([]),
  related_products: z.array(z.string()).default([]),
  related_suppliers: z.array(z.string().uuid()).default([]),
  is_public: z.boolean().default(true),
  requires_login: z.boolean().default(false)
});

const UpdateArticleSchema = CreateArticleSchema.partial();

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  status: ArticleStatus.optional(),
  featured: z.boolean().optional(),
  sticky: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['date', 'views', 'likes', 'title', 'relevance']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('desc')
});

const ListQuerySchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.string().optional(),
  status: ArticleStatus.optional(),
  featured: z.boolean().optional(),
  sticky: z.boolean().optional(),
  author_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['date', 'views', 'likes', 'title', 'updated']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// GET /api/v1/knowledge-base/articles - List articles with filtering
router.get('/articles', 
  optionalAuth,
  validateSchema({ query: ListQuerySchema }),
  async (req, res) => {
    try {
      const query = req.query as z.infer<typeof ListQuerySchema>;
      const user = req.user;
      
      let whereConditions = ['ka.is_active = TRUE'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereConditions.push('ka.is_public = TRUE');
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push('published');
        whereConditions.push('(ka.expires_at IS NULL OR ka.expires_at > NOW())');
      }

      // Apply filters
      if (query.category) {
        whereConditions.push('ka.category = $' + paramIndex++);
        queryParams.push(query.category);
      }

      if (query.subcategory) {
        whereConditions.push('ka.subcategory = $' + paramIndex++);
        queryParams.push(query.subcategory);
      }

      if (query.tags) {
        const tagsArray = query.tags.split(',').map(tag => tag.trim());
        whereConditions.push('ka.tags && $' + paramIndex++);
        queryParams.push(tagsArray);
      }

      if (query.status && user && ['admin'].includes(user.accountType)) {
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push(query.status);
      }

      if (query.featured !== undefined) {
        whereConditions.push('ka.featured = $' + paramIndex++);
        queryParams.push(query.featured);
      }

      if (query.sticky !== undefined) {
        whereConditions.push('ka.sticky = $' + paramIndex++);
        queryParams.push(query.sticky);
      }

      if (query.author_id) {
        whereConditions.push('ka.author_id = $' + paramIndex++);
        queryParams.push(query.author_id);
      }

      // Build ORDER BY clause
      let orderBy = 'ka.sticky DESC, ka.featured DESC, ';
      switch (query.sort) {
        case 'date':
          orderBy += `COALESCE(ka.published_at, ka.created_at) ${query.order.toUpperCase()}`;
          break;
        case 'views':
          orderBy += `ka.view_count ${query.order.toUpperCase()}`;
          break;
        case 'likes':
          orderBy += `ka.like_count ${query.order.toUpperCase()}`;
          break;
        case 'title':
          orderBy += `ka.title ${query.order.toUpperCase()}`;
          break;
        case 'updated':
          orderBy += `ka.updated_at ${query.order.toUpperCase()}`;
          break;
        default:
          orderBy += 'COALESCE(ka.published_at, ka.created_at) DESC';
      }

      // Calculate pagination
      const offset = (query.page - 1) * query.limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
      `;
      
      const countResult = await db.query<{ total: string }>(countQuery, queryParams);
      const totalCount = parseInt(countResult[0].total);

      // Get articles
      const articlesQuery = `
        SELECT 
          ka.id,
          ka.title,
          ka.slug,
          ka.excerpt,
          ka.category,
          ka.subcategory,
          ka.tags,
          ka.keywords,
          ka.status,
          ka.priority,
          ka.featured,
          ka.sticky,
          ka.published_at,
          ka.reading_time_minutes,
          ka.view_count,
          ka.like_count,
          ka.share_count,
          ka.bookmark_count,
          ka.featured_image_url,
          ka.meta_title,
          ka.meta_description,
          ka.created_at,
          ka.updated_at,
          ka.author_id,
          u.name as author_name
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      queryParams.push(query.limit, offset);
      const articles = await db.query(articlesQuery, queryParams);

      const totalPages = Math.ceil(totalCount / query.limit);
      const hasNext = query.page < totalPages;
      const hasPrev = query.page > 1;

      const response = {
        articles,
        pagination: {
          total: totalCount,
          page: query.page,
          limit: query.limit,
          totalPages,
          hasNext,
          hasPrev
        }
      };

      logger.info('Knowledge base articles retrieved', {
        total: totalCount,
        page: query.page,
        filters: { 
          category: query.category, 
          subcategory: query.subcategory, 
          tags: query.tags,
          featured: query.featured 
        },
        userId: user?.userId
      });

      res.json({
        success: true,
        data: response,
        message: `Found ${totalCount} articles`
      });

    } catch (error) {
      logger.error('Error retrieving knowledge base articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve articles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/articles/search - Full-text search
router.get('/articles/search',
  searchRateLimit,
  optionalAuth,
  validateSchema({ query: SearchQuerySchema }),
  async (req, res) => {
    try {
      const query = req.query as z.infer<typeof SearchQuerySchema>;
      const user = req.user;

      let whereConditions = ['ka.is_active = TRUE'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereConditions.push('ka.is_public = TRUE');
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push('published');
        whereConditions.push('(ka.expires_at IS NULL OR ka.expires_at > NOW())');
      }

      // Full-text search condition
      const searchQuery = query.q.replace(/[<>]/g, '').trim();
      whereConditions.push(`to_tsvector('english', 
        ka.title || ' ' || 
        COALESCE(ka.excerpt, '') || ' ' || 
        ka.content || ' ' ||
        COALESCE(ka.category, '') || ' ' ||
        COALESCE(ka.subcategory, '')
      ) @@ plainto_tsquery('english', $${paramIndex++})`);
      queryParams.push(searchQuery);

      // Apply additional filters
      if (query.category) {
        whereConditions.push('ka.category = $' + paramIndex++);
        queryParams.push(query.category);
      }

      if (query.subcategory) {
        whereConditions.push('ka.subcategory = $' + paramIndex++);
        queryParams.push(query.subcategory);
      }

      if (query.tags) {
        const tagsArray = query.tags.split(',').map(tag => tag.trim());
        whereConditions.push('ka.tags && $' + paramIndex++);
        queryParams.push(tagsArray);
      }

      if (query.featured !== undefined) {
        whereConditions.push('ka.featured = $' + paramIndex++);
        queryParams.push(query.featured);
      }

      if (query.sticky !== undefined) {
        whereConditions.push('ka.sticky = $' + paramIndex++);
        queryParams.push(query.sticky);
      }

      // Build ORDER BY clause with relevance
      let orderBy = 'ka.sticky DESC, ka.featured DESC, ';
      if (query.sort === 'relevance') {
        orderBy += `ts_rank(to_tsvector('english', 
          ka.title || ' ' || 
          COALESCE(ka.excerpt, '') || ' ' || 
          ka.content
        ), plainto_tsquery('english', $${paramIndex++})) DESC`;
        queryParams.push(searchQuery);
      } else {
        switch (query.sort) {
          case 'date':
            orderBy += `COALESCE(ka.published_at, ka.created_at) ${query.order.toUpperCase()}`;
            break;
          case 'views':
            orderBy += `ka.view_count ${query.order.toUpperCase()}`;
            break;
          case 'likes':
            orderBy += `ka.like_count ${query.order.toUpperCase()}`;
            break;
          case 'title':
            orderBy += `ka.title ${query.order.toUpperCase()}`;
            break;
          default:
            orderBy += 'COALESCE(ka.published_at, ka.created_at) DESC';
        }
      }

      // Calculate pagination
      const offset = (query.page - 1) * query.limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM knowledge_base_articles ka
        WHERE ${whereConditions.join(' AND ')}
      `;
      
      // Remove relevance ranking parameter for count query
      const countParams = query.sort === 'relevance' ? queryParams.slice(0, -1) : queryParams;
      const countResult = await db.query<{ total: string }>(countQuery, countParams);
      const totalCount = parseInt(countResult[0].total);

      // Get search results with relevance ranking
      const searchQuerySql = `
        SELECT 
          ka.id,
          ka.title,
          ka.slug,
          ka.excerpt,
          ka.category,
          ka.subcategory,
          ka.tags,
          ka.keywords,
          ka.status,
          ka.featured,
          ka.sticky,
          ka.published_at,
          ka.reading_time_minutes,
          ka.view_count,
          ka.like_count,
          ka.featured_image_url,
          ka.meta_title,
          ka.meta_description,
          ka.created_at,
          ka.author_id,
          u.name as author_name,
          ${query.sort === 'relevance' ? `ts_rank(to_tsvector('english', 
            ka.title || ' ' || 
            COALESCE(ka.excerpt, '') || ' ' || 
            ka.content
          ), plainto_tsquery('english', $${queryParams.length - (query.sort === 'relevance' ? 0 : 1)})) as relevance_score` : 'NULL as relevance_score'}
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      queryParams.push(query.limit, offset);
      const articles = await db.query(searchQuerySql, queryParams);

      const totalPages = Math.ceil(totalCount / query.limit);
      const hasNext = query.page < totalPages;
      const hasPrev = query.page > 1;

      const response = {
        articles,
        query: searchQuery,
        pagination: {
          total: totalCount,
          page: query.page,
          limit: query.limit,
          totalPages,
          hasNext,
          hasPrev
        }
      };

      logger.info('Knowledge base search completed', {
        query: searchQuery,
        total: totalCount,
        page: query.page,
        filters: { 
          category: query.category, 
          tags: query.tags 
        },
        userId: user?.userId
      });

      res.json({
        success: true,
        data: response,
        message: `Found ${totalCount} articles matching "${searchQuery}"`
      });

    } catch (error) {
      logger.error('Error searching knowledge base articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search articles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/articles/featured - Get featured articles
router.get('/articles/featured',
  optionalAuth,
  async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const user = req.user;

      let whereConditions = [
        'ka.is_active = TRUE',
        'ka.featured = TRUE'
      ];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereConditions.push('ka.is_public = TRUE');
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push('published');
        whereConditions.push('(ka.expires_at IS NULL OR ka.expires_at > NOW())');
      }

      const query = `
        SELECT 
          ka.id,
          ka.title,
          ka.slug,
          ka.excerpt,
          ka.category,
          ka.subcategory,
          ka.tags,
          ka.featured,
          ka.sticky,
          ka.published_at,
          ka.reading_time_minutes,
          ka.view_count,
          ka.like_count,
          ka.featured_image_url,
          ka.meta_title,
          ka.meta_description,
          ka.created_at,
          ka.author_id,
          u.name as author_name
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ka.sticky DESC, ka.like_count DESC, ka.view_count DESC, ka.published_at DESC
        LIMIT $${paramIndex++}
      `;

      queryParams.push(limitNum);
      const articles = await db.query(query, queryParams);

      logger.info('Featured articles retrieved', {
        count: articles.length,
        limit: limitNum,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: articles,
        message: `Found ${articles.length} featured articles`
      });

    } catch (error) {
      logger.error('Error retrieving featured articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve featured articles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/articles/:id - Get article by ID
router.get('/articles/:id',
  optionalAuth,
  validateSchema({ params: z.object({ id: commonSchemas.uuid }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      let whereConditions = [
        'ka.is_active = TRUE',
        'ka.id = $1'
      ];
      let queryParams: any[] = [id];
      let paramIndex = 2;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereConditions.push('ka.is_public = TRUE');
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push('published');
        whereConditions.push('(ka.expires_at IS NULL OR ka.expires_at > NOW())');
      }

      const query = `
        SELECT 
          ka.*,
          u.name as author_name,
          u.email as author_email
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const articles = await db.query(query, queryParams);

      if (articles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const article = articles[0];

      // Increment view count asynchronously (don't wait for it)
      db.query('SELECT increment_article_view_count($1)', [id])
        .catch(error => logger.error('Failed to increment view count:', error));

      logger.info('Article retrieved', {
        articleId: id,
        title: article.title,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: article,
        message: 'Article retrieved successfully'
      });

    } catch (error) {
      logger.error('Error retrieving article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/articles/slug/:slug - Get article by slug
router.get('/articles/slug/:slug',
  optionalAuth,
  validateSchema({ params: z.object({ slug: z.string().min(1) }) }),
  async (req, res) => {
    try {
      const { slug } = req.params;
      const user = req.user;

      let whereConditions = [
        'ka.is_active = TRUE',
        'ka.slug = $1'
      ];
      let queryParams: any[] = [slug];
      let paramIndex = 2;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereConditions.push('ka.is_public = TRUE');
        whereConditions.push('ka.status = $' + paramIndex++);
        queryParams.push('published');
        whereConditions.push('(ka.expires_at IS NULL OR ka.expires_at > NOW())');
      }

      const query = `
        SELECT 
          ka.*,
          u.name as author_name,
          u.email as author_email
        FROM knowledge_base_articles ka
        LEFT JOIN users u ON ka.author_id = u.id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const articles = await db.query(query, queryParams);

      if (articles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const article = articles[0];

      // Increment view count asynchronously
      db.query('SELECT increment_article_view_count($1)', [article.id])
        .catch(error => logger.error('Failed to increment view count:', error));

      logger.info('Article retrieved by slug', {
        slug,
        articleId: article.id,
        title: article.title,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: article,
        message: 'Article retrieved successfully'
      });

    } catch (error) {
      logger.error('Error retrieving article by slug:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/v1/knowledge-base/articles - Create new article
router.post('/articles',
  authenticate,
  requireUser,
  validateSchema({ body: CreateArticleSchema }),
  async (req, res) => {
    try {
      const articleData = req.body as z.infer<typeof CreateArticleSchema>;
      const user = req.user!;

      // Only admins can create published articles directly
      if (articleData.status === 'published' && user.accountType !== 'admin') {
        articleData.status = 'draft';
      }

      // Only admins can set featured/sticky flags
      if (user.accountType !== 'admin') {
        articleData.featured = false;
        articleData.sticky = false;
      }

      const query = `
        INSERT INTO knowledge_base_articles (
          title, excerpt, content, content_type, category, subcategory,
          tags, keywords, status, priority, featured, sticky,
          meta_title, meta_description, canonical_url,
          scheduled_publish_at, expires_at, featured_image_url,
          gallery_images, video_urls, document_attachments,
          related_articles, related_products, related_suppliers,
          is_public, requires_login, author_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        )
        RETURNING *
      `;

      const queryParams = [
        articleData.title,
        articleData.excerpt || null,
        articleData.content,
        articleData.content_type,
        articleData.category,
        articleData.subcategory || null,
        articleData.tags,
        articleData.keywords,
        articleData.status,
        articleData.priority,
        articleData.featured,
        articleData.sticky,
        articleData.meta_title || null,
        articleData.meta_description || null,
        articleData.canonical_url || null,
        articleData.scheduled_publish_at || null,
        articleData.expires_at || null,
        articleData.featured_image_url || null,
        articleData.gallery_images,
        articleData.video_urls,
        articleData.document_attachments,
        articleData.related_articles,
        articleData.related_products,
        articleData.related_suppliers,
        articleData.is_public,
        articleData.requires_login,
        user.userId
      ];

      const articles = await db.query(query, queryParams);
      const article = articles[0];

      logger.info('Knowledge base article created', {
        articleId: article.id,
        title: article.title,
        category: article.category,
        status: article.status,
        authorId: user.userId
      });

      res.status(201).json({
        success: true,
        data: article,
        message: 'Article created successfully'
      });

    } catch (error) {
      logger.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/v1/knowledge-base/articles/:id - Update article
router.put('/articles/:id',
  authenticate,
  requireUser,
  validateSchema({ 
    params: z.object({ id: commonSchemas.uuid }),
    body: UpdateArticleSchema 
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body as z.infer<typeof UpdateArticleSchema>;
      const user = req.user!;

      // Check if article exists and user has permission
      const existingQuery = `
        SELECT * FROM knowledge_base_articles 
        WHERE id = $1 AND is_active = TRUE
      `;
      const existingArticles = await db.query(existingQuery, [id]);
      
      if (existingArticles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const existingArticle = existingArticles[0];

      // Check permissions - only author or admin can edit
      if (existingArticle.author_id !== user.userId && user.accountType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own articles'
        });
      }

      // Only admins can publish articles or set featured/sticky flags
      if (user.accountType !== 'admin') {
        if (updateData.status === 'published') {
          delete updateData.status;
        }
        if (updateData.featured !== undefined) {
          delete updateData.featured;
        }
        if (updateData.sticky !== undefined) {
          delete updateData.sticky;
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          queryParams.push(value);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      // Add editor ID and updated timestamp
      updateFields.push(`editor_id = $${paramIndex++}`);
      queryParams.push(user.userId);
      updateFields.push(`updated_at = NOW()`);

      const updateQuery = `
        UPDATE knowledge_base_articles 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND is_active = TRUE
        RETURNING *
      `;
      queryParams.push(id);

      const updatedArticles = await db.query(updateQuery, queryParams);
      const updatedArticle = updatedArticles[0];

      logger.info('Knowledge base article updated', {
        articleId: id,
        title: updatedArticle.title,
        updatedFields: Object.keys(updateData),
        editorId: user.userId
      });

      res.json({
        success: true,
        data: updatedArticle,
        message: 'Article updated successfully'
      });

    } catch (error) {
      logger.error('Error updating article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DELETE /api/v1/knowledge-base/articles/:id - Delete article (soft delete)
router.delete('/articles/:id',
  authenticate,
  requireUser,
  validateSchema({ params: z.object({ id: commonSchemas.uuid }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Check if article exists and user has permission
      const existingQuery = `
        SELECT * FROM knowledge_base_articles 
        WHERE id = $1 AND is_active = TRUE
      `;
      const existingArticles = await db.query(existingQuery, [id]);
      
      if (existingArticles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      const existingArticle = existingArticles[0];

      // Check permissions - only author or admin can delete
      if (existingArticle.author_id !== user.userId && user.accountType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own articles'
        });
      }

      // Soft delete - mark as inactive
      const deleteQuery = `
        UPDATE knowledge_base_articles 
        SET is_active = FALSE, status = 'deleted', updated_at = NOW()
        WHERE id = $1
        RETURNING id, title
      `;

      const deletedArticles = await db.query(deleteQuery, [id]);
      const deletedArticle = deletedArticles[0];

      logger.info('Knowledge base article deleted', {
        articleId: id,
        title: deletedArticle.title,
        deletedBy: user.userId
      });

      res.json({
        success: true,
        message: 'Article deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/v1/knowledge-base/articles/:id/like - Like an article
router.post('/articles/:id/like',
  authenticate,
  requireUser,
  validateSchema({ params: z.object({ id: commonSchemas.uuid }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Check if article exists
      const articleQuery = `
        SELECT id, title, like_count FROM knowledge_base_articles 
        WHERE id = $1 AND is_active = TRUE AND status = 'published'
      `;
      const articles = await db.query(articleQuery, [id]);
      
      if (articles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // For MVP, simply increment like count
      // In production, you'd check if user already liked and implement proper like/unlike
      const updateQuery = `
        UPDATE knowledge_base_articles 
        SET like_count = like_count + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING like_count
      `;

      const updatedArticles = await db.query(updateQuery, [id]);
      const newLikeCount = updatedArticles[0].like_count;

      logger.info('Article liked', {
        articleId: id,
        userId: user.userId,
        newLikeCount
      });

      res.json({
        success: true,
        data: {
          liked: true,
          likeCount: newLikeCount
        },
        message: 'Article liked successfully'
      });

    } catch (error) {
      logger.error('Error liking article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to like article',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/categories - Get all categories with article counts
router.get('/categories',
  optionalAuth,
  async (req, res) => {
    try {
      const user = req.user;

      let whereCondition = 'ka.is_active = TRUE';
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereCondition += ' AND ka.is_public = TRUE AND ka.status = $' + paramIndex++;
        queryParams.push('published');
        whereCondition += ' AND (ka.expires_at IS NULL OR ka.expires_at > NOW())';
      }

      const query = `
        SELECT 
          category,
          subcategory,
          COUNT(*) as article_count,
          MAX(published_at) as latest_article_date
        FROM knowledge_base_articles ka
        WHERE ${whereCondition}
        GROUP BY category, subcategory
        ORDER BY category, subcategory
      `;

      const categories = await db.query(query, queryParams);

      // Group by main category
      const groupedCategories: any = {};
      categories.forEach(cat => {
        if (!groupedCategories[cat.category]) {
          groupedCategories[cat.category] = {
            name: cat.category,
            total_articles: 0,
            subcategories: [],
            latest_article_date: cat.latest_article_date
          };
        }
        
        groupedCategories[cat.category].total_articles += parseInt(cat.article_count);
        
        if (cat.subcategory) {
          groupedCategories[cat.category].subcategories.push({
            name: cat.subcategory,
            article_count: parseInt(cat.article_count),
            latest_article_date: cat.latest_article_date
          });
        }

        // Update latest date if this subcategory has a more recent article
        if (cat.latest_article_date > groupedCategories[cat.category].latest_article_date) {
          groupedCategories[cat.category].latest_article_date = cat.latest_article_date;
        }
      });

      const result = Object.values(groupedCategories);

      logger.info('Categories retrieved', {
        count: result.length,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: result,
        message: `Found ${result.length} categories`
      });

    } catch (error) {
      logger.error('Error retrieving categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/tags - Get all tags with usage counts
router.get('/tags',
  optionalAuth,
  async (req, res) => {
    try {
      const user = req.user;

      let whereCondition = 'ka.is_active = TRUE AND array_length(tags, 1) > 0';
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions
      if (!user || !['admin'].includes(user.accountType)) {
        whereCondition += ' AND ka.is_public = TRUE AND ka.status = $' + paramIndex++;
        queryParams.push('published');
        whereCondition += ' AND (ka.expires_at IS NULL OR ka.expires_at > NOW())';
      }

      const query = `
        SELECT 
          unnest(tags) as tag,
          COUNT(*) as usage_count
        FROM knowledge_base_articles ka
        WHERE ${whereCondition}
        GROUP BY tag
        ORDER BY usage_count DESC, tag ASC
      `;

      const tags = await db.query(query, queryParams);

      logger.info('Tags retrieved', {
        count: tags.length,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: tags,
        message: `Found ${tags.length} tags`
      });

    } catch (error) {
      logger.error('Error retrieving tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tags',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/v1/knowledge-base/stats - Get knowledge base statistics
router.get('/stats',
  optionalAuth,
  async (req, res) => {
    try {
      const user = req.user;

      let whereCondition = 'is_active = TRUE';
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Base visibility conditions for public stats
      if (!user || !['admin'].includes(user.accountType)) {
        whereCondition += ' AND is_public = TRUE AND status = $' + paramIndex++;
        queryParams.push('published');
        whereCondition += ' AND (expires_at IS NULL OR expires_at > NOW())';
      }

      // Get basic stats
      const statsQuery = `
        SELECT 
          COUNT(*) as total_articles,
          COUNT(DISTINCT category) as total_categories,
          SUM(view_count) as total_views,
          SUM(like_count) as total_likes,
          SUM(share_count) as total_shares,
          AVG(reading_time_minutes) as avg_reading_time,
          COUNT(*) FILTER (WHERE featured = TRUE) as featured_articles,
          COUNT(*) FILTER (WHERE sticky = TRUE) as sticky_articles
        FROM knowledge_base_articles 
        WHERE ${whereCondition}
      `;

      const stats = await db.query(statsQuery, queryParams);
      const basicStats = stats[0];

      // Get category breakdown
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as article_count,
          SUM(view_count) as category_views,
          SUM(like_count) as category_likes
        FROM knowledge_base_articles 
        WHERE ${whereCondition}
        GROUP BY category
        ORDER BY article_count DESC
        LIMIT 10
      `;

      const categories = await db.query(categoryQuery, queryParams);

      // Get popular tags
      const tagsQuery = `
        SELECT 
          unnest(tags) as tag,
          COUNT(*) as usage_count
        FROM knowledge_base_articles 
        WHERE ${whereCondition} AND array_length(tags, 1) > 0
        GROUP BY tag
        ORDER BY usage_count DESC
        LIMIT 20
      `;

      const tags = await db.query(tagsQuery, queryParams);

      const result = {
        total_articles: parseInt(basicStats.total_articles),
        total_categories: parseInt(basicStats.total_categories),
        total_views: parseInt(basicStats.total_views) || 0,
        total_likes: parseInt(basicStats.total_likes) || 0,
        total_shares: parseInt(basicStats.total_shares) || 0,
        average_reading_time: Math.round(parseFloat(basicStats.avg_reading_time) || 0),
        featured_articles: parseInt(basicStats.featured_articles),
        sticky_articles: parseInt(basicStats.sticky_articles),
        top_categories: categories.map(cat => ({
          name: cat.category,
          article_count: parseInt(cat.article_count),
          views: parseInt(cat.category_views) || 0,
          likes: parseInt(cat.category_likes) || 0
        })),
        popular_tags: tags.map(tag => ({
          name: tag.tag,
          usage_count: parseInt(tag.usage_count)
        }))
      };

      logger.info('Knowledge base stats retrieved', {
        totalArticles: result.total_articles,
        userId: user?.userId
      });

      res.json({
        success: true,
        data: result,
        message: 'Knowledge base statistics retrieved successfully'
      });

    } catch (error) {
      logger.error('Error retrieving knowledge base stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export { router as knowledgeBaseRouter };