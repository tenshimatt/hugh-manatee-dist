// Test Database Helper
// Provides in-memory SQLite database for testing

export class TestDatabase {
  constructor() {
    this.db = null;
  }

  async setup() {
    // In a real implementation, this would use an in-memory SQLite database
    // For now, we'll mock the database interface
    this.db = new MockD1Database();
    await this.createTables();
  }

  async cleanup() {
    if (this.db) {
      await this.db.cleanup();
      this.db = null;
    }
  }

  async createTables() {
    // Create core tables for testing
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS platform_config (
        platform TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        features TEXT NOT NULL,
        theme TEXT NOT NULL,
        settings TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        platform TEXT DEFAULT 'rawgle',
        location TEXT,
        phone TEXT,
        experience_level TEXT DEFAULT 'beginner',
        subscription_tier TEXT DEFAULT 'free',
        subscription_expires TEXT,
        mfa_enabled INTEGER DEFAULT 0,
        mfa_secret TEXT,
        email_verified INTEGER DEFAULT 0,
        profile_completed INTEGER DEFAULT 0,
        onboarding_completed INTEGER DEFAULT 0,
        privacy_settings TEXT,
        preferences TEXT,
        avatar_url TEXT,
        bio TEXT,
        social_links TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT,
        deleted_at TEXT
      )
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        species TEXT DEFAULT 'dog',
        breed TEXT,
        birth_date TEXT,
        gender TEXT,
        weight_lbs REAL,
        weight_kg REAL,
        color_markings TEXT,
        registration_number TEXT,
        microchip_id TEXT,
        feeding_type TEXT,
        allergies TEXT,
        dietary_restrictions TEXT,
        feeding_schedule TEXT,
        hunting_style TEXT,
        training_level TEXT,
        energy_level INTEGER,
        health_records TEXT,
        vaccination_records TEXT,
        insurance_info TEXT,
        photos TEXT,
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert platform configurations
    await this.db.exec(`
      INSERT OR REPLACE INTO platform_config (platform, name, display_name, description, features, theme) VALUES
      ('rawgle', 'rawgle', 'Rawgle', 'Raw feeding community and marketplace', 
       '{"feeding_logs": true, "paws_rewards": true, "nft_profiles": true}',
       '{"primary_color": "#FF6B6B", "secondary_color": "#4ECDC4"}'),
      ('gohunta', 'gohunta', 'GoHunta', 'Hunting and gun dog community platform',
       '{"hunt_logs": true, "gps_tracking": true, "training_sessions": true}',
       '{"primary_color": "#FF7700", "secondary_color": "#228B22"}')
    `);
  }

  async query(sql, params = []) {
    return this.db.prepare(sql).bind(...params).first();
  }

  async execute(sql, params = []) {
    return this.db.prepare(sql).bind(...params).run();
  }

  async all(sql, params = []) {
    return this.db.prepare(sql).bind(...params).all();
  }
}

// Mock D1 Database for testing
class MockD1Database {
  constructor() {
    this.data = new Map();
    this.tables = new Map();
  }

  prepare(sql) {
    return new MockD1PreparedStatement(sql, this);
  }

  async exec(sql) {
    // Simple implementation for CREATE TABLE and INSERT statements
    if (sql.includes('CREATE TABLE')) {
      const tableName = this.extractTableName(sql);
      this.tables.set(tableName, []);
    }
    
    if (sql.includes('INSERT OR REPLACE') || sql.includes('INSERT INTO')) {
      // Handle INSERT statements
      this.handleInsert(sql);
    }
  }

  extractTableName(sql) {
    const match = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  handleInsert(sql) {
    // Simple INSERT handling for test data
    if (sql.includes('platform_config')) {
      // Handle platform config inserts
      this.data.set('platform_config_rawgle', {
        platform: 'rawgle',
        name: 'rawgle',
        display_name: 'Rawgle',
        features: '{"feeding_logs": true, "paws_rewards": true}',
        theme: '{"primary_color": "#FF6B6B"}'
      });
      this.data.set('platform_config_gohunta', {
        platform: 'gohunta',
        name: 'gohunta',
        display_name: 'GoHunta',
        features: '{"hunt_logs": true, "gps_tracking": true}',
        theme: '{"primary_color": "#FF7700"}'
      });
    }
  }

  async cleanup() {
    this.data.clear();
    this.tables.clear();
  }
}

class MockD1PreparedStatement {
  constructor(sql, db) {
    this.sql = sql;
    this.db = db;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async run() {
    if (this.sql.includes('INSERT INTO users')) {
      const userId = this.params[0];
      const userData = {
        id: userId,
        email: this.params[1],
        password_hash: this.params[2],
        name: this.params[3],
        location: this.params[4],
        platform: this.params[5],
        created_at: this.params[6],
        updated_at: this.params[7]
      };
      this.db.data.set(`user_${userId}`, userData);
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.includes('UPDATE users')) {
      // Handle user updates
      if (this.sql.includes('last_login')) {
        const userId = this.params[1];
        const user = this.db.data.get(`user_${userId}`);
        if (user) {
          user.last_login = this.params[0];
          this.db.data.set(`user_${userId}`, user);
        }
      }
      if (this.sql.includes('password_hash')) {
        const userId = this.params[2];
        const user = this.db.data.get(`user_${userId}`);
        if (user) {
          user.password_hash = this.params[0];
          user.updated_at = this.params[1];
          this.db.data.set(`user_${userId}`, user);
        }
      }
      return { success: true, meta: { changes: 1 } };
    }

    return { success: true, meta: { changes: 0 } };
  }

  async first() {
    if (this.sql.includes('SELECT * FROM platform_config')) {
      const platform = this.params[0];
      return this.db.data.get(`platform_config_${platform}`);
    }

    if (this.sql.includes('SELECT id FROM users WHERE email')) {
      const email = this.params[0];
      for (const [key, user] of this.db.data.entries()) {
        if (key.startsWith('user_') && user.email === email) {
          return { id: user.id };
        }
      }
      return null;
    }

    if (this.sql.includes('SELECT') && this.sql.includes('FROM users WHERE email')) {
      const email = this.params[0];
      for (const [key, user] of this.db.data.entries()) {
        if (key.startsWith('user_') && user.email === email && !user.deleted_at) {
          return user;
        }
      }
      return null;
    }

    if (this.sql.includes('SELECT') && this.sql.includes('FROM users WHERE id')) {
      const userId = this.params[0];
      const user = this.db.data.get(`user_${userId}`);
      return user && !user.deleted_at ? user : null;
    }

    if (this.sql.includes('SELECT password_hash FROM users')) {
      const userId = this.params[0];
      const user = this.db.data.get(`user_${userId}`);
      return user ? { password_hash: user.password_hash } : null;
    }

    return null;
  }

  async all() {
    const results = [];
    
    if (this.sql.includes('SELECT') && this.sql.includes('FROM users')) {
      for (const [key, user] of this.db.data.entries()) {
        if (key.startsWith('user_') && !user.deleted_at) {
          results.push(user);
        }
      }
    }

    return { results };
  }
}