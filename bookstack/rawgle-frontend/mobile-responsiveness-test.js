/**
 * RAWGLE Mobile Responsiveness Testing Suite
 * 
 * This script systematically tests mobile responsiveness across all major pages
 * of the Rawgle platform using multiple viewport sizes and generates a comprehensive report.
 * 
 * Viewport Testing Matrix:
 * - iPhone SE (375x667) - Standard mobile
 * - iPhone 12 Pro (390x844) - Modern mobile
 * - iPad (768x1024) - Tablet
 * - Small mobile (320x568) - Minimum width
 * - Large mobile (414x896) - iPhone Pro Max
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const VIEWPORT_CONFIGS = [
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
  { name: 'iPhone 12 Pro', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true },
  { name: 'iPad', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true },
  { name: 'Small Mobile', width: 320, height: 568, deviceScaleFactor: 2, isMobile: true },
  { name: 'Large Mobile', width: 414, height: 896, deviceScaleFactor: 3, isMobile: true },
];

const PAGES_TO_TEST = [
  { path: '/', name: 'Homepage', priority: 'critical' },
  { path: '/dashboard/pets', name: 'Pet Dashboard', priority: 'critical' },
  { path: '/dashboard/feeding', name: 'Feeding Dashboard', priority: 'high' },
  { path: '/dashboard/health', name: 'Health Dashboard', priority: 'high' },
  { path: '/community', name: 'Community Hub', priority: 'high' },
  { path: '/shop', name: 'Shop Marketplace', priority: 'high' },
  { path: '/chat', name: 'AI Chat', priority: 'medium' },
  { path: '/auth/login', name: 'Login Page', priority: 'critical' },
  { path: '/auth/register', name: 'Register Page', priority: 'critical' },
  { path: '/locations', name: 'Location Services', priority: 'medium' },
  { path: '/learn/getting-started', name: 'Getting Started', priority: 'medium' },
];

class MobileResponsivenessTest {
  constructor() {
    this.browser = null;
    this.results = [];
    this.startTime = new Date();
  }

  async initialize() {
    console.log('🚀 Initializing Mobile Responsiveness Test Suite...\n');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  async testPageResponsiveness(page, pageConfig, viewport) {
    const testResults = {
      page: pageConfig.name,
      path: pageConfig.path,
      viewport: viewport.name,
      dimensions: `${viewport.width}x${viewport.height}`,
      priority: pageConfig.priority,
      tests: {},
      issues: [],
      recommendations: [],
      screenshot: null,
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`  📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Set viewport
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
        isMobile: viewport.isMobile,
        hasTouch: viewport.isMobile
      });

      // Navigate to page
      const response = await page.goto(`${BASE_URL}${pageConfig.path}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      testResults.tests.pageLoad = {
        status: response && response.ok() ? 'pass' : 'fail',
        statusCode: response ? response.status() : null
      };

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 1: Mobile Navigation
      testResults.tests.mobileNavigation = await this.testMobileNavigation(page, viewport);

      // Test 2: Touch Target Sizes
      testResults.tests.touchTargets = await this.testTouchTargets(page, viewport);

      // Test 3: Horizontal Scrolling
      testResults.tests.horizontalScrolling = await this.testHorizontalScrolling(page, viewport);

      // Test 4: Text Readability
      testResults.tests.textReadability = await this.testTextReadability(page, viewport);

      // Test 5: Form Usability
      testResults.tests.formUsability = await this.testFormUsability(page, viewport);

      // Test 6: Layout Integrity
      testResults.tests.layoutIntegrity = await this.testLayoutIntegrity(page, viewport);

      // Test 7: Performance
      testResults.tests.performance = await this.testPerformance(page, viewport);

      // Capture screenshot
      const screenshotPath = `screenshots/${pageConfig.name.replace(/\s+/g, '-')}-${viewport.name.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        quality: 80
      });
      testResults.screenshot = screenshotPath;

      // Analyze results and generate recommendations
      this.analyzeTestResults(testResults);

    } catch (error) {
      console.error(`    ❌ Error testing ${pageConfig.name} on ${viewport.name}:`, error.message);
      testResults.tests.pageLoad = { status: 'error', error: error.message };
    }

    return testResults;
  }

  async testMobileNavigation(page, viewport) {
    const test = { status: 'pass', issues: [] };

    try {
      // Check if mobile menu button exists on small screens
      if (viewport.width < 1024) {
        const mobileMenuButton = await page.$('.mobile-menu-toggle');
        if (!mobileMenuButton) {
          test.status = 'fail';
          test.issues.push('Mobile menu button not found');
          return test;
        }

        // Test mobile menu functionality
        const isVisible = await page.evaluate(() => {
          const button = document.querySelector('.mobile-menu-toggle');
          return button && getComputedStyle(button).display !== 'none';
        });

        if (!isVisible) {
          test.status = 'fail';
          test.issues.push('Mobile menu button not visible');
        }

        // Test menu toggle functionality
        try {
          await mobileMenuButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));

          const menuVisible = await page.evaluate(() => {
            const menu = document.querySelector('#mobile-navigation-menu');
            return menu && getComputedStyle(menu).display !== 'none';
          });

          if (!menuVisible) {
            test.status = 'fail';
            test.issues.push('Mobile menu does not open when clicked');
          }

          // Close menu
          await mobileMenuButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          test.status = 'fail';
          test.issues.push(`Mobile menu interaction failed: ${error.message}`);
        }
      }

      // Check desktop navigation on larger screens
      if (viewport.width >= 1024) {
        const desktopNav = await page.$('nav .hidden.lg\\:flex');
        if (!desktopNav) {
          test.status = 'fail';
          test.issues.push('Desktop navigation not found on large screen');
        }
      }
    } catch (error) {
      test.status = 'error';
      test.issues.push(`Navigation test error: ${error.message}`);
    }

    return test;
  }

  async testTouchTargets(page, viewport) {
    const test = { status: 'pass', issues: [], smallTargets: [] };

    try {
      const touchTargets = await page.evaluate(() => {
        const selectors = 'button, a, input[type="submit"], input[type="button"], [role="button"], .clickable';
        const elements = document.querySelectorAll(selectors);
        const targets = [];

        elements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const computedStyle = getComputedStyle(element);
          
          if (rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none') {
            targets.push({
              index,
              width: rect.width,
              height: rect.height,
              tagName: element.tagName,
              className: element.className,
              text: element.textContent.trim().substring(0, 50)
            });
          }
        });

        return targets;
      });

      const MIN_TOUCH_TARGET_SIZE = 44; // 44px minimum for accessibility
      
      touchTargets.forEach(target => {
        if (target.width < MIN_TOUCH_TARGET_SIZE || target.height < MIN_TOUCH_TARGET_SIZE) {
          test.smallTargets.push({
            ...target,
            size: `${Math.round(target.width)}x${Math.round(target.height)}`
          });
        }
      });

      if (test.smallTargets.length > 0) {
        test.status = test.smallTargets.length > 5 ? 'fail' : 'warning';
        test.issues.push(`Found ${test.smallTargets.length} touch targets smaller than 44px`);
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Touch target test error: ${error.message}`);
    }

    return test;
  }

  async testHorizontalScrolling(page, viewport) {
    const test = { status: 'pass', issues: [] };

    try {
      const scrollInfo = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;

        const scrollWidth = Math.max(
          body.scrollWidth, html.scrollWidth,
          body.offsetWidth, html.offsetWidth,
          body.clientWidth, html.clientWidth
        );

        return {
          viewportWidth: window.innerWidth,
          scrollWidth: scrollWidth,
          hasHorizontalScroll: scrollWidth > window.innerWidth
        };
      });

      if (scrollInfo.hasHorizontalScroll) {
        test.status = 'fail';
        test.issues.push(`Horizontal scrolling detected: content width ${scrollInfo.scrollWidth}px exceeds viewport ${scrollInfo.viewportWidth}px`);
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Horizontal scrolling test error: ${error.message}`);
    }

    return test;
  }

  async testTextReadability(page, viewport) {
    const test = { status: 'pass', issues: [], smallText: [] };

    try {
      const textElements = await page.evaluate(() => {
        const textNodes = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          const parent = node.parentElement;
          if (parent && node.textContent.trim()) {
            const style = getComputedStyle(parent);
            const fontSize = parseFloat(style.fontSize);
            
            if (fontSize > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
              textNodes.push({
                fontSize: fontSize,
                text: node.textContent.trim().substring(0, 50),
                tagName: parent.tagName
              });
            }
          }
        }

        return textNodes;
      });

      const MIN_FONT_SIZE = 16; // 16px minimum for mobile readability
      
      textElements.forEach(element => {
        if (element.fontSize < MIN_FONT_SIZE) {
          test.smallText.push(element);
        }
      });

      if (test.smallText.length > 0) {
        test.status = test.smallText.length > 10 ? 'fail' : 'warning';
        test.issues.push(`Found ${test.smallText.length} text elements smaller than 16px`);
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Text readability test error: ${error.message}`);
    }

    return test;
  }

  async testFormUsability(page, viewport) {
    const test = { status: 'pass', issues: [] };

    try {
      const forms = await page.$$('form');
      
      if (forms.length > 0) {
        const formIssues = await page.evaluate(() => {
          const issues = [];
          const forms = document.querySelectorAll('form');
          
          forms.forEach((form, formIndex) => {
            // Check input field sizes
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach((input, inputIndex) => {
              const rect = input.getBoundingClientRect();
              const style = getComputedStyle(input);
              
              if (rect.height > 0 && rect.height < 44) {
                issues.push(`Form ${formIndex} input ${inputIndex} too small: ${Math.round(rect.height)}px height`);
              }
              
              // Check if input has proper labels
              const id = input.id;
              const hasLabel = id && document.querySelector(`label[for="${id}"]`);
              const hasAriaLabel = input.getAttribute('aria-label');
              
              if (!hasLabel && !hasAriaLabel) {
                issues.push(`Form ${formIndex} input ${inputIndex} missing accessible label`);
              }
            });
          });

          return issues;
        });

        if (formIssues.length > 0) {
          test.status = 'warning';
          test.issues = formIssues;
        }
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Form usability test error: ${error.message}`);
    }

    return test;
  }

  async testLayoutIntegrity(page, viewport) {
    const test = { status: 'pass', issues: [] };

    try {
      const layoutIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for overflowing elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          
          if (rect.width > window.innerWidth && style.overflow !== 'hidden' && style.overflowX !== 'hidden') {
            issues.push(`Element ${element.tagName}.${element.className} overflows viewport`);
          }
        });

        // Check for layout shifts
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.width || !img.height) {
            issues.push(`Image ${index} missing dimensions, may cause layout shift`);
          }
        });

        return issues.slice(0, 10); // Limit to first 10 issues
      });

      if (layoutIssues.length > 0) {
        test.status = layoutIssues.length > 5 ? 'fail' : 'warning';
        test.issues = layoutIssues;
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Layout integrity test error: ${error.message}`);
    }

    return test;
  }

  async testPerformance(page, viewport) {
    const test = { status: 'pass', metrics: {}, issues: [] };

    try {
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.loadEventStart) : null,
          domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : null,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null
        };
      });

      test.metrics = performanceMetrics;

      // Performance thresholds for mobile
      if (performanceMetrics.loadTime > 3000) {
        test.status = 'warning';
        test.issues.push(`Page load time ${performanceMetrics.loadTime}ms exceeds 3s threshold`);
      }

      if (performanceMetrics.firstContentfulPaint > 2500) {
        test.status = 'warning';
        test.issues.push(`First Contentful Paint ${Math.round(performanceMetrics.firstContentfulPaint)}ms exceeds 2.5s threshold`);
      }

    } catch (error) {
      test.status = 'error';
      test.issues.push(`Performance test error: ${error.message}`);
    }

    return test;
  }

  analyzeTestResults(testResults) {
    // Generate specific recommendations based on test results
    const { tests } = testResults;

    // Navigation recommendations
    if (tests.mobileNavigation?.status === 'fail') {
      testResults.recommendations.push({
        priority: 'high',
        category: 'navigation',
        issue: 'Mobile navigation issues detected',
        solution: 'Fix mobile menu toggle functionality and ensure proper responsive behavior'
      });
    }

    // Touch target recommendations
    if (tests.touchTargets?.smallTargets?.length > 0) {
      testResults.recommendations.push({
        priority: 'high',
        category: 'accessibility',
        issue: `${tests.touchTargets.smallTargets.length} touch targets below 44px`,
        solution: 'Increase button and link sizes to meet accessibility standards (min 44x44px)'
      });
    }

    // Horizontal scrolling recommendations
    if (tests.horizontalScrolling?.status === 'fail') {
      testResults.recommendations.push({
        priority: 'critical',
        category: 'layout',
        issue: 'Horizontal scrolling detected',
        solution: 'Fix content width to prevent horizontal overflow on mobile devices'
      });
    }

    // Text readability recommendations
    if (tests.textReadability?.smallText?.length > 5) {
      testResults.recommendations.push({
        priority: 'medium',
        category: 'typography',
        issue: `${tests.textReadability.smallText.length} text elements below 16px`,
        solution: 'Increase font sizes for better mobile readability (minimum 16px)'
      });
    }

    // Performance recommendations
    if (tests.performance?.metrics?.loadTime > 3000) {
      testResults.recommendations.push({
        priority: 'medium',
        category: 'performance',
        issue: 'Slow page load time',
        solution: 'Optimize images, minimize JavaScript, and implement code splitting'
      });
    }
  }

  async runAllTests() {
    console.log(`📊 Starting comprehensive mobile responsiveness testing...\n`);
    console.log(`🔍 Testing ${PAGES_TO_TEST.length} pages across ${VIEWPORT_CONFIGS.length} viewport configurations\n`);

    // Create screenshots directory
    await fs.mkdir('screenshots', { recursive: true });

    const page = await this.browser.newPage();

    // Enable request interception to block unnecessary resources for faster testing
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });

    for (const pageConfig of PAGES_TO_TEST) {
      console.log(`🌐 Testing ${pageConfig.name} (${pageConfig.path})`);
      
      for (const viewport of VIEWPORT_CONFIGS) {
        const result = await this.testPageResponsiveness(page, pageConfig, viewport);
        this.results.push(result);
      }
      
      console.log(`  ✅ Completed ${pageConfig.name}\n`);
    }

    await page.close();
    console.log(`🎉 All tests completed!\n`);
  }

  async generateReport() {
    const endTime = new Date();
    const testDuration = Math.round((endTime - this.startTime) / 1000);

    const report = {
      metadata: {
        testDate: this.startTime.toISOString(),
        testDuration: `${testDuration} seconds`,
        totalTests: this.results.length,
        baseUrl: BASE_URL,
        viewportConfigurations: VIEWPORT_CONFIGS,
        pagesTestedCount: PAGES_TO_TEST.length
      },
      summary: this.generateSummary(),
      results: this.results,
      prioritizedIssues: this.generatePrioritizedIssues(),
      recommendations: this.generateConsolidatedRecommendations()
    };

    // Write detailed JSON report
    const reportPath = `mobile-responsiveness-report-${new Date().toISOString().slice(0, 10)}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryPath = `mobile-responsiveness-summary-${new Date().toISOString().slice(0, 10)}.md`;
    await fs.writeFile(summaryPath, this.generateMarkdownSummary(report));

    console.log(`📋 Reports generated:`);
    console.log(`   📄 Detailed Report: ${reportPath}`);
    console.log(`   📝 Summary Report: ${summaryPath}`);
    console.log(`   🖼️  Screenshots: ./screenshots/`);

    return report;
  }

  generateSummary() {
    const summary = {
      totalTests: this.results.length,
      passCount: 0,
      warningCount: 0,
      failCount: 0,
      errorCount: 0,
      criticalIssuesCount: 0,
      byViewport: {},
      byPage: {}
    };

    this.results.forEach(result => {
      // Count by status
      const testStatuses = Object.values(result.tests).map(test => test.status);
      if (testStatuses.includes('fail') || testStatuses.includes('error')) {
        summary.failCount++;
      } else if (testStatuses.includes('warning')) {
        summary.warningCount++;
      } else {
        summary.passCount++;
      }

      // Count critical issues
      const criticalRecommendations = result.recommendations.filter(rec => rec.priority === 'critical');
      summary.criticalIssuesCount += criticalRecommendations.length;

      // Group by viewport
      if (!summary.byViewport[result.viewport]) {
        summary.byViewport[result.viewport] = { pass: 0, warning: 0, fail: 0, error: 0 };
      }
      
      // Group by page
      if (!summary.byPage[result.page]) {
        summary.byPage[result.page] = { pass: 0, warning: 0, fail: 0, error: 0 };
      }
    });

    return summary;
  }

  generatePrioritizedIssues() {
    const issues = [];

    this.results.forEach(result => {
      result.recommendations.forEach(rec => {
        issues.push({
          page: result.page,
          viewport: result.viewport,
          priority: rec.priority,
          category: rec.category,
          issue: rec.issue,
          solution: rec.solution
        });
      });
    });

    // Sort by priority: critical -> high -> medium -> low
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return issues.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  generateConsolidatedRecommendations() {
    const recommendations = new Map();

    this.results.forEach(result => {
      result.recommendations.forEach(rec => {
        const key = `${rec.category}-${rec.issue}`;
        if (!recommendations.has(key)) {
          recommendations.set(key, {
            ...rec,
            affectedPages: new Set(),
            affectedViewports: new Set(),
            count: 0
          });
        }
        
        const existing = recommendations.get(key);
        existing.affectedPages.add(result.page);
        existing.affectedViewports.add(result.viewport);
        existing.count++;
      });
    });

    return Array.from(recommendations.values()).map(rec => ({
      ...rec,
      affectedPages: Array.from(rec.affectedPages),
      affectedViewports: Array.from(rec.affectedViewports)
    }));
  }

  generateMarkdownSummary(report) {
    const { metadata, summary, prioritizedIssues, recommendations } = report;

    return `# RAWGLE Mobile Responsiveness Test Report

## 📊 Test Overview

- **Test Date:** ${new Date(metadata.testDate).toLocaleString()}
- **Test Duration:** ${metadata.testDuration}
- **Pages Tested:** ${metadata.pagesTestedCount}
- **Viewport Configurations:** ${metadata.viewportConfigurations.length}
- **Total Test Cases:** ${metadata.totalTests}

## 🎯 Summary Results

- ✅ **Passing:** ${summary.passCount} tests
- ⚠️ **Warnings:** ${summary.warningCount} tests  
- ❌ **Failing:** ${summary.failCount} tests
- 🚫 **Errors:** ${summary.errorCount} tests
- 🔥 **Critical Issues:** ${summary.criticalIssuesCount}

## 🚨 Priority Issues

${prioritizedIssues.slice(0, 10).map((issue, index) => 
  `### ${index + 1}. ${issue.priority.toUpperCase()} - ${issue.category}

**Page:** ${issue.page} | **Viewport:** ${issue.viewport}

**Issue:** ${issue.issue}

**Solution:** ${issue.solution}

---`
).join('\n\n')}

## 🔧 Consolidated Recommendations

${recommendations.slice(0, 5).map((rec, index) => 
  `### ${index + 1}. ${rec.priority.toUpperCase()} - ${rec.category}

**Issue:** ${rec.issue}

**Solution:** ${rec.solution}

**Affected Pages:** ${rec.affectedPages.join(', ')}

**Affected Viewports:** ${rec.affectedViewports.join(', ')}

**Occurrence Count:** ${rec.count}

---`
).join('\n\n')}

## 📱 Viewport-Specific Results

${Object.entries(summary.byViewport).map(([viewport, results]) =>
  `**${viewport}:** ✅ ${results.pass} | ⚠️ ${results.warning} | ❌ ${results.fail} | 🚫 ${results.error}`
).join('\n')}

## 🌐 Page-Specific Results

${Object.entries(summary.byPage).map(([page, results]) =>
  `**${page}:** ✅ ${results.pass} | ⚠️ ${results.warning} | ❌ ${results.fail} | 🚫 ${results.error}`
).join('\n')}

## 🎯 Next Steps

1. **Address Critical Issues First** - Focus on horizontal scrolling and navigation failures
2. **Improve Touch Targets** - Ensure all interactive elements meet 44px minimum size
3. **Optimize Performance** - Reduce load times for better mobile experience
4. **Enhance Typography** - Increase font sizes for better readability
5. **Test on Real Devices** - Validate fixes on actual mobile devices

## 📊 Detailed Results

See the JSON report for complete test details, individual test results, and screenshot references.
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runMobileResponsivenessTests() {
  const tester = new MobileResponsivenessTest();

  try {
    await tester.initialize();
    await tester.runAllTests();
    const report = await tester.generateReport();
    
    console.log('\n🏆 Mobile Responsiveness Testing Complete!');
    console.log(`\n📈 Results: ${report.summary.passCount} Pass | ${report.summary.warningCount} Warning | ${report.summary.failCount} Fail`);
    
    if (report.summary.criticalIssuesCount > 0) {
      console.log(`\n🚨 ${report.summary.criticalIssuesCount} critical issues found - immediate attention required!`);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Check if running directly
if (require.main === module) {
  runMobileResponsivenessTests().catch(console.error);
}

module.exports = { MobileResponsivenessTest, runMobileResponsivenessTests };