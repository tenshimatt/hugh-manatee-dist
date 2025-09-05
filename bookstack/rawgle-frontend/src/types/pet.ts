import { z } from 'zod'

// Enums for pet profile data
export type PetSpecies = 'dog' | 'cat'
export type WeightUnit = 'lbs' | 'kg'
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'working'

// Core pet profile interface matching US002 requirements
export interface PetProfileData {
  // Required fields
  name: string
  species: PetSpecies
  breed: string
  birthdate: string // ISO date string (YYYY-MM-DD)
  weight: number
  weight_unit: WeightUnit
  activity_level: ActivityLevel
  
  // Optional fields
  photo_url?: string
  spayed_neutered?: boolean
  notes?: string
}

// Extended interface with database fields
export interface PetProfile extends PetProfileData {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Form data interface for component state
export interface PetFormData extends Omit<PetProfileData, 'birthdate'> {
  birthdate: string
}

// Activity level options with descriptions for UI
export interface ActivityLevelOption {
  value: ActivityLevel
  label: string
  description: string
  multiplier: number
}

export const ACTIVITY_LEVELS: ActivityLevelOption[] = [
  {
    value: 'low',
    label: 'Low Activity',
    description: 'Mostly resting, minimal exercise',
    multiplier: 1.2
  },
  {
    value: 'moderate', 
    label: 'Moderate Activity',
    description: 'Daily walks, some play time',
    multiplier: 1.4
  },
  {
    value: 'high',
    label: 'High Activity', 
    description: 'Very active, lots of exercise',
    multiplier: 1.6
  },
  {
    value: 'working',
    label: 'Working Dog',
    description: 'Working dog, intense activity',
    multiplier: 1.8
  }
]

// Breed data interface
export interface BreedOption {
  name: string
  species: PetSpecies
}

// Common dog and cat breeds
export const DOG_BREEDS: string[] = [
  'German Shepherd',
  'Golden Retriever', 
  'Labrador Retriever',
  'French Bulldog',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'German Shorthaired Pointer',
  'Siberian Husky',
  'Dachshund',
  'Pembroke Welsh Corgi',
  'Australian Shepherd',
  'Yorkshire Terrier',
  'Boxer',
  'Great Dane',
  'Doberman Pinscher',
  'Shih Tzu',
  'Boston Terrier',
  'Mixed Breed'
]

export const CAT_BREEDS: string[] = [
  'Persian',
  'Maine Coon',
  'British Shorthair',
  'Ragdoll',
  'Bengali',
  'Abyssinian',
  'Russian Blue',
  'American Shorthair',
  'Scottish Fold',
  'Sphynx',
  'Siamese',
  'Norwegian Forest',
  'Oriental',
  'Devon Rex',
  'Cornish Rex',
  'Mixed Breed'
]

// Validation schema using Zod
export const petProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(50, 'Pet name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Pet name can only contain letters, spaces, hyphens, and apostrophes'),
    
  species: z.enum(['dog', 'cat'], {
    errorMap: () => ({ message: 'Please select either Dog or Cat' })
  }),
  
  breed: z
    .string()
    .min(1, 'Breed is required')
    .max(100, 'Breed name must be less than 100 characters'),
    
  birthdate: z
    .string()
    .min(1, 'Birth date is required')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const thirtyYearsAgo = new Date()
      thirtyYearsAgo.setFullYear(today.getFullYear() - 30)
      
      return birthDate <= today && birthDate >= thirtyYearsAgo
    }, 'Birth date must be within the last 30 years and not in the future'),
    
  weight: z
    .number()
    .min(0.1, 'Weight must be at least 0.1')
    .max(500, 'Weight must be less than 500'),
    
  weight_unit: z.enum(['lbs', 'kg']),
  
  activity_level: z.enum(['low', 'moderate', 'high', 'working']),
  
  // Optional fields
  photo_url: z.string().url().optional(),
  
  spayed_neutered: z.boolean().optional(),
  
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
})

// Type for form validation errors
export type PetProfileErrors = {
  [K in keyof PetFormData]?: string
}

// API response types
export interface CreatePetResponse {
  success: boolean
  pet?: PetProfile
  message?: string
  errors?: PetProfileErrors
}

export interface PetListResponse {
  success: boolean
  pets: PetProfile[]
  total: number
}

// Form step interface for multi-step wizard
export interface FormStep {
  id: number
  title: string
  description: string
  fields: (keyof PetFormData)[]
}

export const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Tell us about your pet',
    fields: ['name', 'species', 'breed']
  },
  {
    id: 2, 
    title: 'Physical Details',
    description: 'Physical characteristics and activity',
    fields: ['birthdate', 'weight', 'weight_unit', 'activity_level']
  },
  {
    id: 3,
    title: 'Optional Information', 
    description: 'Photo and additional details',
    fields: ['photo_url', 'spayed_neutered', 'notes']
  }
]