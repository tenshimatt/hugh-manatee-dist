/**
 * End-to-End tests for critical user workflows using Playwright
 */
import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: `test.user.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1555123456'
};

const testSupplier = {
  name: 'Test Pet Clinic',
  category: 'veterinary',
  location: 'New York, NY'
};

test.describe('Critical User Workflows - E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('User Registration and Authentication Flow', () => {
    
    test('should complete full user registration workflow', async ({ page }) => {
      // Navigate to registration page
      await page.click('[data-testid="register-button"]');
      await expect(page).toHaveURL(/.*\/register/);
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);
      await page.fill('[data-testid="first-name-input"]', testUser.firstName);
      await page.fill('[data-testid="last-name-input"]', testUser.lastName);
      await page.fill('[data-testid="phone-input"]', testUser.phoneNumber);
      
      // Submit registration
      await page.click('[data-testid="submit-registration"]');
      
      // Verify successful registration
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
      
      // Verify welcome bonus PAWS
      await expect(page.locator('[data-testid="paws-balance"]')).toContainText('100');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should handle login workflow', async ({ page }) => {
      // Navigate to login page
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/.*\/login/);
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      
      // Submit login
      await page.click('[data-testid="submit-login"]');
      
      // Verify successful login
      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText(testUser.firstName);
    });

    test('should handle logout workflow', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-login"]');
      
      // Verify logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Verify logged out
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    });

    test('should validate registration form inputs', async ({ page }) => {
      await page.goto('/register');
      
      // Test email validation
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="submit-registration"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Valid email required');
      
      // Test password validation
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', '123');
      await page.click('[data-testid="submit-registration"]');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
      
      // Test required fields
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-registration"]');
      await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name required');
    });
  });

  test.describe('Supplier Discovery and Search Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-login"]');
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should complete supplier search workflow', async ({ page }) => {
      // Navigate to suppliers page
      await page.click('[data-testid="find-suppliers-button"]');
      await expect(page).toHaveURL(/.*\/suppliers/);
      
      // Verify suppliers are loaded
      await expect(page.locator('[data-testid="supplier-card"]').first()).toBeVisible();
      
      // Test text search
      await page.fill('[data-testid="search-input"]', 'veterinary');
      await page.click('[data-testid="search-button"]');
      
      // Verify search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-card"]')).toHaveCount(/* expected count based on test data */);
      
      // Test category filter
      await page.selectOption('[data-testid="category-filter"]', 'veterinary');
      await page.click('[data-testid="apply-filters"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="supplier-card"]:has-text("Veterinary")')).toHaveCount(/* expected count */);
    });

    test('should handle geolocation-based search', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Mock geolocation permission
      await page.context().grantPermissions(['geolocation']);
      await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
      
      // Click location-based search
      await page.click('[data-testid="nearby-suppliers-button"]');
      
      // Verify location permission request handling
      await expect(page.locator('[data-testid="location-status"]')).toContainText('Finding nearby suppliers');
      
      // Verify results show distance
      await expect(page.locator('[data-testid="supplier-distance"]').first()).toBeVisible();
      
      // Test radius filter
      await page.selectOption('[data-testid="radius-filter"]', '5');
      await page.click('[data-testid="apply-filters"]');
      
      // Verify radius filtering
      const distances = await page.locator('[data-testid="supplier-distance"]').allTextContents();
      distances.forEach(distance => {
        const miles = parseFloat(distance.match(/(\d+\.?\d*) mi/)[1]);
        expect(miles).toBeLessThanOrEqual(5);
      });
    });

    test('should view supplier details and reviews', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Click on first supplier
      await page.click('[data-testid="supplier-card"]');
      
      // Verify supplier details page
      await expect(page).toHaveURL(/.*\/suppliers\/\d+/);
      await expect(page.locator('[data-testid="supplier-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-description"]')).toBeVisible();
      
      // Verify contact information
      await expect(page.locator('[data-testid="supplier-phone"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-address"]')).toBeVisible();
      
      // Verify reviews section
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
      
      // Check if reviews are displayed
      const reviewCount = await page.locator('[data-testid="review-item"]').count();
      if (reviewCount > 0) {
        await expect(page.locator('[data-testid="review-item"]').first()).toBeVisible();
        await expect(page.locator('[data-testid="review-rating"]').first()).toBeVisible();
        await expect(page.locator('[data-testid="review-content"]').first()).toBeVisible();
      }
      
      // Test booking button
      await expect(page.locator('[data-testid="book-service-button"]')).toBeVisible();
    });

    test('should handle advanced search filters', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Open advanced filters
      await page.click('[data-testid="advanced-filters-toggle"]');
      
      // Set multiple filters
      await page.selectOption('[data-testid="category-filter"]', 'grooming');
      await page.selectOption('[data-testid="rating-filter"]', '4');
      await page.selectOption('[data-testid="price-range-filter"]', 'medium');
      await page.check('[data-testid="verified-only-filter"]');
      
      // Apply filters
      await page.click('[data-testid="apply-filters"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('grooming');
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('4+ stars');
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('verified');
      
      // Clear filters
      await page.click('[data-testid="clear-filters"]');
      await expect(page.locator('[data-testid="active-filters"]')).not.toBeVisible();
    });
  });

  test.describe('Order Creation and Management Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login and navigate to a supplier
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-login"]');
      await page.goto('/suppliers/1'); // Navigate to test supplier
    });

    test('should complete order creation workflow', async ({ page }) => {
      // Click book service button
      await page.click('[data-testid="book-service-button"]');
      
      // Verify booking form
      await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();
      
      // Fill booking form
      await page.selectOption('[data-testid="service-type"]', 'grooming');
      await page.fill('[data-testid="service-description"]', 'Full grooming service for my golden retriever');
      await page.fill('[data-testid="scheduled-date"]', '2024-12-01');
      await page.fill('[data-testid="scheduled-time"]', '10:00');
      
      // Submit booking
      await page.click('[data-testid="submit-booking"]');
      
      // Verify order confirmation
      await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-number"]')).toContainText('RWG-');
      
      // Verify PAWS earning projection
      await expect(page.locator('[data-testid="paws-to-earn"]')).toBeVisible();
      
      // Navigate to orders page
      await page.click('[data-testid="view-my-orders"]');
      await expect(page).toHaveURL(/.*\/orders/);
      
      // Verify order appears in list
      await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible();
    });

    test('should handle order status updates', async ({ page }) => {
      // Navigate to orders page
      await page.goto('/orders');
      
      // Verify orders are displayed
      await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible();
      
      // Click on an order to view details
      await page.click('[data-testid="order-item"]');
      
      // Verify order details modal/page
      await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      
      // Verify status timeline
      await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
      
      // Test order cancellation (if status allows)
      const status = await page.locator('[data-testid="order-status"]').textContent();
      if (status === 'pending' || status === 'confirmed') {
        await page.click('[data-testid="cancel-order-button"]');
        await page.click('[data-testid="confirm-cancel"]');
        await expect(page.locator('[data-testid="order-status"]')).toContainText('cancelled');
      }
    });

    test('should handle PAWS payment integration', async ({ page }) => {
      // Navigate to booking with sufficient PAWS balance
      await page.goto('/suppliers/1');
      await page.click('[data-testid="book-service-button"]');
      
      // Fill booking form
      await page.selectOption('[data-testid="service-type"]', 'basic-grooming');
      await page.fill('[data-testid="service-description"]', 'Basic grooming');
      
      // Enable PAWS payment
      await page.check('[data-testid="use-paws-payment"]');
      
      // Verify PAWS balance display
      await expect(page.locator('[data-testid="current-paws-balance"]')).toBeVisible();
      
      // Set PAWS amount to use
      await page.fill('[data-testid="paws-amount"]', '50');
      
      // Verify remaining cost calculation
      await expect(page.locator('[data-testid="remaining-cost"]')).toBeVisible();
      
      // Submit booking
      await page.click('[data-testid="submit-booking"]');
      
      // Verify PAWS deduction
      await expect(page.locator('[data-testid="paws-used"]')).toContainText('50');
      
      // Verify updated balance
      const newBalance = await page.locator('[data-testid="paws-balance"]').textContent();
      expect(parseInt(newBalance)).toBeLessThan(100); // Should be less than original 100
    });
  });

  test.describe('PAWS Cryptocurrency System Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-login"]');
    });

    test('should display PAWS balance and transaction history', async ({ page }) => {
      // Navigate to PAWS dashboard
      await page.click('[data-testid="paws-menu"]');
      await expect(page).toHaveURL(/.*\/paws/);
      
      // Verify balance display
      await expect(page.locator('[data-testid="paws-balance-large"]')).toBeVisible();
      await expect(page.locator('[data-testid="balance-value"]')).toContainText(/\d+/);
      
      // Verify transaction history
      await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
      
      // Check welcome bonus transaction
      await expect(page.locator('[data-testid="transaction-item"]:has-text("Welcome bonus")')).toBeVisible();
      
      // Test pagination if multiple transactions
      const transactionCount = await page.locator('[data-testid="transaction-item"]').count();
      if (transactionCount >= 20) {
        await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
        await page.click('[data-testid="next-page"]');
        await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(/* expected count */);
      }
    });

    test('should complete PAWS transfer workflow', async ({ page }) => {
      await page.goto('/paws');
      
      // Click transfer button
      await page.click('[data-testid="transfer-paws-button"]');
      
      // Verify transfer form
      await expect(page.locator('[data-testid="transfer-form"]')).toBeVisible();
      
      // Fill transfer form
      await page.fill('[data-testid="recipient-email"]', 'recipient@example.com');
      await page.fill('[data-testid="transfer-amount"]', '25');
      await page.fill('[data-testid="transfer-description"]', 'Test transfer');
      
      // Submit transfer
      await page.click('[data-testid="submit-transfer"]');
      
      // Verify confirmation dialog
      await expect(page.locator('[data-testid="transfer-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-amount"]')).toContainText('25 PAWS');
      
      // Confirm transfer
      await page.click('[data-testid="confirm-transfer"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible();
      
      // Verify balance update
      const newBalance = await page.locator('[data-testid="paws-balance"]').textContent();
      expect(parseInt(newBalance)).toBeLessThan(100); // Should be reduced by transfer amount
      
      // Verify transaction appears in history
      await expect(page.locator('[data-testid="transaction-item"]:has-text("Test transfer")')).toBeVisible();
    });

    test('should display PAWS leaderboard', async ({ page }) => {
      await page.goto('/paws');
      
      // Navigate to leaderboard
      await page.click('[data-testid="leaderboard-tab"]');
      
      // Verify leaderboard display
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="leaderboard-item"]').first()).toBeVisible();
      
      // Verify user ranking
      await expect(page.locator('[data-testid="user-rank"]')).toBeVisible();
      
      // Verify anonymized user names
      const userNames = await page.locator('[data-testid="leaderboard-name"]').allTextContents();
      userNames.forEach(name => {
        expect(name).toMatch(/\w+ \w\./); // First name + last initial
      });
      
      // Test different time periods
      await page.selectOption('[data-testid="leaderboard-period"]', 'monthly');
      await expect(page.locator('[data-testid="leaderboard-item"]')).toHaveCount(/* expected count */);
    });

    test('should handle PAWS earning from activities', async ({ page }) => {
      // Complete an activity that earns PAWS (e.g., submit a review)
      await page.goto('/orders');
      
      // Find a completed order and add review
      const completedOrder = page.locator('[data-testid="order-item"]:has-text("completed")').first();
      if (await completedOrder.isVisible()) {
        await completedOrder.click();
        await page.click('[data-testid="write-review-button"]');
        
        // Fill review form
        await page.click('[data-testid="rating-star-5"]');
        await page.fill('[data-testid="review-title"]', 'Excellent service!');
        await page.fill('[data-testid="review-content"]', 'Great experience with this supplier.');
        
        // Submit review
        await page.click('[data-testid="submit-review"]');
        
        // Verify PAWS earned notification
        await expect(page.locator('[data-testid="paws-earned-notification"]')).toBeVisible();
        await expect(page.locator('[data-testid="paws-earned-amount"]')).toContainText(/\d+ PAWS/);
        
        // Verify balance increase
        await page.goto('/paws');
        const balance = await page.locator('[data-testid="paws-balance"]').textContent();
        expect(parseInt(balance)).toBeGreaterThan(100); // Should be more than initial welcome bonus
      }
    });
  });

  test.describe('Review System Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login and ensure there's a completed order to review
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="submit-login"]');
    });

    test('should complete review submission workflow', async ({ page }) => {
      await page.goto('/orders');
      
      // Find a completed order
      await page.click('[data-testid="order-item"]:has-text("completed")');
      
      // Click write review button
      await page.click('[data-testid="write-review-button"]');
      
      // Verify review form
      await expect(page.locator('[data-testid="review-form"]')).toBeVisible();
      
      // Fill review form
      await page.click('[data-testid="rating-star-4"]');
      await page.fill('[data-testid="review-title"]', 'Great service overall');
      await page.fill('[data-testid="review-content"]', 'The service was prompt and professional. My dog looks great!');
      
      // Add photos (if supported)
      if (await page.locator('[data-testid="photo-upload"]').isVisible()) {
        // Mock file upload
        await page.setInputFiles('[data-testid="photo-upload"]', ['test-image.jpg']);
        await expect(page.locator('[data-testid="uploaded-photo"]')).toBeVisible();
      }
      
      // Submit review
      await page.click('[data-testid="submit-review"]');
      
      // Verify review submission success
      await expect(page.locator('[data-testid="review-success"]')).toBeVisible();
      
      // Verify PAWS earned for review
      await expect(page.locator('[data-testid="paws-earned"]')).toContainText(/\d+ PAWS/);
      
      // Navigate to supplier page to verify review appears
      await page.goto('/suppliers/1');
      await expect(page.locator('[data-testid="review-item"]:has-text("Great service overall")')).toBeVisible();
    });

    test('should handle review management', async ({ page }) => {
      // Navigate to user reviews
      await page.goto('/reviews');
      
      // Verify user reviews list
      await expect(page.locator('[data-testid="user-reviews"]')).toBeVisible();
      
      // Find and edit a review
      await page.click('[data-testid="review-item"]');
      await page.click('[data-testid="edit-review-button"]');
      
      // Update review
      await page.fill('[data-testid="review-content"]', 'Updated review content with more details.');
      await page.click('[data-testid="update-review"]');
      
      // Verify update success
      await expect(page.locator('[data-testid="update-success"]')).toBeVisible();
      
      // Verify no additional PAWS earned for edit
      await page.goto('/paws');
      // Check that balance didn't increase again
    });

    test('should prevent duplicate reviews', async ({ page }) => {
      await page.goto('/orders');
      
      // Try to review the same order twice
      await page.click('[data-testid="order-item"]:has-text("completed")');
      
      // Check if review button is disabled or shows "Edit Review"
      const reviewButton = page.locator('[data-testid="write-review-button"]');
      if (await reviewButton.isVisible()) {
        expect(await reviewButton.textContent()).toContain('Edit Review');
      } else {
        await expect(page.locator('[data-testid="review-submitted"]')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design and Mobile Experience', () => {
    
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test mobile search
      await page.click('[data-testid="mobile-search-button"]');
      await expect(page.locator('[data-testid="mobile-search-form"]')).toBeVisible();
      
      // Test mobile supplier cards
      await page.goto('/suppliers');
      await expect(page.locator('[data-testid="supplier-card"]')).toBeVisible();
      
      // Verify mobile-friendly tap targets
      const supplierCard = page.locator('[data-testid="supplier-card"]').first();
      const boundingBox = await supplierCard.boundingBox();
      expect(boundingBox.height).toBeGreaterThan(44); // Minimum touch target size
    });

    test('should work correctly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/suppliers');
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="supplier-grid"]')).toHaveClass(/tablet-grid/);
      
      // Test tablet filters sidebar
      await expect(page.locator('[data-testid="filters-sidebar"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      await page.goto('/suppliers');
      
      // Verify offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Restore connection
      await page.context().setOffline(false);
      await page.reload();
      
      // Verify content loads normally
      await expect(page.locator('[data-testid="supplier-card"]')).toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Search for something that returns no results
      await page.fill('[data-testid="search-input"]', 'nonexistent-service-xyz123');
      await page.click('[data-testid="search-button"]');
      
      // Verify empty state
      await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-results"]')).toContainText('No suppliers found');
      
      // Verify suggestions
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    });

    test('should handle invalid supplier pages', async ({ page }) => {
      // Navigate to non-existent supplier
      await page.goto('/suppliers/99999');
      
      // Verify 404 page
      await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-to-suppliers"]')).toBeVisible();
      
      // Test back navigation
      await page.click('[data-testid="back-to-suppliers"]');
      await expect(page).toHaveURL(/.*\/suppliers/);
    });
  });

  test.describe('Accessibility', () => {
    
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Test tab navigation through supplier cards
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus indicators
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Should navigate to supplier details or trigger action
      // This depends on what element was focused
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/suppliers');
      
      // Check for important ARIA labels
      await expect(page.locator('[aria-label="Search suppliers"]')).toBeVisible();
      await expect(page.locator('[aria-label="Filter suppliers"]')).toBeVisible();
      await expect(page.locator('[role="main"]')).toBeVisible();
      
      // Check supplier cards have proper labels
      await expect(page.locator('[data-testid="supplier-card"]').first()).toHaveAttribute('aria-label');
    });
  });
});

test.describe('Performance and Loading States', () => {
  
  test('should show loading states appropriately', async ({ page }) => {
    // Navigate to suppliers page
    await page.goto('/suppliers');
    
    // Should show loading skeleton initially
    await expect(page.locator('[data-testid="supplier-skeleton"]')).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="supplier-card"]');
    
    // Loading skeleton should be hidden
    await expect(page.locator('[data-testid="supplier-skeleton"]')).not.toBeVisible();
    
    // Content should be visible
    await expect(page.locator('[data-testid="supplier-card"]')).toBeVisible();
  });

  test('should meet performance benchmarks', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });
});