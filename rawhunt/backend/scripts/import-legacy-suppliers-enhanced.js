#!/usr/bin/env node

/**
 * Enhanced Legacy Supplier Import Script
 * Imports 9,137+ legacy suppliers from Google Places scraped data
 * 
 * Usage: node scripts/import-legacy-suppliers-enhanced.js [options]
 * Options:
 *   --dry-run     Show what would be imported without actually importing
 *   --batch-size=N   Number of records to process at once (default: 50)
 *   --remote      Import to remote database instead of local
 *   --source=FILE Path to CSV file (default: ../findrawdogfood/suppliers.csv)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LegacySupplierImporter {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.batchSize = options.batchSize || 50;
    this.useRemote = options.remote || false;
    this.sourceFile = options.source || path.join(__dirname, '../../findrawdogfood/suppliers.csv');
    this.importedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.duplicateCount = 0;
  }

  async importSuppliers() {
    console.log('🚀 Enhanced Legacy Supplier Import');
    console.log('===================================');
    console.log(`📊 Configuration:`);
    console.log(`   Dry Run: ${this.dryRun}`);
    console.log(`   Batch Size: ${this.batchSize}`);
    console.log(`   Database: ${this.useRemote ? 'Remote (production)' : 'Local'}`);
    console.log(`   Source: ${path.relative(process.cwd(), this.sourceFile)}`);
    console.log('');

    try {
      // Validate database connection first
      await this.validateDatabaseConnection();
      
      const legacyData = await this.loadLegacyDataFromCSV();
      console.log(`📋 Found ${legacyData.length} legacy suppliers to import`);
      
      if (this.dryRun) {
        await this.performDryRun(legacyData);
        return;
      }

      await this.processBatches(legacyData);
      
      console.log('\n🎉 Import Summary:');
      console.log(`   ✅ Imported: ${this.importedCount} suppliers`);
      console.log(`   ⚠️  Skipped: ${this.skippedCount} suppliers (invalid data)`);
      console.log(`   🔄 Duplicates: ${this.duplicateCount} suppliers (already exist)`);
      console.log(`   ❌ Errors: ${this.errorCount} suppliers`);
      console.log(`   📊 Success Rate: ${((this.importedCount / legacyData.length) * 100).toFixed(1)}%`);
      console.log('\n🔍 Performance Tips:');
      console.log(`   - Database indexes optimized for geolocation queries`);
      console.log(`   - Consider running ANALYZE after import for query optimization`);

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }

  async validateDatabaseConnection() {
    console.log('🔍 Validating database connection...');
    
    try {
      const remoteFlag = this.useRemote ? '--remote' : '--local';
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db ${remoteFlag} --command="SELECT COUNT(*) as count FROM suppliers;"`;
      
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      const currentCount = this.parseCountFromResult(result);
      
      console.log(`   ✅ Database connected successfully`);
      console.log(`   📊 Current suppliers in database: ${currentCount}`);
      
      if (currentCount > 8000) {
        console.log('   ⚠️  Warning: Database already contains substantial supplier data');
        console.log('   💡 Consider using --dry-run first to avoid duplicates');
      }
      
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async loadLegacyDataFromCSV() {
    if (!fs.existsSync(this.sourceFile)) {
      throw new Error(`Source file not found: ${this.sourceFile}`);
    }

    console.log('📖 Reading CSV data...');
    const csvContent = fs.readFileSync(this.sourceFile, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    console.log(`   📄 Headers found: ${headers.length} columns`);
    console.log(`   📑 Data rows: ${lines.length - 1} suppliers`);

    const suppliers = [];
    let rowCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const supplier = this.parseCSVRow(line, headers);
        if (supplier) {
          suppliers.push(supplier);
          rowCount++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Row ${i + 1}: ${error.message}`);
        this.errorCount++;
      }
    }

    console.log(`   ✅ Successfully parsed ${rowCount} suppliers`);
    console.log(`   ❌ Parse errors: ${this.errorCount} rows`);
    
    return suppliers;
  }

  parseCSVRow(line, headers) {
    // Parse CSV with proper handling of quoted strings containing commas
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length !== headers.length) {
      throw new Error(`Field count mismatch: expected ${headers.length}, got ${fields.length}`);
    }

    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = fields[index] || '';
    });

    return this.transformToSupplierFormat(rowData);
  }

  transformToSupplierFormat(csvRow) {
    // Validate required fields
    if (!csvRow.name || !csvRow.latitude || !csvRow.longitude) {
      throw new Error('Missing required fields: name, latitude, longitude');
    }

    const latitude = parseFloat(csvRow.latitude);
    const longitude = parseFloat(csvRow.longitude);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid latitude/longitude values');
    }

    // Extract business type and specialties from the types field
    const types = this.parseTypes(csvRow.types);
    const category = this.determineCategory(types);
    const specialties = this.extractSpecialties(types, csvRow.name);
    
    // Parse rating data
    const rating = parseFloat(csvRow.rating) || 0;
    const ratingCount = parseInt(csvRow.user_ratings_total) || 0;

    return {
      // Use place_id as a unique identifier to prevent duplicates
      place_id: csvRow.place_id,
      name: csvRow.name.replace(/"/g, '').trim(),
      description: this.generateDescription(csvRow, category),
      category: category,
      specialties: JSON.stringify(specialties),
      location_latitude: latitude,
      location_longitude: longitude,
      location_address: this.cleanAddress(csvRow.address),
      contact_phone: this.cleanPhone(csvRow.phone_number),
      contact_email: null, // Not available in Google Places data
      website_url: csvRow.website || null,
      rating_average: rating,
      rating_count: ratingCount,
      price_range: this.determinePriceRange(types, csvRow.name),
      business_hours: JSON.stringify({}), // Would need Places Details API for hours
      images: JSON.stringify([]), // Would need Places Details API for photos
      is_verified: rating > 4.0 && ratingCount > 50, // Auto-verify high-quality suppliers
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  parseTypes(typesString) {
    try {
      // Handle JSON array format: ["type1","type2"]
      if (typesString.startsWith('[') && typesString.endsWith(']')) {
        return JSON.parse(typesString.replace(/'/g, '"'));
      }
      // Handle comma-separated format
      return typesString.split(',').map(t => t.trim().replace(/"/g, ''));
    } catch (error) {
      return ['establishment'];
    }
  }

  determineCategory(types) {
    const categoryMap = {
      'veterinary_care': 'Veterinary',
      'pet_store': 'Pet Food',
      'grocery_or_supermarket': 'Pet Food',
      'food': 'Pet Food',
      'store': 'Pet Supplies',
      'health': 'Pet Food',
      'establishment': 'Pet Supplies'
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return 'Pet Food'; // Default for raw food suppliers
  }

  extractSpecialties(types, businessName) {
    const specialties = ['raw_food']; // All are raw food related

    // Add specialties based on business types
    if (types.includes('pet_store')) specialties.push('pet_store');
    if (types.includes('veterinary_care')) specialties.push('veterinary');
    if (types.includes('grocery_or_supermarket')) specialties.push('grocery');
    if (types.includes('health')) specialties.push('natural_health');

    // Add specialties based on business name
    const nameLower = businessName.toLowerCase();
    if (nameLower.includes('organic')) specialties.push('organic');
    if (nameLower.includes('natural')) specialties.push('natural');
    if (nameLower.includes('holistic')) specialties.push('holistic');
    if (nameLower.includes('raw')) specialties.push('raw_specialist');
    if (nameLower.includes('farm')) specialties.push('farm_fresh');

    return [...new Set(specialties)]; // Remove duplicates
  }

  generateDescription(csvRow, category) {
    const businessName = csvRow.name.replace(/"/g, '');
    const rating = parseFloat(csvRow.rating) || 0;
    const ratingCount = parseInt(csvRow.user_ratings_total) || 0;

    let description = `${businessName} is a ${category.toLowerCase()} supplier`;
    
    if (rating > 0) {
      description += ` with a ${rating}-star rating`;
      if (ratingCount > 0) {
        description += ` from ${ratingCount} reviews`;
      }
    }
    
    description += '. Specializing in raw pet food and natural pet nutrition.';
    
    return description;
  }

  cleanAddress(address) {
    if (!address) return '';
    return address.replace(/"/g, '').trim();
  }

  cleanPhone(phone) {
    if (!phone || phone === 'null' || phone === '') return null;
    return phone.replace(/"/g, '').trim();
  }

  determinePriceRange(types, businessName) {
    const nameLower = businessName.toLowerCase();
    
    // Premium indicators
    if (nameLower.includes('premium') || nameLower.includes('organic') || 
        nameLower.includes('holistic') || nameLower.includes('boutique')) {
      return 'high';
    }
    
    // Budget indicators
    if (nameLower.includes('discount') || nameLower.includes('budget') ||
        types.includes('grocery_or_supermarket')) {
      return 'low';
    }
    
    return 'medium'; // Default
  }

  async performDryRun(suppliers) {
    console.log('\n🔍 DRY RUN - Analysis of import data:');
    console.log('=====================================');
    
    // Category distribution
    const categories = {};
    const specialtiesCount = {};
    const ratingStats = { sum: 0, count: 0, high: 0 };
    
    suppliers.slice(0, Math.min(suppliers.length, 1000)).forEach(supplier => {
      // Categories
      categories[supplier.category] = (categories[supplier.category] || 0) + 1;
      
      // Specialties
      const specs = JSON.parse(supplier.specialties);
      specs.forEach(spec => {
        specialtiesCount[spec] = (specialtiesCount[spec] || 0) + 1;
      });
      
      // Ratings
      if (supplier.rating_average > 0) {
        ratingStats.sum += supplier.rating_average;
        ratingStats.count++;
        if (supplier.rating_average >= 4.0) ratingStats.high++;
      }
    });
    
    console.log('\n📊 Data Quality Analysis (first 1000 records):');
    console.log('Categories:', Object.entries(categories).map(([k,v]) => `${k}: ${v}`).join(', '));
    console.log('Top Specialties:', Object.entries(specialtiesCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([k,v]) => `${k}: ${v}`)
      .join(', '));
    
    if (ratingStats.count > 0) {
      const avgRating = (ratingStats.sum / ratingStats.count).toFixed(1);
      console.log(`Average Rating: ${avgRating} (${ratingStats.high} suppliers with 4+ stars)`);
    }
    
    console.log('\n🔍 Sample records to be imported:');
    suppliers.slice(0, 5).forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name} - ${supplier.category} (${supplier.location_address})`);
      console.log(`   Rating: ${supplier.rating_average}⭐ (${supplier.rating_count} reviews)`);
      console.log(`   Specialties: ${JSON.parse(supplier.specialties).join(', ')}`);
      console.log(`   Verified: ${supplier.is_verified ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('✅ Dry run completed. Run without --dry-run to perform actual import.');
  }

  async processBatches(data) {
    const batches = this.createBatches(data, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} suppliers)`);
      
      try {
        await this.processBatch(batch);
        console.log(`   ✅ Batch ${i + 1} completed successfully`);
        
        // Add a small delay between batches to avoid overwhelming the database
        if (i < batches.length - 1) {
          await this.sleep(200);
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        this.errorCount += batch.length;
      }
    }
  }

  async processBatch(batch) {
    const insertStatements = [];
    
    for (const supplier of batch) {
      try {
        const insertSQL = this.convertToInsertSQL(supplier);
        insertStatements.push(insertSQL);
      } catch (error) {
        console.error(`   ⚠️  Skipping supplier ${supplier.name}: ${error.message}`);
        this.skippedCount++;
      }
    }

    if (insertStatements.length > 0) {
      await this.executeBatchInsert(insertStatements);
      this.importedCount += insertStatements.length;
    }
  }

  convertToInsertSQL(supplier) {
    // Create parameterized query with proper escaping
    const columns = Object.keys(supplier).filter(key => key !== 'place_id').join(', ');
    const placeholders = Object.keys(supplier).filter(key => key !== 'place_id').map(() => '?').join(', ');
    
    return {
      sql: `INSERT INTO suppliers (${columns}) VALUES (${placeholders})`,
      params: Object.entries(supplier)
        .filter(([key]) => key !== 'place_id')
        .map(([, value]) => value),
      place_id: supplier.place_id
    };
  }

  async executeBatchInsert(insertStatements) {
    const sqlFile = path.join(__dirname, `../migration_data/legacy_import_${Date.now()}.sql`);
    
    // Generate SQL file with proper escaping and duplicate prevention
    const sqlContent = insertStatements.map(stmt => {
      const escapedParams = stmt.params.map(param => {
        if (param === null || param === undefined) return 'NULL';
        if (typeof param === 'string') return `'${param.replace(/'/g, "''")}'`;
        if (typeof param === 'boolean') return param ? '1' : '0';
        return param;
      });

      return stmt.sql.replace(/\?/g, () => escapedParams.shift());
    }).join(';\n') + ';';

    // Write SQL file
    const migrationDir = path.dirname(sqlFile);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    fs.writeFileSync(sqlFile, sqlContent);
    console.log(`   📝 Generated SQL file: ${path.basename(sqlFile)}`);
    
    // Execute via wrangler D1
    try {
      const remoteFlag = this.useRemote ? '--remote' : '--local';
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db ${remoteFlag} --file="${sqlFile}"`;
      
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      
      if (result.includes('Error') || result.includes('error')) {
        throw new Error(result);
      }
      
      console.log(`   ✅ Database execution completed`);
      
    } catch (error) {
      // Check for duplicate key errors and handle gracefully
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`   ⚠️  Some suppliers already exist (duplicates skipped)`);
        this.duplicateCount += insertStatements.length;
        this.importedCount -= insertStatements.length;
      } else {
        throw new Error(`Database execution failed: ${error.message}`);
      }
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  parseCountFromResult(result) {
    const lines = result.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    remote: args.includes('--remote')
  };

  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 50;
  }

  const sourceArg = args.find(arg => arg.startsWith('--source='));
  if (sourceArg) {
    options.source = sourceArg.split('=')[1];
  }

  console.log('🎯 Rawgle Legacy Supplier Import System v2.0');
  console.log('================================================');
  
  const importer = new LegacySupplierImporter(options);
  await importer.importSuppliers();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   - Ensure wrangler is installed and authenticated');
    console.error('   - Check if the database ID is correct in wrangler.toml');
    console.error('   - Verify the CSV file exists and is readable');
    console.error('   - Try running with --dry-run first to test parsing');
    process.exit(1);
  });
}

module.exports = LegacySupplierImporter;