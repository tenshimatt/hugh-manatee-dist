/**
 * Post Service
 * Handles brag board posts, hunt stories, journals, and media
 */

export class PostService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get posts with filtering
    async getPosts(request) {
        try {
            const { 
                q: query,
                postType,
                userId,
                dogId,
                privacyLevel = 'public',
                featured,
                species,
                startDate,
                endDate,
                sortBy = 'created_at',
                sortOrder = 'desc',
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT p.*, u.username, u.profile_image_url as user_image,
                       d.name as dog_name, d.profile_image_url as dog_image,
                       COUNT(pm.id) as media_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN dogs d ON p.dog_id = d.id
                LEFT JOIN post_media pm ON p.id = pm.post_id
                WHERE p.privacy_level = ?
            `;
            let params = [privacyLevel];

            // If user is authenticated, show their private posts too
            if (request.user && privacyLevel === 'public') {
                sql = sql.replace('WHERE p.privacy_level = ?', 'WHERE (p.privacy_level = ? OR (p.privacy_level IN ("friends", "private") AND p.user_id = ?))');
                params.push(request.user.id);
            }

            if (query) {
                sql += ` AND (p.title LIKE ? OR p.content LIKE ? OR p.location_name LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (postType) {
                sql += ` AND p.post_type = ?`;
                params.push(postType);
            }

            if (userId) {
                sql += ` AND p.user_id = ?`;
                params.push(userId);
            }

            if (dogId) {
                sql += ` AND p.dog_id = ?`;
                params.push(dogId);
            }

            if (featured === 'true') {
                sql += ` AND p.is_featured = 1`;
            }

            if (species) {
                sql += ` AND p.species_harvested LIKE ?`;
                params.push(`%${species}%`);
            }

            if (startDate) {
                sql += ` AND p.hunt_date >= ?`;
                params.push(startDate);
            }

            if (endDate) {
                sql += ` AND p.hunt_date <= ?`;
                params.push(endDate);
            }

            sql += ` GROUP BY p.id`;

            // Add sorting
            const validSortFields = ['created_at', 'hunt_date', 'likes_count', 'comments_count', 'title'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            sql += ` ORDER BY p.${sortField} ${order}`;

            sql += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const posts = await this.db.prepare(sql).bind(...params).all();

            // Get preview media for each post
            const postsWithMedia = await Promise.all(posts.results.map(async (post) => {
                const previewMedia = await this.db.prepare(`
                    SELECT media_type, file_url, thumbnail_url, caption
                    FROM post_media
                    WHERE post_id = ?
                    ORDER BY display_order, created_at
                    LIMIT 3
                `).bind(post.id).all();

                return {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    postType: post.post_type,
                    locationName: post.location_name,
                    latitude: post.latitude,
                    longitude: post.longitude,
                    huntDate: post.hunt_date,
                    speciesHarvested: post.species_harvested ? JSON.parse(post.species_harvested) : [],
                    weatherConditions: post.weather_conditions,
                    tags: post.tags ? JSON.parse(post.tags) : [],
                    privacyLevel: post.privacy_level,
                    isFeatured: post.is_featured,
                    likesCount: post.likes_count,
                    commentsCount: post.comments_count,
                    sharesCount: post.shares_count,
                    mediaCount: post.media_count,
                    username: post.username,
                    userImage: post.user_image,
                    dogName: post.dog_name,
                    dogImage: post.dog_image,
                    previewMedia: previewMedia.results,
                    createdAt: post.created_at,
                    updatedAt: post.updated_at
                };
            }));

            return this.successResponse({
                posts: postsWithMedia,
                filters: {
                    query,
                    postType,
                    userId,
                    dogId,
                    privacyLevel,
                    featured,
                    species,
                    startDate,
                    endDate,
                    sortBy,
                    sortOrder
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: posts.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get posts error:', error);
            return this.errorResponse('Failed to get posts', 500);
        }
    }

    // Create new post
    async createPost(request) {
        try {
            const body = await request.json();
            const {
                title,
                content,
                postType = 'story',
                dogId,
                locationName,
                latitude,
                longitude,
                huntDate,
                speciesHarvested = [],
                weatherConditions,
                tags = [],
                privacyLevel = 'public',
                mediaItems = []
            } = body;

            // Validate required fields
            if (!title || !content) {
                return this.errorResponse('Title and content are required', 400);
            }

            // Validate enums
            if (!['story', 'journal', 'photo', 'video', 'achievement'].includes(postType)) {
                return this.errorResponse('Invalid post type', 400);
            }

            if (!['public', 'friends', 'private'].includes(privacyLevel)) {
                return this.errorResponse('Invalid privacy level', 400);
            }

            // Validate coordinates if provided
            if (latitude && (latitude < -90 || latitude > 90)) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (longitude && (longitude < -180 || longitude > 180)) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Validate dog ownership if provided
            if (dogId) {
                const dog = await this.db.prepare(
                    'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
                ).bind(dogId).first();

                if (!dog || dog.owner_id !== request.user.id) {
                    return this.errorResponse('Invalid dog selection', 400);
                }
            }

            // Validate hunt date
            if (huntDate && new Date(huntDate) > new Date()) {
                return this.errorResponse('Hunt date cannot be in the future', 400);
            }

            const postId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO posts (
                    id, user_id, dog_id, title, content, post_type,
                    location_name, latitude, longitude, hunt_date,
                    species_harvested, weather_conditions, tags, privacy_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                postId, request.user.id, dogId, title, content, postType,
                locationName, latitude, longitude, huntDate,
                JSON.stringify(speciesHarvested), weatherConditions,
                JSON.stringify(tags), privacyLevel
            ).run();

            // Add media items
            for (let i = 0; i < mediaItems.length; i++) {
                const media = mediaItems[i];
                const {
                    mediaType,
                    fileUrl,
                    thumbnailUrl,
                    caption,
                    fileSize,
                    mimeType,
                    width,
                    height,
                    durationSeconds
                } = media;

                if (!mediaType || !fileUrl) continue;

                if (!['image', 'video'].includes(mediaType)) continue;

                const mediaId = crypto.randomUUID();
                await this.db.prepare(`
                    INSERT INTO post_media (
                        id, post_id, media_type, file_url, thumbnail_url, caption,
                        file_size, mime_type, width, height, duration_seconds,
                        display_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    mediaId, postId, mediaType, fileUrl, thumbnailUrl, caption,
                    fileSize, mimeType, width, height, durationSeconds, i
                ).run();
            }

            // Get the created post with media
            const post = await this.getPostWithDetails(postId);

            return this.successResponse(post);

        } catch (error) {
            console.error('Create post error:', error);
            return this.errorResponse('Failed to create post', 500);
        }
    }

    // Get single post with full details
    async getPost(request) {
        try {
            const postId = request.params.id;
            
            const post = await this.db.prepare(`
                SELECT p.*, u.username, u.profile_image_url as user_image,
                       d.name as dog_name, d.profile_image_url as dog_image
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN dogs d ON p.dog_id = d.id
                WHERE p.id = ?
            `).bind(postId).first();

            if (!post) {
                return this.errorResponse('Post not found', 404);
            }

            // Check privacy access
            const isOwner = request.user && post.user_id === request.user.id;
            const isPublic = post.privacy_level === 'public';

            if (!isPublic && !isOwner) {
                return this.errorResponse('Post not accessible', 403);
            }

            // Get all media for this post
            const media = await this.db.prepare(`
                SELECT *
                FROM post_media
                WHERE post_id = ?
                ORDER BY display_order, created_at
            `).bind(postId).all();

            return this.successResponse({
                id: post.id,
                title: post.title,
                content: post.content,
                postType: post.post_type,
                locationName: post.location_name,
                latitude: post.latitude,
                longitude: post.longitude,
                huntDate: post.hunt_date,
                speciesHarvested: post.species_harvested ? JSON.parse(post.species_harvested) : [],
                weatherConditions: post.weather_conditions,
                tags: post.tags ? JSON.parse(post.tags) : [],
                privacyLevel: post.privacy_level,
                isFeatured: post.is_featured,
                likesCount: post.likes_count,
                commentsCount: post.comments_count,
                sharesCount: post.shares_count,
                username: post.username,
                userImage: post.user_image,
                dogName: post.dog_name,
                dogImage: post.dog_image,
                isOwner,
                media: media.results.map(m => ({
                    id: m.id,
                    mediaType: m.media_type,
                    fileUrl: m.file_url,
                    thumbnailUrl: m.thumbnail_url,
                    caption: m.caption,
                    fileSize: m.file_size,
                    mimeType: m.mime_type,
                    width: m.width,
                    height: m.height,
                    durationSeconds: m.duration_seconds,
                    displayOrder: m.display_order,
                    createdAt: m.created_at
                })),
                createdAt: post.created_at,
                updatedAt: post.updated_at
            });

        } catch (error) {
            console.error('Get post error:', error);
            return this.errorResponse('Failed to get post', 500);
        }
    }

    // Update post
    async updatePost(request) {
        try {
            const postId = request.params.id;
            const body = await request.json();

            // Check ownership
            const post = await this.db.prepare(
                'SELECT user_id FROM posts WHERE id = ?'
            ).bind(postId).first();

            if (!post) {
                return this.errorResponse('Post not found', 404);
            }

            if (post.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this post', 403);
            }

            const {
                title,
                content,
                postType,
                dogId,
                locationName,
                latitude,
                longitude,
                huntDate,
                speciesHarvested,
                weatherConditions,
                tags,
                privacyLevel
            } = body;

            // Validate enums if provided
            if (postType && !['story', 'journal', 'photo', 'video', 'achievement'].includes(postType)) {
                return this.errorResponse('Invalid post type', 400);
            }

            if (privacyLevel && !['public', 'friends', 'private'].includes(privacyLevel)) {
                return this.errorResponse('Invalid privacy level', 400);
            }

            // Validate coordinates if provided
            if (latitude && (latitude < -90 || latitude > 90)) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (longitude && (longitude < -180 || longitude > 180)) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Validate dog ownership if provided
            if (dogId) {
                const dog = await this.db.prepare(
                    'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
                ).bind(dogId).first();

                if (!dog || dog.owner_id !== request.user.id) {
                    return this.errorResponse('Invalid dog selection', 400);
                }
            }

            // Update post
            await this.db.prepare(`
                UPDATE posts SET
                    title = COALESCE(?, title),
                    content = COALESCE(?, content),
                    post_type = COALESCE(?, post_type),
                    dog_id = COALESCE(?, dog_id),
                    location_name = COALESCE(?, location_name),
                    latitude = COALESCE(?, latitude),
                    longitude = COALESCE(?, longitude),
                    hunt_date = COALESCE(?, hunt_date),
                    species_harvested = COALESCE(?, species_harvested),
                    weather_conditions = COALESCE(?, weather_conditions),
                    tags = COALESCE(?, tags),
                    privacy_level = COALESCE(?, privacy_level),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                title, content, postType, dogId, locationName, latitude, longitude,
                huntDate, speciesHarvested ? JSON.stringify(speciesHarvested) : null,
                weatherConditions, tags ? JSON.stringify(tags) : null,
                privacyLevel, postId
            ).run();

            // Get updated post
            const updatedPost = await this.getPostWithDetails(postId);

            return this.successResponse(updatedPost);

        } catch (error) {
            console.error('Update post error:', error);
            return this.errorResponse('Failed to update post', 500);
        }
    }

    // Delete post
    async deletePost(request) {
        try {
            const postId = request.params.id;

            // Check ownership
            const post = await this.db.prepare(
                'SELECT user_id FROM posts WHERE id = ?'
            ).bind(postId).first();

            if (!post) {
                return this.errorResponse('Post not found', 404);
            }

            if (post.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to delete this post', 403);
            }

            // Delete post (this will cascade delete media)
            await this.db.prepare(
                'DELETE FROM posts WHERE id = ?'
            ).bind(postId).run();

            return this.successResponse({ message: 'Post deleted successfully' });

        } catch (error) {
            console.error('Delete post error:', error);
            return this.errorResponse('Failed to delete post', 500);
        }
    }

    // Like/unlike post
    async likePost(request) {
        try {
            const postId = request.params.id;

            // Check if post exists
            const post = await this.db.prepare(
                'SELECT id, likes_count FROM posts WHERE id = ?'
            ).bind(postId).first();

            if (!post) {
                return this.errorResponse('Post not found', 404);
            }

            // For now, just increment likes count
            // In a full implementation, you'd have a separate likes table to track individual likes
            await this.db.prepare(
                'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?'
            ).bind(postId).run();

            return this.successResponse({
                liked: true,
                likesCount: post.likes_count + 1
            });

        } catch (error) {
            console.error('Like post error:', error);
            return this.errorResponse('Failed to like post', 500);
        }
    }

    // Get post statistics
    async getPostStats(request) {
        try {
            const stats = await this.db.prepare(`
                SELECT 
                    COUNT(*) as total_posts,
                    COUNT(CASE WHEN privacy_level = 'public' THEN 1 END) as public_posts,
                    COUNT(CASE WHEN post_type = 'story' THEN 1 END) as stories,
                    COUNT(CASE WHEN post_type = 'photo' THEN 1 END) as photos,
                    COUNT(CASE WHEN post_type = 'video' THEN 1 END) as videos,
                    SUM(likes_count) as total_likes,
                    SUM(comments_count) as total_comments
                FROM posts
                WHERE privacy_level = 'public'
            `).first();

            return this.successResponse({
                totalPosts: stats.total_posts,
                publicPosts: stats.public_posts,
                stories: stats.stories,
                photos: stats.photos,
                videos: stats.videos,
                totalLikes: stats.total_likes,
                totalComments: stats.total_comments
            });

        } catch (error) {
            console.error('Get post stats error:', error);
            return this.errorResponse('Failed to get post statistics', 500);
        }
    }

    // Helper method to get post with full details
    async getPostWithDetails(postId) {
        const post = await this.db.prepare(`
            SELECT p.*, u.username, u.profile_image_url as user_image,
                   d.name as dog_name, d.profile_image_url as dog_image
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN dogs d ON p.dog_id = d.id
            WHERE p.id = ?
        `).bind(postId).first();

        const media = await this.db.prepare(`
            SELECT *
            FROM post_media
            WHERE post_id = ?
            ORDER BY display_order, created_at
        `).bind(postId).all();

        return {
            id: post.id,
            title: post.title,
            content: post.content,
            postType: post.post_type,
            locationName: post.location_name,
            latitude: post.latitude,
            longitude: post.longitude,
            huntDate: post.hunt_date,
            speciesHarvested: post.species_harvested ? JSON.parse(post.species_harvested) : [],
            weatherConditions: post.weather_conditions,
            tags: post.tags ? JSON.parse(post.tags) : [],
            privacyLevel: post.privacy_level,
            isFeatured: post.is_featured,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            sharesCount: post.shares_count,
            username: post.username,
            userImage: post.user_image,
            dogName: post.dog_name,
            dogImage: post.dog_image,
            media: media.results.map(m => ({
                id: m.id,
                mediaType: m.media_type,
                fileUrl: m.file_url,
                thumbnailUrl: m.thumbnail_url,
                caption: m.caption,
                fileSize: m.file_size,
                mimeType: m.mime_type,
                width: m.width,
                height: m.height,
                durationSeconds: m.duration_seconds,
                displayOrder: m.display_order,
                createdAt: m.created_at
            })),
            createdAt: post.created_at,
            updatedAt: post.updated_at
        };
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