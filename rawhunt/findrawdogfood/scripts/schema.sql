-- Schema for findrawdogfood suppliers database
-- Matches the CSV structure from suppliers.csv

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    latitude REAL,
    longitude REAL,
    phone_number TEXT,
    website TEXT,
    rating REAL,
    user_ratings_total INTEGER,
    types TEXT, -- JSON array as TEXT
    keyword TEXT,
    place_type TEXT,
    tile_lat REAL,
    tile_lon REAL,
    raw_data TEXT, -- JSON as TEXT
    created_at TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON suppliers(state);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_place_id ON suppliers(place_id);

-- Create search table for user interactions
CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dog_breed TEXT,
    dog_age INTEGER,
    location TEXT,
    allergies TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create affiliate tracking table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id TEXT,
    search_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (search_id) REFERENCES searches(id)
);
