// Rawgle API - Cloudflare Workers
// Main API Gateway with intelligent routing

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { cache } from 'hono/cache';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Environment types
interface Env {
  // KV Namespaces
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  RATE_LIMITS: KVNamespace;
  
  // Durable Objects
  CHAT_ROOMS: DurableObjectNamespace;
  MATCHING_ENGINE: DurableObjectNamespace;
  
  // R2 Buckets
  IMAGES: R2Bucket;
  VIDEOS: R2Bucket;
  DOCUMENTS: R2Bucket;
  
  // Secrets
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  SENDGRID_API_KEY: string;
  OPENAI_API_KEY: string;
  
  // Service Bindings
  REVIEWS_SERVICE: Fetcher;
  CHAT_SERVICE: Fetcher;
  COMMERCE_SERVICE: Fetcher;
  EDUCATION_SERVICE: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: ['https://rawgle.com', 'https://app.rawgle.com', 'http://localhost:3000'],
  credentials: true,
}));

// Public routes
app.use('/api/public/*', async (c, next) => {
  c.set('supabase', createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY));
  await next();
});

// Protected routes
app.use('/api/v1/*', jwt({
  secret: async (c) => c.env.JWT_SECRET,
  cookie: 'rawgle_token',
}));

// Rate limiting middleware
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${ip}`;
  
  const current = await c.env.RATE_LIMITS.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count > 100) { // 100 requests per minute
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  await c.env.RATE_LIMITS.put(key, (count + 1).toString(), { expirationTtl: 60 });
  await next();
});

// API Routes

// User Management
app.post('/api/v1/users/profile', async (c) => {
  const body = await c.req.json();
  const userId = c.get('jwtPayload').sub;
  
  const profileSchema = z.object({
    display_name: z.string().optional(),
    bio: z.string().max(500).optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    postal_code: z.string().optional(),
  });
  
  const validated = profileSchema.parse(body);
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...validated,
      location: validated.location 
        ? `POINT(${validated.location.lng} ${validated.location.lat})`
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ user: data });
});

// Dog Profiles
app.post('/api/v1/dogs', async (c) => {
  const body = await c.req.json();
  const userId = c.get('jwtPayload').sub;
  
  const dogSchema = z.object({
    name: z.string().min(1).max(50),
    breed: z.string(),
    breed_mix: z.array(z.string()).optional(),
    birth_date: z.string().optional(),
    weight_kg: z.number().positive(),
    gender: z.enum(['male', 'female', 'neutered_male', 'spayed_female']),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'working']),
    health_conditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    current_diet: z.string().optional(),
    feeding_type: z.enum(['prey_model', 'barf', 'hybrid', 'commercial_raw']).optional(),
  });
  
  const validated = dogSchema.parse(body);
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  
  // Calculate daily calorie needs
  const dailyCalories = calculateDailyCalories({
    weight_kg: validated.weight_kg,
    activity_level: validated.activity_level,
    age: validated.birth_date ? calculateAge(validated.birth_date) : null,
  });
  
  const { data, error } = await supabase
    .from('dogs')
    .insert({
      ...validated,
      user_id: userId,
      daily_calorie_target: dailyCalories,
    })
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  
  // Trigger matching engine
  await triggerMatchingEngine(c.env, data.id);
  
  return c.json({ dog: data });
});

// Smart Matching Engine
app.get('/api/v1/dogs/:dogId/recommendations', async (c) => {
  const dogId = c.req.param('dogId');
  const userId = c.get('jwtPayload').sub;
  
  // Check ownership
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const { data: dog } = await supabase
    .from('dogs')
    .select('*, food_matching_profiles(*)')
    .eq('id', dogId)
    .eq('user_id', userId)
    .single();
    
  if (!dog) return c.json({ error: 'Dog not found' }, 404);
  
  // Get user location
  const { data: user } = await supabase
    .from('users')
    .select('location, postal_code')
    .eq('id', userId)
    .single();
    
  // Use Durable Object for complex matching
  const id = c.env.MATCHING_ENGINE.idFromName(dogId);
  const stub = c.env.MATCHING_ENGINE.get(id);
  
  const recommendations = await stub.fetch(new Request('https://matching.rawgle.com/calculate', {
    method: 'POST',
    body: JSON.stringify({
      dog,
      user_location: user?.location,
      postal_code: user?.postal_code,
    }),
  })).then(r => r.json());
  
  return c.json(recommendations);
});

// Helper Functions
function calculateDailyCalories(params: {
  weight_kg: number;
  activity_level: string;
  age: number | null;
}): number {
  // Base metabolic rate
  let calories = params.weight_kg * 30;
  
  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.4,
    moderate: 1.6,
    active: 1.8,
    working: 2.0,
  };
  
  calories *= activityMultipliers[params.activity_level] || 1.6;
  
  // Age adjustment
  if (params.age !== null) {
    if (params.age < 1) calories *= 1.5; // Puppies
    else if (params.age > 7) calories *= 0.8; // Seniors
  }
  
  return Math.round(calories);
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const ageMs = now.getTime() - birth.getTime();
  return Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function triggerMatchingEngine(env: Env, dogId: string): Promise<void> {
  // Queue matching calculation
  const id = env.MATCHING_ENGINE.idFromName(dogId);
  const stub = env.MATCHING_ENGINE.get(id);
  
  await stub.fetch(new Request('https://matching.rawgle.com/trigger', {
    method: 'POST',
    body: JSON.stringify({ dogId }),
  }));
}

// Error handling
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);
  return c.json({ 
    error: 'Internal server error', 
    message: err.message 
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
