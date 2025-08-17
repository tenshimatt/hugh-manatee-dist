/**
 * Setup Local Database for Testing
 * Creates a local SQLite database with supplier data for development
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

// Sample supplier data matching Rawgle.com structure
const sampleSuppliers = [
  {
    name: "Premium Raw Pet Foods",
    business_name: "Premium Raw Pet Foods LLC",
    email: "info@premiumrawpet.com",
    phone: "(555) 123-4567",
    website: "https://premiumrawpet.com",
    description: "High-quality raw meat for dogs and cats. USDA certified facility with same-day delivery in metro areas.",
    address: "1234 Industrial Blvd",
    city: "Los Angeles",
    state: "CA",
    country: "US",
    postal_code: "90210",
    latitude: 34.0522,
    longitude: -118.2437,
    service_radius_miles: 50,
    categories: '["raw_meat", "organs", "bones"]',
    specialties: '["poultry", "beef", "lamb"]',
    rating_average: 4.8,
    review_count: 156,
    verified: true,
    offers_delivery: true,
    offers_pickup: true,
    accepts_paws: true,
    minimum_order_usd: 25.00
  },
  {
    name: "Nature's Raw Supply",
    business_name: "Nature's Raw Supply Inc",
    email: "orders@naturesrawsupply.com", 
    phone: "(555) 234-5678",
    website: "https://naturesrawsupply.com",
    description: "Organic, grass-fed raw pet food. Free-range poultry and wild-caught fish. Locally sourced ingredients.",
    address: "5678 Farm Road",
    city: "Austin",
    state: "TX", 
    country: "US",
    postal_code: "78701",
    latitude: 30.2672,
    longitude: -97.7431,
    service_radius_miles: 75,
    categories: '["raw_meat", "organs", "supplements"]',
    specialties: '["organic", "grass_fed", "wild_caught"]',
    rating_average: 4.9,
    review_count: 203,
    verified: true,
    offers_delivery: true,
    offers_pickup: false,
    accepts_paws: true,
    minimum_order_usd: 50.00
  },
  {
    name: "Raw Feeding Co-op",
    business_name: "Raw Feeding Cooperative",
    email: "info@rawfeedingcoop.org",
    phone: "(555) 345-6789", 
    website: "https://rawfeedingcoop.org",
    description: "Community-driven raw feeding cooperative. Bulk ordering, educational resources, and member discounts.",
    address: "9012 Community Center Dr",
    city: "Denver",
    state: "CO",
    country: "US", 
    postal_code: "80201",
    latitude: 39.7392,
    longitude: -104.9903,
    service_radius_miles: 100,
    categories: '["raw_meat", "bones", "supplements", "equipment"]',
    specialties: '["bulk_ordering", "educational", "community"]',
    rating_average: 4.7,
    review_count: 89,
    verified: true,
    offers_delivery: false,
    offers_pickup: true,
    accepts_paws: false,
    minimum_order_usd: 100.00
  },
  {
    name: "Coastal Raw Meats",
    business_name: "Coastal Raw Meats LLC",
    email: "sales@coastalrawmeats.com",
    phone: "(555) 456-7890",
    website: "https://coastalrawmeats.com", 
    description: "Fresh seafood and marine proteins for raw feeding. Sustainably sourced fish, shellfish, and sea vegetables.",
    address: "2468 Harbor Way",
    city: "Seattle",
    state: "WA",
    country: "US",
    postal_code: "98101", 
    latitude: 47.6062,
    longitude: -122.3321,
    service_radius_miles: 60,
    categories: '["raw_meat", "supplements"]',
    specialties: '["fish", "seafood", "marine_proteins"]',
    rating_average: 4.6,
    review_count: 124,
    verified: true,
    offers_delivery: true,
    offers_pickup: true,
    accepts_paws: true,
    minimum_order_usd: 35.00
  },
  {
    name: "Farm Fresh Raw",
    business_name: "Farm Fresh Raw Foods",
    email: "contact@farmfreshraw.com",
    phone: "(555) 567-8901",
    website: "https://farmfreshraw.com",
    description: "Farm-to-bowl raw pet food. Direct from local farms, hormone-free, antibiotic-free meats and organs.",
    address: "1357 Farm Market Rd",
    city: "Nashville", 
    state: "TN",
    country: "US",
    postal_code: "37201",
    latitude: 36.1627,
    longitude: -86.7816,
    service_radius_miles: 40,
    categories: '["raw_meat", "organs"]',
    specialties: '["farm_direct", "hormone_free", "antibiotic_free"]',
    rating_average: 4.5,
    review_count: 67,
    verified: false,
    offers_delivery: true,
    offers_pickup: false,
    accepts_paws: false,
    minimum_order_usd: 40.00
  }
];

async function setupLocalDatabase() {
  try {
    // Create local database directory
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create SQLite database
    const dbPath = path.join(dbDir, 'rawgle-local.db');
    const db = new Database(dbPath);

    console.log('Creating tables...');

    // Create suppliers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        business_name TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        description TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT DEFAULT 'US',
        postal_code TEXT,
        latitude REAL,
        longitude REAL,
        service_radius_miles INTEGER,
        shipping_zones TEXT DEFAULT '[]',
        business_license TEXT,
        certifications TEXT DEFAULT '[]',
        insurance_info TEXT,
        tax_id TEXT,
        categories TEXT DEFAULT '["raw_meat"]',
        specialties TEXT DEFAULT '[]',
        rating_average REAL DEFAULT 0.0,
        review_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        verified_at DATETIME,
        verification_level TEXT DEFAULT 'basic',
        total_orders INTEGER DEFAULT 0,
        total_sales_usd REAL DEFAULT 0.0,
        response_time_hours REAL,
        featured BOOLEAN DEFAULT FALSE,
        accepts_paws BOOLEAN DEFAULT FALSE,
        offers_delivery BOOLEAN DEFAULT FALSE,
        offers_pickup BOOLEAN DEFAULT FALSE,
        minimum_order_usd REAL,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_suppliers_city_state ON suppliers(city, state);
      CREATE INDEX IF NOT EXISTS idx_suppliers_verified ON suppliers(verified);
      CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating_average DESC);
      CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
    `);

    // Insert sample suppliers
    console.log('Inserting sample supplier data...');
    
    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (
        id, name, business_name, email, phone, website, description,
        address, city, state, country, postal_code, latitude, longitude,
        service_radius_miles, categories, specialties, rating_average, 
        review_count, verified, offers_delivery, offers_pickup, accepts_paws,
        minimum_order_usd, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const supplier of sampleSuppliers) {
      const id = nanoid();
      insertSupplier.run(
        id,
        supplier.name,
        supplier.business_name,
        supplier.email,
        supplier.phone,
        supplier.website,
        supplier.description,
        supplier.address,
        supplier.city,
        supplier.state,
        supplier.country,
        supplier.postal_code,
        supplier.latitude,
        supplier.longitude,
        supplier.service_radius_miles,
        supplier.categories,
        supplier.specialties,
        supplier.rating_average,
        supplier.review_count,
        supplier.verified ? 1 : 0,
        supplier.offers_delivery ? 1 : 0,
        supplier.offers_pickup ? 1 : 0,
        supplier.accepts_paws ? 1 : 0,
        supplier.minimum_order_usd,
        1, // active
        new Date().toISOString()
      );
    }

    // Verify data insertion
    const count = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
    console.log(`✅ Successfully created local database with ${count.count} suppliers`);

    // Test geolocation search (Los Angeles area)
    console.log('\n🧪 Testing geolocation search (50 miles from Los Angeles):');
    const nearbySuppliers = db.prepare(`
      SELECT name, city, state,
      (3959 * acos(cos(radians(34.0522)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(-118.2437)) + sin(radians(34.0522)) * 
      sin(radians(latitude)))) AS distance_miles
      FROM suppliers 
      WHERE active = 1
      AND (3959 * acos(cos(radians(34.0522)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(-118.2437)) + sin(radians(34.0522)) * 
      sin(radians(latitude)))) <= 50
      ORDER BY distance_miles ASC
    `).all();

    nearbySuppliers.forEach(supplier => {
      console.log(`  - ${supplier.name} (${supplier.city}, ${supplier.state}) - ${supplier.distance_miles.toFixed(1)} miles`);
    });

    console.log(`\n📍 Database created at: ${dbPath}`);
    console.log(`🔗 Connection string: ${dbPath}`);

    db.close();
    return dbPath;

  } catch (error) {
    console.error('❌ Error setting up local database:', error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupLocalDatabase()
    .then((dbPath) => {
      console.log(`\n🎉 Local database ready for testing at: ${dbPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupLocalDatabase };