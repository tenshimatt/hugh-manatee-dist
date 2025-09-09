-- Minimal authentication setup for RAWGLE platform
-- This creates just the essential table needed for JWT authentication to work

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create minimal users table 
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT TRUE, -- Set to true by default for basic implementation
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'user' CHECK (account_type IN ('user', 'business', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert test admin user (password: admin123)
INSERT INTO users (name, email, password_hash, account_type) VALUES (
    'Admin User',
    'admin@rawgle.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert test regular user (password: password123)
INSERT INTO users (name, email, password_hash, account_type) VALUES (
    'Test User',
    'user@rawgle.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'user'
) ON CONFLICT (email) DO NOTHING;