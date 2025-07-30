/**
 * Ethics Service
 * Handles hunting ethics knowledge base articles and educational content
 */

export class EthicsService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get articles with filtering
    async getArticles(request) {
        try {
            const { 
                q: query,
                category,
                difficultyLevel,
                status = 'published',
                featured,
                sortBy = 'created_at',
                sortOrder = 'desc',
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT ea.*, u.username as author_username, u.profile_image_url as author_image
                FROM ethics_articles ea
                JOIN users u ON ea.author_id = u.id
                WHERE ea.status = ?
            `;
            let params = [status];

            if (query) {
                sql += ` AND (ea.title LIKE ? OR ea.summary LIKE ? OR ea.content LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (category) {
                sql += ` AND ea.category = ?`;
                params.push(category);
            }

            if (difficultyLevel) {
                sql += ` AND ea.difficulty_level = ?`;
                params.push(difficultyLevel);
            }

            if (featured === 'true') {
                sql += ` AND ea.is_featured = 1`;
            }

            // Add sorting
            const validSortFields = ['created_at', 'published_at', 'title', 'views_count', 'likes_count'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            sql += ` ORDER BY ea.${sortField} ${order}`;

            sql += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const articles = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                articles: articles.results.map(article => ({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    summary: article.summary,
                    category: article.category,
                    tags: article.tags ? JSON.parse(article.tags) : [],
                    difficultyLevel: article.difficulty_level,
                    featuredImageUrl: article.featured_image_url,
                    isFeatured: article.is_featured,
                    status: article.status,
                    viewsCount: article.views_count,
                    likesCount: article.likes_count,
                    authorUsername: article.author_username,
                    authorImage: article.author_image,
                    publishedAt: article.published_at,
                    createdAt: article.created_at
                })),
                filters: {
                    query,
                    category,
                    difficultyLevel,
                    status,
                    featured,
                    sortBy,
                    sortOrder
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: articles.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get articles error:', error);
            return this.errorResponse('Failed to get articles', 500);
        }
    }

    // Create new article
    async createArticle(request) {
        try {
            const body = await request.json();
            const {
                title,
                slug,
                content,
                summary,
                category,
                tags = [],
                difficultyLevel = 'beginner',
                featuredImageUrl,
                status = 'draft'
            } = body;

            // Validate required fields
            if (!title || !content || !category) {
                return this.errorResponse('Title, content, and category are required', 400);
            }

            // Validate enums
            if (!['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
                return this.errorResponse('Invalid difficulty level', 400);
            }

            if (!['draft', 'review', 'published', 'archived'].includes(status)) {
                return this.errorResponse('Invalid status', 400);
            }

            // Generate slug if not provided
            const articleSlug = slug || this.generateSlug(title);

            // Check if slug is unique
            const existingArticle = await this.db.prepare(
                'SELECT id FROM ethics_articles WHERE slug = ?'
            ).bind(articleSlug).first();

            if (existingArticle) {
                return this.errorResponse('Article with this slug already exists', 409);
            }

            const articleId = crypto.randomUUID();
            const publishedAt = status === 'published' ? new Date().toISOString() : null;
            
            await this.db.prepare(`
                INSERT INTO ethics_articles (
                    id, author_id, title, slug, content, summary, category,
                    tags, difficulty_level, featured_image_url, status, published_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                articleId, request.user.id, title, articleSlug, content, summary, category,
                JSON.stringify(tags), difficultyLevel, featuredImageUrl, status, publishedAt
            ).run();

            // Get the created article
            const article = await this.db.prepare(
                'SELECT * FROM ethics_articles WHERE id = ?'
            ).bind(articleId).first();

            return this.successResponse({
                id: article.id,
                title: article.title,
                slug: article.slug,
                content: article.content,
                summary: article.summary,
                category: article.category,
                tags: article.tags ? JSON.parse(article.tags) : [],
                difficultyLevel: article.difficulty_level,
                featuredImageUrl: article.featured_image_url,
                isFeatured: article.is_featured,
                status: article.status,
                viewsCount: article.views_count,
                likesCount: article.likes_count,
                publishedAt: article.published_at,
                createdAt: article.created_at,
                updatedAt: article.updated_at
            });

        } catch (error) {
            console.error('Create article error:', error);
            return this.errorResponse('Failed to create article', 500);
        }
    }

    // Get single article by slug
    async getArticle(request) {
        try {
            const slug = request.params.slug;
            
            const article = await this.db.prepare(`
                SELECT ea.*, u.username as author_username, 
                       u.profile_image_url as author_image, u.bio as author_bio
                FROM ethics_articles ea
                JOIN users u ON ea.author_id = u.id
                WHERE ea.slug = ? AND ea.status = 'published'
            `).bind(slug).first();

            if (!article) {
                return this.errorResponse('Article not found', 404);
            }

            // Increment view count
            await this.db.prepare(
                'UPDATE ethics_articles SET views_count = views_count + 1 WHERE id = ?'
            ).bind(article.id).run();

            // Get related articles (same category, excluding current)
            const relatedArticles = await this.db.prepare(`
                SELECT id, title, slug, summary, featured_image_url, created_at
                FROM ethics_articles
                WHERE category = ? AND id != ? AND status = 'published'
                ORDER BY created_at DESC
                LIMIT 5
            `).bind(article.category, article.id).all();

            return this.successResponse({
                id: article.id,
                title: article.title,
                slug: article.slug,
                content: article.content,
                summary: article.summary,
                category: article.category,
                tags: article.tags ? JSON.parse(article.tags) : [],
                difficultyLevel: article.difficulty_level,
                featuredImageUrl: article.featured_image_url,
                isFeatured: article.is_featured,
                status: article.status,
                viewsCount: article.views_count + 1, // Include the incremented count
                likesCount: article.likes_count,
                authorUsername: article.author_username,
                authorImage: article.author_image,
                authorBio: article.author_bio,
                publishedAt: article.published_at,
                createdAt: article.created_at,
                updatedAt: article.updated_at,
                relatedArticles: relatedArticles.results.map(related => ({
                    id: related.id,
                    title: related.title,
                    slug: related.slug,
                    summary: related.summary,
                    featuredImageUrl: related.featured_image_url,
                    createdAt: related.created_at
                }))
            });

        } catch (error) {
            console.error('Get article error:', error);
            return this.errorResponse('Failed to get article', 500);
        }
    }

    // Update article
    async updateArticle(request) {
        try {
            const articleId = request.params.id;
            const body = await request.json();

            // Check ownership or admin role
            const article = await this.db.prepare(
                'SELECT author_id FROM ethics_articles WHERE id = ?'
            ).bind(articleId).first();

            if (!article) {
                return this.errorResponse('Article not found', 404);
            }

            const isAuthor = article.author_id === request.user.id;
            const isAdmin = request.user.role === 'admin';

            if (!isAuthor && !isAdmin) {
                return this.errorResponse('Not authorized to update this article', 403);
            }

            const {
                title,
                slug,
                content,
                summary,
                category,
                tags,
                difficultyLevel,
                featuredImageUrl,
                status,
                isFeatured
            } = body;

            // Validate enums if provided
            if (difficultyLevel && !['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
                return this.errorResponse('Invalid difficulty level', 400);
            }

            if (status && !['draft', 'review', 'published', 'archived'].includes(status)) {
                return this.errorResponse('Invalid status', 400);
            }

            // Check slug uniqueness if changing
            if (slug) {
                const existingArticle = await this.db.prepare(
                    'SELECT id FROM ethics_articles WHERE slug = ? AND id != ?'
                ).bind(slug, articleId).first();

                if (existingArticle) {
                    return this.errorResponse('Article with this slug already exists', 409);
                }
            }

            // Set published_at if status is changing to published
            let publishedAt = null;
            if (status === 'published') {
                const currentArticle = await this.db.prepare(
                    'SELECT status, published_at FROM ethics_articles WHERE id = ?'
                ).bind(articleId).first();
                
                publishedAt = currentArticle.status !== 'published' ? new Date().toISOString() : currentArticle.published_at;
            }

            // Update article
            await this.db.prepare(`
                UPDATE ethics_articles SET
                    title = COALESCE(?, title),
                    slug = COALESCE(?, slug),
                    content = COALESCE(?, content),
                    summary = COALESCE(?, summary),
                    category = COALESCE(?, category),
                    tags = COALESCE(?, tags),
                    difficulty_level = COALESCE(?, difficulty_level),
                    featured_image_url = COALESCE(?, featured_image_url),
                    status = COALESCE(?, status),
                    is_featured = COALESCE(?, is_featured),
                    published_at = COALESCE(?, published_at),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                title, slug, content, summary, category,
                tags ? JSON.stringify(tags) : null,
                difficultyLevel, featuredImageUrl, status, isFeatured,
                publishedAt, articleId
            ).run();

            // Get updated article
            const updatedArticle = await this.db.prepare(
                'SELECT * FROM ethics_articles WHERE id = ?'
            ).bind(articleId).first();

            return this.successResponse({
                id: updatedArticle.id,
                title: updatedArticle.title,
                slug: updatedArticle.slug,
                content: updatedArticle.content,
                summary: updatedArticle.summary,
                category: updatedArticle.category,
                tags: updatedArticle.tags ? JSON.parse(updatedArticle.tags) : [],
                difficultyLevel: updatedArticle.difficulty_level,
                featuredImageUrl: updatedArticle.featured_image_url,
                isFeatured: updatedArticle.is_featured,
                status: updatedArticle.status,
                viewsCount: updatedArticle.views_count,
                likesCount: updatedArticle.likes_count,
                publishedAt: updatedArticle.published_at,
                createdAt: updatedArticle.created_at,
                updatedAt: updatedArticle.updated_at
            });

        } catch (error) {
            console.error('Update article error:', error);
            return this.errorResponse('Failed to update article', 500);
        }
    }

    // Get categories with article counts
    async getCategories(request) {
        try {
            const categories = await this.db.prepare(`
                SELECT category, COUNT(*) as article_count
                FROM ethics_articles
                WHERE status = 'published'
                GROUP BY category
                ORDER BY category
            `).all();

            return this.successResponse({
                categories: categories.results.map(cat => ({
                    name: cat.category,
                    articleCount: cat.article_count,
                    displayName: this.formatCategoryName(cat.category)
                }))
            });

        } catch (error) {
            console.error('Get categories error:', error);
            return this.errorResponse('Failed to get categories', 500);
        }
    }

    // Get featured articles
    async getFeaturedArticles(request) {
        try {
            const { limit = 5 } = request.query || {};

            const articles = await this.db.prepare(`
                SELECT ea.*, u.username as author_username
                FROM ethics_articles ea
                JOIN users u ON ea.author_id = u.id
                WHERE ea.status = 'published' AND ea.is_featured = 1
                ORDER BY ea.published_at DESC
                LIMIT ?
            `).bind(parseInt(limit)).all();

            return this.successResponse({
                articles: articles.results.map(article => ({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    summary: article.summary,
                    category: article.category,
                    difficultyLevel: article.difficulty_level,
                    featuredImageUrl: article.featured_image_url,
                    viewsCount: article.views_count,
                    likesCount: article.likes_count,
                    authorUsername: article.author_username,
                    publishedAt: article.published_at
                }))
            });

        } catch (error) {
            console.error('Get featured articles error:', error);
            return this.errorResponse('Failed to get featured articles', 500);
        }
    }

    // Generate URL-friendly slug
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim('-'); // Remove leading/trailing hyphens
    }

    // Format category name for display
    formatCategoryName(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Helper methods
    successResponse(data) {
        return new Response(JSON.stringify({
            success: true,
            data
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    errorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}