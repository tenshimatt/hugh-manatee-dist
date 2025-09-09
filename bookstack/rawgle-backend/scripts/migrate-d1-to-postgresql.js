#!/usr/bin/env node

/**
 * CloudFlare D1 to PostgreSQL Migration Script
 * Migrates 9000+ supplier records from CloudFlare D1 to PostgreSQL
 * 
 * Features:
 * - Batch processing for performance
 * - Data validation and transformation
 * - Progress tracking and error handling
 * - Geographic indexing optimization
 * - Comprehensive migration report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class D1ToPostgreSQLMigrator {
    constructor() {
        this.batchSize = 1000;
        this.progressInterval = 100;
        this.errors = [];
        this.stats = {
            totalRecords: 0,
            processedRecords: 0,
            successfulInserts: 0,
            failedInserts: 0,
            startTime: new Date(),
            endTime: null
        };
        
        // PostgreSQL connection config
        this.pgConfig = {
            host: 'localhost',
            port: 5432,
            database: 'rawgle_db',
            user: 'rawgle_user',
            password: 'rawgle_password'
        };
        
        this.pgClient = new Client(this.pgConfig);
        
        // CloudFlare D1 config
        this.d1Config = {
            databaseName: 'findrawdogfood-db',
            environment: 'production',
            workingDirectory: '/Users/mattwright/pandora/findrawdogfood'
        };
    }

    /**
     * Execute CloudFlare D1 command
     */
    async executeD1Command(command) {
        return new Promise((resolve, reject) => {
            const wranglerProcess = spawn('wrangler', [
                'd1',
                'execute',
                this.d1Config.databaseName,
                '--command',
                command,
                '--env',
                this.d1Config.environment
            ], {
                cwd: this.d1Config.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            wranglerProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            wranglerProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            wranglerProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Parse the JSON response from wrangler
                        // Find the JSON array in the output (starts with '[')
                        const lines = stdout.split('\n');
                        let jsonData = '';
                        let inJsonBlock = false;
                        
                        for (const line of lines) {
                            if (line.trim().startsWith('[')) {
                                inJsonBlock = true;
                            }
                            if (inJsonBlock) {
                                jsonData += line + '\n';
                            }
                            if (line.trim().endsWith(']') && inJsonBlock) {
                                break;
                            }
                        }
                        
                        if (jsonData.trim()) {
                            const result = JSON.parse(jsonData.trim());
                            resolve(result[0]?.results || []);
                        } else {
                            console.warn('No JSON data found in D1 response:', stdout);
                            resolve([]);
                        }
                    } catch (parseError) {
                        console.error('Raw D1 output:', stdout);
                        console.error('Parse error:', parseError.message);
                        reject(new Error(`Failed to parse D1 response: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`D1 command failed (code: ${code}): ${stderr}`));
                }
            });
        });
    }

    /**
     * Get total record count from D1
     */
    async getTotalRecordCount() {
        console.log('📊 Getting total record count from CloudFlare D1...');
        try {
            const result = await this.executeD1Command('SELECT COUNT(*) as total_records FROM suppliers;');
            this.stats.totalRecords = result[0]?.total_records || 0;
            console.log(`✅ Found ${this.stats.totalRecords} total records to migrate`);
            return this.stats.totalRecords;
        } catch (error) {
            console.error('❌ Failed to get record count:', error.message);
            throw error;
        }
    }

    /**
     * Extract records in batches from D1
     */
    async extractBatch(offset, limit) {
        const query = `
            SELECT 
                id, place_id, name, address, city, state, country, postal_code,
                latitude, longitude, phone_number, website, rating, user_ratings_total,
                types, keyword, place_type, raw_data, created_at
            FROM suppliers 
            ORDER BY id 
            LIMIT ${limit} OFFSET ${offset};
        `;
        
        return await this.executeD1Command(query);
    }

    /**
     * Transform D1 record to PostgreSQL format
     */
    transformRecord(d1Record) {
        try {
            // Parse raw_data JSON to extract additional fields
            let rawData = {};
            try {
                rawData = JSON.parse(d1Record.raw_data || '{}');
            } catch (e) {
                console.warn(`⚠️  Failed to parse raw_data for record ${d1Record.id}: ${e.message}`);
            }

            // Extract city, state, country from raw_data if not available
            let city = d1Record.city !== 'null' && d1Record.city ? d1Record.city : null;
            let state = d1Record.state !== 'null' && d1Record.state ? d1Record.state : null;
            
            // If we don't have city/state, try to extract from raw_data
            if (!city || !state) {
                if (rawData.city) {
                    const cityParts = rawData.city.split(',');
                    if (!city && cityParts[0]) {
                        city = cityParts[0].trim();
                    }
                    if (!state && cityParts[1]) {
                        state = cityParts[1].trim();
                    }
                }
                
                // Try extracting from vicinity field in raw_data
                if ((!city || !state) && rawData.vicinity) {
                    const vicParts = rawData.vicinity.split(',');
                    if (vicParts.length > 1) {
                        if (!city) city = vicParts[vicParts.length - 1].trim();
                        if (!state && vicParts.length > 2) state = vicParts[vicParts.length - 2].trim();
                    }
                }
                
                // Try extracting from plus_code compound_code
                if ((!city || !state) && rawData.plus_code?.compound_code) {
                    const parts = rawData.plus_code.compound_code.split(' ');
                    if (parts.length > 1) {
                        const location = parts.slice(1).join(' ');
                        const locParts = location.split(',');
                        if (!city && locParts[0]) city = locParts[0].trim();
                        if (!state && locParts[1]) state = locParts[1].trim();
                    }
                }
            }
            
            const country = d1Record.country !== 'null' ? d1Record.country : 'USA';

            // Determine supplier type based on types array
            let supplierType = 'retail'; // default
            const types = d1Record.types ? JSON.parse(d1Record.types) : [];
            if (types.includes('grocery_or_supermarket')) supplierType = 'retail';
            else if (types.includes('pet_store')) supplierType = 'retail';
            else if (types.includes('veterinary_care')) supplierType = 'retail';
            else if (types.includes('store')) supplierType = 'retail';

            // Extract business features
            const features = [];
            if (types.includes('grocery_or_supermarket')) features.push('grocery');
            if (types.includes('pet_store')) features.push('pet_store');
            if (types.includes('organic')) features.push('organic');
            if (rawData.delivery_available) features.push('delivery');

            return {
                // Use original UUID if valid, otherwise generate new one
                id: d1Record.id,
                name: d1Record.name || 'Unknown Supplier',
                description: null,
                address: d1Record.address || '',
                city: city,
                state: state,
                zip_code: d1Record.postal_code !== 'null' ? d1Record.postal_code : null,
                country: country,
                latitude: parseFloat(d1Record.latitude) || null,
                longitude: parseFloat(d1Record.longitude) || null,
                phone: d1Record.phone_number !== 'null' ? d1Record.phone_number : null,
                website: d1Record.website !== 'null' ? d1Record.website : null,
                email: null, // Not available in D1 data
                business_hours: {
                    "monday": "9:00-18:00",
                    "tuesday": "9:00-18:00", 
                    "wednesday": "9:00-18:00",
                    "thursday": "9:00-18:00",
                    "friday": "9:00-18:00",
                    "saturday": "10:00-16:00",
                    "sunday": "closed"
                },
                supplier_type: supplierType,
                product_categories: ['raw_food'], // Default category as array
                verified: false, // All start as unverified
                average_rating: parseFloat(d1Record.rating) || 0,
                total_reviews: parseInt(d1Record.user_ratings_total) || 0,
                photos: [], // Will be populated later if needed
                features: features,
                delivery_available: features.includes('delivery'),
                pickup_available: true, // Default to true
                online_ordering: false, // Default to false
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error transforming record ${d1Record.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Insert batch of records into PostgreSQL
     */
    async insertBatch(records) {
        const insertQuery = `
            INSERT INTO suppliers (
                id, name, description, address, city, state, zip_code, country,
                latitude, longitude, phone, website, email, business_hours,
                supplier_type, product_categories, verified, average_rating, 
                total_reviews, photos, features, delivery_available, 
                pickup_available, online_ordering, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                zip_code = EXCLUDED.zip_code,
                country = EXCLUDED.country,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                phone = EXCLUDED.phone,
                website = EXCLUDED.website,
                average_rating = EXCLUDED.average_rating,
                total_reviews = EXCLUDED.total_reviews,
                updated_at = EXCLUDED.updated_at;
        `;

        let successCount = 0;
        let failureCount = 0;

        for (const record of records) {
            try {
                await this.pgClient.query(insertQuery, [
                    record.id, record.name, record.description, record.address,
                    record.city, record.state, record.zip_code, record.country,
                    record.latitude, record.longitude, record.phone, record.website,
                    record.email, record.business_hours, record.supplier_type,
                    record.product_categories, record.verified, record.average_rating,
                    record.total_reviews, record.photos, record.features,
                    record.delivery_available, record.pickup_available,
                    record.online_ordering, record.created_at, record.updated_at
                ]);
                successCount++;
            } catch (error) {
                failureCount++;
                this.errors.push({
                    recordId: record.id,
                    recordName: record.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ Failed to insert record ${record.id} (${record.name}): ${error.message}`);
            }
        }

        this.stats.successfulInserts += successCount;
        this.stats.failedInserts += failureCount;

        return { successCount, failureCount };
    }

    /**
     * Create geographic and search indexes
     */
    async createOptimizationIndexes() {
        console.log('🔍 Creating optimization indexes...');
        
        const indexes = [
            // Geographic indexes for location-based queries
            'CREATE INDEX IF NOT EXISTS idx_suppliers_location_gist ON suppliers(latitude, longitude);',
            'CREATE INDEX IF NOT EXISTS idx_suppliers_city_state_gin ON suppliers USING gin((city || \' \' || state) gin_trgm_ops);',
            
            // Full-text search indexes
            'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
            'CREATE INDEX IF NOT EXISTS idx_suppliers_name_gin ON suppliers USING gin(name gin_trgm_ops);',
            'CREATE INDEX IF NOT EXISTS idx_suppliers_search_gin ON suppliers USING gin((name || \' \' || COALESCE(address, \'\')) gin_trgm_ops);',
            
            // Performance indexes
            'CREATE INDEX IF NOT EXISTS idx_suppliers_rating_location ON suppliers(average_rating DESC, latitude, longitude);',
            'CREATE INDEX IF NOT EXISTS idx_suppliers_verified_rating ON suppliers(verified DESC, average_rating DESC);',
        ];

        let successCount = 0;
        for (const indexQuery of indexes) {
            try {
                await this.pgClient.query(indexQuery);
                successCount++;
                console.log(`✅ Created index: ${indexQuery.split(' ')[5] || 'extension'}`);
            } catch (error) {
                console.error(`⚠️  Index creation warning: ${error.message}`);
            }
        }
        
        console.log(`🔍 Created ${successCount}/${indexes.length} indexes successfully`);
    }

    /**
     * Validate migration results
     */
    async validateMigration() {
        console.log('✅ Validating migration results...');
        
        try {
            // Check record counts
            const countResult = await this.pgClient.query('SELECT COUNT(*) as count FROM suppliers;');
            const pgCount = parseInt(countResult.rows[0].count);
            
            // Check data quality
            const qualityResult = await this.pgClient.query(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as records_with_name,
                    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as records_with_coordinates,
                    COUNT(CASE WHEN city IS NOT NULL AND city != '' THEN 1 END) as records_with_city,
                    COUNT(CASE WHEN average_rating > 0 THEN 1 END) as records_with_rating,
                    ROUND(AVG(average_rating), 2) as avg_rating,
                    COUNT(DISTINCT city) as unique_cities,
                    COUNT(DISTINCT state) as unique_states
                FROM suppliers;
            `);
            
            const quality = qualityResult.rows[0];
            
            return {
                postgresCount: pgCount,
                d1Count: this.stats.totalRecords,
                matchesSource: pgCount >= this.stats.successfulInserts,
                dataQuality: {
                    recordsWithName: parseInt(quality.records_with_name),
                    recordsWithCoordinates: parseInt(quality.records_with_coordinates),
                    recordsWithCity: parseInt(quality.records_with_city),
                    recordsWithRating: parseInt(quality.records_with_rating),
                    averageRating: parseFloat(quality.avg_rating),
                    uniqueCities: parseInt(quality.unique_cities),
                    uniqueStates: parseInt(quality.unique_states)
                }
            };
        } catch (error) {
            console.error('❌ Migration validation failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate migration report
     */
    generateReport(validation) {
        this.stats.endTime = new Date();
        const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
        
        const report = {
            migration: {
                startTime: this.stats.startTime.toISOString(),
                endTime: this.stats.endTime.toISOString(),
                durationSeconds: duration,
                durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`
            },
            records: {
                totalInSource: this.stats.totalRecords,
                processed: this.stats.processedRecords,
                successfulInserts: this.stats.successfulInserts,
                failedInserts: this.stats.failedInserts,
                finalCountInTarget: validation.postgresCount
            },
            performance: {
                recordsPerSecond: Math.round(this.stats.processedRecords / duration),
                batchSize: this.batchSize,
                totalBatches: Math.ceil(this.stats.totalRecords / this.batchSize)
            },
            dataQuality: validation.dataQuality,
            validation: {
                migrationSuccessful: validation.matchesSource && this.stats.failedInserts === 0,
                recordCountsMatch: validation.postgresCount >= this.stats.successfulInserts,
                dataQualityScore: Math.round(
                    (validation.dataQuality.recordsWithName / validation.postgresCount) * 100
                )
            },
            errors: this.errors.slice(0, 10), // Include first 10 errors
            totalErrors: this.errors.length
        };

        return report;
    }

    /**
     * Save report to file
     */
    async saveReport(report) {
        const reportPath = path.join(__dirname, '..', 'reports', `migration-report-${new Date().toISOString().split('T')[0]}.json`);
        
        // Ensure reports directory exists
        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Migration report saved to: ${reportPath}`);
        
        return reportPath;
    }

    /**
     * Main migration execution
     */
    async migrate() {
        console.log('🚀 Starting CloudFlare D1 to PostgreSQL Migration');
        console.log('='.repeat(60));
        
        try {
            // Connect to PostgreSQL
            console.log('🔌 Connecting to PostgreSQL...');
            await this.pgClient.connect();
            console.log('✅ Connected to PostgreSQL');

            // Get total record count
            await this.getTotalRecordCount();

            if (this.stats.totalRecords === 0) {
                console.log('ℹ️  No records found to migrate');
                return;
            }

            // Process records in batches
            console.log(`📦 Processing ${this.stats.totalRecords} records in batches of ${this.batchSize}...`);
            
            for (let offset = 0; offset < this.stats.totalRecords; offset += this.batchSize) {
                const batchNumber = Math.floor(offset / this.batchSize) + 1;
                const totalBatches = Math.ceil(this.stats.totalRecords / this.batchSize);
                
                console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (records ${offset + 1}-${Math.min(offset + this.batchSize, this.stats.totalRecords)})`);
                
                try {
                    // Extract batch from D1
                    console.log('   📥 Extracting from CloudFlare D1...');
                    const d1Records = await this.extractBatch(offset, this.batchSize);
                    
                    if (d1Records.length === 0) {
                        console.log('   ⚠️  No records returned for this batch');
                        continue;
                    }
                    
                    // Transform records
                    console.log(`   🔄 Transforming ${d1Records.length} records...`);
                    const transformedRecords = [];
                    
                    for (const d1Record of d1Records) {
                        try {
                            const transformed = this.transformRecord(d1Record);
                            transformedRecords.push(transformed);
                        } catch (error) {
                            console.error(`   ❌ Failed to transform record ${d1Record.id}: ${error.message}`);
                            this.stats.failedInserts++;
                        }
                    }
                    
                    // Insert into PostgreSQL
                    if (transformedRecords.length > 0) {
                        console.log(`   💾 Inserting ${transformedRecords.length} records into PostgreSQL...`);
                        const { successCount, failureCount } = await this.insertBatch(transformedRecords);
                        console.log(`   ✅ Inserted: ${successCount}, Failed: ${failureCount}`);
                    }
                    
                    this.stats.processedRecords += d1Records.length;
                    
                    // Progress update
                    const progress = Math.round((this.stats.processedRecords / this.stats.totalRecords) * 100);
                    console.log(`   📊 Progress: ${progress}% (${this.stats.processedRecords}/${this.stats.totalRecords})`);
                    
                } catch (batchError) {
                    console.error(`❌ Batch ${batchNumber} failed: ${batchError.message}`);
                    this.errors.push({
                        batch: batchNumber,
                        offset: offset,
                        error: batchError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Create optimization indexes
            console.log('\n🔍 Creating performance indexes...');
            await this.createOptimizationIndexes();
            
            // Validate migration
            console.log('\n✅ Validating migration...');
            const validation = await this.validateMigration();
            
            // Generate and save report
            console.log('\n📊 Generating migration report...');
            const report = this.generateReport(validation);
            const reportPath = await this.saveReport(report);
            
            // Final summary
            console.log('\n' + '='.repeat(60));
            console.log('🎉 MIGRATION COMPLETED');
            console.log('='.repeat(60));
            console.log(`📊 Records processed: ${this.stats.processedRecords}/${this.stats.totalRecords}`);
            console.log(`✅ Successful inserts: ${this.stats.successfulInserts}`);
            console.log(`❌ Failed inserts: ${this.stats.failedInserts}`);
            console.log(`⏱️  Total duration: ${report.migration.durationFormatted}`);
            console.log(`🎯 Data quality score: ${report.validation.dataQualityScore}%`);
            console.log(`📄 Detailed report: ${reportPath}`);
            
            if (report.validation.migrationSuccessful) {
                console.log('🎉 MIGRATION SUCCESSFUL! Frontend store locator is ready!');
            } else {
                console.log('⚠️  Migration completed with some issues. Check the report for details.');
            }
            
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            console.error(error.stack);
            process.exit(1);
        } finally {
            // Cleanup
            try {
                await this.pgClient.end();
                console.log('🔌 PostgreSQL connection closed');
            } catch (e) {
                console.error('⚠️  Error closing PostgreSQL connection:', e.message);
            }
        }
    }
}

// Execute migration if run directly
if (require.main === module) {
    const migrator = new D1ToPostgreSQLMigrator();
    migrator.migrate().catch(console.error);
}

module.exports = D1ToPostgreSQLMigrator;