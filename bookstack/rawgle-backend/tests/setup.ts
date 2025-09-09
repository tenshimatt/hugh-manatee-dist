// TDD Test Setup - Simplified for fast feedback cycles

// Set test environment variables immediately
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-for-tdd'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rawgle_test'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.PORT = '3001'

// Global test timeout
jest.setTimeout(30000)

// Suppress console logs during tests unless verbose
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}))

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))