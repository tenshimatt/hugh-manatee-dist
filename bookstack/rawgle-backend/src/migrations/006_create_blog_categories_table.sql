-- Migration: Create Blog Categories Table for RAWGLE MVP
-- Stores categories for knowledge base articles
-- Created: 2025-09-07
-- Component: Content Management System

-- Create blog category table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category identification
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Category hierarchy (self-referencing for subcategories)
    parent_category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    
    -- Category metadata
    color_hex VARCHAR(7) DEFAULT '#3B82F6' CHECK (color_hex ~* '^#[0-9A-F]{6}$'),
    icon_name VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    
    -- SEO and content
    meta_title VARCHAR(200),
    meta_description VARCHAR(300),
    featured_image_url TEXT,
    
    -- Visibility and status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    show_in_navigation BOOLEAN DEFAULT TRUE,
    require_login BOOLEAN DEFAULT FALSE,
    
    -- Statistics (updated by triggers)
    article_count INTEGER DEFAULT 0,
    published_article_count INTEGER DEFAULT 0,
    last_article_published_at TIMESTAMPTZ,
    
    -- System fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for blog_categories
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_parent ON blog_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_active ON blog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_categories_featured ON blog_categories(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_categories_navigation ON blog_categories(show_in_navigation);
CREATE INDEX IF NOT EXISTS idx_blog_categories_display_order ON blog_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_blog_categories_created_at ON blog_categories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_categories_name_search ON blog_categories USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add constraints
ALTER TABLE blog_categories
ADD CONSTRAINT IF NOT EXISTS chk_blog_categories_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_blog_categories_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
ADD CONSTRAINT IF NOT EXISTS chk_blog_categories_slug_length CHECK (LENGTH(slug) >= 1 AND LENGTH(slug) <= 100),
ADD CONSTRAINT IF NOT EXISTS chk_blog_categories_display_order_valid CHECK (display_order >= 0 AND display_order <= 9999),
ADD CONSTRAINT IF NOT EXISTS chk_blog_categories_no_self_reference CHECK (id != parent_category_id);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT)
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

-- Function to update category article counts
CREATE OR REPLACE FUNCTION update_category_article_counts()
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
    UPDATE blog_categories 
    SET 
        article_count = (
            SELECT COUNT(*) 
            FROM blog_posts 
            WHERE category_id = category_id_to_update
        ),
        published_article_count = (
            SELECT COUNT(*) 
            FROM blog_posts 
            WHERE category_id = category_id_to_update 
              AND status = 'published'
        ),
        last_article_published_at = (
            SELECT MAX(published_at) 
            FROM blog_posts 
            WHERE category_id = category_id_to_update 
              AND status = 'published'
        ),
        updated_at = NOW()
    WHERE id = category_id_to_update;
    
    -- If it's an INSERT or UPDATE, also check if we need to update the old category
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        UPDATE blog_categories 
        SET 
            article_count = (
                SELECT COUNT(*) 
                FROM blog_posts 
                WHERE category_id = OLD.category_id
            ),
            published_article_count = (
                SELECT COUNT(*) 
                FROM blog_posts 
                WHERE category_id = OLD.category_id 
                  AND status = 'published'
            ),
            last_article_published_at = (
                SELECT MAX(published_at) 
                FROM blog_posts 
                WHERE category_id = OLD.category_id 
                  AND status = 'published'
            ),
            updated_at = NOW()
        WHERE id = OLD.category_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update blog category timestamp
CREATE OR REPLACE FUNCTION update_blog_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_category_slug(NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_category_timestamp();

-- Create trigger for slug generation on insert
CREATE TRIGGER trigger_blog_categories_generate_slug
    BEFORE INSERT ON blog_categories
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION update_blog_category_timestamp();

-- Function to get category hierarchy path
CREATE OR REPLACE FUNCTION get_category_path(category_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    category_path TEXT := '';
    current_category RECORD;
    current_id UUID := category_id_param;
BEGIN
    LOOP
        SELECT id, name, parent_category_id 
        INTO current_category 
        FROM blog_categories 
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
CREATE OR REPLACE FUNCTION get_subcategory_ids(parent_id_param UUID)
RETURNS UUID[] AS $$
WITH RECURSIVE category_tree AS (
    -- Base case: the parent category itself
    SELECT id, parent_category_id, 1 as level
    FROM blog_categories 
    WHERE id = parent_id_param
    
    UNION ALL
    
    -- Recursive case: children of categories in the tree
    SELECT bc.id, bc.parent_category_id, ct.level + 1
    FROM blog_categories bc
    INNER JOIN category_tree ct ON bc.parent_category_id = ct.id
    WHERE ct.level < 10 -- Prevent infinite recursion
)
SELECT ARRAY_AGG(id) 
FROM category_tree 
WHERE level > 1; -- Exclude the parent itself
$$ LANGUAGE sql;

-- Create view for active categories with hierarchy
CREATE OR REPLACE VIEW active_blog_categories AS
SELECT 
    bc.id,
    bc.name,
    bc.slug,
    bc.description,
    bc.parent_category_id,
    parent.name as parent_name,
    get_category_path(bc.id) as category_path,
    bc.color_hex,
    bc.icon_name,
    bc.display_order,
    bc.meta_title,
    bc.meta_description,
    bc.featured_image_url,
    bc.is_featured,
    bc.show_in_navigation,
    bc.require_login,
    bc.article_count,
    bc.published_article_count,
    bc.last_article_published_at,
    bc.created_at,
    bc.updated_at
FROM blog_categories bc
LEFT JOIN blog_categories parent ON bc.parent_category_id = parent.id
WHERE bc.is_active = TRUE
ORDER BY bc.display_order, bc.name;

-- Create view for navigation categories
CREATE OR REPLACE VIEW navigation_blog_categories AS
SELECT 
    bc.id,
    bc.name,
    bc.slug,
    bc.parent_category_id,
    bc.color_hex,
    bc.icon_name,
    bc.display_order,
    bc.published_article_count,
    get_category_path(bc.id) as category_path
FROM blog_categories bc
WHERE bc.is_active = TRUE 
  AND bc.show_in_navigation = TRUE
  AND bc.published_article_count > 0
ORDER BY bc.display_order, bc.name;

-- Insert seed data for blog categories
INSERT INTO blog_categories (name, slug, description, color_hex, icon_name, display_order, is_featured) VALUES
('Pet Nutrition', 'pet-nutrition', 'Expert advice on feeding your pets the right way', '#10B981', 'bowl-food', 1, true),
('Health & Wellness', 'health-wellness', 'Keeping your pets healthy and happy', '#EF4444', 'heart', 2, true),
('Training & Behavior', 'training-behavior', 'Tips for training and understanding pet behavior', '#8B5CF6', 'graduation-cap', 3, true),
('Grooming & Care', 'grooming-care', 'Essential grooming and daily care tips', '#06B6D4', 'sparkles', 4, false),
('Breed Guides', 'breed-guides', 'Comprehensive guides for different pet breeds', '#F59E0B', 'book-open', 5, false),
('Puppy & Kitten Care', 'puppy-kitten-care', 'Special care for young pets', '#EC4899', 'heart', 6, true),
('Senior Pet Care', 'senior-pet-care', 'Caring for older pets and their special needs', '#6B7280', 'clock', 7, false),
('Emergency Care', 'emergency-care', 'What to do in pet emergencies', '#DC2626', 'exclamation-triangle', 8, false),
('Product Reviews', 'product-reviews', 'Reviews of pet food, toys, and accessories', '#3B82F6', 'star', 9, false),
('Seasonal Care', 'seasonal-care', 'Pet care tips for different seasons', '#059669', 'sun', 10, false)
ON CONFLICT (slug) DO NOTHING;

-- Create subcategories for Pet Nutrition
INSERT INTO blog_categories (name, slug, description, parent_category_id, display_order) VALUES
('Dog Nutrition', 'dog-nutrition', 'Specific nutritional needs for dogs', 
 (SELECT id FROM blog_categories WHERE slug = 'pet-nutrition'), 1),
('Cat Nutrition', 'cat-nutrition', 'Specific nutritional needs for cats', 
 (SELECT id FROM blog_categories WHERE slug = 'pet-nutrition'), 2),
('Raw Feeding', 'raw-feeding', 'Guide to raw food diets for pets', 
 (SELECT id FROM blog_categories WHERE slug = 'pet-nutrition'), 3),
('Special Diets', 'special-diets', 'Diets for pets with allergies or health conditions', 
 (SELECT id FROM blog_categories WHERE slug = 'pet-nutrition'), 4)
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_categories TO rawgle_user;
GRANT SELECT ON active_blog_categories TO rawgle_user;
GRANT SELECT ON navigation_blog_categories TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Blog categories table created successfully with hierarchical categories and seed data!' as result;

-- Display seed data
SELECT 'Total categories created:' as info, COUNT(*) as count FROM blog_categories
UNION ALL
SELECT 'Parent categories:' as info, COUNT(*) as count FROM blog_categories WHERE parent_category_id IS NULL
UNION ALL  
SELECT 'Subcategories:' as info, COUNT(*) as count FROM blog_categories WHERE parent_category_id IS NOT NULL;