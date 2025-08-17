/**
 * Supplier Service - Handles supplier marketplace functionality
 * Interfaces with existing Rawgle supplier database containing 9000+ suppliers
 */

import { nanoid } from 'nanoid';

export class SupplierService {
  constructor(db, kv = null, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Search suppliers with advanced filtering and pagination
   */
  async searchSuppliers(searchParams, userId = null) {
    try {
      const {
        query: searchQuery,
        category,
        location,
        state,
        city,
        radius_miles,
        latitude,
        longitude,
        verified_only = false,
        accepts_paws,
        offers_delivery,
        offers_pickup,
        min_rating,
        sort = 'relevance',
        limit = 20,
        offset = 0
      } = searchParams;

      let query = `
        SELECT s.*,
               s.review_count,
               s.rating_average as avg_rating
      `;
      
      let whereConditions = ['s.active = 1'];
      let params = [];

      // Add distance calculation if coordinates provided
      if (latitude && longitude) {
        query += `,
               (3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
               cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
               sin(radians(s.latitude)))) AS distance_miles`;
        params.push(latitude, longitude, latitude);
        
        if (radius_miles) {
          whereConditions.push(`(3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
            cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
            sin(radians(s.latitude)))) <= ?`);
          params.push(latitude, longitude, latitude, radius_miles);
        }
      }

      query += ` FROM suppliers s WHERE ${whereConditions.join(' AND ')}`;

      // Apply filters
      if (searchQuery) {
        query += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.business_name LIKE ?)`;
        const searchTerm = `%${searchQuery}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category && Array.isArray(category)) {
        const categoryConditions = category.map(() => 'JSON_EXTRACT(s.categories, "$") LIKE ?').join(' OR ');
        query += ` AND (${categoryConditions})`;
        category.forEach(cat => params.push(`%"${cat}"%`));
      } else if (category) {
        query += ` AND JSON_EXTRACT(s.categories, "$") LIKE ?`;
        params.push(`%"${category}"%`);
      }

      if (state) {
        query += ` AND s.state = ?`;
        params.push(state);
      }

      if (city) {
        query += ` AND s.city = ?`;
        params.push(city);
      }

      if (verified_only) {
        query += ` AND s.verified = 1`;
      }

      if (accepts_paws !== undefined) {
        query += ` AND s.accepts_paws = ?`;
        params.push(accepts_paws ? 1 : 0);
      }

      if (offers_delivery !== undefined) {
        query += ` AND s.offers_delivery = ?`;
        params.push(offers_delivery ? 1 : 0);
      }

      if (offers_pickup !== undefined) {
        query += ` AND s.offers_pickup = ?`;
        params.push(offers_pickup ? 1 : 0);
      }

      if (min_rating) {
        query += ` AND s.rating_average >= ?`;
        params.push(min_rating);
      }

      // Sorting
      switch (sort) {
        case 'rating':
          query += ` ORDER BY s.rating_average DESC, s.review_count DESC`;
          break;
        case 'distance':
          if (latitude && longitude) {
            query += ` ORDER BY distance_miles ASC`;
          } else {
            query += ` ORDER BY s.name ASC`;
          }
          break;
        case 'name':
          query += ` ORDER BY s.name ASC`;
          break;
        case 'newest':
          query += ` ORDER BY s.created_at DESC`;
          break;
        default: // relevance
          if (searchQuery) {
            query += ` ORDER BY 
              CASE 
                WHEN s.name LIKE ? THEN 1
                WHEN s.business_name LIKE ? THEN 2
                WHEN s.description LIKE ? THEN 3
                ELSE 4
              END, s.rating_average DESC`;
            const searchTerm = `%${searchQuery}%`;
            params.push(searchTerm, searchTerm, searchTerm);
          } else {
            query += ` ORDER BY s.featured DESC, s.rating_average DESC`;
          }
      }

      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const suppliers = await this.db.prepare(query).bind(...params).all();
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM suppliers s WHERE ${whereConditions.join(' AND ')}`;
      const countParams = params.slice(0, latitude && longitude ? 3 : 0);
      
      // Add the same filters for count
      let paramIndex = latitude && longitude ? (radius_miles ? 7 : 3) : 0;
      
      if (searchQuery) {
        countQuery += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.business_name LIKE ?)`;
        const searchTerm = `%${searchQuery}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (category && Array.isArray(category)) {
        const categoryConditions = category.map(() => 'JSON_EXTRACT(s.categories, "$") LIKE ?').join(' OR ');
        countQuery += ` AND (${categoryConditions})`;
        category.forEach(cat => countParams.push(`%"${cat}"%`));
      } else if (category) {
        countQuery += ` AND JSON_EXTRACT(s.categories, "$") LIKE ?`;
        countParams.push(`%"${category}"%`);
      }

      if (state) {
        countQuery += ` AND s.state = ?`;
        countParams.push(state);
      }

      if (city) {
        countQuery += ` AND s.city = ?`;
        countParams.push(city);
      }

      if (verified_only) {
        countQuery += ` AND s.verified = 1`;
      }

      if (accepts_paws !== undefined) {
        countQuery += ` AND s.accepts_paws = ?`;
        countParams.push(accepts_paws ? 1 : 0);
      }

      if (offers_delivery !== undefined) {
        countQuery += ` AND s.offers_delivery = ?`;
        countParams.push(offers_delivery ? 1 : 0);
      }

      if (offers_pickup !== undefined) {
        countQuery += ` AND s.offers_pickup = ?`;
        countParams.push(offers_pickup ? 1 : 0);
      }

      if (min_rating) {
        countQuery += ` AND s.rating_average >= ?`;
        countParams.push(min_rating);
      }

      const countResult = await this.db.prepare(countQuery).bind(...countParams).get();
      const total = countResult.total || 0;

      return {
        suppliers: suppliers || [],
        total,
        availableFilters: await this.getAvailableFilters()
      };
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw new Error('Failed to search suppliers');
    }
  }

  /**
   * Get available filter options
   */
  async getAvailableFilters() {
    try {
      const [states, categories] = await Promise.all([
        this.db.prepare(`SELECT DISTINCT state FROM suppliers WHERE active = 1 AND state IS NOT NULL ORDER BY state`).all(),
        this.getCategories()
      ]);

      return {
        states: states.map(row => row.state),
        categories
      };
    } catch (error) {
      console.error('Error getting available filters:', error);
      return { states: [], categories: [] };
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id, userId = null) {
    try {
      const supplier = await this.db
        .prepare(`
          SELECT s.*,
                 s.review_count,
                 s.rating_average as avg_rating
          FROM suppliers s
          WHERE s.id = ? AND s.active = 1
        `)
        .bind(id)
        .get();

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      return supplier;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw new Error('Failed to fetch supplier');
    }
  }

  /**
   * Create new supplier (for suppliers to register)
   */
  async createSupplier(supplierData) {
    const { name, description, location, category, contact_info, website } = supplierData;

    try {
      const id = nanoid();
      
      await this.db
        .prepare(`
          INSERT INTO suppliers (
            id, name, description, location, category, 
            contact_info, website, active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          name,
          description,
          location,
          category,
          JSON.stringify(contact_info),
          website,
          1,
          new Date().toISOString()
        )
        .run();

      return { id, ...supplierData };
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier');
    }
  }

  /**
   * Update supplier information
   */
  async updateSupplier(id, updateData) {
    try {
      const { name, description, location, category, contact_info, website } = updateData;

      await this.db
        .prepare(`
          UPDATE suppliers 
          SET name = ?, description = ?, location = ?, 
              category = ?, contact_info = ?, website = ?, 
              updated_at = ?
          WHERE id = ? AND active = 1
        `)
        .bind(
          name,
          description,
          location,
          category,
          JSON.stringify(contact_info),
          website,
          new Date().toISOString(),
          id
        )
        .run();

      return await this.getSupplierById(id);
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Failed to update supplier');
    }
  }

  /**
   * Get supplier categories
   */
  async getCategories() {
    try {
      // Extract unique categories from JSON arrays
      const suppliers = await this.db
        .prepare(`SELECT categories FROM suppliers WHERE active = 1 AND categories IS NOT NULL`)
        .all();

      const categoryCount = {};
      suppliers.forEach(supplier => {
        try {
          const categories = JSON.parse(supplier.categories);
          categories.forEach(category => {
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          });
        } catch (e) {
          // Skip invalid JSON
        }
      });

      return Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get locations where suppliers operate
   */
  async getLocations() {
    try {
      const locations = await this.db
        .prepare(`
          SELECT state, city, COUNT(*) as supplier_count
          FROM suppliers 
          WHERE active = 1 AND state IS NOT NULL AND city IS NOT NULL
          GROUP BY state, city 
          ORDER BY state, city
        `)
        .all();

      // Group by state
      const locationsByState = {};
      locations.forEach(location => {
        if (!locationsByState[location.state]) {
          locationsByState[location.state] = [];
        }
        locationsByState[location.state].push({
          city: location.city,
          supplier_count: location.supplier_count
        });
      });

      return locationsByState;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return {};
    }
  }

  /**
   * Get featured suppliers
   */
  async getFeaturedSuppliers({ limit = 10, category = null, userId = null }) {
    try {
      let query = `
        SELECT s.*,
               s.review_count,
               s.rating_average as avg_rating
        FROM suppliers s
        WHERE s.active = 1 AND (s.featured = 1 OR s.rating_average >= 4.5)
      `;
      
      const params = [];

      if (category) {
        query += ` AND JSON_EXTRACT(s.categories, '$') LIKE ?`;
        params.push(`%"${category}"%`);
      }

      query += ` ORDER BY s.featured DESC, s.rating_average DESC, s.review_count DESC LIMIT ?`;
      params.push(limit);

      const suppliers = await this.db.prepare(query).bind(...params).all();
      return suppliers || [];
    } catch (error) {
      console.error('Error getting featured suppliers:', error);
      return [];
    }
  }

  /**
   * Search suppliers by location proximity using Haversine formula
   */
  async searchByLocation(lat, lng, radius = 50) {
    try {
      const suppliers = await this.db
        .prepare(`
          SELECT s.*, 
                 s.review_count,
                 s.rating_average as avg_rating,
                 (3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
                 cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
                 sin(radians(s.latitude)))) AS distance_miles
          FROM suppliers s
          WHERE s.active = 1 
            AND s.latitude IS NOT NULL 
            AND s.longitude IS NOT NULL
            AND (3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(s.latitude)))) <= ?
          ORDER BY distance_miles ASC
          LIMIT 50
        `)
        .bind(lat, lng, lat, lat, lng, lat, radius)
        .all();

      return suppliers.results || suppliers || [];
    } catch (error) {
      console.error('Error searching suppliers by location:', error);
      throw new Error('Failed to search suppliers by location');
    }
  }

  /**
   * Get nearby suppliers (enhanced version of searchByLocation)
   */
  async getNearbySuppliers({ latitude, longitude, radiusMiles = 50, limit = 20, category, verifiedOnly = false, userId }) {
    try {
      let query = `
        SELECT s.*, 
               s.review_count,
               s.rating_average as avg_rating,
               (3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
               cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
               sin(radians(s.latitude)))) AS distance_miles
        FROM suppliers s
        WHERE s.active = 1 
          AND s.latitude IS NOT NULL 
          AND s.longitude IS NOT NULL
          AND (3959 * acos(cos(radians(?)) * cos(radians(s.latitude)) * 
              cos(radians(s.longitude) - radians(?)) + sin(radians(?)) * 
              sin(radians(s.latitude)))) <= ?
      `;
      
      const params = [latitude, longitude, latitude, latitude, longitude, latitude, radiusMiles];

      if (verifiedOnly) {
        query += ` AND s.verified = 1`;
      }

      if (category) {
        query += ` AND JSON_EXTRACT(s.categories, '$') LIKE ?`;
        params.push(`%"${category}"%`);
      }

      query += ` ORDER BY distance_miles ASC LIMIT ?`;
      params.push(limit);

      const suppliers = await this.db.prepare(query).bind(...params).all();
      return suppliers.results || suppliers || [];
    } catch (error) {
      console.error('Error getting nearby suppliers:', error);
      throw new Error('Failed to get nearby suppliers');
    }
  }
}