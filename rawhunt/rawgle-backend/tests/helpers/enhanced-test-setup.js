/**
 * Enhanced Test Setup for Cloudflare Workers + Hono + Jest
 * Provides comprehensive testing utilities for rapid test coverage
 */

import { beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

// Enhanced Mock Cloudflare Workers Environment
export const createEnhancedMockEnv = () => ({
  DB: new EnhancedMockD1Database(),
  KV: new EnhancedMockKVNamespace(),
  R2: new EnhancedMockR2Bucket(),
  QUEUE: new EnhancedMockQueue(),
  JWT_SECRET: 'test-jwt-secret-key-for-rawgle-backend',
  ENVIRONMENT: 'test',
  FRONTEND_URL: 'https://afc39a6e.rawgle-frontend.pages.dev'
});

// Enhanced D1 Database Mock with realistic responses
export class EnhancedMockD1Database {
  constructor() {
    this.data = new Map();
    this.queries = [];
    this.mockData = {
      users: new Map(),
      pets: new Map(),
      products: new Map(),
      suppliers: new Map(),
      feeding_logs: new Map()
    };
    this.seedTestData();
  }

  seedTestData() {
    // Seed realistic test data
    this.mockData.users.set('test-user-123', {
      id: 'test-user-123',
      email: 'petowner@rawgle.com',
      name: 'Pet Owner',
      platform: 'rawgle',
      subscription_tier: 'free',
      email_verified: true,
      profile_completed: true,
      onboarding_completed: true,
      deleted_at: null,
      created_at: '2024-01-01T00:00:00Z',
      last_login: new Date().toISOString()
    });

    this.mockData.pets.set('pet-123', {
      id: 'pet-123',
      user_id: 'test-user-123',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      birth_date: '2020-01-15',
      gender: 'male',
      weight_lbs: 65,
      color_markings: 'Golden',
      feeding_type: 'raw',
      activity_level: 'high',
      photos: '[]',
      allergies: '[]',
      dietary_restrictions: '[]',
      nft_minted: false,
      nft_token_id: null,
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });

    this.mockData.suppliers.set('supplier-123', {
      id: 'supplier-123',
      name: 'Premium Raw Foods Inc',
      email: 'contact@premiumraw.com',
      business_type: 'manufacturer',
      location: 'California, USA',
      rating: 4.8,
      verified: true,
      created_at: '2024-01-01T00:00:00Z'
    });
  }

  prepare(query) {
    const stmt = new EnhancedMockD1PreparedStatement(this, query);
    return stmt;
  }

  async exec(query) {
    this.queries.push(query);
    return {
      success: true,
      results: [],
      meta: { changed_rows: 0, last_row_id: 0 }
    };
  }

  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

class EnhancedMockD1PreparedStatement {
  constructor(database, query) {
    this.database = database;
    this.query = query;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    this.database.queries.push({ query: this.query, params: this.params });
    
    // Enhanced query pattern matching
    if (this.query.includes('SELECT id, email, name, platform')) {
      // Auth middleware user lookup
      const userId = this.params[0];
      return this.database.mockData.users.get(userId) || null;
    }
    
    if (this.query.includes('SELECT * FROM users WHERE email')) {
      const email = this.params[0];
      for (const user of this.database.mockData.users.values()) {
        if (user.email === email) return user;
      }
      return null;
    }

    if (this.query.includes('SELECT * FROM pets WHERE id')) {
      const petId = this.params[0];
      return this.database.mockData.pets.get(petId) || null;
    }

    if (this.query.includes('SELECT * FROM suppliers WHERE id')) {
      const supplierId = this.params[0];
      return this.database.mockData.suppliers.get(supplierId) || null;
    }

    return null;
  }

  async all() {
    this.database.queries.push({ query: this.query, params: this.params });
    
    if (this.query.includes('SELECT id, name, species')) {
      // Pets query
      const userId = this.params[0];
      const results = Array.from(this.database.mockData.pets.values())
        .filter(pet => pet.user_id === userId && pet.active);
      return { results };
    }

    if (this.query.includes('SELECT * FROM suppliers')) {
      const results = Array.from(this.database.mockData.suppliers.values());
      return { results };
    }

    if (this.query.includes('SELECT * FROM feeding_logs')) {
      const results = Array.from(this.database.mockData.feeding_logs.values());
      return { results };
    }

    return { results: [] };
  }

  async run() {
    this.database.queries.push({ query: this.query, params: this.params });
    
    const lastId = nanoid();
    return {
      success: true,
      meta: {
        changed_rows: 1,
        last_row_id: lastId
      }
    };
  }
}

// Enhanced KV Namespace Mock
export class EnhancedMockKVNamespace {
  constructor() {
    this.data = new Map();
  }

  async get(key, options = {}) {
    const value = this.data.get(key);
    if (!value) return null;
    
    if (options.type === 'json') {
      return JSON.parse(value);
    }
    return value;
  }

  async put(key, value, options = {}) {
    if (typeof value === 'object') {
      this.data.set(key, JSON.stringify(value));
    } else {
      this.data.set(key, value);
    }
    return Promise.resolve();
  }

  async delete(key) {
    this.data.delete(key);
    return Promise.resolve();
  }

  async list(options = {}) {
    const keys = Array.from(this.data.keys());
    const prefix = options.prefix || '';
    const filteredKeys = keys.filter(key => key.startsWith(prefix));
    
    return {
      keys: filteredKeys.map(name => ({ name })),
      list_complete: true
    };
  }
}

// Enhanced R2 Bucket Mock
export class EnhancedMockR2Bucket {
  constructor() {
    this.objects = new Map();
  }

  async get(key) {
    const object = this.objects.get(key);
    if (!object) return null;
    
    return {
      key,
      body: object.body,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(object.body),
      text: () => Promise.resolve(object.body.toString()),
      json: () => Promise.resolve(JSON.parse(object.body.toString()))
    };
  }

  async put(key, body, options = {}) {
    this.objects.set(key, {
      body: body,
      metadata: options.customMetadata || {},
      httpMetadata: options.httpMetadata || {}
    });
    
    return {
      key,
      etag: 'mock-etag',
      version: 'mock-version'
    };
  }

  async delete(key) {
    this.objects.delete(key);
    return Promise.resolve();
  }

  async list(options = {}) {
    const keys = Array.from(this.objects.keys());
    const prefix = options.prefix || '';
    const filteredKeys = keys.filter(key => key.startsWith(prefix));
    
    return {
      objects: filteredKeys.map(key => ({
        key,
        size: this.objects.get(key).body.length,
        etag: 'mock-etag',
        uploaded: new Date()
      })),
      truncated: false
    };
  }
}

// Enhanced Queue Mock
export class EnhancedMockQueue {
  constructor() {
    this.messages = [];
  }

  async send(message, options = {}) {
    this.messages.push({
      id: nanoid(),
      body: message,
      timestamp: new Date(),
      ...options
    });
    return Promise.resolve();
  }

  async sendBatch(messages) {
    for (const message of messages) {
      await this.send(message);
    }
    return Promise.resolve();
  }
}

// Enhanced Test Helpers
export class EnhancedTestHelpers {
  static createTestUser(overrides = {}) {
    return {
      id: nanoid(),
      email: `test-${nanoid()}@rawgle.com`,
      name: 'Test User',
      platform: 'rawgle',
      password_hash: '$2b$10$test.hash',
      paws_balance: 100,
      subscription_tier: 'free',
      email_verified: true,
      profile_completed: true,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createTestPet(userId, overrides = {}) {
    return {
      id: nanoid(),
      user_id: userId,
      name: 'Test Pet',
      species: 'dog',
      breed: 'Golden Retriever',
      birth_date: '2020-01-15',
      gender: 'male',
      weight_lbs: 65,
      feeding_type: 'raw',
      activity_level: 'high',
      photos: [],
      allergies: [],
      dietary_restrictions: [],
      active: true,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createTestSupplier(overrides = {}) {
    return {
      id: nanoid(),
      name: 'Test Supplier',
      email: 'test@supplier.com',
      business_type: 'retailer',
      location: 'Test City',
      rating: 4.5,
      verified: true,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createTestFeedingLog(petId, userId, overrides = {}) {
    return {
      id: nanoid(),
      pet_id: petId,
      user_id: userId,
      feeding_date: new Date().toISOString(),
      meal_type: 'dinner',
      food_type: 'raw_meat',
      protein_source: 'chicken',
      amount_grams: 500,
      calories_estimated: 400,
      appetite_rating: 5,
      energy_level: 4,
      notes: 'Test feeding log',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static async createAuthenticatedJWT(payload = {}) {
    const jwtSecret = 'test-jwt-secret-key-for-rawgle-backend';
    
    const defaultPayload = {
      userId: 'test-user-123',
      email: 'petowner@rawgle.com',
      platform: 'rawgle',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };
    
    return jwt.sign({ ...defaultPayload, ...payload }, jwtSecret);
  }

  static createAuthenticatedRequest(path, options = {}) {
    const url = new URL(path.startsWith('http') ? path : `http://localhost${path.startsWith('/') ? path : '/' + path}`);
    
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Origin': 'https://afc39a6e.rawgle-frontend.pages.dev',
      'X-Platform': 'rawgle',
      'User-Agent': 'Mozilla/5.0 (Test)',
      'CF-Connecting-IP': '127.0.0.1',
      ...options.headers
    });
    
    const body = options.body ? JSON.stringify(options.body) : undefined;
    
    const request = new Request(url.toString(), {
      method: options.method || 'GET',
      headers: headers,
      body: body
    });
    
    Object.defineProperty(request, 'path', {
      value: url.pathname,
      writable: false
    });
    
    return request;
  }

  static createMockContext(env, overrides = {}) {
    const vars = new Map();
    const context = {
      env,
      req: overrides.req || this.createAuthenticatedRequest('/'),
      json: (data, status = 200) => new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      }),
      text: (text, status = 200) => new Response(text, { 
        status,
        headers: { 'Content-Type': 'text/plain' } 
      }),
      set: (key, value) => {
        vars.set(key, value);
      },
      get: (key) => vars.get(key),
      header: (name, value) => {
        if (value !== undefined) {
          return value;
        }
        return context.req.headers.get(name);
      },
      var: vars,
      ...overrides
    };

    return context;
  }

  static setupAuthenticatedContext(env, user = null) {
    const testUser = user || this.createTestUser({
      id: 'test-user-123',
      email: 'petowner@rawgle.com'
    });

    // Setup database to return user for auth queries
    env.DB.prepare = jest.fn().mockImplementation((query) => {
      const stmt = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockImplementation(async () => {
          if (query.includes('SELECT id, email, name, platform')) {
            return testUser;
          }
          // Handle other queries with realistic data
          if (query.includes('SELECT * FROM pets')) {
            return this.createTestPet(testUser.id);
          }
          return null;
        }),
        all: jest.fn().mockImplementation(async () => {
          if (query.includes('SELECT id, name, species')) {
            return {
              results: [
                this.createTestPet(testUser.id, { name: 'Buddy', species: 'dog' }),
                this.createTestPet(testUser.id, { name: 'Whiskers', species: 'cat' })
              ]
            };
          }
          return { results: [] };
        }),
        run: jest.fn().mockResolvedValue({ 
          success: true, 
          meta: { changed_rows: 1, last_row_id: nanoid() } 
        })
      };
      return stmt;
    });

    return testUser;
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static randomEmail() {
    return `test-${nanoid()}@rawgle.com`;
  }

  static randomPassword() {
    return `TestPass${nanoid()}!`;
  }
}

// Service Factory for consistent mocking
export class ServiceFactory {
  static createMockPetService() {
    return {
      getUserPets: jest.fn(),
      createPet: jest.fn(),
      getPetProfile: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      uploadPhotos: jest.fn(),
      deletePhoto: jest.fn()
    };
  }

  static createMockPAWSService() {
    return {
      awardPAWS: jest.fn(),
      getPAWSBalance: jest.fn(),
      awardTokens: jest.fn(),
      transferPAWS: jest.fn(),
      getPAWSHistory: jest.fn()
    };
  }

  static createMockFeedingService() {
    return {
      createFeedingLog: jest.fn(),
      getFeedingHistory: jest.fn(),
      getNutritionSummary: jest.fn(),
      getFeedingAnalytics: jest.fn(),
      deleteFeedingLog: jest.fn(),
      updateFeedingLog: jest.fn()
    };
  }

  static createMockSupplierService() {
    return {
      searchSuppliers: jest.fn(),
      getSupplierProfile: jest.fn(),
      createSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: jest.fn(),
      getSupplierProducts: jest.fn()
    };
  }

  static createMockAuthService() {
    return {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      getUserProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      resetPassword: jest.fn(),
      deleteAccount: jest.fn()
    };
  }
}

// Global test setup
let testEnv;
let testDb;

beforeAll(async () => {
  testEnv = createEnhancedMockEnv();
  testDb = testEnv.DB;
});

afterAll(async () => {
  if (testDb) {
    testDb.data.clear();
    testDb.queries = [];
  }
});

beforeEach(async () => {
  if (testDb) {
    testDb.queries = [];
    testDb.data.clear();
  }
});

export { testEnv, testDb };

// Alias for backward compatibility
export { ServiceFactory as ServiceMockFactory };