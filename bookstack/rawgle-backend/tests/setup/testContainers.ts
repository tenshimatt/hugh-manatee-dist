import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { logger } from '../../src/config/logger';

export class TestDatabase {
  private static instance: TestDatabase;
  private container?: StartedPostgreSqlContainer;
  private pool?: Pool;

  private constructor() {}

  public static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async start(): Promise<void> {
    if (this.container) {
      return; // Already started
    }

    logger.info('Starting PostgreSQL test container...');
    
    this.container = await new PostgreSqlContainer('postgres:14-alpine')
      .withDatabase('rawgle_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    const connectionString = this.container.getConnectionUri();
    
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    await this.pool.query('SELECT 1');
    logger.info('PostgreSQL test container started successfully');
  }

  async stop(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = undefined;
    }
    
    if (this.container) {
      await this.container.stop();
      this.container = undefined;
    }
    
    logger.info('PostgreSQL test container stopped');
  }

  async reset(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    // Drop all tables and recreate schema
    await this.pool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO test_user;
      GRANT ALL ON SCHEMA public TO public;
    `);

    await this.initializeSchema();
  }

  private async initializeSchema(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    // Create all required tables
    await this.createUsersTable();
    await this.createPetsTable();
    await this.createFeedingTables();
    await this.createBlogTables();
    await this.createStoreTables();
    await this.createAuthTables();
    await this.insertTestData();
  }

  private async createUsersTable(): Promise<void> {
    await this.pool!.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        account_type VARCHAR(20) DEFAULT 'user' CHECK (account_type IN ('user', 'business', 'admin')),
        paws_tokens INTEGER DEFAULT 100 CHECK (paws_tokens >= 0),
        level VARCHAR(20) DEFAULT 'Bronze',
        phone VARCHAR(20),
        date_of_birth DATE,
        location_address TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await this.pool!.query('CREATE INDEX idx_users_email ON users(email)');
    await this.pool!.query('CREATE INDEX idx_users_created_at ON users(created_at DESC)');
  }

  private async createPetsTable(): Promise<void> {
    await this.pool!.query(`
      CREATE TABLE pets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        species VARCHAR(50) NOT NULL DEFAULT 'dog',
        breed VARCHAR(100),
        age INTEGER CHECK (age >= 0),
        weight DECIMAL(5,2) CHECK (weight > 0),
        activity_level VARCHAR(20) DEFAULT 'moderate' CHECK (activity_level IN ('low', 'moderate', 'high')),
        dietary_restrictions TEXT[],
        health_conditions TEXT[],
        photo_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool!.query('CREATE INDEX idx_pets_user_id ON pets(user_id)');
    await this.pool!.query('CREATE INDEX idx_pets_species ON pets(species)');
  }

  private async createFeedingTables(): Promise<void> {
    // Feeding schedules
    await this.pool!.query(`
      CREATE TABLE feeding_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        meal_times TIME[] NOT NULL DEFAULT '{}',
        portion_size DECIMAL(5,2) NOT NULL CHECK (portion_size > 0),
        food_type VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Feeding entries
    await this.pool!.query(`
      CREATE TABLE feeding_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        schedule_id UUID REFERENCES feeding_schedules(id) ON DELETE SET NULL,
        fed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        portion_given DECIMAL(5,2) NOT NULL CHECK (portion_given > 0),
        food_type VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool!.query('CREATE INDEX idx_feeding_schedules_pet_id ON feeding_schedules(pet_id)');
    await this.pool!.query('CREATE INDEX idx_feeding_entries_pet_id ON feeding_entries(pet_id)');
    await this.pool!.query('CREATE INDEX idx_feeding_entries_fed_at ON feeding_entries(fed_at DESC)');
  }

  private async createBlogTables(): Promise<void> {
    // Blog categories
    await this.pool!.query(`
      CREATE TABLE blog_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Blog posts
    await this.pool!.query(`
      CREATE TABLE blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author VARCHAR(100) NOT NULL,
        category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
        tags TEXT[] DEFAULT '{}',
        featured BOOLEAN DEFAULT FALSE,
        published BOOLEAN DEFAULT TRUE,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool!.query('CREATE INDEX idx_blog_posts_slug ON blog_posts(slug)');
    await this.pool!.query('CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id)');
    await this.pool!.query('CREATE INDEX idx_blog_posts_featured ON blog_posts(featured)');
    await this.pool!.query('CREATE INDEX idx_blog_posts_published ON blog_posts(published)');
    await this.pool!.query('CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC)');
  }

  private async createStoreTables(): Promise<void> {
    await this.pool!.query(`
      CREATE TABLE stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(50) DEFAULT 'US',
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        website_url TEXT,
        store_type VARCHAR(100) NOT NULL,
        specialties TEXT[] DEFAULT '{}',
        price_range VARCHAR(20) DEFAULT 'moderate' CHECK (price_range IN ('budget', 'moderate', 'premium')),
        has_delivery BOOLEAN DEFAULT FALSE,
        has_curbside_pickup BOOLEAN DEFAULT FALSE,
        hours_monday VARCHAR(20),
        hours_tuesday VARCHAR(20),
        hours_wednesday VARCHAR(20),
        hours_thursday VARCHAR(20),
        hours_friday VARCHAR(20),
        hours_saturday VARCHAR(20),
        hours_sunday VARCHAR(20),
        rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
        review_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool!.query('CREATE INDEX idx_stores_location ON stores USING GIST (point(longitude, latitude))');
    await this.pool!.query('CREATE INDEX idx_stores_store_type ON stores(store_type)');
    await this.pool!.query('CREATE INDEX idx_stores_rating ON stores(rating DESC)');
    await this.pool!.query('CREATE INDEX idx_stores_is_active ON stores(is_active)');
  }

  private async createAuthTables(): Promise<void> {
    // Email verification tokens
    await this.pool!.query(`
      CREATE TABLE email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Password reset tokens
    await this.pool!.query(`
      CREATE TABLE password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool!.query('CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)');
    await this.pool!.query('CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)');
  }

  private async insertTestData(): Promise<void> {
    // Insert test user
    await this.pool!.query(`
      INSERT INTO users (id, name, email, password_hash, email_verified) 
      VALUES 
        ('11111111-1111-1111-1111-111111111111', 'Test User', 'test@example.com', '$2a$10$test.hash', true),
        ('22222222-2222-2222-2222-222222222222', 'Admin User', 'admin@example.com', '$2a$10$admin.hash', true)
    `);

    // Insert test categories
    await this.pool!.query(`
      INSERT INTO blog_categories (id, name, slug, description) 
      VALUES 
        ('33333333-3333-3333-3333-333333333333', 'Nutrition', 'nutrition', 'Pet nutrition guides'),
        ('44444444-4444-4444-4444-444444444444', 'Health', 'health', 'Pet health information')
    `);

    // Insert test blog posts
    await this.pool!.query(`
      INSERT INTO blog_posts (id, title, slug, content, author, category_id, featured) 
      VALUES 
        ('55555555-5555-5555-5555-555555555555', 'Test Post', 'test-post', 'Test content', 'Test Author', '33333333-3333-3333-3333-333333333333', true)
    `);

    // Insert test stores (with some real-world data similar to the 8,843 migrated records)
    await this.pool!.query(`
      INSERT INTO stores (id, name, address, city, state, zip_code, latitude, longitude, store_type, has_delivery) 
      VALUES 
        ('66666666-6666-6666-6666-666666666666', 'Test Pet Store', '123 Main St', 'New York', 'NY', '10001', 40.7589, -73.9851, 'pet_store', true),
        ('77777777-7777-7777-7777-777777777777', 'Healthy Paws Boutique', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 34.0522, -118.2437, 'specialty_store', false)
    `);
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return this.pool;
  }

  getConnectionUri(): string {
    if (!this.container) {
      throw new Error('Container not started');
    }
    return this.container.getConnectionUri();
  }
}