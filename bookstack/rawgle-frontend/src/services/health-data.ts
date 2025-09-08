// Health data service for pet health context integration with AI chat
import { PetContext } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface PetHealthContext {
  petId: string;
  petName: string;
  breed?: string;
  age: number;
  weight?: number; // in pounds
  activityLevel: 'low' | 'moderate' | 'high';
  currentDiet?: string;
  healthConditions: string[];
  dietaryRestrictions: string[];
  recentHealthRecords: HealthRecord[];
  recentFeeding: FeedingRecord[];
  insights: HealthInsights;
}

export interface HealthRecord {
  weight?: number;
  temperature?: number;
  heartRate?: number;
  symptoms: string[];
  medications: string[];
  notes?: string;
  date: string;
}

export interface FeedingRecord {
  foodType: string;
  portionGrams: number;
  mealType: string;
  notes?: string;
  date: string;
}

export interface HealthInsights {
  weightTrend?: 'increasing' | 'decreasing' | null;
  feedingPattern?: string | null;
  healthAlerts: string[];
  recommendations: string[];
}

export interface PetSummary {
  id: string;
  name: string;
  breed?: string;
  age: number;
  weight?: number;
  activityLevel: 'low' | 'moderate' | 'high';
  currentDiet?: string;
  healthConditions: string[];
}

export class HealthDataAPI {
  private static instance: HealthDataAPI;

  private constructor() {}

  public static getInstance(): HealthDataAPI {
    if (!HealthDataAPI.instance) {
      HealthDataAPI.instance = new HealthDataAPI();
    }
    return HealthDataAPI.instance;
  }

  /**
   * Get comprehensive health context for a specific pet
   */
  public async getPetHealthContext(petId: string): Promise<PetHealthContext> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-data/pets/${petId}/context`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pet health context: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve pet health context');
      }

      return result.data;
    } catch (error) {
      console.error('Health Data API Error:', error);
      throw error;
    }
  }

  /**
   * Get simplified pet summaries for chat context selection
   */
  public async getPetsSummary(): Promise<PetSummary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-data/pets/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pets summary: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve pets summary');
      }

      return result.data;
    } catch (error) {
      console.error('Health Data API Error:', error);
      throw error;
    }
  }

  /**
   * Add a quick health log entry (useful for chat integrations)
   */
  public async addHealthLogEntry(petId: string, healthData: {
    weight?: number;
    temperature?: number;
    heartRate?: number;
    symptoms?: string[];
    medications?: string[];
    notes?: string;
  }): Promise<{ id: string; recordedAt: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-data/pets/${petId}/health-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to add health log entry: ${response.status}`
        );
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add health log entry');
      }

      return result.data;
    } catch (error) {
      console.error('Health Log API Error:', error);
      throw error;
    }
  }

  /**
   * Convert health context to chat-friendly PetContext format
   */
  public healthContextToPetContext(healthContext: PetHealthContext): PetContext {
    // Get recent health insights
    const recentWeight = healthContext.recentHealthRecords
      .find(record => record.weight)?.weight;
    
    const recentSymptoms = healthContext.recentHealthRecords
      .flatMap(record => record.symptoms)
      .filter((symptom, index, array) => array.indexOf(symptom) === index)
      .slice(0, 5);

    const currentMedications = healthContext.recentHealthRecords
      .flatMap(record => record.medications)
      .filter((med, index, array) => array.indexOf(med) === index)
      .slice(0, 5);

    return {
      petName: healthContext.petName,
      breed: healthContext.breed,
      age: healthContext.age,
      weight: recentWeight || healthContext.weight,
      currentDiet: healthContext.currentDiet,
      healthConditions: [
        ...healthContext.healthConditions,
        ...recentSymptoms.map(symptom => `Recent: ${symptom}`)
      ],
      dietaryRestrictions: healthContext.dietaryRestrictions,
      // Add metadata for more context
      activityLevel: healthContext.activityLevel,
      recentHealthAlerts: healthContext.insights.healthAlerts,
      recommendations: healthContext.insights.recommendations
    };
  }

  /**
   * Get pet context for chat based on pet selection
   */
  public async getPetContextForChat(petId?: string): Promise<PetContext | undefined> {
    if (!petId) {
      return undefined;
    }

    try {
      const healthContext = await this.getPetHealthContext(petId);
      return this.healthContextToPetContext(healthContext);
    } catch (error) {
      console.error('Failed to get pet context for chat:', error);
      // Return basic context if detailed health data fails
      try {
        const pets = await this.getPetsSummary();
        const pet = pets.find(p => p.id === petId);
        if (pet) {
          return {
            petName: pet.name,
            breed: pet.breed,
            age: pet.age,
            weight: pet.weight,
            currentDiet: pet.currentDiet,
            healthConditions: pet.healthConditions,
            dietaryRestrictions: []
          };
        }
      } catch (fallbackError) {
        console.error('Failed to get basic pet context:', fallbackError);
      }
      return undefined;
    }
  }

  /**
   * Mock data for development when backend is not available
   */
  public getMockPetContext(): PetContext {
    return {
      petName: 'Luna',
      breed: 'Golden Retriever',
      age: 3,
      weight: 55,
      currentDiet: 'Raw BARF diet',
      healthConditions: ['Seasonal allergies'],
      dietaryRestrictions: ['Chicken sensitivity'],
      activityLevel: 'high',
      recentHealthAlerts: ['Weight stable within target range'],
      recommendations: [
        'Continue current protein rotation',
        'Monitor for seasonal allergy symptoms during spring'
      ]
    };
  }
}

export default HealthDataAPI.getInstance();