/**
 * User Service 
 * Handles user profile management and user-related operations
 */

export class UserService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get current user profile
    async getProfile(request) {
        try {
            const user = await this.db.prepare(`
                SELECT 
                    id, email, username, first_name, last_name, role,
                    profile_image_url, location, phone, bio, experience_level,
                    privacy_level, email_verified, created_at
                FROM users 
                WHERE id = ?
            `).bind(request.user.id).first();

            if (!user) {
                return this.errorResponse('User not found', 404);
            }

            return this.successResponse({
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                profileImageUrl: user.profile_image_url,
                location: user.location,
                phone: user.phone,
                bio: user.bio,
                experienceLevel: user.experience_level,
                privacyLevel: user.privacy_level,
                emailVerified: user.email_verified,
                createdAt: user.created_at
            });

        } catch (error) {
            console.error('Get profile error:', error);
            return this.errorResponse('Failed to get profile', 500);
        }
    }

    // Update current user profile
    async updateProfile(request) {
        try {
            const body = await request.json();
            const {
                username,
                firstName,
                lastName,
                location,
                phone,
                bio,
                experienceLevel,
                privacyLevel,
                profileImageUrl
            } = body;

            // Check if username is taken by another user
            if (username) {
                const existingUser = await this.db.prepare(
                    'SELECT id FROM users WHERE username = ? AND id != ?'
                ).bind(username, request.user.id).first();

                if (existingUser) {
                    return this.errorResponse('Username is already taken', 409);
                }
            }

            // Update user profile
            await this.db.prepare(`
                UPDATE users SET
                    username = COALESCE(?, username),
                    first_name = COALESCE(?, first_name),
                    last_name = COALESCE(?, last_name),
                    location = COALESCE(?, location),
                    phone = COALESCE(?, phone),
                    bio = COALESCE(?, bio),
                    experience_level = COALESCE(?, experience_level),
                    privacy_level = COALESCE(?, privacy_level),
                    profile_image_url = COALESCE(?, profile_image_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                username, firstName, lastName, location, phone, bio,
                experienceLevel, privacyLevel, profileImageUrl, request.user.id
            ).run();

            // Get updated profile
            return await this.getProfile(request);

        } catch (error) {
            console.error('Update profile error:', error);
            return this.errorResponse('Failed to update profile', 500);
        }
    }

    // Get public user profile
    async getUser(request) {
        try {
            const userId = request.params.id;
            
            const user = await this.db.prepare(`
                SELECT 
                    id, username, first_name, last_name, 
                    profile_image_url, location, bio, experience_level,
                    created_at
                FROM users 
                WHERE id = ? AND is_active = 1
            `).bind(userId).first();

            if (!user) {
                return this.errorResponse('User not found', 404);
            }

            // Check privacy level
            if (user.privacy_level === 'private') {
                return this.errorResponse('Profile is private', 403);
            }

            // Get user's dogs count
            const dogCount = await this.db.prepare(
                'SELECT COUNT(*) as count FROM dogs WHERE owner_id = ? AND is_active = 1'
            ).bind(userId).first();

            // Get user's public posts count
            const postCount = await this.db.prepare(
                'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND privacy_level = "public"'
            ).bind(userId).first();

            return this.successResponse({
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                profileImageUrl: user.profile_image_url,
                location: user.location,
                bio: user.bio,
                experienceLevel: user.experience_level,
                createdAt: user.created_at,
                stats: {
                    dogs: dogCount.count,
                    posts: postCount.count
                }
            });

        } catch (error) {
            console.error('Get user error:', error);
            return this.errorResponse('Failed to get user', 500);
        }
    }

    // Search users
    async searchUsers(request) {
        try {
            const { q: query, limit = 20, offset = 0 } = request.query;
            
            let sql = `
                SELECT 
                    id, username, first_name, last_name, 
                    profile_image_url, location, experience_level
                FROM users 
                WHERE is_active = 1 AND privacy_level IN ('public', 'friends')
            `;
            let params = [];

            if (query) {
                sql += ` AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            sql += ` ORDER BY username LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const users = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                users: users.results.map(user => ({
                    id: user.id,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profileImageUrl: user.profile_image_url,
                    location: user.location,
                    experienceLevel: user.experience_level
                })),
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: users.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Search users error:', error);
            return this.errorResponse('Failed to search users', 500);
        }
    }

    // Admin: Get all users
    async adminGetUsers(request) {
        try {
            const { limit = 50, offset = 0, role, status } = request.query;
            
            let sql = 'SELECT * FROM users WHERE 1=1';
            let params = [];

            if (role) {
                sql += ' AND role = ?';
                params.push(role);
            }

            if (status === 'active') {
                sql += ' AND is_active = 1';
            } else if (status === 'inactive') {
                sql += ' AND is_active = 0';
            }

            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const users = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                users: users.results,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: users.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Admin get users error:', error);
            return this.errorResponse('Failed to get users', 500);
        }
    }

    // Admin: Update user role
    async updateUserRole(request) {
        try {
            const userId = request.params.id;
            const body = await request.json();
            const { role } = body;

            if (!['hunter', 'trainer', 'admin'].includes(role)) {
                return this.errorResponse('Invalid role', 400);
            }

            await this.db.prepare(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(role, userId).run();

            return this.successResponse({ message: 'User role updated successfully' });

        } catch (error) {
            console.error('Update user role error:', error);
            return this.errorResponse('Failed to update user role', 500);
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