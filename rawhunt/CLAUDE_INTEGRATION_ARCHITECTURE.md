# Claude AI Integration Architecture - Rawgle Platform
**Version**: 1.0  
**Date**: 2025-08-21  
**Purpose**: Detailed architecture for integrating Claude AI throughout the Rawgle platform

## 🤖 Claude AI Integration Overview

This document outlines how Claude AI will be integrated into every aspect of the Rawgle platform, from personalized nutrition advice to content moderation and customer support.

---

## 📦 SDK and Dependencies Setup

### Installation and Configuration

```javascript
// package.json dependencies
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.60.0",           // Main Claude SDK
    "@anthropic-ai/claude-code": "^1.0.86",   // Claude Code SDK for agents
    "@anthropic-ai/bedrock-sdk": "^0.9.1",    // Optional: AWS Bedrock
    "@anthropic-ai/vertex-sdk": "^0.4.0"      // Optional: Google Vertex
  }
}

// Cloudflare Workers wrangler.toml
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."
CLAUDE_MODEL_CONFIG = '{
  "quick": "claude-3-haiku-20240307",
  "standard": "claude-3-sonnet-20240229", 
  "complex": "claude-3-opus-20240229"
}'
CLAUDE_AI_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic"
CLAUDE_RATE_LIMIT_RPM = "50"
CLAUDE_RATE_LIMIT_TPM = "40000"
```

### Cloudflare AI Gateway Integration

```javascript
// /src/config/claude.js
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeConfig {
  constructor(env) {
    // Use Cloudflare AI Gateway for caching, rate limiting, and analytics
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      baseURL: env.CLAUDE_AI_GATEWAY_URL,
      defaultHeaders: {
        'CF-Gateway-Request-ID': crypto.randomUUID(),
        'User-Agent': 'Rawgle-Platform/1.0'
      }
    });
    
    this.models = JSON.parse(env.CLAUDE_MODEL_CONFIG);
    this.rateLimits = {
      rpm: parseInt(env.CLAUDE_RATE_LIMIT_RPM),
      tpm: parseInt(env.CLAUDE_RATE_LIMIT_TPM)
    };
  }
  
  // Smart model selection based on query complexity
  selectModel(queryType, urgency, tokenEstimate) {
    if (urgency === 'high' && tokenEstimate < 500) {
      return this.models.quick; // Fast response for urgent queries
    }
    
    if (tokenEstimate > 2000 || queryType === 'medical_advice') {
      return this.models.complex; // Use Opus for complex analysis
    }
    
    return this.models.standard; // Sonnet for most use cases
  }
  
  // Estimate token usage for cost optimization
  estimateTokens(prompt, systemPrompt = '') {
    // Rough estimation: ~4 characters per token
    return Math.ceil((prompt.length + systemPrompt.length) / 4);
  }
}
```

---

## 🎯 Core AI Services Architecture

### 1. Nutrition Advisory Service

```javascript
// /src/services/ai/nutrition-advisor.js
export class NutritionAdvisorService {
  constructor(claude, db, cache) {
    this.claude = claude;
    this.db = db;
    this.cache = cache; // Cloudflare KV for response caching
  }
  
  async getPetNutritionAdvice(petProfile, userQuery, conversationHistory = []) {
    // Generate cache key for similar queries
    const cacheKey = this.generateCacheKey(petProfile, userQuery);
    
    // Check cache first (1 hour TTL)
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const systemPrompt = `
You are Dr. Sarah Mitchell, a veterinary nutritionist specializing in raw feeding for dogs. 
You have 15 years of experience and are board-certified in veterinary nutrition.

CRITICAL GUIDELINES:
- Always recommend consulting a veterinarian for serious health concerns
- Provide specific, actionable advice based on the dog's profile
- Include feeding amounts, frequencies, and ratios
- Consider the dog's specific breed requirements and health conditions
- Mention food safety practices when relevant
- If asked about topics outside nutrition, politely redirect to nutrition-related aspects

RESPONSE FORMAT:
- Start with a brief, direct answer
- Provide specific recommendations with amounts/percentages
- Include 2-3 actionable next steps
- End with any important safety considerations

Current date: ${new Date().toLocaleDateString()}
`;
    
    const petContext = `
PET PROFILE:
- Name: ${petProfile.name}
- Breed: ${petProfile.breed} (${this.getBreedCharacteristics(petProfile.breed)})
- Age: ${petProfile.age_years} years, ${petProfile.age_months || 0} months
- Weight: ${petProfile.weight_kg}kg (${this.assessBodyCondition(petProfile)})
- Activity Level: ${petProfile.activity_level}
- Health Conditions: ${petProfile.health_conditions?.join(', ') || 'None reported'}
- Dietary Restrictions: ${petProfile.dietary_restrictions?.join(', ') || 'None'}
- Current Diet: ${petProfile.current_diet || 'Not specified'}

FEEDING HISTORY:
${this.getPetFeedingHistory(petProfile.id)}

USER QUESTION: ${userQuery}
`;

    // Build conversation context
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: petContext
      }
    ];
    
    const modelToUse = this.claude.selectModel('nutrition_advice', 'standard', 
                                             this.claude.estimateTokens(petContext));
    
    try {
      const response = await this.claude.anthropic.messages.create({
        model: modelToUse,
        max_tokens: 1200,
        temperature: 0.3, // Lower temperature for consistent medical advice
        system: systemPrompt,
        messages: messages
      });
      
      const result = {
        advice: response.content[0].text,
        model_used: modelToUse,
        tokens_used: response.usage.total_tokens,
        cost_estimate: this.calculateCost(response.usage, modelToUse),
        confidence_score: this.assessConfidence(userQuery, petProfile),
        follow_up_suggestions: this.generateFollowUpQuestions(userQuery, petProfile),
        timestamp: new Date().toISOString(),
        cache_ttl: 3600 // 1 hour
      };
      
      // Cache successful responses
      await this.cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
      
      // Track usage for analytics
      await this.trackUsage('nutrition_advice', petProfile.user_id, response.usage, modelToUse);
      
      return result;
      
    } catch (error) {
      console.error('Claude nutrition advice error:', error);
      
      // Fallback response for API failures
      return {
        advice: "I'm currently experiencing technical difficulties. For immediate nutrition questions, please consult with your veterinarian. You can also try rephrasing your question.",
        model_used: 'fallback',
        tokens_used: 0,
        error: true,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Generate intelligent follow-up questions
  generateFollowUpQuestions(originalQuery, petProfile) {
    const followUps = [];
    
    if (originalQuery.includes('portion') || originalQuery.includes('amount')) {
      followUps.push("Would you like me to create a detailed meal plan for " + petProfile.name + "?");
    }
    
    if (originalQuery.includes('transition') || originalQuery.includes('switching')) {
      followUps.push("Do you need a step-by-step transition schedule?");
    }
    
    if (petProfile.health_conditions?.length > 0) {
      followUps.push("Would you like specific advice for managing " + petProfile.health_conditions[0] + " through diet?");
    }
    
    followUps.push("Should I recommend some suppliers in your area that carry these ingredients?");
    
    return followUps.slice(0, 3); // Return top 3 relevant follow-ups
  }
  
  // Assess confidence in advice based on query complexity and pet profile completeness
  assessConfidence(query, petProfile) {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for complex medical questions
    if (query.includes('sick') || query.includes('disease') || query.includes('medication')) {
      confidence -= 0.3;
    }
    
    // Reduce confidence if pet profile is incomplete
    if (!petProfile.weight_kg) confidence -= 0.1;
    if (!petProfile.health_conditions) confidence -= 0.1;
    if (!petProfile.activity_level) confidence -= 0.1;
    
    // Increase confidence for breed-specific questions we have good data for
    if (this.hasBreedSpecificData(petProfile.breed)) {
      confidence += 0.1;
    }
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  generateCacheKey(petProfile, query) {
    const profileHash = this.hashPetProfile(petProfile);
    const queryHash = this.hashQuery(query);
    return `nutrition_advice:${profileHash}:${queryHash}`;
  }
}
```

### 2. Personalized Supplier Recommendation Service

```javascript
// /src/services/ai/supplier-recommendations.js
export class SupplierRecommendationService {
  constructor(claude, db) {
    this.claude = claude;
    this.db = db;
  }
  
  async generatePersonalizedRecommendations(petProfile, nearbySuppliers, userPreferences = {}) {
    const systemPrompt = `
You are an expert raw feeding advisor helping pet owners find the best suppliers for their dogs.

ANALYSIS CRITERIA:
- Distance and convenience
- Product quality and variety
- Specializations that match pet needs
- Value for money
- Customer service reputation
- Delivery options

RESPONSE FORMAT:
Return JSON with this exact structure:
{
  "top_recommendations": [
    {
      "supplier_id": "uuid",
      "rank": 1,
      "match_score": 0.95,
      "reasons": ["Primary reason", "Secondary reason"],
      "specific_products": ["Product 1", "Product 2"],
      "estimated_monthly_cost": 150
    }
  ],
  "avoid_suppliers": [
    {
      "supplier_id": "uuid", 
      "reasons": ["Why to avoid"]
    }
  ],
  "additional_tips": ["Tip 1", "Tip 2"]
}
`;
    
    const analysisContext = `
PET PROFILE:
- Name: ${petProfile.name}
- Breed: ${petProfile.breed}
- Age: ${petProfile.age_years} years
- Weight: ${petProfile.weight_kg}kg
- Activity: ${petProfile.activity_level}
- Health: ${petProfile.health_conditions?.join(', ') || 'None'}
- Allergies: ${petProfile.dietary_restrictions?.join(', ') || 'None'}
- Budget: ${userPreferences.monthly_budget || 'Not specified'}
- Delivery preference: ${userPreferences.delivery_preference || 'Either'}

AVAILABLE SUPPLIERS:
${nearbySuppliers.map(s => `
ID: ${s.id}
Name: ${s.name}
Location: ${s.city}, ${s.state} (${s.distance_km}km away)
Rating: ${s.rating}/5 (${s.rating_count} reviews)
Services: ${s.services?.join(', ') || 'Standard'}
Specialties: ${s.specialties?.join(', ') || 'General'}
Price Range: ${s.price_range || 'Not specified'}
Delivery: ${s.delivery_available ? 'Yes' : 'No'}
`).join('\n')}

RECENT REVIEWS SUMMARY:
${await this.getRecentReviewsSummary(nearbySuppliers)}

Please analyze these suppliers and recommend the top 3 for this pet.
`;

    try {
      const response = await this.claude.anthropic.messages.create({
        model: this.claude.selectModel('recommendation', 'standard', 
                                      this.claude.estimateTokens(analysisContext)),
        max_tokens: 1000,
        temperature: 0.4, // Balanced creativity for recommendations
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: analysisContext
        }]
      });
      
      // Parse JSON response
      const recommendations = JSON.parse(response.content[0].text);
      
      // Enhance recommendations with additional data
      for (let rec of recommendations.top_recommendations) {
        const supplier = nearbySuppliers.find(s => s.id === rec.supplier_id);
        if (supplier) {
          rec.supplier_details = {
            name: supplier.name,
            address: supplier.address,
            phone: supplier.phone,
            distance: supplier.distance_km,
            rating: supplier.rating
          };
        }
      }
      
      return {
        recommendations: recommendations,
        analysis_date: new Date().toISOString(),
        suppliers_analyzed: nearbySuppliers.length,
        model_used: response.model,
        tokens_used: response.usage.total_tokens
      };
      
    } catch (error) {
      console.error('Supplier recommendation error:', error);
      
      // Fallback to basic distance/rating sorting
      return this.generateBasicRecommendations(petProfile, nearbySuppliers);
    }
  }
  
  async getRecentReviewsSummary(suppliers) {
    const supplierIds = suppliers.map(s => s.id);
    
    const recentReviews = await this.db.query(`
      SELECT supplier_id, rating, content, created_at
      FROM reviews 
      WHERE supplier_id IN (${supplierIds.map(() => '?').join(',')})
      AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      ORDER BY created_at DESC
      LIMIT 50
    `, supplierIds);
    
    // Group by supplier and summarize sentiment
    const summaries = {};
    
    for (let review of recentReviews) {
      if (!summaries[review.supplier_id]) {
        summaries[review.supplier_id] = {
          count: 0,
          avg_rating: 0,
          common_themes: []
        };
      }
      
      summaries[review.supplier_id].count++;
      summaries[review.supplier_id].avg_rating += review.rating;
      
      // Extract key themes from review content (simplified)
      if (review.content.includes('quality')) summaries[review.supplier_id].common_themes.push('quality');
      if (review.content.includes('service')) summaries[review.supplier_id].common_themes.push('service');
      if (review.content.includes('delivery')) summaries[review.supplier_id].common_themes.push('delivery');
    }
    
    // Format for Claude analysis
    return Object.entries(summaries)
      .map(([supplierId, summary]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return `${supplier?.name}: ${summary.count} recent reviews, avg ${(summary.avg_rating/summary.count).toFixed(1)}/5, themes: ${summary.common_themes.join(', ')}`;
      })
      .join('\n');
  }
}
```

### 3. Content Moderation Service

```javascript
// /src/services/ai/content-moderation.js
export class ContentModerationService {
  constructor(claude, db) {
    this.claude = claude;
    this.db = db;
  }
  
  async moderateReviewContent(content, userId, supplierContext = {}) {
    const systemPrompt = `
You are a content moderator for Rawgle, a raw pet food platform. 
Analyze user-generated content for:

APPROVE IF:
- Genuine product/service experiences
- Constructive feedback (positive or negative)
- Helpful information for other pet owners
- Professional, respectful tone

FLAG FOR REVIEW IF:
- Potentially fake reviews (generic, repeated phrases)
- Emotional extreme reactions without specific details
- Mentions of serious health issues without vet consultation advice
- Competitive mentions that seem promotional

REJECT IF:
- Profanity, hate speech, or personal attacks
- Spam, promotional content, or affiliate links
- Personal information (addresses, phone numbers, emails)
- Off-topic content unrelated to pet nutrition/suppliers
- Defamatory claims without evidence

RETURN JSON:
{
  "action": "approve|flag|reject",
  "confidence": 0.95,
  "issues": ["specific issue 1", "specific issue 2"],
  "suggested_edits": ["suggestion 1", "suggestion 2"],
  "helpfulness_score": 8,
  "authenticity_score": 9,
  "safety_concerns": ["concern 1"] or []
}
`;
    
    const moderationContext = `
CONTENT TO MODERATE:
"${content}"

USER CONTEXT:
- User ID: ${userId}
- Account age: ${await this.getUserAccountAge(userId)}
- Previous reviews: ${await this.getUserReviewCount(userId)}
- Flagged content history: ${await this.getUserFlagCount(userId)}

SUPPLIER CONTEXT:
- Supplier: ${supplierContext.name || 'Unknown'}
- Supplier rating: ${supplierContext.rating || 'Unknown'}
- Recent review patterns: ${await this.getSupplierReviewPatterns(supplierContext.id)}

Please analyze this review content for moderation.
`;

    try {
      const response = await this.claude.anthropic.messages.create({
        model: this.claude.models.quick, // Fast moderation
        max_tokens: 400,
        temperature: 0.1, // Very consistent moderation
        system: systemPrompt,
        messages: [{
          role: 'user', 
          content: moderationContext
        }]
      });
      
      const moderation = JSON.parse(response.content[0].text);
      
      // Log moderation decision for audit trail
      await this.logModerationDecision(userId, content, moderation, response.usage);
      
      // Auto-flag users with repeated violations
      if (moderation.action === 'reject') {
        await this.checkUserViolationPattern(userId);
      }
      
      return {
        ...moderation,
        timestamp: new Date().toISOString(),
        model_used: this.claude.models.quick,
        tokens_used: response.usage.total_tokens
      };
      
    } catch (error) {
      console.error('Content moderation error:', error);
      
      // Fail-safe: flag for human review on AI failure
      return {
        action: 'flag',
        confidence: 0.0,
        issues: ['AI moderation service unavailable'],
        suggested_edits: [],
        helpfulness_score: 5,
        authenticity_score: 5,
        safety_concerns: ['Unable to analyze'],
        error: true
      };
    }
  }
  
  async moderateSupplierResponse(responseContent, originalReviewId) {
    // Special moderation for supplier responses to reviews
    const systemPrompt = `
You are moderating a supplier's response to a customer review on a pet food platform.

SUPPLIER RESPONSES should be:
- Professional and courteous
- Addressing specific concerns raised
- Offering solutions or explanations
- Taking accountability when appropriate

FLAG IF:
- Defensive or argumentative tone
- Personal attacks or unprofessional language
- Attempting to move conversation off-platform
- Making medical claims without credentials
- Offering inappropriate incentives (bribes for review changes)

APPROVE IF:
- Thanks customer for feedback
- Addresses concerns professionally
- Offers to resolve issues through appropriate channels
- Provides helpful context without being defensive

Return the same JSON format as regular content moderation.
`;
    
    const originalReview = await this.db.query(
      'SELECT content, rating FROM reviews WHERE id = ?', 
      [originalReviewId]
    );
    
    const context = `
ORIGINAL REVIEW:
Rating: ${originalReview.rating}/5
Content: "${originalReview.content}"

SUPPLIER RESPONSE:
"${responseContent}"

Please moderate this supplier response.
`;
    
    // Similar implementation to regular moderation...
    // [Implementation details similar to moderateReviewContent]
  }
}
```

### 4. Customer Support Chatbot Service

```javascript
// /src/services/ai/customer-support.js
export class CustomerSupportService {
  constructor(claude, db, cache) {
    this.claude = claude;
    this.db = db;
    this.cache = cache;
  }
  
  async handleSupportQuery(userId, message, conversationHistory = []) {
    // Get user context for personalized support
    const userContext = await this.getUserSupportContext(userId);
    
    const systemPrompt = `
You are Riley, Rawgle's friendly customer support assistant specializing in raw dog feeding.

YOUR CAPABILITIES:
- Help with platform features (search, profiles, PAWS tokens, reviews)
- Basic raw feeding guidance (refer complex questions to nutrition expert)
- Account issues and technical problems
- Order and supplier questions

PERSONALITY:
- Warm, helpful, and enthusiastic about raw feeding
- Use the user's name when known
- Acknowledge their pet(s) by name when relevant
- Be conversational but professional

ESCALATION RULES:
- Complex nutrition questions → "Let me connect you with our nutrition expert"
- Account security issues → "I'll escalate this to our security team"
- Supplier disputes → "I'll help you contact the supplier directly"
- Technical bugs → "I'll report this to our development team"

PLATFORM FEATURES TO HELP WITH:
- How to search for suppliers
- Using the map and getting directions
- Creating pet profiles
- Understanding PAWS rewards
- Writing and reading reviews
- Account settings and preferences

Keep responses under 150 words unless explaining a complex process.
`;
    
    const userInfo = `
USER CONTEXT:
- Name: ${userContext.name}
- Account since: ${userContext.created_at}
- PAWS balance: ${userContext.paws_balance}
- Pets: ${userContext.pets.map(p => `${p.name} (${p.breed})`).join(', ')}
- Location: ${userContext.city}, ${userContext.state}
- Recent activity: ${userContext.recent_activity}
- Previous support tickets: ${userContext.support_history}

CURRENT QUERY: ${message}
`;

    // Build conversation context (last 6 messages)
    const messages = [
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userInfo
      }
    ];
    
    try {
      const response = await this.claude.anthropic.messages.create({
        model: this.claude.models.quick, // Fast support responses
        max_tokens: 300,
        temperature: 0.7, // More conversational
        system: systemPrompt,
        messages: messages
      });
      
      const supportResponse = response.content[0].text;
      
      // Detect if escalation is needed
      const needsEscalation = this.detectEscalationNeeds(supportResponse, message);
      
      // Log support interaction
      await this.logSupportInteraction(userId, message, supportResponse, needsEscalation);
      
      // Generate suggested quick actions
      const quickActions = this.generateQuickActions(message, userContext);
      
      return {
        response: supportResponse,
        needs_escalation: needsEscalation,
        escalation_type: needsEscalation ? this.getEscalationType(message) : null,
        quick_actions: quickActions,
        conversation_id: `support_${userId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        tokens_used: response.usage.total_tokens
      };
      
    } catch (error) {
      console.error('Customer support AI error:', error);
      
      // Fallback response
      return {
        response: `Hi ${userContext.name}! I'm having some technical difficulties right now. Please try rephrasing your question, or you can reach out to our human support team at support@rawgle.com for immediate assistance.`,
        needs_escalation: true,
        escalation_type: 'technical_failure',
        error: true
      };
    }
  }
  
  generateQuickActions(message, userContext) {
    const actions = [];
    
    if (message.includes('supplier') || message.includes('find') || message.includes('search')) {
      actions.push({
        text: 'Find Suppliers Near Me',
        action: 'open_supplier_search',
        params: { lat: userContext.latitude, lng: userContext.longitude }
      });
    }
    
    if (message.includes('PAWS') || message.includes('points') || message.includes('rewards')) {
      actions.push({
        text: 'View PAWS Balance',
        action: 'open_paws_dashboard',
        params: {}
      });
    }
    
    if (message.includes('pet') || message.includes('profile')) {
      actions.push({
        text: 'Manage Pet Profiles',
        action: 'open_pet_management',
        params: {}
      });
    }
    
    if (message.includes('review') || message.includes('rating')) {
      actions.push({
        text: 'Write a Review',
        action: 'open_review_form',
        params: {}
      });
    }
    
    return actions.slice(0, 3); // Max 3 quick actions
  }
  
  async getUserSupportContext(userId) {
    const user = await this.db.query(`
      SELECT u.*, 
             GROUP_CONCAT(p.name || ' (' || p.breed || ')') as pets
      FROM users u
      LEFT JOIN pets p ON u.id = p.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);
    
    const recentActivity = await this.db.query(`
      SELECT action, created_at 
      FROM user_events 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);
    
    const supportHistory = await this.db.query(`
      SELECT COUNT(*) as ticket_count,
             MAX(created_at) as last_contact
      FROM support_tickets 
      WHERE user_id = ?
    `, [userId]);
    
    return {
      ...user,
      recent_activity: recentActivity.map(a => a.action).join(', '),
      support_history: supportHistory.ticket_count || 0
    };
  }
}
```

---

## 🔄 Streaming and Real-time Features

```javascript
// /src/services/ai/streaming.js
export class ClaudeStreamingService {
  constructor(claude) {
    this.claude = claude;
  }
  
  async streamNutritionAdvice(petProfile, query, responseHandler) {
    const systemPrompt = `
You are providing real-time nutrition advice for a dog. Stream your response 
as you analyze the situation. Think out loud and build your recommendations step by step.

Format your streaming response with clear sections:
1. Initial assessment
2. Key considerations  
3. Specific recommendations
4. Next steps
`;
    
    const userContext = `
Pet: ${petProfile.name} (${petProfile.breed})
Age: ${petProfile.age_years} years
Weight: ${petProfile.weight_kg}kg
Activity: ${petProfile.activity_level}
Health: ${petProfile.health_conditions?.join(', ') || 'None'}

Question: ${query}
`;

    try {
      const stream = await this.claude.anthropic.messages.stream({
        model: this.claude.models.standard,
        max_tokens: 1000,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userContext
        }]
      });
      
      let fullResponse = '';
      
      // Handle streaming chunks
      stream.on('text', (textDelta) => {
        fullResponse += textDelta;
        
        // Send real-time updates to client
        responseHandler({
          type: 'text_delta',
          content: textDelta,
          accumulated: fullResponse,
          timestamp: new Date().toISOString()
        });
      });
      
      stream.on('message_stop', () => {
        responseHandler({
          type: 'complete',
          full_response: fullResponse,
          timestamp: new Date().toISOString()
        });
      });
      
      stream.on('error', (error) => {
        responseHandler({
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
      
    } catch (error) {
      responseHandler({
        type: 'error',
        error: 'Failed to start streaming response',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // WebSocket integration for real-time AI chat
  async handleWebSocketChat(websocket, userId) {
    websocket.on('message', async (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'chat_message') {
        await this.streamNutritionAdvice(
          message.pet_profile,
          message.query,
          (response) => {
            websocket.send(JSON.stringify({
              conversation_id: message.conversation_id,
              ...response
            }));
          }
        );
      }
    });
  }
}
```

---

## 💰 Cost Management and Optimization

```javascript
// /src/services/ai/cost-manager.js
export class ClaudeCostManager {
  constructor(db, cache) {
    this.db = db;
    this.cache = cache;
    
    // Current pricing (as of 2025-08-21)
    this.pricing = {
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
    };
  }
  
  calculateCost(usage, model) {
    const modelPricing = this.pricing[model];
    if (!modelPricing || !usage) return 0;
    
    return (
      (usage.input_tokens * modelPricing.input / 1000) +
      (usage.output_tokens * modelPricing.output / 1000)
    );
  }
  
  async trackUsage(feature, userId, usage, model) {
    const cost = this.calculateCost(usage, model);
    
    await this.db.execute(`
      INSERT INTO ai_usage_tracking 
      (id, user_id, feature, model, input_tokens, output_tokens, cost, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      userId,
      feature, 
      model,
      usage.input_tokens,
      usage.output_tokens,
      cost
    ]);
  }
  
  async getUserUsageSummary(userId, dateRange = '30 days') {
    return await this.db.query(`
      SELECT 
        feature,
        COUNT(*) as requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost
      FROM ai_usage_tracking
      WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY feature
      ORDER BY total_cost DESC
    `, [userId, parseInt(dateRange)]);
  }
  
  async getPlatformUsageMetrics() {
    const metrics = await this.db.query(`
      SELECT 
        DATE(timestamp) as date,
        feature,
        model,
        COUNT(*) as requests,
        SUM(cost) as daily_cost,
        AVG(input_tokens + output_tokens) as avg_tokens_per_request
      FROM ai_usage_tracking
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(timestamp), feature, model
      ORDER BY date DESC, daily_cost DESC
    `);
    
    return metrics;
  }
  
  // Implement usage limits to prevent runaway costs
  async checkUserLimits(userId, feature) {
    const dailyUsage = await this.db.query(`
      SELECT SUM(cost) as daily_cost, COUNT(*) as daily_requests
      FROM ai_usage_tracking
      WHERE user_id = ? AND feature = ? AND DATE(timestamp) = CURDATE()
    `, [userId, feature]);
    
    const limits = {
      'nutrition_advice': { daily_cost: 5.00, daily_requests: 50 },
      'supplier_recommendations': { daily_cost: 2.00, daily_requests: 20 },
      'content_moderation': { daily_cost: 1.00, daily_requests: 100 },
      'customer_support': { daily_cost: 3.00, daily_requests: 30 }
    };
    
    const featureLimit = limits[feature];
    if (!featureLimit) return { allowed: true };
    
    return {
      allowed: dailyUsage.daily_cost < featureLimit.daily_cost && 
               dailyUsage.daily_requests < featureLimit.daily_requests,
      current_cost: dailyUsage.daily_cost,
      current_requests: dailyUsage.daily_requests,
      limit_cost: featureLimit.daily_cost,
      limit_requests: featureLimit.daily_requests
    };
  }
}
```

---

## 📈 Performance Monitoring and Analytics

```javascript
// /src/services/ai/analytics.js
export class ClaudeAnalyticsService {
  constructor(db) {
    this.db = db;
  }
  
  async trackAIPerformance(feature, model, responseTime, tokenUsage, userSatisfaction = null) {
    await this.db.execute(`
      INSERT INTO ai_performance_metrics 
      (id, feature, model, response_time_ms, tokens_used, user_satisfaction, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      feature,
      model, 
      responseTime,
      tokenUsage.total_tokens,
      userSatisfaction
    ]);
  }
  
  async getPerformanceReport(timeRange = '7 days') {
    const report = await this.db.query(`
      SELECT 
        feature,
        model,
        COUNT(*) as total_requests,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        AVG(tokens_used) as avg_tokens,
        AVG(user_satisfaction) as avg_satisfaction,
        SUM(CASE WHEN response_time_ms > 5000 THEN 1 ELSE 0 END) as slow_requests
      FROM ai_performance_metrics
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY feature, model
      ORDER BY total_requests DESC
    `, [parseInt(timeRange)]);
    
    return {
      performance_summary: report,
      recommendations: this.generatePerformanceRecommendations(report),
      generated_at: new Date().toISOString()
    };
  }
  
  generatePerformanceRecommendations(performanceData) {
    const recommendations = [];
    
    for (let metric of performanceData) {
      // Recommend model downgrades for simple queries with slow response times
      if (metric.avg_response_time > 3000 && metric.model.includes('opus')) {
        recommendations.push({
          type: 'model_optimization',
          message: `Consider using Sonnet instead of Opus for ${metric.feature} to improve response time`,
          potential_savings: '60% faster responses, 80% cost reduction'
        });
      }
      
      // Flag features with low satisfaction
      if (metric.avg_satisfaction && metric.avg_satisfaction < 3.5) {
        recommendations.push({
          type: 'quality_improvement',
          message: `${metric.feature} has low user satisfaction (${metric.avg_satisfaction}/5)`,
          suggestion: 'Review system prompts and response quality'
        });
      }
      
      // Suggest caching for frequently requested similar queries
      if (metric.total_requests > 100) {
        recommendations.push({
          type: 'caching_opportunity',
          message: `${metric.feature} has high request volume - implement semantic caching`,
          potential_savings: '30-50% cost reduction'
        });
      }
    }
    
    return recommendations;
  }
}
```

---

## 🔧 Error Handling and Fallbacks

```javascript
// /src/services/ai/error-handler.js
export class ClaudeErrorHandler {
  constructor(db, notifications) {
    this.db = db;
    this.notifications = notifications;
  }
  
  async handleAPIError(error, context) {
    const errorInfo = {
      id: crypto.randomUUID(),
      error_type: this.classifyError(error),
      error_message: error.message,
      error_code: error.code,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    };
    
    // Log error for analysis
    await this.db.execute(`
      INSERT INTO ai_errors 
      (id, error_type, error_message, error_code, context, timestamp)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      errorInfo.id,
      errorInfo.error_type,
      errorInfo.error_message,
      errorInfo.error_code,
      errorInfo.context
    ]);
    
    // Handle different error types
    switch (errorInfo.error_type) {
      case 'rate_limit':
        return this.handleRateLimitError(context);
        
      case 'token_limit':
        return this.handleTokenLimitError(context);
        
      case 'api_key':
        return this.handleAPIKeyError(context);
        
      case 'network':
        return this.handleNetworkError(context);
        
      default:
        return this.handleGenericError(context);
    }
  }
  
  classifyError(error) {
    if (error.message?.includes('rate limit')) return 'rate_limit';
    if (error.message?.includes('token')) return 'token_limit';
    if (error.message?.includes('api key') || error.message?.includes('unauthorized')) return 'api_key';
    if (error.message?.includes('network') || error.message?.includes('timeout')) return 'network';
    return 'unknown';
  }
  
  async handleRateLimitError(context) {
    // Implement exponential backoff retry
    const retryDelay = Math.min(1000 * Math.pow(2, context.retry_count || 0), 30000);
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    return {
      retry: true,
      delay: retryDelay,
      fallback_response: "I'm experiencing high demand right now. Please try again in a few moments.",
      user_message: "Our AI assistant is busy helping other users. Your request will be processed shortly."
    };
  }
  
  async handleTokenLimitError(context) {
    // Try with a smaller context or different model
    return {
      retry: true,
      modify_request: true,
      changes: {
        max_tokens: Math.floor((context.max_tokens || 1000) * 0.7),
        model: context.model === 'claude-3-opus-20240229' ? 'claude-3-sonnet-20240229' : context.model
      },
      user_message: "Let me provide a more concise response."
    };
  }
  
  async handleAPIKeyError(context) {
    // Alert administrators immediately
    await this.notifications.sendAdminAlert({
      type: 'critical',
      message: 'Claude API key error detected',
      context: context
    });
    
    return {
      retry: false,
      fallback_response: "I'm currently unavailable due to a technical issue. Please contact our support team.",
      escalate_to_human: true
    };
  }
  
  generateFallbackResponse(feature, context) {
    const fallbacks = {
      'nutrition_advice': "I'm currently unable to provide personalized nutrition advice. Please consult with your veterinarian for specific dietary recommendations.",
      'supplier_recommendations': "I can't analyze suppliers right now, but you can browse our directory using the search and filter options.",
      'content_moderation': "Content review is temporarily unavailable. Your content will be reviewed by our team shortly.",
      'customer_support': "I'm experiencing technical difficulties. Please email support@rawgle.com for immediate assistance."
    };
    
    return fallbacks[feature] || "I'm temporarily unavailable. Please try again shortly.";
  }
}
```

---

## 🔧 Implementation Checklist

```markdown
# Claude AI Integration Implementation Checklist

## Phase 1: Foundation Setup
- [ ] Install Anthropic SDK and configure Cloudflare AI Gateway
- [ ] Set up environment variables and API key management
- [ ] Create base ClaudeService class with model selection logic
- [ ] Implement cost tracking and usage monitoring
- [ ] Set up error handling and fallback mechanisms

## Phase 2: Core AI Services  
- [ ] Nutrition Advisory Service with pet profile integration
- [ ] Supplier Recommendation engine with preference analysis
- [ ] Content Moderation for reviews and user-generated content
- [ ] Customer Support chatbot with conversation memory
- [ ] Streaming responses for real-time interactions

## Phase 3: Advanced Features
- [ ] Personalized content generation based on user data
- [ ] Sentiment analysis for review insights
- [ ] Automated email/notification content generation  
- [ ] Multi-language support for international expansion
- [ ] Voice integration for accessibility

## Phase 4: Optimization & Monitoring
- [ ] Response caching system for common queries
- [ ] Performance monitoring and analytics dashboard
- [ ] A/B testing framework for prompt optimization
- [ ] Cost optimization based on usage patterns
- [ ] User satisfaction tracking and feedback loops

## Phase 5: Integration & Testing
- [ ] Frontend integration with real-time updates
- [ ] WebSocket support for streaming responses  
- [ ] Mobile API optimization for lower bandwidth
- [ ] Comprehensive testing suite for AI features
- [ ] Documentation and developer guides
```

This architecture provides a comprehensive foundation for integrating Claude AI throughout the Rawgle platform, with emphasis on performance, cost management, and user experience optimization.