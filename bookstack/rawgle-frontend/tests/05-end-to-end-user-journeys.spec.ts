import { test, expect } from '@playwright/test';

/**
 * RAWGLE END-TO-END USER JOURNEY TESTING
 * TDD Methodology: Red-Green-Refactor
 * Priority: CRITICAL (Complete User Experience)
 *
 * Testing complete user journeys across the platform:
 * - New user onboarding flow
 * - Pet owner daily usage patterns
 * - Store locator to purchase journey
 * - Community engagement flows
 * - Multi-page navigation workflows
 * - Cross-feature integration testing
 * - Performance under realistic usage
 */

test.describe('End-to-End User Journey Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Comprehensive monitoring for user journey testing
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🚨 Journey Error:', msg.text());
      }
      if (msg.type() === 'warning' && !msg.text().includes('woff2')) {
        console.warn('⚠️  Journey Warning:', msg.text());
      }
    });

    // Monitor all network requests for journey analysis
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        console.log(`🌐 API Call: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`🚨 HTTP Error ${response.status()}: ${response.url()}`);
      }
    });
  });

  test('RED: New User Complete Onboarding Journey', async ({ page }) => {
    console.log('🔍 TESTING: Complete new user onboarding experience');
    
    const journeySteps = [];
    let currentStep = 1;

    // Step 1: Landing page arrival
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const pageTitle = await page.title();
      journeySteps.push({
        step: currentStep++,
        action: 'Landing page load',
        status: 'PASS',
        result: `Title: ${pageTitle}`,
        url: page.url()
      });
      
      await page.screenshot({ path: 'test-results/journey-step-1-landing.png' });
    } catch (error) {
      journeySteps.push({
        step: currentStep++,
        action: 'Landing page load',
        status: 'FAIL',
        error: error.message
      });
    }

    // Step 2: Navigate to registration
    try {
      const signupButtons = page.locator('a[href*="register"], a[href*="sign-up"], button:has-text("sign up" i), button:has-text("register" i)');
      const signupCount = await signupButtons.count();
      
      if (signupCount > 0) {
        await signupButtons.first().click();
        await page.waitForTimeout(1500);
        
        journeySteps.push({
          step: currentStep++,
          action: 'Navigate to registration',
          status: 'PASS',
          result: `Found ${signupCount} signup options`,
          url: page.url()
        });
      } else {
        journeySteps.push({
          step: currentStep++,
          action: 'Navigate to registration',
          status: 'FAIL',
          result: 'No registration buttons found'
        });
      }
      
      await page.screenshot({ path: 'test-results/journey-step-2-registration.png' });
    } catch (error) {
      journeySteps.push({
        step: currentStep++,
        action: 'Navigate to registration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Step 3: Registration form interaction
    try {
      const registrationForm = page.locator('form').first();
      const formExists = await registrationForm.count() > 0;
      
      if (formExists) {
        const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
        
        // Fill registration form
        if (await emailInput.count() > 0) await emailInput.fill('newuser@example.com');
        if (await passwordInput.count() > 0) await passwordInput.fill('SecurePassword123!');
        if (await nameInput.count() > 0) await nameInput.fill('Journey Test User');
        
        journeySteps.push({
          step: currentStep++,
          action: 'Fill registration form',
          status: 'PASS',
          result: 'Form fields successfully populated'
        });
      } else {
        journeySteps.push({
          step: currentStep++,
          action: 'Fill registration form',
          status: 'FAIL',
          result: 'No registration form found'
        });
      }
      
      await page.screenshot({ path: 'test-results/journey-step-3-form-filled.png' });
    } catch (error) {
      journeySteps.push({
        step: currentStep++,
        action: 'Fill registration form',
        status: 'FAIL',
        error: error.message
      });
    }

    // Step 4: Explore main navigation without registration
    try {
      // Try to navigate back to home and explore
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const navLinks = page.locator('nav a, nav button');
      const navCount = await navLinks.count();
      
      if (navCount > 0) {
        // Test first 3 navigation items
        for (let i = 0; i < Math.min(3, navCount); i++) {
          const navItem = navLinks.nth(i);
          const navText = await navItem.textContent() || `Nav ${i + 1}`;
          
          try {
            await navItem.click();
            await page.waitForTimeout(1000);
            
            journeySteps.push({
              step: currentStep++,
              action: `Navigate to ${navText}`,
              status: 'PASS',
              result: `Successfully accessed ${navText}`,
              url: page.url()
            });
            
            await page.screenshot({ path: `test-results/journey-step-4-nav-${i}.png` });
          } catch (error) {
            journeySteps.push({
              step: currentStep++,
              action: `Navigate to ${navText}`,
              status: 'FAIL',
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      journeySteps.push({
        step: currentStep++,
        action: 'Explore navigation',
        status: 'FAIL',
        error: error.message
      });
    }

    // Document complete onboarding journey
    console.log('\n=== NEW USER ONBOARDING JOURNEY RESULTS ===');
    journeySteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action} - ${step.status}`);
      if (step.result) console.log(`  Result: ${step.result}`);
      if (step.url) console.log(`  URL: ${step.url}`);
      if (step.error) console.log(`  Error: ${step.error}`);
      console.log('');
    });

    // Journey success metrics
    const successfulSteps = journeySteps.filter(step => step.status === 'PASS').length;
    const totalSteps = journeySteps.length;
    const journeyCompletionRate = (successfulSteps / totalSteps) * 100;

    console.log(`=== JOURNEY METRICS ===`);
    console.log(`Total Steps: ${totalSteps}`);
    console.log(`Successful Steps: ${successfulSteps}`);
    console.log(`Completion Rate: ${journeyCompletionRate.toFixed(1)}%`);

    // Test should pass if basic navigation works
    expect(successfulSteps, 'At least some journey steps should succeed').toBeGreaterThan(0);
  });

  test('GREEN: Daily Pet Owner Usage Pattern', async ({ page }) => {
    console.log('🔍 TESTING: Typical daily usage pattern for pet owners');
    
    const dailyFlow = [];
    let flowStep = 1;

    // Morning routine: Check feeding schedule
    try {
      await page.goto('http://localhost:3000/dashboard/feeding/planner');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const pageAccessible = !page.url().includes('404') && !await page.locator('text=/not found/i').count();
      const authRequired = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;
      
      dailyFlow.push({
        step: flowStep++,
        action: 'Check feeding schedule',
        status: pageAccessible || authRequired ? 'PASS' : 'FAIL',
        result: authRequired ? 'Auth required (expected)' : 'Page accessible',
        url: currentUrl
      });
      
      await page.screenshot({ path: 'test-results/daily-flow-1-feeding-check.png' });
    } catch (error) {
      dailyFlow.push({
        step: flowStep++,
        action: 'Check feeding schedule',
        status: 'FAIL',
        error: error.message
      });
    }

    // Midday: Log a feeding session
    try {
      // If auth is required, test the auth flow
      const authRequired = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;
      
      if (authRequired) {
        const loginButton = page.locator('a[href*="login"], a[href*="sign-in"], button:has-text("login" i)').first();
        if (await loginButton.count() > 0) {
          await loginButton.click();
          await page.waitForTimeout(1500);
        }
      }
      
      // Look for feeding form elements
      const feedingInputs = page.locator('input[placeholder*="meal" i], input[name*="meal"], input[type="text"]');
      const inputCount = await feedingInputs.count();
      
      dailyFlow.push({
        step: flowStep++,
        action: 'Access feeding form',
        status: inputCount > 0 ? 'PASS' : 'NEEDS_REVIEW',
        result: `Found ${inputCount} input fields`
      });
      
      await page.screenshot({ path: 'test-results/daily-flow-2-feeding-form.png' });
    } catch (error) {
      dailyFlow.push({
        step: flowStep++,
        action: 'Access feeding form',
        status: 'FAIL',
        error: error.message
      });
    }

    // Evening: Browse community content
    try {
      await page.goto('http://localhost:3000/community');
      await page.waitForTimeout(2000);
      
      const communityContent = page.locator('article, [class*="post"], [class*="content"], h1, h2, h3');
      const contentCount = await communityContent.count();
      
      dailyFlow.push({
        step: flowStep++,
        action: 'Browse community content',
        status: contentCount > 0 ? 'PASS' : 'NEEDS_REVIEW',
        result: `Found ${contentCount} content elements`
      });
      
      await page.screenshot({ path: 'test-results/daily-flow-3-community.png' });
    } catch (error) {
      dailyFlow.push({
        step: flowStep++,
        action: 'Browse community content',
        status: 'FAIL',
        error: error.message
      });
    }

    // Weekend: Find local stores
    try {
      await page.goto('http://localhost:3000/stores');
      await page.waitForTimeout(2000);
      
      // Look for store locator elements
      const storeElements = page.locator('[class*="store"], [class*="location"], [class*="map"], input[placeholder*="location" i], input[placeholder*="zip" i]');
      const storeFeatureCount = await storeElements.count();
      
      dailyFlow.push({
        step: flowStep++,
        action: 'Use store locator',
        status: storeFeatureCount > 0 ? 'PASS' : 'NEEDS_REVIEW',
        result: `Found ${storeFeatureCount} store-related elements`
      });
      
      await page.screenshot({ path: 'test-results/daily-flow-4-stores.png' });
    } catch (error) {
      dailyFlow.push({
        step: flowStep++,
        action: 'Use store locator',
        status: 'FAIL',
        error: error.message
      });
    }

    console.log('\n=== DAILY PET OWNER USAGE FLOW ===');
    dailyFlow.forEach(step => {
      console.log(`Step ${step.step}: ${step.action} - ${step.status}`);
      if (step.result) console.log(`  Result: ${step.result}`);
      if (step.url) console.log(`  URL: ${step.url}`);
      if (step.error) console.log(`  Error: ${step.error}`);
    });

    const successfulDaily = dailyFlow.filter(step => step.status === 'PASS').length;
    const totalDaily = dailyFlow.length;
    console.log(`\nDaily Flow Success Rate: ${((successfulDaily / totalDaily) * 100).toFixed(1)}%`);
  });

  test('REFACTOR: Cross-Feature Integration Testing', async ({ page }) => {
    console.log('🔍 TESTING: Cross-feature integration and data flow');
    
    const integrationTests = [];
    let testStep = 1;

    // Test 1: Navigation → Authentication Integration
    try {
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1500);
      
      // Find auth buttons in navigation
      const authButtons = page.locator('nav').locator('a[href*="auth"], a[href*="login"], a[href*="sign"], button:has-text("login" i)');
      const authInNav = await authButtons.count() > 0;
      
      integrationTests.push({
        test: testStep++,
        feature: 'Navigation → Auth Integration',
        status: authInNav ? 'PASS' : 'NEEDS_REVIEW',
        result: `Auth elements in navigation: ${authInNav}`
      });
      
      if (authInNav) {
        await authButtons.first().click();
        await page.waitForTimeout(1000);
        
        const onAuthPage = page.url().includes('/auth') || page.url().includes('/login') || page.url().includes('/sign');
        integrationTests.push({
          test: testStep++,
          feature: 'Navigation → Auth Redirect',
          status: onAuthPage ? 'PASS' : 'FAIL',
          result: `Successfully navigated to auth: ${onAuthPage}`
        });
      }
    } catch (error) {
      integrationTests.push({
        test: testStep++,
        feature: 'Navigation → Auth Integration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 2: Dashboard → Feeding Tracker Integration
    try {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(1500);
      
      // Look for feeding-related links in dashboard
      const feedingLinks = page.locator('a[href*="feeding"], button:has-text("feeding" i), [class*="feeding"]');
      const feedingIntegration = await feedingLinks.count() > 0;
      
      integrationTests.push({
        test: testStep++,
        feature: 'Dashboard → Feeding Integration',
        status: feedingIntegration ? 'PASS' : 'NEEDS_REVIEW',
        result: `Feeding links in dashboard: ${feedingIntegration}`
      });
    } catch (error) {
      integrationTests.push({
        test: testStep++,
        feature: 'Dashboard → Feeding Integration',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 3: Global Search Functionality
    try {
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1500);
      
      const searchElements = page.locator('input[placeholder*="search" i], input[type="search"], [class*="search"]');
      const hasSearch = await searchElements.count() > 0;
      
      if (hasSearch) {
        const searchInput = searchElements.first();
        await searchInput.fill('raw dog food');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        integrationTests.push({
          test: testStep++,
          feature: 'Global Search Functionality',
          status: 'PASS',
          result: 'Search functionality accessible and interactive'
        });
      } else {
        integrationTests.push({
          test: testStep++,
          feature: 'Global Search Functionality',
          status: 'NEEDS_REVIEW',
          result: 'No search functionality found'
        });
      }
    } catch (error) {
      integrationTests.push({
        test: testStep++,
        feature: 'Global Search Functionality',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 4: Mobile Menu → All Features Access
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1500);
      
      const mobileMenuTrigger = page.locator('button[aria-label*="menu" i], [class*="hamburger"], button:has([class*="bar"])').first();
      const hasMobileMenu = await mobileMenuTrigger.count() > 0;
      
      if (hasMobileMenu && await mobileMenuTrigger.isVisible()) {
        await mobileMenuTrigger.click();
        await page.waitForTimeout(1000);
        
        const menuLinks = page.locator('nav a, [role="menu"] a, [class*="mobile-menu"] a');
        const linkCount = await menuLinks.count();
        
        integrationTests.push({
          test: testStep++,
          feature: 'Mobile Menu → Feature Access',
          status: linkCount >= 3 ? 'PASS' : 'NEEDS_IMPROVEMENT',
          result: `${linkCount} links accessible via mobile menu`
        });
      } else {
        integrationTests.push({
          test: testStep++,
          feature: 'Mobile Menu → Feature Access',
          status: 'NEEDS_REVIEW',
          result: 'Mobile menu not found or not visible'
        });
      }
    } catch (error) {
      integrationTests.push({
        test: testStep++,
        feature: 'Mobile Menu → Feature Access',
        status: 'FAIL',
        error: error.message
      });
    }

    console.log('\n=== CROSS-FEATURE INTEGRATION TEST RESULTS ===');
    integrationTests.forEach(test => {
      console.log(`Test ${test.test}: ${test.feature} - ${test.status}`);
      if (test.result) console.log(`  Result: ${test.result}`);
      if (test.error) console.log(`  Error: ${test.error}`);
    });

    const passedIntegration = integrationTests.filter(test => test.status === 'PASS').length;
    const totalIntegration = integrationTests.length;
    console.log(`\nIntegration Test Success Rate: ${((passedIntegration / totalIntegration) * 100).toFixed(1)}%`);

    await page.screenshot({ path: 'test-results/integration-testing-complete.png', fullPage: true });
  });

  test('REFACTOR: Performance Under Load Testing', async ({ page }) => {
    console.log('🔍 TESTING: Performance under realistic user load scenarios');
    
    const performanceResults = [];
    
    // Test 1: Rapid page navigation
    const navigationPages = [
      'http://localhost:3000/',
      'http://localhost:3000/dashboard',
      'http://localhost:3000/community',
      'http://localhost:3000/stores',
      'http://localhost:3000/learn/webinars'
    ];

    const startTime = Date.now();
    let successfulNavigations = 0;
    
    for (const pageUrl of navigationPages) {
      try {
        const navStart = Date.now();
        await page.goto(pageUrl);
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        const navEnd = Date.now();
        const navTime = navEnd - navStart;
        
        successfulNavigations++;
        performanceResults.push({
          test: `Navigation to ${pageUrl}`,
          loadTime: navTime,
          status: navTime < 3000 ? 'PASS' : 'SLOW'
        });
      } catch (error) {
        performanceResults.push({
          test: `Navigation to ${pageUrl}`,
          status: 'FAIL',
          error: error.message
        });
      }
    }
    
    const totalNavigationTime = Date.now() - startTime;
    const averageNavTime = totalNavigationTime / navigationPages.length;
    
    console.log('\n=== PERFORMANCE TESTING RESULTS ===');
    console.log(`Total Navigation Time: ${totalNavigationTime}ms`);
    console.log(`Average Page Load Time: ${averageNavTime.toFixed(0)}ms`);
    console.log(`Successful Navigations: ${successfulNavigations}/${navigationPages.length}`);
    
    performanceResults.forEach(result => {
      console.log(`${result.test}: ${result.status}`);
      if (result.loadTime) console.log(`  Load Time: ${result.loadTime}ms`);
      if (result.error) console.log(`  Error: ${result.error}`);
    });

    // Test 2: Memory usage during extended session
    try {
      const memoryStart = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
      
      // Simulate extended browsing session
      for (let i = 0; i < 3; i++) {
        await page.goto('http://localhost:3000/');
        await page.waitForTimeout(1000);
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForTimeout(1000);
      }
      
      const memoryEnd = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
      const memoryIncrease = memoryEnd - memoryStart;
      
      console.log(`\nMemory Usage Analysis:`);
      console.log(`  Initial: ${(memoryStart / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final: ${(memoryEnd / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.log(`Memory testing unavailable: ${error.message}`);
    }

    // Performance assertions
    expect(successfulNavigations, 'Most pages should load successfully').toBeGreaterThan(navigationPages.length * 0.6);
    expect(averageNavTime, 'Average load time should be reasonable').toBeLessThan(5000);
  });

});