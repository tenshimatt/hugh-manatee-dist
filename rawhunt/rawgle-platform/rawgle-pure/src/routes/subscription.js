import { sanitizeInput, validateEmail } from '../lib/validation.js';
import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic pet profiles',
      'Feeding logs',
      'Basic AI consultations (5/month)',
      'Community access'
    ],
    limits: {
      pets: 3,
      aiConsultations: 5,
      imageUploads: 10,
      pawsMultiplier: 1.0
    }
  },
  paid: {
    name: 'Pet Parent Pro',
    price: 9.99,
    features: [
      'Unlimited pet profiles',
      'Advanced feeding schedules',
      'Unlimited AI consultations',
      'Priority support',
      '10% store discount',
      '1.5x PAWS rewards'
    ],
    limits: {
      pets: -1, // unlimited
      aiConsultations: -1, // unlimited
      imageUploads: 50,
      pawsMultiplier: 1.5
    }
  },
  premium: {
    name: 'Pet Parent Elite',
    price: 19.99,
    features: [
      'Everything in Pro',
      'Advanced analytics',
      'Custom health reports',
      'Vet consultation booking',
      '20% store discount',
      '2x PAWS rewards',
      'Priority NFT minting'
    ],
    limits: {
      pets: -1, // unlimited
      aiConsultations: -1, // unlimited
      imageUploads: 100,
      pawsMultiplier: 2.0
    }
  }
};

// Authentication helper
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  const sessionData = await env.SESSIONS.get(token);
  
  if (!sessionData) {
    return { valid: false, error: 'Invalid or expired session' };
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (new Date() > new Date(session.expiresAt)) {
    await env.SESSIONS.delete(token);
    return { valid: false, error: 'Session expired' };
  }
  
  return { valid: true, userId: session.userId, email: session.email };
}

// Check subscription limits
async function checkSubscriptionLimits(userId, limitType, env) {
  try {
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return { allowed: false, error: 'User not found' };
    }
    
    const plan = SUBSCRIPTION_PLANS[user.subscription_tier] || SUBSCRIPTION_PLANS.free;
    const limit = plan.limits[limitType];
    
    if (limit === -1) {
      return { allowed: true, unlimited: true };
    }
    
    // Check current usage based on limit type
    let currentUsage = 0;
    switch (limitType) {
      case 'pets':
        const petCount = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM pet_profiles WHERE user_id = ?'
        ).bind(userId).first();
        currentUsage = petCount.count;
        break;
        
      case 'aiConsultations':
        const consultationCount = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM ai_consultations c
          JOIN pet_profiles p ON c.pet_id = p.id
          WHERE p.user_id = ? AND date(c.created_at) >= date('now', 'start of month')
        `).bind(userId).first();
        currentUsage = consultationCount.count;
        break;
        
      case 'imageUploads':
        // This would typically be tracked in a separate usage table
        // For now, we'll estimate based on pet profiles with images
        const imageCount = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM pet_profiles 
          WHERE user_id = ? AND profile_image_r2_key IS NOT NULL 
          AND date(updated_at) >= date('now', 'start of month')
        `).bind(userId).first();
        currentUsage = imageCount.count;
        break;
    }
    
    const allowed = currentUsage < limit;
    
    return {
      allowed,
      currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage)
    };
    
  } catch (error) {
    console.error('Check subscription limits error:', error);
    return { allowed: false, error: 'Failed to check limits' };
  }
}

// Get subscription plans
async function getSubscriptionPlans(request, env) {
  try {
    return new Response(JSON.stringify({
      plans: SUBSCRIPTION_PLANS,
      currency: 'USD',
      billingCycle: 'monthly'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get user's current subscription
async function getUserSubscription(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user and subscription details
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(auth.userId).first();
    
    const subscription = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(auth.userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const currentPlan = SUBSCRIPTION_PLANS[user.subscription_tier] || SUBSCRIPTION_PLANS.free;
    
    // Get current usage for limits
    const petCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM pet_profiles WHERE user_id = ?'
    ).bind(auth.userId).first();
    
    const monthlyConsultations = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM ai_consultations c
      JOIN pet_profiles p ON c.pet_id = p.id
      WHERE p.user_id = ? AND date(c.created_at) >= date('now', 'start of month')
    `).bind(auth.userId).first();
    
    const monthlyImages = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM pet_profiles 
      WHERE user_id = ? AND profile_image_r2_key IS NOT NULL 
      AND date(updated_at) >= date('now', 'start of month')
    `).bind(auth.userId).first();
    
    const usage = {
      pets: {
        current: petCount.count || 0,
        limit: currentPlan.limits.pets,
        unlimited: currentPlan.limits.pets === -1
      },
      aiConsultations: {
        current: monthlyConsultations.count || 0,
        limit: currentPlan.limits.aiConsultations,
        unlimited: currentPlan.limits.aiConsultations === -1
      },
      imageUploads: {
        current: monthlyImages.count || 0,
        limit: currentPlan.limits.imageUploads,
        unlimited: currentPlan.limits.imageUploads === -1
      }
    };
    
    return new Response(JSON.stringify({
      currentTier: user.subscription_tier,
      plan: currentPlan,
      subscription: subscription || null,
      usage,
      benefits: {
        storeDiscount: user.subscription_tier === 'paid' ? 10 : 
                      user.subscription_tier === 'premium' ? 20 : 0,
        pawsMultiplier: currentPlan.limits.pawsMultiplier
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user subscription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Subscribe to a plan
async function subscribeToPlan(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { planId, paymentMethodId, billingAddress } = body;
    
    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return new Response(JSON.stringify({ error: 'Invalid plan ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (planId === 'free') {
      return new Response(JSON.stringify({ error: 'Cannot subscribe to free plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get current user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(auth.userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user already has this plan
    if (user.subscription_tier === planId) {
      return new Response(JSON.stringify({ error: 'Already subscribed to this plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const plan = SUBSCRIPTION_PLANS[planId];
    
    // In a real implementation, this would integrate with Stripe
    // For now, we'll simulate a successful payment
    const stripeSubscriptionId = `sub_${uuidv4().replace(/-/g, '')}`;;
    const subscriptionId = uuidv4();
    
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    
    try {
      // Create subscription record
      await env.DB.prepare(`
        INSERT INTO subscriptions (id, user_id, plan, status, payment_method, 
                                   stripe_subscription_id, current_period_start, current_period_end)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(
        subscriptionId,
        auth.userId,
        planId,
        paymentMethodId || 'simulated_card',
        stripeSubscriptionId,
        now.toISOString(),
        nextBilling.toISOString()
      ).run();
      
      // Update user subscription tier
      await env.DB.prepare(
        'UPDATE users SET subscription_tier = ? WHERE id = ?'
      ).bind(planId, auth.userId).run();
      
      // Award subscription bonus PAWS
      const bonusPaws = planId === 'paid' ? 100 : 200;
      await env.RAWGLE_QUEUE.send({
        type: 'award_paws',
        data: {
          userId: auth.userId,
          amount: bonusPaws,
          type: 'subscription_bonus',
          description: `${plan.name} subscription bonus`
        }
      });
      
      return new Response(JSON.stringify({
        subscription: {
          id: subscriptionId,
          plan: planId,
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: nextBilling.toISOString(),
          stripeSubscriptionId
        },
        plan: plan,
        bonusPaws,
        message: `Successfully subscribed to ${plan.name}!`
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (dbError) {
      console.error('Subscription creation error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cancel subscription
async function cancelSubscription(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { reason, immediate } = body;
    
    // Get current subscription
    const subscription = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1'
    ).bind(auth.userId).first();
    
    if (!subscription) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(auth.userId).first();
    
    if (user.subscription_tier === 'free') {
      return new Response(JSON.stringify({ error: 'Already on free plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      if (immediate) {
        // Cancel immediately
        await env.DB.prepare(`
          UPDATE subscriptions 
          SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(subscription.id).run();
        
        // Downgrade user to free tier
        await env.DB.prepare(
          'UPDATE users SET subscription_tier = "free" WHERE id = ?'
        ).bind(auth.userId).run();
        
        return new Response(JSON.stringify({
          message: 'Subscription cancelled immediately',
          newTier: 'free',
          effectiveDate: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Cancel at end of billing period
        await env.DB.prepare(`
          UPDATE subscriptions 
          SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(subscription.id).run();
        
        // User keeps benefits until end of current period
        return new Response(JSON.stringify({
          message: 'Subscription will be cancelled at the end of your billing period',
          currentTier: user.subscription_tier,
          downgradeTo: 'free',
          effectiveDate: subscription.current_period_end,
          accessUntil: subscription.current_period_end
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
    } catch (dbError) {
      console.error('Subscription cancellation error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update payment method
async function updatePaymentMethod(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { paymentMethodId, billingAddress } = body;
    
    if (!paymentMethodId) {
      return new Response(JSON.stringify({ error: 'Payment method ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get current active subscription
    const subscription = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1'
    ).bind(auth.userId).first();
    
    if (!subscription) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // In a real implementation, this would update the payment method in Stripe
    // For now, we'll just update our database
    await env.DB.prepare(`
      UPDATE subscriptions 
      SET payment_method = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(paymentMethodId, subscription.id).run();
    
    return new Response(JSON.stringify({
      message: 'Payment method updated successfully',
      paymentMethodId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update payment method error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get subscription analytics (for user)
async function getSubscriptionAnalytics(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = await env.DB.prepare(
      'SELECT subscription_tier FROM users WHERE id = ?'
    ).bind(auth.userId).first();
    
    const currentPlan = SUBSCRIPTION_PLANS[user.subscription_tier] || SUBSCRIPTION_PLANS.free;
    
    // Calculate total spent on subscriptions
    const totalSpent = await env.DB.prepare(`
      SELECT SUM(
        CASE 
          WHEN plan = 'paid' THEN 9.99
          WHEN plan = 'premium' THEN 19.99
          ELSE 0
        END
      ) as total_spent,
      COUNT(*) as total_months
      FROM subscriptions 
      WHERE user_id = ? AND status IN ('active', 'cancelled')
    `).bind(auth.userId).first();
    
    // Get subscription history
    const subscriptionHistory = await env.DB.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(auth.userId).all();
    
    // Calculate value received (PAWS earned with multiplier)
    const pawsEarned = await env.DB.prepare(`
      SELECT SUM(amount) as total_paws
      FROM paws_transactions 
      WHERE user_id = ? AND amount > 0 AND status = 'completed'
    `).bind(auth.userId).first();
    
    const baselineEarnings = (pawsEarned.total_paws || 0) / currentPlan.limits.pawsMultiplier;
    const bonusEarnings = (pawsEarned.total_paws || 0) - baselineEarnings;
    
    // Benefits used
    const storeDiscount = user.subscription_tier === 'paid' ? 10 : 
                         user.subscription_tier === 'premium' ? 20 : 0;
    
    const storePurchases = await env.DB.prepare(`
      SELECT COUNT(*) as purchases, SUM(total_price_usd) as total_saved
      FROM user_purchases 
      WHERE user_id = ? AND payment_method = 'usd'
    `).bind(auth.userId).first();
    
    const estimatedSavings = (storePurchases.total_saved || 0) * (storeDiscount / 100);
    
    return new Response(JSON.stringify({
      currentPlan: {
        tier: user.subscription_tier,
        name: currentPlan.name,
        benefits: currentPlan.features
      },
      spending: {
        totalSpent: totalSpent.total_spent || 0,
        totalMonths: totalSpent.total_months || 0,
        averageMonthly: totalSpent.total_months > 0 ? 
          (totalSpent.total_spent / totalSpent.total_months) : 0
      },
      value: {
        bonusPawsEarned: Math.round(bonusEarnings),
        estimatedStoreSavings: Math.round(estimatedSavings * 100) / 100,
        pawsMultiplier: currentPlan.limits.pawsMultiplier
      },
      history: subscriptionHistory.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleSubscription(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    // GET /api/subscription/plans - Get available subscription plans
    if (path === '/api/subscription/plans' && method === 'GET') {
      response = await getSubscriptionPlans(request, env);
    }
    // GET /api/subscription - Get user's current subscription
    else if (path === '/api/subscription' && method === 'GET') {
      response = await getUserSubscription(request, env);
    }
    // POST /api/subscription/subscribe - Subscribe to a plan
    else if (path === '/api/subscription/subscribe' && method === 'POST') {
      response = await subscribeToPlan(request, env);
    }
    // POST /api/subscription/cancel - Cancel subscription
    else if (path === '/api/subscription/cancel' && method === 'POST') {
      response = await cancelSubscription(request, env);
    }
    // PUT /api/subscription/payment-method - Update payment method
    else if (path === '/api/subscription/payment-method' && method === 'PUT') {
      response = await updatePaymentMethod(request, env);
    }
    // GET /api/subscription/analytics - Get subscription analytics
    else if (path === '/api/subscription/analytics' && method === 'GET') {
      response = await getSubscriptionAnalytics(request, env);
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'GET /api/subscription/plans - Get available subscription plans',
          'GET /api/subscription - Get current subscription',
          'POST /api/subscription/subscribe - Subscribe to a plan',
          'POST /api/subscription/cancel - Cancel subscription',
          'PUT /api/subscription/payment-method - Update payment method',
          'GET /api/subscription/analytics - Get subscription analytics'
        ]
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Subscription handler error:', error);
    const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

// Export the checkSubscriptionLimits function for use by other modules
export { checkSubscriptionLimits };
