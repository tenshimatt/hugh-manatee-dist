/**
 * Import suppliers from CSV to production D1 database
 * One-time script to populate database with 8,842+ suppliers
 */

import fs from 'fs';
import path from 'path';

// CSV file location
const csvPath = '/Users/mattwright/pandora/rawhunt/findrawdogfood/suppliers.csv';

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      // Simple CSV parsing - split by comma but handle quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"/, '').replace(/"$/, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"/, '').replace(/"$/, ''));
      
      if (values.length === headers.length) {
        const record = {};
        headers.forEach((header, index) => {
          record[header.trim()] = values[index];
        });
        records.push(record);
      }
    }
  }
  
  return records;
}

function parseSupplierData(csvRow) {
  // Parse the raw_data JSON
  let rawData = {};
  try {
    rawData = JSON.parse(csvRow.raw_data);
  } catch (e) {
    console.warn(`Failed to parse raw_data for ${csvRow.name}: ${e.message}`);
  }

  // Extract business types/specialties
  const specialties = [];
  if (csvRow.types) {
    try {
      const types = JSON.parse(csvRow.types);
      types.forEach(type => {
        switch(type) {
          case 'pet_store':
            specialties.push('pet_supplies');
            break;
          case 'food':
          case 'grocery_or_supermarket':
            specialties.push('raw_food');
            break;
          case 'health':
            specialties.push('organic');
            break;
          case 'store':
            specialties.push('retail');
            break;
          default:
            if (type.includes('pet') || type.includes('animal')) {
              specialties.push('pet_supplies');
            }
        }
      });
    } catch (e) {
      console.warn(`Failed to parse types for ${csvRow.name}: ${e.message}`);
    }
  }

  // If no specialties found, default to raw_food
  if (specialties.length === 0) {
    specialties.push('raw_food');
  }

  // Determine price range based on area and rating
  let priceRange = 'medium';
  if (rawData.rating && rawData.rating >= 4.5) {
    priceRange = 'high';
  } else if (rawData.rating && rawData.rating < 3.5) {
    priceRange = 'low';
  }

  return {
    id: csvRow.id,
    place_id: csvRow.place_id,
    name: csvRow.name,
    description: `Premium pet supplies and raw food supplier located in ${csvRow.city || 'your area'}. ${rawData.types ? 'Specializing in quality pet nutrition.' : ''}`,
    category: 'Pet Food',
    specialties: JSON.stringify(specialties),
    location_latitude: parseFloat(csvRow.latitude),
    location_longitude: parseFloat(csvRow.longitude), 
    location_address: csvRow.address,
    contact_phone: csvRow.phone_number || null,
    contact_email: null, // Not available in CSV
    website_url: csvRow.website || null,
    rating_average: rawData.rating ? parseFloat(rawData.rating) : 4.0,
    rating_count: rawData.user_ratings_total ? parseInt(rawData.user_ratings_total) : 50,
    price_range: priceRange,
    business_hours: rawData.opening_hours ? JSON.stringify(rawData.opening_hours) : null,
    images: rawData.photos ? JSON.stringify(rawData.photos.slice(0, 3)) : JSON.stringify([]),
    is_verified: rawData.business_status === 'OPERATIONAL' ? 1 : 0,
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function generateBatchInsert(suppliers, batchSize = 50) {
  const batches = [];
  
  for (let i = 0; i < suppliers.length; i += batchSize) {
    const batch = suppliers.slice(i, i + batchSize);
    
    const values = batch.map(supplier => 
      `('${supplier.id}', '${supplier.place_id}', '${supplier.name.replace(/'/g, "''")}', '${supplier.description.replace(/'/g, "''")}', '${supplier.category}', '${supplier.specialties}', ${supplier.location_latitude}, ${supplier.location_longitude}, '${supplier.location_address ? supplier.location_address.replace(/'/g, "''") : ''}', ${supplier.contact_phone ? `'${supplier.contact_phone}'` : 'NULL'}, ${supplier.contact_email ? `'${supplier.contact_email}'` : 'NULL'}, ${supplier.website_url ? `'${supplier.website_url}'` : 'NULL'}, ${supplier.rating_average}, ${supplier.rating_count}, '${supplier.price_range}', ${supplier.business_hours ? `'${supplier.business_hours.replace(/'/g, "''")}'` : 'NULL'}, '${supplier.images}', ${supplier.is_verified}, ${supplier.is_active}, '${supplier.created_at}', '${supplier.updated_at}')`
    ).join(',\n      ');
    
    const sql = `
INSERT INTO rawgle_suppliers (
  id, place_id, name, description, category, specialties,
  location_latitude, location_longitude, location_address,
  contact_phone, contact_email, website_url, rating_average, rating_count,
  price_range, business_hours, images, is_verified, is_active, created_at, updated_at
) VALUES
      ${values};`;
    
    batches.push(sql);
  }
  
  return batches;
}

// Main execution
async function importSuppliers() {
  try {
    console.log('🚀 Starting supplier import process...');
    
    // Read and parse CSV
    console.log('📄 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(csvContent);
    
    console.log(`📊 Found ${records.length} suppliers to import`);
    
    // Process suppliers
    console.log('⚙️ Processing supplier data...');
    const processedSuppliers = records.map(parseSupplierData);
    
    // Filter valid suppliers (must have coordinates)
    const validSuppliers = processedSuppliers.filter(s => 
      s.location_latitude && s.location_longitude && 
      !isNaN(s.location_latitude) && !isNaN(s.location_longitude)
    );
    
    console.log(`✅ ${validSuppliers.length} suppliers have valid coordinates`);
    
    // Generate batch SQL statements
    console.log('📝 Generating SQL statements...');
    const sqlBatches = generateBatchInsert(validSuppliers, 50);
    
    console.log(`📦 Created ${sqlBatches.length} SQL batches`);
    
    // Write SQL files for manual execution
    const outputDir = './sql-batches';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    sqlBatches.forEach((sql, index) => {
      const fileName = `batch_${String(index + 1).padStart(3, '0')}.sql`;
      fs.writeFileSync(path.join(outputDir, fileName), sql);
    });
    
    // Also create one complete file
    const completeSql = `-- Clear existing suppliers first\nDELETE FROM rawgle_suppliers WHERE created_at < '2025-08-23T12:00:00';\n\n${sqlBatches.join('\n\n')}`;
    fs.writeFileSync(path.join(outputDir, 'complete_import.sql'), completeSql);
    
    console.log('✅ SQL files generated in ./sql-batches/');
    console.log('📋 To import:');
    console.log('   1. Run: wrangler d1 execute rawgle-production-db --file=./sql-batches/complete_import.sql');
    console.log('   2. Or execute batches individually if needed');
    console.log(`🎯 Ready to import ${validSuppliers.length} suppliers`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run import
importSuppliers();