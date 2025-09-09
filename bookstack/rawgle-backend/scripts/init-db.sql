-- RAWGLE Database Initialization Script
-- This script sets up the basic database structure for the RAWGLE backend

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable crypto extension for random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE account_type AS ENUM ('user', 'business', 'admin');
CREATE TYPE pet_type AS ENUM ('dog', 'cat');
CREATE TYPE weight_unit AS ENUM ('lbs', 'kg');
CREATE TYPE activity_level AS ENUM ('low', 'moderate', 'high', 'very-high');
CREATE TYPE health_record_type AS ENUM ('weight', 'vet_visit', 'vaccination', 'symptom', 'medication');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    account_type account_type DEFAULT 'user',
    paws_tokens INTEGER DEFAULT 0 CHECK (paws_tokens >= 0),
    level VARCHAR(20) DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires ON email_verification_tokens(expires_at);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_tokens_expires ON password_reset_tokens(expires_at);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    type pet_type NOT NULL,
    age INTEGER CHECK (age > 0 AND age < 50),
    weight DECIMAL(5,2) CHECK (weight > 0),
    weight_unit weight_unit NOT NULL,
    activity_level activity_level NOT NULL,
    current_diet TEXT,
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create indexes for pets
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_health_score ON pets(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_pets_breed ON pets(breed);
CREATE INDEX IF NOT EXISTS idx_pets_type ON pets(type);

-- Create trigger for pets updated_at
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    record_type health_record_type NOT NULL,
    record_date DATE NOT NULL,
    data JSONB NOT NULL,
    notes TEXT,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for health records
CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_data_gin ON health_records USING GIN (data);

-- Create some initial data for development
INSERT INTO users (name, email, email_verified, password_hash) VALUES
    ('Test User', 'test@rawgle.com', true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1w9q8/UqdG'),
    ('Admin User', 'admin@rawgle.com', true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1w9q8/UqdG')
ON CONFLICT (email) DO NOTHING;

-- Insert test pets
INSERT INTO pets (user_id, name, breed, type, age, weight, weight_unit, activity_level, current_diet) 
SELECT 
    u.id,
    'Max',
    'Golden Retriever',
    'dog'::pet_type,
    5,
    65.5,
    'lbs'::weight_unit,
    'high'::activity_level,
    'Raw diet with chicken and vegetables'
FROM users u WHERE u.email = 'test@rawgle.com'
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO pets (user_id, name, breed, type, age, weight, weight_unit, activity_level, current_diet) 
SELECT 
    u.id,
    'Luna',
    'Maine Coon',
    'cat'::pet_type,
    3,
    12.2,
    'lbs'::weight_unit,
    'moderate'::activity_level,
    'Raw diet with fish and organs'
FROM users u WHERE u.email = 'test@rawgle.com'
ON CONFLICT (user_id, name) DO NOTHING;

-- Log initialization
INSERT INTO health_records (pet_id, record_type, record_date, data, notes)
SELECT 
    p.id,
    'weight'::health_record_type,
    CURRENT_DATE,
    jsonb_build_object('weight', p.weight, 'unit', p.weight_unit),
    'Initial weight record'
FROM pets p
WHERE NOT EXISTS (
    SELECT 1 FROM health_records hr 
    WHERE hr.pet_id = p.id AND hr.record_type = 'weight'::health_record_type
);

-- Create database info view for monitoring
CREATE OR REPLACE VIEW database_info AS
SELECT 
    'users' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('users')) as size
FROM users
UNION ALL
SELECT 
    'pets' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('pets')) as size
FROM pets
UNION ALL
SELECT 
    'health_records' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('health_records')) as size
FROM health_records;

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rawgle_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

COMMIT;