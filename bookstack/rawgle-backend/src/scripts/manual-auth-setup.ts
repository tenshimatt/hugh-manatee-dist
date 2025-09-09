#!/usr/bin/env ts-node
/**
 * Manual Authentication Setup Script
 * 
 * Manually adds the required authentication fields to the existing users table
 */

import { db } from '../config/database';
import { logger } from '../config/logger';

async function setupAuthentication(): Promise<void> {
  try {
    logger.info('🔐 Setting up authentication enhancements...');
    
    // Create the enum type first
    logger.info('Creating user account type enum...');
    await db.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_account_type') THEN
              CREATE TYPE user_account_type AS ENUM ('user', 'business', 'admin');
          END IF;
      END
      $$;
    `);
    
    // Add new columns one by one
    logger.info('Adding authentication columns...');
    const columns = [
      'ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)',
      'ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)', 
      'ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE',
      'ADD COLUMN IF NOT EXISTS email_verification_token TEXT',
      'ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS password_reset_token TEXT',
      'ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1',
      'ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS last_login_ip INET',
      'ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW()'
    ];
    
    for (const column of columns) {
      await db.query(`ALTER TABLE users ${column}`);
    }
    
    // Update account_type to use the enum (handling existing data)
    logger.info('Updating account_type column...');
    await db.query(`
      UPDATE users SET account_type = 'admin' WHERE account_type = 'admin';
      UPDATE users SET account_type = 'business' WHERE account_type = 'business';
      UPDATE users SET account_type = 'user' WHERE account_type != 'admin' AND account_type != 'business';
    `);
    
    // Change the column type
    await db.query(`
      ALTER TABLE users 
      ALTER COLUMN account_type TYPE user_account_type 
      USING account_type::user_account_type
    `);
    
    // Migrate existing name field to first_name/last_name
    logger.info('Migrating name field to first_name/last_name...');
    const nameCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
      ) AS has_name_column
    `);
    
    if (nameCheck.rows[0].has_name_column) {
      await db.query(`
        UPDATE users 
        SET first_name = SPLIT_PART(name, ' ', 1),
            last_name = CASE 
                WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
                THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
                ELSE ''
            END
        WHERE first_name IS NULL AND name IS NOT NULL
      `);
      
      // Drop the old name column
      await db.query('ALTER TABLE users DROP COLUMN name');
      logger.info('✅ Migrated name field and dropped old column');
    }
    
    // Add indexes for performance
    logger.info('Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)',
      'CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type)',
      'CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0',
      'CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until) WHERE account_locked_until IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version)',
      'CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL'
    ];
    
    for (const index of indexes) {
      await db.query(index);
    }
    
    // Update existing admin user
    logger.info('Setting up admin user...');
    await db.query(`
      UPDATE users 
      SET first_name = 'System',
          last_name = 'Administrator',
          account_type = 'admin',
          email_verified = TRUE,
          token_version = 1
      WHERE email = 'admin@rawgle.com'
    `);
    
    // Create utility functions
    logger.info('Creating utility functions...');
    
    // Function to clean expired tokens
    await db.query(`
      CREATE OR REPLACE FUNCTION clean_expired_auth_tokens()
      RETURNS INTEGER AS $$
      DECLARE
          cleaned_count INTEGER := 0;
      BEGIN
          -- Clean expired email verification tokens
          UPDATE users 
          SET email_verification_token = NULL, 
              email_verification_expires = NULL 
          WHERE email_verification_expires < NOW() 
            AND email_verification_token IS NOT NULL;
          
          GET DIAGNOSTICS cleaned_count = ROW_COUNT;
          
          -- Clean expired password reset tokens
          UPDATE users 
          SET password_reset_token = NULL, 
              password_reset_expires = NULL 
          WHERE password_reset_expires < NOW() 
            AND password_reset_token IS NOT NULL;
          
          GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
          
          -- Unlock accounts that have passed their lock time
          UPDATE users 
          SET account_locked_until = NULL 
          WHERE account_locked_until < NOW();
          
          GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
          
          RETURN cleaned_count;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Password change trigger
    await db.query(`
      CREATE OR REPLACE FUNCTION update_password_changed_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          IF OLD.password_hash != NEW.password_hash THEN
              NEW.password_changed_at = NOW();
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await db.query(`
      DROP TRIGGER IF EXISTS trigger_password_changed ON users;
      CREATE TRIGGER trigger_password_changed
          BEFORE UPDATE ON users
          FOR EACH ROW
          WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
          EXECUTE FUNCTION update_password_changed_timestamp();
    `);
    
    // Verify the enhanced schema
    logger.info('Verifying enhanced user table schema...');
    const schemaCheck = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    logger.info('✅ Enhanced User table schema:');
    schemaCheck.rows.forEach(row => {
      logger.info(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check admin user
    const adminCheck = await db.query(
      'SELECT id, email, first_name, last_name, account_type, email_verified FROM users WHERE email = $1',
      ['admin@rawgle.com']
    );
    
    if (adminCheck.rows.length > 0) {
      logger.info('✅ Admin user configured:', adminCheck.rows[0]);
    }
    
    logger.info('🎉 Authentication enhancement completed successfully!');
    
  } catch (error) {
    logger.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  setupAuthentication()
    .then(() => {
      logger.info('✅ Authentication setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Authentication setup script failed:', error);
      process.exit(1);
    });
}

export { setupAuthentication };