import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Response schema for IP geolocation
const LocationSchema = z.object({
  success: z.boolean(),
  location: z.object({
    ip: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    postal: z.string().optional(),
    timezone: z.string().optional(),
    accuracy: z.enum(['high', 'medium', 'low']).default('medium')
  }).optional(),
  message: z.string(),
  error: z.string().optional()
})

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `location_lookup:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or first attempt - allow 100 requests per hour per IP
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  
  if (record.attempts >= 100) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Prioritize Cloudflare's connecting IP, then others
  let ip = cfConnectingIp || forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Clean up IP (remove port if present)
  ip = ip.trim().split(':')[0]
  
  return ip
}

async function getLocationFromIP(ip: string) {
  // In development, return mock data for localhost/private IPs
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip: ip,
      latitude: 37.7749, // San Francisco coordinates as default
      longitude: -122.4194,
      city: 'San Francisco',
      region: 'California',
      country: 'US',
      postal: '94102',
      timezone: 'America/Los_Angeles',
      accuracy: 'low' as const
    }
  }

  try {
    // Use ipapi.co for free IP geolocation (1000 requests/day free tier)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Rawgle Store Locator'
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Check for API errors
    if (data.error) {
      throw new Error(`API error: ${data.reason || 'Unknown error'}`)
    }

    // Validate required fields
    if (!data.latitude || !data.longitude) {
      throw new Error('Invalid location data received')
    }

    return {
      ip: ip,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      city: data.city || undefined,
      region: data.region || undefined,
      country: data.country_code || undefined,
      postal: data.postal || undefined,
      timezone: data.timezone || undefined,
      accuracy: 'medium' as const // IP geolocation is generally medium accuracy
    }

  } catch (error: any) {
    console.error('IP geolocation error:', error)
    
    // Fallback to default location (San Francisco)
    return {
      ip: ip,
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      region: 'California', 
      country: 'US',
      postal: '94102',
      timezone: 'America/Los_Angeles',
      accuracy: 'low' as const
    }
  }
}

// GET /api/location/ip - Get user location from IP address
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
          message: `Too many location requests. Please try again in ${resetTimeLeft} minutes.`,
          error: `Rate limit exceeded. Try again in ${resetTimeLeft} minutes.`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetTimeLeft.toString()
          }
        }
      )
    }

    // Get client IP
    const clientIP = getClientIP(request)
    
    // Get location data
    const locationData = await getLocationFromIP(clientIP)

    console.log('IP location lookup:', {
      ip: clientIP,
      city: locationData.city,
      coordinates: `${locationData.latitude}, ${locationData.longitude}`,
      accuracy: locationData.accuracy
    })

    const response = {
      success: true,
      location: locationData,
      message: 'Location detected successfully'
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('Location detection error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to detect location',
        error: 'Location detection service unavailable'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to detect location from IP.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to detect location from IP.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to detect location from IP.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET to detect location from IP.' },
    { status: 405 }
  )
}