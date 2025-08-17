-- D1 Remote Compatible Schema
-- No transactions, individual statements only

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
    types TEXT,
    keyword TEXT,
    place_type TEXT,
    tile_lat REAL,
    tile_lon REAL,
    raw_data TEXT,
    created_at TEXT
);
