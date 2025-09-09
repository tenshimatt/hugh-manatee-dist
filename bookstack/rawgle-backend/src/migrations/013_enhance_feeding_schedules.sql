-- Migration: Enhanced Feeding Schedules System for RAWGLE MVP
-- Advanced feeding schedules, reminders, portions, and nutrition tracking
-- Created: 2025-09-07
-- Component: Enhanced Feeding Management System

-- Create enhanced feeding frequency enum
CREATE TYPE IF NOT EXISTS enhanced_feeding_frequency AS ENUM (
    'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
    'every_2_hours', 'every_4_hours', 'every_6_hours', 'every_8_hours',
    'free_feeding', 'custom_schedule'
);

-- Create reminder type enum
CREATE TYPE IF NOT EXISTS reminder_type AS ENUM ('notification', 'email', 'sms', 'push', 'all');

-- Create portion measurement enum
CREATE TYPE IF NOT EXISTS portion_measurement AS ENUM ('grams', 'ounces', 'cups', 'tablespoons', 'pieces', 'treats');

-- Create food type enum
CREATE TYPE IF NOT EXISTS enhanced_food_type AS ENUM (
    'dry_kibble', 'wet_canned', 'raw_food', 'freeze_dried', 
    'dehydrated', 'fresh_cooked', 'treats', 'supplements', 
    'prescription_diet', 'mixed'
);

-- Enhanced feeding schedules table (extends existing functionality)
CREATE TABLE IF NOT EXISTS enhanced_feeding_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Schedule identification
    schedule_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_primary_schedule BOOLEAN DEFAULT TRUE,
    
    -- Feeding frequency and timing
    feeding_frequency enhanced_feeding_frequency NOT NULL DEFAULT 'twice_daily',
    custom_frequency_description TEXT, -- For custom_schedule type
    meals_per_day INTEGER NOT NULL DEFAULT 2 CHECK (meals_per_day >= 1 AND meals_per_day <= 10),
    
    -- Schedule dates
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_temporary BOOLEAN DEFAULT FALSE,
    temporary_reason TEXT, -- Illness, medication, etc.
    
    -- Food information
    primary_food_brand VARCHAR(200),
    primary_food_product VARCHAR(200),
    food_type enhanced_food_type NOT NULL DEFAULT 'dry_kibble',
    food_flavor VARCHAR(100),
    
    -- Portion control
    total_daily_amount DECIMAL(8, 2) NOT NULL CHECK (total_daily_amount > 0),
    daily_amount_unit portion_measurement NOT NULL DEFAULT 'grams',
    portion_per_meal DECIMAL(8, 2), -- Calculated automatically
    
    -- Nutritional targets
    target_calories_per_day INTEGER CHECK (target_calories_per_day > 0),
    calories_per_unit DECIMAL(8, 2) CHECK (calories_per_unit > 0), -- Calories per gram/cup/etc
    protein_percentage DECIMAL(5, 2) CHECK (protein_percentage >= 0 AND protein_percentage <= 100),
    fat_percentage DECIMAL(5, 2) CHECK (fat_percentage >= 0 AND fat_percentage <= 100),
    
    -- Feeding instructions
    feeding_instructions TEXT,
    special_dietary_notes TEXT,
    supplements_included TEXT[],
    treats_allowed BOOLEAN DEFAULT TRUE,
    max_treats_per_day INTEGER CHECK (max_treats_per_day >= 0),
    
    -- Environmental preferences
    feeding_location VARCHAR(100), -- 'kitchen', 'dining_room', 'outdoor', etc.
    bowl_type VARCHAR(50), -- 'stainless_steel', 'ceramic', 'plastic', 'elevated'
    water_bowl_location VARCHAR(100),
    quiet_feeding_required BOOLEAN DEFAULT FALSE,
    
    -- Monitoring and tracking
    weight_monitoring_enabled BOOLEAN DEFAULT TRUE,
    appetite_tracking_enabled BOOLEAN DEFAULT TRUE,
    waste_tracking_enabled BOOLEAN DEFAULT FALSE,
    
    -- Schedule automation
    auto_adjust_portions BOOLEAN DEFAULT FALSE,
    adjust_based_on_weight BOOLEAN DEFAULT FALSE,
    adjust_based_on_activity BOOLEAN DEFAULT FALSE,
    adjust_based_on_age BOOLEAN DEFAULT FALSE,
    
    -- Status and management
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by_vet UUID REFERENCES users(id) ON DELETE SET NULL, -- If vet-prescribed
    last_reviewed_date DATE,
    next_review_due DATE,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced feeding times table (replaces simple meal tracking)
CREATE TABLE IF NOT EXISTS feeding_schedule_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feeding_schedule_id UUID NOT NULL REFERENCES enhanced_feeding_schedules(id) ON DELETE CASCADE,
    
    -- Time scheduling
    meal_number INTEGER NOT NULL CHECK (meal_number >= 1 AND meal_number <= 10),
    feeding_time TIME NOT NULL,
    meal_name VARCHAR(100), -- 'Breakfast', 'Lunch', 'Dinner', 'Snack', etc.
    
    -- Portion for this specific meal
    portion_amount DECIMAL(8, 2) NOT NULL CHECK (portion_amount > 0),
    portion_unit portion_measurement NOT NULL DEFAULT 'grams',
    
    -- Meal-specific instructions
    pre_feeding_instructions TEXT, -- 'Let food warm to room temperature'
    post_feeding_instructions TEXT, -- 'Remove uneaten food after 30 minutes'
    
    -- Food composition for this meal
    primary_food_percentage DECIMAL(5, 2) DEFAULT 100.00 CHECK (primary_food_percentage >= 0 AND primary_food_percentage <= 100),
    wet_food_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (wet_food_percentage >= 0 AND wet_food_percentage <= 100),
    treats_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (treats_percentage >= 0 AND treats_percentage <= 100),
    
    -- Supplements for this meal
    supplements TEXT[],
    medications TEXT[], -- Medications given with food
    
    -- Days of week this meal applies (1=Monday, 7=Sunday)
    active_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced feeding entries table (extends existing with more detail)
CREATE TABLE IF NOT EXISTS enhanced_feeding_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    feeding_schedule_id UUID REFERENCES enhanced_feeding_schedules(id) ON DELETE SET NULL,
    feeding_time_id UUID REFERENCES feeding_schedule_times(id) ON DELETE SET NULL,
    
    -- When and what was fed
    fed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_time TIME, -- What time it was supposed to be fed
    was_on_schedule BOOLEAN DEFAULT TRUE,
    minutes_late INTEGER CHECK (minutes_late >= 0),
    
    -- Food details
    food_brand VARCHAR(200),
    food_product VARCHAR(200),
    food_type enhanced_food_type NOT NULL,
    food_flavor VARCHAR(100),
    
    -- Portion details
    amount_given DECIMAL(8, 2) NOT NULL CHECK (amount_given > 0),
    amount_unit portion_measurement NOT NULL DEFAULT 'grams',
    amount_eaten DECIMAL(8, 2) CHECK (amount_eaten >= 0 AND amount_eaten <= amount_given),
    amount_wasted DECIMAL(8, 2) CHECK (amount_wasted >= 0),
    
    -- Eating behavior
    eating_duration_minutes INTEGER CHECK (eating_duration_minutes > 0),
    appetite_rating appetite_rating NOT NULL DEFAULT 'normal',
    eating_speed VARCHAR(20) CHECK (eating_speed IN ('very_slow', 'slow', 'normal', 'fast', 'very_fast')),
    eating_behavior TEXT, -- Free text for observations
    
    -- Feeding context
    fed_by VARCHAR(100), -- Who fed the pet
    feeding_method feeding_method NOT NULL DEFAULT 'bowl',
    feeding_location VARCHAR(100),
    
    -- Additional items given
    treats_given BOOLEAN DEFAULT FALSE,
    treat_types TEXT[],
    treat_amount DECIMAL(8, 2) CHECK (treat_amount >= 0),
    supplements_given TEXT[],
    medications_given TEXT[],
    
    -- Water consumption
    water_bowl_refilled BOOLEAN DEFAULT FALSE,
    estimated_water_consumed_ml INTEGER CHECK (estimated_water_consumed_ml >= 0),
    
    -- Environmental factors
    temperature_celsius DECIMAL(4, 1),
    humidity_percentage INTEGER CHECK (humidity_percentage >= 0 AND humidity_percentage <= 100),
    feeding_interrupted BOOLEAN DEFAULT FALSE,
    interruption_reason TEXT,
    
    -- Health and behavior notes
    vomited_after_eating BOOLEAN DEFAULT FALSE,
    diarrhea_after_eating BOOLEAN DEFAULT FALSE,
    unusual_behavior_noted TEXT,
    health_concerns TEXT,
    
    -- Photos and documentation
    food_photo_url TEXT,
    bowl_before_photo_url TEXT,
    bowl_after_photo_url TEXT,
    
    -- Reactions and responses (from existing table structure)
    reactions JSONB DEFAULT '{}',
    
    -- System fields
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feeding reminders table
CREATE TABLE IF NOT EXISTS feeding_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feeding_schedule_id UUID NOT NULL REFERENCES enhanced_feeding_schedules(id) ON DELETE CASCADE,
    feeding_time_id UUID REFERENCES feeding_schedule_times(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reminder configuration
    reminder_name VARCHAR(200) NOT NULL,
    reminder_type reminder_type NOT NULL DEFAULT 'notification',
    
    -- Timing
    minutes_before_feeding INTEGER NOT NULL DEFAULT 15 CHECK (minutes_before_feeding >= 0 AND minutes_before_feeding <= 1440),
    remind_only_if_not_fed BOOLEAN DEFAULT TRUE,
    
    -- Days of week to send reminders (1=Monday, 7=Sunday)
    active_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    
    -- Message customization
    custom_message TEXT,
    include_pet_name BOOLEAN DEFAULT TRUE,
    include_meal_details BOOLEAN DEFAULT TRUE,
    include_portion_amount BOOLEAN DEFAULT TRUE,
    
    -- Contact preferences
    phone_number VARCHAR(20), -- For SMS reminders
    email_address VARCHAR(255), -- For email reminders
    
    -- Status and management
    is_enabled BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    total_sent_count INTEGER DEFAULT 0,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for feeding system

-- Enhanced feeding schedules indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_pet_id ON enhanced_feeding_schedules(pet_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_primary ON enhanced_feeding_schedules(is_primary_schedule) WHERE is_primary_schedule = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_frequency ON enhanced_feeding_schedules(feeding_frequency);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_food_type ON enhanced_feeding_schedules(food_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_dates ON enhanced_feeding_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_schedules_review_due ON enhanced_feeding_schedules(next_review_due) WHERE next_review_due IS NOT NULL;

-- Feeding schedule times indexes
CREATE INDEX IF NOT EXISTS idx_feeding_times_schedule_id ON feeding_schedule_times(feeding_schedule_id);
CREATE INDEX IF NOT EXISTS idx_feeding_times_meal_number ON feeding_schedule_times(meal_number);
CREATE INDEX IF NOT EXISTS idx_feeding_times_feeding_time ON feeding_schedule_times(feeding_time);
CREATE INDEX IF NOT EXISTS idx_feeding_times_active_days ON feeding_schedule_times USING gin(active_days);

-- Enhanced feeding entries indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_pet_id ON enhanced_feeding_entries(pet_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_schedule_id ON enhanced_feeding_entries(feeding_schedule_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_fed_at ON enhanced_feeding_entries(fed_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_appetite ON enhanced_feeding_entries(appetite_rating);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_food_type ON enhanced_feeding_entries(food_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_entries_on_schedule ON enhanced_feeding_entries(was_on_schedule);

-- Feeding reminders indexes
CREATE INDEX IF NOT EXISTS idx_feeding_reminders_schedule_id ON feeding_reminders(feeding_schedule_id);
CREATE INDEX IF NOT EXISTS idx_feeding_reminders_user_id ON feeding_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_reminders_enabled ON feeding_reminders(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_feeding_reminders_type ON feeding_reminders(reminder_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_enhanced_feeding_pet_active ON enhanced_feeding_schedules(pet_id, is_active);
CREATE INDEX IF NOT EXISTS idx_feeding_entries_pet_date ON enhanced_feeding_entries(pet_id, fed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_times_schedule_meal ON feeding_schedule_times(feeding_schedule_id, meal_number);

-- Function to calculate portion per meal automatically
CREATE OR REPLACE FUNCTION calculate_portion_per_meal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculate portion per meal based on total daily amount and meals per day
    IF NEW.total_daily_amount IS NOT NULL AND NEW.meals_per_day IS NOT NULL AND NEW.meals_per_day > 0 THEN
        NEW.portion_per_meal = ROUND(NEW.total_daily_amount / NEW.meals_per_day, 2);
    END IF;
    
    -- Set next review date if not set (90 days from start)
    IF NEW.next_review_due IS NULL THEN
        NEW.next_review_due = NEW.start_date + INTERVAL '90 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate feeding schedule times
CREATE OR REPLACE FUNCTION validate_feeding_times()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage DECIMAL(5,2);
    schedule_meals_per_day INTEGER;
BEGIN
    NEW.updated_at = NOW();
    
    -- Validate that food percentages add up to 100 or less
    total_percentage := NEW.primary_food_percentage + NEW.wet_food_percentage + NEW.treats_percentage;
    
    IF total_percentage > 100 THEN
        RAISE EXCEPTION 'Total food percentages cannot exceed 100%%. Current total: %', total_percentage;
    END IF;
    
    -- Validate meal number against schedule
    SELECT meals_per_day INTO schedule_meals_per_day
    FROM enhanced_feeding_schedules
    WHERE id = NEW.feeding_schedule_id;
    
    IF NEW.meal_number > schedule_meals_per_day THEN
        RAISE EXCEPTION 'Meal number % exceeds maximum meals per day % for this schedule', NEW.meal_number, schedule_meals_per_day;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update feeding entry with schedule adherence
CREATE OR REPLACE FUNCTION update_feeding_entry_adherence()
RETURNS TRIGGER AS $$
DECLARE
    schedule_time TIME;
    time_diff INTERVAL;
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculate if feeding was on schedule
    IF NEW.feeding_time_id IS NOT NULL THEN
        SELECT feeding_time INTO schedule_time
        FROM feeding_schedule_times
        WHERE id = NEW.feeding_time_id;
        
        IF schedule_time IS NOT NULL THEN
            NEW.scheduled_time = schedule_time;
            time_diff = NEW.fed_at::TIME - schedule_time;
            
            -- Convert interval to minutes
            NEW.minutes_late = EXTRACT(EPOCH FROM time_diff) / 60;
            
            -- Consider on schedule if within 30 minutes
            NEW.was_on_schedule = (ABS(NEW.minutes_late) <= 30);
        END IF;
    END IF;
    
    -- Calculate amount wasted if not provided
    IF NEW.amount_wasted IS NULL AND NEW.amount_eaten IS NOT NULL THEN
        NEW.amount_wasted = GREATEST(0, NEW.amount_given - NEW.amount_eaten);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update reminder timestamp
CREATE OR REPLACE FUNCTION update_reminder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_calculate_portion_per_meal
    BEFORE INSERT OR UPDATE ON enhanced_feeding_schedules
    FOR EACH ROW
    EXECUTE FUNCTION calculate_portion_per_meal();

CREATE TRIGGER trigger_validate_feeding_times
    BEFORE INSERT OR UPDATE ON feeding_schedule_times
    FOR EACH ROW
    EXECUTE FUNCTION validate_feeding_times();

CREATE TRIGGER trigger_update_feeding_entry_adherence
    BEFORE INSERT OR UPDATE ON enhanced_feeding_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_feeding_entry_adherence();

CREATE TRIGGER trigger_update_reminder_timestamp
    BEFORE UPDATE ON feeding_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_timestamp();

-- Create views for feeding management

-- View for active feeding schedules with summary data
CREATE OR REPLACE VIEW active_feeding_schedules AS
SELECT 
    efs.id,
    efs.pet_id,
    p.name as pet_name,
    efs.schedule_name,
    efs.feeding_frequency,
    efs.meals_per_day,
    efs.total_daily_amount,
    efs.daily_amount_unit,
    efs.portion_per_meal,
    efs.food_type,
    efs.primary_food_brand,
    efs.primary_food_product,
    efs.target_calories_per_day,
    efs.is_primary_schedule,
    efs.start_date,
    efs.end_date,
    efs.next_review_due,
    -- Count of feeding times configured
    (SELECT COUNT(*) FROM feeding_schedule_times fst 
     WHERE fst.feeding_schedule_id = efs.id AND fst.is_active = TRUE) as configured_meal_times,
    -- Recent feeding compliance
    (SELECT AVG(CASE WHEN was_on_schedule THEN 1.0 ELSE 0.0 END) * 100
     FROM enhanced_feeding_entries efe 
     WHERE efe.feeding_schedule_id = efs.id 
     AND efe.fed_at >= NOW() - INTERVAL '7 days') as week_schedule_compliance_percent
FROM enhanced_feeding_schedules efs
INNER JOIN pets p ON efs.pet_id = p.id
WHERE efs.is_active = TRUE 
  AND p.is_active = TRUE;

-- View for today's feeding schedule
CREATE OR REPLACE VIEW todays_feeding_schedule AS
SELECT 
    fst.id,
    fst.feeding_schedule_id,
    efs.pet_id,
    p.name as pet_name,
    fst.meal_number,
    fst.meal_name,
    fst.feeding_time,
    fst.portion_amount,
    fst.portion_unit,
    efs.primary_food_brand,
    efs.primary_food_product,
    fst.pre_feeding_instructions,
    fst.post_feeding_instructions,
    -- Check if already fed today
    (SELECT COUNT(*) > 0 FROM enhanced_feeding_entries efe 
     WHERE efe.feeding_time_id = fst.id 
     AND efe.fed_at::DATE = CURRENT_DATE) as already_fed_today,
    -- Last feeding time for this meal
    (SELECT MAX(efe.fed_at) FROM enhanced_feeding_entries efe 
     WHERE efe.feeding_time_id = fst.id 
     AND efe.fed_at::DATE = CURRENT_DATE) as last_fed_at
FROM feeding_schedule_times fst
INNER JOIN enhanced_feeding_schedules efs ON fst.feeding_schedule_id = efs.id
INNER JOIN pets p ON efs.pet_id = p.id
WHERE fst.is_active = TRUE 
  AND efs.is_active = TRUE 
  AND p.is_active = TRUE
  AND EXTRACT(DOW FROM CURRENT_DATE) + 1 = ANY(fst.active_days) -- Today is in active days
ORDER BY fst.feeding_time;

-- View for feeding history with nutrition tracking
CREATE OR REPLACE VIEW feeding_history_nutrition AS
SELECT 
    efe.id,
    efe.pet_id,
    p.name as pet_name,
    efe.fed_at,
    efe.food_type,
    efe.food_brand,
    efe.food_product,
    efe.amount_given,
    efe.amount_eaten,
    efe.amount_unit,
    efe.appetite_rating,
    efe.eating_speed,
    efe.was_on_schedule,
    efe.minutes_late,
    efe.treats_given,
    efe.treat_amount,
    -- Estimated calories (if calories_per_unit is available in schedule)
    (efe.amount_eaten * COALESCE(efs.calories_per_unit, 0)) as estimated_calories_consumed,
    efe.water_bowl_refilled,
    efe.estimated_water_consumed_ml,
    efe.vomited_after_eating,
    efe.diarrhea_after_eating,
    efe.health_concerns
FROM enhanced_feeding_entries efe
INNER JOIN pets p ON efe.pet_id = p.id
LEFT JOIN enhanced_feeding_schedules efs ON efe.feeding_schedule_id = efs.id
WHERE efe.is_active = TRUE 
  AND p.is_active = TRUE
ORDER BY efe.fed_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON enhanced_feeding_schedules TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_schedule_times TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON enhanced_feeding_entries TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_reminders TO rawgle_user;
GRANT SELECT ON active_feeding_schedules TO rawgle_user;
GRANT SELECT ON todays_feeding_schedule TO rawgle_user;
GRANT SELECT ON feeding_history_nutrition TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Enhanced Feeding Schedules system created successfully with comprehensive nutrition tracking and reminder capabilities!' as result;

-- Display tables info
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN ('enhanced_feeding_schedules', 'feeding_schedule_times', 'enhanced_feeding_entries', 'feeding_reminders')
GROUP BY table_name
ORDER BY table_name;