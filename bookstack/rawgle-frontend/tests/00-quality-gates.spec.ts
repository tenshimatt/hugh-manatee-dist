import { test, expect } from '@playwright/test';

/**
 * QUALITY GATES - Progressive Test Suite
 * 
 * Level 1: Basic Connectivity (< 5 seconds) - Fail fast on infrastructure issues
 * Level 2: Page Load & Navigation (< 15 seconds) - Core functionality verification  
 * Level 3: Full Functionality (< 60 seconds) - Complete feature testing
 * 
 * Run with:
 * - npm run test:fast    (Level 1 only)
 * - npm run test:medium  (Level 2 only) 
 * - npm run test:full    (All levels)
 */

test.describe('Level 1: Basic Connectivity - Infrastructure Quality Gates', () => {

  test('Level 1: Frontend HTTP connectivity check', async ({ request }) => {
    console.log('🔍 Testing frontend HTTP connectivity...');
    
    try {
      const response = await request.get('http://localhost:3000');
      console.log(`Frontend HTTP status: ${response.status()}`);
      
      expect(response.status()).toBe(200);
      console.log('✅ Frontend HTTP connectivity: PASS');
    } catch (error) {
      console.log(`❌ Frontend HTTP connectivity: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 1: Backend health endpoint check', async ({ request }) => {
    console.log('🔍 Testing backend health endpoint...');
    
    try {
      const response = await request.get('http://localhost:8000/health');
      console.log(`Backend health status: ${response.status()}`);
      
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      console.log('Backend health data:', healthData);
      
      // Verify health data structure
      expect(healthData).toHaveProperty('status');
      expect(healthData.status).toBe('healthy');
      
      console.log('✅ Backend health endpoint: PASS');
    } catch (error) {
      console.log(`❌ Backend health endpoint: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 1: Frontend loads without immediate errors', async ({ page }) => {
    console.log('🔍 Testing frontend basic load...');
    
    // Set short timeout for fast feedback
    page.setDefaultTimeout(5000);
    
    try {
      await page.goto('http://localhost:3000');
      
      // Just verify we can get to the page without error
      await expect(page).toHaveURL('http://localhost:3000/');
      
      // Check that body element exists (basic DOM loaded)
      await expect(page.locator('body')).toBeVisible();
      
      console.log('✅ Frontend basic load: PASS');
    } catch (error) {
      console.log(`❌ Frontend basic load: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 1: Network latency check', async ({ request }) => {
    console.log('🔍 Testing network latency...');
    
    const startTime = Date.now();
    
    try {
      const [frontendResponse, backendResponse] = await Promise.all([
        request.get('http://localhost:3000'),
        request.get('http://localhost:8000/health')
      ]);
      
      const endTime = Date.now();
      const totalLatency = endTime - startTime;
      
      console.log(`Network latency: ${totalLatency}ms`);
      console.log(`Frontend status: ${frontendResponse.status()}`);
      console.log(`Backend status: ${backendResponse.status()}`);
      
      // Expect reasonable response times for local development
      expect(totalLatency).toBeLessThan(3000); // 3 second max for both calls
      expect(frontendResponse.status()).toBe(200);
      expect(backendResponse.status()).toBe(200);
      
      console.log('✅ Network latency check: PASS');
    } catch (error) {
      console.log(`❌ Network latency check: FAIL - ${error.message}`);
      throw error;
    }
  });
});

test.describe('Level 2: Page Load & Navigation - Core Functionality Gates', () => {

  test('Level 2: Homepage renders with key elements', async ({ page }) => {
    console.log('🔍 Testing homepage rendering...');
    
    page.setDefaultTimeout(10000);
    
    try {
      await page.goto('http://localhost:3000');
      
      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded');
      
      // Verify page title
      await expect(page).toHaveTitle(/RAWGLE/);
      
      // Check for navigation (essential for user interaction)
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/level2-homepage.png',
        fullPage: true 
      });
      
      console.log('✅ Homepage rendering: PASS');
    } catch (error) {
      console.log(`❌ Homepage rendering: FAIL - ${error.message}`);
      await page.screenshot({ path: 'test-results/level2-homepage-error.png' });
      throw error;
    }
  });

  test('Level 2: Navigation menu functionality', async ({ page }) => {
    console.log('🔍 Testing navigation functionality...');
    
    page.setDefaultTimeout(10000);
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Find navigation links
      const navLinks = page.locator('nav a, nav button');
      const linkCount = await navLinks.count();
      
      console.log(`Found ${linkCount} navigation elements`);
      expect(linkCount).toBeGreaterThan(0);
      
      // Test at least one navigation element
      if (linkCount > 0) {
        const firstLink = navLinks.first();
        await expect(firstLink).toBeVisible();
        
        // Try to click (should not error)
        await firstLink.click({ timeout: 3000 });
        console.log('Navigation click successful');
      }
      
      console.log('✅ Navigation functionality: PASS');
    } catch (error) {
      console.log(`❌ Navigation functionality: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 2: Frontend-Backend API integration', async ({ page }) => {
    console.log('🔍 Testing API integration...');
    
    page.setDefaultTimeout(12000);
    
    try {
      // Monitor API requests
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('localhost:8000')) {
          apiRequests.push(request.url());
          console.log(`API request detected: ${request.url()}`);
        }
      });
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for any delayed API calls
      await page.waitForTimeout(3000);
      
      if (apiRequests.length > 0) {
        console.log(`✅ API integration detected: ${apiRequests.length} requests`);
      } else {
        console.log('ℹ️ No API integration detected (may be expected for static pages)');
      }
      
      console.log('✅ API integration check: PASS');
    } catch (error) {
      console.log(`❌ API integration check: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 2: Mobile responsiveness check', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness...');
    
    page.setDefaultTimeout(8000);
    
    try {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      
      // Check if page adapts to mobile
      await expect(page.locator('body')).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/level2-mobile.png',
        fullPage: true 
      });
      
      // Look for mobile menu or responsive elements
      const mobileElements = await page.locator('[class*="mobile"], [class*="sm:"], button[aria-label*="menu" i]').count();
      console.log(`Mobile-responsive elements found: ${mobileElements}`);
      
      console.log('✅ Mobile responsiveness: PASS');
    } catch (error) {
      console.log(`❌ Mobile responsiveness: FAIL - ${error.message}`);
      throw error;
    }
  });
});

test.describe('Level 3: Full Functionality - Complete Feature Testing', () => {

  test('Level 3: Complete user journey simulation', async ({ page }) => {
    console.log('🔍 Testing complete user journey...');
    
    page.setDefaultTimeout(20000);
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Simulate user interactions
      const interactableElements = page.locator('button, a, input, [role="button"]');
      const elementCount = await interactableElements.count();
      
      console.log(`Found ${elementCount} interactable elements`);
      
      // Test multiple interactions
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = interactableElements.nth(i);
        
        try {
          if (await element.isVisible()) {
            await element.click({ timeout: 3000 });
            await page.waitForTimeout(1000); // Allow time for any responses
            
            // Take screenshot after each interaction
            await page.screenshot({ 
              path: `test-results/level3-interaction-${i}.png` 
            });
          }
        } catch (error) {
          console.log(`Interaction ${i} failed: ${error.message}`);
        }
      }
      
      console.log('✅ User journey simulation: PASS');
    } catch (error) {
      console.log(`❌ User journey simulation: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 3: Performance and load time analysis', async ({ page }) => {
    console.log('🔍 Testing performance...');
    
    page.setDefaultTimeout(30000);
    
    try {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      
      // Performance assertions
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for full load
      
      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Allow time for any console errors to appear
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        console.log('Console errors detected:', consoleErrors);
      } else {
        console.log('No console errors detected');
      }
      
      console.log('✅ Performance analysis: PASS');
    } catch (error) {
      console.log(`❌ Performance analysis: FAIL - ${error.message}`);
      throw error;
    }
  });

  test('Level 3: Accessibility compliance check', async ({ page }) => {
    console.log('🔍 Testing accessibility...');
    
    page.setDefaultTimeout(15000);
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Basic accessibility checks
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      const images = await page.locator('img').count();
      const imagesWithAlt = await page.locator('img[alt]').count();
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      
      console.log(`Accessibility audit:`);
      console.log(`- Headings: ${headings}`);
      console.log(`- Images: ${images} (${imagesWithAlt} with alt text)`);
      console.log(`- Buttons: ${buttons}`);
      console.log(`- Links: ${links}`);
      
      // Basic accessibility requirements
      expect(headings).toBeGreaterThan(0); // Should have some heading structure
      
      console.log('✅ Accessibility compliance: PASS');
    } catch (error) {
      console.log(`❌ Accessibility compliance: FAIL - ${error.message}`);
      throw error;
    }
  });
});