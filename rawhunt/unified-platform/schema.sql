-- Unified Platform Database Schema
-- Supports both Rawgle (raw feeding) and GoHunta (hunting) platforms

-- Platform Configuration
CREATE TABLE platform_config (
    platform TEXT PRIMARY KEY CHECK (platform IN ('rawgle', 'gohunta')),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    features JSON NOT NULL,
    theme JSON NOT NULL,
    settings JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core Users (shared across both platforms)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('rawgle', 'gohunta', 'both')) DEFAULT 'rawgle',
    location TEXT,
    phone TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')) DEFAULT 'beginner',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro', 'business')),
    subscription_expires DATETIME,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    privacy_settings JSON,
    preferences JSON,
    avatar_url TEXT,
    bio TEXT,
    social_links JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    deleted_at DATETIME
);

-- Pet Profiles (dogs for GoHunta, all pets for Rawgle)
CREATE TABLE pets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'dog',
    breed TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    weight_lbs REAL,
    weight_kg REAL,
    color_markings TEXT,
    registration_number TEXT,
    microchip_id TEXT,
    -- Rawgle-specific fields
    feeding_type TEXT, -- raw, kibble, mixed
    allergies JSON,
    dietary_restrictions JSON,
    feeding_schedule JSON,
    -- GoHunta-specific fields
    hunting_style TEXT CHECK (hunting_style IN ('pointing', 'flushing', 'retrieving', 'tracking', 'coursing')),
    training_level TEXT CHECK (training_level IN ('puppy', 'started', 'seasoned', 'finished', 'master')),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    -- Shared fields
    health_records JSON,
    vaccination_records JSON,
    insurance_info JSON,
    photos JSON,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers (shared - can serve both platforms)
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    platform_access TEXT[] DEFAULT ARRAY['rawgle'], -- ['rawgle', 'gohunta', 'both']
    email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    -- Location data
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'US',
    postal_code TEXT,
    latitude REAL,
    longitude REAL,
    service_radius_miles INTEGER,
    -- Business details
    business_license TEXT,
    certifications JSON,
    insurance_info JSON,
    tax_id TEXT,
    -- Platform-specific categories
    rawgle_categories JSON, -- ['raw_meat', 'supplements', 'treats', 'equipment']
    gohunta_categories JSON, -- ['training_equipment', 'hunting_gear', 'dog_supplies', 'firearms']
    -- Ratings and reviews
    rating_average REAL DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products (platform-specific)
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('rawgle', 'gohunta')),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    -- Pricing
    price_cents INTEGER,
    price_currency TEXT DEFAULT 'USD',
    unit TEXT, -- 'lb', 'kg', 'piece', 'box'
    min_order_quantity INTEGER DEFAULT 1,
    bulk_pricing JSON,
    -- Inventory
    stock_quantity INTEGER,
    low_stock_threshold INTEGER DEFAULT 10,
    -- Product details
    specifications JSON,
    ingredients JSON, -- Rawgle-specific
    nutritional_info JSON, -- Rawgle-specific
    safety_info JSON, -- GoHunta-specific
    images JSON,
    videos JSON,
    documents JSON,
    -- SEO and discovery
    tags JSON,
    brand TEXT,
    model TEXT,
    sku TEXT,
    barcode TEXT,
    weight_lbs REAL,
    dimensions TEXT,
    -- Status
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community Posts (shared)
CREATE TABLE community_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('rawgle', 'gohunta')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'success_story', 'review', 'announcement')),
    category TEXT NOT NULL,
    subcategory TEXT,
    region TEXT,
    tags JSON,
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    -- Media
    images JSON,
    videos JSON,
    attachments JSON,
    -- Moderation
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    moderator_reviewed BOOLEAN DEFAULT FALSE,
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    -- Visibility
    featured BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community Comments
CREATE TABLE community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES community_comments(id),
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    best_answer BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reviews (products, suppliers, experiences)
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('rawgle', 'gohunta')),
    review_type TEXT NOT NULL CHECK (review_type IN ('product', 'supplier', 'experience')),
    target_id TEXT NOT NULL, -- product_id, supplier_id, etc.
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    images JSON,
    videos JSON,
    flagged BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platform-Specific Tables

-- RAWGLE-SPECIFIC TABLES --

-- Feeding Logs
CREATE TABLE feeding_logs (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feeding_date DATE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    -- Food details
    food_type TEXT, -- 'raw_meat', 'organs', 'bones', 'vegetables'
    brand TEXT,
    protein_source TEXT,
    amount_oz REAL,
    amount_grams REAL,
    calories_estimated INTEGER,
    -- Nutritional tracking
    protein_grams REAL,
    fat_grams REAL,
    carb_grams REAL,
    calcium_mg REAL,
    phosphorus_mg REAL,
    -- Pet response
    appetite_rating INTEGER CHECK (appetite_rating BETWEEN 1 AND 5),
    digestion_notes TEXT,
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    -- Location and context
    location TEXT,
    weather TEXT,
    notes TEXT,
    photos JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PAWS Cryptocurrency Transactions
CREATE TABLE paws_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'transferred', 'bonus', 'penalty')),
    amount INTEGER NOT NULL, -- in PAWS tokens (smallest unit)
    balance_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_entity_type TEXT, -- 'feeding_log', 'community_post', 'review', etc.
    related_entity_id TEXT,
    blockchain_tx_hash TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NFT Records
CREATE TABLE nft_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    nft_type TEXT NOT NULL CHECK (nft_type IN ('pet_profile', 'achievement', 'memorial', 'special_edition')),
    token_id TEXT UNIQUE,
    contract_address TEXT,
    blockchain TEXT DEFAULT 'solana',
    metadata_uri TEXT,
    metadata JSON,
    mint_transaction_hash TEXT,
    current_owner_wallet TEXT,
    minted_at DATETIME,
    transferred_at DATETIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'minted', 'transferred', 'burned')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GOHUNTA-SPECIFIC TABLES --

-- Hunt Logs
CREATE TABLE hunt_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hunt_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    -- Location (encrypted for privacy)
    location_name TEXT NOT NULL,
    location_coordinates TEXT, -- Encrypted GPS coordinates
    location_region TEXT, -- General region for privacy
    location_type TEXT CHECK (location_type IN ('public', 'private', 'guided', 'club')),
    land_permission TEXT,
    -- Hunt details
    hunting_type TEXT NOT NULL CHECK (hunting_type IN ('upland', 'waterfowl', 'big_game', 'small_game', 'training', 'scouting')),
    weather_conditions JSON,
    temperature_f INTEGER,
    wind_speed_mph INTEGER,
    wind_direction TEXT,
    visibility_miles REAL,
    precipitation TEXT,
    terrain_type TEXT,
    -- Dogs and companions
    dogs_present JSON, -- Array of dog IDs
    companions JSON, -- Other hunters present
    guide_info TEXT,
    -- Equipment used
    firearms_used JSON,
    ammunition_used JSON,
    equipment_used JSON,
    gear_notes TEXT,
    -- Performance and success
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    conditions_rating INTEGER CHECK (conditions_rating BETWEEN 1 AND 5),
    dog_performance_rating INTEGER CHECK (dog_performance_rating BETWEEN 1 AND 5),
    -- GPS and route data (encrypted)
    gps_route JSON,
    waypoints JSON,
    distance_miles REAL,
    elevation_gain_feet INTEGER,
    -- Media and notes
    photos JSON,
    videos JSON,
    notes TEXT,
    lessons_learned TEXT,
    -- Sharing and privacy
    shared_publicly BOOLEAN DEFAULT FALSE,
    share_location BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game Harvested
CREATE TABLE game_harvested (
    id TEXT PRIMARY KEY,
    hunt_log_id TEXT NOT NULL REFERENCES hunt_logs(id) ON DELETE CASCADE,
    species TEXT NOT NULL,
    subspecies TEXT,
    count INTEGER NOT NULL DEFAULT 1,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    age_class TEXT CHECK (age_class IN ('adult', 'juvenile', 'unknown')),
    -- Harvest details
    time_harvested TIME,
    location_gps TEXT, -- Encrypted specific harvest location
    method TEXT, -- 'shot', 'trapped', etc.
    distance_yards INTEGER,
    shot_placement TEXT,
    ammunition_used TEXT,
    dog_retrieved_by TEXT REFERENCES pets(id),
    -- Processing
    field_dressed BOOLEAN DEFAULT FALSE,
    weight_dressed_lbs REAL,
    weight_live_lbs REAL,
    meat_yield_lbs REAL,
    processing_notes TEXT,
    -- Records and compliance
    hunting_license_number TEXT,
    tag_number TEXT,
    check_station TEXT,
    checked_date DATE,
    -- Media
    photos JSON,
    videos JSON,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training Sessions (Gun Dog specific)
CREATE TABLE training_sessions (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    location TEXT,
    weather_conditions JSON,
    temperature_f INTEGER,
    -- Training details
    trainer_name TEXT,
    training_type TEXT NOT NULL CHECK (training_type IN ('obedience', 'pointing', 'retrieving', 'steadiness', 'tracking', 'water_work', 'field_trial', 'hunt_test')),
    exercise_type TEXT NOT NULL,
    skills_practiced JSON, -- Array of specific skills
    equipment_used JSON,
    -- Performance metrics
    performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    obedience_rating INTEGER CHECK (obedience_rating BETWEEN 1 AND 5),
    -- Specific skill ratings
    pointing_steadiness INTEGER CHECK (pointing_steadiness BETWEEN 1 AND 5),
    retrieve_enthusiasm INTEGER CHECK (retrieve_enthusiasm BETWEEN 1 AND 5),
    retrieve_delivery INTEGER CHECK (retrieve_delivery BETWEEN 1 AND 5),
    recall_reliability INTEGER CHECK (recall_reliability BETWEEN 1 AND 5),
    -- Progress tracking
    improvements_noted TEXT,
    challenges TEXT,
    breakthrough_moments TEXT,
    regression_areas TEXT,
    next_session_goals TEXT,
    -- Media
    videos JSON,
    photos JSON,
    audio_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training Goals
CREATE TABLE training_goals (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL, -- 'pointing', 'retrieving', 'steadiness', 'obedience'
    target_skill TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    current_level INTEGER CHECK (current_level BETWEEN 1 AND 5) DEFAULT 1,
    target_level INTEGER CHECK (target_level BETWEEN 1 AND 5) DEFAULT 5,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    milestones JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SHARED INDEXES FOR PERFORMANCE --

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform ON users(platform);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_location ON users(location);

-- Pets
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_breed ON pets(breed);
CREATE INDEX idx_pets_active ON pets(active);
CREATE INDEX idx_pets_user_active ON pets(user_id, active);

-- Suppliers
CREATE INDEX idx_suppliers_platform_access ON suppliers(platform_access);
CREATE INDEX idx_suppliers_location ON suppliers(state, city);
CREATE INDEX idx_suppliers_verified ON suppliers(verified);
CREATE INDEX idx_suppliers_rating ON suppliers(rating_average);
CREATE INDEX idx_suppliers_active ON suppliers(active);

-- Products  
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_platform_category ON products(platform, category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);

-- Community
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_platform ON community_posts(platform);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_posts_featured ON community_posts(featured);
CREATE INDEX idx_community_posts_region ON community_posts(region);

CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_created_at ON community_comments(created_at);

-- Reviews
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_platform ON reviews(platform);
CREATE INDEX idx_reviews_target_type ON reviews(review_type, target_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Rawgle-specific indexes
CREATE INDEX idx_feeding_logs_pet_id ON feeding_logs(pet_id);
CREATE INDEX idx_feeding_logs_user_id ON feeding_logs(user_id);
CREATE INDEX idx_feeding_logs_date ON feeding_logs(feeding_date);
CREATE INDEX idx_feeding_logs_pet_date ON feeding_logs(pet_id, feeding_date DESC);

CREATE INDEX idx_paws_transactions_user_id ON paws_transactions(user_id);
CREATE INDEX idx_paws_transactions_type ON paws_transactions(transaction_type);
CREATE INDEX idx_paws_transactions_created_at ON paws_transactions(created_at);

CREATE INDEX idx_nft_records_user_id ON nft_records(user_id);
CREATE INDEX idx_nft_records_pet_id ON nft_records(pet_id);
CREATE INDEX idx_nft_records_token_id ON nft_records(token_id);
CREATE INDEX idx_nft_records_status ON nft_records(status);

-- GoHunta-specific indexes
CREATE INDEX idx_hunt_logs_user_id ON hunt_logs(user_id);
CREATE INDEX idx_hunt_logs_hunt_date ON hunt_logs(hunt_date);
CREATE INDEX idx_hunt_logs_hunting_type ON hunt_logs(hunting_type);
CREATE INDEX idx_hunt_logs_location_region ON hunt_logs(location_region);
CREATE INDEX idx_hunt_logs_shared_publicly ON hunt_logs(shared_publicly);
CREATE INDEX idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);

CREATE INDEX idx_game_harvested_hunt_log_id ON game_harvested(hunt_log_id);
CREATE INDEX idx_game_harvested_species ON game_harvested(species);
CREATE INDEX idx_game_harvested_time ON game_harvested(time_harvested);

CREATE INDEX idx_training_sessions_dog_id ON training_sessions(dog_id);
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_session_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_training_type ON training_sessions(training_type);
CREATE INDEX idx_training_sessions_dog_date ON training_sessions(dog_id, session_date DESC);

CREATE INDEX idx_training_goals_dog_id ON training_goals(dog_id);
CREATE INDEX idx_training_goals_completed ON training_goals(completed);
CREATE INDEX idx_training_goals_target_date ON training_goals(target_date);
CREATE INDEX idx_training_goals_priority ON training_goals(priority);

-- Insert platform configuration
INSERT INTO platform_config (platform, name, display_name, description, features, theme) VALUES
('rawgle', 'rawgle', 'Rawgle', 'Raw feeding community and marketplace', 
 '{"feeding_logs": true, "paws_rewards": true, "nft_profiles": true, "nutrition_calculator": true, "meal_planner": true}',
 '{"primary_color": "#FF6B6B", "secondary_color": "#4ECDC4", "accent_color": "#45B7D1", "brand_colors": {"success": "#96CEB4", "warning": "#FFEAA7", "error": "#FD79A8"}}'),
 
('gohunta', 'gohunta', 'GoHunta', 'Hunting and gun dog community platform',
 '{"hunt_logs": true, "gps_tracking": true, "training_sessions": true, "game_tracking": true, "weather_integration": true}',
 '{"primary_color": "#FF7700", "secondary_color": "#228B22", "accent_color": "#D2B48C", "brand_colors": {"success": "#32CD32", "warning": "#FFD700", "error": "#DC143C"}}');