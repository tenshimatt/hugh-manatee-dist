/**
 * Route Service
 * Handles hunt routes, GPS data, elevation tracking, and wildlife spotting
 */

export class RouteService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get routes with filtering
    async getRoutes(request) {
        try {
            const { 
                q: query,
                difficulty,
                terrain,
                status = 'public',
                near_lat,
                near_lng,
                radius_km = 50,
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT r.*, u.username as creator_username
                FROM hunt_routes r
                JOIN users u ON r.user_id = u.id
                WHERE r.route_status = ?
            `;
            let params = [status];

            if (query) {
                sql += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.location_name LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (difficulty) {
                sql += ` AND r.difficulty_level = ?`;
                params.push(difficulty);
            }

            if (terrain) {
                sql += ` AND r.terrain_type LIKE ?`;
                params.push(`%${terrain}%`);
            }

            // Add proximity search if coordinates provided
            if (near_lat && near_lng) {
                sql += ` AND (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(r.start_latitude)) * 
                        cos(radians(r.start_longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(r.start_latitude))
                    )
                ) <= ?`;
                params.push(parseFloat(near_lat), parseFloat(near_lng), parseFloat(near_lat), parseFloat(radius_km));
            }

            sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const routes = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                routes: routes.results.map(route => ({
                    id: route.id,
                    title: route.title,
                    description: route.description,
                    locationName: route.location_name,
                    startLatitude: route.start_latitude,
                    startLongitude: route.start_longitude,
                    distanceKm: route.distance_km,
                    elevationGainM: route.elevation_gain_m,
                    difficultyLevel: route.difficulty_level,
                    terrainType: route.terrain_type,
                    wildlifeSpotted: route.wildlife_spotted ? JSON.parse(route.wildlife_spotted) : [],
                    weatherConditions: route.weather_conditions,
                    tags: route.tags ? JSON.parse(route.tags) : [],
                    isFavorite: route.is_favorite,
                    creatorUsername: route.creator_username,
                    createdAt: route.created_at,
                    updatedAt: route.updated_at
                })),
                filters: {
                    query,
                    difficulty,
                    terrain,
                    status,
                    nearLat: near_lat,
                    nearLng: near_lng,
                    radiusKm: radius_km
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: routes.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get routes error:', error);
            return this.errorResponse('Failed to get routes', 500);
        }
    }

    // Create new route
    async createRoute(request) {
        try {
            const body = await request.json();
            const {
                title,
                description,
                locationName,
                startLatitude,
                startLongitude,
                gpxData,
                distanceKm,
                elevationGainM,
                difficultyLevel = 'moderate',
                terrainType,
                wildlifeSpotted = [],
                weatherConditions,
                routeStatus = 'public',
                tags = []
            } = body;

            // Validate required fields
            if (!title) {
                return this.errorResponse('Route title is required', 400);
            }

            if (!startLatitude || !startLongitude) {
                return this.errorResponse('Start coordinates are required', 400);
            }

            // Validate enums
            if (!['easy', 'moderate', 'difficult', 'expert'].includes(difficultyLevel)) {
                return this.errorResponse('Invalid difficulty level', 400);
            }

            if (!['draft', 'public', 'private'].includes(routeStatus)) {
                return this.errorResponse('Invalid route status', 400);
            }

            // Validate coordinates
            if (startLatitude < -90 || startLatitude > 90) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (startLongitude < -180 || startLongitude > 180) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Validate numeric fields
            if (distanceKm && (distanceKm < 0 || distanceKm > 1000)) {
                return this.errorResponse('Distance must be between 0 and 1000 km', 400);
            }

            if (elevationGainM && (elevationGainM < 0 || elevationGainM > 10000)) {
                return this.errorResponse('Elevation gain must be between 0 and 10000 m', 400);
            }

            const routeId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO hunt_routes (
                    id, user_id, title, description, location_name,
                    start_latitude, start_longitude, gpx_data,
                    distance_km, elevation_gain_m, difficulty_level,
                    terrain_type, wildlife_spotted, weather_conditions,
                    route_status, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                routeId, request.user.id, title, description, locationName,
                startLatitude, startLongitude, gpxData,
                distanceKm, elevationGainM, difficultyLevel,
                terrainType, JSON.stringify(wildlifeSpotted), weatherConditions,
                routeStatus, JSON.stringify(tags)
            ).run();

            // Get the created route
            const route = await this.db.prepare(
                'SELECT * FROM hunt_routes WHERE id = ?'
            ).bind(routeId).first();

            return this.successResponse({
                id: route.id,
                title: route.title,
                description: route.description,
                locationName: route.location_name,
                startLatitude: route.start_latitude,
                startLongitude: route.start_longitude,
                gpxData: route.gpx_data,
                distanceKm: route.distance_km,
                elevationGainM: route.elevation_gain_m,
                difficultyLevel: route.difficulty_level,
                terrainType: route.terrain_type,
                wildlifeSpotted: route.wildlife_spotted ? JSON.parse(route.wildlife_spotted) : [],
                weatherConditions: route.weather_conditions,
                routeStatus: route.route_status,
                tags: route.tags ? JSON.parse(route.tags) : [],
                isFavorite: route.is_favorite,
                createdAt: route.created_at,
                updatedAt: route.updated_at
            });

        } catch (error) {
            console.error('Create route error:', error);
            return this.errorResponse('Failed to create route', 500);
        }
    }

    // Get single route
    async getRoute(request) {
        try {
            const routeId = request.params.id;
            
            const route = await this.db.prepare(`
                SELECT r.*, u.username as creator_username
                FROM hunt_routes r
                JOIN users u ON r.user_id = u.id
                WHERE r.id = ?
            `).bind(routeId).first();

            if (!route) {
                return this.errorResponse('Route not found', 404);
            }

            // Check if route is accessible
            const isOwner = request.user && route.user_id === request.user.id;
            const isPublic = route.route_status === 'public';

            if (!isPublic && !isOwner) {
                return this.errorResponse('Route not accessible', 403);
            }

            return this.successResponse({
                id: route.id,
                title: route.title,
                description: route.description,
                locationName: route.location_name,
                startLatitude: route.start_latitude,
                startLongitude: route.start_longitude,
                gpxData: route.gpx_data,
                distanceKm: route.distance_km,
                elevationGainM: route.elevation_gain_m,
                difficultyLevel: route.difficulty_level,
                terrainType: route.terrain_type,
                wildlifeSpotted: route.wildlife_spotted ? JSON.parse(route.wildlife_spotted) : [],
                weatherConditions: route.weather_conditions,
                routeStatus: route.route_status,
                tags: route.tags ? JSON.parse(route.tags) : [],
                isFavorite: route.is_favorite,
                creatorUsername: route.creator_username,
                isOwner,
                createdAt: route.created_at,
                updatedAt: route.updated_at
            });

        } catch (error) {
            console.error('Get route error:', error);
            return this.errorResponse('Failed to get route', 500);
        }
    }

    // Update route
    async updateRoute(request) {
        try {
            const routeId = request.params.id;
            const body = await request.json();

            // Check ownership
            const route = await this.db.prepare(
                'SELECT user_id FROM hunt_routes WHERE id = ?'
            ).bind(routeId).first();

            if (!route) {
                return this.errorResponse('Route not found', 404);
            }

            if (route.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this route', 403);
            }

            const {
                title,
                description,
                locationName,
                startLatitude,
                startLongitude,
                gpxData,
                distanceKm,
                elevationGainM,
                difficultyLevel,
                terrainType,
                wildlifeSpotted,
                weatherConditions,
                routeStatus,
                tags,
                isFavorite
            } = body;

            // Validate enums if provided
            if (difficultyLevel && !['easy', 'moderate', 'difficult', 'expert'].includes(difficultyLevel)) {
                return this.errorResponse('Invalid difficulty level', 400);
            }

            if (routeStatus && !['draft', 'public', 'private'].includes(routeStatus)) {
                return this.errorResponse('Invalid route status', 400);
            }

            // Validate coordinates if provided
            if (startLatitude && (startLatitude < -90 || startLatitude > 90)) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (startLongitude && (startLongitude < -180 || startLongitude > 180)) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Update route
            await this.db.prepare(`
                UPDATE hunt_routes SET
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    location_name = COALESCE(?, location_name),
                    start_latitude = COALESCE(?, start_latitude),
                    start_longitude = COALESCE(?, start_longitude),
                    gpx_data = COALESCE(?, gpx_data),
                    distance_km = COALESCE(?, distance_km),
                    elevation_gain_m = COALESCE(?, elevation_gain_m),
                    difficulty_level = COALESCE(?, difficulty_level),
                    terrain_type = COALESCE(?, terrain_type),
                    wildlife_spotted = COALESCE(?, wildlife_spotted),
                    weather_conditions = COALESCE(?, weather_conditions),
                    route_status = COALESCE(?, route_status),
                    tags = COALESCE(?, tags),
                    is_favorite = COALESCE(?, is_favorite),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                title, description, locationName, startLatitude, startLongitude,
                gpxData, distanceKm, elevationGainM, difficultyLevel, terrainType,
                wildlifeSpotted ? JSON.stringify(wildlifeSpotted) : null,
                weatherConditions, routeStatus, 
                tags ? JSON.stringify(tags) : null,
                isFavorite, routeId
            ).run();

            // Get updated route
            const updatedRoute = await this.db.prepare(
                'SELECT * FROM hunt_routes WHERE id = ?'
            ).bind(routeId).first();

            return this.successResponse({
                id: updatedRoute.id,
                title: updatedRoute.title,
                description: updatedRoute.description,
                locationName: updatedRoute.location_name,
                startLatitude: updatedRoute.start_latitude,
                startLongitude: updatedRoute.start_longitude,
                gpxData: updatedRoute.gpx_data,
                distanceKm: updatedRoute.distance_km,
                elevationGainM: updatedRoute.elevation_gain_m,
                difficultyLevel: updatedRoute.difficulty_level,
                terrainType: updatedRoute.terrain_type,
                wildlifeSpotted: updatedRoute.wildlife_spotted ? JSON.parse(updatedRoute.wildlife_spotted) : [],
                weatherConditions: updatedRoute.weather_conditions,
                routeStatus: updatedRoute.route_status,
                tags: updatedRoute.tags ? JSON.parse(updatedRoute.tags) : [],
                isFavorite: updatedRoute.is_favorite,
                createdAt: updatedRoute.created_at,
                updatedAt: updatedRoute.updated_at
            });

        } catch (error) {
            console.error('Update route error:', error);
            return this.errorResponse('Failed to update route', 500);
        }
    }

    // Delete route
    async deleteRoute(request) {
        try {
            const routeId = request.params.id;

            // Check ownership
            const route = await this.db.prepare(
                'SELECT user_id FROM hunt_routes WHERE id = ?'
            ).bind(routeId).first();

            if (!route) {
                return this.errorResponse('Route not found', 404);
            }

            if (route.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to delete this route', 403);
            }

            // Delete route
            await this.db.prepare(
                'DELETE FROM hunt_routes WHERE id = ?'
            ).bind(routeId).run();

            return this.successResponse({ message: 'Route deleted successfully' });

        } catch (error) {
            console.error('Delete route error:', error);
            return this.errorResponse('Failed to delete route', 500);
        }
    }

    // Upload GPX file for route
    async uploadGPX(request) {
        try {
            const routeId = request.params.id;
            const body = await request.json();
            const { gpxData } = body;

            if (!gpxData) {
                return this.errorResponse('GPX data is required', 400);
            }

            // Check ownership
            const route = await this.db.prepare(
                'SELECT user_id FROM hunt_routes WHERE id = ?'
            ).bind(routeId).first();

            if (!route) {
                return this.errorResponse('Route not found', 404);
            }

            if (route.user_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this route', 403);
            }

            // Parse GPX data to extract key metrics
            const gpxMetrics = this.parseGPXMetrics(gpxData);

            // Update route with GPX data and metrics
            await this.db.prepare(`
                UPDATE hunt_routes SET
                    gpx_data = ?,
                    distance_km = COALESCE(?, distance_km),
                    elevation_gain_m = COALESCE(?, elevation_gain_m),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(gpxData, gpxMetrics.distance, gpxMetrics.elevationGain, routeId).run();

            return this.successResponse({
                message: 'GPX data uploaded successfully',
                metrics: gpxMetrics
            });

        } catch (error) {
            console.error('Upload GPX error:', error);
            return this.errorResponse('Failed to upload GPX data', 500);
        }
    }

    // Parse GPX data to extract basic metrics
    parseGPXMetrics(gpxData) {
        try {
            // Basic GPX parsing - in production you'd use a proper GPX parser
            // This is a simplified version that extracts distance and elevation
            
            // Extract track points from GPX
            const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>[\s\S]*?<ele>([^<]*)<\/ele>[\s\S]*?<\/trkpt>/g;
            const points = [];
            let match;

            while ((match = trkptRegex.exec(gpxData)) !== null) {
                points.push({
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    ele: parseFloat(match[3])
                });
            }

            if (points.length < 2) {
                return { distance: null, elevationGain: null };
            }

            // Calculate total distance using Haversine formula
            let totalDistance = 0;
            let totalElevationGain = 0;
            let minElevation = points[0].ele;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];

                // Calculate distance between points
                const R = 6371; // Earth's radius in km
                const dLat = this.toRadians(curr.lat - prev.lat);
                const dLng = this.toRadians(curr.lng - prev.lng);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                         Math.cos(this.toRadians(prev.lat)) * Math.cos(this.toRadians(curr.lat)) *
                         Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                totalDistance += R * c;

                // Calculate elevation gain
                if (curr.ele > prev.ele) {
                    totalElevationGain += curr.ele - prev.ele;
                }

                minElevation = Math.min(minElevation, curr.ele);
            }

            return {
                distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
                elevationGain: Math.round(totalElevationGain)
            };

        } catch (error) {
            console.error('GPX parsing error:', error);
            return { distance: null, elevationGain: null };
        }
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
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