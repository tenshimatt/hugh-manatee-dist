'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { FeedingEntryForm } from '@/components/feeding/feeding-entry-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { FeedingFormData } from '@/types/feeding'
import type { PetProfile } from '@/types/pet'

export default function FeedingLogPage() {
  const router = useRouter()
  const [pets, setPets] = useState<PetProfile[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's pets on component mount
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchPets()
  }, [selectedPetId])

  // Handle feeding entry submission
  const handleSubmit = async (data: FeedingFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feeding-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Success - redirect back to main feeding page
        router.push('/dashboard/feeding?success=true&message=' + encodeURIComponent(result.message))
      } else {
        // Handle validation errors
        console.error('Feeding entry creation failed:', result.errors)
        
        // Show error message
        alert(result.message || 'Failed to create feeding entry')
      }
    } catch (error) {
      console.error('Error submitting feeding entry:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel - go back to main feeding page
  const handleCancel = () => {
    router.push('/dashboard/feeding')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Log Feeding</h1>
            <p className="text-muted-foreground">Add a new feeding entry</p>
          </div>
        </div>

        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">No Pets Found</h2>
            <p className="text-muted-foreground mb-6">
              You need to add a pet profile before you can log feeding entries.
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Log Feeding</h1>
          <p className="text-muted-foreground">Add a new feeding entry</p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FeedingEntryForm
          pets={pets}
          selectedPetId={selectedPetId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </motion.div>
    </div>
  )
}