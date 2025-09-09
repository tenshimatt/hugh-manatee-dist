-- Migration: Create Feeding Schedules Table for RAWGLE MVP
-- Stores weekly feeding schedules for pets
-- Created: 2025-09-07
-- Component: Feeding Management System

-- Create feeding schedule status enum
CREATE TYPE IF NOT EXISTS feeding_schedule_status AS ENUM ('active', 'paused', 'archived');

-- Create day of week enum
CREATE TYPE IF NOT EXISTS day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create meal type enum
CREATE TYPE IF NOT EXISTS meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'treat', 'medication');

-- Create feeding schedules table
CREATE TABLE IF NOT EXISTS feeding_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Schedule identification
    name VARCHAR(100) NOT NULL DEFAULT 'Default Schedule',
    description TEXT,
    
    -- Schedule configuration
    status feeding_schedule_status DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Default meal settings (can be overridden per meal)
    default_food_brand VARCHAR(200),
    default_food_type VARCHAR(100),
    default_portion_size_grams INTEGER CHECK (default_portion_size_grams > 0 AND default_portion_size_grams <= 2000),
    
    -- Schedule metadata
    total_daily_calories INTEGER,
    total_daily_portions INTEGER DEFAULT 1,
    auto_adjust_portions BOOLEAN DEFAULT FALSE,
    
    -- Notifications
    enable_notifications BOOLEAN DEFAULT TRUE,
    notification_minutes_before INTEGER DEFAULT 15 CHECK (notification_minutes_before >= 0 AND notification_minutes_before <= 120),
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feeding schedule meals table (individual meals within a schedule)
CREATE TABLE IF NOT EXISTS feeding_schedule_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feeding_schedule_id UUID NOT NULL REFERENCES feeding_schedules(id) ON DELETE CASCADE,
    
    -- Meal timing
    day_of_week day_of_week NOT NULL,
    meal_time TIME NOT NULL,
    meal_type meal_type DEFAULT 'breakfast',
    
    -- Meal details
    food_brand VARCHAR(200),
    food_type VARCHAR(100),
    portion_size_grams INTEGER NOT NULL CHECK (portion_size_grams > 0 AND portion_size_grams <= 2000),
    calories_per_portion INTEGER,
    
    -- Special instructions
    preparation_notes TEXT,
    feeding_instructions TEXT,
    
    -- Meal-specific settings
    is_mandatory BOOLEAN DEFAULT TRUE,
    allow_early_feeding BOOLEAN DEFAULT TRUE,
    allow_late_feeding BOOLEAN DEFAULT TRUE,
    max_delay_minutes INTEGER DEFAULT 30 CHECK (max_delay_minutes >= 0 AND max_delay_minutes <= 240),
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for feeding_schedules
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_pet_id ON feeding_schedules(pet_id);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_user_id ON feeding_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_status ON feeding_schedules(status);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_active ON feeding_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_start_date ON feeding_schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_end_date ON feeding_schedules(end_date);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_created_at ON feeding_schedules(created_at DESC);

-- Create indexes for feeding_schedule_meals
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_meals_schedule_id ON feeding_schedule_meals(feeding_schedule_id);
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_meals_day_time ON feeding_schedule_meals(day_of_week, meal_time);
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_meals_meal_type ON feeding_schedule_meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_meals_active ON feeding_schedule_meals(is_active);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_pet_status ON feeding_schedules(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_feeding_schedule_meals_schedule_day ON feeding_schedule_meals(feeding_schedule_id, day_of_week);

-- Add constraints
ALTER TABLE feeding_schedules
ADD CONSTRAINT IF NOT EXISTS chk_feeding_schedules_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_feeding_schedules_date_range CHECK (end_date IS NULL OR end_date >= start_date),
ADD CONSTRAINT IF NOT EXISTS chk_feeding_schedules_daily_portions CHECK (total_daily_portions >= 1 AND total_daily_portions <= 10);

ALTER TABLE feeding_schedule_meals
ADD CONSTRAINT IF NOT EXISTS chk_feeding_schedule_meals_time_valid CHECK (meal_time >= '00:00:00' AND meal_time <= '23:59:59');

-- Function to calculate total daily calories for a schedule
CREATE OR REPLACE FUNCTION calculate_schedule_daily_calories(schedule_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_calories INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(calories_per_portion), 0) INTO total_calories
    FROM feeding_schedule_meals
    WHERE feeding_schedule_id = schedule_id_param 
      AND is_active = TRUE;
    
    RETURN total_calories;
END;
$$ LANGUAGE plpgsql;

-- Function to get next feeding time for a pet
CREATE OR REPLACE FUNCTION get_next_feeding_time(pet_id_param UUID)
RETURNS TABLE(
    meal_id UUID,
    meal_time TIME,
    day_of_week day_of_week,
    meal_type meal_type,
    next_feeding_datetime TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH current_schedule AS (
        SELECT id 
        FROM feeding_schedules 
        WHERE pet_id = pet_id_param 
          AND status = 'active' 
          AND is_active = TRUE
          AND (start_date IS NULL OR start_date <= CURRENT_DATE)
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY created_at DESC
        LIMIT 1
    ),
    upcoming_meals AS (
        SELECT 
            fsm.id,
            fsm.meal_time,
            fsm.day_of_week,
            fsm.meal_type,
            -- Calculate next occurrence of this meal
            (CURRENT_DATE + 
             (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 
              CASE fsm.day_of_week 
                WHEN 'sunday' THEN 0
                WHEN 'monday' THEN 1
                WHEN 'tuesday' THEN 2
                WHEN 'wednesday' THEN 3
                WHEN 'thursday' THEN 4
                WHEN 'friday' THEN 5
                WHEN 'saturday' THEN 6
              END + 7) % 7 + 
             CASE 
               WHEN (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER = 
                     CASE fsm.day_of_week 
                       WHEN 'sunday' THEN 0
                       WHEN 'monday' THEN 1
                       WHEN 'tuesday' THEN 2
                       WHEN 'wednesday' THEN 3
                       WHEN 'thursday' THEN 4
                       WHEN 'friday' THEN 5
                       WHEN 'saturday' THEN 6
                     END) AND fsm.meal_time > CURRENT_TIME THEN 0
               ELSE 7
             END)::INTEGER + fsm.meal_time AS next_feeding_datetime
        FROM feeding_schedule_meals fsm
        INNER JOIN current_schedule cs ON fsm.feeding_schedule_id = cs.id
        WHERE fsm.is_active = TRUE
    )
    SELECT 
        um.id,
        um.meal_time,
        um.day_of_week,
        um.meal_type,
        um.next_feeding_datetime
    FROM upcoming_meals um
    ORDER BY um.next_feeding_datetime
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update feeding schedule timestamps
CREATE OR REPLACE FUNCTION update_feeding_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update feeding schedule meal timestamps
CREATE OR REPLACE FUNCTION update_feeding_schedule_meal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Also update parent schedule's updated_at
    UPDATE feeding_schedules 
    SET updated_at = NOW() 
    WHERE id = NEW.feeding_schedule_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER trigger_feeding_schedules_updated_at
    BEFORE UPDATE ON feeding_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_feeding_schedule_timestamp();

CREATE TRIGGER trigger_feeding_schedule_meals_updated_at
    BEFORE UPDATE ON feeding_schedule_meals
    FOR EACH ROW
    EXECUTE FUNCTION update_feeding_schedule_meal_timestamp();

-- Create view for active feeding schedules with meal counts
CREATE OR REPLACE VIEW active_feeding_schedules AS
SELECT 
    fs.id,
    fs.pet_id,
    fs.user_id,
    fs.name,
    fs.description,
    fs.status,
    fs.start_date,
    fs.end_date,
    fs.default_food_brand,
    fs.default_food_type,
    fs.total_daily_calories,
    fs.enable_notifications,
    fs.notification_minutes_before,
    COUNT(fsm.id) as total_meals,
    fs.created_at,
    fs.updated_at
FROM feeding_schedules fs
LEFT JOIN feeding_schedule_meals fsm ON fs.id = fsm.feeding_schedule_id AND fsm.is_active = TRUE
WHERE fs.is_active = TRUE AND fs.status = 'active'
GROUP BY fs.id;

-- Create view for today's feeding schedule
CREATE OR REPLACE VIEW todays_feeding_schedule AS
SELECT 
    fsm.id,
    fsm.feeding_schedule_id,
    fs.pet_id,
    fs.user_id,
    p.name as pet_name,
    fsm.meal_time,
    fsm.meal_type,
    fsm.food_brand,
    fsm.food_type,
    fsm.portion_size_grams,
    fsm.calories_per_portion,
    fsm.preparation_notes,
    fsm.feeding_instructions,
    fs.enable_notifications,
    fs.notification_minutes_before
FROM feeding_schedule_meals fsm
INNER JOIN feeding_schedules fs ON fsm.feeding_schedule_id = fs.id
INNER JOIN pets p ON fs.pet_id = p.id
WHERE fsm.is_active = TRUE 
  AND fs.is_active = TRUE 
  AND fs.status = 'active'
  AND fsm.day_of_week = CASE EXTRACT(DOW FROM CURRENT_DATE)::INTEGER
                           WHEN 0 THEN 'sunday'
                           WHEN 1 THEN 'monday'
                           WHEN 2 THEN 'tuesday'
                           WHEN 3 THEN 'wednesday'
                           WHEN 4 THEN 'thursday'
                           WHEN 5 THEN 'friday'
                           WHEN 6 THEN 'saturday'
                         END
  AND (fs.start_date IS NULL OR fs.start_date <= CURRENT_DATE)
  AND (fs.end_date IS NULL OR fs.end_date >= CURRENT_DATE)
ORDER BY fsm.meal_time;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_schedules TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON feeding_schedule_meals TO rawgle_user;
GRANT SELECT ON active_feeding_schedules TO rawgle_user;
GRANT SELECT ON todays_feeding_schedule TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Feeding schedules table created successfully with comprehensive scheduling features!' as result;

-- Display table info
SELECT 'feeding_schedules' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_schedules' 
UNION ALL
SELECT 'feeding_schedule_meals' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_schedule_meals' 
ORDER BY table_name, ordinal_position;