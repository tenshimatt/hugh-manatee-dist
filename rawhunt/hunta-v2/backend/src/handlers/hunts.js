/**
 * Hunt Logging Handler - GPS Tracking & Hunt Management
 * Core functionality for logging hunting sessions with GPS data
 */

export async function huntsHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/hunts/list' && method === 'GET') {
            return await listHunts(request, env);
        } else if (path === '/api/hunts/create' && method === 'POST') {
            return await createHunt(request, env);
        } else if (path.match(/^\/api\/hunts\/[^\/]+$/) && method === 'GET') {
            const huntId = path.split('/').pop();
            return await getHunt(request, huntId, env);
        } else if (path.match(/^\/api\/hunts\/[^\/]+$/) && method === 'PUT') {
            const huntId = path.split('/').pop();
            return await updateHunt(request, huntId, env);
        } else if (path === '/api/hunts/start-tracking' && method === 'POST') {
            return await startHuntTracking(request, env);
        } else if (path === '/api/hunts/update-location' && method === 'POST') {
            return await updateHuntLocation(request, env);
        } else if (path === '/api/hunts/end-tracking' && method === 'POST') {
            return await endHuntTracking(request, env);
        } else if (path === '/api/hunts/sync-offline' && method === 'POST') {
            return await syncOfflineData(request, env);
        } else {
            return errorResponse('Hunt endpoint not found', 404);
        }
    } catch (error) {
        console.error('Hunt handler error:', error);
        return errorResponse('Hunt operation failed', 500);
    }
}

async function listHunts(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        // Demo data if no database
        if (!env.DB) {
            return successResponse([
                {
                    id: '1',
                    hunt_date: '2025-01-15',
                    location: 'Pine Ridge Preserve, GA',
                    dogs_present: ['Rex', 'Bella'],
                    duration_minutes: 180,
                    game_harvested: [
                        { species: 'Bobwhite Quail', count: 3 },
                        { species: 'Pheasant', count: 1 }
                    ],
                    success_rating: 5,
                    weather_conditions: {
                        temperature: 45,
                        wind_speed: 8,
                        conditions: 'Partly Cloudy'
                    },
                    gps_route: {
                        distance_miles: 3.2,
                        waypoints: [
                            { lat: 33.123, lng: -84.456, timestamp: '09:00:00', type: 'start' },
                            { lat: 33.125, lng: -84.458, timestamp: '09:30:00', type: 'point' },
                            { lat: 33.127, lng: -84.460, timestamp: '10:15:00', type: 'harvest' },
                            { lat: 33.123, lng: -84.456, timestamp: '12:00:00', type: 'end' }
                        ]
                    },
                    notes: 'Excellent day in the field. Dogs performed exceptionally well.',
                    created_at: '2025-01-15T12:30:00Z'
                },
                {
                    id: '2',
                    hunt_date: '2025-01-20',
                    location: 'Marsh Creek WMA, AL',
                    dogs_present: ['Duke'],
                    duration_minutes: 120,
                    game_harvested: [
                        { species: 'Mallard', count: 2 },
                        { species: 'Teal', count: 3 }
                    ],
                    success_rating: 4,
                    weather_conditions: {
                        temperature: 38,
                        wind_speed: 12,
                        conditions: 'Overcast'
                    },
                    gps_route: {
                        distance_miles: 1.8,
                        waypoints: []
                    },
                    notes: 'Good waterfowl action despite windy conditions.',
                    created_at: '2025-01-20T14:15:00Z'
                }
            ]);
        }

        const hunts = await env.DB.prepare(`
            SELECT 
                h.id, h.hunt_date, h.location, h.duration_minutes, h.success_rating,
                h.weather_conditions, h.gps_route, h.game_harvested, h.notes,
                h.created_at, h.dogs_present
            FROM hunt_logs h
            WHERE h.user_id = ? AND h.is_active = 1
            ORDER BY h.hunt_date DESC, h.created_at DESC
            LIMIT 50
        `).bind(user.data.userId).all();

        const huntData = hunts.results.map(hunt => ({
            ...hunt,
            weather_conditions: hunt.weather_conditions ? JSON.parse(hunt.weather_conditions) : null,
            gps_route: hunt.gps_route ? JSON.parse(hunt.gps_route) : null,
            game_harvested: hunt.game_harvested ? JSON.parse(hunt.game_harvested) : [],
            dogs_present: hunt.dogs_present ? JSON.parse(hunt.dogs_present) : []
        }));

        return successResponse(huntData);

    } catch (error) {
        console.error('List hunts error:', error);
        return errorResponse('Failed to fetch hunts', 500);
    }
}

async function createHunt(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { 
            hunt_date, location, dogs_present, duration_minutes, 
            success_rating, weather_conditions, gps_route, 
            game_harvested, notes, equipment_used 
        } = body;

        // Validation
        if (!hunt_date || !location) {
            return errorResponse('Hunt date and location are required', 400);
        }

        if (success_rating && (success_rating < 1 || success_rating > 5)) {
            return errorResponse('Success rating must be between 1 and 5', 400);
        }

        // Validate GPS data if provided
        if (gps_route && gps_route.waypoints) {
            for (const waypoint of gps_route.waypoints) {
                if (!validateGPSCoordinates(waypoint.lat, waypoint.lng)) {
                    return errorResponse('Invalid GPS coordinates in route', 400);
                }
            }
        }

        const huntId = generateId();

        // Demo response if no database
        if (!env.DB) {
            return successResponse({
                id: huntId,
                hunt_date,
                location,
                dogs_present: dogs_present || [],
                duration_minutes: duration_minutes || 0,
                success_rating: success_rating || 3,
                weather_conditions: weather_conditions || {},
                gps_route: gps_route || {},
                game_harvested: game_harvested || [],
                notes: notes || '',
                created_at: new Date().toISOString(),
                message: 'Demo hunt created - database not connected'
            });
        }

        // Create hunt log in database
        await env.DB.prepare(`
            INSERT INTO hunt_logs (
                id, user_id, hunt_date, location, dogs_present, duration_minutes,
                success_rating, weather_conditions, gps_route, game_harvested,
                notes, equipment_used
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            huntId, user.data.userId, hunt_date, location,
            JSON.stringify(dogs_present || []),
            duration_minutes || 0,
            success_rating || 3,
            JSON.stringify(weather_conditions || {}),
            JSON.stringify(gps_route || {}),
            JSON.stringify(game_harvested || []),
            notes || '',
            JSON.stringify(equipment_used || [])
        ).run();

        return successResponse({
            id: huntId,
            hunt_date,
            location,
            dogs_present: dogs_present || [],
            duration_minutes: duration_minutes || 0,
            success_rating: success_rating || 3,
            weather_conditions: weather_conditions || {},
            gps_route: gps_route || {},
            game_harvested: game_harvested || [],
            notes: notes || '',
            created_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Create hunt error:', error);
        return errorResponse('Failed to create hunt log', 500);
    }
}

async function startHuntTracking(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { location, dogs_selected, weather_check } = body;

        if (!location) {
            return errorResponse('Starting location is required', 400);
        }

        // Create active hunt session
        const sessionId = generateId();
        const huntData = {
            id: sessionId,
            user_id: user.data.userId,
            start_time: new Date().toISOString(),
            start_location: location,
            dogs_present: dogs_selected || [],
            weather_conditions: weather_check || {},
            status: 'active',
            gps_waypoints: [{
                lat: location.lat,
                lng: location.lng,
                timestamp: new Date().toISOString(),
                type: 'start'
            }]
        };

        // Store in KV for active tracking
        if (env.CACHE) {
            await env.CACHE.put(`hunt_session_${sessionId}`, JSON.stringify(huntData), {
                expirationTtl: 86400 // 24 hours
            });
        }

        return successResponse({
            session_id: sessionId,
            status: 'tracking_started',
            start_time: huntData.start_time,
            location: location,
            dogs_present: dogs_selected || [],
            message: 'Hunt tracking started successfully'
        });

    } catch (error) {
        console.error('Start hunt tracking error:', error);
        return errorResponse('Failed to start hunt tracking', 500);
    }
}

async function updateHuntLocation(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { session_id, location, waypoint_type, notes } = body;

        if (!session_id || !location) {
            return errorResponse('Session ID and location are required', 400);
        }

        if (!validateGPSCoordinates(location.lat, location.lng)) {
            return errorResponse('Invalid GPS coordinates', 400);
        }

        // Retrieve active session
        let huntSession = null;
        if (env.CACHE) {
            const sessionData = await env.CACHE.get(`hunt_session_${session_id}`);
            if (sessionData) {
                huntSession = JSON.parse(sessionData);
            }
        }

        if (!huntSession) {
            return errorResponse('Active hunt session not found', 404);
        }

        // Add new waypoint
        const waypoint = {
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date().toISOString(),
            type: waypoint_type || 'track',
            notes: notes || null,
            accuracy: location.accuracy || null
        };

        huntSession.gps_waypoints.push(waypoint);
        huntSession.last_update = new Date().toISOString();

        // Update session in cache
        if (env.CACHE) {
            await env.CACHE.put(`hunt_session_${session_id}`, JSON.stringify(huntSession), {
                expirationTtl: 86400
            });
        }

        return successResponse({
            status: 'location_updated',
            waypoint_added: waypoint,
            total_waypoints: huntSession.gps_waypoints.length,
            session_id: session_id
        });

    } catch (error) {
        console.error('Update hunt location error:', error);
        return errorResponse('Failed to update hunt location', 500);
    }
}

async function endHuntTracking(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { session_id, end_location, final_notes, game_harvested, success_rating } = body;

        if (!session_id) {
            return errorResponse('Session ID is required', 400);
        }

        // Retrieve active session
        let huntSession = null;
        if (env.CACHE) {
            const sessionData = await env.CACHE.get(`hunt_session_${session_id}`);
            if (sessionData) {
                huntSession = JSON.parse(sessionData);
            }
        }

        if (!huntSession) {
            return errorResponse('Active hunt session not found', 404);
        }

        // Calculate hunt duration
        const startTime = new Date(huntSession.start_time);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - startTime) / 60000);

        // Add end waypoint if location provided
        if (end_location && validateGPSCoordinates(end_location.lat, end_location.lng)) {
            huntSession.gps_waypoints.push({
                lat: end_location.lat,
                lng: end_location.lng,
                timestamp: endTime.toISOString(),
                type: 'end'
            });
        }

        // Calculate route statistics
        const routeStats = calculateRouteStats(huntSession.gps_waypoints);

        // Create final hunt log
        const huntLog = {
            id: generateId(),
            hunt_date: startTime.toISOString().split('T')[0],
            location: huntSession.start_location.name || 'GPS Location',
            dogs_present: huntSession.dogs_present,
            duration_minutes: durationMinutes,
            success_rating: success_rating || 3,
            weather_conditions: huntSession.weather_conditions,
            gps_route: {
                waypoints: huntSession.gps_waypoints,
                distance_miles: routeStats.distance,
                total_points: routeStats.totalPoints
            },
            game_harvested: game_harvested || [],
            notes: final_notes || '',
            created_at: endTime.toISOString()
        };

        // Save to database if available
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT INTO hunt_logs (
                        id, user_id, hunt_date, location, dogs_present, duration_minutes,
                        success_rating, weather_conditions, gps_route, game_harvested, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    huntLog.id, user.data.userId, huntLog.hunt_date, huntLog.location,
                    JSON.stringify(huntLog.dogs_present),
                    huntLog.duration_minutes,
                    huntLog.success_rating,
                    JSON.stringify(huntLog.weather_conditions),
                    JSON.stringify(huntLog.gps_route),
                    JSON.stringify(huntLog.game_harvested),
                    huntLog.notes
                ).run();
            } catch (dbError) {
                console.error('Database save failed, hunt data preserved in response:', dbError);
            }
        }

        // Clean up session
        if (env.CACHE) {
            await env.CACHE.delete(`hunt_session_${session_id}`);
        }

        return successResponse({
            status: 'hunt_completed',
            hunt_log: huntLog,
            stats: {
                duration_minutes: durationMinutes,
                distance_miles: routeStats.distance,
                waypoints_recorded: huntSession.gps_waypoints.length,
                game_harvested_count: game_harvested?.length || 0
            },
            message: 'Hunt tracking completed successfully'
        });

    } catch (error) {
        console.error('End hunt tracking error:', error);
        return errorResponse('Failed to end hunt tracking', 500);
    }
}

async function syncOfflineData(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { offline_hunts, device_id, last_sync } = body;

        if (!offline_hunts || !Array.isArray(offline_hunts)) {
            return errorResponse('Offline hunt data is required', 400);
        }

        const syncResults = [];

        for (const hunt of offline_hunts) {
            try {
                // Validate hunt data
                if (!hunt.hunt_date || !hunt.location) {
                    syncResults.push({
                        client_id: hunt.client_id,
                        status: 'failed',
                        error: 'Missing required fields'
                    });
                    continue;
                }

                // Validate GPS coordinates
                let validGPS = true;
                if (hunt.gps_route && hunt.gps_route.waypoints) {
                    for (const waypoint of hunt.gps_route.waypoints) {
                        if (!validateGPSCoordinates(waypoint.lat, waypoint.lng)) {
                            validGPS = false;
                            break;
                        }
                    }
                }

                if (!validGPS) {
                    syncResults.push({
                        client_id: hunt.client_id,
                        status: 'failed',
                        error: 'Invalid GPS coordinates'
                    });
                    continue;
                }

                const huntId = generateId();

                // Save to database if available
                if (env.DB) {
                    await env.DB.prepare(`
                        INSERT INTO hunt_logs (
                            id, user_id, hunt_date, location, dogs_present, duration_minutes,
                            success_rating, weather_conditions, gps_route, game_harvested, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        huntId, user.data.userId, hunt.hunt_date, hunt.location,
                        JSON.stringify(hunt.dogs_present || []),
                        hunt.duration_minutes || 0,
                        hunt.success_rating || 3,
                        JSON.stringify(hunt.weather_conditions || {}),
                        JSON.stringify(hunt.gps_route || {}),
                        JSON.stringify(hunt.game_harvested || []),
                        hunt.notes || ''
                    ).run();
                }

                syncResults.push({
                    client_id: hunt.client_id,
                    server_id: huntId,
                    status: 'synced',
                    sync_timestamp: new Date().toISOString()
                });

            } catch (error) {
                syncResults.push({
                    client_id: hunt.client_id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return successResponse({
            sync_status: 'completed',
            hunts_processed: offline_hunts.length,
            synced_count: syncResults.filter(r => r.status === 'synced').length,
            failed_count: syncResults.filter(r => r.status === 'failed').length,
            results: syncResults,
            sync_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Sync offline data error:', error);
        return errorResponse('Failed to sync offline data', 500);
    }
}

// Utility functions
function validateGPSCoordinates(lat, lng) {
    return (
        typeof lat === 'number' && typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180 &&
        !isNaN(lat) && !isNaN(lng)
    );
}

function calculateRouteStats(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return { distance: 0, totalPoints: waypoints?.length || 0 };
    }

    let totalDistance = 0;
    
    for (let i = 1; i < waypoints.length; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        
        if (validateGPSCoordinates(prev.lat, prev.lng) && 
            validateGPSCoordinates(curr.lat, curr.lng)) {
            totalDistance += calculateDistanceBetweenPoints(
                prev.lat, prev.lng, curr.lat, curr.lng
            );
        }
    }

    return {
        distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
        totalPoints: waypoints.length
    };
}

function calculateDistanceBetweenPoints(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

async function authenticateUser(request, env) {
    const token = extractToken(request);
    
    // Demo mode - allow 'demo-token' to bypass authentication
    if (token === 'demo-token') {
        return {
            success: true,
            data: {
                userId: 'demo-user',
                username: 'Demo Hunter',
                email: 'demo@hunta.com'
            }
        };
    }
    
    if (!token) {
        return {
            success: false,
            response: errorResponse('Authentication required - use "demo-token" for demo access', 401)
        };
    }

    // Simple token validation for demo
    try {
        const payload = JSON.parse(atob(token.split('.')[1] || token));
        return {
            success: true,
            data: payload
        };
    } catch {
        return {
            success: false,
            response: errorResponse('Invalid token - use "demo-token" for demo access', 401)
        };
    }
}

function extractToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function successResponse(data) {
    return new Response(JSON.stringify({
        success: true,
        data
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({
        success: false,
        error: message
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}