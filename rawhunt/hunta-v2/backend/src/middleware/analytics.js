/**
 * Analytics Middleware - Live API Monitoring
 * Tracks all API calls in real-time and stores metrics in database
 */

export class AnalyticsMiddleware {
    constructor(env) {
        this.env = env;
    }

    async trackRequest(request, response, startTime, error = null) {
        if (!this.env.DB) {
            console.log('Database not available for analytics tracking');
            return;
        }

        try {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const url = new URL(request.url);
            const path = url.pathname;
            const method = request.method;
            
            // Extract user info
            const userAgent = request.headers.get('user-agent') || '';
            const userIP = request.headers.get('cf-connecting-ip') || 
                          request.headers.get('x-forwarded-for') || 
                          'unknown';
            
            // Extract user ID from auth header if available
            let userId = null;
            const authHeader = request.headers.get('authorization');
            if (authHeader) {
                try {
                    const token = authHeader.replace('Bearer ', '');
                    const payload = JSON.parse(atob(token.split('.')[1] || '{}'));
                    userId = payload.userId || payload.sub;
                } catch (e) {
                    // Invalid token, ignore
                }
            }

            // Get response details
            const statusCode = response?.status || (error ? 500 : 200);
            const responseSize = response?.headers?.get('content-length') || 0;
            
            // Generate request ID
            const requestId = this.generateRequestId();

            // Store request log
            await this.logRequest({
                requestId,
                method,
                endpoint: this.normalizeEndpoint(path),
                fullPath: path,
                statusCode,
                responseTime,
                userId,
                userAgent,
                ipAddress: userIP,
                requestSize: await this.getRequestSize(request),
                responseSize: parseInt(responseSize) || 0,
                errorMessage: error?.message || null,
                timestamp: new Date().toISOString()
            });

            // Update endpoint statistics
            await this.updateEndpointStats(method, this.normalizeEndpoint(path), statusCode, responseTime);

            // Update daily statistics
            await this.updateDailyStats(statusCode, responseTime, userId);

            // Track user activity
            if (userId) {
                await this.trackUserActivity(userId, userIP, userAgent);
            }

            // Log errors
            if (error || statusCode >= 400) {
                await this.logError({
                    endpoint: this.normalizeEndpoint(path),
                    method,
                    statusCode,
                    errorMessage: error?.message || `HTTP ${statusCode}`,
                    stackTrace: error?.stack || null,
                    userId,
                    requestId,
                    userAgent,
                    ipAddress: userIP,
                    requestBody: await this.getRequestBody(request)
                });
            }

        } catch (trackingError) {
            console.error('Analytics tracking error:', trackingError);
            // Don't let tracking errors affect the main request
        }
    }

    async logRequest(data) {
        try {
            await this.env.DB.prepare(`
                INSERT INTO api_requests (
                    id, method, endpoint, full_path, status_code, response_time,
                    user_id, user_agent, ip_address, request_size, response_size, 
                    error_message, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.requestId,
                data.method,
                data.endpoint,
                data.fullPath,
                data.statusCode,
                data.responseTime,
                data.userId,
                data.userAgent,
                data.ipAddress,
                data.requestSize,
                data.responseSize,
                data.errorMessage,
                data.timestamp
            ).run();
        } catch (error) {
            console.error('Failed to log request:', error);
        }
    }

    async updateEndpointStats(method, endpoint, statusCode, responseTime) {
        try {
            const isSuccess = statusCode >= 200 && statusCode < 400;
            const isError = statusCode >= 400;

            // Try to update existing record
            const result = await this.env.DB.prepare(`
                UPDATE api_endpoints 
                SET 
                    total_calls = total_calls + 1,
                    success_calls = success_calls + ?,
                    error_calls = error_calls + ?,
                    total_response_time = total_response_time + ?,
                    min_response_time = CASE 
                        WHEN min_response_time = 0 OR ? < min_response_time THEN ? 
                        ELSE min_response_time 
                    END,
                    max_response_time = CASE 
                        WHEN ? > max_response_time THEN ? 
                        ELSE max_response_time 
                    END,
                    last_called = datetime('now'),
                    updated_at = datetime('now')
                WHERE endpoint = ? AND method = ?
            `).bind(
                isSuccess ? 1 : 0,
                isError ? 1 : 0,
                responseTime,
                responseTime,
                responseTime,
                responseTime,
                responseTime,
                endpoint,
                method
            ).run();

            // If no rows updated, insert new record
            if (result.changes === 0) {
                await this.env.DB.prepare(`
                    INSERT INTO api_endpoints (
                        endpoint, method, total_calls, success_calls, error_calls,
                        total_response_time, min_response_time, max_response_time, last_called
                    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(
                    endpoint,
                    method,
                    isSuccess ? 1 : 0,
                    isError ? 1 : 0,
                    responseTime,
                    responseTime,
                    responseTime
                ).run();
            }
        } catch (error) {
            console.error('Failed to update endpoint stats:', error);
        }
    }

    async updateDailyStats(statusCode, responseTime, userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Build status code increment
            const statusField = this.getStatusField(statusCode);
            
            // Try to update existing record
            const result = await this.env.DB.prepare(`
                UPDATE api_daily_stats 
                SET 
                    total_requests = total_requests + 1,
                    total_errors = total_errors + ?,
                    total_response_time = total_response_time + ?,
                    ${statusField} = ${statusField} + 1
                WHERE date = ?
            `).bind(
                statusCode >= 400 ? 1 : 0,
                responseTime,
                today
            ).run();

            // If no rows updated, insert new record
            if (result.changes === 0) {
                await this.env.DB.prepare(`
                    INSERT INTO api_daily_stats (
                        date, total_requests, total_errors, total_response_time, ${statusField}
                    ) VALUES (?, 1, ?, ?, 1)
                `).bind(
                    today,
                    statusCode >= 400 ? 1 : 0,
                    responseTime
                ).run();
            }

            // Update unique users count (simplified)
            if (userId) {
                await this.updateUniqueUsersCount(today, userId);
            }

        } catch (error) {
            console.error('Failed to update daily stats:', error);
        }
    }

    async trackUserActivity(userId, ipAddress, userAgent) {
        try {
            // Try to update existing user activity
            const result = await this.env.DB.prepare(`
                UPDATE user_activity 
                SET 
                    last_seen = datetime('now'),
                    total_requests = total_requests + 1
                WHERE user_id = ?
            `).bind(userId).run();

            // If no rows updated, insert new record
            if (result.changes === 0) {
                await this.env.DB.prepare(`
                    INSERT INTO user_activity (
                        user_id, ip_address, user_agent, total_requests
                    ) VALUES (?, ?, ?, 1)
                `).bind(userId, ipAddress, userAgent).run();
            }
        } catch (error) {
            console.error('Failed to track user activity:', error);
        }
    }

    async logError(data) {
        try {
            await this.env.DB.prepare(`
                INSERT INTO error_log (
                    endpoint, method, status_code, error_message, stack_trace,
                    user_id, request_id, user_agent, ip_address, request_body
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.endpoint,
                data.method,
                data.statusCode,
                data.errorMessage,
                data.stackTrace,
                data.userId,
                data.requestId,
                data.userAgent,
                data.ipAddress,
                data.requestBody
            ).run();
        } catch (error) {
            console.error('Failed to log error:', error);
        }
    }

    // Helper methods
    normalizeEndpoint(path) {
        // Convert dynamic routes to generic patterns
        return path
            .replace(/\/[0-9a-f-]{36}/g, '/{id}')  // UUIDs
            .replace(/\/\d+/g, '/{id}')            // Numeric IDs
            .replace(/\/[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+/g, '/{email}') // Emails
            .toLowerCase();
    }

    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    async getRequestSize(request) {
        try {
            const contentLength = request.headers.get('content-length');
            return contentLength ? parseInt(contentLength) : 0;
        } catch (error) {
            return 0;
        }
    }

    async getRequestBody(request) {
        try {
            // Only log body for errors and if it's not too large
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const clone = request.clone();
                const body = await clone.text();
                return body.length > 1000 ? body.substring(0, 1000) + '...' : body;
            }
        } catch (error) {
            // Ignore errors when trying to read body
        }
        return null;
    }

    getStatusField(statusCode) {
        const code = Math.floor(statusCode);
        const validCodes = [200, 201, 400, 401, 404, 500];
        return validCodes.includes(code) ? `status_${code}` : 'status_500';
    }

    async updateUniqueUsersCount(date, userId) {
        // This is simplified - in production you'd want a more sophisticated approach
        try {
            // Check if user was already counted today
            const existing = await this.env.DB.prepare(`
                SELECT COUNT(*) as count FROM api_requests 
                WHERE DATE(timestamp) = ? AND user_id = ?
            `).bind(date, userId).first();

            if (existing?.count === 1) {
                // First request from this user today, increment unique users
                await this.env.DB.prepare(`
                    UPDATE api_daily_stats 
                    SET unique_users = unique_users + 1 
                    WHERE date = ?
                `).bind(date).run();
            }
        } catch (error) {
            console.error('Failed to update unique users count:', error);
        }
    }
}