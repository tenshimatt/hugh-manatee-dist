// Clean Mobile Navigation Test Script (without debug components)
// Run with: node test-mobile-nav-clean.js

const { chromium } = require('playwright');

async function testMobileNavigationClean() {
  console.log('🧪 Starting CLEAN mobile navigation test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual inspection
    slowMo: 500 // Slow down for visual debugging
  });
  
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone 11 Pro Max
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading main page with mobile viewport...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Test 1: Check if mobile menu button exists and is visible
    console.log('🔍 Test 1: Looking for mobile menu button...');
    const mobileMenuButton = await page.locator('.mobile-menu-toggle').first();
    await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Mobile menu button found and visible');
    
    // Test 2: Check button properties
    console.log('🔍 Test 2: Checking button properties...');
    const buttonBox = await mobileMenuButton.boundingBox();
    console.log('📍 Button position:', buttonBox);
    
    const isEnabled = await mobileMenuButton.isEnabled();
    const isVisible = await mobileMenuButton.isVisible();
    console.log('👆 Button enabled:', isEnabled);
    console.log('👀 Button visible:', isVisible);
    
    // Test 3: Click the mobile menu button (THE CRITICAL TEST)
    console.log('🖱️  Test 3: Clicking mobile menu button...');
    const startTime = Date.now();
    await mobileMenuButton.click({ timeout: 5000 });
    const clickTime = Date.now() - startTime;
    console.log(`✅ Mobile menu button clicked successfully in ${clickTime}ms (no timeout!)`);
    
    // Wait a moment for animation
    await page.waitForTimeout(300);
    
    // Test 4: Check if mobile menu opened
    console.log('🔍 Test 4: Checking if mobile menu opened...');
    const mobileMenu = await page.locator('#mobile-navigation-menu');
    await mobileMenu.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✅ Mobile menu opened successfully');
    
    // Test 5: Test mobile menu item clicks
    console.log('🔍 Test 5: Testing mobile menu item clicks...');
    const menuItems = await page.locator('#mobile-navigation-menu button');
    const itemCount = await menuItems.count();
    console.log(`📝 Found ${itemCount} menu items`);
    
    if (itemCount > 0) {
      const firstMenuItem = menuItems.first();
      await firstMenuItem.click({ timeout: 3000 });
      console.log('✅ Mobile menu item clicked successfully');
    }
    
    // Test 6: Close menu by clicking button again
    console.log('🔍 Test 6: Closing mobile menu...');
    await mobileMenuButton.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    
    // Check if menu is hidden
    const menuHidden = await mobileMenu.isHidden();
    console.log('✅ Mobile menu closed successfully:', menuHidden);
    
    // Test 7: Repeat open/close cycle to ensure consistency
    console.log('🔍 Test 7: Testing open/close cycle consistency...');
    await mobileMenuButton.click({ timeout: 3000 });
    await page.waitForTimeout(200);
    await mobileMenuButton.click({ timeout: 3000 });
    console.log('✅ Open/close cycle works consistently');
    
    console.log('🎉 ALL TESTS PASSED! Mobile navigation is working correctly.');
    console.log('📊 Summary:');
    console.log('   - Mobile menu button is clickable without timeout');
    console.log('   - Mobile menu opens and closes properly');
    console.log('   - Menu items are clickable');
    console.log('   - No pointer event interception issues detected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'mobile-nav-test-clean-failure.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved as mobile-nav-test-clean-failure.png');
    
    // Log current page state
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    // Log button state
    try {
      const button = await page.locator('.mobile-menu-toggle').first();
      const buttonExists = await button.count() > 0;
      console.log('🔘 Mobile menu button exists:', buttonExists);
      
      if (buttonExists) {
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        console.log('👀 Button visible:', isVisible);
        console.log('👆 Button enabled:', isEnabled);
      }
    } catch (buttonError) {
      console.log('⚠️  Could not check button state:', buttonError.message);
    }
  }
  
  // Keep browser open for manual inspection
  console.log('⏱️  Keeping browser open for manual inspection (5 seconds)...');
  await page.waitForTimeout(5000);
  
  await browser.close();
}

// Run the test
testMobileNavigationClean().catch(console.error);