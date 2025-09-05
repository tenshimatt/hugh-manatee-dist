import { 
  CalculatorInputs, 
  CalculatorResult, 
  MacroBreakdown, 
  MealBreakdown, 
  VisualPortionGuide,
  ENHANCED_ACTIVITY_LEVELS,
  BODY_CONDITION_SCORES,
  SPECIAL_CONDITIONS,
  AgeCategory,
  BodyConditionScore,
  SpecialCondition
} from '@/types/portion-calculator'

/**
 * Calculate Resting Energy Requirement (RER) using industry standard formulas
 * Dogs & Cats: RER = 70 × (weight in kg)^0.75
 */
export function calculateRER(weightKg: number): number {
  return Math.round(70 * Math.pow(weightKg, 0.75))
}

/**
 * Convert weight between units
 */
export function convertWeight(weight: number, fromUnit: 'lbs' | 'kg', toUnit: 'lbs' | 'kg'): number {
  if (fromUnit === toUnit) return weight
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight * 0.453592
  } else if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * 2.20462
  }
  
  return weight
}

/**
 * Determine age category based on species and age
 */
export function determineAgeCategory(species: 'dog' | 'cat', ageInYears: number): AgeCategory {
  if (species === 'dog') {
    if (ageInYears < 1) return 'puppy'
    if (ageInYears >= 7) return 'senior'
    return 'adult'
  } else { // cat
    if (ageInYears < 1) return 'kitten'
    if (ageInYears >= 8) return 'senior'
    return 'adult'
  }
}

/**
 * Get activity multiplier based on species and activity level
 */
export function getActivityMultiplier(
  activityLevel: string, 
  species: 'dog' | 'cat',
  ageCategory: AgeCategory
): number {
  const activityData = ENHANCED_ACTIVITY_LEVELS.find(level => level.value === activityLevel)
  
  if (!activityData) {
    // Default to moderate if not found
    const moderate = ENHANCED_ACTIVITY_LEVELS.find(level => level.value === 'moderate')!
    return species === 'dog' ? moderate.dogMultiplier : moderate.catMultiplier
  }
  
  let multiplier = species === 'dog' ? activityData.dogMultiplier : activityData.catMultiplier
  
  // Additional adjustments for age categories
  if (ageCategory === 'puppy' && activityLevel !== 'puppy') {
    multiplier *= 1.4 // Growing puppies need more energy
  } else if (ageCategory === 'kitten' && activityLevel !== 'kitten') {
    multiplier *= 1.6 // Growing kittens need even more energy
  } else if (ageCategory === 'senior') {
    multiplier *= 0.9 // Senior pets typically need less energy
  }
  
  return multiplier
}

/**
 * Get body condition score multiplier
 */
export function getBodyConditionMultiplier(score: BodyConditionScore): number {
  const bcData = BODY_CONDITION_SCORES.find(bc => bc.score === score)
  return bcData?.multiplier || 1.0
}

/**
 * Calculate special condition multipliers
 */
export function getSpecialConditionMultipliers(conditions: SpecialCondition[]): {
  totalMultiplier: number
  individual: { condition: SpecialCondition; multiplier: number }[]
} {
  let totalMultiplier = 1.0
  const individual: { condition: SpecialCondition; multiplier: number }[] = []
  
  for (const condition of conditions) {
    const conditionData = SPECIAL_CONDITIONS.find(sc => sc.value === condition)
    if (conditionData) {
      totalMultiplier *= conditionData.energyMultiplier
      individual.push({
        condition,
        multiplier: conditionData.energyMultiplier
      })
    }
  }
  
  return { totalMultiplier, individual }
}

/**
 * Calculate macro breakdown for raw feeding
 * Standard raw ratios: 80% muscle meat, 10% organ (5% liver, 5% other), 10% bone, 0-5% vegetables
 */
export function calculateMacroBreakdown(totalWeightGrams: number): MacroBreakdown {
  const totalWeightOz = totalWeightGrams * 0.035274
  
  // Standard raw feeding ratios
  const musclePercentage = 0.80
  const organPercentage = 0.10
  const bonePercentage = 0.10
  const vegetablePercentage = 0.00 // Optional, can be adjusted
  
  // Calculate weights
  const muscleWeightGrams = totalWeightGrams * musclePercentage
  const organWeightGrams = totalWeightGrams * organPercentage
  const boneWeightGrams = totalWeightGrams * bonePercentage
  const vegetableWeightGrams = totalWeightGrams * vegetablePercentage
  
  // Convert to ounces
  const muscleWeightOz = muscleWeightGrams * 0.035274
  const organWeightOz = organWeightGrams * 0.035274
  const boneWeightOz = boneWeightGrams * 0.035274
  const vegetableWeightOz = vegetableWeightGrams * 0.035274
  
  // Calculate calories (approximate)
  const muscleCalories = Math.round(muscleWeightOz * 35) // ~35 cal/oz muscle meat
  const organCalories = Math.round(organWeightOz * 40) // ~40 cal/oz organ meat
  const boneCalories = Math.round(boneWeightOz * 25) // ~25 cal/oz raw bone
  const vegetableCalories = Math.round(vegetableWeightOz * 10) // ~10 cal/oz vegetables
  
  return {
    muscleMeat: {
      percentage: musclePercentage * 100,
      weightOz: Math.round(muscleWeightOz * 100) / 100,
      weightGrams: Math.round(muscleWeightGrams),
      calories: muscleCalories
    },
    organMeat: {
      percentage: organPercentage * 100,
      weightOz: Math.round(organWeightOz * 100) / 100,
      weightGrams: Math.round(organWeightGrams),
      calories: organCalories,
      breakdown: {
        liver: Math.round(totalWeightGrams * 0.05), // 5% liver
        otherOrgans: Math.round(totalWeightGrams * 0.05) // 5% other organs
      }
    },
    rawBone: {
      percentage: bonePercentage * 100,
      weightOz: Math.round(boneWeightOz * 100) / 100,
      weightGrams: Math.round(boneWeightGrams),
      calories: boneCalories
    },
    vegetables: {
      percentage: vegetablePercentage * 100,
      weightOz: Math.round(vegetableWeightOz * 100) / 100,
      weightGrams: Math.round(vegetableWeightGrams),
      calories: vegetableCalories
    },
    supplements: {
      fishOil: true,
      vitaminE: true,
      probiotics: false,
      other: []
    }
  }
}

/**
 * Calculate meal breakdown based on age and total daily amount
 */
export function calculateMealBreakdown(
  totalWeightGrams: number,
  totalCalories: number,
  ageCategory: AgeCategory,
  macros: MacroBreakdown
): MealBreakdown {
  // Determine meals per day based on age
  let mealsPerDay: number
  let mealTimes: string[]
  
  if (ageCategory === 'puppy' || ageCategory === 'kitten') {
    mealsPerDay = 3
    mealTimes = ['07:00', '13:00', '19:00']
  } else if (ageCategory === 'senior') {
    mealsPerDay = 2
    mealTimes = ['08:00', '18:00']
  } else {
    mealsPerDay = 2
    mealTimes = ['07:00', '18:00']
  }
  
  // Calculate per-meal amounts
  const mealWeightGrams = totalWeightGrams / mealsPerDay
  const mealWeightOz = mealWeightGrams * 0.035274
  const mealCalories = totalCalories / mealsPerDay
  
  // Calculate per-meal macros
  const mealMacros = {
    muscleOz: macros.muscleMeat.weightOz / mealsPerDay,
    organOz: macros.organMeat.weightOz / mealsPerDay,
    boneOz: macros.rawBone.weightOz / mealsPerDay,
    vegetableOz: macros.vegetables.weightOz / mealsPerDay
  }
  
  // Create meals
  const meals = mealTimes.map((time, index) => ({
    name: index === 0 ? 'Breakfast' : index === 1 ? (mealsPerDay === 3 ? 'Lunch' : 'Dinner') : 'Dinner',
    time,
    weightOz: Math.round(mealWeightOz * 100) / 100,
    weightGrams: Math.round(mealWeightGrams),
    calories: Math.round(mealCalories),
    macros: {
      muscleOz: Math.round(mealMacros.muscleOz * 100) / 100,
      organOz: Math.round(mealMacros.organOz * 100) / 100,
      boneOz: Math.round(mealMacros.boneOz * 100) / 100,
      vegetableOz: Math.round(mealMacros.vegetableOz * 100) / 100
    }
  }))
  
  return {
    mealsPerDay,
    meals
  }
}

/**
 * Generate visual portion guides
 */
export function generateVisualPortionGuides(
  totalWeightOz: number,
  mealWeightOz: number,
  ageCategory: AgeCategory
): VisualPortionGuide {
  // Determine common object comparisons based on portion size
  let totalPortionObject: string
  let totalPortionVisual: string
  let mealPortionObject: string
  let mealPortionVisual: string
  
  // Total daily portion comparisons
  if (totalWeightOz < 2) {
    totalPortionObject = 'golf ball'
    totalPortionVisual = '⚪'
  } else if (totalWeightOz < 4) {
    totalPortionObject = 'tennis ball'
    totalPortionVisual = '🎾'
  } else if (totalWeightOz < 8) {
    totalPortionObject = 'baseball'
    totalPortionVisual = '⚾'
  } else if (totalWeightOz < 16) {
    totalPortionObject = 'softball'
    totalPortionVisual = '🥎'
  } else {
    totalPortionObject = 'large grapefruit'
    totalPortionVisual = '🍊'
  }
  
  // Individual meal comparisons
  if (mealWeightOz < 1) {
    mealPortionObject = 'large grape'
    mealPortionVisual = '🍇'
  } else if (mealWeightOz < 2) {
    mealPortionObject = 'golf ball'
    mealPortionVisual = '⚪'
  } else if (mealWeightOz < 4) {
    mealPortionObject = 'tennis ball'
    mealPortionVisual = '🎾'
  } else if (mealWeightOz < 8) {
    mealPortionObject = 'baseball'
    mealPortionVisual = '⚾'
  } else {
    mealPortionObject = 'softball'
    mealPortionVisual = '🥎'
  }
  
  // Calculate measuring tools
  const cups = Math.round((totalWeightOz / 8) * 100) / 100 // 8 oz = 1 cup
  const tablespoons = Math.round((mealWeightOz / 0.5) * 100) / 100 // 0.5 oz = 1 tablespoon
  
  return {
    totalDailyPortion: {
      commonObject: totalPortionObject,
      description: `About the size of a ${totalPortionObject}`,
      visual: totalPortionVisual
    },
    individualMeals: [
      {
        mealName: 'Each meal',
        commonObject: mealPortionObject,
        description: `About the size of a ${mealPortionObject}`,
        visual: mealPortionVisual
      }
    ],
    measuringTools: {
      cups: cups,
      tablespoons: tablespoons,
      kitchenScale: `${Math.round(totalWeightOz)} oz total daily`,
      feedingScale: `${Math.round(mealWeightOz)} oz per meal`
    },
    portionProgression: ageCategory === 'puppy' || ageCategory === 'kitten' ? [
      { age: '8-12 weeks', portionSize: '150% of adult portion', notes: 'Rapid growth phase' },
      { age: '3-6 months', portionSize: '125% of adult portion', notes: 'Continue growth support' },
      { age: '6-12 months', portionSize: '110% of adult portion', notes: 'Transitioning to adult needs' },
      { age: '12+ months', portionSize: '100% adult portion', notes: 'Full adult requirements' }
    ] : undefined
  }
}

/**
 * Generate recommendations based on inputs and results
 */
export function generateRecommendations(
  inputs: CalculatorInputs,
  result: Partial<CalculatorResult>
): CalculatorResult['recommendations'] {
  const recommendations: CalculatorResult['recommendations'] = []
  
  // Age-based recommendations
  if (inputs.ageCategory === 'puppy' || inputs.ageCategory === 'kitten') {
    recommendations.push({
      type: 'info',
      category: 'feeding',
      title: 'Growing Pet Nutrition',
      message: `${inputs.species === 'dog' ? 'Puppies' : 'Kittens'} need frequent meals (3x daily) and higher protein content for proper development.`,
      priority: 'high'
    })
    
    recommendations.push({
      type: 'success',
      category: 'monitoring',
      title: 'Growth Monitoring',
      message: 'Weigh weekly and adjust portions as your pet grows. Rapid growth phases may require increased portions.',
      priority: 'medium'
    })
  }
  
  // Body condition recommendations
  if (inputs.bodyConditionScore < 4) {
    recommendations.push({
      type: 'warning',
      category: 'health',
      title: 'Underweight Condition',
      message: 'Your pet appears underweight. Consider increasing portion sizes and consult your veterinarian.',
      priority: 'high'
    })
  } else if (inputs.bodyConditionScore > 6) {
    recommendations.push({
      type: 'warning',
      category: 'health',
      title: 'Overweight Condition',
      message: 'Your pet may be overweight. Consider reducing portions and increasing exercise.',
      priority: 'high'
    })
  }
  
  // Diet transition recommendations
  if (inputs.currentDietType !== 'raw' && inputs.isTransitioning) {
    recommendations.push({
      type: 'info',
      category: 'transition',
      title: 'Gradual Transition Required',
      message: 'Transition from kibble to raw food gradually over 7-10 days to avoid digestive upset.',
      priority: 'high'
    })
  }
  
  // Special condition recommendations
  if (inputs.specialConditions.includes('pregnant')) {
    recommendations.push({
      type: 'info',
      category: 'feeding',
      title: 'Pregnancy Nutrition',
      message: 'Pregnant pets need gradual increase in food throughout pregnancy. Free-choice feeding recommended in final weeks.',
      priority: 'high'
    })
  }
  
  if (inputs.specialConditions.includes('lactating')) {
    recommendations.push({
      type: 'info',
      category: 'feeding',
      title: 'Lactating Mother',
      message: 'Nursing mothers need 2-3x normal food intake. Provide high-quality protein and free-choice feeding.',
      priority: 'high'
    })
  }
  
  // Activity level recommendations
  const activityLevel = ENHANCED_ACTIVITY_LEVELS.find(a => a.value === inputs.activityLevel)
  if (activityLevel?.value === 'working') {
    recommendations.push({
      type: 'info',
      category: 'feeding',
      title: 'Working Pet Nutrition',
      message: 'Working pets may benefit from additional carbohydrates and more frequent feeding during intensive work periods.',
      priority: 'medium'
    })
  }
  
  // General feeding recommendations
  recommendations.push({
    type: 'success',
    category: 'feeding',
    title: 'Raw Feeding Success',
    message: 'Feed at room temperature, supervise bone consumption, and maintain proper food safety practices.',
    priority: 'medium'
  })
  
  recommendations.push({
    type: 'info',
    category: 'monitoring',
    title: 'Regular Monitoring',
    message: 'Monitor your pet\'s weight, body condition, and energy levels. Adjust portions as needed.',
    priority: 'low'
  })
  
  return recommendations
}

/**
 * Main calculation function that brings everything together
 */
export function calculatePortion(inputs: CalculatorInputs): CalculatorResult {
  // Convert weight to kg for calculations
  const weightKg = convertWeight(inputs.weight, inputs.weightUnit, 'kg')
  
  // Calculate RER
  const rer = calculateRER(weightKg)
  
  // Get activity multiplier
  const activityMultiplier = getActivityMultiplier(
    inputs.activityLevel,
    inputs.species,
    inputs.ageCategory
  )
  
  // Calculate base DER
  let der = rer * activityMultiplier
  
  // Apply body condition multiplier
  const bodyConditionMultiplier = getBodyConditionMultiplier(inputs.bodyConditionScore)
  
  // Apply special condition multipliers
  const { totalMultiplier: specialConditionMultiplier, individual: specialConditions } = 
    getSpecialConditionMultipliers(inputs.specialConditions)
  
  // Apply feeding goal multiplier
  let goalMultiplier = 1.0
  switch (inputs.feedingGoal) {
    case 'weight_loss':
      goalMultiplier = 0.8
      break
    case 'weight_gain':
      goalMultiplier = 1.2
      break
    case 'growth':
      goalMultiplier = 1.4
      break
    case 'performance':
      goalMultiplier = 1.3
      break
    case 'senior_support':
      goalMultiplier = 0.9
      break
    default:
      goalMultiplier = 1.0
  }
  
  // Calculate final DER with all adjustments
  const finalMultiplier = activityMultiplier * bodyConditionMultiplier * specialConditionMultiplier * goalMultiplier
  const adjustedDer = Math.round(rer * finalMultiplier)
  
  // Calculate daily food amounts
  // Assuming 4 calories per gram for raw food (average)
  const totalWeightGrams = Math.round(adjustedDer / 4)
  const totalWeightOz = Math.round((totalWeightGrams * 0.035274) * 100) / 100
  const totalWeightLbs = Math.round((totalWeightGrams * 0.00220462) * 100) / 100
  
  // Calculate macro breakdown
  const macroBreakdown = calculateMacroBreakdown(totalWeightGrams)
  
  // Calculate meal breakdown
  const mealBreakdown = calculateMealBreakdown(
    totalWeightGrams,
    adjustedDer,
    inputs.ageCategory,
    macroBreakdown
  )
  
  // Generate visual guides
  const visualGuides = generateVisualPortionGuides(
    totalWeightOz,
    totalWeightOz / mealBreakdown.mealsPerDay,
    inputs.ageCategory
  )
  
  // Create result object
  const result: CalculatorResult = {
    petInfo: {
      name: inputs.petName,
      species: inputs.species,
      weight: inputs.weight,
      weightUnit: inputs.weightUnit,
      age: inputs.age,
      ageCategory: inputs.ageCategory
    },
    energy: {
      rer,
      der: Math.round(der),
      adjustedDer
    },
    dailyTotals: {
      totalCalories: adjustedDer,
      totalWeightOz,
      totalWeightGrams,
      totalWeightLbs
    },
    macroBreakdown,
    mealBreakdown,
    visualGuides,
    adjustmentFactors: {
      baseMultiplier: 1.0,
      activityMultiplier,
      bodyConditionMultiplier,
      specialConditionMultipliers: specialConditions,
      environmentalMultipliers: [], // TODO: implement environmental factors
      goalMultiplier,
      finalMultiplier
    },
    recommendations: [],
    schedule: {
      recommended: true,
      frequency: `${mealBreakdown.mealsPerDay} times daily`,
      times: mealBreakdown.meals.map(meal => meal.time),
      notes: [
        'Feed at consistent times each day',
        'Allow 30 minutes for eating, then remove food',
        'Provide fresh water at all times'
      ]
    }
  }
  
  // Generate recommendations
  result.recommendations = generateRecommendations(inputs, result)
  
  // Add transition plan if needed
  if (inputs.currentDietType !== 'raw' && inputs.isTransitioning) {
    result.transitionPlan = {
      totalDays: 10,
      phases: [
        { days: '1-2', oldFoodPercentage: 75, newFoodPercentage: 25, notes: 'Start slowly with small amounts' },
        { days: '3-4', oldFoodPercentage: 50, newFoodPercentage: 50, notes: 'Monitor for digestive issues' },
        { days: '5-6', oldFoodPercentage: 25, newFoodPercentage: 75, notes: 'Most pets adapt well by now' },
        { days: '7-10', oldFoodPercentage: 0, newFoodPercentage: 100, notes: 'Complete transition to raw food' }
      ]
    }
  }
  
  return result
}

/**
 * Utility function to format weight display
 */
export function formatWeight(weight: number, unit: 'oz' | 'lbs' | 'g' | 'kg'): string {
  const rounded = Math.round(weight * 100) / 100
  return `${rounded} ${unit}`
}

/**
 * Utility function to format calories display
 */
export function formatCalories(calories: number): string {
  return `${Math.round(calories)} kcal`
}