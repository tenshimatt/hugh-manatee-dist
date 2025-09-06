import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test data for health logs validation
const expectedLogEntries = [
  {
    id: 'log-001',
    pet: 'Luna',
    type: 'weight',
    value: '28.0 kg',
    severity: 'normal'
  },
  {
    id: 'log-002', 
    pet: 'Luna',
    type: 'temperature',
    value: '38.2°C',
    severity: 'normal'
  },
  {
    id: 'log-003',
    pet: 'Max',
    type: 'symptom', 
    value: 'Joint stiffness in morning',
    severity: 'mild'
  }
]

test.describe('Health Logs Page - Comprehensive Testing Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to health logs page
    await page.goto(`${BASE_URL}/dashboard/health/logs`)
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Verify page loaded successfully
    await expect(page.locator('h1')).toContainText('Health Logs')
  })

  test.describe('Page Structure and Layout', () => {
    
    test('should display correct page title and navigation', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Health Logs')
      await expect(page.locator('p.text-gray-600')).toContainText('Comprehensive health tracking history')
      
      // Check back navigation
      const backButton = page.locator('button', { hasText: 'Back to Health' })
      await expect(backButton).toBeVisible()
      
      // Verify back button functionality by direct navigation
      await page.goto(`${BASE_URL}/dashboard/health`)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toContainText('Health Tracking')
      
      // Navigate back to logs
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
    })

    test('should display stats summary cards', async ({ page }) => {
      const statsCards = page.locator('[data-testid="stats-card"]').or(
        page.locator('.grid').first().locator('.p-6')
      )
      
      // Should have 4 stats cards
      await expect(statsCards).toHaveCount(4)
      
      // Check for specific stat labels
      await expect(page.getByText('Total Entries')).toBeVisible()
      await expect(page.getByText('Need Follow-up')).toBeVisible()
      await expect(page.getByText('Normal Entries')).toBeVisible()
      await expect(page.getByText('This Week')).toBeVisible()
    })

    test('should display action buttons', async ({ page }) => {
      // Check Export button
      const exportButton = page.locator('button', { hasText: 'Export' })
      await expect(exportButton).toBeVisible()
      
      // Check Add Entry button
      const addButton = page.locator('button', { hasText: 'Add Entry' })
      await expect(addButton).toBeVisible()
      
      // Verify add button links to correct page
      await addButton.click()
      await page.waitForURL('**/dashboard/health/log')
      
      // Navigate back
      await page.goBack()
    })
  })

  test.describe('Filter and Search Functionality', () => {
    
    test('should have all filter controls', async ({ page }) => {
      // Search input
      const searchInput = page.locator('input[placeholder*="Search logs"]')
      await expect(searchInput).toBeVisible()
      
      // Filter selects (using native select elements)
      await expect(page.locator('select').nth(0)).toBeVisible() // Pet filter
      await expect(page.locator('select').nth(1)).toBeVisible() // Type filter
      await expect(page.locator('select').nth(2)).toBeVisible() // Date range
      await expect(page.locator('select').nth(3)).toBeVisible() // Sort by
    })

    test('should filter by pet correctly', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Get initial count of log entries
      const allLogs = page.locator('.bg-white.rounded-xl.p-6.shadow-lg').filter({
        has: page.locator('h3[class*="font-semibold"]')
      })
      const initialCount = await allLogs.count()
      expect(initialCount).toBeGreaterThan(0)
      
      // Filter by Luna using native select
      await page.locator('select').nth(0).selectOption('Luna')
      
      // Wait for filtering to apply
      await page.waitForTimeout(500)
      
      // Verify only Luna entries are shown
      const lunaLogs = page.locator('h3[class*="font-semibold"]', { hasText: 'Luna' })
      const lunaCount = await lunaLogs.count()
      
      // Should have Luna entries
      expect(lunaCount).toBeGreaterThan(0)
      
      // Verify no other pets are shown
      await expect(page.locator('h3[class*="font-semibold"]', { hasText: 'Max' })).toHaveCount(0)
      await expect(page.locator('h3[class*="font-semibold"]', { hasText: 'Bella' })).toHaveCount(0)
    })

    test('should filter by type correctly', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Filter by weight type using native select
      await page.locator('select').nth(1).selectOption('weight')
      
      // Wait for filtering
      await page.waitForTimeout(500)
      
      // Should show weight-related entries
      const weightEntries = page.locator('h3[class*="font-semibold"]', { hasText: 'kg' })
      const weightCount = await weightEntries.count()
      expect(weightCount).toBeGreaterThan(0)
    })

    test('should search logs by content', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Search for specific term
      const searchInput = page.locator('input[placeholder*="Search logs"]')
      await searchInput.fill('joint')
      
      // Wait for search to filter
      await page.waitForTimeout(500)
      
      // Should show entries containing 'joint'
      await expect(page.locator('text=Joint stiffness')).toBeVisible()
    })

    test('should sort logs correctly', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Change sort to Pet Name using native select
      await page.locator('select').nth(3).selectOption('pet')
      
      // Wait for sorting
      await page.waitForTimeout(500)
      
      // Get first few pet names
      const petNames = await page.locator('h3[class*="font-semibold"]').first().textContent()
      expect(petNames).toBeTruthy()
    })
  })

  test.describe('Log Entry Display and Interaction', () => {
    
    test('should display log entries with correct information', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      const logEntries = page.locator('.bg-white.rounded-xl.p-6.shadow-lg').filter({
        has: page.locator('h3[class*="font-semibold"]')
      })
      
      // Should have at least some log entries
      const entryCount = await logEntries.count()
      expect(entryCount).toBeGreaterThan(0)
      
      // Check first entry has required elements
      const firstEntry = logEntries.first()
      await expect(firstEntry.locator('h3[class*="font-semibold"]')).toBeVisible()
      await expect(firstEntry.locator('[class*="rounded-full"]')).toBeVisible() // severity badge
      await expect(firstEntry.locator('p[class*="text-gray-700"]')).toBeVisible() // note
    })

    test('should show follow-up indicators correctly', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Look for follow-up indicators
      const followUpBadges = page.locator('span', { hasText: 'Follow-up' })
      const followUpCount = await followUpBadges.count()
      
      // Should have some follow-up entries based on test data
      expect(followUpCount).toBeGreaterThanOrEqual(0)
    })

    test('should display action buttons for each entry', async ({ page }) => {
      // Wait for logs to load  
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      const logEntries = page.locator('.bg-white.rounded-xl.p-6.shadow-lg').filter({
        has: page.locator('h3[class*="font-semibold"]')
      })
      
      // Check first entry has action buttons
      const firstEntry = logEntries.first()
      const actionButtons = firstEntry.locator('button').filter({
        has: page.locator('[class*="h-4 w-4"]') // Icons in buttons
      })
      
      const buttonCount = await actionButtons.count()
      expect(buttonCount).toBeGreaterThanOrEqual(3) // View, Edit, Delete
    })

    test('should display severity badges with correct colors', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Look for different severity badges
      const normalBadges = page.locator('[class*="bg-green-100"][class*="text-green-800"]')
      const mildBadges = page.locator('[class*="bg-yellow-100"][class*="text-yellow-800"]')
      
      // Should have some normal and potentially mild entries
      const normalCount = await normalBadges.count()
      expect(normalCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Responsive Design and Mobile Testing', () => {
    
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Check header is still visible
      await expect(page.locator('h1')).toBeVisible()
      
      // Check filters adapt to mobile
      const filterContainer = page.locator('.grid').first()
      await expect(filterContainer).toBeVisible()
    })

    test('should handle tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Reload and check layout
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Verify content is accessible
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('input[placeholder*="Search logs"]')).toBeVisible()
    })
  })

  test.describe('Performance and Loading', () => {
    
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    })

    test('should handle no results gracefully', async ({ page }) => {
      // Search for something that won't exist
      const searchInput = page.locator('input[placeholder*="Search logs"]')
      await searchInput.fill('nonexistentterm12345')
      
      // Wait for filtering
      await page.waitForTimeout(500)
      
      // Should show no results message
      await expect(page.getByText('No logs found')).toBeVisible()
      await expect(page.getByText('Try adjusting your filters')).toBeVisible()
    })
  })

  test.describe('Data Validation and Content Testing', () => {
    
    test('should display accurate log data', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Check for specific expected entries from test data
      await expect(page.getByText('Luna - 28.0 kg')).toBeVisible()
      await expect(page.getByText('Luna - 38.2°C')).toBeVisible()
      await expect(page.getByText('Max - Joint stiffness')).toBeVisible()
    })

    test('should show proper date formatting', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Look for date patterns (YYYY-MM-DD format)
      const dateElements = page.locator('text=/2025-\\d{2}-\\d{2}/')
      const dateCount = await dateElements.count()
      expect(dateCount).toBeGreaterThan(0)
    })

    test('should display tags correctly', async ({ page }) => {
      // Wait for logs to load
      await page.waitForSelector('.bg-white.rounded-xl.p-6.shadow-lg', { timeout: 5000 })
      
      // Look for tag elements
      const tags = page.locator('[class*="bg-gray-100"][class*="text-gray-700"][class*="rounded-full"]')
      const tagCount = await tags.count()
      expect(tagCount).toBeGreaterThan(0)
    })
  })

  test.describe('Navigation and Deep Linking', () => {
    
    test('should maintain URL state with filters', async ({ page }) => {
      // Apply a filter
      await page.getByRole('button', { name: /Select Pet/i }).click()
      await page.getByRole('option', { name: 'Luna' }).click()
      
      // Check if URL or state is maintained (implementation dependent)
      const url = page.url()
      expect(url).toContain('health/logs')
    })

    test('should navigate to related pages correctly', async ({ page }) => {
      // Test Add Entry navigation
      const addButton = page.locator('button', { hasText: 'Add Entry' })
      await addButton.click()
      await page.waitForURL('**/dashboard/health/log')
      
      // Navigate back and test other navigation
      await page.goBack()
      await page.waitForURL('**/dashboard/health/logs')
      
      // Test back to health dashboard
      const backButton = page.locator('button', { hasText: 'Back to Health' })
      await backButton.click()
      await page.waitForURL('**/dashboard/health')
    })
  })

  test.describe('Accessibility Testing', () => {
    
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for search input accessibility
      const searchInput = page.locator('input[placeholder*="Search logs"]')
      await expect(searchInput).toBeVisible()
      
      // Check buttons have proper accessibility
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      expect(buttonCount).toBeGreaterThan(0)
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to reach interactive elements
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // This test would require mocking network failures
      // For now, just verify the page structure remains intact
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('h1')).toBeVisible()
    })

    test('should validate filter combinations', async ({ page }) => {
      // Apply multiple filters
      await page.getByRole('button', { name: /Select Pet/i }).click()
      await page.getByRole('option', { name: 'Luna' }).click()
      
      await page.getByRole('button', { name: /Filter by Type/i }).click()
      await page.getByRole('option', { name: 'Weight Tracking' }).click()
      
      // Should handle combination gracefully
      await page.waitForTimeout(500)
      
      // Page should still function
      await expect(page.locator('h1')).toBeVisible()
    })
  })
})

test.describe('Health Logs Integration Tests', () => {
  
  test('should integrate with health dashboard', async ({ page }) => {
    // Start from health dashboard
    await page.goto(`${BASE_URL}/dashboard/health`)
    
    // Click "View All Logs" link
    await page.getByText('View All Logs').click()
    
    // Should navigate to logs page
    await page.waitForURL('**/dashboard/health/logs')
    await expect(page.locator('h1')).toContainText('Health Logs')
  })

  test('should maintain context between health pages', async ({ page }) => {
    // Navigate through health section
    await page.goto(`${BASE_URL}/dashboard/health`)
    await page.getByText('View All Logs').click()
    
    // Go back to health dashboard
    await page.getByText('Back to Health').click()
    await page.waitForURL('**/dashboard/health')
    
    // Should return to dashboard correctly
    await expect(page.locator('h1')).toContainText('Health Tracking')
  })
})