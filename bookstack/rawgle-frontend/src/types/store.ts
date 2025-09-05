import { z } from 'zod'

// Business hours schema and interface
export const BusinessHoursSchema = z.record(
  z.union([
    z.object({
      open: z.string(),
      close: z.string()
    }),
    z.literal('closed')
  ])
)

export interface BusinessHours {
  [key: string]: { open: string; close: string } | 'closed';
  monday: { open: string; close: string } | 'closed';
  tuesday: { open: string; close: string } | 'closed';
  wednesday: { open: string; close: string } | 'closed';
  thursday: { open: string; close: string } | 'closed';
  friday: { open: string; close: string } | 'closed';
  saturday: { open: string; close: string } | 'closed';
  sunday: { open: string; close: string } | 'closed';
}

// Store type enumeration
export type StoreType = 'pet_store' | 'butcher' | 'co_op' | 'farm' | 'online'

// Store schema and interface
export const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  businessHours: BusinessHoursSchema,
  storeType: z.enum(['pet_store', 'butcher', 'co_op', 'farm', 'online']),
  productCategories: z.array(z.string()),
  specialties: z.array(z.string()),
  isVerified: z.boolean(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  distance: z.number().optional(), // Calculated from user location
  isOpen: z.boolean().optional(), // Current open status
  features: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  priceRange: z.enum(['$', '$$', '$$$']).optional(),
  delivery: z.boolean().optional(),
  curbsidePickup: z.boolean().optional(),
  inventory: z.record(z.object({
    available: z.boolean(),
    price: z.number(),
    stock: z.number()
  })).optional()
})

export interface Store {
  id: string;
  name: string;
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
  businessHours: BusinessHours;
  storeType: StoreType;
  productCategories: string[];
  specialties: string[];
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  distance?: number; // Calculated from user location
  isOpen?: boolean; // Current open status
  features?: string[];
  certifications?: string[];
  priceRange?: '$' | '$$' | '$$$';
  delivery?: boolean;
  curbsidePickup?: boolean;
  inventory?: Record<string, {
    available: boolean;
    price: number;
    stock: number;
  }>;
}

// Location detection interfaces
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: 'high' | 'medium' | 'low';
}

export interface LocationData extends LocationCoords {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  timezone?: string;
  formattedAddress?: string;
}

// Search parameters schema and interface
export const LocationSearchParamsSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  radius: z.number().min(1).max(100).default(25), // miles
  storeType: z.enum(['pet_store', 'butcher', 'co_op', 'farm', 'online']).optional(),
  openNow: z.boolean().optional(),
  hasDelivery: z.boolean().optional(),
  hasCurbsidePickup: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  sortBy: z.enum(['distance', 'rating', 'name', 'reviews']).default('distance')
})

export interface LocationSearchParams {
  latitude?: number;
  longitude?: number;
  address?: string;
  radius: number; // miles
  storeType?: StoreType;
  openNow?: boolean;
  hasDelivery?: boolean;
  hasCurbsidePickup?: boolean;
  limit: number;
  sortBy: 'distance' | 'rating' | 'name' | 'reviews';
}

// API Response interfaces
export interface LocationDetectionResponse {
  success: boolean;
  location?: LocationData;
  message: string;
  error?: string;
}

export interface StoreSearchResponse {
  success: boolean;
  stores: Store[];
  total: number;
  query: LocationSearchParams;
  message?: string;
  error?: string;
}

// Store categories for filtering
export const STORE_CATEGORIES = [
  { name: 'All', value: undefined, icon: 'MapPin' },
  { name: 'Pet Stores', value: 'pet_store', icon: 'ShoppingCart' },
  { name: 'Butcher Shops', value: 'butcher', icon: 'Utensils' },
  { name: 'Co-ops', value: 'co_op', icon: 'Users' },
  { name: 'Farms', value: 'farm', icon: 'Sprout' },
  { name: 'Online Only', value: 'online', icon: 'Globe' }
] as const

// Store specialties/product categories
export const PRODUCT_CATEGORIES = [
  'raw_meat',
  'frozen_food', 
  'freeze_dried',
  'supplements',
  'treats',
  'bones',
  'organs',
  'dairy',
  'eggs',
  'custom_cuts',
  'bulk_meat',
  'seasonal_items',
  'member_specials',
  'holistic_supplies',
  'natural_treats'
] as const

export const SPECIALTIES = [
  'Organic Raw',
  'Freeze Dried',
  'Supplements',
  'Local Farm Fresh',
  'Free Range',
  'Grass Fed',
  'Bulk Buying',
  'Member Pricing',
  'Seasonal Orders',
  'Custom Cuts',
  'Premium Quality',
  'Local Sourcing',
  'Holistic Health',
  'Natural Products',
  'Expert Consultation'
] as const

// Distance radius options
export const RADIUS_OPTIONS = [
  { label: '5 miles', value: 5 },
  { label: '10 miles', value: 10 },
  { label: '25 miles', value: 25 },
  { label: '50 miles', value: 50 },
  { label: '100 miles', value: 100 }
] as const