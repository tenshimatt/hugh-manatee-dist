// Cloudflare Worker to Create Test Records
// Deploy this temporarily to insert test data

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only allow POST requests to /create-test-records
    if (request.method !== 'POST' || url.pathname !== '/create-test-records') {
      return new Response('Use POST /create-test-records', { status: 404 });
    }
    
    try {
      // Check if records already exist
      const existingCheck = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM suppliers_complete WHERE name IN ('TEST-JSY', 'TEST-UK')"
      ).first();
      
      if (existingCheck.count > 0) {
        return new Response(JSON.stringify({
          success: false,
          message: `${existingCheck.count} test records already exist`,
          action: 'skipped'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Insert Jersey test record
      const jerseyResult = await env.DB.prepare(`
        INSERT INTO suppliers_complete (
          id, place_id, name, city, state, country, 
          latitude, longitude, formatted_address, postal_code,
          rating, user_ratings_total, formatted_phone_number, website,
          business_status, delivery, takeout, curbside_pickup,
          keyword, place_type, created_at, updated_at, api_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'test-jersey-001',
        'test_place_id_jersey_001',
        'TEST-JSY',
        'St Ouens',
        'Jersey',
        'United Kingdom',
        49.2247,
        -2.2047,
        'La Route de St Ouens, St Ouens, Jersey JE3 2AB, UK',
        'JE3 2AB',
        4.7,
        23,
        '+44 1534 123456',
        'https://test-jsy-rawfood.je',
        'OPERATIONAL',
        1, // delivery: true
        1, // takeout: true  
        1, // curbside_pickup: true
        'raw dog food',
        'raw_dog_food_complete',
        new Date().toISOString(),
        new Date().toISOString(),
        'complete_v1.0'
      ).run();
      
      // Insert London test record
      const londonResult = await env.DB.prepare(`
        INSERT INTO suppliers_complete (
          id, place_id, name, city, state, country,
          latitude, longitude, formatted_address, postal_code, 
          rating, user_ratings_total, formatted_phone_number, website,
          business_status, delivery, takeout, curbside_pickup,
          keyword, place_type, created_at, updated_at, api_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'test-london-001',
        'test_place_id_london_001',
        'TEST-UK',
        'London',
        'England',
        'United Kingdom',
        51.5408,
        -0.1426,
        '123 Camden High Street, Camden, London NW1 7JR, UK',
        'NW1 7JR',
        4.6,
        87,
        '+44 20 7123 4567',
        'https://test-uk-rawpetfood.co.uk',
        'OPERATIONAL',
        1, // delivery: true
        1, // takeout: true
        1, // curbside_pickup: true
        'raw dog food', 
        'raw_dog_food_complete',
        new Date().toISOString(),
        new Date().toISOString(),
        'complete_v1.0'
      ).run();
      
      // Verify records were created
      const verifyRecords = await env.DB.prepare(`
        SELECT name, city, state, latitude, longitude, rating, formatted_phone_number 
        FROM suppliers_complete 
        WHERE name IN ('TEST-JSY', 'TEST-UK')
        ORDER BY name
      `).all();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Test records created successfully',
        records_created: 2,
        jersey_result: {
          success: jerseyResult.success,
          changes: jerseyResult.changes
        },
        london_result: {
          success: londonResult.success, 
          changes: londonResult.changes
        },
        verification: verifyRecords.results,
        instructions: {
          test_jersey: "Search for 'TEST-JSY' or 'St Ouens'",
          test_london: "Search for 'TEST-UK' or 'Camden'",
          nearby_jersey: "Use lat=49.2247, lng=-2.2047",
          nearby_london: "Use lat=51.5408, lng=-0.1426"
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error creating test records:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        suggestion: 'Check if suppliers_complete table exists and has correct schema'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
