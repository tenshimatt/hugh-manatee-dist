export async function routesHandler(request, path, env) {
    const method = request.method;
    const db = env.DB;

    try {
        // If database is configured, use it. Otherwise, use demo data
        if (db) {
            // Initialize routes table if it doesn't exist
            await db.exec(`
                CREATE TABLE IF NOT EXISTS routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    difficulty TEXT DEFAULT 'moderate',
                    terrain_type TEXT DEFAULT 'mixed',
                    game_type TEXT DEFAULT 'upland',  
                    description TEXT,
                    notes TEXT,
                    distance REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            if (path === '/api/routes/list' && method === 'GET') {
                return await listRoutes(db);
            } else if (path === '/api/routes/create' && method === 'POST') {
                return await createRoute(request, db);
            } else if (path.startsWith('/api/routes/update/') && method === 'PUT') {
                const id = path.split('/').pop();
                return await updateRoute(request, db, id);
            } else if (path.startsWith('/api/routes/delete/') && method === 'DELETE') {
                const id = path.split('/').pop();
                return await deleteRoute(db, id);
            }
        } else {
            // Demo mode - use mock data
            if (path === '/api/routes/list' && method === 'GET') {
                return await listRoutesDemo();
            } else if (path === '/api/routes/create' && method === 'POST') {
                return await createRouteDemo(request);
            } else if (path.startsWith('/api/routes/update/') && method === 'PUT') {
                const id = path.split('/').pop();
                return await updateRouteDemo(request, id);
            } else if (path.startsWith('/api/routes/delete/') && method === 'DELETE') {
                const id = path.split('/').pop();
                return await deleteRouteDemo(id);
            }
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Routes endpoint not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Routes handler error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function listRoutes(db) {
    const result = await db.prepare('SELECT * FROM routes ORDER BY created_at DESC').all();
    
    return new Response(JSON.stringify({
        success: true,
        data: result.results || []
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function createRoute(request, db) {
    const route = await request.json();
    
    // Validate required fields
    if (!route.name || !route.location) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Name and location are required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const stmt = await db.prepare(`
        INSERT INTO routes (name, location, difficulty, terrain_type, game_type, description, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
        route.name,
        route.location,
        route.difficulty || 'moderate',
        route.terrain_type || 'mixed',
        route.game_type || 'upland',
        route.description || '',
        route.notes || ''
    ).run();

    if (!result.success) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create route'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        data: { id: result.meta.last_row_id, ...route }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateRoute(request, db, id) {
    const route = await request.json();
    
    // Validate ID
    if (!id || isNaN(id)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid route ID'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const stmt = await db.prepare(`
        UPDATE routes 
        SET name = ?, location = ?, difficulty = ?, terrain_type = ?, game_type = ?, 
            description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    const result = await stmt.bind(
        route.name,
        route.location,
        route.difficulty || 'moderate',
        route.terrain_type || 'mixed',
        route.game_type || 'upland',
        route.description || '',
        route.notes || '',
        id
    ).run();

    if (!result.success) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update route'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        data: { id: parseInt(id), ...route }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function deleteRoute(db, id) {
    // Validate ID
    if (!id || isNaN(id)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid route ID'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const stmt = await db.prepare('DELETE FROM routes WHERE id = ?');
    const result = await stmt.bind(id).run();

    if (!result.success) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to delete route'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        message: 'Route deleted successfully'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Demo mode functions - use mock data when database is not available
const demoRoutes = [
    {
        id: 1,
        name: "North Ridge Trail",
        location: "Pine Valley State Park, Colorado",
        difficulty: "moderate",
        terrain_type: "hills",
        game_type: "upland",
        description: "A scenic trail through pine forests with excellent upland bird hunting opportunities. Multiple water sources and varied elevation.",
        notes: "Best accessed from the north parking area. Permission needed for private land section.",
        distance: 3.2,
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z"
    },
    {
        id: 2,
        name: "Wetland Loop",
        location: "Marsh Creek Wildlife Area, Montana",
        difficulty: "easy",
        terrain_type: "marsh",
        game_type: "waterfowl",
        description: "Easy walking route around managed wetlands. Great for duck and geese hunting during migration seasons.",
        notes: "Check water levels before heading out. Requires state hunting license and waterfowl stamp.",
        distance: 2.1,
        created_at: "2025-01-20T14:15:00Z",
        updated_at: "2025-01-20T14:15:00Z"
    },
    {
        id: 3,
        name: "Canyon Creek Route",
        location: "Red Rock Canyon, Utah",
        difficulty: "difficult",
        terrain_type: "mixed",
        game_type: "big_game",
        description: "Challenging backcountry route through rugged canyon terrain. Excellent for mule deer and elk during rifle season.",
        notes: "Requires 4WD vehicle to reach trailhead. Overnight camping permitted with permit.",
        distance: 8.7,
        created_at: "2025-01-25T08:45:00Z",
        updated_at: "2025-01-25T08:45:00Z"
    }
];

async function listRoutesDemo() {
    return new Response(JSON.stringify({
        success: true,
        data: demoRoutes
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function createRouteDemo(request) {
    const route = await request.json();
    
    // Validate required fields
    if (!route.name || !route.location) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Name and location are required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Create new route with generated ID
    const newRoute = {
        id: Math.max(...demoRoutes.map(r => r.id)) + 1,
        name: route.name,
        location: route.location,
        difficulty: route.difficulty || 'moderate',
        terrain_type: route.terrain_type || 'mixed',
        game_type: route.game_type || 'upland',
        description: route.description || '',
        notes: route.notes || '',
        distance: route.distance || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Add to demo data (note: this won't persist across deployments)
    demoRoutes.unshift(newRoute);

    return new Response(JSON.stringify({
        success: true,
        data: newRoute
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateRouteDemo(request, id) {
    const route = await request.json();
    const routeIndex = demoRoutes.findIndex(r => r.id === parseInt(id));
    
    if (routeIndex === -1) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Route not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Update the route
    demoRoutes[routeIndex] = {
        ...demoRoutes[routeIndex],
        name: route.name,
        location: route.location,
        difficulty: route.difficulty || 'moderate',
        terrain_type: route.terrain_type || 'mixed',
        game_type: route.game_type || 'upland',
        description: route.description || '',
        notes: route.notes || '',
        updated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
        success: true,
        data: demoRoutes[routeIndex]
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function deleteRouteDemo(id) {
    const routeIndex = demoRoutes.findIndex(r => r.id === parseInt(id));
    
    if (routeIndex === -1) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Route not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Remove the route
    demoRoutes.splice(routeIndex, 1);

    return new Response(JSON.stringify({
        success: true,
        message: 'Route deleted successfully'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}