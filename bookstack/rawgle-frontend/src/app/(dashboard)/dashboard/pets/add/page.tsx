'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Camera, 
  ArrowLeft,
  Save,
  Search,
  Weight,
  Calendar,
  ChevronDown,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ImageUpload from '@/components/ui/image-upload'
import Link from 'next/link'

import { 
  PetFormData, 
  PetProfileErrors, 
  ACTIVITY_LEVELS, 
  DOG_BREEDS, 
  CAT_BREEDS, 
  FORM_STEPS,
  petProfileSchema,
  PetSpecies,
  WeightUnit,
  ActivityLevel
} from '@/types/pet'

// Calculate age from birth date
const calculateAge = (birthdate: string): string => {
  if (!birthdate) return ''
  
  const birth = new Date(birthdate)
  const today = new Date()
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  
  if (ageInMonths < 12) {
    return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`
  } else {
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`
  }
}

export default function AddPetPage() {
  const router = useRouter()
  
  // Form state matching US002 requirements exactly
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: 'dog',
    breed: '',
    birthdate: '',
    weight: 0,
    weight_unit: 'lbs',
    activity_level: 'moderate',
    spayed_neutered: false,
    notes: ''
  })

  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [breedSearch, setBreedSearch] = useState('')
  const [showBreedDropdown, setShowBreedDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<PetProfileErrors>({})
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  const totalSteps = FORM_STEPS.length

  // Get available breeds based on selected species
  const getAvailableBreeds = useCallback(() => {
    return formData.species === 'dog' ? DOG_BREEDS : CAT_BREEDS
  }, [formData.species])

  // Filter breeds based on search
  const filteredBreeds = getAvailableBreeds().filter(breed => 
    breed.toLowerCase().includes(breedSearch.toLowerCase())
  )

  // Handle input changes
  const handleInputChange = (field: keyof PetFormData, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // If species changes, reset breed
    if (field === 'species') {
      setFormData(prev => ({ 
        ...prev, 
        breed: '',
        species: value as PetSpecies
      }))
      setBreedSearch('')
    }
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const currentStepData = FORM_STEPS[currentStep - 1]
    const stepErrors: PetProfileErrors = {}

    currentStepData.fields.forEach(field => {
      const value = formData[field]
      
      // Check required fields for steps 1 and 2
      if (currentStep <= 2) {
        if (!value || (typeof value === 'string' && value.trim() === '') || 
            (typeof value === 'number' && value <= 0)) {
          stepErrors[field] = `${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`
        }
      }
      
      // Specific validations
      if (field === 'name' && value && (value as string).length > 50) {
        stepErrors[field] = 'Pet name must be less than 50 characters'
      }
      
      if (field === 'weight' && value && (value as number) > 500) {
        stepErrors[field] = 'Weight must be less than 500'
      }
      
      if (field === 'birthdate' && value) {
        const birthDate = new Date(value as string)
        const today = new Date()
        if (birthDate > today) {
          stepErrors[field] = 'Birth date cannot be in the future'
        }
      }
    })

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  // Navigation between steps
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Photo upload is now handled by the ImageUpload component

  // Form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Validate with Zod schema
      const validationResult = petProfileSchema.safeParse(formData)
      
      if (!validationResult.success) {
        const formErrors: PetProfileErrors = {}
        validationResult.error.errors.forEach(error => {
          if (error.path.length > 0) {
            formErrors[error.path[0] as keyof PetFormData] = error.message
          }
        })
        setErrors(formErrors)
        toast.error('Please fix the validation errors')
        return
      }

      // Submit to API
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (result.errors) {
          setErrors(result.errors)
        }
        toast.error(result.message || 'Failed to create pet profile')
        return
      }

      // Success
      toast.success(`Welcome ${formData.name} to your raw feeding journey!`)
      router.push('/dashboard/pets')
      
    } catch (error) {
      console.error('Pet creation error:', error)
      toast.error('Failed to create pet profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pets
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-charcoal">Add New Pet</h1>
          <p className="text-charcoal-600">
            Create a profile for your furry family member
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-charcoal-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-charcoal-500">
            {FORM_STEPS[currentStep - 1].title}
          </span>
        </div>
        <div className="w-full bg-charcoal-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-pumpkin to-sunglow h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </Card>

      {/* Form Steps */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <ImageUpload
                  onImageChange={(imageUrl) => {
                    setProfilePhoto(imageUrl)
                    handleInputChange('photo_url', imageUrl)
                  }}
                  currentImage={profilePhoto}
                  maxSizeMB={5}
                  className="mx-auto"
                />
                <p className="text-sm text-charcoal-500 mt-2">Add a photo of your pet</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Pet Name */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Pet Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-charcoal-300'
                    }`}
                    placeholder="Enter your pet's name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    maxLength={50}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Species */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Species <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="species"
                        value="dog"
                        checked={formData.species === 'dog'}
                        onChange={(e) => handleInputChange('species', e.target.value)}
                        className="mr-2 text-pumpkin focus:ring-pumpkin"
                      />
                      Dog
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="species"
                        value="cat"
                        checked={formData.species === 'cat'}
                        onChange={(e) => handleInputChange('species', e.target.value)}
                        className="mr-2 text-pumpkin focus:ring-pumpkin"
                      />
                      Cat
                    </label>
                  </div>
                </div>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Breed <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                    <input
                      type="text"
                      className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent ${
                        errors.breed ? 'border-red-300 bg-red-50' : 'border-charcoal-300'
                      }`}
                      placeholder="Search breed..."
                      value={breedSearch || formData.breed}
                      onChange={(e) => {
                        setBreedSearch(e.target.value)
                        setShowBreedDropdown(true)
                      }}
                      onFocus={() => setShowBreedDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBreedDropdown(false), 200)}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                  </div>
                  {showBreedDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-charcoal-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredBreeds.map((breed) => (
                        <button
                          key={breed}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-charcoal-50 border-b border-charcoal-100 last:border-b-0"
                          onClick={() => {
                            handleInputChange('breed', breed)
                            setBreedSearch(breed)
                            setShowBreedDropdown(false)
                          }}
                        >
                          {breed}
                        </button>
                      ))}
                      {filteredBreeds.length === 0 && (
                        <div className="px-4 py-2 text-charcoal-500">No breeds found</div>
                      )}
                    </div>
                  )}
                </div>
                {errors.breed && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.breed}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Physical Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-charcoal">Physical Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Birth Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                    <input
                      type="date"
                      className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent ${
                        errors.birthdate ? 'border-red-300 bg-red-50' : 'border-charcoal-300'
                      }`}
                      value={formData.birthdate}
                      onChange={(e) => handleInputChange('birthdate', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {formData.birthdate && (
                    <p className="mt-1 text-sm text-charcoal-600">
                      {calculateAge(formData.birthdate)}
                    </p>
                  )}
                  {errors.birthdate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      {errors.birthdate}
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Current Weight <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="500"
                        className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent ${
                          errors.weight ? 'border-red-300 bg-red-50' : 'border-charcoal-300'
                        }`}
                        placeholder="0.0"
                        value={formData.weight || ''}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <select
                      className="p-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent"
                      value={formData.weight_unit}
                      onChange={(e) => handleInputChange('weight_unit', e.target.value as WeightUnit)}
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  {errors.weight && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      {errors.weight}
                    </p>
                  )}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Activity Level <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ACTIVITY_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-start p-4 border border-charcoal-200 rounded-lg cursor-pointer hover:border-pumpkin hover:bg-pumpkin/5 transition-colors">
                      <input
                        type="radio"
                        name="activity_level"
                        value={level.value}
                        checked={formData.activity_level === level.value}
                        onChange={(e) => handleInputChange('activity_level', e.target.value as ActivityLevel)}
                        className="mt-1 mr-3 text-pumpkin focus:ring-pumpkin"
                      />
                      <div>
                        <div className="font-medium text-charcoal">{level.label}</div>
                        <div className="text-sm text-charcoal-600">{level.description}</div>
                        <div className="text-xs text-pumpkin">Multiplier: {level.multiplier}x</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Optional Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-charcoal">Additional Information</h3>
              
              {/* Spayed/Neutered */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.spayed_neutered || false}
                    onChange={(e) => handleInputChange('spayed_neutered', e.target.checked)}
                    className="mr-3 h-4 w-4 text-pumpkin focus:ring-pumpkin border-charcoal-300 rounded"
                  />
                  <span className="text-sm font-medium text-charcoal-700">
                    Spayed/Neutered
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  className="w-full p-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-pumpkin focus:border-transparent"
                  rows={4}
                  maxLength={500}
                  placeholder="Any special notes about your pet's personality, preferences, or special needs..."
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
                <div className="text-right text-xs text-charcoal-500 mt-1">
                  {(formData.notes || '').length}/500 characters
                </div>
              </div>

              {/* Profile Summary */}
              <Card className="p-6 bg-charcoal-50">
                <h4 className="font-semibold mb-4 text-charcoal">Profile Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {formData.name || 'Not set'}</div>
                  <div><strong>Species:</strong> {formData.species || 'Not set'}</div>
                  <div><strong>Breed:</strong> {formData.breed || 'Not set'}</div>
                  <div><strong>Age:</strong> {formData.birthdate ? calculateAge(formData.birthdate) : 'Not set'}</div>
                  <div><strong>Weight:</strong> {formData.weight ? `${formData.weight} ${formData.weight_unit}` : 'Not set'}</div>
                  <div><strong>Activity:</strong> {ACTIVITY_LEVELS.find(a => a.value === formData.activity_level)?.label || 'Not set'}</div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-charcoal-300 text-charcoal hover:bg-charcoal-50"
            >
              Previous
            </Button>
            
            {currentStep === totalSteps ? (
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-pumpkin to-sunglow hover:from-pumpkin-600 hover:to-sunglow-600 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Pet Profile
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                className="bg-gradient-to-r from-pumpkin to-sunglow hover:from-pumpkin-600 hover:to-sunglow-600 text-white"
              >
                Next Step
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}