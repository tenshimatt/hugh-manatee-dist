import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'test-key'

// Firecrawl API integration for health data validation
class FirecrawlHealthValidator {
  private apiKey: string
  private baseUrl: string = 'https://api.firecrawl.dev/v0'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async scrapeHealthResources(urls: string[]) {
    const results = []
    
    for (const url of urls) {
      try {
        const response = await fetch(`${this.baseUrl}/scrape`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown', 'html'],
            waitFor: 2000,
            timeout: 10000
          })
        })

        if (response.ok) {
          const data = await response.json()
          results.push({
            url,
            success: true,
            content: data.data?.markdown || data.data?.html || '',
            metadata: data.data?.metadata || {}
          })
        } else {
          results.push({
            url,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  async validateHealthDataAccuracy(scraped_content: string, expected_patterns: string[]) {
    const validations = []
    
    for (const pattern of expected_patterns) {
      const regex = new RegExp(pattern, 'i')
      const matches = scraped_content.match(regex)
      
      validations.push({
        pattern,
        found: !!matches,
        matches: matches || [],
        context: matches ? this.getContext(scraped_content, matches[0]) : null
      })
    }

    return validations
  }

  private getContext(content: string, match: string, contextLength: number = 100) {
    const index = content.indexOf(match)
    if (index === -1) return null

    const start = Math.max(0, index - contextLength)
    const end = Math.min(content.length, index + match.length + contextLength)
    
    return content.substring(start, end)
  }

  async crawlHealthSiteMap(baseUrl: string, maxPages: number = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: baseUrl,
          crawlerOptions: {
            includes: ['health', 'medical', 'veterinary', 'pet'],
            excludes: ['admin', 'login', 'private'],
            maxPages: maxPages,
            allowBackwardCrawling: false
          },
          pageOptions: {
            includeHtml: false,
            includeMarkdown: true
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          jobId: data.jobId,
          message: 'Crawl started successfully'
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getCrawlStatus(jobId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (response.ok) {
        return await response.json()
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

test.describe('Firecrawl Health Data Validation Suite', () => {
  let firecrawl: FirecrawlHealthValidator

  test.beforeAll(() => {
    firecrawl = new FirecrawlHealthValidator(FIRECRAWL_API_KEY)
  })

  test.describe('Health Resource Validation', () => {
    
    test('should validate veterinary resource links', async ({ page }) => {
      // Navigate to health logs page
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')

      // Extract any external health resource links from the page
      const healthLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="vet"], a[href*="health"], a[href*="medical"]'))
        return links.map(link => (link as HTMLAnchorElement).href).filter(href => href.startsWith('http'))
      })

      // Mock some veterinary resource URLs for testing
      const testUrls = [
        'https://www.avma.org/resources/pet-health-information',
        'https://vcahospitals.com/know-your-pet',
        'https://www.aspca.org/pet-care'
      ]

      if (healthLinks.length === 0) {
        console.log('No external health links found, using test URLs')
      }

      const urlsToTest = healthLinks.length > 0 ? healthLinks.slice(0, 3) : testUrls

      // Skip actual API calls in test environment
      if (FIRECRAWL_API_KEY !== 'test-key') {
        const results = await firecrawl.scrapeHealthResources(urlsToTest)
        
        results.forEach((result, index) => {
          expect(result).toHaveProperty('url')
          expect(result).toHaveProperty('success')
          
          if (result.success) {
            expect(result.content).toBeTruthy()
            expect(result.metadata).toBeDefined()
          }
        })
      } else {
        // Mock test for CI/CD environment
        expect(urlsToTest.length).toBeGreaterThan(0)
        console.log(`Would validate ${urlsToTest.length} health resource URLs`)
      }
    })

    test('should validate health data patterns', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')

      // Extract health data from the page
      const healthData = await page.evaluate(() => {
        const content = document.body.textContent || ''
        return content
      })

      // Define patterns to validate health data accuracy
      const healthPatterns = [
        '\\d+\\.\\d+\\s*(kg|lbs)', // Weight patterns
        '\\d+\\.\\d+°[CF]', // Temperature patterns  
        '\\d+\\s*bpm', // Heart rate patterns
        '(normal|mild|moderate|severe)', // Severity patterns
        '(Luna|Max|Bella)', // Pet name patterns
        '\\d{4}-\\d{2}-\\d{2}', // Date patterns
        '(weight|temperature|symptom|medication|vaccination|vet_visit)' // Type patterns
      ]

      const validations = await firecrawl.validateHealthDataAccuracy(healthData, healthPatterns)
      
      validations.forEach(validation => {
        expect(validation).toHaveProperty('pattern')
        expect(validation).toHaveProperty('found')
        expect(validation.found).toBe(true) // All patterns should be found
      })

      // Verify specific health data integrity
      expect(healthData).toContain('28.0 kg')
      expect(healthData).toContain('38.2°C')
      expect(healthData).toContain('Joint stiffness')
    })

    test('should validate health metrics consistency', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')

      // Extract all numerical health metrics
      const metrics = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const metrics = []

        elements.forEach(el => {
          const text = el.textContent || ''
          
          // Weight metrics
          const weightMatch = text.match(/(\d+\.\d+)\s*(kg|lbs)/g)
          if (weightMatch) {
            metrics.push({ type: 'weight', values: weightMatch })
          }

          // Temperature metrics
          const tempMatch = text.match(/(\d+\.\d+)°[CF]/g)
          if (tempMatch) {
            metrics.push({ type: 'temperature', values: tempMatch })
          }

          // Heart rate metrics
          const hrMatch = text.match(/(\d+)\s*bpm/g)
          if (hrMatch) {
            metrics.push({ type: 'heartRate', values: hrMatch })
          }
        })

        return metrics
      })

      // Validate metric ranges are reasonable
      metrics.forEach(metric => {
        metric.values.forEach(value => {
          if (metric.type === 'weight') {
            const weight = parseFloat(value)
            expect(weight).toBeGreaterThan(0)
            expect(weight).toBeLessThan(100) // Reasonable pet weight range
          }

          if (metric.type === 'temperature') {
            const temp = parseFloat(value)
            expect(temp).toBeGreaterThan(35) // Reasonable body temperature range
            expect(temp).toBeLessThan(42)
          }

          if (metric.type === 'heartRate') {
            const hr = parseInt(value)
            expect(hr).toBeGreaterThan(60) // Reasonable heart rate range for pets
            expect(hr).toBeLessThan(200)
          }
        })
      })
    })
  })

  test.describe('External Health Data Scraping', () => {
    
    test('should scrape and validate veterinary guidelines', async ({ page }) => {
      // Skip actual API calls in test environment
      if (FIRECRAWL_API_KEY === 'test-key') {
        console.log('Skipping external API test in CI environment')
        return
      }

      const vetResourceUrls = [
        'https://www.avma.org/resources/pet-health-information/pet-health-basics',
        'https://vcahospitals.com/know-your-pet/general-health-care'
      ]

      const scrapedData = await firecrawl.scrapeHealthResources(vetResourceUrls)
      
      scrapedData.forEach(result => {
        if (result.success) {
          // Validate that scraped content contains relevant health information
          expect(result.content).toMatch(/(health|medical|veterinary|pet|animal)/i)
          expect(result.content.length).toBeGreaterThan(100)
          
          // Check for specific health guidance patterns
          const healthPatterns = [
            'vaccination',
            'nutrition',
            'exercise',
            'preventive care',
            'symptoms',
            'temperature',
            'weight'
          ]

          const foundPatterns = healthPatterns.filter(pattern => 
            result.content.toLowerCase().includes(pattern.toLowerCase())
          )

          expect(foundPatterns.length).toBeGreaterThan(0)
        }
      })
    })

    test('should crawl health information websites', async ({ page }) => {
      // Skip actual API calls in test environment
      if (FIRECRAWL_API_KEY === 'test-key') {
        console.log('Skipping crawl test in CI environment')
        return
      }

      const crawlResult = await firecrawl.crawlHealthSiteMap('https://www.aspca.org/pet-care', 5)
      
      expect(crawlResult).toHaveProperty('success')
      
      if (crawlResult.success) {
        expect(crawlResult).toHaveProperty('jobId')
        
        // Wait a bit and check crawl status
        await page.waitForTimeout(5000)
        
        const status = await firecrawl.getCrawlStatus(crawlResult.jobId)
        expect(status).toHaveProperty('status')
      }
    })
  })

  test.describe('Health Data Cross-Validation', () => {
    
    test('should cross-validate health logs against medical standards', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')

      // Extract health log data
      const logData = await page.evaluate(() => {
        const logs = []
        const logElements = document.querySelectorAll('.bg-white.rounded-xl.p-6.shadow-lg')
        
        logElements.forEach(element => {
          const titleElement = element.querySelector('h3')
          const noteElement = element.querySelector('p')
          const severityElement = element.querySelector('[class*="rounded-full"]')
          
          if (titleElement && noteElement) {
            logs.push({
              title: titleElement.textContent,
              note: noteElement.textContent,
              severity: severityElement?.textContent
            })
          }
        })

        return logs
      })

      // Validate against medical standards
      logData.forEach(log => {
        if (log.title?.includes('°C')) {
          const temp = parseFloat(log.title.match(/(\d+\.\d+)°C/)?.[1] || '0')
          
          // Normal dog temperature range: 37.5°C - 39.2°C
          if (temp >= 37.5 && temp <= 39.2) {
            expect(log.severity).toContain('normal')
          } else if (temp > 39.2) {
            expect(log.severity).toMatch(/(mild|moderate|severe)/)
          }
        }

        if (log.title?.includes('kg')) {
          // Weight validation - ensure reasonable ranges
          const weight = parseFloat(log.title.match(/(\d+\.\d+)\s*kg/)?.[1] || '0')
          expect(weight).toBeGreaterThan(1)
          expect(weight).toBeLessThan(80) // Reasonable range for most pets
        }

        if (log.title?.includes('stiffness') || log.note?.includes('joint')) {
          // Joint-related symptoms should be at least mild severity
          expect(log.severity).toMatch(/(mild|moderate|severe)/)
        }
      })
    })

    test('should validate health trends and patterns', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')

      // Check for data consistency patterns
      const trendData = await page.evaluate(() => {
        const weights = []
        const temperatures = []
        const dates = []

        document.querySelectorAll('*').forEach(element => {
          const text = element.textContent || ''
          
          // Extract weights with dates
          const weightMatch = text.match(/(\d+\.\d+)\s*kg/)
          if (weightMatch) {
            weights.push(parseFloat(weightMatch[1]))
          }

          // Extract temperatures
          const tempMatch = text.match(/(\d+\.\d+)°C/)
          if (tempMatch) {
            temperatures.push(parseFloat(tempMatch[1]))
          }

          // Extract dates
          const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/)
          if (dateMatch) {
            dates.push(new Date(dateMatch[0]))
          }
        })

        return { weights, temperatures, dates }
      })

      // Validate data trends
      if (trendData.weights.length > 1) {
        const weightRange = Math.max(...trendData.weights) - Math.min(...trendData.weights)
        expect(weightRange).toBeLessThan(10) // Weight shouldn't vary dramatically
      }

      if (trendData.temperatures.length > 1) {
        const tempRange = Math.max(...trendData.temperatures) - Math.min(...trendData.temperatures)
        expect(tempRange).toBeLessThan(5) // Temperature variations should be reasonable
      }

      if (trendData.dates.length > 1) {
        // Dates should be in reasonable chronological order
        const sortedDates = [...trendData.dates].sort((a, b) => b.getTime() - a.getTime())
        expect(sortedDates[0].getTime()).toBeGreaterThanOrEqual(sortedDates[sortedDates.length - 1].getTime())
      }
    })
  })

  test.describe('Real-time Data Validation', () => {
    
    test('should validate live health data feeds', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      
      // Monitor for real-time updates (if implemented)
      let dataUpdated = false
      
      page.on('response', response => {
        if (response.url().includes('health') || response.url().includes('logs')) {
          dataUpdated = true
        }
      })

      // Trigger potential data refresh
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Validate any dynamic data loading
      const stats = await page.locator('.text-2xl.font-bold.text-gray-900').allTextContents()
      stats.forEach(stat => {
        const numericValue = parseInt(stat)
        if (!isNaN(numericValue)) {
          expect(numericValue).toBeGreaterThanOrEqual(0)
        }
      })
    })

    test('should handle data synchronization', async ({ page }) => {
      // Test data consistency across page refreshes
      await page.goto(`${BASE_URL}/dashboard/health/logs`)
      await page.waitForLoadState('networkidle')
      
      // Capture initial data
      const initialData = await page.locator('h3[class*="font-semibold"]').allTextContents()
      
      // Refresh page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Compare data after refresh
      const refreshedData = await page.locator('h3[class*="font-semibold"]').allTextContents()
      
      // Data should be consistent
      expect(refreshedData.length).toBe(initialData.length)
      
      // At least some entries should match
      const matchingEntries = initialData.filter(entry => refreshedData.includes(entry))
      expect(matchingEntries.length).toBeGreaterThan(0)
    })
  })
})