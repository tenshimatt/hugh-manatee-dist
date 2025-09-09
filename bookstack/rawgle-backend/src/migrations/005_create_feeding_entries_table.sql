-- Migration: Create Feeding Entries Table for RAWGLE MVP
-- Stores daily feeding logs and tracking data
-- Created: 2025-09-07
-- Component: Feeding Tracking System

-- Create feeding status enum
CREATE TYPE IF NOT EXISTS feeding_status AS ENUM ('scheduled', 'completed', 'skipped', 'late', 'partial');

-- Create feeding method enum
CREATE TYPE IF NOT EXISTS feeding_method AS ENUM ('bowl', 'puzzle_feeder', 'slow_feeder', 'treat_dispenser', 'hand_fed', 'other');

-- Create appetite rating enum
CREATE TYPE IF NOT EXISTS appetite_rating AS ENUM ('poor', 'fair', 'good', 'excellent', 'ravenous');

-- Create feeding entries table
CREATE TABLE IF NOT EXISTS feeding_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feeding_schedule_meal_id UUID REFERENCES feeding_schedule_meals(id) ON DELETE SET NULL,
    
    -- Entry identification
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scheduled_time TIME,
    actual_feeding_time TIMESTAMPTZ,
    
    -- Feeding details
    status feeding_status DEFAULT 'scheduled',
    food_brand VARCHAR(200),
    food_type VARCHAR(100),
    portion_served_grams INTEGER CHECK (portion_served_grams >= 0 AND portion_served_grams <= 2000),
    portion_consumed_grams INTEGER CHECK (portion_consumed_grams >= 0 AND portion_consumed_grams <= 2000),
    calories_consumed INTEGER CHECK (calories_consumed >= 0),
    
    -- Feeding context
    feeding_method feeding_method DEFAULT 'bowl',
    appetite_rating appetite_rating,
    feeding_duration_minutes INTEGER CHECK (feeding_duration_minutes >= 0 AND feeding_duration_minutes <= 120),
    
    -- Health and behavior observations
    vomited_after_eating BOOLEAN DEFAULT FALSE,
    seemed_nauseous BOOLEAN DEFAULT FALSE,
    eating_speed VARCHAR(20) CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast')),
    food_left_over BOOLEAN DEFAULT FALSE,
    begged_for_more BOOLEAN DEFAULT FALSE,
    
    -- Environmental factors
    feeding_location VARCHAR(100),
    weather_condition VARCHAR(50),
    other_pets_present BOOLEAN DEFAULT FALSE,
    distractions_present BOOLEAN DEFAULT FALSE,
    
    -- Additional tracking
    supplements_given TEXT[],
    medications_given TEXT[],
    treats_given TEXT[],
    water_consumption_ml INTEGER CHECK (water_consumption_ml >= 0 AND water_consumption_ml <= 5000),
    
    -- Notes and observations
    notes TEXT,
    health_concerns TEXT,
    behavioral_notes TEXT,
    
    -- Photos and media
    food_photo_url TEXT,
    pet_eating_photo_url TEXT,
    additional_photos TEXT[],
    
    -- Automation and reminders
    was_reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    auto_logged BOOLEAN DEFAULT FALSE, -- If logged automatically by smart feeders
    device_id VARCHAR(100), -- Smart feeder device identifier
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feeding entry reactions table (for tracking food reactions)
CREATE TABLE IF NOT EXISTS feeding_entry_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feeding_entry_id UUID NOT NULL REFERENCES feeding_entries(id) ON DELETE CASCADE,
    
    -- Reaction details
    reaction_type VARCHAR(50) NOT NULL CHECK (reaction_type IN ('allergic', 'digestive', 'behavioral', 'other')),
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
    symptoms TEXT[],
    onset_minutes_after_eating INTEGER CHECK (onset_minutes_after_eating >= 0),
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    
    -- Actions taken
    treatment_given TEXT,
    vet_contacted BOOLEAN DEFAULT FALSE,
    vet_visit_required BOOLEAN DEFAULT FALSE,
    
    -- Notes
    notes TEXT,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for feeding_entries
CREATE INDEX IF NOT EXISTS idx_feeding_entries_pet_id ON feeding_entries(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_user_id ON feeding_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_schedule_meal_id ON feeding_entries(feeding_schedule_meal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_date ON feeding_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_status ON feeding_entries(status);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_actual_time ON feeding_entries(actual_feeding_time DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_appetite ON feeding_entries(appetite_rating);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_created_at ON feeding_entries(created_at DESC);

-- Create indexes for feeding_entry_reactions
CREATE INDEX IF NOT EXISTS idx_feeding_entry_reactions_entry_id ON feeding_entry_reactions(feeding_entry_id);
CREATE INDEX IF NOT EXISTS idx_feeding_entry_reactions_type ON feeding_entry_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_feeding_entry_reactions_severity ON feeding_entry_reactions(severity);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feeding_entries_pet_date ON feeding_entries(pet_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_pet_status ON feeding_entries(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_user_date ON feeding_entries(user_id, entry_date);

-- Add constraints
ALTER TABLE feeding_entries
ADD CONSTRAINT IF NOT EXISTS chk_feeding_entries_portion_consumed_valid 
    CHECK (portion_consumed_grams IS NULL OR portion_consumed_grams <= portion_served_grams),
ADD CONSTRAINT IF NOT EXISTS chk_feeding_entries_date_reasonable 
    CHECK (entry_date >= '2020-01-01' AND entry_date <= CURRENT_DATE + INTERVAL '1 day');

-- Function to calculate feeding completion percentage
CREATE OR REPLACE FUNCTION calculate_feeding_completion_rate(
    pet_id_param UUID,
    start_date_param DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_scheduled INTEGER := 0;
    total_completed INTEGER := 0;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO total_scheduled, total_completed
    FROM feeding_entries
    WHERE pet_id = pet_id_param
      AND entry_date BETWEEN start_date_param AND end_date_param
      AND status IN ('scheduled', 'completed', 'late', 'partial');
    
    IF total_scheduled = 0 THEN
        RETURN NULL;
    END IF;
    
    RETURN ROUND((total_completed::DECIMAL / total_scheduled::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get daily calories consumed for a pet
CREATE OR REPLACE FUNCTION get_daily_calories_consumed(
    pet_id_param UUID,
    date_param DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    total_calories INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(calories_consumed), 0) INTO total_calories
    FROM feeding_entries
    WHERE pet_id = pet_id_param 
      AND entry_date = date_param
      AND status = 'completed';
    
    RETURN total_calories;
END;
$$ LANGUAGE plpgsql;

-- Function to check for overfeeding alerts
CREATE OR REPLACE FUNCTION check_overfeeding_alert(pet_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    is_alert BOOLEAN,
    total_calories_consumed INTEGER,
    recommended_daily_calories INTEGER,
    percentage_of_recommended DECIMAL(5,2),
    alert_message TEXT
) AS $$
DECLARE
    consumed_calories INTEGER;
    recommended_calories INTEGER;
    percentage DECIMAL(5,2);
BEGIN
    -- Get consumed calories for the day
    SELECT get_daily_calories_consumed(pet_id_param, date_param) INTO consumed_calories;
    
    -- Get recommended calories from pet profile
    SELECT calculate_recommended_calories(p.species, p.weight_kg, p.activity_level, p.is_spayed_neutered)
    INTO recommended_calories
    FROM pets p
    WHERE p.id = pet_id_param;
    
    -- Calculate percentage
    IF recommended_calories > 0 THEN
        percentage := (consumed_calories::DECIMAL / recommended_calories::DECIMAL) * 100;
    ELSE
        percentage := 0;
    END IF;
    
    -- Return alert information
    RETURN QUERY SELECT 
        (percentage > 120)::BOOLEAN as is_alert,
        consumed_calories as total_calories_consumed,
        recommended_calories as recommended_daily_calories,
        percentage as percentage_of_recommended,
        CASE 
            WHEN percentage > 150 THEN 'CRITICAL: Pet has consumed ' || percentage::TEXT || '% of recommended daily calories!'
            WHEN percentage > 120 THEN 'WARNING: Pet has consumed ' || percentage::TEXT || '% of recommended daily calories.'
            ELSE 'No overfeeding detected.'
        END as alert_message;
END;
$$ LANGUAGE plpgsql;

-- Function to update feeding entry timestamp
CREATE OR REPLACE FUNCTION update_feeding_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-set actual feeding time if status changed to completed and time not set
    IF NEW.status = 'completed' AND NEW.actual_feeding_time IS NULL AND OLD.status != 'completed' THEN
        NEW.actual_feeding_time = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_feeding_entries_updated_at
    BEFORE UPDATE ON feeding_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_feeding_entry_timestamp();

-- Create view for recent feeding entries
CREATE OR REPLACE VIEW recent_feeding_entries AS
SELECT 
    fe.id,
    fe.pet_id,
    p.name as pet_name,
    fe.user_id,
    fe.entry_date,
    fe.scheduled_time,
    fe.actual_feeding_time,
    fe.status,
    fe.food_brand,
    fe.food_type,
    fe.portion_served_grams,
    fe.portion_consumed_grams,
    fe.calories_consumed,
    fe.appetite_rating,
    fe.feeding_method,
    fe.notes,
    fe.created_at
FROM feeding_entries fe
INNER JOIN pets p ON fe.pet_id = p.id
WHERE fe.entry_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY fe.entry_date DESC, fe.scheduled_time DESC;

-- Create view for feeding statistics
CREATE OR REPLACE VIEW feeding_statistics AS
SELECT 
    fe.pet_id,
    p.name as pet_name,
    p.species,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN fe.status = 'completed' THEN 1 END) as completed_feedings,
    COUNT(CASE WHEN fe.status = 'skipped' THEN 1 END) as skipped_feedings,
    COUNT(CASE WHEN fe.status = 'late' THEN 1 END) as late_feedings,
    ROUND(AVG(fe.portion_consumed_grams), 2) as avg_portion_consumed_grams,
    ROUND(AVG(fe.calories_consumed), 2) as avg_calories_consumed,
    MODE() WITHIN GROUP (ORDER BY fe.appetite_rating) as most_common_appetite,
    COUNT(CASE WHEN fe.vomited_after_eating THEN 1 END) as vomiting_incidents,
    MAX(fe.entry_date) as last_feeding_date
FROM feeding_entries fe
INNER JOIN pets p ON fe.pet_id = p.id
WHERE fe.entry_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY fe.pet_id, p.name, p.species;

-- Create view for daily feeding summary
CREATE OR REPLACE VIEW daily_feeding_summary AS
SELECT 
    fe.pet_id,
    p.name as pet_name,
    fe.entry_date,
    COUNT(*) as total_meals,
    COUNT(CASE WHEN fe.status = 'completed' THEN 1 END) as completed_meals,
    SUM(fe.portion_consumed_grams) as total_food_consumed_grams,
    SUM(fe.calories_consumed) as total_calories_consumed,
    get_daily_calories_consumed(fe.pet_id, fe.entry_date) as calculated_calories_consumed,
    AVG(CASE WHEN fe.appetite_rating = 'poor' THEN 1 
             WHEN fe.appetite_rating = 'fair' THEN 2 
             WHEN fe.appetite_rating = 'good' THEN 3 
             WHEN fe.appetite_rating = 'excellent' THEN 4 
             WHEN fe.appetite_rating = 'ravenous' THEN 5 
             ELSE NULL END) as avg_appetite_score
FROM feeding_entries fe
INNER JOIN pets p ON fe.pet_id = p.id
GROUP BY fe.pet_id, p.name, fe.entry_date
ORDER BY fe.pet_id, fe.entry_date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_entries TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_entry_reactions TO rawgle_user;
GRANT SELECT ON recent_feeding_entries TO rawgle_user;
GRANT SELECT ON feeding_statistics TO rawgle_user;
GRANT SELECT ON daily_feeding_summary TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Feeding entries table created successfully with comprehensive tracking features!' as result;

-- Display table info
SELECT 'feeding_entries' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_entries' 
UNION ALL
SELECT 'feeding_entry_reactions' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_entry_reactions' 
ORDER BY table_name, ordinal_position;