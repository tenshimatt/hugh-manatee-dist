'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Utensils, 
  Plus, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Camera,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FeedingTimeline } from '@/components/feeding/feeding-timeline'
import type { FeedingEntry, DailyFeedingSummary } from '@/types/feeding'
import type { PetProfile } from '@/types/pet'


export default function FeedingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [pets, setPets] = useState<PetProfile[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [feedingEntries, setFeedingEntries] = useState<FeedingEntry[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailyFeedingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Show success message if redirected from successful feeding log
  useEffect(() => {
    const success = searchParams.get('success')
    const message = searchParams.get('message')
    
    if (success === 'true' && message) {
      setShowSuccessMessage(true)
      setSuccessMessage(decodeURIComponent(message))
      // Clear success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [searchParams])
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/pets')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPets(data.pets)
            // Auto-select first pet if available
            if (data.pets.length > 0 && !selectedPetId) {
              setSelectedPetId(data.pets[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch pets:', error)
      }
    }
    
    fetchPets()
  }, [])
  
  // Fetch feeding entries when pet is selected
  useEffect(() => {
    const fetchFeedingEntries = async () => {
      if (!selectedPetId) return
      
      setIsLoading(true)
      try {
        // Fetch recent feeding entries (last 30 days)
        const endDate = format(new Date(), 'yyyy-MM-dd')
        const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        
        const response = await fetch(
          `/api/feeding-entries?petId=${selectedPetId}&startDate=${startDate}&endDate=${endDate}&limit=100`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setFeedingEntries(data.feedingEntries)
            
            // Generate daily summaries from entries
            const summariesMap = new Map<string, DailyFeedingSummary>()
            
            data.feedingEntries.forEach((entry: FeedingEntry) => {
              const existing = summariesMap.get(entry.date)
              if (existing) {
                existing.totalCalories += entry.caloriesEstimated || 0
                if (entry.status === 'completed') {
                  existing.completedMeals += 1
                }
              } else {
                const pet = pets.find(p => p.id === entry.petId)
                summariesMap.set(entry.date, {
                  date: entry.date,
                  petId: entry.petId,
                  petName: pet?.name || 'Unknown Pet',
                  totalMeals: 2, // Assume 2 meals per day target
                  completedMeals: entry.status === 'completed' ? 1 : 0,
                  totalCalories: entry.caloriesEstimated || 0,
                  targetCalories: 800, // Default target
                  missedMeals: [],
                  upcomingMeals: []
                })
              }
            })
            
            setDailySummaries(Array.from(summariesMap.values()))
          }
        }
      } catch (error) {
        console.error('Failed to fetch feeding entries:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFeedingEntries()
  }, [selectedPetId, pets])
  
  // Calculate today's stats
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayEntries = feedingEntries.filter(entry => entry.date === today)
  const completedToday = todayEntries.filter(f => f.status === 'completed').length
  const totalToday = todayEntries.length || 2 // Default to 2 expected meals
  const todayCalories = todayEntries.reduce((sum, entry) => sum + (entry.caloriesEstimated || 0), 0)
  
  // Handle pet selection
  const handleSelectPet = (petId: string) => {
    setSelectedPetId(petId)
  }
  
  // Handle feeding actions
  const handleAddFeeding = (date: string, petId: string) => {
    router.push(`/dashboard/feeding/log?petId=${petId}&date=${date}`)
  }
  
  const handleEditFeeding = (feedingEntry: FeedingEntry) => {
    router.push(`/dashboard/feeding/edit/${feedingEntry.id}`)
  }
  
  const handleViewFeeding = (feedingEntry: FeedingEntry) => {
    router.push(`/dashboard/feeding/view/${feedingEntry.id}`)
  }

  if (isLoading && pets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (pets.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">No Pets Found</h2>
            <p className="text-muted-foreground mb-6">
              Add a pet profile to start tracking their feeding schedule.
            </p>
            <Button
              onClick={() => router.push('/dashboard/pets/add')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Pet
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Feeding Tracker</h1>
          <p className="text-muted-foreground">
            Track meals, monitor nutrition, and maintain feeding schedules
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
          <Button onClick={() => router.push('/dashboard/feeding/log')}>
            <Plus className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
        </div>
      </div>

      {/* Today's Progress */}
      {selectedPetId && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Meals Completed
                  </p>
                  <p className="text-2xl font-semibold">{completedToday}/{totalToday}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                  <Target className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Today's Calories
                  </p>
                  <p className="text-2xl font-semibold">{todayCalories}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-semibold">
                    {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Entries
                  </p>
                  <p className="text-2xl font-semibold">{feedingEntries.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Feeding Timeline */}
      {!isLoading && (
        <FeedingTimeline
          feedingEntries={feedingEntries}
          pets={pets}
          selectedPetId={selectedPetId}
          onSelectPet={handleSelectPet}
          onAddFeeding={handleAddFeeding}
          onEditFeeding={handleEditFeeding}
          onViewFeeding={handleViewFeeding}
          dailySummaries={dailySummaries}
        />
      )}
      
      {isLoading && selectedPetId && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}