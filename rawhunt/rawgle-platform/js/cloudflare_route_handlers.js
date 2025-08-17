// ===== AI MEDICAL ROUTE (Pure Workers AI) =====
// src/routes/ai-medical.js
export default async function handler(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { petId, symptoms, imageData } = await request.json();
  
  // Get complete pet history from D1
  const petHistory = await env.DB.prepare(`
    SELECT p.*, 
           GROUP_CONCAT(f.meal_time || ': ' || f.food_type) as recent_feeding,
           GROUP_CONCAT(c.ai_assessment) as past_consultations
    FROM pet_profiles p
    LEFT JOIN feeding_logs f ON p.id = f.pet_id AND f.log_date > date('now', '-7 days')
    LEFT JOIN ai_consultations c ON p.id = c.pet_id AND c.created_at > datetime('now', '-30 days')
    WHERE p.id = ?
    GROUP BY p.id
  `).bind(petId).first();

  // Workers AI analysis (replaces AWS SageMaker)
  const medicalPrompt = `
    VETERINARY AI ASSESSMENT
    
    Pet Profile:
    - Name: ${petHistory.name}
    - Age Category: ${petHistory.age_category}
    - Breed: ${petHistory.breed}
    - Weight: ${petHistory.weight}kg
    - Activity Level: ${petHistory.activity_level}
    - Recent Feeding: ${petHistory.recent_feeding || 'No recent logs'}
    - Past Consultations: ${petHistory.past_consultations || 'None'}
    
    Current Symptoms: ${symptoms}
    
    Provide immediate assessment, emergency flag (true/false), confidence score (0-1), and recommendations.
    
    Response format:
    {
      "assessment": "detailed analysis",
      "emergency": true/false,
      "confidence": 0.85,
      "recommendations": ["rec1", "rec2"],
      "follow_up_days": 7
    }
  `;

  const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
    prompt: medicalPrompt,
    max_tokens: 800
  });

  // Image analysis if provided
  let imageAnalysis = null;
  if (imageData) {
    // Store image in R2 first
    const imageKey = `consultations/${petId}/${Date.now()}.jpg`;
    await env.IMAGES.put(imageKey, imageData);
    
    // Analyze with Workers AI vision model
    imageAnalysis = await env.AI.run('@cf/microsoft/resnet-50', {
      image: imageData
    });
  }

  // Parse AI response (handle potential JSON parsing issues)
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(aiResponse.response);
  } catch (e) {
    // Fallback if AI doesn't return valid JSON
    parsedResponse = {
      assessment: aiResponse.response,
      emergency: aiResponse.response.toLowerCase().includes('emergency'),
      confidence: 0.7,
      recommendations: ['Monitor closely', 'Contact vet if symptoms persist'],
      follow_up_days: 7
    };
  }

  // Store consultation in D1
  const consultationId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO ai_consultations 
    (id, pet_id, symptoms, image_r2_keys, ai_assessment, emergency_flag, confidence_score, follow_up_needed)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `).bind(
    consultationId,
    petId,
    symptoms,
    imageAnalysis ? JSON.stringify([imageKey]) : null,
    JSON.stringify(parsedResponse),
    parsedResponse.emergency,
    parsedResponse.confidence,
    parsedResponse.follow_up_days > 0
  ).run();

  // Queue follow-up if needed
  if (parsedResponse.emergency) {
    await env.RAWGLE_QUEUE.send({
      type: 'emergency_alert',
      data: { consultationId, petId, userEmail: petHistory.user_email }
    });
  }

  return Response.json({
    consultationId,
    ...parsedResponse,
    imageAnalysis
  });
}

// ===== PAWS CRYPTOCURRENCY ROUTE (Pure Cloudflare) =====
// src/routes/paws.js
export default async function handler(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.split('/api/paws/')[1];

  switch (path) {
    case 'balance':
      return handleGetBalance(request, env);
    case 'reward':
      return handleRewardPAWS(request, env);
    case 'transfer':
      return handleTransferPAWS(request, env);
    case 'mint':
      return handleMintPAWS(request, env);
    default:
      return new Response('Not found', { status: 404 });
  }
}

async function handleRewardPAWS(request, env) {
  const { userId, type, amount, metadata } = await request.json();
  
  // Validate reward type and amount
  const rewardRules = {
    'profile_completion': 50,
    'daily_feeding': 1,
    'weekly_consistency': 10,
    'community_engagement': 5,
    'monthly_health_report': 100,
    'review_testimonial': 75
  };

  const rewardAmount = rewardRules[type] || amount;
  if (!rewardAmount) {
    return Response.json({ error: 'Invalid reward type' }, { status: 400 });
  }

  // Anti-bot protection using Workers AI
  const botCheckPrompt = `
    Analyze this user activity for bot-like behavior:
    User ID: ${userId}
    Action: ${type}
    Metadata: ${JSON.stringify(metadata)}
    
    Return risk score 0-100 and reasoning in JSON format.
  `;

  const botCheck = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
    prompt: botCheckPrompt,
    max_tokens: 200
  });

  let riskScore = 0;
  try {
    const parsed = JSON.parse(botCheck.response);
    riskScore = parsed.riskScore || 0;
  } catch (e) {
    riskScore = 25; // Default moderate risk
  }

  if (riskScore > 75) {
    return Response.json({ error: 'Suspicious activity detected' }, { status: 429 });
  }

  // Check daily limits from KV
  const dailyKey = `limit:${userId}:${new Date().toDateString()}`;
  const dailyRewards = parseInt(await env.RAWGLE_KV.get(dailyKey) || '0');
  
  if (dailyRewards > 500) { // Max 500 PAWS per day
    return Response.json({ error: 'Daily limit exceeded' }, { status: 429 });
  }

  // Queue PAWS minting job
  const transactionId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status, queue_job_id)
    VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6)
  `).bind(
    transactionId,
    userId,
    rewardAmount,
    type,
    `Reward for ${type}`,
    transactionId
  ).run();

  // Send to queue for blockchain processing
  await env.RAWGLE_QUEUE.send({
    type: 'mint_paws',
    data: { 
      transactionId,
      userId, 
      amount: rewardAmount,
      walletAddress: metadata?.walletAddress 
    }
  });

  // Update daily counter
  await env.RAWGLE_KV.put(dailyKey, (dailyRewards + rewardAmount).toString(), {
    expirationTtl: 86400 // 24 hours
  });

  return Response.json({
    transactionId,
    amount: rewardAmount,
    status: 'pending',
    estimatedConfirmation: '2-5 minutes'
  });
}

// ===== NFT MINTING ROUTE (Pure Cloudflare + Solana) =====
// src/routes/nft.js
export default async function handler(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { petId, paymentMethod, walletAddress } = await request.json();
  
  // Get pet details
  const pet = await env.DB.prepare(`
    SELECT p.*, u.paws_balance, u.subscription_tier
    FROM pet_profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).bind(petId).first();

  if (!pet) {
    return Response.json({ error: 'Pet not found' }, { status: 404 });
  }

  // Determine pricing
  const isSubscriber = pet.subscription_tier === 'paid';
  const pricing = {
    paws: isSubscriber ? 1000 : 10000, // $1 vs $10 in PAWS
    usd: isSubscriber ? 1 : 10
  };

  // Validate payment
  if (paymentMethod === 'PAWS') {
    if (pet.paws_balance < pricing.paws) {
      return Response.json({ 
        error: 'Insufficient PAWS balance',
        required: pricing.paws,
        current: pet.paws_balance
      }, { status: 400 });
    }
  }

  // Create NFT metadata
  const metadata = {
    name: `${pet.name} - Rawgle NFT`,
    symbol: 'RAWGLE',
    description: `Forever memory of ${pet.name}, a beloved ${pet.breed}`,
    image: `https://rawgle-images.your-account.r2.cloudflarestorage.com/${pet.profile_image_r2_key}`,
    attributes: [
      { trait_type: 'Pet Name', value: pet.name },
      { trait_type: 'Breed', value: pet.breed },
      { trait_type: 'Age Category', value: pet.age_category },
      { trait_type: 'Minted Date', value: new Date().toISOString() },
      { trait_type: 'Rarity', value: pet.memorial_mode ? 'Legacy Memorial' : 'Standard' }
    ]
  };

  // Store metadata in R2
  const metadataKey = `nft-metadata/${petId}/${Date.now()}.json`;
  await env.IMAGES.put(metadataKey, JSON.stringify(metadata));

  // Generate metadata URI
  const metadataURI = `https://rawgle-images.your-account.r2.cloudflarestorage.com/${metadataKey}`;

  // Queue NFT minting job
  const mintId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO nft_mints (id, pet_id, metadata_r2_key, is_legacy, mint_cost_paws)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(
    mintId,
    petId,
    metadataKey,
    pet.memorial_mode,
    paymentMethod === 'PAWS' ? pricing.paws : 0
  ).run();

  // Queue blockchain minting
  await env.RAWGLE_QUEUE.send({
    type: 'process_nft_mint',
    data: {
      mintId,
      petId,
      metadata,
      metadataURI,
      walletAddress,
      paymentMethod,
      pawsCost: pricing.paws
    }
  });

  // Deduct PAWS if used
  if (paymentMethod === 'PAWS') {
    await env.DB.prepare(`
      UPDATE users 
      SET paws_balance = paws_balance - ?
      WHERE id = ?
    `).bind(pricing.paws, pet.user_id).run();
  }

  return Response.json({
    mintId,
    metadataURI,
    estimatedMintTime: '5-10 minutes',
    cost: paymentMethod === 'PAWS' ? `${pricing.paws} PAWS` : `$${pricing.usd}`,
    status: 'queued'
  });
}

// ===== DURABLE OBJECT FOR REAL-TIME ANALYTICS =====
// src/durable-objects/analytics.js
export class AnalyticsDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.websockets = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/metrics') {
      return this.handleMetrics(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    server.accept();
    this.websockets.add(server);
    
    // Send current metrics immediately
    const currentMetrics = await this.state.storage.get('live_metrics') || {};
    server.send(JSON.stringify(currentMetrics));
    
    // Clean up on close
    server.addEventListener('close', () => {
      this.websockets.delete(server);
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMetrics(request) {
    const metrics = await request.json();
    
    // Update live metrics
    const current = await this.state.storage.get('live_metrics') || {};
    const updated = { ...current, ...metrics, timestamp: Date.now() };
    
    await this.state.storage.put('live_metrics', updated);
    
    // Broadcast to all connected WebSockets
    for (const ws of this.websockets) {
      try {
        ws.send(JSON.stringify(updated));
      } catch (e) {
        this.websockets.delete(ws);
      }
    }
    
    // Store in R2 for historical analysis
    if (metrics.type === 'daily_summary') {
      await this.env.REPORTS.put(
        `metrics/daily/${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(updated)
      );
    }
    
    return Response.json({ status: 'stored' });
  }
}