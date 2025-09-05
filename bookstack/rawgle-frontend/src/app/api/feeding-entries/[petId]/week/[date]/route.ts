import { NextRequest, NextResponse } from 'next/server'
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format,
  parseISO
} from 'date-fns'
import type { 
  FeedingEntry,
  DailyFeedingSummary,
  WeeklyFeedingSummary
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
  
  // Count expected meals (typically 2 meals per day)
  const expectedMealTypes = ['breakfast', 'dinner']
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

// GET /api/feeding-entries/[petId]/week/[date] - Get weekly feeding summary
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

    // Validate date format and parse
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    let targetDate: Date
    try {
      targetDate = parseISO(date)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid date provided.' },
        { status: 400 }
      )
    }

    // Calculate week boundaries (Monday to Sunday)
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Get all feeding entries for the pet within the week
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
    
    const weekEntries = mockFeedingEntriesDb.filter(entry => 
      entry.userId === userId &&
      entry.petId === petId &&
      entry.date >= weekStartStr &&
      entry.date <= weekEndStr
    )

    // Generate daily summaries for each day of the week
    const dailySummaries: DailyFeedingSummary[] = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayEntries = weekEntries.filter(entry => entry.date === dayStr)
      return generateDailySummary(petId, dayStr, dayEntries)
    })

    // Calculate weekly statistics
    const totalMeals = dailySummaries.reduce((sum, day) => sum + day.totalMeals, 0)
    const completedMeals = dailySummaries.reduce((sum, day) => sum + day.completedMeals, 0)
    const totalCaloriesForWeek = dailySummaries.reduce((sum, day) => sum + day.totalCalories, 0)
    const targetCaloriesForWeek = dailySummaries.reduce((sum, day) => sum + day.targetCalories, 0)
    
    const completionRate = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0
    const averageCaloriesPerDay = Math.round(totalCaloriesForWeek / 7)
    
    // Determine consistency rating
    let consistency: 'excellent' | 'good' | 'needs_improvement'
    if (completionRate >= 95) {
      consistency = 'excellent'
    } else if (completionRate >= 85) {
      consistency = 'good'  
    } else {
      consistency = 'needs_improvement'
    }

    const pet = mockPetsDb.find(p => p.id === petId)
    
    const weeklyStats: WeeklyFeedingSummary = {
      petId,
      petName: pet?.name || 'Unknown Pet',
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      dailySummaries,
      weeklyStats: {
        totalMeals,
        completedMeals,
        completionRate,
        averageCaloriesPerDay,
        consistency
      }
    }

    return NextResponse.json({
      success: true,
      weeklyStats,
      message: `Weekly feeding summary for ${pet?.name}`
    })

  } catch (error: any) {
    console.error('Get weekly feeding summary error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch weekly feeding summary' 
      },
      { status: 500 }
    )
  }
}