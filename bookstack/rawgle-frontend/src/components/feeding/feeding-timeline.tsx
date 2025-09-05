'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  Target
} from 'lucide-react'
import { format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  isToday,
  isBefore,
  parseISO
} from 'date-fns'

import { FeedingEntry, DailyFeedingSummary, MEAL_TYPES, formatFeedingTime } from '@/types/feeding'
import { PetProfile } from '@/types/pet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FeedingTimelineProps {
  feedingEntries: FeedingEntry[]
  pets: PetProfile[]
  selectedPetId?: string
  onSelectPet: (petId: string) => void
  onAddFeeding: (date: string, petId: string) => void
  onEditFeeding: (feedingEntry: FeedingEntry) => void
  onViewFeeding: (feedingEntry: FeedingEntry) => void
  dailySummaries: DailyFeedingSummary[]
}

export function FeedingTimeline({
  feedingEntries,
  pets,
  selectedPetId,
  onSelectPet,
  onAddFeeding,
  onEditFeeding,
  onViewFeeding,
  dailySummaries
}: FeedingTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get the current week's date range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1))
  }

  // Get feeding entries for a specific date and pet
  const getFeedingEntriesForDate = (date: Date, petId?: string) => {
    return feedingEntries.filter(entry => {
      const entryDate = parseISO(entry.date)
      const matchesDate = isSameDay(entryDate, date)
      const matchesPet = !petId || entry.petId === petId
      return matchesDate && matchesPet
    })
  }

  // Get daily summary for a specific date and pet
  const getDailySummary = (date: Date, petId?: string) => {
    return dailySummaries.find(summary => {
      const summaryDate = parseISO(summary.date)
      const matchesDate = isSameDay(summaryDate, date)
      const matchesPet = !petId || summary.petId === petId
      return matchesDate && matchesPet
    })
  }

  // Get completion status for a day
  const getDayStatus = (date: Date, petId?: string) => {
    const summary = getDailySummary(date, petId)
    if (!summary) return 'no-data'
    
    const completionRate = summary.completedMeals / summary.totalMeals
    if (completionRate === 1) return 'completed'
    if (completionRate >= 0.8) return 'mostly-completed'
    if (completionRate >= 0.5) return 'partially-completed'
    return 'missed'
  }

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'text-green-600 bg-green-50 border-green-200', 
          icon: CheckCircle2,
          label: 'All meals completed'
        }
      case 'mostly-completed':
        return { 
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
          icon: AlertTriangle,
          label: 'Most meals completed'
        }
      case 'partially-completed':
        return { 
          color: 'text-orange-600 bg-orange-50 border-orange-200', 
          icon: Clock,
          label: 'Some meals missed'
        }
      case 'missed':
        return { 
          color: 'text-red-600 bg-red-50 border-red-200', 
          icon: XCircle,
          label: 'Multiple meals missed'
        }
      default:
        return { 
          color: 'text-gray-400 bg-gray-50 border-gray-200', 
          icon: Calendar,
          label: 'No data'
        }
    }
  }

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    if (!selectedPetId) return null

    const weekSummaries = dailySummaries.filter(summary => {
      const summaryDate = parseISO(summary.date)
      return summary.petId === selectedPetId && 
             summaryDate >= weekStart && 
             summaryDate <= weekEnd
    })

    const totalMeals = weekSummaries.reduce((sum, s) => sum + s.totalMeals, 0)
    const completedMeals = weekSummaries.reduce((sum, s) => sum + s.completedMeals, 0)
    const totalCalories = weekSummaries.reduce((sum, s) => sum + s.totalCalories, 0)
    const targetCalories = weekSummaries.reduce((sum, s) => sum + s.targetCalories, 0)

    return {
      totalMeals,
      completedMeals,
      completionRate: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
      averageCalories: Math.round(totalCalories / 7),
      targetCalories: Math.round(targetCalories / 7),
      calorieAccuracy: targetCalories > 0 ? Math.round((totalCalories / targetCalories) * 100) : 0
    }
  }, [dailySummaries, selectedPetId, weekStart, weekEnd])

  const selectedPet = pets.find(pet => pet.id === selectedPetId)

  return (
    <div className="space-y-6">
      {/* Header with Pet Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feeding Timeline</h2>
          <p className="text-muted-foreground">
            Track daily feeding progress and patterns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPetId || ''}
            onChange={(e) => onSelectPet(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Pets</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Stats Summary */}
      {weeklyStats && selectedPet && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {selectedPet.name}'s Weekly Summary
            </h3>
            <div className="text-sm text-muted-foreground">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{weeklyStats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Meals Completed</div>
              <div className="text-xs text-muted-foreground">
                {weeklyStats.completedMeals}/{weeklyStats.totalMeals} meals
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyStats.averageCalories}</div>
              <div className="text-sm text-muted-foreground">Avg Calories/Day</div>
              <div className="text-xs text-muted-foreground">
                Target: {weeklyStats.targetCalories}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{weeklyStats.calorieAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Calorie Accuracy</div>
              <div className="text-xs text-muted-foreground">vs target</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-1" />
                <span className="text-lg font-bold">
                  {weeklyStats.completionRate >= 90 ? 'Excellent' : 
                   weeklyStats.completionRate >= 80 ? 'Good' : 
                   weeklyStats.completionRate >= 70 ? 'Fair' : 'Needs Work'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Overall</div>
            </div>
          </div>
        </Card>
      )}

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold">
              {format(weekStart, 'MMMM d')} - {format(weekEnd, 'd, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isToday(currentDate) ? 'Current Week' : 
               isBefore(weekEnd, new Date()) ? 'Past Week' : 'Future Week'}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const dayEntries = getFeedingEntriesForDate(day, selectedPetId)
            const dayStatus = getDayStatus(day, selectedPetId)
            const statusDisplay = getStatusDisplay(dayStatus)
            const StatusIcon = statusDisplay.icon
            const dailySummary = getDailySummary(day, selectedPetId)

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "min-h-24 p-2 border rounded-lg transition-colors cursor-pointer",
                  isToday(day) ? 'ring-2 ring-primary' : '',
                  statusDisplay.color
                )}
                onClick={() => selectedPetId && onAddFeeding(format(day, 'yyyy-MM-dd'), selectedPetId)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) ? 'font-bold' : ''
                  )}>
                    {format(day, 'd')}
                  </span>
                  <StatusIcon className="w-3 h-3" />
                </div>

                {dailySummary && (
                  <div className="space-y-1">
                    <div className="text-xs">
                      {dailySummary.completedMeals}/{dailySummary.totalMeals} meals
                    </div>
                    <div className="text-xs">
                      {dailySummary.totalCalories} cal
                    </div>
                  </div>
                )}

                {dayEntries.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayEntries.slice(0, 2).map((entry) => {
                      const mealType = MEAL_TYPES.find(m => m.value === entry.mealType)
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center text-xs p-1 bg-white/50 rounded"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewFeeding(entry)
                          }}
                        >
                          <span className="mr-1">{mealType?.icon}</span>
                          <span className="truncate">{formatFeedingTime(entry.feedingTime)}</span>
                        </div>
                      )
                    })}
                    {dayEntries.length > 2 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{dayEntries.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {selectedPetId && dayEntries.length === 0 && (
                  <div className="flex items-center justify-center h-6">
                    <Plus className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Today's Detailed View */}
      {selectedPetId && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {isToday(currentDate) ? "Today's Schedule" : format(currentDate, "EEEE, MMMM d")}
            {selectedPet && (
              <span className="ml-2 text-sm text-muted-foreground">
                - {selectedPet.name}
              </span>
            )}
          </h3>

          {(() => {
            const todayEntries = getFeedingEntriesForDate(currentDate, selectedPetId)
            const todaySummary = getDailySummary(currentDate, selectedPetId)

            if (todayEntries.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No feeding entries for this day</p>
                  <Button
                    onClick={() => onAddFeeding(format(currentDate, 'yyyy-MM-dd'), selectedPetId)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Meal
                  </Button>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {/* Daily Summary */}
                {todaySummary && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{todaySummary.completedMeals}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{todaySummary.totalCalories}</div>
                        <div className="text-xs text-muted-foreground">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round((todaySummary.completedMeals / todaySummary.totalMeals) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                    </div>
                    <Target className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                {/* Feeding Entries */}
                {todayEntries.map((entry, index) => {
                  const mealType = MEAL_TYPES.find(m => m.value === entry.mealType)
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={cn(
                        "p-4 border rounded-lg",
                        entry.status === 'completed' ? 
                          'border-green-200 bg-green-50' : 
                          'border-gray-200 bg-gray-50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "p-2 rounded-full text-white",
                            entry.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
                          )}>
                            {entry.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{mealType?.icon}</span>
                              <h4 className="font-medium">{mealType?.label}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatFeedingTime(entry.feedingTime)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.proteinSource} - {entry.weightAmount} {entry.weightUnit}
                              {entry.caloriesEstimated && (
                                <span className="ml-2">
                                  (~{entry.caloriesEstimated} cal)
                                </span>
                              )}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewFeeding(entry)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditFeeding(entry)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}