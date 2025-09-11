// Global test setup
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

export {};