import { z } from 'zod'

// Enums for feeding entry data
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type WeightUnit = 'oz' | 'lbs' | 'grams' | 'kg'
export type ProteinCategory = 'muscle_meat' | 'organ_meat' | 'bone' | 'supplements'
export type FeedingStatus = 'upcoming' | 'completed' | 'missed' | 'skipped'

// Core feeding entry interface
export interface FeedingEntryData {
  // Required fields
  petId: string
  date: string // ISO date string (YYYY-MM-DD)
  mealType: MealType
  feedingTime: string // HH:MM format (24-hour)
  weightAmount: number
  weightUnit: WeightUnit
  proteinSource: string
  proteinCategory: ProteinCategory
  
  // Optional fields
  notes?: string
  caloriesEstimated?: number
  photos?: string[] // Array of photo URLs
  actualFeedingTime?: string // When actually fed (HH:MM format)
  status?: FeedingStatus
}

// Extended interface with database fields
export interface FeedingEntry extends FeedingEntryData {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Form data interface for component state
export interface FeedingFormData extends Omit<FeedingEntryData, 'date'> {
  date: string
}

// Meal type options with descriptions and icons for UI
export interface MealTypeOption {
  value: MealType
  label: string
  description: string
  icon: string
  suggestedTimes: string[] // Default times for this meal type
}

export const MEAL_TYPES: MealTypeOption[] = [
  {
    value: 'breakfast',
    label: 'Breakfast',
    description: 'Morning meal',
    icon: '🌅',
    suggestedTimes: ['06:00', '07:00', '08:00']
  },
  {
    value: 'lunch',
    label: 'Lunch',
    description: 'Midday meal',
    icon: '☀️',
    suggestedTimes: ['12:00', '13:00', '14:00']
  },
  {
    value: 'dinner',
    label: 'Dinner',
    description: 'Evening meal',
    icon: '🌆',
    suggestedTimes: ['17:00', '18:00', '19:00']
  },
  {
    value: 'snack',
    label: 'Snack',
    description: 'Small treat or snack',
    icon: '🍪',
    suggestedTimes: ['10:00', '15:00', '21:00']
  }
]

// Protein categories with common sources
export interface ProteinCategoryOption {
  value: ProteinCategory
  label: string
  description: string
  commonSources: string[]
  caloriesPerOz: number // Average calories per ounce for calculation
}

export const PROTEIN_CATEGORIES: ProteinCategoryOption[] = [
  {
    value: 'muscle_meat',
    label: 'Muscle Meat',
    description: 'Primary protein source',
    commonSources: [
      'Beef (ground)',
      'Beef (chunks)',
      'Chicken breast',
      'Chicken thigh',
      'Turkey breast',
      'Turkey ground',
      'Lamb',
      'Pork',
      'Venison',
      'Duck',
      'Rabbit'
    ],
    caloriesPerOz: 35
  },
  {
    value: 'organ_meat',
    label: 'Organ Meat',
    description: 'Nutrient-dense organs',
    commonSources: [
      'Beef liver',
      'Chicken liver',
      'Chicken hearts',
      'Turkey liver',
      'Kidney',
      'Spleen',
      'Brain',
      'Lung',
      'Green tripe'
    ],
    caloriesPerOz: 40
  },
  {
    value: 'bone',
    label: 'Raw Meaty Bones',
    description: 'Calcium and phosphorus source',
    commonSources: [
      'Chicken wings',
      'Chicken necks',
      'Turkey necks',
      'Beef ribs',
      'Lamb ribs',
      'Duck necks',
      'Pork ribs',
      'Recreational bones'
    ],
    caloriesPerOz: 25
  },
  {
    value: 'supplements',
    label: 'Supplements',
    description: 'Additional nutrients',
    commonSources: [
      'Fish oil',
      'Kelp meal',
      'Bone meal',
      'Egg shells (ground)',
      'Probiotics',
      'Digestive enzymes',
      'Vitamin E',
      'CoQ10'
    ],
    caloriesPerOz: 10
  }
]

// Weight unit conversion utilities
export interface WeightUnitOption {
  value: WeightUnit
  label: string
  abbreviation: string
  gramsPerUnit: number // For conversion calculations
}

export const WEIGHT_UNITS: WeightUnitOption[] = [
  {
    value: 'oz',
    label: 'Ounces',
    abbreviation: 'oz',
    gramsPerUnit: 28.35
  },
  {
    value: 'lbs',
    label: 'Pounds',
    abbreviation: 'lbs',
    gramsPerUnit: 453.59
  },
  {
    value: 'grams',
    label: 'Grams',
    abbreviation: 'g',
    gramsPerUnit: 1
  },
  {
    value: 'kg',
    label: 'Kilograms',
    abbreviation: 'kg',
    gramsPerUnit: 1000
  }
]

// Validation schema using Zod
export const feedingEntrySchema = z.object({
  petId: z
    .string()
    .min(1, 'Pet selection is required')
    .uuid('Invalid pet ID format'),
    
  date: z
    .string()
    .min(1, 'Feeding date is required')
    .refine((date) => {
      const feedingDate = new Date(date)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(today.getDate() + 7)
      
      return feedingDate >= oneYearAgo && feedingDate <= oneWeekFromNow
    }, 'Feeding date must be within the last year and not more than a week in the future'),
    
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Please select a meal type' })
  }),
  
  feedingTime: z
    .string()
    .min(1, 'Feeding time is required')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format'),
    
  weightAmount: z
    .number()
    .min(0.1, 'Weight amount must be at least 0.1')
    .max(50, 'Weight amount must be less than 50 (please check your units)'),
    
  weightUnit: z.enum(['oz', 'lbs', 'grams', 'kg'], {
    errorMap: () => ({ message: 'Please select a weight unit' })
  }),
  
  proteinSource: z
    .string()
    .min(1, 'Protein source is required')
    .max(100, 'Protein source name must be less than 100 characters'),
    
  proteinCategory: z.enum(['muscle_meat', 'organ_meat', 'bone', 'supplements'], {
    errorMap: () => ({ message: 'Please select a protein category' })
  }),
  
  // Optional fields
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
    
  caloriesEstimated: z
    .number()
    .min(0, 'Calories must be 0 or greater')
    .max(5000, 'Calories must be less than 5000')
    .optional(),
    
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .max(5, 'Maximum 5 photos per meal')
    .optional(),
    
  actualFeedingTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format')
    .optional(),
    
  status: z.enum(['upcoming', 'completed', 'missed', 'skipped']).optional()
})

// Type for form validation errors
export type FeedingEntryErrors = {
  [K in keyof FeedingFormData]?: string
}

// API response types
export interface CreateFeedingEntryResponse {
  success: boolean
  feedingEntry?: FeedingEntry
  message?: string
  errors?: FeedingEntryErrors
}

export interface FeedingEntryListResponse {
  success: boolean
  feedingEntries: FeedingEntry[]
  total: number
  date?: string
}

export interface DailyFeedingSummary {
  date: string
  petId: string
  petName: string
  totalMeals: number
  completedMeals: number
  totalCalories: number
  targetCalories: number
  missedMeals: string[] // Array of missed meal types
  upcomingMeals: string[] // Array of upcoming meal types
}

export interface WeeklyFeedingSummary {
  petId: string
  petName: string
  weekStart: string
  weekEnd: string
  dailySummaries: DailyFeedingSummary[]
  weeklyStats: {
    totalMeals: number
    completedMeals: number
    completionRate: number
    averageCaloriesPerDay: number
    consistency: 'excellent' | 'good' | 'needs_improvement'
  }
}

// Meal template for quick actions
export interface MealTemplate {
  id: string
  userId: string
  name: string
  description?: string
  mealType: MealType
  weightAmount: number
  weightUnit: WeightUnit
  proteinSource: string
  proteinCategory: ProteinCategory
  caloriesEstimated?: number
  isDefault: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface MealTemplateFormData extends Omit<MealTemplate, 'id' | 'userId' | 'usageCount' | 'createdAt' | 'updatedAt'> {}

// Quick action types
export type QuickActionType = 'repeat_yesterday' | 'use_template' | 'copy_from_pet' | 'bulk_entry'

export interface QuickAction {
  type: QuickActionType
  label: string
  description: string
  icon: string
  requiresPetSelection?: boolean
  requiresTemplateSelection?: boolean
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    type: 'repeat_yesterday',
    label: 'Repeat Yesterday',
    description: 'Use the same meals from yesterday',
    icon: '↩️'
  },
  {
    type: 'use_template',
    label: 'Use Template',
    description: 'Select from saved meal templates',
    icon: '📋',
    requiresTemplateSelection: true
  },
  {
    type: 'copy_from_pet',
    label: 'Copy from Pet',
    description: 'Copy meals from another pet',
    icon: '📄',
    requiresPetSelection: true
  },
  {
    type: 'bulk_entry',
    label: 'Bulk Entry',
    description: 'Add multiple meals at once',
    icon: '📝'
  }
]

// Utility functions
export const convertWeight = (amount: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  const fromGrams = WEIGHT_UNITS.find(unit => unit.value === fromUnit)?.gramsPerUnit || 1
  const toGrams = WEIGHT_UNITS.find(unit => unit.value === toUnit)?.gramsPerUnit || 1
  
  const gramsAmount = amount * fromGrams
  return Math.round((gramsAmount / toGrams) * 100) / 100
}

export const calculateCalories = (
  weightAmount: number, 
  weightUnit: WeightUnit, 
  proteinCategory: ProteinCategory
): number => {
  // Convert to ounces for calculation
  const ounces = convertWeight(weightAmount, weightUnit, 'oz')
  const categoryData = PROTEIN_CATEGORIES.find(cat => cat.value === proteinCategory)
  
  return Math.round(ounces * (categoryData?.caloriesPerOz || 30))
}

export const getMealTypeByTime = (time: string): MealType => {
  const hour = parseInt(time.split(':')[0])
  
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 22) return 'dinner'
  return 'snack'
}

export const formatFeedingTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  return `${displayHour}:${minutes} ${period}`
}