#!/usr/bin/env ts-node
/**
 * Run Authentication Migration Script
 * 
 * Applies the enhanced authentication schema to the existing users table
 */

import { db } from '../config/database';
import { logger } from '../config/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runAuthMigration(): Promise<void> {
  try {
    logger.info('🔐 Starting authentication migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '002_enhance_users_authentication.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    logger.info('Executing authentication enhancement migration...');
    await db.query(migrationSQL);
    
    logger.info('✅ Authentication migration completed successfully!');
    
    // Verify the enhanced schema
    logger.info('Verifying enhanced user table schema...');
    const schemaCheck = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    logger.info('✅ User table schema:', {
      columns: schemaCheck.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
        default: row.column_default
      }))
    });
    
    // Check if admin user exists
    const adminCheck = await db.query(
      'SELECT id, email, first_name, last_name, account_type, email_verified FROM users WHERE email = $1',
      ['admin@rawgle.com']
    );
    
    if (adminCheck.rows.length > 0) {
      logger.info('✅ Admin user found:', {
        admin: adminCheck.rows[0]
      });
    } else {
      logger.warn('⚠️  Admin user not found');
    }
    
  } catch (error) {
    logger.error('❌ Authentication migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  runAuthMigration()
    .then(() => {
      logger.info('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runAuthMigration };