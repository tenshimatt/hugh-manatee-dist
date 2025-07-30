/**
 * Event Service
 * Handles hunting events, trials, competitions, and registrations
 */

export class EventService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get events with filtering
    async getEvents(request) {
        try {
            const { 
                q: query,
                eventType,
                category,
                status = 'published',
                startDate,
                endDate,
                near_lat,
                near_lng,
                radius_km = 100,
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT e.*, u.username as organizer_username,
                       COUNT(er.id) as registration_count
                FROM events e
                JOIN users u ON e.organizer_id = u.id
                LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'confirmed'
                WHERE e.status IN ('published', 'registration_open', 'registration_closed')
            `;
            let params = [];

            if (status && status !== 'all') {
                sql = sql.replace("WHERE e.status IN ('published', 'registration_open', 'registration_closed')", "WHERE e.status = ?");
                params = [status];
            }

            if (query) {
                sql += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location_name LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (eventType) {
                sql += ` AND e.event_type = ?`;
                params.push(eventType);
            }

            if (category) {
                sql += ` AND e.category LIKE ?`;
                params.push(`%${category}%`);
            }

            if (startDate) {
                sql += ` AND e.start_date >= ?`;
                params.push(startDate);
            }

            if (endDate) {
                sql += ` AND e.start_date <= ?`;
                params.push(endDate);
            }

            // Add proximity search if coordinates provided
            if (near_lat && near_lng) {
                sql += ` AND (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(e.latitude)) * 
                        cos(radians(e.longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(e.latitude))
                    )
                ) <= ?`;
                params.push(parseFloat(near_lat), parseFloat(near_lng), parseFloat(near_lat), parseFloat(radius_km));
            }

            sql += ` GROUP BY e.id ORDER BY e.start_date ASC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const events = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                events: events.results.map(event => ({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    eventType: event.event_type,
                    category: event.category,
                    locationName: event.location_name,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    address: event.address,
                    startDate: event.start_date,
                    endDate: event.end_date,
                    registrationDeadline: event.registration_deadline,
                    maxParticipants: event.max_participants,
                    entryFee: event.entry_fee,
                    requirements: event.requirements,
                    contactInfo: event.contact_info,
                    websiteUrl: event.website_url,
                    status: event.status,
                    isFeatured: event.is_featured,
                    organizerUsername: event.organizer_username,
                    registrationCount: event.registration_count,
                    spotsRemaining: event.max_participants ? event.max_participants - event.registration_count : null,
                    createdAt: event.created_at
                })),
                filters: {
                    query,
                    eventType,
                    category,
                    status,
                    startDate,
                    endDate,
                    nearLat: near_lat,
                    nearLng: near_lng,
                    radiusKm: radius_km
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: events.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get events error:', error);
            return this.errorResponse('Failed to get events', 500);
        }
    }

    // Create new event
    async createEvent(request) {
        try {
            const body = await request.json();
            const {
                title,
                description,
                eventType,
                category,
                locationName,
                latitude,
                longitude,
                address,
                startDate,
                endDate,
                registrationDeadline,
                maxParticipants,
                entryFee = 0,
                requirements,
                contactInfo,
                websiteUrl,
                status = 'draft'
            } = body;

            // Validate required fields
            if (!title || !eventType || !startDate) {
                return this.errorResponse('Title, event type, and start date are required', 400);
            }

            // Validate enums
            if (!['trial', 'competition', 'training', 'social', 'workshop'].includes(eventType)) {
                return this.errorResponse('Invalid event type', 400);
            }

            if (!['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'].includes(status)) {
                return this.errorResponse('Invalid status', 400);
            }

            // Validate dates
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : null;
            const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;

            if (end && end <= start) {
                return this.errorResponse('End date must be after start date', 400);
            }

            if (regDeadline && regDeadline >= start) {
                return this.errorResponse('Registration deadline must be before start date', 400);
            }

            // Validate coordinates if provided
            if (latitude && (latitude < -90 || latitude > 90)) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (longitude && (longitude < -180 || longitude > 180)) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Validate numeric fields
            if (maxParticipants && maxParticipants < 1) {
                return this.errorResponse('Max participants must be at least 1', 400);
            }

            if (entryFee < 0) {
                return this.errorResponse('Entry fee cannot be negative', 400);
            }

            const eventId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO events (
                    id, organizer_id, title, description, event_type, category,
                    location_name, latitude, longitude, address,
                    start_date, end_date, registration_deadline,
                    max_participants, entry_fee, requirements,
                    contact_info, website_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                eventId, request.user.id, title, description, eventType, category,
                locationName, latitude, longitude, address,
                startDate, endDate, registrationDeadline,
                maxParticipants, entryFee, requirements,
                contactInfo, websiteUrl, status
            ).run();

            // Get the created event
            const event = await this.db.prepare(
                'SELECT * FROM events WHERE id = ?'
            ).bind(eventId).first();

            return this.successResponse({
                id: event.id,
                title: event.title,
                description: event.description,
                eventType: event.event_type,
                category: event.category,
                locationName: event.location_name,
                latitude: event.latitude,
                longitude: event.longitude,
                address: event.address,
                startDate: event.start_date,
                endDate: event.end_date,
                registrationDeadline: event.registration_deadline,
                maxParticipants: event.max_participants,
                entryFee: event.entry_fee,
                requirements: event.requirements,
                contactInfo: event.contact_info,
                websiteUrl: event.website_url,
                status: event.status,
                isFeatured: event.is_featured,
                createdAt: event.created_at,
                updatedAt: event.updated_at
            });

        } catch (error) {
            console.error('Create event error:', error);
            return this.errorResponse('Failed to create event', 500);
        }
    }

    // Get single event with registration details
    async getEvent(request) {
        try {
            const eventId = request.params.id;
            
            const event = await this.db.prepare(`
                SELECT e.*, u.username as organizer_username,
                       COUNT(er.id) as registration_count
                FROM events e
                JOIN users u ON e.organizer_id = u.id
                LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'confirmed'
                WHERE e.id = ?
                GROUP BY e.id
            `).bind(eventId).first();

            if (!event) {
                return this.errorResponse('Event not found', 404);
            }

            // Check if user is registered
            let userRegistration = null;
            if (request.user) {
                userRegistration = await this.db.prepare(`
                    SELECT registration_status, dog_id, notes, created_at
                    FROM event_registrations
                    WHERE event_id = ? AND user_id = ?
                `).bind(eventId, request.user.id).first();
            }

            // Get recent registrations (for organizer or public display)
            const recentRegistrations = await this.db.prepare(`
                SELECT er.registration_status, er.created_at,
                       u.username, u.profile_image_url,
                       d.name as dog_name
                FROM event_registrations er
                JOIN users u ON er.user_id = u.id
                LEFT JOIN dogs d ON er.dog_id = d.id
                WHERE er.event_id = ? AND er.registration_status = 'confirmed'
                ORDER BY er.created_at DESC
                LIMIT 10
            `).bind(eventId).all();

            return this.successResponse({
                id: event.id,
                title: event.title,
                description: event.description,
                eventType: event.event_type,
                category: event.category,
                locationName: event.location_name,
                latitude: event.latitude,
                longitude: event.longitude,
                address: event.address,
                startDate: event.start_date,
                endDate: event.end_date,
                registrationDeadline: event.registration_deadline,
                maxParticipants: event.max_participants,
                entryFee: event.entry_fee,
                requirements: event.requirements,
                contactInfo: event.contact_info,
                websiteUrl: event.website_url,
                status: event.status,
                isFeatured: event.is_featured,
                organizerUsername: event.organizer_username,
                isOrganizer: request.user && event.organizer_id === request.user.id,
                registrationCount: event.registration_count,
                spotsRemaining: event.max_participants ? event.max_participants - event.registration_count : null,
                userRegistration,
                recentRegistrations: recentRegistrations.results,
                createdAt: event.created_at,
                updatedAt: event.updated_at
            });

        } catch (error) {
            console.error('Get event error:', error);
            return this.errorResponse('Failed to get event', 500);
        }
    }

    // Update event
    async updateEvent(request) {
        try {
            const eventId = request.params.id;
            const body = await request.json();

            // Check ownership
            const event = await this.db.prepare(
                'SELECT organizer_id FROM events WHERE id = ?'
            ).bind(eventId).first();

            if (!event) {
                return this.errorResponse('Event not found', 404);
            }

            if (event.organizer_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this event', 403);
            }

            const {
                title,
                description,
                eventType,
                category,
                locationName,
                latitude,
                longitude,
                address,
                startDate,
                endDate,
                registrationDeadline,
                maxParticipants,
                entryFee,
                requirements,
                contactInfo,
                websiteUrl,
                status,
                isFeatured
            } = body;

            // Validate enums if provided
            if (eventType && !['trial', 'competition', 'training', 'social', 'workshop'].includes(eventType)) {
                return this.errorResponse('Invalid event type', 400);
            }

            if (status && !['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'].includes(status)) {
                return this.errorResponse('Invalid status', 400);
            }

            // Validate coordinates if provided
            if (latitude && (latitude < -90 || latitude > 90)) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (longitude && (longitude < -180 || longitude > 180)) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Update event
            await this.db.prepare(`
                UPDATE events SET
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    event_type = COALESCE(?, event_type),
                    category = COALESCE(?, category),
                    location_name = COALESCE(?, location_name),
                    latitude = COALESCE(?, latitude),
                    longitude = COALESCE(?, longitude),
                    address = COALESCE(?, address),
                    start_date = COALESCE(?, start_date),
                    end_date = COALESCE(?, end_date),
                    registration_deadline = COALESCE(?, registration_deadline),
                    max_participants = COALESCE(?, max_participants),
                    entry_fee = COALESCE(?, entry_fee),
                    requirements = COALESCE(?, requirements),
                    contact_info = COALESCE(?, contact_info),
                    website_url = COALESCE(?, website_url),
                    status = COALESCE(?, status),
                    is_featured = COALESCE(?, is_featured),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                title, description, eventType, category, locationName,
                latitude, longitude, address, startDate, endDate,
                registrationDeadline, maxParticipants, entryFee,
                requirements, contactInfo, websiteUrl, status, isFeatured,
                eventId
            ).run();

            // Get updated event
            const updatedEvent = await this.db.prepare(
                'SELECT * FROM events WHERE id = ?'
            ).bind(eventId).first();

            return this.successResponse({
                id: updatedEvent.id,
                title: updatedEvent.title,
                description: updatedEvent.description,
                eventType: updatedEvent.event_type,
                category: updatedEvent.category,
                locationName: updatedEvent.location_name,
                latitude: updatedEvent.latitude,
                longitude: updatedEvent.longitude,
                address: updatedEvent.address,
                startDate: updatedEvent.start_date,
                endDate: updatedEvent.end_date,
                registrationDeadline: updatedEvent.registration_deadline,
                maxParticipants: updatedEvent.max_participants,
                entryFee: updatedEvent.entry_fee,
                requirements: updatedEvent.requirements,
                contactInfo: updatedEvent.contact_info,
                websiteUrl: updatedEvent.website_url,
                status: updatedEvent.status,
                isFeatured: updatedEvent.is_featured,
                createdAt: updatedEvent.created_at,
                updatedAt: updatedEvent.updated_at
            });

        } catch (error) {
            console.error('Update event error:', error);
            return this.errorResponse('Failed to update event', 500);
        }
    }

    // Delete event
    async deleteEvent(request) {
        try {
            const eventId = request.params.id;

            // Check ownership
            const event = await this.db.prepare(
                'SELECT organizer_id FROM events WHERE id = ?'
            ).bind(eventId).first();

            if (!event) {
                return this.errorResponse('Event not found', 404);
            }

            if (event.organizer_id !== request.user.id) {
                return this.errorResponse('Not authorized to delete this event', 403);
            }

            // Delete event (this will cascade delete registrations)
            await this.db.prepare(
                'DELETE FROM events WHERE id = ?'
            ).bind(eventId).run();

            return this.successResponse({ message: 'Event deleted successfully' });

        } catch (error) {
            console.error('Delete event error:', error);
            return this.errorResponse('Failed to delete event', 500);
        }
    }

    // Register for event
    async registerForEvent(request) {
        try {
            const eventId = request.params.id;
            const body = await request.json();
            const { dogId, notes } = body;

            // Get event details
            const event = await this.db.prepare(`
                SELECT *, 
                       (SELECT COUNT(*) FROM event_registrations WHERE event_id = ? AND registration_status = 'confirmed') as current_registrations
                FROM events WHERE id = ?
            `).bind(eventId, eventId).first();

            if (!event) {
                return this.errorResponse('Event not found', 404);
            }

            // Check if registration is open
            if (!['published', 'registration_open'].includes(event.status)) {
                return this.errorResponse('Registration is not open for this event', 400);
            }

            // Check registration deadline
            if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
                return this.errorResponse('Registration deadline has passed', 400);
            }

            // Check if event is full
            if (event.max_participants && event.current_registrations >= event.max_participants) {
                return this.errorResponse('Event is full', 400);
            }

            // Check if user is already registered
            const existingRegistration = await this.db.prepare(`
                SELECT registration_status FROM event_registrations 
                WHERE event_id = ? AND user_id = ?
            `).bind(eventId, request.user.id).first();

            if (existingRegistration) {
                return this.errorResponse('Already registered for this event', 409);
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

            const registrationId = crypto.randomUUID();
            const registrationStatus = event.max_participants && event.current_registrations >= event.max_participants ? 'waitlist' : 'confirmed';

            await this.db.prepare(`
                INSERT INTO event_registrations (
                    id, event_id, user_id, dog_id, registration_status, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).bind(registrationId, eventId, request.user.id, dogId, registrationStatus, notes).run();

            return this.successResponse({
                registrationId,
                status: registrationStatus,
                message: registrationStatus === 'waitlist' ? 'Added to waitlist' : 'Registration confirmed'
            });

        } catch (error) {
            console.error('Register for event error:', error);
            return this.errorResponse('Failed to register for event', 500);
        }
    }

    // Unregister from event
    async unregisterFromEvent(request) {
        try {
            const eventId = request.params.id;

            // Check if user is registered
            const registration = await this.db.prepare(`
                SELECT id FROM event_registrations 
                WHERE event_id = ? AND user_id = ?
            `).bind(eventId, request.user.id).first();

            if (!registration) {
                return this.errorResponse('Not registered for this event', 404);
            }

            // Delete registration
            await this.db.prepare(
                'DELETE FROM event_registrations WHERE id = ?'
            ).bind(registration.id).run();

            // Move first waitlisted person to confirmed if there's a spot
            await this.db.prepare(`
                UPDATE event_registrations 
                SET registration_status = 'confirmed'
                WHERE event_id = ? AND registration_status = 'waitlist'
                ORDER BY created_at ASC
                LIMIT 1
            `).bind(eventId).run();

            return this.successResponse({ message: 'Successfully unregistered from event' });

        } catch (error) {
            console.error('Unregister from event error:', error);
            return this.errorResponse('Failed to unregister from event', 500);
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