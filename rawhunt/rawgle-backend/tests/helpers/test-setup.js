/**
 * Test Setup and Utilities for Rawgle Backend Tests
 * Provides comprehensive testing infrastructure
 */

import { beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { nanoid } from 'nanoid';

// Mock Cloudflare Workers environment
export const createMockEnv = () => ({
  DB: new MockD1Database(),
  KV: new MockKVNamespace(),
  R2: new MockR2Bucket(),
  QUEUE: new MockQueue(),
  JWT_SECRET: 'test-jwt-secret-key-for-rawgle-backend',
  ENVIRONMENT: 'test',
  FRONTEND_URL: 'https://afc39a6e.rawgle-frontend.pages.dev'
});

// Mock D1 Database
export class MockD1Database {
  constructor() {
    this.data = new Map();
    this.queries = [];
    // Create jest mock functions
    this.prepare = jest.fn().mockImplementation((query) => {
      const stmt = new MockD1PreparedStatement(this, query);
      return stmt;
    });
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

class MockD1PreparedStatement {
  constructor(database, query) {
    this.database = database;
    this.query = query;
    this.params = [];
    
    // Create jest mock functions
    this.bind = jest.fn().mockImplementation((...params) => {
      this.params = params;
      return this;
    });
    
    this.first = jest.fn().mockImplementation(async () => {
      this.database.queries.push({ query: this.query, params: this.params });
    
    // Mock responses based on query patterns
    if (this.query.includes('SELECT id FROM users WHERE email')) {
      const email = this.params[0];
      if (email === 'existing@rawgle.com' || email === 'existing@test.com') {
        return {
          id: 'existing-user-123',
          email: email,
          name: 'Existing User'
        };
      }
      return null; // User doesn't exist - good for registration tests
    }
    
    if (this.query.includes('SELECT * FROM users WHERE email')) {
      const email = this.params[0];
      if (email === 'existing@test.com') {
        return {
          id: 'user-123',
          email: 'existing@test.com',
          name: 'Existing User',
          password_hash: '$2b$10$test.hash',
          platform: 'rawgle',
          created_at: '2024-01-01T00:00:00Z'
        };
      }
      return null;
    }

    if (this.query.includes('SELECT id, email, name, platform')) {
      // Auth middleware user lookup
      const userId = this.params[0];
      return {
        id: userId,
        email: 'petowner@rawgle.com',
        name: 'Pet Owner',
        platform: 'rawgle',
        subscription_tier: 'free',
        email_verified: true,
        profile_completed: true,
        onboarding_completed: true,
        deleted_at: null,
        last_login: new Date().toISOString()
      };
    }
    
    if (this.query.includes('SELECT * FROM users WHERE id')) {
      return {
        id: this.params[0],
        email: 'test@rawgle.com',
        name: 'Test User',
        platform: 'rawgle',
        paws_balance: 100
      };
    }

    if (this.query.includes('SELECT * FROM pets WHERE id')) {
      return {
        id: this.params[0],
        user_id: 'user-123',
        name: 'Test Pet',
        species: 'dog',
        breed: 'Golden Retriever',
        created_at: '2024-01-01T00:00:00Z'
      };
    }

    return null;
    });

    this.all = jest.fn().mockImplementation(async () => {
    this.database.queries.push({ query: this.query, params: this.params });
    
    if (this.query.includes('SELECT * FROM pets')) {
      return {
        results: [
          {
            id: 'pet-123',
            user_id: 'user-123',
            name: 'Buddy',
            species: 'dog',
            breed: 'Golden Retriever'
          }
        ]
      };
    }

    if (this.query.includes('SELECT * FROM feeding_logs')) {
      return {
        results: [
          {
            id: 'log-123',
            pet_id: 'pet-123',
            user_id: 'user-123',
            feeding_date: '2024-01-01T12:00:00Z',
            meal_type: 'dinner',
            amount_grams: 500
          }
        ]
      };
    }

    return { results: [] };
    });

    this.run = jest.fn().mockImplementation(async () => {
    this.database.queries.push({ query: this.query, params: this.params });
    
    const lastId = nanoid();
    return {
      success: true,
      meta: {
        changed_rows: 1,
        last_row_id: lastId
      }
    };
    });
  }
}

// Mock KV Namespace
export class MockKVNamespace {
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

// Mock R2 Bucket
export class MockR2Bucket {
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

// Mock Queue
export class MockQueue {
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

// Test Helpers
export class TestHelpers {
  static createTestUser(overrides = {}) {
    return {
      id: nanoid(),
      email: `test-${nanoid()}@rawgle.com`,
      name: 'Test User',
      platform: 'rawgle',
      password_hash: '$2b$10$test.hash',
      paws_balance: 100,
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

  static createTestPost(userId, overrides = {}) {
    return {
      id: nanoid(),
      user_id: userId,
      title: 'Test Post',
      content: 'This is a test post content',
      category: 'feeding',
      post_type: 'question',
      tags: ['test', 'raw-feeding'],
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createMockRequest(path, options = {}) {
    // Create a proper URL for the request
    const url = new URL(path.startsWith('http') ? path : `http://localhost${path.startsWith('/') ? path : '/' + path}`);
    
    // Create proper headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Origin': 'https://afc39a6e.rawgle-frontend.pages.dev',
      'X-Platform': 'rawgle',
      'User-Agent': 'Mozilla/5.0 (Test)',
      'CF-Connecting-IP': '127.0.0.1',
      ...options.headers
    });
    
    // Create the request body
    const body = options.body ? JSON.stringify(options.body) : undefined;
    
    // Create a proper Request object
    const request = new Request(url.toString(), {
      method: options.method || 'GET',
      headers: headers,
      body: body
    });
    
    // Add additional properties that tests might expect
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
      req: overrides.req || this.createMockRequest('/'),
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

  static async mockJWT(payload = {}) {
    // Import jwt library to create real tokens for testing
    const jwt = (await import('jsonwebtoken')).default;
    const jwtSecret = 'test-jwt-secret-key-for-rawgle-backend';
    
    const defaultPayload = {
      userId: 'test-user-id',
      email: 'test@rawgle.com',
      platform: 'rawgle',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };
    
    return jwt.sign({ ...defaultPayload, ...payload }, jwtSecret);
  }

  static parseJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 4) return null;
    
    try {
      return JSON.parse(Buffer.from(parts[3], 'base64').toString());
    } catch {
      return null;
    }
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

// Test Database Utilities
export class TestDatabase {
  constructor(mockDb) {
    this.db = mockDb;
  }

  async seed() {
    // Seed test data
    const user = TestHelpers.createTestUser();
    const pet = TestHelpers.createTestPet(user.id);
    const feedingLog = TestHelpers.createTestFeedingLog(pet.id, user.id);
    
    return { user, pet, feedingLog };
  }

  async cleanup() {
    this.db.data.clear();
    this.db.queries = [];
  }

  getQueries() {
    return this.db.queries;
  }

  getLastQuery() {
    return this.db.queries[this.db.queries.length - 1];
  }
}

// Global test setup
let testEnv;
let testDb;

beforeAll(async () => {
  testEnv = createMockEnv();
  testDb = new TestDatabase(testEnv.DB);
});

afterAll(async () => {
  if (testDb) {
    await testDb.cleanup();
  }
});

beforeEach(async () => {
  if (testDb) {
    await testDb.cleanup();
  }
});

export { testEnv, testDb };