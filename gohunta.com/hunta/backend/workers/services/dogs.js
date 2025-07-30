/**
 * Dog Service
 * Handles dog profile management, health records, and training data
 */

export class DogService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get user's dogs
    async getDogs(request) {
        try {
            const { limit = 20, offset = 0 } = request.query || {};
            
            const dogs = await this.db.prepare(`
                SELECT 
                    id, name, breed, age, weight, gender, color,
                    microchip_id, registration_number, specialization,
                    training_level, health_notes, temperament,
                    profile_image_url, created_at, updated_at
                FROM dogs 
                WHERE owner_id = ? AND is_active = 1
                ORDER BY name
                LIMIT ? OFFSET ?
            `).bind(request.user.id, parseInt(limit), parseInt(offset)).all();

            return this.successResponse({
                dogs: dogs.results,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: dogs.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get dogs error:', error);
            return this.errorResponse('Failed to get dogs', 500);
        }
    }

    // Create new dog profile
    async createDog(request) {
        try {
            const body = await request.json();
            const {
                name,
                breed,
                age,
                weight,
                gender,
                color,
                microchipId,
                registrationNumber,
                specialization,
                trainingLevel = 'basic',
                healthNotes,
                temperament,
                profileImageUrl
            } = body;

            // Validate required fields
            if (!name) {
                return this.errorResponse('Dog name is required', 400);
            }

            // Validate enums
            if (gender && !['male', 'female'].includes(gender)) {
                return this.errorResponse('Gender must be male or female', 400);
            }

            if (!['puppy', 'basic', 'intermediate', 'advanced', 'competition'].includes(trainingLevel)) {
                return this.errorResponse('Invalid training level', 400);
            }

            // Validate numeric fields
            if (age && (age < 0 || age > 30)) {
                return this.errorResponse('Age must be between 0 and 30 years', 400);
            }

            if (weight && (weight < 0 || weight > 200)) {
                return this.errorResponse('Weight must be between 0 and 200 kg', 400);
            }

            const dogId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO dogs (
                    id, owner_id, name, breed, age, weight, gender, color,
                    microchip_id, registration_number, specialization,
                    training_level, health_notes, temperament, profile_image_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                dogId, request.user.id, name, breed, age, weight, gender, color,
                microchipId, registrationNumber, specialization, trainingLevel,
                healthNotes, temperament, profileImageUrl
            ).run();

            // Get the created dog
            const dog = await this.db.prepare(
                'SELECT * FROM dogs WHERE id = ?'
            ).bind(dogId).first();

            return this.successResponse({
                id: dog.id,
                name: dog.name,
                breed: dog.breed,
                age: dog.age,
                weight: dog.weight,
                gender: dog.gender,
                color: dog.color,
                microchipId: dog.microchip_id,
                registrationNumber: dog.registration_number,
                specialization: dog.specialization,
                trainingLevel: dog.training_level,
                healthNotes: dog.health_notes,
                temperament: dog.temperament,
                profileImageUrl: dog.profile_image_url,
                createdAt: dog.created_at,
                updatedAt: dog.updated_at
            });

        } catch (error) {
            console.error('Create dog error:', error);
            return this.errorResponse('Failed to create dog profile', 500);
        }
    }

    // Get single dog profile
    async getDog(request) {
        try {
            const dogId = request.params.id;
            
            const dog = await this.db.prepare(`
                SELECT d.*, u.username as owner_username
                FROM dogs d
                JOIN users u ON d.owner_id = u.id
                WHERE d.id = ? AND d.is_active = 1
            `).bind(dogId).first();

            if (!dog) {
                return this.errorResponse('Dog not found', 404);
            }

            // Check if user owns this dog or if it's public
            const isOwner = request.user && dog.owner_id === request.user.id;
            
            // Get training logs count for this dog
            const trainingCount = await this.db.prepare(
                'SELECT COUNT(*) as count FROM training_logs WHERE dog_id = ?'
            ).bind(dogId).first();

            return this.successResponse({
                id: dog.id,
                name: dog.name,
                breed: dog.breed,
                age: dog.age,
                weight: dog.weight,
                gender: dog.gender,
                color: dog.color,
                microchipId: isOwner ? dog.microchip_id : null,
                registrationNumber: isOwner ? dog.registration_number : null,
                specialization: dog.specialization,
                trainingLevel: dog.training_level,
                healthNotes: isOwner ? dog.health_notes : null,
                temperament: dog.temperament,
                profileImageUrl: dog.profile_image_url,
                ownerUsername: dog.owner_username,
                isOwner,
                stats: {
                    trainingLogs: trainingCount.count
                },
                createdAt: dog.created_at,
                updatedAt: dog.updated_at
            });

        } catch (error) {
            console.error('Get dog error:', error);
            return this.errorResponse('Failed to get dog profile', 500);
        }
    }

    // Update dog profile
    async updateDog(request) {
        try {
            const dogId = request.params.id;
            const body = await request.json();

            // Check ownership
            const dog = await this.db.prepare(
                'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
            ).bind(dogId).first();

            if (!dog) {
                return this.errorResponse('Dog not found', 404);
            }

            if (dog.owner_id !== request.user.id) {
                return this.errorResponse('Not authorized to update this dog', 403);
            }

            const {
                name,
                breed,
                age,
                weight,
                gender,
                color,
                microchipId,
                registrationNumber,
                specialization,
                trainingLevel,
                healthNotes,
                temperament,
                profileImageUrl
            } = body;

            // Validate enums if provided
            if (gender && !['male', 'female'].includes(gender)) {
                return this.errorResponse('Gender must be male or female', 400);
            }

            if (trainingLevel && !['puppy', 'basic', 'intermediate', 'advanced', 'competition'].includes(trainingLevel)) {
                return this.errorResponse('Invalid training level', 400);
            }

            // Validate numeric fields if provided
            if (age && (age < 0 || age > 30)) {
                return this.errorResponse('Age must be between 0 and 30 years', 400);
            }

            if (weight && (weight < 0 || weight > 200)) {
                return this.errorResponse('Weight must be between 0 and 200 kg', 400);
            }

            // Update dog profile
            await this.db.prepare(`
                UPDATE dogs SET
                    name = COALESCE(?, name),
                    breed = COALESCE(?, breed),
                    age = COALESCE(?, age),
                    weight = COALESCE(?, weight),
                    gender = COALESCE(?, gender),
                    color = COALESCE(?, color),
                    microchip_id = COALESCE(?, microchip_id),
                    registration_number = COALESCE(?, registration_number),
                    specialization = COALESCE(?, specialization),
                    training_level = COALESCE(?, training_level),
                    health_notes = COALESCE(?, health_notes),
                    temperament = COALESCE(?, temperament),
                    profile_image_url = COALESCE(?, profile_image_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                name, breed, age, weight, gender, color,
                microchipId, registrationNumber, specialization, trainingLevel,
                healthNotes, temperament, profileImageUrl, dogId
            ).run();

            // Get updated dog
            const updatedDog = await this.db.prepare(
                'SELECT * FROM dogs WHERE id = ?'
            ).bind(dogId).first();

            return this.successResponse({
                id: updatedDog.id,
                name: updatedDog.name,
                breed: updatedDog.breed,
                age: updatedDog.age,
                weight: updatedDog.weight,
                gender: updatedDog.gender,
                color: updatedDog.color,
                microchipId: updatedDog.microchip_id,
                registrationNumber: updatedDog.registration_number,
                specialization: updatedDog.specialization,
                trainingLevel: updatedDog.training_level,
                healthNotes: updatedDog.health_notes,
                temperament: updatedDog.temperament,
                profileImageUrl: updatedDog.profile_image_url,
                createdAt: updatedDog.created_at,
                updatedAt: updatedDog.updated_at
            });

        } catch (error) {
            console.error('Update dog error:', error);
            return this.errorResponse('Failed to update dog profile', 500);
        }
    }

    // Delete dog profile (soft delete)
    async deleteDog(request) {
        try {
            const dogId = request.params.id;

            // Check ownership
            const dog = await this.db.prepare(
                'SELECT owner_id FROM dogs WHERE id = ? AND is_active = 1'
            ).bind(dogId).first();

            if (!dog) {
                return this.errorResponse('Dog not found', 404);
            }

            if (dog.owner_id !== request.user.id) {
                return this.errorResponse('Not authorized to delete this dog', 403);
            }

            // Soft delete
            await this.db.prepare(
                'UPDATE dogs SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(dogId).run();

            return this.successResponse({ message: 'Dog profile deleted successfully' });

        } catch (error) {
            console.error('Delete dog error:', error);
            return this.errorResponse('Failed to delete dog profile', 500);
        }
    }

    // Search dogs (public profiles)
    async searchDogs(request) {
        try {
            const { 
                q: query, 
                breed, 
                specialization, 
                trainingLevel,
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT d.*, u.username as owner_username
                FROM dogs d
                JOIN users u ON d.owner_id = u.id
                WHERE d.is_active = 1 AND u.privacy_level IN ('public', 'friends')
            `;
            let params = [];

            if (query) {
                sql += ` AND (d.name LIKE ? OR d.breed LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm);
            }

            if (breed) {
                sql += ` AND d.breed LIKE ?`;
                params.push(`%${breed}%`);
            }

            if (specialization) {
                sql += ` AND d.specialization LIKE ?`;
                params.push(`%${specialization}%`);
            }

            if (trainingLevel) {
                sql += ` AND d.training_level = ?`;
                params.push(trainingLevel);
            }

            sql += ` ORDER BY d.name LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const dogs = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                dogs: dogs.results.map(dog => ({
                    id: dog.id,
                    name: dog.name,
                    breed: dog.breed,
                    age: dog.age,
                    gender: dog.gender,
                    color: dog.color,
                    specialization: dog.specialization,
                    trainingLevel: dog.training_level,
                    temperament: dog.temperament,
                    profileImageUrl: dog.profile_image_url,
                    ownerUsername: dog.owner_username,
                    createdAt: dog.created_at
                })),
                filters: {
                    query,
                    breed,
                    specialization,
                    trainingLevel
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: dogs.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Search dogs error:', error);
            return this.errorResponse('Failed to search dogs', 500);
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