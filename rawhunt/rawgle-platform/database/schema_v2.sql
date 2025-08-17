-- Rawgle Platform Enhanced Database Schema
-- Incorporating Reddit r/rawdogfood community insights

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- ENHANCED USER SYSTEM WITH REDDIT-STYLE FEATURES
-- =====================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location GEOGRAPHY(POINT, 4326),
    address JSONB,
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    
    -- Reddit-style features
    karma_points INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    feeding_since DATE,
    flair_text TEXT,
    badges TEXT[],
    
    -- Settings
    notifications JSONB DEFAULT '{"email": true, "push": true, "digest": "weekly"}',
    privacy_settings JSONB DEFAULT '{"profile_public": true, "show_location": false}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENHANCED PET PROFILES WITH HEALTH TRACKING
-- =====================================================

CREATE TABLE public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed_id INTEGER REFERENCES breeds(id),
    mixed_breed_ids INTEGER[],
    birth_date DATE,
    weight_kg DECIMAL(5,2),
    target_weight_kg DECIMAL(5,2),
    sex TEXT CHECK (sex IN ('male', 'female', 'neutered_male', 'spayed_female')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active', 'working')),
    
    -- Health tracking
    body_condition_score INTEGER CHECK (body_condition_score BETWEEN 1 AND 9),
    health_conditions TEXT[],
    medications TEXT[],
    dietary_restrictions TEXT[],
    allergies TEXT[],
    
    -- Raw feeding specifics
    transition_date DATE,
    previous_diet TEXT,
    current_proteins TEXT[],
    favorite_proteins TEXT[],
    disliked_proteins TEXT[],
    feeding_style TEXT CHECK (feeding_style IN ('BARF', 'PMR', 'whole_prey', 'mixed')),
    meals_per_day INTEGER DEFAULT 2,
    
    -- Documentation
    microchip_id TEXT,
    photos TEXT[],
    vet_id UUID REFERENCES veterinarians(id),
    insurance_info JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REDDIT-STYLE COMMUNITY FEATURES
-- =====================================================

CREATE TABLE public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    category_id UUID REFERENCES forum_categories(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Reddit-style features
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
    
    -- Metadata
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_reason TEXT,
    
    -- Engagement tracking
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Special post types
    post_type TEXT CHECK (post_type IN ('discussion', 'question', 'guide', 'success_story', 'ama', 'weekly_thread')),
    ama_guest_info JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.forum_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_comments(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    
    -- Reddit-style features
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
    is_deleted BOOLEAN DEFAULT false,
    is_mod_removed BOOLEAN DEFAULT false,
    
    -- Awards/badges
    awards TEXT[],
    is_helpful BOOLEAN DEFAULT false,
    is_expert_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_votes (
    user_id UUID REFERENCES users(id),
    voteable_type TEXT CHECK (voteable_type IN ('post', 'comment', 'review')),
    voteable_id UUID,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, voteable_type, voteable_id)
);

-- =====================================================
-- AI CHATBOT KNOWLEDGE BASE
-- =====================================================

CREATE TABLE public.chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    subcategory TEXT,
    question_patterns TEXT[],
    answer TEXT NOT NULL,
    
    -- Metadata
    source TEXT,
    source_url TEXT,
    confidence_score DECIMAL(3,2),
    verification_status TEXT CHECK (verification_status IN ('unverified', 'community_verified', 'expert_verified', 'vet_verified')),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    
    -- Vector embedding for semantic search
    embedding vector(1536),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- Conversation data
    messages JSONB NOT NULL,
    context JSONB,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- Analytics
    message_count INTEGER DEFAULT 0,
    tools_used TEXT[],
    topics_discussed TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENHANCED FOOD & NUTRITION TRACKING
-- =====================================================

CREATE TABLE public.feeding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    fed_at TIMESTAMPTZ DEFAULT NOW(),
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'treat')),
    
    -- Detailed meal composition
    proteins JSONB, -- {"chicken": 200, "beef": 150}
    bones JSONB,    -- {"chicken_neck": 50}
    organs JSONB,   -- {"liver": 20, "kidney": 10}
    supplements JSONB, -- {"fish_oil": 5, "vitamin_e": 1}
    
    -- Totals
    total_weight_grams INTEGER,
    total_calories INTEGER,
    
    -- Pet response
    appetite_level INTEGER CHECK (appetite_level BETWEEN 1 AND 5),
    finish_time_minutes INTEGER,
    leftovers_grams INTEGER,
    
    -- Health observations
    stool_quality INTEGER CHECK (stool_quality BETWEEN 1 AND 7), -- Bristol scale
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    name TEXT NOT NULL,
    
    -- Plan details
    daily_calories INTEGER,
    meals_per_day INTEGER,
    
    -- Weekly rotation
    monday JSONB,
    tuesday JSONB,
    wednesday JSONB,
    thursday JSONB,
    friday JSONB,
    saturday JSONB,
    sunday JSONB,
    
    -- Nutritional targets
    protein_percentage DECIMAL(3,1),
    fat_percentage DECIMAL(3,1),
    bone_percentage DECIMAL(3,1),
    organ_percentage DECIMAL(3,1),
    
    -- Metadata
    is_public BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    uses_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUPPLIER ECOSYSTEM WITH RATINGS
-- =====================================================

CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Contact info
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    social_media JSONB,
    
    -- Location & delivery
    physical_address JSONB,
    location GEOGRAPHY(POINT, 4326),
    delivery_zones GEOGRAPHY(MULTIPOLYGON, 4326),
    delivery_options JSONB,
    delivery_days TEXT[],
    minimum_order DECIMAL(6,2),
    
    -- Business details
    certifications TEXT[],
    sourcing_info TEXT,
    business_hours JSONB,
    payment_methods TEXT[],
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    verification_documents TEXT[],
    
    -- Ratings (calculated fields)
    rating_average DECIMAL(3,2),
    rating_quality DECIMAL(3,2),
    rating_service DECIMAL(3,2),
    rating_value DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT true,
    vacation_mode BOOLEAN DEFAULT false,
    vacation_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENHANCED REVIEW SYSTEM
-- =====================================================

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    
    -- What's being reviewed
    reviewable_type TEXT CHECK (reviewable_type IN ('product', 'supplier', 'recipe', 'equipment')),
    reviewable_id UUID,
    
    -- Ratings
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
    
    -- Review content
    title TEXT,
    content TEXT NOT NULL,
    pros TEXT[],
    cons TEXT[],
    
    -- Evidence
    photos TEXT[],
    videos TEXT[],
    purchase_date DATE,
    feeding_duration INTERVAL,
    
    -- Health outcomes
    coat_improvement BOOLEAN,
    energy_improvement BOOLEAN,
    stool_improvement BOOLEAN,
    weight_change TEXT CHECK (weight_change IN ('lost', 'maintained', 'gained')),
    
    -- Verification
    verified_purchase BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id),
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    supplier_response TEXT,
    supplier_response_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GAMIFICATION & ACHIEVEMENTS
-- =====================================================

CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    points INTEGER DEFAULT 10,
    category TEXT CHECK (category IN ('feeding', 'community', 'education', 'shopping', 'health')),
    
    -- Requirements
    requirement_type TEXT,
    requirement_value JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
    user_id UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress JSONB,
    PRIMARY KEY (user_id, achievement_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_karma ON users(karma_points DESC);

-- Pet indexes
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_transition_date ON pets(transition_date);

-- Forum indexes
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX idx_forum_posts_score ON forum_posts(score DESC);
CREATE INDEX idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_score ON forum_comments(score DESC);

-- Chatbot indexes
CREATE INDEX idx_chatbot_knowledge_category ON chatbot_knowledge(category);
CREATE INDEX idx_chatbot_knowledge_embedding ON chatbot_knowledge USING ivfflat (embedding vector_cosine_ops);

-- Review indexes
CREATE INDEX idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating DESC);

-- Supplier indexes
CREATE INDEX idx_suppliers_location ON suppliers USING GIST(location);
CREATE INDEX idx_suppliers_delivery ON suppliers USING GIST(delivery_zones);
CREATE INDEX idx_suppliers_rating ON suppliers(rating_average DESC);

-- Full text search
CREATE INDEX idx_forum_posts_search ON forum_posts USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_products_search ON food_products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =====================================================
-- FUNCTIONS FOR REDDIT-STYLE FEATURES
-- =====================================================

-- Update user karma
CREATE OR REPLACE FUNCTION update_user_karma() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE users 
        SET karma_points = (
            SELECT COALESCE(SUM(score), 0) 
            FROM (
                SELECT score FROM forum_posts WHERE user_id = NEW.user_id
                UNION ALL
                SELECT score FROM forum_comments WHERE user_id = NEW.user_id
            ) scores
        )
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_karma_on_post
AFTER INSERT OR UPDATE ON forum_posts
FOR EACH ROW EXECUTE FUNCTION update_user_karma();

CREATE TRIGGER update_karma_on_comment
AFTER INSERT OR UPDATE ON forum_comments
FOR EACH ROW EXECUTE FUNCTION update_user_karma();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SAMPLE DATA FOR ACHIEVEMENTS
-- =====================================================

INSERT INTO achievements (name, description, category, points, requirement_type, requirement_value) VALUES
('First Paw Forward', 'Create your first pet profile', 'feeding', 10, 'pet_count', '{"min": 1}'),
('Transition Success', 'Complete transition to raw feeding', 'feeding', 50, 'feeding_days', '{"min": 30}'),
('Community Helper', 'Receive 10 helpful votes', 'community', 25, 'helpful_votes', '{"min": 10}'),
('Review Master', 'Write 10 detailed reviews', 'community', 30, 'review_count', '{"min": 10}'),
('Knowledge Seeker', 'Complete all educational modules', 'education', 100, 'modules_completed', '{"required": ["intro", "transition", "nutrition", "safety"]}'),
('Budget Feeder', 'Save $100 through bulk buying', 'shopping', 40, 'savings_amount', '{"min": 100}'),
('Health Champion', 'Track improvements for 90 days', 'health', 75, 'tracking_days', '{"min": 90}');
