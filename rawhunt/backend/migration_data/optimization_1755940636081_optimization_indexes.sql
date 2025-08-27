
-- Composite index for geolocation queries (most critical)
-- This index enables efficient spatial queries with distance calculations
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_geo_optimized 
ON rawgle_suppliers(location_latitude, location_longitude, is_active, category);

-- Index for category + location queries
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_category_geo 
ON rawgle_suppliers(category, location_latitude, location_longitude) 
WHERE is_active = 1;

-- Index for rating-based queries
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_rating_optimized 
ON rawgle_suppliers(rating_average DESC, rating_count DESC, is_active) 
WHERE is_active = 1;

-- Index for verified suppliers
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_verified 
ON rawgle_suppliers(is_verified, rating_average DESC) 
WHERE is_active = 1;

-- Text search optimization
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_search 
ON rawgle_suppliers(name COLLATE NOCASE, category, is_active);

-- Price range filtering
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_price 
ON rawgle_suppliers(price_range, rating_average DESC) 
WHERE is_active = 1;

-- Composite index for complex queries (category + rating + location)
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_complex 
ON rawgle_suppliers(category, rating_average DESC, location_latitude, location_longitude) 
WHERE is_active = 1;

-- Index for supplier management queries
CREATE INDEX IF NOT EXISTS idx_rawgle_suppliers_management 
ON rawgle_suppliers(created_at, is_verified, is_active);
    