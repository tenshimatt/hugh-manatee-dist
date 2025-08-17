-- D1 Remote Indexes (separate file)
-- Applied after table creation

CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON suppliers(state);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_place_id ON suppliers(place_id);
