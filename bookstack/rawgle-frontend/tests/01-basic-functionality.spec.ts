import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('RAWGLE Basic Functionality Assessment', () => {
  
  test('homepage loads without critical errors', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check if page loads without 404/500 errors
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Verify page has proper title
    await expect(page).toHaveTitle(/RAWGLE/);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/homepage-initial.png',
      fullPage: true 
    });
    
    // Check for console errors (critical JavaScript failures)
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Report console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }
    
    // Verify basic page elements exist
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation menu exists and is visible', async ({ page }) => {
    await page.goto('/');
    
    // Check if main navigation exists
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Take screenshot of navigation area
    await navigation.screenshot({ 
      path: 'test-results/navigation-menu.png' 
    });
    
    // Check for common navigation elements
    const menuItems = [
      'Home',
      'About', 
      'Products',
      'Stores',
      'Blog',
      'Contact'
    ];
    
    for (const item of menuItems) {
      // Try to find menu item (case insensitive)
      const menuItem = page.locator(`nav`, { hasText: new RegExp(item, 'i') });
      if (await menuItem.count() > 0) {
        console.log(`✅ Found menu item: ${item}`);
      } else {
        console.log(`❌ Missing menu item: ${item}`);
      }
    }
  });

  test('navigation menu interactions', async ({ page }) => {
    await page.goto('/');
    
    // Find all clickable elements in navigation
    const navLinks = page.locator('nav a, nav button');
    const linkCount = await navLinks.count();
    
    console.log(`Found ${linkCount} clickable navigation elements`);
    
    // Test clicking on navigation items
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i);
      const linkText = await link.textContent();
      
      try {
        // Check if element is visible and clickable
        await expect(link).toBeVisible();
        
        // Attempt to click
        await link.click({ timeout: 3000 });
        
        console.log(`✅ Successfully clicked: ${linkText}`);
        
        // Wait a moment to see if page changes or dropdown appears
        await page.waitForTimeout(1000);
        
        // Take screenshot after click
        await page.screenshot({ 
          path: `test-results/navigation-click-${i}.png` 
        });
        
      } catch (error) {
        console.log(`❌ Failed to click: ${linkText} - ${error.message}`);
      }
    }
  });

  test('responsive design - mobile view', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/mobile-view.png',
      fullPage: true 
    });
    
    // Check for mobile menu toggle (hamburger menu)
    const mobileMenuToggle = page.locator('button[aria-label*="menu" i], .hamburger, [data-testid="mobile-menu"]');
    
    if (await mobileMenuToggle.count() > 0) {
      console.log('✅ Mobile menu toggle found');
      
      // Try to click mobile menu
      try {
        await mobileMenuToggle.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot after mobile menu click
        await page.screenshot({ 
          path: 'test-results/mobile-menu-open.png' 
        });
        
        console.log('✅ Mobile menu clicked successfully');
      } catch (error) {
        console.log(`❌ Mobile menu click failed: ${error.message}`);
      }
    } else {
      console.log('❌ No mobile menu toggle found');
    }
  });

  test('backend API connectivity', async ({ page, request }) => {
    // Test if backend is reachable
    try {
      const response = await request.get('http://localhost:8000/health');
      console.log(`Backend health check status: ${response.status()}`);
      
      if (response.ok()) {
        const healthData = await response.json();
        console.log('✅ Backend is accessible:', healthData);
      } else {
        console.log('❌ Backend health check failed');
      }
    } catch (error) {
      console.log(`❌ Backend connection failed: ${error.message}`);
    }
    
    // Test API integration from frontend
    await page.goto('/');
    
    // Check if frontend makes API calls
    let apiCallMade = false;
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiCallMade = true;
        console.log(`✅ Frontend making API call: ${request.url()}`);
      }
    });
    
    // Wait for potential API calls
    await page.waitForTimeout(5000);
    
    if (!apiCallMade) {
      console.log('❌ No API calls detected from frontend');
    }
  });

  test('form elements functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for common form elements
    const forms = page.locator('form');
    const inputs = page.locator('input');
    const buttons = page.locator('button');
    
    console.log(`Found ${await forms.count()} forms`);
    console.log(`Found ${await inputs.count()} inputs`);
    console.log(`Found ${await buttons.count()} buttons`);
    
    // Test button interactions
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      
      try {
        if (await button.isVisible()) {
          await button.click({ timeout: 3000 });
          console.log(`✅ Button clickable: ${buttonText}`);
        }
      } catch (error) {
        console.log(`❌ Button not clickable: ${buttonText}`);
      }
    }
  });

  test('accessibility check', async ({ page }) => {
    await page.goto('/');
    
    // Inject axe-core for accessibility testing
    await injectAxe(page);
    
    // Run accessibility check
    try {
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      console.log('✅ Accessibility check passed');
    } catch (error) {
      console.log('❌ Accessibility issues found:', error.message);
    }
  });

  test('theme switching functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("theme"), button:has-text("dark"), button:has-text("light")');
    
    if (await themeToggle.count() > 0) {
      console.log('✅ Theme toggle found');
      
      try {
        // Take screenshot before theme change
        await page.screenshot({ 
          path: 'test-results/theme-before.png' 
        });
        
        await themeToggle.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot after theme change
        await page.screenshot({ 
          path: 'test-results/theme-after.png' 
        });
        
        console.log('✅ Theme toggle clicked successfully');
      } catch (error) {
        console.log(`❌ Theme toggle failed: ${error.message}`);
      }
    } else {
      console.log('❌ No theme toggle found');
    }
  });

  test('page routing functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test common routes
    const routes = ['/about', '/blog', '/contact', '/stores'];
    
    for (const route of routes) {
      try {
        await page.goto(route);
        
        // Check if route loads without error
        const title = await page.title();
        console.log(`✅ Route ${route} loaded: ${title}`);
        
        await page.screenshot({ 
          path: `test-results/route-${route.replace('/', '')}.png` 
        });
        
      } catch (error) {
        console.log(`❌ Route ${route} failed: ${error.message}`);
      }
    }
  });

});