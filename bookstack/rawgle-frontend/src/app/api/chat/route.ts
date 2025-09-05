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
    const { messages, model = 'gpt-4', temperature = 0.7, max_tokens = 500, stream = false } = body;

    // Use mock responses when OpenAI API key is not configured
    if (!process.env.OPENAI_API_KEY) {
      const completion = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: generateMockResponse(messages[messages.length - 1]?.content || '')
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150
        }
      };

      return NextResponse.json(completion);
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: { message: 'Messages array is required' } },
        { status: 400 }
      );
    }

    // For this demo, we'll use a simple mock response
    // In production, you would use the OpenAI API
    const completion = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: generateMockResponse(messages[messages.length - 1]?.content || '')
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150
      }
    };

    return NextResponse.json(completion);

    // Uncomment this for real OpenAI integration:
    /*
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: stream
    });

    return NextResponse.json(completion);
    */
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}

// Enhanced mock response generator with more comprehensive guidance
function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Portion calculations
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

  // Transition guidance
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

  // Food safety
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

  // Nutrition and balance
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

  // Weight management
  if (lowerMessage.includes('weight') || lowerMessage.includes('fat') || lowerMessage.includes('overweight') || lowerMessage.includes('lose')) {
    return `## Weight Management with Raw Feeding

### For Overweight Pets:

**📉 Calorie Reduction:**
• Reduce portions by 20-25%
• Increase protein percentage to maintain muscle
• Choose leaner cuts (chicken breast vs. thigh)

**🏃‍♂️ Exercise Plan:**
• Increase daily walks gradually
• Swimming (excellent low-impact exercise)
• Interactive play sessions

**📊 Monitoring:**
• Weekly weigh-ins (same day, same time)
• Body condition scoring
• Adjust portions based on progress

### For Underweight Pets:

**📈 Calorie Increase:**
• Add 25-50% more food
• Include fattier cuts (duck, lamb)
• Add healthy fats (fish oil, egg yolks)

**⏰ Meal Frequency:**
• Increase to 3-4 smaller meals
• Easier digestion and absorption

### Healthy Weight Maintenance:
✅ **Ribs easily felt but not visible**
✅ **Visible waist tuck when viewed from side**
✅ **Hourglass shape when viewed from above**

**Target Weight Loss:** 1-2% of body weight per week

**⚠️ Important:** Sudden weight changes may indicate health issues. Always consult your vet for proper diagnosis and monitoring.`;
  }

  // Puppy/kitten specific
  if (lowerMessage.includes('puppy') || lowerMessage.includes('kitten') || lowerMessage.includes('young') || lowerMessage.includes('growth')) {
    return `## Raw Feeding for Growing Pets

### Puppy Guidelines (8 weeks - 12 months):

**📈 Portion Sizes:**
• **8-12 weeks:** 8-10% of body weight daily
• **3-6 months:** 6-8% of body weight daily
• **6-12 months:** 4-6% of body weight daily
• **12+ months:** Adult portions (2-3%)

**🍽️ Meal Frequency:**
• **8-12 weeks:** 4 meals daily
• **3-6 months:** 3 meals daily
• **6+ months:** 2 meals daily

### Kitten Guidelines (8 weeks - 12 months):

**📈 Portion Sizes:**
• **8-16 weeks:** 10-13% of body weight daily
• **4-6 months:** 6-8% of body weight daily
• **6-12 months:** 4-6% of body weight daily

### Growth-Specific Needs:
🦴 **Higher calcium requirements** (more bone content)
💪 **Higher protein needs** (muscle development)
🧠 **DHA for brain development** (fish, eggs)

### Safe Bones for Young Pets:
✅ Chicken necks and wings
✅ Turkey necks (for larger puppies)
✅ Duck necks
❌ Avoid large weight-bearing bones

**⚠️ Growth Monitoring:** Weekly weigh-ins are crucial. Puppies should gain 2-4 lbs per week depending on breed size.

**⚠️ Important:** Growing pets have unique nutritional needs. Work closely with your vet to ensure proper development.`;
  }

  // Senior pet considerations
  if (lowerMessage.includes('senior') || lowerMessage.includes('old') || lowerMessage.includes('elderly') || lowerMessage.includes('aging')) {
    return `## Raw Feeding for Senior Pets

### Special Considerations (7+ years dogs, 10+ years cats):

**🦷 Dental Health:**
• Softer bones (ground or smaller pieces)
• Ground raw diet if tooth issues
• Regular dental checkups

**💊 Common Health Issues:**
• **Kidney disease:** Lower phosphorus (less bone)
• **Arthritis:** Anti-inflammatory foods (fish, turmeric)
• **Digestive issues:** Smaller, more frequent meals
• **Cancer:** Higher fat, lower carbohydrate

### Modified Feeding Approach:
🍽️ **Smaller meals** (2-3 times daily)
💧 **Higher moisture content** (add bone broth)
🐟 **More fish** (omega-3 for joint health)
🫘 **Gentle on organs** (support liver/kidney function)

### Beneficial Additions:
• **Bone broth** (joint support, hydration)
• **Fermented vegetables** (digestive health)
• **Coconut oil** (medium-chain fatty acids)
• **Turmeric** (anti-inflammatory)

### Warning Signs to Monitor:
⚠️ Changes in appetite or drinking
⚠️ Difficulty chewing or swallowing
⚠️ Lethargy or mobility issues
⚠️ Changes in bathroom habits

**💡 Pro Tip:** Senior pets may need more frequent vet checkups to monitor organ function and adjust diet accordingly.

**⚠️ Important:** Age-related health conditions may require dietary modifications. Work with your vet for the best approach.`;
  }

  // General ingredient questions
  if (lowerMessage.includes('ingredient') || lowerMessage.includes('what can') || lowerMessage.includes('foods')) {
    return `## Raw Feeding Ingredient Guide

### 🥩 EXCELLENT PROTEIN SOURCES:
• **Chicken:** Affordable, well-tolerated
• **Beef:** Nutrient-dense, higher in iron
• **Lamb:** Novel protein, good for allergies
• **Duck:** Higher fat, great for underweight pets
• **Turkey:** Lean, good alternative to chicken
• **Fish:** Omega-3s, brain health
• **Venison/Rabbit:** Novel proteins for sensitivities

### 🫘 ESSENTIAL ORGANS:
• **Liver (5%):** Vitamin A powerhouse
• **Kidney:** B vitamins, excellent nutrition
• **Heart:** Technically muscle meat, rich in CoQ10
• **Spleen:** Iron and B vitamins
• **Pancreas:** Natural enzymes

### 🦴 SAFE BONES:
• **Chicken necks/wings:** Perfect size for most dogs
• **Turkey necks:** Great for large dogs
• **Fish heads/frames:** Soft, edible bones
• **Beef ribs (cut small):** For supervised chewing

### 🥬 OPTIONAL VEGETABLES (Dogs only):
• **Leafy greens:** Spinach, kale (small amounts)
• **Cruciferous:** Broccoli, cauliflower
• **Root vegetables:** Carrots, sweet potato
• **Berries:** Blueberries, cranberries

### 🚫 AVOID COMPLETELY:
• Cooked bones, onions, garlic, grapes
• Chocolate, xylitol, macadamia nuts
• Raw pork (unless frozen 3+ weeks)
• Fish with small bones (trout, bass)

**💡 Preparation Tips:**
- Freeze meat for 24-48 hours to eliminate parasites
- Grind bones if your pet can't handle whole pieces
- Rotate proteins weekly for nutritional variety

**⚠️ Remember:** Introduce new ingredients gradually to avoid digestive upset.`;
  }

  // Cost and budgeting
  if (lowerMessage.includes('cost') || lowerMessage.includes('budget') || lowerMessage.includes('expensive') || lowerMessage.includes('cheap')) {
    return `## Budget-Friendly Raw Feeding

### 💰 Cost-Saving Strategies:

**🛒 Buying Tips:**
• **Buy in bulk** (split with other raw feeders)
• **Whole animals** (cheaper per pound)
• **Manager's special** meat (freeze immediately)
• **Local farms** (often cheaper than stores)
• **Ethnic markets** (organs often very affordable)

**📅 Weekly Budget Breakdown (50 lb dog):**
• **Muscle meat (80%):** $15-25
• **Organs (10%):** $3-5
• **Bones (10%):** $2-4
• **Total weekly:** $20-34
• **Monthly cost:** $80-136

### 🥩 Affordable Protein Sources:
• **Chicken leg quarters:** $0.79-1.29/lb
• **Ground beef (73/27):** $3-5/lb
• **Whole chickens:** $0.99-1.49/lb
• **Beef heart:** $2-3/lb
• **Chicken liver:** $1-2/lb

### 💡 Money-Saving Tips:
✅ **Freeze sales meat** immediately
✅ **Use freezer space efficiently**
✅ **Network with other raw feeders**
✅ **Compare prices across stores**
✅ **Consider co-ops or buying clubs**

### 📊 Cost Comparison:
• **Premium kibble:** $2-4/day (50 lb dog)
• **Raw diet:** $2.50-5/day (50 lb dog)
• **Vet bills:** Often reduced with raw feeding

**💡 Pro Tip:** Start with cheaper proteins like chicken and gradually add variety as your budget allows.

**⚠️ Quality Matters:** Don't compromise safety for cost - ensure meat is fresh and properly handled.`;
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