import { sanitizeInput } from '../lib/validation.js';
import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

// Authentication helper
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  const sessionData = await env.SESSIONS.get(token);
  
  if (!sessionData) {
    return { valid: false, error: 'Invalid or expired session' };
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (new Date() > new Date(session.expiresAt)) {
    await env.SESSIONS.delete(token);
    return { valid: false, error: 'Session expired' };
  }
  
  return { valid: true, userId: session.userId, email: session.email };
}

// Check admin privileges
async function checkAdminAccess(request, env) {
  const adminToken = request.headers.get('X-Admin-Token');
  return adminToken && adminToken === env.ADMIN_TOKEN;
}

// Get store catalog
async function getStoreCatalog(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const sortBy = url.searchParams.get('sort') || 'created_at';
    const sortOrder = url.searchParams.get('order') || 'DESC';
    
    // Validate sort parameters
    const validSortFields = ['name', 'price_paws', 'price_usd', 'created_at', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let query = 'SELECT * FROM store_items WHERE in_stock = 1';
    let bindings = [];
    
    if (category) {
      query += ' AND category = ?';
      bindings.push(category);
    }
    
    query += ` ORDER BY ${finalSortBy} ${finalSortOrder} LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);
    
    const items = await env.DB.prepare(query).bind(...bindings).all();
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM store_items WHERE in_stock = 1';
    let countBindings = [];
    
    if (category) {
      countQuery += ' AND category = ?';
      countBindings.push(category);
    }
    
    const countResult = await env.DB.prepare(countQuery).bind(...countBindings).first();
    const totalCount = countResult.total;
    
    // Get available categories
    const categories = await env.DB.prepare(`
      SELECT DISTINCT category, COUNT(*) as item_count 
      FROM store_items 
      WHERE in_stock = 1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `).all();
    
    // Add image URLs to items
    const itemsWithUrls = items.results.map(item => ({
      ...item,
      imageUrl: item.image_r2_key ? `${env.R2_PUBLIC_URL}/${item.image_r2_key}` : null
    }));
    
    return new Response(JSON.stringify({
      items: itemsWithUrls,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      categories: categories.results || [],
      filters: {
        category,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get store catalog error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get specific store item
async function getStoreItem(request, env) {
  try {
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();
    
    const item = await env.DB.prepare('SELECT * FROM store_items WHERE id = ?')
      .bind(itemId).first();
    
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add image URL
    const itemWithUrl = {
      ...item,
      imageUrl: item.image_r2_key ? `${env.R2_PUBLIC_URL}/${item.image_r2_key}` : null
    };
    
    // Get related items (same category, excluding current item)
    const relatedItems = await env.DB.prepare(`
      SELECT * FROM store_items 
      WHERE category = ? AND id != ? AND in_stock = 1 
      ORDER BY RANDOM() 
      LIMIT 4
    `).bind(item.category, itemId).all();
    
    const relatedWithUrls = relatedItems.results.map(relatedItem => ({
      ...relatedItem,
      imageUrl: relatedItem.image_r2_key ? `${env.R2_PUBLIC_URL}/${relatedItem.image_r2_key}` : null
    }));
    
    return new Response(JSON.stringify({
      item: itemWithUrl,
      relatedItems: relatedWithUrls
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get store item error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Purchase item with PAWS
async function purchaseItem(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { itemId, quantity, paymentMethod } = body;
    
    if (!itemId || !quantity || quantity < 1) {
      return new Response(JSON.stringify({ error: 'Valid itemId and quantity are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!['paws', 'usd'].includes(paymentMethod)) {
      return new Response(JSON.stringify({ error: 'Payment method must be paws or usd' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get item details
    const item = await env.DB.prepare('SELECT * FROM store_items WHERE id = ? AND in_stock = 1')
      .bind(itemId).first();
    
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found or out of stock' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user details
    const user = await env.DB.prepare(
      'SELECT paws_balance, subscription_tier FROM users WHERE id = ?'
    ).bind(auth.userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let totalPrice, currency;
    
    if (paymentMethod === 'paws') {
      if (!item.price_paws) {
        return new Response(JSON.stringify({ error: 'Item not available for PAWS purchase' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      totalPrice = item.price_paws * quantity;
      currency = 'paws';
      
      // Apply subscription discount
      let discount = 0;
      if (user.subscription_tier === 'paid') {
        discount = 0.1; // 10% discount
      } else if (user.subscription_tier === 'premium') {
        discount = 0.2; // 20% discount
      }
      
      if (discount > 0) {
        totalPrice = Math.round(totalPrice * (1 - discount));
      }
      
      // Check user balance
      if (user.paws_balance < totalPrice) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient PAWS balance',
          required: totalPrice,
          available: user.paws_balance
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // USD payment
      if (!item.price_usd) {
        return new Response(JSON.stringify({ error: 'Item not available for USD purchase' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      totalPrice = item.price_usd * quantity;
      currency = 'usd';
      
      // For USD payments, we would integrate with Stripe here
      // For now, we'll simulate a successful payment
    }
    
    const purchaseId = uuidv4();
    
    try {
      // Begin transaction
      if (paymentMethod === 'paws') {
        // Deduct PAWS from user balance
        await env.DB.prepare(
          'UPDATE users SET paws_balance = paws_balance - ? WHERE id = ?'
        ).bind(totalPrice, auth.userId).run();
        
        // Record PAWS transaction
        await env.DB.prepare(`
          INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status)
          VALUES (?, ?, ?, 'spend', ?, 'completed')
        `).bind(
          uuidv4(),
          auth.userId,
          -totalPrice,
          `Store purchase: ${item.name} (x${quantity})`
        ).run();
      }
      
      // Record purchase
      await env.DB.prepare(`
        INSERT INTO user_purchases (id, user_id, item_id, quantity, total_price_paws, total_price_usd, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
      `).bind(
        purchaseId,
        auth.userId,
        itemId,
        quantity,
        paymentMethod === 'paws' ? totalPrice : null,
        paymentMethod === 'usd' ? totalPrice : null,
        paymentMethod
      ).run();
      
      // Get updated user balance if PAWS payment
      let newBalance = null;
      if (paymentMethod === 'paws') {
        const updatedUser = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
          .bind(auth.userId).first();
        newBalance = updatedUser.paws_balance;
      }
      
      return new Response(JSON.stringify({
        purchaseId,
        item: {
          id: item.id,
          name: item.name,
          quantity
        },
        totalPrice,
        currency,
        paymentMethod,
        newBalance,
        status: 'completed',
        message: 'Purchase completed successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (dbError) {
      console.error('Purchase transaction error:', dbError);
      return new Response(JSON.stringify({ error: 'Purchase failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Purchase item error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get user purchase history
async function getUserPurchases(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const status = url.searchParams.get('status');
    
    let query = `
      SELECT p.*, s.name as item_name, s.description as item_description, s.image_r2_key
      FROM user_purchases p
      JOIN store_items s ON p.item_id = s.id
      WHERE p.user_id = ?
    `;
    let bindings = [auth.userId];
    
    if (status) {
      query += ' AND p.status = ?';
      bindings.push(status);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);
    
    const purchases = await env.DB.prepare(query).bind(...bindings).all();
    
    // Add image URLs and format data
    const purchasesWithUrls = purchases.results.map(purchase => ({
      ...purchase,
      imageUrl: purchase.image_r2_key ? `${env.R2_PUBLIC_URL}/${purchase.image_r2_key}` : null
    }));
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM user_purchases WHERE user_id = ?';
    let countBindings = [auth.userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countBindings.push(status);
    }
    
    const countResult = await env.DB.prepare(countQuery).bind(...countBindings).first();
    const totalCount = countResult.total;
    
    // Calculate spending summary
    const summary = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(CASE WHEN total_price_paws IS NOT NULL THEN total_price_paws ELSE 0 END) as total_paws_spent,
        SUM(CASE WHEN total_price_usd IS NOT NULL THEN total_price_usd ELSE 0 END) as total_usd_spent,
        COUNT(CASE WHEN payment_method = 'paws' THEN 1 END) as paws_purchases,
        COUNT(CASE WHEN payment_method = 'usd' THEN 1 END) as usd_purchases
      FROM user_purchases 
      WHERE user_id = ? AND status = 'completed'
    `).bind(auth.userId).first();
    
    return new Response(JSON.stringify({
      purchases: purchasesWithUrls,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      summary: {
        totalPurchases: summary.total_purchases || 0,
        totalPawsSpent: summary.total_paws_spent || 0,
        totalUsdSpent: summary.total_usd_spent || 0,
        pawsPurchases: summary.paws_purchases || 0,
        usdPurchases: summary.usd_purchases || 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user purchases error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create store item (admin only)
async function createStoreItem(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { name, description, price_paws, price_usd, category, image_r2_key } = body;
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!price_paws && !price_usd) {
      return new Response(JSON.stringify({ error: 'At least one price (PAWS or USD) is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const itemId = uuidv4();
    
    await env.DB.prepare(`
      INSERT INTO store_items (id, name, description, price_paws, price_usd, category, image_r2_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      itemId,
      sanitizeInput(name),
      description ? sanitizeInput(description) : null,
      price_paws ? parseInt(price_paws) : null,
      price_usd ? parseFloat(price_usd) : null,
      category ? sanitizeInput(category) : null,
      image_r2_key || null
    ).run();
    
    // Get created item
    const createdItem = await env.DB.prepare('SELECT * FROM store_items WHERE id = ?')
      .bind(itemId).first();
    
    const itemWithUrl = {
      ...createdItem,
      imageUrl: createdItem.image_r2_key ? `${env.R2_PUBLIC_URL}/${createdItem.image_r2_key}` : null
    };
    
    return new Response(JSON.stringify({
      item: itemWithUrl,
      message: 'Store item created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create store item error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update store item (admin only)
async function updateStoreItem(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();
    
    // Check if item exists
    const existingItem = await env.DB.prepare('SELECT * FROM store_items WHERE id = ?')
      .bind(itemId).first();
    
    if (!existingItem) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { name, description, price_paws, price_usd, category, image_r2_key, in_stock } = body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(sanitizeInput(name));
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description ? sanitizeInput(description) : null);
    }
    
    if (price_paws !== undefined) {
      updateFields.push('price_paws = ?');
      updateValues.push(price_paws ? parseInt(price_paws) : null);
    }
    
    if (price_usd !== undefined) {
      updateFields.push('price_usd = ?');
      updateValues.push(price_usd ? parseFloat(price_usd) : null);
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category ? sanitizeInput(category) : null);
    }
    
    if (image_r2_key !== undefined) {
      updateFields.push('image_r2_key = ?');
      updateValues.push(image_r2_key || null);
    }
    
    if (in_stock !== undefined) {
      updateFields.push('in_stock = ?');
      updateValues.push(!!in_stock);
    }
    
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(itemId);
    
    const updateQuery = `
      UPDATE store_items 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    await env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    // Get updated item
    const updatedItem = await env.DB.prepare('SELECT * FROM store_items WHERE id = ?')
      .bind(itemId).first();
    
    const itemWithUrl = {
      ...updatedItem,
      imageUrl: updatedItem.image_r2_key ? `${env.R2_PUBLIC_URL}/${updatedItem.image_r2_key}` : null
    };
    
    return new Response(JSON.stringify({
      item: itemWithUrl,
      message: 'Store item updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update store item error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleStore(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    // GET /api/store - Get store catalog
    if (path === '/api/store' && method === 'GET') {
      response = await getStoreCatalog(request, env);
    }
    // POST /api/store - Create store item (admin only)
    else if (path === '/api/store' && method === 'POST') {
      response = await createStoreItem(request, env);
    }
    // GET /api/store/purchases - Get user purchase history
    else if (path === '/api/store/purchases' && method === 'GET') {
      response = await getUserPurchases(request, env);
    }
    // POST /api/store/purchase - Purchase item
    else if (path === '/api/store/purchase' && method === 'POST') {
      response = await purchaseItem(request, env);
    }
    // GET /api/store/{itemId} - Get specific store item
    else if (path.match(/^\/api\/store\/[a-f0-9-]+$/) && method === 'GET') {
      response = await getStoreItem(request, env);
    }
    // PUT /api/store/{itemId} - Update store item (admin only)
    else if (path.match(/^\/api\/store\/[a-f0-9-]+$/) && method === 'PUT') {
      response = await updateStoreItem(request, env);
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'GET /api/store?category=&limit=20&offset=0&sort=created_at&order=DESC - Get store catalog',
          'POST /api/store - Create store item (admin)',
          'GET /api/store/purchases?limit=20&offset=0&status= - Get user purchase history',
          'POST /api/store/purchase - Purchase item',
          'GET /api/store/{itemId} - Get specific store item',
          'PUT /api/store/{itemId} - Update store item (admin)'
        ]
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Store handler error:', error);
    const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
