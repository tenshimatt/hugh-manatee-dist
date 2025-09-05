import { NextRequest, NextResponse } from 'next/server'
import { petProfileSchema } from '@/types/pet'
import type { CreatePetResponse, PetProfile } from '@/types/pet'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  // In production, use proper IP detection and user ID
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  // TODO: Include user ID when authentication is integrated
  return `pet_creation:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or first attempt - allow 10 pets per hour per user
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  
  if (record.attempts >= 10) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

// Mock authentication - in production, use proper auth middleware
function getCurrentUserId(request: NextRequest): string | null {
  // TODO: Implement proper authentication
  // For now, return a mock user ID
  return 'user_12345'
}

// Mock database storage
const mockPetsDb: PetProfile[] = []

// Check for duplicate pet names within user's pets
function checkDuplicatePetName(userId: string, petName: string): boolean {
  return mockPetsDb.some(pet => 
    pet.user_id === userId && 
    pet.name.toLowerCase() === petName.toLowerCase()
  )
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
          message: `Too many pet creation attempts. Please try again in ${resetTimeLeft} minutes.`,
          errors: { form: [`Too many attempts. Try again in ${resetTimeLeft} minutes.`] }
        },
        { status: 429 }
      )
    }

    // Authentication check
    const userId = getCurrentUserId(request)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required' 
        },
        { status: 401 }
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

    // Validate request data using Zod schema
    const validationResult = petProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.errors.forEach(error => {
        const field = error.path[0] as string
        errors[field] = error.message
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

    const petData = validationResult.data

    // Check for duplicate pet name within user's pets
    if (checkDuplicatePetName(userId, petData.name)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pet name already exists',
          errors: { name: 'You already have a pet with this name. Please choose a different name.' }
        },
        { status: 409 }
      )
    }

    // Check user's pet limit (free tier: 10 pets)
    const userPetCount = mockPetsDb.filter(pet => pet.user_id === userId).length
    if (userPetCount >= 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pet limit reached',
          errors: { form: 'You have reached the maximum number of pets (10) for your account.' }
        },
        { status: 403 }
      )
    }

    // Handle image upload if provided
    let photoUrl = petData.photo_url || null
    if (photoUrl && photoUrl.startsWith('data:')) {
      // In production, upload to cloud storage (AWS S3, Cloudflare Images, etc.)
      console.log('Image upload would happen here - converting base64 to cloud storage')
      // For now, keep the base64 data (not recommended for production)
      // photoUrl = await uploadImageToCloudStorage(photoUrl)
    }

    // Create pet profile
    const now = new Date().toISOString()
    const newPet: PetProfile = {
      id: `pet_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user_id: userId,
      name: petData.name,
      species: petData.species,
      breed: petData.breed,
      birthdate: petData.birthdate,
      weight: petData.weight,
      weight_unit: petData.weight_unit,
      activity_level: petData.activity_level,
      photo_url: photoUrl,
      spayed_neutered: petData.spayed_neutered || false,
      notes: petData.notes || null,
      created_at: now,
      updated_at: now
    }

    // Save to mock database (in production, use real database)
    mockPetsDb.push(newPet)

    console.log('Pet profile created:', {
      id: newPet.id,
      name: newPet.name,
      species: newPet.species,
      breed: newPet.breed,
      userId: userId
    })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const response: CreatePetResponse = {
      success: true,
      pet: newPet,
      message: `${newPet.name}'s profile has been created successfully!`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Pet creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.',
        errors: { form: 'An unexpected error occurred while creating the pet profile.' }
      },
      { status: 500 }
    )
  }
}

// GET /api/pets - List user's pets
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const userId = getCurrentUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's pets from mock database
    const userPets = mockPetsDb.filter(pet => pet.user_id === userId)
    
    // Sort by creation date (newest first)
    userPets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      pets: userPets,
      total: userPets.length
    })

  } catch (error: any) {
    console.error('Get pets error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch pets' 
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific pet ID endpoint for updates.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific pet ID endpoint for deletion.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific pet ID endpoint for updates.' },
    { status: 405 }
  )
}