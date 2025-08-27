-- Social Authentication Support
-- Migration 0003: Add social authentication tables and columns

-- Add social provider fields to users table
ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'email';
ALTER TABLE users ADD COLUMN provider_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Social authentication accounts table (for linking multiple providers)
CREATE TABLE user_social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL, -- 'google', 'facebook', 'apple', 'twitter', 'wechat'
    provider_id TEXT NOT NULL, -- Provider's user ID
    provider_email TEXT,
    provider_name TEXT,
    provider_avatar TEXT,
    access_token TEXT, -- Encrypted/hashed
    refresh_token TEXT, -- Encrypted/hashed
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_id) -- Prevent duplicate social accounts
);

-- OAuth state management for security (CSRF protection)
CREATE TABLE oauth_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_token TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    redirect_uri TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_social_accounts_user ON user_social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider ON user_social_accounts(provider, provider_id);
CREATE INDEX idx_oauth_states_token ON oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);

-- Allow password_hash to be null for social-only accounts
-- (This is a schema change that would require recreation in SQLite, but we'll handle it in code)
-- Users can set a password later if they want local authentication