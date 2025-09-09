import { TestDatabase } from './testContainers';
import { db } from '../../src/config/database';

export class TestEnvironment {
  private static testDb: TestDatabase;

  static async setupGlobal(): Promise<void> {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-comprehensive-testing';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.PORT = '3001';
    
    // Initialize test database
    TestEnvironment.testDb = TestDatabase.getInstance();
    await TestEnvironment.testDb.start();
    
    // Override database connection for tests
    process.env.DATABASE_URL = TestEnvironment.testDb.getConnectionUri();
    
    console.log('🚀 Test environment setup completed');
  }

  static async teardownGlobal(): Promise<void> {
    if (TestEnvironment.testDb) {
      await TestEnvironment.testDb.stop();
    }
    console.log('🧹 Test environment cleaned up');
  }

  static async resetDatabase(): Promise<void> {
    if (TestEnvironment.testDb) {
      await TestEnvironment.testDb.reset();
    }
  }

  static getTestDatabase(): TestDatabase {
    return TestEnvironment.testDb;
  }
}

// Jest global setup
beforeAll(async () => {
  await TestEnvironment.setupGlobal();
}, 60000); // Increased timeout for container startup

afterAll(async () => {
  await TestEnvironment.teardownGlobal();
});

beforeEach(async () => {
  await TestEnvironment.resetDatabase();
});

// Suppress console logs during tests unless verbose
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn(),
    ttl: jest.fn().mockResolvedValue(-1),
  })),
}));

// Mock file upload
jest.mock('multer', () => {
  return jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        filename: 'test-file.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/tmp/test-file.jpg'
      };
      next();
    }),
    array: jest.fn(() => (req: any, res: any, next: any) => {
      req.files = [{
        filename: 'test-file.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/tmp/test-file.jpg'
      }];
      next();
    })
  }));
});

// Increase test timeout for integration tests
jest.setTimeout(30000);