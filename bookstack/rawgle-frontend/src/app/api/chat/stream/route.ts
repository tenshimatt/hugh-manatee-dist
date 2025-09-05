import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are a knowledgeable raw pet food expert assistant. Provide helpful advice about raw feeding for dogs and cats. Always include a disclaimer that your advice doesn't replace veterinary consultation. Focus on: nutrition balance, portion sizes, food safety, transition tips, and common concerns.

Keep responses concise (under 500 tokens), friendly, and actionable. Use bullet points for lists and always prioritize pet safety.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = 'gpt-4', temperature = 0.7, max_tokens = 500 } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: { message: 'Messages array is required' } },
        { status: 400 }
      );
    }

    // Use mock streaming responses when OpenAI API key is not configured
    if (!process.env.OPENAI_API_KEY) {
      return createMockStreamingResponse(messages[messages.length - 1]?.content || '');
    }

    // For this demo, we'll use mock streaming
    // In production, you would use the OpenAI streaming API:
    /*
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: temperature,
      max_tokens: max_tokens,
      stream: true
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = JSON.stringify({
                id: chunk.id,
                object: 'chat.completion.chunk',
                created: chunk.created,
                model: chunk.model,
                choices: [{
                  index: 0,
                  delta: { content },
                  finish_reason: chunk.choices[0]?.finish_reason || null
                }]
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    */

    return createMockStreamingResponse(messages[messages.length - 1]?.content || '');

  } catch (error: any) {
    console.error('Streaming Chat API Error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}

// Mock streaming response generator
function createMockStreamingResponse(userMessage: string): Response {
  const response = generateMockResponse(userMessage);
  const words = response.split(' ');
  
  const encoder = new TextEncoder();
  let wordIndex = 0;
  
  const readable = new ReadableStream({
    start(controller) {
      const sendNextChunk = () => {
        if (wordIndex >= words.length) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // Send 2-4 words per chunk for realistic streaming
        const chunkSize = Math.floor(Math.random() * 3) + 2; // 2-4 words
        const wordsToSend = words.slice(wordIndex, wordIndex + chunkSize);
        const content = wordsToSend.join(' ') + (wordIndex + chunkSize < words.length ? ' ' : '');
        
        const data = JSON.stringify({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4',
          choices: [{
            index: 0,
            delta: { content },
            finish_reason: wordIndex + chunkSize >= words.length ? 'stop' : null
          }]
        });

        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        wordIndex += chunkSize;

        // Random delay between chunks (50-150ms for natural typing feel)
        setTimeout(sendNextChunk, Math.random() * 100 + 50);
      };

      // Start sending chunks after a brief initial delay
      setTimeout(sendNextChunk, 200);
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

// Enhanced mock response generator (same as main chat route)
function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('portion') || lowerMessage.includes('how much') || lowerMessage.includes('calculate')) {
    return `## Daily Portion Guidelines

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

**💡 Pro Tip:** Start with the lower percentage and adjust based on your pet's body condition.

**⚠️ Disclaimer:** These are general guidelines. Individual needs vary based on metabolism, activity, and health status.`;
  }

  if (lowerMessage.includes('transition') || lowerMessage.includes('switch') || lowerMessage.includes('start')) {
    return `## Safe Transition to Raw Feeding

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

**If issues arise:** Slow down the transition or consult your vet.

**⚠️ Important:** Always consult your veterinarian before starting, especially for pets with health conditions.`;
  }

  if (lowerMessage.includes('safe') || lowerMessage.includes('avoid') || lowerMessage.includes('toxic') || lowerMessage.includes('dangerous')) {
    return `## Raw Feeding Safety Guide

### 🚫 NEVER FEED:
• **Cooked bones** (can splinter and cause blockages)
• **Onions & garlic** (toxic to dogs and cats)
• **Grapes & raisins** (kidney failure risk)
• **Chocolate** (theobromine toxicity)
• **Xylitol** (artificial sweetener - deadly)
• **Avocado pits/skin** (persin toxicity)
• **Macadamia nuts** (neurological issues)

### ⚠️ USE CAUTION:
• **Weight-bearing bones from large animals** (tooth fractures)
• **Fish with small bones** (choking hazard)
• **Raw salmon** (salmon poisoning in dogs)
• **Pork** (trichinosis risk - freeze first)

### ✅ SAFE RAW FOODS:
• **Muscle meat:** Chicken, beef, lamb, turkey, duck
• **Organ meat:** Liver, kidney, heart, spleen
• **Raw meaty bones:** Chicken necks, wings, backs
• **Fish:** Sardines, mackerel (boneless)
• **Eggs:** Including shells for calcium

### Food Handling Safety:
🧊 Keep frozen until ready to use
🧼 Wash hands and surfaces thoroughly
🍽️ Use separate cutting boards for raw meat
❄️ Thaw in refrigerator, not at room temperature
⏰ Don't leave raw food out for >30 minutes

**⚠️ Remember:** When in doubt, don't feed it. Your pet's safety comes first.`;
  }

  if (lowerMessage.includes('nutrition') || lowerMessage.includes('balance') || lowerMessage.includes('80/10/10') || lowerMessage.includes('barf')) {
    return `## Balanced Raw Diet Formula (80/10/10 Rule)

### Daily Nutrition Breakdown:

**🥩 80% Muscle Meat:**
• Chicken thighs, breast, ground meat
• Beef (chuck, ground, heart)
• Lamb, turkey, duck, venison
• Fish (salmon, mackerel, sardines)

**🦴 10% Raw Edible Bone:**
• Chicken necks, wings, backs
• Turkey necks (for larger dogs)
• Duck necks and frames
• Fish heads and frames

**🫘 5% Liver (Secreting Organs):**
• Beef, chicken, lamb liver
• Essential for Vitamin A
• Don't exceed 5% - can cause loose stools

**🫀 5% Other Organs (Non-Secreting):**
• Kidney, spleen, pancreas
• Heart, lung, thymus
• Brain, testicles (if available)

### Weekly Protein Rotation:
📅 **Monday-Tuesday:** Chicken
📅 **Wednesday-Thursday:** Beef  
📅 **Friday-Saturday:** Lamb
📅 **Sunday:** Fish or novel protein

### Additional Nutrients:
🥚 **Eggs:** 2-3 per week (including shells)
🐟 **Fish oil:** For omega-3s (if not feeding whole fish)
🥬 **Vegetables:** Optional 5-10% (dogs only)

### Supplements to Consider:
• **Vitamin E** (if feeding lots of fish)
• **Kelp** (natural iodine source)
• **Probiotics** (during transition)

**💡 Pro Tip:** Variety is key! Rotate proteins and organs to ensure nutritional completeness.

**⚠️ Important:** This is a general framework. Consult a veterinary nutritionist for specific health conditions.`;
  }

  // Default comprehensive response
  return `# Welcome to RAWGLE AI! 🤖

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