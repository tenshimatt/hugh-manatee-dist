// Supplier Service
// Manages suppliers and marketplace functionality for both platforms

export class SupplierService {
  constructor(db, kv, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Create a new supplier
   * @param {Object} supplierData 
   * @param {string} createdBy - User ID of creator
   * @returns {Promise<Object>}
   */
  async createSupplier(supplierData, createdBy) {
    const { 
      name, 
      businessName, 
      email, 
      phone, 
      website,
      description,
      address, 
      city, 
      state, 
      country = 'US',
      postalCode,
      latitude,
      longitude,
      serviceRadiusMiles,
      platformAccess = ['rawgle'],
      rawgleCategories = [],
      gohuntaCategories = []
    } = supplierData;

    // Validate required fields
    if (!name) {
      throw new Error('Supplier name is required');
    }

    if (name.length < 2 || name.length > 100) {
      throw new Error('Supplier name must be between 2 and 100 characters');
    }

    if (!city || !state) {
      throw new Error('City and state are required');
    }

    // Validate platform access
    const validPlatforms = ['rawgle', 'gohunta', 'both'];
    if (!Array.isArray(platformAccess) || platformAccess.length === 0) {
      throw new Error('Platform access is required');
    }

    for (const platform of platformAccess) {
      if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform access: ${platform}`);
      }
    }

    // Validate email format
    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      if (!this.isValidCoordinates(latitude, longitude)) {
        throw new Error('Invalid GPS coordinates');
      }
    }

    // Validate service radius
    if (serviceRadiusMiles && (serviceRadiusMiles < 0 || serviceRadiusMiles > 1000)) {
      throw new Error('Service radius must be between 0 and 1000 miles');
    }

    try {
      const supplierId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db
        .prepare(`
          INSERT INTO suppliers (
            id, name, business_name, platform_access, email, phone, website, description,
            address, city, state, country, postal_code, latitude, longitude, service_radius_miles,
            rawgle_categories, gohunta_categories, rating_average, review_count,
            verified, featured, active, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `)
        .bind(
          supplierId, name, businessName, JSON.stringify(platformAccess), email, phone, website, description,
          address, city, state, country, postalCode, latitude, longitude, serviceRadiusMiles,
          JSON.stringify(rawgleCategories), JSON.stringify(gohuntaCategories), 0.0, 0,
          false, false, true, now, now
        )
        .run();

      // Log supplier creation
      await this.logSupplierAction(createdBy, supplierId, 'supplier_created', { platformAccess });

      return await this.getSupplier(supplierId);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
        throw error;
      }
      console.error('Create supplier error:', error);
      throw new Error('Failed to create supplier');
    }
  }

  /**
   * Get supplier by ID
   * @param {string} supplierId 
   * @param {string} requestingUserId - For analytics
   * @returns {Promise<Object>}
   */
  async getSupplier(supplierId, requestingUserId = null) {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    try {
      const supplier = await this.db
        .prepare(`
          SELECT * FROM suppliers 
          WHERE id = ? AND active = 1
        `)
        .bind(supplierId)
        .first();

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const supplierData = {
        id: supplier.id,
        name: supplier.name,
        businessName: supplier.business_name,
        platformAccess: JSON.parse(supplier.platform_access || '[]'),
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        description: supplier.description,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        postalCode: supplier.postal_code,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        serviceRadiusMiles: supplier.service_radius_miles,
        businessLicense: supplier.business_license,
        certifications: this.jsonParse(supplier.certifications),
        insuranceInfo: this.jsonParse(supplier.insurance_info),
        rawgleCategories: JSON.parse(supplier.rawgle_categories || '[]'),
        gohuntaCategories: JSON.parse(supplier.gohunta_categories || '[]'),
        ratingAverage: supplier.rating_average,
        reviewCount: supplier.review_count,
        verified: Boolean(supplier.verified),
        featured: Boolean(supplier.featured),
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at
      };

      // Log supplier view for analytics
      if (requestingUserId) {
        await this.logSupplierAction(requestingUserId, supplierId, 'supplier_viewed');
      }

      return supplierData;
    } catch (error) {
      if (error.message === 'Supplier not found') {
        throw error;
      }
      console.error('Get supplier error:', error);
      throw new Error('Failed to retrieve supplier');
    }
  }

  /**
   * Update supplier information
   * @param {string} supplierId 
   * @param {Object} updates 
   * @param {string} updatedBy - User ID
   * @returns {Promise<Object>}
   */
  async updateSupplier(supplierId, updates, updatedBy) {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    // Check if supplier exists
    const existingSupplier = await this.db
      .prepare('SELECT id FROM suppliers WHERE id = ? AND active = 1')
      .bind(supplierId)
      .first();

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    // TODO: Add permission check - only supplier owner or admin can update

    // Validate updates
    const allowedFields = [
      'name', 'business_name', 'platform_access', 'email', 'phone', 'website', 'description',
      'address', 'city', 'state', 'postal_code', 'latitude', 'longitude', 'service_radius_miles',
      'business_license', 'certifications', 'insurance_info', 'rawgle_categories', 'gohunta_categories'
    ];

    const validUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Validate specific fields
    if (validUpdates.name && (validUpdates.name.length < 2 || validUpdates.name.length > 100)) {
      throw new Error('Supplier name must be between 2 and 100 characters');
    }

    if (validUpdates.email && !this.isValidEmail(validUpdates.email)) {
      throw new Error('Invalid email format');
    }

    if (validUpdates.latitude !== undefined && validUpdates.longitude !== undefined) {
      if (!this.isValidCoordinates(validUpdates.latitude, validUpdates.longitude)) {
        throw new Error('Invalid GPS coordinates');
      }
    }

    if (validUpdates.service_radius_miles && (validUpdates.service_radius_miles < 0 || validUpdates.service_radius_miles > 1000)) {
      throw new Error('Service radius must be between 0 and 1000 miles');
    }

    try {
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(validUpdates)) {
        if (['platform_access', 'certifications', 'insurance_info', 'rawgle_categories', 'gohunta_categories'].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(supplierId);

      await this.db
        .prepare(`UPDATE suppliers SET ${updateFields.join(', ')} WHERE id = ?`)
        .bind(...updateValues)
        .run();

      // Log supplier update
      await this.logSupplierAction(updatedBy, supplierId, 'supplier_updated', { 
        updatedFields: Object.keys(validUpdates) 
      });

      return await this.getSupplier(supplierId);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
        throw error;
      }
      console.error('Update supplier error:', error);
      throw new Error('Failed to update supplier');
    }
  }

  /**
   * Search suppliers
   * @param {Object} searchCriteria 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async searchSuppliers(searchCriteria, options = {}) {
    const {
      query,
      platform,
      category,
      city,
      state,
      country = 'US',
      latitude,
      longitude,
      radiusMiles = 50,
      verified,
      featured
    } = searchCriteria;

    const {
      limit = 20,
      offset = 0,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = options;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    const validSortFields = ['rating', 'name', 'created_at', 'review_count'];
    if (!validSortFields.includes(sortBy)) {
      throw new Error('Invalid sort field');
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      throw new Error('Invalid sort order');
    }

    try {
      let searchQuery = `
        SELECT *, 
        ${latitude && longitude ? 
          `(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
           sin(radians(latitude)))) AS distance` : 
          '0 AS distance'
        }
        FROM suppliers 
        WHERE active = 1
      `;

      const params = [];
      
      // Add distance calculation parameters
      if (latitude && longitude) {
        params.push(latitude, longitude, latitude);
      }

      // Text search
      if (query) {
        searchQuery += ' AND (name LIKE ? OR business_name LIKE ? OR description LIKE ?)';
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Platform filter
      if (platform) {
        searchQuery += ' AND (JSON_EXTRACT(platform_access, "$[0]") = ? OR JSON_EXTRACT(platform_access, "$[1]") = ? OR JSON_EXTRACT(platform_access, "$[0]") = "both")';
        params.push(platform, platform);
      }

      // Category filter
      if (category && platform) {
        const categoryField = platform === 'rawgle' ? 'rawgle_categories' : 'gohunta_categories';
        searchQuery += ` AND JSON_EXTRACT(${categoryField}, "$") LIKE ?`;
        params.push(`%"${category}"%`);
      }

      // Location filters
      if (city) {
        searchQuery += ' AND city LIKE ?';
        params.push(`%${city}%`);
      }

      if (state) {
        searchQuery += ' AND state = ?';
        params.push(state);
      }

      if (country) {
        searchQuery += ' AND country = ?';
        params.push(country);
      }

      // Geographic radius filter
      if (latitude && longitude && radiusMiles) {
        searchQuery += ` HAVING distance <= ?`;
        params.push(radiusMiles);
      }

      // Verification filter
      if (verified !== undefined) {
        searchQuery += ' AND verified = ?';
        params.push(verified ? 1 : 0);
      }

      // Featured filter
      if (featured !== undefined) {
        searchQuery += ' AND featured = ?';
        params.push(featured ? 1 : 0);
      }

      // Sorting
      const sortField = sortBy === 'rating' ? 'rating_average' : sortBy;
      searchQuery += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

      // Pagination
      searchQuery += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const suppliers = await this.db
        .prepare(searchQuery)
        .bind(...params)
        .all();

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM suppliers 
        WHERE active = 1
      `;
      const countParams = [];

      // Apply same filters for count (excluding distance calculation)
      if (query) {
        countQuery += ' AND (name LIKE ? OR business_name LIKE ? OR description LIKE ?)';
        const searchTerm = `%${query}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (platform) {
        countQuery += ' AND (JSON_EXTRACT(platform_access, "$[0]") = ? OR JSON_EXTRACT(platform_access, "$[1]") = ? OR JSON_EXTRACT(platform_access, "$[0]") = "both")';
        countParams.push(platform, platform);
      }

      if (category && platform) {
        const categoryField = platform === 'rawgle' ? 'rawgle_categories' : 'gohunta_categories';
        countQuery += ` AND JSON_EXTRACT(${categoryField}, "$") LIKE ?`;
        countParams.push(`%"${category}"%`);
      }

      if (city) {
        countQuery += ' AND city LIKE ?';
        countParams.push(`%${city}%`);
      }

      if (state) {
        countQuery += ' AND state = ?';
        countParams.push(state);
      }

      if (country) {
        countQuery += ' AND country = ?';
        countParams.push(country);
      }

      if (verified !== undefined) {
        countQuery += ' AND verified = ?';
        countParams.push(verified ? 1 : 0);
      }

      if (featured !== undefined) {
        countQuery += ' AND featured = ?';
        countParams.push(featured ? 1 : 0);
      }

      const countResult = await this.db
        .prepare(countQuery)
        .bind(...countParams)
        .first();

      const results = suppliers.results.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        businessName: supplier.business_name,
        platformAccess: JSON.parse(supplier.platform_access || '[]'),
        description: supplier.description,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        ratingAverage: supplier.rating_average,
        reviewCount: supplier.review_count,
        verified: Boolean(supplier.verified),
        featured: Boolean(supplier.featured),
        distance: supplier.distance,
        rawgleCategories: JSON.parse(supplier.rawgle_categories || '[]'),
        gohuntaCategories: JSON.parse(supplier.gohunta_categories || '[]')
      }));

      return {
        suppliers: results,
        pagination: {
          total: countResult.total,
          limit,
          offset,
          hasMore: offset + limit < countResult.total
        },
        searchCriteria: {
          ...searchCriteria,
          radiusMiles
        }
      };
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('cannot exceed')) {
        throw error;
      }
      console.error('Search suppliers error:', error);
      throw new Error('Failed to search suppliers');
    }
  }

  /**
   * Get suppliers by location
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radiusMiles 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async getSuppliersByLocation(latitude, longitude, radiusMiles = 25, options = {}) {
    if (!this.isValidCoordinates(latitude, longitude)) {
      throw new Error('Invalid GPS coordinates');
    }

    if (radiusMiles < 0 || radiusMiles > 500) {
      throw new Error('Radius must be between 0 and 500 miles');
    }

    return await this.searchSuppliers({
      latitude,
      longitude,
      radiusMiles
    }, options);
  }

  /**
   * Get featured suppliers
   * @param {'rawgle' | 'gohunta'} platform 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async getFeaturedSuppliers(platform, options = {}) {
    const { limit = 10, category } = options;

    try {
      const searchCriteria = {
        platform,
        featured: true
      };

      if (category) {
        searchCriteria.category = category;
      }

      const result = await this.searchSuppliers(searchCriteria, {
        limit,
        sortBy: 'rating',
        sortOrder: 'desc'
      });

      return result.suppliers;
    } catch (error) {
      console.error('Get featured suppliers error:', error);
      throw new Error('Failed to get featured suppliers');
    }
  }

  /**
   * Update supplier verification status
   * @param {string} supplierId 
   * @param {boolean} verified 
   * @param {string} adminUserId 
   * @returns {Promise<void>}
   */
  async updateVerificationStatus(supplierId, verified, adminUserId) {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    // TODO: Add admin permission check

    try {
      const supplier = await this.db
        .prepare('SELECT id FROM suppliers WHERE id = ? AND active = 1')
        .bind(supplierId)
        .first();

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      await this.db
        .prepare('UPDATE suppliers SET verified = ?, updated_at = ? WHERE id = ?')
        .bind(verified ? 1 : 0, new Date().toISOString(), supplierId)
        .run();

      // Log verification update
      await this.logSupplierAction(adminUserId, supplierId, 'verification_updated', { 
        verified, 
        adminAction: true 
      });

    } catch (error) {
      if (error.message === 'Supplier not found') {
        throw error;
      }
      console.error('Update verification status error:', error);
      throw new Error('Failed to update verification status');
    }
  }

  /**
   * Update supplier rating
   * @param {string} supplierId 
   * @param {number} newRating 
   * @param {number} reviewCount 
   * @returns {Promise<void>}
   */
  async updateRating(supplierId, newRating, reviewCount) {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    if (reviewCount < 0) {
      throw new Error('Review count cannot be negative');
    }

    try {
      await this.db
        .prepare('UPDATE suppliers SET rating_average = ?, review_count = ?, updated_at = ? WHERE id = ?')
        .bind(newRating, reviewCount, new Date().toISOString(), supplierId)
        .run();
    } catch (error) {
      console.error('Update rating error:', error);
      throw new Error('Failed to update supplier rating');
    }
  }

  /**
   * Soft delete supplier
   * @param {string} supplierId 
   * @param {string} deletedBy 
   * @returns {Promise<void>}
   */
  async deleteSupplier(supplierId, deletedBy) {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    try {
      const supplier = await this.db
        .prepare('SELECT id FROM suppliers WHERE id = ? AND active = 1')
        .bind(supplierId)
        .first();

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      await this.db
        .prepare('UPDATE suppliers SET active = 0, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), supplierId)
        .run();

      // Log supplier deletion
      await this.logSupplierAction(deletedBy, supplierId, 'supplier_deleted');

      // TODO: Handle related data cleanup (products, etc.)
    } catch (error) {
      if (error.message === 'Supplier not found') {
        throw error;
      }
      console.error('Delete supplier error:', error);
      throw new Error('Failed to delete supplier');
    }
  }

  // Helper methods

  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate GPS coordinates
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  isValidCoordinates(latitude, longitude) {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Safe JSON parse
   * @param {string} value 
   * @returns {any}
   */
  jsonParse(value) {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Log supplier action for analytics
   * @param {string} userId 
   * @param {string} supplierId 
   * @param {string} action 
   * @param {Object} details 
   * @returns {Promise<void>}
   */
  async logSupplierAction(userId, supplierId, action, details = {}) {
    try {
      const logEntry = {
        userId,
        supplierId,
        action,
        details,
        timestamp: new Date().toISOString()
      };

      await this.kv.put(
        `supplier_action:${userId}:${supplierId}:${Date.now()}`,
        JSON.stringify(logEntry),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );
    } catch (error) {
      console.warn('Failed to log supplier action:', error);
      // Don't throw error for logging failures
    }
  }
}