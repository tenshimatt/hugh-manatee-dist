const { chromium } = require('playwright');

async function debugUIIssues() {
  console.log('🔍 Debugging Health Logs UI Issues...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to health logs page
    await page.goto('http://localhost:3001/dashboard/health/logs');
    await page.waitForLoadState('networkidle');
    
    console.log('📋 UI Component Analysis:');
    console.log('=' .repeat(50));
    
    // Check if components are loading
    const checks = {
      'Back Button': await page.locator('button', { hasText: 'Back to Health' }).count() > 0,
      'Search Input': await page.locator('input[placeholder*="Search logs"]').count() > 0,
      'Pet Filter': await page.locator('select').nth(0).count() > 0,
      'Type Filter': await page.locator('select').nth(1).count() > 0,
      'Add Entry Button': await page.locator('button', { hasText: 'Add Entry' }).count() > 0,
      'Stats Cards': await page.locator('[class*="p-6 text-center"]').count() >= 4,
      'Log Entries': await page.locator('[class*="bg-white rounded-xl p-6 shadow-lg"]').count() > 0
    };
    
    // Report findings
    Object.entries(checks).forEach(([component, isWorking]) => {
      const status = isWorking ? '✅' : '❌';
      console.log(`${status} ${component}: ${isWorking ? 'Working' : 'BROKEN'}`);
    });
    
    // Check CSS styling issues
    console.log('\n🎨 CSS Styling Analysis:');
    console.log('=' .repeat(50));
    
    const backButton = page.locator('button', { hasText: 'Back to Health' });
    if (await backButton.count() > 0) {
      const backButtonStyle = await backButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          visibility: styles.visibility,
          opacity: styles.opacity
        };
      });
      console.log('Back Button Styles:', backButtonStyle);
    }
    
    const petFilter = page.getByRole('button', { name: /Select Pet/i });
    if (await petFilter.count() > 0) {
      const petFilterStyle = await petFilter.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          visibility: styles.visibility,
          opacity: styles.opacity
        };
      });
      console.log('Pet Filter Styles:', petFilterStyle);
    }
    
    // Check for console errors
    console.log('\n🚨 Console Errors:');
    console.log('=' .repeat(50));
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload to catch errors
    await page.reload();
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      errors.forEach(error => console.log(`❌ ${error}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Check for missing CSS/JS resources
    console.log('\n📦 Resource Loading Analysis:');
    console.log('=' .repeat(50));
    
    const failedRequests = [];
    page.on('response', response => {
      if (!response.ok() && response.url().includes('localhost:3000')) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => console.log(`❌ Failed: ${req}`));
    } else {
      console.log('✅ All resources loaded successfully');
    }
    
    console.log('\n🔧 Recommended Fixes:');
    console.log('=' .repeat(50));
    
    if (!checks['Back Button']) {
      console.log('🔧 Fix Back Button: Check button styling and CSS classes');
    }
    if (!checks['Pet Filter'] || !checks['Type Filter']) {
      console.log('🔧 Fix Dropdowns: Verify Select component imports and styling');
    }
    
    console.log('\n📸 Taking screenshot for manual inspection...');
    await page.screenshot({ 
      path: '/Users/mattwright/pandora/bookstack/rawgle-frontend/debug-screenshot.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await browser.close();
  }
}

debugUIIssues().catch(console.error);