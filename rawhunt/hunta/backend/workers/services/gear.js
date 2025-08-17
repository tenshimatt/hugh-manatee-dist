/**
 * Gear Service
 * Handles hunting gear items, reviews, ratings, and loadout management
 */

export class GearService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
    }

    // Get gear items with filtering
    async getGear(request) {
        try {
            const { 
                q: query,
                category,
                brand,
                minPrice,
                maxPrice,
                minRating,
                sortBy = 'name',
                sortOrder = 'asc',
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT g.*, 
                       COALESCE(AVG(gr.rating), 0) as average_rating,
                       COUNT(gr.id) as review_count
                FROM gear_items g
                LEFT JOIN gear_reviews gr ON g.id = gr.gear_item_id
                WHERE g.is_approved = 1
            `;
            let params = [];

            if (query) {
                sql += ` AND (g.name LIKE ? OR g.description LIKE ? OR g.brand LIKE ?)`;
                const searchTerm = `%${query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (category) {
                sql += ` AND g.category LIKE ?`;
                params.push(`%${category}%`);
            }

            if (brand) {
                sql += ` AND g.brand LIKE ?`;
                params.push(`%${brand}%`);
            }

            if (minPrice) {
                sql += ` AND g.price >= ?`;
                params.push(parseFloat(minPrice));
            }

            if (maxPrice) {
                sql += ` AND g.price <= ?`;
                params.push(parseFloat(maxPrice));
            }

            sql += ` GROUP BY g.id`;

            if (minRating) {
                sql += ` HAVING average_rating >= ?`;
                params.push(parseFloat(minRating));
            }

            // Add sorting
            const validSortFields = ['name', 'brand', 'price', 'average_rating', 'review_count', 'created_at'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
            const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            sql += ` ORDER BY ${sortField} ${order}`;

            sql += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const gear = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                gear: gear.results.map(item => ({
                    id: item.id,
                    name: item.name,
                    brand: item.brand,
                    category: item.category,
                    description: item.description,
                    modelNumber: item.model_number,
                    price: item.price,
                    weightGrams: item.weight_grams,
                    dimensions: item.dimensions,
                    imageUrl: item.image_url,
                    websiteUrl: item.website_url,
                    averageRating: parseFloat(item.average_rating).toFixed(1),
                    reviewCount: item.review_count,
                    createdAt: item.created_at
                })),
                filters: {
                    query,
                    category,
                    brand,
                    minPrice,
                    maxPrice,
                    minRating,
                    sortBy,
                    sortOrder
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: gear.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get gear error:', error);
            return this.errorResponse('Failed to get gear items', 500);
        }
    }

    // Create new gear item
    async createGearItem(request) {
        try {
            const body = await request.json();
            const {
                name,
                brand,
                category,
                description,
                modelNumber,
                price,
                weightGrams,
                dimensions,
                imageUrl,
                websiteUrl
            } = body;

            // Validate required fields
            if (!name || !category) {
                return this.errorResponse('Name and category are required', 400);
            }

            // Validate numeric fields
            if (price && price < 0) {
                return this.errorResponse('Price cannot be negative', 400);
            }

            if (weightGrams && weightGrams < 0) {
                return this.errorResponse('Weight cannot be negative', 400);
            }

            const gearId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO gear_items (
                    id, name, brand, category, description, model_number,
                    price, weight_grams, dimensions, image_url, website_url,
                    is_approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                gearId, name, brand, category, description, modelNumber,
                price, weightGrams, dimensions, imageUrl, websiteUrl,
                request.user.role === 'admin' ? 1 : 0 // Auto-approve for admins
            ).run();

            // Get the created gear item
            const gear = await this.db.prepare(
                'SELECT * FROM gear_items WHERE id = ?'
            ).bind(gearId).first();

            return this.successResponse({
                id: gear.id,
                name: gear.name,
                brand: gear.brand,
                category: gear.category,
                description: gear.description,
                modelNumber: gear.model_number,
                price: gear.price,
                weightGrams: gear.weight_grams,
                dimensions: gear.dimensions,
                imageUrl: gear.image_url,
                websiteUrl: gear.website_url,
                isApproved: gear.is_approved,
                createdAt: gear.created_at,
                updatedAt: gear.updated_at
            });

        } catch (error) {
            console.error('Create gear item error:', error);
            return this.errorResponse('Failed to create gear item', 500);
        }
    }

    // Get single gear item with reviews
    async getGearItem(request) {
        try {
            const gearId = request.params.id;
            
            const gear = await this.db.prepare(`
                SELECT g.*, 
                       COALESCE(AVG(gr.rating), 0) as average_rating,
                       COUNT(gr.id) as review_count,
                       COALESCE(AVG(gr.durability_rating), 0) as avg_durability,
                       COALESCE(AVG(gr.value_rating), 0) as avg_value
                FROM gear_items g
                LEFT JOIN gear_reviews gr ON g.id = gr.gear_item_id
                WHERE g.id = ? AND g.is_approved = 1
                GROUP BY g.id
            `).bind(gearId).first();

            if (!gear) {
                return this.errorResponse('Gear item not found', 404);
            }

            // Get rating distribution
            const ratingDistribution = await this.db.prepare(`
                SELECT rating, COUNT(*) as count
                FROM gear_reviews
                WHERE gear_item_id = ?
                GROUP BY rating
                ORDER BY rating DESC
            `).bind(gearId).all();

            return this.successResponse({
                id: gear.id,
                name: gear.name,
                brand: gear.brand,
                category: gear.category,
                description: gear.description,
                modelNumber: gear.model_number,
                price: gear.price,
                weightGrams: gear.weight_grams,
                dimensions: gear.dimensions,
                imageUrl: gear.image_url,
                websiteUrl: gear.website_url,
                averageRating: parseFloat(gear.average_rating).toFixed(1),
                reviewCount: gear.review_count,
                avgDurability: parseFloat(gear.avg_durability).toFixed(1),
                avgValue: parseFloat(gear.avg_value).toFixed(1),
                ratingDistribution: ratingDistribution.results.reduce((acc, item) => {
                    acc[item.rating] = item.count;
                    return acc;
                }, {}),
                createdAt: gear.created_at,
                updatedAt: gear.updated_at
            });

        } catch (error) {
            console.error('Get gear item error:', error);
            return this.errorResponse('Failed to get gear item', 500);
        }
    }

    // Create review for gear item
    async createReview(request) {
        try {
            const gearId = request.params.id;
            const body = await request.json();
            const {
                rating,
                title,
                reviewText,
                pros,
                cons,
                durabilityRating,
                valueRating,
                wouldRecommend,
                usageDurationMonths,
                verifiedPurchase = false
            } = body;

            // Validate required fields
            if (!rating || rating < 1 || rating > 5) {
                return this.errorResponse('Rating must be between 1 and 5', 400);
            }

            // Validate optional ratings
            if (durabilityRating && (durabilityRating < 1 || durabilityRating > 5)) {
                return this.errorResponse('Durability rating must be between 1 and 5', 400);
            }

            if (valueRating && (valueRating < 1 || valueRating > 5)) {
                return this.errorResponse('Value rating must be between 1 and 5', 400);
            }

            // Check if gear item exists
            const gear = await this.db.prepare(
                'SELECT id FROM gear_items WHERE id = ? AND is_approved = 1'
            ).bind(gearId).first();

            if (!gear) {
                return this.errorResponse('Gear item not found', 404);
            }

            // Check if user already reviewed this item
            const existingReview = await this.db.prepare(
                'SELECT id FROM gear_reviews WHERE gear_item_id = ? AND user_id = ?'
            ).bind(gearId, request.user.id).first();

            if (existingReview) {
                return this.errorResponse('You have already reviewed this item', 409);
            }

            const reviewId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO gear_reviews (
                    id, gear_item_id, user_id, rating, title, review_text,
                    pros, cons, durability_rating, value_rating,
                    would_recommend, usage_duration_months, verified_purchase
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                reviewId, gearId, request.user.id, rating, title, reviewText,
                pros, cons, durabilityRating, valueRating,
                wouldRecommend, usageDurationMonths, verifiedPurchase
            ).run();

            // Get the created review with user info
            const review = await this.db.prepare(`
                SELECT gr.*, u.username
                FROM gear_reviews gr
                JOIN users u ON gr.user_id = u.id
                WHERE gr.id = ?
            `).bind(reviewId).first();

            return this.successResponse({
                id: review.id,
                rating: review.rating,
                title: review.title,
                reviewText: review.review_text,
                pros: review.pros,
                cons: review.cons,
                durabilityRating: review.durability_rating,
                valueRating: review.value_rating,
                wouldRecommend: review.would_recommend,
                usageDurationMonths: review.usage_duration_months,
                verifiedPurchase: review.verified_purchase,
                helpfulVotes: review.helpful_votes,
                username: review.username,
                createdAt: review.created_at
            });

        } catch (error) {
            console.error('Create review error:', error);
            return this.errorResponse('Failed to create review', 500);
        }
    }

    // Get reviews for gear item
    async getReviews(request) {
        try {
            const gearId = request.params.id;
            const { 
                rating,
                sortBy = 'created_at',
                sortOrder = 'desc',
                limit = 20, 
                offset = 0 
            } = request.query || {};
            
            let sql = `
                SELECT gr.*, u.username, u.profile_image_url
                FROM gear_reviews gr
                JOIN users u ON gr.user_id = u.id
                WHERE gr.gear_item_id = ?
            `;
            let params = [gearId];

            if (rating) {
                sql += ` AND gr.rating = ?`;
                params.push(parseInt(rating));
            }

            // Add sorting
            const validSortFields = ['created_at', 'rating', 'helpful_votes'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            sql += ` ORDER BY gr.${sortField} ${order}`;

            sql += ` LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const reviews = await this.db.prepare(sql).bind(...params).all();

            return this.successResponse({
                reviews: reviews.results.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    title: review.title,
                    reviewText: review.review_text,
                    pros: review.pros,
                    cons: review.cons,
                    durabilityRating: review.durability_rating,
                    valueRating: review.value_rating,
                    wouldRecommend: review.would_recommend,
                    usageDurationMonths: review.usage_duration_months,
                    verifiedPurchase: review.verified_purchase,
                    helpfulVotes: review.helpful_votes,
                    username: review.username,
                    profileImageUrl: review.profile_image_url,
                    createdAt: review.created_at
                })),
                filters: {
                    rating,
                    sortBy,
                    sortOrder
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: reviews.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get reviews error:', error);
            return this.errorResponse('Failed to get reviews', 500);
        }
    }

    // Get user's loadouts
    async getLoadouts(request) {
        try {
            const { limit = 20, offset = 0 } = request.query || {};
            
            const loadouts = await this.db.prepare(`
                SELECT l.*, 
                       COUNT(li.id) as item_count
                FROM loadouts l
                LEFT JOIN loadout_items li ON l.id = li.loadout_id
                WHERE l.user_id = ?
                GROUP BY l.id
                ORDER BY l.created_at DESC
                LIMIT ? OFFSET ?
            `).bind(request.user.id, parseInt(limit), parseInt(offset)).all();

            return this.successResponse({
                loadouts: loadouts.results.map(loadout => ({
                    id: loadout.id,
                    name: loadout.name,
                    description: loadout.description,
                    huntType: loadout.hunt_type,
                    season: loadout.season,
                    terrain: loadout.terrain,
                    isPublic: loadout.is_public,
                    itemCount: loadout.item_count,
                    createdAt: loadout.created_at,
                    updatedAt: loadout.updated_at
                })),
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: loadouts.results.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get loadouts error:', error);
            return this.errorResponse('Failed to get loadouts', 500);
        }
    }

    // Create new loadout
    async createLoadout(request) {
        try {
            const body = await request.json();
            const {
                name,
                description,
                huntType,
                season,
                terrain,
                isPublic = true,
                gearItems = []
            } = body;

            // Validate required fields
            if (!name) {
                return this.errorResponse('Loadout name is required', 400);
            }

            const loadoutId = crypto.randomUUID();
            
            await this.db.prepare(`
                INSERT INTO loadouts (
                    id, user_id, name, description, hunt_type,
                    season, terrain, is_public
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                loadoutId, request.user.id, name, description, huntType,
                season, terrain, isPublic
            ).run();

            // Add gear items to loadout
            for (const item of gearItems) {
                const { gearItemId, quantity = 1, notes } = item;
                
                // Verify gear item exists
                const gear = await this.db.prepare(
                    'SELECT id FROM gear_items WHERE id = ? AND is_approved = 1'
                ).bind(gearItemId).first();

                if (gear) {
                    const itemId = crypto.randomUUID();
                    await this.db.prepare(`
                        INSERT INTO loadout_items (id, loadout_id, gear_item_id, quantity, notes)
                        VALUES (?, ?, ?, ?, ?)
                    `).bind(itemId, loadoutId, gearItemId, quantity, notes).run();
                }
            }

            // Get the created loadout with items
            const loadout = await this.getLoadoutWithItems(loadoutId);

            return this.successResponse(loadout);

        } catch (error) {
            console.error('Create loadout error:', error);
            return this.errorResponse('Failed to create loadout', 500);
        }
    }

    // Get loadout with items
    async getLoadoutWithItems(loadoutId) {
        const loadout = await this.db.prepare(
            'SELECT * FROM loadouts WHERE id = ?'
        ).bind(loadoutId).first();

        const items = await this.db.prepare(`
            SELECT li.*, g.name, g.brand, g.category, g.image_url, g.price
            FROM loadout_items li
            JOIN gear_items g ON li.gear_item_id = g.id
            WHERE li.loadout_id = ?
            ORDER BY g.category, g.name
        `).bind(loadoutId).all();

        return {
            id: loadout.id,
            name: loadout.name,
            description: loadout.description,
            huntType: loadout.hunt_type,
            season: loadout.season,
            terrain: loadout.terrain,
            isPublic: loadout.is_public,
            items: items.results.map(item => ({
                id: item.id,
                gearItemId: item.gear_item_id,
                name: item.name,
                brand: item.brand,
                category: item.category,
                imageUrl: item.image_url,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes
            })),
            createdAt: loadout.created_at,
            updatedAt: loadout.updated_at
        };
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