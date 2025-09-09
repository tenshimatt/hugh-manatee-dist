// Database Models and Types for Raw Pet Food Platform Phase 1 MVP
// Based on the comprehensive requirements for dog nutrition platform

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  password_hash: string;
  avatar_url?: string;
  account_type: 'user' | 'business' | 'admin';
  paws_tokens: number;
  level: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  phone?: string;
  date_of_birth?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  age_years?: number;
  age_months?: number;
  weight_lbs: number;
  weight_kg: number;
  gender: 'male' | 'female' | 'unknown';
  neutered: boolean;
  activity_level: 'low' | 'moderate' | 'high' | 'very_high';
  body_condition_score?: number; // 1-9 scale
  avatar_url?: string;
  medical_conditions?: string[];
  allergies?: string[];
  dietary_restrictions?: string[];
  microchip_id?: string;
  veterinarian_info?: {
    name: string;
    clinic: string;
    phone: string;
    address: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface FeedingEntry {
  id: string;
  pet_id: string;
  user_id: string;
  date: Date;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_type: 'raw' | 'kibble' | 'wet' | 'freeze_dried' | 'treats';
  food_brand?: string;
  food_protein_source?: string;
  amount_grams: number;
  amount_oz: number;
  calories_estimated?: number;
  notes?: string;
  photos?: string[];
  created_at: Date;
}

export interface WeightTracking {
  id: string;
  pet_id: string;
  user_id: string;
  weight_lbs: number;
  weight_kg: number;
  body_condition_score?: number;
  measurement_date: Date;
  notes?: string;
  photo_url?: string;
  created_at: Date;
}

export interface HealthRecord {
  id: string;
  pet_id: string;
  user_id: string;
  record_type: 'vaccination' | 'checkup' | 'illness' | 'injury' | 'medication' | 'test_result';
  title: string;
  description: string;
  date: Date;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  documents?: string[]; // URLs to uploaded documents
  next_appointment?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  business_hours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  supplier_type: 'retail' | 'online' | 'farm' | 'butcher' | 'co_op';
  product_categories: string[];
  verified: boolean;
  average_rating?: number;
  total_reviews: number;
  photos?: string[];
  features?: string[]; // e.g., 'organic', 'local', 'delivery', 'pickup'
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  supplier_id: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  photos?: string[];
  purchase_verified: boolean;
  helpful_votes: number;
  total_votes: number;
  flagged: boolean;
  admin_response?: string;
  product_reviewed?: string;
  visit_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  pet_id?: string;
  title?: string;
  status: 'active' | 'resolved' | 'archived';
  topic_category?: 'nutrition' | 'health' | 'behavior' | 'feeding' | 'general';
  ai_confidence_score?: number; // 0-1 for AI response quality
  escalated_to_expert: boolean;
  expert_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'expert';
  sender_id?: string; // null for AI, user_id or expert_id for humans
  content: string;
  message_type: 'text' | 'image' | 'file' | 'calculation' | 'recommendation';
  ai_model_used?: string;
  processing_time_ms?: number;
  metadata?: {
    pet_context?: any;
    calculation_inputs?: any;
    sources?: string[];
  };
  created_at: Date;
}

export interface BlogArticle {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Rich text/markdown
  featured_image?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  view_count: number;
  reading_time_minutes?: number;
  seo_title?: string;
  seo_description?: string;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BlogComment {
  id: string;
  article_id: string;
  user_id: string;
  parent_comment_id?: string; // For nested comments
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}

export interface PawsTransaction {
  id: string;
  user_id: string;
  type: 'earned' | 'spent' | 'transferred' | 'bonus' | 'penalty';
  amount: number;
  balance_after: number;
  source: 'review' | 'referral' | 'purchase' | 'signup_bonus' | 'transfer' | 'admin_adjustment';
  reference_id?: string; // ID of related entity (review, purchase, etc.)
  description: string;
  metadata?: any;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'points_earned' | 'review_response' | 'expert_message' | 'system_alert' | 'blog_mention';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expires_at?: Date;
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  device_info?: {
    user_agent: string;
    ip_address: string;
    device_type: string;
  };
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
}

// Utility types for database operations
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type CreatePet = Omit<Pet, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePet = Partial<Omit<Pet, 'id' | 'created_at' | 'updated_at'>>;

export type CreateSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSupplier = Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;

export type CreateReview = Omit<Review, 'id' | 'created_at' | 'updated_at' | 'helpful_votes' | 'total_votes' | 'flagged'>;
export type UpdateReview = Partial<Omit<Review, 'id' | 'user_id' | 'supplier_id' | 'created_at' | 'updated_at'>>;

export type CreateBlogArticle = Omit<BlogArticle, 'id' | 'created_at' | 'updated_at' | 'view_count'>;
export type UpdateBlogArticle = Partial<Omit<BlogArticle, 'id' | 'created_at' | 'updated_at'>>;