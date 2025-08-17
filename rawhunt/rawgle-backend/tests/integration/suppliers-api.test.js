/**
 * Integration tests for Suppliers API with real local database
 * Tests geolocation search, filtering, and full API functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { Hono } from 'hono';
import supplierRoutes from '../../src/handlers/suppliers.js';

let db;

// Create test app with environment
const createTestApp = () => {
  const app = new Hono();
  
  // Add environment middleware
  app.use('*', async (c, next) => {
    c.env = {
      DB: db,
      KV: null,
      R2: null
    };
    await next();
  });
  
  app.route('/api/suppliers', supplierRoutes);
  return app;
};

describe('Suppliers API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Connect to local test database
    const dbPath = path.join(process.cwd(), 'data', 'rawgle-local.db');
    db = new Database(dbPath);
    app = createTestApp();
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('GET /api/suppliers/nearby', () => {
    test('should return suppliers near Los Angeles', async () => {
      const response = await app.request('/api/suppliers/nearby?latitude=34.0522&longitude=-118.2437&radius=100');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('suppliers');
      expect(data.data).toHaveProperty('search_location');
      expect(Array.isArray(data.data.suppliers)).toBe(true);
      
      if (data.data.suppliers.length > 0) {
        const supplier = data.data.suppliers[0];
        expect(supplier).toHaveProperty('name');
        expect(supplier).toHaveProperty('city');
        expect(supplier).toHaveProperty('state');
        expect(supplier).toHaveProperty('distance_miles');
        expect(typeof supplier.distance_miles).toBe('number');
      }
    });

    test('should return suppliers near Austin, TX', async () => {
      const response = await app.request('/api/suppliers/nearby?latitude=30.2672&longitude=-97.7431&radius=100');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suppliers.length).toBeGreaterThan(0);
      
      const austinSuppliers = data.data.suppliers.filter(s => s.city === 'Austin');
      expect(austinSuppliers.length).toBeGreaterThan(0);
      expect(austinSuppliers[0].distance_miles).toBeLessThan(1);
    });

    test('should filter by verified_only', async () => {
      const response = await app.request('/api/suppliers/nearby?latitude=39.7392&longitude=-104.9903&radius=150&verified_only=true');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.suppliers.length > 0) {
        data.data.suppliers.forEach(supplier => {
          expect(supplier.verified).toBe(1); // SQLite uses 1 for true
        });
      }
    });

    test('should require latitude and longitude', async () => {
      const response = await app.request('/api/suppliers/nearby?radius=50');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('LOCATION_REQUIRED');
    });

    test('should return empty array for remote location', async () => {
      // Test with coordinates in middle of ocean
      const response = await app.request('/api/suppliers/nearby?latitude=0&longitude=0&radius=50');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suppliers).toEqual([]);
    });
  });

  describe('GET /api/suppliers', () => {
    test('should return all suppliers with pagination', async () => {
      const response = await app.request('/api/suppliers?limit=10&offset=0');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('suppliers');
      expect(data.data).toHaveProperty('pagination');
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.offset).toBe(0);
    });

    test('should search suppliers by query', async () => {
      const response = await app.request('/api/suppliers?query=raw&limit=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.suppliers.length > 0) {
        const hasRawInName = data.data.suppliers.some(s => 
          s.name.toLowerCase().includes('raw') || 
          s.description.toLowerCase().includes('raw')
        );
        expect(hasRawInName).toBe(true);
      }
    });

    test('should filter by location (state)', async () => {
      const response = await app.request('/api/suppliers?state=CA&limit=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.suppliers.length > 0) {
        data.data.suppliers.forEach(supplier => {
          expect(supplier.state).toBe('CA');
        });
      }
    });

    test('should filter verified suppliers only', async () => {
      const response = await app.request('/api/suppliers?verified_only=true&limit=10');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.suppliers.length > 0) {
        data.data.suppliers.forEach(supplier => {
          expect(supplier.verified).toBe(1);
        });
      }
    });
  });

  describe('GET /api/suppliers/categories', () => {
    test('should return supplier categories', async () => {
      const response = await app.request('/api/suppliers/categories');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('categories');
      expect(Array.isArray(data.data.categories)).toBe(true);
    });
  });

  describe('GET /api/suppliers/featured', () => {
    test('should return featured suppliers', async () => {
      const response = await app.request('/api/suppliers/featured?limit=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('suppliers');
      expect(Array.isArray(data.data.suppliers)).toBe(true);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    test('should return specific supplier details', async () => {
      // First get a list of suppliers to get a valid ID
      const listResponse = await app.request('/api/suppliers?limit=1');
      const listData = await listResponse.json();
      
      if (listData.data.suppliers.length > 0) {
        const supplierId = listData.data.suppliers[0].id;
        
        const response = await app.request(`/api/suppliers/${supplierId}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('supplier');
        expect(data.data.supplier.id).toBe(supplierId);
        expect(data.data.supplier).toHaveProperty('name');
        expect(data.data.supplier).toHaveProperty('city');
        expect(data.data.supplier).toHaveProperty('state');
      }
    });

    test('should return 404 for non-existent supplier', async () => {
      const response = await app.request('/api/suppliers/non-existent-id');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('SUPPLIER_NOT_FOUND');
    });
  });

  describe('Database Integration Validation', () => {
    test('should have suppliers with valid geolocation data', async () => {
      const suppliers = db.prepare(`
        SELECT id, name, city, state, latitude, longitude 
        FROM suppliers 
        WHERE active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
      `).all();

      expect(suppliers.length).toBeGreaterThan(0);
      
      suppliers.forEach(supplier => {
        expect(typeof supplier.latitude).toBe('number');
        expect(typeof supplier.longitude).toBe('number');
        expect(supplier.latitude).toBeGreaterThan(-90);
        expect(supplier.latitude).toBeLessThan(90);
        expect(supplier.longitude).toBeGreaterThan(-180);
        expect(supplier.longitude).toBeLessThan(180);
      });
    });

    test('should have suppliers with valid ratings', async () => {
      const suppliers = db.prepare(`
        SELECT rating_average, review_count 
        FROM suppliers 
        WHERE active = 1 AND rating_average > 0
      `).all();

      suppliers.forEach(supplier => {
        expect(supplier.rating_average).toBeGreaterThanOrEqual(0);
        expect(supplier.rating_average).toBeLessThanOrEqual(5);
        expect(supplier.review_count).toBeGreaterThanOrEqual(0);
      });
    });

    test('should validate category data format', async () => {
      const suppliers = db.prepare(`
        SELECT categories, specialties 
        FROM suppliers 
        WHERE active = 1
      `).all();

      suppliers.forEach(supplier => {
        expect(supplier.categories).toBeTruthy();
        
        // Should be valid JSON array
        const categories = JSON.parse(supplier.categories);
        expect(Array.isArray(categories)).toBe(true);
        
        if (supplier.specialties) {
          const specialties = JSON.parse(supplier.specialties);
          expect(Array.isArray(specialties)).toBe(true);
        }
      });
    });

    test('should calculate distances correctly', async () => {
      // Test Haversine formula accuracy with known distances
      const laCoords = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
      const austinCoords = { lat: 30.2672, lng: -97.7431 }; // Austin
      
      // Get distance between LA and Austin suppliers
      const query = `
        SELECT 
          s1.name as la_supplier,
          s2.name as austin_supplier,
          (3959 * acos(cos(radians(${laCoords.lat})) * cos(radians(${austinCoords.lat})) * 
          cos(radians(${austinCoords.lng}) - radians(${laCoords.lng})) + sin(radians(${laCoords.lat})) * 
          sin(radians(${austinCoords.lat})))) AS distance_miles
        FROM suppliers s1, suppliers s2
        WHERE s1.city = 'Los Angeles' 
          AND s2.city = 'Austin' 
          AND s1.active = 1 
          AND s2.active = 1
        LIMIT 1
      `;
      
      const result = db.prepare(query).get();
      if (result) {
        // LA to Austin is approximately 1,400 miles
        expect(result.distance_miles).toBeGreaterThan(1200);
        expect(result.distance_miles).toBeLessThan(1600);
      }
    });
  });
});

// Note: App is created in beforeAll with proper environment setup