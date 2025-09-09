import express from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';

const router = express.Router();

// Feeding schemas
const FeedingScheduleSchema = z.object({
  id: z.string(),
  petId: z.string(),
  name: z.string(),
  foodType: z.enum(['dry', 'wet', 'raw', 'homemade', 'treats', 'supplements']),
  brand: z.string().optional(),
  amount: z.number().min(0), // in cups, ounces, or grams
  unit: z.enum(['cups', 'ounces', 'grams', 'pieces']),
  times: z.array(z.string()), // Time strings like "07:00", "12:00", "18:00"
  daysOfWeek: z.array(z.number().min(0).max(6)), // 0 = Sunday, 6 = Saturday
  startDate: z.string(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const FeedingEntrySchema = z.object({
  id: z.string(),
  petId: z.string(),
  scheduleId: z.string().optional(),
  feedingTime: z.string(), // ISO datetime
  foodType: z.enum(['dry', 'wet', 'raw', 'homemade', 'treats', 'supplements']),
  brand: z.string().optional(),
  amount: z.number().min(0),
  unit: z.enum(['cups', 'ounces', 'grams', 'pieces']),
  actualAmount: z.number().min(0).optional(), // What was actually consumed
  notes: z.string().optional(),
  photos: z.array(z.string()), // URLs to photos
  createdAt: z.string(),
  updatedAt: z.string(),
});

const NutritionalGoalsSchema = z.object({
  id: z.string(),
  petId: z.string(),
  dailyCalories: z.number().min(0),
  dailyProtein: z.number().min(0), // in grams
  dailyFat: z.number().min(0), // in grams
  dailyCarbs: z.number().min(0), // in grams
  dailyFiber: z.number().min(0), // in grams
  waterIntake: z.number().min(0), // in ounces
  supplements: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
    frequency: z.string(),
  })),
  restrictions: z.array(z.string()),
  vetRecommendations: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Mock data for development
const mockFeedingSchedules = [
  {
    id: 'schedule_1',
    petId: 'pet_1',
    name: 'Morning Kibble',
    foodType: 'dry' as const,
    brand: 'Blue Buffalo Life Protection',
    amount: 1.5,
    unit: 'cups' as const,
    times: ['07:00'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Every day
    startDate: '2024-01-01T00:00:00Z',
    isActive: true,
    notes: 'Main morning meal',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'schedule_2',
    petId: 'pet_1',
    name: 'Evening Kibble',
    foodType: 'dry' as const,
    brand: 'Blue Buffalo Life Protection',
    amount: 1.5,
    unit: 'cups' as const,
    times: ['18:00'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Every day
    startDate: '2024-01-01T00:00:00Z',
    isActive: true,
    notes: 'Main evening meal',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'schedule_3',
    petId: 'pet_1',
    name: 'Glucosamine Supplement',
    foodType: 'supplements' as const,
    brand: 'Cosequin DS',
    amount: 1,
    unit: 'pieces' as const,
    times: ['07:30'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Every day
    startDate: '2024-01-15T00:00:00Z',
    isActive: true,
    notes: 'Give with morning meal',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

const mockFeedingEntries = [
  {
    id: 'entry_1',
    petId: 'pet_1',
    scheduleId: 'schedule_1',
    feedingTime: '2024-09-07T07:00:00Z',
    foodType: 'dry' as const,
    brand: 'Blue Buffalo Life Protection',
    amount: 1.5,
    unit: 'cups' as const,
    actualAmount: 1.5,
    notes: 'Ate all of it enthusiastically',
    photos: [],
    createdAt: '2024-09-07T07:05:00Z',
    updatedAt: '2024-09-07T07:05:00Z'
  },
  {
    id: 'entry_2',
    petId: 'pet_1',
    scheduleId: 'schedule_2',
    feedingTime: '2024-09-06T18:00:00Z',
    foodType: 'dry' as const,
    brand: 'Blue Buffalo Life Protection',
    amount: 1.5,
    unit: 'cups' as const,
    actualAmount: 1.2,
    notes: 'Left some food, seemed less hungry than usual',
    photos: [],
    createdAt: '2024-09-06T18:10:00Z',
    updatedAt: '2024-09-06T18:10:00Z'
  }
];

const mockNutritionalGoals = [
  {
    id: 'goals_1',
    petId: 'pet_1',
    dailyCalories: 1800,
    dailyProtein: 135, // 30% of calories
    dailyFat: 80, // 20% of calories
    dailyCarbs: 90, // 20% of calories
    dailyFiber: 18,
    waterIntake: 40, // ounces
    supplements: [
      {
        name: 'Glucosamine',
        amount: 500,
        unit: 'mg',
        frequency: 'daily'
      }
    ],
    restrictions: ['No chicken', 'Grain-free'],
    vetRecommendations: 'Monitor weight and adjust portions as needed. Hip dysplasia diet.',
    startDate: '2024-01-15T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-08-15T00:00:00Z'
  }
];

// GET /api/v1/feeding/schedules - Get feeding schedules for pets
router.get('/schedules', async (req, res) => {
  try {
    const { petId, active = 'true' } = req.query;
    
    let schedules = [...mockFeedingSchedules];
    
    // Filter by pet ID if specified
    if (petId && typeof petId === 'string') {
      schedules = schedules.filter(s => s.petId === petId);
    }
    
    // Filter by active status
    if (active === 'true') {
      schedules = schedules.filter(s => s.isActive);
    }
    
    // Sort by creation date
    schedules.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    logger.info('Feeding schedules retrieved', { 
      petId, 
      active, 
      count: schedules.length 
    });
    
    res.json({
      success: true,
      data: schedules,
      message: `Found ${schedules.length} feeding schedules`
    });
  } catch (error) {
    logger.error('Error fetching feeding schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feeding schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/feeding/schedules - Create new feeding schedule
router.post('/schedules', async (req, res) => {
  try {
    const scheduleData = req.body;
    
    // Validate required fields
    if (!scheduleData.petId || !scheduleData.name || !scheduleData.foodType || 
        !scheduleData.amount || !scheduleData.unit || !scheduleData.times) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID, name, food type, amount, unit, and times are required'
      });
    }
    
    const newSchedule = {
      id: `schedule_${Date.now()}`,
      ...scheduleData,
      daysOfWeek: scheduleData.daysOfWeek || [1, 2, 3, 4, 5, 6, 0], // Default to every day
      isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In production, save to database
    mockFeedingSchedules.push(newSchedule);
    
    logger.info('Feeding schedule created', { 
      scheduleId: newSchedule.id, 
      petId: newSchedule.petId,
      name: newSchedule.name
    });
    
    res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Feeding schedule created successfully'
    });
  } catch (error) {
    logger.error('Error creating feeding schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feeding schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/feeding/schedules/:id - Update feeding schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const scheduleIndex = mockFeedingSchedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feeding schedule not found'
      });
    }
    
    // Update schedule data
    mockFeedingSchedules[scheduleIndex] = {
      ...mockFeedingSchedules[scheduleIndex],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Feeding schedule updated', { scheduleId: id });
    
    res.json({
      success: true,
      data: mockFeedingSchedules[scheduleIndex],
      message: 'Feeding schedule updated successfully'
    });
  } catch (error) {
    logger.error('Error updating feeding schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feeding schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/feeding/schedules/:id - Delete feeding schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleIndex = mockFeedingSchedules.findIndex(s => s.id === id);
    
    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feeding schedule not found'
      });
    }
    
    // Soft delete - mark as inactive
    mockFeedingSchedules[scheduleIndex].isActive = false;
    mockFeedingSchedules[scheduleIndex].updatedAt = new Date().toISOString();
    
    logger.info('Feeding schedule deleted', { scheduleId: id });
    
    res.json({
      success: true,
      message: 'Feeding schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feeding schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feeding schedule'
    });
  }
});

// GET /api/v1/feeding/entries - Get feeding entries
router.get('/entries', async (req, res) => {
  try {
    const { 
      petId, 
      scheduleId, 
      startDate, 
      endDate, 
      limit = '50', 
      offset = '0' 
    } = req.query;
    
    let entries = [...mockFeedingEntries];
    
    // Filter by pet ID
    if (petId && typeof petId === 'string') {
      entries = entries.filter(e => e.petId === petId);
    }
    
    // Filter by schedule ID
    if (scheduleId && typeof scheduleId === 'string') {
      entries = entries.filter(e => e.scheduleId === scheduleId);
    }
    
    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate);
      entries = entries.filter(e => new Date(e.feedingTime) >= start);
    }
    
    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      entries = entries.filter(e => new Date(e.feedingTime) <= end);
    }
    
    // Sort by feeding time (newest first)
    entries.sort((a, b) => new Date(b.feedingTime).getTime() - new Date(a.feedingTime).getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const paginatedEntries = entries.slice(offsetNum, offsetNum + limitNum);
    
    logger.info('Feeding entries retrieved', { 
      petId, 
      count: entries.length,
      filters: { scheduleId, startDate, endDate }
    });
    
    res.json({
      success: true,
      data: {
        entries: paginatedEntries,
        total: entries.length,
        limit: limitNum,
        offset: offsetNum
      },
      message: `Found ${entries.length} feeding entries`
    });
  } catch (error) {
    logger.error('Error fetching feeding entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feeding entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/feeding/entries - Create feeding entry
router.post('/entries', async (req, res) => {
  try {
    const entryData = req.body;
    
    // Validate required fields
    if (!entryData.petId || !entryData.feedingTime || !entryData.foodType || 
        !entryData.amount || !entryData.unit) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID, feeding time, food type, amount, and unit are required'
      });
    }
    
    const newEntry = {
      id: `entry_${Date.now()}`,
      ...entryData,
      photos: entryData.photos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In production, save to database
    mockFeedingEntries.push(newEntry);
    
    logger.info('Feeding entry created', { 
      entryId: newEntry.id, 
      petId: newEntry.petId,
      feedingTime: newEntry.feedingTime
    });
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Feeding entry created successfully'
    });
  } catch (error) {
    logger.error('Error creating feeding entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feeding entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/feeding/entries/:id - Update feeding entry
router.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const entryIndex = mockFeedingEntries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feeding entry not found'
      });
    }
    
    // Update entry data
    mockFeedingEntries[entryIndex] = {
      ...mockFeedingEntries[entryIndex],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Feeding entry updated', { entryId: id });
    
    res.json({
      success: true,
      data: mockFeedingEntries[entryIndex],
      message: 'Feeding entry updated successfully'
    });
  } catch (error) {
    logger.error('Error updating feeding entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feeding entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/feeding/entries/:id - Delete feeding entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entryIndex = mockFeedingEntries.findIndex(e => e.id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feeding entry not found'
      });
    }
    
    // Remove entry
    mockFeedingEntries.splice(entryIndex, 1);
    
    logger.info('Feeding entry deleted', { entryId: id });
    
    res.json({
      success: true,
      message: 'Feeding entry deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feeding entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feeding entry'
    });
  }
});

// GET /api/v1/feeding/goals/:petId - Get nutritional goals for pet
router.get('/goals/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    
    const goals = mockNutritionalGoals.find(g => g.petId === petId && g.isActive);
    
    if (!goals) {
      return res.status(404).json({
        success: false,
        message: 'Nutritional goals not found for this pet'
      });
    }
    
    res.json({
      success: true,
      data: goals,
      message: 'Nutritional goals retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching nutritional goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nutritional goals'
    });
  }
});

// POST /api/v1/feeding/goals - Create/update nutritional goals
router.post('/goals', async (req, res) => {
  try {
    const goalsData = req.body;
    
    // Validate required fields
    if (!goalsData.petId || !goalsData.dailyCalories) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID and daily calories are required'
      });
    }
    
    // Check if goals already exist for this pet
    const existingIndex = mockNutritionalGoals.findIndex(g => g.petId === goalsData.petId && g.isActive);
    
    const goalsObject = {
      id: existingIndex !== -1 ? mockNutritionalGoals[existingIndex].id : `goals_${Date.now()}`,
      ...goalsData,
      supplements: goalsData.supplements || [],
      restrictions: goalsData.restrictions || [],
      isActive: true,
      createdAt: existingIndex !== -1 ? mockNutritionalGoals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
      // Update existing goals
      mockNutritionalGoals[existingIndex] = goalsObject;
      logger.info('Nutritional goals updated', { petId: goalsData.petId });
    } else {
      // Create new goals
      mockNutritionalGoals.push(goalsObject);
      logger.info('Nutritional goals created', { petId: goalsData.petId });
    }
    
    res.status(existingIndex !== -1 ? 200 : 201).json({
      success: true,
      data: goalsObject,
      message: `Nutritional goals ${existingIndex !== -1 ? 'updated' : 'created'} successfully`
    });
  } catch (error) {
    logger.error('Error saving nutritional goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save nutritional goals',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/feeding/upcoming/:petId - Get upcoming feeding times for pet
router.get('/upcoming/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const { days = '7' } = req.query;
    
    const daysNum = parseInt(days as string, 10);
    const now = new Date();
    const endDate = new Date(now.getTime() + (daysNum * 24 * 60 * 60 * 1000));
    
    // Get active schedules for the pet
    const schedules = mockFeedingSchedules.filter(s => 
      s.petId === petId && s.isActive
    );
    
    const upcoming = [];
    
    // Generate upcoming feeding times
    for (const schedule of schedules) {
      const currentDate = new Date(now);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        
        if (schedule.daysOfWeek.includes(dayOfWeek)) {
          for (const timeString of schedule.times) {
            const [hours, minutes] = timeString.split(':').map(Number);
            const feedingTime = new Date(currentDate);
            feedingTime.setHours(hours, minutes, 0, 0);
            
            // Only include future feeding times
            if (feedingTime > now) {
              upcoming.push({
                id: `upcoming_${schedule.id}_${feedingTime.getTime()}`,
                scheduleId: schedule.id,
                petId: schedule.petId,
                name: schedule.name,
                foodType: schedule.foodType,
                brand: schedule.brand,
                amount: schedule.amount,
                unit: schedule.unit,
                feedingTime: feedingTime.toISOString(),
                notes: schedule.notes
              });
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Sort by feeding time
    upcoming.sort((a, b) => new Date(a.feedingTime).getTime() - new Date(b.feedingTime).getTime());
    
    res.json({
      success: true,
      data: upcoming,
      message: `Found ${upcoming.length} upcoming feeding times`
    });
  } catch (error) {
    logger.error('Error fetching upcoming feeding times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming feeding times'
    });
  }
});

// GET /api/v1/feeding/summary/:petId - Get feeding summary/analytics for pet
router.get('/summary/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const { days = '30' } = req.query;
    
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date(Date.now() - (daysNum * 24 * 60 * 60 * 1000));
    
    // Get feeding entries in date range
    const entries = mockFeedingEntries.filter(e => 
      e.petId === petId && new Date(e.feedingTime) >= startDate
    );
    
    // Calculate summary statistics
    const totalFeedings = entries.length;
    const totalCalories = entries.reduce((sum, entry) => {
      // Simple calorie estimation (would be more sophisticated in production)
      const caloriesPerCup = entry.foodType === 'dry' ? 400 : entry.foodType === 'wet' ? 200 : 300;
      const cups = entry.unit === 'cups' ? entry.actualAmount || entry.amount : 
                   entry.unit === 'ounces' ? (entry.actualAmount || entry.amount) / 8 :
                   (entry.actualAmount || entry.amount) / 110; // grams to cups
      return sum + (cups * caloriesPerCup);
    }, 0);
    
    const avgCaloriesPerDay = totalCalories / daysNum;
    
    // Food type breakdown
    const foodTypeBreakdown = entries.reduce((acc, entry) => {
      acc[entry.foodType] = (acc[entry.foodType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get nutritional goals for comparison
    const goals = mockNutritionalGoals.find(g => g.petId === petId && g.isActive);
    
    const summary = {
      period: {
        days: daysNum,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      feeding: {
        totalFeedings,
        avgFeedingsPerDay: totalFeedings / daysNum,
        totalCalories: Math.round(totalCalories),
        avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
        foodTypeBreakdown
      },
      goals: goals ? {
        targetDailyCalories: goals.dailyCalories,
        calorieVariance: avgCaloriesPerDay - goals.dailyCalories,
        onTrack: Math.abs(avgCaloriesPerDay - goals.dailyCalories) <= (goals.dailyCalories * 0.1) // Within 10%
      } : null,
      trends: {
        // Placeholder for more sophisticated analytics
        consistency: totalFeedings > 0 ? Math.min(100, (totalFeedings / (daysNum * 2)) * 100) : 0, // Assuming 2 meals per day
      }
    };
    
    res.json({
      success: true,
      data: summary,
      message: 'Feeding summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching feeding summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feeding summary'
    });
  }
});

export { router as feedingRouter };