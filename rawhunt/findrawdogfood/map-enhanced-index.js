// SEO-Optimized FindRawDogFood Worker with IP Location & Map
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // SEO Routes
    if (path === '/robots.txt') {
      return new Response(`User-agent: *
Allow: /

Sitemap: ${url.origin}/sitemap.xml`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (path === '/sitemap.xml') {
      return generateSitemap(url.origin, env);
    }

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // Location landing pages
    if (path.startsWith('/location/')) {
      const location = path.split('/')[2];
      return generateLocationPage(location, url.origin, env);
    }

    // Main website
    return generateMainPage(url.origin);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // IP Location API
  if (path === '/api/location') {
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '127.0.0.1';
    const country = request.cf?.country || 'GB';
    const city = request.cf?.city || 'London';
    const region = request.cf?.region || 'England';
    const latitude = request.cf?.latitude || 51.5074;
    const longitude = request.cf?.longitude || -0.1278;

    return new Response(JSON.stringify({
      ip: clientIP,
      country,
      city,
      region,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Nearby suppliers API
  if (path === '/api/nearby') {
    const lat = parseFloat(url.searchParams.get('lat') || '51.5074');
    const lng = parseFloat(url.searchParams.get('lng') || '-0.1278');
    const radius = parseInt(url.searchParams.get('radius') || '50'); // km

    try {
      if (!env.FINDRAWDOGFOOD_DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          results: []
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Get suppliers within radius (approximate calculation for performance)
      const latRange = radius / 111; // roughly 111 km per degree latitude
      const lngRange = radius / (111 * Math.cos(lat * Math.PI / 180));

      const { results } = await env.FINDRAWDOGFOOD_DB.prepare(`
        SELECT *, 
               CASE 
                 WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN
                   (
                     6371 * acos(
                       cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + 
                       sin(radians(?)) * sin(radians(latitude))
                     )
                   )
                 ELSE 999999
               END as distance
        FROM suppliers 
        WHERE (latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?)
           OR (city IS NOT NULL AND city != '')
        ORDER BY distance ASC, business_name
        LIMIT 100
      `).bind(lat, lng, lat, lat - latRange, lat + latRange, lng - lngRange, lng + lngRange).all();
      
      return new Response(JSON.stringify({
        results: results || [],
        center: { lat, lng },
        radius
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        results: []
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Regular search API
  if (path === '/api/search') {
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
      if (!env.FINDRAWDOGFOOD_DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          results: [],
          page: 1,
          hasMore: false 
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      let sql, params;
      
      if (query.trim()) {
        sql = `SELECT * FROM suppliers WHERE 
               business_name LIKE ? OR 
               address LIKE ? OR 
               city LIKE ? OR 
               state LIKE ?
               ORDER BY business_name 
               LIMIT ? OFFSET ?`;
        const searchTerm = `%${query}%`;
        params = [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset];
      } else {
        sql = `SELECT * FROM suppliers ORDER BY business_name LIMIT ? OFFSET ?`;
        params = [limit, offset];
      }

      const { results } = await env.FINDRAWDOGFOOD_DB.prepare(sql).bind(...params).all();
      
      return new Response(JSON.stringify({
        results: results || [],
        page,
        hasMore: (results && results.length === limit) || false
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        results: [],
        page: 1,
        hasMore: false 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  return new Response('API endpoint not found', { status: 404 });
}

async function generateSitemap(origin, env) {
  try {
    let sitemapUrls = [];
    
    sitemapUrls.push(`  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);
    
    if (env.FINDRAWDOGFOOD_DB) {
      try {
        const { results } = await env.FINDRAWDOGFOOD_DB.prepare(`
          SELECT DISTINCT city FROM suppliers 
          WHERE city IS NOT NULL AND city != '' 
          ORDER BY city LIMIT 100
        `).all();
        
        if (results && results.length > 0) {
          for (const row of results) {
            const citySlug = row.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            sitemapUrls.push(`  <url>
    <loc>${origin}/location/${citySlug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
          }
        }
      } catch (dbError) {
        console.log('Database error in sitemap, using fallback cities');
      }
    }
    
    if (sitemapUrls.length === 1) {
      const fallbackCities = ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'liverpool', 'newcastle', 'sheffield', 'bristol', 'edinburgh'];
      for (const city of fallbackCities) {
        sitemapUrls.push(`  <url>
    <loc>${origin}/location/${city}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

async function generateLocationPage(location, origin, env) {
  const cityName = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  try {
    let suppliers = [];
    let count = 0;
    
    if (env.FINDRAWDOGFOOD_DB) {
      try {
        const { results } = await env.FINDRAWDOGFOOD_DB.prepare(`
          SELECT * FROM suppliers 
          WHERE city LIKE ? 
          ORDER BY COALESCE(premium_listing, 0) DESC, business_name
          LIMIT 50
        `).bind(`%${cityName}%`).all();
        suppliers = results || [];
        count = suppliers.length;
      } catch (dbError) {
        console.log('Database error in location page');
      }
    }
    
    return new Response(generateLocationHTML(cityName, suppliers, count, origin), {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(`<!DOCTYPE html>
<html><head><title>Error - ${cityName}</title></head>
<body><h1>Error loading ${cityName}</h1><p>Please try again later.</p></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function generateLocationHTML(cityName, suppliers, count, origin) {
  const supplierCards = suppliers.length > 0 ? 
    suppliers.map(supplier => `
      <div class="supplier-card ${supplier.premium_listing ? 'premium' : ''}">
        <div class="supplier-name">${supplier.business_name || 'Business Name'}</div>
        ${supplier.premium_listing ? '<div class="premium-badge">✨ Featured</div>' : ''}
        <div><strong>Address:</strong> ${supplier.address || 'Address not available'}</div>
        ${supplier.phone ? `<div><strong>📞 Phone:</strong> ${supplier.phone}</div>` : ''}
        ${supplier.website ? `<div><strong>🌐 Website:</strong> <a href="${supplier.website}" target="_blank">Visit Website</a></div>` : ''}
        ${supplier.rating ? `<div class="rating">⭐ ${supplier.rating.toFixed(1)}/5</div>` : ''}
      </div>
    `).join('') : 
    `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
      <h3>Loading suppliers for ${cityName}...</h3>
      <p>Please check back soon for suppliers in this area.</p>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw Dog Food Suppliers in ${cityName} | Find Raw Dog Food</title>
    <meta name="description" content="Find ${count} raw dog food suppliers in ${cityName}. Discover local BARF diet providers and quality suppliers near you.">
    <style>
        body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; font-size: 2.5em; margin-bottom: 10px; }
        .supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .supplier-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .supplier-card.premium { border: 2px solid #f39c12; background: linear-gradient(145deg, #fff, #fefefe); }
        .supplier-name { font-weight: bold; color: #c0392b; margin-bottom: 10px; font-size: 1.1em; }
        .premium-badge { background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; display: inline-block; margin-bottom: 10px; }
        .rating { color: #f39c12; font-weight: bold; margin-top: 10px; }
        .breadcrumb { margin-bottom: 20px; }
        .breadcrumb a { color: #3498db; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            <a href="${origin}">Find Raw Dog Food</a> > ${cityName}
        </div>
        
        <div class="header">
            <h1>Raw Dog Food Suppliers in ${cityName}</h1>
            <p>${count > 0 ? `Found ${count} suppliers` : 'Searching for suppliers'} in ${cityName}</p>
        </div>
        
        <div class="supplier-grid">
            ${supplierCards}
        </div>
    </div>
</body>
</html>`;
} 'birmingham', 'leeds', 'glasgow', 'liverpool', 'newcastle', 'sheffield', 'bristol', 'edinburgh'];
      for (const city of fallbackCities) {
        sitemapUrls.push(`  <url>
    <loc>${origin}/location/${city}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

async function generateLocationPage(location, origin, env) {
  const cityName = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  try {
    let suppliers = [];
    let count = 0;
    
    if (env.FINDRAWDOGFOOD_DB) {
      try {
        const { results } = await env.FINDRAWDOGFOOD_DB.prepare(`
          SELECT * FROM suppliers 
          WHERE city LIKE ? 
          ORDER BY business_name 
          LIMIT 50
        `).bind(`%${cityName}%`).all();
        suppliers = results || [];
        count = suppliers.length;
      } catch (dbError) {
        console.log('Database error in location page');
      }
    }
    
    return new Response(generateLocationHTML(cityName, suppliers, count, origin), {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(`<!DOCTYPE html>
<html><head><title>Error - ${cityName}</title></head>
<body><h1>Error loading ${cityName}</h1><p>Please try again later.</p></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function generateLocationHTML(cityName, suppliers, count, origin) {
  const supplierCards = suppliers.length > 0 ? 
    suppliers.map(supplier => `
      <div class="supplier-card">
        <div class="supplier-name">${supplier.business_name || 'Business Name'}</div>
        <div><strong>Address:</strong> ${supplier.address || 'Address not available'}</div>
        ${supplier.phone ? `<div><strong>Phone:</strong> ${supplier.phone}</div>` : ''}
        ${supplier.website ? `<div><strong>Website:</strong> <a href="${supplier.website}" target="_blank">Visit Website</a></div>` : ''}
      </div>
    `).join('') : 
    `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
      <h3>Loading suppliers for ${cityName}...</h3>
      <p>Please check back soon for suppliers in this area.</p>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw Dog Food Suppliers in ${cityName} | Find Raw Dog Food</title>
    <meta name="description" content="Find raw dog food suppliers in ${cityName}. Discover local BARF diet providers and quality suppliers near you.">
    <style>
        body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; font-size: 2.5em; margin-bottom: 10px; }
        .supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .supplier-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .supplier-name { font-weight: bold; color: #c0392b; margin-bottom: 10px; font-size: 1.1em; }
        .breadcrumb { margin-bottom: 20px; }
        .breadcrumb a { color: #3498db; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            <a href="${origin}">Find Raw Dog Food</a> > ${cityName}
        </div>
        
        <div class="header">
            <h1>Raw Dog Food Suppliers in ${cityName}</h1>
            <p>${count > 0 ? `Found ${count} suppliers` : 'Searching for suppliers'} in ${cityName}</p>
        </div>
        
        <div class="supplier-grid">
            ${supplierCards}
        </div>
    </div>
</body>
</html>`;
}

function generateMainPage(origin) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Raw Dog Food - UK's Largest Directory of Raw Dog Food Suppliers</title>
    <meta name="description" content="Discover raw dog food suppliers near you. Find local BARF diet providers with our interactive map and location-based search.">
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MW66CRSLYX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MW66CRSLYX');
    </script>
    
    <!-- Leaflet Map CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <style>
        body { font-family: system-ui; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .header { background: rgba(255,255,255,0.95); padding: 30px 20px; text-align: center; }
        .header h1 { color: #2c3e50; font-size: 3em; margin-bottom: 15px; }
        .header p { color: #7f8c8d; font-size: 1.3em; }
        .main-content { max-width: 1400px; margin: 0 auto; padding: 40px 20px; }
        
        .controls { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; margin-bottom: 30px; }
        .search-container { margin-bottom: 20px; }
        .search-box { display: flex; background: white; border-radius: 50px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        #searchInput { flex: 1; border: none; padding: 20px 25px; font-size: 18px; outline: none; }
        #searchBtn { background: #e74c3c; color: white; border: none; padding: 18px 30px; cursor: pointer; }
        
        .location-controls { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
        .location-info { background: #27ae60; color: white; padding: 10px 20px; border-radius: 20px; font-weight: 600; }
        #findNearbyBtn { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: 600; }
        #radiusSlider { width: 150px; }
        
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .map-container { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 20px; }
        #map { height: 500px; border-radius: 15px; }
        
        .results-container { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; }
        .supplier-card { background: white; margin: 15px 0; padding: 20px; border-radius: 15px; border-left: 5px solid #e74c3c; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease; }
        .supplier-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        .supplier-card.highlighted { border-left-color: #f39c12; background: #fff3cd; }
        .supplier-name { font-size: 1.3em; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .supplier-distance { color: #27ae60; font-weight: 600; font-size: 0.9em; }
        
        @media (max-width: 968px) {
            .content-grid { grid-template-columns: 1fr; }
            .location-controls { justify-content: center; }
            .header h1 { font-size: 2.2em; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 Find Raw Dog Food</h1>
        <p>Find suppliers near you with our interactive map</p>
    </div>

    <div class="main-content">
        <div class="controls">
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Search by business name, city, or area..." />
                    <button id="searchBtn">🔍 Search</button>
                </div>
            </div>
            
            <div class="location-controls">
                <div id="locationInfo" class="location-info">📍 Detecting your location...</div>
                <button id="findNearbyBtn">Find Nearby Suppliers</button>
                <label>Radius: <span id="radiusValue">25</span> km</label>
                <input type="range" id="radiusSlider" min="5" max="100" value="25" />
            </div>
        </div>

        <div class="content-grid">
            <div class="map-container">
                <div id="map"></div>
            </div>
            
            <div class="results-container">
                <h3>Suppliers Near You</h3>
                <div id="resultsContent">
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        Click "Find Nearby Suppliers" to see local providers
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Leaflet Map JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <script>
        let map, userLocation, suppliersData = [], markersLayer;
        let currentRadius = 25;

        // Initialize map
        function initMap(lat = 51.5074, lng = -0.1278) {
            map = L.map('map').setView([lat, lng], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            markersLayer = L.layerGroup().addTo(map);
            
            // Add user location marker
            userLocation = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map).bindPopup('Your Location');
        }

        // Get user's location from IP
        async function getUserLocation() {
            try {
                const response = await fetch('/api/location');
                const data = await response.json();
                
                document.getElementById('locationInfo').textContent = 
                    \`📍 \${data.city}, \${data.region}\`;
                
                initMap(data.latitude, data.longitude);
                return { lat: data.latitude, lng: data.longitude };
            } catch (error) {
                console.error('Error getting location:', error);
                initMap(); // Default to London
                return { lat: 51.5074, lng: -0.1278 };
            }
        }

        // Find nearby suppliers
        async function findNearbySuppliers() {
            const userPos = userLocation.getLatLng();
            const resultsContent = document.getElementById('resultsContent');
            
            resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;">🔍 Finding suppliers near you...</div>';

            try {
                const response = await fetch(\`/api/nearby?lat=\${userPos.lat}&lng=\${userPos.lng}&radius=\${currentRadius}\`);
                const data = await response.json();

                suppliersData = data.results || [];
                displaySuppliersOnMap();
                displaySuppliersList();
                
                // Update map view to show radius
                const circle = L.circle([userPos.lat, userPos.lng], {
                    radius: currentRadius * 1000, // Convert km to meters
                    fillColor: '#3498db',
                    fillOpacity: 0.1,
                    color: '#3498db',
                    weight: 2
                }).addTo(markersLayer);
                
            } catch (error) {
                resultsContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;">Error finding suppliers. Please try again.</div>';
            }
        }

        // Display suppliers on map
        function displaySuppliersOnMap() {
            // Clear existing markers except user location
            markersLayer.clearLayers();
            
            suppliersData.forEach((supplier, index) => {
                // Try to geocode address or use approximate location
                let lat, lng;
                
                // Simple city-based coordinates (you could enhance this with geocoding API)
                const cityCoords = {
                    'london': [51.5074, -0.1278],
                    'manchester': [53.4808, -2.2426],
                    'birmingham': [52.4862, -1.8904],
                    'leeds': [53.8008, -1.5491],
                    'glasgow': [55.8642, -4.2518],
                    'liverpool': [53.4084, -2.9916],
                    'newcastle': [54.9783, -1.6178],
                    'sheffield': [53.3811, -1.4701],
                    'bristol': [51.4545, -2.5879],
                    'edinburgh': [55.9533, -3.1883]
                };
                
                const city = supplier.city?.toLowerCase() || 'london';
                [lat, lng] = cityCoords[city] || cityCoords['london'];
                
                // Add some random offset to avoid overlapping markers
                lat += (Math.random() - 0.5) * 0.02;
                lng += (Math.random() - 0.5) * 0.02;
                
                const marker = L.marker([lat, lng]).addTo(markersLayer);
                marker.bindPopup(\`
                    <strong>\${supplier.business_name}</strong><br>
                    \${supplier.address}<br>
                    \${supplier.phone ? \`📞 \${supplier.phone}<br>\` : ''}
                    \${supplier.website ? \`<a href="\${supplier.website}" target="_blank">Visit Website</a>\` : ''}
                \`);
                
                // Click handler to highlight in list
                marker.on('click', () => {
                    highlightSupplier(index);
                });
            });
        }

        // Display suppliers in list
        function displaySuppliersList() {
            const resultsContent = document.getElementById('resultsContent');
            
            if (suppliersData.length === 0) {
                resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>No suppliers found</h3><p>Try increasing the search radius.</p></div>';
                return;
            }

            resultsContent.innerHTML = suppliersData.map((supplier, index) => \`
                <div class="supplier-card" onclick="highlightSupplier(\${index})" data-index="\${index}">
                    <div class="supplier-name">\${supplier.business_name || 'Business Name'}</div>
                    \${supplier.distance && supplier.distance < 999 ? \`<div class="supplier-distance">📍 ~\${Math.round(supplier.distance)} km away</div>\` : ''}
                    <div><strong>Address:</strong> \${supplier.address || 'Address not available'}</div>
                    \${supplier.phone ? \`<div><strong>📞 Phone:</strong> \${supplier.phone}</div>\` : ''}
                    \${supplier.website ? \`<div><strong>🌐 Website:</strong> <a href="\${supplier.website}" target="_blank">\${supplier.website}</a></div>\` : ''}
                </div>
            \`).join('');
        }

        // Highlight supplier in list
        function highlightSupplier(index) {
            // Remove previous highlights
            document.querySelectorAll('.supplier-card').forEach(card => {
                card.classList.remove('highlighted');
            });
            
            // Highlight selected supplier
            const card = document.querySelector(\`[data-index="\${index}"]\`);
            if (card) {
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Regular search function
        async function search() {
            const query = document.getElementById('searchInput').value;
            const resultsContent = document.getElementById('resultsContent');
            
            resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;">🔍 Searching database...</div>';

            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&page=1\`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    suppliersData = data.results;
                    displaySuppliersOnMap();
                    displaySuppliersList();
                } else {
                    resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>No suppliers found</h3><p>Try a different search term.</p></div>';
                }
            } catch (error) {
                resultsContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><h3>Search Error</h3><p>Please try again.</p></div>';
            }
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') search();
        });
        document.getElementById('searchBtn').addEventListener('click', search);
        document.getElementById('findNearbyBtn').addEventListener('click', findNearbySuppliers);
        
        document.getElementById('radiusSlider').addEventListener('input', function(e) {
            currentRadius = parseInt(e.target.value);
            document.getElementById('radiusValue').textContent = currentRadius;
        });

        // Initialize on page load
        window.addEventListener('load', () => {
            getUserLocation();
        });
    </script>
</body>
</html>`;
}