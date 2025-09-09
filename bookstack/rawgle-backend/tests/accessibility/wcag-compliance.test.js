/**
 * WCAG 2.1 AA Accessibility Compliance Tests
 * Following TDD_DOCUMENTATION.md specifications for accessibility testing
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('WCAG 2.1 AA Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configure axe-core for WCAG 2.1 AA compliance
    await page.addInitScript(() => {
      window.axeConfig = {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: false }, // AAA level, not required for AA
          'focus-order-semantics': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'page-has-heading-one': { enabled: true }
        }
      };
    });
  });

  test('Course listing page accessibility', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify specific accessibility requirements
    await test.step('Verify heading structure', async () => {
      // Page should have proper heading hierarchy
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      await expect(h1Elements.first()).toContainText(/courses|learning/i);

      // Check heading sequence (h1 -> h2 -> h3, no skipping levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let currentLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.substring(1));
        
        if (currentLevel === 0) {
          expect(level).toBe(1); // First heading should be h1
        } else {
          expect(level).toBeLessThanOrEqual(currentLevel + 1); // No level skipping
        }
        currentLevel = level;
      }
    });

    await test.step('Verify keyboard navigation', async () => {
      // Test tab order through interactive elements
      const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = await interactiveElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
      
      // Tab through first few elements
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      for (let i = 0; i < Math.min(5, elementCount - 1); i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    await test.step('Verify color contrast', async () => {
      // Test specific color contrast requirements
      const contrastResults = await page.evaluate(async () => {
        const axe = window.axe;
        if (!axe) return null;
        
        const results = await axe.run({
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        return results.violations.filter(v => v.id === 'color-contrast');
      });
      
      expect(contrastResults).toEqual([]);
    });

    await test.step('Verify focus management', async () => {
      // Verify focus indicators are visible
      const focusableElements = page.locator('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstFocusable = focusableElements.first();
      
      await firstFocusable.focus();
      
      // Check that focus is visually apparent
      const focusStyles = await firstFocusable.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.boxShadow !== 'none' ||
        focusStyles.backgroundColor !== 'transparent' ||
        focusStyles.borderColor !== 'rgb(0, 0, 0)';
      
      expect(hasFocusIndicator).toBe(true);
    });
  });

  test('Course details page accessibility', async ({ page }) => {
    await page.goto('/courses/raw-feeding-101');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Verify course content accessibility', async () => {
      // Course title should be properly marked as heading
      const courseTitle = page.locator('[data-testid="course-title"], .course-title, h1');
      await expect(courseTitle).toHaveAttribute('role', /heading|banner/);
      
      // Course description should be associated with title
      const courseDescription = page.locator('[data-testid="course-description"], .course-description');
      if (await courseDescription.count() > 0) {
        await expect(courseDescription).toBeVisible();
      }
      
      // Prerequisites should be clearly marked
      const prerequisites = page.locator('[data-testid="prerequisites"], .prerequisites');
      if (await prerequisites.count() > 0) {
        await expect(prerequisites).toHaveAttribute('role', /list|region/);
      }
    });

    await test.step('Verify action button accessibility', async () => {
      // Enroll button should have clear labeling
      const enrollButton = page.locator('[data-testid="enroll-button"], button:has-text("enroll")').first();
      if (await enrollButton.count() > 0) {
        await expect(enrollButton).toHaveAttribute('type', 'button');
        
        const buttonText = await enrollButton.textContent();
        expect(buttonText.trim().length).toBeGreaterThan(0);
        
        // Button should not rely solely on color to convey information
        const ariaLabel = await enrollButton.getAttribute('aria-label');
        const ariaDescribedBy = await enrollButton.getAttribute('aria-describedby');
        
        expect(buttonText.length > 0 || ariaLabel?.length > 0 || ariaDescribedBy?.length > 0).toBe(true);
      }
    });

    await test.step('Verify media accessibility', async () => {
      // Video elements should have appropriate attributes
      const videos = page.locator('video');
      const videoCount = await videos.count();
      
      for (let i = 0; i < videoCount; i++) {
        const video = videos.nth(i);
        
        // Videos should have controls
        await expect(video).toHaveAttribute('controls', '');
        
        // Videos should have descriptive text
        const ariaLabel = await video.getAttribute('aria-label');
        const title = await video.getAttribute('title');
        
        expect(ariaLabel || title).toBeTruthy();
      }
      
      // Images should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');
        const role = await image.getAttribute('role');
        
        // Images should have alt text or be marked as decorative
        expect(alt !== null || role === 'presentation').toBe(true);
      }
    });
  });

  test('Course learning interface accessibility', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/courses/raw-feeding-101/learn');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Verify video player accessibility', async () => {
      const videoPlayer = page.locator('[data-testid="video-player"], video').first();
      
      if (await videoPlayer.count() > 0) {
        // Video player should have proper ARIA attributes
        await expect(videoPlayer).toHaveAttribute('role', /application|video/);
        await expect(videoPlayer).toHaveAttribute('aria-label');
        
        // Video controls should be keyboard accessible
        const playButton = page.locator('[data-testid="play-button"], button:has-text("play")').first();
        if (await playButton.count() > 0) {
          await playButton.focus();
          await expect(playButton).toBeFocused();
          
          // Should respond to Enter and Space
          await page.keyboard.press('Enter');
          // Video should start/stop (implementation would verify this)
        }
        
        // Progress bar should be accessible
        const progressBar = page.locator('[data-testid="progress-bar"], [role="progressbar"]').first();
        if (await progressBar.count() > 0) {
          await expect(progressBar).toHaveAttribute('role', 'progressbar');
          await expect(progressBar).toHaveAttribute('aria-valuenow');
          await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
          await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        }
      }
    });

    await test.step('Verify lesson navigation accessibility', async () => {
      const lessonNav = page.locator('[data-testid="lesson-navigation"], nav').first();
      
      if (await lessonNav.count() > 0) {
        await expect(lessonNav).toHaveAttribute('role', 'navigation');
        await expect(lessonNav).toHaveAttribute('aria-label');
        
        // Lesson links should be properly labeled
        const lessonLinks = lessonNav.locator('a, button');
        const linkCount = await lessonLinks.count();
        
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = lessonLinks.nth(i);
          const text = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          
          expect(text?.trim().length > 0 || ariaLabel?.length > 0).toBe(true);
        }
      }
    });

    await test.step('Verify course progress accessibility', async () => {
      const progressSection = page.locator('[data-testid="course-progress"], .progress-section').first();
      
      if (await progressSection.count() > 0) {
        // Progress should be announced to screen readers
        await expect(progressSection).toHaveAttribute('role', /region|status/);
        
        // Progress percentage should be readable
        const progressText = page.locator('[data-testid="progress-percentage"], .progress-text');
        if (await progressText.count() > 0) {
          const text = await progressText.textContent();
          expect(text).toMatch(/\d+%/); // Should contain percentage
        }
      }
    });
  });

  test('Form accessibility compliance', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Verify form labeling', async () => {
      const formInputs = page.locator('input, select, textarea');
      const inputCount = await formInputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const inputType = await input.getAttribute('type');
        
        // Skip hidden inputs
        if (inputType === 'hidden') continue;
        
        // Each input should have a label
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (inputId) {
          const associatedLabel = page.locator(`label[for="${inputId}"]`);
          const hasAssociatedLabel = await associatedLabel.count() > 0;
          
          expect(hasAssociatedLabel || ariaLabel || ariaLabelledBy).toBe(true);
        }
      }
    });

    await test.step('Verify error message accessibility', async () => {
      // Try to submit form with invalid data to trigger errors
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="register-button"]');
      
      // Wait for error messages to appear
      await page.waitForTimeout(1000);
      
      const errorMessages = page.locator('[role="alert"], .error-message, [data-testid*="error"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorMessage = errorMessages.nth(i);
          
          // Error messages should have appropriate role
          const role = await errorMessage.getAttribute('role');
          const ariaLive = await errorMessage.getAttribute('aria-live');
          
          expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true);
          
          // Error messages should have meaningful text
          const text = await errorMessage.textContent();
          expect(text?.trim().length).toBeGreaterThan(0);
        }
      }
    });

    await test.step('Verify required field indication', async () => {
      const requiredInputs = page.locator('input[required], select[required], textarea[required]');
      const requiredCount = await requiredInputs.count();
      
      for (let i = 0; i < requiredCount; i++) {
        const input = requiredInputs.nth(i);
        
        // Required fields should be indicated accessibly
        const ariaRequired = await input.getAttribute('aria-required');
        const required = await input.getAttribute('required');
        
        expect(ariaRequired === 'true' || required !== null).toBe(true);
      }
    });
  });

  test('Mobile accessibility compliance', async ({ page, browserName }) => {
    // Test mobile viewport accessibility
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Verify mobile touch targets', async () => {
      const touchTargets = page.locator('button, a, input, select, [role="button"]');
      const targetCount = await touchTargets.count();
      
      // Check first 10 touch targets for size requirements
      for (let i = 0; i < Math.min(targetCount, 10); i++) {
        const target = touchTargets.nth(i);
        
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // WCAG 2.1 AA requires touch targets to be at least 44x44 CSS pixels
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    await test.step('Verify mobile navigation accessibility', async () => {
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger-menu');
      
      if (await mobileMenu.count() > 0) {
        // Mobile menu should be keyboard accessible
        await mobileMenu.first().focus();
        await expect(mobileMenu.first()).toBeFocused();
        
        // Should have proper ARIA attributes
        await expect(mobileMenu.first()).toHaveAttribute('aria-expanded');
        
        // Should have meaningful label
        const ariaLabel = await mobileMenu.first().getAttribute('aria-label');
        const text = await mobileMenu.first().textContent();
        expect(ariaLabel?.length > 0 || text?.trim().length > 0).toBe(true);
      }
    });
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    await test.step('Verify landmark roles', async () => {
      // Page should have proper landmark structure
      const landmarks = await page.locator('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer').all();
      
      expect(landmarks.length).toBeGreaterThan(0);
      
      // Should have main landmark
      const mainLandmark = page.locator('[role="main"], main');
      await expect(mainLandmark).toHaveCount(1);
    });

    await test.step('Verify content structure', async () => {
      // Content should have logical reading order
      const readableContent = page.locator('h1, h2, h3, h4, h5, h6, p, li, a, button');
      const contentCount = await readableContent.count();
      
      expect(contentCount).toBeGreaterThan(0);
      
      // Should have descriptive page title
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(0);
      expect(pageTitle).not.toBe('Page');
    });

    await test.step('Verify skip links', async () => {
      // Check for skip navigation links
      const skipLinks = page.locator('a[href^="#"], [data-testid="skip-link"]');
      
      if (await skipLinks.count() > 0) {
        const firstSkipLink = skipLinks.first();
        
        // Skip link should be keyboard accessible
        await page.keyboard.press('Tab');
        
        if (await firstSkipLink.isVisible()) {
          await expect(firstSkipLink).toBeFocused();
          
          // Skip link should have meaningful text
          const text = await firstSkipLink.textContent();
          expect(text).toMatch(/skip|main|content/i);
        }
      }
    });
  });

  test('High contrast mode compatibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });
    
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    await test.step('Verify content remains usable in high contrast', async () => {
      // Content should still be visible and usable
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      // Interactive elements should be identifiable
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        await expect(buttons.nth(i)).toBeVisible();
      }
    });
  });

  test('Reduced motion accessibility', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    await test.step('Verify animations respect reduced motion', async () => {
      // Check for CSS animations that should be disabled
      const animatedElements = await page.evaluateAll(
        'document.querySelectorAll("*")',
        elements => elements.filter(el => {
          const computedStyle = window.getComputedStyle(el);
          return computedStyle.animationDuration !== '0s' && computedStyle.animationDuration !== '';
        })
      );
      
      // In reduced motion mode, animations should be minimal
      expect(animatedElements.length).toBeLessThan(5);
    });
  });
});