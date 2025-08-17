-- Rawgle Platform Database Schema
-- Supabase PostgreSQL Implementation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- User Management Tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    location GEOGRAPHY(POINT, 4326),
    address JSONB,
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet Profiles
CREATE TABLE public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed_id INTEGER REFERENCES breeds(id),
    mixed_breed_ids INTEGER[],
    birth_date DATE,
    weight_kg DECIMAL(5,2),
    sex TEXT CHECK (sex IN ('male', 'female', 'neutered_male', 'spayed_female')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    health_conditions TEXT[],
    dietary_restrictions TEXT[],
    feeding_preferences JSONB,
    microchip_id TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breed Database
CREATE TABLE public.breeds (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    breed_group TEXT,
    size_category TEXT CHECK (size_category IN ('toy', 'small', 'medium', 'large', 'giant')),
    typical_weight_range NUMRANGE,
    typical_lifespan_years NUMRANGE,
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    nutritional_requirements JSONB,
    common_health_issues TEXT[],
    breed_specific_notes TEXT,
    akc_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Products
CREATE TABLE public.food_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    name TEXT NOT NULL,
    product_type TEXT CHECK (product_type IN ('complete', 'muscle_meat', 'organ', 'bone', 'supplement', 'treat')),
    proteins TEXT[],
    guaranteed_analysis JSONB,
    ingredients_list TEXT,
    feeding_guidelines JSONB,
    price_per_kg DECIMAL(6,2),
    available_sizes JSONB,
    certifications TEXT[],
    allergen_info TEXT[],
    storage_instructions TEXT,
    barcode TEXT,
    images TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    delivery_zones GEOGRAPHY(MULTIPOLYGON, 4326),
    delivery_options JSONB,
    minimum_order DECIMAL(6,2),
    certifications TEXT[],
    business_hours JSONB,
    payment_methods TEXT[],
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    rating_average DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews and Ratings
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pet_id UUID REFERENCES pets(id),
    reviewable_type TEXT CHECK (reviewable_type IN ('product', 'supplier')),
    reviewable_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT,
    pros TEXT[],
    cons TEXT[],
    photos TEXT[],
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    reported BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Matching Recommendations
CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    product_id UUID REFERENCES food_products(id),
    match_score DECIMAL(3,2) CHECK (match_score BETWEEN 0 AND 1),
    reasoning JSONB,
    factors JSONB,
    recommendation_type TEXT CHECK (recommendation_type IN ('primary', 'alternative', 'avoid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Feeding Logs
CREATE TABLE public.feeding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    product_id UUID REFERENCES food_products(id),
    fed_at TIMESTAMPTZ DEFAULT NOW(),
    quantity_grams INTEGER,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    notes TEXT,
    pet_response TEXT CHECK (pet_response IN ('loved', 'liked', 'neutral', 'disliked', 'refused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Forums
CREATE TABLE public.forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER,
    parent_id UUID REFERENCES forum_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES forum_categories(id),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    views INTEGER DEFAULT 0,
    pinned BOOLEAN DEFAULT false,
    locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Educational Content
CREATE TABLE public.educational_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content_type TEXT CHECK (content_type IN ('article', 'video', 'guide', 'calculator')),
    category TEXT,
    content_body TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    author_id UUID REFERENCES users(id),
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    reading_time_minutes INTEGER,
    tags TEXT[],
    views INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E-commerce Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal DECIMAL(8,2),
    tax DECIMAL(6,2),
    shipping DECIMAL(6,2),
    total DECIMAL(8,2),
    payment_method TEXT,
    payment_status TEXT,
    shipping_address JSONB,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    name TEXT,
    daily_calories INTEGER,
    meals_per_day INTEGER,
    meal_schedule JSONB,
    ingredients JSONB,
    prep_instructions TEXT,
    cost_estimate DECIMAL(6,2),
    created_by UUID REFERENCES users(id),
    shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_breed_id ON pets(breed_id);
CREATE INDEX idx_products_supplier_id ON food_products(supplier_id);
CREATE INDEX idx_products_proteins ON food_products USING GIN(proteins);
CREATE INDEX idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);
CREATE INDEX idx_recommendations_pet_id ON recommendations(pet_id);
CREATE INDEX idx_suppliers_location ON suppliers USING GIST(delivery_zones);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX idx_educational_content_slug ON educational_content(slug);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own pets" ON pets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own pets" ON pets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view published reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (user_id = auth.uid());
