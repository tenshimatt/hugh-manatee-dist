// Rawgle Platform - Enhanced API Implementation
// Incorporating detailed user flows and CTAs

import { Router } from 'itty-router';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateRecommendations } from './recommendation-engine';
import { trackEvent } from './analytics';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  RECOMMENDATION_ENGINE: DurableObjectNamespace;
  CHAT_ROOMS: DurableObjectNamespace;
  GAMIFICATION_ENGINE: DurableObjectNamespace;
  KV_CACHE: KVNamespace;
  KV_SESSIONS: KVNamespace;
  R2_MEDIA: R2Bucket;
  D1_EDGE: D1Database;
  ANALYTICS: AnalyticsEngineDataset;
}

const router = Router();

// Enhanced middleware with role-based access control
const authenticate = async (request: Request, env: Env, requiredRole?: string) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No authentication token');
  
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) throw new Error('Invalid token');
  
  // Check user role if required
  if (requiredRole) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'moderator', 'supplier'].includes(profile.role)) {
      if (requiredRole !== 'member') throw new Error('Insufficient permissions');
    }
  }
  
  return user;
};

// Enhanced pet profile schema with all fields from spec
const PetProfileSchema = z.object({
  name: z.string().min(1).max(50),
  photos: z.array(z.string()).optional(),
  microchipId: z.string().optional(),
  
  // Physical attributes
  breed: z.string(),
  mixedBreeds: z.array(z.string()).optional(),
  age: z.object({
    years: z.number().min(0).max(30),
    months: z.number().min(0).max(11)
  }),
  weight: z.object({
    current: z.number().positive(),
    ideal: z.number().positive().optional(),
    unit: z.enum(['kg', 'lbs'])
  }),
  bodyConditionScore: z.number().min(1).max(9).optional(),
  sex: z.enum(['male', 'female', 'neutered_male', 'spayed_female']),
  
  // Health & Activity
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  healthConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  feedingPreferences: z.object({
    mealsPerDay: z.number().min(1).max(6),
    currentDiet: z.string(),
    previousReactions: z.array(z.string()).optional()
  }).optional(),
  
  // Location
  location: z.object({
    address: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    deliveryNotes: z.string().optional()
  })
});

// API Routes with enhanced tracking

// Get personalized homepage with CTAs
router.get('/api/home', async (request, env: Env) => {
  try {
    const user = await authenticate(request, env).catch(() => null);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    // Get featured content
    const [blogs, reviews, suppliers] = await Promise.all([
      supabase.from('educational_content')
        .select('*')
        .eq('featured', true)
        .limit(3),
      supabase.from('reviews')
        .select('*, users(*), food_products(*)')
        .order('helpful_count', { ascending: false })
        .limit(5),
      supabase.from('suppliers')
        .select('*')
        .eq('featured', true)
        .limit(3)
    ]);
    
    // Personalized CTAs based on user state
    const ctas = user ? {
      primary: "Complete Your Dog's Profile",
      secondary: ["Join Community", "Write a Review", "Shop Starter Kit"]
    } : {
      primary: "Build Your Dog's Profile",
      secondary: ["Browse Reviews", "Learn About Raw", "Find Suppliers"]
    };
    
    return new Response(JSON.stringify({
      featured: {
        blogs: blogs.data,
        reviews: reviews.data,
        suppliers: suppliers.data
      },
      ctas,
      user: user ? { id: user.id, email: user.email } : null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Enhanced pet profile creation with gamification
router.post('/api/pets', async (request, env: Env) => {
  try {
    const user = await authenticate(request, env);
    const body = await request.json();
    const petData = PetProfileSchema.parse(body);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Check subscription limits
    const { data: existingPets } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', user.id);
    
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    if (userProfile?.subscription_tier === 'free' && existingPets?.length >= 1) {
      return new Response(JSON.stringify({
        error: 'Free tier limited to 1 pet. Upgrade to add more!',
        cta: 'Upgrade to Premium'
      }), { status: 403 });
    }
    
    // Create pet profile
    const { data: pet, error } = await supabase
      .from('pets')
      .insert({
        ...petData,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Award badge for first pet
    if (existingPets?.length === 0) {
      await awardBadge(user.id, 'first_pet', env);
    }
    
    // Track event
    env.ANALYTICS.writeDataPoint({
      blobs: ['pet_created'],
      doubles: [1],
      indexes: [user.id]
    });
    
    // Generate initial recommendations
    const recommendations = await generateRecommendations(pet.id, env);
    
    return new Response(JSON.stringify({
      pet,
      recommendations: recommendations.slice(0, 3),
      message: 'Pet profile created! Here are your top matches.',
      ctas: {
        primary: 'View All Recommendations',
        secondary: ['Add Another Dog', 'Join Breed Group']
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Enhanced recommendation endpoint with avoid list
router.get('/api/pets/:petId/recommendations', async (request, { petId }, env: Env) => {
  try {
    const user = await authenticate(request, env);
    const url = new URL(request.url);
    
    // Check cache first
    const cacheKey = `recs:${petId}:${user.id}`;
    const cached = await env.KV_CACHE.get(cacheKey, 'json');
    if (cached && !url.searchParams.get('refresh')) {
      return new Response(JSON.stringify(cached), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Verify pet ownership
    const { data: pet } = await supabase
      .from('pets')
      .select('*, breeds(*)')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single();
    
    if (!pet) throw new Error('Pet not found');
    
    // Get recommendations from Durable Object
    const id = env.RECOMMENDATION_ENGINE.idFromName(petId);
    const stub = env.RECOMMENDATION_ENGINE.get(id);
    
    const response = await stub.fetch(new Request('http://internal/recommend', {
      method: 'POST',
      body: JSON.stringify({
        pet,
        location: pet.location
      })
    }));
    
    const recommendations = await response.json();
    
    // Enhance with supplier info and stock levels
    const enhanced = await enhanceRecommendations(recommendations, env);
    
    // Cache for 1 hour
    await env.KV_CACHE.put(cacheKey, JSON.stringify(enhanced), {
      expirationTtl: 3600
    });
    
    // Track recommendation view
    env.ANALYTICS.writeDataPoint({
      blobs: ['recommendation_viewed'],
      doubles: [1],
      indexes: [user.id, petId]
    });
    
    return new Response(JSON.stringify({
      ...enhanced,
      ctas: {
        primary: 'Try Top Match',
        secondary: ['Compare All', 'Save Results', 'Get Notifications']
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Enhanced review submission with badges
router.post('/api/reviews', async (request, env: Env) => {
  try {
    const user = await authenticate(request, env);
    const body = await request.json();
    
    const ReviewSchema = z.object({
      petId: z.string().uuid(),
      entityType: z.enum(['product', 'supplier', 'delivery']),
      entityId: z.string().uuid(),
      ratings: z.object({
        overall: z.number().min(1).max(5),
        value: z.number().min(1).max(5).optional(),
        quality: z.number().min(1).max(5).optional(),
        palatability: z.number().min(1).max(5).optional(),
        packaging: z.number().min(1).max(5).optional(),
        results: z.number().min(1).max(5).optional()
      }),
      content: z.object({
        title: z.string().min(5).max(100),
        text: z.string().min(20).max(5000),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
        wouldRecommend: z.boolean()
      }),
      evidence: z.object({
        photos: z.array(z.string()).optional(),
        videos: z.array(z.string()).optional(),
        feedingDuration: z.string().optional()
      }).optional()
    });
    
    const reviewData = ReviewSchema.parse(body);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Verify pet ownership
    const { data: pet } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', reviewData.petId)
      .single();
    
    if (pet?.user_id !== user.id) {
      throw new Error('Unauthorized to review for this pet');
    }
    
    // Check for verified purchase
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .contains('items', [{ product_id: reviewData.entityId }])
      .limit(1);
    
    const purchaseVerified = orders && orders.length > 0;
    
    // Insert review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        pet_id: reviewData.petId,
        reviewable_type: reviewData.entityType,
        reviewable_id: reviewData.entityId,
        ...reviewData.ratings,
        ...reviewData.content,
        photos: reviewData.evidence?.photos || [],
        videos: reviewData.evidence?.videos || [],
        feeding_duration: reviewData.evidence?.feedingDuration,
        purchase_verified: purchaseVerified,
        helpful_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Award badges
    const badges = [];
    
    // First review badge
    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (count === 1) {
      badges.push(await awardBadge(user.id, 'first_review', env));
    }
    
    // Photo reviewer badge
    if (reviewData.evidence?.photos?.length > 0) {
      badges.push(await awardBadge(user.id, 'photo_reviewer', env));
    }
    
    // Update supplier/product ratings
    await updateEntityRatings(
      reviewData.entityType,
      reviewData.entityId,
      env
    );
    
    // Track event
    env.ANALYTICS.writeDataPoint({
      blobs: ['review_submitted', reviewData.entityType],
      doubles: [reviewData.ratings.overall],
      indexes: [user.id]
    });
    
    return new Response(JSON.stringify({
      review,
      badges,
      message: purchaseVerified ? 
        'Thank you for your verified review!' : 
        'Thank you for sharing your experience!',
      ctas: {
        primary: 'Share Review',
        secondary: ['Write Another', 'View Product', 'Join Discussion']
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Educational content with progress tracking
router.get('/api/education/:slug', async (request, { slug }, env: Env) => {
  try {
    const user = await authenticate(request, env).catch(() => null);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    const { data: content, error } = await supabase
      .from('educational_content')
      .select(`
        *,
        author:users(name, avatar_url, credentials),
        related_content(*)
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();
    
    if (error) throw error;
    
    // Track view and progress
    if (user) {
      await supabase
        .from('content_progress')
        .upsert({
          user_id: user.id,
          content_id: content.id,
          last_viewed: new Date().toISOString(),
          completed: false
        });
    }
    
    // Increment view count
    await supabase
      .from('educational_content')
      .update({ views: content.views + 1 })
      .eq('id', content.id);
    
    // Get next content suggestion
    const { data: nextContent } = await supabase
      .from('educational_content')
      .select('title, slug')
      .eq('category', content.category)
      .neq('id', content.id)
      .order('order_index')
      .limit(1)
      .single();
    
    return new Response(JSON.stringify({
      content,
      progress: user ? await getUserProgress(user.id, content.category, env) : null,
      ctas: {
        primary: user ? 'Mark Complete' : 'Create Profile to Track Progress',
        secondary: ['Download PDF', 'Watch Video', 'Take Quiz'],
        next: nextContent ? `Read Next: ${nextContent.title}` : null
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Community chat with role-based channels
router.get('/api/chat/:channel', async (request, { channel }, env: Env) => {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }
  
  try {
    const user = await authenticate(request, env);
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Check channel access
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, subscription_tier, badges')
      .eq('id', user.id)
      .single();
    
    // Validate channel permissions
    const channelAccess = validateChannelAccess(channel, userProfile);
    if (!channelAccess.allowed) {
      return new Response(JSON.stringify({
        error: channelAccess.reason,
        cta: channelAccess.cta
      }), { status: 403 });
    }
    
    // Get or create chat room Durable Object
    const id = env.CHAT_ROOMS.idFromName(channel);
    const stub = env.CHAT_ROOMS.get(id);
    
    // Add user metadata to request
    const enhancedRequest = new Request(request.url, {
      headers: {
        ...request.headers,
        'X-User-Id': user.id,
        'X-User-Name': userProfile.name || 'Anonymous',
        'X-User-Role': userProfile.role,
        'X-User-Badges': JSON.stringify(userProfile.badges || [])
      }
    });
    
    return stub.fetch(enhancedRequest);
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
});

// Shop with personalized recommendations
router.get('/api/shop', async (request, env: Env) => {
  try {
    const user = await authenticate(request, env).catch(() => null);
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    // Get products
    let query = supabase
      .from('shop_products')
      .select('*')
      .eq('active', true);
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data: products } = await query.order('featured', { ascending: false });
    
    // Get personalized bundles if user is logged in
    let bundles = null;
    if (user) {
      const { data: pets } = await supabase
        .from('pets')
        .select('breed, weight')
        .eq('user_id', user.id);
      
      if (pets?.length > 0) {
        bundles = generatePersonalizedBundles(pets, products);
      }
    }
    
    return new Response(JSON.stringify({
      products,
      bundles,
      categories: ['all', 'food', 'equipment', 'supplements', 'merch', 'digital'],
      ctas: {
        primary: 'Get Starter Kit - 20% Off',
        secondary: user ? 
          ['Subscribe & Save', 'Join Group Buy'] : 
          ['Browse All', 'Create Profile for Discounts']
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Supplier portal endpoints
router.get('/api/supplier/dashboard', async (request, env: Env) => {
  try {
    const user = await authenticate(request, env, 'supplier');
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Get supplier data
    const { data: supplier } = await supabase
      .from('suppliers')
      .select(`
        *,
        products:food_products(count),
        reviews(rating, count),
        orders(total, count)
      `)
      .eq('user_id', user.id)
      .single();
    
    if (!supplier) {
      return new Response(JSON.stringify({
        error: 'No supplier account found',
        cta: 'Claim Your Listing'
      }), { status: 404 });
    }
    
    // Get performance metrics
    const metrics = await getSupplierMetrics(supplier.id, env);
    
    return new Response(JSON.stringify({
      supplier,
      metrics,
      ctas: {
        primary: 'Update Inventory',
        secondary: ['View Analytics', 'Create Promotion', 'Message Customers']
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions

async function awardBadge(userId: string, badgeType: string, env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  
  // Check if already has badge
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('badges')
    .eq('id', userId)
    .single();
  
  if (profile?.badges?.includes(badgeType)) return null;
  
  // Award badge
  const newBadges = [...(profile?.badges || []), badgeType];
  await supabase
    .from('user_profiles')
    .update({ badges: newBadges })
    .eq('id', userId);
  
  // Award points
  const points = getBadgePoints(badgeType);
  await updateUserPoints(userId, points, env);
  
  // Track achievement
  env.ANALYTICS.writeDataPoint({
    blobs: ['badge_awarded', badgeType],
    doubles: [points],
    indexes: [userId]
  });
  
  return { badge: badgeType, points };
}

function validateChannelAccess(channel: string, profile: any) {
  // Free tier restrictions
  if (profile.subscription_tier === 'free') {
    if (['expert-qa', 'breeder-network', 'supplier-chat'].includes(channel)) {
      return {
        allowed: false,
        reason: 'Premium channel',
        cta: 'Upgrade to Premium for full access'
      };
    }
  }
  
  // Role-based channels
  if (channel.startsWith('supplier-') && profile.role !== 'supplier') {
    return {
      allowed: false,
      reason: 'Supplier-only channel',
      cta: 'Claim Your Supplier Listing'
    };
  }
  
  if (channel.startsWith('mod-') && !['admin', 'moderator'].includes(profile.role)) {
    return {
      allowed: false,
      reason: 'Moderator-only channel',
      cta: null
    };
  }
  
  return { allowed: true };
}

async function enhanceRecommendations(recommendations: any, env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  
  // Enhance each recommendation with real-time data
  const enhanced = await Promise.all(
    recommendations.primary.map(async (rec: any) => {
      const { data: product } = await supabase
        .from('food_products')
        .select(`
          *,
          supplier:suppliers(*),
          reviews(rating, count)
        `)
        .eq('id', rec.product_id)
        .single();
      
      // Check real-time stock
      const stockLevel = await checkStockLevel(product.id, env);
      
      return {
        ...rec,
        product,
        stockLevel,
        deliveryEstimate: calculateDeliveryTime(product.supplier),
        matchReasons: generateMatchReasons(rec)
      };
    })
  );
  
  return {
    primary: enhanced,
    alternatives: recommendations.alternatives,
    avoid: recommendations.avoid.map((item: any) => ({
      ...item,
      avoidReason: generateAvoidReason(item)
    }))
  };
}

// Export handlers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return router.handle(request, env, ctx);
  },
};

// Gamification Durable Object
export class GamificationEngine {
  state: DurableObjectState;
  env: Env;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }
  
  async fetch(request: Request) {
    const url = new URL(request.url);
    const { userId, action, data } = await request.json();
    
    switch (url.pathname) {
      case '/track':
        return this.trackAction(userId, action, data);
      case '/leaderboard':
        return this.getLeaderboard();
      case '/achievements':
        return this.getUserAchievements(userId);
      default:
        return new Response('Not found', { status: 404 });
    }
  }
  
  async trackAction(userId: string, action: string, data: any) {
    const points = this.calculatePoints(action, data);
    
    // Update user points
    const currentPoints = (await this.state.storage.get(`points:${userId}`)) || 0;
    const newPoints = currentPoints + points;
    await this.state.storage.put(`points:${userId}`, newPoints);
    
    // Check for level up
    const level = this.calculateLevel(newPoints);
    const previousLevel = this.calculateLevel(currentPoints);
    
    let levelUp = null;
    if (level > previousLevel) {
      levelUp = { level, reward: this.getLevelReward(level) };
    }
    
    // Update leaderboard
    await this.updateLeaderboard(userId, newPoints);
    
    return new Response(JSON.stringify({
      points,
      totalPoints: newPoints,
      level,
      levelUp
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  calculatePoints(action: string, data: any) {
    const pointsMap = {
      'review_submitted': 50,
      'photo_uploaded': 20,
      'helpful_vote': 5,
      'daily_login': 10,
      'profile_completed': 100,
      'first_purchase': 200,
      'referral': 150,
      'community_post': 15,
      'question_answered': 30
    };
    
    return pointsMap[action] || 0;
  }
  
  calculateLevel(points: number) {
    // Progressive leveling system
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }
}