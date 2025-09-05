import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Store data interfaces
interface BusinessHours {
  [key: string]: { open: string; close: string } | 'closed';
  monday: { open: string; close: string } | 'closed';
  tuesday: { open: string; close: string } | 'closed';
  wednesday: { open: string; close: string } | 'closed';
  thursday: { open: string; close: string } | 'closed';
  friday: { open: string; close: string } | 'closed';
  saturday: { open: string; close: string } | 'closed';
  sunday: { open: string; close: string } | 'closed';
}

interface Store {
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
  storeType: 'pet_store' | 'butcher' | 'co_op' | 'farm' | 'online';
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
}

// Query parameters schema
const QuerySchema = z.object({
  latitude: z.string().transform(val => parseFloat(val)),
  longitude: z.string().transform(val => parseFloat(val)),
  radius: z.string().transform(val => parseFloat(val)).default('25'), // miles
  storeType: z.string().optional(),
  openNow: z.string().transform(val => val === 'true').optional(),
  hasDelivery: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).default('50')
})

// Rate limiting
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `stores_search:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  
  if (record.attempts >= 200) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Check if store is currently open
function isStoreOpen(businessHours: BusinessHours): boolean {
  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = dayNames[now.getDay()]
  const currentTime = now.getHours() * 100 + now.getMinutes() // HHMM format
  
  const todayHours = businessHours[today]
  if (todayHours === 'closed') return false
  
  const openTime = parseInt(todayHours.open.replace(':', ''))
  const closeTime = parseInt(todayHours.close.replace(':', ''))
  
  // Handle overnight hours (close time < open time)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime
  }
  
  return currentTime >= openTime && currentTime <= closeTime
}

// Mock store data - in production, this would come from a database
const mockStores: Store[] = [
  {
    id: 'store_1',
    name: 'Raw Valley Premium',
    address: '123 Pet Food Lane',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'US',
    latitude: 37.7849,
    longitude: -122.4094,
    phone: '(555) 123-4567',
    website: 'https://rawvalley.com',
    businessHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '10:00', close: '18:00' }
    },
    storeType: 'pet_store',
    productCategories: ['raw_meat', 'frozen_food', 'supplements', 'treats'],
    specialties: ['Organic Raw', 'Freeze Dried', 'Supplements'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 156,
    features: ['Curbside Pickup', 'Same Day Delivery', 'Bulk Discounts'],
    certifications: ['USDA Organic', 'Local Sourced'],
    priceRange: '$$$',
    delivery: true,
    curbsidePickup: true
  },
  {
    id: 'store_2',
    name: 'Farm Fresh Market',
    address: '789 Country Road',
    city: 'San Rafael',
    state: 'CA',
    zipCode: '94901',
    country: 'US',
    latitude: 37.9735,
    longitude: -122.5311,
    phone: '(555) 456-7890',
    businessHours: {
      monday: 'closed',
      tuesday: { open: '07:00', close: '19:00' },
      wednesday: { open: '07:00', close: '19:00' },
      thursday: { open: '07:00', close: '19:00' },
      friday: { open: '07:00', close: '19:00' },
      saturday: { open: '07:00', close: '19:00' },
      sunday: { open: '07:00', close: '19:00' }
    },
    storeType: 'farm',
    productCategories: ['fresh_meat', 'organs', 'bones', 'dairy'],
    specialties: ['Local Farm Fresh', 'Free Range', 'Grass Fed'],
    isVerified: true,
    rating: 4.6,
    reviewCount: 89,
    features: ['Farm Tours', 'Weekly Delivery', 'Bulk Orders'],
    certifications: ['Free Range Certified', 'Local Farm'],
    priceRange: '$$',
    delivery: false,
    curbsidePickup: true
  },
  {
    id: 'store_3',
    name: 'Raw Co-op Collective',
    address: '654 Community Center St',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94612',
    country: 'US',
    latitude: 37.8044,
    longitude: -122.2712,
    phone: '(555) 234-5678',
    businessHours: {
      monday: 'closed',
      tuesday: 'closed',
      wednesday: 'closed',
      thursday: 'closed',
      friday: { open: '10:00', close: '16:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: 'closed'
    },
    storeType: 'co_op',
    productCategories: ['bulk_meat', 'seasonal_items', 'member_specials'],
    specialties: ['Bulk Buying', 'Member Pricing', 'Seasonal Orders'],
    isVerified: true,
    rating: 4.7,
    reviewCount: 67,
    features: ['Member Discounts', 'Monthly Orders', 'Community Events'],
    certifications: ['Co-op Member', 'Bulk Certified'],
    priceRange: '$',
    delivery: false,
    curbsidePickup: false
  },
  {
    id: 'store_4',
    name: 'Premium Butcher Shop',
    address: '321 Market Street',
    city: 'Berkeley',
    state: 'CA',
    zipCode: '94704',
    country: 'US',
    latitude: 37.8715,
    longitude: -122.2730,
    phone: '(555) 987-6543',
    businessHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '19:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '10:00', close: '16:00' }
    },
    storeType: 'butcher',
    productCategories: ['fresh_meat', 'custom_cuts', 'organs', 'bones'],
    specialties: ['Custom Cuts', 'Premium Quality', 'Local Sourcing'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 234,
    features: ['Custom Orders', 'Expert Advice', 'Quality Guarantee'],
    certifications: ['Local Sourced', 'Quality Certified'],
    priceRange: '$$',
    delivery: true,
    curbsidePickup: true
  },
  {
    id: 'store_5',
    name: 'Holistic Pet Supply',
    address: '456 Wellness Ave',
    city: 'Palo Alto',
    state: 'CA',
    zipCode: '94301',
    country: 'US',
    latitude: 37.4419,
    longitude: -122.1430,
    phone: '(555) 111-2222',
    businessHours: {
      monday: { open: '10:00', close: '19:00' },
      tuesday: { open: '10:00', close: '19:00' },
      wednesday: { open: '10:00', close: '19:00' },
      thursday: { open: '10:00', close: '19:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '11:00', close: '17:00' }
    },
    storeType: 'pet_store',
    productCategories: ['raw_food', 'holistic_supplies', 'supplements', 'natural_treats'],
    specialties: ['Holistic Health', 'Natural Products', 'Expert Consultation'],
    isVerified: true,
    rating: 4.5,
    reviewCount: 128,
    features: ['Nutritional Consultation', 'Online Ordering', 'Loyalty Program'],
    certifications: ['Holistic Certified', 'Natural Products'],
    priceRange: '$$$',
    delivery: true,
    curbsidePickup: true
  }
]

// GET /api/stores/nearby - Find stores near coordinates
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const rateLimitResult = checkRateLimit(rateLimitKey)
    
    if (!rateLimitResult.allowed) {
      const resetTimeLeft = Math.ceil((rateLimitResult.resetTime! - Date.now()) / (1000 * 60))
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many store search requests. Please try again in ${resetTimeLeft} minutes.`
        },
        { status: 429 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams))
    
    if (!queryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid query parameters',
          errors: queryResult.error.errors
        },
        { status: 400 }
      )
    }

    const { latitude, longitude, radius, storeType, openNow, hasDelivery, limit } = queryResult.data

    // Filter and calculate distances
    let filteredStores = mockStores.map(store => {
      const distance = calculateDistance(latitude, longitude, store.latitude, store.longitude)
      const isOpen = isStoreOpen(store.businessHours)
      
      return {
        ...store,
        distance: parseFloat(distance.toFixed(1)),
        isOpen
      }
    })

    // Apply filters
    filteredStores = filteredStores.filter(store => {
      // Distance filter
      if (store.distance > radius) return false
      
      // Store type filter
      if (storeType && store.storeType !== storeType) return false
      
      // Open now filter
      if (openNow && !store.isOpen) return false
      
      // Delivery filter
      if (hasDelivery && !store.delivery) return false
      
      return true
    })

    // Sort by distance
    filteredStores.sort((a, b) => a.distance - b.distance)

    // Apply limit
    filteredStores = filteredStores.slice(0, limit)

    console.log('Store search:', {
      coordinates: `${latitude}, ${longitude}`,
      radius: `${radius} miles`,
      filters: { storeType, openNow, hasDelivery },
      results: filteredStores.length
    })

    return NextResponse.json({
      success: true,
      stores: filteredStores,
      total: filteredStores.length,
      query: {
        latitude,
        longitude,
        radius,
        filters: { storeType, openNow, hasDelivery }
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('Store search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to search stores',
        error: 'Store search service unavailable'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search nearby stores.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search nearby stores.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search nearby stores.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search nearby stores.' },
    { status: 405 }
  )
}