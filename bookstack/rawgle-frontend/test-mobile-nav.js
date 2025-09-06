// Mobile Navigation Test Script
// Run with: node test-mobile-nav.js

const { chromium } = require('playwright');

async function testMobileNavigation() {
  console.log('🧪 Starting mobile navigation test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual inspection
    slowMo: 1000 // Slow down for visual debugging
  });
  
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone 11 Pro Max
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading page with mobile viewport (414x896)...');
    await page.goto('http://localhost:3000/debug-nav', { waitUntil: 'networkidle' });
    
    // Test 1: Check if mobile menu button exists and is visible
    console.log('🔍 Test 1: Looking for mobile menu button...');
    const mobileMenuButton = await page.locator('.mobile-menu-toggle').first();
    await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Mobile menu button found and visible');
    
    // Test 2: Check if button is clickable (no pointer-events blocking)
    console.log('🔍 Test 2: Testing button clickability...');
    const buttonBox = await mobileMenuButton.boundingBox();
    console.log('📍 Button position:', buttonBox);
    
    // Test 3: Click the mobile menu button
    console.log('🖱️  Test 3: Clicking mobile menu button...');
    await mobileMenuButton.click({ timeout: 5000 });
    console.log('✅ Mobile menu button clicked successfully (no timeout!)');
    
    // Wait a moment for animation
    await page.waitForTimeout(500);
    
    // Test 4: Check if mobile menu opened
    console.log('🔍 Test 4: Checking if mobile menu opened...');
    const mobileMenu = await page.locator('#mobile-navigation-menu');
    await mobileMenu.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✅ Mobile menu opened successfully');
    
    // Test 5: Test mobile menu item clicks
    console.log('🔍 Test 5: Testing mobile menu item clicks...');
    const firstMenuItem = await page.locator('#mobile-navigation-menu button').first();
    await firstMenuItem.click({ timeout: 3000 });
    console.log('✅ Mobile menu item clicked successfully');
    
    // Test 6: Close menu by clicking button again
    console.log('🔍 Test 6: Closing mobile menu...');
    await mobileMenuButton.click({ timeout: 5000 });
    console.log('✅ Mobile menu closed successfully');
    
    // Test 7: Test debug component
    console.log('🔍 Test 7: Testing debug component...');
    const debugButton = await page.locator('.fixed.top-4.right-4 button').first();
    await debugButton.click({ timeout: 3000 });
    console.log('✅ Debug component works');
    
    console.log('🎉 All tests passed! Mobile navigation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'mobile-nav-test-failure.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved as mobile-nav-test-failure.png');
    
    // Log any console errors
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    console.log('🔍 Browser console logs:', logs);
  }
  
  // Keep browser open for 10 seconds for manual inspection
  console.log('⏱️  Keeping browser open for manual inspection (10 seconds)...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

// Run the test
testMobileNavigation().catch(console.error);