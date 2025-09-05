import { BlogArticle, BlogAuthor, BlogCategory, READING_SPEED_WPM } from '@/types/blog';

// Blog authors
export const blogAuthors: BlogAuthor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Mitchell',
    bio: 'Veterinary nutritionist with 15 years of experience in canine and feline raw feeding protocols.',
    avatar: '/images/authors/dr-sarah.jpg',
    social: {
      website: 'https://rawfeedingvet.com',
      linkedin: 'https://linkedin.com/in/drsarahmitchell'
    }
  },
  {
    id: '2', 
    name: 'Marcus Chen',
    bio: 'Professional dog trainer and raw feeding advocate. Owner of Healthy Paws Raw Kitchen.',
    avatar: '/images/authors/marcus.jpg',
    social: {
      twitter: 'https://twitter.com/marcusrawfeeds',
      website: 'https://healthypawsraw.com'
    }
  },
  {
    id: '3',
    name: 'Lisa Rodriguez',
    bio: 'Certified pet nutritionist specializing in species-appropriate diets for dogs and cats.',
    avatar: '/images/authors/lisa.jpg',
    social: {
      linkedin: 'https://linkedin.com/in/lisarodriguez-nutrition'
    }
  }
];

// Blog categories 
export const blogCategories: BlogCategory[] = [
  {
    id: '1',
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Essential information for beginners starting their raw feeding journey',
    color: 'pumpkin',
    articleCount: 8
  },
  {
    id: '2',
    name: 'Nutrition & Balance', 
    slug: 'nutrition-balance',
    description: 'Understanding nutritional requirements and achieving dietary balance',
    color: 'olivine',
    articleCount: 12
  },
  {
    id: '3',
    name: 'Recipes & Meal Prep',
    slug: 'recipes-meal-prep', 
    description: 'Practical recipes and meal preparation techniques',
    color: 'sunglow',
    articleCount: 15
  },
  {
    id: '4',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Health benefits and wellness aspects of raw feeding',
    color: 'zomp',
    articleCount: 10
  },
  {
    id: '5',
    name: 'Puppy/Kitten Raw Feeding',
    slug: 'puppy-kitten-feeding',
    description: 'Special considerations for young pets',
    color: 'charcoal',
    articleCount: 6
  },
  {
    id: '6', 
    name: 'Common Mistakes',
    slug: 'common-mistakes',
    description: 'Avoiding common pitfalls in raw feeding',
    color: 'pumpkin',
    articleCount: 7
  },
  {
    id: '7',
    name: 'Success Stories',
    slug: 'success-stories', 
    description: 'Real experiences from raw feeding families',
    color: 'olivine',
    articleCount: 9
  },
  {
    id: '8',
    name: 'Seasonal Feeding',
    slug: 'seasonal-feeding',
    description: 'Adapting raw diets throughout the year',
    color: 'zomp',
    articleCount: 4
  }
];

// Helper function to calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordCount = content.split(' ').length;
  return Math.ceil(wordCount / READING_SPEED_WPM);
};

// Mock blog articles with comprehensive raw feeding content
export const blogArticles: BlogArticle[] = [
  {
    id: '1',
    title: 'The Complete Beginner\'s Guide to Raw Feeding Your Dog',
    slug: 'complete-beginners-guide-raw-feeding-dog', 
    excerpt: 'Everything you need to know to start your dog on a healthy, species-appropriate raw diet. From basic principles to your first shopping list.',
    content: `# The Complete Beginner's Guide to Raw Feeding Your Dog

## What is Raw Feeding?

Raw feeding, also known as a BARF diet (Biologically Appropriate Raw Food), is a feeding practice that aims to replicate what dogs would eat in the wild. This diet consists primarily of raw meat, bones, organs, and occasionally fruits and vegetables.

## Why Choose Raw Feeding?

**Benefits of Raw Feeding:**
- Improved dental health through natural teeth cleaning
- Shinier coat and healthier skin
- Better digestion and smaller, firmer stools
- Increased energy and vitality
- Stronger immune system
- Better weight management

## Getting Started: The Basics

### 1. Understanding the 80/10/10 Rule

A balanced raw diet typically follows this ratio:
- **80% Muscle Meat**: Chicken, beef, lamb, fish, turkey
- **10% Raw Meaty Bones**: Chicken necks, beef ribs, lamb ribs
- **10% Organs**: 5% liver, 5% other organs (kidney, heart, spleen)

### 2. Your First Shopping List

**Muscle Meats to Try:**
- Ground beef (80/20 fat ratio)
- Chicken thighs (skin on)
- Turkey necks
- Salmon fillets
- Lamb shoulder

**Raw Meaty Bones:**
- Chicken necks and backs
- Turkey necks
- Beef ribs (for larger dogs)
- Lamb ribs

**Organs:**
- Beef liver
- Chicken liver  
- Beef kidney
- Chicken hearts

### 3. Portion Sizes

Feed approximately 2-3% of your dog's ideal body weight daily. For example:
- 50 lb dog: 1-1.5 lbs of food daily
- 25 lb dog: 0.5-0.75 lbs of food daily
- 10 lb dog: 0.2-0.3 lbs of food daily

## Transitioning to Raw

### Week 1: Start with One Protein
Begin with just chicken thighs. Feed once daily and monitor your dog's reaction.

### Week 2: Add Bone
Introduce chicken necks or wings. Start with small amounts.

### Week 3: Add Organs
Begin with small amounts of liver (start with just 1-2 ounces).

### Week 4: Expand Proteins
Add beef, lamb, or fish to the rotation.

## Safety Guidelines

1. **Source Quality Ingredients**: Purchase from reputable suppliers
2. **Handle Safely**: Follow proper food handling procedures  
3. **Supervise Bone Consumption**: Always supervise your dog when eating bones
4. **Maintain Variety**: Rotate proteins regularly
5. **Monitor Your Dog**: Watch for any adverse reactions

## Common Beginner Mistakes to Avoid

- Starting with too many proteins at once
- Feeding only muscle meat without bones and organs
- Not maintaining proper ratios
- Feeding cooked bones (never feed cooked bones!)
- Not rotating proteins

## When to Consult a Professional

Consider working with a veterinary nutritionist if:
- Your dog has health conditions
- You're feeding a puppy or senior dog  
- You want a custom meal plan
- You're experiencing difficulties with the transition

## Conclusion

Raw feeding can provide tremendous health benefits for your dog when done correctly. Start slowly, maintain balance, and don't hesitate to seek guidance from experienced raw feeders or professionals.

Remember: Every dog is unique. What works for one may not work for another, so pay attention to your individual dog's needs and responses.`,
    featuredImage: '/images/blog/raw-feeding-guide.jpg',
    category: blogCategories[0], // Getting Started
    tags: ['beginner', 'raw diet', 'dog nutrition', 'feeding guide'],
    author: blogAuthors[0], // Dr. Sarah Mitchell
    status: 'published',
    readingTime: 0, // Will be calculated
    publishedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    featured: true,
    views: 1247
  },
  {
    id: '2', 
    title: 'Understanding the 80/10/10 Rule in Raw Feeding',
    slug: 'understanding-80-10-10-rule-raw-feeding',
    excerpt: 'Master the fundamental ratio that forms the backbone of balanced raw feeding. Learn how to properly implement muscle meat, bones, and organs.',
    content: `# Understanding the 80/10/10 Rule in Raw Feeding

## Introduction to the 80/10/10 Rule

The 80/10/10 rule is the foundation of balanced raw feeding. This ratio ensures your pet receives the proper proportions of nutrients found in their natural prey diet.

## Breaking Down the Ratios

### 80% Muscle Meat
Muscle meat provides the primary source of protein and is the largest component of the diet.

**Examples of Muscle Meat:**
- Chicken breast and thighs
- Beef chuck roast
- Lamb leg meat  
- Turkey breast
- Fish fillets (salmon, mackerel, sardines)
- Venison
- Duck breast

**Key Points:**
- Should include some fat (aim for 15-20% fat content)
- Variety is crucial - rotate between different protein sources
- Can be ground or fed in chunks

### 10% Raw Meaty Bones
Raw meaty bones provide calcium, phosphorus, and help maintain dental health.

**Appropriate Raw Meaty Bones:**
- Chicken necks, backs, wings
- Turkey necks
- Lamb ribs
- Beef ribs (for larger dogs)
- Duck necks
- Rabbit bones

**Safety Guidelines for Bones:**
- Always feed raw, never cooked
- Supervise your pet while eating
- Size appropriate for your pet
- Remove if bones become small enough to swallow whole

### 10% Organ Meat (Secreting Organs)
Organs are nutrient powerhouses, providing essential vitamins and minerals.

**5% Liver (Required):**
- Beef liver
- Chicken liver
- Lamb liver
- Duck liver

**5% Other Organs:**
- Kidney (beef, lamb, pork)
- Heart (technically muscle meat but counts as organ)
- Spleen
- Lungs
- Pancreas
- Brain (where legally available)

## Calculating Portions for Your Pet

### Daily Portion Calculation
- Adult dogs: 2-3% of ideal body weight
- Active dogs: 3-4% of ideal body weight  
- Puppies: 8-10% of current body weight
- Senior/less active: 1.5-2% of ideal body weight

### Example for a 50lb Dog (2.5% body weight = 1.25 lbs daily):
- Muscle meat: 1 lb (80%)
- Raw meaty bones: 2 oz (10%)  
- Organs: 2 oz (10%)
  - Liver: 1 oz (5%)
  - Other organs: 1 oz (5%)

## Implementing the Rule

### Weekly Approach vs. Daily Approach

**Daily Approach:**
Each meal contains the exact 80/10/10 ratio

**Weekly Approach (Recommended for beginners):**
Balance the ratios over a week rather than each meal
- Monday: Muscle meat only
- Tuesday: Muscle meat + bones
- Wednesday: Muscle meat + organs
- Continue rotating throughout the week

## Common Mistakes to Avoid

1. **Feeding only muscle meat** - Leads to calcium deficiency
2. **Too much organ meat** - Can cause digestive upset
3. **Wrong bone types** - Avoid weight-bearing bones from large animals
4. **Not rotating proteins** - Variety prevents deficiencies
5. **Ignoring fat content** - Both too much and too little can cause issues

## Adjusting for Individual Needs

### Puppies
- May need higher bone content (15%) for growth
- Require more frequent feeding
- Ground diet recommended for very young puppies

### Senior Dogs  
- May need easier-to-digest proteins
- Softer bones or ground bone meal
- Potential supplementation under veterinary guidance

### Dogs with Health Issues
- Pancreatitis: Lower fat content
- Kidney disease: Modified protein levels
- Allergies: Limited ingredient approach
- Always consult with a veterinarian

## Troubleshooting Common Issues

### Loose Stools
- Too much organ meat
- Too much fat
- New protein introduction
- Solution: Reduce organs temporarily, add pumpkin

### Constipation  
- Too much bone
- Not enough moisture
- Solution: Reduce bone content, add bone broth

### Picky Eating
- Try different proteins
- Warm food slightly
- Mix familiar with new proteins

## Conclusion

The 80/10/10 rule provides a simple framework for balanced raw feeding. Remember that this is a guideline, and individual pets may need adjustments based on their specific needs, age, activity level, and health status.

Start with this basic ratio and observe your pet's response. Over time, you'll learn to recognize what works best for your individual companion.`,
    featuredImage: '/images/blog/80-10-10-rule.jpg',
    category: blogCategories[1], // Nutrition & Balance
    tags: ['nutrition', '80/10/10', 'balanced diet', 'ratios'],
    author: blogAuthors[0],
    status: 'published', 
    readingTime: 0,
    publishedAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    featured: false,
    views: 892
  },
  {
    id: '3',
    title: '5 Common Raw Feeding Mistakes That Could Harm Your Pet',
    slug: '5-common-raw-feeding-mistakes-harm-pet',
    excerpt: 'Avoid these dangerous pitfalls that many new raw feeders encounter. Learn how to keep your pet safe while transitioning to a natural diet.',
    content: `# 5 Common Raw Feeding Mistakes That Could Harm Your Pet

Raw feeding can provide tremendous health benefits, but several common mistakes can put your pet at risk. Here are the most critical errors to avoid and how to prevent them.

## Mistake #1: Feeding Cooked Bones

### The Problem
Cooked bones become brittle and can splinter, causing:
- Choking hazards
- Intestinal blockages  
- Perforated intestines
- Broken teeth

### The Solution
**NEVER feed cooked bones of any kind.** Only feed raw bones that are:
- Size-appropriate for your pet
- From reputable sources
- Fresh or properly frozen

**Safe Raw Bone Options:**
- Small dogs: Chicken necks, wings, turkey necks
- Medium dogs: Chicken backs, duck necks, lamb ribs  
- Large dogs: Turkey necks, beef ribs, lamb necks

## Mistake #2: Not Maintaining Proper Balance

### The Problem
Feeding only muscle meat or incorrect ratios leads to:
- Calcium deficiency (muscle meat only)
- Digestive upset (too much organ meat)
- Nutritional imbalances
- Long-term health issues

### The Solution
**Follow the 80/10/10 rule consistently:**
- 80% muscle meat
- 10% raw meaty bones  
- 10% organs (5% liver, 5% other)

**Track your feeding over a week** to ensure balance rather than worrying about each individual meal.

## Mistake #3: Poor Food Safety Practices

### The Problem
Raw meat carries bacteria that can harm both pets and humans:
- Salmonella
- E. coli
- Listeria
- Cross-contamination risks

### The Solution
**Implement strict food safety protocols:**

**Storage:**
- Keep frozen until ready to use
- Thaw in refrigerator, not countertop
- Use thawed meat within 2-3 days
- Store at proper temperatures (below 40°F)

**Preparation:**
- Wash hands before and after handling
- Use separate cutting boards and utensils
- Clean all surfaces with bleach solution
- Don't leave food out for extended periods

**Feeding:**
- Remove uneaten food after 20-30 minutes
- Wash food bowls after each meal
- Don't allow pets to carry raw bones throughout house

## Mistake #4: Transitioning Too Quickly

### The Problem
Sudden diet changes can cause:
- Severe digestive upset
- Vomiting and diarrhea  
- Food aversion
- Stress on the digestive system

### The Solution
**Implement a gradual transition over 7-14 days:**

**Week 1:**
- Days 1-2: 25% raw, 75% current food
- Days 3-4: 50% raw, 50% current food
- Days 5-7: 75% raw, 25% current food

**Week 2:**
- Days 8-14: 100% raw

**For Sensitive Dogs:**
- Extend transition to 3-4 weeks
- Start with just one protein source
- Add probiotics to support digestion

## Mistake #5: Not Considering Individual Pet Needs

### The Problem
One-size-fits-all approaches ignore:
- Age-specific requirements
- Health conditions  
- Activity levels
- Individual sensitivities

### The Solution
**Customize the diet for your specific pet:**

**Puppies Need:**
- Higher calorie density (8-10% of body weight)
- Smaller, more frequent meals
- Ground food for very young puppies
- Growth-appropriate calcium/phosphorus ratios

**Senior Dogs Need:**
- Easily digestible proteins
- Potentially lower calories (1.5-2% body weight)
- Joint-supporting supplements
- Regular veterinary monitoring

**Active Dogs Need:**
- Higher calorie intake (3-4% body weight)
- Increased fat content for energy
- Electrolyte considerations
- Recovery nutrition

**Dogs with Health Issues Need:**
- Veterinary guidance
- Modified ratios or ingredients
- Regular monitoring
- Possible supplementation

## Red Flags: When to Seek Help

**Contact your veterinarian immediately if you notice:**
- Persistent vomiting or diarrhea (more than 48 hours)
- Loss of appetite for more than 2 days
- Lethargy or weakness
- Signs of intestinal blockage (straining, no bowel movements)
- Allergic reactions (itching, swelling, difficulty breathing)

## Prevention Strategies

### Education First
- Research thoroughly before starting
- Join reputable raw feeding groups
- Consult with experienced raw feeders
- Consider working with a pet nutritionist

### Quality Sources
- Find reputable raw food suppliers
- Establish relationships with local farms
- Verify meat quality and handling practices
- Don't compromise on ingredient quality

### Monitor and Adjust
- Keep feeding logs
- Monitor body condition regularly  
- Watch for changes in energy, coat, and digestion
- Be prepared to adjust ratios as needed

## Conclusion

Raw feeding can be incredibly beneficial when done correctly, but these common mistakes can turn a healthy practice into a dangerous one. Take time to educate yourself, implement proper safety practices, and always prioritize your pet's individual needs.

Remember: When in doubt, consult with a veterinary nutritionist who understands raw feeding. Your pet's health and safety should always come first.

The investment in doing raw feeding properly will pay dividends in your pet's health, longevity, and quality of life.`,
    featuredImage: '/images/blog/raw-feeding-mistakes.jpg',
    category: blogCategories[5], // Common Mistakes
    tags: ['safety', 'mistakes', 'raw feeding errors', 'pet health'],
    author: blogAuthors[1], // Marcus Chen
    status: 'published',
    readingTime: 0,
    publishedAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    featured: false,
    views: 734
  },
  {
    id: '4',
    title: 'Raw Feeding for Puppies: Special Considerations and Guidelines',
    slug: 'raw-feeding-puppies-special-considerations-guidelines',
    excerpt: 'Navigate the unique nutritional needs of growing puppies on a raw diet. Essential information for supporting healthy development.',
    content: `# Raw Feeding for Puppies: Special Considerations and Guidelines

Feeding puppies a raw diet requires special attention to their unique nutritional needs during this critical growth period. Here's everything you need to know to support your puppy's healthy development.

## Why Raw Feed Puppies?

**Benefits of Raw Feeding for Puppies:**
- Superior nutrient bioavailability during crucial growth
- Better dental development through natural chewing
- Stronger immune system foundation
- Optimal digestive health from early age
- Prevention of food allergies and sensitivities
- Better body condition and muscle development

## Age Considerations

### 8-12 Weeks: Starting Solid Food
- Can begin raw feeding as early as 4-6 weeks with supervision
- Ground food is essential for very young puppies
- Frequent meals (4-6 times daily)
- Mother's milk still important if available

### 3-6 Months: Rapid Growth Phase
- Highest caloric needs relative to body weight
- 3-4 meals daily
- Can start introducing small, soft raw bones
- Monitor growth rate carefully

### 6-12 Months: Continued Growth
- Gradual transition to adult feeding schedule
- 2-3 meals daily
- Full-size raw bones appropriate for breed size
- Monitor for growth plate closure

## Puppy-Specific Nutritional Requirements

### Higher Caloric Needs
**Feeding Amounts by Age:**
- 8-12 weeks: 8-10% of current body weight daily
- 3-6 months: 6-8% of current body weight daily  
- 6-12 months: 4-6% of current body weight daily
- 12+ months: Transition to adult amounts (2-3%)

### Modified 80/10/10 Rule for Puppies
**Puppies may benefit from:**
- 75% muscle meat
- 15% raw meaty bones (higher calcium needs)
- 10% organs
- The extra bone content supports rapid skeletal growth

### Essential Nutrients for Growth
- **Protein**: 25-30% (higher than adult dogs)
- **Fat**: 8-15% (energy dense for growth)
- **Calcium**: Proper Ca:P ratio (1.2:1 to 1.5:1)
- **DHA**: Critical for brain and eye development

## Safe Raw Bones for Puppies

### 8-16 Weeks (Ground or Very Soft Bones)
- Ground chicken with bone
- Ground turkey with bone
- Very soft chicken necks (chopped small)
- Chicken wing tips

### 4-6 Months (Small Soft Bones)
- Chicken necks (whole)
- Chicken wings
- Turkey necks (for larger breeds)
- Duck necks

### 6+ Months (Size-Appropriate Bones)
- Follow adult guidelines based on breed size
- Always supervise bone consumption
- Remove if bones become small enough to swallow

## Transitioning Puppies to Raw

### Coming from Mother's Milk
**Week 1-2:** Introduce ground raw food mixed with goat milk or bone broth
**Week 3-4:** Increase raw food ratio, decrease liquid
**Week 5-6:** Full raw meals with soft bones if appropriate

### Coming from Kibble
**Days 1-3:** 25% raw, 75% kibble
**Days 4-6:** 50% raw, 50% kibble  
**Days 7-10:** 75% raw, 25% kibble
**Days 11+:** 100% raw

**Important:** Fast for 12 hours between last kibble and first raw meal

## Meal Preparation for Puppies

### Ground Diet Benefits
- Easier to digest
- Better portion control
- Reduced choking risk
- Easier to ensure balance

### Sample Ground Recipe (1 lb batch):
- 12 oz ground meat (chicken, beef, or turkey)
- 2 oz ground bone (chicken necks/backs)
- 1 oz liver
- 0.5 oz other organs (kidney, heart)
- 0.5 oz additional fat if needed

### Whole Food Transition
- Start introducing whole pieces around 12-16 weeks
- Begin with soft items like chicken hearts
- Gradually increase size as puppy grows
- Always supervise

## Monitoring Puppy Development

### Growth Rate
- Weigh weekly for first 6 months
- Plot on breed-specific growth curve
- Rapid growth isn't always better
- Steady, consistent growth is ideal

### Body Condition Scoring
- Should maintain slight rib coverage
- Visible waist tuck from above and side
- Growth plates develop properly with correct nutrition

### Dental Development
- Raw bones help clean teeth naturally  
- Monitor for proper tooth eruption
- Adult teeth typically complete by 6-7 months

## Common Puppy Raw Feeding Challenges

### Loose Stools
**Causes:**
- Too much organ meat
- Food sensitivity
- Parasites (common in puppies)

**Solutions:**
- Reduce organs temporarily
- Try single protein sources
- Veterinary parasite check

### Picky Eating
**Strategies:**
- Warm food slightly
- Mix familiar proteins with new ones
- Hand feeding to create positive associations
- Ensure appropriate meal timing

### Overeating/Gulping
**Prevention:**
- Use puzzle feeders
- Separate puppies during meals
- Feed smaller, more frequent meals
- Supervise meal times

## Large Breed Puppy Considerations

### Controlled Growth Rate
- Avoid overfeeding (can cause developmental problems)
- Monitor calcium levels carefully
- Consider lower-calcium formulations
- Regular veterinary monitoring essential

### Extended Growth Period
- Continue puppy feeding guidelines longer
- Growth plates close later (12-18 months)
- Transition to adult feeding more gradually

## Small Breed Puppy Considerations

### Higher Metabolic Rate
- More frequent meals needed
- Higher fat content beneficial
- Monitor for hypoglycemia
- Always have food available

### Bone Size Concerns
- Extra attention to bone sizing
- Ground bones safer initially
- Supervise closely during whole bone introduction

## Working with Your Veterinarian

### Pre-Raw Consultation
- Discuss feeding plans
- Establish baseline health metrics
- Address any breed-specific concerns
- Plan monitoring schedule

### Regular Check-ups
- More frequent visits during puppyhood
- Growth monitoring
- Parasite prevention
- Vaccination schedules

### Signs to Watch For
- Abnormal growth patterns
- Digestive issues lasting >48 hours
- Changes in energy or behavior
- Dental development problems

## Supplementation for Puppies

### Generally Not Needed If Balanced
- Whole prey model typically sufficient
- Quality raw diet provides complete nutrition
- Over-supplementation can be harmful

### Exceptions May Include:
- DHA for brain development (fish oil)
- Probiotics during transitions
- Specific health conditions
- Veterinary recommendations

## Transitioning to Adult Feeding

### Timing
- Small breeds: 9-12 months
- Medium breeds: 12-15 months
- Large breeds: 15-18 months
- Giant breeds: 18-24 months

### Gradual Changes
- Reduce feeding frequency first
- Then reduce daily amount slowly
- Monitor body condition throughout
- Adjust based on individual needs

## Conclusion

Raw feeding puppies requires attention to detail but can provide an excellent foundation for lifelong health. Key principles include appropriate portion sizes, proper ratios, safe food handling, and close monitoring of development.

Remember that puppies are individuals with varying needs. Work closely with a veterinarian experienced in raw feeding, and don't hesitate to adjust your approach based on your puppy's specific responses and development patterns.

The effort invested in proper puppy nutrition will pay dividends throughout your dog's life in the form of robust health, strong immunity, and optimal development.`,
    featuredImage: '/images/blog/puppy-raw-feeding.jpg',
    category: blogCategories[4], // Puppy/Kitten Raw Feeding
    tags: ['puppies', 'growth', 'development', 'young dogs'],
    author: blogAuthors[2], // Lisa Rodriguez  
    status: 'published',
    readingTime: 0,
    publishedAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    featured: false,
    views: 567
  },
  {
    id: '5',
    title: 'Seasonal Raw Feeding: Adapting Your Pet\'s Diet Year-Round', 
    slug: 'seasonal-raw-feeding-adapting-pet-diet-year-round',
    excerpt: 'Learn how to adjust your raw feeding approach through the seasons. From summer cooling foods to winter warming proteins.',
    content: `# Seasonal Raw Feeding: Adapting Your Pet's Diet Year-Round

Just as we adjust our eating habits with the seasons, our pets can benefit from seasonal modifications to their raw diet. Here's how to optimize nutrition throughout the year.

## Spring: Renewal and Detox

### Seasonal Characteristics
- Increased activity after winter
- Natural detoxification period
- Allergy season preparation
- Renewed energy needs

### Recommended Adjustments

**Proteins to Emphasize:**
- Lighter proteins: Fish, rabbit, poultry
- Organ meats for detox support (especially liver)
- Fresh, lean muscle meats

**Supporting Foods:**
- Leafy greens (if you include vegetables)
- Dandelion for liver support
- Fresh herbs like parsley

**Feeding Schedule:**
- Gradually increase portions as activity increases
- Monitor weight as pets become more active
- Consider light fasting days to support natural detox

### Spring Considerations
- Address winter weight gain slowly
- Prepare immune system for allergens
- Support liver function after winter indulgence
- Increase exercise coordination with feeding

## Summer: Cooling and Hydration

### Seasonal Characteristics  
- Higher temperatures affect appetite
- Increased water needs
- More outdoor activity
- Risk of overheating

### Recommended Adjustments

**Cooling Proteins:**
- Fish (naturally cooling in traditional medicine)
- Rabbit
- Duck
- Pork (in moderation)

**Feeding Strategies:**
- Feed during cooler parts of day (early morning/evening)
- Increase moisture content
- Consider frozen treats and bones
- Reduce portion sizes if appetite decreases

**Hydration Support:**
- Bone broth ice cubes
- Frozen raw bones for extended chewing
- Water-rich proteins like fish
- Monitor for dehydration signs

### Summer Safety
- Never leave raw food out in heat
- Increase feeding frequency, decrease portion size
- Provide extra shade and water during outdoor feeding
- Watch for signs of heat stress

## Fall: Building Reserves

### Seasonal Characteristics
- Preparation for winter months
- Natural tendency to increase appetite  
- Building energy reserves
- Immune system preparation

### Recommended Adjustments

**Warming Proteins:**
- Beef and lamb (higher fat content)
- Venison and other game meats
- Organ meats for nutrient density
- Increased fat ratios

**Seasonal Preparation:**
- Gradually increase portion sizes
- Add healthy fats (fish oil, coconut oil)
- Focus on immune-supporting organs
- Prepare for decreased daylight

### Fall Benefits
- Natural appetite increase supports easy feeding
- Opportunity to build healthy weight before winter
- Stock up on seasonal game meats
- Prepare immune system for cold season

## Winter: Warming and Sustaining

### Seasonal Characteristics
- Lower temperatures increase caloric needs
- Reduced daylight affects mood and appetite
- Indoor heating can cause dry skin
- Potential for weight gain from reduced activity

### Recommended Adjustments

**Warming Proteins:**
- Higher fat content meats
- Beef, lamb, and pork
- Organ meats for nutrient density
- Game meats when available

**Caloric Adjustments:**
- Increase portions by 10-20% for outdoor dogs
- Indoor dogs may need same or reduced portions
- Monitor body condition carefully
- Adjust for individual activity levels

**Skin and Coat Support:**
- Increase omega-3 fatty acids
- Add fish oil or feed fatty fish
- Ensure adequate fat in diet
- Consider coconut oil supplementation

### Winter Considerations
- Monitor for Seasonal Affective Disorder in pets
- Maintain exercise despite weather
- Watch for winter weight gain
- Support immune system during cold/flu season

## Geographic Considerations

### Hot Climates (Year-Round Summer Approach)
- Emphasis on cooling proteins
- Consistent hydration focus
- Shade and temperature management
- Adjusted feeding times

### Cold Climates (Extended Winter Approach)
- Higher caloric needs for longer periods
- Emphasis on warming proteins
- Fat content adjustments
- Indoor/outdoor considerations

### Temperate Climates
- Follow traditional four-season approach
- Moderate adjustments throughout year
- Monitor individual pet responses
- Flexibility in approach

## Activity Level Adjustments

### Highly Active Seasons (Spring/Summer)
- Increase total calories by 25-50%
- Higher protein requirements
- Electrolyte considerations
- Post-exercise nutrition timing

### Less Active Seasons (Fall/Winter)
- Monitor for weight gain
- Maintain muscle mass with adequate protein
- Adjust portions for reduced activity
- Focus on nutrient density over quantity

## Age-Related Seasonal Considerations

### Puppies and Young Dogs
- Higher caloric needs in cold weather
- Consistent growth support regardless of season
- Extra attention to hydration in heat
- Seasonal safety awareness

### Senior Dogs
- May need more dramatic seasonal adjustments
- Arthritis considerations in cold weather
- Heat sensitivity increases with age
- Medication interactions with seasonal changes

### Adult Dogs in Prime
- Standard seasonal adjustments
- Monitor for optimal body condition
- Adjust for individual preferences
- Use seasonal changes to add variety

## Practical Implementation

### Menu Planning
**Create seasonal rotation schedules:**
- Spring: Light proteins, detox support
- Summer: Cooling proteins, hydration focus  
- Fall: Building proteins, immune support
- Winter: Warming proteins, caloric density

### Shopping Strategies
- Build relationships with seasonal suppliers
- Take advantage of seasonal price variations
- Stock up on game meats during hunting seasons
- Plan storage for seasonal abundances

### Monitoring Success
- Track body condition scores seasonally
- Monitor energy levels and coat quality
- Watch for seasonal behavior changes
- Adjust based on individual responses

## Common Seasonal Challenges

### Seasonal Allergies
- Support immune system before allergy season
- Consider elimination diets during peak times
- Monitor for food sensitivity increases
- Work with veterinarian on management

### Holiday Feeding
- Maintain routine despite celebrations  
- Avoid toxic holiday foods
- Plan for schedule disruptions
- Include pets safely in seasonal celebrations

### Travel Considerations
- Plan raw feeding for seasonal trips
- Pack appropriate coolers and supplies
- Research raw food sources at destinations
- Have backup plans for feeding disruptions

## Conclusion

Seasonal adjustments to raw feeding can optimize your pet's health throughout the year. The key is observing your individual pet's responses and making gradual adjustments rather than dramatic changes.

Remember that these are general guidelines - your pet's individual needs, activity level, age, and health status should always take precedence over seasonal recommendations.

Start with small adjustments and monitor your pet's response. Over time, you'll develop an intuitive sense of what works best for your companion through each season.

The goal is to work with nature's rhythms to provide optimal nutrition year-round, supporting your pet's natural adaptability and resilience.`,
    featuredImage: '/images/blog/seasonal-feeding.jpg', 
    category: blogCategories[7], // Seasonal Feeding
    tags: ['seasonal', 'year-round', 'weather', 'adaptation'],
    author: blogAuthors[0],
    status: 'published',
    readingTime: 0,
    publishedAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'), 
    featured: false,
    views: 423
  },
  {
    id: '6',
    title: 'From Kibble to Raw: Max\'s Amazing Transformation Story',
    slug: 'from-kibble-raw-max-amazing-transformation-story',
    excerpt: 'Follow Max, a 7-year-old German Shepherd, through his incredible health transformation after switching from commercial kibble to a raw diet.',
    content: `# From Kibble to Raw: Max's Amazing Transformation Story

*This is the real story of Max, a 7-year-old German Shepherd who experienced a remarkable health transformation after switching to raw feeding. His owner, Jennifer, shares their journey.*

## Meet Max: The Problem Years

Max was a typical suburban German Shepherd who seemed healthy on the surface, but Jennifer knew something wasn't quite right.

### The Issues We Were Facing

**Digestive Problems:**
- Loose, frequent stools (2-3 times daily)
- Excessive gas that cleared rooms
- Bloating after meals
- Constant hunger despite eating premium kibble

**Skin and Coat Issues:**
- Dull, brittle coat despite expensive supplements
- Chronic itching and hot spots
- Seasonal allergies getting worse each year
- Constant scratching and licking

**Energy and Behavior:**
- Low energy, especially in afternoons
- Restless at night
- Food aggression around his kibble bowl
- Seemed perpetually unsatisfied after meals

**Dental Health:**
- Bad breath despite dental chews
- Tartar buildup requiring yearly cleanings
- Red, inflamed gums
- Expensive dental procedures at age 5 and 6

### The Veterinary Merry-Go-Round

Over two years, we tried everything our conventional vet recommended:

- **Premium Kibbles**: Spent over $100/bag on "grain-free" and "limited ingredient" formulas
- **Prescription Diets**: Hypoallergenic formulas that were bland and expensive
- **Supplements**: Fish oil, probiotics, digestive enzymes - you name it
- **Medications**: Antihistamines for allergies, antibiotics for recurring skin infections
- **Procedures**: Multiple vet visits, allergy testing, dental cleanings

**Total spent in two years: Over $4,000 with minimal improvement**

## The Decision to Try Raw

### The Turning Point

A friend at the dog park mentioned her elderly Lab's transformation on raw food. I was skeptical - raw feeding sounded extreme and potentially dangerous. But Max's quality of life was declining, and traditional approaches weren't working.

### Initial Research Phase

I spent three months researching before making the switch:
- Read books by Dr. Ian Billinghurst and Dr. Tom Lonsdale
- Joined reputable raw feeding Facebook groups  
- Consulted with a holistic veterinarian
- Connected with experienced raw feeders locally

### The Fears I Had to Overcome

- **Bacteria concerns**: Would raw meat make Max sick?
- **Nutritional balance**: Could I provide complete nutrition?
- **Choking on bones**: What if he got hurt?
- **Time and convenience**: Would this be too complicated?
- **Cost**: Would raw feeding break our budget?

## The Transition Process

### Week 1-2: The Prep Phase
**Before starting**, I:
- Found a local raw food supplier
- Bought a separate freezer for dog food
- Set up dedicated prep area in garage
- Stocked up on cleaning supplies
- Arranged consultation with holistic vet

### Week 3: The Fast and First Meal
Following advice from experienced feeders, I fasted Max for 24 hours to clear his system, then introduced his first raw meal: a simple chicken thigh.

**Max's reaction**: He was cautious at first, sniffed extensively, then devoured it in minutes. The satisfied expression on his face was something I'd never seen with kibble.

### Week 4-6: Building the Foundation
- **Week 4**: Added chicken necks (carefully supervised)
- **Week 5**: Introduced ground beef with organs
- **Week 6**: Added variety with lamb and fish

### The Detox Phase (Weeks 2-4)
Max went through what raw feeders call "detox":
- Initially softer stools as digestive system adjusted
- Increased shedding as coat renewed itself
- More sleeping as body focused on healing
- Temporary increase in thirst

*I almost quit during week 3 when his stools were very soft, but my raw feeding mentor assured me this was normal.*

## The Transformation Begins

### Month 1: Digestive Miracle
- **Stools transformed**: From loose and frequent to small, firm, and nearly odorless
- **Gas disappeared**: No more clearing the room after meals
- **Satisfied after eating**: No more begging or counter surfing
- **Better sleep**: Both Max and I slept better without midnight potty breaks

### Month 2: Coat and Skin Changes
- **Coat quality**: Noticeably shinier and softer
- **Itching reduced**: Down from constant to occasional
- **Hot spots healing**: Without medication or intervention
- **Natural oils returning**: Coat felt healthy for first time in years

### Month 3: Energy and Behavior Transformation
- **Energy levels**: Dramatic increase in playfulness and stamina
- **Mental clarity**: More alert and responsive to training
- **Food aggression gone**: Relaxed, confident eating behavior
- **Overall demeanor**: Happier, more content dog

### Month 6: The Dental Miracle
This was the most shocking change. Max's teeth, which had required professional cleanings every year, were now:
- **Naturally white**: No more yellow tartar buildup
- **Healthy gums**: Pink instead of inflamed red
- **Fresh breath**: No more offensive odors
- **Strong teeth**: Naturally maintained through bone chewing

## The Numbers: Quantifying Success

### Health Metrics Before vs. After Raw (6 months)

**Veterinary Visit Frequency:**
- Before: Every 2-3 months for various issues
- After: Annual wellness visits only

**Medication Use:**
- Before: Antihistamines, antibiotics, prescription shampoos
- After: None needed

**Dental Care:**
- Before: Professional cleaning every 12 months ($800 each)
- After: None needed in 18 months and counting

**Body Condition:**
- Before: Slightly overweight, soft muscle tone
- After: Ideal weight, lean muscle development

### Cost Comparison (Monthly)

**Kibble-Based Diet:**
- Premium kibble: $80/month
- Supplements: $45/month  
- Veterinary visits: $150/month average
- Dental cleanings: $67/month (annual cost divided)
- **Total: $342/month**

**Raw Diet:**
- Raw meat/bones/organs: $120/month
- Veterinary visits: $25/month average
- Dental care: $0/month
- **Total: $145/month**

**Savings: $197/month ($2,364 annually)**

## Challenges We Overcame

### The Learning Curve
- **Meal planning**: Took 2-3 months to develop efficient routines
- **Sourcing**: Finding reliable suppliers took time and research
- **Storage**: Managing freezer space and rotation
- **Travel**: Planning for trips and boarding situations

### Family Concerns
- **Spouse skepticism**: My husband needed convincing about safety
- **Children adjustment**: Teaching kids about raw food safety
- **Visitor reactions**: Explaining our feeding choice to concerned friends
- **Veterinary pushback**: Finding supportive veterinary care

### Seasonal Adjustments
- **Summer considerations**: Food safety in heat, frozen treats
- **Winter needs**: Increased calories, warming proteins  
- **Holiday disruptions**: Maintaining routine during travel
- **Activity changes**: Adjusting portions with exercise levels

## Unexpected Benefits

Beyond addressing Max's original health issues, raw feeding brought surprising additional benefits:

### Enhanced Bond
- **Mealtime ritual**: Preparing Max's meals became a bonding activity
- **Training opportunities**: Using meal components as high-value rewards
- **Increased attention**: Max became more focused on me as his food provider

### Social Connections
- **Raw feeding community**: Met incredible, knowledgeable dog owners
- **Learning opportunities**: Constantly expanding knowledge about canine nutrition
- **Helping others**: Now mentor other pet owners through their transitions

### Peace of Mind
- **Ingredient control**: Knowing exactly what Max consumes
- **No recalls**: Freedom from commercial food safety concerns
- **Natural approach**: Confidence in species-appropriate nutrition

## Max Today: 18 Months Later

Max is now 8.5 years old, and people consistently comment on how young and vibrant he looks.

**Current Health Status:**
- **Perfect digestive health**: Consistent, healthy stools
- **Gorgeous coat**: Shiny, thick, and healthy
- **Clean teeth**: Still no dental work needed
- **High energy**: Plays like a dog half his age
- **Stable weight**: Maintains ideal body condition effortlessly

**Quality of Life Improvements:**
- **Enthusiasm for meals**: Excitement and satisfaction at feeding time
- **Better sleep**: Restful nights for the whole family  
- **Improved behavior**: Calm, content, and well-balanced
- **Seasonal comfort**: No more allergy medications needed

## Advice for Others Considering the Switch

### Do Your Research
- Join reputable raw feeding groups
- Read credible books and resources
- Find experienced mentors
- Consult with holistic veterinarians

### Start Slowly
- Don't rush the transition process
- Begin with simple proteins
- Monitor your dog's response carefully
- Be prepared for initial adjustment period

### Find Your Support Network
- Connect with local raw feeders
- Establish relationships with suppliers
- Find veterinary professionals who support your choice
- Don't go it alone

### Trust the Process
- Expect an adjustment period
- Document changes with photos and notes
- Be patient with the learning curve
- Remember why you started

## The Bottom Line

Switching Max to raw feeding was one of the best decisions we've ever made for his health and our relationship. The transformation has been nothing short of remarkable.

**Was it challenging?** Absolutely. The learning curve was steep, and there were moments of doubt.

**Was it worth it?** Without question. Max's improved health, vitality, and quality of life speak for themselves.

**Would I do it again?** In a heartbeat. And I'd start sooner.

## Final Thoughts

Max's story isn't unique in the raw feeding community. Thousands of pet owners have witnessed similar transformations when they switch from processed foods to species-appropriate nutrition.

This isn't about being anti-veterinarian or dismissing conventional approaches. It's about finding what works for your individual pet and being open to alternatives when traditional methods aren't providing the results you need.

Max taught me to question conventional wisdom, do my own research, and trust my instincts as his caregiver. The reward has been watching him thrive in his senior years with the vitality of a much younger dog.

If your pet is struggling with chronic health issues despite conventional treatment, raw feeding might be worth exploring. The transformation could be as dramatic as Max's - and the journey, while challenging, could be the best gift you ever give your companion.

*Max is now 9 years old and still thriving on his raw diet. His story continues to inspire other pet owners to explore natural feeding options for their beloved companions.*`,
    featuredImage: '/images/blog/max-transformation.jpg',
    category: blogCategories[6], // Success Stories
    tags: ['success story', 'transformation', 'German Shepherd', 'health improvement'],
    author: blogAuthors[1],
    status: 'published', 
    readingTime: 0,
    publishedAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    featured: true,
    views: 1456
  }
];

// Calculate reading times for all articles
blogArticles.forEach(article => {
  article.readingTime = calculateReadingTime(article.content);
});

// Helper functions for data access
export const getFeaturedArticles = (): BlogArticle[] => {
  return blogArticles.filter(article => article.featured && article.status === 'published');
};

export const getArticlesByCategory = (categorySlug: string): BlogArticle[] => {
  return blogArticles.filter(
    article => article.category.slug === categorySlug && article.status === 'published'
  );
};

export const getRecentArticles = (limit: number = 6): BlogArticle[] => {
  return blogArticles
    .filter(article => article.status === 'published')
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
};

export const searchArticles = (query: string): BlogArticle[] => {
  const lowerQuery = query.toLowerCase();
  return blogArticles.filter(article => 
    article.status === 'published' && (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      article.category.name.toLowerCase().includes(lowerQuery)
    )
  );
};

export const getArticleBySlug = (slug: string): BlogArticle | undefined => {
  return blogArticles.find(
    article => article.slug === slug && article.status === 'published'
  );
};

export const getRelatedArticles = (articleId: string, limit: number = 3): BlogArticle[] => {
  const currentArticle = blogArticles.find(article => article.id === articleId);
  if (!currentArticle) return [];

  return blogArticles
    .filter(article => 
      article.id !== articleId && 
      article.status === 'published' && 
      (
        article.category.id === currentArticle.category.id ||
        article.tags.some(tag => currentArticle.tags.includes(tag))
      )
    )
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
};