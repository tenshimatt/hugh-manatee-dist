-- Database Schema Enhancement for FindRawDogFood
-- Adding geolocation and enhanced supplier data

-- 1. Add geolocation columns to suppliers table
ALTER TABLE suppliers ADD COLUMN latitude REAL;
ALTER TABLE suppliers ADD COLUMN longitude REAL;
ALTER TABLE suppliers ADD COLUMN geocoded_at DATETIME;
ALTER TABLE suppliers ADD COLUMN geocode_accuracy TEXT; -- 'exact', 'approximate', 'city', 'failed'

-- 2. Add supplier categorization
ALTER TABLE suppliers ADD COLUMN supplier_type TEXT DEFAULT 'general'; -- 'specialist', 'pet_store', 'delivery', 'wholesale', 'general'
ALTER TABLE suppliers ADD COLUMN delivery_available BOOLEAN DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN delivery_radius_km INTEGER;
ALTER TABLE suppliers ADD COLUMN opening_hours TEXT; -- JSON format
ALTER TABLE suppliers ADD COLUMN rating REAL DEFAULT 0.0;
ALTER TABLE suppliers ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN verified BOOLEAN DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN premium_listing BOOLEAN DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN featured BOOLEAN DEFAULT 0;

-- 3. Add business metadata
ALTER TABLE suppliers ADD COLUMN description TEXT;
ALTER TABLE suppliers ADD COLUMN specialties TEXT; -- JSON array of specialties
ALTER TABLE suppliers ADD COLUMN established_year INTEGER;
ALTER TABLE suppliers ADD COLUMN employee_count INTEGER;
ALTER TABLE suppliers ADD COLUMN social_media TEXT; -- JSON object with social links

-- 4. Add tracking columns
ALTER TABLE suppliers ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN contact_count INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'active'; -- 'active', 'inactive', 'pending', 'suspended'

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_delivery ON suppliers(delivery_available);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_premium ON suppliers(premium_listing);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- 6. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    user_name TEXT,
    user_email TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    title TEXT,
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_supplier ON reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- 7. Create analytics table
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- 'view', 'contact', 'search', 'map_interaction'
    supplier_id INTEGER,
    user_ip TEXT,
    user_location TEXT, -- JSON with lat/lng
    search_query TEXT,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_supplier ON analytics_events(supplier_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);

-- 8. Create favorites table (for future user accounts)
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_session TEXT, -- For now, use session-based favorites
    supplier_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_session ON user_favorites(user_session);
CREATE INDEX IF NOT EXISTS idx_favorites_supplier ON user_favorites(supplier_id);