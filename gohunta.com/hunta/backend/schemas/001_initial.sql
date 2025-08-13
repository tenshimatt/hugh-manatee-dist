-- Hunta Database Schema
-- Initial migration for core tables

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT CHECK(role IN ('hunter', 'trainer', 'admin')) DEFAULT 'hunter',
    profile_image_url TEXT,
    location TEXT,
    phone TEXT,
    bio TEXT,
    experience_level TEXT CHECK(experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
    privacy_level TEXT CHECK(privacy_level IN ('public', 'friends', 'private')) DEFAULT 'public',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dog profiles table
CREATE TABLE IF NOT EXISTS dogs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    weight REAL,
    gender TEXT CHECK(gender IN ('male', 'female')),
    color TEXT,
    microchip_id TEXT,
    registration_number TEXT,
    specialization TEXT, -- tracking, retrieving, pointing, etc.
    training_level TEXT CHECK(training_level IN ('puppy', 'basic', 'intermediate', 'advanced', 'competition')) DEFAULT 'basic',
    health_notes TEXT,
    temperament TEXT,
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hunt routes and GPS data
CREATE TABLE IF NOT EXISTS hunt_routes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT,
    start_latitude REAL,
    start_longitude REAL,
    gpx_data TEXT, -- Full GPX file content
    distance_km REAL,
    elevation_gain_m REAL,
    difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'moderate', 'difficult', 'expert')) DEFAULT 'moderate',
    terrain_type TEXT,
    wildlife_spotted TEXT, -- JSON array of wildlife
    weather_conditions TEXT,
    route_status TEXT CHECK(route_status IN ('draft', 'public', 'private')) DEFAULT 'public',
    tags TEXT, -- JSON array of tags
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events and trials
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organizer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK(event_type IN ('trial', 'competition', 'training', 'social', 'workshop')) NOT NULL,
    category TEXT, -- field trial, hunt test, obedience, etc.
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    registration_deadline DATETIME,
    max_participants INTEGER,
    entry_fee REAL DEFAULT 0,
    requirements TEXT,
    contact_info TEXT,
    website_url TEXT,
    status TEXT CHECK(status IN ('draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled')) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    dog_id TEXT,
    registration_status TEXT CHECK(registration_status IN ('pending', 'confirmed', 'waitlist', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE SET NULL,
    UNIQUE(event_id, user_id, dog_id)
);

-- Gear reviews and loadouts
CREATE TABLE IF NOT EXISTS gear_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL, -- GPS collar, whistle, gear vest, etc.
    description TEXT,
    model_number TEXT,
    price REAL,
    weight_grams REAL,
    dimensions TEXT,
    image_url TEXT,
    website_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gear reviews
CREATE TABLE IF NOT EXISTS gear_reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    gear_item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    title TEXT,
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    durability_rating INTEGER CHECK(durability_rating >= 1 AND durability_rating <= 5),
    value_rating INTEGER CHECK(value_rating >= 1 AND value_rating <= 5),
    would_recommend BOOLEAN,
    usage_duration_months INTEGER,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gear_item_id) REFERENCES gear_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(gear_item_id, user_id)
);

-- User loadouts (gear combinations)
CREATE TABLE IF NOT EXISTS loadouts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hunt_type TEXT, -- upland, waterfowl, tracking, etc.
    season TEXT,
    terrain TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Loadout items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS loadout_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    loadout_id TEXT NOT NULL,
    gear_item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (loadout_id) REFERENCES loadouts(id) ON DELETE CASCADE,
    FOREIGN KEY (gear_item_id) REFERENCES gear_items(id) ON DELETE CASCADE,
    UNIQUE(loadout_id, gear_item_id)
);

-- Ethics knowledge base
CREATE TABLE IF NOT EXISTS ethics_articles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL, -- safety, legal, conservation, etc.
    tags TEXT, -- JSON array
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    featured_image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT CHECK(status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Brag board posts (hunt stories and journals)
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    dog_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT CHECK(post_type IN ('story', 'journal', 'photo', 'video', 'achievement')) DEFAULT 'story',
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    hunt_date DATE,
    species_harvested TEXT, -- JSON array
    weather_conditions TEXT,
    tags TEXT, -- JSON array
    privacy_level TEXT CHECK(privacy_level IN ('public', 'friends', 'private')) DEFAULT 'public',
    is_featured BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE SET NULL
);

-- Post media (photos/videos)
CREATE TABLE IF NOT EXISTS post_media (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    post_id TEXT NOT NULL,
    media_type TEXT CHECK(media_type IN ('image', 'video')) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- for videos
    ai_tags TEXT, -- JSON array of AI-generated tags
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Training logs
CREATE TABLE IF NOT EXISTS training_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    dog_id TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER,
    training_type TEXT NOT NULL, -- obedience, tracking, retrieving, etc.
    location_name TEXT,
    weather_conditions TEXT,
    goals TEXT,
    activities TEXT, -- JSON array of activities
    progress_notes TEXT,
    challenges TEXT,
    successes TEXT,
    next_session_notes TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    is_private BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_dogs_owner ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_routes_user ON hunt_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_location ON hunt_routes(start_latitude, start_longitude);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gear_category ON gear_items(category);
CREATE INDEX IF NOT EXISTS idx_reviews_gear ON gear_reviews(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_training_user_dog ON training_logs(user_id, dog_id);
CREATE INDEX IF NOT EXISTS idx_training_date ON training_logs(date);