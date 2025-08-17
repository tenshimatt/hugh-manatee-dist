-- Sample suppliers data for testing the search functionality
-- Insert sample raw dog food suppliers across different locations

INSERT INTO rawgle_suppliers (
  name, description, category, specialties, location_latitude, location_longitude, 
  location_address, contact_phone, contact_email, website_url, rating_average, 
  rating_count, price_range, is_verified, is_active, created_at, updated_at
) VALUES 
(
  'Chicago Raw Pet Food Co.', 
  'Premium raw dog food supplier serving the Chicago area with locally sourced meats and organic vegetables.',
  'Pet Food',
  '["raw_food", "organic", "local_sourcing", "delivery"]',
  41.8781, -87.6298,
  '1234 W Division St, Chicago, IL 60622',
  '(312) 555-0123',
  'info@chicagorawpet.com',
  'https://chicagorawpet.com',
  4.8, 156, 'medium', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Windy City BARF', 
  'Biologically Appropriate Raw Food for dogs and cats. We specialize in balanced raw meals following BARF principles.',
  'Pet Food',
  '["barf_diet", "raw_food", "balanced_meals", "frozen"]',
  41.9484, -87.6553,
  '567 N Michigan Ave, Chicago, IL 60611',
  '(312) 555-0456',
  'orders@windycitybarf.com',
  'https://windycitybarf.com',
  4.6, 89, 'high', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Natural Paws Raw Foods', 
  'Family-owned business providing fresh, raw dog food with free delivery in Chicago suburbs.',
  'Pet Food',
  '["raw_food", "family_owned", "delivery", "suburban"]',
  42.0369, -87.6847,
  '890 Central Ave, Evanston, IL 60201',
  '(847) 555-0789',
  'hello@naturalpawsraw.com',
  'https://naturalpawsraw.com',
  4.7, 234, 'medium', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Downtown Raw Dog Deli', 
  'Urban raw dog food store with pickup and local delivery. Fresh meals prepared daily.',
  'Pet Food',
  '["raw_food", "urban", "pickup", "daily_fresh"]',
  41.8827, -87.6233,
  '321 S LaSalle St, Chicago, IL 60604',
  '(312) 555-0321',
  'info@rawdogdeli.com',
  'https://rawdogdeli.com',
  4.5, 67, 'high', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Prairie Raw Pet Nutrition', 
  'Serving raw dog food enthusiasts across the Midwest with premium, grass-fed options.',
  'Pet Food',
  '["raw_food", "grass_fed", "midwest", "premium"]',
  41.7321, -87.7649,
  '456 Oak Park Ave, Oak Park, IL 60302',
  '(708) 555-0654',
  'support@prairierawpet.com',
  'https://prairierawpet.com',
  4.9, 178, 'high', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Healthy Hounds Raw Market', 
  'Complete raw dog food market with variety packs and single proteins. Educational workshops available.',
  'Pet Food',
  '["raw_food", "variety_packs", "education", "workshops"]',
  41.9742, -87.9073,
  '789 Main St, Schaumburg, IL 60194',
  '(847) 555-0987',
  'info@healthyhoundsraw.com',
  'https://healthyhoundsraw.com',
  4.4, 145, 'medium', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Raw Feeding Solutions', 
  'Consulting and raw food supply for dogs transitioning to raw diets. Custom meal plans available.',
  'Pet Food',
  '["raw_food", "consulting", "custom_meals", "transition_support"]',
  42.1142, -87.8406,
  '234 Grove Ave, Barrington, IL 60010',
  '(847) 555-0234',
  'consult@rawfeedingsolutions.com',
  'https://rawfeedingsolutions.com',
  4.8, 92, 'high', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Metro Raw Pet Foods', 
  'Bulk raw dog food supplier serving pet stores and individual customers throughout Chicagoland.',
  'Pet Food',
  '["raw_food", "bulk", "wholesale", "chicagoland"]',
  41.8014, -87.5988,
  '567 Industrial Dr, Chicago, IL 60609',
  '(312) 555-0567',
  'wholesale@metrorawpet.com',
  'https://metrorawpet.com',
  4.6, 203, 'low', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Lakefront Raw Dog Food', 
  'Lakefront location serving fresh raw meals with Lake Michigan views. Pickup and delivery available.',
  'Pet Food',
  '["raw_food", "lakefront", "scenic", "pickup_delivery"]',
  41.9278, -87.6261,
  '890 N Lake Shore Dr, Chicago, IL 60611',
  '(312) 555-0890',
  'orders@lakefrontraw.com',
  'https://lakefrontraw.com',
  4.7, 118, 'medium', 1, 1,
  datetime('now'), datetime('now')
),
(
  'Suburban Raw Pet Co.', 
  'Suburban raw pet food specialist with convenient parking and knowledgeable staff.',
  'Pet Food',
  '["raw_food", "suburban", "convenient_parking", "knowledgeable_staff"]',
  41.7547, -88.1253,
  '123 Suburban Ave, Naperville, IL 60540',
  '(630) 555-0123',
  'info@suburbanrawpet.com',
  'https://suburbanrawpet.com',
  4.5, 87, 'medium', 1, 1,
  datetime('now'), datetime('now')
);