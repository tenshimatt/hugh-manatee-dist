/**
 * Training Handler - Dog Training Session Management
 * Core functionality for tracking training progress and sessions
 */

export async function trainingHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/training/sessions' && method === 'GET') {
            return await getTrainingSessions(request, env);
        } else if (path === '/api/training/sessions' && method === 'POST') {
            return await createTrainingSession(request, env);
        } else if (path.match(/^\/api\/training\/sessions\/[^\/]+$/) && method === 'GET') {
            const sessionId = path.split('/').pop();
            return await getTrainingSession(request, sessionId, env);
        } else if (path.match(/^\/api\/training\/sessions\/[^\/]+$/) && method === 'PUT') {
            const sessionId = path.split('/').pop();
            return await updateTrainingSession(request, sessionId, env);
        } else if (path === '/api/training/goals' && method === 'GET') {
            return await getTrainingGoals(request, env);
        } else if (path === '/api/training/goals' && method === 'POST') {
            return await createTrainingGoal(request, env);
        } else if (path === '/api/training/progress' && method === 'GET') {
            return await getTrainingProgress(request, env);
        } else if (path === '/api/training/exercises' && method === 'GET') {
            return await getTrainingExercises(request, env);
        } else if (path === '/api/training/videos' && method === 'POST') {
            return await uploadTrainingVideo(request, env);
        } else if (path === '/api/training/analysis' && method === 'GET') {
            return await getPerformanceAnalysis(request, env);
        } else {
            return errorResponse('Training endpoint not found', 404);
        }
    } catch (error) {
        console.error('Training handler error:', error);
        return errorResponse('Training operation failed', 500);
    }
}

async function getTrainingSessions(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const url = new URL(request.url);
        const dogId = url.searchParams.get('dog_id');
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        // Demo data if no database
        if (!env.DB) {
            const demoSessions = [
                {
                    id: '1',
                    dog_id: 'dog1',
                    dog_name: 'Rex',
                    session_date: '2025-01-20',
                    exercise_type: 'pointing_drill',
                    duration_minutes: 30,
                    performance_rating: 4,
                    skills_practiced: ['steady_to_wing', 'point_intensity', 'backing'],
                    improvements_noted: 'Better point intensity, held steady for full 45 seconds',
                    challenges: 'Still breaking on wing occasionally',
                    notes: 'Great session overall. Rex is really improving his steadiness.',
                    created_at: '2025-01-20T10:30:00Z'
                },
                {
                    id: '2',
                    dog_id: 'dog2',
                    dog_name: 'Bella',
                    session_date: '2025-01-18',
                    exercise_type: 'retrieve_training',
                    duration_minutes: 25,
                    performance_rating: 3,
                    skills_practiced: ['forced_fetch', 'delivery_to_hand', 'sit_to_deliver'],
                    improvements_noted: 'More willing to pick up dummy',
                    challenges: 'Hard mouth on delivery, needs work',
                    notes: 'Young dog making progress. Need to focus on soft mouth.',
                    created_at: '2025-01-18T14:15:00Z'
                },
                {
                    id: '3',
                    dog_id: 'dog3',
                    dog_name: 'Duke',
                    session_date: '2025-01-15',
                    exercise_type: 'water_work',
                    duration_minutes: 45,
                    performance_rating: 5,
                    skills_practiced: ['water_entry', 'long_retrieves', 'decoy_work'],
                    improvements_noted: 'Excellent water entries, marking ability superb',
                    challenges: 'None - seasoned dog performing at peak',
                    notes: 'Perfect session. Duke is in top form for waterfowl season.',
                    created_at: '2025-01-15T16:00:00Z'
                }
            ];

            const filteredSessions = dogId ? 
                demoSessions.filter(s => s.dog_id === dogId) : 
                demoSessions;

            return successResponse(filteredSessions.slice(offset, offset + limit));
        }

        // Database query
        let query = `
            SELECT 
                ts.id, ts.dog_id, ts.session_date, ts.exercise_type, ts.duration_minutes,
                ts.performance_rating, ts.skills_practiced, ts.improvements_noted,
                ts.challenges, ts.notes, ts.videos, ts.created_at,
                d.name as dog_name
            FROM training_sessions ts
            JOIN dogs d ON ts.dog_id = d.id
            WHERE d.user_id = ?
        `;
        
        const params = [user.data.userId];
        
        if (dogId) {
            query += ' AND ts.dog_id = ?';
            params.push(dogId);
        }
        
        query += ' ORDER BY ts.session_date DESC, ts.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const sessions = await env.DB.prepare(query).bind(...params).all();

        const sessionData = sessions.results.map(session => ({
            ...session,
            skills_practiced: session.skills_practiced ? JSON.parse(session.skills_practiced) : [],
            videos: session.videos ? JSON.parse(session.videos) : []
        }));

        return successResponse(sessionData);

    } catch (error) {
        console.error('Get training sessions error:', error);
        return errorResponse('Failed to fetch training sessions', 500);
    }
}

async function createTrainingSession(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const body = await request.json();
        const {
            dog_id, session_date, exercise_type, duration_minutes,
            performance_rating, skills_practiced, improvements_noted,
            challenges, notes, weather_conditions, location
        } = body;

        // Validation
        if (!dog_id || !session_date || !exercise_type) {
            return errorResponse('Dog ID, session date, and exercise type are required', 400);
        }

        if (performance_rating && (performance_rating < 1 || performance_rating > 5)) {
            return errorResponse('Performance rating must be between 1 and 5', 400);
        }

        if (duration_minutes && duration_minutes < 0) {
            return errorResponse('Duration must be positive', 400);
        }

        const sessionId = generateId();

        // Demo response if no database
        if (!env.DB) {
            return successResponse({
                id: sessionId,
                dog_id,
                session_date,
                exercise_type,
                duration_minutes: duration_minutes || 0,
                performance_rating: performance_rating || 3,
                skills_practiced: skills_practiced || [],
                improvements_noted: improvements_noted || '',
                challenges: challenges || '',
                notes: notes || '',
                weather_conditions: weather_conditions || {},
                location: location || '',
                created_at: new Date().toISOString(),
                message: 'Demo training session created - database not connected'
            });
        }

        // Create training session in database
        await env.DB.prepare(`
            INSERT INTO training_sessions (
                id, dog_id, session_date, exercise_type, duration_minutes,
                performance_rating, skills_practiced, improvements_noted,
                challenges, notes, weather_conditions, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            sessionId, dog_id, session_date, exercise_type,
            duration_minutes || 0, performance_rating || 3,
            JSON.stringify(skills_practiced || []),
            improvements_noted || '', challenges || '', notes || '',
            JSON.stringify(weather_conditions || {}),
            location || ''
        ).run();

        return successResponse({
            id: sessionId,
            dog_id,
            session_date,
            exercise_type,
            duration_minutes: duration_minutes || 0,
            performance_rating: performance_rating || 3,
            skills_practiced: skills_practiced || [],
            improvements_noted: improvements_noted || '',
            challenges: challenges || '',
            notes: notes || '',
            weather_conditions: weather_conditions || {},
            location: location || '',
            created_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Create training session error:', error);
        return errorResponse('Failed to create training session', 500);
    }
}

async function getTrainingGoals(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const url = new URL(request.url);
        const dogId = url.searchParams.get('dog_id');

        // Demo goals data
        const demoGoals = [
            {
                id: '1',
                dog_id: 'dog1',
                dog_name: 'Rex',
                skill_category: 'pointing',
                goal_description: 'Achieve 60-second steady point with full style',
                target_date: '2025-03-01',
                current_progress: 75,
                status: 'in_progress',
                milestones: [
                    { description: '30-second point', completed: true, date_completed: '2024-12-15' },
                    { description: '45-second point', completed: true, date_completed: '2025-01-10' },
                    { description: '60-second point', completed: false, target_date: '2025-03-01' }
                ],
                created_at: '2024-11-01T10:00:00Z'
            },
            {
                id: '2',
                dog_id: 'dog2',
                dog_name: 'Bella',
                skill_category: 'retrieving',
                goal_description: 'Perfect delivery to hand without dropping',
                target_date: '2025-04-15',
                current_progress: 40,
                status: 'in_progress',
                milestones: [
                    { description: 'Pick up dummy consistently', completed: true, date_completed: '2024-12-20' },
                    { description: 'Carry to trainer without dropping', completed: false, target_date: '2025-02-15' },
                    { description: 'Sit and deliver to hand', completed: false, target_date: '2025-04-15' }
                ],
                created_at: '2024-11-15T14:30:00Z'
            },
            {
                id: '3',
                dog_id: 'dog3',
                dog_name: 'Duke',
                skill_category: 'water_work',
                goal_description: 'Master blind retrieves up to 150 yards',
                target_date: '2025-02-20',
                current_progress: 90,
                status: 'in_progress',
                milestones: [
                    { description: '100-yard blind', completed: true, date_completed: '2024-12-01' },
                    { description: '125-yard blind', completed: true, date_completed: '2025-01-05' },
                    { description: '150-yard blind', completed: false, target_date: '2025-02-20' }
                ],
                created_at: '2024-10-15T09:00:00Z'
            }
        ];

        const filteredGoals = dogId ? 
            demoGoals.filter(g => g.dog_id === dogId) : 
            demoGoals;

        return successResponse(filteredGoals);

    } catch (error) {
        console.error('Get training goals error:', error);
        return errorResponse('Failed to fetch training goals', 500);
    }
}

async function getTrainingProgress(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const url = new URL(request.url);
        const dogId = url.searchParams.get('dog_id');
        const timeframe = url.searchParams.get('timeframe') || '30days';

        // Demo progress data
        const demoProgress = {
            dog_id: dogId || 'overall',
            timeframe: timeframe,
            summary: {
                total_sessions: 12,
                total_hours: 8.5,
                average_performance: 4.1,
                improvement_trend: 'improving',
                skills_mastered: 3,
                skills_in_progress: 4
            },
            performance_over_time: [
                { date: '2025-01-05', rating: 3.5, exercise_type: 'pointing_drill' },
                { date: '2025-01-08', rating: 4.0, exercise_type: 'retrieve_training' },
                { date: '2025-01-12', rating: 3.8, exercise_type: 'water_work' },
                { date: '2025-01-15', rating: 4.2, exercise_type: 'pointing_drill' },
                { date: '2025-01-18', rating: 4.5, exercise_type: 'field_work' },
                { date: '2025-01-20', rating: 4.3, exercise_type: 'retrieve_training' }
            ],
            skill_breakdown: [
                {
                    skill: 'Pointing',
                    current_level: 'Advanced',
                    sessions_count: 5,
                    average_rating: 4.4,
                    trend: 'improving'
                },
                {
                    skill: 'Retrieving',
                    current_level: 'Intermediate',
                    sessions_count: 4,
                    average_rating: 3.8,
                    trend: 'stable'
                },
                {
                    skill: 'Water Work',
                    current_level: 'Advanced',
                    sessions_count: 3,
                    average_rating: 4.7,
                    trend: 'improving'
                }
            ],
            recommendations: [
                'Continue focusing on steadiness training - showing great improvement',
                'Introduce more challenging retrieve scenarios',
                'Consider entering in field trial to test progress'
            ],
            generated_at: new Date().toISOString()
        };

        return successResponse(demoProgress);

    } catch (error) {
        console.error('Get training progress error:', error);
        return errorResponse('Failed to fetch training progress', 500);
    }
}

async function getTrainingExercises(request, env) {
    try {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        const skill_level = url.searchParams.get('skill_level');
        const hunt_type = url.searchParams.get('hunt_type');

        const exercises = [
            {
                id: 'point_drill_basic',
                name: 'Basic Pointing Drill',
                category: 'pointing',
                skill_level: 'beginner',
                hunt_type: 'upland',
                duration_minutes: '15-20',
                description: 'Introduction to pointing using planted birds or wings',
                equipment_needed: ['Bird wings', 'Check cord', 'Whistle'],
                steps: [
                    'Start with dog on check cord in known bird area',
                    'Allow dog to find scent and begin pointing',
                    'Command "whoa" and reinforce with hand signal',
                    'Approach slowly and flush bird or wing',
                    'Keep dog steady through flush and shot',
                    'Release with "okay" command'
                ],
                success_criteria: [
                    'Dog points when encountering bird scent',
                    'Holds point for minimum 10 seconds',
                    'Remains steady during flush'
                ],
                common_mistakes: [
                    'Moving too quickly toward pointing dog',
                    'Not reinforcing "whoa" command consistently',
                    'Allowing dog to chase after flush'
                ]
            },
            {
                id: 'retrieve_basics',
                name: 'Basic Retrieve Training',
                category: 'retrieving',
                skill_level: 'beginner',
                hunt_type: 'all',
                duration_minutes: '20-25',
                description: 'Foundation retrieving using bumpers and dummies',
                equipment_needed: ['Canvas bumpers', 'Rope', 'Treats'],
                steps: [
                    'Start with dog in sitting position',
                    'Show bumper and toss 10-15 feet',
                    'Send dog with "fetch" command',
                    'Guide dog back with verbal encouragement',
                    'Have dog sit and deliver to hand',
                    'Reward with praise and treat'
                ],
                success_criteria: [
                    'Dog retrieves bumper consistently',
                    'Returns directly to handler',
                    'Sits and delivers to hand without dropping'
                ],
                common_mistakes: [
                    'Throwing bumper too far initially',
                    'Not insisting on proper delivery',
                    'Over-exciting the dog with too much praise'
                ]
            },
            {
                id: 'water_entry',
                name: 'Water Entry Training',
                category: 'water_work',
                skill_level: 'intermediate',
                hunt_type: 'waterfowl',
                duration_minutes: '30-40',
                description: 'Teaching confident water entries and swimming',
                equipment_needed: ['Floating bumpers', 'Long rope', 'Dog whistle'],
                steps: [
                    'Start at shallow water edge',
                    'Wade in with dog encouraging with voice',
                    'Toss floating bumper just beyond dog reach',
                    'Encourage dog to swim out and retrieve',
                    'Practice from various angles and depths',
                    'Gradually increase distance and difficulty'
                ],
                success_criteria: [
                    'Dog enters water confidently without hesitation',
                    'Swims directly to marked retrieve',
                    'Exits water and delivers properly'
                ],
                common_mistakes: [
                    'Forcing reluctant dog into deep water',
                    'Not building confidence gradually',
                    'Training in water that is too cold'
                ]
            },
            {
                id: 'steady_to_wing',
                name: 'Steady to Wing and Shot',
                category: 'steadiness',
                skill_level: 'advanced',
                hunt_type: 'upland',
                duration_minutes: '25-30',
                description: 'Advanced steadiness training with live birds',
                equipment_needed: ['Live birds', 'Bird launcher', 'Blank pistol', 'Check cord'],
                steps: [
                    'Position dog on point with bird in launcher',
                    'Approach and flush bird with launcher',
                    'Fire blank pistol as bird flies',
                    'Keep dog steady with "whoa" command',
                    'Mark any fall and send for retrieve only on command',
                    'Practice until dog remains steady consistently'
                ],
                success_criteria: [
                    'Dog holds point through flush and shot',
                    'Does not break until given retrieve command',
                    'Marks fall accurately'
                ],
                common_mistakes: [
                    'Not having adequate control before introducing live birds',
                    'Inconsistent timing of commands',
                    'Allowing breaking without correction'
                ]
            }
        ];

        let filteredExercises = exercises;

        if (category) {
            filteredExercises = filteredExercises.filter(e => e.category === category);
        }
        
        if (skill_level) {
            filteredExercises = filteredExercises.filter(e => e.skill_level === skill_level);
        }
        
        if (hunt_type) {
            filteredExercises = filteredExercises.filter(e => 
                e.hunt_type === hunt_type || e.hunt_type === 'all'
            );
        }

        return successResponse({
            exercises: filteredExercises,
            total_count: filteredExercises.length,
            categories: ['pointing', 'retrieving', 'water_work', 'steadiness', 'obedience'],
            skill_levels: ['beginner', 'intermediate', 'advanced', 'expert'],
            hunt_types: ['upland', 'waterfowl', 'all']
        });

    } catch (error) {
        console.error('Get training exercises error:', error);
        return errorResponse('Failed to fetch training exercises', 500);
    }
}

async function uploadTrainingVideo(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        // For demo purposes, simulate video upload
        // In production, this would handle actual file upload to R2 storage
        
        const videoId = generateId();
        const uploadTimestamp = new Date().toISOString();

        // Demo response
        const videoData = {
            id: videoId,
            session_id: 'demo-session-id',
            filename: 'training_video_' + videoId + '.mp4',
            upload_timestamp: uploadTimestamp,
            file_size: 52428800, // 50MB demo size
            duration_seconds: 180,
            url: `https://demo-storage.gohunta.com/videos/${videoId}.mp4`,
            thumbnail_url: `https://demo-storage.gohunta.com/thumbnails/${videoId}.jpg`,
            processing_status: 'completed',
            tags: ['pointing', 'steadiness', 'training'],
            notes: 'Training session video uploaded successfully',
            metadata: {
                resolution: '1920x1080',
                fps: 30,
                codec: 'h264'
            }
        };

        return successResponse({
            message: 'Video uploaded successfully',
            video: videoData,
            note: 'Demo mode - video not actually stored'
        });

    } catch (error) {
        console.error('Upload training video error:', error);
        return errorResponse('Failed to upload training video', 500);
    }
}

async function getPerformanceAnalysis(request, env) {
    try {
        const user = await authenticateUser(request, env);
        if (!user.success) {
            return user.response;
        }

        const url = new URL(request.url);
        const dogId = url.searchParams.get('dog_id');
        const timeframe = url.searchParams.get('timeframe') || '90days';

        // Demo performance analysis
        const analysis = {
            dog_id: dogId || 'overall',
            analysis_period: timeframe,
            generated_at: new Date().toISOString(),
            overall_assessment: {
                current_level: 'Advanced',
                trajectory: 'Improving',
                confidence_score: 85,
                readiness_for_competition: true
            },
            skill_analysis: [
                {
                    skill: 'Pointing',
                    proficiency: 92,
                    consistency: 88,
                    recent_trend: 'improving',
                    strengths: ['Intense point', 'Good range', 'Excellent style'],
                    areas_for_improvement: ['Occasionally breaks on running birds'],
                    recommended_exercises: ['Steady to wing drill', 'Running bird training']
                },
                {
                    skill: 'Retrieving',
                    proficiency: 78,
                    consistency: 82,
                    recent_trend: 'stable',
                    strengths: ['Soft mouth', 'Good marking', 'Eager attitude'],
                    areas_for_improvement: ['Delivery to hand', 'Sitting on command'],
                    recommended_exercises: ['Forced fetch', 'Sit to deliver drill']
                },
                {
                    skill: 'Water Work',
                    proficiency: 95,
                    consistency: 94,
                    recent_trend: 'excellent',
                    strengths: ['Confident entries', 'Strong swimmer', 'Excellent marking'],
                    areas_for_improvement: ['None - peak performance'],
                    recommended_exercises: ['Maintain current training level']
                }
            ],
            training_recommendations: [
                {
                    priority: 'high',
                    skill: 'Retrieving',
                    recommendation: 'Focus on delivery to hand consistency',
                    suggested_frequency: '3 times per week',
                    estimated_improvement_time: '4-6 weeks'
                },
                {
                    priority: 'medium',
                    skill: 'Pointing',
                    recommendation: 'Work on steadiness with running birds',
                    suggested_frequency: '2 times per week',
                    estimated_improvement_time: '6-8 weeks'
                }
            ],
            competition_readiness: {
                field_trial_ready: true,
                hunt_test_ready: true,
                estimated_placement: 'Top 25%',
                areas_to_focus_before_competition: [
                    'Delivery to hand consistency',
                    'Steadiness under pressure'
                ]
            },
            historical_comparison: {
                performance_6_months_ago: 72,
                current_performance: 85,
                improvement_percentage: 18,
                projection_6_months: 92
            }
        };

        return successResponse(analysis);

    } catch (error) {
        console.error('Get performance analysis error:', error);
        return errorResponse('Failed to generate performance analysis', 500);
    }
}

// Utility functions
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