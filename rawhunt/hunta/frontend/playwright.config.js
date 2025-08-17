import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/test/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Geolocation permissions for GPS tests */
    permissions: ['geolocation', 'camera', 'microphone'],
    
    /* Set geolocation for testing */
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    
    /* Locale for testing */
    locale: 'en-US',
    
    /* Timezone for testing */
    timezoneId: 'America/New_York',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* PWA-specific tests */
    {
      name: 'PWA Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          // Enable service worker
          serviceWorkers: 'allow',
        },
      },
      testMatch: '**/*pwa*.spec.js',
    },

    /* Offline tests */
    {
      name: 'Offline Chrome',
      use: {
        ...devices['Desktop Chrome'],
        offline: true,
      },
      testMatch: '**/*offline*.spec.js',
    },

    /* Tablet tests */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
      testMatch: '**/*tablet*.spec.js',
    },

    /* High-DPI tests */
    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
      },
      testMatch: '**/*responsive*.spec.js',
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
    },
  },

  /* Global setup */
  globalSetup: require.resolve('./src/test/global-setup.js'),
  
  /* Global teardown */
  globalTeardown: require.resolve('./src/test/global-teardown.js'),

  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },

  /* Output directory */
  outputDir: 'test-results/',

  /* Preserve output */
  preserveOutput: 'failures-only',
});