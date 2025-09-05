'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { 
  CalendarDays,
  Clock,
  Scale,
  ChefHat,
  StickyNote,
  Camera,
  Save,
  RotateCcw,
  Zap
} from 'lucide-react'

import {
  FeedingFormData,
  feedingEntrySchema,
  MEAL_TYPES,
  PROTEIN_CATEGORIES,
  WEIGHT_UNITS,
  QUICK_ACTIONS,
  calculateCalories,
  getMealTypeByTime,
  formatFeedingTime,
  type MealType,
  type ProteinCategory,
  type WeightUnit
} from '@/types/feeding'
import { PetProfile } from '@/types/pet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface FeedingEntryFormProps {
  pets: PetProfile[]
  selectedPetId?: string
  initialDate?: string
  onSubmit: (data: FeedingFormData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function FeedingEntryForm({
  pets,
  selectedPetId,
  initialDate,
  onSubmit,
  onCancel,
  isSubmitting = false
}: FeedingEntryFormProps) {
  const [selectedProteinCategory, setSelectedProteinCategory] = useState<ProteinCategory>('muscle_meat')
  const [estimatedCalories, setEstimatedCalories] = useState<number>(0)
  const [customProteinSource, setCustomProteinSource] = useState('')

  // Get current time for default
  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // Get today's date for default
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const form = useForm<FeedingFormData>({
    resolver: zodResolver(feedingEntrySchema),
    defaultValues: {
      petId: selectedPetId || '',
      date: initialDate || getTodayDate(),
      mealType: getMealTypeByTime(getCurrentTime()),
      feedingTime: getCurrentTime(),
      weightAmount: 0,
      weightUnit: 'oz',
      proteinSource: '',
      proteinCategory: 'muscle_meat',
      notes: '',
      status: 'upcoming'
    }
  })

  const watchedValues = form.watch()

  // Update estimated calories when relevant fields change
  useEffect(() => {
    if (watchedValues.weightAmount && watchedValues.weightUnit && watchedValues.proteinCategory) {
      const calories = calculateCalories(
        watchedValues.weightAmount,
        watchedValues.weightUnit,
        watchedValues.proteinCategory
      )
      setEstimatedCalories(calories)
      form.setValue('caloriesEstimated', calories)
    }
  }, [watchedValues.weightAmount, watchedValues.weightUnit, watchedValues.proteinCategory, form])

  // Get available protein sources for selected category
  const getProteinSources = () => {
    const category = PROTEIN_CATEGORIES.find(cat => cat.value === selectedProteinCategory)
    return category?.commonSources || []
  }

  // Handle meal time suggestions based on meal type
  const getSuggestedTime = (mealType: MealType) => {
    const mealTypeData = MEAL_TYPES.find(meal => meal.value === mealType)
    return mealTypeData?.suggestedTimes[0] || getCurrentTime()
  }

  // Handle meal type change
  const handleMealTypeChange = (mealType: MealType) => {
    const suggestedTime = getSuggestedTime(mealType)
    form.setValue('mealType', mealType)
    form.setValue('feedingTime', suggestedTime)
  }

  // Handle protein category change
  const handleProteinCategoryChange = (category: ProteinCategory) => {
    setSelectedProteinCategory(category)
    form.setValue('proteinCategory', category)
    // Clear protein source when category changes
    form.setValue('proteinSource', '')
    setCustomProteinSource('')
  }

  // Handle form submission
  const handleSubmit = async (data: FeedingFormData) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Error submitting feeding entry:', error)
    }
  }

  // Quick action handlers
  const handleRepeatYesterday = () => {
    // This would be implemented to fetch yesterday's meals for the selected pet
    console.log('Repeat yesterday functionality would be implemented here')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Log Feeding</h2>
            <p className="text-muted-foreground">
              Record your pet&apos;s meal details
            </p>
          </div>
          {estimatedCalories > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated Calories</p>
              <p className="text-2xl font-bold text-green-600">{estimatedCalories}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="w-full text-sm font-medium text-muted-foreground mb-2">Quick Actions</h3>
          {QUICK_ACTIONS.slice(0, 3).map((action) => (
            <Button
              key={action.type}
              variant="outline" 
              size="sm"
              onClick={() => action.type === 'repeat_yesterday' && handleRepeatYesterday()}
              className="text-xs"
            >
              <span className="mr-1">{action.icon}</span>
              {action.label}
            </Button>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Pet Selection & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <ChefHat className="w-4 h-4 mr-2" />
                      Pet
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} - {pet.species} ({pet.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Meal Type Selection */}
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Type</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {MEAL_TYPES.map((mealType) => (
                        <motion.button
                          key={mealType.value}
                          type="button"
                          onClick={() => handleMealTypeChange(mealType.value)}
                          className={`p-4 rounded-lg border transition-colors ${
                            field.value === mealType.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-2xl mb-2">{mealType.icon}</div>
                          <div className="font-medium text-sm">{mealType.label}</div>
                          <div className="text-xs text-muted-foreground">{mealType.description}</div>
                        </motion.button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feeding Time */}
            <FormField
              control={form.control}
              name="feedingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Feeding Time
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input type="time" {...field} className="w-auto" />
                      {field.value && (
                        <span className="text-sm text-muted-foreground">
                          ({formatFeedingTime(field.value)})
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight Amount & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Scale className="w-4 h-4 mr-2" />
                      Weight Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEIGHT_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Protein Category */}
            <FormField
              control={form.control}
              name="proteinCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protein Category</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PROTEIN_CATEGORIES.map((category) => (
                        <motion.button
                          key={category.value}
                          type="button"
                          onClick={() => handleProteinCategoryChange(category.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            field.value === category.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="font-medium text-sm">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ~{category.caloriesPerOz} cal/oz
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Protein Source */}
            <FormField
              control={form.control}
              name="proteinSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protein Source</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Select
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            field.onChange('')
                          } else {
                            field.onChange(value)
                            setCustomProteinSource('')
                          }
                        }}
                        value={field.value && !customProteinSource ? field.value : ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a protein source" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProteinSources().map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom protein source...</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {(!field.value || customProteinSource) && (
                        <Input
                          placeholder="Enter custom protein source"
                          value={customProteinSource}
                          onChange={(e) => {
                            setCustomProteinSource(e.target.value)
                            field.onChange(e.target.value)
                          }}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose from common {PROTEIN_CATEGORIES.find(c => c.value === selectedProteinCategory)?.label.toLowerCase()} sources or enter a custom one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this meal..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Record any special observations, preparation notes, or your pet&apos;s reaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Calories Display */}
            {estimatedCalories > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-900">Estimated Nutrition</p>
                    <p className="text-sm text-green-700">
                      This meal provides approximately <strong>{estimatedCalories} calories</strong>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Form
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Feeding Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </motion.div>
  )
}