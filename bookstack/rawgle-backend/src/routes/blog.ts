import express from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';

const router = express.Router();

// Blog post schemas
const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  featuredImage: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().optional(),
  viewCount: z.number().default(0),
  readingTimeMinutes: z.number(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featured: z.boolean().default(false),
  commentCount: z.number().default(0),
  likeCount: z.number().default(0),
  shareCount: z.number().default(0),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Mock data for MVP - in production this would come from database
const mockBlogPosts = [
  {
    id: '1',
    title: 'The Complete Guide to Raw Dog Food Safety',
    slug: 'complete-guide-raw-dog-food-safety',
    excerpt: 'Learn essential safety protocols for handling and preparing raw dog food to keep your pet healthy and safe.',
    content: 'Raw dog food has gained popularity among pet owners seeking natural nutrition options. However, proper safety protocols are essential to prevent foodborne illnesses and ensure optimal nutrition. This comprehensive guide covers everything from sourcing quality ingredients to safe storage and preparation methods...',
    featuredImage: '/images/blog/raw-food-safety.jpg',
    category: 'nutrition',
    tags: ['raw-food', 'safety', 'nutrition', 'health'],
    status: 'published' as const,
    publishedAt: '2024-01-15T10:00:00Z',
    viewCount: 1250,
    readingTimeMinutes: 8,
    seoTitle: 'Raw Dog Food Safety Guide - RAWGLE',
    seoDescription: 'Complete guide to raw dog food safety protocols for healthy pets',
    featured: true,
    commentCount: 23,
    likeCount: 156,
    shareCount: 45,
    author: {
      id: 'author-1',
      name: 'Dr. Sarah Wilson',
      avatar: '/images/authors/dr-sarah.jpg',
      bio: 'Veterinary nutritionist with 15 years of experience in pet health.'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Understanding Your Dog\'s Nutritional Needs by Life Stage',
    slug: 'dog-nutritional-needs-by-life-stage',
    excerpt: 'Discover how your dog\'s nutritional requirements change from puppy to senior years and how to adapt their diet accordingly.',
    content: 'Dogs have varying nutritional needs throughout their lives. Puppies require higher protein and calorie density for growth, while senior dogs may need adjusted portions and specialized nutrients for joint health...',
    featuredImage: '/images/blog/life-stages.jpg',
    category: 'nutrition',
    tags: ['nutrition', 'puppies', 'senior-dogs', 'life-stages'],
    status: 'published' as const,
    publishedAt: '2024-01-12T14:30:00Z',
    viewCount: 980,
    readingTimeMinutes: 6,
    seoTitle: 'Dog Nutritional Needs by Age - RAWGLE',
    seoDescription: 'Learn how to meet your dog\'s changing nutritional needs throughout their life',
    featured: false,
    commentCount: 18,
    likeCount: 89,
    shareCount: 32,
    author: {
      id: 'author-2',
      name: 'Mike Thompson',
      avatar: '/images/authors/mike.jpg',
      bio: 'Certified animal nutritionist and raw food advocate.'
    },
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z'
  },
  {
    id: '3',
    title: 'Local Sourcing: Finding Quality Raw Food Suppliers in Your Area',
    slug: 'local-sourcing-raw-food-suppliers',
    excerpt: 'Tips for finding reliable local suppliers for fresh, quality raw dog food ingredients.',
    content: 'Supporting local suppliers not only ensures fresher ingredients but also helps build community relationships. Here\'s how to evaluate and partner with local butchers, farmers, and co-ops...',
    featuredImage: '/images/blog/local-sourcing.jpg',
    category: 'sourcing',
    tags: ['local-suppliers', 'sourcing', 'community', 'fresh-ingredients'],
    status: 'published' as const,
    publishedAt: '2024-01-10T09:15:00Z',
    viewCount: 745,
    readingTimeMinutes: 5,
    featured: true,
    commentCount: 12,
    likeCount: 67,
    shareCount: 28,
    author: {
      id: 'author-1',
      name: 'Dr. Sarah Wilson',
      avatar: '/images/authors/dr-sarah.jpg',
      bio: 'Veterinary nutritionist with 15 years of experience in pet health.'
    },
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-10T09:15:00Z'
  }
];

const mockCategories = [
  {
    id: '1',
    name: 'Nutrition',
    slug: 'nutrition',
    description: 'Articles about dog nutrition and dietary requirements',
    postCount: 15,
    color: '#22c55e',
    icon: 'nutrition'
  },
  {
    id: '2',
    name: 'Sourcing',
    slug: 'sourcing',
    description: 'Finding and evaluating raw food suppliers',
    postCount: 8,
    color: '#3b82f6',
    icon: 'sourcing'
  },
  {
    id: '3',
    name: 'Health & Safety',
    slug: 'health-safety',
    description: 'Safety protocols and health considerations',
    postCount: 12,
    color: '#ef4444',
    icon: 'health'
  }
];

// GET /api/v1/blog/posts - Get published blog posts with filtering and pagination
router.get('/posts', async (req, res) => {
  try {
    const {
      q, // search query
      category,
      tags,
      author,
      featured,
      page = '1',
      limit = '10',
      sort = 'date',
      order = 'desc'
    } = req.query;

    let filteredPosts = [...mockBlogPosts];

    // Apply filters
    if (q && typeof q === 'string') {
      const searchLower = q.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

    if (category && typeof category === 'string') {
      filteredPosts = filteredPosts.filter(post => post.category === category);
    }

    if (featured === 'true') {
      filteredPosts = filteredPosts.filter(post => post.featured);
    }

    // Sort posts
    if (sort === 'date') {
      filteredPosts.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return order === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      });
    } else if (sort === 'views') {
      filteredPosts.sort((a, b) => order === 'desc' ? b.viewCount - a.viewCount : a.viewCount - b.viewCount);
    } else if (sort === 'likes') {
      filteredPosts.sort((a, b) => order === 'desc' ? b.likeCount - a.likeCount : a.likeCount - b.likeCount);
    }

    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    const response = {
      posts: paginatedPosts,
      total: filteredPosts.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredPosts.length / limitNum),
      hasNext: endIndex < filteredPosts.length,
      hasPrev: pageNum > 1
    };

    logger.info('Blog posts retrieved', {
      total: response.total,
      page: pageNum,
      filters: { q, category, featured }
    });

    res.json({
      success: true,
      data: response,
      message: `Found ${response.total} blog posts`
    });

  } catch (error) {
    logger.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/blog/posts/featured - Get featured posts
router.get('/posts/featured', async (req, res) => {
  try {
    const { limit = '5' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    const featuredPosts = mockBlogPosts
      .filter(post => post.featured && post.status === 'published')
      .slice(0, limitNum);

    res.json({
      success: true,
      data: featuredPosts,
      message: `Found ${featuredPosts.length} featured posts`
    });
  } catch (error) {
    logger.error('Error fetching featured posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured posts'
    });
  }
});

// GET /api/v1/blog/posts/recent - Get recent posts
router.get('/posts/recent', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    const recentPosts = mockBlogPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, limitNum);

    res.json({
      success: true,
      data: recentPosts,
      message: `Found ${recentPosts.length} recent posts`
    });
  } catch (error) {
    logger.error('Error fetching recent posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent posts'
    });
  }
});

// GET /api/v1/blog/posts/popular - Get popular posts
router.get('/posts/popular', async (req, res) => {
  try {
    const { limit = '10', timeframe = 'month' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    // For MVP, sort by view count (in production, would filter by timeframe)
    const popularPosts = mockBlogPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limitNum);

    res.json({
      success: true,
      data: popularPosts,
      message: `Found ${popularPosts.length} popular posts`
    });
  } catch (error) {
    logger.error('Error fetching popular posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular posts'
    });
  }
});

// GET /api/v1/blog/posts/slug/:slug - Get post by slug
router.get('/posts/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = mockBlogPosts.find(p => p.slug === slug && p.status === 'published');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: post,
      message: 'Blog post retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching blog post by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
});

// GET /api/v1/blog/posts/:id - Get post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = mockBlogPosts.find(p => p.id === id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: post,
      message: 'Blog post retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching blog post by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
});

// POST /api/v1/blog/posts/:id/view - Increment view count
router.post('/posts/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const postIndex = mockBlogPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count (in production, would update database)
    mockBlogPosts[postIndex].viewCount += 1;

    res.json({
      success: true,
      message: 'View count updated'
    });
  } catch (error) {
    logger.error('Error updating view count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update view count'
    });
  }
});

// POST /api/v1/blog/posts/:id/like - Like a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const postIndex = mockBlogPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Toggle like (in production, would check user's like status)
    mockBlogPosts[postIndex].likeCount += 1;

    res.json({
      success: true,
      data: {
        liked: true,
        likeCount: mockBlogPosts[postIndex].likeCount
      },
      message: 'Post liked successfully'
    });
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
});

// GET /api/v1/blog/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockCategories,
      message: `Found ${mockCategories.length} categories`
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// GET /api/v1/blog/tags - Get all tags
router.get('/tags', async (req, res) => {
  try {
    const allTags = mockBlogPosts.flatMap(post => post.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tags = Object.entries(tagCounts).map(([name, count]) => ({
      name,
      count
    }));

    res.json({
      success: true,
      data: tags,
      message: `Found ${tags.length} tags`
    });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags'
    });
  }
});

// GET /api/v1/blog/stats - Get blog statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPosts = mockBlogPosts.filter(p => p.status === 'published').length;
    const totalComments = mockBlogPosts.reduce((sum, post) => sum + post.commentCount, 0);
    const totalViews = mockBlogPosts.reduce((sum, post) => sum + post.viewCount, 0);
    
    const categoryStats = mockCategories.map(cat => ({
      name: cat.name,
      count: mockBlogPosts.filter(post => post.category === cat.slug).length
    }));

    const allTags = mockBlogPosts.flatMap(post => post.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalPosts,
        totalComments,
        totalViews,
        totalSubscribers: 1250, // Mock data
        popularCategories: categoryStats,
        popularTags
      },
      message: 'Blog statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog statistics'
    });
  }
});

export { router as blogRouter };