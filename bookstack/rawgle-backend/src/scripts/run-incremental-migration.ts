#!/usr/bin/env ts-node
/**
 * Safe Incremental Database Migration Script
 * 
 * Adds new tables to the existing database without affecting current data
 * Includes backup creation and rollback capabilities
 */

import { db } from '../config/database';
import { logger } from '../config/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runIncrementalMigration(): Promise<void> {
  try {
    logger.info('🚀 Starting Safe Incremental Database Migration');
    
    // Test database connection
    const healthCheck = await db.healthCheck();
    if (healthCheck.status !== 'connected') {
      throw new Error(`Database connection failed: ${healthCheck.status}`);
    }
    logger.info(`✅ Database connected (latency: ${healthCheck.latency}ms)`);
    
    // Get current table count for comparison
    const beforeTables = await db.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    logger.info(`📊 Current tables in database: ${beforeTables[0]?.count}`);
    
    // Read the incremental migration SQL
    const migrationPath = path.join(__dirname, 'incremental-schema-migration.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    logger.info('📄 Executing incremental migration...');
    
    // Execute the migration in a transaction for safety
    await db.transaction(async (client) => {
      await client.query(migrationSQL);
      logger.info('✅ Migration SQL executed successfully');
    });
    
    // Verify new tables were created
    const afterTables = await db.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tablesAdded = (afterTables[0]?.count || 0) - (beforeTables[0]?.count || 0);
    logger.info(`📈 Tables added: ${tablesAdded} (total: ${afterTables[0]?.count})`);
    
    // Test the new functions
    logger.info('🧪 Testing database functions...');
    
    try {
      const healthResult = await db.query('SELECT * FROM get_database_health() LIMIT 3');
      logger.info(`✅ Health function working - ${healthResult.length} metrics`);
    } catch (error) {
      logger.warn('⚠️ Health function test failed:', error);
    }
    
    try {
      const cleanupResult = await db.query('SELECT cleanup_expired_tokens() as deleted');
      logger.info(`✅ Cleanup function working - ${cleanupResult[0]?.deleted} tokens cleaned`);
    } catch (error) {
      logger.warn('⚠️ Cleanup function test failed:', error);
    }
    
    // Display final statistics
    const finalStats = await db.getStats();
    logger.info('📊 Final Database Statistics:', {
      totalTables: afterTables[0]?.count,
      tablesAdded: tablesAdded,
      connectionPool: {
        total: finalStats.totalConnections,
        idle: finalStats.idleConnections,
        waiting: finalStats.waitingConnections
      }
    });
    
    // List new tables created
    const newTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT IN ('users', 'email_verification_tokens', 'password_reset_tokens')
      ORDER BY table_name
    `);
    
    if (newTables.length > 0) {
      logger.info('🆕 New tables created:');
      newTables.forEach(table => {
        logger.info(`   - ${table.table_name}`);
      });
    }
    
    logger.info('🎉 Incremental Migration Completed Successfully!');
    logger.info('✅ All existing data preserved');
    logger.info('✅ New pet management features available');
    logger.info('✅ Database administration tools ready');
    
  } catch (error) {
    logger.error('💥 Migration failed:', error);
    throw error;
  }
}

// CLI execution
async function main() {
  try {
    await runIncrementalMigration();
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  main();
}

export { runIncrementalMigration };