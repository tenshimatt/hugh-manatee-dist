export async function gearHandler(request, path, env) {
    const url = new URL(request.url);
    const method = request.method;
    
    try {
        // Handle GET /api/gear/reviews - fetch all reviews
        if (method === 'GET' && path === '/api/gear/reviews') {
            const { results } = await env.ANALYTICS_DB.prepare(`
                SELECT 
                    id,
                    gear_name as item_name,
                    gear_category as category,
                    brand,
                    model,
                    rating,
                    review_text,
                    pros,
                    cons,
                    recommended,
                    price_range,
                    photo_url,
                    created_at,
                    'Anonymous Hunter' as reviewer_name
                FROM gear_reviews 
                ORDER BY created_at DESC
            `).all();
            
            return new Response(JSON.stringify({
                success: true,
                data: results || [],
                count: results?.length || 0
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Handle POST /api/gear/reviews - create new review
        if (method === 'POST' && path === '/api/gear/reviews') {
            const body = await request.json();
            const { item_name, brand, category, rating, pros, cons, review_text, recommended } = body;
            
            // Validate required fields
            if (!item_name || !category || !rating) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Missing required fields: item_name, category, rating'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            // Insert new review
            const result = await env.ANALYTICS_DB.prepare(`
                INSERT INTO gear_reviews (
                    user_id, gear_name, gear_category, brand, rating, 
                    review_text, pros, cons, recommended, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
                'anonymous_user', // Using anonymous user for now
                item_name,
                category,
                brand || null,
                rating,
                review_text || null,
                pros || null,
                cons || null,
                recommended ? 1 : 0
            ).run();
            
            if (result.success) {
                return new Response(JSON.stringify({
                    success: true,
                    data: { id: result.meta.last_row_id },
                    message: 'Review added successfully'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                throw new Error('Database insert failed');
            }
        }
        
        // Handle unsupported methods/paths
        return new Response(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
            available_endpoints: ['GET /api/gear/reviews', 'POST /api/gear/reviews']
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Gear handler error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}