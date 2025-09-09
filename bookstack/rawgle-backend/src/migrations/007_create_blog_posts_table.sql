-- Migration: Create Blog Posts Table for RAWGLE MVP
-- Stores knowledge base articles and blog content
-- Created: 2025-09-07
-- Component: Content Management System

-- Create post status enum
CREATE TYPE IF NOT EXISTS post_status AS ENUM ('draft', 'review', 'published', 'archived', 'deleted');

-- Create content type enum
CREATE TYPE IF NOT EXISTS content_type AS ENUM ('article', 'guide', 'faq', 'news', 'review', 'recipe');

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
    
    -- Post identification and content
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    content_type content_type DEFAULT 'article',
    
    -- SEO and metadata
    meta_title VARCHAR(200),
    meta_description VARCHAR(300),
    meta_keywords TEXT[],
    canonical_url TEXT,
    
    -- Media and visuals
    featured_image_url TEXT,
    featured_image_alt VARCHAR(200),
    gallery_images TEXT[],
    video_url TEXT,
    
    -- Publishing and visibility
    status post_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    require_login BOOLEAN DEFAULT FALSE,
    
    -- Content organization
    tags TEXT[],
    reading_time_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Publication dates
    published_at TIMESTAMPTZ,
    scheduled_publish_at TIMESTAMPTZ,
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Statistics (updated by triggers or background jobs)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Author information
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(200),
    author_bio TEXT,
    co_authors TEXT[],
    
    -- Content sources and references
    sources TEXT[], -- URLs or references
    related_post_ids UUID[],
    
    -- System fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog post revisions table (for content versioning)
CREATE TABLE IF NOT EXISTS blog_post_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    
    -- Revision metadata
    revision_number INTEGER NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    
    -- Author of this revision
    revised_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revised_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog post views table (for analytics)
CREATE TABLE IF NOT EXISTS blog_post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    
    -- View metadata
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    
    -- View details
    time_spent_seconds INTEGER CHECK (time_spent_seconds >= 0),
    scroll_percentage INTEGER CHECK (scroll_percentage >= 0 AND scroll_percentage <= 100),
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_trending ON blog_posts(is_trending);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_view_count ON blog_posts(view_count DESC);

-- Create GIN indexes for array fields and full-text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_meta_keywords ON blog_posts USING gin(meta_keywords);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- Create indexes for blog_post_revisions
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_post_id ON blog_post_revisions(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_number ON blog_post_revisions(post_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_revised_at ON blog_post_revisions(revised_at DESC);

-- Create indexes for blog_post_views
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON blog_post_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewer_id ON blog_post_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_session_id ON blog_post_views(session_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status ON blog_posts(category_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured_published ON blog_posts(is_featured, published_at DESC) WHERE status = 'published';

-- Add constraints
ALTER TABLE blog_posts
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 300),
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_slug_length CHECK (LENGTH(slug) >= 1 AND LENGTH(slug) <= 300),
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_content_length CHECK (LENGTH(content) >= 50),
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_reading_time_valid CHECK (reading_time_minutes IS NULL OR (reading_time_minutes >= 1 AND reading_time_minutes <= 180)),
ADD CONSTRAINT IF NOT EXISTS chk_blog_posts_scheduled_future CHECK (scheduled_publish_at IS NULL OR scheduled_publish_at > NOW());

ALTER TABLE blog_post_revisions
ADD CONSTRAINT IF NOT EXISTS chk_blog_post_revisions_number_positive CHECK (revision_number >= 1);

-- Add unique constraint for slug within category (or globally)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug_unique ON blog_posts(slug) WHERE status != 'deleted';

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_post_slug(post_title TEXT, post_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(post_title, '[^a-zA-Z0-9\s\-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '\-+', '-', 'g'
        )
    );
    
    -- Trim leading/trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure reasonable length
    IF LENGTH(base_slug) > 200 THEN
        base_slug := SUBSTRING(base_slug FROM 1 FOR 200);
        base_slug := TRIM(BOTH '-' FROM base_slug);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = final_slug AND (post_id IS NULL OR id != post_id) AND status != 'deleted') LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reading time based on content
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
    reading_time INTEGER;
BEGIN
    -- Count words (approximate)
    word_count := ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(content_text), ' '), 1);
    
    -- Calculate reading time (average 200 words per minute)
    reading_time := GREATEST(1, ROUND(word_count / 200.0));
    
    RETURN reading_time;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create post revision
CREATE OR REPLACE FUNCTION create_post_revision(
    post_id_param UUID,
    revised_by_param UUID,
    change_summary_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    revision_id UUID;
    next_revision_number INTEGER;
    current_post RECORD;
BEGIN
    -- Get current post data
    SELECT title, content INTO current_post
    FROM blog_posts 
    WHERE id = post_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found with id: %', post_id_param;
    END IF;
    
    -- Get next revision number
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO next_revision_number
    FROM blog_post_revisions 
    WHERE post_id = post_id_param;
    
    -- Create revision
    INSERT INTO blog_post_revisions (
        post_id, 
        revision_number, 
        title, 
        content, 
        change_summary, 
        revised_by
    ) VALUES (
        post_id_param,
        next_revision_number,
        current_post.title,
        current_post.content,
        change_summary_param,
        revised_by_param
    ) RETURNING id INTO revision_id;
    
    RETURN revision_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record post view
CREATE OR REPLACE FUNCTION record_post_view(
    post_id_param UUID,
    viewer_id_param UUID DEFAULT NULL,
    session_id_param VARCHAR(100) DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    referrer_url_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert view record
    INSERT INTO blog_post_views (
        post_id,
        viewer_id,
        session_id,
        user_agent,
        ip_address,
        referrer_url
    ) VALUES (
        post_id_param,
        viewer_id_param,
        session_id_param,
        user_agent_param,
        ip_address_param,
        referrer_url_param
    );
    
    -- Update post view count
    UPDATE blog_posts 
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = post_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog post timestamp and metadata
CREATE OR REPLACE FUNCTION update_blog_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_at = NOW();
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_post_slug(NEW.title, NEW.id);
    END IF;
    
    -- Auto-calculate reading time if not provided
    IF NEW.reading_time_minutes IS NULL THEN
        NEW.reading_time_minutes = calculate_reading_time(NEW.content);
    END IF;
    
    -- Set published_at when status changes to published
    IF NEW.status = 'published' AND (OLD.status != 'published' OR OLD.published_at IS NULL) THEN
        NEW.published_at = NOW();
    END IF;
    
    -- Create revision if content changed significantly
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
        -- This will be handled by an AFTER UPDATE trigger to avoid mutation during trigger execution
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp and metadata updates
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_post_timestamp();

-- Create trigger for slug generation on insert
CREATE TRIGGER trigger_blog_posts_generate_slug
    BEFORE INSERT ON blog_posts
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION update_blog_post_timestamp();

-- We'll add the trigger to update category counts after blog_categories table is ready
-- This trigger will be created after the blog categories migration is run

-- Create view for published posts
CREATE OR REPLACE VIEW published_blog_posts AS
SELECT 
    bp.id,
    bp.category_id,
    bc.name as category_name,
    bc.slug as category_slug,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.content_type,
    bp.meta_title,
    bp.meta_description,
    bp.featured_image_url,
    bp.featured_image_alt,
    bp.is_featured,
    bp.is_trending,
    bp.tags,
    bp.reading_time_minutes,
    bp.difficulty_level,
    bp.published_at,
    bp.view_count,
    bp.like_count,
    bp.comment_count,
    bp.author_name,
    bp.created_at
FROM blog_posts bp
INNER JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bp.status = 'published' 
  AND bp.published_at <= NOW()
  AND bc.is_active = TRUE
ORDER BY bp.published_at DESC;

-- Create view for featured posts
CREATE OR REPLACE VIEW featured_blog_posts AS
SELECT 
    bp.id,
    bp.category_id,
    bc.name as category_name,
    bc.color_hex as category_color,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image_url,
    bp.featured_image_alt,
    bp.reading_time_minutes,
    bp.published_at,
    bp.view_count,
    bp.author_name
FROM blog_posts bp
INNER JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bp.status = 'published' 
  AND bp.is_featured = TRUE
  AND bp.published_at <= NOW()
  AND bc.is_active = TRUE
ORDER BY bp.published_at DESC;

-- Create view for trending posts
CREATE OR REPLACE VIEW trending_blog_posts AS
SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image_url,
    bp.view_count,
    bp.like_count,
    bp.published_at,
    bc.name as category_name,
    bc.slug as category_slug
FROM blog_posts bp
INNER JOIN blog_categories bc ON bp.category_id = bc.id
WHERE bp.status = 'published' 
  AND (bp.is_trending = TRUE OR bp.view_count > 1000)
  AND bp.published_at >= NOW() - INTERVAL '30 days'
  AND bc.is_active = TRUE
ORDER BY bp.view_count DESC, bp.published_at DESC
LIMIT 10;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_post_revisions TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_post_views TO rawgle_user;
GRANT SELECT ON published_blog_posts TO rawgle_user;
GRANT SELECT ON featured_blog_posts TO rawgle_user;
GRANT SELECT ON trending_blog_posts TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Blog posts table created successfully with comprehensive content management features!' as result;

-- Display table info
SELECT 'blog_posts' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
UNION ALL
SELECT 'blog_post_revisions' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_post_revisions'
UNION ALL
SELECT 'blog_post_views' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_post_views'
ORDER BY table_name, ordinal_position;