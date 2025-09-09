-- Migration: Create Pets Table for RAWGLE MVP
-- Stores pet profiles and health data for users
-- Created: 2025-09-07
-- Component: Pet Management System

-- Create pet size enum
CREATE TYPE IF NOT EXISTS pet_size AS ENUM ('small', 'medium', 'large', 'extra_large');

-- Create pet activity level enum  
CREATE TYPE IF NOT EXISTS pet_activity_level AS ENUM ('low', 'moderate', 'high', 'very_high');

-- Create pet health status enum
CREATE TYPE IF NOT EXISTS pet_health_status AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical');

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic pet information
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'ferret', 'other')),
    breed VARCHAR(100),
    color VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
    
    -- Physical characteristics
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 200),
    size pet_size,
    is_spayed_neutered BOOLEAN DEFAULT FALSE,
    
    -- Activity and lifestyle
    activity_level pet_activity_level DEFAULT 'moderate',
    indoor_outdoor VARCHAR(20) DEFAULT 'indoor' CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
    
    -- Health information
    health_status pet_health_status DEFAULT 'good',
    allergies TEXT[],
    medical_conditions TEXT[],
    medications TEXT[],
    special_dietary_needs TEXT,
    
    -- Feeding preferences
    preferred_food_type VARCHAR(50) DEFAULT 'dry' CHECK (preferred_food_type IN ('dry', 'wet', 'raw', 'mixed')),
    feeding_schedule VARCHAR(50) DEFAULT 'twice_daily' CHECK (feeding_schedule IN ('once_daily', 'twice_daily', 'three_times_daily', 'free_feeding', 'custom')),
    daily_food_amount_grams INTEGER CHECK (daily_food_amount_grams > 0 AND daily_food_amount_grams <= 5000),
    
    -- Emergency contact
    veterinarian_name VARCHAR(200),
    veterinarian_phone VARCHAR(20),
    veterinarian_address TEXT,
    
    -- Media
    profile_image_url TEXT,
    additional_photos TEXT[],
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_size ON pets(size);
CREATE INDEX IF NOT EXISTS idx_pets_activity_level ON pets(activity_level);
CREATE INDEX IF NOT EXISTS idx_pets_health_status ON pets(health_status);
CREATE INDEX IF NOT EXISTS idx_pets_is_active ON pets(is_active);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pets_name_search ON pets USING gin(to_tsvector('english', name));

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pets_user_active ON pets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pets_species_size ON pets(species, size);

-- Add constraints
ALTER TABLE pets 
ADD CONSTRAINT IF NOT EXISTS chk_pets_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_pets_age_reasonable CHECK (date_of_birth IS NULL OR date_of_birth >= '1980-01-01'),
ADD CONSTRAINT IF NOT EXISTS chk_pets_weight_reasonable CHECK (weight_kg IS NULL OR (weight_kg >= 0.1 AND weight_kg <= 200));

-- Function to calculate pet age in years
CREATE OR REPLACE FUNCTION calculate_pet_age_years(birth_date DATE)
RETURNS DECIMAL(3,1) AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN ROUND(
        EXTRACT(DAYS FROM (CURRENT_DATE - birth_date)) / 365.25, 
        1
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get recommended daily calories based on pet characteristics
CREATE OR REPLACE FUNCTION calculate_recommended_calories(
    species_param VARCHAR,
    weight_kg_param DECIMAL,
    activity_level_param pet_activity_level,
    is_spayed_neutered_param BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
    base_calories INTEGER;
    activity_multiplier DECIMAL;
    spay_neuter_multiplier DECIMAL;
BEGIN
    -- Base calorie calculation (simplified formula)
    CASE 
        WHEN species_param = 'dog' THEN
            base_calories := ROUND(70 * POWER(weight_kg_param, 0.75));
        WHEN species_param = 'cat' THEN
            base_calories := ROUND(70 * POWER(weight_kg_param, 0.67));
        ELSE
            base_calories := ROUND(60 * weight_kg_param); -- Generic formula for other pets
    END CASE;
    
    -- Activity level multiplier
    CASE activity_level_param
        WHEN 'low' THEN activity_multiplier := 1.2;
        WHEN 'moderate' THEN activity_multiplier := 1.4;
        WHEN 'high' THEN activity_multiplier := 1.6;
        WHEN 'very_high' THEN activity_multiplier := 1.8;
        ELSE activity_multiplier := 1.4;
    END CASE;
    
    -- Spay/neuter adjustment
    spay_neuter_multiplier := CASE WHEN is_spayed_neutered_param THEN 0.9 ELSE 1.0 END;
    
    RETURN ROUND(base_calories * activity_multiplier * spay_neuter_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update pet's updated_at timestamp
CREATE OR REPLACE FUNCTION update_pet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_pet_timestamp();

-- Create view for pet summary information
CREATE OR REPLACE VIEW pets_summary AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.species,
    p.breed,
    p.gender,
    p.size,
    calculate_pet_age_years(p.date_of_birth) as age_years,
    p.weight_kg,
    p.activity_level,
    p.health_status,
    calculate_recommended_calories(p.species, p.weight_kg, p.activity_level, p.is_spayed_neutered) as recommended_daily_calories,
    p.profile_image_url,
    p.is_active,
    p.created_at,
    p.updated_at
FROM pets p
WHERE p.is_active = TRUE;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pets TO rawgle_user;
GRANT SELECT ON pets_summary TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Pets table created successfully with comprehensive pet management features!' as result;

-- Display table info
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pets' 
ORDER BY ordinal_position;