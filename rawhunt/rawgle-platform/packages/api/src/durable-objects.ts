// Chat Room Durable Object
// Handles real-time chat with WebSocket connections

export class ChatRoom {
  state: DurableObjectState;
  sessions: Map<string, WebSocket>;
  channelId: string;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.channelId = '';
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    // Parse channel ID from URL
    this.channelId = url.pathname.split('/').pop() || '';

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept WebSocket
    this.state.acceptWebSocket(server);

    // Get user info from JWT token
    const token = url.searchParams.get('token');
    const userId = await this.verifyToken(token);
    
    if (!userId) {
      server.close(1008, 'Invalid token');
      return new Response(null, { status: 401 });
    }

    // Store session
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    // Set up event handlers
    server.addEventListener('message', async (event) => {
      await this.handleMessage(sessionId, userId, event.data);
    });

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      this.broadcast({
        type: 'user_left',
        userId,
        timestamp: new Date().toISOString(),
      }, sessionId);
    });

    // Send initial state
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      channelId: this.channelId,
      activeUsers: this.sessions.size,
    }));

    // Notify others
    this.broadcast({
      type: 'user_joined',
      userId,
      timestamp: new Date().toISOString(),
    }, sessionId);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMessage(sessionId: string, userId: string, data: string) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (e) {
      return;
    }

    switch (message.type) {
      case 'message':
        await this.handleChatMessage(sessionId, userId, message);
        break;
      
      case 'typing':
        this.broadcast({
          type: 'typing',
          userId,
          isTyping: message.isTyping,
        }, sessionId);
        break;
      
      case 'reaction':
        await this.handleReaction(sessionId, userId, message);
        break;
      
      case 'delete':
        await this.handleDelete(sessionId, userId, message);
        break;
    }
  }

  async handleChatMessage(sessionId: string, userId: string, message: any) {
    // Validate message
    if (!message.content || message.content.length > 1000) {
      this.sendError(sessionId, 'Invalid message');
      return;
    }

    // Check rate limit
    const rateKey = `rate:${userId}`;
    const messageCount = (await this.state.storage.get(rateKey)) || 0;
    
    if (messageCount > 30) { // 30 messages per minute
      this.sendError(sessionId, 'Rate limit exceeded');
      return;
    }

    await this.state.storage.put(rateKey, messageCount + 1, {
      expirationTtl: 60,
    });

    // Store message in database
    const messageId = crypto.randomUUID();
    const chatMessage = {
      id: messageId,
      channel_id: this.channelId,
      user_id: userId,
      content: message.content,
      parent_id: message.parentId || null,
      attachments: message.attachments || [],
      mentions: this.extractMentions(message.content),
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    await this.saveMessage(chatMessage);

    // Broadcast to all connected users
    this.broadcast({
      type: 'message',
      message: chatMessage,
    });

    // Send push notifications for mentions
    if (chatMessage.mentions.length > 0) {
      await this.sendMentionNotifications(chatMessage);
    }
  }

  async handleReaction(sessionId: string, userId: string, data: any) {
    const reaction = {
      message_id: data.messageId,
      user_id: userId,
      emoji: data.emoji,
      created_at: new Date().toISOString(),
    };

    // Save reaction
    await this.saveReaction(reaction);

    // Broadcast
    this.broadcast({
      type: 'reaction',
      reaction,
    });
  }

  async handleDelete(sessionId: string, userId: string, data: any) {
    // Verify ownership or moderator status
    const canDelete = await this.canDeleteMessage(userId, data.messageId);
    
    if (!canDelete) {
      this.sendError(sessionId, 'Unauthorized');
      return;
    }

    // Soft delete in database
    await this.deleteMessage(data.messageId);

    // Broadcast deletion
    this.broadcast({
      type: 'message_deleted',
      messageId: data.messageId,
    });
  }

  broadcast(data: any, excludeSessionId?: string) {
    const message = JSON.stringify(data);
    
    this.sessions.forEach((ws, sessionId) => {
      if (sessionId !== excludeSessionId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  sendError(sessionId: string, error: string) {
    const ws = this.sessions.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        error,
      }));
    }
  }

  extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  async verifyToken(token: string | null): Promise<string | null> {
    if (!token) return null;
    
    try {
      // Verify JWT token
      const payload = await this.env.JWT.verify(token);
      return payload.sub;
    } catch (e) {
      return null;
    }
  }

  async saveMessage(message: any): Promise<void> {
    // Save to Supabase via API
    await fetch(`${this.env.SUPABASE_URL}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: {
        'apikey': this.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  async saveReaction(reaction: any): Promise<void> {
    await fetch(`${this.env.SUPABASE_URL}/rest/v1/chat_reactions`, {
      method: 'POST',
      headers: {
        'apikey': this.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reaction),
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await fetch(`${this.env.SUPABASE_URL}/rest/v1/chat_messages?id=eq.${messageId}`, {
      method: 'PATCH',
      headers: {
        'apikey': this.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    });
  }

  async canDeleteMessage(userId: string, messageId: string): Promise<boolean> {
    // Check if user owns the message or is a moderator
    const response = await fetch(
      `${this.env.SUPABASE_URL}/rest/v1/chat_messages?id=eq.${messageId}&select=user_id`,
      {
        headers: {
          'apikey': this.env.SUPABASE_SERVICE_KEY,
        },
      }
    );
    
    const data = await response.json();
    if (data[0]?.user_id === userId) return true;

    // Check moderator status
    const modResponse = await fetch(
      `${this.env.SUPABASE_URL}/rest/v1/chat_channels?id=eq.${this.channelId}&select=moderator_ids`,
      {
        headers: {
          'apikey': this.env.SUPABASE_SERVICE_KEY,
        },
      }
    );
    
    const modData = await modResponse.json();
    return modData[0]?.moderator_ids?.includes(userId) || false;
  }

  async sendMentionNotifications(message: any): Promise<void> {
    // Queue notification job
    await this.env.NOTIFICATION_QUEUE.send({
      type: 'mention',
      message,
      mentions: message.mentions,
    });
  }
}

// Matching Engine Durable Object
export class MatchingEngine {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname.endsWith('/calculate')) {
      return this.calculateRecommendations(request);
    } else if (url.pathname.endsWith('/trigger')) {
      return this.triggerCalculation(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  async calculateRecommendations(request: Request): Promise<Response> {
    const { dog, user_location, postal_code } = await request.json();
    
    // Get cached recommendations if fresh
    const cacheKey = `recommendations:${dog.id}`;
    const cached = await this.state.storage.get(cacheKey);
    
    if (cached && cached.timestamp > Date.now() - 3600000) { // 1 hour cache
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate nutritional requirements
    const requirements = this.calculateNutritionalRequirements(dog);
    
    // Fetch available products near user
    const products = await this.fetchNearbyProducts(user_location, postal_code);
    
    // Score and rank products
    const scored = products.map(product => ({
      ...product,
      score: this.scoreProduct(product, dog, requirements),
      reasoning: this.explainScore(product, dog, requirements),
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Categorize recommendations
    const recommendations = {
      highly_recommended: scored.filter(p => p.score >= 85).slice(0, 3),
      recommended: scored.filter(p => p.score >= 70 && p.score < 85).slice(0, 3),
      alternative: scored.filter(p => p.score >= 50 && p.score < 70).slice(0, 3),
      avoid: scored.filter(p => p.score < 50).slice(0, 3),
      
      summary: {
        total_products_analyzed: products.length,
        average_distance: this.calculateAverageDistance(scored.slice(0, 10)),
        average_price_per_day: this.calculateAveragePricePerDay(scored.slice(0, 10), dog),
        top_proteins: this.getTopProteins(scored.slice(0, 10)),
      },
      
      calculated_at: new Date().toISOString(),
    };
    
    // Cache results
    await this.state.storage.put(cacheKey, {
      data: recommendations,
      timestamp: Date.now(),
    });
    
    // Store in database
    await this.storeRecommendations(dog.id, recommendations);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  calculateNutritionalRequirements(dog: any) {
    const baseRequirements = {
      calories_per_day: dog.daily_calorie_target || 1000,
      protein_percentage: 25,
      fat_percentage: 15,
      bone_percentage: 10,
      organ_percentage: 10,
      muscle_percentage: 40,
    };
    
    // Adjust for life stage
    if (this.calculateAge(dog.birth_date) < 1) {
      // Puppy adjustments
      baseRequirements.protein_percentage = 30;
      baseRequirements.fat_percentage = 20;
      baseRequirements.bone_percentage = 15;
    } else if (this.calculateAge(dog.birth_date) > 7) {
      // Senior adjustments
      baseRequirements.protein_percentage = 22;
      baseRequirements.fat_percentage = 12;
      baseRequirements.bone_percentage = 8;
    }
    
    // Adjust for breed
    const breedAdjustments = this.getBreedAdjustments(dog.breed);
    Object.keys(breedAdjustments).forEach(key => {
      baseRequirements[key] = (baseRequirements[key] || 0) + breedAdjustments[key];
    });
    
    // Adjust for health conditions
    if (dog.health_conditions?.includes('kidney_disease')) {
      baseRequirements.protein_percentage = Math.min(baseRequirements.protein_percentage, 18);
    }
    
    if (dog.health_conditions?.includes('pancreatitis')) {
      baseRequirements.fat_percentage = Math.min(baseRequirements.fat_percentage, 10);
    }
    
    return baseRequirements;
  }

  scoreProduct(product: any, dog: any, requirements: any): number {
    let score = 100;
    
    // Nutritional match (40 points)
    const nutritionScore = this.calculateNutritionScore(product, requirements);
    score = score * 0.6 + nutritionScore * 0.4;
    
    // Allergen check (-50 points if contains allergen)
    if (dog.allergies?.some(allergen => 
      product.protein_source?.includes(allergen) ||
      product.ingredients?.includes(allergen)
    )) {
      score -= 50;
    }
    
    // Quality indicators (+10 points each)
    if (product.is_organic) score += 5;
    if (product.is_grass_fed) score += 5;
    if (product.is_wild_caught) score += 5;
    
    // Supplier rating (up to 10 points)
    score += (product.supplier?.rating_average || 0) * 2;
    
    // Price consideration (-5 points if > $10/day)
    const pricePerDay = this.calculatePricePerDay(product, dog);
    if (pricePerDay > 10) score -= 5;
    if (pricePerDay > 15) score -= 10;
    
    // Distance penalty (-1 point per 10km over 50km)
    if (product.distance > 50) {
      score -= Math.floor((product.distance - 50) / 10);
    }
    
    // Life stage suitability
    if (dog.birth_date) {
      const age = this.calculateAge(dog.birth_date);
      if (age < 1 && !product.suitable_for_puppies) score -= 20;
      if (age > 7 && !product.suitable_for_seniors) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  explainScore(product: any, dog: any, requirements: any): string[] {
    const reasons = [];
    
    // Nutritional analysis
    const nutritionScore = this.calculateNutritionScore(product, requirements);
    if (nutritionScore >= 90) {
      reasons.push('Excellent nutritional match for your dog\'s needs');
    } else if (nutritionScore >= 70) {
      reasons.push('Good nutritional profile');
    } else {
      reasons.push('Nutritional content may not be optimal');
    }
    
    // Allergens
    if (dog.allergies?.some(allergen => 
      product.protein_source?.includes(allergen) ||
      product.ingredients?.includes(allergen)
    )) {
      reasons.push('⚠️ Contains allergens your dog should avoid');
    }
    
    // Quality
    const qualityFeatures = [];
    if (product.is_organic) qualityFeatures.push('organic');
    if (product.is_grass_fed) qualityFeatures.push('grass-fed');
    if (product.is_wild_caught) qualityFeatures.push('wild-caught');
    
    if (qualityFeatures.length > 0) {
      reasons.push(`Premium quality: ${qualityFeatures.join(', ')}`);
    }
    
    // Supplier
    if (product.supplier?.rating_average >= 4.5) {
      reasons.push(`Highly rated supplier (${product.supplier.rating_average}/5)`);
    }
    
    // Distance
    if (product.distance <= 10) {
      reasons.push('Available very close to you');
    } else if (product.distance <= 50) {
      reasons.push('Reasonable delivery distance');
    }
    
    // Price
    const pricePerDay = this.calculatePricePerDay(product, dog);
    if (pricePerDay <= 5) {
      reasons.push('Budget-friendly option');
    } else if (pricePerDay > 15) {
      reasons.push('Premium pricing');
    }
    
    return reasons;
  }

  calculateNutritionScore(product: any, requirements: any): number {
    if (!product.guaranteed_analysis) return 50;
    
    const analysis = product.guaranteed_analysis;
    let score = 100;
    
    // Compare protein
    const proteinDiff = Math.abs(analysis.protein - requirements.protein_percentage);
    score -= proteinDiff * 2;
    
    // Compare fat
    const fatDiff = Math.abs(analysis.fat - requirements.fat_percentage);
    score -= fatDiff * 2;
    
    // Check completeness
    if (product.category !== 'complete_meal') {
      score -= 20; // Needs supplementation
    }
    
    return Math.max(0, score);
  }

  calculatePricePerDay(product: any, dog: any): number {
    const dailyAmount = dog.daily_calorie_target / 1000; // kg per day estimate
    return product.price_per_kg * dailyAmount;
  }

  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  getBreedAdjustments(breed: string): any {
    // Breed-specific nutritional adjustments
    const adjustments = {
      'German Shepherd': { protein_percentage: 2, bone_percentage: 2 },
      'Labrador Retriever': { fat_percentage: -2 }, // Prone to obesity
      'Greyhound': { protein_percentage: 3, fat_percentage: -3 },
      'Chihuahua': { bone_percentage: -2 }, // Smaller bones needed
      'Husky': { fat_percentage: 3 }, // High energy needs
    };
    
    return adjustments[breed] || {};
  }

  calculateAverageDistance(products: any[]): number {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + (p.distance || 0), 0);
    return Math.round(sum / products.length);
  }

  calculateAveragePricePerDay(products: any[], dog: any): number {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + this.calculatePricePerDay(p, dog), 0);
    return Math.round(sum / products.length * 100) / 100;
  }

  getTopProteins(products: any[]): string[] {
    const proteinCounts = {};
    
    products.forEach(product => {
      product.protein_source?.forEach(protein => {
        proteinCounts[protein] = (proteinCounts[protein] || 0) + 1;
      });
    });
    
    return Object.entries(proteinCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([protein]) => protein);
  }

  async fetchNearbyProducts(location: any, postalCode: string): Promise<any[]> {
    // Fetch from Supabase with PostGIS query
    const response = await fetch(
      `${this.env.SUPABASE_URL}/rest/v1/rpc/nearby_products`,
      {
        method: 'POST',
        headers: {
          'apikey': this.env.SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_location: location,
          postal_code: postalCode,
          radius_km: 100,
        }),
      }
    );
    
    return response.json();
  }

  async storeRecommendations(dogId: string, recommendations: any): Promise<void> {
    // Store in database for historical tracking
    await fetch(`${this.env.SUPABASE_URL}/rest/v1/food_recommendations`, {
      method: 'POST',
      headers: {
        'apikey': this.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        [...recommendations.highly_recommended, ...recommendations.recommended].map(rec => ({
          dog_id: dogId,
          product_id: rec.id,
          supplier_id: rec.supplier_id,
          recommendation_type: rec.score >= 85 ? 'highly_recommended' : 'recommended',
          match_score: rec.score,
          reasoning: rec.reasoning,
          distance_km: rec.distance,
          price_per_day: this.calculatePricePerDay(rec, { daily_calorie_target: 1000 }),
        }))
      ),
    });
  }

  async triggerCalculation(request: Request): Promise<Response> {
    const { dogId } = await request.json();
    
    // Queue recalculation
    await this.state.storage.put(`queue:${dogId}`, {
      status: 'pending',
      queued_at: Date.now(),
    });
    
    // Schedule calculation
    this.state.waitUntil(this.processQueue());
    
    return new Response(JSON.stringify({ status: 'queued' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async processQueue(): Promise<void> {
    const queue = await this.state.storage.list({ prefix: 'queue:' });
    
    for (const [key, value] of queue) {
      if (value.status === 'pending') {
        const dogId = key.replace('queue:', '');
        
        // Fetch dog data
        const response = await fetch(
          `${this.env.SUPABASE_URL}/rest/v1/dogs?id=eq.${dogId}&select=*`,
          {
            headers: {
              'apikey': this.env.SUPABASE_SERVICE_KEY,
            },
          }
        );
        
        const [dog] = await response.json();
        
        if (dog) {
          // Trigger calculation
          await this.calculateRecommendations(new Request('https://matching.rawgle.com/calculate', {
            method: 'POST',
            body: JSON.stringify({ dog }),
          }));
        }
        
        // Mark as processed
        await this.state.storage.put(key, {
          ...value,
          status: 'processed',
          processed_at: Date.now(),
        });
      }
    }
  }
}
