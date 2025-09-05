import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
import 'whatwg-fetch'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Polyfill for MSW
global.Request = Request
global.Response = Response
global.Headers = Headers

// TextEncoder/TextDecoder polyfill
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid',
  },
})

// Setup MSW - temporarily disabled for ESLint testing
// import { server } from './src/mocks/server'

// Establish API mocking before all tests
// beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
// afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
// afterAll(() => server.close())