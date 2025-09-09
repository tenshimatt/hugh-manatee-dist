-- Migration: Create Pet Health Records System for RAWGLE MVP
-- Comprehensive health tracking, vaccination records, and weight monitoring
-- Created: 2025-09-07
-- Component: Pet Health Management System

-- Create health record types
CREATE TYPE IF NOT EXISTS health_record_type AS ENUM (
    'vaccination', 'checkup', 'illness', 'injury', 'surgery', 
    'medication', 'allergy', 'weight_check', 'dental', 
    'grooming', 'behavior', 'emergency', 'other'
);

-- Create vaccination status enum
CREATE TYPE IF NOT EXISTS vaccination_status AS ENUM ('due', 'overdue', 'current', 'not_required', 'declined');

-- Create medication frequency enum
CREATE TYPE IF NOT EXISTS medication_frequency AS ENUM (
    'as_needed', 'daily', 'twice_daily', 'three_times_daily', 
    'weekly', 'monthly', 'every_other_day', 'custom'
);

-- Create health severity enum
CREATE TYPE IF NOT EXISTS health_severity AS ENUM ('minor', 'moderate', 'severe', 'critical', 'emergency');

-- Main pet health records table
CREATE TABLE IF NOT EXISTS pet_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Record classification
    record_type health_record_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity health_severity DEFAULT 'minor',
    
    -- Date and time information
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    record_time TIME,
    estimated_date BOOLEAN DEFAULT FALSE, -- True if date is estimated
    
    -- Veterinary information
    veterinarian_name VARCHAR(200),
    veterinary_clinic VARCHAR(200),
    veterinary_clinic_address TEXT,
    veterinary_clinic_phone VARCHAR(20),
    license_number VARCHAR(50), -- Vet license number
    
    -- Health measurements
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 200),
    temperature_celsius DECIMAL(4,1) CHECK (temperature_celsius > 30 AND temperature_celsius < 50),
    heart_rate_bpm INTEGER CHECK (heart_rate_bpm > 0 AND heart_rate_bpm <= 300),
    respiratory_rate_bpm INTEGER CHECK (respiratory_rate_bpm > 0 AND respiratory_rate_bpm <= 100),
    
    -- Symptoms and observations
    symptoms TEXT[],
    observed_behaviors TEXT[],
    physical_examination_notes TEXT,
    
    -- Diagnosis and treatment
    diagnosis TEXT,
    treatment_plan TEXT,
    prescribed_medications TEXT[],
    recommended_followup TEXT,
    followup_date DATE,
    
    -- Costs and billing
    total_cost DECIMAL(10,2) CHECK (total_cost >= 0),
    insurance_covered BOOLEAN DEFAULT FALSE,
    insurance_claim_number VARCHAR(100),
    out_of_pocket_cost DECIMAL(10,2) CHECK (out_of_pocket_cost >= 0),
    
    -- Documentation and media
    attachments TEXT[], -- URLs to documents, images, etc.
    lab_results_url TEXT,
    x_ray_images TEXT[],
    photos TEXT[],
    documents TEXT[],
    
    -- Status and follow-up
    is_ongoing BOOLEAN DEFAULT FALSE,
    is_chronic_condition BOOLEAN DEFAULT FALSE,
    resolved_date DATE,
    requires_monitoring BOOLEAN DEFAULT FALSE,
    next_checkup_due DATE,
    
    -- Emergency information
    is_emergency BOOLEAN DEFAULT FALSE,
    emergency_contact_called BOOLEAN DEFAULT FALSE,
    hospitalized BOOLEAN DEFAULT FALSE,
    hospital_stay_days INTEGER CHECK (hospital_stay_days >= 0),
    
    -- System fields
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet vaccination records table
CREATE TABLE IF NOT EXISTS pet_vaccination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    health_record_id UUID REFERENCES pet_health_records(id) ON DELETE SET NULL,
    
    -- Vaccination details
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_type VARCHAR(100), -- 'core', 'non-core', 'lifestyle'
    vaccine_brand VARCHAR(100),
    manufacturer VARCHAR(100),
    lot_number VARCHAR(50),
    expiration_date DATE,
    
    -- Administration details
    administered_date DATE NOT NULL,
    administered_by VARCHAR(200), -- Veterinarian name
    clinic_name VARCHAR(200),
    clinic_address TEXT,
    
    -- Dosage and method
    dosage_ml DECIMAL(6,2) CHECK (dosage_ml > 0),
    administration_route VARCHAR(50), -- 'subcutaneous', 'intramuscular', 'oral', 'nasal'
    injection_site VARCHAR(50), -- 'scruff', 'thigh', 'shoulder'
    
    -- Scheduling and status
    vaccination_status vaccination_status DEFAULT 'current',
    next_due_date DATE,
    booster_required BOOLEAN DEFAULT FALSE,
    booster_due_date DATE,
    
    -- Reactions and notes
    adverse_reactions TEXT,
    reaction_severity health_severity,
    reaction_resolved BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Cost information
    cost DECIMAL(8,2) CHECK (cost >= 0),
    
    -- Documentation
    certificate_url TEXT,
    batch_certificate_url TEXT,
    
    -- System fields
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet weight tracking table
CREATE TABLE IF NOT EXISTS pet_weight_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    health_record_id UUID REFERENCES pet_health_records(id) ON DELETE SET NULL,
    
    -- Weight measurement
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 200),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    measurement_time TIME DEFAULT CURRENT_TIME,
    
    -- Measurement context
    measurement_method VARCHAR(50) DEFAULT 'scale', -- 'scale', 'vet_visit', 'estimated'
    measurement_location VARCHAR(100), -- 'home', 'vet_clinic', 'pet_store'
    scale_type VARCHAR(50), -- 'digital', 'analog', 'baby_scale', 'vet_scale'
    scale_accuracy VARCHAR(20), -- 'gram', 'tenth_pound', 'pound'
    
    -- Body condition
    body_condition_score DECIMAL(2,1) CHECK (body_condition_score >= 1.0 AND body_condition_score <= 9.0), -- 1-9 BCS scale
    body_condition_notes TEXT,
    muscle_condition VARCHAR(20) CHECK (muscle_condition IN ('poor', 'fair', 'good', 'excellent')),
    
    -- Health indicators
    is_target_weight BOOLEAN DEFAULT FALSE,
    weight_goal_kg DECIMAL(5,2) CHECK (weight_goal_kg > 0 AND weight_goal_kg <= 200),
    weight_change_from_last DECIMAL(5,2), -- Calculated automatically
    weight_trend VARCHAR(20), -- 'losing', 'gaining', 'stable'
    
    -- Context and notes
    diet_change_recent BOOLEAN DEFAULT FALSE,
    exercise_change_recent BOOLEAN DEFAULT FALSE,
    medication_affecting_weight BOOLEAN DEFAULT FALSE,
    illness_affecting_weight BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Photos for visual tracking
    body_photo_url TEXT,
    side_profile_photo_url TEXT,
    
    -- System fields
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet medication tracking table
CREATE TABLE IF NOT EXISTS pet_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    health_record_id UUID REFERENCES pet_health_records(id) ON DELETE SET NULL,
    
    -- Medication identification
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_name VARCHAR(200),
    medication_type VARCHAR(100), -- 'antibiotic', 'pain_reliever', 'anti_inflammatory', etc.
    
    -- Prescription details
    prescribed_by VARCHAR(200), -- Veterinarian name
    prescription_date DATE NOT NULL,
    prescription_number VARCHAR(100),
    pharmacy_name VARCHAR(200),
    pharmacy_phone VARCHAR(20),
    
    -- Dosage and administration
    dosage VARCHAR(100) NOT NULL, -- '10mg', '1 tablet', '2ml'
    dosage_per_weight VARCHAR(50), -- 'mg/kg', 'ml/lb'
    frequency medication_frequency NOT NULL,
    custom_frequency_description TEXT, -- For 'custom' frequency
    
    -- Schedule and timing
    start_date DATE NOT NULL,
    end_date DATE,
    total_duration_days INTEGER CHECK (total_duration_days > 0),
    with_food BOOLEAN DEFAULT FALSE,
    specific_times TIME[],
    
    -- Medication details
    form VARCHAR(50), -- 'tablet', 'capsule', 'liquid', 'injection', 'topical'
    flavor VARCHAR(50), -- 'beef', 'chicken', 'unflavored'
    strength VARCHAR(50), -- '250mg', '5ml/dose'
    quantity_prescribed INTEGER CHECK (quantity_prescribed > 0),
    quantity_remaining INTEGER CHECK (quantity_remaining >= 0),
    
    -- Storage and handling
    storage_instructions TEXT,
    expiration_date DATE,
    lot_number VARCHAR(50),
    
    -- Monitoring and effects
    reason_for_prescription TEXT NOT NULL,
    expected_effects TEXT,
    side_effects_to_watch TEXT[],
    observed_side_effects TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    
    -- Status tracking
    is_currently_active BOOLEAN DEFAULT TRUE,
    completed_successfully BOOLEAN,
    discontinued_early BOOLEAN DEFAULT FALSE,
    discontinuation_reason TEXT,
    
    -- Reminders and compliance
    reminder_enabled BOOLEAN DEFAULT TRUE,
    missed_doses INTEGER DEFAULT 0 CHECK (missed_doses >= 0),
    compliance_percentage DECIMAL(5,2) CHECK (compliance_percentage >= 0 AND compliance_percentage <= 100),
    
    -- Cost tracking
    cost_per_unit DECIMAL(8,2) CHECK (cost_per_unit >= 0),
    total_cost DECIMAL(10,2) CHECK (total_cost >= 0),
    insurance_covered BOOLEAN DEFAULT FALSE,
    
    -- Documentation
    prescription_image_url TEXT,
    medication_photo_url TEXT,
    
    -- System fields
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for health records

-- Pet health records indexes
CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON pet_health_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON pet_health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON pet_health_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_severity ON pet_health_records(severity);
CREATE INDEX IF NOT EXISTS idx_health_records_emergency ON pet_health_records(is_emergency) WHERE is_emergency = TRUE;
CREATE INDEX IF NOT EXISTS idx_health_records_ongoing ON pet_health_records(is_ongoing) WHERE is_ongoing = TRUE;
CREATE INDEX IF NOT EXISTS idx_health_records_chronic ON pet_health_records(is_chronic_condition) WHERE is_chronic_condition = TRUE;
CREATE INDEX IF NOT EXISTS idx_health_records_followup_due ON pet_health_records(next_checkup_due) WHERE next_checkup_due IS NOT NULL;

-- Vaccination records indexes
CREATE INDEX IF NOT EXISTS idx_vaccination_pet_id ON pet_vaccination_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_name ON pet_vaccination_records(vaccine_name);
CREATE INDEX IF NOT EXISTS idx_vaccination_administered_date ON pet_vaccination_records(administered_date DESC);
CREATE INDEX IF NOT EXISTS idx_vaccination_status ON pet_vaccination_records(vaccination_status);
CREATE INDEX IF NOT EXISTS idx_vaccination_next_due ON pet_vaccination_records(next_due_date) WHERE next_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vaccination_booster_due ON pet_vaccination_records(booster_due_date) WHERE booster_due_date IS NOT NULL;

-- Weight tracking indexes
CREATE INDEX IF NOT EXISTS idx_weight_pet_id ON pet_weight_tracking(pet_id);
CREATE INDEX IF NOT EXISTS idx_weight_date ON pet_weight_tracking(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_target ON pet_weight_tracking(is_target_weight) WHERE is_target_weight = TRUE;

-- Medications indexes
CREATE INDEX IF NOT EXISTS idx_medications_pet_id ON pet_medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON pet_medications(medication_name);
CREATE INDEX IF NOT EXISTS idx_medications_active ON pet_medications(is_currently_active) WHERE is_currently_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_start_date ON pet_medications(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_end_date ON pet_medications(end_date) WHERE end_date IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_health_records_pet_type_date ON pet_health_records(pet_id, record_type, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_vaccination_pet_status_due ON pet_vaccination_records(pet_id, vaccination_status, next_due_date);
CREATE INDEX IF NOT EXISTS idx_weight_pet_date ON pet_weight_tracking(pet_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_pet_active_end ON pet_medications(pet_id, is_currently_active, end_date);

-- Array field indexes
CREATE INDEX IF NOT EXISTS idx_health_records_symptoms ON pet_health_records USING gin(symptoms);
CREATE INDEX IF NOT EXISTS idx_health_records_medications ON pet_health_records USING gin(prescribed_medications);

-- Function to calculate weight change from previous record
CREATE OR REPLACE FUNCTION calculate_weight_change()
RETURNS TRIGGER AS $$
DECLARE
    previous_weight DECIMAL(5,2);
    weight_diff DECIMAL(5,2);
BEGIN
    -- Get the most recent weight before this one
    SELECT weight_kg INTO previous_weight
    FROM pet_weight_tracking
    WHERE pet_id = NEW.pet_id 
      AND measurement_date < NEW.measurement_date
      AND is_active = TRUE
    ORDER BY measurement_date DESC, created_at DESC
    LIMIT 1;
    
    -- Calculate change if previous weight exists
    IF previous_weight IS NOT NULL THEN
        weight_diff := NEW.weight_kg - previous_weight;
        NEW.weight_change_from_last = weight_diff;
        
        -- Determine trend
        IF weight_diff > 0.1 THEN
            NEW.weight_trend = 'gaining';
        ELSIF weight_diff < -0.1 THEN
            NEW.weight_trend = 'losing';
        ELSE
            NEW.weight_trend = 'stable';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update vaccination status based on dates
CREATE OR REPLACE FUNCTION update_vaccination_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update status based on due dates
    IF NEW.next_due_date IS NOT NULL THEN
        IF NEW.next_due_date < CURRENT_DATE THEN
            NEW.vaccination_status = 'overdue';
        ELSIF NEW.next_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN
            NEW.vaccination_status = 'due';
        ELSE
            NEW.vaccination_status = 'current';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update health record timestamp
CREATE OR REPLACE FUNCTION update_health_record_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update medication timestamp
CREATE OR REPLACE FUNCTION update_medication_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update active status based on end date
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
        NEW.is_currently_active = FALSE;
        IF NEW.completed_successfully IS NULL THEN
            NEW.completed_successfully = TRUE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_weight_calculate_change
    BEFORE INSERT OR UPDATE ON pet_weight_tracking
    FOR EACH ROW
    EXECUTE FUNCTION calculate_weight_change();

CREATE TRIGGER trigger_vaccination_update_status
    BEFORE UPDATE ON pet_vaccination_records
    FOR EACH ROW
    EXECUTE FUNCTION update_vaccination_status();

CREATE TRIGGER trigger_health_records_timestamp
    BEFORE UPDATE ON pet_health_records
    FOR EACH ROW
    EXECUTE FUNCTION update_health_record_timestamp();

CREATE TRIGGER trigger_medications_timestamp
    BEFORE UPDATE ON pet_medications
    FOR EACH ROW
    EXECUTE FUNCTION update_medication_timestamp();

-- Create views for common health data queries

-- View for pet health summary
CREATE OR REPLACE VIEW pet_health_summary AS
SELECT 
    p.id as pet_id,
    p.name as pet_name,
    p.species,
    p.breed,
    -- Latest weight
    (SELECT weight_kg FROM pet_weight_tracking pwt 
     WHERE pwt.pet_id = p.id AND pwt.is_active = TRUE 
     ORDER BY measurement_date DESC, created_at DESC LIMIT 1) as current_weight_kg,
    -- Weight trend
    (SELECT weight_trend FROM pet_weight_tracking pwt 
     WHERE pwt.pet_id = p.id AND pwt.is_active = TRUE 
     ORDER BY measurement_date DESC, created_at DESC LIMIT 1) as weight_trend,
    -- Vaccination status counts
    (SELECT COUNT(*) FROM pet_vaccination_records pvr 
     WHERE pvr.pet_id = p.id AND pvr.vaccination_status = 'current' AND pvr.is_active = TRUE) as current_vaccinations,
    (SELECT COUNT(*) FROM pet_vaccination_records pvr 
     WHERE pvr.pet_id = p.id AND pvr.vaccination_status IN ('due', 'overdue') AND pvr.is_active = TRUE) as due_vaccinations,
    -- Active medications
    (SELECT COUNT(*) FROM pet_medications pm 
     WHERE pm.pet_id = p.id AND pm.is_currently_active = TRUE AND pm.is_active = TRUE) as active_medications,
    -- Recent health issues
    (SELECT COUNT(*) FROM pet_health_records phr 
     WHERE phr.pet_id = p.id AND phr.record_date >= CURRENT_DATE - INTERVAL '30 days' 
     AND phr.record_type IN ('illness', 'injury', 'emergency') AND phr.is_active = TRUE) as recent_health_issues,
    -- Next checkup due
    (SELECT MIN(next_checkup_due) FROM pet_health_records phr 
     WHERE phr.pet_id = p.id AND phr.next_checkup_due >= CURRENT_DATE AND phr.is_active = TRUE) as next_checkup_due
FROM pets p
WHERE p.is_active = TRUE;

-- View for vaccination schedule
CREATE OR REPLACE VIEW pet_vaccination_schedule AS
SELECT 
    pvr.id,
    pvr.pet_id,
    p.name as pet_name,
    pvr.vaccine_name,
    pvr.vaccine_type,
    pvr.administered_date,
    pvr.next_due_date,
    pvr.vaccination_status,
    pvr.booster_required,
    pvr.booster_due_date,
    CASE 
        WHEN pvr.next_due_date < CURRENT_DATE THEN CURRENT_DATE - pvr.next_due_date
        ELSE NULL
    END as days_overdue,
    CASE 
        WHEN pvr.next_due_date >= CURRENT_DATE THEN pvr.next_due_date - CURRENT_DATE
        ELSE NULL
    END as days_until_due
FROM pet_vaccination_records pvr
INNER JOIN pets p ON pvr.pet_id = p.id
WHERE pvr.is_active = TRUE 
  AND p.is_active = TRUE
ORDER BY pvr.next_due_date ASC;

-- View for active medications
CREATE OR REPLACE VIEW active_pet_medications AS
SELECT 
    pm.id,
    pm.pet_id,
    p.name as pet_name,
    pm.medication_name,
    pm.dosage,
    pm.frequency,
    pm.start_date,
    pm.end_date,
    pm.reason_for_prescription,
    pm.with_food,
    pm.specific_times,
    pm.reminder_enabled,
    pm.quantity_remaining,
    CASE 
        WHEN pm.end_date IS NOT NULL THEN pm.end_date - CURRENT_DATE
        ELSE NULL
    END as days_remaining
FROM pet_medications pm
INNER JOIN pets p ON pm.pet_id = p.id
WHERE pm.is_currently_active = TRUE 
  AND pm.is_active = TRUE 
  AND p.is_active = TRUE
ORDER BY pm.start_date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pet_health_records TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON pet_vaccination_records TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON pet_weight_tracking TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON pet_medications TO rawgle_user;
GRANT SELECT ON pet_health_summary TO rawgle_user;
GRANT SELECT ON pet_vaccination_schedule TO rawgle_user;
GRANT SELECT ON active_pet_medications TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Pet Health Records system created successfully with comprehensive health tracking capabilities!' as result;

-- Display tables info
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN ('pet_health_records', 'pet_vaccination_records', 'pet_weight_tracking', 'pet_medications')
GROUP BY table_name
ORDER BY table_name;