import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Query parameters schema
const QuerySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  radius: z.string().transform(val => parseFloat(val)).default('25'), // miles
  storeType: z.string().optional(),
  openNow: z.string().transform(val => val === 'true').optional(),
  hasDelivery: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).default('50')
})

// Rate limiting
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `stores_address_search:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  
  if (record.attempts >= 100) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

// Geocode address to coordinates
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
  // In development/testing, return mock coordinates for common addresses
  const mockAddresses: Record<string, { lat: number; lng: number; formatted: string }> = {
    'san francisco': { lat: 37.7749, lng: -122.4194, formatted: 'San Francisco, CA, USA' },
    'oakland': { lat: 37.8044, lng: -122.2712, formatted: 'Oakland, CA, USA' },
    'berkeley': { lat: 37.8715, lng: -122.2730, formatted: 'Berkeley, CA, USA' },
    'palo alto': { lat: 37.4419, lng: -122.1430, formatted: 'Palo Alto, CA, USA' },
    'san rafael': { lat: 37.9735, lng: -122.5311, formatted: 'San Rafael, CA, USA' },
    '94102': { lat: 37.7849, lng: -122.4094, formatted: 'San Francisco, CA 94102, USA' },
    '94612': { lat: 37.8044, lng: -122.2712, formatted: 'Oakland, CA 94612, USA' },
    '94704': { lat: 37.8715, lng: -122.2730, formatted: 'Berkeley, CA 94704, USA' },
    '94301': { lat: 37.4419, lng: -122.1430, formatted: 'Palo Alto, CA 94301, USA' },
    '94901': { lat: 37.9735, lng: -122.5311, formatted: 'San Rafael, CA 94901, USA' }
  }

  const normalizedAddress = address.toLowerCase().trim()
  
  // Check for mock address match
  for (const [key, coords] of Object.entries(mockAddresses)) {
    if (normalizedAddress.includes(key)) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formattedAddress: coords.formatted
      }
    }
  }

  try {
    // In production, you would use a real geocoding service
    // For now, we'll use a free service with limited requests
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Rawgle Store Locator'
        },
        signal: AbortSignal.timeout(5000)
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('No geocoding results found')
    }

    const result = data[0]
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name
    }

  } catch (error: any) {
    console.error('Geocoding error:', error)
    
    // Fallback to San Francisco coordinates
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      formattedAddress: `${address} (location approximated)`
    }
  }
}

// GET /api/stores/search - Search stores by address
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const rateLimitResult = checkRateLimit(rateLimitKey)
    
    if (!rateLimitResult.allowed) {
      const resetTimeLeft = Math.ceil((rateLimitResult.resetTime! - Date.now()) / (1000 * 60))
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many search requests. Please try again in ${resetTimeLeft} minutes.`
        },
        { status: 429 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams))
    
    if (!queryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid query parameters',
          errors: queryResult.error.errors
        },
        { status: 400 }
      )
    }

    const { address, radius, storeType, openNow, hasDelivery, limit } = queryResult.data

    // Geocode the address
    const geocoded = await geocodeAddress(address)
    
    // Now search for nearby stores using the coordinates
    const nearbySearchParams = new URLSearchParams({
      latitude: geocoded.latitude.toString(),
      longitude: geocoded.longitude.toString(),
      radius: radius.toString(),
      limit: limit.toString()
    })

    if (storeType) nearbySearchParams.set('storeType', storeType)
    if (openNow !== undefined) nearbySearchParams.set('openNow', openNow.toString())
    if (hasDelivery !== undefined) nearbySearchParams.set('hasDelivery', hasDelivery.toString())

    // Create a new request to our nearby endpoint
    const nearbyUrl = new URL('/api/stores/nearby', request.url)
    nearbyUrl.search = nearbySearchParams.toString()

    // Internal API call to nearby endpoint
    const nearbyResponse = await fetch(nearbyUrl.toString(), {
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'x-internal-request': 'true'
      }
    })

    if (!nearbyResponse.ok) {
      throw new Error(`Nearby search failed with status: ${nearbyResponse.status}`)
    }

    const nearbyData = await nearbyResponse.json()

    console.log('Address-based store search:', {
      originalAddress: address,
      geocoded: geocoded.formattedAddress,
      coordinates: `${geocoded.latitude}, ${geocoded.longitude}`,
      results: nearbyData.total
    })

    // Return enhanced response with geocoded address information
    return NextResponse.json({
      ...nearbyData,
      query: {
        ...nearbyData.query,
        originalAddress: address,
        geocodedAddress: geocoded.formattedAddress
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('Address-based store search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to search stores by address',
        error: 'Address search service unavailable'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search stores by address.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search stores by address.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search stores by address.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to search stores by address.' },
    { status: 405 }
  )
}