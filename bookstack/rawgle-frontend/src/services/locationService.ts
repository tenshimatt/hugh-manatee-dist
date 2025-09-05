import { LocationData, LocationCoords, LocationDetectionResponse } from '@/types/store'

// Rate limiting for client-side requests
const requestCache = new Map<string, { data: any; timestamp: number }>()
const REQUEST_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class LocationService {
  private rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

  private checkRateLimit(key: string, maxAttempts: number = 20): boolean {
    const now = Date.now()
    const record = this.rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
      return true
    }
    
    if (record.attempts >= maxAttempts) {
      return false
    }
    
    record.attempts++
    return true
  }

  private getCachedData<T>(key: string): T | null {
    const cached = requestCache.get(key)
    if (cached && Date.now() - cached.timestamp < REQUEST_CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCachedData<T>(key: string, data: T): void {
    requestCache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Get user's location using browser geolocation API
   */
  async getBrowserLocation(): Promise<LocationDetectionResponse> {
    if (!navigator.geolocation) {
      return {
        success: false,
        message: 'Geolocation is not supported by this browser',
        error: 'Geolocation not supported'
      }
    }

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy < 100 ? 'high' : 
                     position.coords.accuracy < 1000 ? 'medium' : 'low'
          }

          resolve({
            success: true,
            location: locationData,
            message: 'Location detected using GPS'
          })
        },
        (error) => {
          let message = 'Failed to get location'
          let errorDetail = error.message

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user'
              errorDetail = 'Permission denied'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable'
              errorDetail = 'Position unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timed out'
              errorDetail = 'Request timeout'
              break
          }

          resolve({
            success: false,
            message,
            error: errorDetail
          })
        },
        options
      )
    })
  }

  /**
   * Get user's location using IP geolocation
   */
  async getIPLocation(): Promise<LocationDetectionResponse> {
    const cacheKey = 'ip-location'
    
    // Check cache first
    const cachedLocation = this.getCachedData<LocationDetectionResponse>(cacheKey)
    if (cachedLocation) {
      return cachedLocation
    }

    // Rate limiting
    if (!this.checkRateLimit('ip-location', 10)) {
      return {
        success: false,
        message: 'Too many location requests. Please wait a moment.',
        error: 'Rate limited'
      }
    }

    try {
      // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(8000), // 8 second timeout
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.reason || 'API error')
      }

      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid location data')
      }

      const locationData: LocationData = {
        ip: data.ip,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city || undefined,
        region: data.region || undefined,
        country: data.country_code || undefined,
        postal: data.postal || undefined,
        timezone: data.timezone || undefined,
        accuracy: 'medium' // IP geolocation is generally medium accuracy
      }

      const result: LocationDetectionResponse = {
        success: true,
        location: locationData,
        message: 'Location detected using IP address'
      }

      // Cache the result
      this.setCachedData(cacheKey, result)
      return result

    } catch (error: any) {
      console.error('IP location detection failed:', error)

      // Fallback to default location (San Francisco)
      const fallbackData: LocationData = {
        latitude: 37.7749,
        longitude: -122.4194,
        city: 'San Francisco',
        region: 'California',
        country: 'US',
        postal: '94102',
        timezone: 'America/Los_Angeles',
        accuracy: 'low'
      }

      const fallbackResult: LocationDetectionResponse = {
        success: true, // Still success, but with fallback data
        location: fallbackData,
        message: 'Using default location (location detection failed)'
      }

      this.setCachedData(cacheKey, fallbackResult)
      return fallbackResult
    }
  }

  /**
   * Get location with preference: GPS first, then IP fallback
   */
  async getLocationWithFallback(): Promise<LocationDetectionResponse> {
    // First try browser geolocation
    const gpsResult = await this.getBrowserLocation()
    
    if (gpsResult.success) {
      return gpsResult
    }

    // If GPS fails, try IP location
    console.log('GPS failed, falling back to IP location:', gpsResult.error)
    return await this.getIPLocation()
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<LocationDetectionResponse> {
    if (!address.trim()) {
      return {
        success: false,
        message: 'Address is required',
        error: 'Empty address'
      }
    }

    const cacheKey = `geocode-${address.toLowerCase().trim()}`
    
    // Check cache first
    const cachedResult = this.getCachedData<LocationDetectionResponse>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    // Rate limiting
    if (!this.checkRateLimit('geocoding', 30)) {
      return {
        success: false,
        message: 'Too many address searches. Please wait a moment.',
        error: 'Rate limited'
      }
    }

    // Check for common mock addresses first
    const mockAddresses: Record<string, LocationData> = {
      'san francisco': { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', region: 'CA', country: 'US', formattedAddress: 'San Francisco, CA, USA' },
      'oakland': { latitude: 37.8044, longitude: -122.2712, city: 'Oakland', region: 'CA', country: 'US', formattedAddress: 'Oakland, CA, USA' },
      'berkeley': { latitude: 37.8715, longitude: -122.2730, city: 'Berkeley', region: 'CA', country: 'US', formattedAddress: 'Berkeley, CA, USA' },
      'palo alto': { latitude: 37.4419, longitude: -122.1430, city: 'Palo Alto', region: 'CA', country: 'US', formattedAddress: 'Palo Alto, CA, USA' },
      '94102': { latitude: 37.7849, longitude: -122.4094, city: 'San Francisco', region: 'CA', country: 'US', postal: '94102', formattedAddress: 'San Francisco, CA 94102, USA' },
      '94612': { latitude: 37.8044, longitude: -122.2712, city: 'Oakland', region: 'CA', country: 'US', postal: '94612', formattedAddress: 'Oakland, CA 94612, USA' }
    }

    const normalizedAddress = address.toLowerCase().trim()
    
    // Check for mock address match
    for (const [key, locationData] of Object.entries(mockAddresses)) {
      if (normalizedAddress.includes(key)) {
        const result: LocationDetectionResponse = {
          success: true,
          location: { ...locationData, accuracy: 'medium' },
          message: `Location found for "${address}"`
        }
        this.setCachedData(cacheKey, result)
        return result
      }
    }

    try {
      // Use OpenStreetMap Nominatim for free geocoding
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Rawgle Store Locator'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error('No results found')
      }

      const result = data[0]
      
      const locationData: LocationData = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
        city: result.address?.city || result.address?.town || undefined,
        region: result.address?.state || undefined,
        country: result.address?.country_code?.toUpperCase() || undefined,
        postal: result.address?.postcode || undefined,
        accuracy: 'high' // Address geocoding is generally high accuracy
      }

      const geocodeResult: LocationDetectionResponse = {
        success: true,
        location: locationData,
        message: `Address "${address}" geocoded successfully`
      }

      this.setCachedData(cacheKey, geocodeResult)
      return geocodeResult

    } catch (error: any) {
      console.error('Geocoding failed:', error)

      const errorResult: LocationDetectionResponse = {
        success: false,
        message: `Failed to find location for "${address}"`,
        error: error.message
      }

      return errorResult
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Get user's current location using the best available method
   */
  async getCurrentLocation(): Promise<LocationDetectionResponse> {
    // Try GPS first (most accurate)
    const gpsResult = await this.getBrowserLocation()
    if (gpsResult.success && gpsResult.location) {
      return gpsResult
    }

    // Fallback to IP location
    return await this.getIPLocation()
  }
}

// Export singleton instance
export const locationService = new LocationService()
export default locationService