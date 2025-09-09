#!/usr/bin/env ts-node
/**
 * Database Initialization Script for Raw Pet Food Platform Phase 1 MVP
 * 
 * This script initializes the complete database schema with all tables,
 * indexes, triggers, and sample data required for the MVP launch.
 */

import { db, initDatabase } from '../config/database';
import { logger } from '../config/logger';

async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting Database Initialization for Phase 1 MVP');
    
    // Test database connection first
    logger.info('Testing database connection...');
    const healthCheck = await db.healthCheck();
    
    if (healthCheck.status !== 'connected') {
      throw new Error(`Database connection failed: ${healthCheck.status}`);
    }
    
    logger.info(`✅ Database connected successfully (latency: ${healthCheck.latency}ms)`);
    
    // Initialize comprehensive schema
    await initDatabase();
    
    // Verify critical tables exist
    logger.info('Verifying table creation...');
    await verifyTables();
    
    // Insert sample data for development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Inserting sample development data...');
      await insertSampleData();
    }
    
    // Display database statistics
    await displayStats();
    
    logger.info('🎉 Database initialization completed successfully!');
    logger.info('📊 Phase 1 MVP schema is ready for authentication, pets, suppliers, reviews, blog, and AI chat features');
    
  } catch (error) {
    logger.error('💥 Database initialization failed:', error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

async function verifyTables(): Promise<void> {
  const expectedTables = [
    'users', 'pets', 'feeding_entries', 'weight_tracking', 'health_records',
    'suppliers', 'reviews', 'chat_conversations', 'chat_messages', 
    'blog_articles', 'blog_comments', 'paws_transactions', 'notifications',
    'user_sessions', 'email_verification_tokens', 'password_reset_tokens'
  ];
  
  for (const table of expectedTables) {
    try {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result[0]?.exists) {
        logger.info(`✅ Table '${table}' created successfully`);
      } else {
        logger.warn(`⚠️  Table '${table}' not found`);
      }
    } catch (error) {
      logger.error(`❌ Error checking table '${table}':`, error);
    }
  }
}

async function insertSampleData(): Promise<void> {
  try {
    // Check if sample data already exists
    const existingUsers = await db.query(`SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com'`);
    if (existingUsers[0]?.count > 0) {
      logger.info('Sample data already exists, skipping insertion');
      return;
    }
    
    // Insert sample users
    await db.query(`
      INSERT INTO users (name, email, email_verified, password_hash, account_type, paws_tokens, level) VALUES
      ('John Doe', 'john@example.com', true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe', 'user', 150, 'Bronze'),
      ('Jane Smith', 'jane@example.com', true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe', 'user', 250, 'Silver'),
      ('Local Pet Store', 'store@example.com', true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYa1Vk8HN8wXXXe', 'business', 500, 'Gold')
    `);
    
    // Get user IDs for sample pets
    const users = await db.query(`SELECT id, name FROM users WHERE email LIKE '%@example.com' LIMIT 2`);
    
    if (users.length >= 2) {
      const [user1, user2] = users;
      
      // Insert sample pets
      await db.query(`
        INSERT INTO pets (user_id, name, species, breed, age_years, weight_lbs, weight_kg, gender, activity_level) VALUES
        ($1, 'Buddy', 'dog', 'Golden Retriever', 3, 65.0, 29.5, 'male', 'high'),
        ($1, 'Luna', 'dog', 'Border Collie', 2, 45.0, 20.4, 'female', 'very_high'),
        ($2, 'Max', 'dog', 'German Shepherd', 5, 80.0, 36.3, 'male', 'moderate')
      `, [user1.id, user2.id]);
      
      // Insert sample supplier
      await db.query(`
        INSERT INTO suppliers (name, description, address, city, state, zip_code, latitude, longitude, supplier_type, product_categories, verified) VALUES
        ('Raw Pet Foods Plus', 'Premium raw pet food supplier with locally sourced ingredients', '123 Pet Street', 'San Francisco', 'CA', '94102', 37.7749, -122.4194, 'retail', ARRAY['raw_food', 'supplements', 'treats'], true)
      `);
      
      logger.info('✅ Sample development data inserted successfully');
    }
    
  } catch (error) {
    logger.warn('⚠️  Failed to insert sample data:', error);
  }
}

async function displayStats(): Promise<void> {
  try {
    const stats = await db.getStats();
    logger.info('📊 Database Connection Pool Stats:', {
      totalConnections: stats.totalConnections,
      idleConnections: stats.idleConnections,
      waitingConnections: stats.waitingConnections
    });
    
    // Count tables
    const tableCount = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    logger.info(`📋 Total tables created: ${tableCount[0]?.count || 0}`);
    
  } catch (error) {
    logger.warn('Could not retrieve database stats:', error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as initDatabaseScript };