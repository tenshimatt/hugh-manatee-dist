/**
 * Media Service
 * Handles file uploads, image processing, and media management
 */

export class MediaService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
        this.media = env.MEDIA; // R2 bucket for file storage
    }

    // Upload file to R2 storage
    async uploadFile(request) {
        try {
            const formData = await request.formData();
            const file = formData.get('file');
            const category = formData.get('category') || 'general';
            const isPublic = formData.get('isPublic') !== 'false';

            if (!file) {
                return this.errorResponse('No file provided', 400);
            }

            // Validate file type
            const allowedTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
                'video/mp4', 'video/webm', 'video/mov', 'video/avi',
                'application/gpx+xml', 'text/xml'
            ];

            if (!allowedTypes.includes(file.type)) {
                return this.errorResponse('Unsupported file type', 400);
            }

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                return this.errorResponse('File size exceeds 100MB limit', 400);
            }

            // Generate unique filename
            const fileExtension = this.getFileExtension(file.name);
            const fileName = `${crypto.randomUUID()}.${fileExtension}`;
            const filePath = `${category}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

            // Upload to R2
            if (this.media) {
                const fileBuffer = await file.arrayBuffer();
                await this.media.put(filePath, fileBuffer, {
                    httpMetadata: {
                        contentType: file.type,
                        cacheControl: 'public, max-age=31536000'
                    },
                    customMetadata: {
                        originalName: file.name,
                        uploadedBy: request.user.id,
                        category: category
                    }
                });
            }

            // Generate file URL (in production, this would be your R2 domain)
            const fileUrl = `https://media.hunta.com/${filePath}`;
            
            // Generate thumbnail for images
            let thumbnailUrl = null;
            if (file.type.startsWith('image/')) {
                thumbnailUrl = await this.generateThumbnail(filePath, file.type);
            }

            // Extract metadata
            const metadata = await this.extractMetadata(file, file.type);

            // Store file info in database
            const mediaId = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO media_files (
                    id, user_id, file_name, original_name, file_path, file_url,
                    thumbnail_url, file_type, file_size, category, is_public,
                    width, height, duration_seconds, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                mediaId, request.user.id, fileName, file.name, filePath, fileUrl,
                thumbnailUrl, file.type, file.size, category, isPublic,
                metadata.width, metadata.height, metadata.duration, JSON.stringify(metadata)
            ).run();

            return this.successResponse({
                id: mediaId,
                fileName: fileName,
                originalName: file.name,
                fileUrl: fileUrl,
                thumbnailUrl: thumbnailUrl,
                fileType: file.type,
                fileSize: file.size,
                category: category,
                isPublic: isPublic,
                width: metadata.width,
                height: metadata.height,
                duration: metadata.duration,
                metadata: metadata
            });

        } catch (error) {
            console.error('File upload error:', error);
            return this.errorResponse('Failed to upload file', 500);
        }
    }

    // Delete file
    async deleteFile(request) {
        try {
            const mediaId = request.params.id;

            // Get file info
            const media = await this.db.prepare(
                'SELECT * FROM media_files WHERE id = ?'
            ).bind(mediaId).first();

            if (!media) {
                return this.errorResponse('File not found', 404);
            }

            // Check ownership or admin rights
            if (media.user_id !== request.user.id && request.user.role !== 'admin') {
                return this.errorResponse('Not authorized to delete this file', 403);
            }

            // Delete from R2
            if (this.media) {
                try {
                    await this.media.delete(media.file_path);
                    // Also delete thumbnail if exists
                    if (media.thumbnail_url) {
                        const thumbnailPath = media.file_path.replace(/\.[^.]+$/, '_thumb.jpg');
                        await this.media.delete(thumbnailPath);
                    }
                } catch (r2Error) {
                    console.error('R2 deletion error:', r2Error);
                    // Continue with database deletion even if R2 fails
                }
            }

            // Delete from database
            await this.db.prepare(
                'DELETE FROM media_files WHERE id = ?'
            ).bind(mediaId).run();

            return this.successResponse({ message: 'File deleted successfully' });

        } catch (error) {
            console.error('Delete file error:', error);
            return this.errorResponse('Failed to delete file', 500);
        }
    }

    // Get user's media files
    async getMediaFiles(request) {
        try {
            const { 
                category,
                fileType,
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT id, file_name, original_name, file_url, thumbnail_url,
                       file_type, file_size, category, is_public,
                       width, height, duration_seconds, created_at
                FROM media_files
                WHERE user_id = ?
            `;
            let params = [request.user.id];

            if (category) {
                sql += ` AND category = ?`;
                params.push(category);
            }

            if (fileType) {
                sql += ` AND file_type LIKE ?`;
                params.push(`${fileType}%`);
            }

            sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const files = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                files: files.results,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: files.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get media files error:', error);
            return this.errorResponse('Failed to get media files', 500);
        }
    }

    // Generate thumbnail for images
    async generateThumbnail(filePath, mimeType) {
        // In production, you would use an image processing service
        // For now, return a placeholder URL
        const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
        return `https://media.hunta.com/${thumbnailPath}`;
    }

    // Extract metadata from files
    async extractMetadata(file, mimeType) {
        const metadata = {
            originalName: file.name,
            size: file.size,
            type: mimeType,
            width: null,
            height: null,
            duration: null
        };

        // For images, you would extract EXIF data and dimensions
        if (mimeType.startsWith('image/')) {
            // Placeholder - in production, use image processing library
            metadata.width = 1920;
            metadata.height = 1080;
        }

        // For videos, extract duration and dimensions
        if (mimeType.startsWith('video/')) {
            // Placeholder - in production, use video processing library
            metadata.width = 1920;
            metadata.height = 1080;
            metadata.duration = 120; // seconds
        }

        return metadata;
    }

    // Get file extension from filename
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Generate secure upload URL (for direct uploads)
    async generateUploadUrl(request) {
        try {
            const body = await request.json();
            const { fileName, fileType, category = 'general' } = body;

            if (!fileName || !fileType) {
                return this.errorResponse('File name and type are required', 400);
            }

            // Validate file type
            const allowedTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
                'video/mp4', 'video/webm', 'video/mov', 'video/avi',
                'application/gpx+xml', 'text/xml'
            ];

            if (!allowedTypes.includes(fileType)) {
                return this.errorResponse('Unsupported file type', 400);
            }

            // Generate unique filename and path
            const fileExtension = this.getFileExtension(fileName);
            const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
            const filePath = `${category}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

            // In production, generate a signed URL for direct upload to R2
            const uploadUrl = `https://api.hunta.com/upload-endpoint/${filePath}`;

            return this.successResponse({
                uploadUrl,
                filePath,
                fileName: uniqueFileName,
                expiresIn: 3600 // 1 hour
            });

        } catch (error) {
            console.error('Generate upload URL error:', error);
            return this.errorResponse('Failed to generate upload URL', 500);
        }
    }

    // Process uploaded file after direct upload
    async processUploadedFile(request) {
        try {
            const body = await request.json();
            const { filePath, originalName, fileType, fileSize, category = 'general', metadata = {} } = body;

            if (!filePath || !originalName || !fileType) {
                return this.errorResponse('File path, original name, and type are required', 400);
            }

            const fileUrl = `https://media.hunta.com/${filePath}`;
            const fileName = filePath.split('/').pop();

            // Generate thumbnail if image
            let thumbnailUrl = null;
            if (fileType.startsWith('image/')) {
                thumbnailUrl = await this.generateThumbnail(filePath, fileType);
            }

            // Store in database
            const mediaId = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO media_files (
                    id, user_id, file_name, original_name, file_path, file_url,
                    thumbnail_url, file_type, file_size, category, is_public,
                    width, height, duration_seconds, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                mediaId, request.user.id, fileName, originalName, filePath, fileUrl,
                thumbnailUrl, fileType, fileSize, category, true,
                metadata.width, metadata.height, metadata.duration, JSON.stringify(metadata)
            ).run();

            return this.successResponse({
                id: mediaId,
                fileName: fileName,
                originalName: originalName,
                fileUrl: fileUrl,
                thumbnailUrl: thumbnailUrl,
                fileType: fileType,
                fileSize: fileSize,
                category: category,
                metadata: metadata
            });

        } catch (error) {
            console.error('Process uploaded file error:', error);
            return this.errorResponse('Failed to process uploaded file', 500);
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