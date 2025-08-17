-- Rawgle Platform Database Schema
-- SQLite schema for D1 database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    solana_wallet TEXT,
    subscription_type TEXT DEFAULT 'free',
    paws_balance INTEGER DEFAULT 50,
    total_earned_paws INTEGER DEFAULT 50,
    daily_paws_earned INTEGER DEFAULT 0,
    last_paws_reset TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pet profiles table
CREATE TABLE IF NOT EXISTS pet_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    weight REAL,
    gender TEXT,
    microchip_id TEXT,
    medical_conditions TEXT,
    medications TEXT,
    allergies TEXT,
    feeding_schedule TEXT,
    activity_level TEXT,
    profile_completion INTEGER DEFAULT 0,
    nft_mint_address TEXT,
    is_memorial BOOLEAN DEFAULT FALSE,
    memorial_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feeding logs table
CREATE TABLE IF NOT EXISTS feeding_logs (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    food_type TEXT NOT NULL,
    amount REAL NOT NULL,
    feeding_time TEXT NOT NULL,
    notes TEXT,
    paws_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pet_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PAWS transactions table
CREATE TABLE IF NOT EXISTS paws_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'earned', 'spent', 'transferred_in', 'transferred_out'
    amount INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'profile_completion', 'daily_feeding', 'nft_mint', 'transfer', etc.
    reference_id TEXT, -- pet_id, nft_id, etc.
    recipient_user_id TEXT,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- AI medical consultations table
CREATE TABLE IF NOT EXISTS ai_consultations (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    images TEXT, -- JSON array of image URLs
    ai_assessment TEXT NOT NULL,
    confidence_score REAL,
    emergency_level TEXT, -- 'low', 'medium', 'high', 'emergency'
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pet_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    pet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES ai_consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pet_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NFT mints table
CREATE TABLE IF NOT EXISTS nft_mints (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    mint_address TEXT UNIQUE,
    metadata_uri TEXT,
    paws_cost INTEGER NOT NULL,
    mint_status TEXT DEFAULT 'pending', -- 'pending', 'minted', 'failed'
    transaction_signature TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    minted_at TEXT,
    FOREIGN KEY (pet_id) REFERENCES pet_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NFT marketplace listings table
CREATE TABLE IF NOT EXISTS nft_listings (
    id TEXT PRIMARY KEY,
    nft_mint_id TEXT NOT NULL,
    seller_user_id TEXT NOT NULL,
    price_paws INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'sold', 'cancelled'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    sold_at TEXT,
    buyer_user_id TEXT,
    FOREIGN KEY (nft_mint_id) REFERENCES nft_mints(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Daily metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id TEXT PRIMARY KEY,
    metric_date TEXT UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    total_pets INTEGER DEFAULT 0,
    new_pets INTEGER DEFAULT 0,
    total_consultations INTEGER DEFAULT 0,
    emergency_consultations INTEGER DEFAULT 0,
    total_paws_earned INTEGER DEFAULT 0,
    total_paws_spent INTEGER DEFAULT 0,
    nfts_minted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    activity_data TEXT, -- JSON data
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_user ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_pet ON feeding_logs(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_user ON feeding_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_date ON feeding_logs(feeding_time);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_user ON paws_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_type ON paws_transactions(type);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_date ON paws_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_pet ON ai_consultations(pet_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON ai_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_emergency ON ai_consultations(emergency_level);
CREATE INDEX IF NOT EXISTS idx_nft_mints_pet ON nft_mints(pet_id);
CREATE INDEX IF NOT EXISTS idx_nft_mints_user ON nft_mints(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_listings_status ON nft_listings(status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(activity_type);