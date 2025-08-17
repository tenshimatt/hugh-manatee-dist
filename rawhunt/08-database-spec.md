# GoHunta.com - Database Specification

## Database Architecture Overview

GoHunta.com uses Cloudflare D1 SQLite as the primary database, optimized for edge computing and mobile-first performance. The schema is designed to handle complex relationships between users, dogs, hunts, training sessions, and community interactions while maintaining strict data integrity and performance.

## Core Database Design Principles

```
Design Principles:
1. Offline-first compatibility (SQLite sync capabilities)
2. Edge computing optimization (minimal latency)
3. Mobile device constraints (efficient storage)
4. Strong data integrity (foreign keys, constraints)
5. Privacy by design (data minimization, encryption)
6. Performance-first indexing (query optimization)
7. Audit trail completeness (full history tracking)
8. Geographic data efficiency (spatial indexing)
```

## Database Schema Design

### Core Entity Relationships

```sql
-- User Management Schema
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    hunting_license TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro', 'business')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    privacy_settings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    deleted_at DATETIME
);

-- Dog Profile Schema with Hunting-Specific Fields
CREATE TABLE dogs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    weight_lbs REAL,
    color_markings TEXT,
    registration_number TEXT,
    hunting_style TEXT CHECK (hunting_style IN ('pointing', 'flushing', 'retrieving', 'tracking', 'coursing')),
    training_level TEXT CHECK (training_level IN ('puppy', 'started', 'seasoned', 'finished', 'master')) DEFAULT 'puppy',
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    health_records JSON,
    vaccination_records JSON,
    microchip_id TEXT,
    insurance_info JSON,
    photos JSON,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hunt Logging Schema with GPS and Weather Data
CREATE TABLE hunt_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hunt_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    location_name TEXT NOT NULL,
    location_coordinates TEXT, -- Encrypted GPS coordinates
    location_region TEXT, -- General region for privacy
    weather_conditions JSON, -- Temperature, wind, precipitation, etc.
    terrain_type TEXT,
    public_private TEXT CHECK (public_private IN ('public', 'private', 'guided')),
    land_permission TEXT,
    hunting_type TEXT CHECK (hunting_type IN ('upland', 'waterfowl', 'big_game', 'small_game', 'training')),
    dogs_present JSON, -- Array of dog IDs
    companions JSON, -- Other hunters present
    equipment_used JSON,
    gps_route JSON, -- Encrypted route data
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    conditions_rating INTEGER CHECK (conditions_rating BETWEEN 1 AND 5),
    notes TEXT,
    photos JSON,
    shared_publicly BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game Harvest Tracking
CREATE TABLE game_harvested (
    id TEXT PRIMARY KEY,
    hunt_log_id TEXT NOT NULL REFERENCES hunt_logs(id) ON DELETE CASCADE,
    species TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    location_gps TEXT, -- Encrypted specific harvest location
    time_harvested TIME,
    dog_retrieved_by TEXT REFERENCES dogs(id),
    weight_lbs REAL,
    field_dressed BOOLEAN DEFAULT FALSE,
    photos JSON,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training Session Schema
CREATE TABLE training_sessions (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    location TEXT,
    weather_conditions JSON,
    trainer_name TEXT,
    exercise_type TEXT NOT NULL,
    skills_practiced JSON, -- Array of skill types
    equipment_used JSON,
    performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    improvements_noted TEXT,
    challenges TEXT,
    next_session_goals TEXT,
    videos JSON,
    photos JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training Goals and Progress Tracking
CREATE TABLE training_goals (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL, -- pointing, retrieving, steadiness, etc.
    target_skill TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    current_level INTEGER CHECK (current_level BETWEEN 1 AND 5) DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Database Testing Framework

### Schema Validation Tests

#### Positive Test Cases
```gherkin
Feature: Database Schema Integrity

Scenario: User creation with valid data
  Given valid user registration data
  When user record is inserted
  Then user is created successfully
  And all constraints are satisfied
  And timestamps are set correctly
  And default values are applied
  And related records can be created

Scenario: Dog profile creation with relationships
  Given an existing user
  And valid dog profile data
  When dog record is inserted
  Then dog profile is created successfully
  And foreign key relationship is established
  And hunting-specific fields are validated
  And training level defaults are applied
  And JSON fields are properly formatted

Scenario: Hunt log with complex relationships
  Given an existing user with dogs
  And hunt log data with GPS coordinates
  When hunt log is created
  Then hunt log is saved successfully
  And dog relationships are established
  And GPS data is encrypted properly
  And weather data is stored as JSON
  And privacy settings are respected
```

#### Negative Test Cases
```gherkin
Scenario: Invalid foreign key relationship
  Given hunt log data with non-existent user ID
  When attempting to insert hunt log
  Then foreign key constraint violation occurs
  And insertion is rejected
  And error message is descriptive
  And database integrity is maintained
  And transaction is rolled back

Scenario: Invalid check constraint data
  Given user data with invalid experience level
  When attempting to insert user
  Then check constraint violation occurs
  And insertion fails with appropriate error
  And valid constraint values are indicated
  And data integrity is preserved
  And no partial data is stored

Scenario: JSON field validation failure
  Given dog profile with malformed health records JSON
  When attempting to save profile
  Then JSON validation fails
  And descriptive error is returned
  And valid JSON format is indicated
  And existing data remains unchanged
  And transaction consistency is maintained
```

#### Step Classes (Schema Testing)
```typescript
// schema-testing-steps.ts
export class SchemaTestingSteps {
  private db: D1Database;

  constructor(database: D1Database) {
    this.db = database;
  }

  async testUserCreation() {
    const validUser = {
      id: 'user_test_123',
      email: 'test.hunter@example.com',
      password_hash: '$2b$10$encrypted_password_hash',
      name: 'Test Hunter',
      location: 'Montana, USA',
      experience_level: 'intermediate',
      subscription_tier: 'premium'
    };

    const result = await this.db
      .prepare('INSERT INTO users (id, email, password_hash, name, location, experience_level, subscription_tier) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(validUser.id, validUser.email, validUser.password_hash, validUser.name, validUser.location, validUser.experience_level, validUser.subscription_tier)
      .run();

    expect(result.success).toBe(true);
    expect(result.meta.changes).toBe(1);

    // Verify user was created with defaults
    const createdUser = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(validUser.id)
      .first();

    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(validUser.email);
    expect(createdUser.mfa_enabled).toBe(0); // SQLite boolean false
    expect(createdUser.profile_completed).toBe(0);
    expect(createdUser.created_at).toBeDefined();
    expect(createdUser.updated_at).toBeDefined();

    return createdUser;
  }

  async testDogProfileCreation(userId: string) {
    const validDog = {
      id: 'dog_test_123',
      user_id: userId,
      name: 'Rex',
      breed: 'German Shorthaired Pointer',
      birth_date: '2020-05-15',
      gender: 'male',
      weight_lbs: 65.5,
      hunting_style: 'pointing',
      training_level: 'seasoned',
      energy_level: 4,
      health_records: JSON.stringify({
        last_vet_visit: '2024-01-15',
        vaccinations_current: true,
        known_allergies: []
      }),
      photos: JSON.stringify(['photo1.jpg', 'photo2.jpg'])
    };

    const result = await this.db
      .prepare(`INSERT INTO dogs (
        id, user_id, name, breed, birth_date, gender, weight_lbs, 
        hunting_style, training_level, energy_level, health_records, photos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        validDog.id, validDog.user_id, validDog.name, validDog.breed,
        validDog.birth_date, validDog.gender, validDog.weight_lbs,
        validDog.hunting_style, validDog.training_level, validDog.energy_level,
        validDog.health_records, validDog.photos
      )
      .run();

    expect(result.success).toBe(true);
    expect(result.meta.changes).toBe(1);

    // Verify foreign key relationship
    const createdDog = await this.db
      .prepare('SELECT * FROM dogs WHERE id = ?')
      .bind(validDog.id)
      .first();

    expect(createdDog).toBeDefined();
    expect(createdDog.user_id).toBe(userId);
    expect(createdDog.active).toBe(1); // Default true
    expect(JSON.parse(createdDog.health_records)).toHaveProperty('last_vet_visit');

    return createdDog;
  }

  async testForeignKeyConstraint() {
    const invalidDog = {
      id: 'dog_invalid_123',
      user_id: 'nonexistent_user',
      name: 'Invalid Dog',
      breed: 'Test Breed',
      hunting_style: 'pointing'
    };

    try {
      await this.db
        .prepare('INSERT INTO dogs (id, user_id, name, breed, hunting_style) VALUES (?, ?, ?, ?, ?)')
        .bind(invalidDog.id, invalidDog.user_id, invalidDog.name, invalidDog.breed, invalidDog.hunting_style)
        .run();
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('FOREIGN KEY constraint failed');
    }
  }

  async testCheckConstraintValidation() {
    const invalidUser = {
      id: 'user_invalid_123',
      email: 'invalid@example.com',
      password_hash: 'hash',
      name: 'Invalid User',
      experience_level: 'invalid_level' // Should fail check constraint
    };

    try {
      await this.db
        .prepare('INSERT INTO users (id, email, password_hash, name, experience_level) VALUES (?, ?, ?, ?, ?)')
        .bind(invalidUser.id, invalidUser.email, invalidUser.password_hash, invalidUser.name, invalidUser.experience_level)
        .run();
      
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.message).toContain('CHECK constraint failed');
    }
  }

  async testJSONFieldValidation() {
    const userId = await this.createTestUser();
    
    const dogWithInvalidJSON = {
      id: 'dog_json_test_123',
      user_id: userId,
      name: 'JSON Test Dog',
      breed: 'Test Breed',
      hunting_style: 'pointing',
      health_records: 'invalid json string' // Should be valid JSON
    };

    // Note: SQLite doesn't enforce JSON validation, but our application layer should
    const result = await this.db
      .prepare('INSERT INTO dogs (id, user_id, name, breed, hunting_style, health_records) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(dogWithInvalidJSON.id, dogWithInvalidJSON.user_id, dogWithInvalidJSON.name, 
            dogWithInvalidJSON.breed, dogWithInvalidJSON.hunting_style, dogWithInvalidJSON.health_records)
      .run();

    // Insertion succeeds but we should validate JSON at application level
    expect(result.success).toBe(true);

    // Test JSON validation function
    expect(this.isValidJSON(dogWithInvalidJSON.health_records)).toBe(false);
    expect(this.isValidJSON('{"valid": "json"}')).toBe(true);
  }

  private isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
```

## Database Performance Optimization

### Index Strategy

```sql
-- Primary Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_dogs_breed ON dogs(breed);
CREATE INDEX idx_dogs_hunting_style ON dogs(hunting_style);
CREATE INDEX idx_dogs_training_level ON dogs(training_level);
CREATE INDEX idx_dogs_active ON dogs(active);

CREATE INDEX idx_hunt_logs_user_id ON hunt_logs(user_id);
CREATE INDEX idx_hunt_logs_hunt_date ON hunt_logs(hunt_date);
CREATE INDEX idx_hunt_logs_location_region ON hunt_logs(location_region);
CREATE INDEX idx_hunt_logs_hunting_type ON hunt_logs(hunting_type);
CREATE INDEX idx_hunt_logs_shared_publicly ON hunt_logs(shared_publicly);
CREATE INDEX idx_hunt_logs_created_at ON hunt_logs(created_at);

CREATE INDEX idx_training_sessions_dog_id ON training_sessions(dog_id);
CREATE INDEX idx_training_sessions_session_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_exercise_type ON training_sessions(exercise_type);

CREATE INDEX idx_game_harvested_hunt_log_id ON game_harvested(hunt_log_id);
CREATE INDEX idx_game_harvested_species ON game_harvested(species);

CREATE INDEX idx_training_goals_dog_id ON training_goals(dog_id);
CREATE INDEX idx_training_goals_completed ON training_goals(completed);
CREATE INDEX idx_training_goals_target_date ON training_goals(target_date);

-- Composite Indexes for Common Queries
CREATE INDEX idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);
CREATE INDEX idx_dogs_user_active ON dogs(user_id, active);
CREATE INDEX idx_training_sessions_dog_date ON training_sessions(dog_id, session_date DESC);
```

### Query Performance Testing

#### Positive Test Cases
```gherkin
Feature: Database Query Performance

Scenario: Optimized user hunt history query
  Given database with 100,000 hunt logs
  When querying recent hunts for specific user
  Then query executes in under 50ms
  And proper indexes are utilized
  And result set is limited appropriately
  And pagination works efficiently
  And memory usage is controlled

Scenario: Dog performance analytics query
  Given dog with 500+ training sessions
  When calculating performance trends
  Then aggregation completes in under 100ms
  And statistical calculations are accurate
  And result includes trend analysis
  And query plan uses optimal indexes
  And memory footprint is minimal

Scenario: Community hunt discovery query
  Given location-based hunt sharing
  When searching for hunts in region
  Then spatial query performs efficiently
  And privacy filters are applied
  And results are sorted by relevance
  And pagination maintains performance
  And user permissions are enforced
```

#### Step Classes (Query Performance)
```typescript
// query-performance-steps.ts
export class QueryPerformanceSteps {
  private db: D1Database;

  async testUserHuntHistoryPerformance(userId: string) {
    const startTime = performance.now();
    
    const hunts = await this.db
      .prepare(`
        SELECT h.*, COUNT(g.id) as game_count
        FROM hunt_logs h
        LEFT JOIN game_harvested g ON h.id = g.hunt_log_id
        WHERE h.user_id = ?
        GROUP BY h.id
        ORDER BY h.hunt_date DESC
        LIMIT 20
      `)
      .bind(userId)
      .all();

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(50); // Under 50ms
    expect(hunts.results).toBeDefined();
    expect(hunts.results.length).toBeLessThanOrEqual(20);

    return { queryTime, resultCount: hunts.results.length };
  }

  async testDogPerformanceAnalytics(dogId: string) {
    const startTime = performance.now();

    const analytics = await this.db
      .prepare(`
        SELECT 
          AVG(performance_rating) as avg_performance,
          COUNT(*) as session_count,
          MAX(session_date) as last_session,
          exercise_type,
          COUNT(*) as exercise_count
        FROM training_sessions 
        WHERE dog_id = ? 
          AND session_date > date('now', '-6 months')
        GROUP BY exercise_type
        ORDER BY exercise_count DESC
      `)
      .bind(dogId)
      .all();

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(100); // Under 100ms
    expect(analytics.results).toBeDefined();

    // Verify analytics calculations
    analytics.results.forEach((result: any) => {
      expect(result.avg_performance).toBeGreaterThan(0);
      expect(result.avg_performance).toBeLessThanOrEqual(5);
      expect(result.session_count).toBeGreaterThan(0);
    });

    return { queryTime, analyticsData: analytics.results };
  }

  async testCommunityHuntDiscovery(region: string, userId: string) {
    const startTime = performance.now();

    const publicHunts = await this.db
      .prepare(`
        SELECT 
          h.id,
          h.hunt_date,
          h.location_name,
          h.location_region,
          h.hunting_type,
          h.success_rating,
          u.name as hunter_name,
          COUNT(g.id) as game_count
        FROM hunt_logs h
        JOIN users u ON h.user_id = u.id
        LEFT JOIN game_harvested g ON h.id = g.hunt_log_id
        WHERE h.shared_publicly = TRUE
          AND h.location_region = ?
          AND h.user_id != ?
          AND h.hunt_date > date('now', '-30 days')
        GROUP BY h.id
        ORDER BY h.hunt_date DESC, h.success_rating DESC
        LIMIT 50
      `)
      .bind(region, userId)
      .all();

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(150); // Under 150ms for complex query
    expect(publicHunts.results).toBeDefined();

    // Verify privacy enforcement
    publicHunts.results.forEach((hunt: any) => {
      expect(hunt.hunter_name).toBeDefined();
      expect(hunt.user_id).not.toBe(userId); // Shouldn't include user's own hunts
    });

    return { queryTime, huntCount: publicHunts.results.length };
  }

  async testQueryPlanOptimization() {
    const queries = [
      {
        name: 'user_hunts',
        sql: 'EXPLAIN QUERY PLAN SELECT * FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT 20',
        shouldUseIndex: 'idx_hunt_logs_user_date'
      },
      {
        name: 'dog_training',
        sql: 'EXPLAIN QUERY PLAN SELECT * FROM training_sessions WHERE dog_id = ? ORDER BY session_date DESC',
        shouldUseIndex: 'idx_training_sessions_dog_date'
      },
      {
        name: 'public_hunts',
        sql: 'EXPLAIN QUERY PLAN SELECT * FROM hunt_logs WHERE shared_publicly = TRUE AND location_region = ?',
        shouldUseIndex: 'idx_hunt_logs_shared_publicly'
      }
    ];

    for (const query of queries) {
      const plan = await this.db
        .prepare(query.sql)
        .bind('test_param')
        .all();

      const planText = plan.results.map((row: any) => row.detail).join(' ');
      
      // Verify index usage
      expect(planText).toContain('USING INDEX');
      expect(planText).not.toContain('SCAN TABLE');
      
      // Verify specific index is used if specified
      if (query.shouldUseIndex) {
        expect(planText).toContain(query.shouldUseIndex);
      }
    }
  }
}
```

## Data Migration and Versioning

### Database Migration Framework

```sql
-- Migration tracking table
CREATE TABLE migration_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    checksum TEXT
);

-- Example Migration: Add GPS accuracy tracking
-- Migration 001_add_gps_accuracy.sql
ALTER TABLE hunt_logs ADD COLUMN gps_accuracy_meters REAL;
CREATE INDEX idx_hunt_logs_gps_accuracy ON hunt_logs(gps_accuracy_meters);

-- Example Migration: Add community features
-- Migration 002_add_community_features.sql
CREATE TABLE community_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT,
    tags JSON,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES community_comments(id),
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_region ON community_posts(region);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
```

### Migration Testing

#### Step Classes (Migration Testing)
```typescript
// migration-testing-steps.ts
export class MigrationTestingSteps {
  private db: D1Database;

  async testMigrationExecution() {
    // Test migration from clean slate
    await this.setupCleanDatabase();
    
    const migrations = await this.getMigrationFiles();
    
    for (const migration of migrations) {
      const startTime = performance.now();
      
      await this.executeMigration(migration);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Verify migration was recorded
      const migrationRecord = await this.db
        .prepare('SELECT * FROM migration_history WHERE version = ?')
        .bind(migration.version)
        .first();
      
      expect(migrationRecord).toBeDefined();
      expect(migrationRecord.execution_time_ms).toBe(Math.round(executionTime));
    }
  }

  async testMigrationRollback() {
    // Test rollback capability for critical migrations
    const testMigration = {
      version: '001_test_rollback',
      up: 'ALTER TABLE users ADD COLUMN test_column TEXT;',
      down: 'ALTER TABLE users DROP COLUMN test_column;'
    };

    // Execute migration
    await this.executeMigrationSQL(testMigration.up);
    
    // Verify column exists
    const columnExists = await this.checkColumnExists('users', 'test_column');
    expect(columnExists).toBe(true);
    
    // Rollback migration
    await this.executeMigrationSQL(testMigration.down);
    
    // Verify column was removed
    const columnStillExists = await this.checkColumnExists('users', 'test_column');
    expect(columnStillExists).toBe(false);
  }

  async testDataIntegrityDuringMigration() {
    // Insert test data
    const testUserId = await this.createTestUser();
    const testDogId = await this.createTestDog(testUserId);
    
    // Execute migration that affects existing data
    const migrationSQL = `
      ALTER TABLE dogs ADD COLUMN training_notes TEXT;
      UPDATE dogs SET training_notes = 'Migrated from old system' WHERE training_notes IS NULL;
    `;
    
    await this.executeMigrationSQL(migrationSQL);
    
    // Verify data integrity
    const dog = await this.db
      .prepare('SELECT * FROM dogs WHERE id = ?')
      .bind(testDogId)
      .first();
    
    expect(dog.training_notes).toBe('Migrated from old system');
    
    // Verify foreign key relationships still work
    const hunt = await this.createTestHunt(testUserId, [testDogId]);
    expect(hunt).toBeDefined();
  }

  async testMigrationPerformance() {
    // Create large dataset
    await this.createLargeTestDataset();
    
    const performanceMigration = `
      CREATE INDEX idx_performance_test ON hunt_logs(user_id, hunt_date, success_rating);
    `;
    
    const startTime = performance.now();
    await this.executeMigrationSQL(performanceMigration);
    const endTime = performance.now();
    
    const migrationTime = endTime - startTime;
    
    // Migration should complete within reasonable time even with large dataset
    expect(migrationTime).toBeLessThan(5000); // Under 5 seconds
    
    // Verify index was created and improves query performance
    const queryTime = await this.measureQueryTime(`
      SELECT * FROM hunt_logs 
      WHERE user_id = 'test_user' 
        AND hunt_date > '2023-01-01' 
        AND success_rating >= 4
    `);
    
    expect(queryTime).toBeLessThan(100); // Under 100ms with new index
  }

  private async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    const tableInfo = await this.db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    
    return tableInfo.results.some((col: any) => col.name === columnName);
  }

  private async createLargeTestDataset() {
    const batchSize = 1000;
    const totalRecords = 50000;
    
    for (let i = 0; i < totalRecords; i += batchSize) {
      const values = [];
      
      for (let j = 0; j < batchSize && (i + j) < totalRecords; j++) {
        const index = i + j;
        values.push(`('hunt_${index}', 'user_${index % 100}', '2023-01-01', 'Location ${index}', ${1 + (index % 5)})`);
      }
      
      await this.db
        .prepare(`INSERT INTO hunt_logs (id, user_id, hunt_date, location_name, success_rating) VALUES ${values.join(', ')}`)
        .run();
    }
  }
}
```

## Data Privacy and Security

### Encryption Strategy

```sql
-- Sensitive data encryption functions (application layer)
-- GPS coordinates are encrypted before storage
-- Personal information has additional protection

-- Privacy-focused views for public data
CREATE VIEW public_hunt_summaries AS
SELECT 
    id,
    hunt_date,
    location_region, -- Not specific coordinates
    hunting_type,
    success_rating,
    CASE 
        WHEN user_id = ? THEN 'Your Hunt'
        ELSE 'Anonymous Hunter'
    END as hunter_name
FROM hunt_logs 
WHERE shared_publicly = TRUE
    AND deleted_at IS NULL;

-- Audit trail for sensitive operations
CREATE TABLE data_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    table_name TEXT NOT NULL,
    record_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    access_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Data Backup and Recovery

#### Step Classes (Backup Testing)
```typescript
// backup-recovery-steps.ts
export class BackupRecoverySteps {
  async testDatabaseBackup() {
    // Create test data
    const testUserId = await this.createTestUser();
    const testDogId = await this.createTestDog(testUserId);
    const testHuntId = await this.createTestHunt(testUserId, [testDogId]);

    // Perform backup
    const backupData = await this.createBackup();
    
    expect(backupData).toBeDefined();
    expect(backupData.users.length).toBeGreaterThan(0);
    expect(backupData.dogs.length).toBeGreaterThan(0);
    expect(backupData.hunt_logs.length).toBeGreaterThan(0);
    
    // Verify backup integrity
    const userBackup = backupData.users.find((u: any) => u.id === testUserId);
    expect(userBackup).toBeDefined();
    expect(userBackup.email).toBeDefined();
    
    // Verify sensitive data is properly handled
    expect(userBackup.password_hash).toBeUndefined(); // Should be excluded
  }

  async testDataRecovery() {
    // Create backup
    const originalData = await this.createTestDataset();
    const backupData = await this.createBackup();
    
    // Simulate data loss
    await this.clearDatabase();
    
    // Restore from backup
    await this.restoreFromBackup(backupData);
    
    // Verify restoration
    const restoredData = await this.getAllData();
    
    expect(restoredData.users.length).toBe(originalData.users.length);
    expect(restoredData.dogs.length).toBe(originalData.dogs.length);
    expect(restoredData.hunt_logs.length).toBe(originalData.hunt_logs.length);
    
    // Verify data integrity after restoration
    await this.verifyDataIntegrity();
  }

  async testPointInTimeRecovery() {
    const checkpoint1 = await this.createCheckpoint();
    
    // Add more data
    await this.createTestUser();
    await this.createTestUser();
    
    const checkpoint2 = await this.createCheckpoint();
    
    // Add even more data
    await this.createTestUser();
    
    // Restore to checkpoint2
    await this.restoreToCheckpoint(checkpoint2);
    
    // Verify correct state
    const userCount = await this.getUserCount();
    expect(userCount).toBe(checkpoint2.userCount);
  }
}
```

This database specification provides comprehensive coverage of schema design, performance optimization, migration strategies, and data protection measures essential for the GoHunta hunting platform.