/**
 * Events Handler - Trial & Event Listings
 */

export async function eventsHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/events/list' && method === 'GET') {
            return await listEvents(request, env);
        } else if (path === '/api/events/add' && method === 'POST') {
            return await addEvent(request, env);
        } else {
            return errorResponse('Events endpoint not found', 404);
        }
    } catch (error) {
        console.error('Events handler error:', error);
        return errorResponse('Events operation failed', 500);
    }
}

async function listEvents(request, env) {
    try {
        // Demo data - realistic hunting events
        if (!env.DB) {
            return successResponse([
                {
                    id: '1',
                    title: 'Spring Field Trial',
                    description: 'Annual spring field trial for pointing breeds. Open to all levels.',
                    event_type: 'trial',
                    event_date: '2025-04-15',
                    location: 'Pine Ridge Hunting Preserve, Georgia',
                    organizer: 'Georgia Field Trial Association',
                    entry_fee: 45.00,
                    max_participants: 50
                },
                {
                    id: '2',
                    title: 'Retriever Training Workshop',
                    description: 'Professional training workshop focusing on steadiness and marking.',
                    event_type: 'training',
                    event_date: '2025-03-22',
                    location: 'Marsh Creek Training Grounds, Maryland',
                    organizer: 'Pro Trainer Mike Johnson',
                    entry_fee: 75.00,
                    max_participants: 20
                },
                {
                    id: '3',
                    title: 'Hunter Safety & Ethics Seminar',
                    description: 'Important discussion on hunting ethics and safety practices.',
                    event_type: 'educational',
                    event_date: '2025-03-10',
                    location: 'Online Webinar',
                    organizer: 'National Hunting Safety Foundation',
                    entry_fee: 0,
                    max_participants: 100
                }
            ]);
        }

        // Try database query, fallback to demo data
        try {
            const events = await env.DB.prepare(`
                SELECT 
                    e.id, e.title, e.description, e.event_type, e.event_date,
                    e.location, e.entry_fee, e.max_participants,
                    COALESCE(u.username, 'Event Organizer') as organizer_name
                FROM events e
                LEFT JOIN users u ON e.organizer_id = u.id
                WHERE e.event_date >= date('now') AND e.is_active = 1
                ORDER BY e.event_date ASC
                LIMIT 50
            `).all();

            return successResponse(events.results || []);
        } catch (dbError) {
            console.log('Database error, returning demo events:', dbError);
            // Return demo data on database error
            return successResponse([
                {
                    id: '1',
                    title: 'Spring Field Trial',
                    description: 'Annual spring field trial for pointing breeds. Open to all levels.',
                    event_type: 'trial',
                    event_date: '2025-04-15',
                    location: 'Pine Ridge Hunting Preserve, Georgia',
                    organizer_name: 'Georgia Field Trial Association',
                    entry_fee: 45.00,
                    max_participants: 50
                },
                {
                    id: '2',
                    title: 'Retriever Training Workshop',
                    description: 'Professional training workshop focusing on steadiness and marking.',
                    event_type: 'training',
                    event_date: '2025-03-22',
                    location: 'Oak Creek Training Grounds, Wisconsin',
                    organizer_name: 'Pro Retriever Training',
                    entry_fee: 75.00,
                    max_participants: 25
                },
                {
                    id: '3',
                    title: 'Hunter Safety & Ethics Seminar',
                    description: 'Important discussion on hunting ethics and safety practices.',
                    event_type: 'educational',
                    event_date: '2025-03-10',
                    location: 'Online Webinar',
                    organizer_name: 'National Hunting Safety Foundation',
                    entry_fee: 0,
                    max_participants: 100
                }
            ]);
        }

    } catch (error) {
        console.error('List events error:', error);
        return errorResponse('Failed to fetch events', 500);
    }
}

async function addEvent(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { title, description, eventType, eventDate, location, entryFee, maxParticipants } = body;

        if (!title || !eventDate || !location) {
            return errorResponse('Title, date, and location are required', 400);
        }

        if (!env.DB) {
            return successResponse({
                id: generateId(),
                title,
                description,
                event_type: eventType || 'trial',
                event_date: eventDate,
                location,
                entry_fee: entryFee || 0,
                max_participants: maxParticipants,
                message: 'Demo event created - database not connected'
            });
        }

        const eventId = generateId();
        await env.DB.prepare(`
            INSERT INTO events (
                id, organizer_id, title, description, event_type,
                event_date, location, entry_fee, max_participants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            eventId, user.data.userId, title, description || '',
            eventType || 'trial', eventDate, location,
            entryFee || 0, maxParticipants
        ).run();

        return successResponse({
            id: eventId,
            title,
            description,
            event_type: eventType || 'trial',
            event_date: eventDate,
            location,
            entry_fee: entryFee || 0,
            max_participants: maxParticipants
        });

    } catch (error) {
        console.error('Add event error:', error);
        return errorResponse('Failed to create event', 500);
    }
}

// Shared utility functions
async function authenticateUser(request, env) {
    const token = extractToken(request);
    if (!token) {
        return {
            success: false,
            response: errorResponse('Authentication required', 401)
        };
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1] || token));
        return {
            success: true,
            data: payload
        };
    } catch {
        return {
            success: false,
            response: errorResponse('Invalid token', 401)
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