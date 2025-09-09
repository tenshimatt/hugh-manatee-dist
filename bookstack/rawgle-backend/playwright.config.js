/**
 * Playwright Configuration for E2E and Accessibility Testing
 * Following TDD_DOCUMENTATION.md specifications
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // Test timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Global test configuration
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Browser context configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Custom test data
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright',
    },
  },

  // Test projects for different browsers and scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.(test|spec)\.(js|ts)/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.(test|spec)\.(js|ts)/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.(test|spec)\.(js|ts)/,
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.(test|spec)\.(js|ts)/,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*mobile.*\.(test|spec)\.(js|ts)/,
    },

    // Accessibility testing
    {
      name: 'accessibility-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Force enable accessibility features
        launchOptions: {
          args: ['--force-enable-accessibility'],
        },
      },
      testMatch: /.*accessibility.*\.(test|spec)\.(js|ts)/,
    },

    // High DPI testing
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: /.*visual.*\.(test|spec)\.(js|ts)/,
    },

    // Slow 3G network simulation
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G
        networkConditions: {
          offline: false,
          downloadThroughput: (500 * 1024) / 8, // 500 kbps
          uploadThroughput: (500 * 1024) / 8,
          latency: 2000, // 2 seconds
        },
      },
      testMatch: /.*performance.*\.(test|spec)\.(js|ts)/,
    },
  ],

  // Test environment setup
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          NODE_ENV: 'test',
          PORT: '3000',
        },
      },

  // Global setup and teardown
  // globalSetup: require.resolve('./tests/setup/globalSetup.js'),
  // globalTeardown: require.resolve('./tests/setup/globalTeardown.js'),

  // Test output directories
  outputDir: 'test-results/',

  // Test metadata
  metadata: {
    testEnvironment: process.env.NODE_ENV || 'test',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    timestamp: new Date().toISOString(),
    version: require('./package.json').version,
  },
});
