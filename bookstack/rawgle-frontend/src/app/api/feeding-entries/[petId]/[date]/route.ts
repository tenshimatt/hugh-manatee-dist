import { NextRequest, NextResponse } from 'next/server'
import type { 
  FeedingEntry,
  FeedingEntryListResponse,
  DailyFeedingSummary
} from '@/types/feeding'

// Mock authentication
function getCurrentUserId(request: NextRequest): string | null {
  return 'user_12345'
}

// Mock database - in production this would be shared/imported
const mockFeedingEntriesDb: FeedingEntry[] = []
const mockPetsDb = [
  {
    id: 'pet_1',
    user_id: 'user_12345',
    name: 'Luna',
    species: 'dog' as const,
    breed: 'German Shepherd',
    weight: 65,
    activity_level: 'moderate' as const
  },
  {
    id: 'pet_2',
    user_id: 'user_12345', 
    name: 'Max',
    species: 'dog' as const,
    breed: 'Golden Retriever',
    weight: 70,
    activity_level: 'high' as const
  }
]

function validatePetOwnership(userId: string, petId: string): boolean {
  return mockPetsDb.some(pet => pet.id === petId && pet.user_id === userId)
}

// Calculate daily calorie target based on pet weight and activity level
function calculateDailyCalorieTarget(petId: string): number {
  const pet = mockPetsDb.find(p => p.id === petId)
  if (!pet) return 0
  
  // Basic formula: weight * activity multiplier * 30 calories per pound
  const activityMultipliers = {
    low: 1.2,
    moderate: 1.4, 
    high: 1.6,
    working: 1.8
  }
  
  const multiplier = activityMultipliers[pet.activity_level] || 1.4
  return Math.round(pet.weight * multiplier * 30)
}

// Generate daily summary
function generateDailySummary(
  petId: string, 
  date: string, 
  entries: FeedingEntry[]
): DailyFeedingSummary {
  const pet = mockPetsDb.find(p => p.id === petId)
  const targetCalories = calculateDailyCalorieTarget(petId)
  
  // Count meal types expected (typically 2-4 meals per day)
  const expectedMealTypes = ['breakfast', 'dinner'] // Basic expectation
  const totalMeals = expectedMealTypes.length
  
  const completedMeals = entries.filter(e => e.status === 'completed').length
  const totalCalories = entries.reduce((sum, e) => sum + (e.caloriesEstimated || 0), 0)
  
  const missedMeals = expectedMealTypes.filter(mealType => 
    !entries.some(e => e.mealType === mealType && e.status === 'completed')
  )
  
  const upcomingMeals = expectedMealTypes.filter(mealType =>
    !entries.some(e => e.mealType === mealType)
  )
  
  return {
    date,
    petId,
    petName: pet?.name || 'Unknown Pet',
    totalMeals,
    completedMeals,
    totalCalories,
    targetCalories,
    missedMeals,
    upcomingMeals
  }
}

// GET /api/feeding-entries/[petId]/[date] - Get daily feeding entries for specific pet
export async function GET(
  request: NextRequest,
  { params }: { params: { petId: string; date: string } }
) {
  try {
    const { petId, date } = params

    // Authentication check
    const userId = getCurrentUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate pet ownership
    if (!validatePetOwnership(userId, petId)) {
      return NextResponse.json(
        { success: false, message: 'Pet not found or access denied' },
        { status: 404 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    // Get feeding entries for the specific pet and date
    const entries = mockFeedingEntriesDb.filter(entry => 
      entry.userId === userId &&
      entry.petId === petId && 
      entry.date === date
    )

    // Sort by feeding time
    entries.sort((a, b) => a.feedingTime.localeCompare(b.feedingTime))

    // Parse query parameters for additional options
    const { searchParams } = new URL(request.url)
    const includeSummary = searchParams.get('includeSummary') === 'true'

    let summary: DailyFeedingSummary | undefined
    if (includeSummary) {
      summary = generateDailySummary(petId, date, entries)
    }

    const response: FeedingEntryListResponse & { summary?: DailyFeedingSummary } = {
      success: true,
      feedingEntries: entries,
      total: entries.length,
      date,
      ...(summary && { summary })
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Get daily feeding entries error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch daily feeding entries' 
      },
      { status: 500 }
    )
  }
}