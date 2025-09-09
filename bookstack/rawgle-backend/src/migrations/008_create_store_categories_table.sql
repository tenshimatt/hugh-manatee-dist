-- Migration: Create Store Categories Table for RAWGLE MVP
-- Stores categories for supplier/store classification
-- Created: 2025-09-07
-- Component: Store Management System

-- Create store category table
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category identification
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Category hierarchy (self-referencing for subcategories)
    parent_category_id UUID REFERENCES store_categories(id) ON DELETE SET NULL,
    
    -- Category metadata
    color_hex VARCHAR(7) DEFAULT '#3B82F6' CHECK (color_hex ~* '^#[0-9A-F]{6}$'),
    icon_name VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    
    -- Business category details
    industry_type VARCHAR(100), -- 'pet_store', 'veterinary', 'grooming', 'online_retailer', etc.
    service_type VARCHAR(100), -- 'retail', 'service', 'wholesale', 'manufacturing'
    business_model VARCHAR(50) DEFAULT 'b2c' CHECK (business_model IN ('b2c', 'b2b', 'both')),
    
    -- Search and filtering
    keywords TEXT[],
    products_offered TEXT[], -- 'dog_food', 'cat_toys', 'grooming_services', etc.
    services_offered TEXT[], -- 'grooming', 'training', 'veterinary_care', etc.
    
    -- Geographic and operational info
    typical_locations TEXT[], -- 'urban', 'suburban', 'rural', 'online_only'
    chain_type VARCHAR(50) CHECK (chain_type IN ('independent', 'franchise', 'corporate_chain', 'online_only')),
    
    -- Quality and verification
    requires_verification BOOLEAN DEFAULT FALSE,
    quality_standards TEXT[],
    certifications_required TEXT[],
    
    -- Visibility and status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    show_in_directory BOOLEAN DEFAULT TRUE,
    
    -- Statistics (updated by triggers)
    store_count INTEGER DEFAULT 0,
    active_store_count INTEGER DEFAULT 0,
    
    -- System fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for store_categories
CREATE INDEX IF NOT EXISTS idx_store_categories_slug ON store_categories(slug);
CREATE INDEX IF NOT EXISTS idx_store_categories_parent ON store_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_active ON store_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_store_categories_featured ON store_categories(is_featured);
CREATE INDEX IF NOT EXISTS idx_store_categories_directory ON store_categories(show_in_directory);
CREATE INDEX IF NOT EXISTS idx_store_categories_display_order ON store_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_store_categories_industry_type ON store_categories(industry_type);
CREATE INDEX IF NOT EXISTS idx_store_categories_service_type ON store_categories(service_type);
CREATE INDEX IF NOT EXISTS idx_store_categories_business_model ON store_categories(business_model);
CREATE INDEX IF NOT EXISTS idx_store_categories_chain_type ON store_categories(chain_type);
CREATE INDEX IF NOT EXISTS idx_store_categories_created_at ON store_categories(created_at DESC);

-- Create GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_store_categories_keywords ON store_categories USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_store_categories_products ON store_categories USING gin(products_offered);
CREATE INDEX IF NOT EXISTS idx_store_categories_services ON store_categories USING gin(services_offered);
CREATE INDEX IF NOT EXISTS idx_store_categories_search ON store_categories USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add constraints
ALTER TABLE store_categories
ADD CONSTRAINT IF NOT EXISTS chk_store_categories_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_store_categories_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
ADD CONSTRAINT IF NOT EXISTS chk_store_categories_slug_length CHECK (LENGTH(slug) >= 1 AND LENGTH(slug) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_store_categories_display_order_valid CHECK (display_order >= 0 AND display_order <= 9999),
ADD CONSTRAINT IF NOT EXISTS chk_store_categories_no_self_reference CHECK (id != parent_category_id);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_store_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(category_name, '[^a-zA-Z0-9\s\-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '\-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update store category counts
CREATE OR REPLACE FUNCTION update_store_category_counts()
RETURNS TRIGGER AS $$
DECLARE
    category_id_to_update UUID;
BEGIN
    -- Determine which category to update based on the operation
    IF TG_OP = 'DELETE' THEN
        category_id_to_update := OLD.category_id;
    ELSE
        category_id_to_update := NEW.category_id;
    END IF;
    
    -- Update the category counts
    UPDATE store_categories 
    SET 
        store_count = (
            SELECT COUNT(*) 
            FROM stores 
            WHERE category_id = category_id_to_update
        ),
        active_store_count = (
            SELECT COUNT(*) 
            FROM stores 
            WHERE category_id = category_id_to_update 
              AND is_active = TRUE
        ),
        updated_at = NOW()
    WHERE id = category_id_to_update;
    
    -- If it's an UPDATE, also check if we need to update the old category
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        UPDATE store_categories 
        SET 
            store_count = (
                SELECT COUNT(*) 
                FROM stores 
                WHERE category_id = OLD.category_id
            ),
            active_store_count = (
                SELECT COUNT(*) 
                FROM stores 
                WHERE category_id = OLD.category_id 
                  AND is_active = TRUE
            ),
            updated_at = NOW()
        WHERE id = OLD.category_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update store category timestamp
CREATE OR REPLACE FUNCTION update_store_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_store_category_slug(NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_store_categories_updated_at
    BEFORE UPDATE ON store_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_store_category_timestamp();

-- Create trigger for slug generation on insert
CREATE TRIGGER trigger_store_categories_generate_slug
    BEFORE INSERT ON store_categories
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION update_store_category_timestamp();

-- Function to get store category hierarchy path
CREATE OR REPLACE FUNCTION get_store_category_path(category_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    category_path TEXT := '';
    current_category RECORD;
    current_id UUID := category_id_param;
BEGIN
    LOOP
        SELECT id, name, parent_category_id 
        INTO current_category 
        FROM store_categories 
        WHERE id = current_id;
        
        EXIT WHEN NOT FOUND;
        
        IF category_path = '' THEN
            category_path := current_category.name;
        ELSE
            category_path := current_category.name || ' > ' || category_path;
        END IF;
        
        current_id := current_category.parent_category_id;
        EXIT WHEN current_id IS NULL;
    END LOOP;
    
    RETURN category_path;
END;
$$ LANGUAGE plpgsql;

-- Function to get all subcategory IDs (recursive)
CREATE OR REPLACE FUNCTION get_store_subcategory_ids(parent_id_param UUID)
RETURNS UUID[] AS $$
WITH RECURSIVE category_tree AS (
    -- Base case: the parent category itself
    SELECT id, parent_category_id, 1 as level
    FROM store_categories 
    WHERE id = parent_id_param
    
    UNION ALL
    
    -- Recursive case: children of categories in the tree
    SELECT sc.id, sc.parent_category_id, ct.level + 1
    FROM store_categories sc
    INNER JOIN category_tree ct ON sc.parent_category_id = ct.id
    WHERE ct.level < 10 -- Prevent infinite recursion
)
SELECT ARRAY_AGG(id) 
FROM category_tree 
WHERE level > 1; -- Exclude the parent itself
$$ LANGUAGE sql;

-- Create view for active store categories with hierarchy
CREATE OR REPLACE VIEW active_store_categories AS
SELECT 
    sc.id,
    sc.name,
    sc.slug,
    sc.description,
    sc.parent_category_id,
    parent.name as parent_name,
    get_store_category_path(sc.id) as category_path,
    sc.color_hex,
    sc.icon_name,
    sc.display_order,
    sc.industry_type,
    sc.service_type,
    sc.business_model,
    sc.products_offered,
    sc.services_offered,
    sc.typical_locations,
    sc.chain_type,
    sc.is_featured,
    sc.show_in_directory,
    sc.store_count,
    sc.active_store_count,
    sc.created_at,
    sc.updated_at
FROM store_categories sc
LEFT JOIN store_categories parent ON sc.parent_category_id = parent.id
WHERE sc.is_active = TRUE
ORDER BY sc.display_order, sc.name;

-- Create view for store directory categories
CREATE OR REPLACE VIEW directory_store_categories AS
SELECT 
    sc.id,
    sc.name,
    sc.slug,
    sc.parent_category_id,
    sc.color_hex,
    sc.icon_name,
    sc.display_order,
    sc.active_store_count,
    get_store_category_path(sc.id) as category_path
FROM store_categories sc
WHERE sc.is_active = TRUE 
  AND sc.show_in_directory = TRUE
  AND sc.active_store_count > 0
ORDER BY sc.display_order, sc.name;

-- Insert seed data for store categories
INSERT INTO store_categories (name, slug, description, color_hex, icon_name, display_order, is_featured, industry_type, service_type, business_model, products_offered, services_offered) VALUES
('Pet Stores', 'pet-stores', 'General pet supply retailers', '#10B981', 'storefront', 1, true, 'pet_store', 'retail', 'b2c', ARRAY['pet_food', 'toys', 'supplies', 'accessories'], ARRAY['product_sales']),
('Veterinary Clinics', 'veterinary-clinics', 'Animal hospitals and veterinary services', '#EF4444', 'medical-bag', 2, true, 'veterinary', 'service', 'b2c', ARRAY['medications', 'medical_supplies'], ARRAY['veterinary_care', 'emergency_care', 'surgery']),
('Pet Grooming', 'pet-grooming', 'Professional pet grooming services', '#8B5CF6', 'scissors', 3, true, 'grooming', 'service', 'b2c', ARRAY['grooming_supplies', 'shampoos'], ARRAY['grooming', 'nail_trimming', 'bathing']),
('Online Retailers', 'online-retailers', 'E-commerce pet supply stores', '#06B6D4', 'globe-alt', 4, true, 'pet_store', 'retail', 'b2c', ARRAY['pet_food', 'toys', 'supplies', 'medications'], ARRAY['online_sales', 'delivery']),
('Pet Training', 'pet-training', 'Dog and pet training services', '#F59E0B', 'academic-cap', 5, false, 'training', 'service', 'b2c', ARRAY['training_supplies', 'treats'], ARRAY['pet_training', 'behavioral_training', 'obedience_classes']),
('Pet Boarding', 'pet-boarding', 'Pet hotels and boarding facilities', '#EC4899', 'home', 6, false, 'boarding', 'service', 'b2c', ARRAY['pet_food', 'bedding'], ARRAY['pet_boarding', 'daycare', 'overnight_care']),
('Feed Stores', 'feed-stores', 'Agricultural and specialty animal feed stores', '#059669', 'truck', 7, false, 'feed_store', 'retail', 'both', ARRAY['animal_feed', 'supplements', 'bulk_food'], ARRAY['feed_sales', 'nutrition_advice']),
('Specialty Pet Stores', 'specialty-pet-stores', 'Stores specializing in exotic pets or specific animals', '#7C2D12', 'sparkles', 8, false, 'specialty_pet_store', 'retail', 'b2c', ARRAY['exotic_supplies', 'specialty_food', 'habitats'], ARRAY['specialty_care_advice']),
('Pet Pharmacies', 'pet-pharmacies', 'Specialized veterinary pharmacies', '#DC2626', 'beaker', 9, false, 'pharmacy', 'retail', 'both', ARRAY['medications', 'prescription_food', 'supplements'], ARRAY['prescription_services', 'compounding']),
('Mobile Services', 'mobile-services', 'Mobile pet grooming and veterinary services', '#6366F1', 'truck', 10, false, 'mobile_service', 'service', 'b2c', ARRAY['mobile_supplies'], ARRAY['mobile_grooming', 'mobile_vet', 'home_visits'])
ON CONFLICT (slug) DO NOTHING;

-- Create subcategories for Pet Stores
INSERT INTO store_categories (name, slug, description, parent_category_id, display_order, industry_type, service_type, products_offered) VALUES
('Chain Pet Stores', 'chain-pet-stores', 'Large retail chains like Petco, PetSmart', 
 (SELECT id FROM store_categories WHERE slug = 'pet-stores'), 1, 'pet_store', 'retail', ARRAY['pet_food', 'toys', 'supplies', 'live_animals']),
('Independent Pet Stores', 'independent-pet-stores', 'Local independent pet retailers', 
 (SELECT id FROM store_categories WHERE slug = 'pet-stores'), 2, 'pet_store', 'retail', ARRAY['premium_food', 'local_products', 'specialty_items']),
('Warehouse Stores', 'warehouse-stores', 'Bulk pet supply warehouses', 
 (SELECT id FROM store_categories WHERE slug = 'pet-stores'), 3, 'pet_store', 'retail', ARRAY['bulk_food', 'wholesale_supplies']),
('Premium Pet Boutiques', 'premium-pet-boutiques', 'High-end pet product retailers', 
 (SELECT id FROM store_categories WHERE slug = 'pet-stores'), 4, 'pet_store', 'retail', ARRAY['luxury_items', 'designer_accessories', 'premium_food'])
ON CONFLICT (slug) DO NOTHING;

-- Create subcategories for Online Retailers
INSERT INTO store_categories (name, slug, description, parent_category_id, display_order, industry_type, service_type, products_offered, services_offered) VALUES
('Major E-commerce', 'major-e-commerce', 'Amazon, Chewy, and other major platforms', 
 (SELECT id FROM store_categories WHERE slug = 'online-retailers'), 1, 'e_commerce', 'retail', ARRAY['everything'], ARRAY['fast_shipping', 'subscriptions']),
('Specialty Online', 'specialty-online', 'Niche online pet retailers', 
 (SELECT id FROM store_categories WHERE slug = 'online-retailers'), 2, 'e_commerce', 'retail', ARRAY['specialty_products'], ARRAY['expert_advice', 'custom_orders']),
('Direct-to-Consumer', 'direct-to-consumer', 'Brand direct sales websites', 
 (SELECT id FROM store_categories WHERE slug = 'online-retailers'), 3, 'e_commerce', 'retail', ARRAY['brand_products'], ARRAY['brand_support'])
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON store_categories TO rawgle_user;
GRANT SELECT ON active_store_categories TO rawgle_user;
GRANT SELECT ON directory_store_categories TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Store categories table created successfully with hierarchical categories and seed data!' as result;

-- Display seed data
SELECT 'Total store categories created:' as info, COUNT(*) as count FROM store_categories
UNION ALL
SELECT 'Parent categories:' as info, COUNT(*) as count FROM store_categories WHERE parent_category_id IS NULL
UNION ALL  
SELECT 'Subcategories:' as info, COUNT(*) as count FROM store_categories WHERE parent_category_id IS NOT NULL;