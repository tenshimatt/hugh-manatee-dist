/**
 * Blog Service
 * 
 * Provides API integration for blog posts, comments, and content management.
 */

import { apiClient } from '@/lib/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  viewCount: number;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  articleId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  upvotes: number;
  downvotes: number;
  parentCommentId?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  color?: string;
  icon?: string;
}

export interface BlogSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'views' | 'likes' | 'comments' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogSearchResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class BlogService {
  
  /**
   * Get published blog posts with filtering and pagination
   */
  async getPosts(params: BlogSearchParams = {}): Promise<BlogSearchResponse> {
    const queryParams = new URLSearchParams();
    
    // Add search parameters
    if (params.query) queryParams.append('q', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    if (params.author) queryParams.append('author', params.author);
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sort', params.sortBy);
    if (params.sortOrder) queryParams.append('order', params.sortOrder);

    const response = await apiClient.get<BlogSearchResponse>(`/blog/posts?${queryParams.toString()}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch blog posts');
    }
    
    return response.data;
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedPosts(limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<BlogPost[]>(`/blog/posts/featured?limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch featured posts');
    }
    
    return response.data;
  }

  /**
   * Get recent blog posts
   */
  async getRecentPosts(limit = 10): Promise<BlogPost[]> {
    const response = await apiClient.get<BlogPost[]>(`/blog/posts/recent?limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch recent posts');
    }
    
    return response.data;
  }

  /**
   * Get popular blog posts
   */
  async getPopularPosts(limit = 10, timeframe: 'week' | 'month' | 'year' | 'all' = 'month'): Promise<BlogPost[]> {
    const response = await apiClient.get<BlogPost[]>(`/blog/posts/popular?limit=${limit}&timeframe=${timeframe}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch popular posts');
    }
    
    return response.data;
  }

  /**
   * Get related blog posts
   */
  async getRelatedPosts(postId: string, limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<BlogPost[]>(`/blog/posts/${postId}/related?limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch related posts');
    }
    
    return response.data;
  }

  /**
   * Get a specific blog post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await apiClient.get<BlogPost>(`/blog/posts/slug/${slug}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Blog post not found');
    }
    
    return response.data;
  }

  /**
   * Get a specific blog post by ID
   */
  async getPostById(id: string): Promise<BlogPost> {
    const response = await apiClient.get<BlogPost>(`/blog/posts/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Blog post not found');
    }
    
    return response.data;
  }

  /**
   * Increment view count for a blog post
   */
  async incrementViewCount(postId: string): Promise<void> {
    await apiClient.post(`/blog/posts/${postId}/view`);
  }

  /**
   * Like a blog post
   */
  async likePost(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<{ liked: boolean; likeCount: number }>(`/blog/posts/${postId}/like`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to like post');
    }
    
    return response.data;
  }

  /**
   * Unlike a blog post
   */
  async unlikePost(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.delete<{ liked: boolean; likeCount: number }>(`/blog/posts/${postId}/like`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to unlike post');
    }
    
    return response.data;
  }

  /**
   * Share a blog post (increment share count)
   */
  async sharePost(postId: string, platform: string): Promise<{ shareCount: number }> {
    const response = await apiClient.post<{ shareCount: number }>(`/blog/posts/${postId}/share`, { platform });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to record share');
    }
    
    return response.data;
  }

  /**
   * Get blog categories
   */
  async getCategories(): Promise<BlogCategory[]> {
    const response = await apiClient.get<BlogCategory[]>('/blog/categories');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    
    return response.data;
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(categorySlug: string, page = 1, limit = 10): Promise<BlogSearchResponse> {
    const response = await apiClient.get<BlogSearchResponse>(
      `/blog/categories/${categorySlug}/posts?page=${page}&limit=${limit}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch posts for category');
    }
    
    return response.data;
  }

  /**
   * Get all available tags
   */
  async getTags(): Promise<Array<{ name: string; count: number }>> {
    const response = await apiClient.get<Array<{ name: string; count: number }>>('/blog/tags');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch tags');
    }
    
    return response.data;
  }

  /**
   * Get posts by tag
   */
  async getPostsByTag(tag: string, page = 1, limit = 10): Promise<BlogSearchResponse> {
    const response = await apiClient.get<BlogSearchResponse>(
      `/blog/tags/${encodeURIComponent(tag)}/posts?page=${page}&limit=${limit}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch posts for tag');
    }
    
    return response.data;
  }

  /**
   * Search blog posts
   */
  async searchPosts(query: string, page = 1, limit = 10): Promise<BlogSearchResponse> {
    const response = await apiClient.get<BlogSearchResponse>(
      `/blog/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search posts');
    }
    
    return response.data;
  }

  /**
   * Get comments for a blog post
   */
  async getPostComments(postId: string, page = 1, limit = 20): Promise<{
    comments: BlogComment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await apiClient.get(
      `/blog/posts/${postId}/comments?page=${page}&limit=${limit}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch comments');
    }
    
    return response.data;
  }

  /**
   * Add a comment to a blog post
   */
  async addComment(postId: string, content: string, parentCommentId?: string): Promise<BlogComment> {
    const response = await apiClient.post<BlogComment>(`/blog/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add comment');
    }
    
    return response.data;
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<BlogComment> {
    const response = await apiClient.put<BlogComment>(`/blog/comments/${commentId}`, { content });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update comment');
    }
    
    return response.data;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/blog/comments/${commentId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete comment');
    }
    
    return response.data;
  }

  /**
   * Vote on a comment
   */
  async voteComment(commentId: string, vote: 'up' | 'down'): Promise<{
    upvotes: number;
    downvotes: number;
    userVote: 'up' | 'down' | null;
  }> {
    const response = await apiClient.post(`/blog/comments/${commentId}/vote`, { vote });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to vote on comment');
    }
    
    return response.data;
  }

  /**
   * Report a comment
   */
  async reportComment(commentId: string, reason: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/blog/comments/${commentId}/report`, { reason });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to report comment');
    }
    
    return response.data;
  }

  /**
   * Subscribe to blog newsletter
   */
  async subscribeNewsletter(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/blog/newsletter/subscribe', { email });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to subscribe to newsletter');
    }
    
    return response.data;
  }

  /**
   * Unsubscribe from blog newsletter
   */
  async unsubscribeNewsletter(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/blog/newsletter/unsubscribe', { token });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to unsubscribe from newsletter');
    }
    
    return response.data;
  }

  /**
   * Get blog statistics
   */
  async getBlogStats(): Promise<{
    totalPosts: number;
    totalComments: number;
    totalViews: number;
    totalSubscribers: number;
    popularCategories: Array<{ name: string; count: number }>;
    popularTags: Array<{ name: string; count: number }>;
  }> {
    const response = await apiClient.get('/blog/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch blog statistics');
    }
    
    return response.data;
  }

  /**
   * Get RSS feed URL
   */
  getRSSFeedUrl(): string {
    return `${process.env.NODE_ENV === 'production' 
      ? 'https://api.rawgle.com' 
      : 'http://localhost:8000'}/blog/feed`;
  }

  /**
   * Get sitemap URL
   */
  getSitemapUrl(): string {
    return `${process.env.NODE_ENV === 'production' 
      ? 'https://api.rawgle.com' 
      : 'http://localhost:8000'}/blog/sitemap.xml`;
  }
}

// Export singleton instance
export const blogService = new BlogService();
export default blogService;