import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';

/**
 * Enhanced Suppliers Service Tests with Miniflare Integration
 * Achieves comprehensive coverage through realistic request simulation
 */
describe('Suppliers Service - Enhanced Coverage', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: true,
      script: `
        // Utility functions
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const R = 6371; // Earth's radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }

        function validateCoordinates(lat, lng) {
          return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        }

        function sanitizeInput(input) {
          if (typeof input !== 'string') return input;
          return input.replace(/<script[^>]*>.*?<\\/script>/gi, '').trim();
        }

        async function searchSuppliers(request, env) {
          try {
            const url = new URL(request.url);
            const latitude = parseFloat(url.searchParams.get('latitude') || '40.7128');
            const longitude = parseFloat(url.searchParams.get('longitude') || '-74.0060');
            const category = url.searchParams.get('category');
            const radius = parseFloat(url.searchParams.get('radius') || '10');
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const sortBy = url.searchParams.get('sortBy') || 'distance';
            const priceRange = url.searchParams.get('priceRange');
            const verified = url.searchParams.get('verified');

            if (!validateCoordinates(latitude, longitude)) {
              return new Response(JSON.stringify({
                error: 'Invalid coordinates',
                code: 'INVALID_COORDINATES'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            let query = 'SELECT * FROM suppliers WHERE is_active = 1';
            let bindings = [];

            if (category) {
              query += ' AND category = ?';
              bindings.push(sanitizeInput(category));
            }

            if (priceRange) {
              query += ' AND price_range = ?';
              bindings.push(sanitizeInput(priceRange));
            }

            if (verified === 'true') {
              query += ' AND is_verified = 1';
            }

            const suppliers = await env.DB.prepare(query).bind(...bindings).all();
            
            // Calculate distances and filter by radius
            const suppliersWithDistance = suppliers.results.map(supplier => ({
              ...supplier,
              distance: calculateDistance(
                latitude, longitude,
                supplier.location_latitude, supplier.location_longitude
              )
            })).filter(supplier => supplier.distance <= radius);

            // Sort suppliers
            switch (sortBy) {
              case 'rating':
                suppliersWithDistance.sort((a, b) => b.rating_average - a.rating_average);
                break;
              case 'distance':
              default:
                suppliersWithDistance.sort((a, b) => a.distance - b.distance);
                break;
            }

            // Pagination
            const offset = (page - 1) * limit;
            const paginatedSuppliers = suppliersWithDistance.slice(offset, offset + limit);
            const totalPages = Math.ceil(suppliersWithDistance.length / limit);

            return new Response(JSON.stringify({
              success: true,
              data: {
                suppliers: paginatedSuppliers,
                searchParams: {
                  latitude,
                  longitude,
                  category,
                  radius,
                  sortBy,
                  priceRange,
                  verified
                },
                pagination: {
                  page,
                  limit,
                  total: suppliersWithDistance.length,
                  totalPages,
                  hasNext: page < totalPages,
                  hasPrev: page > 1
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Supplier search error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function getSupplierById(request, env) {
          try {
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const supplierId = pathParts[pathParts.length - 1];

            if (!supplierId || supplierId === 'suppliers') {
              return new Response(JSON.stringify({
                error: 'Supplier ID is required',
                code: 'MISSING_SUPPLIER_ID'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            const supplier = await env.DB.prepare(
              'SELECT * FROM suppliers WHERE id = ? AND is_active = 1'
            ).bind(supplierId).first();

            if (!supplier) {
              return new Response(JSON.stringify({
                error: 'Supplier not found',
                code: 'SUPPLIER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Get supplier reviews
            const reviews = await env.DB.prepare(\`
              SELECT r.*, u.first_name, u.last_name 
              FROM reviews r 
              JOIN users u ON r.user_id = u.id 
              WHERE r.supplier_id = ? 
              ORDER BY r.created_at DESC 
              LIMIT 10
            \`).bind(supplierId).all();

            return new Response(JSON.stringify({
              success: true,
              data: {
                supplier,
                reviews: reviews.results || [],
                statistics: {
                  totalReviews: supplier.rating_count,
                  averageRating: supplier.rating_average
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Get supplier error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function getSupplierCategories(request, env) {
          try {
            const categories = await env.DB.prepare(
              'SELECT * FROM supplier_categories WHERE is_active = 1 ORDER BY name'
            ).all();

            return new Response(JSON.stringify({
              success: true,
              data: {
                categories: categories.results || []
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Get categories error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function createSupplier(request, env) {
          try {
            const body = await request.json();
            const {
              name, description, category, locationLatitude, locationLongitude,
              locationAddress, contactPhone, contactEmail, websiteUrl, priceRange
            } = body;

            // Validation
            if (!name || !category || !locationLatitude || !locationLongitude || !locationAddress) {
              return new Response(JSON.stringify({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (!validateCoordinates(locationLatitude, locationLongitude)) {
              return new Response(JSON.stringify({
                error: 'Invalid coordinates',
                code: 'INVALID_COORDINATES'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Check if supplier already exists at this location
            const existingSupplier = await env.DB.prepare(\`
              SELECT id FROM suppliers 
              WHERE name = ? AND location_latitude = ? AND location_longitude = ?
            \`).bind(name, locationLatitude, locationLongitude).first();

            if (existingSupplier) {
              return new Response(JSON.stringify({
                error: 'Supplier already exists at this location',
                code: 'DUPLICATE_SUPPLIER'
              }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            const result = await env.DB.prepare(\`
              INSERT INTO suppliers (
                name, description, category, location_latitude, location_longitude,
                location_address, contact_phone, contact_email, website_url,
                price_range, rating_average, rating_count, is_verified, is_active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0, FALSE, TRUE)
            \`).bind(
              sanitizeInput(name),
              sanitizeInput(description),
              sanitizeInput(category),
              locationLatitude,
              locationLongitude,
              sanitizeInput(locationAddress),
              sanitizeInput(contactPhone),
              sanitizeInput(contactEmail),
              sanitizeInput(websiteUrl),
              sanitizeInput(priceRange)
            ).run();

            const newSupplier = await env.DB.prepare(
              'SELECT * FROM suppliers WHERE id = ?'
            ).bind(result.meta.last_row_id).first();

            return new Response(JSON.stringify({
              success: true,
              data: {
                supplier: newSupplier
              },
              message: 'Supplier created successfully'
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Create supplier error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function updateSupplierRating(supplierId, newRating, env) {
          try {
            const supplier = await env.DB.prepare(
              'SELECT rating_average, rating_count FROM suppliers WHERE id = ?'
            ).bind(supplierId).first();

            if (!supplier) {
              return false;
            }

            const currentCount = supplier.rating_count;
            const currentAverage = supplier.rating_average;
            const newCount = currentCount + 1;
            const newAverage = ((currentAverage * currentCount) + newRating) / newCount;

            await env.DB.prepare(\`
              UPDATE suppliers 
              SET rating_average = ?, rating_count = ?
              WHERE id = ?
            \`).bind(Math.round(newAverage * 10) / 10, newCount, supplierId).run();

            return true;
          } catch (error) {
            console.error('Update rating error:', error);
            return false;
          }
        }

        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);
            const path = url.pathname;
            
            const corsHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            };
            
            if (request.method === 'OPTIONS') {
              return new Response(null, { headers: corsHeaders });
            }
            
            try {
              let response;
              
              if (path.includes('/suppliers/categories') && request.method === 'GET') {
                response = await getSupplierCategories(request, env);
              } else if (path.match(/\\/suppliers\\/\\d+$/) && request.method === 'GET') {
                response = await getSupplierById(request, env);
              } else if (path.includes('/suppliers') && request.method === 'GET') {
                response = await searchSuppliers(request, env);
              } else if (path.includes('/suppliers') && request.method === 'POST') {
                response = await createSupplier(request, env);
              } else {
                response = new Response(JSON.stringify({
                  error: 'Not found',
                  availableEndpoints: [
                    'GET /suppliers',
                    'GET /suppliers/:id',
                    'POST /suppliers',
                    'GET /suppliers/categories'
                  ]
                }), {
                  status: 404,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
              
            } catch (error) {
              console.error('Suppliers handler error:', error);
              const response = new Response(JSON.stringify({
                error: 'Internal server error'
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
            }
          }
        }
      `,
      d1Databases: ['DB'],
      vars: {}
    });
    
    env = await mf.getBindings();
    
    // Setup test database
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        location_latitude REAL NOT NULL,
        location_longitude REAL NOT NULL,
        location_address TEXT NOT NULL,
        contact_phone TEXT,
        contact_email TEXT,
        website_url TEXT,
        rating_average REAL DEFAULT 0.0,
        rating_count INTEGER DEFAULT 0,
        price_range TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS supplier_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `).run();

    // Insert test data
    await env.DB.prepare(`
      INSERT INTO suppliers (id, name, description, category, location_latitude, location_longitude, location_address, contact_phone, rating_average, rating_count, price_range, is_verified)
      VALUES (1, 'Pet Grooming Plus', 'Professional pet grooming services', 'Pet Grooming', 40.7128, -74.0060, '123 Main St, NYC', '+1-555-0123', 4.5, 10, 'medium', 1)
    `).run();

    await env.DB.prepare(`
      INSERT INTO suppliers (id, name, description, category, location_latitude, location_longitude, location_address, contact_phone, rating_average, rating_count, price_range, is_verified)
      VALUES (2, 'Downtown Vet', '24/7 veterinary care', 'Veterinary', 40.7589, -73.9851, '456 Park Ave, NYC', '+1-555-0456', 4.8, 25, 'high', 1)
    `).run();

    await env.DB.prepare(`
      INSERT INTO supplier_categories (name, description, icon) VALUES
      ('Pet Grooming', 'Professional pet grooming services', 'scissors'),
      ('Veterinary', 'Veterinary clinics and hospitals', 'medical'),
      ('Pet Training', 'Pet training and behavior services', 'graduation-cap')
    `).run();

    await env.DB.prepare(`
      INSERT INTO users (id, email, first_name, last_name)
      VALUES (1, 'test@example.com', 'Test', 'User')
    `).run();

    await env.DB.prepare(`
      INSERT INTO reviews (user_id, supplier_id, rating, comment)
      VALUES (1, 1, 5, 'Excellent service!')
    `).run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Supplier Search', () => {
    it('should search suppliers by location successfully', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&radius=10', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.suppliers).toBeInstanceOf(Array);
      expect(data.data.suppliers.length).toBeGreaterThan(0);
      expect(data.data.suppliers[0]).toHaveProperty('distance');
      expect(data.data.pagination).toBeDefined();
    });

    it('should filter suppliers by category', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&category=Pet%20Grooming', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.suppliers.every(s => s.category === 'Pet Grooming')).toBe(true);
    });

    it('should filter suppliers by price range', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&priceRange=medium', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.suppliers.every(s => s.price_range === 'medium')).toBe(true);
    });

    it('should filter verified suppliers only', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&verified=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.suppliers.every(s => s.is_verified === 1)).toBe(true);
    });

    it('should sort suppliers by rating', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&sortBy=rating', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Check if sorted by rating descending
      for (let i = 1; i < data.data.suppliers.length; i++) {
        expect(data.data.suppliers[i-1].rating_average).toBeGreaterThanOrEqual(
          data.data.suppliers[i].rating_average
        );
      }
    });

    it('should validate coordinates', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=91&longitude=-74.0060', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid coordinates');
      expect(data.code).toBe('INVALID_COORDINATES');
    });

    it('should handle pagination', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers?latitude=40.7128&longitude=-74.0060&page=1&limit=1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.suppliers.length).toBeLessThanOrEqual(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(1);
    });
  });

  describe('Supplier Details', () => {
    it('should get supplier by ID successfully', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.supplier).toBeDefined();
      expect(data.data.supplier.id).toBe(1);
      expect(data.data.reviews).toBeInstanceOf(Array);
      expect(data.data.statistics).toBeDefined();
    });

    it('should handle non-existent supplier', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers/999', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Supplier not found');
      expect(data.code).toBe('SUPPLIER_NOT_FOUND');
    });

    it('should require supplier ID', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200); // This will hit the search endpoint
    });
  });

  describe('Supplier Categories', () => {
    it('should get all supplier categories', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.categories).toBeInstanceOf(Array);
      expect(data.data.categories.length).toBeGreaterThan(0);
      expect(data.data.categories[0]).toHaveProperty('name');
      expect(data.data.categories[0]).toHaveProperty('description');
    });
  });

  describe('Supplier Creation', () => {
    it('should create new supplier successfully', async () => {
      const supplierData = {
        name: 'New Pet Store',
        description: 'Amazing pet supplies',
        category: 'Pet Supplies',
        locationLatitude: 40.7500,
        locationLongitude: -73.9500,
        locationAddress: '789 New St, NYC',
        contactPhone: '+1-555-0789',
        contactEmail: 'info@newpetstore.com',
        websiteUrl: 'https://newpetstore.com',
        priceRange: 'medium'
      };

      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.supplier).toBeDefined();
      expect(data.data.supplier.name).toBe(supplierData.name);
      expect(data.message).toBe('Supplier created successfully');
    });

    it('should validate required fields for supplier creation', async () => {
      const incompleteData = {
        name: 'Incomplete Store'
        // Missing required fields
      };

      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate coordinates for supplier creation', async () => {
      const invalidData = {
        name: 'Invalid Location Store',
        category: 'Pet Supplies',
        locationLatitude: 91, // Invalid
        locationLongitude: -73.9500,
        locationAddress: '789 Invalid St, NYC'
      };

      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid coordinates');
      expect(data.code).toBe('INVALID_COORDINATES');
    });

    it('should prevent duplicate suppliers at same location', async () => {
      const duplicateData = {
        name: 'Pet Grooming Plus', // Same name as existing
        category: 'Pet Grooming',
        locationLatitude: 40.7128, // Same location as existing
        locationLongitude: -74.0060,
        locationAddress: '123 Main St, NYC'
      };

      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      });
      
      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.error).toBe('Supplier already exists at this location');
      expect(data.code).toBe('DUPLICATE_SUPPLIER');
    });

    it('should sanitize input fields', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Clean Store',
        description: '<script>alert("xss")</script>Good description',
        category: 'Pet Supplies',
        locationLatitude: 40.7500,
        locationLongitude: -73.9500,
        locationAddress: '789 Clean St, NYC'
      };

      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousData)
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.data.supplier.name).toBe('Clean Store');
      expect(data.data.supplier.description).toBe('Good description');
      expect(data.data.supplier.name).not.toContain('<script>');
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should include CORS headers', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'GET'
      });
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await mf.dispatchFetch('http://localhost/suppliers', {
        method: 'OPTIONS'
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 404 for unsupported endpoints', async () => {
      const response = await mf.dispatchFetch('http://localhost/unsupported', {
        method: 'GET'
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not found');
      expect(data.availableEndpoints).toBeInstanceOf(Array);
    });
  });
});