/**
 * Community Handler for Rawgle
 * Handles community posts, comments, and social features
 */

import { Hono } from 'hono';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const app = new Hono();

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000, 'Content too long'),
  post_type: z.enum(['discussion', 'question', 'success_story', 'review', 'recipe', 'tip']).default('discussion'),
  category: z.enum(['feeding', 'health', 'behavior', 'recipes', 'suppliers', 'general']),
  subcategory: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  pet_id: z.string().uuid().optional(),
  images: z.array(z.string().url()).max(5).default([])
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  parent_comment_id: z.string().uuid().optional()
});

const updatePostSchema = createPostSchema.omit({ pet_id: true }).partial();

// GET /api/community/posts - Get community posts (public)
app.get('/posts', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const {
      category,
      post_type,
      tags,
      limit = 20,
      offset = 0,
      sort = 'created_at',
      order = 'desc',
      featured = false
    } = query;
    
    let whereClause = 'WHERE cp.visibility = ?';
    const bindings = ['public'];
    
    if (category) {
      whereClause += ' AND cp.category = ?';
      bindings.push(category);
    }
    
    if (post_type) {
      whereClause += ' AND cp.post_type = ?';
      bindings.push(post_type);
    }
    
    if (featured === 'true') {
      whereClause += ' AND cp.featured = ?';
      bindings.push(true);
    }
    
    if (tags) {
      // Simple tag filtering - in production would use better JSON querying
      whereClause += ' AND cp.tags LIKE ?';
      bindings.push(`%"${tags}"%`);
    }
    
    const validSorts = ['created_at', 'upvotes', 'view_count', 'reply_count'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const posts = await c.env.DB
      .prepare(`
        SELECT cp.id, cp.title, cp.content, cp.post_type, cp.category, 
               cp.subcategory, cp.tags, cp.upvotes, cp.downvotes, cp.view_count,
               cp.reply_count, cp.featured, cp.pinned, cp.created_at,
               u.name as author_name, u.avatar_url as author_avatar,
               p.name as pet_name, p.species as pet_species
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN pets p ON cp.pet_id = p.id
        ${whereClause}
          AND cp.flagged = FALSE
          AND u.deleted_at IS NULL
        ORDER BY cp.pinned DESC, cp.${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, parseInt(limit), parseInt(offset))
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        ${whereClause}
          AND cp.flagged = FALSE
          AND u.deleted_at IS NULL
      `)
      .bind(...bindings.slice(0, -2))
      .first();
    
    const postsData = (posts.results || []).map(post => ({
      ...post,
      tags: JSON.parse(post.tags || '[]'),
      net_votes: post.upvotes - post.downvotes,
      user_vote: null // Would be populated if user is authenticated
    }));
    
    return c.json({
      success: true,
      data: {
        posts: postsData,
        pagination: {
          total: totalCount?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((totalCount?.count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    return c.json({
      success: false,
      error: 'POSTS_FETCH_FAILED',
      message: 'Failed to retrieve community posts'
    }, 500);
  }
});

// POST /api/community/posts - Create new post (requires auth)
app.post('/posts', authMiddleware, validateRequest(createPostSchema), async (c) => {
  try {
    const user = c.get('user');
    const postData = c.get('validatedData');
    
    // Verify pet ownership if pet_id provided
    if (postData.pet_id) {
      const pet = await c.env.DB
        .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
        .bind(postData.pet_id)
        .first();
      
      if (!pet || pet.user_id !== user.id) {
        return c.json({
          success: false,
          error: 'PET_NOT_FOUND',
          message: 'Pet not found or access denied'
        }, 404);
      }
    }
    
    const postId = nanoid(21);
    const now = new Date().toISOString();
    
    await c.env.DB
      .prepare(`
        INSERT INTO community_posts (
          id, user_id, title, content, post_type, category, subcategory,
          tags, pet_id, visibility, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        postId, user.id, postData.title, postData.content, postData.post_type,
        postData.category, postData.subcategory || null, JSON.stringify(postData.tags),
        postData.pet_id || null, 'public', now, now
      )
      .run();
    
    // Award PAWS for community participation
    try {
      const PAWSService = (await import('../services/paws-service.js')).PAWSService;
      const pawsService = new PAWSService(c.env.DB, c.env.KV);
      
      let pawsAmount = 15; // Base amount
      if (postData.post_type === 'recipe') pawsAmount = 25;
      if (postData.post_type === 'tip') pawsAmount = 20;
      
      await pawsService.awardTokens(user.id, pawsAmount, 'community_post_created', {
        post_id: postId,
        post_type: postData.post_type
      });
    } catch (pawsError) {
      console.warn('Failed to award PAWS tokens:', pawsError);
    }
    
    // Get the created post with author info
    const createdPost = await c.env.DB
      .prepare(`
        SELECT cp.*, u.name as author_name, u.avatar_url as author_avatar
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.id = ?
      `)
      .bind(postId)
      .first();
    
    return c.json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          ...createdPost,
          tags: JSON.parse(createdPost.tags || '[]')
        },
        paws_awarded: 15
      }
    }, 201);
  } catch (error) {
    console.error('Create community post error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'POST_CREATION_FAILED',
      message: 'Failed to create post'
    }, 500);
  }
});

// GET /api/community/posts/:id - Get specific post with comments
app.get('/posts/:id', optionalAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const postId = c.req.param('id');
    
    // Get post details
    const post = await c.env.DB
      .prepare(`
        SELECT cp.*, u.name as author_name, u.avatar_url as author_avatar,
               p.name as pet_name, p.species as pet_species
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN pets p ON cp.pet_id = p.id
        WHERE cp.id = ? AND cp.visibility = 'public'
      `)
      .bind(postId)
      .first();
    
    if (!post) {
      return c.json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found'
      }, 404);
    }
    
    // Increment view count
    await c.env.DB
      .prepare('UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?')
      .bind(postId)
      .run();
    
    // Get comments
    const comments = await c.env.DB
      .prepare(`
        SELECT cc.id, cc.content, cc.upvotes, cc.downvotes, cc.parent_comment_id,
               cc.best_answer, cc.expert_answer, cc.created_at,
               u.name as author_name, u.avatar_url as author_avatar
        FROM community_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.post_id = ? AND cc.flagged = FALSE
        ORDER BY cc.best_answer DESC, cc.expert_answer DESC, 
                 cc.upvotes DESC, cc.created_at ASC
      `)
      .bind(postId)
      .all();
    
    const postData = {
      ...post,
      tags: JSON.parse(post.tags || '[]'),
      net_votes: post.upvotes - post.downvotes,
      view_count: post.view_count + 1, // Include the increment
      comments: (comments.results || []).map(comment => ({
        ...comment,
        net_votes: comment.upvotes - comment.downvotes
      }))
    };
    
    return c.json({
      success: true,
      data: {
        post: postData
      }
    });
  } catch (error) {
    console.error('Get community post error:', error);
    return c.json({
      success: false,
      error: 'POST_FETCH_FAILED',
      message: 'Failed to retrieve post'
    }, 500);
  }
});

// POST /api/community/posts/:id/comments - Add comment to post
app.post('/posts/:id/comments', authMiddleware, validateRequest(createCommentSchema), async (c) => {
  try {
    const user = c.get('user');
    const postId = c.req.param('id');
    const { content, parent_comment_id } = c.get('validatedData');
    
    // Verify post exists and allows comments
    const post = await c.env.DB
      .prepare('SELECT allow_comments FROM community_posts WHERE id = ? AND visibility = ?')
      .bind(postId, 'public')
      .first();
    
    if (!post) {
      return c.json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found'
      }, 404);
    }
    
    if (!post.allow_comments) {
      return c.json({
        success: false,
        error: 'COMMENTS_DISABLED',
        message: 'Comments are disabled for this post'
      }, 403);
    }
    
    // Verify parent comment exists if provided
    if (parent_comment_id) {
      const parentComment = await c.env.DB
        .prepare('SELECT id FROM community_comments WHERE id = ? AND post_id = ?')
        .bind(parent_comment_id, postId)
        .first();
      
      if (!parentComment) {
        return c.json({
          success: false,
          error: 'PARENT_COMMENT_NOT_FOUND',
          message: 'Parent comment not found'
        }, 404);
      }
    }
    
    const commentId = nanoid(21);
    const now = new Date().toISOString();
    
    await c.env.DB
      .prepare(`
        INSERT INTO community_comments (
          id, post_id, user_id, parent_comment_id, content, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(commentId, postId, user.id, parent_comment_id || null, content, now, now)
      .run();
    
    // Update post reply count
    await c.env.DB
      .prepare('UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ?')
      .bind(postId)
      .run();
    
    // Award PAWS for commenting
    try {
      const PAWSService = (await import('../services/paws-service.js')).PAWSService;
      const pawsService = new PAWSService(c.env.DB, c.env.KV);
      await pawsService.awardTokens(user.id, 5, 'community_comment_created', {
        comment_id: commentId,
        post_id: postId
      });
    } catch (pawsError) {
      console.warn('Failed to award PAWS tokens:', pawsError);
    }
    
    // Get created comment with author info
    const createdComment = await c.env.DB
      .prepare(`
        SELECT cc.*, u.name as author_name, u.avatar_url as author_avatar
        FROM community_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.id = ?
      `)
      .bind(commentId)
      .first();
    
    return c.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          ...createdComment,
          net_votes: 0
        },
        paws_awarded: 5
      }
    }, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'COMMENT_CREATION_FAILED',
      message: 'Failed to create comment'
    }, 500);
  }
});

// POST /api/community/posts/:id/vote - Vote on post
app.post('/posts/:id/vote', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const postId = c.req.param('id');
    const { vote_type } = await c.req.json(); // 'upvote', 'downvote', 'remove'
    
    if (!['upvote', 'downvote', 'remove'].includes(vote_type)) {
      return c.json({
        success: false,
        error: 'INVALID_VOTE_TYPE',
        message: 'Vote type must be upvote, downvote, or remove'
      }, 400);
    }
    
    // Check if post exists
    const post = await c.env.DB
      .prepare('SELECT id FROM community_posts WHERE id = ?')
      .bind(postId)
      .first();
    
    if (!post) {
      return c.json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found'
      }, 404);
    }
    
    // For simplicity, we'll just update the vote counts directly
    // In a real app, you'd track individual votes in a separate table
    
    if (vote_type === 'upvote') {
      await c.env.DB
        .prepare('UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = ?')
        .bind(postId)
        .run();
    } else if (vote_type === 'downvote') {
      await c.env.DB
        .prepare('UPDATE community_posts SET downvotes = downvotes + 1 WHERE id = ?')
        .bind(postId)
        .run();
    }
    
    // Get updated vote counts
    const updatedPost = await c.env.DB
      .prepare('SELECT upvotes, downvotes FROM community_posts WHERE id = ?')
      .bind(postId)
      .first();
    
    return c.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: updatedPost.upvotes,
        downvotes: updatedPost.downvotes,
        net_votes: updatedPost.upvotes - updatedPost.downvotes
      }
    });
  } catch (error) {
    console.error('Vote on post error:', error);
    return c.json({
      success: false,
      error: 'VOTE_FAILED',
      message: 'Failed to record vote'
    }, 500);
  }
});

// GET /api/community/categories - Get available categories
app.get('/categories', async (c) => {
  const categories = {
    feeding: {
      name: 'Raw Feeding',
      description: 'Discussion about raw feeding practices, meal prep, and nutrition',
      subcategories: ['meal_prep', 'nutrition', 'portions', 'supplements', 'troubleshooting']
    },
    health: {
      name: 'Health & Wellness',
      description: 'Pet health topics, veterinary advice, and wellness tips',
      subcategories: ['general_health', 'digestion', 'weight_management', 'allergies', 'veterinary']
    },
    behavior: {
      name: 'Behavior & Training',
      description: 'Pet behavior, training tips, and socialization',
      subcategories: ['training', 'socialization', 'behavior_issues', 'enrichment']
    },
    recipes: {
      name: 'Recipes & Meal Ideas',
      description: 'Raw food recipes, meal ideas, and preparation tips',
      subcategories: ['dog_recipes', 'cat_recipes', 'treats', 'bone_recipes', 'organ_recipes']
    },
    suppliers: {
      name: 'Suppliers & Reviews',
      description: 'Supplier recommendations, reviews, and marketplace discussion',
      subcategories: ['supplier_reviews', 'product_reviews', 'recommendations', 'deals']
    },
    general: {
      name: 'General Discussion',
      description: 'General pet topics and community discussion',
      subcategories: ['introductions', 'success_stories', 'photos', 'off_topic']
    }
  };
  
  return c.json({
    success: true,
    data: { categories }
  });
});

export default app;