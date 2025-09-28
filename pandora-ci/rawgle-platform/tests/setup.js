const { execSync } = require('child_process');
const { Client } = require('pg');
const redis = require('redis');

// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_ci_pipeline';
process.env.DATABASE_URL = 'postgresql://rawgle:testpass@localhost:5432/rawgle_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Database setup
let pgClient;
let redisClient;

beforeAll(async () => {
  // Setup test database
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pgClient.connect();
    console.log('Connected to test database');
  } catch (error) {
    console.warn('Could not connect to test database:', error.message);
  }

  // Setup Redis
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log('Connected to test Redis');
  } catch (error) {
    console.warn('Could not connect to test Redis:', error.message);
  }
});

afterAll(async () => {
  if (pgClient) {
    await pgClient.end();
  }
  if (redisClient) {
    await redisClient.disconnect();
  }
});

// Database helpers
global.cleanDatabase = async () => {
  if (pgClient) {
    try {
      await pgClient.query('TRUNCATE TABLE users, pets, stores, sessions CASCADE');
    } catch (error) {
      console.warn('Could not clean database:', error.message);
    }
  }
};

global.seedTestData = async () => {
  if (pgClient) {
    try {
      // Insert test users
      await pgClient.query(`
        INSERT INTO users (email, password, name, created_at) VALUES
        ('test@example.com', '$2a$10$example_hash', 'Test User', NOW()),
        ('admin@example.com', '$2a$10$example_hash', 'Admin User', NOW()),
        ('store@example.com', '$2a$10$example_hash', 'Store Owner', NOW())
      `);

      // Insert test stores
      await pgClient.query(`
        INSERT INTO stores (name, address, latitude, longitude, created_at) VALUES
        ('Best Raw Dog Food', '123 Main St, City', 40.7128, -74.0060, NOW()),
        ('Healthy Paws Store', '456 Oak Ave, Town', 34.0522, -118.2437, NOW())
      `);

      console.log('Test data seeded successfully');
    } catch (error) {
      console.warn('Could not seed test data:', error.message);
    }
  }
};

// Test utilities
global.generateTestToken = () => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: 1, email: 'test@example.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock external services for testing
global.mockServices = {
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({ success: true })
  },
  paymentService: {
    processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'test_123' })
  },
  geocodingService: {
    geocode: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.0060 })
  }
};

// Custom Jest matchers
expect.extend({
  toBeValidJWT(received) {
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(received, process.env.JWT_SECRET);
      return {
        message: () => `Expected ${received} not to be a valid JWT`,
        pass: true
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be a valid JWT`,
        pass: false
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `Expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass
    };
  }
});

// Silence console.log in tests unless DEBUG=true
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  };
}