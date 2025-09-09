/**
 * E2E Test: Complete Course Enrollment to Certificate Journey
 * Following TDD_DOCUMENTATION.md specifications for critical user paths
 */

const { test, expect } = require('@playwright/test');
const { EducationalPlatformTestData } = require('../fixtures/TestDataFactory');

test.describe('Course Completion Journey', () => {
  let testUser;
  let testCourses;

  test.beforeAll(async () => {
    // Generate test data
    const users = EducationalPlatformTestData.generateUsers(5);
    testUser = users[0];
    testCourses = EducationalPlatformTestData.generateCourses();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('Complete course enrollment to certificate generation', async ({ page }) => {
    // Step 1: User Registration and Login
    await test.step('Register new user', async () => {
      await page.click('[data-testid="register-link"]');
      
      await page.fill('[data-testid="name-input"]', testUser.name);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);
      
      await page.click('[data-testid="register-button"]');
      
      // Verify registration success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
    });

    await test.step('Login with registered user', async () => {
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      
      await page.click('[data-testid="login-button"]');
      
      // Verify successful login
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText(testUser.name);
    });

    // Step 2: Course Discovery and Selection
    const targetCourse = testCourses[0]; // Raw Feeding Fundamentals
    
    await test.step('Browse and select course', async () => {
      await page.click('[data-testid="courses-nav"]');
      
      // Wait for courses to load
      await expect(page.locator('[data-testid="courses-grid"]')).toBeVisible();
      
      // Search for specific course
      await page.fill('[data-testid="course-search"]', 'Raw Feeding Fundamentals');
      await page.press('[data-testid="course-search"]', 'Enter');
      
      // Verify course appears in results
      await expect(page.locator(`[data-testid="course-card-${targetCourse.id}"]`)).toBeVisible();
      
      // Click on course to view details
      await page.click(`[data-testid="course-card-${targetCourse.id}"]`);
      
      // Verify course details page
      await expect(page.locator('[data-testid="course-title"]')).toContainText(targetCourse.title);
      await expect(page.locator('[data-testid="course-instructor"]')).toContainText(targetCourse.instructor);
      await expect(page.locator('[data-testid="course-difficulty"]')).toContainText(targetCourse.difficulty);
    });

    await test.step('Enroll in course', async () => {
      await page.click('[data-testid="enroll-button"]');
      
      // Handle enrollment confirmation modal if present
      const confirmModal = page.locator('[data-testid="enrollment-confirmation"]');
      if (await confirmModal.isVisible()) {
        await page.click('[data-testid="confirm-enrollment"]');
      }
      
      // Verify enrollment success
      await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="enrollment-success"]')).toContainText('Successfully enrolled');
      
      // Verify "Start Learning" button appears
      await expect(page.locator('[data-testid="start-learning-button"]')).toBeVisible();
    });

    // Step 3: Course Learning Progress
    await test.step('Begin course learning', async () => {
      await page.click('[data-testid="start-learning-button"]');
      
      // Verify learning interface loads
      await expect(page.locator('[data-testid="learning-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="module-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Verify initial progress is 0%
      const progressText = await page.locator('[data-testid="progress-percentage"]').textContent();
      expect(progressText).toContain('0%');
    });

    await test.step('Complete first lesson', async () => {
      // Start first lesson
      await page.click('[data-testid="lesson-1-start"]');
      
      // Verify lesson content loads
      await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="lesson-title"]')).toBeVisible();
      
      // Simulate watching lesson (scroll to bottom to trigger completion)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for auto-progress tracking
      await page.waitForTimeout(2000);
      
      // Mark lesson as complete
      await page.click('[data-testid="mark-complete-button"]');
      
      // Verify lesson completion
      await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();
    });

    await test.step('Progress through multiple modules', async () => {
      // Navigate through first module lessons
      for (let lessonNum = 2; lessonNum <= 4; lessonNum++) {
        await page.click(`[data-testid="lesson-${lessonNum}-start"]`);
        
        // Simulate lesson interaction
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        await page.waitForTimeout(1000);
        await page.click('[data-testid="mark-complete-button"]');
        
        // Verify progress increases
        const progressBar = page.locator('[data-testid="progress-bar"]');
        await expect(progressBar).toBeVisible();
      }
      
      // Verify module 1 completion
      await expect(page.locator('[data-testid="module-1-completed"]')).toBeVisible();
    });

    await test.step('Complete entire course', async () => {
      // Fast-forward through remaining modules (simulation for test speed)
      const totalModules = targetCourse.modules;
      
      for (let moduleNum = 2; moduleNum <= totalModules; moduleNum++) {
        // Navigate to module
        await page.click(`[data-testid="module-${moduleNum}-nav"]`);
        
        // Complete all lessons in module (simplified for test)
        await page.click(`[data-testid="complete-module-${moduleNum}"]`);
        
        // Verify module completion
        await expect(page.locator(`[data-testid="module-${moduleNum}-completed"]`)).toBeVisible();
      }
      
      // Verify course completion
      await expect(page.locator('[data-testid="course-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText('100%');
    });

    // Step 4: Certificate Generation
    await test.step('Generate completion certificate', async () => {
      // Certificate generation should be available after course completion
      await expect(page.locator('[data-testid="generate-certificate-button"]')).toBeVisible();
      
      await page.click('[data-testid="generate-certificate-button"]');
      
      // Wait for certificate processing
      await expect(page.locator('[data-testid="certificate-processing"]')).toBeVisible();
      await expect(page.locator('[data-testid="certificate-processing"]')).not.toBeVisible({ timeout: 10000 });
      
      // Verify certificate generation success
      await expect(page.locator('[data-testid="certificate-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="certificate-download-link"]')).toBeVisible();
      
      // Verify certificate details
      const certificateDetails = page.locator('[data-testid="certificate-details"]');
      await expect(certificateDetails).toContainText(testUser.name);
      await expect(certificateDetails).toContainText(targetCourse.title);
      await expect(certificateDetails).toContainText(targetCourse.instructor);
    });

    await test.step('Download and verify certificate', async () => {
      // Start download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="certificate-download-link"]')
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/certificate.*\.pdf$/);
      
      // Save download for verification
      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
    });

    // Step 5: Post-Completion Experience
    await test.step('Verify post-completion dashboard updates', async () => {
      await page.click('[data-testid="dashboard-nav"]');
      
      // Verify completed course appears in dashboard
      await expect(page.locator('[data-testid="completed-courses"]')).toBeVisible();
      await expect(page.locator(`[data-testid="completed-course-${targetCourse.id}"]`)).toBeVisible();
      
      // Verify achievement badge
      await expect(page.locator('[data-testid="completion-badge"]')).toBeVisible();
      
      // Verify updated profile statistics
      const statsSection = page.locator('[data-testid="profile-stats"]');
      await expect(statsSection.locator('[data-testid="courses-completed"]')).toContainText('1');
      await expect(statsSection.locator('[data-testid="certificates-earned"]')).toContainText('1');
    });

    await test.step('Access course replay and resources', async () => {
      // Navigate back to completed course
      await page.click(`[data-testid="completed-course-${targetCourse.id}"]`);
      
      // Verify replay access
      await expect(page.locator('[data-testid="replay-course-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-resources"]')).toBeVisible();
      
      // Verify downloadable resources
      const resourcesList = page.locator('[data-testid="course-resources"] li');
      const resourceCount = await resourcesList.count();
      expect(resourceCount).toBeGreaterThan(0);
    });
  });

  test('Handle course prerequisite validation', async ({ page }) => {
    await test.step('Login as new user', async () => {
      const newUser = EducationalPlatformTestData.generateUsers(1)[0];
      newUser.email = 'prerequisite-test@example.com';
      
      // Register and login
      await page.goto('/register');
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.click('[data-testid="register-button"]');
      
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.click('[data-testid="login-button"]');
    });

    await test.step('Attempt to enroll in advanced course without prerequisites', async () => {
      const advancedCourse = testCourses.find(c => c.id === 'advanced-nutrition');
      
      await page.goto(`/courses/${advancedCourse.id}`);
      
      // Verify prerequisite warning is displayed
      await expect(page.locator('[data-testid="prerequisites-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="prerequisites-list"]')).toContainText('Raw Feeding Fundamentals');
      
      // Verify enroll button is disabled
      const enrollButton = page.locator('[data-testid="enroll-button"]');
      await expect(enrollButton).toBeDisabled();
      
      // Verify helpful messaging
      await expect(page.locator('[data-testid="prerequisite-help"]')).toContainText('Complete the prerequisite courses first');
    });

    await test.step('Navigate to prerequisite course from advanced course page', async () => {
      await page.click('[data-testid="prerequisite-course-link"]');
      
      // Should navigate to prerequisite course
      await expect(page.locator('[data-testid="course-title"]')).toContainText('Raw Feeding Fundamentals');
      await expect(page.locator('[data-testid="enroll-button"]')).toBeEnabled();
    });
  });

  test('Verify responsive design across devices', async ({ page, browserName }) => {
    await test.step('Test mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/courses');
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Verify course cards stack vertically
      const courseGrid = page.locator('[data-testid="courses-grid"]');
      await expect(courseGrid).toHaveClass(/.*mobile-stack.*/);
      
      // Test mobile course learning interface
      await page.click('[data-testid="course-card-raw-feeding-101"]');
      await expect(page.locator('[data-testid="mobile-learning-interface"]')).toBeVisible();
    });

    await test.step('Test tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/courses');
      
      // Verify tablet-optimized layout
      const courseGrid = page.locator('[data-testid="courses-grid"]');
      await expect(courseGrid).toHaveClass(/.*tablet-grid.*/);
      
      // Verify sidebar navigation
      await expect(page.locator('[data-testid="sidebar-navigation"]')).toBeVisible();
    });

    await test.step('Test desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto('/courses');
      
      // Verify full desktop layout
      await expect(page.locator('[data-testid="desktop-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-main-content"]')).toBeVisible();
    });
  });

  test('Performance benchmarks for course learning', async ({ page }) => {
    await test.step('Measure page load performance', async () => {
      // Navigate to course learning page and measure performance
      const startTime = Date.now();
      await page.goto('/courses/raw-feeding-101/learn');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Course learning page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    await test.step('Measure video startup time', async () => {
      await page.click('[data-testid="lesson-1-start"]');
      
      const videoStartTime = Date.now();
      
      // Wait for video to be ready
      await page.waitForSelector('[data-testid="video-player"][data-ready="true"]', { timeout: 5000 });
      
      const videoLoadTime = Date.now() - videoStartTime;
      
      // Video should start within 2 seconds (as per TDD_DOCUMENTATION.md)
      expect(videoLoadTime).toBeLessThan(2000);
    });

    await test.step('Measure progress tracking responsiveness', async () => {
      // Simulate rapid progress updates
      const progressUpdates = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        await page.evaluate((progress) => {
          window.updateProgress && window.updateProgress(progress);
        }, i * 10);
        
        await page.waitForFunction((expectedProgress) => {
          const progressElement = document.querySelector('[data-testid="progress-percentage"]');
          return progressElement && progressElement.textContent.includes(`${expectedProgress}%`);
        }, i * 10);
        
        progressUpdates.push(Date.now() - startTime);
      }
      
      // All progress updates should be under 500ms
      progressUpdates.forEach(updateTime => {
        expect(updateTime).toBeLessThan(500);
      });
    });
  });

  test('Accessibility compliance verification', async ({ page }) => {
    await test.step('Check keyboard navigation', async () => {
      await page.goto('/courses');
      
      // Test tab navigation through course cards
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus').getAttribute('data-testid');
      expect(focusedElement).toBeTruthy();
      
      // Continue tabbing through interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.locator(':focus').getAttribute('data-testid');
        expect(focusedElement).toBeTruthy();
      }
      
      // Test enter key activation
      await page.keyboard.press('Enter');
      // Should navigate to course or trigger action
    });

    await test.step('Verify ARIA labels and roles', async () => {
      await page.goto('/courses/raw-feeding-101/learn');
      
      // Check video player accessibility
      const videoPlayer = page.locator('[data-testid="video-player"]');
      await expect(videoPlayer).toHaveAttribute('role', 'application');
      await expect(videoPlayer).toHaveAttribute('aria-label');
      
      // Check progress bar accessibility
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toHaveAttribute('role', 'progressbar');
      await expect(progressBar).toHaveAttribute('aria-valuenow');
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      
      // Check navigation accessibility
      const navigation = page.locator('[data-testid="module-navigation"]');
      await expect(navigation).toHaveAttribute('role', 'navigation');
      await expect(navigation).toHaveAttribute('aria-label', 'Course modules');
    });

    await test.step('Verify color contrast compliance', async () => {
      // This would typically use axe-core for automated testing
      await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.6.3/axe.min.js' });
      
      const accessibilityResults = await page.evaluate(async () => {
        const results = await axe.run();
        return results.violations.filter(violation => 
          violation.id === 'color-contrast' || violation.id === 'color-contrast-enhanced'
        );
      });
      
      expect(accessibilityResults).toHaveLength(0);
    });

    await test.step('Test screen reader compatibility', async () => {
      // Verify critical content has proper screen reader support
      const courseTitle = page.locator('[data-testid="course-title"]');
      await expect(courseTitle).toHaveAttribute('role', 'heading');
      await expect(courseTitle).toHaveAttribute('aria-level', '1');
      
      // Verify form labels
      const searchInput = page.locator('[data-testid="course-search"]');
      await expect(searchInput).toHaveAttribute('aria-label');
      
      // Verify button descriptions
      const enrollButton = page.locator('[data-testid="enroll-button"]');
      await expect(enrollButton).toHaveAttribute('aria-describedby');
    });
  });
});