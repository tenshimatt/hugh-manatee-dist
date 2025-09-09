import { Pool } from 'pg';
import { logger } from '../config/logger';
import { db } from '../config/database';

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  businessHours?: any;
  supplierType: string;
  productCategories: string[];
  verified: boolean;
  averageRating?: number;
  totalReviews: number;
  photos: string[];
  features: string[];
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  onlineOrdering: boolean;
  createdAt: Date;
  updatedAt: Date;
  distance?: number;
  isOpen?: boolean;
}

export interface SupplierSearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  supplierType?: string;
  searchQuery?: string;
  openNow?: boolean;
  hasDelivery?: boolean;
  hasPickup?: boolean;
  verified?: boolean;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'distance' | 'rating' | 'reviews' | 'name';
}

export class SupplierService {
  constructor() {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if supplier is currently open based on business hours
   */
  private isSupplierOpen(businessHours: any): boolean {
    if (!businessHours) return false;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
    
    const todayHours = businessHours[today];
    if (todayHours === 'closed') return false;
    
    // Handle format like "9:00-18:00"
    if (typeof todayHours === 'string' && todayHours.includes('-')) {
      const [openTime, closeTime] = todayHours.split('-');
      const openTimeNum = parseInt(openTime.replace(':', ''));
      const closeTimeNum = parseInt(closeTime.replace(':', ''));
      
      // Handle overnight hours
      if (closeTimeNum < openTimeNum) {
        return currentTime >= openTimeNum || currentTime <= closeTimeNum;
      }
      
      return currentTime >= openTimeNum && currentTime <= closeTimeNum;
    }
    
    return false;
  }

  /**
   * Convert database row to Supplier interface
   */
  private mapRowToSupplier(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      phone: row.phone,
      website: row.website,
      email: row.email,
      businessHours: row.business_hours,
      supplierType: row.supplier_type,
      productCategories: row.product_categories || [],
      verified: row.verified || false,
      averageRating: row.average_rating ? parseFloat(row.average_rating) : undefined,
      totalReviews: row.total_reviews || 0,
      photos: row.photos || [],
      features: row.features || [],
      deliveryAvailable: row.delivery_available || false,
      pickupAvailable: row.pickup_available || true,
      onlineOrdering: row.online_ordering || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Search suppliers by location with radius
   */
  async searchNearby(params: SupplierSearchParams): Promise<{ suppliers: Supplier[], total: number }> {
    const {
      latitude,
      longitude,
      radius = 25,
      supplierType,
      openNow,
      hasDelivery,
      hasPickup,
      verified,
      minRating,
      limit = 20,
      offset = 0,
      sortBy = 'distance'
    } = params;

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required for nearby search');
    }

    const database = db;
    
    try {
      // Build the query with filters
      let query = `
        SELECT s.*,
          (3959 * acos(cos(radians($1)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians($2)) + 
           sin(radians($1)) * sin(radians(latitude)))) AS distance
        FROM suppliers s
        WHERE (3959 * acos(cos(radians($1)) * cos(radians(latitude)) * 
               cos(radians(longitude) - radians($2)) + 
               sin(radians($1)) * sin(radians(latitude)))) <= $3
      `;

      const queryParams: any[] = [latitude, longitude, radius];
      let paramIndex = 4;

      // Add filters
      if (supplierType) {
        query += ` AND supplier_type = $${paramIndex}`;
        queryParams.push(supplierType);
        paramIndex++;
      }

      if (hasDelivery) {
        query += ` AND delivery_available = true`;
      }

      if (hasPickup) {
        query += ` AND pickup_available = true`;
      }

      if (verified) {
        query += ` AND verified = true`;
      }

      if (minRating) {
        query += ` AND average_rating >= $${paramIndex}`;
        queryParams.push(minRating);
        paramIndex++;
      }

      // Add sorting
      if (sortBy === 'distance') {
        query += ` ORDER BY distance ASC`;
      } else if (sortBy === 'rating') {
        query += ` ORDER BY average_rating DESC NULLS LAST`;
      } else if (sortBy === 'reviews') {
        query += ` ORDER BY total_reviews DESC`;
      } else if (sortBy === 'name') {
        query += ` ORDER BY name ASC`;
      }

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      logger.debug('Executing nearby suppliers query', {
        query,
        params: queryParams,
        searchParams: params
      });

      const result = await database.query(query, queryParams);
      
      const suppliers = result.map(row => {
        const supplier = this.mapRowToSupplier(row);
        supplier.distance = row.distance ? parseFloat(row.distance.toFixed(1)) : undefined;
        supplier.isOpen = this.isSupplierOpen(supplier.businessHours);
        
        // Filter by openNow if requested
        if (openNow && !supplier.isOpen) {
          return null;
        }
        
        return supplier;
      }).filter(Boolean) as Supplier[];

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) 
        FROM suppliers s
        WHERE (3959 * acos(cos(radians($1)) * cos(radians(latitude)) * 
               cos(radians(longitude) - radians($2)) + 
               sin(radians($1)) * sin(radians(latitude)))) <= $3
      `;
      const countResult = await database.query(countQuery, [latitude, longitude, radius]);
      const total = parseInt(countResult[0].count);

      logger.info('Nearby suppliers search completed', {
        searchParams: params,
        resultsFound: suppliers.length,
        totalInRadius: total
      });

      return { suppliers, total };
    } catch (error) {
      logger.error('Error searching nearby suppliers:', error);
      throw error;
    }
  }

  /**
   * Search suppliers by text query
   */
  async searchByText(params: SupplierSearchParams): Promise<{ suppliers: Supplier[], total: number }> {
    const {
      searchQuery,
      supplierType,
      openNow,
      hasDelivery,
      hasPickup,
      verified,
      minRating,
      limit = 20,
      offset = 0,
      sortBy = 'name'
    } = params;

    if (!searchQuery || searchQuery.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const database = db;
    
    try {
      let query = `
        SELECT s.*,
          ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || 
                  COALESCE(address, '') || ' ' || COALESCE(city, '') || ' ' || 
                  array_to_string(product_categories, ' ')), 
                  plainto_tsquery('english', $1)) as rank
        FROM suppliers s
        WHERE to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || 
              COALESCE(address, '') || ' ' || COALESCE(city, '') || ' ' || 
              array_to_string(product_categories, ' ')) @@ plainto_tsquery('english', $1)
      `;

      const queryParams: any[] = [searchQuery.trim()];
      let paramIndex = 2;

      // Add filters (same as nearby search)
      if (supplierType) {
        query += ` AND supplier_type = $${paramIndex}`;
        queryParams.push(supplierType);
        paramIndex++;
      }

      if (hasDelivery) {
        query += ` AND delivery_available = true`;
      }

      if (hasPickup) {
        query += ` AND pickup_available = true`;
      }

      if (verified) {
        query += ` AND verified = true`;
      }

      if (minRating) {
        query += ` AND average_rating >= $${paramIndex}`;
        queryParams.push(minRating);
        paramIndex++;
      }

      // Add sorting
      if (sortBy === 'name') {
        query += ` ORDER BY name ASC`;
      } else if (sortBy === 'rating') {
        query += ` ORDER BY average_rating DESC NULLS LAST`;
      } else if (sortBy === 'reviews') {
        query += ` ORDER BY total_reviews DESC`;
      } else {
        query += ` ORDER BY rank DESC, name ASC`;
      }

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      logger.debug('Executing text search suppliers query', {
        query,
        params: queryParams,
        searchParams: params
      });

      const result = await database.query(query, queryParams);
      
      const suppliers = result.map(row => {
        const supplier = this.mapRowToSupplier(row);
        supplier.isOpen = this.isSupplierOpen(supplier.businessHours);
        
        // Filter by openNow if requested
        if (openNow && !supplier.isOpen) {
          return null;
        }
        
        return supplier;
      }).filter(Boolean) as Supplier[];

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM suppliers s
        WHERE to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || 
              COALESCE(address, '') || ' ' || COALESCE(city, '') || ' ' || 
              array_to_string(product_categories, ' ')) @@ plainto_tsquery('english', $1)
      `;
      const countResult = await database.query(countQuery, [searchQuery.trim()]);
      const total = parseInt(countResult[0].count);

      logger.info('Text search suppliers completed', {
        searchQuery,
        searchParams: params,
        resultsFound: suppliers.length,
        totalMatches: total
      });

      return { suppliers, total };
    } catch (error) {
      logger.error('Error searching suppliers by text:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID
   */
  async getById(id: string): Promise<Supplier | null> {
    const database = db;
    
    try {
      const query = 'SELECT * FROM suppliers WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.length === 0) {
        return null;
      }

      const supplier = this.mapRowToSupplier(result[0]);
      supplier.isOpen = this.isSupplierOpen(supplier.businessHours);
      
      logger.info('Supplier retrieved by ID', { supplierId: id, found: true });
      return supplier;
    } catch (error) {
      logger.error('Error getting supplier by ID:', error);
      throw error;
    }
  }

  /**
   * Get all unique supplier types
   */
  async getSupplierTypes(): Promise<string[]> {
    const database = db;
    
    try {
      const query = 'SELECT DISTINCT supplier_type FROM suppliers ORDER BY supplier_type';
      const result = await database.query(query);
      
      return result.map(row => row.supplier_type);
    } catch (error) {
      logger.error('Error getting supplier types:', error);
      throw error;
    }
  }

  /**
   * Get all unique product categories
   */
  async getProductCategories(): Promise<string[]> {
    const database = db;
    
    try {
      const query = 'SELECT DISTINCT unnest(product_categories) as category FROM suppliers ORDER BY category';
      const result = await database.query(query);
      
      return result.map(row => row.category);
    } catch (error) {
      logger.error('Error getting product categories:', error);
      throw error;
    }
  }

  /**
   * Get supplier statistics
   */
  async getStats(): Promise<any> {
    const database = db;
    
    try {
      const queries = await Promise.all([
        database.query('SELECT COUNT(*) as total FROM suppliers'),
        database.query('SELECT COUNT(*) as verified FROM suppliers WHERE verified = true'),
        database.query('SELECT COUNT(*) as with_delivery FROM suppliers WHERE delivery_available = true'),
        database.query('SELECT COUNT(*) as with_pickup FROM suppliers WHERE pickup_available = true'),
        database.query('SELECT AVG(average_rating) as avg_rating FROM suppliers WHERE average_rating IS NOT NULL'),
        database.query(`
          SELECT supplier_type, COUNT(*) as count 
          FROM suppliers 
          GROUP BY supplier_type 
          ORDER BY count DESC
        `)
      ]);

      const [total, verified, delivery, pickup, avgRating, byType] = queries;

      const stats = {
        totalSuppliers: parseInt(total[0].total),
        verifiedSuppliers: parseInt(verified[0].verified),
        suppliersWithDelivery: parseInt(delivery[0].with_delivery),
        suppliersWithPickup: parseInt(pickup[0].with_pickup),
        averageRating: avgRating[0].avg_rating ? parseFloat(avgRating[0].avg_rating).toFixed(1) : null,
        suppliersByType: byType.reduce((acc, row) => {
          acc[row.supplier_type] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>)
      };

      logger.info('Supplier statistics retrieved', stats);
      return stats;
    } catch (error) {
      logger.error('Error getting supplier stats:', error);
      throw error;
    }
  }
}

export const supplierService = new SupplierService();