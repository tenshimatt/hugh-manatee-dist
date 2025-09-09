import express from 'express';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Validation schemas
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000),
  timestamp: z.string().optional(),
});

const petContextSchema = z.object({
  petName: z.string().optional(),
  breed: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  activityLevel: z.enum(['low', 'moderate', 'high']).optional(),
  healthConditions: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  currentDiet: z.string().optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  petContext: petContextSchema.optional(),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(50).max(1000).default(600),
  stream: z.boolean().default(false),
});

// System prompt for raw pet nutrition expert
const getSystemPrompt = (petContext?: z.infer<typeof petContextSchema>): string => {
  const basePrompt = `You are RAWGLE AI, an expert in raw pet nutrition with deep knowledge of:

🥩 RAW FEEDING EXPERTISE:
- Balanced raw diet formulations (80/10/10 rule)
- Portion calculations based on pet weight and activity
- Safe food handling and preparation methods
- Protein rotation and variety principles
- Transition protocols from processed to raw food

🏥 HEALTH & SAFETY FOCUS:
- Toxic foods identification and avoidance
- Safe vs. dangerous ingredients for pets
- Digestive health during dietary transitions
- Special dietary needs for health conditions
- Emergency signs requiring veterinary attention

📊 PERSONALIZED GUIDANCE:
- Age-specific feeding (puppy, adult, senior)
- Weight management strategies
- Activity-level adjustments
- Breed-specific considerations
- Medical condition adaptations

COMMUNICATION STYLE:
- Friendly, encouraging, and professional
- Use bullet points and clear structure
- Include practical examples and measurements
- Always prioritize pet safety over convenience
- Provide disclaimers about veterinary consultation

IMPORTANT SAFETY RULE:
Always emphasize that your advice is educational and doesn't replace professional veterinary consultation, especially for pets with existing health conditions or concerning symptoms.`;

  if (petContext) {
    const contextInfo = [
      petContext.petName && `Pet: ${petContext.petName}`,
      petContext.breed && `Breed: ${petContext.breed}`,
      petContext.age && `Age: ${petContext.age} years`,
      petContext.weight && `Weight: ${petContext.weight} lbs`,
      petContext.activityLevel && `Activity Level: ${petContext.activityLevel}`,
      petContext.currentDiet && `Current Diet: ${petContext.currentDiet}`,
      petContext.healthConditions?.length && `Health Conditions: ${petContext.healthConditions.join(', ')}`,
      petContext.dietaryRestrictions?.length && `Dietary Restrictions: ${petContext.dietaryRestrictions.join(', ')}`
    ].filter(Boolean).join('\n');

    return `${basePrompt}\n\nCURRENT PET CONTEXT:\n${contextInfo}\n\nPlease provide personalized advice based on this specific pet's information.`;
  }

  return basePrompt;
};

// Rate limiting key generator
const getRateLimitKey = (ip: string, userId?: string): string => {
  return userId ? `chat_rate_limit:${userId}` : `chat_rate_limit:${ip}`;
};

// Check rate limits
const checkRateLimit = async (key: string, limit: number = 5, window: number = 3600): Promise<boolean> => {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    return current <= limit;
  } catch (error) {
    logger.warn('Rate limit check failed, allowing request', { error: error.message });
    return true;
  }
};

// Chat completion endpoint
router.post('/completions', async (req, res) => {
  try {
    // Validate request body
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid request format',
          details: validationResult.error.errors
        }
      });
    }

    const { messages, petContext, model, temperature, maxTokens, stream } = validationResult.data;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Rate limiting
    const rateLimitKey = getRateLimitKey(clientIp);
    const withinLimit = await checkRateLimit(rateLimitKey, 10, 3600); // 10 requests per hour
    
    if (!withinLimit) {
      return res.status(429).json({
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          type: 'rate_limit_exceeded',
          retryAfter: 3600
        }
      });
    }

    // Use mock responses when OpenAI API key is not configured
    if (!process.env.OPENAI_API_KEY) {
      const mockResponse = generateMockResponse(messages[messages.length - 1]?.content || '', petContext);
      
      const completion = {
        id: `chatcmpl-mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'rawgle-ai-demo',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: mockResponse
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: messages.reduce((acc, msg) => acc + msg.content.length / 4, 0),
          completion_tokens: mockResponse.length / 4,
          total_tokens: (messages.reduce((acc, msg) => acc + msg.content.length / 4, 0)) + (mockResponse.length / 4)
        }
      };

      logger.info('Mock chat completion generated', {
        messageCount: messages.length,
        hasPetContext: !!petContext,
        responseLength: mockResponse.length
      });

      return res.json(completion);
    }

    // Prepare messages for OpenAI
    const systemMessage = {
      role: 'system' as const,
      content: getSystemPrompt(petContext)
    };

    const apiMessages = [
      systemMessage,
      ...messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Create OpenAI completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: apiMessages,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false // Handle streaming separately
    });

    logger.info('OpenAI chat completion created', {
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens,
      messageCount: messages.length,
      hasPetContext: !!petContext
    });

    res.json(completion);

  } catch (error: any) {
    logger.error('Chat completion error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        error: {
          message: 'OpenAI API quota exceeded. Please try again later.',
          type: 'quota_exceeded'
        }
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: {
          message: 'OpenAI rate limit exceeded. Please try again later.',
          type: 'rate_limit_exceeded'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Internal server error occurred while processing chat request',
        type: 'internal_error'
      }
    });
  }
});

// Streaming chat completion endpoint
router.post('/completions/stream', async (req, res) => {
  try {
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid request format',
          details: validationResult.error.errors
        }
      });
    }

    const { messages, petContext, model, temperature, maxTokens } = validationResult.data;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Rate limiting
    const rateLimitKey = getRateLimitKey(clientIp);
    const withinLimit = await checkRateLimit(rateLimitKey, 5, 3600); // 5 streaming requests per hour
    
    if (!withinLimit) {
      return res.status(429).json({
        error: {
          message: 'Rate limit exceeded for streaming. Please try again later.',
          type: 'rate_limit_exceeded'
        }
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Use mock streaming when API key not available
    if (!process.env.OPENAI_API_KEY) {
      const mockResponse = generateMockResponse(messages[messages.length - 1]?.content || '', petContext);
      const words = mockResponse.split(' ');
      
      let wordIndex = 0;
      const streamInterval = setInterval(() => {
        if (wordIndex >= words.length) {
          res.write('data: [DONE]\n\n');
          res.end();
          clearInterval(streamInterval);
          return;
        }

        const chunkSize = Math.floor(Math.random() * 3) + 2;
        const wordsToSend = words.slice(wordIndex, wordIndex + chunkSize);
        const content = wordsToSend.join(' ') + (wordIndex + chunkSize < words.length ? ' ' : '');
        
        const chunk = {
          id: `chatcmpl-mock-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'rawgle-ai-demo',
          choices: [{
            index: 0,
            delta: { content },
            finish_reason: wordIndex + chunkSize >= words.length ? 'stop' : null
          }]
        };

        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        wordIndex += chunkSize;
      }, Math.random() * 100 + 50);

      req.on('close', () => {
        clearInterval(streamInterval);
      });

      return;
    }

    // OpenAI streaming implementation
    const systemMessage = {
      role: 'system' as const,
      content: getSystemPrompt(petContext)
    };

    const apiMessages = [
      systemMessage,
      ...messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const stream = await openai.chat.completions.create({
      model: model,
      messages: apiMessages,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

    logger.info('OpenAI streaming completion completed', {
      model: model,
      messageCount: messages.length,
      hasPetContext: !!petContext
    });

  } catch (error: any) {
    logger.error('Streaming chat error:', {
      error: error.message,
      stack: error.stack
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Streaming error occurred',
          type: 'streaming_error'
        }
      });
    }
  }
});

// Usage tracking endpoint
router.get('/usage', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitKey = getRateLimitKey(clientIp);
    
    const usedCount = await redis.get(rateLimitKey) || '0';
    const ttl = await redis.ttl(rateLimitKey);
    
    res.json({
      used: parseInt(usedCount),
      limit: 10,
      resetTime: new Date(Date.now() + (ttl * 1000)).toISOString(),
      remaining: Math.max(0, 10 - parseInt(usedCount))
    });
  } catch (error: any) {
    logger.error('Usage check error:', error);
    res.json({
      used: 0,
      limit: 10,
      resetTime: new Date(Date.now() + 3600000).toISOString(),
      remaining: 10
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({
    status: 'healthy',
    openai: {
      configured: hasApiKey,
      mode: hasApiKey ? 'live' : 'mock'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced mock response generator with pet context
function generateMockResponse(userMessage: string, petContext?: z.infer<typeof petContextSchema>): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Personalized portion calculations with pet context
  if (lowerMessage.includes('portion') || lowerMessage.includes('how much') || lowerMessage.includes('calculate')) {
    const petInfo = petContext ? `for ${petContext.petName || 'your pet'}` : '';
    const weightInfo = petContext?.weight ? ` (${petContext.weight} lbs)` : '';
    const activityAdjustment = petContext?.activityLevel === 'high' ? 
      '\n\n🏃 **Your pet is highly active** - increase portions by 25-35% from the base calculation.' :
      petContext?.activityLevel === 'low' ?
      '\n\n🛋️ **Your pet is less active** - decrease portions by 15-25% from the base calculation.' : '';

    return `## Daily Portion Guidelines ${petInfo}${weightInfo}

**Basic Formula:** 2-3% of body weight for adult dogs, 2-4% for puppies

### Examples:
• **50 lb adult dog:** 1.0-1.5 lbs daily (16-24 oz)
• **20 lb cat:** 6-8 oz daily  
• **80 lb active dog:** 1.6-2.4 lbs daily
• **10 lb puppy:** 3.2-6.4 oz daily

### Adjustments:
🏃 **Active pets:** Increase by 25-50%
🛋️ **Less active:** Decrease by 10-25%
⚖️ **Weight management:** Monitor and adjust weekly

### Meal Distribution:
• **Puppies (under 6 months):** 3-4 meals daily
• **Adult dogs:** 2 meals daily  
• **Senior pets:** 2 smaller meals

**💡 Pro Tip:** Start with the lower percentage and adjust based on your pet's body condition.${activityAdjustment}

**⚠️ Disclaimer:** These are general guidelines. Individual needs vary based on metabolism, activity, and health status.`;
  }

  // Health condition specific advice
  if (petContext?.healthConditions?.length && (
    lowerMessage.includes('health') || 
    lowerMessage.includes('condition') || 
    lowerMessage.includes('diet') ||
    petContext.healthConditions.some(condition => 
      lowerMessage.includes(condition.toLowerCase())
    )
  )) {
    const conditions = petContext.healthConditions.join(', ');
    return `## Raw Feeding with Health Conditions

I see that ${petContext.petName || 'your pet'} has the following health condition(s): **${conditions}**

### General Health-Conscious Approach:
✅ **Consult your veterinarian** before making dietary changes
✅ **Start transitions slowly** (2-3 weeks instead of 1-2)  
✅ **Monitor symptoms closely** during diet changes
✅ **Keep detailed food logs** to track improvements
✅ **Choose high-quality, fresh ingredients**

### Common Considerations:
• **Kidney issues:** Reduce phosphorus (less bone), increase moisture
• **Liver problems:** Moderate protein levels, avoid excessive organs
• **Digestive sensitivities:** Single protein source, bone-free initially  
• **Arthritis:** Anti-inflammatory foods (fish, turmeric)
• **Allergies:** Novel proteins, elimination diet approach

### Red Flags to Watch:
🚩 Worsening of existing symptoms
🚩 New digestive issues lasting >48 hours
🚩 Changes in drinking or urination
🚩 Lethargy or appetite loss

**⚠️ CRITICAL:** Work closely with your veterinarian throughout any dietary transition. They may want to monitor bloodwork or other health markers during the switch to raw feeding.

**💡 Consider:** A veterinary nutritionist consultation for a customized plan given ${petContext.petName || 'your pet'}'s specific health needs.`;
  }

  // Default responses based on content...
  if (lowerMessage.includes('transition') || lowerMessage.includes('switch') || lowerMessage.includes('start')) {
    const petName = petContext?.petName ? `${petContext.petName}` : 'your pet';
    const ageAdjustment = petContext?.age && petContext.age > 7 ? 
      '\n\n👴 **Senior Pet Consideration:** Extend transition to 3-4 weeks for easier adjustment.' :
      petContext?.age && petContext.age < 1 ?
      '\n\n🐶 **Puppy Consideration:** Puppies adapt faster but monitor closely for digestive upset.' : '';

    return `## Safe Transition to Raw Feeding for ${petName}

### 10-14 Day Transition Plan:

**Days 1-3:** 
• 75% current food + 25% raw
• Monitor for digestive upset

**Days 4-6:**
• 50% current food + 50% raw  
• Continue monitoring

**Days 7-10:**
• 25% current food + 75% raw
• Most pets adjust well here

**Days 11+:**
• 100% raw food
• Full transition complete

### Important Tips:
✅ **Fast for 12 hours** before first raw meal
✅ **Start with bland proteins** (chicken, turkey)
✅ **Introduce one protein at a time**
✅ **Keep meals simple initially**

### Red Flags to Watch:
🚩 Persistent diarrhea (>3 days)
🚩 Vomiting multiple times
🚩 Loss of appetite for >24 hours  
🚩 Lethargy or behavioral changes

**If issues arise:** Slow down the transition or consult your vet.${ageAdjustment}

**⚠️ Important:** Always consult your veterinarian before starting, especially for pets with health conditions.`;
  }

  // Add more contextual responses as needed...

  // Default comprehensive welcome
  const petGreeting = petContext?.petName ? `Hello ${petContext.petName}'s human! 👋` : `Hello! 👋`;
  
  return `# ${petGreeting} Welcome to RAWGLE AI! 🤖

I'm your expert guide for **raw pet nutrition**. I can help you with:

## 🥩 **Nutrition Planning**
• Daily portion calculations
• Balanced diet formulation (80/10/10 rule)
• Protein rotation schedules  
• Meal prep strategies

## 🛡️ **Food Safety**
• Safe vs. dangerous ingredients
• Proper food handling
• Storage and preparation tips
• Recognizing spoilage signs

## 🔄 **Transition Support** 
• Step-by-step transition plans
• Managing digestive adjustments
• Troubleshooting common issues
• When to slow down or seek help

## ⚖️ **Special Situations**
• Puppies and kittens
• Senior pet considerations
• Weight management
• Health condition modifications

## 💰 **Budget Management**
• Cost-effective protein sources  
• Bulk buying strategies
• Finding local suppliers
• Meal planning for savings

### Quick Examples:
💬 *"How much should I feed my 60 lb Labrador?"*
💬 *"What foods should I never give my cat?"*  
💬 *"How do I transition my puppy to raw food?"*
💬 *"My dog needs to lose weight - help me plan meals"*

**🎯 Ask me anything specific!** The more details you provide about your pet (age, weight, breed, health status), the more personalized my guidance can be.

---
**⚠️ Important Disclaimer:** My advice is educational and doesn't replace professional veterinary consultation, especially for pets with health conditions or concerns.`;
}

export { router as chatRouter };