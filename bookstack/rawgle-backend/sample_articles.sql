-- Insert sample articles for RAWGLE Knowledge Base

-- Get a user ID for the articles (admin user)
INSERT INTO knowledge_base_articles (
  title, 
  excerpt, 
  content, 
  content_type, 
  category, 
  subcategory, 
  tags, 
  keywords, 
  status, 
  priority, 
  featured, 
  sticky, 
  meta_title, 
  meta_description, 
  is_public, 
  requires_login, 
  author_id
) VALUES 

-- Article 1: Raw Feeding Basics
(
  'Complete Guide to Raw Feeding for Dogs',
  'Everything you need to know to start feeding your dog a healthy raw diet safely and effectively.',
  '# Complete Guide to Raw Feeding for Dogs

## Introduction

Raw feeding, also known as the BARF (Biologically Appropriate Raw Food) diet, is a feeding philosophy that aims to provide dogs with a diet similar to what their wild ancestors would have eaten. This comprehensive guide will walk you through everything you need to know to start raw feeding safely and effectively.

## Why Choose Raw Feeding?

Raw feeding offers several potential benefits for your dog:

- **Improved Digestion**: Raw food is easier for dogs to digest
- **Better Dental Health**: Chewing raw bones helps clean teeth
- **Shinier Coat**: Natural oils and nutrients promote healthy skin and coat
- **Increased Energy**: Many dogs show improved energy levels
- **Better Weight Management**: Natural diet helps maintain optimal weight

## Basic Principles

A balanced raw diet should include:

1. **Muscle Meat (70%)**: Chicken, beef, lamb, turkey, fish
2. **Raw Meaty Bones (10%)**: Chicken necks, wings, beef ribs
3. **Organ Meat (10%)**: Liver, kidney, heart, lungs
4. **Vegetables & Fruits (10%)**: Carrots, spinach, apples, berries

## Getting Started

### Week 1: Transition Slowly
- Start with one protein source (chicken is ideal)
- Mix 25% raw with 75% current food
- Monitor your dogs digestion

### Week 2: Increase Raw Portion
- Move to 50% raw, 50% current food
- Continue monitoring

### Week 3-4: Complete Transition
- Move to 75% raw, then 100% raw
- Introduce new protein sources gradually

## Safety Guidelines

**Always Remember:**
- Source from reputable suppliers
- Practice proper food hygiene
- Freeze raw meat for 2-3 days to eliminate parasites
- Keep raw and cooked foods separate
- Clean all surfaces and utensils thoroughly

## Common Mistakes to Avoid

1. **Not Balancing the Diet**: Ensure proper ratios of muscle, bone, and organs
2. **Switching Too Quickly**: Gradual transition is essential
3. **Ignoring Food Safety**: Proper handling prevents illness
4. **Not Consulting Your Vet**: Especially important for dogs with health conditions

## Conclusion

Raw feeding can be a healthy and natural way to nourish your dog, but it requires commitment, knowledge, and careful attention to food safety and nutritional balance. Start slowly, do your research, and consult with knowledgeable professionals to ensure your dogs success on a raw diet.',
  'markdown',
  'raw-feeding-basics',
  'getting-started',
  ARRAY['beginner-friendly', 'nutrition', 'safety', 'balanced-diet', 'transition'],
  ARRAY['raw feeding', 'dog diet', 'BARF diet', 'natural feeding', 'canine nutrition'],
  'published',
  'high',
  true,
  true,
  'Raw Feeding for Dogs: Complete Beginner Guide',
  'Learn how to safely transition your dog to a raw diet with our comprehensive guide covering nutrition, safety, and step-by-step instructions.',
  true,
  false,
  (SELECT id FROM users WHERE email = 'admin@rawgle.com' LIMIT 1)
),

-- Article 2: Food Safety
(
  'Food Safety Guidelines for Raw Dog Food',
  'Essential safety practices to prevent contamination and keep your family and pets healthy when handling raw dog food.',
  '# Food Safety Guidelines for Raw Dog Food

## Introduction

When feeding your dog a raw diet, food safety should be your top priority. Raw meat can harbor harmful bacteria like Salmonella, E. coli, and Campylobacter that can affect both pets and humans. Following proper food safety protocols is essential for everyones health.

## Storage Guidelines

### Freezer Storage
- Keep frozen raw food at 0°F (-18°C) or below
- Use within 6-12 months for best quality
- Label packages with contents and date
- Store in sealed containers to prevent cross-contamination

### Refrigerator Storage
- Keep thawed raw food at 40°F (4°C) or below
- Use thawed food within 2-3 days
- Store on bottom shelf in sealed containers
- Never refreeze previously frozen raw meat

### Thawing Safely
- Thaw in refrigerator, never at room temperature
- Allow 24-48 hours for complete thawing
- Use cold water bath for faster thawing
- Never use microwave or hot water

## Handling Practices

### Personal Hygiene
- Wash hands thoroughly before and after handling
- Use disposable gloves when possible
- Tie back long hair and remove jewelry
- Wear apron to protect clothing

### Kitchen Safety
- Use dedicated cutting boards for raw pet food
- Clean and sanitize all surfaces immediately after use
- Use separate utensils and bowls for raw food preparation
- Keep raw pet food away from human food preparation areas

## Cleaning and Sanitizing

### Immediate Cleanup
1. Remove all food particles
2. Wash with hot, soapy water
3. Rinse thoroughly
4. Apply sanitizing solution
5. Air dry or use clean paper towels

### Sanitizing Solutions
- **Bleach Solution**: 1 tablespoon bleach per gallon of water
- **White Vinegar**: Undiluted white vinegar
- **Commercial Sanitizers**: EPA-approved kitchen sanitizers

## Warning Signs

Watch for these signs that food may be contaminated:
- Off or sour smell
- Slimy texture
- Gray or green discoloration
- Mold growth
- Past expiration date

## Family Safety

### Protecting Children
- Keep raw pet food out of childrens reach
- Supervise children during feeding time
- Teach proper hand washing after pet contact
- Consider feeding pets in areas away from children

### Protecting Other Pets
- Feed raw-fed pets separately from others
- Clean feeding areas thoroughly after each meal
- Monitor all pets for signs of illness
- Consult vet if any pets show digestive upset

## Emergency Procedures

### If Contamination Occurs
1. Remove all potentially contaminated food
2. Clean and sanitize all affected surfaces
3. Monitor pets and family for symptoms
4. Contact veterinarian if pets show illness
5. Contact physician if humans develop symptoms

### Symptoms to Watch For
- Vomiting or diarrhea
- Fever
- Lethargy
- Loss of appetite
- Abdominal pain

## Conclusion

While raw feeding can be safe when done properly, it requires vigilance and commitment to food safety practices. When in doubt, throw it out - no meal is worth the risk of illness to your family or pets.',
  'markdown',
  'food-safety',
  'handling-storage',
  ARRAY['safety', 'hygiene', 'storage', 'contamination', 'bacteria'],
  ARRAY['food safety', 'raw food handling', 'pet food safety', 'contamination prevention'],
  'published',
  'urgent',
  true,
  false,
  'Raw Dog Food Safety: Essential Guidelines',
  'Keep your family safe with proper raw dog food handling, storage, and safety practices. Essential reading for all raw feeders.',
  true,
  false,
  (SELECT id FROM users WHERE email = 'admin@rawgle.com' LIMIT 1)
),

-- Article 3: Nutritional Balance
(
  'Understanding Nutritional Balance in Raw Diets',
  'Learn how to create nutritionally complete and balanced raw meals for optimal canine health.',
  '# Understanding Nutritional Balance in Raw Diets

## The Foundation of Canine Nutrition

Creating a nutritionally balanced raw diet requires understanding your dogs fundamental nutritional needs. Unlike commercial kibble that aims to be "complete and balanced" in every bowl, raw feeding achieves balance over time through variety.

## Essential Macronutrients

### Protein (45-65% of diet)
- **Sources**: Muscle meat, organ meat, fish
- **Function**: Tissue repair, enzyme production, immune function
- **Quality**: Complete proteins with all essential amino acids

### Fat (15-25% of diet)
- **Sources**: Fatty fish, organ meat, added oils
- **Function**: Energy, vitamin absorption, coat health
- **Essential**: Omega-3 and Omega-6 fatty acids

### Carbohydrates (5-15% of diet)
- **Sources**: Vegetables, fruits, small amount of grains
- **Function**: Energy, fiber, micronutrients
- **Note**: Dogs can thrive on very low carb diets

## Critical Micronutrients

### Vitamins
- **Vitamin A**: Liver, fish oil (vision, immune function)
- **B Vitamins**: Organ meats, muscle meat (metabolism, nervous system)
- **Vitamin D**: Fatty fish, liver (bone health, calcium absorption)
- **Vitamin E**: Plant oils, green vegetables (antioxidant)
- **Vitamin K**: Green vegetables, organ meat (blood clotting)

### Minerals
- **Calcium & Phosphorus**: Raw bones, organ meat (bone health)
- **Iron**: Red meat, organ meat (oxygen transport)
- **Zinc**: Red meat, organ meat (immune function, skin health)
- **Selenium**: Fish, organ meat (antioxidant function)

## The 80/10/10 Rule

A simplified approach to balance:
- **80% Muscle Meat**: Various protein sources
- **10% Raw Meaty Bones**: Appropriate size for your dog
- **10% Organs**: Half liver, half other organs

## Achieving Balance Over Time

### Daily Variation is Key
- Different proteins each day
- Rotate between beef, chicken, fish, lamb
- Include variety of organ meats
- Add different vegetables and fruits

### Weekly Balance Goals
- Monitor overall protein/fat ratios
- Ensure adequate calcium from bones
- Include liver at least 2-3 times per week
- Provide variety of textures and nutrients

## Common Nutritional Pitfalls

### Too Much Bone
- **Signs**: White, crumbly stools, constipation
- **Solution**: Reduce bone content, add more muscle meat

### Too Little Bone
- **Signs**: Soft, loose stools
- **Solution**: Increase appropriate raw bones

### Organ Meat Deficiency
- **Signs**: Dull coat, low energy, poor immune function
- **Solution**: Gradually increase organ meat, especially liver

### Lack of Variety
- **Risks**: Nutritional imbalances over time
- **Solution**: Rotate proteins and include seasonal variety

## Special Considerations

### Growing Puppies
- Higher protein and fat requirements
- More frequent meals
- Smaller, softer bones
- Higher calcium needs

### Senior Dogs
- May need easier to digest foods
- Possibly reduced protein if kidney issues
- Softer textures
- Joint-supporting nutrients

### Active/Working Dogs
- Higher caloric needs
- Increased fat content
- More frequent feeding
- Faster fuel sources

## Supplementation Considerations

### Usually Unnecessary If:
- Diet includes variety of fresh foods
- Adequate organ meat included
- Quality protein sources used
- Dog is healthy and thriving

### May Be Needed For:
- Dogs with specific health conditions
- Limited ingredient diets
- Rescue dogs with deficiencies
- As recommended by veterinary nutritionist

## Monitoring Success

### Positive Indicators
- Stable, appropriate weight
- Shiny, healthy coat
- Good energy levels
- Normal, firm stools
- Healthy teeth and gums

### Warning Signs
- Unexplained weight loss or gain
- Dull, dry coat
- Lethargy or behavioral changes
- Chronic digestive issues
- Dental problems

## Working with Professionals

Consider consulting:
- **Veterinary Nutritionist**: For complex health conditions
- **Experienced Raw Feeder**: For practical guidance
- **Holistic Veterinarian**: For integrative approach

## Conclusion

Nutritional balance in raw feeding is achieved through variety, quality ingredients, and attention to your dogs individual needs. While it requires more thought than commercial diets, the potential benefits of a well-balanced raw diet can be significant for many dogs.',
  'markdown',
  'nutritional-guidance',
  'balance-ratios',
  ARRAY['nutrition', 'balanced-diet', 'macronutrients', 'micronutrients', 'health'],
  ARRAY['canine nutrition', 'raw diet balance', 'dog nutrition', 'nutritional requirements'],
  'published',
  'high',
  true,
  false,
  'Raw Diet Nutrition: Complete Balance Guide for Dogs',
  'Master nutritional balance in raw feeding with our comprehensive guide to macronutrients, micronutrients, and achieving optimal canine health.',
  true,
  false,
  (SELECT id FROM users WHERE email = 'admin@rawgle.com' LIMIT 1)
),

-- Article 4: Breed-Specific Advice
(
  'Raw Feeding Guidelines for Large Breed Dogs',
  'Special considerations and feeding guidelines for large and giant breed dogs on a raw diet.',
  '# Raw Feeding Guidelines for Large Breed Dogs

## Understanding Large Breed Needs

Large breed dogs (over 50 pounds) and giant breeds (over 100 pounds) have unique nutritional requirements that differ significantly from their smaller counterparts. Their rapid growth, higher caloric needs, and predisposition to certain health conditions require careful attention when transitioning to a raw diet.

## Growth and Development Considerations

### Puppies (0-18 months)
Large breed puppies need controlled growth to prevent developmental orthopedic diseases:

- **Moderate Protein**: 22-24% (lower than small breeds)
- **Controlled Calcium**: 1.0-1.8% of diet
- **Proper Ca:P Ratio**: 1.2:1 to 1.4:1
- **Multiple Small Meals**: 3-4 times daily until 6 months

### Adult Dogs (18+ months)
- **Higher Volume**: 2-4% of body weight daily
- **Appropriate Bone Size**: Larger bones to prevent choking
- **Joint Support**: Include joint-supporting nutrients

## Feeding Amounts and Frequency

### Daily Feeding Guidelines
- **Active Adults**: 2.5-3% of body weight
- **Less Active Adults**: 2-2.5% of body weight
- **Working Dogs**: 3-4% of body weight
- **Senior Dogs**: 1.5-2.5% of body weight

### Meal Frequency
- **Puppies**: 3-4 meals daily
- **Adults**: 2 meals daily (reduces bloat risk)
- **Seniors**: 2-3 smaller meals daily

## Appropriate Bone Choices

### Safe Options for Large Breeds
- **Beef**: Knuckle bones, marrow bones, oxtail
- **Lamb**: Leg bones, shoulder bones
- **Venison**: Leg bones, neck bones
- **Raw Turkey**: Necks, frames (supervised)

### Bones to Avoid
- **Chicken bones**: Too small, choking hazard
- **Pork bones**: Too soft, can splinter
- **Cooked bones**: Any cooked bones are dangerous
- **Weight-bearing bones**: From very large animals

## Common Health Concerns

### Bloat Prevention
Large breeds are susceptible to gastric dilatation-volvulus (bloat):

- **Feed smaller, frequent meals**
- **Avoid exercise immediately after eating**
- **Consider elevated feeding stations**
- **Monitor for symptoms**: restlessness, drooling, distended abdomen

### Hip Dysplasia Prevention
- **Maintain optimal weight**
- **Include anti-inflammatory foods**
- **Provide adequate exercise**
- **Consider glucosamine-rich foods**

### Joint Health Support
Include foods rich in:
- **Glucosamine**: Green-lipped mussel, cartilage
- **Chondroitin**: Cartilage, trachea
- **Omega-3s**: Fatty fish, fish oil
- **Antioxidants**: Berries, leafy greens

## Breed-Specific Considerations

### German Shepherds
- Sensitive stomachs: introduce new foods slowly
- High energy needs: increase fat content
- Prone to allergies: limited ingredient approach initially

### Great Danes
- Slow, controlled growth essential
- High caloric needs but controlled portions
- Heart health support: taurine-rich foods

### Labrador Retrievers
- Weight management crucial
- High food drive: portion control important
- Joint health: glucosamine-rich foods

### Rottweilers
- Robust digestive systems
- High protein tolerance
- Bone and joint support important

## Practical Feeding Tips

### Meal Preparation
- **Prep in advance**: Batch prepare meals
- **Use appropriate containers**: Large, flat dishes
- **Consider feeding mats**: Easier cleanup
- **Supervise eating**: Prevent gulping

### Storage Solutions
- **Chest freezers**: More economical for large quantities
- **Portion control**: Pre-portion meals
- **Rotation system**: First in, first out
- **Bulk buying**: More cost-effective

## Transitioning Large Breeds

### Extended Transition Period
Large breeds may need 3-4 weeks for complete transition:

**Week 1**: 25% raw, 75% current food
**Week 2**: 50% raw, 50% current food
**Week 3**: 75% raw, 25% current food
**Week 4**: 100% raw (if tolerated well)

### Monitoring Progress
- **Daily weight checks**: During transition
- **Stool consistency**: Should normalize by week 2-3
- **Energy levels**: May increase significantly
- **Coat condition**: Improvement in 4-6 weeks

## Cost Management

### Budget-Friendly Strategies
- **Bulk purchasing**: Split orders with other raw feeders
- **Whole prey**: Often more economical
- **Seasonal buying**: Stock up when prices are low
- **Relationships with butchers**: Ask about bulk deals

### Cost Comparison
While initially expensive, raw feeding large breeds often costs:
- **Similar to premium kibble** when buying in bulk
- **Less in vet bills** due to improved health
- **Comparable to high-end canned food**

## Red Flags and When to Consult Vet

### Immediate Concerns
- Severe digestive upset lasting >48 hours
- Signs of bloat or GDV
- Sudden weight loss or gain
- Changes in behavior or energy

### Ongoing Monitoring Needs
- Joint health in growing puppies
- Weight management in adults
- Age-related changes in seniors

## Conclusion

Raw feeding large breed dogs requires careful attention to their unique needs, from controlled growth in puppies to joint health in seniors. With proper planning, appropriate food choices, and attention to individual needs, large breeds can thrive on a raw diet while avoiding common health pitfalls.',
  'markdown',
  'breed-specific',
  'large-breeds',
  ARRAY['large-breeds', 'giant-breeds', 'joint-health', 'bloat-prevention', 'portion-control'],
  ARRAY['large breed dogs', 'giant breed nutrition', 'raw feeding large dogs', 'bloat prevention'],
  'published',
  'medium',
  false,
  false,
  'Large Breed Raw Feeding: Complete Guide & Safety Tips',
  'Specialized raw feeding advice for large and giant breed dogs, covering growth, joint health, bloat prevention, and breed-specific needs.',
  true,
  false,
  (SELECT id FROM users WHERE email = 'admin@rawgle.com' LIMIT 1)
),

-- Article 5: Success Story
(
  'How Raw Feeding Transformed My Dogs Health: A Real Success Story',
  'A pet owners journey from chronic health issues to vibrant wellness through raw feeding.',
  '# How Raw Feeding Transformed My Dogs Health: A Real Success Story

## Meet Bella: A Golden Retriever with Challenges

When I adopted Bella, a 3-year-old Golden Retriever, from the local shelter, I knew she had some health challenges. What I didnt know was how dramatically her life—and mine—would change with a simple diet modification.

## The Problems We Faced

### Initial Health Issues
- **Chronic ear infections**: Monthly vet visits for cleaning and medication
- **Severe allergies**: Constant scratching, hot spots, inflamed skin
- **Digestive problems**: Loose stools, frequent vomiting, gas
- **Low energy**: Lethargic, reluctant to play or exercise
- **Dull coat**: Dry, brittle fur that shed excessively

### The Veterinary Bills
In the first year alone, I spent over $3,000 on:
- Allergy testing and treatments
- Prescription diets (multiple brands)
- Antibiotics for recurring infections
- Medicated shampoos and topical treatments
- Digestive aids and probiotics

### The Emotional Toll
Watching Bella suffer was heartbreaking. She was clearly uncomfortable, and I felt helpless despite following all veterinary advice and trying every "high-quality" commercial food available.

## Discovering Raw Feeding

### The Research Phase
After yet another ear infection, a fellow dog owner at the park mentioned raw feeding. Initially skeptical, I began researching:

- Read books by Dr. Ian Billinghurst and Dr. Karen Becker
- Joined online raw feeding communities
- Consulted with a holistic veterinarian
- Attended local raw feeding workshops

### Making the Decision
The science made sense: dogs evolved eating fresh, whole foods, not processed kibble. The success stories were compelling, and I was desperate enough to try anything that might help Bella.

## The Transition Process

### Week 1: Testing the Waters
- Started with simple chicken and rice mixture
- Bella showed immediate interest (first time she was excited about food!)
- Introduced small amounts of raw chicken gradually
- Monitored closely for any adverse reactions

### Week 2-3: Building Confidence
- Added different proteins (beef, lamb)
- Introduced raw bones (chicken necks, supervised)
- Began incorporating organ meats
- Stools started firming up

### Week 4: Full Commitment
- Completely eliminated commercial food
- Established feeding routine with variety
- Started meal prep sessions on weekends
- Connected with local raw feeding community for support

## The Transformation Begins

### Week 2: First Signs of Improvement
- **Increased appetite**: Actually excited for meal times
- **Better digestion**: Stools became firmer and less frequent
- **Slight energy increase**: More interested in short walks

### Month 1: Notable Changes
- **Reduced scratching**: Hot spots began healing
- **Cleaner ears**: First month without an infection
- **Improved coat**: Shinier, less shedding
- **Better breath**: Dramatic improvement in dental health

### Month 3: Remarkable Progress
- **No ear infections**: First quarter infection-free in years
- **Resolved allergies**: Scratching virtually eliminated
- **Normal digestion**: Perfect stools, no more vomiting
- **Increased energy**: Playful, eager for long walks

### Month 6: Complete Transformation
- **Vibrant health**: Annual vet exam showed excellent results
- **Beautiful coat**: Thick, shiny, minimal shedding
- **Ideal weight**: Lost excess weight, gained muscle tone
- **Happy demeanor**: Became the dog I always knew she could be

## The Long-Term Results

### Year 1 Outcomes
- **Zero ear infections**: Complete resolution
- **No allergy symptoms**: Clear, healthy skin
- **Perfect digestion**: Consistent, healthy stools
- **Optimal weight**: Maintained ideal body condition
- **Excellent dental health**: Clean teeth, fresh breath

### Financial Benefits
While raw food costs more than low-quality kibble, our veterinary expenses dropped by 80%:
- **Before**: $3,000+ annually in health-related vet bills
- **After**: $300 annually for routine wellness checks

### Quality of Life Improvements
- **Daily walks**: 2-3 miles became our routine
- **Swimming**: Bella discovered her love for water
- **Agility training**: Started classes for fun and exercise
- **Social confidence**: More outgoing with other dogs

## Lessons Learned

### What Worked Best
- **Slow transition**: Patience prevented digestive upset
- **Variety**: Different proteins provided balanced nutrition
- **Quality sourcing**: Found reliable suppliers for consistent quality
- **Community support**: Local raw feeders provided invaluable advice

### Challenges Overcome
- **Initial cost**: Meal planning and bulk buying reduced expenses
- **Time management**: Batch preparation made it manageable
- **Family concerns**: Education helped everyone understand the benefits
- **Travel logistics**: Developed portable feeding solutions

## Current Feeding Routine

### Daily Menu Structure
- **Morning**: Muscle meat with organ meat (rotating proteins)
- **Evening**: Raw meaty bone with vegetables
- **Supplements**: Fish oil twice weekly, probiotics as needed

### Weekly Variety
- **Monday**: Beef with liver and green beans
- **Tuesday**: Chicken thigh with heart and carrots
- **Wednesday**: Lamb with kidney and spinach
- **Thursday**: Pork with lung and broccoli
- **Friday**: Fish with green tripe and sweet potato
- **Weekend**: Whole prey or recreational bones

## Advice for Others Considering Raw Feeding

### Do Your Research
- Read reputable sources
- Consult knowledgeable professionals
- Join supportive communities
- Start with simple recipes

### Start Slowly
- Transition gradually over 3-4 weeks
- Monitor your dogs response
- Keep detailed records
- Be patient with the process

### Find Support
- Local raw feeding groups
- Knowledgeable veterinarians
- Experienced mentors
- Online communities

### Trust the Process
- Initial challenges are normal
- Benefits develop over time
- Every dog is different
- Consistency is key

## Two Years Later: Bellas Continued Success

Today, Bella is 5 years old and thriving. She has:
- **Boundless energy** for adventures
- **Radiant health** with no chronic issues
- **Perfect digestion** and ideal weight
- **Beautiful coat** that gets compliments from strangers
- **Strong immune system** with rare minor illnesses

## Final Thoughts

Raw feeding transformed not just Bellas health, but our entire relationship. She went from a sick, uncomfortable dog to a vibrant, joyful companion. While raw feeding isnt right for every dog or every family, for us, it was life-changing.

The journey required commitment, education, and patience, but seeing Bella thrive made every effort worthwhile. If youre considering raw feeding for a dog with chronic health issues, I encourage you to research thoroughly, consult with knowledgeable professionals, and trust that nature often knows best.

**Bella is living proof that food truly can be medicine.**',
  'markdown',
  'success-stories',
  'health-transformation',
  ARRAY['success-story', 'health', 'allergies', 'transformation', 'golden-retriever'],
  ARRAY['raw feeding success', 'dog health transformation', 'allergy resolution', 'raw diet results'],
  'published',
  'medium',
  true,
  false,
  'Raw Feeding Success: Real Dog Health Transformation Story',
  'Inspiring true story of how raw feeding completely transformed a Golden Retrievers health, resolving chronic allergies, ear infections, and digestive issues.',
  true,
  false,
  (SELECT id FROM users WHERE email = 'admin@rawgle.com' LIMIT 1)
);

-- Update the view count for the featured articles to make them appear more popular
UPDATE knowledge_base_articles SET 
  view_count = floor(random() * 500 + 100),
  like_count = floor(random() * 50 + 5)
WHERE featured = true;

-- Update the view count for other articles
UPDATE knowledge_base_articles SET 
  view_count = floor(random() * 200 + 10),
  like_count = floor(random() * 20 + 1)
WHERE featured = false;