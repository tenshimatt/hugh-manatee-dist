-- =============================================================================
-- VETERINARY INTEGRATION SCHEMA EXTENSION
-- =============================================================================
-- Extends existing Rawgle database schema to support veterinary data sharing
-- Built for HIPAA-compliant pet health data sharing with veterinary clinics

-- =============================================================================
-- VETERINARY CLINICS MANAGEMENT
-- =============================================================================

-- Veterinary clinics and practices
CREATE TABLE veterinary_clinics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Basic clinic information
    clinic_name TEXT NOT NULL,
    business_name TEXT,
    clinic_type TEXT DEFAULT 'general' CHECK (clinic_type IN ('general', 'specialty', 'emergency', 'mobile', 'referral')),
    
    -- Contact information
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website_url TEXT,
    
    -- Address
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    
    -- Geographic data for proximity searches
    latitude REAL,
    longitude REAL,
    
    -- Licensing and certification
    veterinary_license_number TEXT NOT NULL,
    dea_number TEXT, -- Drug Enforcement Administration number
    state_license_numbers TEXT, -- JSON array for multi-state practices
    accreditations TEXT, -- JSON array of professional accreditations
    
    -- Services offered
    services_offered TEXT, -- JSON array: general_medicine, surgery, emergency, etc.
    specialties TEXT, -- JSON array: cardiology, dermatology, etc.
    species_treated TEXT, -- JSON array: dogs, cats, exotic, etc.
    
    -- Hours and availability
    business_hours TEXT, -- JSON object with days and hours
    emergency_hours TEXT, -- JSON object for emergency availability
    appointment_booking_url TEXT,
    
    -- API integration settings
    api_access_enabled BOOLEAN DEFAULT FALSE,
    api_key_hash TEXT, -- Hashed API key for secure access
    webhook_url TEXT, -- For real-time notifications
    supported_export_formats TEXT, -- JSON array: pdf, json, csv, hl7
    
    -- Compliance and security
    hipaa_compliant BOOLEAN DEFAULT TRUE,
    data_retention_days INTEGER DEFAULT 2555, -- 7 years default
    encryption_enabled BOOLEAN DEFAULT TRUE,
    audit_logging_enabled BOOLEAN DEFAULT TRUE,
    
    -- Status and verification
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Manual verification by platform
    verification_date DATE,
    verified_by TEXT, -- Admin user who verified
    
    -- Platform integration
    subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    subscription_expires DATE,
    monthly_data_limit INTEGER DEFAULT 1000, -- API calls per month
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Veterinary clinic staff and users
CREATE TABLE vet_clinic_users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    clinic_id TEXT NOT NULL REFERENCES veterinary_clinics(id) ON DELETE CASCADE,
    
    -- User identification
    email TEXT NOT NULL,
    password_hash TEXT, -- Optional if using clinic-based auth
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT,
    
    -- Professional credentials
    veterinary_license_number TEXT,
    dvm_degree BOOLEAN DEFAULT FALSE,
    specialization TEXT, -- cardiology, surgery, etc.
    years_experience INTEGER,
    
    -- Role and permissions within clinic
    role TEXT NOT NULL CHECK (role IN ('veterinarian', 'technician', 'assistant', 'receptionist', 'admin')),
    permissions TEXT, -- JSON array of specific permissions
    can_access_health_data BOOLEAN DEFAULT FALSE,
    can_export_data BOOLEAN DEFAULT FALSE,
    can_view_emergency_data BOOLEAN DEFAULT FALSE,
    
    -- Multi-factor authentication
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    
    -- Session management
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until DATETIME,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated')),
    
    -- Audit and compliance
    created_by TEXT, -- Admin who created the account
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PET-VETERINARY RELATIONSHIPS
-- =============================================================================

-- Links pets to veterinary clinics with relationship details
CREATE TABLE pet_vet_relationships (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    clinic_id TEXT NOT NULL REFERENCES veterinary_clinics(id) ON DELETE CASCADE,
    
    -- Relationship details
    relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'secondary', 'emergency', 'referral')),
    primary_veterinarian TEXT, -- Name of specific vet at clinic
    client_id_at_clinic TEXT, -- Clinic's internal client/patient ID
    
    -- Visit history summary
    first_visit_date DATE,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    
    -- Emergency contact status
    emergency_contact BOOLEAN DEFAULT FALSE,
    emergency_contact_priority INTEGER, -- 1 = highest priority
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    relationship_ended_date DATE,
    relationship_ended_reason TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique primary relationship per pet
    UNIQUE(dog_id, relationship_type) WHERE relationship_type = 'primary'
);

-- =============================================================================
-- HEALTH DATA SHARING PERMISSIONS
-- =============================================================================

-- Granular permissions for data sharing between pet owners and veterinary clinics
CREATE TABLE health_data_sharing_permissions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    clinic_id TEXT NOT NULL REFERENCES veterinary_clinics(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission scope
    permission_type TEXT DEFAULT 'standard' CHECK (permission_type IN ('standard', 'emergency', 'research', 'second_opinion')),
    
    -- Data categories that can be shared
    share_basic_info BOOLEAN DEFAULT TRUE, -- name, breed, age, weight
    share_medical_history BOOLEAN DEFAULT TRUE, -- health conditions, medications
    share_vaccination_records BOOLEAN DEFAULT TRUE,
    share_feeding_logs BOOLEAN DEFAULT FALSE,
    share_training_records BOOLEAN DEFAULT FALSE,
    share_ai_consultations BOOLEAN DEFAULT FALSE,
    share_photos BOOLEAN DEFAULT FALSE,
    share_location_data BOOLEAN DEFAULT FALSE, -- for mobile vet services
    
    -- Access controls
    read_only_access BOOLEAN DEFAULT TRUE,
    can_add_notes BOOLEAN DEFAULT TRUE, -- Vet can add notes to pet's record
    can_update_medical_info BOOLEAN DEFAULT FALSE, -- Vet can update medical info
    emergency_override BOOLEAN DEFAULT FALSE, -- Access in emergencies without consent
    
    -- Time-based controls
    access_start_date DATE DEFAULT (date('now')),
    access_end_date DATE, -- NULL = indefinite access
    temporary_access_hours INTEGER, -- For temporary access grants
    
    -- Usage limitations
    data_export_allowed BOOLEAN DEFAULT TRUE,
    print_reports_allowed BOOLEAN DEFAULT TRUE,
    share_with_colleagues BOOLEAN DEFAULT FALSE, -- Within clinic only
    
    -- Audit and tracking
    consent_given_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consent_method TEXT DEFAULT 'digital' CHECK (consent_method IN ('digital', 'verbal', 'written')),
    consent_ip_address TEXT,
    consent_document_url TEXT, -- Signed consent form
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at DATETIME,
    revoked_by TEXT REFERENCES users(id),
    revoked_reason TEXT,
    
    -- Emergency protocols
    emergency_contact_info TEXT, -- JSON: additional emergency contacts
    emergency_instructions TEXT, -- Special instructions for emergency care
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique permission per pet-clinic combination
    UNIQUE(dog_id, clinic_id)
);

-- =============================================================================
-- DATA ACCESS TRACKING AND AUDIT
-- =============================================================================

-- Track all veterinary data access for audit and compliance
CREATE TABLE vet_data_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Request identification
    request_type TEXT NOT NULL CHECK (request_type IN ('view', 'export', 'print', 'emergency_access', 'api_call')),
    
    -- Who made the request
    requesting_clinic_id TEXT NOT NULL REFERENCES veterinary_clinics(id),
    requesting_user_id TEXT REFERENCES vet_clinic_users(id), -- NULL for API requests
    requesting_ip_address TEXT,
    user_agent TEXT,
    
    -- What was requested
    dog_id TEXT NOT NULL REFERENCES dogs(id),
    data_categories TEXT, -- JSON array of requested data types
    date_range_start DATE, -- For historical data requests
    date_range_end DATE,
    
    -- Request details
    request_purpose TEXT, -- medical_consultation, emergency_treatment, etc.
    emergency_justification TEXT, -- Required for emergency override access
    export_format TEXT, -- pdf, json, csv for export requests
    
    -- Authorization
    permission_id TEXT REFERENCES health_data_sharing_permissions(id),
    authorized BOOLEAN NOT NULL DEFAULT FALSE,
    authorization_method TEXT, -- permission_granted, emergency_override, etc.
    
    -- Response details
    response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'approved', 'denied', 'fulfilled', 'error')),
    response_message TEXT,
    data_provided TEXT, -- JSON summary of data provided
    
    -- Processing
    processed_at DATETIME,
    fulfilled_at DATETIME,
    expires_at DATETIME, -- For temporary access
    
    -- Compliance tracking
    hipaa_authorization_confirmed BOOLEAN DEFAULT FALSE,
    minimum_necessary_applied BOOLEAN DEFAULT TRUE, -- Only minimum necessary data provided
    retention_policy_applied BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FEEDING LOGS FOR VETERINARY ANALYSIS
-- =============================================================================

-- Enhanced feeding logs with nutritional tracking
CREATE TABLE feeding_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    logged_by TEXT NOT NULL REFERENCES users(id),
    
    -- Feeding details
    feed_date DATE NOT NULL,
    feed_time TIME NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'treat', 'supplement')),
    
    -- Food information
    food_brand TEXT,
    food_product TEXT,
    food_type TEXT CHECK (food_type IN ('kibble', 'wet', 'raw', 'freeze_dried', 'dehydrated', 'homemade')),
    
    -- Quantity and nutritional data
    quantity_cups REAL,
    quantity_grams REAL,
    calories_estimated INTEGER,
    protein_grams REAL,
    fat_grams REAL,
    carbs_grams REAL,
    fiber_grams REAL,
    
    -- Feeding behavior and response
    appetite_rating INTEGER CHECK (appetite_rating BETWEEN 1 AND 5), -- 1=poor, 5=excellent
    eating_speed TEXT CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast')),
    finished_meal BOOLEAN DEFAULT TRUE,
    leftover_amount REAL, -- Quantity left uneaten
    
    -- Digestive response tracking
    digestive_response TEXT, -- JSON: vomiting, diarrhea, normal, etc.
    stool_quality INTEGER CHECK (stool_quality BETWEEN 1 AND 7), -- Bristol stool chart adapted for dogs
    stool_frequency INTEGER, -- Number of bowel movements that day
    
    -- Treats and supplements
    treats_given TEXT, -- JSON array of treats
    supplements_given TEXT, -- JSON array of supplements
    medications_with_food TEXT, -- JSON array of medications given with food
    
    -- Context and notes
    activity_level_before TEXT CHECK (activity_level_before IN ('low', 'moderate', 'high')),
    activity_level_after TEXT CHECK (activity_level_after IN ('low', 'moderate', 'high')),
    weather_conditions TEXT,
    notes TEXT,
    
    -- Veterinary relevance
    vet_recommended_food BOOLEAN DEFAULT FALSE,
    special_diet BOOLEAN DEFAULT FALSE,
    diet_compliance BOOLEAN DEFAULT TRUE, -- Following vet diet recommendations
    
    -- Media documentation
    photos TEXT, -- JSON array of food photos
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Food products database for nutritional tracking
CREATE TABLE food_products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Product identification
    brand_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_line TEXT,
    upc_code TEXT,
    
    -- Product classification
    food_type TEXT NOT NULL CHECK (food_type IN ('kibble', 'wet', 'raw', 'freeze_dried', 'dehydrated', 'treat', 'supplement')),
    life_stage TEXT CHECK (life_stage IN ('puppy', 'adult', 'senior', 'all_stages')),
    size_category TEXT CHECK (size_category IN ('small_breed', 'medium_breed', 'large_breed', 'giant_breed', 'all_sizes')),
    
    -- Nutritional information (per 100g)
    calories_per_100g INTEGER,
    protein_percentage REAL,
    fat_percentage REAL,
    carbohydrate_percentage REAL,
    fiber_percentage REAL,
    moisture_percentage REAL,
    ash_percentage REAL,
    
    -- Detailed nutritional breakdown
    calcium_mg REAL,
    phosphorus_mg REAL,
    sodium_mg REAL,
    potassium_mg REAL,
    magnesium_mg REAL,
    iron_mg REAL,
    zinc_mg REAL,
    copper_mg REAL,
    manganese_mg REAL,
    selenium_mcg REAL,
    iodine_mcg REAL,
    
    -- Vitamins (per 100g)
    vitamin_a_iu INTEGER,
    vitamin_d_iu INTEGER,
    vitamin_e_iu INTEGER,
    vitamin_k_mg REAL,
    thiamine_mg REAL,
    riboflavin_mg REAL,
    niacin_mg REAL,
    pantothenic_acid_mg REAL,
    pyridoxine_mg REAL,
    biotin_mcg REAL,
    folic_acid_mcg REAL,
    vitamin_b12_mcg REAL,
    choline_mg REAL,
    
    -- Ingredients and allergens
    primary_protein_source TEXT,
    ingredients_list TEXT, -- Full ingredients list
    common_allergens TEXT, -- JSON array: chicken, beef, grain, etc.
    grain_free BOOLEAN DEFAULT FALSE,
    limited_ingredient BOOLEAN DEFAULT FALSE,
    
    -- Regulatory and quality
    aafco_approved BOOLEAN DEFAULT FALSE,
    aafco_statement TEXT,
    feeding_trials_conducted BOOLEAN DEFAULT FALSE,
    organic_certified BOOLEAN DEFAULT FALSE,
    country_of_origin TEXT,
    
    -- Packaging information
    package_sizes TEXT, -- JSON array of available package sizes
    shelf_life_months INTEGER,
    storage_requirements TEXT,
    
    -- Cost tracking
    average_cost_per_lb REAL,
    cost_per_calorie REAL,
    
    -- Quality and ratings
    palatability_score REAL, -- User-reported palatability
    digestibility_score REAL, -- User-reported digestibility
    overall_rating REAL, -- Average user rating
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    discontinued_date DATE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- VETERINARY DASHBOARD VIEWS
-- =============================================================================

-- Comprehensive pet health summary for veterinary access
CREATE VIEW vet_pet_health_summary AS
SELECT 
    d.id as dog_id,
    d.name as pet_name,
    d.breed,
    d.birth_date,
    d.weight_lbs as current_weight,
    d.gender,
    u.first_name || ' ' || u.last_name as owner_name,
    u.email as owner_email,
    u.phone as owner_phone,
    
    -- Current health status
    dhl.weight_lbs as latest_recorded_weight,
    dhl.body_condition_score as latest_bcs,
    dhl.log_date as last_health_check,
    
    -- Feeding summary (last 30 days)
    COUNT(DISTINCT fl.feed_date) as feeding_days_logged,
    AVG(fl.appetite_rating) as avg_appetite_rating,
    AVG(fl.calories_estimated) as avg_daily_calories,
    
    -- Medical history counts
    COUNT(DISTINCT aic.id) as ai_consultations_count,
    
    -- Relationship info
    pvr.relationship_type,
    pvr.primary_veterinarian,
    pvr.last_visit_date,
    
    -- Permission status
    hdsp.share_medical_history,
    hdsp.share_feeding_logs,
    hdsp.share_ai_consultations,
    hdsp.access_end_date,
    
    d.updated_at as profile_last_updated

FROM dogs d
JOIN users u ON d.owner_id = u.id
LEFT JOIN pet_vet_relationships pvr ON d.id = pvr.dog_id
LEFT JOIN health_data_sharing_permissions hdsp ON d.id = hdsp.dog_id AND pvr.clinic_id = hdsp.clinic_id
LEFT JOIN dog_health_logs dhl ON d.id = dhl.dog_id AND dhl.log_date = (
    SELECT MAX(log_date) FROM dog_health_logs WHERE dog_id = d.id
)
LEFT JOIN feeding_logs fl ON d.id = fl.dog_id AND fl.feed_date >= date('now', '-30 days')
LEFT JOIN ai_consultations aic ON aic.user_id = u.id AND JSON_EXTRACT(aic.pet_info, '$.name') = d.name
WHERE d.is_active = TRUE
    AND hdsp.is_active = TRUE
GROUP BY d.id, hdsp.clinic_id;

-- Feeding pattern analysis for veterinary review
CREATE VIEW vet_feeding_analysis AS
SELECT 
    fl.dog_id,
    d.name as pet_name,
    DATE(fl.feed_date) as analysis_date,
    COUNT(*) as meals_per_day,
    SUM(fl.calories_estimated) as total_daily_calories,
    AVG(fl.appetite_rating) as avg_appetite,
    
    -- Nutritional totals
    SUM(fl.protein_grams) as total_protein_g,
    SUM(fl.fat_grams) as total_fat_g,
    SUM(fl.carbs_grams) as total_carbs_g,
    
    -- Digestive health indicators
    AVG(fl.stool_quality) as avg_stool_quality,
    SUM(CASE WHEN JSON_EXTRACT(fl.digestive_response, '$') LIKE '%vomiting%' THEN 1 ELSE 0 END) as vomiting_incidents,
    SUM(CASE WHEN JSON_EXTRACT(fl.digestive_response, '$') LIKE '%diarrhea%' THEN 1 ELSE 0 END) as diarrhea_incidents,
    
    -- Weight correlation data
    dhl.weight_lbs as weight_on_date,
    dhl.body_condition_score as bcs_on_date

FROM feeding_logs fl
JOIN dogs d ON fl.dog_id = d.id
LEFT JOIN dog_health_logs dhl ON fl.dog_id = dhl.dog_id AND DATE(fl.feed_date) = dhl.log_date
WHERE fl.feed_date >= date('now', '-90 days')
GROUP BY fl.dog_id, DATE(fl.feed_date)
ORDER BY fl.dog_id, analysis_date DESC;

-- =============================================================================
-- PERFORMANCE INDEXES FOR VETERINARY QUERIES
-- =============================================================================

-- Veterinary clinic indexes
CREATE INDEX idx_vet_clinics_location ON veterinary_clinics(latitude, longitude) WHERE is_active = TRUE;
CREATE INDEX idx_vet_clinics_license ON veterinary_clinics(veterinary_license_number);
CREATE INDEX idx_vet_clinics_verified ON veterinary_clinics(is_verified, is_active);

-- Clinic user indexes
CREATE INDEX idx_vet_users_clinic ON vet_clinic_users(clinic_id, is_active);
CREATE INDEX idx_vet_users_email ON vet_clinic_users(email) WHERE is_active = TRUE;
CREATE INDEX idx_vet_users_role ON vet_clinic_users(role, can_access_health_data);

-- Pet-vet relationship indexes
CREATE INDEX idx_pet_vet_dog ON pet_vet_relationships(dog_id) WHERE is_active = TRUE;
CREATE INDEX idx_pet_vet_clinic ON pet_vet_relationships(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_pet_vet_primary ON pet_vet_relationships(dog_id, relationship_type) WHERE relationship_type = 'primary';
CREATE INDEX idx_pet_vet_emergency ON pet_vet_relationships(emergency_contact, emergency_contact_priority) WHERE emergency_contact = TRUE;

-- Permission indexes
CREATE INDEX idx_permissions_dog ON health_data_sharing_permissions(dog_id) WHERE is_active = TRUE;
CREATE INDEX idx_permissions_clinic ON health_data_sharing_permissions(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_permissions_owner ON health_data_sharing_permissions(owner_id) WHERE is_active = TRUE;
CREATE INDEX idx_permissions_active ON health_data_sharing_permissions(is_active, access_end_date);

-- Data request audit indexes
CREATE INDEX idx_data_requests_clinic ON vet_data_requests(requesting_clinic_id, created_at DESC);
CREATE INDEX idx_data_requests_dog ON vet_data_requests(dog_id, created_at DESC);
CREATE INDEX idx_data_requests_date ON vet_data_requests(created_at DESC);
CREATE INDEX idx_data_requests_type ON vet_data_requests(request_type, response_status);

-- Feeding log indexes
CREATE INDEX idx_feeding_logs_dog_date ON feeding_logs(dog_id, feed_date DESC);
CREATE INDEX idx_feeding_logs_date ON feeding_logs(feed_date DESC);
CREATE INDEX idx_feeding_logs_product ON feeding_logs(food_brand, food_product);

-- Food product indexes
CREATE INDEX idx_food_products_brand ON food_products(brand_name, product_name) WHERE is_active = TRUE;
CREATE INDEX idx_food_products_type ON food_products(food_type, life_stage);
CREATE INDEX idx_food_products_upc ON food_products(upc_code) WHERE upc_code IS NOT NULL;