import express from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';

const router = express.Router();

// Pet schemas
const PetSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'ferret', 'other']),
  breed: z.string(),
  age: z.number().min(0).max(30),
  weight: z.number().min(0).max(200), // in pounds
  gender: z.enum(['male', 'female', 'unknown']),
  isSpayedNeutered: z.boolean(),
  microchipId: z.string().optional(),
  vetInfo: z.object({
    vetName: z.string().optional(),
    vetPhone: z.string().optional(),
    vetEmail: z.string().optional(),
    lastVisit: z.string().optional(),
    nextVisit: z.string().optional(),
  }).optional(),
  medicalConditions: z.array(z.string()),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
  })),
  allergies: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  photos: z.array(z.string()), // URLs to photos
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const HealthRecordSchema = z.object({
  id: z.string(),
  petId: z.string(),
  type: z.enum(['vaccination', 'checkup', 'illness', 'injury', 'surgery', 'medication', 'other']),
  title: z.string(),
  description: z.string(),
  veterinarian: z.string().optional(),
  clinic: z.string().optional(),
  cost: z.number().optional(),
  date: z.string(),
  nextDueDate: z.string().optional(),
  documents: z.array(z.string()), // URLs to documents/photos
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const VaccinationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  vaccine: z.string(),
  manufacturer: z.string().optional(),
  lotNumber: z.string().optional(),
  dateGiven: z.string(),
  nextDueDate: z.string(),
  veterinarian: z.string(),
  clinic: z.string(),
  reactions: z.string().optional(),
  createdAt: z.string(),
});

// Mock data for development - in production, this would come from database
const mockPets = [
  {
    id: 'pet_1',
    name: 'Max',
    species: 'dog' as const,
    breed: 'Golden Retriever',
    age: 3,
    weight: 65,
    gender: 'male' as const,
    isSpayedNeutered: true,
    microchipId: '123456789012345',
    vetInfo: {
      vetName: 'Dr. Sarah Johnson',
      vetPhone: '(555) 123-4567',
      vetEmail: 'sarah@animalhospital.com',
      lastVisit: '2024-08-15T10:00:00Z',
      nextVisit: '2024-11-15T10:00:00Z',
    },
    medicalConditions: ['Hip Dysplasia'],
    medications: [
      {
        name: 'Glucosamine',
        dosage: '500mg',
        frequency: 'Daily',
        startDate: '2024-01-15T00:00:00Z',
        notes: 'For joint health'
      }
    ],
    allergies: ['Chicken', 'Wheat'],
    dietaryRestrictions: ['Grain-free'],
    emergencyContact: {
      name: 'John Smith',
      phone: '(555) 987-6543',
      relationship: 'Owner'
    },
    photos: ['/images/pets/max-profile.jpg', '/images/pets/max-playing.jpg'],
    notes: 'Very friendly and energetic. Loves swimming and fetch.',
    isActive: true,
    ownerId: 'user_1',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-08-15T10:30:00Z'
  },
  {
    id: 'pet_2',
    name: 'Luna',
    species: 'cat' as const,
    breed: 'Maine Coon',
    age: 2,
    weight: 12,
    gender: 'female' as const,
    isSpayedNeutered: true,
    microchipId: '987654321098765',
    vetInfo: {
      vetName: 'Dr. Michael Chen',
      vetPhone: '(555) 234-5678',
      vetEmail: 'mchen@felineclinic.com',
      lastVisit: '2024-07-20T14:00:00Z',
      nextVisit: '2024-10-20T14:00:00Z',
    },
    medicalConditions: [],
    medications: [],
    allergies: ['Fish'],
    dietaryRestrictions: ['Indoor cat formula'],
    emergencyContact: {
      name: 'Jane Smith',
      phone: '(555) 876-5432',
      relationship: 'Owner'
    },
    photos: ['/images/pets/luna-portrait.jpg'],
    notes: 'Indoor cat, very calm and affectionate.',
    isActive: true,
    ownerId: 'user_1',
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-07-20T14:30:00Z'
  }
];

const mockHealthRecords = [
  {
    id: 'health_1',
    petId: 'pet_1',
    type: 'checkup' as const,
    title: 'Annual Physical Exam',
    description: 'Comprehensive annual examination including blood work and dental check.',
    veterinarian: 'Dr. Sarah Johnson',
    clinic: 'Animal Hospital of SF',
    cost: 285.50,
    date: '2024-08-15T10:00:00Z',
    nextDueDate: '2025-08-15T10:00:00Z',
    documents: ['/documents/max-bloodwork-2024.pdf'],
    notes: 'All vitals normal. Recommend dental cleaning next visit.',
    createdAt: '2024-08-15T10:30:00Z',
    updatedAt: '2024-08-15T10:30:00Z'
  },
  {
    id: 'health_2',
    petId: 'pet_1',
    type: 'vaccination' as const,
    title: 'DHPP Booster',
    description: 'Annual DHPP vaccination booster',
    veterinarian: 'Dr. Sarah Johnson',
    clinic: 'Animal Hospital of SF',
    cost: 45.00,
    date: '2024-08-15T10:15:00Z',
    nextDueDate: '2025-08-15T10:15:00Z',
    documents: [],
    notes: 'No adverse reactions observed.',
    createdAt: '2024-08-15T10:30:00Z',
    updatedAt: '2024-08-15T10:30:00Z'
  }
];

const mockVaccinations = [
  {
    id: 'vacc_1',
    petId: 'pet_1',
    vaccine: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
    manufacturer: 'Merck',
    lotNumber: 'DHB123456',
    dateGiven: '2024-08-15T10:15:00Z',
    nextDueDate: '2025-08-15T10:15:00Z',
    veterinarian: 'Dr. Sarah Johnson',
    clinic: 'Animal Hospital of SF',
    reactions: 'None observed',
    createdAt: '2024-08-15T10:30:00Z'
  },
  {
    id: 'vacc_2',
    petId: 'pet_1',
    vaccine: 'Rabies',
    manufacturer: 'Zoetis',
    lotNumber: 'RAB789012',
    dateGiven: '2024-08-15T10:20:00Z',
    nextDueDate: '2027-08-15T10:20:00Z',
    veterinarian: 'Dr. Sarah Johnson',
    clinic: 'Animal Hospital of SF',
    reactions: 'None observed',
    createdAt: '2024-08-15T10:30:00Z'
  }
];

// GET /api/v1/pets - Get all pets for user
router.get('/', async (req, res) => {
  try {
    // In production, this would filter by the authenticated user's ID
    const userId = req.query.userId as string || 'user_1'; // Mock user ID
    const pets = mockPets.filter(pet => pet.ownerId === userId && pet.isActive);
    
    logger.info('Pets retrieved', { userId, count: pets.length });
    
    res.json({
      success: true,
      data: pets,
      message: `Found ${pets.length} pets`
    });
  } catch (error) {
    logger.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/pets/:id - Get specific pet by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pet = mockPets.find(p => p.id === id && p.isActive);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching pet by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet'
    });
  }
});

// POST /api/v1/pets - Create new pet
router.post('/', async (req, res) => {
  try {
    const petData = req.body;
    
    // Validate required fields
    if (!petData.name || !petData.species || !petData.breed) {
      return res.status(400).json({
        success: false,
        message: 'Name, species, and breed are required'
      });
    }
    
    const newPet = {
      id: `pet_${Date.now()}`,
      ...petData,
      medicalConditions: petData.medicalConditions || [],
      medications: petData.medications || [],
      allergies: petData.allergies || [],
      dietaryRestrictions: petData.dietaryRestrictions || [],
      photos: petData.photos || [],
      isActive: true,
      ownerId: petData.ownerId || 'user_1', // In production, get from auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In production, save to database
    mockPets.push(newPet);
    
    logger.info('Pet created', { petId: newPet.id, name: newPet.name });
    
    res.status(201).json({
      success: true,
      data: newPet,
      message: 'Pet created successfully'
    });
  } catch (error) {
    logger.error('Error creating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/pets/:id - Update pet
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const petIndex = mockPets.findIndex(p => p.id === id && p.isActive);
    if (petIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Update pet data
    mockPets[petIndex] = {
      ...mockPets[petIndex],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Pet updated', { petId: id });
    
    res.json({
      success: true,
      data: mockPets[petIndex],
      message: 'Pet updated successfully'
    });
  } catch (error) {
    logger.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/pets/:id - Soft delete pet
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const petIndex = mockPets.findIndex(p => p.id === id && p.isActive);
    
    if (petIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Soft delete
    mockPets[petIndex].isActive = false;
    mockPets[petIndex].updatedAt = new Date().toISOString();
    
    logger.info('Pet deleted (soft)', { petId: id });
    
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet'
    });
  }
});

// GET /api/v1/pets/:id/health - Get health records for pet
router.get('/:id/health', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = '20', offset = '0' } = req.query;
    
    // Verify pet exists
    const pet = mockPets.find(p => p.id === id && p.isActive);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    let records = mockHealthRecords.filter(r => r.petId === id);
    
    // Filter by type if specified
    if (type && typeof type === 'string') {
      records = records.filter(r => r.type === type);
    }
    
    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const paginatedRecords = records.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: records.length,
        limit: limitNum,
        offset: offsetNum
      },
      message: `Found ${records.length} health records`
    });
  } catch (error) {
    logger.error('Error fetching health records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health records'
    });
  }
});

// POST /api/v1/pets/:id/health - Add health record
router.post('/:id/health', async (req, res) => {
  try {
    const { id } = req.params;
    const recordData = req.body;
    
    // Verify pet exists
    const pet = mockPets.find(p => p.id === id && p.isActive);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Validate required fields
    if (!recordData.type || !recordData.title || !recordData.date) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and date are required'
      });
    }
    
    const newRecord = {
      id: `health_${Date.now()}`,
      petId: id,
      ...recordData,
      documents: recordData.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In production, save to database
    mockHealthRecords.push(newRecord);
    
    logger.info('Health record created', { petId: id, recordId: newRecord.id });
    
    res.status(201).json({
      success: true,
      data: newRecord,
      message: 'Health record created successfully'
    });
  } catch (error) {
    logger.error('Error creating health record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health record'
    });
  }
});

// GET /api/v1/pets/:id/vaccinations - Get vaccination records
router.get('/:id/vaccinations', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify pet exists
    const pet = mockPets.find(p => p.id === id && p.isActive);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    const vaccinations = mockVaccinations
      .filter(v => v.petId === id)
      .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime());
    
    res.json({
      success: true,
      data: vaccinations,
      message: `Found ${vaccinations.length} vaccination records`
    });
  } catch (error) {
    logger.error('Error fetching vaccinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vaccinations'
    });
  }
});

// POST /api/v1/pets/:id/vaccinations - Add vaccination record
router.post('/:id/vaccinations', async (req, res) => {
  try {
    const { id } = req.params;
    const vaccinationData = req.body;
    
    // Verify pet exists
    const pet = mockPets.find(p => p.id === id && p.isActive);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Validate required fields
    if (!vaccinationData.vaccine || !vaccinationData.dateGiven || !vaccinationData.nextDueDate) {
      return res.status(400).json({
        success: false,
        message: 'Vaccine, date given, and next due date are required'
      });
    }
    
    const newVaccination = {
      id: `vacc_${Date.now()}`,
      petId: id,
      ...vaccinationData,
      createdAt: new Date().toISOString()
    };
    
    // In production, save to database
    mockVaccinations.push(newVaccination);
    
    logger.info('Vaccination record created', { petId: id, vaccinationId: newVaccination.id });
    
    res.status(201).json({
      success: true,
      data: newVaccination,
      message: 'Vaccination record created successfully'
    });
  } catch (error) {
    logger.error('Error creating vaccination record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vaccination record'
    });
  }
});

// GET /api/v1/pets/:id/upcoming - Get upcoming appointments/reminders
router.get('/:id/upcoming', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify pet exists
    const pet = mockPets.find(p => p.id === id && p.isActive);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    const now = new Date();
    const upcoming = [];
    
    // Add vet appointments
    if (pet.vetInfo?.nextVisit) {
      const nextVisit = new Date(pet.vetInfo.nextVisit);
      if (nextVisit > now) {
        upcoming.push({
          id: `appointment_${pet.id}`,
          type: 'appointment',
          title: 'Vet Appointment',
          description: `Scheduled visit with ${pet.vetInfo.vetName}`,
          date: pet.vetInfo.nextVisit,
          location: pet.vetInfo.vetName
        });
      }
    }
    
    // Add vaccination due dates
    mockVaccinations
      .filter(v => v.petId === id)
      .forEach(vaccination => {
        const dueDate = new Date(vaccination.nextDueDate);
        if (dueDate > now) {
          upcoming.push({
            id: `vaccination_${vaccination.id}`,
            type: 'vaccination',
            title: `${vaccination.vaccine} Due`,
            description: `Vaccination booster due`,
            date: vaccination.nextDueDate,
            location: vaccination.clinic
          });
        }
      });
    
    // Add health record follow-ups
    mockHealthRecords
      .filter(r => r.petId === id && r.nextDueDate)
      .forEach(record => {
        const dueDate = new Date(record.nextDueDate!);
        if (dueDate > now) {
          upcoming.push({
            id: `followup_${record.id}`,
            type: 'followup',
            title: `${record.title} Follow-up`,
            description: record.description,
            date: record.nextDueDate!,
            location: record.clinic
          });
        }
      });
    
    // Sort by date
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json({
      success: true,
      data: upcoming,
      message: `Found ${upcoming.length} upcoming items`
    });
  } catch (error) {
    logger.error('Error fetching upcoming items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming items'
    });
  }
});

export { router as petsRouter };