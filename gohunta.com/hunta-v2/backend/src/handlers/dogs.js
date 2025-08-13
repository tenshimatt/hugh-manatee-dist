/**
 * Dogs Handler - Pack & Profile Management
 * Core functionality for managing hunting dogs
 */

export async function dogsHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/dogs/list' && method === 'GET') {
            return await listDogs(request, env);
        } else if (path === '/api/dogs/add' && method === 'POST') {
            return await addDog(request, env);
        } else if (path.match(/^\/api\/dogs\/[^\/]+$/) && method === 'GET') {
            const dogId = path.split('/').pop();
            return await getDog(request, dogId, env);
        } else if (path.match(/^\/api\/dogs\/[^\/]+$/) && method === 'PUT') {
            const dogId = path.split('/').pop();
            return await updateDog(request, dogId, env);
        } else {
            return errorResponse('Dogs endpoint not found', 404);
        }
    } catch (error) {
        console.error('Dogs handler error:', error);
        return errorResponse('Dogs operation failed', 500);
    }
}

async function listDogs(request, env) {
    try {
        // Demo data if no database
        if (!env.DB) {
            return successResponse([
                {
                    id: '1',
                    name: 'Rex',
                    breed: 'German Shorthaired Pointer',
                    age: calculateAge('2020-03-15'),
                    training_level: 'advanced',
                    hunting_style: 'pointer',
                    description: 'Excellent upland bird dog with strong pointing instincts and steady temperament.',
                    photo_url: null
                },
                {
                    id: '2',
                    name: 'Bella',
                    breed: 'English Setter',
                    age: calculateAge('2022-08-20'),
                    training_level: 'intermediate',
                    hunting_style: 'setter',
                    description: 'Young setter showing great promise in field trials. Still learning but very eager.',
                    photo_url: null
                },
                {
                    id: '3',
                    name: 'Duke',
                    breed: 'Labrador Retriever',
                    age: calculateAge('2019-11-10'),
                    training_level: 'expert',
                    hunting_style: 'retriever',
                    description: 'Veteran waterfowl retriever with excellent marking ability and soft mouth.',
                    photo_url: null
                }
            ]);
        }

        // For demo purposes, return sample data if no auth
        // In production, you'd check authentication here
        
        // For demo, return sample data without requiring user auth
        try {
            const dogs = await env.DB.prepare(`
                SELECT 
                    id, name, breed, birth_date, sex, training_level, 
                    hunting_style, description, photo_url, created_at
                FROM dogs 
                WHERE is_active = 1 
                ORDER BY created_at DESC
                LIMIT 10
            `).all();
            
            const dogsWithAge = dogs.results.map(dog => ({
                ...dog,
                age: dog.birth_date ? calculateAge(dog.birth_date) : null
            }));

            return successResponse(dogsWithAge);
        } catch (dbError) {
            // Database error - return demo data
            console.log('Database error, returning demo data:', dbError);
            return successResponse([
                {
                    id: '1',
                    name: 'Rex',
                    breed: 'German Shorthaired Pointer',
                    age: calculateAge('2020-03-15'),
                    training_level: 'advanced',
                    hunting_style: 'pointer',
                    description: 'Excellent upland bird dog with strong pointing instincts and steady temperament.',
                    photo_url: null
                },
                {
                    id: '2',
                    name: 'Bella',
                    breed: 'English Setter',
                    age: calculateAge('2022-08-20'),
                    training_level: 'intermediate',
                    hunting_style: 'pointer',
                    description: 'Young, eager setter with natural hunting instincts. Still learning steadiness but shows great promise.',
                    photo_url: null
                },
                {
                    id: '3',
                    name: 'Duke',
                    breed: 'Labrador Retriever',
                    age: calculateAge('2019-11-10'),
                    training_level: 'advanced',
                    hunting_style: 'retriever',
                    description: 'Seasoned waterfowl dog with exceptional marking ability. Reliable in all weather conditions.',
                    photo_url: null
                }
            ]);
        }

    } catch (error) {
        console.error('List dogs error:', error);
        return errorResponse('Failed to fetch dogs', 500);
    }
}

async function addDog(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { name, breed, birthDate, sex, trainingLevel, huntingStyle, description } = body;

        // Validation
        if (!name || !breed) {
            return errorResponse('Dog name and breed are required', 400);
        }

        // Demo response if no database or database error
        if (!env.DB) {
            return successResponse({
                id: generateId(),
                name,
                breed,
                birth_date: birthDate,
                sex,
                training_level: trainingLevel || 'beginner',
                hunting_style: huntingStyle,
                description: description || '',
                age: birthDate ? calculateAge(birthDate) : null,
                message: 'Demo dog added - database not connected'
            });
        }

        // Try database operation, fall back to demo on error
        try {
            // Create dog
            const dogId = generateId();
            await env.DB.prepare(`
                INSERT INTO dogs (
                    id, user_id, name, breed, birth_date, sex, 
                    training_level, hunting_style, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                dogId, user.data.userId, name, breed, birthDate,
                sex, trainingLevel || 'beginner', huntingStyle, description || ''
            ).run();

            return successResponse({
                id: dogId,
                name,
                breed,
                birth_date: birthDate,
                sex,
                training_level: trainingLevel || 'beginner',
                hunting_style: huntingStyle,
                description: description || '',
                age: birthDate ? calculateAge(birthDate) : null
            });
        } catch (dbError) {
            console.error('Database error, using demo mode:', dbError);
            // Fall back to demo response
            return successResponse({
                id: generateId(),
                name,
                breed,
                birth_date: birthDate,
                sex,
                training_level: trainingLevel || 'beginner',
                hunting_style: huntingStyle,
                description: description || '',
                age: birthDate ? calculateAge(birthDate) : null,
                message: 'Demo dog added - database error occurred'
            });
        }

    } catch (error) {
        console.error('Add dog error:', error);
        return errorResponse('Failed to add dog', 500);
    }
}

async function getDog(request, dogId, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        if (!env.DB) {
            return successResponse({
                id: dogId,
                name: 'Demo Dog',
                breed: 'Mixed Breed',
                age: 3,
                training_level: 'intermediate',
                description: 'Demo dog profile - database not connected'
            });
        }

        const dog = await env.DB.prepare(`
            SELECT 
                id, name, breed, birth_date, sex, training_level,
                hunting_style, description, photo_url, created_at
            FROM dogs 
            WHERE id = ? AND user_id = ? AND is_active = 1
        `).bind(dogId, user.data.userId).first();

        if (!dog) {
            return errorResponse('Dog not found', 404);
        }

        return successResponse({
            ...dog,
            age: dog.birth_date ? calculateAge(dog.birth_date) : null
        });

    } catch (error) {
        console.error('Get dog error:', error);
        return errorResponse('Failed to fetch dog', 500);
    }
}

async function updateDog(request, dogId, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const { name, breed, birthDate, sex, trainingLevel, huntingStyle, description } = body;

        if (!env.DB) {
            return successResponse({
                id: dogId,
                message: 'Demo dog updated - database not connected'
            });
        }

        // Update dog
        await env.DB.prepare(`
            UPDATE dogs SET 
                name = ?, breed = ?, birth_date = ?, sex = ?,
                training_level = ?, hunting_style = ?, description = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `).bind(
            name, breed, birthDate, sex, trainingLevel, 
            huntingStyle, description, dogId, user.data.userId
        ).run();

        return successResponse({
            id: dogId,
            name,
            breed,
            birth_date: birthDate,
            sex,
            training_level: trainingLevel,
            hunting_style: huntingStyle,
            description,
            age: birthDate ? calculateAge(birthDate) : null
        });

    } catch (error) {
        console.error('Update dog error:', error);
        return errorResponse('Failed to update dog', 500);
    }
}

// Utility functions
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
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