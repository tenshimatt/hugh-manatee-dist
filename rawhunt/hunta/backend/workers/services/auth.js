/**
 * Authentication Service
 * Handles user registration, login, JWT tokens, and role-based access
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
        this.jwtSecret = env.JWT_SECRET || 'hunta-default-secret';
    }

    // User registration
    async register(request) {
        try {
            const body = await request.json();
            const { email, username, password, firstName, lastName, role = 'hunter' } = body;

            // Validate input
            if (!email || !username || !password) {
                return this.errorResponse('Email, username, and password are required', 400);
            }

            if (password.length < 8) {
                return this.errorResponse('Password must be at least 8 characters', 400);
            }

            // Check if user exists
            const existingUser = await this.db.prepare(
                'SELECT id FROM users WHERE email = ? OR username = ?'
            ).bind(email, username).first();

            if (existingUser) {
                return this.errorResponse('User with this email or username already exists', 409);
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const userId = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO users (id, email, username, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(userId, email, username, passwordHash, firstName, lastName, role).run();

            // Generate JWT token
            const token = this.generateToken({ id: userId, email, username, role });

            return this.successResponse({
                user: {
                    id: userId,
                    email,
                    username,
                    firstName,
                    lastName,
                    role
                },
                token
            });

        } catch (error) {
            console.error('Registration error:', error);
            return this.errorResponse('Registration failed', 500);
        }
    }

    // User login
    async login(request) {
        try {
            const body = await request.json();
            const { email, password } = body;

            if (!email || !password) {
                return this.errorResponse('Email and password are required', 400);
            }

            // Find user
            const user = await this.db.prepare(
                'SELECT * FROM users WHERE email = ? AND is_active = 1'
            ).bind(email).first();

            if (!user) {
                return this.errorResponse('Invalid credentials', 401);
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return this.errorResponse('Invalid credentials', 401);
            }

            // Update last login
            await this.db.prepare(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(user.id).run();

            // Generate JWT token
            const token = this.generateToken({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            });

            return this.successResponse({
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    profileImageUrl: user.profile_image_url
                },
                token
            });

        } catch (error) {
            console.error('Login error:', error);
            return this.errorResponse('Login failed', 500);
        }
    }

    // Token refresh
    async refresh(request) {
        try {
            const token = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return this.errorResponse('Token required', 401);
            }

            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await this.db.prepare(
                'SELECT * FROM users WHERE id = ? AND is_active = 1'
            ).bind(decoded.id).first();

            if (!user) {
                return this.errorResponse('User not found', 404);
            }

            const newToken = this.generateToken({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            });

            return this.successResponse({ token: newToken });

        } catch (error) {
            return this.errorResponse('Invalid token', 401);
        }
    }

    // Logout (add token to blacklist in cache)
    async logout(request) {
        try {
            const token = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (token && this.cache) {
                // Add token to blacklist with expiration
                await this.cache.put(`blacklist:${token}`, '1', { expirationTtl: 86400 });
            }
            return this.successResponse({ message: 'Logged out successfully' });
        } catch (error) {
            return this.errorResponse('Logout failed', 500);
        }
    }

    // Email verification
    async verifyEmail(request) {
        try {
            const body = await request.json();
            const { token } = body;

            // In a real implementation, you'd verify the email token
            // and update the user's email_verified status
            return this.successResponse({ message: 'Email verified successfully' });

        } catch (error) {
            return this.errorResponse('Email verification failed', 500);
        }
    }

    // Forgot password
    async forgotPassword(request) {
        try {
            const body = await request.json();
            const { email } = body;

            const user = await this.db.prepare(
                'SELECT id FROM users WHERE email = ?'
            ).bind(email).first();

            // Always return success to prevent email enumeration
            return this.successResponse({
                message: 'If the email exists, a reset link has been sent'
            });

        } catch (error) {
            return this.errorResponse('Password reset failed', 500);
        }
    }

    // Reset password
    async resetPassword(request) {
        try {
            const body = await request.json();
            const { token, newPassword } = body;

            if (newPassword.length < 8) {
                return this.errorResponse('Password must be at least 8 characters', 400);
            }

            // In a real implementation, verify the reset token
            // and update the user's password
            return this.successResponse({ message: 'Password reset successfully' });

        } catch (error) {
            return this.errorResponse('Password reset failed', 500);
        }
    }

    // Verify JWT token
    async verifyToken(token) {
        try {
            // Check if token is blacklisted
            if (this.cache) {
                const isBlacklisted = await this.cache.get(`blacklist:${token}`);
                if (isBlacklisted) {
                    throw new Error('Token is blacklisted');
                }
            }

            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await this.db.prepare(
                'SELECT * FROM users WHERE id = ? AND is_active = 1'
            ).bind(decoded.id).first();

            if (!user) {
                throw new Error('User not found');
            }

            return {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            };

        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Generate JWT token
    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '24h',
            issuer: 'hunta-platform'
        });
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