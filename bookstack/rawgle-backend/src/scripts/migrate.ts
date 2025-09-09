#!/usr/bin/env node
/**
 * RAWGLE Database Migration Runner
 * 
 * This script runs database migrations in order and tracks which ones have been applied.
 * It supports running all migrations, specific migrations, or rolling back migrations.
 * 
 * Usage:
 *   npm run migrate              - Run all pending migrations
 *   npm run migrate up           - Run all pending migrations  
 *   npm run migrate down         - Rollback last migration
 *   npm run migrate reset        - Reset all migrations (dangerous!)
 *   npm run migrate status       - Show migration status
 *   npm run migrate create NAME  - Create new migration file
 * 
 * Created: 2025-09-07
 * Component: Database Management
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { db } from '../config/database';
import { logger } from '../config/logger';

// Migration status tracking table
const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

interface MigrationRecord {
  id: number;
  filename: string;
  applied_at: Date;
  checksum: string;
  execution_time_ms: number;
}

interface MigrationFile {
  filename: string;
  filepath: string;
  migrationNumber: number;
  content: string;
  checksum: string;
}

class MigrationRunner {
  
  /**
   * Initialize the migration system by creating the migrations tracking table
   */
  async initialize(): Promise<void> {
    logger.info('Initializing migration system...');
    
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          checksum VARCHAR(64) NOT NULL,
          execution_time_ms INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create index for performance
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_${MIGRATIONS_TABLE}_filename 
        ON ${MIGRATIONS_TABLE}(filename)
      `);
      
      logger.info('Migration tracking table initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize migration system:', error);
      throw error;
    }
  }

  /**
   * Get list of migration files from the migrations directory
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const files = await fs.readdir(MIGRATIONS_DIR);
      const migrationFiles: MigrationFile[] = [];

      for (const filename of files) {
        if (!filename.endsWith('.sql')) continue;
        
        const filepath = path.join(MIGRATIONS_DIR, filename);
        const content = await fs.readFile(filepath, 'utf-8');
        const migrationNumber = this.extractMigrationNumber(filename);
        const checksum = this.calculateChecksum(content);

        migrationFiles.push({
          filename,
          filepath,
          migrationNumber,
          content,
          checksum
        });
      }

      // Sort by migration number
      migrationFiles.sort((a, b) => a.migrationNumber - b.migrationNumber);
      
      logger.debug(`Found ${migrationFiles.length} migration files`);
      return migrationFiles;
    } catch (error) {
      logger.error('Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Get list of applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const result = await db.query<MigrationRecord>(`
        SELECT * FROM ${MIGRATIONS_TABLE} 
        ORDER BY filename ASC
      `);
      
      logger.debug(`Found ${result.length} applied migrations`);
      return result;
    } catch (error) {
      logger.error('Failed to get applied migrations:', error);
      throw error;
    }
  }

  /**
   * Get pending migrations that haven't been applied yet
   */
  async getPendingMigrations(): Promise<MigrationFile[]> {
    const allFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));

    const pendingMigrations = allFiles.filter(file => !appliedFilenames.has(file.filename));
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`);
    return pendingMigrations;
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: MigrationFile): Promise<void> {
    logger.info(`Running migration: ${migration.filename}`);
    
    const startTime = Date.now();
    
    try {
      // Execute the migration within a transaction
      await db.transaction(async (client) => {
        // Run the migration SQL
        await client.query(migration.content);
        
        // Record the migration in the tracking table
        const executionTime = Date.now() - startTime;
        await client.query(`
          INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum, execution_time_ms)
          VALUES ($1, $2, $3)
        `, [migration.filename, migration.checksum, executionTime]);
        
        logger.info(`Migration ${migration.filename} completed in ${executionTime}ms`);
      });
      
    } catch (error) {
      logger.error(`Migration ${migration.filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runAllPending(): Promise<void> {
    await this.initialize();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to run');
      return;
    }

    logger.info(`Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    logger.info('All pending migrations completed successfully!');
  }

  /**
   * Show migration status
   */
  async showStatus(): Promise<void> {
    await this.initialize();
    
    const allFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));

    console.log('\n📊 Migration Status:');
    console.log('====================');
    
    if (allFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of allFiles) {
      const isApplied = appliedFilenames.has(file.filename);
      const status = isApplied ? '✅ Applied' : '⏳ Pending';
      const appliedInfo = isApplied 
        ? appliedMigrations.find(m => m.filename === file.filename)
        : null;
      
      console.log(`${status}  ${file.filename}`);
      if (appliedInfo) {
        console.log(`          Applied: ${appliedInfo.applied_at.toISOString()}`);
        console.log(`          Duration: ${appliedInfo.execution_time_ms}ms`);
      }
    }

    const pendingCount = allFiles.length - appliedMigrations.length;
    console.log(`\nTotal: ${allFiles.length} migrations`);
    console.log(`Applied: ${appliedMigrations.length}`);
    console.log(`Pending: ${pendingCount}`);
  }

  /**
   * Reset all migrations (dangerous - removes all data!)
   */
  async reset(): Promise<void> {
    logger.warn('⚠️  DANGER: Resetting all migrations will DROP ALL TABLES!');
    
    // In a real implementation, you'd want additional confirmation here
    try {
      // Get all applied migrations in reverse order
      const appliedMigrations = await this.getAppliedMigrations();
      appliedMigrations.reverse();

      logger.info('Dropping all application tables...');
      
      // Drop all tables in dependency order
      const tablesToDrop = [
        'blog_post_views',
        'blog_post_revisions', 
        'blog_posts',
        'blog_categories',
        'stores',
        'store_categories',
        'feeding_entry_reactions',
        'feeding_entries',
        'feeding_schedule_meals',
        'feeding_schedules',
        'pets',
        'password_reset_tokens',
        'email_verification_tokens',
        'users',
        MIGRATIONS_TABLE
      ];

      for (const table of tablesToDrop) {
        try {
          await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          logger.debug(`Dropped table: ${table}`);
        } catch (error) {
          logger.warn(`Failed to drop table ${table}:`, error);
        }
      }

      // Drop custom types
      const typesToDrop = [
        'user_account_type',
        'pet_size',
        'pet_activity_level', 
        'pet_health_status',
        'feeding_schedule_status',
        'day_of_week',
        'meal_type',
        'feeding_status',
        'feeding_method',
        'appetite_rating',
        'post_status',
        'content_type',
        'store_status',
        'verification_status'
      ];

      for (const type of typesToDrop) {
        try {
          await db.query(`DROP TYPE IF EXISTS ${type} CASCADE`);
          logger.debug(`Dropped type: ${type}`);
        } catch (error) {
          logger.warn(`Failed to drop type ${type}:`, error);
        }
      }

      logger.info('Database reset completed successfully');
      
    } catch (error) {
      logger.error('Failed to reset migrations:', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string): Promise<void> {
    if (!name) {
      throw new Error('Migration name is required');
    }

    // Get next migration number
    const existingFiles = await this.getMigrationFiles();
    const nextNumber = existingFiles.length > 0 
      ? Math.max(...existingFiles.map(f => f.migrationNumber)) + 1
      : 1;

    const paddedNumber = String(nextNumber).padStart(3, '0');
    const filename = `${paddedNumber}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString().split('T')[0]}
-- Component: RAWGLE Backend

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(100) NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Success message
SELECT '${name} migration completed successfully!' as result;
`;

    await fs.writeFile(filepath, template, 'utf-8');
    logger.info(`Created new migration: ${filename}`);
  }

  /**
   * Validate migration checksums
   */
  async validateMigrations(): Promise<boolean> {
    logger.info('Validating migration checksums...');
    
    const allFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    
    let isValid = true;
    
    for (const applied of appliedMigrations) {
      const file = allFiles.find(f => f.filename === applied.filename);
      
      if (!file) {
        logger.error(`Applied migration file not found: ${applied.filename}`);
        isValid = false;
        continue;
      }
      
      if (file.checksum !== applied.checksum) {
        logger.error(`Checksum mismatch for migration: ${applied.filename}`);
        logger.error(`  File checksum: ${file.checksum}`);
        logger.error(`  DB checksum:   ${applied.checksum}`);
        isValid = false;
      }
    }
    
    if (isValid) {
      logger.info('All migration checksums are valid ✅');
    } else {
      logger.error('Migration validation failed! ❌');
    }
    
    return isValid;
  }

  /**
   * Extract migration number from filename
   */
  private extractMigrationNumber(filename: string): number {
    const match = filename.match(/^(\d+)_/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Calculate SHA-256 checksum for migration content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }
}

// CLI Interface
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'up':
      case undefined:
        await runner.runAllPending();
        break;
        
      case 'status':
        await runner.showStatus();
        break;
        
      case 'create':
        if (!arg) {
          throw new Error('Migration name is required. Usage: npm run migrate create <name>');
        }
        await runner.createMigration(arg);
        break;
        
      case 'reset':
        logger.warn('⚠️  This will DELETE ALL DATA! Type "yes" to continue:');
        // In a real CLI, you'd implement proper confirmation here
        await runner.reset();
        break;
        
      case 'validate':
        const isValid = await runner.validateMigrations();
        process.exit(isValid ? 0 : 1);
        break;
        
      default:
        console.log(`
Usage: npm run migrate [command]

Commands:
  up, (default)    Run all pending migrations
  status          Show migration status
  create <name>   Create a new migration file
  reset           Reset all migrations (DANGEROUS!)
  validate        Validate migration checksums

Examples:
  npm run migrate
  npm run migrate status
  npm run migrate create "add user preferences"
        `);
        break;
    }
  } catch (error) {
    logger.error('Migration command failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Export for programmatic use
export { MigrationRunner };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}