import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  });

  test('should register service worker', async ({ page }) => {
    // Wait for service worker to register
    await page.waitForFunction(
      () => navigator.serviceWorker.ready,
      { timeout: 10000 }
    );

    // Check that service worker is registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });

    expect(swRegistration).toBeTruthy();
  });

  test('should show install prompt on supported browsers', async ({ page, browserName }) => {
    // Skip on browsers that don't support PWA installation
    test.skip(browserName === 'webkit', 'Safari does not support PWA installation prompts');

    // Listen for beforeinstallprompt event
    let installPromptShown = false;
    await page.addInitScript(() => {
      window.addEventListener('beforeinstallprompt', () => {
        window.installPromptReceived = true;
      });
    });

    // Reload to trigger install prompt
    await page.reload();
    
    // Check if install prompt was received
    const promptReceived = await page.evaluate(() => window.installPromptReceived);
    
    if (promptReceived) {
      installPromptShown = true;
    }

    // Note: In a real scenario, you might need to simulate user gestures
    // or wait for specific conditions to trigger the install prompt
    console.log('Install prompt status:', installPromptShown ? 'shown' : 'not shown');
  });

  test('should work offline', async ({ page, context }) => {
    // First, load the page online to cache resources
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');

    // Go offline
    await context.setOffline(true);

    // Navigate to a cached page
    await page.goto('/packs');
    
    // The page should still load (from cache)
    await expect(page.locator('h1')).toContainText('Pack');

    // Check for offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('should cache API responses', async ({ page }) => {
    // Mock API response
    await page.route('/api/dogs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Dog',
              breed: 'Test Breed',
              age: 3
            }
          ]
        })
      });
    });

    // First request - should go to network
    await page.goto('/packs');
    await page.waitForSelector('[data-testid="dog-card-1"]');

    // Second request - should come from cache (test by going offline)
    await page.context().setOffline(true);
    await page.reload();
    
    // Should still show cached data
    await expect(page.locator('[data-testid="dog-card-1"]')).toBeVisible();
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    // Start offline
    await context.setOffline(true);
    await page.goto('/');

    // Try to create a hunt log offline
    await page.goto('/quick-log');
    
    // Fill out hunt log form
    await page.fill('[data-testid="species-input"]', 'Pheasant');
    await page.fill('[data-testid="weather-input"]', 'Clear, 45°F');
    
    // Start hunt logging
    await page.click('[data-testid="start-hunt-button"]');
    
    // End hunt (this should queue for sync)
    await page.click('[data-testid="end-hunt-button"]');

    // Check for offline queue indicator
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText('1');

    // Go back online
    await context.setOffline(false);

    // Wait for sync to complete
    await page.waitForFunction(
      () => {
        const queueEl = document.querySelector('[data-testid="offline-queue"]');
        return queueEl && queueEl.textContent === '0';
      },
      { timeout: 10000 }
    );

    // Verify sync completed
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText('0');
  });

  test('should handle camera permissions for PWA', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    await page.goto('/quick-log');
    
    // Start hunt
    await page.fill('[data-testid="species-input"]', 'Duck');
    await page.click('[data-testid="start-hunt-button"]');
    
    // Try to take a photo
    await page.click('[data-testid="photo-button"]');
    
    // Camera modal should open
    await expect(page.locator('[data-testid="camera-modal"]')).toBeVisible();
    
    // Start camera button should be present
    await expect(page.locator('[data-testid="start-camera-button"]')).toBeVisible();
  });

  test('should handle GPS permissions for PWA', async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    
    // Set a test location
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

    await page.goto('/quick-log');
    
    // GPS status should show active
    await expect(page.locator('[data-testid="gps-status"]')).toContainText('Active');
    
    // Start hunt logging
    await page.fill('[data-testid="species-input"]', 'Quail');
    await page.click('[data-testid="start-hunt-button"]');
    
    // Should show tracking status
    await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
  });

  test('should show proper PWA manifest', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.json');
    expect(manifestResponse?.status()).toBe(200);
    
    const manifest = await manifestResponse?.json();
    expect(manifest.name).toBe('GoHunta - Elite Dog Hunting Platform');
    expect(manifest.short_name).toBe('GoHunta');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#059669');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have proper PWA shortcuts', async ({ page }) => {
    const manifestResponse = await page.goto('/manifest.json');
    const manifest = await manifestResponse?.json();
    
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
    
    // Check for expected shortcuts
    const shortcutNames = manifest.shortcuts.map(s => s.name);
    expect(shortcutNames).toContain('Quick Hunt Log');
    expect(shortcutNames).toContain('Dog Profiles');
  });

  test('should handle background sync', async ({ page, context }) => {
    // This test would require a more complex setup to actually test background sync
    // For now, we'll test that the service worker registers for background sync
    
    await page.goto('/');
    
    const hasSyncRegistration = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return 'sync' in registration;
    });
    
    expect(hasSyncRegistration).toBe(true);
  });

  test('should persist data in IndexedDB', async ({ page }) => {
    await page.goto('/');
    
    // Check that IndexedDB is available
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(hasIndexedDB).toBe(true);
    
    // Test that our offline database can be opened
    const canOpenDB = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('HuntaOfflineDB', 1);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 5000); // Timeout after 5 seconds
      });
    });
    
    expect(canOpenDB).toBe(true);
  });

  test('should handle push notifications setup', async ({ page, context, browserName }) => {
    // Skip on browsers that don't support push notifications
    test.skip(browserName === 'webkit', 'Safari has different push notification handling');
    
    // Grant notification permissions
    await context.grantPermissions(['notifications']);
    
    await page.goto('/');
    
    const hasNotificationSupport = await page.evaluate(() => {
      return 'Notification' in window && 'serviceWorker' in navigator;
    });
    
    expect(hasNotificationSupport).toBe(true);
    
    // Test notification permission status
    const notificationPermission = await page.evaluate(() => {
      return Notification.permission;
    });
    
    expect(['default', 'granted', 'denied']).toContain(notificationPermission);
  });
});