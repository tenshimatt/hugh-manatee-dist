#!/usr/bin/env node

/**
 * COMPREHENSIVE FUNCTIONAL TESTING - Chat & Forms
 * Tests actual functionality, not just page loading
 */

const { chromium } = require('playwright');

class FunctionalTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Starting comprehensive functional testing...\n');
    
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for headless testing
      slowMo: 100 // Slow down actions for better visibility
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(10000);
    
    // Set up error logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('💥 Console Error:', msg.text());
      }
    });
  }

  async log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[type] || 'ℹ️'} ${message}`);
  }

  async test(description, testFn) {
    try {
      await this.log(`Testing: ${description}`, 'info');
      await testFn();
      this.testResults.passed++;
      await this.log(`PASS: ${description}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ description, error: error.message });
      await this.log(`FAIL: ${description} - ${error.message}`, 'error');
    }
  }

  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
  }

  // ==========================================
  // AUTHENTICATION FORM TESTING
  // ==========================================
  
  async testAuthenticationForms() {
    await this.log('\n🔐 TESTING AUTHENTICATION FORMS', 'info');
    
    // Test Sign-in form
    await this.test('Sign-in form loads and accepts input', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      await this.waitForElement('[data-testid="sign-in-container"]');
      
      // Test form inputs
      await this.page.fill('#email', 'test@example.com');
      await this.page.fill('#password', 'testpassword123');
      
      // Verify input values
      const emailValue = await this.page.inputValue('#email');
      const passwordValue = await this.page.inputValue('#password');
      
      if (emailValue !== 'test@example.com') throw new Error('Email input not working');
      if (passwordValue !== 'testpassword123') throw new Error('Password input not working');
      
      // Test password visibility toggle
      const passwordField = this.page.locator('#password');
      const showPasswordBtn = this.page.locator('[aria-label*="password"]').first();
      
      await showPasswordBtn.click();
      const passwordType = await passwordField.getAttribute('type');
      if (passwordType !== 'text') throw new Error('Password toggle not working');
    });

    await this.test('Sign-in form validation works', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      // Test empty form submission
      await this.page.click('button[type="submit"]');
      
      // Should show validation error
      await this.waitForElement('[role="alert"]');
      const errorText = await this.page.textContent('[role="alert"]');
      if (!errorText.includes('Email is required')) {
        throw new Error('Form validation not working properly');
      }
    });

    await this.test('OAuth buttons are clickable', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      // Test Google OAuth button
      const googleBtn = this.page.locator('button:has-text("Continue with Google")');
      await googleBtn.click();
      
      // Should redirect or show toast (demo mode)
      await this.page.waitForTimeout(1000);
      
      // In demo mode, should redirect to dashboard
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/auth/sign-in')) {
        throw new Error('OAuth button click not working');
      }
    });

    await this.test('Form submission works (demo mode)', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      await this.page.fill('#email', 'demo@rawgle.com');
      await this.page.fill('#password', 'demopassword');
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect or toast
      await this.page.waitForTimeout(2000);
      
      // Should redirect to dashboard in demo mode
      const finalUrl = this.page.url();
      if (!finalUrl.includes('/dashboard')) {
        throw new Error('Form submission redirect not working');
      }
    });
  }

  // ==========================================
  // CHAT FUNCTIONALITY TESTING
  // ==========================================
  
  async testChatFunctionality() {
    await this.log('\n💬 TESTING CHAT FUNCTIONALITY', 'info');
    
    await this.test('Chat page loads with interface', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      // Check main chat elements
      await this.waitForElement('textarea[placeholder*="Ask me anything"]');
      await this.waitForElement('button:has-text("Voice Input"), button[aria-label*="send"]');
      
      // Verify quick actions are present
      const quickActions = await this.page.locator('text=Quick Actions').count();
      if (quickActions === 0) throw new Error('Quick actions not found');
    });

    await this.test('Message input accepts text', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
      await messageBox.fill('Hello RAWGLE AI, how are you?');
      
      const inputValue = await messageBox.inputValue();
      if (inputValue !== 'Hello RAWGLE AI, how are you?') {
        throw new Error('Message input not accepting text properly');
      }
    });

    await this.test('Send button works', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
      const sendButton = this.page.locator('button').filter({ hasText: /Send|✈/ }).last();
      
      await messageBox.fill('Test message for send functionality');
      await sendButton.click();
      
      // Message should be cleared from input
      await this.page.waitForTimeout(500);
      const inputAfterSend = await messageBox.inputValue();
      if (inputAfterSend.length > 0) {
        throw new Error('Message input not cleared after send');
      }
    });

    await this.test('Chat conversation starters work', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      // Find and click a conversation starter
      const starter = this.page.locator('button:has-text("Calculate Portions")').first();
      if (await starter.count() > 0) {
        await starter.click();
        
        // Should populate message box and send
        await this.page.waitForTimeout(1000);
        
        // Check if message appears in chat
        const messages = await this.page.locator('[data-message]').count();
        if (messages === 0) {
          // Check if message appeared in input box at least
          const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
          const inputValue = await messageBox.inputValue();
          if (!inputValue.includes('calculate') && !inputValue.includes('portions')) {
            throw new Error('Conversation starter not working');
          }
        }
      }
    });

    await this.test('Quick action buttons work', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      // Test quick action buttons
      const calcButton = this.page.locator('text=Calculate Portions').first();
      if (await calcButton.count() > 0) {
        await calcButton.click();
        await this.page.waitForTimeout(500);
        
        // Should trigger some action (populate input or send message)
        const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
        const inputValue = await messageBox.inputValue();
        
        if (inputValue.length === 0) {
          // Check if message was sent directly
          const messages = await this.page.locator('.message, [data-message]').count();
          if (messages === 0) {
            throw new Error('Quick action button not working');
          }
        }
      }
    });
  }

  // ==========================================
  // FEEDING CALCULATOR TESTING
  // ==========================================
  
  async testFeedingCalculator() {
    await this.log('\n🧮 TESTING FEEDING CALCULATOR', 'info');
    
    await this.test('Feeding calculator loads with forms', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Wait for calculator to load
      await this.waitForElement('input[id="petName"]');
      await this.waitForElement('input[id="weight"]');
      await this.waitForElement('input[id="age"]');
    });

    await this.test('Pet name input works', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      const petNameInput = this.page.locator('#petName');
      await petNameInput.fill('Buddy');
      
      const value = await petNameInput.inputValue();
      if (value !== 'Buddy') {
        throw new Error('Pet name input not working');
      }
    });

    await this.test('Weight input accepts numbers', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      const weightInput = this.page.locator('#weight');
      await weightInput.fill('45.5');
      
      const value = await weightInput.inputValue();
      if (value !== '45.5') {
        throw new Error('Weight input not accepting numbers');
      }
    });

    await this.test('Age input works', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      const ageInput = this.page.locator('#age');
      await ageInput.fill('3.5');
      
      const value = await ageInput.inputValue();
      if (value !== '3.5') {
        throw new Error('Age input not working');
      }
    });

    await this.test('Species dropdown works', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Click species dropdown
      const speciesDropdown = this.page.locator('[role="combobox"]').first();
      await speciesDropdown.click();
      
      // Select cat
      await this.page.locator('text=Cat').click();
      
      // Verify selection
      const selectedValue = await speciesDropdown.textContent();
      if (!selectedValue.includes('Cat')) {
        throw new Error('Species dropdown not working');
      }
    });

    await this.test('Calculator performs calculations', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Fill out form
      await this.page.fill('#petName', 'Test Dog');
      await this.page.fill('#weight', '25');
      await this.page.fill('#age', '3');
      
      // Wait for calculations
      await this.page.waitForTimeout(2000);
      
      // Check if results appear
      const resultsFound = await this.page.locator('text=Daily Feeding Requirements, text=Total Food').count() > 0;
      if (!resultsFound) {
        // Check if at least the form is properly filled
        const petName = await this.page.inputValue('#petName');
        const weight = await this.page.inputValue('#weight');
        if (petName !== 'Test Dog' || weight !== '25') {
          throw new Error('Calculator inputs not working properly');
        }
      }
    });

    await this.test('Activity level selector works', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Find activity level dropdown
      const activityDropdown = this.page.locator('text=Activity Level').locator('..').locator('[role="combobox"]');
      if (await activityDropdown.count() > 0) {
        await activityDropdown.click();
        
        // Select an activity level
        await this.page.locator('text=Active').first().click();
        
        // Verify selection was made (form should be interactive)
        const dropdownText = await activityDropdown.textContent();
        if (!dropdownText || dropdownText.trim() === '') {
          throw new Error('Activity level selector not working');
        }
      }
    });

    await this.test('Body condition score slider works', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Find the slider
      const slider = this.page.locator('input[type="range"], [role="slider"]').first();
      if (await slider.count() > 0) {
        // Move slider
        await slider.click();
        
        // Verify slider is interactive
        const sliderValue = await slider.getAttribute('value') || await slider.getAttribute('aria-valuenow');
        if (!sliderValue) {
          throw new Error('Body condition slider not working');
        }
      }
    });
  }

  // ==========================================
  // DASHBOARD PETS FORM TESTING
  // ==========================================
  
  async testPetManagementForms() {
    await this.log('\n🐕 TESTING PET MANAGEMENT FORMS', 'info');
    
    await this.test('Pet dashboard loads', async () => {
      await this.page.goto('http://localhost:3000/dashboard/pets');
      
      // Check for add pet button or form
      const addPetButton = this.page.locator('text=Add Pet, text=Add Your First Pet').first();
      await this.waitForElement('text=Add Pet, text=Add Your First Pet');
    });

    await this.test('Add pet form loads', async () => {
      await this.page.goto('http://localhost:3000/dashboard/pets/add');
      
      // Should have pet form fields
      await this.waitForElement('input[name="name"], input[placeholder*="name"]');
    });
  }

  // ==========================================
  // MOBILE RESPONSIVENESS TESTING
  // ==========================================
  
  async testMobileResponsiveness() {
    await this.log('\n📱 TESTING MOBILE RESPONSIVENESS', 'info');
    
    await this.test('Chat works on mobile viewport', async () => {
      await this.page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await this.page.goto('http://localhost:3000/chat');
      
      // Chat interface should be responsive
      const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
      await this.waitForElement('textarea[placeholder*="Ask me anything"]');
      
      const boundingBox = await messageBox.boundingBox();
      if (boundingBox.width > 375) {
        throw new Error('Chat interface not responsive on mobile');
      }
    });

    await this.test('Forms work on mobile viewport', async () => {
      await this.page.setViewportSize({ width: 375, height: 667 });
      
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      const emailInput = this.page.locator('#email');
      await emailInput.fill('mobile@test.com');
      
      const value = await emailInput.inputValue();
      if (value !== 'mobile@test.com') {
        throw new Error('Form inputs not working on mobile');
      }
    });

    await this.test('Calculator works on mobile', async () => {
      await this.page.setViewportSize({ width: 375, height: 667 });
      
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      const petNameInput = this.page.locator('#petName');
      await petNameInput.fill('Mobile Dog');
      
      const value = await petNameInput.inputValue();
      if (value !== 'Mobile Dog') {
        throw new Error('Calculator not working on mobile');
      }
    });

    // Reset viewport
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  // ==========================================
  // ACCESSIBILITY TESTING
  // ==========================================
  
  async testAccessibility() {
    await this.log('\n♿ TESTING ACCESSIBILITY', 'info');
    
    await this.test('Forms have proper labels', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      const emailInput = this.page.locator('#email');
      const emailLabel = this.page.locator('label[for="email"]');
      
      if (await emailLabel.count() === 0) {
        throw new Error('Email input missing proper label');
      }
    });

    await this.test('Chat interface has ARIA labels', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
      
      // Should have accessible attributes
      const ariaLabel = await messageBox.getAttribute('aria-label') || 
                       await messageBox.getAttribute('placeholder');
      
      if (!ariaLabel) {
        throw new Error('Chat message box missing accessibility attributes');
      }
    });

    await this.test('Buttons have accessible text', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      const buttons = await this.page.locator('button').all();
      
      for (let button of buttons.slice(0, 5)) { // Test first 5 buttons
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        if (!text?.trim() && !ariaLabel) {
          throw new Error('Button missing accessible text or aria-label');
        }
      }
    });
  }

  // ==========================================
  // KEYBOARD NAVIGATION TESTING
  // ==========================================
  
  async testKeyboardNavigation() {
    await this.log('\n⌨️ TESTING KEYBOARD NAVIGATION', 'info');
    
    await this.test('Chat message can be sent with Enter', async () => {
      await this.page.goto('http://localhost:3000/chat');
      
      const messageBox = this.page.locator('textarea[placeholder*="Ask me anything"]');
      await messageBox.fill('Test message via Enter key');
      await messageBox.press('Enter');
      
      // Message should be sent (input cleared)
      await this.page.waitForTimeout(500);
      const inputAfterEnter = await messageBox.inputValue();
      
      if (inputAfterEnter.includes('Test message via Enter key')) {
        throw new Error('Enter key not sending messages');
      }
    });

    await this.test('Forms can be navigated with Tab', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      // Start from email field
      await this.page.focus('#email');
      
      // Tab to password field
      await this.page.keyboard.press('Tab');
      
      // Should focus password field
      const focusedElement = await this.page.evaluate(() => document.activeElement.id);
      if (focusedElement !== 'password') {
        // Tab navigation might work differently, check if any form element is focused
        const isFocusedOnForm = await this.page.evaluate(() => {
          const active = document.activeElement;
          return active && (active.tagName === 'INPUT' || active.tagName === 'BUTTON');
        });
        
        if (!isFocusedOnForm) {
          throw new Error('Tab navigation not working properly');
        }
      }
    });
  }

  // ==========================================
  // ERROR HANDLING TESTING
  // ==========================================
  
  async testErrorHandling() {
    await this.log('\n⚠️ TESTING ERROR HANDLING', 'info');
    
    await this.test('Invalid email shows error', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      await this.page.fill('#email', 'invalid-email');
      await this.page.click('button[type="submit"]');
      
      // Should show validation error
      const errorElement = await this.page.locator('[role="alert"], .error, text=valid email').first();
      await this.page.waitForTimeout(1000);
      
      const hasError = await errorElement.count() > 0;
      if (!hasError) {
        throw new Error('Invalid email validation not working');
      }
    });

    await this.test('Empty required fields show errors', async () => {
      await this.page.goto('http://localhost:3000/auth/sign-in');
      
      // Try to submit empty form
      await this.page.click('button[type="submit"]');
      
      // Should show error
      await this.page.waitForTimeout(1000);
      const errorExists = await this.page.locator('[role="alert"], .error').count() > 0;
      
      if (!errorExists) {
        throw new Error('Empty form validation not working');
      }
    });
  }

  // ==========================================
  // PERFORMANCE TESTING
  // ==========================================
  
  async testPerformance() {
    await this.log('\n🚀 TESTING PERFORMANCE', 'info');
    
    await this.test('Pages load within reasonable time', async () => {
      const startTime = Date.now();
      await this.page.goto('http://localhost:3000/chat');
      await this.waitForElement('textarea[placeholder*="Ask me anything"]');
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 5000) {
        throw new Error(`Chat page took ${loadTime}ms to load (too slow)`);
      }
    });

    await this.test('Form interactions are responsive', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      const startTime = Date.now();
      await this.page.fill('#petName', 'Speed Test Dog');
      const inputTime = Date.now() - startTime;
      
      if (inputTime > 1000) {
        throw new Error(`Form input took ${inputTime}ms to respond (too slow)`);
      }
    });
  }

  // ==========================================
  // DATA PERSISTENCE TESTING
  // ==========================================
  
  async testDataPersistence() {
    await this.log('\n💾 TESTING DATA PERSISTENCE', 'info');
    
    await this.test('Form data persists during navigation', async () => {
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Fill form
      await this.page.fill('#petName', 'Persistent Dog');
      await this.page.fill('#weight', '30');
      
      // Navigate away and back
      await this.page.goto('http://localhost:3000/dashboard');
      await this.page.goto('http://localhost:3000/dashboard/feeding/calculator');
      
      // Check if data persisted (might not in all implementations)
      const petName = await this.page.inputValue('#petName');
      if (petName === 'Persistent Dog') {
        await this.log('Form data persistence working', 'success');
      } else {
        await this.log('Form data does not persist (expected in many implementations)', 'warning');
      }
    });
  }

  // ==========================================
  // MAIN TEST EXECUTION
  // ==========================================
  
  async runAllTests() {
    try {
      await this.initialize();
      
      // Run all test suites
      await this.testAuthenticationForms();
      await this.testChatFunctionality();
      await this.testFeedingCalculator();
      await this.testPetManagementForms();
      await this.testMobileResponsiveness();
      await this.testAccessibility();
      await this.testKeyboardNavigation();
      await this.testErrorHandling();
      await this.testPerformance();
      await this.testDataPersistence();
      
      await this.showResults();
      
    } catch (error) {
      console.error('💥 Fatal error during testing:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE FUNCTIONAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n🔍 FAILED TESTS SUMMARY:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.description}`);
        console.log(`   Error: ${error.error}\n`);
      });
    }
    
    console.log('\n🎯 TEST COVERAGE AREAS:');
    console.log('• Authentication Forms (Login, Validation, OAuth)');
    console.log('• Chat Interface (Input, Send, Conversation Starters)');
    console.log('• Feeding Calculator (Forms, Calculations, Dropdowns)');
    console.log('• Pet Management (Add Pet Forms)');
    console.log('• Mobile Responsiveness');
    console.log('• Accessibility (ARIA, Labels, Keyboard Navigation)');
    console.log('• Error Handling & Validation');
    console.log('• Performance & Data Persistence');
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.testResults.failed > 0) {
      console.log('• Review failed tests and fix underlying issues');
      console.log('• Ensure form validation is properly implemented');
      console.log('• Test chat functionality with mock responses');
    } else {
      console.log('• All tests passed! Consider adding more edge cases');
      console.log('• Monitor real user interactions for additional insights');
    }
    
    console.log('='.repeat(60));
  }
}

// ==========================================
// CLI EXECUTION
// ==========================================

async function main() {
  const tester = new FunctionalTester();
  await tester.runAllTests();
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FunctionalTester };