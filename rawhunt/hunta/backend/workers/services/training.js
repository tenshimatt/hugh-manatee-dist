/**
 * Training Service
 * Handles dog training logs, progress tracking, and session management
 */

export class TrainingService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get training logs with filtering
    async getLogs(request) {
        try {
            const { 
                dogId,
                trainingType,
                startDate,
                endDate,
                minRating,
                sortBy = 'date',
                sortOrder = 'desc',
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT tl.*, d.name as dog_name, d.profile_image_url as dog_image
                FROM training_logs tl
                JOIN dogs d ON tl.dog_id = d.id
                WHERE tl.user_id = ? AND tl.is_private = 0
            `;
            let params = [request.user.id];

            if (dogId) {
                sql += ` AND tl.dog_id = ?`;
                params.push(dogId);
            }

            if (trainingType) {
                sql += ` AND tl.training_type LIKE ?`;
                params.push(`%${trainingType}%`);
            }

            if (startDate) {
                sql += ` AND tl.date >= ?`;
                params.push(startDate);
            }

            if (endDate) {
                sql += ` AND tl.date <= ?`;
                params.push(endDate);
            }

            if (minRating) {
                sql += ` AND tl.rating >= ?`;
                params.push(parseInt(minRating));
            }

            // Add sorting
            const validSortFields = ['date', 'duration_minutes', 'rating', 'created_at'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
            const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            sql += ` ORDER BY tl.${sortField} ${order}`;

            sql += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const logs = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                logs: logs.results.map(log => ({
                    id: log.id,
                    dogId: log.dog_id,
                    dogName: log.dog_name,
                    dogImage: log.dog_image,
                    date: log.date,
                    durationMinutes: log.duration_minutes,
                    trainingType: log.training_type,
                    locationName: log.location_name,
                    weatherConditions: log.weather_conditions,
                    goals: log.goals,
                    activities: log.activities ? JSON.parse(log.activities) : [],
                    progressNotes: log.progress_notes,
                    challenges: log.challenges,
                    successes: log.successes,
                    nextSessionNotes: log.next_session_notes,
                    rating: log.rating,
                    isPrivate: log.is_private,
                    createdAt: log.created_at,
                    updatedAt: log.updated_at
                })),
                filters: {
                    dogId,
                    trainingType,
                    startDate,
                    endDate,
                    minRating,
                    sortBy,
                    sortOrder
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: logs.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get training logs error:', error);
            return this.errorResponse('Failed to get training logs', 500);
        }
    }

    // Create new training log
    async createLog(request) {
        try {
            const body = await request.json();
            const {
                dogId,
                date,
                durationMinutes,
                trainingType,
                locationName,
                weatherConditions,
                goals,
                activities = [],
                progressNotes,
                challenges,
                successes,
                nextSessionNotes,
                rating,
                isPrivate = false
            } = body;

            // Validate required fields
            if (!dogId || !date || !trainingType) {
                return this.errorResponse('Dog ID, date, and training type are required', 400);
            }

            // Validate dog ownership
            const dog = await this.db.prepare(
                'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
            ).bind(dogId).first();

            if (!dog || dog.owner_id !== request.user.id) {
                return this.errorResponse('Invalid dog selection', 400);
            }

            // Validate date
            if (new Date(date) > new Date()) {
                return this.errorResponse('Training date cannot be in the future', 400);
            }

            // Validate numeric fields
            if (durationMinutes && (durationMinutes < 0 || durationMinutes > 1440)) {
                return this.errorResponse('Duration must be between 0 and 1440 minutes', 400);
            }

            if (rating && (rating < 1 || rating > 5)) {
                return this.errorResponse('Rating must be between 1 and 5', 400);
            }

            const logId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO training_logs (
                    id, user_id, dog_id, date, duration_minutes, training_type,
                    location_name, weather_conditions, goals, activities,
                    progress_notes, challenges, successes, next_session_notes,
                    rating, is_private
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                logId, request.user.id, dogId, date, durationMinutes, trainingType,
                locationName, weatherConditions, goals, JSON.stringify(activities),
                progressNotes, challenges, successes, nextSessionNotes,
                rating, isPrivate
            ).run();

            // Get the created log with dog info
            const log = await this.db.prepare(`
                SELECT tl.*, d.name as dog_name, d.profile_image_url as dog_image
                FROM training_logs tl
                JOIN dogs d ON tl.dog_id = d.id
                WHERE tl.id = ?
            `).bind(logId).first();

            return this.successResponse({
                id: log.id,
                dogId: log.dog_id,
                dogName: log.dog_name,
                dogImage: log.dog_image,
                date: log.date,
                durationMinutes: log.duration_minutes,
                trainingType: log.training_type,
                locationName: log.location_name,
                weatherConditions: log.weather_conditions,
                goals: log.goals,
                activities: log.activities ? JSON.parse(log.activities) : [],
                progressNotes: log.progress_notes,
                challenges: log.challenges,
                successes: log.successes,
                nextSessionNotes: log.next_session_notes,
                rating: log.rating,
                isPrivate: log.is_private,
                createdAt: log.created_at,
                updatedAt: log.updated_at
            });

        } catch (error) {
            console.error('Create training log error:', error);
            return this.errorResponse('Failed to create training log', 500);
        }
    }

    // Get single training log
    async getLog(request) {
        try {
            const logId = request.params.id;
            
            const log = await this.db.prepare(`
                SELECT tl.*, d.name as dog_name, d.profile_image_url as dog_image
                FROM training_logs tl
                JOIN dogs d ON tl.dog_id = d.id
                WHERE tl.id = ?
            `).bind(logId).first();

            if (!log) {
                return this.errorResponse('Training log not found', 404);
            }

            // Check ownership
            if (log.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to view this training log', 403);
            }

            return this.successResponse({
                id: log.id,
                dogId: log.dog_id,
                dogName: log.dog_name,
                dogImage: log.dog_image,
                date: log.date,
                durationMinutes: log.duration_minutes,
                trainingType: log.training_type,
                locationName: log.location_name,
                weatherConditions: log.weather_conditions,
                goals: log.goals,
                activities: log.activities ? JSON.parse(log.activities) : [],
                progressNotes: log.progress_notes,
                challenges: log.challenges,
                successes: log.successes,
                nextSessionNotes: log.next_session_notes,
                rating: log.rating,
                isPrivate: log.is_private,
                createdAt: log.created_at,
                updatedAt: log.updated_at
            });

        } catch (error) {
            console.error('Get training log error:', error);
            return this.errorResponse('Failed to get training log', 500);
        }
    }

    // Update training log
    async updateLog(request) {
        try {
            const logId = request.params.id;
            const body = await request.json();

            // Check ownership
            const log = await this.db.prepare(
                'SELECT user_id FROM training_logs WHERE id = ?'
            ).bind(logId).first();

            if (!log) {
                return this.errorResponse('Training log not found', 404);
            }

            if (log.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this training log', 403);
            }

            const {
                dogId,
                date,
                durationMinutes,
                trainingType,
                locationName,
                weatherConditions,
                goals,
                activities,
                progressNotes,
                challenges,
                successes,
                nextSessionNotes,
                rating,
                isPrivate
            } = body;

            // Validate dog ownership if changing
            if (dogId) {
                const dog = await this.db.prepare(
                    'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
                ).bind(dogId).first();

                if (!dog || dog.owner_id !== request.user.id) {
                    return this.errorResponse('Invalid dog selection', 400);
                }
            }

            // Validate numeric fields if provided
            if (durationMinutes && (durationMinutes < 0 || durationMinutes > 1440)) {
                return this.errorResponse('Duration must be between 0 and 1440 minutes', 400);
            }

            if (rating && (rating < 1 || rating > 5)) {
                return this.errorResponse('Rating must be between 1 and 5', 400);
            }

            // Update training log
            await this.db.prepare(`
                UPDATE training_logs SET
                    dog_id = COALESCE(?, dog_id),
                    date = COALESCE(?, date),
                    duration_minutes = COALESCE(?, duration_minutes),
                    training_type = COALESCE(?, training_type),
                    location_name = COALESCE(?, location_name),
                    weather_conditions = COALESCE(?, weather_conditions),
                    goals = COALESCE(?, goals),
                    activities = COALESCE(?, activities),
                    progress_notes = COALESCE(?, progress_notes),
                    challenges = COALESCE(?, challenges),
                    successes = COALESCE(?, successes),
                    next_session_notes = COALESCE(?, next_session_notes),
                    rating = COALESCE(?, rating),
                    is_private = COALESCE(?, is_private),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                dogId, date, durationMinutes, trainingType, locationName,
                weatherConditions, goals, 
                activities ? JSON.stringify(activities) : null,
                progressNotes, challenges, successes, nextSessionNotes,
                rating, isPrivate, logId
            ).run();

            // Get updated log
            const updatedLog = await this.db.prepare(`
                SELECT tl.*, d.name as dog_name, d.profile_image_url as dog_image
                FROM training_logs tl
                JOIN dogs d ON tl.dog_id = d.id
                WHERE tl.id = ?
            `).bind(logId).first();

            return this.successResponse({
                id: updatedLog.id,
                dogId: updatedLog.dog_id,
                dogName: updatedLog.dog_name,
                dogImage: updatedLog.dog_image,
                date: updatedLog.date,
                durationMinutes: updatedLog.duration_minutes,
                trainingType: updatedLog.training_type,
                locationName: updatedLog.location_name,
                weatherConditions: updatedLog.weather_conditions,
                goals: updatedLog.goals,
                activities: updatedLog.activities ? JSON.parse(updatedLog.activities) : [],
                progressNotes: updatedLog.progress_notes,
                challenges: updatedLog.challenges,
                successes: updatedLog.successes,
                nextSessionNotes: updatedLog.next_session_notes,
                rating: updatedLog.rating,
                isPrivate: updatedLog.is_private,
                createdAt: updatedLog.created_at,
                updatedAt: updatedLog.updated_at
            });

        } catch (error) {
            console.error('Update training log error:', error);
            return this.errorResponse('Failed to update training log', 500);
        }
    }

    // Delete training log
    async deleteLog(request) {
        try {
            const logId = request.params.id;

            // Check ownership
            const log = await this.db.prepare(
                'SELECT user_id FROM training_logs WHERE id = ?'
            ).bind(logId).first();

            if (!log) {
                return this.errorResponse('Training log not found', 404);
            }

            if (log.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to delete this training log', 403);
            }

            // Delete log
            await this.db.prepare(
                'DELETE FROM training_logs WHERE id = ?'
            ).bind(logId).run();

            return this.successResponse({ message: 'Training log deleted successfully' });

        } catch (error) {
            console.error('Delete training log error:', error);
            return this.errorResponse('Failed to delete training log', 500);
        }
    }

    // Get training statistics for a dog
    async getDogTrainingStats(request) {
        try {
            const dogId = request.params.dogId;

            // Verify dog ownership
            const dog = await this.db.prepare(
                'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
            ).bind(dogId).first();

            if (!dog || dog.owner_id !== request.user.id) {
                return this.errorResponse('Dog not found or not accessible', 404);
            }

            // Get training statistics
            const stats = await this.db.prepare(`
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(duration_minutes) as total_minutes,
                    AVG(duration_minutes) as avg_session_minutes,
                    AVG(rating) as avg_rating,
                    COUNT(DISTINCT training_type) as training_types_count,
                    MIN(date) as first_session,
                    MAX(date) as last_session
                FROM training_logs
                WHERE dog_id = ? AND user_id = ?
            `).bind(dogId, request.user.id).first();

            // Get training type breakdown
            const typeBreakdown = await this.db.prepare(`
                SELECT training_type, COUNT(*) as session_count, SUM(duration_minutes) as total_minutes
                FROM training_logs
                WHERE dog_id = ? AND user_id = ?
                GROUP BY training_type
                ORDER BY session_count DESC
            `).bind(dogId, request.user.id).all();

            // Get recent progress (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentProgress = await this.db.prepare(`
                SELECT date, rating, training_type, duration_minutes
                FROM training_logs
                WHERE dog_id = ? AND user_id = ? AND date >= ?
                ORDER BY date DESC
            `).bind(dogId, request.user.id, thirtyDaysAgo.toISOString().split('T')[0]).all();

            return this.successResponse({
                dogId,
                totalSessions: stats.total_sessions,
                totalMinutes: stats.total_minutes,
                avgSessionMinutes: Math.round(stats.avg_session_minutes || 0),
                avgRating: parseFloat((stats.avg_rating || 0).toFixed(1)),
                trainingTypesCount: stats.training_types_count,
                firstSession: stats.first_session,
                lastSession: stats.last_session,
                typeBreakdown: typeBreakdown.results,
                recentProgress: recentProgress.results
            });

        } catch (error) {
            console.error('Get dog training stats error:', error);
            return this.errorResponse('Failed to get training statistics', 500);
        }
    }

    // Get training reminders/next session notes
    async getTrainingReminders(request) {
        try {
            const reminders = await this.db.prepare(`
                SELECT DISTINCT tl.dog_id, tl.next_session_notes, tl.date as last_session,
                       d.name as dog_name, d.profile_image_url as dog_image
                FROM training_logs tl
                JOIN dogs d ON tl.dog_id = d.id
                WHERE tl.user_id = ? AND tl.next_session_notes IS NOT NULL AND tl.next_session_notes != ''
                AND tl.date = (
                    SELECT MAX(date) FROM training_logs tl2 
                    WHERE tl2.dog_id = tl.dog_id AND tl2.user_id = tl.user_id
                )
                ORDER BY tl.date DESC
            `).bind(request.user.id).all();

            return this.successResponse({
                reminders: reminders.results.map(reminder => ({
                    dogId: reminder.dog_id,
                    dogName: reminder.dog_name,
                    dogImage: reminder.dog_image,
                    nextSessionNotes: reminder.next_session_notes,
                    lastSession: reminder.last_session,
                    daysSinceLastSession: Math.floor((new Date() - new Date(reminder.last_session)) / (1000 * 60 * 60 * 24))
                }))
            });

        } catch (error) {
            console.error('Get training reminders error:', error);
            return this.errorResponse('Failed to get training reminders', 500);
        }
    }

    // Helper methods
    successResponse(data) {
        return new Response(JSON.stringify({
            success: true,
            data
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    errorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}