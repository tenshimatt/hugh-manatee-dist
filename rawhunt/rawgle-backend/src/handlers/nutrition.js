/**
 * Nutrition Handler for Rawgle
 * Handles nutrition calculations, meal planning, and dietary analysis
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const nutritionCalculatorSchema = z.object({
  pet_id: z.string().uuid('Invalid pet ID'),
  target_weight_lbs: z.number().positive().optional(),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']).default('moderate'),
  life_stage: z.enum(['puppy', 'adult', 'senior']).default('adult'),
  body_condition: z.enum(['underweight', 'ideal', 'overweight', 'obese']).default('ideal'),
  feeding_method: z.enum(['raw', 'kibble', 'mixed']).default('raw'),
  include_bones: z.boolean().default(true),
  include_organs: z.boolean().default(true)
});

const mealPlanSchema = z.object({
  pet_id: z.string().uuid('Invalid pet ID'),
  duration_days: z.number().int().min(1).max(30).default(7),
  meal_preferences: z.object({
    proteins: z.array(z.string()).default(['chicken', 'beef', 'fish']),
    avoid_proteins: z.array(z.string()).default([]),
    include_variety: z.boolean().default(true),
    budget_per_day: z.number().positive().optional()
  }).optional()
});

// POST /api/nutrition/calculator - Calculate nutrition requirements
app.post('/calculator', validateRequest(nutritionCalculatorSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.get('validatedData');
    
    // Verify pet ownership
    const pet = await c.env.DB
      .prepare(`
        SELECT id, name, species, breed, birth_date, weight_lbs, gender,
               feeding_type, activity_level, allergies, dietary_restrictions
        FROM pets 
        WHERE id = ? AND user_id = ? AND active = 1
      `)
      .bind(data.pet_id, user.id)
      .first();
    
    if (!pet) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    const weight = data.target_weight_lbs || pet.weight_lbs;
    if (!weight) {
      return c.json({
        success: false,
        error: 'WEIGHT_REQUIRED',
        message: 'Pet weight is required for nutrition calculations'
      }, 400);
    }
    
    // Calculate basic metabolic requirements
    const calculations = calculateNutritionRequirements({
      weight_lbs: weight,
      activity_level: data.activity_level || pet.activity_level || 'moderate',
      life_stage: data.life_stage,
      body_condition: data.body_condition,
      feeding_method: data.feeding_method,
      species: pet.species,
      breed: pet.breed
    });
    
    // Raw feeding specific calculations
    if (data.feeding_method === 'raw') {
      calculations.raw_feeding = calculateRawFeedingRequirements(calculations, {
        include_bones: data.include_bones,
        include_organs: data.include_organs,
        weight_lbs: weight
      });
    }
    
    // Consider allergies and restrictions
    const allergies = JSON.parse(pet.allergies || '[]');
    const restrictions = JSON.parse(pet.dietary_restrictions || '[]');
    
    if (allergies.length > 0 || restrictions.length > 0) {
      calculations.dietary_considerations = {
        allergies,
        restrictions,
        recommended_proteins: getRecommendedProteins(allergies, restrictions),
        proteins_to_avoid: getAllergicProteins(allergies, restrictions)
      };
    }
    
    return c.json({
      success: true,
      data: {
        pet: {
          id: pet.id,
          name: pet.name,
          weight_lbs: weight,
          species: pet.species
        },
        calculations
      }
    });
  } catch (error) {
    console.error('Nutrition calculator error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'CALCULATION_FAILED',
      message: 'Failed to calculate nutrition requirements'
    }, 500);
  }
});

// POST /api/nutrition/meal-plan - Generate meal plan
app.post('/meal-plan', validateRequest(mealPlanSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.get('validatedData');
    
    // Verify pet ownership and get nutrition requirements
    const pet = await c.env.DB
      .prepare(`
        SELECT id, name, species, breed, birth_date, weight_lbs, 
               feeding_type, activity_level, allergies, dietary_restrictions,
               target_daily_calories
        FROM pets 
        WHERE id = ? AND user_id = ? AND active = 1
      `)
      .bind(data.pet_id, user.id)
      .first();
    
    if (!pet) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    if (!pet.weight_lbs) {
      return c.json({
        success: false,
        error: 'WEIGHT_REQUIRED',
        message: 'Pet weight is required for meal planning'
      }, 400);
    }
    
    // Calculate daily requirements
    const nutritionReqs = calculateNutritionRequirements({
      weight_lbs: pet.weight_lbs,
      activity_level: pet.activity_level || 'moderate',
      life_stage: 'adult',
      body_condition: 'ideal',
      feeding_method: 'raw',
      species: pet.species
    });
    
    // Generate meal plan
    const allergies = JSON.parse(pet.allergies || '[]');
    const restrictions = JSON.parse(pet.dietary_restrictions || '[]');
    const preferences = data.meal_preferences || {};
    
    const mealPlan = await generateMealPlan({
      duration_days: data.duration_days,
      daily_requirements: nutritionReqs,
      preferences: {
        proteins: preferences.proteins || ['chicken', 'beef', 'fish'],
        avoid_proteins: [...allergies, ...(preferences.avoid_proteins || [])],
        include_variety: preferences.include_variety !== false,
        budget_per_day: preferences.budget_per_day
      },
      pet: {
        species: pet.species,
        weight_lbs: pet.weight_lbs
      }
    });
    
    return c.json({
      success: true,
      data: {
        pet: {
          id: pet.id,
          name: pet.name,
          weight_lbs: pet.weight_lbs
        },
        meal_plan: mealPlan,
        duration_days: data.duration_days,
        daily_requirements: nutritionReqs
      }
    });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'MEAL_PLAN_FAILED',
      message: 'Failed to generate meal plan'
    }, 500);
  }
});

// GET /api/nutrition/analysis/:petId - Get feeding analysis for pet
app.get('/analysis/:petId', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('petId');
    const query = c.req.query();
    const { period = 'week', include_recommendations = 'true' } = query;
    
    // Verify pet ownership
    const pet = await c.env.DB
      .prepare('SELECT user_id, name, weight_lbs FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!pet || pet.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    // Get feeding logs for analysis period
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const feedingLogs = await c.env.DB
      .prepare(`
        SELECT feeding_date, meal_type, food_type, protein_source,
               amount_oz, amount_grams, calories_estimated,
               protein_grams, fat_grams, carb_grams, calcium_mg, phosphorus_mg,
               appetite_rating, energy_level_after
        FROM feeding_logs
        WHERE pet_id = ? AND feeding_date >= ?
        ORDER BY feeding_date DESC
      `)
      .bind(petId, startDate.toISOString().split('T')[0])
      .all();
    
    const logs = feedingLogs.results || [];
    
    // Calculate nutritional analysis
    const analysis = analyzeNutrition(logs, {
      pet_weight_lbs: pet.weight_lbs,
      period_days: days
    });
    
    let recommendations = null;
    if (include_recommendations === 'true') {
      recommendations = generateNutritionRecommendations(analysis, {
        pet_weight_lbs: pet.weight_lbs,
        feeding_consistency: logs.length / days
      });
    }
    
    return c.json({
      success: true,
      data: {
        pet_id: petId,
        pet_name: pet.name,
        period,
        analysis_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          total_logs: logs.length
        },
        nutrition_analysis: analysis,
        recommendations
      }
    });
  } catch (error) {
    console.error('Nutrition analysis error:', error);
    return c.json({
      success: false,
      error: 'ANALYSIS_FAILED',
      message: 'Failed to analyze nutrition data'
    }, 500);
  }
});

// GET /api/nutrition/guidelines - Get feeding guidelines
app.get('/guidelines', async (c) => {
  try {
    const query = c.req.query();
    const { species = 'dog', category = 'all' } = query;
    
    const guidelines = {
      general: {
        raw_feeding_basics: [
          "Feed 2-3% of body weight for adult dogs, 2-4% for puppies",
          "Include 80% muscle meat, 10% bone, 10% organs (5% liver)",
          "Introduce new proteins gradually over 7-10 days",
          "Monitor stool quality and energy levels"
        ],
        protein_rotation: [
          "Rotate proteins weekly to ensure nutritional variety",
          "Common proteins: chicken, beef, fish, lamb, turkey",
          "Exotic proteins: venison, duck, rabbit (for variety or allergies)",
          "Always source from reputable suppliers"
        ]
      },
      portion_guidelines: species === 'dog' ? getDogPortionGuidelines() : getCatPortionGuidelines(),
      nutrition_targets: getNutritionTargets(species),
      safety_tips: [
        "Never feed cooked bones - only raw bones are safe",
        "Avoid toxic foods: onions, garlic, grapes, chocolate",
        "Wash hands and surfaces after handling raw food",
        "Store raw food at proper temperatures",
        "Transition gradually from kibble to raw over 10-14 days"
      ]
    };
    
    // Filter by category if specified
    if (category !== 'all' && guidelines[category]) {
      return c.json({
        success: true,
        data: {
          category,
          species,
          guidelines: { [category]: guidelines[category] }
        }
      });
    }
    
    return c.json({
      success: true,
      data: {
        species,
        guidelines
      }
    });
  } catch (error) {
    console.error('Get nutrition guidelines error:', error);
    return c.json({
      success: false,
      error: 'GUIDELINES_FETCH_FAILED',
      message: 'Failed to retrieve nutrition guidelines'
    }, 500);
  }
});

// Helper functions
function calculateNutritionRequirements(data) {
  const { weight_lbs, activity_level, life_stage, body_condition } = data;
  
  // Basic calorie calculation (simplified)
  let baseCalories = Math.round(70 * Math.pow(weight_lbs / 2.2, 0.75)); // Convert to kg for formula
  
  // Activity multipliers
  const activityMultipliers = {
    low: 1.2,
    moderate: 1.4,
    high: 1.6,
    very_high: 1.8
  };
  
  // Life stage multipliers
  const lifeStageMultipliers = {
    puppy: 2.0,
    adult: 1.0,
    senior: 0.8
  };
  
  // Body condition multipliers
  const bodyConditionMultipliers = {
    underweight: 1.2,
    ideal: 1.0,
    overweight: 0.8,
    obese: 0.6
  };
  
  const dailyCalories = Math.round(
    baseCalories * 
    activityMultipliers[activity_level] * 
    lifeStageMultipliers[life_stage] * 
    bodyConditionMultipliers[body_condition]
  );
  
  return {
    daily_calories: dailyCalories,
    daily_food_oz: Math.round((weight_lbs * 0.025) * 16), // 2.5% of body weight in oz
    daily_food_grams: Math.round(weight_lbs * 0.025 * 453.592), // Convert to grams
    meals_per_day: weight_lbs < 20 ? 3 : 2,
    macronutrients: {
      protein_grams: Math.round(dailyCalories * 0.25 / 4), // 25% of calories from protein
      fat_grams: Math.round(dailyCalories * 0.15 / 9), // 15% of calories from fat
      carb_grams: Math.round(dailyCalories * 0.05 / 4) // 5% of calories from carbs (minimal for raw)
    }
  };
}

function calculateRawFeedingRequirements(baseCalcs, options) {
  const { weight_lbs, include_bones, include_organs } = options;
  const totalDaily = baseCalcs.daily_food_grams;
  
  const breakdown = {
    muscle_meat_grams: Math.round(totalDaily * 0.8), // 80%
    organ_meat_grams: include_organs ? Math.round(totalDaily * 0.1) : 0, // 10%
    bone_content_grams: include_bones ? Math.round(totalDaily * 0.1) : 0, // 10%
    liver_grams: include_organs ? Math.round(totalDaily * 0.05) : 0, // 5%
    other_organs_grams: include_organs ? Math.round(totalDaily * 0.05) : 0 // 5%
  };
  
  if (!include_bones) {
    breakdown.muscle_meat_grams += breakdown.bone_content_grams;
  }
  
  if (!include_organs) {
    breakdown.muscle_meat_grams += breakdown.organ_meat_grams;
  }
  
  return {
    breakdown,
    weekly_totals: {
      muscle_meat_lbs: Math.round((breakdown.muscle_meat_grams * 7 / 453.592) * 10) / 10,
      organ_meat_lbs: Math.round((breakdown.organ_meat_grams * 7 / 453.592) * 10) / 10,
      bone_content_lbs: Math.round((breakdown.bone_content_grams * 7 / 453.592) * 10) / 10
    }
  };
}

function getRecommendedProteins(allergies, restrictions) {
  const allProteins = ['chicken', 'beef', 'fish', 'lamb', 'turkey', 'duck', 'venison', 'rabbit'];
  const avoid = [...allergies, ...restrictions];
  return allProteins.filter(protein => !avoid.includes(protein));
}

function getAllergicProteins(allergies, restrictions) {
  return [...new Set([...allergies, ...restrictions])];
}

async function generateMealPlan(options) {
  const { duration_days, daily_requirements, preferences, pet } = options;
  
  const plan = {
    duration_days,
    daily_calories: daily_requirements.daily_calories,
    daily_food_grams: daily_requirements.daily_food_grams,
    meals: []
  };
  
  const availableProteins = preferences.proteins.filter(
    p => !preferences.avoid_proteins.includes(p)
  );
  
  for (let day = 1; day <= duration_days; day++) {
    const dayMeals = [];
    const mealsPerDay = daily_requirements.meals_per_day || 2;
    const mealSize = daily_requirements.daily_food_grams / mealsPerDay;
    
    for (let meal = 1; meal <= mealsPerDay; meal++) {
      const protein = availableProteins[Math.floor(Math.random() * availableProteins.length)];
      const mealType = meal === 1 ? 'breakfast' : meal === 2 ? 'dinner' : 'lunch';
      
      dayMeals.push({
        meal_number: meal,
        meal_type: mealType,
        protein_source: protein,
        total_grams: Math.round(mealSize),
        muscle_meat_grams: Math.round(mealSize * 0.8),
        organ_meat_grams: Math.round(mealSize * 0.1),
        bone_content_grams: Math.round(mealSize * 0.1),
        estimated_calories: Math.round(daily_requirements.daily_calories / mealsPerDay)
      });
    }
    
    plan.meals.push({
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      meals: dayMeals
    });
  }
  
  return plan;
}

function analyzeNutrition(feedingLogs, options) {
  const { pet_weight_lbs, period_days } = options;
  
  if (feedingLogs.length === 0) {
    return {
      summary: 'No feeding data available for analysis',
      average_daily_calories: 0,
      average_daily_grams: 0,
      protein_variety: [],
      feeding_consistency: 0
    };
  }
  
  const totalCalories = feedingLogs.reduce((sum, log) => sum + (log.calories_estimated || 0), 0);
  const totalGrams = feedingLogs.reduce((sum, log) => sum + (log.amount_grams || 0), 0);
  const proteinSources = [...new Set(feedingLogs.map(log => log.protein_source).filter(Boolean))];
  
  const analysis = {
    feeding_consistency: Math.round((feedingLogs.length / period_days) * 100) / 100,
    average_daily_calories: Math.round(totalCalories / period_days),
    average_daily_grams: Math.round(totalGrams / period_days),
    protein_variety: proteinSources,
    meal_distribution: getMealDistribution(feedingLogs),
    appetite_trends: getAppetiteTrends(feedingLogs),
    nutritional_balance: getNutritionalBalance(feedingLogs, pet_weight_lbs)
  };
  
  return analysis;
}

function generateNutritionRecommendations(analysis, options) {
  const recommendations = [];
  
  if (analysis.feeding_consistency < 1) {
    recommendations.push({
      type: 'consistency',
      priority: 'high',
      message: 'Try to maintain more consistent daily feeding logs for better tracking'
    });
  }
  
  if (analysis.protein_variety.length < 3) {
    recommendations.push({
      type: 'variety',
      priority: 'medium',
      message: 'Consider adding more protein variety to ensure balanced nutrition'
    });
  }
  
  if (analysis.average_daily_calories < options.pet_weight_lbs * 25) {
    recommendations.push({
      type: 'calories',
      priority: 'high',
      message: 'Daily calorie intake may be too low for your pet\'s weight'
    });
  }
  
  return recommendations;
}

function getMealDistribution(logs) {
  const distribution = {};
  logs.forEach(log => {
    distribution[log.meal_type] = (distribution[log.meal_type] || 0) + 1;
  });
  return distribution;
}

function getAppetiteTrends(logs) {
  const appetiteRatings = logs.filter(log => log.appetite_rating).map(log => log.appetite_rating);
  if (appetiteRatings.length === 0) return { average: null, trend: 'insufficient_data' };
  
  const average = appetiteRatings.reduce((sum, rating) => sum + rating, 0) / appetiteRatings.length;
  return {
    average: Math.round(average * 10) / 10,
    trend: average >= 4 ? 'excellent' : average >= 3 ? 'good' : 'needs_attention'
  };
}

function getNutritionalBalance(logs, petWeight) {
  // Simplified nutritional balance calculation
  const hasProtein = logs.some(log => log.protein_grams > 0);
  const hasFat = logs.some(log => log.fat_grams > 0);
  const hasCalcium = logs.some(log => log.calcium_mg > 0);
  
  return {
    protein_tracked: hasProtein,
    fat_tracked: hasFat,
    minerals_tracked: hasCalcium,
    balance_score: hasProtein && hasFat && hasCalcium ? 'good' : 'incomplete_data'
  };
}

function getDogPortionGuidelines() {
  return {
    puppy: "2-4% of body weight, split into 3-4 meals",
    adult: "2-3% of body weight, split into 2 meals", 
    senior: "1.5-2.5% of body weight, split into 2 meals",
    active: "3-4% of body weight for highly active dogs",
    weight_loss: "1.5-2% of target weight"
  };
}

function getCatPortionGuidelines() {
  return {
    kitten: "3-5% of body weight, split into 3-4 meals",
    adult: "2-4% of body weight, split into 2-3 meals",
    senior: "2-3% of body weight, split into 2-3 meals"
  };
}

function getNutritionTargets(species) {
  if (species === 'cat') {
    return {
      protein: "50-60% of calories",
      fat: "20-30% of calories", 
      carbohydrates: "Less than 10% of calories",
      taurine: "Essential amino acid for cats"
    };
  }
  
  return {
    protein: "22-25% of calories for adults, 28-30% for puppies",
    fat: "12-15% of calories for adults, 15-18% for puppies",
    carbohydrates: "Minimal in raw diets",
    calcium_phosphorus_ratio: "1.2:1 to 1.8:1"
  };
}

export default app;