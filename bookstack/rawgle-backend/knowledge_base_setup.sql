-- Create content type enum for articles
CREATE TYPE article_content_type AS ENUM ('markdown', 'html', 'text');

-- Create article status enum
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- Create priority level enum for articles
CREATE TYPE article_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create main knowledge_base_articles table
CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article identification
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500), -- Auto-generated from title
    excerpt TEXT, -- Brief summary/description
    
    -- Content management
    content TEXT NOT NULL,
    content_type article_content_type DEFAULT 'markdown',
    content_html TEXT, -- Processed HTML version for display
    reading_time_minutes INTEGER, -- Auto-calculated
    
    -- Categorization and organization
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}', -- SEO keywords
    
    -- Status and workflow
    status article_status DEFAULT 'draft',
    priority article_priority DEFAULT 'medium',
    featured BOOLEAN DEFAULT FALSE,
    sticky BOOLEAN DEFAULT FALSE, -- Pin to top of category
    
    -- Publishing information
    published_at TIMESTAMPTZ,
    scheduled_publish_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- User management
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    editor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Last editor
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- SEO and metadata
    meta_title VARCHAR(60), -- SEO title (different from title)
    meta_description TEXT, -- SEO description
    canonical_url TEXT, -- For SEO purposes
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    bookmark_count INTEGER DEFAULT 0 CHECK (bookmark_count >= 0),
    
    -- Content metrics
    word_count INTEGER DEFAULT 0 CHECK (word_count >= 0),
    character_count INTEGER DEFAULT 0 CHECK (character_count >= 0),
    
    -- Related content
    related_articles UUID[], -- Array of related article IDs
    related_products TEXT[], -- Related product categories or IDs
    related_suppliers UUID[], -- Related to specific suppliers
    
    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    requires_login BOOLEAN DEFAULT FALSE,
    
    -- Versioning support
    version_number INTEGER DEFAULT 1 CHECK (version_number > 0),
    parent_version_id UUID REFERENCES knowledge_base_articles(id) ON DELETE SET NULL,
    
    -- Media attachments
    featured_image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    video_urls TEXT[] DEFAULT '{}',
    document_attachments TEXT[] DEFAULT '{}',
    
    -- System fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for performance

-- Primary lookup indexes
CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_kb_articles_subcategory ON knowledge_base_articles(subcategory) WHERE subcategory IS NOT NULL;
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles(status);
CREATE INDEX idx_kb_articles_priority ON knowledge_base_articles(priority);

-- Author and user indexes
CREATE INDEX idx_kb_articles_author_id ON knowledge_base_articles(author_id);
CREATE INDEX idx_kb_articles_editor_id ON knowledge_base_articles(editor_id) WHERE editor_id IS NOT NULL;

-- Publishing and scheduling indexes
CREATE INDEX idx_kb_articles_published_at ON knowledge_base_articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_kb_articles_scheduled_publish ON knowledge_base_articles(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;
CREATE INDEX idx_kb_articles_expires_at ON knowledge_base_articles(expires_at) WHERE expires_at IS NOT NULL;

-- Array field indexes for searching
CREATE INDEX idx_kb_articles_tags ON knowledge_base_articles USING gin(tags);
CREATE INDEX idx_kb_articles_keywords ON knowledge_base_articles USING gin(keywords);
CREATE INDEX idx_kb_articles_related_articles ON knowledge_base_articles USING gin(related_articles);

-- Full-text search indexes
CREATE INDEX idx_kb_articles_title_search ON knowledge_base_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_kb_articles_content_search ON knowledge_base_articles USING gin(to_tsvector('english', content));
CREATE INDEX idx_kb_articles_full_search ON knowledge_base_articles USING gin(
    to_tsvector('english', 
        title || ' ' || 
        COALESCE(excerpt, '') || ' ' || 
        content || ' ' ||
        COALESCE(category, '') || ' ' ||
        COALESCE(subcategory, '')
    )
);

-- Performance indexes
CREATE INDEX idx_kb_articles_view_count ON knowledge_base_articles(view_count DESC) WHERE view_count > 0;
CREATE INDEX idx_kb_articles_like_count ON knowledge_base_articles(like_count DESC) WHERE like_count > 0;
CREATE INDEX idx_kb_articles_featured ON knowledge_base_articles(featured) WHERE featured = TRUE;
CREATE INDEX idx_kb_articles_sticky ON knowledge_base_articles(sticky) WHERE sticky = TRUE;

-- Composite indexes for common queries
CREATE INDEX idx_kb_articles_category_status ON knowledge_base_articles(category, status);
CREATE INDEX idx_kb_articles_status_published ON knowledge_base_articles(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_kb_articles_category_published ON knowledge_base_articles(category, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_kb_articles_author_status ON knowledge_base_articles(author_id, status);
CREATE INDEX idx_kb_articles_public_published ON knowledge_base_articles(is_public, status, published_at DESC) WHERE is_public = TRUE AND status = 'published';

-- System indexes
CREATE INDEX idx_kb_articles_is_active ON knowledge_base_articles(is_active);
CREATE INDEX idx_kb_articles_created_at ON knowledge_base_articles(created_at DESC);
CREATE INDEX idx_kb_articles_updated_at ON knowledge_base_articles(updated_at DESC);

-- Function to generate article slug from title
CREATE OR REPLACE FUNCTION generate_article_slug(article_title TEXT, article_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug from title
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(article_title, '[^a-zA-Z0-9\s\-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '\-+', '-', 'g'
        )
    );
    
    -- Trim leading/trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure reasonable length
    IF LENGTH(base_slug) > 450 THEN
        base_slug := SUBSTRING(base_slug FROM 1 FOR 450);
        base_slug := TRIM(BOTH '-' FROM base_slug);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM knowledge_base_articles WHERE slug = final_slug AND (article_id IS NULL OR id != article_id)) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reading time based on word count
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
    words_per_minute INTEGER := 200; -- Average reading speed
BEGIN
    IF content_text IS NULL OR LENGTH(TRIM(content_text)) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Count words (simple approximation)
    word_count := ARRAY_LENGTH(STRING_TO_ARRAY(REGEXP_REPLACE(content_text, '\s+', ' ', 'g'), ' '), 1);
    
    -- Calculate reading time in minutes (minimum 1 minute)
    RETURN GREATEST(CEIL(word_count::DECIMAL / words_per_minute), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update article metrics and derived fields
CREATE OR REPLACE FUNCTION update_article_metrics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_article_slug(NEW.title, NEW.id);
    END IF;
    
    -- Calculate word and character counts
    NEW.word_count = ARRAY_LENGTH(STRING_TO_ARRAY(REGEXP_REPLACE(NEW.content, '\s+', ' ', 'g'), ' '), 1);
    NEW.character_count = LENGTH(NEW.content);
    
    -- Calculate reading time
    NEW.reading_time_minutes = calculate_reading_time(NEW.content);
    
    -- Auto-set published_at when status changes to published
    IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    
    -- Clear published_at when moving away from published status
    IF NEW.status != 'published' AND OLD.status = 'published' THEN
        NEW.published_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_kb_articles_update_metrics
    BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_metrics();

CREATE TRIGGER trigger_kb_articles_generate_slug
    BEFORE INSERT ON knowledge_base_articles
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION update_article_metrics();

-- Function to increment view count safely
CREATE OR REPLACE FUNCTION increment_article_view_count(article_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE knowledge_base_articles 
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = article_id_param 
      AND is_active = TRUE 
      AND status = 'published';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;