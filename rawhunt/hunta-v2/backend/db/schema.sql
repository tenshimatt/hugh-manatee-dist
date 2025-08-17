-- Hunta Database Schema
-- Clean, normalized design for dog hunting platform

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'hunter' CHECK (role IN ('hunter', 'trainer', 'admin')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dogs table - core pack management
CREATE TABLE dogs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    birth_date DATE,
    sex TEXT CHECK (sex IN ('male', 'female')),
    training_level TEXT DEFAULT 'beginner' CHECK (training_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    hunting_style TEXT, -- pointer, retriever, tracker, etc.
    description TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Hunt routes - GPS tracking
CREATE TABLE hunt_routes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    gps_data TEXT, -- JSON array of coordinates
    distance_km REAL,
    difficulty TEXT DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'hard', 'expert')),
    terrain_type TEXT,
    game_type TEXT, -- bird, deer, boar, etc.
    is_public BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Events - trials, competitions, training days
CREATE TABLE events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    organizer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'trial' CHECK (event_type IN ('trial', 'competition', 'training', 'social')),
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    max_participants INTEGER,
    entry_fee REAL DEFAULT 0,
    is_public BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Event registrations
CREATE TABLE event_registrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    dog_id TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'completed')),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dog_id) REFERENCES dogs(id),
    UNIQUE(event_id, user_id, dog_id)
);

-- Gear reviews
CREATE TABLE gear_reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL,
    gear_name TEXT NOT NULL,
    gear_category TEXT NOT NULL, -- collar, leash, vest, training, etc.
    brand TEXT,
    model TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    recommended BOOLEAN DEFAULT 1,
    price_range TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Training logs
CREATE TABLE training_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL,
    dog_id TEXT NOT NULL,
    training_date DATE NOT NULL,
    training_type TEXT NOT NULL, -- obedience, field, tracking, etc.
    duration_minutes INTEGER,
    location TEXT,
    notes TEXT,
    progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 5),
    weather_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dog_id) REFERENCES dogs(id)
);

-- Brag board posts
CREATE TABLE posts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    post_type TEXT DEFAULT 'story' CHECK (post_type IN ('story', 'photo', 'video', 'achievement')),
    media_url TEXT,
    location TEXT,
    hunt_date DATE,
    dogs_involved TEXT, -- JSON array of dog IDs
    likes_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ethics knowledge base
CREATE TABLE ethics_articles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- safety, regulations, conservation, etc.
    tags TEXT, -- JSON array
    is_featured BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_routes_user_id ON hunt_routes(user_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_public ON events(is_public);
CREATE INDEX idx_training_logs_dog_date ON training_logs(dog_id, training_date);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_posts_public_created ON posts(is_public, created_at);
CREATE INDEX idx_gear_category ON gear_reviews(gear_category);
CREATE INDEX idx_ethics_category ON ethics_articles(category);