-- Migration: Create Users Table for RAWGLE MVP  
-- Comprehensive user authentication and profile management
-- Created: 2025-09-07
-- Component: User Authentication System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user account type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_account_type') THEN
        CREATE TYPE user_account_type AS ENUM ('user', 'business', 'admin');
    END IF;
END
$$;

-- Create comprehensive users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication fields
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    account_type user_account_type DEFAULT 'user',
    avatar_url TEXT,
    
    -- Contact information
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Location
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Account status and verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP,
    
    -- Password reset
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    
    -- Security and account locking
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    token_version INTEGER DEFAULT 1,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP DEFAULT NOW(),
    
    -- RAWGLE specific fields
    paws_tokens INTEGER DEFAULT 100 CHECK (paws_tokens >= 0),
    level VARCHAR(20) DEFAULT 'Bronze',
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0;
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until) WHERE account_locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add constraints (PostgreSQL doesn't support IF NOT EXISTS for ADD CONSTRAINT)
DO $$
BEGIN
    -- Email format constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_email_format') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_email_format 
            CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
    
    -- Password hash length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_password_hash_length') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_password_hash_length 
            CHECK (LENGTH(password_hash) >= 60);
    END IF;
    
    -- First name length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_first_name_length') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_first_name_length 
            CHECK (first_name IS NULL OR (LENGTH(first_name) >= 1 AND LENGTH(first_name) <= 100));
    END IF;
    
    -- Last name length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_last_name_length') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_last_name_length 
            CHECK (last_name IS NULL OR (LENGTH(last_name) >= 1 AND LENGTH(last_name) <= 100));
    END IF;
    
    -- Failed attempts range constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_failed_attempts_range') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_failed_attempts_range 
            CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 50);
    END IF;
    
    -- Token version positive constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_token_version_positive') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_token_version_positive 
            CHECK (token_version > 0);
    END IF;
    
    -- Coordinates valid constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_coordinates_valid') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_coordinates_valid 
            CHECK ((location_lat IS NULL AND location_lng IS NULL) OR 
                   (location_lat IS NOT NULL AND location_lng IS NOT NULL AND 
                    location_lat >= -90 AND location_lat <= 90 AND 
                    location_lng >= -180 AND location_lng <= 180));
    END IF;
END
$$;

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION clean_expired_auth_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
    row_count_temp INTEGER;
BEGIN
    -- Clean expired email verification tokens
    UPDATE users 
    SET email_verification_token = NULL, 
        email_verification_expires = NULL 
    WHERE email_verification_expires < NOW() 
      AND email_verification_token IS NOT NULL;
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    cleaned_count := cleaned_count + row_count_temp;
    
    -- Clean expired password reset tokens
    UPDATE users 
    SET password_reset_token = NULL, 
        password_reset_expires = NULL 
    WHERE password_reset_expires < NOW() 
      AND password_reset_token IS NOT NULL;
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    cleaned_count := cleaned_count + row_count_temp;
    
    -- Unlock accounts that have passed their lock time
    UPDATE users 
    SET account_locked_until = NULL 
    WHERE account_locked_until < NOW();
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    cleaned_count := cleaned_count + row_count_temp;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment token version (invalidates all existing tokens)
CREATE OR REPLACE FUNCTION increment_user_token_version(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    new_version INTEGER;
BEGIN
    UPDATE users 
    SET token_version = token_version + 1,
        updated_at = NOW()
    WHERE id = user_id_param
    RETURNING token_version INTO new_version;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with id: %', user_id_param;
    END IF;
    
    RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- Function to safely update password (includes security measures)
CREATE OR REPLACE FUNCTION update_user_password(
    user_id_param UUID,
    new_password_hash TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET password_hash = new_password_hash,
        token_version = token_version + 1, -- Invalidate all existing tokens
        password_changed_at = NOW(),
        failed_login_attempts = 0, -- Reset failed attempts
        account_locked_until = NULL, -- Unlock account
        updated_at = NOW()
    WHERE id = user_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with id: %', user_id_param;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    user_email_param VARCHAR,
    success BOOLEAN,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_found UUID;
BEGIN
    SELECT id INTO user_id_found 
    FROM users 
    WHERE email = user_email_param;
    
    IF NOT FOUND THEN
        -- User doesn't exist, but don't reveal this information
        RETURN FALSE;
    END IF;
    
    IF success THEN
        -- Successful login
        UPDATE users 
        SET failed_login_attempts = 0,
            account_locked_until = NULL,
            last_login_at = NOW(),
            last_login_ip = ip_address,
            updated_at = NOW()
        WHERE id = user_id_found;
    ELSE
        -- Failed login
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            updated_at = NOW()
        WHERE id = user_id_found;
        
        -- Check if account should be locked
        UPDATE users 
        SET account_locked_until = NOW() + INTERVAL '1 hour' * POWER(2, LEAST(failed_login_attempts - 5, 5))
        WHERE id = user_id_found 
          AND failed_login_attempts >= 5 
          AND (account_locked_until IS NULL OR account_locked_until < NOW());
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update password_changed_at when password changes
CREATE OR REPLACE FUNCTION update_password_changed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash != NEW.password_hash THEN
        NEW.password_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_password_changed
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
    EXECUTE FUNCTION update_password_changed_timestamp();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- Create view for safe user data access (excludes sensitive fields)
CREATE OR REPLACE VIEW users_safe AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    account_type,
    avatar_url,
    phone,
    date_of_birth,
    location_address,
    location_lat,
    location_lng,
    email_verified,
    paws_tokens,
    level,
    failed_login_attempts,
    account_locked_until,
    last_login_at,
    created_at,
    updated_at
FROM users;

-- Create admin user for development
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    account_type,
    email_verified,
    token_version
) VALUES (
    'admin@rawgle.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe', -- bcrypt of 'admin123'
    'Admin',
    'User',
    'admin',
    TRUE,
    1
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO rawgle_user;
GRANT SELECT ON users_safe TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Users table created successfully with comprehensive authentication features!' as result;

-- Display table info
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;