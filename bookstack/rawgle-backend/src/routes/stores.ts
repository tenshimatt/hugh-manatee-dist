import express from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import { supplierService } from '../services/supplierService';

const router = express.Router();

// Store schemas
const BusinessHoursSchema = z.object({
  monday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  tuesday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  wednesday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  thursday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  friday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  saturday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ]),
  sunday: z.union([
    z.literal('closed'),
    z.object({ open: z.string(), close: z.string() })
  ])
});

const StoreSchema = z.object({
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
  website: z.string().optional(),
  businessHours: BusinessHoursSchema,
  storeType: z.enum(['pet_store', 'farm', 'butcher', 'co_op', 'wholesaler', 'online']),
  productCategories: z.array(z.string()),
  specialties: z.array(z.string()),
  isVerified: z.boolean(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  features: z.array(z.string()),
  certifications: z.array(z.string()),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  delivery: z.boolean(),
  curbsidePickup: z.boolean(),
  inventory: z.record(z.object({
    available: z.boolean(),
    price: z.number(),
    stock: z.number()
  })).optional()
});

// Helper function to check if store is open
function isStoreOpen(businessHours: any): boolean {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
  
  const todayHours = businessHours[today];
  if (todayHours === 'closed') return false;
  
  if (typeof todayHours === 'object' && todayHours.open && todayHours.close) {
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    
    // Handle overnight hours (close time < open time)
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }
    
    return currentTime >= openTime && currentTime <= closeTime;
  }
  
  return false;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Mock store data - in production, this would come from the migrated PostgreSQL database
const mockStores = [
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
    storeType: 'pet_store' as const,
    productCategories: ['raw_meat', 'frozen_food', 'supplements', 'treats'],
    specialties: ['Organic Raw', 'Freeze Dried', 'Supplements'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 156,
    features: ['Curbside Pickup', 'Same Day Delivery', 'Bulk Discounts'],
    certifications: ['USDA Organic', 'Local Sourced'],
    priceRange: '$$$' as const,
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
      monday: 'closed' as const,
      tuesday: { open: '07:00', close: '19:00' },
      wednesday: { open: '07:00', close: '19:00' },
      thursday: { open: '07:00', close: '19:00' },
      friday: { open: '07:00', close: '19:00' },
      saturday: { open: '07:00', close: '19:00' },
      sunday: { open: '07:00', close: '19:00' }
    },
    storeType: 'farm' as const,
    productCategories: ['fresh_meat', 'organs', 'bones', 'dairy'],
    specialties: ['Local Farm Fresh', 'Free Range', 'Grass Fed'],
    isVerified: true,
    rating: 4.6,
    reviewCount: 89,
    features: ['Farm Tours', 'Weekly Delivery', 'Bulk Orders'],
    certifications: ['Free Range Certified', 'Local Farm'],
    priceRange: '$$' as const,
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
    storeType: 'butcher' as const,
    productCategories: ['fresh_meat', 'custom_cuts', 'organs', 'bones'],
    specialties: ['Custom Cuts', 'Premium Quality', 'Local Sourcing'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 234,
    features: ['Custom Orders', 'Expert Advice', 'Quality Guarantee'],
    certifications: ['Local Sourced', 'Quality Certified'],
    priceRange: '$$' as const,
    delivery: true,
    curbsidePickup: true,
    inventory: {
      'Prime Ribeye': { available: true, price: 35.99, stock: 8 },
      'Lamb Shoulder': { available: true, price: 22.50, stock: 5 },
      'Beef Heart': { available: true, price: 8.99, stock: 12 },
      'Marrow Bones': { available: true, price: 6.99, stock: 20 }
    }
  }
];

// GET /api/v1/stores/nearby - Search nearby stores with filters
router.get('/nearby', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = '25', // miles
      storeType,
      openNow,
      hasDelivery,
      hasCurbsidePickup,
      verified,
      minRating,
      limit = '20',
      sortBy = 'distance'
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const radiusNum = parseFloat(radius as string);
    const limitNum = parseInt(limit as string, 10);
    const minRatingNum = minRating ? parseFloat(minRating as string) : undefined;

    // Use real supplier service
    const { suppliers, total } = await supplierService.searchNearby({
      latitude: lat,
      longitude: lon,
      radius: radiusNum,
      supplierType: storeType as string,
      openNow: openNow === 'true',
      hasDelivery: hasDelivery === 'true',
      hasPickup: hasCurbsidePickup === 'true',
      verified: verified === 'true',
      minRating: minRatingNum,
      limit: limitNum,
      sortBy: sortBy as any
    });

    // Convert suppliers to store format for backwards compatibility
    const stores = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zipCode: supplier.zipCode || '',
      country: supplier.country || 'US',
      latitude: supplier.latitude,
      longitude: supplier.longitude,
      phone: supplier.phone,
      website: supplier.website,
      businessHours: supplier.businessHours,
      storeType: supplier.supplierType,
      productCategories: supplier.productCategories,
      specialties: supplier.features,
      isVerified: supplier.verified,
      rating: supplier.averageRating,
      reviewCount: supplier.totalReviews,
      features: supplier.features,
      certifications: [], // Could be added to database later
      priceRange: '$$$' as const, // Could be calculated or added to database
      delivery: supplier.deliveryAvailable,
      curbsidePickup: supplier.pickupAvailable,
      distance: supplier.distance,
      isOpen: supplier.isOpen
    }));

    logger.info('Store search completed', {
      query: { latitude, longitude, radius, filters: { storeType, openNow } },
      resultsFound: stores.length,
      totalInRadius: total
    });

    res.json({
      success: true,
      data: {
        stores: stores,
        total: total,
        query: {
          latitude: lat,
          longitude: lon,
          radius: radiusNum,
          filters: { storeType, openNow, hasDelivery, hasCurbsidePickup, verified, minRating }
        }
      },
      message: `Found ${stores.length} stores within ${radiusNum} miles`
    });

  } catch (error) {
    logger.error('Error searching nearby stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stores',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/stores/search - Text search stores
router.get('/search', async (req, res) => {
  try {
    const {
      q, // search query
      storeType,
      openNow,
      hasDelivery,
      hasCurbsidePickup,
      priceRange,
      limit = '20',
      sortBy = 'name'
    } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.toLowerCase().trim();
    
    // Use real supplier service for text search
    const searchParams = {
      searchQuery: searchTerm,
      supplierType: storeType as string,
      openNow: openNow === 'true',
      hasDelivery: hasDelivery === 'true',
      hasPickup: hasCurbsidePickup === 'true',
      limit: Math.min(parseInt(limit as string, 10) || 20, 50),
      sortBy: sortBy as 'distance' | 'rating' | 'reviews' | 'name'
    };

    const { suppliers, total } = await supplierService.searchByText(searchParams);

    // Convert suppliers to store format
    const filteredStores = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      description: supplier.description,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      zipCode: supplier.zipCode,
      country: supplier.country || 'US',
      latitude: supplier.latitude,
      longitude: supplier.longitude,
      phone: supplier.phone,
      website: supplier.website,
      businessHours: supplier.businessHours,
      storeType: supplier.supplierType,
      productCategories: supplier.productCategories,
      specialties: supplier.features,
      isVerified: supplier.verified,
      rating: supplier.averageRating,
      reviewCount: supplier.totalReviews,
      features: supplier.features,
      certifications: [], // Could be added to database later
      priceRange: '$$$' as const, // Could be calculated or added to database
      delivery: supplier.deliveryAvailable,
      curbsidePickup: supplier.pickupAvailable,
      isOpen: supplier.isOpen
    }));

    logger.info('Store text search completed', {
      query: q,
      resultsFound: filteredStores.length,
      filters: { storeType, openNow, hasDelivery, hasCurbsidePickup, priceRange }
    });

    res.json({
      success: true,
      data: {
        stores: filteredStores,
        total: total,
        query: {
          searchTerm: q,
          filters: { storeType, openNow, hasDelivery, hasCurbsidePickup, priceRange }
        }
      },
      message: `Found ${filteredStores.length} stores matching "${q}"`
    });

  } catch (error) {
    logger.error('Error searching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stores',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/stores/types - Get all store types
router.get('/types', async (req, res) => {
  try {
    const types = [...new Set(mockStores.map(store => store.storeType))];
    
    res.json({
      success: true,
      data: types,
      message: `Found ${types.length} store types`
    });
  } catch (error) {
    logger.error('Error fetching store types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store types'
    });
  }
});

// GET /api/v1/stores/categories - Get all product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [...new Set(mockStores.flatMap(store => store.productCategories))];
    
    res.json({
      success: true,
      data: categories,
      message: `Found ${categories.length} product categories`
    });
  } catch (error) {
    logger.error('Error fetching product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product categories'
    });
  }
});

// GET /api/v1/stores/specialties - Get all specialties
router.get('/specialties', async (req, res) => {
  try {
    const specialties = [...new Set(mockStores.flatMap(store => store.specialties))];
    
    res.json({
      success: true,
      data: specialties.sort(),
      message: `Found ${specialties.length} specialties`
    });
  } catch (error) {
    logger.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specialties'
    });
  }
});

// GET /api/v1/stores/stats - Get store statistics
router.get('/stats', async (req, res) => {
  try {
    const totalStores = mockStores.length;
    const verifiedStores = mockStores.filter(store => store.isVerified).length;
    const storesWithDelivery = mockStores.filter(store => store.delivery).length;
    const storesWithCurbside = mockStores.filter(store => store.curbsidePickup).length;
    const averageRating = mockStores
      .filter(store => store.rating)
      .reduce((sum, store) => sum + (store.rating || 0), 0) / 
      mockStores.filter(store => store.rating).length;

    const storesByType = mockStores.reduce((acc, store) => {
      acc[store.storeType] = (acc[store.storeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        totalStores,
        verifiedStores,
        storesWithDelivery,
        storesWithCurbside,
        averageRating: parseFloat(averageRating.toFixed(1)),
        storesByType
      },
      message: 'Store statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching store stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store statistics'
    });
  }
});

// GET /api/v1/stores/open - Get stores that are currently open
router.get('/open', async (req, res) => {
  try {
    const openStores = mockStores
      .map(store => ({
        ...store,
        isOpen: isStoreOpen(store.businessHours)
      }))
      .filter(store => store.isOpen);

    res.json({
      success: true,
      data: openStores,
      message: `Found ${openStores.length} stores currently open`
    });
  } catch (error) {
    logger.error('Error fetching open stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open stores'
    });
  }
});

// GET /api/v1/stores/:id - Get specific store by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const store = mockStores.find(s => s.id === id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Add current open status
    const storeWithStatus = {
      ...store,
      isOpen: isStoreOpen(store.businessHours)
    };

    res.json({
      success: true,
      data: storeWithStatus,
      message: 'Store retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching store by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store'
    });
  }
});

export { router as storesRouter };