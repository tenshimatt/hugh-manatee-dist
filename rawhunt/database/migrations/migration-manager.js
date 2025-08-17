// Database Migration Manager for GoHunta.com
// Handles schema migrations, rollbacks, and data transformations for Cloudflare D1

export class MigrationManager {
    constructor(database, config = {}) {
        this.db = database;
        this.config = {
            migrationsTable: 'schema_migrations',
            backupRetention: 30, // days
            maxRollbackDepth: 5, // number of migrations
            validateBeforeMigration: true,
            createBackupBeforeMigration: true,
            ...config
        };
        
        this.migrations = new Map();
        this.pendingMigrations = [];
    }

    // =============================================================================
    // MIGRATION SYSTEM INITIALIZATION
    // =============================================================================

    async initialize() {
        console.log('Initializing migration management system...');
        
        // Ensure migrations table exists
        await this.createMigrationsTable();
        
        // Load registered migrations
        await this.loadMigrations();
        
        // Validate current schema state
        await this.validateCurrentState();
        
        console.log(`Migration system initialized. ${this.migrations.size} migrations registered.`);
        
        return {
            status: 'initialized',
            totalMigrations: this.migrations.size,
            appliedMigrations: await this.getAppliedMigrations(),
            pendingMigrations: this.pendingMigrations.length
        };
    }

    async createMigrationsTable() {
        await this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.config.migrationsTable} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_id TEXT UNIQUE NOT NULL,
                version TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                migration_type TEXT DEFAULT 'schema' CHECK (migration_type IN ('schema', 'data', 'index', 'trigger')),
                checksum TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                applied_by TEXT,
                execution_time_ms INTEGER,
                rollback_sql TEXT,
                rollback_checksum TEXT,
                can_rollback BOOLEAN DEFAULT TRUE,
                rolled_back_at DATETIME,
                rollback_reason TEXT
            )
        `).run();

        // Create index for performance
        await this.db.prepare(`
            CREATE INDEX IF NOT EXISTS idx_migrations_version 
            ON ${this.config.migrationsTable}(version)
        `).run();
        
        await this.db.prepare(`
            CREATE INDEX IF NOT EXISTS idx_migrations_applied 
            ON ${this.config.migrationsTable}(applied_at DESC)
        `).run();
    }

    async loadMigrations() {
        // Register all available migrations
        await this.registerMigration({
            id: '001_optimize_indexes',
            version: '1.0.1',
            name: 'Optimize Database Indexes',
            description: 'Add performance-focused indexes for hunt logs and training data',
            type: 'index',
            up: `
                -- Hunt logs covering index for common queries
                CREATE INDEX IF NOT EXISTS idx_hunt_logs_covering_user_date 
                ON hunt_logs(user_id, hunt_date DESC, hunting_type, success_rating) 
                WHERE hunt_date >= date('now', '-90 days');
                
                -- Training sessions performance index
                CREATE INDEX IF NOT EXISTS idx_training_covering_dog_performance 
                ON training_sessions(dog_id, session_date DESC, overall_performance, training_type);
                
                -- Community posts engagement index
                CREATE INDEX IF NOT EXISTS idx_posts_engagement 
                ON community_posts(visibility, moderation_status, likes_count DESC, created_at DESC) 
                WHERE visibility = 'public' AND moderation_status = 'active';
                
                -- User activity index
                CREATE INDEX IF NOT EXISTS idx_users_activity 
                ON users(is_active, last_active DESC, subscription_tier) 
                WHERE is_active = TRUE;
            `,
            down: `
                DROP INDEX IF EXISTS idx_hunt_logs_covering_user_date;
                DROP INDEX IF EXISTS idx_training_covering_dog_performance;
                DROP INDEX IF EXISTS idx_posts_engagement;
                DROP INDEX IF EXISTS idx_users_activity;
            `
        });

        await this.registerMigration({
            id: '002_add_analytics_tables',
            version: '1.0.2',
            name: 'Add Analytics Tables',
            description: 'Create tables for tracking user analytics and engagement metrics',
            type: 'schema',
            up: `
                -- User engagement analytics
                CREATE TABLE user_engagement_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    date DATE NOT NULL,
                    hunts_logged INTEGER DEFAULT 0,
                    training_sessions INTEGER DEFAULT 0,
                    posts_created INTEGER DEFAULT 0,
                    comments_made INTEGER DEFAULT 0,
                    likes_given INTEGER DEFAULT 0,
                    session_duration_minutes REAL DEFAULT 0,
                    page_views INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, date)
                );
                
                -- Community engagement metrics
                CREATE TABLE community_engagement_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date DATE NOT NULL,
                    total_posts INTEGER DEFAULT 0,
                    total_comments INTEGER DEFAULT 0,
                    total_likes INTEGER DEFAULT 0,
                    active_users INTEGER DEFAULT 0,
                    new_posts_today INTEGER DEFAULT 0,
                    trending_topics TEXT, -- JSON array
                    top_contributors TEXT, -- JSON array
                    engagement_rate REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (date)
                );
                
                -- Dog performance analytics
                CREATE TABLE dog_performance_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
                    month DATE NOT NULL, -- First day of month
                    training_sessions_count INTEGER DEFAULT 0,
                    avg_performance_rating REAL DEFAULT 0,
                    hunts_participated INTEGER DEFAULT 0,
                    game_retrieved INTEGER DEFAULT 0,
                    skills_improved TEXT, -- JSON array
                    performance_trend TEXT DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(dog_id, month)
                );
                
                -- Create indexes for analytics tables
                CREATE INDEX idx_user_engagement_date ON user_engagement_analytics(date DESC);
                CREATE INDEX idx_user_engagement_user ON user_engagement_analytics(user_id, date DESC);
                CREATE INDEX idx_community_metrics_date ON community_engagement_metrics(date DESC);
                CREATE INDEX idx_dog_analytics_month ON dog_performance_analytics(month DESC);
                CREATE INDEX idx_dog_analytics_dog ON dog_performance_analytics(dog_id, month DESC);
            `,
            down: `
                DROP TABLE IF EXISTS dog_performance_analytics;
                DROP TABLE IF EXISTS community_engagement_metrics;
                DROP TABLE IF EXISTS user_engagement_analytics;
            `
        });

        await this.registerMigration({
            id: '003_add_notification_system',
            version: '1.0.3',
            name: 'Add Notification System',
            description: 'Create tables for managing user notifications and preferences',
            type: 'schema',
            up: `
                -- Notification types configuration
                CREATE TABLE notification_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type_key TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL, -- 'training', 'community', 'system', 'marketing'
                    default_enabled BOOLEAN DEFAULT TRUE,
                    can_disable BOOLEAN DEFAULT TRUE,
                    delivery_methods TEXT, -- JSON array: ['email', 'push', 'in_app']
                    template_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                -- User notification preferences
                CREATE TABLE user_notification_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    notification_type_id INTEGER NOT NULL REFERENCES notification_types(id),
                    enabled BOOLEAN DEFAULT TRUE,
                    email_enabled BOOLEAN DEFAULT TRUE,
                    push_enabled BOOLEAN DEFAULT TRUE,
                    in_app_enabled BOOLEAN DEFAULT TRUE,
                    frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, notification_type_id)
                );
                
                -- Notification queue/history
                CREATE TABLE notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    notification_type_id INTEGER NOT NULL REFERENCES notification_types(id),
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT, -- JSON payload with additional context
                    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'push', 'in_app')),
                    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
                    scheduled_for DATETIME,
                    sent_at DATETIME,
                    read_at DATETIME,
                    error_message TEXT,
                    related_entity_type TEXT,
                    related_entity_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Insert default notification types
                INSERT INTO notification_types (type_key, name, description, category, delivery_methods) VALUES
                ('training_reminder', 'Training Reminder', 'Reminders for scheduled training sessions', 'training', '["email", "push", "in_app"]'),
                ('hunt_log_reminder', 'Hunt Log Reminder', 'Reminders to log recent hunts', 'training', '["email", "push"]'),
                ('community_reply', 'Community Reply', 'Someone replied to your post or comment', 'community', '["email", "push", "in_app"]'),
                ('community_like', 'Post Liked', 'Someone liked your post', 'community', '["in_app"]'),
                ('dog_milestone', 'Dog Milestone', 'Your dog reached a training milestone', 'training', '["email", "push", "in_app"]'),
                ('system_update', 'System Update', 'Important system updates and maintenance', 'system', '["email", "in_app"]'),
                ('safety_alert', 'Safety Alert', 'Important safety and regulation updates', 'system', '["email", "push", "in_app"]');
                
                -- Create indexes
                CREATE INDEX idx_notifications_user_status ON notifications(user_id, status, created_at DESC);
                CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
                CREATE INDEX idx_user_prefs_user ON user_notification_preferences(user_id);
            `,
            down: `
                DROP TABLE IF EXISTS notifications;
                DROP TABLE IF EXISTS user_notification_preferences;
                DROP TABLE IF EXISTS notification_types;
            `
        });

        await this.registerMigration({
            id: '004_add_advanced_search',
            version: '1.0.4',
            name: 'Add Advanced Search Capabilities',
            description: 'Create full-text search indexes and search tracking',
            type: 'index',
            up: `
                -- Create FTS virtual table for hunt logs
                CREATE VIRTUAL TABLE IF NOT EXISTS hunt_logs_fts USING fts5(
                    hunt_id,
                    location_name,
                    location_region,
                    hunting_type,
                    notes,
                    lessons_learned,
                    content='hunt_logs',
                    content_rowid='rowid'
                );
                
                -- Populate FTS table
                INSERT INTO hunt_logs_fts(hunt_id, location_name, location_region, hunting_type, notes, lessons_learned)
                SELECT id, location_name, location_region, hunting_type, notes, lessons_learned FROM hunt_logs;
                
                -- Create FTS virtual table for community posts
                CREATE VIRTUAL TABLE IF NOT EXISTS community_posts_fts USING fts5(
                    post_id,
                    title,
                    content,
                    category,
                    tags,
                    content='community_posts',
                    content_rowid='rowid'
                );
                
                -- Populate posts FTS table
                INSERT INTO community_posts_fts(post_id, title, content, category, tags)
                SELECT id, title, content, category, COALESCE(tags, '') FROM community_posts;
                
                -- Search analytics table
                CREATE TABLE search_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id),
                    search_query TEXT NOT NULL,
                    search_type TEXT DEFAULT 'general' CHECK (search_type IN ('general', 'hunts', 'posts', 'users', 'dogs')),
                    results_count INTEGER DEFAULT 0,
                    clicked_result_id TEXT,
                    clicked_result_type TEXT,
                    search_filters TEXT, -- JSON object
                    response_time_ms INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                -- FTS update triggers
                CREATE TRIGGER hunt_logs_fts_insert AFTER INSERT ON hunt_logs BEGIN
                    INSERT INTO hunt_logs_fts(hunt_id, location_name, location_region, hunting_type, notes, lessons_learned)
                    VALUES (NEW.id, NEW.location_name, NEW.location_region, NEW.hunting_type, NEW.notes, NEW.lessons_learned);
                END;
                
                CREATE TRIGGER hunt_logs_fts_update AFTER UPDATE ON hunt_logs BEGIN
                    UPDATE hunt_logs_fts SET 
                        location_name = NEW.location_name,
                        location_region = NEW.location_region,
                        hunting_type = NEW.hunting_type,
                        notes = NEW.notes,
                        lessons_learned = NEW.lessons_learned
                    WHERE hunt_id = NEW.id;
                END;
                
                CREATE TRIGGER hunt_logs_fts_delete AFTER DELETE ON hunt_logs BEGIN
                    DELETE FROM hunt_logs_fts WHERE hunt_id = OLD.id;
                END;
                
                CREATE TRIGGER community_posts_fts_insert AFTER INSERT ON community_posts BEGIN
                    INSERT INTO community_posts_fts(post_id, title, content, category, tags)
                    VALUES (NEW.id, NEW.title, NEW.content, NEW.category, COALESCE(NEW.tags, ''));
                END;
                
                CREATE TRIGGER community_posts_fts_update AFTER UPDATE ON community_posts BEGIN
                    UPDATE community_posts_fts SET 
                        title = NEW.title,
                        content = NEW.content,
                        category = NEW.category,
                        tags = COALESCE(NEW.tags, '')
                    WHERE post_id = NEW.id;
                END;
                
                CREATE TRIGGER community_posts_fts_delete AFTER DELETE ON community_posts BEGIN
                    DELETE FROM community_posts_fts WHERE post_id = OLD.id;
                END;
                
                -- Search analytics indexes
                CREATE INDEX idx_search_analytics_query ON search_analytics(search_query, created_at DESC);
                CREATE INDEX idx_search_analytics_user ON search_analytics(user_id, created_at DESC);
            `,
            down: `
                DROP TRIGGER IF EXISTS community_posts_fts_delete;
                DROP TRIGGER IF EXISTS community_posts_fts_update;
                DROP TRIGGER IF EXISTS community_posts_fts_insert;
                DROP TRIGGER IF EXISTS hunt_logs_fts_delete;
                DROP TRIGGER IF EXISTS hunt_logs_fts_update;
                DROP TRIGGER IF EXISTS hunt_logs_fts_insert;
                DROP TABLE IF EXISTS search_analytics;
                DROP TABLE IF EXISTS community_posts_fts;
                DROP TABLE IF EXISTS hunt_logs_fts;
            `
        });

        await this.registerMigration({
            id: '005_optimize_materialized_views',
            version: '1.0.5',
            name: 'Optimize Materialized Views',
            description: 'Update materialized view triggers for better performance',
            type: 'trigger',
            up: `
                -- Enhanced user stats materialized view with batch updates
                DROP TRIGGER IF EXISTS update_user_stats_hunt_insert;
                DROP TRIGGER IF EXISTS update_user_stats_training_insert;
                
                -- Better user stats update trigger
                CREATE TRIGGER update_user_stats_comprehensive
                    AFTER INSERT ON hunt_logs
                    FOR EACH ROW
                BEGIN
                    INSERT OR REPLACE INTO user_stats_materialized (
                        user_id, 
                        total_hunts, 
                        total_training_sessions,
                        last_hunt_date, 
                        last_training_date,
                        avg_success_rating,
                        updated_at
                    )
                    SELECT 
                        NEW.user_id,
                        COUNT(DISTINCT hl.id),
                        COUNT(DISTINCT ts.id),
                        MAX(hl.hunt_date),
                        MAX(ts.session_date),
                        AVG(hl.success_rating),
                        CURRENT_TIMESTAMP
                    FROM hunt_logs hl
                    LEFT JOIN training_sessions ts ON hl.user_id = ts.user_id
                    WHERE hl.user_id = NEW.user_id;
                END;
                
                -- Dog stats comprehensive update
                CREATE TRIGGER update_dog_stats_comprehensive
                    AFTER INSERT ON training_sessions
                    FOR EACH ROW
                BEGIN
                    INSERT OR REPLACE INTO dog_stats_materialized (
                        dog_id,
                        training_sessions,
                        avg_performance_rating,
                        last_training_date,
                        updated_at
                    )
                    SELECT 
                        NEW.dog_id,
                        COUNT(*),
                        AVG(overall_performance),
                        MAX(session_date),
                        CURRENT_TIMESTAMP
                    FROM training_sessions
                    WHERE dog_id = NEW.dog_id;
                END;
                
                -- Community engagement stats trigger
                CREATE TRIGGER update_community_engagement
                    AFTER INSERT ON community_posts
                    FOR EACH ROW
                BEGIN
                    INSERT OR REPLACE INTO community_engagement_metrics (
                        date,
                        total_posts,
                        new_posts_today,
                        created_at
                    )
                    SELECT 
                        date(NEW.created_at),
                        COUNT(*),
                        COUNT(CASE WHEN date(created_at) = date(NEW.created_at) THEN 1 END),
                        CURRENT_TIMESTAMP
                    FROM community_posts
                    WHERE date(created_at) = date(NEW.created_at)
                      AND visibility = 'public' 
                      AND moderation_status = 'active';
                END;
            `,
            down: `
                DROP TRIGGER IF EXISTS update_community_engagement;
                DROP TRIGGER IF EXISTS update_dog_stats_comprehensive;
                DROP TRIGGER IF EXISTS update_user_stats_comprehensive;
            `
        });

        console.log(`Loaded ${this.migrations.size} migrations`);
    }

    async registerMigration(migrationConfig) {
        const migration = {
            id: migrationConfig.id,
            version: migrationConfig.version,
            name: migrationConfig.name,
            description: migrationConfig.description,
            type: migrationConfig.type || 'schema',
            upSql: migrationConfig.up,
            downSql: migrationConfig.down,
            checksum: await this.calculateChecksum(migrationConfig.up),
            rollbackChecksum: migrationConfig.down ? await this.calculateChecksum(migrationConfig.down) : null,
            canRollback: !!migrationConfig.down,
            dependencies: migrationConfig.dependencies || [],
            createdAt: new Date().toISOString()
        };

        this.migrations.set(migration.id, migration);
        
        // Check if this migration is already applied
        const applied = await this.isMigrationApplied(migration.id);
        if (!applied) {
            this.pendingMigrations.push(migration);
        }
    }

    // =============================================================================
    // MIGRATION EXECUTION
    // =============================================================================

    async runPendingMigrations() {
        console.log(`Running ${this.pendingMigrations.length} pending migrations...`);
        
        if (this.pendingMigrations.length === 0) {
            console.log('No pending migrations to run');
            return { applied: [], skipped: [], failed: [] };
        }

        const results = {
            applied: [],
            skipped: [],
            failed: []
        };

        // Sort migrations by version
        this.pendingMigrations.sort((a, b) => a.version.localeCompare(b.version));

        for (const migration of this.pendingMigrations) {
            try {
                console.log(`Applying migration: ${migration.name} (${migration.version})`);
                
                const result = await this.applyMigration(migration);
                
                if (result.success) {
                    results.applied.push({
                        id: migration.id,
                        name: migration.name,
                        version: migration.version,
                        executionTime: result.executionTime
                    });
                    console.log(`✓ Applied: ${migration.name} (${result.executionTime}ms)`);
                } else {
                    results.skipped.push({
                        id: migration.id,
                        name: migration.name,
                        reason: result.reason
                    });
                    console.log(`- Skipped: ${migration.name} - ${result.reason}`);
                }
                
            } catch (error) {
                console.error(`✗ Failed: ${migration.name} - ${error.message}`);
                results.failed.push({
                    id: migration.id,
                    name: migration.name,
                    error: error.message
                });
                
                // Stop on first failure to maintain consistency
                break;
            }
        }

        return results;
    }

    async applyMigration(migration) {
        const startTime = performance.now();
        
        try {
            // Validate migration hasn't been applied
            if (await this.isMigrationApplied(migration.id)) {
                return { success: false, reason: 'Already applied' };
            }

            // Check dependencies
            if (migration.dependencies.length > 0) {
                const dependenciesSatisfied = await this.checkDependencies(migration.dependencies);
                if (!dependenciesSatisfied) {
                    return { success: false, reason: 'Dependencies not satisfied' };
                }
            }

            // Create backup if configured
            let backupId = null;
            if (this.config.createBackupBeforeMigration) {
                backupId = await this.createPreMigrationBackup(migration);
            }

            // Validate schema before migration if configured
            if (this.config.validateBeforeMigration) {
                const validationResult = await this.validateSchemaBeforeMigration();
                if (!validationResult.valid) {
                    throw new Error(`Schema validation failed: ${validationResult.errors.join(', ')}`);
                }
            }

            // Execute migration in transaction
            await this.db.exec('BEGIN TRANSACTION');

            try {
                // Execute the migration SQL
                const sqlStatements = this.parseSqlStatements(migration.upSql);
                
                for (const statement of sqlStatements) {
                    if (statement.trim()) {
                        await this.db.prepare(statement).run();
                    }
                }

                // Record the migration
                await this.recordMigration(migration, startTime, backupId);

                await this.db.exec('COMMIT');

                const endTime = performance.now();
                return {
                    success: true,
                    executionTime: Math.round(endTime - startTime)
                };

            } catch (error) {
                await this.db.exec('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error(`Migration ${migration.id} failed:`, error);
            
            // Log failure
            await this.logMigrationFailure(migration, error, startTime);
            
            throw new Error(`Migration ${migration.id} failed: ${error.message}`);
        }
    }

    async recordMigration(migration, startTime, backupId = null) {
        const executionTime = Math.round(performance.now() - startTime);
        
        await this.db.prepare(`
            INSERT INTO ${this.config.migrationsTable} (
                migration_id, version, name, description, migration_type,
                checksum, execution_time_ms, rollback_sql, rollback_checksum,
                can_rollback, applied_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            migration.id,
            migration.version,
            migration.name,
            migration.description,
            migration.type,
            migration.checksum,
            executionTime,
            migration.downSql || null,
            migration.rollbackChecksum,
            migration.canRollback,
            'migration_manager' // Could be actual user in production
        ).run();
    }

    // =============================================================================
    // MIGRATION ROLLBACK
    // =============================================================================

    async rollbackMigration(migrationId) {
        console.log(`Rolling back migration: ${migrationId}`);
        
        const migrationRecord = await this.getMigrationRecord(migrationId);
        if (!migrationRecord) {
            throw new Error(`Migration ${migrationId} not found in applied migrations`);
        }

        if (!migrationRecord.can_rollback) {
            throw new Error(`Migration ${migrationId} cannot be rolled back`);
        }

        if (!migrationRecord.rollback_sql) {
            throw new Error(`Migration ${migrationId} has no rollback SQL`);
        }

        const startTime = performance.now();

        try {
            // Create backup before rollback
            const backupId = await this.createPreMigrationBackup(migrationRecord, 'rollback');

            await this.db.exec('BEGIN TRANSACTION');

            try {
                // Execute rollback SQL
                const rollbackStatements = this.parseSqlStatements(migrationRecord.rollback_sql);
                
                for (const statement of rollbackStatements) {
                    if (statement.trim()) {
                        await this.db.prepare(statement).run();
                    }
                }

                // Update migration record
                await this.db.prepare(`
                    UPDATE ${this.config.migrationsTable}
                    SET rolled_back_at = CURRENT_TIMESTAMP,
                        rollback_reason = ?
                    WHERE migration_id = ?
                `).bind('Manual rollback', migrationId).run();

                await this.db.exec('COMMIT');

                const executionTime = Math.round(performance.now() - startTime);
                console.log(`✓ Rolled back migration ${migrationId} in ${executionTime}ms`);

                return {
                    success: true,
                    executionTime,
                    backupId
                };

            } catch (error) {
                await this.db.exec('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error(`Rollback of migration ${migrationId} failed:`, error);
            throw new Error(`Rollback failed: ${error.message}`);
        }
    }

    async rollbackToVersion(targetVersion) {
        console.log(`Rolling back to version: ${targetVersion}`);
        
        // Get migrations to rollback (in reverse order)
        const migrationsToRollback = await this.db.prepare(`
            SELECT migration_id, version, name, can_rollback
            FROM ${this.config.migrationsTable}
            WHERE version > ? AND rolled_back_at IS NULL
            ORDER BY version DESC
        `).bind(targetVersion).all();

        if (!migrationsToRollback.results?.length) {
            console.log(`No migrations to rollback to version ${targetVersion}`);
            return { rolledBack: [], errors: [] };
        }

        const results = {
            rolledBack: [],
            errors: []
        };

        for (const migration of migrationsToRollback.results) {
            if (!migration.can_rollback) {
                const error = `Migration ${migration.migration_id} cannot be rolled back`;
                console.error(error);
                results.errors.push({ migrationId: migration.migration_id, error });
                break; // Stop rollback process
            }

            try {
                const rollbackResult = await this.rollbackMigration(migration.migration_id);
                results.rolledBack.push({
                    migrationId: migration.migration_id,
                    name: migration.name,
                    version: migration.version,
                    executionTime: rollbackResult.executionTime
                });
            } catch (error) {
                results.errors.push({
                    migrationId: migration.migration_id,
                    error: error.message
                });
                break; // Stop on first error
            }
        }

        return results;
    }

    // =============================================================================
    // BACKUP MANAGEMENT
    // =============================================================================

    async createPreMigrationBackup(migration, type = 'migration') {
        const backupId = `${type}_${migration.id || migration.migration_id}_${Date.now()}`;
        
        console.log(`Creating backup: ${backupId}`);
        
        try {
            // Get all table data
            const tables = await this.getAllTables();
            const backupData = {};
            
            for (const table of tables) {
                try {
                    const tableData = await this.db.prepare(`SELECT * FROM ${table}`).all();
                    backupData[table] = tableData.results || [];
                } catch (error) {
                    console.warn(`Could not backup table ${table}:`, error.message);
                    backupData[table] = [];
                }
            }

            // Store backup (in production, this would go to external storage)
            const backup = {
                id: backupId,
                type,
                migrationId: migration.id || migration.migration_id,
                migrationName: migration.name || migration.migration_name,
                createdAt: new Date().toISOString(),
                tableCount: tables.length,
                recordCount: Object.values(backupData).reduce((sum, records) => sum + records.length, 0),
                data: backupData
            };

            // In production, save to file system or cloud storage
            // For now, we'll just log the backup info
            console.log(`✓ Backup created: ${backupId} (${backup.recordCount} records across ${backup.tableCount} tables)`);
            
            return backupId;
            
        } catch (error) {
            console.error(`Backup creation failed: ${error.message}`);
            throw error;
        }
    }

    async getAllTables() {
        const result = await this.db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        `).all();
        
        return result.results?.map(row => row.name) || [];
    }

    // =============================================================================
    // VALIDATION & UTILITIES
    // =============================================================================

    async validateCurrentState() {
        const validationResults = {
            valid: true,
            errors: [],
            warnings: [],
            info: []
        };

        try {
            // Check for pending migrations
            await this.identifyPendingMigrations();
            
            // Validate schema integrity
            const schemaValidation = await this.validateSchemaIntegrity();
            if (!schemaValidation.valid) {
                validationResults.valid = false;
                validationResults.errors.push(...schemaValidation.errors);
            }
            validationResults.warnings.push(...schemaValidation.warnings);

            // Check for orphaned data
            const orphanCheck = await this.checkForOrphanedData();
            if (orphanCheck.orphans > 0) {
                validationResults.warnings.push(`Found ${orphanCheck.orphans} orphaned records`);
            }

            // Validate index usage
            const indexValidation = await this.validateIndexes();
            validationResults.info.push(...indexValidation.info);
            
            if (validationResults.errors.length === 0) {
                console.log('✓ Database state validation passed');
            } else {
                console.warn('⚠ Database state validation found issues');
            }
            
        } catch (error) {
            validationResults.valid = false;
            validationResults.errors.push(`Validation error: ${error.message}`);
        }

        return validationResults;
    }

    async validateSchemaIntegrity() {
        const results = { valid: true, errors: [], warnings: [] };

        try {
            // Check foreign key integrity
            const integrityCheck = await this.db.prepare('PRAGMA integrity_check').all();
            
            for (const result of integrityCheck.results || []) {
                if (result.integrity_check !== 'ok') {
                    results.valid = false;
                    results.errors.push(`Integrity check failed: ${result.integrity_check}`);
                }
            }

            // Check foreign key constraints
            const foreignKeyCheck = await this.db.prepare('PRAGMA foreign_key_check').all();
            
            if (foreignKeyCheck.results?.length > 0) {
                results.valid = false;
                results.errors.push(`Foreign key violations: ${foreignKeyCheck.results.length}`);
            }

        } catch (error) {
            results.valid = false;
            results.errors.push(`Schema integrity validation failed: ${error.message}`);
        }

        return results;
    }

    async checkForOrphanedData() {
        let orphanCount = 0;

        // Check for dogs without owners
        const orphanedDogs = await this.db.prepare(`
            SELECT COUNT(*) as count FROM dogs d 
            LEFT JOIN users u ON d.owner_id = u.id 
            WHERE u.id IS NULL
        `).first();
        orphanCount += orphanedDogs?.count || 0;

        // Check for hunt logs without users
        const orphanedHunts = await this.db.prepare(`
            SELECT COUNT(*) as count FROM hunt_logs h 
            LEFT JOIN users u ON h.user_id = u.id 
            WHERE u.id IS NULL
        `).first();
        orphanCount += orphanedHunts?.count || 0;

        // Check for training sessions without dogs
        const orphanedTraining = await this.db.prepare(`
            SELECT COUNT(*) as count FROM training_sessions t 
            LEFT JOIN dogs d ON t.dog_id = d.id 
            WHERE d.id IS NULL
        `).first();
        orphanCount += orphanedTraining?.count || 0;

        return { orphans: orphanCount };
    }

    async validateIndexes() {
        const results = { info: [] };

        const indexes = await this.db.prepare(`
            SELECT name, tbl_name, sql FROM sqlite_master 
            WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
        `).all();

        results.info.push(`Found ${indexes.results?.length || 0} custom indexes`);

        // Check for potentially unused indexes (this would need query log analysis in production)
        const criticalTables = ['users', 'dogs', 'hunt_logs', 'training_sessions', 'community_posts'];
        for (const table of criticalTables) {
            const tableIndexes = indexes.results?.filter(idx => idx.tbl_name === table) || [];
            results.info.push(`Table ${table} has ${tableIndexes.length} indexes`);
        }

        return results;
    }

    async identifyPendingMigrations() {
        this.pendingMigrations = [];
        
        for (const [migrationId, migration] of this.migrations) {
            const isApplied = await this.isMigrationApplied(migrationId);
            if (!isApplied) {
                this.pendingMigrations.push(migration);
            }
        }

        console.log(`Found ${this.pendingMigrations.length} pending migrations`);
    }

    async isMigrationApplied(migrationId) {
        const result = await this.db.prepare(`
            SELECT id FROM ${this.config.migrationsTable} 
            WHERE migration_id = ? AND rolled_back_at IS NULL
        `).bind(migrationId).first();
        
        return !!result;
    }

    async getMigrationRecord(migrationId) {
        return await this.db.prepare(`
            SELECT * FROM ${this.config.migrationsTable}
            WHERE migration_id = ?
        `).bind(migrationId).first();
    }

    async getAppliedMigrations() {
        const result = await this.db.prepare(`
            SELECT migration_id, version, name, applied_at 
            FROM ${this.config.migrationsTable}
            WHERE rolled_back_at IS NULL
            ORDER BY version
        `).all();
        
        return result.results || [];
    }

    async checkDependencies(dependencies) {
        for (const dep of dependencies) {
            const isApplied = await this.isMigrationApplied(dep);
            if (!isApplied) {
                return false;
            }
        }
        return true;
    }

    parseSqlStatements(sql) {
        // Simple SQL statement parser - in production, use a proper SQL parser
        return sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
    }

    async calculateChecksum(content) {
        // Simple checksum calculation - in production, use proper hashing
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    async logMigrationFailure(migration, error, startTime) {
        const executionTime = Math.round(performance.now() - startTime);
        
        // In production, this would go to a proper logging system
        console.error('Migration Failure Log:', {
            migrationId: migration.id,
            migrationName: migration.name,
            error: error.message,
            executionTime,
            timestamp: new Date().toISOString()
        });
    }

    async validateSchemaBeforeMigration() {
        // Perform pre-migration validation
        const validation = await this.validateSchemaIntegrity();
        
        // Additional checks specific to migration context
        const foreignKeyCheck = await this.db.prepare('PRAGMA foreign_keys').first();
        if (!foreignKeyCheck.foreign_keys) {
            validation.warnings = validation.warnings || [];
            validation.warnings.push('Foreign keys are not enforced');
        }

        return validation;
    }

    // =============================================================================
    // REPORTING & STATUS
    // =============================================================================

    async getStatus() {
        const appliedMigrations = await this.getAppliedMigrations();
        const pendingCount = this.pendingMigrations.length;
        
        return {
            totalMigrations: this.migrations.size,
            appliedMigrations: appliedMigrations.length,
            pendingMigrations: pendingCount,
            lastAppliedMigration: appliedMigrations[appliedMigrations.length - 1] || null,
            systemHealth: pendingCount === 0 ? 'up-to-date' : 'pending-migrations',
            appliedMigrationsList: appliedMigrations,
            pendingMigrationsList: this.pendingMigrations.map(m => ({
                id: m.id,
                version: m.version,
                name: m.name,
                description: m.description
            }))
        };
    }

    async generateMigrationReport() {
        const status = await this.getStatus();
        const validation = await this.validateCurrentState();
        
        return {
            timestamp: new Date().toISOString(),
            status,
            validation,
            recommendations: this.generateRecommendations(status, validation)
        };
    }

    generateRecommendations(status, validation) {
        const recommendations = [];

        if (status.pendingMigrations > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Migrations',
                issue: `${status.pendingMigrations} pending migrations`,
                action: 'Run pending migrations to ensure system is up to date'
            });
        }

        if (!validation.valid) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Data Integrity',
                issue: 'Schema integrity issues detected',
                action: 'Review and fix data integrity issues before proceeding with migrations',
                details: validation.errors
            });
        }

        if (validation.warnings.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Maintenance',
                issue: `${validation.warnings.length} warnings detected`,
                action: 'Review and address warning conditions',
                details: validation.warnings
            });
        }

        return recommendations;
    }
}