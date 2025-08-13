-- Complete Hunta Platform Database Schema
-- All tables needed for full functionality

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    location TEXT,
    bio TEXT,
    profile_photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dogs table
CREATE TABLE IF NOT EXISTS dogs (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    birth_date DATE,
    sex TEXT CHECK (sex IN ('male', 'female')),
    training_level TEXT CHECK (training_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    hunting_style TEXT CHECK (hunting_style IN ('pointer', 'setter', 'retriever', 'flusher', 'hound')),
    description TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    organizer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('trial', 'training', 'competition', 'social', 'educational')),
    event_date DATETIME NOT NULL,
    location TEXT NOT NULL,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    dog_id TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('registered', 'waitlist', 'cancelled')) DEFAULT 'registered',
    notes TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dog_id) REFERENCES dogs(id),
    UNIQUE(event_id, user_id)
);

-- Routes table (for hunt planning)
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'difficult')),
    terrain_type TEXT,
    distance_miles DECIMAL(10,2),
    estimated_hours DECIMAL(4,2),
    gps_data TEXT, -- JSON string with GPS coordinates
    is_public BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Gear reviews table
CREATE TABLE IF NOT EXISTS gear_reviews (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    recommended BOOLEAN,
    price_paid DECIMAL(10,2),
    product_url TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Posts table (brag board)
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT NOT NULL,
    dog_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    post_type TEXT CHECK (post_type IN ('hunt_report', 'training_update', 'photo', 'question', 'general')),
    photo_url TEXT,
    location TEXT,
    hunt_date DATE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dog_id) REFERENCES dogs(id)
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_public ON routes(is_public);
CREATE INDEX IF NOT EXISTS idx_gear_reviews_user_id ON gear_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_gear_reviews_category ON gear_reviews(category);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

-- Insert demo user
INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, bio) VALUES 
('demo-user', 'demo_hunter', 'demo@hunta.com', 'demo-hash', 'Demo', 'Hunter', 'Demo user for testing the Hunta platform');

-- Insert sample dogs
INSERT OR IGNORE INTO dogs (id, user_id, name, breed, birth_date, sex, training_level, hunting_style, description) VALUES 
('dog1', 'demo-user', 'Rex', 'German Shorthaired Pointer', '2020-03-15', 'male', 'advanced', 'pointer', 'Excellent upland bird dog with strong pointing instincts and steady temperament.'),
('dog2', 'demo-user', 'Bella', 'English Setter', '2022-08-20', 'female', 'intermediate', 'setter', 'Young, eager setter with natural hunting instincts. Still learning steadiness but shows great promise.'),
('dog3', 'demo-user', 'Duke', 'Labrador Retriever', '2019-11-10', 'male', 'advanced', 'retriever', 'Seasoned waterfowl dog with exceptional marking ability. Reliable in all weather conditions.');

-- Insert sample events
INSERT OR IGNORE INTO events (id, organizer_id, title, description, event_type, event_date, location, entry_fee, max_participants) VALUES 
('event1', 'demo-user', 'Spring Field Trial', 'Annual spring field trial for pointing breeds. Open to all levels.', 'trial', '2025-04-15 09:00:00', 'Pine Ridge Hunting Preserve, Georgia', 45.00, 50),
('event2', 'demo-user', 'Retriever Training Workshop', 'Professional training workshop focusing on steadiness and marking.', 'training', '2025-03-22 10:00:00', 'Oak Creek Training Grounds, Wisconsin', 75.00, 25),
('event3', 'demo-user', 'Hunter Safety & Ethics Seminar', 'Important discussion on hunting ethics and safety practices.', 'educational', '2025-03-10 19:00:00', 'Online Webinar', 0.00, 100);

-- Insert sample routes
INSERT OR IGNORE INTO routes (id, user_id, name, description, location, difficulty_level, terrain_type, distance_miles, estimated_hours, is_public) VALUES 
('route1', 'demo-user', 'Pine Ridge Loop', 'Excellent upland bird hunting through mixed pine and oak forest.', 'Pine Ridge Preserve, GA', 'moderate', 'mixed_forest', 3.5, 2.5, 1),
('route2', 'demo-user', 'Wetland Circuit', 'Waterfowl hunting route around three connected ponds.', 'Marsh Creek WMA, AL', 'easy', 'wetland', 2.0, 1.5, 1),
('route3', 'demo-user', 'Mountain Trail', 'Challenging upland hunt in steep terrain with great views.', 'Blue Ridge Mountains, NC', 'difficult', 'mountain', 5.2, 4.0, 0);

-- Insert sample gear reviews
INSERT OR IGNORE INTO gear_reviews (id, user_id, product_name, brand, category, rating, review_text, pros, cons, recommended, price_paid) VALUES 
('gear1', 'demo-user', 'Alpha 200i GPS Collar', 'Garmin', 'GPS_Tracking', 5, 'Outstanding GPS collar with excellent battery life and accurate tracking.', 'Long battery life, accurate GPS, durable construction', 'Expensive, complex setup initially', 1, 649.99),
('gear2', 'demo-user', 'Upland Hunting Vest', 'Filson', 'Clothing', 4, 'Well-made vest with good storage and comfort for long hunts.', 'Durable, comfortable, lots of pockets', 'Heavy when fully loaded, expensive', 1, 198.00),
('gear3', 'demo-user', 'Whistle Training System', 'SportDOG', 'Training', 3, 'Decent training collar but battery life could be better.', 'Effective training tool, multiple settings', 'Short battery life, sometimes inconsistent', 0, 179.95);

-- Insert sample posts
INSERT OR IGNORE INTO posts (id, user_id, dog_id, title, content, post_type, location, hunt_date, likes_count, comments_count) VALUES 
('post1', 'demo-user', 'dog1', 'Great Opening Day!', 'Rex had an amazing opening day - pointed 6 coveys and held steady on all retrieves. Could not be more proud of this dog!', 'hunt_report', 'Pine Ridge Preserve, GA', '2025-01-15', 12, 3),
('post2', 'demo-user', 'dog2', 'Training Progress Update', 'Bella is really coming along with her steadiness training. Still working on the stay command but her natural pointing instincts are incredible.', 'training_update', 'Home Training Grounds', '2025-01-20', 8, 2),
('post3', 'demo-user', 'dog3', 'Duke Retrieves His 100th Duck!', 'Milestone day for Duke - retrieved his 100th waterfowl today. This old boy still has it at 5 years old!', 'hunt_report', 'Marsh Creek WMA, AL', '2025-01-18', 18, 5);