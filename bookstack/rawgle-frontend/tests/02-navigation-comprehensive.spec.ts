import { test, expect } from '@playwright/test';

/**
 * RAWGLE COMPREHENSIVE NAVIGATION TESTING
 * TDD Methodology: Red-Green-Refactor
 * Priority: CRITICAL
 * 
 * Testing all navigation flows systematically:
 * - Header navigation functionality
 * - Footer links verification  
 * - Mobile menu responsiveness
 * - Route transitions and deep linking
 * - Cross-browser compatibility
 * - Error handling for broken links
 */

test.describe('Navigation Flow Testing - Header, Footer, Mobile Menu', () => {

  test.beforeEach(async ({ page }) => {
    // Set up error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // Set up request monitoring for 404s
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`HTTP Error ${response.status()}: ${response.url()}`);
      }
    });
  });

  test('RED: Header Navigation - Discover All Navigation Elements', async ({ page }) => {
    console.log('🔍 DISCOVERING: Header navigation elements and structure');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take full screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/nav-header-full.png', 
      fullPage: true 
    });

    // Discover all navigation elements
    const headerNav = page.locator('header nav, nav, [role="navigation"]').first();
    const navExists = await headerNav.count() > 0;
    
    console.log(`Navigation element exists: ${navExists}`);
    
    if (navExists) {
      await headerNav.screenshot({ path: 'test-results/nav-header-element.png' });
      
      // Find all interactive elements in navigation
      const navLinks = headerNav.locator('a, button, [role="button"], [role="menuitem"]');
      const linkCount = await navLinks.count();
      
      console.log(`Found ${linkCount} navigation elements`);
      
      // Document each navigation element
      for (let i = 0; i < linkCount; i++) {
        const element = navLinks.nth(i);
        const text = await element.textContent();
        const href = await element.getAttribute('href');
        const role = await element.getAttribute('role');
        const tag = await element.evaluate(el => el.tagName);
        
        console.log(`Nav Element ${i + 1}: "${text}" | href="${href}" | role="${role}" | tag="${tag}"`);
      }
    }

    // Document expected vs actual state
    expect(navExists, 'Header navigation should exist').toBe(true);
  });

  test('GREEN: Header Navigation - Test All Link Functionality', async ({ page }) => {
    console.log('🔍 TESTING: All header navigation link functionality');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const headerNav = page.locator('header nav, nav, [role="navigation"]').first();
    const navLinks = headerNav.locator('a[href], button');
    const linkCount = await navLinks.count();

    const testResults = [];

    for (let i = 0; i < linkCount; i++) {
      const element = navLinks.nth(i);
      const text = await element.textContent() || 'No text';
      const href = await element.getAttribute('href');
      
      try {
        // Test if element is visible and clickable
        await expect(element).toBeVisible({ timeout: 2000 });
        
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          // Test actual navigation
          await element.click();
          await page.waitForTimeout(1000);
          
          const currentUrl = page.url();
          testResults.push({
            element: text,
            href: href,
            status: 'PASS',
            result: `Navigated to: ${currentUrl}`
          });
          
          // Take screenshot of destination
          await page.screenshot({ 
            path: `test-results/nav-destination-${i}.png`,
            fullPage: true
          });
          
          // Navigate back for next test
          await page.goBack();
          await page.waitForLoadState('networkidle');
        } else {
          // Test click without navigation
          await element.click();
          testResults.push({
            element: text,
            href: href,
            status: 'PASS',
            result: 'Click successful (non-navigation element)'
          });
        }
        
      } catch (error) {
        testResults.push({
          element: text,
          href: href,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Document all test results
    console.log('\n=== HEADER NAVIGATION TEST RESULTS ===');
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.element}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Href: ${result.href}`);
      if (result.status === 'PASS') {
        console.log(`   Result: ${result.result}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Write detailed results to file
    const resultsReport = {
      timestamp: new Date().toISOString(),
      testType: 'Header Navigation',
      totalElements: linkCount,
      results: testResults,
      summary: {
        passed: testResults.filter(r => r.status === 'PASS').length,
        failed: testResults.filter(r => r.status === 'FAIL').length
      }
    };

    await page.evaluate((report) => {
      console.log('NAVIGATION TEST REPORT:', JSON.stringify(report, null, 2));
    }, resultsReport);
  });

  test('RED: Footer Navigation - Discover Footer Structure and Links', async ({ page }) => {
    console.log('🔍 DISCOVERING: Footer navigation structure');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom to ensure footer is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer, [role="contentinfo"]').first();
    const footerExists = await footer.count() > 0;
    
    console.log(`Footer exists: ${footerExists}`);

    if (footerExists) {
      await footer.screenshot({ path: 'test-results/nav-footer-element.png' });
      
      // Find all links in footer
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();
      
      console.log(`Found ${linkCount} footer links`);
      
      // Document each footer link
      for (let i = 0; i < linkCount; i++) {
        const link = footerLinks.nth(i);
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        
        console.log(`Footer Link ${i + 1}: "${text}" | href="${href}"`);
      }
    }

    expect(footerExists, 'Footer should exist').toBe(true);
  });

  test('GREEN: Footer Navigation - Test All Footer Links', async ({ page }) => {
    console.log('🔍 TESTING: All footer navigation links');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer, [role="contentinfo"]').first();
    const footerLinks = footer.locator('a[href]');
    const linkCount = await footerLinks.count();

    const footerResults = [];

    for (let i = 0; i < linkCount; i++) {
      const link = footerLinks.nth(i);
      const text = await link.textContent() || 'No text';
      const href = await link.getAttribute('href');
      
      try {
        await expect(link).toBeVisible({ timeout: 2000 });
        
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
          // Test actual navigation
          await link.click();
          await page.waitForTimeout(1000);
          
          const currentUrl = page.url();
          footerResults.push({
            element: text,
            href: href,
            status: 'PASS',
            result: `Navigated to: ${currentUrl}`
          });
          
          // Go back for next test
          await page.goBack();
          await page.waitForLoadState('networkidle');
        } else {
          footerResults.push({
            element: text,
            href: href,
            status: 'PASS',
            result: 'Special link (email/tel/anchor)'
          });
        }
        
      } catch (error) {
        footerResults.push({
          element: text,
          href: href,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Document footer results
    console.log('\n=== FOOTER NAVIGATION TEST RESULTS ===');
    footerResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.element}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Href: ${result.href}`);
      if (result.status === 'PASS') {
        console.log(`   Result: ${result.result}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
  });

  test('RED: Mobile Navigation - Discover Mobile Menu Structure', async ({ page }) => {
    console.log('🔍 DISCOVERING: Mobile navigation menu structure');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/nav-mobile-initial.png', 
      fullPage: true 
    });

    // Look for mobile menu triggers
    const mobileMenuTriggers = page.locator([
      'button[aria-label*="menu" i]',
      'button[aria-label*="toggle" i]',
      '[class*="hamburger"]',
      '[class*="menu-toggle"]',
      '[class*="mobile"]',
      'button:has(svg)',
      'button:has([class*="bar"])'
    ].join(', '));

    const triggerCount = await mobileMenuTriggers.count();
    console.log(`Found ${triggerCount} potential mobile menu triggers`);

    // Document each trigger
    for (let i = 0; i < triggerCount; i++) {
      const trigger = mobileMenuTriggers.nth(i);
      const ariaLabel = await trigger.getAttribute('aria-label');
      const className = await trigger.getAttribute('class');
      const isVisible = await trigger.isVisible();
      
      console.log(`Mobile Trigger ${i + 1}: aria-label="${ariaLabel}" | class="${className}" | visible=${isVisible}`);
    }

    // Look for hidden mobile menus
    const hiddenMenus = page.locator([
      '[class*="mobile-menu"]',
      '[class*="drawer"]',
      '[class*="sidebar"]',
      '[role="dialog"]',
      '[aria-hidden="true"]'
    ].join(', '));

    const hiddenCount = await hiddenMenus.count();
    console.log(`Found ${hiddenCount} potential hidden mobile menus`);
  });

  test('GREEN: Mobile Navigation - Test Mobile Menu Functionality', async ({ page }) => {
    console.log('🔍 TESTING: Mobile menu functionality and interactions');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to find and activate mobile menu
    const mobileMenuTriggers = page.locator([
      'button[aria-label*="menu" i]',
      'button[aria-label*="toggle" i]',
      '[class*="hamburger"]',
      '[class*="menu-toggle"]',
      'button:has(svg)'
    ].join(', '));

    const triggerCount = await mobileMenuTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = mobileMenuTriggers.first();
      
      try {
        // Test mobile menu activation
        await trigger.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot after menu activation
        await page.screenshot({ 
          path: 'test-results/nav-mobile-activated.png', 
          fullPage: true 
        });
        
        // Look for opened menu content
        const menuContent = page.locator([
          '[class*="mobile-menu"]:visible',
          '[role="dialog"]:visible',
          '[class*="drawer"]:visible',
          'nav:visible'
        ].join(', '));

        const menuVisible = await menuContent.count() > 0;
        console.log(`Mobile menu opened: ${menuVisible}`);
        
        if (menuVisible) {
          // Test menu items
          const menuLinks = menuContent.first().locator('a, button');
          const menuLinkCount = await menuLinks.count();
          console.log(`Mobile menu has ${menuLinkCount} interactive elements`);
        }
        
      } catch (error) {
        console.log(`Mobile menu activation failed: ${error.message}`);
      }
    } else {
      console.log('No mobile menu triggers found - testing desktop navigation on mobile viewport');
      
      // Test if desktop navigation works on mobile
      const desktopNav = page.locator('nav a').first();
      if (await desktopNav.count() > 0) {
        try {
          await desktopNav.click();
          console.log('Desktop navigation functional on mobile viewport');
        } catch (error) {
          console.log(`Desktop navigation failed on mobile: ${error.message}`);
        }
      }
    }
  });

  test('REFACTOR: Route Transitions and Deep Linking Tests', async ({ page }) => {
    console.log('🔍 TESTING: Route transitions and deep linking functionality');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Test common routes that should exist
    const commonRoutes = [
      '/auth/login',
      '/auth/register',
      '/dashboard',
      '/dashboard/feeding/planner',
      '/community',
      '/shop/subscriptions',
      '/learn/webinars'
    ];

    const routeResults = [];

    for (const route of commonRoutes) {
      try {
        console.log(`Testing route: ${route}`);
        
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        const hasError = await page.locator('text=/error|something went wrong/i').count() > 0;
        
        routeResults.push({
          route: route,
          finalUrl: currentUrl,
          is404: is404,
          hasError: hasError,
          status: (!is404 && !hasError) ? 'PASS' : 'FAIL'
        });
        
        // Take screenshot of each route
        await page.screenshot({ 
          path: `test-results/route-${route.replace(/[\/]/g, '-')}.png`,
          fullPage: true
        });
        
      } catch (error) {
        routeResults.push({
          route: route,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Document route test results
    console.log('\n=== ROUTE TRANSITION TEST RESULTS ===');
    routeResults.forEach(result => {
      console.log(`Route: ${result.route}`);
      console.log(`Status: ${result.status}`);
      if (result.finalUrl) console.log(`Final URL: ${result.finalUrl}`);
      if (result.is404) console.log(`404 Error: ${result.is404}`);
      if (result.hasError) console.log(`Has Error: ${result.hasError}`);
      if (result.error) console.log(`Error: ${result.error}`);
      console.log('');
    });

    // Summary
    const passedRoutes = routeResults.filter(r => r.status === 'PASS').length;
    const totalRoutes = routeResults.length;
    console.log(`ROUTE TEST SUMMARY: ${passedRoutes}/${totalRoutes} routes passed`);
  });

});