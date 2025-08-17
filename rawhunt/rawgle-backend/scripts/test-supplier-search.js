/**
 * Test script for supplier geolocation search
 * Tests the local database with real supplier data
 */

import Database from 'better-sqlite3';
import { SupplierService } from '../src/services/supplier-service.js';
import path from 'path';

async function testSupplierSearch() {
  try {
    console.log('🔍 Testing Supplier Geolocation Search');
    console.log('=====================================\n');

    // Connect to local database
    const dbPath = path.join(process.cwd(), 'data', 'rawgle-local.db');
    const db = new Database(dbPath);
    
    console.log(`📍 Connected to database: ${dbPath}\n`);

    // Create supplier service
    const supplierService = new SupplierService(db);

    // Test 1: Search near Los Angeles (34.0522, -118.2437)
    console.log('🌴 Test 1: Search near Los Angeles, CA');
    console.log('Coordinates: 34.0522, -118.2437, Radius: 100 miles\n');

    const laSuppliers = await supplierService.searchByLocation(34.0522, -118.2437, 100);
    console.log(`Found ${laSuppliers.length} suppliers:`);
    laSuppliers.forEach(supplier => {
      console.log(`  - ${supplier.name} (${supplier.city}, ${supplier.state})`);
      console.log(`    Distance: ${supplier.distance_miles?.toFixed(1)} miles`);
      console.log(`    Rating: ${supplier.rating_average || 'No ratings'}`);
      console.log(`    Categories: ${supplier.categories}`);
      console.log('');
    });

    // Test 2: Search near Austin (30.2672, -97.7431)
    console.log('\n🤠 Test 2: Search near Austin, TX');
    console.log('Coordinates: 30.2672, -97.7431, Radius: 100 miles\n');

    const austinSuppliers = await supplierService.searchByLocation(30.2672, -97.7431, 100);
    console.log(`Found ${austinSuppliers.length} suppliers:`);
    austinSuppliers.forEach(supplier => {
      console.log(`  - ${supplier.name} (${supplier.city}, ${supplier.state})`);
      console.log(`    Distance: ${supplier.distance_miles?.toFixed(1)} miles`);
      console.log(`    Rating: ${supplier.rating_average || 'No ratings'}`);
      console.log('');
    });

    // Test 3: Test getNearbySuppliers with filters
    console.log('\n🔍 Test 3: Get nearby suppliers with filters');
    console.log('Near Denver, CO with verified_only=true\n');

    const denverSuppliers = await supplierService.getNearbySuppliers({
      latitude: 39.7392,
      longitude: -104.9903,
      radiusMiles: 150,
      limit: 10,
      verifiedOnly: true
    });

    console.log(`Found ${denverSuppliers.length} verified suppliers:`);
    denverSuppliers.forEach(supplier => {
      console.log(`  - ${supplier.name} (${supplier.city}, ${supplier.state})`);
      console.log(`    Distance: ${supplier.distance_miles?.toFixed(1)} miles`);
      console.log(`    Verified: ${supplier.verified ? '✅' : '❌'}`);
      console.log('');
    });

    // Test 4: Get all suppliers to verify database content
    console.log('\n📊 Test 4: Database Statistics');
    const allSuppliers = await db.prepare('SELECT COUNT(*) as count FROM suppliers WHERE active = 1').get();
    const verifiedCount = await db.prepare('SELECT COUNT(*) as count FROM suppliers WHERE active = 1 AND verified = 1').get();
    const withLocation = await db.prepare('SELECT COUNT(*) as count FROM suppliers WHERE active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL').get();

    console.log(`Total active suppliers: ${allSuppliers.count}`);
    console.log(`Verified suppliers: ${verifiedCount.count}`);
    console.log(`Suppliers with location: ${withLocation.count}`);

    db.close();
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupplierSearch()
    .then(() => {
      console.log('\n🎉 Supplier search tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testSupplierSearch };