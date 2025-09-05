import { NextRequest, NextResponse } from 'next/server'
import { feedingEntrySchema } from '@/types/feeding'
import type { 
  CreateFeedingEntryResponse, 
  FeedingEntry,
  FeedingEntryListResponse 
} from '@/types/feeding'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `feeding_entry:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Allow 50 feeding entries per hour per user
    rateLimitStore.set(key, { attempts: 1, resetTime: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  
  if (record.attempts >= 50) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.attempts++
  return { allowed: true }
}

// Mock authentication - in production, use proper auth middleware
function getCurrentUserId(request: NextRequest): string | null {
  // TODO: Implement proper authentication
  return 'user_12345'
}

// Mock database storage
const mockFeedingEntriesDb: FeedingEntry[] = []
const mockPetsDb = [
  {
    id: 'pet_1',
    user_id: 'user_12345',
    name: 'Luna',
    species: 'dog' as const,
    breed: 'German Shepherd'
  },
  {
    id: 'pet_2', 
    user_id: 'user_12345',
    name: 'Max',
    species: 'dog' as const,
    breed: 'Golden Retriever'
  }
]

// Check if pet belongs to user
function validatePetOwnership(userId: string, petId: string): boolean {
  return mockPetsDb.some(pet => pet.id === petId && pet.user_id === userId)
}

// Check for duplicate feeding entry (same pet, date, meal type, and time)
function checkDuplicateFeeding(
  userId: string, 
  petId: string, 
  date: string, 
  mealType: string, 
  feedingTime: string
): boolean {
  return mockFeedingEntriesDb.some(entry => 
    entry.userId === userId &&
    entry.petId === petId && 
    entry.date === date &&
    entry.mealType === mealType &&
    entry.feedingTime === feedingTime
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
          message: `Too many feeding entry attempts. Please try again in ${resetTimeLeft} minutes.`,
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
    const validationResult = feedingEntrySchema.safeParse(body)
    
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

    const feedingData = validationResult.data

    // Validate pet ownership
    if (!validatePetOwnership(userId, feedingData.petId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pet not found or access denied',
          errors: { petId: 'The selected pet does not exist or you do not have access to it.' }
        },
        { status: 404 }
      )
    }

    // Check for duplicate feeding entry
    if (checkDuplicateFeeding(
      userId, 
      feedingData.petId, 
      feedingData.date, 
      feedingData.mealType, 
      feedingData.feedingTime
    )) {
      return NextResponse.json(
        {
          success: false,
          message: 'Duplicate feeding entry',
          errors: { 
            form: 'A feeding entry already exists for this pet, date, meal type, and time combination.' 
          }
        },
        { status: 409 }
      )
    }

    // Check user's daily feeding limit (20 entries per day per user)
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = mockFeedingEntriesDb.filter(
      entry => entry.userId === userId && entry.date === today
    )
    if (todayEntries.length >= 20) {
      return NextResponse.json(
        {
          success: false,
          message: 'Daily feeding entry limit reached',
          errors: { form: 'You have reached the maximum number of feeding entries (20) for today.' }
        },
        { status: 403 }
      )
    }

    // Create feeding entry
    const now = new Date().toISOString()
    const newFeedingEntry: FeedingEntry = {
      id: `feeding_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: userId,
      petId: feedingData.petId,
      date: feedingData.date,
      mealType: feedingData.mealType,
      feedingTime: feedingData.feedingTime,
      weightAmount: feedingData.weightAmount,
      weightUnit: feedingData.weightUnit,
      proteinSource: feedingData.proteinSource,
      proteinCategory: feedingData.proteinCategory,
      notes: feedingData.notes || null,
      caloriesEstimated: feedingData.caloriesEstimated || null,
      photos: feedingData.photos || [],
      actualFeedingTime: feedingData.actualFeedingTime || null,
      status: feedingData.status || 'upcoming',
      createdAt: now,
      updatedAt: now
    }

    // Save to mock database (in production, use real database)
    mockFeedingEntriesDb.push(newFeedingEntry)

    const pet = mockPetsDb.find(p => p.id === feedingData.petId)
    console.log('Feeding entry created:', {
      id: newFeedingEntry.id,
      petName: pet?.name,
      mealType: newFeedingEntry.mealType,
      date: newFeedingEntry.date,
      userId: userId
    })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const response: CreateFeedingEntryResponse = {
      success: true,
      feedingEntry: newFeedingEntry,
      message: `Feeding entry for ${pet?.name} has been created successfully!`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Feeding entry creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.',
        errors: { form: 'An unexpected error occurred while creating the feeding entry.' }
      },
      { status: 500 }
    )
  }
}

// GET /api/feeding-entries - List user's feeding entries with optional filtering
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mealType = searchParams.get('mealType')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Limit cannot exceed 100 entries' },
        { status: 400 }
      )
    }

    // Get user's feeding entries from mock database
    let userEntries = mockFeedingEntriesDb.filter(entry => entry.userId === userId)

    // Apply filters
    if (petId) {
      // Validate pet ownership first
      if (!validatePetOwnership(userId, petId)) {
        return NextResponse.json(
          { success: false, message: 'Pet not found or access denied' },
          { status: 404 }
        )
      }
      userEntries = userEntries.filter(entry => entry.petId === petId)
    }

    if (date) {
      userEntries = userEntries.filter(entry => entry.date === date)
    }

    if (startDate && endDate) {
      userEntries = userEntries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      )
    }

    if (mealType) {
      userEntries = userEntries.filter(entry => entry.mealType === mealType)
    }

    if (status) {
      userEntries = userEntries.filter(entry => entry.status === status)
    }

    // Sort by date and time (newest first)
    userEntries.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.feedingTime.localeCompare(a.feedingTime)
    })

    // Apply pagination
    const total = userEntries.length
    const paginatedEntries = userEntries.slice(offset, offset + limit)

    const response: FeedingEntryListResponse = {
      success: true,
      feedingEntries: paginatedEntries,
      total
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Get feeding entries error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch feeding entries' 
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific feeding entry ID endpoint for updates.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific feeding entry ID endpoint for deletion.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use specific feeding entry ID endpoint for updates.' },
    { status: 405 }
  )
}