// Database Performance Testing Suite for GoHunta.com
// Comprehensive testing for Cloudflare D1 optimization
// Includes load testing, query performance, and stress testing

import { expect } from 'vitest';

export class DatabasePerformanceSuite {
    constructor(database, config = {}) {
        this.db = database;
        this.config = {
            maxExecutionTime: config.maxExecutionTime || 100, // ms
            slowQueryThreshold: config.slowQueryThreshold || 50, // ms
            concurrentUsers: config.concurrentUsers || 100,
            testDataSize: config.testDataSize || 1000,
            ...config
        };
        this.performanceMetrics = [];
        this.slowQueries = [];
    }

    // =============================================================================
    // SCHEMA VALIDATION & INTEGRITY TESTS
    // =============================================================================

    async testSchemaIntegrity() {
        const startTime = performance.now();
        
        try {
            // Test table creation and constraints
            await this.testTableConstraints();
            await this.testForeignKeyIntegrity();
            await this.testCheckConstraints();
            await this.testIndexExistence();
            await this.testTriggerFunctionality();

            const endTime = performance.now();
            this.recordMetric('schema_integrity', endTime - startTime, 'passed');
            
            return {
                success: true,
                executionTime: endTime - startTime,
                message: 'Schema integrity tests passed'
            };
        } catch (error) {
            const endTime = performance.now();
            this.recordMetric('schema_integrity', endTime - startTime, 'failed', error.message);
            throw error;
        }
    }

    async testTableConstraints() {
        // Test user table constraints
        const validUser = {
            id: this.generateId(),
            email: 'test.hunter@example.com',
            password_hash: '$2b$10$' + 'x'.repeat(53),
            first_name: 'Test',
            last_name: 'Hunter',
            experience_level: 'intermediate'
        };

        const insertResult = await this.db.prepare(`
            INSERT INTO users (id, email, password_hash, first_name, last_name, experience_level)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            validUser.id, validUser.email, validUser.password_hash,
            validUser.first_name, validUser.last_name, validUser.experience_level
        ).run();

        expect(insertResult.success).toBe(true);
        expect(insertResult.meta.changes).toBe(1);

        // Verify default values
        const createdUser = await this.db.prepare('SELECT * FROM users WHERE id = ?')
            .bind(validUser.id).first();
        
        expect(createdUser.role).toBe('hunter');
        expect(createdUser.subscription_tier).toBe('free');
        expect(createdUser.is_active).toBe(true);
        expect(createdUser.created_at).toBeDefined();

        return validUser;
    }

    async testForeignKeyIntegrity() {
        // Create test user first
        const user = await this.createTestUser();
        
        // Test valid foreign key relationship
        const validDog = {
            id: this.generateId(),
            owner_id: user.id,
            name: 'Test Dog',
            breed: 'German Shorthaired Pointer',
            hunting_style: 'pointing'
        };

        const dogResult = await this.db.prepare(`
            INSERT INTO dogs (id, owner_id, name, breed, hunting_style)
            VALUES (?, ?, ?, ?, ?)
        `).bind(validDog.id, validDog.owner_id, validDog.name, validDog.breed, validDog.hunting_style).run();

        expect(dogResult.success).toBe(true);

        // Test invalid foreign key relationship
        try {
            await this.db.prepare(`
                INSERT INTO dogs (id, owner_id, name, breed, hunting_style)
                VALUES (?, ?, ?, ?, ?)
            `).bind(this.generateId(), 'nonexistent_user', 'Invalid Dog', 'Test Breed', 'pointing').run();
            
            throw new Error('Foreign key constraint should have failed');
        } catch (error) {
            expect(error.message).toContain('FOREIGN KEY constraint failed');
        }

        return { user, dog: validDog };
    }

    async testCheckConstraints() {
        const userId = this.generateId();
        
        // Test valid check constraint
        await this.db.prepare(`
            INSERT INTO users (id, email, password_hash, experience_level)
            VALUES (?, ?, ?, ?)
        `).bind(userId, 'check@test.com', 'hash', 'advanced').run();

        // Test invalid check constraint
        try {
            await this.db.prepare(`
                INSERT INTO users (id, email, password_hash, experience_level)
                VALUES (?, ?, ?, ?)
            `).bind(this.generateId(), 'invalid@test.com', 'hash', 'invalid_level').run();
            
            throw new Error('Check constraint should have failed');
        } catch (error) {
            expect(error.message).toContain('CHECK constraint failed');
        }
    }

    async testIndexExistence() {
        // Verify critical indexes exist
        const indexes = await this.db.prepare(`
            SELECT name, tbl_name, sql 
            FROM sqlite_master 
            WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
        `).all();

        const criticalIndexes = [
            'idx_users_email',
            'idx_dogs_owner',
            'idx_hunt_logs_user_date',
            'idx_posts_public',
            'idx_training_dog_date'
        ];

        for (const indexName of criticalIndexes) {
            const indexExists = indexes.results.some(idx => idx.name === indexName);
            expect(indexExists).toBe(true, `Critical index ${indexName} is missing`);
        }

        return indexes.results.length;
    }

    async testTriggerFunctionality() {
        // Test materialized view triggers
        const user = await this.createTestUser();
        
        // Insert hunt log to trigger stats update
        const huntLog = await this.createTestHuntLog(user.id);
        
        // Verify trigger updated materialized view
        await this.sleep(10); // Allow trigger to execute
        
        const stats = await this.db.prepare('SELECT * FROM user_stats_materialized WHERE user_id = ?')
            .bind(user.id).first();
        
        expect(stats).toBeDefined();
        expect(stats.total_hunts).toBeGreaterThan(0);
    }

    // =============================================================================
    // QUERY PERFORMANCE TESTS
    // =============================================================================

    async testQueryPerformance() {
        console.log('Starting query performance tests...');
        
        // Generate test data
        await this.generateTestData();
        
        const performanceResults = {
            userQueries: await this.testUserQueryPerformance(),
            huntLogQueries: await this.testHuntLogQueryPerformance(),
            communityQueries: await this.testCommunityQueryPerformance(),
            trainingQueries: await this.testTrainingQueryPerformance(),
            aggregationQueries: await this.testAggregationQueryPerformance(),
            complexJoins: await this.testComplexJoinPerformance()
        };

        return performanceResults;
    }

    async testUserQueryPerformance() {
        const queries = [
            {
                name: 'user_by_email',
                sql: 'SELECT * FROM users WHERE email = ?',
                params: ['test@example.com'],
                expectedTime: 10
            },
            {
                name: 'user_by_username',
                sql: 'SELECT * FROM users WHERE username = ?',
                params: ['testuser'],
                expectedTime: 10
            },
            {
                name: 'users_by_location',
                sql: 'SELECT id, display_name, location FROM users WHERE location LIKE ? LIMIT 50',
                params: ['%Montana%'],
                expectedTime: 25
            },
            {
                name: 'active_users_recent',
                sql: `SELECT id, display_name, last_active FROM users 
                     WHERE is_active = TRUE AND last_active >= datetime('now', '-30 days') 
                     ORDER BY last_active DESC LIMIT 100`,
                params: [],
                expectedTime: 30
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async testHuntLogQueryPerformance() {
        const testUserId = await this.getTestUserId();
        
        const queries = [
            {
                name: 'user_hunt_logs',
                sql: 'SELECT * FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT 20',
                params: [testUserId],
                expectedTime: 20
            },
            {
                name: 'hunt_logs_by_type',
                sql: 'SELECT * FROM hunt_logs WHERE hunting_type = ? LIMIT 50',
                params: ['upland'],
                expectedTime: 25
            },
            {
                name: 'recent_successful_hunts',
                sql: `SELECT hl.*, COUNT(gh.id) as game_count
                     FROM hunt_logs hl
                     LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
                     WHERE hl.success_rating >= 4 
                       AND hl.hunt_date >= date('now', '-30 days')
                     GROUP BY hl.id
                     ORDER BY hl.hunt_date DESC
                     LIMIT 25`,
                params: [],
                expectedTime: 40
            },
            {
                name: 'public_hunt_summaries',
                sql: `SELECT * FROM public_hunt_summaries 
                     WHERE hunt_date >= date('now', '-7 days') 
                     ORDER BY hunt_date DESC 
                     LIMIT 30`,
                params: [],
                expectedTime: 35
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async testCommunityQueryPerformance() {
        const queries = [
            {
                name: 'community_feed',
                sql: `SELECT * FROM community_feed 
                     ORDER BY created_at DESC 
                     LIMIT 50`,
                params: [],
                expectedTime: 30
            },
            {
                name: 'posts_by_category',
                sql: `SELECT id, title, post_type, likes_count, created_at 
                     FROM community_posts 
                     WHERE category = ? AND visibility = 'public' 
                     ORDER BY created_at DESC 
                     LIMIT 25`,
                params: ['hunting_stories'],
                expectedTime: 25
            },
            {
                name: 'trending_posts',
                sql: `SELECT id, title, likes_count, comments_count 
                     FROM community_posts 
                     WHERE created_at >= datetime('now', '-7 days') 
                       AND likes_count > 5 
                     ORDER BY likes_count DESC 
                     LIMIT 20`,
                params: [],
                expectedTime: 35
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async testTrainingQueryPerformance() {
        const testDogId = await this.getTestDogId();
        
        const queries = [
            {
                name: 'dog_training_sessions',
                sql: `SELECT * FROM training_sessions 
                     WHERE dog_id = ? 
                     ORDER BY session_date DESC 
                     LIMIT 30`,
                params: [testDogId],
                expectedTime: 20
            },
            {
                name: 'dog_performance_trends',
                sql: `SELECT session_date, overall_performance, training_type 
                     FROM training_sessions 
                     WHERE dog_id = ? AND session_date >= date('now', '-90 days') 
                     ORDER BY session_date DESC`,
                params: [testDogId],
                expectedTime: 25
            },
            {
                name: 'training_goals_progress',
                sql: `SELECT * FROM training_goals 
                     WHERE dog_id = ? AND status = 'active' 
                     ORDER BY priority DESC, target_date ASC`,
                params: [testDogId],
                expectedTime: 15
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async testAggregationQueryPerformance() {
        const queries = [
            {
                name: 'user_activity_summary',
                sql: 'SELECT * FROM user_activity_summary LIMIT 100',
                params: [],
                expectedTime: 50
            },
            {
                name: 'dog_performance_summary',
                sql: 'SELECT * FROM dog_performance_summary LIMIT 100',
                params: [],
                expectedTime: 45
            },
            {
                name: 'monthly_hunt_stats',
                sql: `SELECT 
                        strftime('%Y-%m', hunt_date) as month,
                        COUNT(*) as total_hunts,
                        COUNT(CASE WHEN success_rating >= 4 THEN 1 END) as successful_hunts,
                        AVG(success_rating) as avg_rating
                     FROM hunt_logs 
                     WHERE hunt_date >= date('now', '-12 months')
                     GROUP BY strftime('%Y-%m', hunt_date)
                     ORDER BY month DESC`,
                params: [],
                expectedTime: 60
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async testComplexJoinPerformance() {
        const queries = [
            {
                name: 'hunt_with_game_and_dogs',
                sql: `SELECT 
                        hl.id,
                        hl.hunt_date,
                        hl.location_region,
                        hl.hunting_type,
                        COUNT(gh.id) as game_count,
                        GROUP_CONCAT(DISTINCT gh.species) as species_list,
                        u.display_name as hunter_name
                     FROM hunt_logs hl
                     LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
                     JOIN users u ON hl.user_id = u.id
                     WHERE hl.hunt_date >= date('now', '-30 days')
                     GROUP BY hl.id
                     ORDER BY hl.hunt_date DESC
                     LIMIT 25`,
                params: [],
                expectedTime: 75
            },
            {
                name: 'dog_training_with_goals',
                sql: `SELECT 
                        d.name as dog_name,
                        d.breed,
                        COUNT(ts.id) as training_sessions,
                        AVG(ts.overall_performance) as avg_performance,
                        COUNT(tg.id) as active_goals,
                        u.display_name as owner_name
                     FROM dogs d
                     JOIN users u ON d.owner_id = u.id
                     LEFT JOIN training_sessions ts ON d.id = ts.dog_id 
                       AND ts.session_date >= date('now', '-90 days')
                     LEFT JOIN training_goals tg ON d.id = tg.dog_id 
                       AND tg.status = 'active'
                     WHERE d.is_active = TRUE
                     GROUP BY d.id
                     LIMIT 50`,
                params: [],
                expectedTime: 80
            }
        ];

        return await this.runQueryBenchmarks(queries);
    }

    async runQueryBenchmarks(queries) {
        const results = [];
        
        for (const query of queries) {
            const startTime = performance.now();
            
            try {
                const result = await this.db.prepare(query.sql)
                    .bind(...(query.params || []))
                    .all();
                
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                
                const benchmarkResult = {
                    name: query.name,
                    executionTime,
                    expectedTime: query.expectedTime,
                    passed: executionTime <= query.expectedTime,
                    resultCount: result.results?.length || 0,
                    status: 'success'
                };

                if (executionTime > this.config.slowQueryThreshold) {
                    this.slowQueries.push({
                        ...benchmarkResult,
                        sql: query.sql,
                        params: query.params
                    });
                }

                results.push(benchmarkResult);
                this.recordMetric('query_performance', executionTime, 'success', query.name);
                
                console.log(`✓ ${query.name}: ${executionTime.toFixed(2)}ms (expected: ${query.expectedTime}ms)`);
                
            } catch (error) {
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                
                results.push({
                    name: query.name,
                    executionTime,
                    error: error.message,
                    status: 'failed'
                });
                
                this.recordMetric('query_performance', executionTime, 'failed', query.name);
                console.error(`✗ ${query.name}: ${error.message}`);
            }
        }

        return results;
    }

    // =============================================================================
    // LOAD TESTING & CONCURRENCY
    // =============================================================================

    async testConcurrentLoad() {
        console.log(`Starting concurrent load test with ${this.config.concurrentUsers} users...`);
        
        const operations = [
            () => this.simulateUserLogin(),
            () => this.simulateHuntLogCreation(),
            () => this.simulateTrainingSessionCreation(),
            () => this.simulateCommunityPostCreation(),
            () => this.simulateDashboardLoad(),
            () => this.simulateSearchOperation()
        ];

        const promises = [];
        
        for (let i = 0; i < this.config.concurrentUsers; i++) {
            const randomOperation = operations[Math.floor(Math.random() * operations.length)];
            promises.push(this.executeWithMetrics(randomOperation, `concurrent_user_${i}`));
        }

        const startTime = performance.now();
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            totalOperations: this.config.concurrentUsers,
            successful,
            failed,
            successRate: (successful / this.config.concurrentUsers) * 100,
            totalTime: endTime - startTime,
            avgTimePerOperation: (endTime - startTime) / this.config.concurrentUsers,
            errors: results.filter(r => r.status === 'rejected').map(r => r.reason.message)
        };
    }

    async simulateUserLogin() {
        // Simulate user authentication check
        const email = `testuser${Math.floor(Math.random() * 1000)}@example.com`;
        return await this.db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
            .bind(email).first();
    }

    async simulateHuntLogCreation() {
        const userId = await this.getRandomTestUserId();
        const huntData = this.generateRandomHuntData(userId);
        
        return await this.db.prepare(`
            INSERT INTO hunt_logs (id, user_id, hunt_date, hunting_type, location_region, success_rating)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            huntData.id, huntData.user_id, huntData.hunt_date,
            huntData.hunting_type, huntData.location_region, huntData.success_rating
        ).run();
    }

    async simulateTrainingSessionCreation() {
        const dogId = await this.getRandomTestDogId();
        const sessionData = this.generateRandomTrainingData(dogId);
        
        return await this.db.prepare(`
            INSERT INTO training_sessions (id, dog_id, user_id, session_date, training_type, overall_performance)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            sessionData.id, sessionData.dog_id, sessionData.user_id,
            sessionData.session_date, sessionData.training_type, sessionData.overall_performance
        ).run();
    }

    async simulateCommunityPostCreation() {
        const userId = await this.getRandomTestUserId();
        const postData = this.generateRandomPostData(userId);
        
        return await this.db.prepare(`
            INSERT INTO community_posts (id, user_id, title, content, post_type, category)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            postData.id, postData.user_id, postData.title,
            postData.content, postData.post_type, postData.category
        ).run();
    }

    async simulateDashboardLoad() {
        const userId = await this.getRandomTestUserId();
        
        // Simulate loading multiple dashboard components
        const promises = [
            this.db.prepare('SELECT * FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT 10')
                .bind(userId).all(),
            this.db.prepare('SELECT * FROM dogs WHERE owner_id = ? AND is_active = TRUE')
                .bind(userId).all(),
            this.db.prepare('SELECT * FROM training_sessions WHERE user_id = ? ORDER BY session_date DESC LIMIT 5')
                .bind(userId).all()
        ];

        return await Promise.all(promises);
    }

    async simulateSearchOperation() {
        const searchTerms = ['pointer', 'retriever', 'upland', 'waterfowl', 'training'];
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        return await this.db.prepare(`
            SELECT 'hunt' as type, id, hunt_date as date, location_region as title
            FROM hunt_logs 
            WHERE hunting_type LIKE ? OR location_region LIKE ?
            UNION ALL
            SELECT 'post' as type, id, created_at as date, title
            FROM community_posts 
            WHERE title LIKE ? OR content LIKE ?
            LIMIT 20
        `).bind(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`).all();
    }

    // =============================================================================
    // STRESS TESTING
    // =============================================================================

    async testDatabaseStress() {
        console.log('Starting database stress tests...');
        
        const stressTests = {
            largeDataset: await this.testLargeDatasetHandling(),
            highVolumeInserts: await this.testHighVolumeInserts(),
            complexQueryStress: await this.testComplexQueryStress(),
            memoryPressure: await this.testMemoryPressure(),
            connectionStress: await this.testConnectionStress()
        };

        return stressTests;
    }

    async testLargeDatasetHandling() {
        // Create large dataset and test query performance
        console.log('Creating large test dataset...');
        
        const batchSize = 100;
        const totalRecords = 5000;
        const startTime = performance.now();
        
        for (let i = 0; i < totalRecords; i += batchSize) {
            const batch = [];
            
            for (let j = 0; j < batchSize && (i + j) < totalRecords; j++) {
                const huntId = this.generateId();
                const userId = await this.getRandomTestUserId();
                
                batch.push(this.db.prepare(`
                    INSERT INTO hunt_logs (id, user_id, hunt_date, hunting_type, location_region, success_rating)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                    huntId,
                    userId,
                    this.randomDate(),
                    this.randomHuntingType(),
                    this.randomRegion(),
                    Math.floor(Math.random() * 5) + 1
                ));
            }
            
            await this.db.batch(batch);
        }
        
        const insertTime = performance.now() - startTime;
        
        // Test query performance on large dataset
        const queryStartTime = performance.now();
        const result = await this.db.prepare(`
            SELECT hunting_type, COUNT(*) as count, AVG(success_rating) as avg_rating
            FROM hunt_logs 
            GROUP BY hunting_type
            ORDER BY count DESC
        `).all();
        const queryTime = performance.now() - queryStartTime;

        return {
            recordsInserted: totalRecords,
            insertTime,
            insertRate: totalRecords / (insertTime / 1000), // records per second
            queryTime,
            queryResult: result.results
        };
    }

    async testHighVolumeInserts() {
        const operations = 1000;
        const startTime = performance.now();
        const promises = [];

        for (let i = 0; i < operations; i++) {
            const userId = await this.getRandomTestUserId();
            promises.push(this.simulateHuntLogCreation());
        }

        await Promise.all(promises);
        const endTime = performance.now();

        return {
            operations,
            totalTime: endTime - startTime,
            operationsPerSecond: operations / ((endTime - startTime) / 1000)
        };
    }

    async testComplexQueryStress() {
        const iterations = 50;
        const complexQuery = `
            SELECT 
                u.display_name,
                COUNT(DISTINCT hl.id) as total_hunts,
                COUNT(DISTINCT d.id) as dogs_count,
                AVG(hl.success_rating) as avg_success,
                COUNT(gh.id) as total_game,
                MAX(hl.hunt_date) as last_hunt
            FROM users u
            LEFT JOIN hunt_logs hl ON u.id = hl.user_id
            LEFT JOIN dogs d ON u.id = d.owner_id AND d.is_active = TRUE
            LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
            WHERE u.is_active = TRUE
            GROUP BY u.id
            HAVING total_hunts > 0
            ORDER BY avg_success DESC, total_hunts DESC
            LIMIT 25
        `;

        const startTime = performance.now();
        const promises = [];

        for (let i = 0; i < iterations; i++) {
            promises.push(this.db.prepare(complexQuery).all());
        }

        const results = await Promise.all(promises);
        const endTime = performance.now();

        return {
            iterations,
            totalTime: endTime - startTime,
            avgQueryTime: (endTime - startTime) / iterations,
            resultCount: results[0]?.results?.length || 0
        };
    }

    async testMemoryPressure() {
        // Test memory usage with large result sets
        const largeQuery = `
            SELECT hl.*, u.display_name, COUNT(gh.id) as game_count
            FROM hunt_logs hl
            JOIN users u ON hl.user_id = u.id
            LEFT JOIN game_harvested gh ON hl.id = gh.hunt_log_id
            GROUP BY hl.id
            ORDER BY hl.created_at DESC
        `;

        const startTime = performance.now();
        const result = await this.db.prepare(largeQuery).all();
        const endTime = performance.now();

        return {
            queryTime: endTime - startTime,
            recordCount: result.results?.length || 0,
            estimatedMemoryUsage: (result.results?.length || 0) * 1024 // rough estimate in bytes
        };
    }

    async testConnectionStress() {
        // Test multiple simultaneous connections/queries
        const concurrentQueries = 50;
        const queries = [
            'SELECT COUNT(*) FROM users WHERE is_active = TRUE',
            'SELECT COUNT(*) FROM dogs WHERE is_active = TRUE',
            'SELECT COUNT(*) FROM hunt_logs WHERE hunt_date >= date("now", "-30 days")',
            'SELECT COUNT(*) FROM community_posts WHERE visibility = "public"',
            'SELECT COUNT(*) FROM training_sessions WHERE session_date >= date("now", "-7 days")'
        ];

        const startTime = performance.now();
        const promises = [];

        for (let i = 0; i < concurrentQueries; i++) {
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            promises.push(this.db.prepare(randomQuery).first());
        }

        const results = await Promise.allSettled(promises);
        const endTime = performance.now();

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            concurrentQueries,
            successful,
            failed,
            totalTime: endTime - startTime,
            successRate: (successful / concurrentQueries) * 100
        };
    }

    // =============================================================================
    // TEST DATA GENERATION
    // =============================================================================

    async generateTestData() {
        console.log('Generating test data for performance tests...');
        
        // Create test users
        const userCount = Math.min(this.config.testDataSize, 500);
        for (let i = 0; i < userCount; i++) {
            await this.createTestUser({
                email: `testuser${i}@example.com`,
                username: `testuser${i}`,
                display_name: `Test User ${i}`,
                experience_level: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]
            });
        }

        // Create test dogs
        const dogCount = Math.min(this.config.testDataSize, 300);
        for (let i = 0; i < dogCount; i++) {
            const userId = await this.getRandomTestUserId();
            await this.createTestDog({
                owner_id: userId,
                name: `Test Dog ${i}`,
                breed: this.randomBreed(),
                hunting_style: this.randomHuntingStyle()
            });
        }

        console.log(`Generated ${userCount} users and ${dogCount} dogs for testing`);
    }

    async createTestUser(userData = {}) {
        const user = {
            id: this.generateId(),
            email: `test${Date.now()}@example.com`,
            password_hash: '$2b$10$' + 'x'.repeat(53),
            first_name: 'Test',
            last_name: 'User',
            display_name: 'Test User',
            experience_level: 'intermediate',
            ...userData
        };

        await this.db.prepare(`
            INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, experience_level)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            user.id, user.email, user.password_hash,
            user.first_name, user.last_name, user.display_name, user.experience_level
        ).run();

        return user;
    }

    async createTestDog(dogData = {}) {
        const dog = {
            id: this.generateId(),
            name: 'Test Dog',
            breed: 'German Shorthaired Pointer',
            hunting_style: 'pointing',
            training_level: 'seasoned',
            ...dogData
        };

        await this.db.prepare(`
            INSERT INTO dogs (id, owner_id, name, breed, hunting_style, training_level)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            dog.id, dog.owner_id, dog.name,
            dog.breed, dog.hunting_style, dog.training_level
        ).run();

        return dog;
    }

    async createTestHuntLog(userId, huntData = {}) {
        const hunt = {
            id: this.generateId(),
            user_id: userId,
            hunt_date: this.randomDate(),
            hunting_type: this.randomHuntingType(),
            location_region: this.randomRegion(),
            success_rating: Math.floor(Math.random() * 5) + 1,
            ...huntData
        };

        await this.db.prepare(`
            INSERT INTO hunt_logs (id, user_id, hunt_date, hunting_type, location_region, success_rating)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            hunt.id, hunt.user_id, hunt.hunt_date,
            hunt.hunting_type, hunt.location_region, hunt.success_rating
        ).run();

        return hunt;
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    generateId() {
        return Math.random().toString(36).substring(2, 18);
    }

    randomDate() {
        const start = new Date(2023, 0, 1);
        const end = new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
            .toISOString().split('T')[0];
    }

    randomHuntingType() {
        const types = ['upland', 'waterfowl', 'big_game', 'small_game', 'training'];
        return types[Math.floor(Math.random() * types.length)];
    }

    randomRegion() {
        const regions = ['Eastern Montana', 'Western Wyoming', 'Northern Idaho', 'Southern Utah', 'Central Colorado'];
        return regions[Math.floor(Math.random() * regions.length)];
    }

    randomBreed() {
        const breeds = ['German Shorthaired Pointer', 'Labrador Retriever', 'Golden Retriever', 'English Springer Spaniel', 'Brittany'];
        return breeds[Math.floor(Math.random() * breeds.length)];
    }

    randomHuntingStyle() {
        const styles = ['pointing', 'retrieving', 'flushing', 'tracking'];
        return styles[Math.floor(Math.random() * styles.length)];
    }

    async getTestUserId() {
        const user = await this.db.prepare('SELECT id FROM users WHERE email LIKE "test%" LIMIT 1').first();
        return user?.id || await this.createTestUser().then(u => u.id);
    }

    async getTestDogId() {
        const dog = await this.db.prepare('SELECT id FROM dogs WHERE name LIKE "Test%" LIMIT 1').first();
        if (dog) return dog.id;
        
        const userId = await this.getTestUserId();
        return await this.createTestDog({ owner_id: userId }).then(d => d.id);
    }

    async getRandomTestUserId() {
        const users = await this.db.prepare('SELECT id FROM users WHERE email LIKE "test%" ORDER BY RANDOM() LIMIT 1').first();
        return users?.id || await this.createTestUser().then(u => u.id);
    }

    async getRandomTestDogId() {
        const dog = await this.db.prepare('SELECT id FROM dogs WHERE name LIKE "Test%" ORDER BY RANDOM() LIMIT 1').first();
        if (dog) return dog.id;
        
        const userId = await this.getRandomTestUserId();
        return await this.createTestDog({ owner_id: userId }).then(d => d.id);
    }

    generateRandomHuntData(userId) {
        return {
            id: this.generateId(),
            user_id: userId,
            hunt_date: this.randomDate(),
            hunting_type: this.randomHuntingType(),
            location_region: this.randomRegion(),
            success_rating: Math.floor(Math.random() * 5) + 1
        };
    }

    generateRandomTrainingData(dogId) {
        return {
            id: this.generateId(),
            dog_id: dogId,
            user_id: this.getRandomTestUserId(),
            session_date: this.randomDate(),
            training_type: ['obedience', 'pointing', 'retrieving', 'steadiness'][Math.floor(Math.random() * 4)],
            overall_performance: Math.floor(Math.random() * 5) + 1
        };
    }

    generateRandomPostData(userId) {
        return {
            id: this.generateId(),
            user_id: userId,
            title: `Test Hunt Story ${Math.floor(Math.random() * 1000)}`,
            content: 'This is a test hunt story with some content.',
            post_type: ['story', 'photo', 'question'][Math.floor(Math.random() * 3)],
            category: 'hunting_stories'
        };
    }

    recordMetric(category, value, status, details = null) {
        this.performanceMetrics.push({
            category,
            value,
            status,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async executeWithMetrics(operation, operationName) {
        const startTime = performance.now();
        try {
            const result = await operation();
            const endTime = performance.now();
            this.recordMetric(operationName, endTime - startTime, 'success');
            return result;
        } catch (error) {
            const endTime = performance.now();
            this.recordMetric(operationName, endTime - startTime, 'failed', error.message);
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =============================================================================
    // REPORTING
    // =============================================================================

    generatePerformanceReport() {
        const report = {
            summary: {
                totalTests: this.performanceMetrics.length,
                passed: this.performanceMetrics.filter(m => m.status === 'success').length,
                failed: this.performanceMetrics.filter(m => m.status === 'failed').length,
                slowQueries: this.slowQueries.length,
                avgExecutionTime: this.performanceMetrics.reduce((sum, m) => sum + m.value, 0) / this.performanceMetrics.length
            },
            categories: {},
            slowQueries: this.slowQueries,
            recommendations: this.generateRecommendations()
        };

        // Group metrics by category
        for (const metric of this.performanceMetrics) {
            if (!report.categories[metric.category]) {
                report.categories[metric.category] = {
                    tests: 0,
                    passed: 0,
                    failed: 0,
                    avgTime: 0,
                    metrics: []
                };
            }

            const category = report.categories[metric.category];
            category.tests++;
            category.metrics.push(metric);
            
            if (metric.status === 'success') {
                category.passed++;
            } else {
                category.failed++;
            }
        }

        // Calculate averages
        for (const category of Object.values(report.categories)) {
            category.avgTime = category.metrics.reduce((sum, m) => sum + m.value, 0) / category.metrics.length;
        }

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.slowQueries.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Query Performance',
                issue: `${this.slowQueries.length} slow queries detected`,
                recommendation: 'Review and optimize slow queries, consider adding indexes',
                queries: this.slowQueries.slice(0, 5) // Top 5 slowest
            });
        }

        const failedMetrics = this.performanceMetrics.filter(m => m.status === 'failed');
        if (failedMetrics.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'System Reliability',
                issue: `${failedMetrics.length} failed operations`,
                recommendation: 'Investigate and fix failed operations',
                failures: failedMetrics.slice(0, 5)
            });
        }

        const avgTime = this.performanceMetrics.reduce((sum, m) => sum + m.value, 0) / this.performanceMetrics.length;
        if (avgTime > this.config.maxExecutionTime) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Performance',
                issue: `Average execution time (${avgTime.toFixed(2)}ms) exceeds target (${this.config.maxExecutionTime}ms)`,
                recommendation: 'Consider query optimization, indexing improvements, or caching strategies'
            });
        }

        return recommendations;
    }
}