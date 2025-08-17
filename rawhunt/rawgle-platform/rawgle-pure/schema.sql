-- Rawgle Platform Database Schema
-- Comprehensive schema for all tables used in unit and integration tests

-- Users table - core user information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  wallet_address TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  paws_balance INTEGER DEFAULT 0,
  nft_holder BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pet profiles table
CREATE TABLE IF NOT EXISTS pet_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  age_category TEXT,
  weight REAL,
  activity_level TEXT DEFAULT 'moderate',
  profile_image_r2_key TEXT,
  private_bio TEXT,
  memorial_mode BOOLEAN DEFAULT FALSE,
  nft_mint_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Feeding logs table
CREATE TABLE IF NOT EXISTS feeding_logs (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  meal_time TEXT,
  food_type TEXT,
  quantity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pet_profiles(id)
);

-- AI Medical consultations table
CREATE TABLE IF NOT EXISTS ai_consultations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  image_r2_keys TEXT, -- JSON array of image keys
  ai_assessment TEXT,
  confidence_score REAL,
  emergency BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pet_profiles(id)
);

-- PAWS transactions table
CREATE TABLE IF NOT EXISTS paws_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- reward, spend, transfer, mint
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  solana_tx_hash TEXT,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- NFT mints table
CREATE TABLE IF NOT EXISTS nft_mints (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  solana_mint_address TEXT,
  metadata_r2_key TEXT,
  is_legacy BOOLEAN DEFAULT FALSE,
  mint_cost_paws INTEGER,
  ipfs_hash TEXT,
  minted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pet_profiles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily metrics table for analytics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  metric_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_pets INTEGER DEFAULT 0,
  feeding_logs_count INTEGER DEFAULT 0,
  ai_consultations_count INTEGER DEFAULT 0,
  nft_mints_count INTEGER DEFAULT 0,
  paws_distributed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  pet_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- emergency_medical, urgent_care, etc.
  message TEXT,
  status TEXT DEFAULT 'active', -- active, resolved, dismissed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (consultation_id) REFERENCES ai_consultations(id),
  FOREIGN KEY (pet_id) REFERENCES pet_profiles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User sessions table (for auth)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Subscription details table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL, -- free, paid, premium
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  payment_method TEXT,
  stripe_subscription_id TEXT,
  current_period_start DATETIME,
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Store items table
CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_paws INTEGER,
  price_usd REAL,
  category TEXT,
  image_r2_key TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price_paws INTEGER,
  total_price_usd REAL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES store_items(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pet_profiles_user_id ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_pet_id ON feeding_logs(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_date ON feeding_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_pet_id ON ai_consultations(pet_id);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_user_id ON paws_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_status ON paws_transactions(status);
CREATE INDEX IF NOT EXISTS idx_nft_mints_pet_id ON nft_mints(pet_id);
CREATE INDEX IF NOT EXISTS idx_nft_mints_user_id ON nft_mints(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);