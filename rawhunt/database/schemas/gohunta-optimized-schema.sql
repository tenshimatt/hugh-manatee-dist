-- GoHunta.com Optimized Database Schema
-- Cloudflare D1 SQLite optimized for hunting platform
-- Performance-first design with comprehensive indexing strategy

-- Schema version tracking
CREATE TABLE schema_version (
    id INTEGER PRIMARY KEY,
    version TEXT NOT NULL,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT
);

-- Insert current version
INSERT INTO schema_version (id, version, description, checksum) VALUES 
(1, '1.0.0', 'Initial optimized schema for GoHunta platform', 'sha256:placeholder');

-- =============================================================================
-- CORE ENTITIES - User Management & Authentication
-- =============================================================================

-- Users table with enhanced fields and optimization
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    
    -- Profile information
    bio TEXT,
    location TEXT,
    phone TEXT,
    avatar_url TEXT,
    website_url TEXT,
    social_links TEXT, -- JSON: {instagram: '', facebook: ''}
    
    -- Hunting-specific profile
    hunting_license TEXT,
    hunting_experience INTEGER DEFAULT 0, -- years
    experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    preferred_hunting_types TEXT, -- JSON array: ['upland', 'waterfowl', 'big_game']
    home_state TEXT,
    hunting_zones TEXT, -- JSON array of preferred zones
    
    -- Account settings
    role TEXT DEFAULT 'hunter' CHECK (role IN ('hunter', 'trainer', 'guide', 'admin', 'moderator')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro', 'business')),
    subscription_expires DATETIME,
    
    -- Security & verification
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    
    -- Privacy & preferences
    privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
    location_privacy TEXT DEFAULT 'region' CHECK (location_privacy IN ('exact', 'region', 'state', 'hidden')),
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'community', 'private')),
    preferences TEXT, -- JSON for UI preferences, notifications, etc.
    
    -- Status & tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Manual verification status
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted')),
    
    -- Engagement metrics (updated via triggers)
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    
    -- Timestamps
    last_login DATETIME,
    last_active DATETIME,
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

-- User sessions for security tracking
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info TEXT, -- JSON: {device: '', browser: '', os: ''}
    ip_address TEXT,
    location TEXT, -- City, State from IP
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- DOG PROFILES & MANAGEMENT
-- =============================================================================

-- Dogs/Pets table with comprehensive hunting-specific fields
CREATE TABLE dogs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic information
    name TEXT NOT NULL,
    breed TEXT,
    breed_group TEXT, -- sporting, hound, working, etc.
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    weight_lbs REAL,
    height_inches REAL,
    color_markings TEXT,
    
    -- Registration & identification
    registration_number TEXT,
    microchip_id TEXT,
    tattoo_id TEXT,
    kennel_club TEXT,
    sire_name TEXT,
    dam_name TEXT,
    
    -- Hunting specialization
    hunting_style TEXT CHECK (hunting_style IN ('pointing', 'flushing', 'retrieving', 'tracking', 'coursing', 'versatile')),
    primary_game TEXT, -- upland birds, waterfowl, big game, etc.
    training_level TEXT DEFAULT 'started' CHECK (training_level IN ('puppy', 'started', 'seasoned', 'finished', 'master', 'champion')),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5) DEFAULT 3,
    drive_level INTEGER CHECK (drive_level BETWEEN 1 AND 5) DEFAULT 3,
    trainability INTEGER CHECK (trainability BETWEEN 1 AND 5) DEFAULT 3,
    
    -- Training certifications
    certifications TEXT, -- JSON array of certifications/titles
    test_results TEXT, -- JSON: hunt test results, field trial placements
    training_methods TEXT, -- force fetch, e-collar, positive reinforcement
    
    -- Health & medical
    health_records TEXT, -- JSON: vet records, medications
    vaccination_records TEXT, -- JSON: vaccination history
    health_conditions TEXT, -- JSON array: hip dysplasia, eye issues, etc.
    allergies TEXT, -- JSON array
    insurance_provider TEXT,
    insurance_policy TEXT,
    last_vet_visit DATE,
    
    -- Physical capabilities
    swimming_ability TEXT CHECK (swimming_ability IN ('excellent', 'good', 'fair', 'poor', 'none')),
    cold_tolerance TEXT CHECK (cold_tolerance IN ('excellent', 'good', 'fair', 'poor')),
    heat_tolerance TEXT CHECK (heat_tolerance IN ('excellent', 'good', 'fair', 'poor')),
    stamina_rating INTEGER CHECK (stamina_rating BETWEEN 1 AND 5),
    
    -- Media & documentation
    profile_image_url TEXT,
    gallery_images TEXT, -- JSON array of image URLs
    pedigree_url TEXT,
    videos TEXT, -- JSON array of video URLs with descriptions
    
    -- Social & sharing
    is_public BOOLEAN DEFAULT TRUE,
    featured_dog BOOLEAN DEFAULT FALSE,
    social_media_handles TEXT, -- JSON: {instagram: '', tiktok: ''}
    
    -- Statistics (updated via triggers/calculations)
    hunts_participated INTEGER DEFAULT 0,
    game_retrieved INTEGER DEFAULT 0,
    training_sessions_count INTEGER DEFAULT 0,
    awards_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_retired BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'retired', 'deceased', 'rehomed')),
    retirement_date DATE,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dog health tracking
CREATE TABLE dog_health_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    weight_lbs REAL,
    body_condition_score INTEGER CHECK (body_condition_score BETWEEN 1 AND 9),
    temperature_f REAL,
    heart_rate INTEGER,
    notes TEXT,
    vet_visit BOOLEAN DEFAULT FALSE,
    vaccinations_given TEXT, -- JSON array
    medications_administered TEXT, -- JSON array
    injuries_noted TEXT,
    photos TEXT, -- JSON array
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- HUNTING LOGS & GPS TRACKING
-- =============================================================================

-- Hunt logs with comprehensive tracking and privacy
CREATE TABLE hunt_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Hunt timing
    hunt_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    
    -- Location (with privacy levels)
    location_name TEXT NOT NULL,
    location_coordinates TEXT, -- Encrypted GPS coordinates
    location_region TEXT, -- General region for privacy (e.g., "Eastern Montana")
    location_state TEXT,
    location_country TEXT DEFAULT 'US',
    location_type TEXT CHECK (location_type IN ('public', 'private', 'guided', 'club', 'lease')) DEFAULT 'public',
    land_permission TEXT, -- landowner permission details
    wma_name TEXT, -- Wildlife Management Area
    hunting_unit TEXT, -- Game unit or zone
    
    -- Hunt details
    hunting_type TEXT NOT NULL CHECK (hunting_type IN ('upland', 'waterfowl', 'big_game', 'small_game', 'varmint', 'training', 'scouting')),
    species_targeted TEXT, -- JSON array
    hunting_method TEXT, -- walk-up, pass shooting, driven, etc.
    season_type TEXT, -- regular, youth, disabled, etc.
    license_type TEXT, -- resident, non-resident, etc.
    
    -- Environmental conditions
    weather_conditions TEXT, -- JSON: {temperature: 45, humidity: 60, pressure: 30.1}
    temperature_f INTEGER,
    wind_speed_mph INTEGER,
    wind_direction TEXT,
    visibility_miles REAL,
    precipitation TEXT,
    moon_phase TEXT,
    sunrise_time TIME,
    sunset_time TIME,
    
    -- Terrain & habitat
    terrain_type TEXT,
    habitat_description TEXT,
    elevation_feet INTEGER,
    water_features TEXT, -- JSON array: ponds, creeks, marshes
    vegetation_type TEXT,
    cover_density TEXT CHECK (cover_density IN ('light', 'moderate', 'heavy')),
    
    -- Equipment & firearms
    firearms_used TEXT, -- JSON array of firearm details
    ammunition_used TEXT, -- JSON array with round counts
    optics_used TEXT, -- JSON array
    clothing_gear TEXT, -- JSON array
    dog_equipment TEXT, -- JSON array: collars, bells, vests
    
    -- Companions & dogs
    dogs_present TEXT, -- JSON array of dog IDs with performance notes
    human_companions TEXT, -- JSON array of companion details
    guide_info TEXT, -- JSON if guided hunt
    
    -- Performance metrics
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    conditions_rating INTEGER CHECK (conditions_rating BETWEEN 1 AND 5),
    dog_performance_rating INTEGER CHECK (dog_performance_rating BETWEEN 1 AND 5),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    
    -- GPS & route data (encrypted)
    gps_route TEXT, -- Encrypted GPX data
    waypoints TEXT, -- JSON array of significant waypoints
    distance_miles REAL,
    elevation_gain_feet INTEGER,
    max_elevation_feet INTEGER,
    gps_accuracy_meters REAL,
    
    -- Game interaction
    game_contacts INTEGER DEFAULT 0, -- birds pointed, tracks found, etc.
    shots_fired INTEGER DEFAULT 0,
    shots_hit INTEGER DEFAULT 0,
    retrieves_made INTEGER DEFAULT 0,
    
    -- Media & documentation
    photos TEXT, -- JSON array with metadata
    videos TEXT, -- JSON array with metadata
    audio_notes TEXT, -- JSON array of voice note URLs
    
    -- Learning & improvement
    notes TEXT,
    lessons_learned TEXT,
    what_worked_well TEXT,
    areas_for_improvement TEXT,
    next_hunt_goals TEXT,
    
    -- Social sharing & privacy
    shared_publicly BOOLEAN DEFAULT FALSE,
    share_location BOOLEAN DEFAULT FALSE,
    share_specific_spots BOOLEAN DEFAULT FALSE,
    community_post_id TEXT, -- Link to brag board post
    
    -- Compliance & ethics
    hunting_license_verified BOOLEAN DEFAULT FALSE,
    bag_limit_respected BOOLEAN DEFAULT TRUE,
    safety_protocols_followed BOOLEAN DEFAULT TRUE,
    land_use_rules_followed BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game harvested tracking
CREATE TABLE game_harvested (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    hunt_log_id TEXT NOT NULL REFERENCES hunt_logs(id) ON DELETE CASCADE,
    
    -- Species information
    species TEXT NOT NULL,
    subspecies TEXT,
    common_name TEXT,
    scientific_name TEXT,
    count INTEGER NOT NULL DEFAULT 1,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    age_class TEXT CHECK (age_class IN ('adult', 'juvenile', 'unknown')),
    
    -- Harvest details
    time_harvested TIME,
    location_gps TEXT, -- Encrypted specific harvest location
    weather_at_harvest TEXT, -- JSON snapshot of conditions
    
    -- Shot details
    shooting_distance_yards INTEGER,
    shot_placement TEXT,
    ammunition_used TEXT,
    firearm_used TEXT,
    optics_used TEXT,
    shooting_position TEXT, -- standing, kneeling, prone, etc.
    
    -- Dog involvement
    dog_retrieved_by TEXT REFERENCES dogs(id),
    point_made_by TEXT REFERENCES dogs(id), -- which dog pointed
    flush_made_by TEXT REFERENCES dogs(id), -- which dog flushed
    retrieve_quality TEXT CHECK (retrieve_quality IN ('excellent', 'good', 'fair', 'poor')),
    retrieve_distance_yards INTEGER,
    retrieve_time_seconds INTEGER,
    
    -- Processing & meat care
    field_dressed BOOLEAN DEFAULT FALSE,
    field_dress_time_minutes INTEGER,
    weight_dressed_lbs REAL,
    weight_live_estimate_lbs REAL,
    meat_yield_lbs REAL,
    processing_method TEXT,
    processing_notes TEXT,
    meat_destination TEXT, -- personal consumption, donation, etc.
    
    -- Trophy measurements (for big game)
    antler_points INTEGER,
    antler_spread_inches REAL,
    score_system TEXT, -- Boone & Crockett, Pope & Young, etc.
    official_score REAL,
    unofficial_score REAL,
    
    -- Legal compliance
    hunting_license_number TEXT,
    tag_number TEXT,
    check_station TEXT,
    checked_date DATE,
    check_station_employee TEXT,
    transport_tag_number TEXT,
    
    -- Documentation
    photos TEXT, -- JSON array: field photos, processing, trophy
    videos TEXT, -- JSON array
    taxidermy_plans TEXT,
    
    -- Quality & condition
    meat_quality TEXT CHECK (meat_quality IN ('excellent', 'good', 'fair', 'poor')),
    hide_condition TEXT CHECK (hide_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    trophy_quality TEXT CHECK (trophy_quality IN ('trophy', 'good', 'average', 'management')),
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRAINING SYSTEM
-- =============================================================================

-- Training sessions with detailed metrics
CREATE TABLE training_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    location TEXT,
    
    -- Environmental conditions
    weather_conditions TEXT, -- JSON
    temperature_f INTEGER,
    wind_conditions TEXT,
    surface_conditions TEXT, -- wet, dry, frozen, etc.
    
    -- Training specifics
    trainer_name TEXT,
    training_type TEXT NOT NULL CHECK (training_type IN ('obedience', 'pointing', 'retrieving', 'steadiness', 'tracking', 'water_work', 'gundog_basics', 'field_trial', 'hunt_test', 'problem_solving')),
    training_level TEXT CHECK (training_level IN ('basic', 'intermediate', 'advanced', 'competition')),
    exercise_type TEXT NOT NULL,
    skills_practiced TEXT, -- JSON array of specific skills
    equipment_used TEXT, -- JSON array
    
    -- Training birds/game used
    training_birds_used TEXT, -- JSON array: pigeons, quail, pheasant, etc.
    bird_count INTEGER DEFAULT 0,
    live_birds_used INTEGER DEFAULT 0,
    planted_birds_used INTEGER DEFAULT 0,
    launcher_birds_used INTEGER DEFAULT 0,
    
    -- Performance ratings (1-5 scale)
    overall_performance INTEGER CHECK (overall_performance BETWEEN 1 AND 5),
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    cooperation_rating INTEGER CHECK (cooperation_rating BETWEEN 1 AND 5),
    enthusiasm_rating INTEGER CHECK (enthusiasm_rating BETWEEN 1 AND 5),
    
    -- Skill-specific ratings
    obedience_rating INTEGER CHECK (obedience_rating BETWEEN 1 AND 5),
    pointing_steadiness INTEGER CHECK (pointing_steadiness BETWEEN 1 AND 5),
    pointing_intensity INTEGER CHECK (pointing_intensity BETWEEN 1 AND 5),
    retrieve_eagerness INTEGER CHECK (retrieve_eagerness BETWEEN 1 AND 5),
    retrieve_delivery INTEGER CHECK (retrieve_delivery BETWEEN 1 AND 5),
    retrieve_to_hand INTEGER CHECK (retrieve_to_hand BETWEEN 1 AND 5),
    recall_reliability INTEGER CHECK (recall_reliability BETWEEN 1 AND 5),
    quartering_pattern INTEGER CHECK (quartering_pattern BETWEEN 1 AND 5),
    range_control INTEGER CHECK (range_control BETWEEN 1 AND 5),
    
    -- Water work specific (if applicable)
    water_entry_rating INTEGER CHECK (water_entry_rating BETWEEN 1 AND 5),
    swimming_ability INTEGER CHECK (swimming_ability BETWEEN 1 AND 5),
    marking_ability INTEGER CHECK (marking_ability BETWEEN 1 AND 5),
    
    -- Progress tracking
    session_goals TEXT,
    goals_achieved TEXT, -- JSON array
    breakthrough_moments TEXT,
    improvements_noted TEXT,
    challenges_encountered TEXT,
    regression_areas TEXT,
    problem_behaviors TEXT,
    corrections_made TEXT,
    
    -- Next steps
    next_session_goals TEXT,
    homework_assigned TEXT,
    recommended_practice TEXT,
    
    -- Media & documentation
    videos TEXT, -- JSON array with descriptions
    photos TEXT, -- JSON array
    audio_notes TEXT, -- Voice recordings
    
    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    share_with_community BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training goals and progress tracking
CREATE TABLE training_goals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    
    -- Goal definition
    goal_category TEXT NOT NULL, -- obedience, pointing, retrieving, steadiness, etc.
    goal_name TEXT NOT NULL,
    description TEXT,
    specific_skill TEXT,
    
    -- Timeline
    target_date DATE,
    start_date DATE DEFAULT (date('now')),
    completed_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Difficulty & progress
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    current_level INTEGER CHECK (current_level BETWEEN 1 AND 5) DEFAULT 1,
    target_level INTEGER CHECK (target_level BETWEEN 1 AND 5) DEFAULT 5,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    completion_criteria TEXT,
    success_metrics TEXT, -- JSON array of measurable criteria
    
    -- Milestones
    milestones TEXT, -- JSON array of milestone objects
    current_milestone TEXT,
    milestones_achieved INTEGER DEFAULT 0,
    total_milestones INTEGER,
    
    -- Related sessions
    training_sessions_count INTEGER DEFAULT 0,
    total_practice_hours REAL DEFAULT 0.0,
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMMUNITY & SOCIAL FEATURES
-- =============================================================================

-- Community posts (brag board, discussions, questions)
CREATE TABLE community_posts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Post content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'story' CHECK (post_type IN ('story', 'photo', 'video', 'question', 'discussion', 'tip', 'review', 'achievement', 'memorial')),
    category TEXT NOT NULL, -- hunting_stories, training_tips, gear_reviews, etc.
    subcategory TEXT,
    
    -- Associated records
    hunt_log_id TEXT REFERENCES hunt_logs(id), -- Link to hunt if applicable
    dog_id TEXT REFERENCES dogs(id), -- Featured dog
    training_session_id TEXT REFERENCES training_sessions(id),
    
    -- Location & timing
    location_region TEXT, -- General location for context
    hunt_date DATE, -- If sharing hunt story
    species_involved TEXT, -- JSON array
    
    -- Tags & classification
    tags TEXT, -- JSON array of tags
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    content_warnings TEXT, -- JSON array: graphic_content, etc.
    
    -- Engagement metrics
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    
    -- Moderation & quality
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    quality_score REAL DEFAULT 0.0, -- Algorithm-calculated quality
    reported_count INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'active' CHECK (moderation_status IN ('active', 'pending', 'hidden', 'removed')),
    moderator_notes TEXT,
    
    -- Privacy & visibility
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'community', 'friends', 'private')),
    allow_comments BOOLEAN DEFAULT TRUE,
    
    -- SEO & discovery
    slug TEXT, -- URL-friendly version of title
    meta_description TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Post media (images, videos)
CREATE TABLE post_media (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    
    -- Media details
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    compressed_url TEXT, -- Smaller version for mobile
    
    -- Metadata
    filename TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- For video/audio
    
    -- Content details
    caption TEXT,
    alt_text TEXT, -- Accessibility
    taken_date DATETIME,
    camera_make TEXT,
    camera_model TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    
    -- AI analysis
    ai_tags TEXT, -- JSON array of AI-detected content
    content_moderation TEXT, -- JSON: AI moderation results
    face_detection TEXT, -- JSON: detected faces (privacy)
    
    -- Organization
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE, -- Main image for post
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments system
CREATE TABLE comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL,
    content_html TEXT, -- Processed HTML version
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Moderation
    is_edited BOOLEAN DEFAULT FALSE,
    edit_count INTEGER DEFAULT 0,
    last_edited_at DATETIME,
    reported_count INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'active' CHECK (moderation_status IN ('active', 'pending', 'hidden', 'removed')),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_location ON users(location) WHERE location IS NOT NULL;
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires);
CREATE INDEX idx_users_activity ON users(is_active, last_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC) WHERE reputation_score > 0;

-- Dog indexes
CREATE INDEX idx_dogs_owner ON dogs(owner_id) WHERE is_active = TRUE;
CREATE INDEX idx_dogs_breed ON dogs(breed) WHERE breed IS NOT NULL;
CREATE INDEX idx_dogs_hunting_style ON dogs(hunting_style) WHERE hunting_style IS NOT NULL;
CREATE INDEX idx_dogs_training_level ON dogs(training_level);
CREATE INDEX idx_dogs_owner_active ON dogs(owner_id, is_active);
CREATE INDEX idx_dogs_public ON dogs(is_public, is_active) WHERE is_public = TRUE;
CREATE INDEX idx_dogs_featured ON dogs(featured_dog, is_active) WHERE featured_dog = TRUE;

-- Hunt log indexes (critical for performance)
CREATE INDEX idx_hunt_logs_user ON hunt_logs(user_id);
CREATE INDEX idx_hunt_logs_date ON hunt_logs(hunt_date DESC);
CREATE INDEX idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);
CREATE INDEX idx_hunt_logs_type ON hunt_logs(hunting_type);
CREATE INDEX idx_hunt_logs_region ON hunt_logs(location_region) WHERE location_region IS NOT NULL;
CREATE INDEX idx_hunt_logs_public ON hunt_logs(shared_publicly) WHERE shared_publicly = TRUE;
CREATE INDEX idx_hunt_logs_species ON hunt_logs(species_targeted) WHERE species_targeted IS NOT NULL;
CREATE INDEX idx_hunt_logs_success ON hunt_logs(success_rating DESC) WHERE success_rating >= 4;
CREATE INDEX idx_hunt_logs_created ON hunt_logs(created_at DESC);

-- Game harvested indexes
CREATE INDEX idx_game_hunt_log ON game_harvested(hunt_log_id);
CREATE INDEX idx_game_species ON game_harvested(species);
CREATE INDEX idx_game_date ON game_harvested(hunt_log_id, time_harvested);
CREATE INDEX idx_game_dog_retrieved ON game_harvested(dog_retrieved_by) WHERE dog_retrieved_by IS NOT NULL;

-- Training session indexes
CREATE INDEX idx_training_dog ON training_sessions(dog_id);
CREATE INDEX idx_training_user ON training_sessions(user_id);
CREATE INDEX idx_training_date ON training_sessions(session_date DESC);
CREATE INDEX idx_training_dog_date ON training_sessions(dog_id, session_date DESC);
CREATE INDEX idx_training_type ON training_sessions(training_type);
CREATE INDEX idx_training_performance ON training_sessions(overall_performance DESC) WHERE overall_performance >= 4;

-- Training goals indexes
CREATE INDEX idx_goals_dog ON training_goals(dog_id);
CREATE INDEX idx_goals_status ON training_goals(status);
CREATE INDEX idx_goals_target_date ON training_goals(target_date) WHERE target_date IS NOT NULL;
CREATE INDEX idx_goals_priority ON training_goals(priority, status);
CREATE INDEX idx_goals_progress ON training_goals(progress_percentage DESC);

-- Community posts indexes
CREATE INDEX idx_posts_user ON community_posts(user_id);
CREATE INDEX idx_posts_type ON community_posts(post_type);
CREATE INDEX idx_posts_category ON community_posts(category);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_posts_featured ON community_posts(is_featured, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_posts_public ON community_posts(visibility, moderation_status, created_at DESC) WHERE visibility = 'public' AND moderation_status = 'active';
CREATE INDEX idx_posts_engagement ON community_posts(likes_count DESC, comments_count DESC) WHERE likes_count > 0;
CREATE INDEX idx_posts_hunt_log ON community_posts(hunt_log_id) WHERE hunt_log_id IS NOT NULL;
CREATE INDEX idx_posts_quality ON community_posts(quality_score DESC) WHERE quality_score > 0;

-- Comments indexes
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_moderation ON comments(moderation_status) WHERE moderation_status != 'active';

-- Media indexes
CREATE INDEX idx_post_media_post ON post_media(post_id, display_order);
CREATE INDEX idx_post_media_type ON post_media(media_type);
CREATE INDEX idx_post_media_primary ON post_media(post_id, is_primary) WHERE is_primary = TRUE;

-- Session indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id, is_active);
CREATE INDEX idx_sessions_token ON user_sessions(session_token) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE is_active = TRUE;

-- Health log indexes
CREATE INDEX idx_health_dog ON dog_health_logs(dog_id, log_date DESC);
CREATE INDEX idx_health_vet ON dog_health_logs(vet_visit) WHERE vet_visit = TRUE;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Public hunt summary view (privacy-safe)
CREATE VIEW public_hunt_summaries AS
SELECT 
    hl.id,
    hl.hunt_date,
    hl.location_region,
    hl.hunting_type,
    hl.success_rating,
    hl.conditions_rating,
    u.display_name as hunter_name,
    u.experience_level,
    COUNT(gh.id) as game_count,
    hl.created_at
FROM hunt_logs hl
JOIN users u ON hl.user_id = u.id
LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
WHERE hl.shared_publicly = TRUE 
  AND u.is_active = TRUE
  AND hl.hunt_date >= date('now', '-1 year')
GROUP BY hl.id;

-- Dog performance summary view
CREATE VIEW dog_performance_summary AS
SELECT 
    d.id,
    d.name,
    d.breed,
    d.hunting_style,
    d.training_level,
    COUNT(ts.id) as training_sessions,
    AVG(ts.overall_performance) as avg_performance,
    COUNT(DISTINCT hl.id) as hunts_participated,
    COUNT(gh.id) as game_retrieved,
    MAX(ts.session_date) as last_training,
    d.created_at
FROM dogs d
LEFT JOIN training_sessions ts ON d.id = ts.dog_id
LEFT JOIN hunt_logs hl ON JSON_EXTRACT(hl.dogs_present, '$[*]') LIKE '%' || d.id || '%'
LEFT JOIN game_harvested gh ON d.id = gh.dog_retrieved_by
WHERE d.is_active = TRUE
GROUP BY d.id;

-- User activity summary view
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.display_name,
    u.experience_level,
    COUNT(DISTINCT d.id) as dogs_count,
    COUNT(DISTINCT hl.id) as hunts_logged,
    COUNT(DISTINCT ts.id) as training_sessions,
    COUNT(DISTINCT cp.id) as posts_created,
    AVG(hl.success_rating) as avg_hunt_success,
    MAX(u.last_active) as last_activity,
    u.created_at
FROM users u
LEFT JOIN dogs d ON u.id = d.owner_id AND d.is_active = TRUE
LEFT JOIN hunt_logs hl ON u.id = hl.user_id
LEFT JOIN training_sessions ts ON u.id = ts.user_id  
LEFT JOIN community_posts cp ON u.id = cp.user_id AND cp.moderation_status = 'active'
WHERE u.is_active = TRUE
GROUP BY u.id;