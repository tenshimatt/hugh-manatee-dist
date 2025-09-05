export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: BlogCategory;
  tags: string[];
  author: BlogAuthor;
  status: 'draft' | 'published' | 'archived';
  readingTime: number; // in minutes
  publishedAt: Date;
  updatedAt: Date;
  featured: boolean;
  views?: number;
}

export interface BlogAuthor {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  email?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount?: number;
}

export interface BlogSearchParams {
  query?: string;
  category?: string;
  tag?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'relevant';
  page?: number;
  limit?: number;
}

export interface BlogSearchResult {
  articles: BlogArticle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: BlogCategory;
  publishedAt: Date;
  readingTime: number;
}

// Blog constants
export const BLOG_CATEGORIES = [
  'Getting Started',
  'Nutrition & Balance',
  'Recipes & Meal Prep', 
  'Health & Wellness',
  'Puppy/Kitten Raw Feeding',
  'Common Mistakes',
  'Success Stories',
  'Seasonal Feeding'
] as const;

export const READING_SPEED_WPM = 200; // Words per minute for reading time calculation

export const ARTICLES_PER_PAGE = 6;
export const FEATURED_ARTICLES_COUNT = 1;
export const RELATED_ARTICLES_COUNT = 3;