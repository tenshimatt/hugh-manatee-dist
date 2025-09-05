/**
 * API Type Definitions
 * 
 * Shared TypeScript interfaces for API communication
 * between frontend and backend.
 */

// Base API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: {
    pagination?: PaginationMeta;
    timestamp?: string;
    requestId?: string;
  };
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  accountType: 'user' | 'business' | 'admin';
  pawsTokens: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  phone?: string;
  dateOfBirth?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
}

// Pet Management Types
export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightLbs: number;
  weightKg: number;
  gender: 'male' | 'female' | 'unknown';
  neutered: boolean;
  activityLevel: 'low' | 'moderate' | 'high' | 'very_high';
  bodyConditionScore?: number;
  avatarUrl?: string;
  medicalConditions: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  microchipId?: string;
  vetName?: string;
  vetClinic?: string;
  vetPhone?: string;
  vetAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetRequest {
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightLbs: number;
  weightKg: number;
  gender: 'male' | 'female' | 'unknown';
  neutered: boolean;
  activityLevel: 'low' | 'moderate' | 'high' | 'very_high';
  bodyConditionScore?: number;
  medicalConditions?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  microchipId?: string;
  vetName?: string;
  vetClinic?: string;
  vetPhone?: string;
  vetAddress?: string;
}

export interface UpdatePetRequest extends Partial<CreatePetRequest> {
  id: string;
}

// Feeding Entries Types
export interface FeedingEntry {
  id: string;
  petId: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodType: 'raw' | 'kibble' | 'wet' | 'freeze_dried' | 'treats';
  foodBrand?: string;
  foodProteinSource?: string;
  amountGrams: number;
  amountOz: number;
  caloriesEstimated?: number;
  notes?: string;
  photos: string[];
  createdAt: string;
}

export interface CreateFeedingEntryRequest {
  petId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodType: 'raw' | 'kibble' | 'wet' | 'freeze_dried' | 'treats';
  foodBrand?: string;
  foodProteinSource?: string;
  amountGrams: number;
  amountOz: number;
  caloriesEstimated?: number;
  notes?: string;
  photos?: string[];
}

// Weight Tracking Types
export interface WeightEntry {
  id: string;
  petId: string;
  userId: string;
  weightLbs: number;
  weightKg: number;
  bodyConditionScore?: number;
  measurementDate: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface CreateWeightEntryRequest {
  petId: string;
  weightLbs: number;
  weightKg: number;
  bodyConditionScore?: number;
  measurementDate: string;
  notes?: string;
}

// Health Records Types
export interface HealthRecord {
  id: string;
  petId: string;
  userId: string;
  recordType: 'vaccination' | 'checkup' | 'illness' | 'injury' | 'medication' | 'test_result';
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  documents: string[];
  nextAppointment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthRecordRequest {
  petId: string;
  recordType: 'vaccination' | 'checkup' | 'illness' | 'injury' | 'medication' | 'test_result';
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  clinic?: string;
  cost?: number;
  nextAppointment?: string;
}

// Supplier and Store Locator Types
export interface Supplier {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  businessHours?: Record<string, any>;
  supplierType: 'retail' | 'online' | 'farm' | 'butcher' | 'co_op';
  productCategories: string[];
  verified: boolean;
  averageRating: number;
  totalReviews: number;
  photos: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierSearchRequest {
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  supplierType?: string;
  productCategories?: string[];
  features?: string[];
  page?: number;
  limit?: number;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  supplierId: string;
  rating: number;
  title?: string;
  content: string;
  photos: string[];
  purchaseVerified: boolean;
  helpfulVotes: number;
  totalVotes: number;
  flagged: boolean;
  adminResponse?: string;
  productReviewed?: string;
  visitDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    level: string;
  };
}

export interface CreateReviewRequest {
  supplierId: string;
  rating: number;
  title?: string;
  content: string;
  productReviewed?: string;
  visitDate?: string;
}

// Chat/AI Assistant Types
export interface ChatConversation {
  id: string;
  userId: string;
  petId?: string;
  title?: string;
  status: 'active' | 'resolved' | 'archived';
  topicCategory?: 'nutrition' | 'health' | 'behavior' | 'feeding' | 'general';
  aiConfidenceScore?: number;
  escalatedToExpert: boolean;
  expertId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai' | 'expert';
  senderId?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'calculation' | 'recommendation';
  aiModelUsed?: string;
  processingTimeMs?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  petId?: string;
  metadata?: Record<string, any>;
}

// Blog Types
export interface BlogArticle {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  viewCount: number;
  readingTimeMinutes?: number;
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface BlogComment {
  id: string;
  articleId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  replies?: BlogComment[];
}

export interface CreateCommentRequest {
  articleId: string;
  content: string;
  parentCommentId?: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  timestamp: string;
  uptime: string;
  version?: string;
}