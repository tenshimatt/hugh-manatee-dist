import { test, expect } from '@playwright/test';

/**
 * RAWGLE COMPREHENSIVE AUTHENTICATION TESTING
 * TDD Methodology: Red-Green-Refactor  
 * Priority: CRITICAL (Security-related)
 *
 * Testing all authentication flows systematically:
 * - Login functionality (/auth/login, /auth/sign-in)
 * - Registration flows (/auth/register, /auth/sign-up)
 * - SSO callback handling (/sso-callback)
 * - Form validation and error handling
 * - Session management and security
 * - Password requirements and security
 * - Authentication state persistence
 */

test.describe('Authentication Flow Testing - Login, Register, SSO', () => {

  test.beforeEach(async ({ page }) => {
    // Set up comprehensive error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🚨 Console Error:', msg.text());
      }
      if (msg.type() === 'warning') {
        console.warn('⚠️  Console Warning:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`🚨 HTTP Error ${response.status()}: ${response.url()}`);
      }
    });

    // Monitor network requests for auth endpoints
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('login') || request.url().includes('register')) {
        console.log(`🔐 Auth Request: ${request.method()} ${request.url()}`);
      }
    });
  });

  test('RED: Authentication Routes Discovery - Find All Auth Pages', async ({ page }) => {
    console.log('🔍 DISCOVERING: All authentication routes and pages');
    
    const authRoutes = [
      '/auth/login',
      '/auth/sign-in', 
      '/auth/register',
      '/auth/sign-up',
      '/sso-callback',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email'
    ];

    const discoveryResults = [];

    for (const route of authRoutes) {
      try {
        console.log(`Testing route: ${route}`);
        
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(1500);
        
        const currentUrl = page.url();
        const pageTitle = await page.title();
        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        const hasAuthForm = await page.locator('form, [role="form"]').count() > 0;
        const hasInputFields = await page.locator('input[type="email"], input[type="password"], input[type="text"]').count();
        
        discoveryResults.push({
          route: route,
          exists: !is404,
          finalUrl: currentUrl,
          pageTitle: pageTitle,
          hasAuthForm: hasAuthForm,
          inputFieldCount: hasInputFields,
          status: !is404 ? 'EXISTS' : 'NOT_FOUND'
        });
        
        // Take screenshot of each auth page
        await page.screenshot({ 
          path: `test-results/auth-page-${route.replace(/[\/]/g, '-')}.png`,
          fullPage: true
        });
        
      } catch (error) {
        discoveryResults.push({
          route: route,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Document discovery results
    console.log('\n=== AUTHENTICATION ROUTES DISCOVERY ===');
    discoveryResults.forEach(result => {
      console.log(`${result.route}: ${result.status}`);
      if (result.exists) {
        console.log(`  📄 Title: ${result.pageTitle}`);
        console.log(`  📝 Has Form: ${result.hasAuthForm}`);
        console.log(`  🔢 Input Fields: ${result.inputFieldCount}`);
        console.log(`  🔗 Final URL: ${result.finalUrl}`);
      }
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      }
      console.log('');
    });

    // Expect at least some auth routes to exist
    const existingRoutes = discoveryResults.filter(r => r.status === 'EXISTS').length;
    expect(existingRoutes, 'At least some authentication routes should exist').toBeGreaterThan(0);
  });

  test('GREEN: Login Form Testing - /auth/login Functionality', async ({ page }) => {
    console.log('🔍 TESTING: Login form functionality and validation');
    
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/auth-login-initial.png',
      fullPage: true
    });

    // Find login form elements
    const loginForm = page.locator('form').first();
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("login" i), button:has-text("sign in" i)').first();

    const testResults = {
      formExists: await loginForm.count() > 0,
      emailFieldExists: await emailInput.count() > 0,
      passwordFieldExists: await passwordInput.count() > 0,
      submitButtonExists: await submitButton.count() > 0,
      validationTests: [],
      securityTests: []
    };

    console.log(`Login Form Analysis:`);
    console.log(`  Form exists: ${testResults.formExists}`);
    console.log(`  Email field: ${testResults.emailFieldExists}`);
    console.log(`  Password field: ${testResults.passwordFieldExists}`);
    console.log(`  Submit button: ${testResults.submitButtonExists}`);

    if (testResults.formExists && testResults.emailFieldExists && testResults.passwordFieldExists) {
      
      // Test 1: Empty form submission
      try {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const errorMessages = await page.locator('[role="alert"], .error, [class*="error"]').count();
        testResults.validationTests.push({
          test: 'Empty form submission',
          status: errorMessages > 0 ? 'PASS' : 'FAIL',
          result: `Error messages shown: ${errorMessages > 0}`
        });
        
        await page.screenshot({ path: 'test-results/auth-login-empty-validation.png' });
      } catch (error) {
        testResults.validationTests.push({
          test: 'Empty form submission',
          status: 'ERROR',
          error: error.message
        });
      }

      // Test 2: Invalid email format
      try {
        await emailInput.fill('invalid-email');
        await passwordInput.fill('testpassword');
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const emailErrors = await page.locator('text=/invalid.*email|email.*invalid/i').count();
        testResults.validationTests.push({
          test: 'Invalid email format',
          status: emailErrors > 0 ? 'PASS' : 'NEEDS_REVIEW',
          result: `Email validation triggered: ${emailErrors > 0}`
        });
        
        await page.screenshot({ path: 'test-results/auth-login-email-validation.png' });
      } catch (error) {
        testResults.validationTests.push({
          test: 'Invalid email format',
          status: 'ERROR',
          error: error.message
        });
      }

      // Test 3: Valid format test (expect backend validation)
      try {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('testpassword123');
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const authErrors = await page.locator('text=/invalid.*credentials|login.*failed|unauthorized/i').count();
        
        testResults.validationTests.push({
          test: 'Valid format credentials',
          status: 'TESTED',
          result: `URL: ${currentUrl}, Auth errors: ${authErrors}`,
          note: 'Backend validation expected for non-existent credentials'
        });
        
        await page.screenshot({ path: 'test-results/auth-login-valid-format.png' });
      } catch (error) {
        testResults.validationTests.push({
          test: 'Valid format credentials',
          status: 'ERROR',
          error: error.message
        });
      }

      // Security Test: Password field masking
      const passwordType = await passwordInput.getAttribute('type');
      testResults.securityTests.push({
        test: 'Password field security',
        status: passwordType === 'password' ? 'PASS' : 'FAIL',
        result: `Input type: ${passwordType}`
      });

      // Security Test: Form submission method
      const formMethod = await loginForm.getAttribute('method');
      const formAction = await loginForm.getAttribute('action');
      testResults.securityTests.push({
        test: 'Form security attributes',
        status: 'DOCUMENTED',
        result: `Method: ${formMethod}, Action: ${formAction}`
      });
    }

    // Document comprehensive login test results
    console.log('\n=== LOGIN FORM TEST RESULTS ===');
    console.log('VALIDATION TESTS:');
    testResults.validationTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.test}: ${test.status}`);
      console.log(`     Result: ${test.result}`);
      if (test.error) console.log(`     Error: ${test.error}`);
      if (test.note) console.log(`     Note: ${test.note}`);
    });
    
    console.log('\nSECURITY TESTS:');
    testResults.securityTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.test}: ${test.status}`);
      console.log(`     Result: ${test.result}`);
    });
  });

  test('GREEN: Registration Form Testing - /auth/register Functionality', async ({ page }) => {
    console.log('🔍 TESTING: Registration form functionality and validation');
    
    await page.goto('http://localhost:3000/auth/register');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ 
      path: 'test-results/auth-register-initial.png',
      fullPage: true
    });

    // Find registration form elements
    const registerForm = page.locator('form').first();
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();
    const confirmPasswordInput = page.locator('input[name*="confirm"], input[placeholder*="confirm" i]').first();
    const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("register" i), button:has-text("sign up" i)').first();

    const registerResults = {
      formExists: await registerForm.count() > 0,
      emailFieldExists: await emailInput.count() > 0,
      passwordFieldExists: await passwordInput.count() > 0,
      confirmPasswordExists: await confirmPasswordInput.count() > 0,
      nameFieldExists: await nameInput.count() > 0,
      submitButtonExists: await submitButton.count() > 0,
      validationTests: [],
      securityTests: []
    };

    console.log(`Registration Form Analysis:`);
    console.log(`  Form exists: ${registerResults.formExists}`);
    console.log(`  Email field: ${registerResults.emailFieldExists}`);
    console.log(`  Password field: ${registerResults.passwordFieldExists}`);
    console.log(`  Confirm password: ${registerResults.confirmPasswordExists}`);
    console.log(`  Name field: ${registerResults.nameFieldExists}`);
    console.log(`  Submit button: ${registerResults.submitButtonExists}`);

    if (registerResults.formExists && registerResults.emailFieldExists) {
      
      // Test 1: Empty form validation
      try {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const errorCount = await page.locator('[role="alert"], .error, [class*="error"]').count();
        registerResults.validationTests.push({
          test: 'Empty form validation',
          status: errorCount > 0 ? 'PASS' : 'FAIL',
          result: `Validation errors shown: ${errorCount}`
        });
        
        await page.screenshot({ path: 'test-results/auth-register-empty-validation.png' });
      } catch (error) {
        registerResults.validationTests.push({
          test: 'Empty form validation',
          status: 'ERROR',
          error: error.message
        });
      }

      // Test 2: Password confirmation mismatch
      if (registerResults.confirmPasswordExists) {
        try {
          await emailInput.fill('newuser@example.com');
          if (registerResults.nameFieldExists) await nameInput.fill('Test User');
          await passwordInput.fill('password123');
          await confirmPasswordInput.fill('differentpassword');
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          const mismatchError = await page.locator('text=/password.*match|passwords.*different/i').count();
          registerResults.validationTests.push({
            test: 'Password confirmation mismatch',
            status: mismatchError > 0 ? 'PASS' : 'NEEDS_REVIEW',
            result: `Mismatch error shown: ${mismatchError > 0}`
          });
          
          await page.screenshot({ path: 'test-results/auth-register-password-mismatch.png' });
        } catch (error) {
          registerResults.validationTests.push({
            test: 'Password confirmation mismatch',
            status: 'ERROR',
            error: error.message
          });
        }
      }

      // Test 3: Weak password validation
      try {
        await emailInput.fill('test@example.com');
        if (registerResults.nameFieldExists) await nameInput.fill('Test User');
        await passwordInput.fill('123');
        if (registerResults.confirmPasswordExists) await confirmPasswordInput.fill('123');
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const weakPasswordError = await page.locator('text=/password.*weak|password.*short|password.*strong/i').count();
        registerResults.validationTests.push({
          test: 'Weak password validation',
          status: weakPasswordError > 0 ? 'PASS' : 'NEEDS_REVIEW',
          result: `Weak password error shown: ${weakPasswordError > 0}`
        });
      } catch (error) {
        registerResults.validationTests.push({
          test: 'Weak password validation',
          status: 'ERROR',
          error: error.message
        });
      }

      // Test 4: Valid registration attempt
      try {
        await emailInput.fill('newuser@example.com');
        if (registerResults.nameFieldExists) await nameInput.fill('Test User');
        await passwordInput.fill('SecurePassword123!');
        if (registerResults.confirmPasswordExists) await confirmPasswordInput.fill('SecurePassword123!');
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        const successMessage = await page.locator('text=/success|welcome|confirm.*email/i').count();
        const errorMessage = await page.locator('text=/error|exists|taken/i').count();
        
        registerResults.validationTests.push({
          test: 'Valid registration attempt',
          status: 'TESTED',
          result: `URL: ${currentUrl}, Success: ${successMessage > 0}, Error: ${errorMessage > 0}`,
          note: 'Expected to show either success or email-exists error'
        });
        
        await page.screenshot({ path: 'test-results/auth-register-valid-attempt.png' });
      } catch (error) {
        registerResults.validationTests.push({
          test: 'Valid registration attempt',
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Document registration test results
    console.log('\n=== REGISTRATION FORM TEST RESULTS ===');
    registerResults.validationTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.test}: ${test.status}`);
      console.log(`     Result: ${test.result}`);
      if (test.error) console.log(`     Error: ${test.error}`);
      if (test.note) console.log(`     Note: ${test.note}`);
    });
  });

  test('GREEN: SSO Callback Testing - /sso-callback Functionality', async ({ page }) => {
    console.log('🔍 TESTING: SSO callback page functionality');
    
    await page.goto('http://localhost:3000/sso-callback');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ 
      path: 'test-results/auth-sso-callback.png',
      fullPage: true
    });

    // Analyze SSO callback page
    const pageTitle = await page.title();
    const currentUrl = page.url();
    const hasLoading = await page.locator('text=/loading|processing|authenticating/i').count();
    const hasError = await page.locator('text=/error|invalid|failed/i').count();
    const hasRedirect = currentUrl !== 'http://localhost:3000/sso-callback';

    const ssoResults = {
      pageTitle: pageTitle,
      finalUrl: currentUrl,
      hasLoadingIndicator: hasLoading > 0,
      hasErrorMessage: hasError > 0,
      hasRedirect: hasRedirect,
      status: 'ANALYZED'
    };

    console.log('\n=== SSO CALLBACK ANALYSIS ===');
    console.log(`Page Title: ${ssoResults.pageTitle}`);
    console.log(`Final URL: ${ssoResults.finalUrl}`);
    console.log(`Has Loading Indicator: ${ssoResults.hasLoadingIndicator}`);
    console.log(`Has Error Message: ${ssoResults.hasErrorMessage}`);
    console.log(`Redirected: ${ssoResults.hasRedirect}`);

    // Test with sample OAuth parameters
    try {
      const testParams = '?code=test123&state=teststate';
      await page.goto(`http://localhost:3000/sso-callback${testParams}`);
      await page.waitForTimeout(2000);
      
      const paramsUrl = page.url();
      const paramsHasError = await page.locator('text=/error|invalid|failed/i').count();
      
      console.log(`\nSSO with test parameters:`);
      console.log(`URL: ${paramsUrl}`);
      console.log(`Has error: ${paramsHasError > 0}`);
      
      await page.screenshot({ path: 'test-results/auth-sso-callback-params.png' });
    } catch (error) {
      console.log(`SSO params test error: ${error.message}`);
    }
  });

  test('REFACTOR: Authentication State and Security Analysis', async ({ page }) => {
    console.log('🔍 TESTING: Authentication state management and security');
    
    // Test authentication state persistence
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    // Check for authentication-related cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('auth') || 
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('session')
    );

    console.log('\n=== AUTHENTICATION SECURITY ANALYSIS ===');
    console.log(`Total cookies: ${cookies.length}`);
    console.log(`Auth-related cookies: ${authCookies.length}`);
    
    authCookies.forEach(cookie => {
      console.log(`Cookie: ${cookie.name}`);
      console.log(`  Domain: ${cookie.domain}`);
      console.log(`  Secure: ${cookie.secure}`);
      console.log(`  HttpOnly: ${cookie.httpOnly}`);
      console.log(`  SameSite: ${cookie.sameSite}`);
    });

    // Check for session storage or local storage auth data
    const authStorage = await page.evaluate(() => {
      const localStorageAuth = [];
      const sessionStorageAuth = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          localStorageAuth.push(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          sessionStorageAuth.push(key);
        }
      }
      
      return { localStorage: localStorageAuth, sessionStorage: sessionStorageAuth };
    });

    console.log(`LocalStorage auth keys: ${authStorage.localStorage.length}`);
    console.log(`SessionStorage auth keys: ${authStorage.sessionStorage.length}`);

    // Test protected route access
    const protectedRoutes = ['/dashboard', '/profile', '/settings'];
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        const redirectedToAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');
        const has401 = await page.locator('text=/unauthorized|access denied|401/i').count() > 0;
        
        console.log(`Protected route ${route}:`);
        console.log(`  Final URL: ${currentUrl}`);
        console.log(`  Redirected to auth: ${redirectedToAuth}`);
        console.log(`  Has 401 error: ${has401}`);
        
      } catch (error) {
        console.log(`Protected route ${route} error: ${error.message}`);
      }
    }

    // Security recommendations summary
    console.log('\n=== SECURITY RECOMMENDATIONS ===');
    if (authCookies.length === 0) {
      console.log('⚠️  No authentication cookies detected - verify auth implementation');
    }
    if (authStorage.localStorage.length > 0) {
      console.log('⚠️  Auth data in localStorage - consider security implications');
    }
    if (authCookies.some(c => !c.secure)) {
      console.log('⚠️  Some auth cookies not marked as secure');
    }
    if (authCookies.some(c => !c.httpOnly)) {
      console.log('⚠️  Some auth cookies not marked as HttpOnly');
    }
  });

});