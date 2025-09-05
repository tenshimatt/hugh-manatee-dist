import { Store, BusinessHours, StoreSearchResponse, LocationSearchParams, StoreType } from '@/types/store'
import { locationService } from './locationService'

// Check if store is currently open
function isStoreOpen(businessHours: BusinessHours): boolean {
  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = dayNames[now.getDay()]
  const currentTime = now.getHours() * 100 + now.getMinutes() // HHMM format
  
  const todayHours = businessHours[today]
  if (todayHours === 'closed') return false
  
  if (typeof todayHours === 'object') {
    const openTime = parseInt(todayHours.open.replace(':', ''))
    const closeTime = parseInt(todayHours.close.replace(':', ''))
    
    // Handle overnight hours (close time < open time)
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime
    }
    
    return currentTime >= openTime && currentTime <= closeTime
  }
  
  return false
}

// Mock store data - in production, this would come from a database/API
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
    curbsidePickup: true,
    inventory: {
      'Ground Beef': { available: true, price: 24.99, stock: 15 },
      'Chicken Frames': { available: true, price: 18.50, stock: 8 },
      'Salmon Oil': { available: false, price: 32.99, stock: 0 },
      'Turkey Necks': { available: true, price: 21.99, stock: 12 }
    }
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
    curbsidePickup: true,
    inventory: {
      'Free Range Chicken': { available: true, price: 19.99, stock: 20 },
      'Grass Fed Beef': { available: true, price: 28.99, stock: 6 },
      'Duck Eggs': { available: true, price: 8.99, stock: 24 },
      'Goat Milk': { available: false, price: 12.99, stock: 0 }
    }
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
    curbsidePickup: false,
    inventory: {
      'Bulk Ground Turkey': { available: true, price: 16.99, stock: 100 },
      'Whole Chickens': { available: true, price: 22.99, stock: 50 },
      'Organ Mix': { available: true, price: 14.99, stock: 25 }
    }
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
    curbsidePickup: true,
    inventory: {
      'Prime Ribeye': { available: true, price: 35.99, stock: 8 },
      'Lamb Shoulder': { available: true, price: 22.50, stock: 5 },
      'Beef Heart': { available: true, price: 8.99, stock: 12 },
      'Marrow Bones': { available: true, price: 6.99, stock: 20 }
    }
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
    curbsidePickup: true,
    inventory: {
      'Raw Complete Meals': { available: true, price: 45.99, stock: 12 },
      'Joint Support Supplements': { available: true, price: 29.99, stock: 25 },
      'Freeze-Dried Treats': { available: true, price: 18.99, stock: 30 },
      'Bone Broth': { available: false, price: 12.99, stock: 0 }
    }
  },
  {
    id: 'store_6',
    name: 'Northern California Raw',
    address: '888 Farm-to-Table Blvd',
    city: 'Napa',
    state: 'CA',
    zipCode: '94558',
    country: 'US',
    latitude: 38.2975,
    longitude: -122.2869,
    phone: '(555) 789-0123',
    businessHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: 'closed'
    },
    storeType: 'farm',
    productCategories: ['farm_fresh', 'seasonal_produce', 'grass_fed_meat', 'raw_dairy'],
    specialties: ['Farm-to-Bowl', 'Seasonal Selections', 'Organic Certification'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 92,
    features: ['Farm Visits', 'Subscription Service', 'Educational Workshops'],
    certifications: ['USDA Organic', 'Grass Fed Certified', 'Humane Certified'],
    priceRange: '$$',
    delivery: true,
    curbsidePickup: true,
    inventory: {
      'Grass-Fed Ground Beef': { available: true, price: 26.99, stock: 35 },
      'Pasture-Raised Chicken': { available: true, price: 23.99, stock: 18 },
      'Raw Goat Milk': { available: true, price: 15.99, stock: 10 },
      'Seasonal Organ Blend': { available: true, price: 19.99, stock: 8 }
    }
  }
]

class StoreService {
  private stores: Store[] = mockStores

  /**
   * Search stores by coordinates with filters
   */
  async searchNearbyStores(params: LocationSearchParams): Promise<StoreSearchResponse> {
    const { latitude, longitude, radius, storeType, openNow, hasDelivery, hasCurbsidePickup, limit, sortBy } = params

    if (!latitude || !longitude) {
      return {
        success: false,
        stores: [],
        total: 0,
        query: params,
        error: 'Coordinates are required'
      }
    }

    try {
      // Calculate distances and apply filters
      let filteredStores = this.stores.map(store => {
        const distance = locationService.calculateDistance(latitude, longitude, store.latitude, store.longitude)
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

        // Curbside pickup filter
        if (hasCurbsidePickup && !store.curbsidePickup) return false
        
        return true
      })

      // Sort stores
      switch (sortBy) {
        case 'distance':
          filteredStores.sort((a, b) => a.distance - b.distance)
          break
        case 'rating':
          filteredStores.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'reviews':
          filteredStores.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          break
        case 'name':
          filteredStores.sort((a, b) => a.name.localeCompare(b.name))
          break
      }

      // Apply limit
      filteredStores = filteredStores.slice(0, limit)

      return {
        success: true,
        stores: filteredStores,
        total: filteredStores.length,
        query: params,
        message: `Found ${filteredStores.length} stores`
      }

    } catch (error: any) {
      console.error('Store search error:', error)
      
      return {
        success: false,
        stores: [],
        total: 0,
        query: params,
        error: 'Failed to search stores'
      }
    }
  }

  /**
   * Search stores by address
   */
  async searchStoresByAddress(address: string, params: Omit<LocationSearchParams, 'latitude' | 'longitude'>): Promise<StoreSearchResponse> {
    const locationResult = await locationService.geocodeAddress(address)
    
    if (!locationResult.success || !locationResult.location) {
      return {
        success: false,
        stores: [],
        total: 0,
        query: { ...params, address, latitude: 0, longitude: 0 },
        error: locationResult.error || 'Failed to geocode address'
      }
    }

    const searchParams: LocationSearchParams = {
      ...params,
      address,
      latitude: locationResult.location.latitude,
      longitude: locationResult.location.longitude
    }

    return await this.searchNearbyStores(searchParams)
  }

  /**
   * Get a specific store by ID
   */
  getStoreById(id: string): Store | null {
    return this.stores.find(store => store.id === id) || null
  }

  /**
   * Get all unique store types
   */
  getStoreTypes(): StoreType[] {
    const types = new Set(this.stores.map(store => store.storeType))
    return Array.from(types)
  }

  /**
   * Get all unique specialties
   */
  getSpecialties(): string[] {
    const specialties = new Set(
      this.stores.flatMap(store => store.specialties)
    )
    return Array.from(specialties).sort()
  }

  /**
   * Get all unique product categories
   */
  getProductCategories(): string[] {
    const categories = new Set(
      this.stores.flatMap(store => store.productCategories)
    )
    return Array.from(categories).sort()
  }

  /**
   * Get store statistics
   */
  getStoreStats() {
    const totalStores = this.stores.length
    const verifiedStores = this.stores.filter(store => store.isVerified).length
    const storesWithDelivery = this.stores.filter(store => store.delivery).length
    const storesWithCurbside = this.stores.filter(store => store.curbsidePickup).length
    const averageRating = this.stores
      .filter(store => store.rating)
      .reduce((sum, store) => sum + (store.rating || 0), 0) / 
      this.stores.filter(store => store.rating).length

    const storesByType = this.stores.reduce((acc, store) => {
      acc[store.storeType] = (acc[store.storeType] || 0) + 1
      return acc
    }, {} as Record<StoreType, number>)

    return {
      totalStores,
      verifiedStores,
      storesWithDelivery,
      storesWithCurbside,
      averageRating: parseFloat(averageRating.toFixed(1)),
      storesByType
    }
  }

  /**
   * Check if store is currently open
   */
  isStoreCurrentlyOpen(storeId: string): boolean {
    const store = this.getStoreById(storeId)
    if (!store) return false
    return isStoreOpen(store.businessHours)
  }

  /**
   * Get stores that are currently open
   */
  getOpenStores(): Store[] {
    return this.stores
      .map(store => ({
        ...store,
        isOpen: isStoreOpen(store.businessHours)
      }))
      .filter(store => store.isOpen)
  }
}

// Export singleton instance
export const storeService = new StoreService()
export default storeService