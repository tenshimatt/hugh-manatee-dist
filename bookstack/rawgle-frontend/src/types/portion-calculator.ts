import { z } from 'zod'
import { PetProfile } from './pet'

// Core enums for portion calculator
export type AgeCategory = 'puppy' | 'kitten' | 'adult' | 'senior'
export type BodyConditionScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type SpecialCondition = 'pregnant' | 'lactating' | 'intact' | 'spayed_neutered' | 'working' | 'recovering' | 'diabetic' | 'kidney_disease'
export type FeedingGoal = 'maintenance' | 'weight_loss' | 'weight_gain' | 'growth' | 'performance' | 'senior_support'
export type EnvironmentalFactor = 'indoor' | 'outdoor' | 'hot_climate' | 'cold_climate' | 'stressed' | 'illness_recovery'

// Enhanced activity levels with precise multipliers
export interface ActivityLevelData {
  value: string
  label: string
  description: string
  dogMultiplier: number
  catMultiplier: number
}

export const ENHANCED_ACTIVITY_LEVELS: ActivityLevelData[] = [
  {
    value: 'low',
    label: 'Low Activity',
    description: 'Mostly indoor, minimal exercise, older pets',
    dogMultiplier: 1.2,
    catMultiplier: 1.1
  },
  {
    value: 'moderate',
    label: 'Moderate Activity',
    description: 'Daily walks, some play time, typical house pet',
    dogMultiplier: 1.4,
    catMultiplier: 1.2
  },
  {
    value: 'high',
    label: 'High Activity',
    description: 'Very active, lots of exercise, young energetic pets',
    dogMultiplier: 1.6,
    catMultiplier: 1.4
  },
  {
    value: 'working',
    label: 'Working/Performance',
    description: 'Working dogs, hunting cats, intense daily activity',
    dogMultiplier: 1.8,
    catMultiplier: 1.6
  },
  {
    value: 'puppy',
    label: 'Puppy Growth',
    description: 'Growing puppies under 12 months',
    dogMultiplier: 2.0,
    catMultiplier: 1.8
  },
  {
    value: 'kitten',
    label: 'Kitten Growth',
    description: 'Growing kittens under 12 months',
    dogMultiplier: 1.8,
    catMultiplier: 2.0
  }
]

// Body condition score data
export interface BodyConditionData {
  score: BodyConditionScore
  label: string
  description: string
  multiplier: number
  visual: string
}

export const BODY_CONDITION_SCORES: BodyConditionData[] = [
  { score: 1, label: 'Emaciated', description: 'Ribs, lumbar vertebrae, pelvic bones easily visible', multiplier: 1.3, visual: '🦴' },
  { score: 2, label: 'Very Thin', description: 'Ribs easily felt, minimal fat covering', multiplier: 1.2, visual: '🦴' },
  { score: 3, label: 'Thin', description: 'Ribs easily felt, slight fat covering', multiplier: 1.1, visual: '🦴' },
  { score: 4, label: 'Underweight', description: 'Ribs felt with slight pressure, waist visible', multiplier: 1.05, visual: '⚖️' },
  { score: 5, label: 'Ideal', description: 'Ribs felt without excess pressure, waist clearly visible', multiplier: 1.0, visual: '✅' },
  { score: 6, label: 'Slightly Overweight', description: 'Ribs felt with slight excess pressure', multiplier: 0.95, visual: '⚖️' },
  { score: 7, label: 'Overweight', description: 'Ribs felt with difficulty, fat deposits noticeable', multiplier: 0.9, visual: '⚠️' },
  { score: 8, label: 'Obese', description: 'Ribs not easily felt, heavy fat cover', multiplier: 0.85, visual: '🚫' },
  { score: 9, label: 'Grossly Obese', description: 'Massive fat deposits, waist absent', multiplier: 0.8, visual: '🚫' }
]

// Special conditions with their effects
export interface SpecialConditionData {
  value: SpecialCondition
  label: string
  description: string
  energyMultiplier: number
  nutritionalNotes: string[]
}

export const SPECIAL_CONDITIONS: SpecialConditionData[] = [
  {
    value: 'pregnant',
    label: 'Pregnant',
    description: 'Expecting mother (varies by stage)',
    energyMultiplier: 1.25,
    nutritionalNotes: ['Increase food gradually during pregnancy', 'Higher protein and fat requirements', 'Free-choice feeding recommended']
  },
  {
    value: 'lactating',
    label: 'Lactating',
    description: 'Nursing mother with litter',
    energyMultiplier: 2.0,
    nutritionalNotes: ['Significantly increased caloric needs', 'Free-choice feeding essential', 'High-quality protein critical']
  },
  {
    value: 'intact',
    label: 'Intact (Not Spayed/Neutered)',
    description: 'Unaltered adult pet',
    energyMultiplier: 1.1,
    nutritionalNotes: ['Slightly higher metabolism', 'Monitor for weight changes during heat cycles']
  },
  {
    value: 'spayed_neutered',
    label: 'Spayed/Neutered',
    description: 'Altered pet with reduced metabolism',
    energyMultiplier: 0.9,
    nutritionalNotes: ['Reduced metabolism after alteration', 'Monitor weight gain tendency', 'May need portion reduction']
  },
  {
    value: 'working',
    label: 'Working/Service Animal',
    description: 'Active working dog or cat',
    energyMultiplier: 1.5,
    nutritionalNotes: ['Higher protein needs', 'May need carbohydrates for sustained energy', 'Frequent feeding schedule']
  },
  {
    value: 'recovering',
    label: 'Recovering from Illness/Surgery',
    description: 'Pet in recovery phase',
    energyMultiplier: 1.2,
    nutritionalNotes: ['Higher protein for healing', 'Easy-to-digest foods', 'Consult veterinarian for specific needs']
  }
]

// Calculator input interface
export interface CalculatorInputs {
  // Pet identification
  petId?: string
  petName: string
  species: 'dog' | 'cat'
  
  // Basic metrics
  weight: number
  weightUnit: 'lbs' | 'kg'
  age: number // in years, supports decimals
  ageCategory: AgeCategory
  
  // Activity and lifestyle
  activityLevel: string
  bodyConditionScore: BodyConditionScore
  feedingGoal: FeedingGoal
  
  // Special conditions
  specialConditions: SpecialCondition[]
  environmentalFactors: EnvironmentalFactor[]
  
  // Current diet info
  currentDietType: 'kibble' | 'wet' | 'raw' | 'mixed' | 'homemade'
  isTransitioning: boolean
  
  // Health considerations
  hasHealthConditions: boolean
  healthNotes?: string
}

// Macro breakdown for raw feeding
export interface MacroBreakdown {
  // Raw feeding ratios (by weight)
  muscleMeat: {
    percentage: number
    weightOz: number
    weightGrams: number
    calories: number
  }
  organMeat: {
    percentage: number
    weightOz: number
    weightGrams: number
    calories: number
    breakdown: {
      liver: number // 5% of total
      otherOrgans: number // 5% of total
    }
  }
  rawBone: {
    percentage: number
    weightOz: number
    weightGrams: number
    calories: number
  }
  vegetables: {
    percentage: number
    weightOz: number
    weightGrams: number
    calories: number
  }
  supplements?: {
    fishOil: boolean
    vitaminE: boolean
    probiotics: boolean
    other: string[]
  }
}

// Meal distribution
export interface MealBreakdown {
  mealsPerDay: number
  
  meals: {
    name: string // 'Breakfast', 'Lunch', 'Dinner'
    time: string // 'HH:MM'
    weightOz: number
    weightGrams: number
    calories: number
    macros: {
      muscleOz: number
      organOz: number
      boneOz: number
      vegetableOz: number
    }
  }[]
  
  // Alternative feeding schedules
  alternativeSchedules?: {
    name: string
    description: string
    meals: typeof this.meals
  }[]
}

// Visual portion guides
export interface VisualPortionGuide {
  totalDailyPortion: {
    commonObject: string // 'tennis ball', 'baseball', 'softball'
    description: string
    visual: string // emoji or icon
  }
  
  individualMeals: {
    mealName: string
    commonObject: string
    description: string
    visual: string
  }[]
  
  measuringTools: {
    cups: number
    tablespoons: number
    kitchenScale: string
    feedingScale: string
  }
  
  portionProgression?: {
    age: string
    portionSize: string
    notes: string
  }[]
}

// Calculator result interface
export interface CalculatorResult {
  // Pet information
  petInfo: {
    name: string
    species: 'dog' | 'cat'
    weight: number
    weightUnit: 'lbs' | 'kg'
    age: number
    ageCategory: AgeCategory
  }
  
  // Energy calculations
  energy: {
    rer: number // Resting Energy Requirement
    der: number // Daily Energy Requirement
    adjustedDer: number // After all adjustments
  }
  
  // Daily totals
  dailyTotals: {
    totalCalories: number
    totalWeightOz: number
    totalWeightGrams: number
    totalWeightLbs: number
  }
  
  // Macro breakdown
  macroBreakdown: MacroBreakdown
  
  // Meal planning
  mealBreakdown: MealBreakdown
  
  // Visual guides
  visualGuides: VisualPortionGuide
  
  // Adjustment factors applied
  adjustmentFactors: {
    baseMultiplier: number
    activityMultiplier: number
    bodyConditionMultiplier: number
    specialConditionMultipliers: { condition: string; multiplier: number }[]
    environmentalMultipliers: { factor: string; multiplier: number }[]
    goalMultiplier: number
    finalMultiplier: number
  }
  
  // Recommendations and warnings
  recommendations: {
    type: 'info' | 'success' | 'warning' | 'error'
    category: 'feeding' | 'health' | 'transition' | 'monitoring'
    title: string
    message: string
    priority: 'low' | 'medium' | 'high'
  }[]
  
  // Feeding schedule suggestions
  schedule: {
    recommended: boolean
    frequency: string
    times: string[]
    notes: string[]
  }
  
  // Transition plan (if switching from kibble/other)
  transitionPlan?: {
    totalDays: number
    phases: {
      days: string
      oldFoodPercentage: number
      newFoodPercentage: number
      notes: string
    }[]
  }
}

// Template for saving user preferences
export interface PortionTemplate {
  id: string
  userId: string
  name: string
  description?: string
  
  // Template data
  baseInputs: Partial<CalculatorInputs>
  adjustments: {
    macroAdjustments: {
      muscleAdjustment: number // -20 to +20
      organAdjustment: number
      boneAdjustment: number
      vegetableAdjustment: number
    }
    portionAdjustment: number // -30 to +30
    mealFrequencyOverride?: number
  }
  
  // Metadata
  isDefault: boolean
  usageCount: number
  lastUsed: string
  createdAt: string
  updatedAt: string
  
  // Sharing
  isPublic: boolean
  sharedWith: string[] // user IDs
  tags: string[]
}

// API response types
export interface CalculationResponse {
  success: boolean
  result?: CalculatorResult
  error?: string
  warnings?: string[]
}

export interface TemplateResponse {
  success: boolean
  template?: PortionTemplate
  templates?: PortionTemplate[]
  error?: string
}

// Form validation schemas
export const calculatorInputSchema = z.object({
  petName: z.string().min(1, 'Pet name is required'),
  species: z.enum(['dog', 'cat']),
  weight: z.number().min(0.5, 'Weight must be at least 0.5').max(200, 'Weight seems too high'),
  weightUnit: z.enum(['lbs', 'kg']),
  age: z.number().min(0.1, 'Age must be at least 0.1 years').max(30, 'Age seems too high'),
  ageCategory: z.enum(['puppy', 'kitten', 'adult', 'senior']),
  activityLevel: z.string().min(1, 'Activity level is required'),
  bodyConditionScore: z.number().min(1).max(9),
  feedingGoal: z.enum(['maintenance', 'weight_loss', 'weight_gain', 'growth', 'performance', 'senior_support']),
  specialConditions: z.array(z.enum(['pregnant', 'lactating', 'intact', 'spayed_neutered', 'working', 'recovering', 'diabetic', 'kidney_disease'])),
  environmentalFactors: z.array(z.enum(['indoor', 'outdoor', 'hot_climate', 'cold_climate', 'stressed', 'illness_recovery'])),
  currentDietType: z.enum(['kibble', 'wet', 'raw', 'mixed', 'homemade']),
  isTransitioning: z.boolean(),
  hasHealthConditions: z.boolean(),
  healthNotes: z.string().optional()
})

export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  baseInputs: z.record(z.any()),
  adjustments: z.object({
    macroAdjustments: z.object({
      muscleAdjustment: z.number().min(-20).max(20),
      organAdjustment: z.number().min(-20).max(20),
      boneAdjustment: z.number().min(-20).max(20),
      vegetableAdjustment: z.number().min(-20).max(20)
    }),
    portionAdjustment: z.number().min(-30).max(30),
    mealFrequencyOverride: z.number().min(1).max(4).optional()
  }),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

// Utility types for component props
export type CalculatorInputErrors = {
  [K in keyof CalculatorInputs]?: string
}

export type TemplateErrors = {
  [K in keyof Partial<PortionTemplate>]?: string
}

// Export validation schemas
export type CalculatorInputData = z.infer<typeof calculatorInputSchema>
export type TemplateData = z.infer<typeof templateSchema>