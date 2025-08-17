// Cloudflare Worker for Raw Dog Food Supplier Search - D1 Version
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/search' && request.method === 'POST') {
        return await handleSearch(request, env, corsHeaders);
      }
      
      if (url.pathname === '/suppliers' && request.method === 'GET') {
        return await handleGetSuppliers(request, env, corsHeaders);
      }
      
      if (url.pathname === '/affiliate-click' && request.method === 'POST') {
        return await handleAffiliateClick(request, env, corsHeaders);
      }
      
      if (url.pathname === '/health') {
        return new Response('OK', { headers: corsHeaders });
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleSearch(request, env, corsHeaders) {
  const searchData = await request.json();
  const { dogBreed, dogAge, dogWeight, allergies, location } = searchData;
  
  // Log the search
  await logSearch(env, searchData);
  
  // Get suppliers based on location and requirements
  const suppliers = await findSuppliers(env, {
    location,
    dogBreed,
    allergies
  });
  
  return new Response(JSON.stringify({
    success: true,
    suppliers,
    searchId: generateSearchId()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetSuppliers(request, env, corsHeaders) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city');
  const state = url.searchParams.get('state');
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  
  let query = `
    SELECT 
      id, name, address, city, state, 
      latitude, longitude, description, 
      website, phone, email, rating, 
      review_count, verified, affiliate_link
    FROM suppliers 
    WHERE verified = 1
  `;
  
  const params = [];
  
  if (city) {
    query += ` AND LOWER(city) LIKE LOWER(?)`;
    params.push(`%${city}%`);
  }
  
  if (state) {
    query += ` AND LOWER(state) LIKE LOWER(?)`;
    params.push(`%${state}%`);
  }
  
  query += ` ORDER BY rating DESC, review_count DESC LIMIT ?`;
  params.push(limit);
  
  const results = await env.DB.prepare(query).bind(...params).all();
  
  return new Response(JSON.stringify({
    success: true,
    suppliers: results.results || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAffiliateClick(request, env, corsHeaders) {
  const clickData = await request.json();
  const { supplierId, searchId } = clickData;
  
  // Log the affiliate click
  await env.DB.prepare(`
    INSERT INTO affiliate_clicks (supplier_id, search_id, user_agent, referrer)
    VALUES (?, ?, ?, ?)
  `).bind(
    supplierId,
    searchId || null,
    request.headers.get('User-Agent') || '',
    request.headers.get('Referer') || ''
  ).run();
  
  // Get the affiliate link
  const supplier = await env.DB.prepare(`
    SELECT affiliate_link, name FROM suppliers WHERE id = ?
  `).bind(supplierId).first();
  
  if (!supplier || !supplier.affiliate_link) {
    return new Response(JSON.stringify({ 
      error: 'Supplier not found or no affiliate link' 
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    redirectUrl: supplier.affiliate_link,
    supplierName: supplier.name
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function findSuppliers(env, criteria) {
  const { location, dogBreed, allergies } = criteria;
  
  let query = `
    SELECT 
      id, name, address, city, state,
      latitude, longitude, description,
      website, phone, email, rating,
      review_count, verified, affiliate_link
    FROM suppliers 
    WHERE verified = 1
  `;
  
  const params = [];
  
  // Location-based filtering
  if (location) {
    const locationParts = location.split(',').map(part => part.trim());
    if (locationParts.length >= 2) {
      const city = locationParts[0];
      const state = locationParts[1];
      
      query += ` AND (
        LOWER(city) LIKE LOWER(?) OR 
        LOWER(state) LIKE LOWER(?)
      )`;
      params.push(`%${city}%`, `%${state}%`);
    } else {
      query += ` AND (
        LOWER(city) LIKE LOWER(?) OR 
        LOWER(state) LIKE LOWER(?)
      )`;
      params.push(`%${location}%`, `%${location}%`);
    }
  }
  
  // Filter for allergy-friendly suppliers if allergies specified
  if (allergies && allergies.length > 0) {
    query += ` AND (
      description LIKE '%grain-free%' OR
      description LIKE '%limited ingredient%' OR
      description LIKE '%hypoallergenic%' OR
      description LIKE '%sensitive%'
    )`;
  }
  
  query += ` ORDER BY rating DESC, review_count DESC LIMIT 20`;
  
  const results = await env.DB.prepare(query).bind(...params).all();
  
  // Add affiliate links and enhance data
  return (results.results || []).map(supplier => ({
    ...supplier,
    affiliate_link: supplier.affiliate_link || generateAffiliateLink(supplier),
    distance: location ? calculateMockDistance() : null,
    specialties: generateSpecialties(supplier.description, allergies)
  }));
}

async function logSearch(env, searchData) {
  try {
    await env.DB.prepare(`
      INSERT INTO searches (
        dog_breed, dog_age, dog_weight, 
        allergies, location, session_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      searchData.dogBreed || '',
      searchData.dogAge || null,
      searchData.dogWeight || null,
      JSON.stringify(searchData.allergies || []),
      searchData.location || '',
      generateSearchId()
    ).run();
  } catch (error) {
    console.error('Failed to log search:', error);
  }
}

function generateAffiliateLink(supplier) {
  if (supplier.affiliate_link) return supplier.affiliate_link;
  
  // Generate affiliate links for common suppliers
  const name = supplier.name.toLowerCase();
  
  if (name.includes('chewy')) {
    return `https://www.chewy.com/raw-dog-food?tracking_id=your_affiliate_id`;
  }
  
  if (name.includes('petco')) {
    return `https://www.petco.com/shop/raw-dog-food?affiliate_id=your_affiliate_id`;
  }
  
  if (name.includes('petsmart')) {
    return `https://www.petsmart.com/raw-dog-food?partner_id=your_affiliate_id`;
  }
  
  // Default to website with affiliate tracking
  return supplier.website ? 
    `${supplier.website}?ref=rawdogfood` : 
    'https://example.com/affiliate-link';
}

function generateSpecialties(description, allergies) {
  const specialties = [];
  
  if (description) {
    const desc = description.toLowerCase();
    if (desc.includes('grain-free')) specialties.push('Grain-Free');
    if (desc.includes('organic')) specialties.push('Organic');
    if (desc.includes('local')) specialties.push('Local Source');
    if (desc.includes('frozen')) specialties.push('Frozen Raw');
    if (desc.includes('freeze-dried')) specialties.push('Freeze-Dried');
  }
  
  if (allergies && allergies.length > 0) {
    specialties.push('Allergy-Friendly');
  }
  
  return specialties.length > 0 ? specialties : ['Premium Quality'];
}

function calculateMockDistance() {
  // Return a realistic distance in miles
  return Math.floor(Math.random() * 50) + 1;
}

function generateSearchId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}