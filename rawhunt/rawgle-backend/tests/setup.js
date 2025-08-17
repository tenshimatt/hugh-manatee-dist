import { vi } from 'vitest';

// Mock Cloudflare Workers environment
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9);
}

// Mock console for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// Mock environment variables
global.mockEnv = {
  JWT_SECRET: 'test-secret-key',
  BCRYPT_ROUNDS: '10',
  RATE_LIMIT_WINDOW: '60',
  RATE_LIMIT_MAX_REQUESTS: '100',
  PAWS_EARNING_RATES: '{"order_completion": 10, "review_submission": 5, "referral": 25}',
  API_VERSION: 'v1',
  ENVIRONMENT: 'test'
};