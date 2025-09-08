/**
 * Knowledge Base Service
 * 
 * Provides API integration for knowledge base articles, categories, and search.
 */

import { apiClient } from '@/lib/api';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_type: 'markdown' | 'html' | 'text';
  content_html?: string;
  reading_time_minutes: number;
  category: string;
  subcategory?: string;
  tags: string[];
  keywords: string[];
  status: 'draft' | 'published' | 'archived' | 'deleted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  featured: boolean;
  sticky: boolean;
  published_at?: string;
  scheduled_publish_at?: string;
  expires_at?: string;
  author_id: string;
  author_name?: string;
  author_email?: string;
  editor_id?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  view_count: number;
  like_count: number;
  share_count: number;
  bookmark_count: number;
  word_count: number;
  character_count: number;
  related_articles: string[];
  related_products: string[];
  related_suppliers: string[];
  is_public: boolean;
  requires_login: boolean;
  version_number: number;
  parent_version_id?: string;
  featured_image_url?: string;
  gallery_images: string[];
  video_urls: string[];
  document_attachments: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseCategory {
  name: string;
  total_articles: number;
  subcategories: Array<{
    name: string;
    article_count: number;
    latest_article_date: string;
  }>;
  latest_article_date: string;
}

export interface KnowledgeBaseTag {
  tag: string;
  usage_count: number;
}

export interface KnowledgeBaseStats {
  total_articles: number;
  total_categories: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  average_reading_time: number;
  featured_articles: number;
  sticky_articles: number;
  top_categories: Array<{
    name: string;
    article_count: number;
    views: number;
    likes: number;
  }>;
  popular_tags: Array<{
    name: string;
    usage_count: number;
  }>;
}

export interface KnowledgeBaseSearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  tags?: string;
  status?: 'draft' | 'published' | 'archived' | 'deleted';
  featured?: boolean;
  sticky?: boolean;
  author_id?: string;
  page?: number;
  limit?: number;
  sort?: 'date' | 'views' | 'likes' | 'title' | 'updated' | 'relevance';
  order?: 'asc' | 'desc';
}

export interface KnowledgeBaseSearchResponse {
  articles: KnowledgeBaseArticle[];
  query?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateArticleData {
  title: string;
  excerpt?: string;
  content: string;
  content_type?: 'markdown' | 'html' | 'text';
  category: string;
  subcategory?: string;
  tags?: string[];
  keywords?: string[];
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  featured?: boolean;
  sticky?: boolean;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  scheduled_publish_at?: string;
  expires_at?: string;
  featured_image_url?: string;
  gallery_images?: string[];
  video_urls?: string[];
  document_attachments?: string[];
  related_articles?: string[];
  related_products?: string[];
  related_suppliers?: string[];
  is_public?: boolean;
  requires_login?: boolean;
}

export interface UpdateArticleData extends Partial<CreateArticleData> {}

class KnowledgeBaseService {
  
  /**
   * Get knowledge base articles with filtering and pagination
   */
  async getArticles(params: KnowledgeBaseSearchParams = {}): Promise<KnowledgeBaseSearchResponse> {
    const queryParams = new URLSearchParams();
    
    // Add search parameters
    if (params.category) queryParams.append('category', params.category);
    if (params.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.status) queryParams.append('status', params.status);
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params.sticky !== undefined) queryParams.append('sticky', params.sticky.toString());
    if (params.author_id) queryParams.append('author_id', params.author_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const response = await apiClient.get<{ data: KnowledgeBaseSearchResponse }>(`/knowledge-base/articles?${queryParams.toString()}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch knowledge base articles');
    }
    
    return response.data.data;
  }

  /**
   * Search knowledge base articles
   */
  async searchArticles(params: KnowledgeBaseSearchParams): Promise<KnowledgeBaseSearchResponse> {
    const queryParams = new URLSearchParams();
    
    // Add search parameters
    if (params.query) queryParams.append('q', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params.sticky !== undefined) queryParams.append('sticky', params.sticky.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const response = await apiClient.get<{ data: KnowledgeBaseSearchResponse }>(`/knowledge-base/articles/search?${queryParams.toString()}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search knowledge base articles');
    }
    
    return response.data.data;
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(limit = 10): Promise<KnowledgeBaseArticle[]> {
    const response = await apiClient.get<{ data: KnowledgeBaseArticle[] }>(`/knowledge-base/articles/featured?limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch featured articles');
    }
    
    return response.data.data;
  }

  /**
   * Get a specific article by ID
   */
  async getArticleById(id: string): Promise<KnowledgeBaseArticle> {
    const response = await apiClient.get<{ data: KnowledgeBaseArticle }>(`/knowledge-base/articles/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Article not found');
    }
    
    return response.data.data;
  }

  /**
   * Get a specific article by slug
   */
  async getArticleBySlug(slug: string): Promise<KnowledgeBaseArticle> {
    const response = await apiClient.get<{ data: KnowledgeBaseArticle }>(`/knowledge-base/articles/slug/${slug}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Article not found');
    }
    
    return response.data.data;
  }

  /**
   * Create a new article
   */
  async createArticle(articleData: CreateArticleData): Promise<KnowledgeBaseArticle> {
    const response = await apiClient.post<{ data: KnowledgeBaseArticle }>('/knowledge-base/articles', articleData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create article');
    }
    
    return response.data.data;
  }

  /**
   * Update an article
   */
  async updateArticle(id: string, updateData: UpdateArticleData): Promise<KnowledgeBaseArticle> {
    const response = await apiClient.put<{ data: KnowledgeBaseArticle }>(`/knowledge-base/articles/${id}`, updateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update article');
    }
    
    return response.data.data;
  }

  /**
   * Delete an article (soft delete)
   */
  async deleteArticle(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/knowledge-base/articles/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete article');
    }
    
    return response.data;
  }

  /**
   * Like an article
   */
  async likeArticle(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<{ data: { liked: boolean; likeCount: number } }>(`/knowledge-base/articles/${id}/like`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to like article');
    }
    
    return response.data.data;
  }

  /**
   * Get all categories with article counts
   */
  async getCategories(): Promise<KnowledgeBaseCategory[]> {
    const response = await apiClient.get<{ data: KnowledgeBaseCategory[] }>('/knowledge-base/categories');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    
    return response.data.data;
  }

  /**
   * Get all tags with usage counts
   */
  async getTags(): Promise<KnowledgeBaseTag[]> {
    const response = await apiClient.get<{ data: KnowledgeBaseTag[] }>('/knowledge-base/tags');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch tags');
    }
    
    return response.data.data;
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<KnowledgeBaseStats> {
    const response = await apiClient.get<{ data: KnowledgeBaseStats }>('/knowledge-base/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }
    
    return response.data.data;
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string, params: KnowledgeBaseSearchParams = {}): Promise<KnowledgeBaseSearchResponse> {
    return this.getArticles({ ...params, category });
  }

  /**
   * Get articles by subcategory
   */
  async getArticlesBySubcategory(
    category: string, 
    subcategory: string, 
    params: KnowledgeBaseSearchParams = {}
  ): Promise<KnowledgeBaseSearchResponse> {
    return this.getArticles({ ...params, category, subcategory });
  }

  /**
   * Get articles by tag
   */
  async getArticlesByTag(tag: string, params: KnowledgeBaseSearchParams = {}): Promise<KnowledgeBaseSearchResponse> {
    return this.getArticles({ ...params, tags: tag });
  }

  /**
   * Get recent articles
   */
  async getRecentArticles(limit = 10): Promise<KnowledgeBaseArticle[]> {
    const response = await this.getArticles({ limit, sort: 'date', order: 'desc' });
    return response.articles;
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit = 10): Promise<KnowledgeBaseArticle[]> {
    const response = await this.getArticles({ limit, sort: 'views', order: 'desc' });
    return response.articles;
  }

  /**
   * Get articles by author
   */
  async getArticlesByAuthor(authorId: string, params: KnowledgeBaseSearchParams = {}): Promise<KnowledgeBaseSearchResponse> {
    return this.getArticles({ ...params, author_id: authorId });
  }

  /**
   * Get content categories for raw feeding guides
   */
  getContentCategories(): Array<{ value: string; label: string; description?: string }> {
    return [
      { value: 'raw-feeding-basics', label: 'Raw Feeding Basics', description: 'Essential information for beginners' },
      { value: 'food-safety', label: 'Food Safety', description: 'Safe handling and preparation guidelines' },
      { value: 'nutritional-guidance', label: 'Nutritional Guidance', description: 'Balanced diet and nutritional information' },
      { value: 'breed-specific', label: 'Breed-Specific Advice', description: 'Tailored advice for different dog breeds' },
      { value: 'health-conditions', label: 'Health Conditions', description: 'Raw feeding for dogs with health issues' },
      { value: 'preparation-tips', label: 'Preparation Tips', description: 'Meal prep and storage advice' },
      { value: 'troubleshooting', label: 'Troubleshooting', description: 'Common problems and solutions' },
      { value: 'scientific-research', label: 'Scientific Research', description: 'Studies and research on raw feeding' },
      { value: 'success-stories', label: 'Success Stories', description: 'Real experiences from pet owners' },
      { value: 'product-reviews', label: 'Product Reviews', description: 'Equipment and supplier reviews' },
      { value: 'seasonal-feeding', label: 'Seasonal Feeding', description: 'Adapting diet to seasons' },
      { value: 'puppies-seniors', label: 'Puppies & Seniors', description: 'Life-stage specific feeding' }
    ];
  }

  /**
   * Get common tags for articles
   */
  getCommonTags(): string[] {
    return [
      'beginner-friendly',
      'safety',
      'nutrition',
      'health',
      'preparation',
      'storage',
      'balanced-diet',
      'raw-meat',
      'organ-meat',
      'bones',
      'supplements',
      'portion-control',
      'weight-management',
      'allergies',
      'sensitive-stomach',
      'senior-dogs',
      'puppies',
      'large-breeds',
      'small-breeds',
      'working-dogs',
      'research-backed',
      'veterinary-approved',
      'meal-planning',
      'cost-effective',
      'time-saving',
      'troubleshooting',
      'success-story'
    ];
  }
}

// Export singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;