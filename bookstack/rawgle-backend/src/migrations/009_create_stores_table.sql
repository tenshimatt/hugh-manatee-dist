-- Migration: Create Stores Table for RAWGLE MVP
-- Stores supplier locations and business information (9000+ records expected)
-- Created: 2025-09-07
-- Component: Store Management System

-- Create store status enum
CREATE TYPE IF NOT EXISTS store_status AS ENUM ('active', 'inactive', 'pending_verification', 'suspended', 'closed');

-- Create store verification status enum
CREATE TYPE IF NOT EXISTS verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- Create main stores table - optimized for large datasets
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES store_categories(id) ON DELETE RESTRICT,
    
    -- Basic store information
    name VARCHAR(300) NOT NULL,
    legal_name VARCHAR(300),
    slug VARCHAR(300), -- Will be generated from name
    description TEXT,
    
    -- Business identification
    business_license_number VARCHAR(100),
    tax_id VARCHAR(50),
    duns_number VARCHAR(20),
    website_url TEXT,
    
    -- Contact information
    phone VARCHAR(30),
    email VARCHAR(255),
    contact_person VARCHAR(200),
    
    -- Location information (indexed for geographic queries)
    address_line_1 VARCHAR(300) NOT NULL,
    address_line_2 VARCHAR(300),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(3) DEFAULT 'USA' NOT NULL,
    
    -- Geographic coordinates (for distance calculations)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geolocation POINT, -- PostGIS point for spatial queries
    
    -- Business hours (JSON format for flexibility)
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
        "thursday": {"open": "09:00", "close": "18:00", "closed": false},
        "friday": {"open": "09:00", "close": "18:00", "closed": false},
        "saturday": {"open": "10:00", "close": "17:00", "closed": false},
        "sunday": {"open": "10:00", "close": "17:00", "closed": false}
    }',
    
    -- Business details
    chain_name VARCHAR(200),
    franchise_owner VARCHAR(200),
    year_established INTEGER CHECK (year_established >= 1800 AND year_established <= EXTRACT(YEAR FROM CURRENT_DATE)),
    employee_count_range VARCHAR(50), -- '1-5', '6-20', '21-50', '51-100', '100+'
    
    -- Services and products (arrays for flexible searching)
    services_offered TEXT[],
    products_offered TEXT[],
    brands_carried TEXT[],
    specialties TEXT[],
    
    -- Pricing and payment
    accepts_credit_cards BOOLEAN DEFAULT TRUE,
    accepts_cash BOOLEAN DEFAULT TRUE,
    accepts_checks BOOLEAN DEFAULT FALSE,
    payment_methods TEXT[], -- 'visa', 'mastercard', 'paypal', 'klarna', etc.
    price_range VARCHAR(20) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    
    -- Quality metrics and ratings
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    google_rating DECIMAL(3,2) CHECK (google_rating >= 0 AND google_rating <= 5.00),
    yelp_rating DECIMAL(3,2) CHECK (yelp_rating >= 0 AND yelp_rating <= 5.00),
    
    -- Verification and trust
    status store_status DEFAULT 'active',
    verification_status verification_status DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Certifications and compliance
    certifications TEXT[], -- 'organic_certified', 'locally_owned', 'veteran_owned', etc.
    licenses TEXT[],
    insurance_verified BOOLEAN DEFAULT FALSE,
    better_business_bureau_rating VARCHAR(5), -- 'A+', 'A', 'B', etc.
    
    -- Social media and online presence
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    google_business_url TEXT,
    yelp_url TEXT,
    
    -- Media
    logo_url TEXT,
    cover_image_url TEXT,
    photos TEXT[],
    
    -- Store features and amenities
    features TEXT[], -- 'parking', 'wheelchair_accessible', 'pet_friendly', 'drive_through', etc.
    delivery_available BOOLEAN DEFAULT FALSE,
    pickup_available BOOLEAN DEFAULT TRUE,
    online_ordering BOOLEAN DEFAULT FALSE,
    curbside_pickup BOOLEAN DEFAULT FALSE,
    
    -- Delivery information
    delivery_radius_miles INTEGER CHECK (delivery_radius_miles >= 0 AND delivery_radius_miles <= 500),
    delivery_fee_min DECIMAL(10,2) CHECK (delivery_fee_min >= 0),
    free_delivery_threshold DECIMAL(10,2) CHECK (free_delivery_threshold >= 0),
    
    -- Special programs and discounts
    loyalty_program BOOLEAN DEFAULT FALSE,
    senior_discount BOOLEAN DEFAULT FALSE,
    military_discount BOOLEAN DEFAULT FALSE,
    student_discount BOOLEAN DEFAULT FALSE,
    bulk_discount_available BOOLEAN DEFAULT FALSE,
    
    -- Inventory and stock
    typical_stock_level VARCHAR(20) CHECK (typical_stock_level IN ('low', 'moderate', 'high', 'extensive')),
    special_orders_available BOOLEAN DEFAULT TRUE,
    custom_orders_available BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics (updated by background jobs)
    monthly_view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    phone_click_count INTEGER DEFAULT 0,
    direction_request_count INTEGER DEFAULT 0,
    website_click_count INTEGER DEFAULT 0,
    
    -- Data source and quality
    data_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'google_places', 'yelp_api', 'web_scraping', etc.
    data_quality_score INTEGER DEFAULT 50 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    last_verified_at TIMESTAMPTZ,
    last_updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Admin notes
    admin_notes TEXT,
    public_notes TEXT,
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for performance on large dataset
-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_stores_category_id ON stores(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_verification_status ON stores(verification_status);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- Geographic indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_stores_city_state ON stores(city, state_province);
CREATE INDEX IF NOT EXISTS idx_stores_postal_code ON stores(postal_code);
CREATE INDEX IF NOT EXISTS idx_stores_country ON stores(country_code);
CREATE INDEX IF NOT EXISTS idx_stores_coordinates ON stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Business and contact indexes
CREATE INDEX IF NOT EXISTS idx_stores_phone ON stores(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_website ON stores(website_url) WHERE website_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_chain_name ON stores(chain_name) WHERE chain_name IS NOT NULL;

-- Array field indexes for product/service searches
CREATE INDEX IF NOT EXISTS idx_stores_services_offered ON stores USING gin(services_offered);
CREATE INDEX IF NOT EXISTS idx_stores_products_offered ON stores USING gin(products_offered);
CREATE INDEX IF NOT EXISTS idx_stores_brands_carried ON stores USING gin(brands_carried);
CREATE INDEX IF NOT EXISTS idx_stores_specialties ON stores USING gin(specialties);
CREATE INDEX IF NOT EXISTS idx_stores_features ON stores USING gin(features);
CREATE INDEX IF NOT EXISTS idx_stores_certifications ON stores USING gin(certifications);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_stores_search ON stores USING gin(
    to_tsvector('english', 
        name || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(city, '') || ' ' || 
        COALESCE(state_province, '') || ' ' ||
        COALESCE(chain_name, '')
    )
);

-- Performance and analytics indexes
CREATE INDEX IF NOT EXISTS idx_stores_average_rating ON stores(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_stores_review_count ON stores(review_count DESC) WHERE review_count > 0;
CREATE INDEX IF NOT EXISTS idx_stores_monthly_views ON stores(monthly_view_count DESC);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_updated_at ON stores(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_last_verified ON stores(last_verified_at DESC) WHERE last_verified_at IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_stores_active_status ON stores(is_active, status);
CREATE INDEX IF NOT EXISTS idx_stores_category_active ON stores(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stores_location_active ON stores(city, state_province, is_active);
CREATE INDEX IF NOT EXISTS idx_stores_rating_active ON stores(average_rating DESC, is_active) WHERE average_rating > 0 AND is_active = TRUE;

-- Partial indexes for specific scenarios
CREATE INDEX IF NOT EXISTS idx_stores_delivery_available ON stores(delivery_available) WHERE delivery_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_stores_online_ordering ON stores(online_ordering) WHERE online_ordering = TRUE;
CREATE INDEX IF NOT EXISTS idx_stores_verified ON stores(verification_status) WHERE verification_status = 'verified';

-- JSONB index for business hours queries
CREATE INDEX IF NOT EXISTS idx_stores_business_hours ON stores USING gin(business_hours);

-- Add constraints
ALTER TABLE stores
ADD CONSTRAINT IF NOT EXISTS chk_stores_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 300),
ADD CONSTRAINT IF NOT EXISTS chk_stores_slug_format CHECK (slug IS NULL OR slug ~* '^[a-z0-9-]+$'),
ADD CONSTRAINT IF NOT EXISTS chk_stores_slug_length CHECK (slug IS NULL OR (LENGTH(slug) >= 1 AND LENGTH(slug) <= 300)),
ADD CONSTRAINT IF NOT EXISTS chk_stores_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT IF NOT EXISTS chk_stores_coordinates_valid CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
     latitude >= -90 AND latitude <= 90 AND 
     longitude >= -180 AND longitude <= 180)
),
ADD CONSTRAINT IF NOT EXISTS chk_stores_postal_code_length CHECK (LENGTH(postal_code) >= 3 AND LENGTH(postal_code) <= 20);

-- Function to generate store slug from name and location
CREATE OR REPLACE FUNCTION generate_store_slug(store_name TEXT, city_name TEXT, state_name TEXT, store_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug from name and location
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(store_name || '-' || city_name || '-' || state_name, '[^a-zA-Z0-9\s\-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '\-+', '-', 'g'
        )
    );
    
    -- Trim leading/trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure reasonable length
    IF LENGTH(base_slug) > 250 THEN
        base_slug := SUBSTRING(base_slug FROM 1 FOR 250);
        base_slug := TRIM(BOTH '-' FROM base_slug);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM stores WHERE slug = final_slug AND (store_id IS NULL OR id != store_id)) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two coordinates
CREATE OR REPLACE FUNCTION calculate_distance_miles(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    radius_miles DECIMAL := 3959; -- Earth's radius in miles
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Handle NULL coordinates
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert latitude and longitude differences to radians
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN ROUND(radius_miles * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update data quality score based on completeness
CREATE OR REPLACE FUNCTION calculate_data_quality_score(store_record stores)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    max_score INTEGER := 100;
BEGIN
    -- Basic information (40 points)
    IF store_record.name IS NOT NULL AND LENGTH(store_record.name) > 0 THEN score := score + 5; END IF;
    IF store_record.description IS NOT NULL AND LENGTH(store_record.description) > 10 THEN score := score + 5; END IF;
    IF store_record.phone IS NOT NULL AND LENGTH(store_record.phone) > 0 THEN score := score + 10; END IF;
    IF store_record.email IS NOT NULL AND store_record.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN score := score + 5; END IF;
    IF store_record.website_url IS NOT NULL AND LENGTH(store_record.website_url) > 0 THEN score := score + 10; END IF;
    IF store_record.address_line_1 IS NOT NULL AND LENGTH(store_record.address_line_1) > 0 THEN score := score + 5; END IF;
    
    -- Location accuracy (20 points)
    IF store_record.latitude IS NOT NULL AND store_record.longitude IS NOT NULL THEN score := score + 15; END IF;
    IF store_record.postal_code IS NOT NULL AND LENGTH(store_record.postal_code) >= 5 THEN score := score + 5; END IF;
    
    -- Business details (20 points)
    IF store_record.business_hours IS NOT NULL THEN score := score + 5; END IF;
    IF store_record.services_offered IS NOT NULL AND ARRAY_LENGTH(store_record.services_offered, 1) > 0 THEN score := score + 5; END IF;
    IF store_record.products_offered IS NOT NULL AND ARRAY_LENGTH(store_record.products_offered, 1) > 0 THEN score := score + 5; END IF;
    IF store_record.features IS NOT NULL AND ARRAY_LENGTH(store_record.features, 1) > 0 THEN score := score + 5; END IF;
    
    -- Verification and media (20 points)
    IF store_record.verification_status = 'verified' THEN score := score + 10; END IF;
    IF store_record.logo_url IS NOT NULL AND LENGTH(store_record.logo_url) > 0 THEN score := score + 5; END IF;
    IF store_record.average_rating > 0 AND store_record.review_count > 0 THEN score := score + 5; END IF;
    
    RETURN LEAST(score, max_score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update store timestamp and derived fields
CREATE OR REPLACE FUNCTION update_store_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_store_slug(NEW.name, NEW.city, NEW.state_province, NEW.id);
    END IF;
    
    -- Update data quality score
    NEW.data_quality_score = calculate_data_quality_score(NEW);
    
    -- Update geolocation point if coordinates are provided
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geolocation = POINT(NEW.longitude, NEW.latitude);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_store_timestamp();

CREATE TRIGGER trigger_stores_generate_slug
    BEFORE INSERT ON stores
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION update_store_timestamp();

-- Views for common queries (optimized for large datasets)

-- View for active stores with essential information
CREATE OR REPLACE VIEW active_stores AS
SELECT 
    s.id,
    s.category_id,
    sc.name as category_name,
    s.name,
    s.slug,
    s.description,
    s.phone,
    s.email,
    s.website_url,
    s.address_line_1,
    s.address_line_2,
    s.city,
    s.state_province,
    s.postal_code,
    s.country_code,
    s.latitude,
    s.longitude,
    s.average_rating,
    s.review_count,
    s.price_range,
    s.delivery_available,
    s.pickup_available,
    s.online_ordering,
    s.logo_url,
    s.services_offered,
    s.products_offered,
    s.features,
    s.verification_status,
    s.created_at,
    s.updated_at
FROM stores s
INNER JOIN store_categories sc ON s.category_id = sc.id
WHERE s.is_active = TRUE 
  AND s.status = 'active'
  AND sc.is_active = TRUE;

-- View for store search results (optimized for search queries)
CREATE OR REPLACE VIEW store_search_results AS
SELECT 
    s.id,
    s.name,
    s.slug,
    s.city,
    s.state_province,
    s.phone,
    s.website_url,
    s.average_rating,
    s.review_count,
    s.price_range,
    s.latitude,
    s.longitude,
    s.logo_url,
    s.services_offered,
    s.products_offered,
    s.delivery_available,
    sc.name as category_name,
    sc.slug as category_slug,
    s.data_quality_score,
    -- Search ranking factors
    (s.average_rating * 10 + s.data_quality_score + LEAST(s.review_count, 100)) as search_score
FROM stores s
INNER JOIN store_categories sc ON s.category_id = sc.id
WHERE s.is_active = TRUE 
  AND s.status = 'active'
  AND sc.is_active = TRUE
  AND s.data_quality_score >= 30; -- Only include stores with decent data quality

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON stores TO rawgle_user;
GRANT SELECT ON active_stores TO rawgle_user;
GRANT SELECT ON store_search_results TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Stores table created successfully with comprehensive indexing for large datasets!' as result;

-- Display table structure info
SELECT 
    'stores' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'stores'
UNION ALL
SELECT 
    'indexes created',
    COUNT(*)
FROM pg_indexes 
WHERE tablename = 'stores';