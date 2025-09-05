'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, 
  Brain, 
  Zap, 
  Target,
  Scale,
  Activity,
  Clock,
  ChefHat,
  ArrowRight,
  Info,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Settings,
  Download,
  Share,
  Heart,
  Utensils,
  PieChart
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { 
  CalculatorInputs, 
  CalculatorResult,
  ENHANCED_ACTIVITY_LEVELS,
  BODY_CONDITION_SCORES,
  SPECIAL_CONDITIONS,
  BodyConditionScore,
  SpecialCondition,
  FeedingGoal
} from '@/types/portion-calculator'

import { 
  calculatePortion, 
  convertWeight, 
  determineAgeCategory,
  formatWeight,
  formatCalories
} from '@/lib/portion-calculator'

import { PetProfile } from '@/types/pet'

interface EnhancedPortionCalculatorProps {
  pets?: PetProfile[]
  selectedPetId?: string
  onPetSelect?: (petId: string) => void
  onAddPet?: () => void
  className?: string
}

export default function EnhancedPortionCalculator({
  pets = [],
  selectedPetId,
  onPetSelect,
  onAddPet,
  className
}: EnhancedPortionCalculatorProps) {
  
  // Calculator state
  const [inputs, setInputs] = useState<CalculatorInputs>({
    petName: '',
    species: 'dog',
    weight: 25,
    weightUnit: 'lbs',
    age: 3,
    ageCategory: 'adult',
    activityLevel: 'moderate',
    bodyConditionScore: 5 as BodyConditionScore,
    feedingGoal: 'maintenance' as FeedingGoal,
    specialConditions: [],
    environmentalFactors: [],
    currentDietType: 'kibble',
    isTransitioning: true,
    hasHealthConditions: false,
    healthNotes: ''
  })
  
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [adjustments, setAdjustments] = useState({
    muscleAdjustment: 0,
    organAdjustment: 0,
    boneAdjustment: 0,
    vegetableAdjustment: 0,
    portionAdjustment: 0
  })

  // Helper function to calculate age from birthdate
  function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate)
    const today = new Date()
    const years = (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return Math.round(years * 10) / 10 // Round to 1 decimal place
  }

  // Apply macro adjustments to the breakdown
  const applyMacroAdjustments = useCallback((macros: any, adjs: typeof adjustments) => {
    const adjusted = { ...macros }
    
    if (adjs.muscleAdjustment !== 0) {
      const multiplier = 1 + (adjs.muscleAdjustment / 100)
      adjusted.muscleMeat.weightOz *= multiplier
      adjusted.muscleMeat.weightGrams *= multiplier
      adjusted.muscleMeat.calories *= multiplier
    }
    
    // Apply similar logic for other macros...
    return adjusted
  }, [])

  // Calculate portion with current inputs
  const handleCalculate = useCallback(() => {
    if (!inputs.petName || inputs.weight <= 0) return
    
    setIsCalculating(true)
    
    setTimeout(() => {
      try {
        const calculationResult = calculatePortion(inputs)
        
        // Apply user adjustments
        if (Object.values(adjustments).some(adj => adj !== 0)) {
          calculationResult.macroBreakdown = applyMacroAdjustments(
            calculationResult.macroBreakdown,
            adjustments
          )
          
          if (adjustments.portionAdjustment !== 0) {
            const multiplier = 1 + (adjustments.portionAdjustment / 100)
            calculationResult.dailyTotals.totalWeightOz *= multiplier
            calculationResult.dailyTotals.totalWeightGrams *= multiplier
            calculationResult.dailyTotals.totalCalories *= multiplier
          }
        }
        
        setResult(calculationResult)
      } catch (error) {
        console.error('Calculation error:', error)
      } finally {
        setIsCalculating(false)
      }
    }, 1000)
  }, [inputs, adjustments, applyMacroAdjustments])

  // Load pet data when selected
  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      const selectedPet = pets.find(pet => pet.id === selectedPetId)
      if (selectedPet) {
        setInputs(prev => ({
          ...prev,
          petId: selectedPet.id,
          petName: selectedPet.name,
          species: selectedPet.species,
          weight: selectedPet.weight,
          weightUnit: selectedPet.weight_unit,
          age: calculateAge(selectedPet.birthdate),
          ageCategory: determineAgeCategory(selectedPet.species, calculateAge(selectedPet.birthdate)),
          activityLevel: selectedPet.activity_level,
          specialConditions: selectedPet.spayed_neutered ? ['spayed_neutered'] : []
        }))
      }
    }
  }, [selectedPetId, pets])

  // Auto-calculate when inputs change
  useEffect(() => {
    if (inputs.petName && inputs.weight > 0) {
      const timeoutId = setTimeout(() => {
        handleCalculate()
      }, 500) // Debounce calculations
      
      return () => clearTimeout(timeoutId)
    }
  }, [inputs, handleCalculate])

  // Handle special condition toggle
  const toggleSpecialCondition = (condition: SpecialCondition) => {
    setInputs(prev => ({
      ...prev,
      specialConditions: prev.specialConditions.includes(condition)
        ? prev.specialConditions.filter(c => c !== condition)
        : [...prev.specialConditions, condition]
    }))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Portion Calculator</h1>
            <p className="text-muted-foreground">
              Get precise raw feeding recommendations with real-time calculations
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Pet Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Pet</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddPet}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </div>
            
            {pets.length > 0 ? (
              <Select value={selectedPetId} onValueChange={onPetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pet..." />
                </SelectTrigger>
                <SelectContent>
                  {pets.map(pet => (
                    <SelectItem key={pet.id} value={pet.id}>
                      <div className="flex items-center gap-2">
                        <span>{pet.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pet.species}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground mb-2">No pets found</p>
                <Button onClick={onAddPet}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Pet
                </Button>
              </div>
            )}
          </Card>

          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="petName">Pet Name</Label>
                <Input
                  id="petName"
                  value={inputs.petName}
                  onChange={(e) => setInputs(prev => ({ ...prev, petName: e.target.value }))}
                  placeholder="Enter pet name"
                />
              </div>

              <div>
                <Label>Species</Label>
                <Select 
                  value={inputs.species} 
                  onValueChange={(value: 'dog' | 'cat') => 
                    setInputs(prev => ({ ...prev, species: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={inputs.weight}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      weight: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select 
                    value={inputs.weightUnit}
                    onValueChange={(value: 'lbs' | 'kg') => 
                      setInputs(prev => ({ ...prev, weightUnit: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  step="0.1"
                  value={inputs.age}
                  onChange={(e) => {
                    const age = parseFloat(e.target.value) || 0
                    setInputs(prev => ({ 
                      ...prev, 
                      age,
                      ageCategory: determineAgeCategory(prev.species, age)
                    }))
                  }}
                />
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {inputs.ageCategory}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity & Lifestyle */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Activity & Lifestyle</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Activity Level</Label>
                <Select 
                  value={inputs.activityLevel}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, activityLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENHANCED_ACTIVITY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Body Condition Score</Label>
                <div className="space-y-2">
                  <Slider
                    value={[inputs.bodyConditionScore]}
                    onValueChange={(value) => setInputs(prev => ({ 
                      ...prev, 
                      bodyConditionScore: value[0] as BodyConditionScore 
                    }))}
                    min={1}
                    max={9}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Thin</span>
                    <span className="font-medium">
                      {inputs.bodyConditionScore} - {BODY_CONDITION_SCORES.find(s => s.score === inputs.bodyConditionScore)?.label}
                    </span>
                    <span>Obese</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Feeding Goal</Label>
                <Select 
                  value={inputs.feedingGoal}
                  onValueChange={(value: FeedingGoal) => 
                    setInputs(prev => ({ ...prev, feedingGoal: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Weight Maintenance</SelectItem>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="weight_gain">Weight Gain</SelectItem>
                    <SelectItem value="growth">Growth Support</SelectItem>
                    <SelectItem value="performance">Performance/Working</SelectItem>
                    <SelectItem value="senior_support">Senior Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Special Conditions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Special Conditions</h2>
            
            <div className="space-y-3">
              {SPECIAL_CONDITIONS.slice(0, 6).map(condition => (
                <div key={condition.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition.value}
                    checked={inputs.specialConditions.includes(condition.value)}
                    onCheckedChange={() => toggleSpecialCondition(condition.value)}
                  />
                  <Label 
                    htmlFor={condition.value} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {condition.label}
                  </Label>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTransitioning"
                  checked={inputs.isTransitioning}
                  onCheckedChange={(checked) => 
                    setInputs(prev => ({ ...prev, isTransitioning: !!checked }))
                  }
                />
                <Label htmlFor="isTransitioning">Transitioning to raw food</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasHealthConditions"
                  checked={inputs.hasHealthConditions}
                  onCheckedChange={(checked) => 
                    setInputs(prev => ({ ...prev, hasHealthConditions: !!checked }))
                  }
                />
                <Label htmlFor="hasHealthConditions">Has health conditions</Label>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Daily Requirements */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  Daily Feeding Requirements
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatWeight(result.dailyTotals.totalWeightOz, 'oz')}
                    </div>
                    <div className="text-sm text-blue-700">Total Food</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCalories(result.dailyTotals.totalCalories)}
                    </div>
                    <div className="text-sm text-green-700">Daily Calories</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {result.mealBreakdown.mealsPerDay}x
                    </div>
                    <div className="text-sm text-purple-700">Meals Per Day</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatWeight(result.dailyTotals.totalWeightOz / result.mealBreakdown.mealsPerDay, 'oz')}
                    </div>
                    <div className="text-sm text-orange-700">Per Meal</div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">Energy Calculations</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Resting Energy:</span>
                      <div className="font-medium">{result.energy.rer} kcal</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Daily Energy:</span>
                      <div className="font-medium">{result.energy.der} kcal</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adjusted:</span>
                      <div className="font-medium">{result.energy.adjustedDer} kcal</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Macro Breakdown with Charts */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-orange-500" />
                  Raw Feeding Breakdown
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {formatWeight(result.macroBreakdown.muscleMeat.weightOz, 'oz')}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Muscle Meat</div>
                    <div className="text-xs text-muted-foreground">
                      {result.macroBreakdown.muscleMeat.percentage}%
                    </div>
                    <Progress 
                      value={result.macroBreakdown.muscleMeat.percentage} 
                      className="mt-2 h-2"
                    />
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {formatWeight(result.macroBreakdown.organMeat.weightOz, 'oz')}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Organ Meat</div>
                    <div className="text-xs text-muted-foreground">
                      {result.macroBreakdown.organMeat.percentage}%
                    </div>
                    <Progress 
                      value={result.macroBreakdown.organMeat.percentage} 
                      className="mt-2 h-2"
                    />
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatWeight(result.macroBreakdown.rawBone.weightOz, 'oz')}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Raw Bone</div>
                    <div className="text-xs text-muted-foreground">
                      {result.macroBreakdown.rawBone.percentage}%
                    </div>
                    <Progress 
                      value={result.macroBreakdown.rawBone.percentage} 
                      className="mt-2 h-2"
                    />
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatWeight(result.macroBreakdown.vegetables.weightOz, 'oz')}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Vegetables</div>
                    <div className="text-xs text-muted-foreground">
                      {result.macroBreakdown.vegetables.percentage}%
                    </div>
                    <Progress 
                      value={result.macroBreakdown.vegetables.percentage} 
                      className="mt-2 h-2"
                    />
                  </div>
                </div>
              </Card>

              {/* Meal Schedule */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Feeding Schedule
                </h2>
                
                <div className="space-y-4">
                  {result.mealBreakdown.meals.map((meal, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Utensils className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-sm text-muted-foreground">{meal.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatWeight(meal.weightOz, 'oz')}</div>
                        <div className="text-sm text-muted-foreground">{meal.calories} kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Visual Portion Guides */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-purple-500" />
                  Visual Portion Guide
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-4xl mb-2">{result.visualGuides.totalDailyPortion.visual}</div>
                    <div className="font-medium">Total Daily Food</div>
                    <div className="text-sm text-muted-foreground">
                      {result.visualGuides.totalDailyPortion.description}
                    </div>
                  </div>
                  
                  {result.visualGuides.individualMeals.map((meal, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <div className="text-4xl mb-2">{meal.visual}</div>
                      <div className="font-medium">{meal.mealName}</div>
                      <div className="text-sm text-muted-foreground">
                        {meal.description}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Measuring Tools</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Kitchen Scale: {result.visualGuides.measuringTools.kitchenScale}</div>
                    <div>Measuring Cups: {result.visualGuides.measuringTools.cups} cups</div>
                  </div>
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-500" />
                  AI Recommendations
                </h2>
                
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className={`flex items-start p-4 rounded-lg ${
                      rec.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                      rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      rec.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      {rec.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />}
                      {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />}
                      {rec.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />}
                      {rec.type === 'info' && <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />}
                      <div>
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-sm text-muted-foreground">{rec.message}</div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {rec.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1" size="lg">
                  <Heart className="mr-2 h-4 w-4" />
                  Save to Pet Profile
                </Button>
                <Button variant="outline" className="flex-1" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
                <Button variant="outline" className="flex-1" size="lg">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Create Meal Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mb-8">
                {isCalculating ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
                    <h3 className="text-xl font-semibold">Calculating Portions...</h3>
                    <p className="text-muted-foreground">
                      Analyzing your pet&apos;s needs with AI precision
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Calculator className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h3 className="text-xl font-semibold">Ready to Calculate</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select a pet or enter information to get personalized feeding recommendations 
                      with real-time AI calculations.
                    </p>
                  </div>
                )}
              </div>
              
              {!isCalculating && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-muted rounded-lg">
                    <Scale className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="font-medium">Precise Portions</div>
                    <div className="text-muted-foreground">Industry-standard RER formulas</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="font-medium">Health Optimized</div>
                    <div className="text-muted-foreground">Considers all health factors</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="font-medium">AI-Powered</div>
                    <div className="text-muted-foreground">Real-time intelligent recommendations</div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}