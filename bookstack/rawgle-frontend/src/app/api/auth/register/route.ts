import { NextRequest, NextResponse } from 'next/server'
import { registrationSchema } from '@/lib/validation'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  // In production, use proper IP detection
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `registration:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or first attempt
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 }) // 1 hour
    return { allowed: true }
  }
  
  if (record.attempts >= 3) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const rateLimitResult = checkRateLimit(rateLimitKey)
    
    if (!rateLimitResult.allowed) {
      const resetTimeLeft = Math.ceil((rateLimitResult.resetTime! - Date.now()) / (1000 * 60))
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many registration attempts. Please try again in ${resetTimeLeft} minutes.`,
          errors: { form: [`Too many attempts. Try again in ${resetTimeLeft} minutes.`] }
        },
        { status: 429 }
      )
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate request data
    const validationResult = registrationSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {}
      validationResult.error.errors.forEach(error => {
        const field = error.path[0] as string
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(error.message)
      })
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors 
        },
        { status: 400 }
      )
    }

    const userData = validationResult.data

    // Check for existing user (mock implementation)
    // In real implementation, check your database
    const existingUsers = [
      'test@example.com',
      'admin@rawgle.com',
      'demo@rawgle.com'
    ]
    
    if (existingUsers.includes(userData.email.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'User already exists',
          errors: { email: ['An account with this email address already exists'] }
        },
        { status: 409 }
      )
    }

    // Simulate user creation process
    console.log('Creating user:', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      wantsNewsletter: userData.wantsNewsletter
    })

    // In real implementation:
    // 1. Hash password with bcrypt
    // 2. Store user in database
    // 3. Send email verification
    // 4. Create user session or return JWT token

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock user creation success
    const newUser = {
      id: `user_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: false,
      createdAt: new Date().toISOString()
    }

    // In real implementation, send verification email
    console.log('Sending verification email to:', userData.email)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email for verification.',
        user: newUser
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.',
        errors: { form: ['An unexpected error occurred'] }
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}