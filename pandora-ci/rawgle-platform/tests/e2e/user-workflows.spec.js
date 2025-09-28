const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

describe('User Workflows E2E Tests', () => {
  let driver;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const seleniumHub = process.env.SELENIUM_REMOTE_URL || 'http://pandora-selenium-hub:4444/wd/hub';

  // Test data
  const testUser = {
    email: 'e2e.test@example.com',
    password: 'TestPassword123!',
    name: 'E2E Test User'
  };

  const testPet = {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    weight: 25,
    age: 'adult'
  };

  beforeAll(async () => {
    // Chrome configuration for Docker
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');

    // Build driver
    if (process.env.CI) {
      // Use remote Selenium Grid in CI
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .usingServer(seleniumHub)
        .build();
    } else {
      // Use local Chrome for development
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
    }

    await driver.manage().setTimeouts({ implicit: 10000 });
  }, 30000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    // Clean database state before each test
    await cleanDatabase();
    await seedTestData();
  });

  describe('User Registration and Login', () => {
    test('should allow user to register and login successfully', async () => {
      // Go to registration page
      await driver.get(`${baseUrl}/register`);
      await driver.wait(until.titleIs('Register - Rawgle'), 5000);

      // Fill registration form
      await driver.findElement(By.id('email')).sendKeys(testUser.email);
      await driver.findElement(By.id('password')).sendKeys(testUser.password);
      await driver.findElement(By.id('name')).sendKeys(testUser.name);
      await driver.findElement(By.id('acceptTerms')).click();

      // Submit registration
      await driver.findElement(By.css('[type="submit"]')).click();

      // Wait for redirect to dashboard
      await driver.wait(until.urlContains('/dashboard'), 5000);

      // Verify successful registration
      const welcomeMessage = await driver.findElement(By.css('[data-testid="welcome-message"]'));
      expect(await welcomeMessage.getText()).toContain(testUser.name);

      // Logout
      await driver.findElement(By.css('[data-testid="logout-button"]')).click();
      await driver.wait(until.urlContains('/login'), 5000);

      // Login with same credentials
      await driver.findElement(By.id('email')).sendKeys(testUser.email);
      await driver.findElement(By.id('password')).sendKeys(testUser.password);
      await driver.findElement(By.css('[type="submit"]')).click();

      // Verify successful login
      await driver.wait(until.urlContains('/dashboard'), 5000);
      const dashboardTitle = await driver.findElement(By.css('h1'));
      expect(await dashboardTitle.getText()).toContain('Dashboard');
    });

    test('should show validation errors for invalid registration', async () => {
      await driver.get(`${baseUrl}/register`);

      // Submit empty form
      await driver.findElement(By.css('[type="submit"]')).click();

      // Check for validation errors
      const emailError = await driver.findElement(By.css('[data-testid="email-error"]'));
      expect(await emailError.getText()).toContain('Email is required');

      const passwordError = await driver.findElement(By.css('[data-testid="password-error"]'));
      expect(await passwordError.getText()).toContain('Password is required');
    });
  });

  describe('Pet Profile Management', () => {
    beforeEach(async () => {
      // Login before pet management tests
      await loginUser(driver, baseUrl, testUser);
    });

    test('should allow user to create and manage pet profiles', async () => {
      // Navigate to pets section
      await driver.findElement(By.css('[data-testid="pets-nav"]')).click();
      await driver.wait(until.urlContains('/pets'), 5000);

      // Click add pet button
      await driver.findElement(By.css('[data-testid="add-pet-button"]')).click();

      // Fill pet form
      await driver.findElement(By.id('pet-name')).sendKeys(testPet.name);
      await driver.findElement(By.id('pet-species')).sendKeys(testPet.species);
      await driver.findElement(By.id('pet-breed')).sendKeys(testPet.breed);
      await driver.findElement(By.id('pet-weight')).sendKeys(testPet.weight.toString());

      // Submit pet form
      await driver.findElement(By.css('[data-testid="save-pet"]')).click();

      // Verify pet was created
      await driver.wait(until.elementLocated(By.css('[data-testid="pet-card"]')), 5000);
      const petCard = await driver.findElement(By.css('[data-testid="pet-card"]'));
      expect(await petCard.getText()).toContain(testPet.name);
      expect(await petCard.getText()).toContain(testPet.breed);

      // Edit pet
      await driver.findElement(By.css('[data-testid="edit-pet"]')).click();
      const weightInput = await driver.findElement(By.id('pet-weight'));
      await weightInput.clear();
      await weightInput.sendKeys('30');
      await driver.findElement(By.css('[data-testid="save-pet"]')).click();

      // Verify update
      await driver.wait(until.elementTextContains(petCard, '30'), 5000);
    });

    test('should calculate feeding recommendations', async () => {
      await driver.get(`${baseUrl}/pets`);

      // Add pet first
      await driver.findElement(By.css('[data-testid="add-pet-button"]')).click();
      await driver.findElement(By.id('pet-name')).sendKeys(testPet.name);
      await driver.findElement(By.id('pet-weight')).sendKeys(testPet.weight.toString());
      await driver.findElement(By.css('[data-testid="save-pet"]')).click();

      // Click feeding calculator
      await driver.findElement(By.css('[data-testid="feeding-calculator"]')).click();

      // Verify feeding recommendations appear
      const feedingAmount = await driver.findElement(By.css('[data-testid="daily-amount"]'));
      expect(await feedingAmount.getText()).toMatch(/\d+.*grams/);

      const mealCount = await driver.findElement(By.css('[data-testid="meal-count"]'));
      expect(await mealCount.getText()).toContain('2 meals');
    });
  });

  describe('Store Locator', () => {
    beforeEach(async () => {
      await loginUser(driver, baseUrl, testUser);
    });

    test('should find nearby stores', async () => {
      await driver.get(`${baseUrl}/stores`);

      // Mock geolocation (this would need actual implementation)
      await driver.executeScript(`
        navigator.geolocation.getCurrentPosition = function(success) {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          });
        };
      `);

      // Click find stores button
      await driver.findElement(By.css('[data-testid="find-stores"]')).click();

      // Wait for stores to load
      await driver.wait(until.elementLocated(By.css('[data-testid="store-card"]')), 10000);

      // Verify store cards appear
      const storeCards = await driver.findElements(By.css('[data-testid="store-card"]'));
      expect(storeCards.length).toBeGreaterThan(0);

      // Click on first store
      await storeCards[0].click();

      // Verify store details modal/page
      const storeDetails = await driver.findElement(By.css('[data-testid="store-details"]'));
      expect(await storeDetails.isDisplayed()).toBe(true);
    });

    test('should allow filtering stores by type', async () => {
      await driver.get(`${baseUrl}/stores`);

      // Select store type filter
      await driver.findElement(By.css('[data-testid="store-type-filter"]')).click();
      await driver.findElement(By.css('[data-value="premium"]')).click();

      // Apply filter
      await driver.findElement(By.css('[data-testid="apply-filter"]')).click();

      // Verify filtered results
      await driver.wait(until.elementLocated(By.css('[data-testid="store-card"]')), 5000);
      const storeCards = await driver.findElements(By.css('[data-testid="store-card"]'));

      // Check that all stores have premium badge
      for (let card of storeCards) {
        const premiumBadge = await card.findElement(By.css('[data-testid="premium-badge"]'));
        expect(await premiumBadge.isDisplayed()).toBe(true);
      }
    });
  });

  describe('Responsive Design', () => {
    test('should work correctly on mobile viewport', async () => {
      // Set mobile viewport
      await driver.manage().window().setRect({ width: 375, height: 667 });

      await loginUser(driver, baseUrl, testUser);

      // Check mobile navigation
      const mobileMenu = await driver.findElement(By.css('[data-testid="mobile-menu"]'));
      expect(await mobileMenu.isDisplayed()).toBe(true);

      // Click mobile menu
      await mobileMenu.click();

      // Verify navigation items
      const navItems = await driver.findElements(By.css('[data-testid="nav-item"]'));
      expect(navItems.length).toBeGreaterThan(0);

      // Test responsive pet cards
      await driver.get(`${baseUrl}/pets`);
      const petContainer = await driver.findElement(By.css('[data-testid="pets-container"]'));
      const containerClass = await petContainer.getAttribute('class');
      expect(containerClass).toContain('mobile');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await loginUser(driver, baseUrl, testUser);

      // Simulate network failure (this would need to be implemented)
      await driver.executeScript(`
        window.fetch = function() {
          return Promise.reject(new Error('Network error'));
        };
      `);

      // Try to load pets page
      await driver.get(`${baseUrl}/pets`);

      // Verify error message appears
      const errorMessage = await driver.findElement(By.css('[data-testid="error-message"]'));
      expect(await errorMessage.getText()).toContain('connection');
    });
  });
});

// Helper function for login
async function loginUser(driver, baseUrl, user) {
  await driver.get(`${baseUrl}/login`);
  await driver.findElement(By.id('email')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css('[type="submit"]')).click();
  await driver.wait(until.urlContains('/dashboard'), 5000);
}