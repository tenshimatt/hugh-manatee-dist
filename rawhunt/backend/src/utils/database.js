/**
 * Database utilities and helpers
 */

export class DatabaseUtils {
  static async executeQuery(db, query, params = []) {
    try {
      const stmt = db.prepare(query);
      const result = await stmt.bind(...params).all();
      
      // D1 returns { results: [], success: true, meta: {} }
      if (result.results) {
        return result.results;
      }
      
      // Fallback for different D1 response formats
      if (Array.isArray(result)) {
        return result;
      }
      
      console.warn('Unexpected D1 response format:', result);
      return [];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database operation failed');
    }
  }

  static async executeQueryFirst(db, query, params = []) {
    try {
      const stmt = db.prepare(query);
      return await stmt.bind(...params).first();
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database operation failed');
    }
  }

  static async executeUpdate(db, query, params = []) {
    try {
      const stmt = db.prepare(query);
      const result = await stmt.bind(...params).run();
      return result;
    } catch (error) {
      console.error('Database update error:', error);
      throw new Error('Database operation failed');
    }
  }

  static async transaction(db, operations) {
    try {
      const results = await db.batch(operations);
      return results;
    } catch (error) {
      console.error('Database transaction error:', error);
      throw new Error('Transaction failed');
    }
  }

  static formatDateForDB(date = new Date()) {
    return date.toISOString();
  }

  static parseDBDate(dateString) {
    return new Date(dateString);
  }

  static buildPaginationQuery(baseQuery, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
  }

  static buildSearchQuery(searchTerm, fields) {
    if (!searchTerm) return '';
    
    const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
    return `(${conditions})`;
  }

  static buildOrderByQuery(sortBy, sortOrder = 'ASC') {
    const validOrders = ['ASC', 'DESC'];
    const order = validOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    return `ORDER BY ${sortBy} ${order}`;
  }

  static escapeSearchTerm(term) {
    return `%${term.replace(/[%_]/g, '\\$&')}%`;
  }
}

export class UserQueries {
  static async findByEmail(db, email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    return await DatabaseUtils.executeQueryFirst(db, query, [email]);
  }

  static async findById(db, id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    return await DatabaseUtils.executeQueryFirst(db, query, [id]);
  }

  static async create(db, userData) {
    const {
      email, passwordHash, firstName, lastName, phoneNumber,
      locationLatitude, locationLongitude, locationAddress
    } = userData;

    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number,
        location_latitude, location_longitude, location_address, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = DatabaseUtils.formatDateForDB();
    const params = [
      email, 
      passwordHash, 
      firstName, 
      lastName, 
      phoneNumber || null,
      locationLatitude || null, 
      locationLongitude || null, 
      locationAddress || null, 
      now, 
      now
    ];

    const result = await DatabaseUtils.executeUpdate(db, query, params);
    return result.meta.last_row_id;
  }

  static async updatePawsBalance(db, userId, amount, type = 'adjustment') {
    const query = `
      UPDATE users 
      SET paws_balance = paws_balance + ?, updated_at = ?
      WHERE id = ?
    `;
    
    const now = DatabaseUtils.formatDateForDB();
    return await DatabaseUtils.executeUpdate(db, query, [amount, now, userId]);
  }

  static async update(db, userId, updates) {
    const fields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    params.push(DatabaseUtils.formatDateForDB());
    params.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    return await DatabaseUtils.executeUpdate(db, query, params);
  }
}

export class SupplierQueries {
  static async findById(db, id) {
    const query = `
      SELECT s.*, u.email as user_email 
      FROM rawgle_suppliers s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.is_active = 1
    `;
    return await DatabaseUtils.executeQueryFirst(db, query, [id]);
  }

  static async search(db, filters) {
    // Enhanced query with actual database schema
    let query = `
      SELECT s.id, s.name, s.location_address as address, 
             s.location_latitude as latitude, s.location_longitude as longitude,
             s.contact_phone as phone_number, s.website_url as website, 
             s.rating_average as rating, s.rating_count as user_ratings_total,
             s.category, s.specialties, s.price_range
      FROM rawgle_suppliers s
      WHERE s.is_active = 1
    `;

    const params = [];

    // Add geolocation filtering for "find suppliers near me"
    if (filters.latitude && filters.longitude) {
      const earthRadiusKm = 6371;
      const radiusKm = (filters.radius || 10) * 1.60934; // Convert miles to km
      
      query = `
        SELECT s.id, s.name, s.location_address as address, 
               s.location_latitude as latitude, s.location_longitude as longitude,
               s.contact_phone as phone_number, s.website_url as website, 
               s.rating_average as rating, s.rating_count as user_ratings_total,
               s.category, s.specialties, s.price_range,
               (${earthRadiusKm} * acos(cos(radians(?)) * cos(radians(s.location_latitude)) * 
               cos(radians(s.location_longitude) - radians(?)) + sin(radians(?)) * 
               sin(radians(s.location_latitude)))) AS distance
        FROM rawgle_suppliers s
        WHERE s.is_active = 1 AND (${earthRadiusKm} * acos(cos(radians(?)) * cos(radians(s.location_latitude)) * 
               cos(radians(s.location_longitude) - radians(?)) + sin(radians(?)) * 
               sin(radians(s.location_latitude)))) <= ?
      `;
      
      params.push(
        filters.latitude, filters.longitude, filters.latitude,
        filters.latitude, filters.longitude, filters.latitude, radiusKm
      );
      
      // Add search term filter even with geolocation
      if (filters.search) {
        query += ' AND s.name LIKE ?';
        const searchTerm = DatabaseUtils.escapeSearchTerm(filters.search);
        params.push(searchTerm);
      }
      
      query += ' ORDER BY distance ASC';
    } else {
      // Add search term filter only for name
      if (filters.search) {
        query += ' AND s.name LIKE ?';
        const searchTerm = DatabaseUtils.escapeSearchTerm(filters.search);
        params.push(searchTerm);
      }

      // Simple ordering by name only
      query += ' ORDER BY s.name ASC';
    }

    // Add pagination
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    return await DatabaseUtils.executeQuery(db, query, params);
  }

  static async create(db, supplierData) {
    const query = `
      INSERT INTO suppliers (
        user_id, name, description, category, specialties,
        location_latitude, location_longitude, location_address,
        contact_phone, contact_email, website_url, price_range,
        business_hours, images, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = DatabaseUtils.formatDateForDB();
    const params = [
      supplierData.userId, supplierData.name, supplierData.description,
      supplierData.category, JSON.stringify(supplierData.specialties || []),
      supplierData.locationLatitude, supplierData.locationLongitude,
      supplierData.locationAddress, supplierData.contactPhone,
      supplierData.contactEmail, supplierData.websiteUrl,
      supplierData.priceRange, JSON.stringify(supplierData.businessHours || {}),
      JSON.stringify(supplierData.images || []), now, now
    ];

    const result = await DatabaseUtils.executeUpdate(db, query, params);
    return result.meta.last_row_id;
  }

  static async updateRating(db, supplierId) {
    const query = `
      UPDATE suppliers 
      SET rating_average = (
        SELECT AVG(rating) FROM reviews WHERE supplier_id = ?
      ),
      rating_count = (
        SELECT COUNT(*) FROM reviews WHERE supplier_id = ?
      ),
      updated_at = ?
      WHERE id = ?
    `;

    const now = DatabaseUtils.formatDateForDB();
    return await DatabaseUtils.executeUpdate(db, query, [
      supplierId, supplierId, now, supplierId
    ]);
  }
}

export class TransactionQueries {
  static async create(db, transactionData) {
    const query = `
      INSERT INTO transactions (
        user_id, type, amount, description, reference_type,
        reference_id, from_user_id, to_user_id, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = DatabaseUtils.formatDateForDB();
    const params = [
      transactionData.userId, 
      transactionData.type, 
      transactionData.amount,
      transactionData.description, 
      transactionData.referenceType || null,
      transactionData.referenceId || null, 
      transactionData.fromUserId || null,
      transactionData.toUserId || null, 
      transactionData.balanceAfter, 
      now
    ];

    const result = await DatabaseUtils.executeUpdate(db, query, params);
    return result.meta.last_row_id;
  }

  static async getByUserId(db, userId, page = 1, limit = 20) {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (page - 1) * limit;
    return await DatabaseUtils.executeQuery(db, query, [userId, limit, offset]);
  }
}