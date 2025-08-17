import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },
      exclude: [
        'node_modules/',
        'tests/',
        'migrations/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/mocks/**',
        '**/fixtures/**',
        'vitest.config.js',
        'playwright.config.js'
      ]
    },
    reporters: ['verbose'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    }
  }
});