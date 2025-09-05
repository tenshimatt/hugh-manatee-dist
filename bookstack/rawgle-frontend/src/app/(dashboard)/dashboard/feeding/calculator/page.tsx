'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import EnhancedPortionCalculator from '@/components/calculator/enhanced-portion-calculator'
import { PetProfile } from '@/types/pet'

export default function FeedingCalculatorPage() {
  const { user } = useUser()
  const router = useRouter()
  const [pets, setPets] = useState<PetProfile[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Load user's pets function with useCallback to prevent infinite loops
  const fetchUserPets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pets?userId=${user?.id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPets(data.pets || [])
          // Auto-select first pet if available
          if (data.pets && data.pets.length > 0) {
            setSelectedPetId(data.pets[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load user's pets
  useEffect(() => {
    if (user?.id) {
      fetchUserPets()
    }
  }, [user?.id, fetchUserPets])

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId)
  }

  const handleAddPet = () => {
    router.push('/dashboard/pets/add')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <EnhancedPortionCalculator
        pets={pets}
        selectedPetId={selectedPetId}
        onPetSelect={handlePetSelect}
        onAddPet={handleAddPet}
        className="max-w-7xl mx-auto"
      />
    </div>
  )
}