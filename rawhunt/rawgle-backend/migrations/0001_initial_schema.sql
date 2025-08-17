-- Rawgle Platform Database Schema
-- Migration 0001: Initial schema creation

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    paws_balance INTEGER DEFAULT 0,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    location_latitude REAL,
    location_longitude REAL,
    location_address TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    specialties TEXT, -- JSON array of specialties
    location_latitude REAL NOT NULL,
    location_longitude REAL NOT NULL,
    location_address TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    website_url TEXT,
    rating_average REAL DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    price_range TEXT, -- 'low', 'medium', 'high'
    business_hours TEXT, -- JSON object with hours
    images TEXT, -- JSON array of image URLs
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reviews table
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT, -- JSON array of image URLs
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    UNIQUE(user_id, supplier_id) -- One review per user per supplier
);

-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    paws_earned INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
    service_type TEXT NOT NULL,
    service_description TEXT,
    scheduled_date DATETIME,
    completed_date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Transactions table (PAWS system)
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'earned', 'spent', 'transfer_in', 'transfer_out', 'admin_adjustment'
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_type TEXT, -- 'order', 'review', 'referral', 'bonus', 'transfer'
    reference_id INTEGER,
    from_user_id INTEGER, -- For transfers
    to_user_id INTEGER,   -- For transfers
    balance_after INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'order', 'review', 'paws', 'system', 'promotion'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON object with additional data
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User sessions table (for JWT blacklisting)
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Rate limiting table
CREATE TABLE rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, endpoint, window_start)
);

-- Supplier categories table
CREATE TABLE supplier_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default supplier categories
INSERT INTO supplier_categories (name, description, icon) VALUES
('Pet Grooming', 'Professional pet grooming services', 'scissors'),
('Veterinary', 'Veterinary clinics and animal hospitals', 'medical'),
('Pet Training', 'Pet training and behavior modification', 'graduation-cap'),
('Pet Sitting', 'Pet sitting and boarding services', 'home'),
('Pet Walking', 'Dog walking and exercise services', 'walk'),
('Pet Food', 'Pet food stores and suppliers', 'shopping-cart'),
('Pet Supplies', 'Pet accessories and supplies', 'gift'),
('Emergency Care', '24/7 emergency veterinary services', 'ambulance');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location_latitude, location_longitude);
CREATE INDEX idx_suppliers_location ON suppliers(location_latitude, location_longitude);
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_suppliers_rating ON suppliers(rating_average);
CREATE INDEX idx_reviews_supplier ON reviews(supplier_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_supplier ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_rate_limits_lookup ON rate_limits(ip_address, endpoint, window_start);