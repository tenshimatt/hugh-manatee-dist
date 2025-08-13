import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { chromium } from 'playwright';

// Global variables for test context
let browser, page;

// Browser setup and teardown
Given('the Hunta platform is running', async function () {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for app to load
  await page.waitForSelector('body');
});

Given('the database is clean', async function () {
  // Reset database state for testing
  const response = await page.request.post('/api/test/reset-db');
  expect(response.ok()).to.be.true;
});

// Navigation steps
Given('I am on the registration page', async function () {
  await page.goto('http://localhost:3000/register');
  await page.waitForSelector('[data-testid="registration-form"]');
});

Given('I am on the login page', async function () {
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('[data-testid="login-form"]');
});

// Form filling steps
When('I fill in the registration form with:', async function (dataTable) {
  const data = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(data)) {
    await page.fill(`[data-testid="registration-${field}"]`, value);
  }
});

When('I fill in the login form with:', async function (dataTable) {
  const data = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(data)) {
    await page.fill(`[data-testid="login-${field}"]`, value);
  }
});

// Form submission steps
When('I submit the registration form', async function () {
  await page.click('[data-testid="registration-submit"]');
});

When('I submit the login form', async function () {
  await page.click('[data-testid="login-submit"]');
});

// User creation for testing
Given('a user exists with email {string} and password {string}', async function (email, password) {
  // Create test user via API
  const response = await page.request.post('/api/test/create-user', {
    data: {
      email,
      password,
      username: email.split('@')[0],
      firstName: 'Test',
      lastName: 'User',
      role: 'hunter'
    }
  });
  expect(response.ok()).to.be.true;
});

// Authentication state steps
Given('I am logged in as a hunter', async function () {
  await this.loginAsRole('hunter');
});

Given('I am logged in as a {string}', async function (role) {
  await this.loginAsRole(role);
});

// Helper function to login with specific role
async function loginAsRole(role) {
  const testUsers = {
    hunter: { email: 'hunter@test.com', password: 'TestPass123!' },
    trainer: { email: 'trainer@test.com', password: 'TestPass123!' },
    admin: { email: 'admin@test.com', password: 'TestPass123!' }
  };
  
  const user = testUsers[role];
  
  // Create user if doesn't exist
  await page.request.post('/api/test/create-user', {
    data: { ...user, username: role, role }
  });
  
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', user.email);
  await page.fill('[data-testid="login-password"]', user.password);
  await page.click('[data-testid="login-submit"]');
  await page.waitForSelector('[data-testid="dashboard"]');
}

// Action steps
When('I click the logout button', async function () {
  await page.click('[data-testid="logout-button"]');
});

When('I try to access the {string} page', async function (pageName) {
  const pageUrls = {
    'admin-panel': '/admin',
    'training-logs': '/training',
    'profile': '/profile'
  };
  
  await page.goto(pageUrls[pageName] || `/${pageName}`);
});

// Assertion steps
Then('I should see a success message', async function () {
  const successMessage = await page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
});

Then('I should see a success message {string}', async function (message) {
  const successElement = await page.locator(`text=${message}`);
  await expect(successElement).toBeVisible();
});

Then('I should see an error message {string}', async function (message) {
  const errorElement = await page.locator(`text=${message}`);
  await expect(errorElement).toBeVisible();
});

Then('I should be redirected to the dashboard', async function () {
  await page.waitForURL('**/dashboard');
  expect(page.url()).to.include('/dashboard');
});

Then('I should be redirected to the home page', async function () {
  await page.waitForURL('**/');
  expect(page.url()).to.match(/\/$|\/home$/);
});

Then('I should remain on the login page', async function () {
  expect(page.url()).to.include('/login');
});

Then('I should be logged in as {string}', async function (username) {
  const userElement = await page.locator(`[data-testid="current-user"]`);
  const currentUser = await userElement.textContent();
  expect(currentUser).to.include(username);
});

Then('I should be logged in', async function () {
  const loggedInIndicator = await page.locator('[data-testid="logged-in-indicator"]');
  await expect(loggedInIndicator).toBeVisible();
});

Then('I should be logged out', async function () {
  const loggedOutIndicator = await page.locator('[data-testid="logged-out-indicator"]');
  await expect(loggedOutIndicator).toBeVisible();
});

// Access control assertions
Then('I should see access denied', async function () {
  const accessDeniedMessage = await page.locator('text=Access Denied');
  await expect(accessDeniedMessage).toBeVisible();
});

Then('I should have access', async function () {
  // Check that we don't see access denied and page content loads
  const accessDenied = page.locator('text=Access Denied');
  await expect(accessDenied).not.toBeVisible();
  
  const pageContent = await page.locator('main');
  await expect(pageContent).toBeVisible();
});

// Offline testing steps
Given('the device goes offline', async function () {
  await page.context().setOffline(true);
});

Then('I should still have access to cached content', async function () {
  // Check that cached content is displayed
  const cachedContent = await page.locator('[data-testid="cached-content"]');
  await expect(cachedContent).toBeVisible();
});

Then('I should see an offline indicator', async function () {
  const offlineIndicator = await page.locator('[data-testid="offline-indicator"]');
  await expect(offlineIndicator).toBeVisible();
});

// Mobile testing steps
Given('I am using a mobile device', async function () {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
});

Given('I am on the mobile login page', async function () {
  await page.goto('/login');
  await page.waitForSelector('[data-testid="mobile-login-form"]');
});

Then('the mobile navigation should be available', async function () {
  const mobileNav = await page.locator('[data-testid="mobile-navigation"]');
  await expect(mobileNav).toBeVisible();
});

Then('I should see mobile-optimized content', async function () {
  const mobileContent = await page.locator('[data-testid="mobile-content"]');
  await expect(mobileContent).toBeVisible();
});

// Cleanup
After(async function () {
  if (page) {
    await page.close();
  }
  if (browser) {
    await browser.close();
  }
});

// Make helper functions available to other step files
global.loginAsRole = loginAsRole;
global.getPage = () => page;
global.getBrowser = () => browser;