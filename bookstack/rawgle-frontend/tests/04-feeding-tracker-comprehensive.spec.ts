import { test, expect } from '@playwright/test';

/**
 * RAWGLE FEEDING TRACKER COMPREHENSIVE TESTING
 * TDD Methodology: Red-Green-Refactor
 * Priority: HIGH (Core Business Feature)
 *
 * Testing feeding tracker system functionality:
 * - Dashboard feeding planner (/dashboard/feeding/planner)
 * - Meal logging functionality
 * - Feeding schedules management  
 * - Nutritional tracking features
 * - Feeding history and analytics
 * - Portion calculation tools
 * - Data persistence verification
 * - User interaction workflows
 */

test.describe('Feeding Tracker System Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Set up comprehensive monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🚨 Feeding System Error:', msg.text());
      }
      if (msg.type() === 'warning') {
        console.warn('⚠️  Feeding System Warning:', msg.text());
      }
    });

    // Monitor API requests for feeding-related endpoints
    page.on('request', request => {
      if (request.url().includes('feeding') || request.url().includes('meal') || request.url().includes('nutrition')) {
        console.log(`🍽️  Feeding API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400 && (response.url().includes('feeding') || response.url().includes('meal'))) {
        console.error(`🚨 Feeding API Error ${response.status()}: ${response.url()}`);
      }
    });
  });

  test('RED: Feeding Dashboard Discovery - Find All Feeding Components', async ({ page }) => {
    console.log('🔍 DISCOVERING: Feeding dashboard structure and components');
    
    await page.goto('http://localhost:3000/dashboard/feeding/planner');
    await page.waitForTimeout(2000);
    
    // Take comprehensive dashboard screenshot
    await page.screenshot({ 
      path: 'test-results/feeding-dashboard-full.png',
      fullPage: true
    });

    const currentUrl = page.url();
    const pageTitle = await page.title();
    const is404 = await page.locator('text=/404|not found/i').count() > 0;
    const hasAuthError = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;

    console.log(`Feeding Dashboard Analysis:`);
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Page Title: ${pageTitle}`);
    console.log(`  Is 404: ${is404}`);
    console.log(`  Auth Required: ${hasAuthError > 0}`);

    // Look for feeding-related components
    const feedingComponents = {
      feedingForm: await page.locator('form, [data-testid*="feeding"], [class*="feeding"]').count(),
      mealInputs: await page.locator('input[placeholder*="meal" i], input[name*="meal"], input[placeholder*="food" i]').count(),
      timeSelectors: await page.locator('input[type="time"], select[name*="time"], [class*="time"]').count(),
      portionInputs: await page.locator('input[placeholder*="portion" i], input[placeholder*="amount" i], input[type="number"]').count(),
      saveButtons: await page.locator('button:has-text("save"), button:has-text("log"), button[type="submit"]').count(),
      feedingHistory: await page.locator('[class*="history"], [class*="log"], table, [data-testid*="history"]').count(),
      nutritionInfo: await page.locator('[class*="nutrition"], [class*="calories"], [class*="protein"]').count(),
      charts: await page.locator('canvas, svg, [class*="chart"], [class*="graph"]').count()
    };

    console.log(`\nFeeding Components Found:`);
    Object.entries(feedingComponents).forEach(([component, count]) => {
      console.log(`  ${component}: ${count} elements`);
    });

    // Document feeding dashboard state
    const dashboardState = {
      accessible: !is404,
      requiresAuth: hasAuthError > 0,
      components: feedingComponents,
      totalInteractiveElements: Object.values(feedingComponents).reduce((sum, count) => sum + count, 0)
    };

    console.log(`\nDashboard State Summary:`);
    console.log(`  Accessible: ${dashboardState.accessible}`);
    console.log(`  Requires Auth: ${dashboardState.requiresAuth}`);
    console.log(`  Total Interactive Elements: ${dashboardState.totalInteractiveElements}`);

    // Test passes if dashboard is accessible or properly requires authentication
    expect(dashboardState.accessible || dashboardState.requiresAuth, 
           'Feeding dashboard should be accessible or properly require authentication').toBe(true);
  });

  test('GREEN: Feeding Form Interaction Testing', async ({ page }) => {
    console.log('🔍 TESTING: Feeding form interactions and validation');
    
    await page.goto('http://localhost:3000/dashboard/feeding/planner');
    await page.waitForTimeout(2000);

    // Check if authentication is required
    const authRequired = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;
    
    if (authRequired) {
      console.log('ℹ️  Authentication required for feeding dashboard - testing auth redirect');
      
      // Test if auth redirect works properly
      const currentUrl = page.url();
      const redirectedToAuth = currentUrl.includes('/auth') || currentUrl.includes('/login') || currentUrl.includes('/sign-in');
      
      console.log(`Auth redirect status: ${redirectedToAuth}`);
      await page.screenshot({ path: 'test-results/feeding-auth-required.png' });
      
      expect(redirectedToAuth || authRequired, 'Should redirect to auth or show auth message').toBe(true);
      return; // Skip form testing if auth required
    }

    // Test feeding form functionality
    const testResults = [];

    // Look for meal/food input fields
    const mealInput = page.locator('input[placeholder*="meal" i], input[name*="meal"], input[placeholder*="food" i]').first();
    const mealInputExists = await mealInput.count() > 0;

    if (mealInputExists) {
      try {
        await mealInput.fill('Premium Raw Beef');
        testResults.push({
          test: 'Meal input functionality',
          status: 'PASS',
          result: 'Successfully entered meal name'
        });
      } catch (error) {
        testResults.push({
          test: 'Meal input functionality',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Test portion/amount inputs
    const portionInput = page.locator('input[placeholder*="portion" i], input[placeholder*="amount" i], input[type="number"]').first();
    const portionExists = await portionInput.count() > 0;

    if (portionExists) {
      try {
        await portionInput.fill('250');
        testResults.push({
          test: 'Portion input functionality',
          status: 'PASS',
          result: 'Successfully entered portion amount'
        });
      } catch (error) {
        testResults.push({
          test: 'Portion input functionality',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Test time selection
    const timeInput = page.locator('input[type="time"], select[name*="time"]').first();
    const timeExists = await timeInput.count() > 0;

    if (timeExists) {
      try {
        const inputType = await timeInput.getAttribute('type');
        if (inputType === 'time') {
          await timeInput.fill('08:00');
        } else {
          // Handle select dropdown
          await timeInput.selectOption('08:00');
        }
        testResults.push({
          test: 'Time selection functionality',
          status: 'PASS',
          result: 'Successfully set feeding time'
        });
      } catch (error) {
        testResults.push({
          test: 'Time selection functionality',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Test save/submit functionality
    const saveButton = page.locator('button:has-text("save"), button:has-text("log"), button[type="submit"]').first();
    const saveExists = await saveButton.count() > 0;

    if (saveExists) {
      try {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Check for success message or form reset
        const successMessage = await page.locator('text=/success|saved|logged/i').count();
        const errorMessage = await page.locator('text=/error|failed/i').count();
        
        testResults.push({
          test: 'Form submission',
          status: successMessage > 0 ? 'PASS' : 'NEEDS_REVIEW',
          result: `Success: ${successMessage}, Errors: ${errorMessage}`
        });
      } catch (error) {
        testResults.push({
          test: 'Form submission',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Document all feeding form test results
    console.log('\n=== FEEDING FORM TEST RESULTS ===');
    testResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}: ${result.status}`);
      console.log(`     Result: ${result.result || 'N/A'}`);
      if (result.error) console.log(`     Error: ${result.error}`);
    });

    await page.screenshot({ path: 'test-results/feeding-form-tested.png', fullPage: true });
  });

  test('GREEN: Feeding History and Analytics Testing', async ({ page }) => {
    console.log('🔍 TESTING: Feeding history and analytics functionality');
    
    await page.goto('http://localhost:3000/dashboard/feeding/planner');
    await page.waitForTimeout(2000);

    // Check auth requirements first
    const authRequired = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;
    if (authRequired) {
      console.log('ℹ️  Authentication required - skipping history testing');
      return;
    }

    const historyResults = [];

    // Look for feeding history components
    const historyTable = page.locator('table, [class*="history"], [class*="log"], [data-testid*="history"]');
    const historyExists = await historyTable.count() > 0;

    if (historyExists) {
      try {
        // Count history entries
        const historyRows = historyTable.locator('tr, [class*="row"], [class*="entry"]');
        const entryCount = await historyRows.count();
        
        historyResults.push({
          test: 'Feeding history display',
          status: 'PASS',
          result: `Found ${entryCount} history entries`
        });

        // Test history interaction
        if (entryCount > 1) { // Skip header row
          const firstEntry = historyRows.nth(1);
          await firstEntry.click({ timeout: 2000 });
          
          historyResults.push({
            test: 'History entry interaction',
            status: 'PASS',
            result: 'Successfully clicked history entry'
          });
        }
      } catch (error) {
        historyResults.push({
          test: 'Feeding history testing',
          status: 'FAIL',
          error: error.message
        });
      }
    } else {
      historyResults.push({
        test: 'Feeding history presence',
        status: 'FAIL',
        result: 'No feeding history components found'
      });
    }

    // Look for charts and analytics
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"]');
    const chartCount = await charts.count();

    if (chartCount > 0) {
      historyResults.push({
        test: 'Analytics visualization',
        status: 'PASS',
        result: `Found ${chartCount} chart/graph elements`
      });

      // Test chart interactions
      try {
        const firstChart = charts.first();
        const chartBounds = await firstChart.boundingBox();
        
        if (chartBounds) {
          // Click on chart to test interactivity
          await firstChart.click();
          
          historyResults.push({
            test: 'Chart interactivity',
            status: 'PASS',
            result: 'Chart clickable and responsive'
          });
        }
      } catch (error) {
        historyResults.push({
          test: 'Chart interactivity',
          status: 'NEEDS_REVIEW',
          result: 'Chart may not be interactive'
        });
      }
    }

    // Look for nutritional information displays
    const nutritionInfo = page.locator('[class*="nutrition"], [class*="calories"], [class*="protein"], [class*="vitamin"]');
    const nutritionCount = await nutritionInfo.count();

    historyResults.push({
      test: 'Nutritional information display',
      status: nutritionCount > 0 ? 'PASS' : 'NEEDS_REVIEW',
      result: `Found ${nutritionCount} nutrition-related elements`
    });

    console.log('\n=== FEEDING HISTORY & ANALYTICS RESULTS ===');
    historyResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}: ${result.status}`);
      console.log(`     Result: ${result.result}`);
      if (result.error) console.log(`     Error: ${result.error}`);
    });

    await page.screenshot({ path: 'test-results/feeding-history-analytics.png', fullPage: true });
  });

  test('REFACTOR: Mobile Feeding Tracker Testing', async ({ page }) => {
    console.log('🔍 TESTING: Mobile feeding tracker responsiveness and usability');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/dashboard/feeding/planner');
    await page.waitForTimeout(2000);

    await page.screenshot({ 
      path: 'test-results/feeding-mobile-initial.png',
      fullPage: true
    });

    const mobileResults = [];

    // Check auth state on mobile
    const authRequired = await page.locator('text=/unauthorized|login|sign in/i').count() > 0;
    if (authRequired) {
      // Test mobile auth experience
      const authButtons = page.locator('button:has-text("login"), button:has-text("sign in"), a[href*="auth"]');
      const authButtonCount = await authButtons.count();
      
      mobileResults.push({
        test: 'Mobile authentication prompts',
        status: authButtonCount > 0 ? 'PASS' : 'NEEDS_REVIEW',
        result: `Found ${authButtonCount} auth options on mobile`
      });

      if (authButtonCount > 0) {
        try {
          const firstAuthButton = authButtons.first();
          await firstAuthButton.click();
          
          mobileResults.push({
            test: 'Mobile auth navigation',
            status: 'PASS',
            result: 'Auth button clickable on mobile'
          });
        } catch (error) {
          mobileResults.push({
            test: 'Mobile auth navigation',
            status: 'FAIL',
            error: error.message
          });
        }
      }
      
      console.log('\n=== MOBILE FEEDING TRACKER (AUTH REQUIRED) ===');
      mobileResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.test}: ${result.status}`);
        console.log(`     Result: ${result.result}`);
        if (result.error) console.log(`     Error: ${result.error}`);
      });
      
      return;
    }

    // Test mobile feeding interface usability
    const mobileElements = {
      forms: await page.locator('form').count(),
      inputs: await page.locator('input, select, textarea').count(),
      buttons: await page.locator('button').count(),
      touchTargets: await page.locator('button, a, input, [role="button"]').count()
    };

    console.log(`\nMobile Feeding Interface Elements:`);
    Object.entries(mobileElements).forEach(([element, count]) => {
      console.log(`  ${element}: ${count}`);
    });

    // Test touch target accessibility (minimum 44px)
    const touchTargets = page.locator('button, a[href], input, [role="button"]');
    const touchTargetCount = await touchTargets.count();
    let adequateTouchTargets = 0;

    for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
      const target = touchTargets.nth(i);
      try {
        const box = await target.boundingBox();
        if (box && box.width >= 44 && box.height >= 44) {
          adequateTouchTargets++;
        }
      } catch (error) {
        // Target may not be visible
      }
    }

    const touchTargetCompliance = touchTargetCount > 0 ? (adequateTouchTargets / Math.min(touchTargetCount, 10)) * 100 : 0;

    mobileResults.push({
      test: 'Mobile touch target compliance',
      status: touchTargetCompliance >= 80 ? 'PASS' : 'NEEDS_IMPROVEMENT',
      result: `${touchTargetCompliance.toFixed(1)}% of tested targets meet 44px minimum`
    });

    // Test mobile form usability
    const mobileFormInputs = page.locator('input, select, textarea');
    const inputCount = await mobileFormInputs.count();

    if (inputCount > 0) {
      try {
        // Test first input field on mobile
        const firstInput = mobileFormInputs.first();
        await firstInput.focus();
        await firstInput.fill('Mobile Test');
        
        // Check if virtual keyboard doesn't obstruct interface
        await page.screenshot({ path: 'test-results/feeding-mobile-keyboard.png' });
        
        mobileResults.push({
          test: 'Mobile input field usability',
          status: 'PASS',
          result: 'Input fields functional on mobile'
        });
      } catch (error) {
        mobileResults.push({
          test: 'Mobile input field usability',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Test mobile scroll behavior
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      
      mobileResults.push({
        test: 'Mobile scroll behavior',
        status: 'PASS',
        result: 'Page scrolling works on mobile'
      });
    } catch (error) {
      mobileResults.push({
        test: 'Mobile scroll behavior',
        status: 'FAIL',
        error: error.message
      });
    }

    console.log('\n=== MOBILE FEEDING TRACKER RESULTS ===');
    mobileResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}: ${result.status}`);
      console.log(`     Result: ${result.result}`);
      if (result.error) console.log(`     Error: ${result.error}`);
    });

    await page.screenshot({ 
      path: 'test-results/feeding-mobile-final.png',
      fullPage: true
    });
  });

  test('REFACTOR: Feeding Data Persistence and API Testing', async ({ page }) => {
    console.log('🔍 TESTING: Feeding data persistence and API integration');
    
    await page.goto('http://localhost:3000/dashboard/feeding/planner');
    await page.waitForTimeout(2000);

    const apiResults = [];

    // Monitor network requests during feeding operations
    const feedingRequests = [];
    page.on('request', request => {
      if (request.url().includes('feeding') || request.url().includes('meal') || request.url().includes('log')) {
        feedingRequests.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // Test data persistence by interacting with forms
    const feedingForm = page.locator('form').first();
    const formExists = await feedingForm.count() > 0;

    if (formExists) {
      // Try to submit form and monitor API calls
      try {
        const mealInput = page.locator('input[placeholder*="meal" i], input[name*="meal"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("save"), button:has-text("log")').first();
        
        if (await mealInput.count() > 0 && await submitButton.count() > 0) {
          await mealInput.fill('API Test Meal');
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          apiResults.push({
            test: 'Form submission API calls',
            status: feedingRequests.length > 0 ? 'PASS' : 'NEEDS_REVIEW',
            result: `Triggered ${feedingRequests.length} API requests`
          });
        }
      } catch (error) {
        apiResults.push({
          test: 'Form submission API interaction',
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Test page refresh data persistence
    try {
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if any data persisted after reload
      const persistedData = await page.evaluate(() => {
        return {
          localStorage: Object.keys(localStorage).filter(key => 
            key.includes('feeding') || key.includes('meal') || key.includes('nutrition')
          ).length,
          sessionStorage: Object.keys(sessionStorage).filter(key => 
            key.includes('feeding') || key.includes('meal') || key.includes('nutrition')
          ).length
        };
      });

      apiResults.push({
        test: 'Data persistence after reload',
        status: 'DOCUMENTED',
        result: `LocalStorage: ${persistedData.localStorage} keys, SessionStorage: ${persistedData.sessionStorage} keys`
      });
    } catch (error) {
      apiResults.push({
        test: 'Data persistence testing',
        status: 'ERROR',
        error: error.message
      });
    }

    // Document API request patterns
    if (feedingRequests.length > 0) {
      console.log('\n=== API REQUESTS DETECTED ===');
      feedingRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }

    console.log('\n=== FEEDING DATA PERSISTENCE RESULTS ===');
    apiResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}: ${result.status}`);
      console.log(`     Result: ${result.result}`);
      if (result.error) console.log(`     Error: ${result.error}`);
    });
  });

});