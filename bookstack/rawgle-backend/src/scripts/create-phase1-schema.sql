-- Raw Pet Food Platform Phase 1 MVP Database Schema
-- Comprehensive schema for authentication, pet management, suppliers, reviews, blog, and AI chat

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial queries

-- Drop existing tables if recreating (be careful in production)
-- DROP TABLE IF EXISTS blog_comments CASCADE;
-- DROP TABLE IF EXISTS blog_articles CASCADE;
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS chat_conversations CASCADE;
-- DROP TABLE IF EXISTS paws_transactions CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS user_sessions CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;
-- DROP TABLE IF EXISTS health_records CASCADE;
-- DROP TABLE IF EXISTS weight_tracking CASCADE;
-- DROP TABLE IF EXISTS feeding_entries CASCADE;
-- DROP TABLE IF EXISTS pets CASCADE;
-- DROP TABLE IF EXISTS password_reset_tokens CASCADE;
-- DROP TABLE IF EXISTS email_verification_tokens CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE (Enhanced from existing)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    account_type VARCHAR(20) DEFAULT 'user' CHECK (account_type IN ('user', 'business', 'admin')),
    paws_tokens INTEGER DEFAULT 100 CHECK (paws_tokens >= 0), -- Welcome bonus
    level VARCHAR(20) DEFAULT 'Bronze',
    phone VARCHAR(20),
    date_of_birth DATE,
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PETS TABLE
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(10) DEFAULT 'dog' CHECK (species IN ('dog', 'cat')),
    breed VARCHAR(100) NOT NULL,
    age_years INTEGER CHECK (age_years >= 0 AND age_years <= 30),
    age_months INTEGER CHECK (age_months >= 0 AND age_months <= 11),
    weight_lbs DECIMAL(5,2) NOT NULL CHECK (weight_lbs > 0),
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    gender VARCHAR(10) DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
    neutered BOOLEAN DEFAULT FALSE,
    activity_level VARCHAR(15) DEFAULT 'moderate' CHECK (activity_level IN ('low', 'moderate', 'high', 'very_high')),
    body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
    avatar_url TEXT,
    medical_conditions TEXT[], -- Array of conditions
    allergies TEXT[], -- Array of allergies
    dietary_restrictions TEXT[], -- Array of restrictions
    microchip_id VARCHAR(50),
    vet_name VARCHAR(100),
    vet_clinic VARCHAR(100),
    vet_phone VARCHAR(20),
    vet_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FEEDING ENTRIES TABLE
CREATE TABLE IF NOT EXISTS feeding_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type VARCHAR(15) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_type VARCHAR(20) NOT NULL CHECK (food_type IN ('raw', 'kibble', 'wet', 'freeze_dried', 'treats')),
    food_brand VARCHAR(100),
    food_protein_source VARCHAR(100),
    amount_grams DECIMAL(7,2) NOT NULL CHECK (amount_grams > 0),
    amount_oz DECIMAL(7,2) NOT NULL CHECK (amount_oz > 0),
    calories_estimated INTEGER CHECK (calories_estimated > 0),
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WEIGHT TRACKING TABLE
CREATE TABLE IF NOT EXISTS weight_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_lbs DECIMAL(5,2) NOT NULL CHECK (weight_lbs > 0),
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HEALTH RECORDS TABLE
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('vaccination', 'checkup', 'illness', 'injury', 'medication', 'test_result')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    veterinarian VARCHAR(100),
    clinic VARCHAR(100),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    documents TEXT[], -- Array of document URLs
    next_appointment DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for geospatial queries
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    website TEXT,
    email VARCHAR(255),
    business_hours JSONB, -- Store as JSON for flexible hours
    supplier_type VARCHAR(20) NOT NULL CHECK (supplier_type IN ('retail', 'online', 'farm', 'butcher', 'co_op')),
    product_categories TEXT[] NOT NULL, -- Array of categories
    verified BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    photos TEXT[], -- Array of photo URLs
    features TEXT[], -- Array of features like 'organic', 'local', 'delivery'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    photos TEXT[], -- Array of photo URLs
    purchase_verified BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0 CHECK (helpful_votes >= 0),
    total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
    flagged BOOLEAN DEFAULT FALSE,
    admin_response TEXT,
    product_reviewed VARCHAR(200),
    visit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, supplier_id) -- One review per user per supplier
);

-- 8. CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    title VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
    topic_category VARCHAR(20) CHECK (topic_category IN ('nutrition', 'health', 'behavior', 'feeding', 'general')),
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    escalated_to_expert BOOLEAN DEFAULT FALSE,
    expert_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'ai', 'expert')),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for AI messages
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'calculation', 'recommendation')),
    ai_model_used VARCHAR(50),
    processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
    metadata JSONB, -- Store pet context, calculations, sources, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BLOG ARTICLES TABLE
CREATE TABLE IF NOT EXISTS blog_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    reading_time_minutes INTEGER CHECK (reading_time_minutes > 0),
    seo_title VARCHAR(300),
    seo_description TEXT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BLOG COMMENTS TABLE
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PAWS TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS paws_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent', 'transferred', 'bonus', 'penalty')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    source VARCHAR(30) NOT NULL CHECK (source IN ('review', 'referral', 'purchase', 'signup_bonus', 'transfer', 'admin_adjustment')),
    reference_id UUID, -- Generic reference to related entity
    description VARCHAR(500) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('points_earned', 'review_response', 'expert_message', 'system_alert', 'blog_mention')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    icon VARCHAR(50),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. USER SESSIONS TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EMAIL VERIFICATION TOKENS (Already exists, ensuring consistency)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PASSWORD RESET TOKENS (Already exists, ensuring consistency)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Pet indexes  
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at DESC);

-- Feeding entries indexes
CREATE INDEX IF NOT EXISTS idx_feeding_pet_id ON feeding_entries(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeding_user_id ON feeding_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_date ON feeding_entries(date DESC);

-- Weight tracking indexes
CREATE INDEX IF NOT EXISTS idx_weight_pet_id ON weight_tracking(pet_id);
CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_tracking(measurement_date DESC);

-- Health records indexes
CREATE INDEX IF NOT EXISTS idx_health_pet_id ON health_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_date ON health_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_health_type ON health_records(record_type);

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_suppliers_city_state ON suppliers(city, state);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_verified ON suppliers(verified);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(average_rating DESC);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id ON reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_featured ON blog_articles(featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_article_id ON blog_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_paws_transactions_user_id ON paws_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_created_at ON paws_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paws_transactions_type ON paws_transactions(type);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Token indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON blog_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON blog_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNCTIONS FOR BUSINESS LOGIC

-- Function to update supplier rating when review is added/updated
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE suppliers 
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
        )
    WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_supplier_rating();

-- Function to update PAWS token balance
CREATE OR REPLACE FUNCTION update_paws_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET paws_tokens = NEW.balance_after
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_paws_balance
    AFTER INSERT ON paws_transactions
    FOR EACH ROW EXECUTE FUNCTION update_paws_balance();

-- Function to set location geography from lat/lng
CREATE OR REPLACE FUNCTION set_supplier_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_Point(NEW.longitude, NEW.latitude)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_supplier_location
    BEFORE INSERT OR UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION set_supplier_location();

-- Insert sample admin user (password is 'admin123' - should be changed in production)
INSERT INTO users (name, email, email_verified, password_hash, account_type, paws_tokens, level) 
VALUES (
    'System Administrator',
    'admin@rawgle.com',
    true,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe', -- bcrypt hash of 'admin123'
    'admin',
    1000,
    'Platinum'
) ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Phase 1 MVP Database Schema Created Successfully!' as status;