-- Essential Suppliers Table - Minimal for MVP
-- Created: 2025-09-09
-- Purpose: Core supplier functionality for search and AI chat

-- Drop existing suppliers/stores tables if they exist to start fresh
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS store_categories CASCADE;
DROP TYPE IF EXISTS store_status CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;

-- Create essential supplier table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- Location
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    
    -- Coordinates for distance calculation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact
    phone VARCHAR(30),
    email VARCHAR(255),
    website VARCHAR(500),
    
    -- Business info
    verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Features
    delivery_available BOOLEAN DEFAULT false,
    pickup_available BOOLEAN DEFAULT true,
    online_ordering BOOLEAN DEFAULT false,
    
    -- Categories (simplified)
    categories TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_city_state ON suppliers(city, state);
CREATE INDEX IF NOT EXISTS idx_suppliers_verified ON suppliers(verified);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating DESC);

-- Insert sample supplier data
INSERT INTO suppliers (name, address, city, state, zip_code, latitude, longitude, phone, verified, rating, review_count, delivery_available, categories) VALUES
('Raw Paws Pet Store', '123 Main Street', 'Los Angeles', 'CA', '90210', 34.0522, -118.2437, '(555) 123-4567', true, 4.5, 142, true, ARRAY['raw food', 'organic']),
('Natural Pet Supplies', '456 Oak Avenue', 'San Francisco', 'CA', '94102', 37.7749, -122.4194, '(555) 234-5678', true, 4.2, 89, false, ARRAY['natural', 'supplements']),
('Healthy Hounds Market', '789 Pine Road', 'Seattle', 'WA', '98101', 47.6062, -122.3321, '(555) 345-6789', true, 4.8, 203, true, ARRAY['raw food', 'treats']),
('Premium Pet Foods', '321 Elm Street', 'Portland', 'OR', '97201', 45.5152, -122.6784, '(555) 456-7890', true, 4.3, 156, true, ARRAY['premium', 'raw food']),
('Wild & Natural Pet Co', '654 Cedar Lane', 'Denver', 'CO', '80202', 39.7392, -104.9903, '(555) 567-8901', true, 4.6, 178, false, ARRAY['natural', 'wild game']);

COMMENT ON TABLE suppliers IS 'Core supplier directory for RAWGLE platform - stores raw pet food supplier information';