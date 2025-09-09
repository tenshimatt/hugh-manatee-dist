-- RAWGLE DATABASE INCREMENTAL MIGRATION
-- Adds new tables for comprehensive pet management platform
-- Safe for production - only creates new tables, preserves existing data

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create new tables that don't exist yet

-- PETS TABLE
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
    medical_conditions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    microchip_id VARCHAR(50),
    vet_name VARCHAR(100),
    vet_clinic VARCHAR(100),
    vet_phone VARCHAR(20),
    vet_address TEXT,
    daily_feeding_schedule JSONB DEFAULT '{"breakfast": "08:00", "dinner": "18:00"}',
    target_daily_calories INTEGER CHECK (target_daily_calories > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEEDING ENTRIES TABLE
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
    cost_per_serving DECIMAL(6,2) CHECK (cost_per_serving >= 0),
    notes TEXT,
    photos TEXT[] DEFAULT '{}',
    location_fed TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WEIGHT TRACKING TABLE
CREATE TABLE IF NOT EXISTS weight_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_lbs DECIMAL(5,2) NOT NULL CHECK (weight_lbs > 0),
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    measurement_method VARCHAR(20) DEFAULT 'scale' CHECK (measurement_method IN ('scale', 'vet_visit', 'estimated')),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH RECORDS TABLE
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
    documents TEXT[] DEFAULT '{}',
    next_appointment DATE,
    medication_schedule JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPLIERS TABLE (Standard PostgreSQL, no PostGIS)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    website TEXT,
    email VARCHAR(255),
    business_hours JSONB DEFAULT '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}',
    supplier_type VARCHAR(20) NOT NULL CHECK (supplier_type IN ('retail', 'online', 'farm', 'butcher', 'co_op')),
    product_categories TEXT[] NOT NULL DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    photos TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    delivery_available BOOLEAN DEFAULT FALSE,
    pickup_available BOOLEAN DEFAULT TRUE,
    online_ordering BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    purchase_verified BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0 CHECK (helpful_votes >= 0),
    total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
    flagged BOOLEAN DEFAULT FALSE,
    admin_response TEXT,
    product_reviewed VARCHAR(200),
    visit_date DATE,
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    customer_service_rating INTEGER CHECK (customer_service_rating >= 1 AND customer_service_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, supplier_id)
);

-- CHAT CONVERSATIONS TABLE
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
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'ai', 'expert')),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'calculation', 'recommendation')),
    ai_model_used VARCHAR(50),
    processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BLOG ARTICLES TABLE
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
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BLOG COMMENTS TABLE
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

-- PAWS TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS paws_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent', 'transferred', 'bonus', 'penalty')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    source VARCHAR(30) NOT NULL CHECK (source IN ('review', 'referral', 'purchase', 'signup_bonus', 'transfer', 'admin_adjustment', 'daily_login', 'feeding_log')),
    reference_id UUID,
    description VARCHAR(500) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('points_earned', 'review_response', 'expert_message', 'system_alert', 'blog_mention', 'feeding_reminder', 'vet_reminder')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    icon VARCHAR(50),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    response_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    request_size INTEGER,
    response_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BACKUP LOGS TABLE
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'table_specific')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    file_path TEXT,
    file_size_bytes BIGINT,
    tables_included TEXT[],
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by VARCHAR(50) DEFAULT 'system'
);

-- CREATE PERFORMANCE INDEXES

-- Pet indexes (only create if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pets') THEN
        CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
        CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
        CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pets_breed ON pets(breed);
    END IF;
END $$;

-- Create all other indexes conditionally
DO $$
BEGIN
    -- Feeding entries indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feeding_entries') THEN
        CREATE INDEX IF NOT EXISTS idx_feeding_pet_id ON feeding_entries(pet_id);
        CREATE INDEX IF NOT EXISTS idx_feeding_user_id ON feeding_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_feeding_date ON feeding_entries(date DESC);
        CREATE INDEX IF NOT EXISTS idx_feeding_pet_date ON feeding_entries(pet_id, date DESC);
    END IF;

    -- Weight tracking indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_tracking') THEN
        CREATE INDEX IF NOT EXISTS idx_weight_pet_id ON weight_tracking(pet_id);
        CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_tracking(measurement_date DESC);
        CREATE INDEX IF NOT EXISTS idx_weight_pet_date ON weight_tracking(pet_id, measurement_date DESC);
    END IF;

    -- Health records indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_records') THEN
        CREATE INDEX IF NOT EXISTS idx_health_pet_id ON health_records(pet_id);
        CREATE INDEX IF NOT EXISTS idx_health_date ON health_records(date DESC);
        CREATE INDEX IF NOT EXISTS idx_health_type ON health_records(record_type);
    END IF;

    -- Supplier indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
        CREATE INDEX IF NOT EXISTS idx_suppliers_city_state ON suppliers(city, state);
        CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
        CREATE INDEX IF NOT EXISTS idx_suppliers_verified ON suppliers(verified);
        CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(average_rating DESC);
    END IF;

    -- Review indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id ON reviews(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
    END IF;

    -- Chat indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    END IF;

    -- Blog indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_articles') THEN
        CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
        CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
        CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_blog_articles_featured ON blog_articles(featured, published_at DESC);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_comments') THEN
        CREATE INDEX IF NOT EXISTS idx_blog_comments_article_id ON blog_comments(article_id);
        CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
    END IF;

    -- Transaction indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paws_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_paws_transactions_user_id ON paws_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_paws_transactions_created_at ON paws_transactions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_paws_transactions_type ON paws_transactions(type);
    END IF;

    -- Notification indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);
    END IF;

    -- API usage indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_logs(endpoint);
    END IF;
END $$;

-- CREATE ESSENTIAL FUNCTIONS

-- Function to calculate distance (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 decimal, lng1 decimal, 
    lat2 decimal, lng2 decimal
) 
RETURNS decimal AS $$
DECLARE
    r decimal := 6371;
    dlat decimal;
    dlng decimal;
    a decimal;
    c decimal;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby suppliers
CREATE OR REPLACE FUNCTION find_nearby_suppliers(
    user_lat decimal, 
    user_lng decimal, 
    radius_km decimal DEFAULT 50
)
RETURNS TABLE(
    supplier_id uuid,
    name varchar,
    distance_km decimal,
    average_rating decimal,
    supplier_type varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        calculate_distance(user_lat, user_lng, s.latitude, s.longitude) as distance,
        s.average_rating,
        s.supplier_type
    FROM suppliers s
    WHERE calculate_distance(user_lat, user_lng, s.latitude, s.longitude) <= radius_km
    AND s.verified = true
    ORDER BY distance, s.average_rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get database health
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE(
    metric_name text,
    metric_value text,
    status text
) AS $$
BEGIN
    RETURN QUERY
    WITH db_metrics AS (
        SELECT 'active_connections' as name, 
               (SELECT count(*) FROM pg_stat_activity)::text as value,
               CASE WHEN (SELECT count(*) FROM pg_stat_activity) < 100 THEN 'healthy' ELSE 'warning' END as status
        UNION ALL
        SELECT 'database_size' as name,
               pg_size_pretty(pg_database_size(current_database())) as value,
               'healthy' as status
        UNION ALL
        SELECT 'total_users' as name,
               (SELECT count(*) FROM users)::text as value,
               'healthy' as status
        UNION ALL
        SELECT 'total_tables' as name,
               (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')::text as value,
               'healthy' as status
    )
    SELECT name, value, status FROM db_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function for backup logging
CREATE OR REPLACE FUNCTION log_backup_operation(
    backup_type_param varchar,
    status_param varchar,
    file_path_param text DEFAULT NULL,
    file_size_param bigint DEFAULT NULL,
    tables_param text[] DEFAULT NULL,
    error_msg text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO backup_logs (
        backup_type, status, file_path, file_size_bytes, 
        tables_included, started_at, completed_at, error_message
    ) VALUES (
        backup_type_param, status_param, file_path_param, file_size_param,
        tables_param, 
        CASE WHEN status_param = 'started' THEN NOW() ELSE NULL END,
        CASE WHEN status_param IN ('completed', 'failed') THEN NOW() ELSE NULL END,
        error_msg
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGERS FOR AUTOMATIC UPDATES

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pets') THEN
        DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
        CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_records') THEN
        DROP TRIGGER IF EXISTS update_health_records_updated_at ON health_records;
        CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
        CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
        CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_articles') THEN
        DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON blog_articles;
        CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON blog_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_comments') THEN
        DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
        CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON blog_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Success message
SELECT 'Incremental Database Migration Completed Successfully!' as status,
       'New tables added while preserving existing data and functionality' as details;