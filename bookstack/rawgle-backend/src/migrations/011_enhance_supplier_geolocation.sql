-- Migration: Enhanced Supplier Data with Advanced Geolocation for RAWGLE MVP
-- Extends existing stores table with enhanced geolocation features and data quality improvements
-- Created: 2025-09-07
-- Component: Enhanced Store/Supplier Management System

-- Create additional supplier-specific enums
CREATE TYPE IF NOT EXISTS supplier_service_type AS ENUM (
    'veterinary', 'pet_store', 'grooming', 'boarding', 'daycare', 
    'training', 'pet_food', 'pet_supplies', 'emergency_vet', 
    'specialty_vet', 'mobile_vet', 'pet_pharmacy', 'other'
);

CREATE TYPE IF NOT EXISTS delivery_speed AS ENUM ('same_day', 'next_day', '2_3_days', '3_5_days', 'weekly');

-- Create enhanced supplier locations table (extends the existing stores functionality)
CREATE TABLE IF NOT EXISTS enhanced_supplier_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Enhanced location data
    location_name VARCHAR(200), -- Custom name for this location
    location_type supplier_service_type NOT NULL DEFAULT 'pet_store',
    is_primary_location BOOLEAN DEFAULT TRUE,
    is_mobile_service BOOLEAN DEFAULT FALSE,
    
    -- Detailed address components (normalized)
    street_number VARCHAR(20),
    street_name VARCHAR(200),
    unit_number VARCHAR(50),
    neighborhood VARCHAR(100),
    district VARCHAR(100),
    locality VARCHAR(100), -- City/Town
    administrative_area_level_1 VARCHAR(100), -- State/Province
    administrative_area_level_2 VARCHAR(100), -- County
    postal_code VARCHAR(20),
    postal_code_suffix VARCHAR(10),
    country VARCHAR(100) DEFAULT 'United States',
    country_code VARCHAR(3) DEFAULT 'USA',
    
    -- Enhanced geographic data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    elevation_meters DECIMAL(8, 2), -- Elevation above sea level
    accuracy_meters DECIMAL(8, 2), -- GPS accuracy
    geohash VARCHAR(12), -- For efficient geographic queries
    plus_code VARCHAR(20), -- Google Plus Code
    what3words VARCHAR(100), -- What3Words location
    
    -- Service area and coverage
    service_radius_km DECIMAL(6, 2) DEFAULT 10.0 CHECK (service_radius_km >= 0),
    service_areas TEXT[], -- Array of zip codes or area names served
    delivery_zones JSONB, -- Complex delivery zone definitions
    
    -- Location verification and quality
    location_verified BOOLEAN DEFAULT FALSE,
    location_verified_at TIMESTAMPTZ,
    location_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    location_verification_method VARCHAR(50), -- 'gps', 'manual', 'google_places', 'user_reported'
    location_confidence_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (location_confidence_score >= 0 AND location_confidence_score <= 1.00),
    
    -- Geographic data sources
    google_place_id VARCHAR(200),
    google_maps_url TEXT,
    bing_maps_url TEXT,
    apple_maps_url TEXT,
    coordinates_source VARCHAR(50) DEFAULT 'manual', -- 'google_geocoding', 'bing_geocoding', 'manual', 'gps'
    last_geocoded_at TIMESTAMPTZ,
    
    -- Accessibility and parking
    wheelchair_accessible BOOLEAN,
    parking_available BOOLEAN DEFAULT TRUE,
    parking_type VARCHAR(50), -- 'free', 'paid', 'street', 'garage', 'lot'
    parking_spaces_count INTEGER CHECK (parking_spaces_count >= 0),
    electric_vehicle_charging BOOLEAN DEFAULT FALSE,
    
    -- Transportation access
    public_transit_accessible BOOLEAN,
    nearest_bus_stop VARCHAR(200),
    nearest_train_station VARCHAR(200),
    walkability_score INTEGER CHECK (walkability_score >= 0 AND walkability_score <= 100),
    
    -- Environmental and demographic data
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    climate_zone VARCHAR(50),
    population_density VARCHAR(20), -- 'urban', 'suburban', 'rural'
    economic_indicator VARCHAR(20), -- 'high_income', 'middle_income', 'low_income'
    
    -- Foot traffic and visibility
    foot_traffic_level VARCHAR(20) CHECK (foot_traffic_level IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
    street_visibility VARCHAR(20) CHECK (street_visibility IN ('poor', 'fair', 'good', 'excellent')),
    landmark_proximity TEXT[], -- Nearby landmarks for easier location
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enhanced delivery services table
CREATE TABLE IF NOT EXISTS supplier_delivery_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_location_id UUID NOT NULL REFERENCES enhanced_supplier_locations(id) ON DELETE CASCADE,
    
    -- Delivery service details
    service_name VARCHAR(100) NOT NULL, -- 'Standard Delivery', 'Express', 'Same Day'
    delivery_speed delivery_speed NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Pricing and minimums
    base_delivery_fee DECIMAL(10, 2) DEFAULT 0.00 CHECK (base_delivery_fee >= 0),
    per_mile_fee DECIMAL(10, 2) DEFAULT 0.00 CHECK (per_mile_fee >= 0),
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (minimum_order_amount >= 0),
    free_delivery_threshold DECIMAL(10, 2) CHECK (free_delivery_threshold >= 0),
    
    -- Service area and radius
    max_delivery_distance_km DECIMAL(6, 2) DEFAULT 25.0 CHECK (max_delivery_distance_km > 0),
    delivery_areas TEXT[], -- Specific areas covered
    excluded_areas TEXT[], -- Areas not covered
    
    -- Scheduling and availability
    available_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- Days of week (1=Monday, 7=Sunday)
    delivery_hours_start TIME DEFAULT '09:00:00',
    delivery_hours_end TIME DEFAULT '18:00:00',
    advance_notice_hours INTEGER DEFAULT 24 CHECK (advance_notice_hours >= 0),
    
    -- Special services
    contactless_delivery BOOLEAN DEFAULT TRUE,
    scheduled_delivery BOOLEAN DEFAULT TRUE,
    recurring_delivery BOOLEAN DEFAULT FALSE,
    special_instructions_allowed BOOLEAN DEFAULT TRUE,
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier service hours table (more detailed than the JSON in stores)
CREATE TABLE IF NOT EXISTS supplier_service_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_location_id UUID NOT NULL REFERENCES enhanced_supplier_locations(id) ON DELETE CASCADE,
    
    -- Day and service type
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
    service_type VARCHAR(50) DEFAULT 'general', -- 'general', 'delivery', 'pickup', 'emergency'
    
    -- Hours
    is_closed BOOLEAN DEFAULT FALSE,
    open_time TIME,
    close_time TIME,
    
    -- Special hours and breaks
    has_lunch_break BOOLEAN DEFAULT FALSE,
    lunch_break_start TIME,
    lunch_break_end TIME,
    
    -- Seasonal or temporary adjustments
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_start DATE,
    season_end DATE,
    notes TEXT,
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for enhanced supplier data

-- Primary lookups for enhanced_supplier_locations
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_locations_store_id ON enhanced_supplier_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_locations_type ON enhanced_supplier_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_locations_primary ON enhanced_supplier_locations(is_primary_location) WHERE is_primary_location = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_locations_mobile ON enhanced_supplier_locations(is_mobile_service) WHERE is_mobile_service = TRUE;

-- Geographic indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_coordinates ON enhanced_supplier_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_geohash ON enhanced_supplier_locations(geohash);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_plus_code ON enhanced_supplier_locations(plus_code) WHERE plus_code IS NOT NULL;

-- Location verification and quality
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_verified ON enhanced_supplier_locations(location_verified) WHERE location_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_confidence ON enhanced_supplier_locations(location_confidence_score DESC);

-- Address component indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_postal_code ON enhanced_supplier_locations(postal_code);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_locality ON enhanced_supplier_locations(locality);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_admin_area ON enhanced_supplier_locations(administrative_area_level_1);

-- Service area indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_service_areas ON enhanced_supplier_locations USING gin(service_areas);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_service_radius ON enhanced_supplier_locations(service_radius_km);

-- Delivery services indexes
CREATE INDEX IF NOT EXISTS idx_delivery_services_supplier ON supplier_delivery_services(supplier_location_id);
CREATE INDEX IF NOT EXISTS idx_delivery_services_speed ON supplier_delivery_services(delivery_speed);
CREATE INDEX IF NOT EXISTS idx_delivery_services_available ON supplier_delivery_services(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_delivery_services_distance ON supplier_delivery_services(max_delivery_distance_km);

-- Service hours indexes
CREATE INDEX IF NOT EXISTS idx_service_hours_supplier ON supplier_service_hours(supplier_location_id);
CREATE INDEX IF NOT EXISTS idx_service_hours_day ON supplier_service_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_service_hours_type ON supplier_service_hours(service_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_location_type_verified ON enhanced_supplier_locations(location_type, location_verified);
CREATE INDEX IF NOT EXISTS idx_enhanced_supplier_active_primary ON enhanced_supplier_locations(is_active, is_primary_location);

-- Function to calculate geohash for a location
CREATE OR REPLACE FUNCTION calculate_geohash(lat DECIMAL, lng DECIMAL, precision_chars INTEGER DEFAULT 9)
RETURNS TEXT AS $$
DECLARE
    base32 TEXT := '0123456789bcdefghjkmnpqrstuvwxyz';
    lat_min DECIMAL := -90.0;
    lat_max DECIMAL := 90.0;
    lng_min DECIMAL := -180.0;
    lng_max DECIMAL := 180.0;
    geohash TEXT := '';
    bit INTEGER := 0;
    bit_count INTEGER := 0;
    ch INTEGER := 0;
    is_lng BOOLEAN := TRUE;
    mid DECIMAL;
    i INTEGER;
BEGIN
    FOR i IN 1..precision_chars * 5 LOOP
        IF is_lng THEN
            mid := (lng_min + lng_max) / 2;
            IF lng >= mid THEN
                ch := ch | (1 << (4 - bit_count));
                lng_min := mid;
            ELSE
                lng_max := mid;
            END IF;
        ELSE
            mid := (lat_min + lat_max) / 2;
            IF lat >= mid THEN
                ch := ch | (1 << (4 - bit_count));
                lat_min := mid;
            ELSE
                lat_max := mid;
            END IF;
        END IF;
        
        is_lng := NOT is_lng;
        bit_count := bit_count + 1;
        
        IF bit_count = 5 THEN
            geohash := geohash || SUBSTRING(base32, ch + 1, 1);
            bit_count := 0;
            ch := 0;
        END IF;
    END LOOP;
    
    RETURN geohash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate distance using Haversine formula (enhanced version)
CREATE OR REPLACE FUNCTION calculate_precise_distance_km(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    radius_km DECIMAL := 6371.0; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
    lat1_rad DECIMAL;
    lat2_rad DECIMAL;
BEGIN
    -- Handle NULL coordinates
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert to radians
    lat1_rad := RADIANS(lat1);
    lat2_rad := RADIANS(lat2);
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + COS(lat1_rad) * COS(lat2_rad) * SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN ROUND(radius_km * c, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find suppliers within radius
CREATE OR REPLACE FUNCTION find_suppliers_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 25.0,
    service_type supplier_service_type DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    supplier_id UUID,
    store_name TEXT,
    distance_km DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    service_type supplier_service_type,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        esl.id,
        s.name::TEXT,
        calculate_precise_distance_km(center_lat, center_lng, esl.latitude, esl.longitude),
        esl.latitude,
        esl.longitude,
        esl.location_type,
        esl.location_verified
    FROM enhanced_supplier_locations esl
    INNER JOIN stores s ON esl.store_id = s.id
    WHERE esl.is_active = TRUE
      AND s.is_active = TRUE
      AND s.status = 'active'
      AND (service_type IS NULL OR esl.location_type = service_type)
      AND calculate_precise_distance_km(center_lat, center_lng, esl.latitude, esl.longitude) <= radius_km
    ORDER BY calculate_precise_distance_km(center_lat, center_lng, esl.latitude, esl.longitude)
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update enhanced supplier location fields
CREATE OR REPLACE FUNCTION update_enhanced_supplier_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculate geohash
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geohash = calculate_geohash(NEW.latitude, NEW.longitude, 9);
    END IF;
    
    -- Update confidence score based on data completeness
    NEW.location_confidence_score = (
        CASE WHEN NEW.location_verified THEN 0.4 ELSE 0.0 END +
        CASE WHEN NEW.google_place_id IS NOT NULL THEN 0.3 ELSE 0.0 END +
        CASE WHEN NEW.accuracy_meters IS NOT NULL AND NEW.accuracy_meters <= 10 THEN 0.2 ELSE 0.0 END +
        CASE WHEN NEW.street_number IS NOT NULL AND NEW.street_name IS NOT NULL THEN 0.1 ELSE 0.0 END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_enhanced_supplier_location_update
    BEFORE UPDATE ON enhanced_supplier_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_supplier_location();

CREATE TRIGGER trigger_enhanced_supplier_location_insert
    BEFORE INSERT ON enhanced_supplier_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_supplier_location();

-- Function to update delivery service timestamp
CREATE OR REPLACE FUNCTION update_delivery_service_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for delivery services
CREATE TRIGGER trigger_delivery_services_update
    BEFORE UPDATE ON supplier_delivery_services
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_service_timestamp();

-- Function to update service hours timestamp
CREATE OR REPLACE FUNCTION update_service_hours_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for service hours
CREATE TRIGGER trigger_service_hours_update
    BEFORE UPDATE ON supplier_service_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_service_hours_timestamp();

-- Create comprehensive views for supplier queries

-- View for enhanced supplier search results
CREATE OR REPLACE VIEW enhanced_supplier_search AS
SELECT 
    esl.id as location_id,
    s.id as store_id,
    s.name as store_name,
    s.slug as store_slug,
    esl.location_type,
    esl.latitude,
    esl.longitude,
    esl.geohash,
    esl.service_radius_km,
    esl.location_verified,
    esl.location_confidence_score,
    -- Address information
    CONCAT_WS(', ', 
        NULLIF(CONCAT_WS(' ', esl.street_number, esl.street_name), ''),
        esl.locality,
        esl.administrative_area_level_1,
        esl.postal_code
    ) as full_address,
    -- Store information
    s.phone,
    s.website_url,
    s.average_rating,
    s.review_count,
    s.business_hours,
    s.delivery_available,
    s.pickup_available,
    s.services_offered,
    s.products_offered,
    s.features
FROM enhanced_supplier_locations esl
INNER JOIN stores s ON esl.store_id = s.id
WHERE esl.is_active = TRUE 
  AND s.is_active = TRUE 
  AND s.status = 'active';

-- View for supplier delivery options
CREATE OR REPLACE VIEW supplier_delivery_options AS
SELECT 
    sds.id,
    esl.store_id,
    s.name as store_name,
    sds.service_name,
    sds.delivery_speed,
    sds.base_delivery_fee,
    sds.minimum_order_amount,
    sds.free_delivery_threshold,
    sds.max_delivery_distance_km,
    sds.available_days,
    sds.delivery_hours_start,
    sds.delivery_hours_end,
    sds.contactless_delivery,
    sds.scheduled_delivery
FROM supplier_delivery_services sds
INNER JOIN enhanced_supplier_locations esl ON sds.supplier_location_id = esl.id
INNER JOIN stores s ON esl.store_id = s.id
WHERE sds.is_available = TRUE 
  AND esl.is_active = TRUE 
  AND s.is_active = TRUE;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON enhanced_supplier_locations TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_delivery_services TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_service_hours TO rawgle_user;
GRANT SELECT ON enhanced_supplier_search TO rawgle_user;
GRANT SELECT ON supplier_delivery_options TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Enhanced Supplier Geolocation system created successfully with advanced mapping and delivery features!' as result;

-- Display tables info
SELECT 
    'enhanced_supplier_locations' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'enhanced_supplier_locations'
UNION ALL
SELECT 
    'supplier_delivery_services',
    COUNT(*)
FROM information_schema.columns 
WHERE table_name = 'supplier_delivery_services'
UNION ALL
SELECT 
    'supplier_service_hours',
    COUNT(*)
FROM information_schema.columns 
WHERE table_name = 'supplier_service_hours';