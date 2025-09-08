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