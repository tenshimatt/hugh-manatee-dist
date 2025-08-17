-- Complete Cloudflare D1 Database Schema
-- Matches ALL Google Places API field names exactly
-- Compatible with D1 (no COMMENT syntax)

-- Drop existing table and recreate with complete schema
DROP TABLE IF EXISTS suppliers_complete;

CREATE TABLE suppliers_complete (
  -- Primary identifiers
  id TEXT PRIMARY KEY,
  place_id TEXT UNIQUE,
  
  -- Basic information (exact Google API field names)
  name TEXT,
  types TEXT,
  
  -- Address information (exact API field names)
  formatted_address TEXT,
  address_components TEXT,
  adr_address TEXT,
  vicinity TEXT,
  postal_code TEXT,
  
  -- Custom location fields (for our app)
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Geometry and location (exact API field names)
  latitude REAL,
  longitude REAL,
  geometry TEXT,
  plus_code TEXT,
  
  -- Contact information (exact API field names)
  formatted_phone_number TEXT,
  international_phone_number TEXT,
  website TEXT,
  url TEXT,
  
  -- Business status and hours (exact API field names)
  business_status TEXT,
  opening_hours TEXT,
  current_opening_hours TEXT,
  secondary_opening_hours TEXT,
  utc_offset INTEGER,
  
  -- Ratings and reviews (exact API field names)
  rating REAL,
  user_ratings_total INTEGER,
  reviews TEXT,
  editorial_summary TEXT,
  
  -- Pricing and service options (exact API field names)
  price_level INTEGER,
  delivery BOOLEAN,
  dine_in BOOLEAN,
  takeout BOOLEAN,
  reservable BOOLEAN,
  curbside_pickup BOOLEAN,
  wheelchair_accessible_entrance BOOLEAN,
  
  -- Food service details (exact API field names)
  serves_breakfast BOOLEAN,
  serves_lunch BOOLEAN,
  serves_dinner BOOLEAN,
  serves_brunch BOOLEAN,
  serves_beer BOOLEAN,
  serves_wine BOOLEAN,
  serves_vegetarian_food BOOLEAN,
  
  -- Visual and media (exact API field names)
  photos TEXT,
  icon TEXT,
  icon_mask_base_uri TEXT,
  icon_background_color TEXT,
  
  -- Metadata
  keyword TEXT,
  place_type TEXT,
  created_at TEXT,
  updated_at TEXT,
  api_version TEXT
);

-- Indexes for performance
CREATE INDEX idx_suppliers_complete_place_id ON suppliers_complete(place_id);
CREATE INDEX idx_suppliers_complete_location ON suppliers_complete(latitude, longitude);
CREATE INDEX idx_suppliers_complete_city_state ON suppliers_complete(city, state);
CREATE INDEX idx_suppliers_complete_rating ON suppliers_complete(rating);
CREATE INDEX idx_suppliers_complete_business_status ON suppliers_complete(business_status);
CREATE INDEX idx_suppliers_complete_created_at ON suppliers_complete(created_at);

-- Spatial search optimization
CREATE INDEX idx_suppliers_complete_lat_bounds ON suppliers_complete(latitude) 
WHERE latitude IS NOT NULL;

CREATE INDEX idx_suppliers_complete_lng_bounds ON suppliers_complete(longitude) 
WHERE longitude IS NOT NULL;

-- Service-based indexes for filtering
CREATE INDEX idx_suppliers_complete_delivery ON suppliers_complete(delivery) 
WHERE delivery = 1;

CREATE INDEX idx_suppliers_complete_takeout ON suppliers_complete(takeout) 
WHERE takeout = 1;

CREATE INDEX idx_suppliers_complete_dine_in ON suppliers_complete(dine_in) 
WHERE dine_in = 1;

-- Text search indexes
CREATE INDEX idx_suppliers_complete_name ON suppliers_complete(name);
CREATE INDEX idx_suppliers_complete_types ON suppliers_complete(types);
