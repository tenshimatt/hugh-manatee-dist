// Clean SEO-Optimized FindRawDogFood Worker (Fixed Sitemap)
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
    
    // Main page
    sitemapUrls.push(`  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);
    
    // Try to get cities from database
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
    
    // Fallback cities if database failed or no results
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
    // Emergency fallback sitemap
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
    <meta name="description" content="Discover raw dog food suppliers across the UK. Find BARF diet providers, raw pet food stores, and quality suppliers near you.">
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MW66CRSLYX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MW66CRSLYX');
    </script>
    
    <style>
        body { font-family: system-ui; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .header { background: rgba(255,255,255,0.95); padding: 30px 20px; text-align: center; }
        .header h1 { color: #2c3e50; font-size: 3em; margin-bottom: 15px; }
        .header p { color: #7f8c8d; font-size: 1.3em; }
        .main-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .search-container { background: white; margin: 30px auto; max-width: 700px; border-radius: 50px; overflow: hidden; }
        .search-box { display: flex; padding: 5px; }
        #searchInput { flex: 1; border: none; padding: 20px 25px; font-size: 18px; outline: none; }
        #searchBtn { background: #e74c3c; color: white; border: none; padding: 18px 30px; border-radius: 45px; cursor: pointer; }
        .results-container { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; margin: 30px 0; display: none; }
        .supplier-card { background: white; margin: 20px 0; padding: 25px; border-radius: 15px; border-left: 5px solid #e74c3c; }
        .supplier-name { font-size: 1.4em; font-weight: bold; color: #2c3e50; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 Find Raw Dog Food</h1>
        <p>The UK's comprehensive directory of raw dog food suppliers</p>
    </div>

    <div class="main-content">
        <div class="search-container">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search by business name, city, or area..." />
                <button id="searchBtn">🔍 Search</button>
            </div>
        </div>

        <div id="results" class="results-container">
            <div id="resultsContent"></div>
        </div>
    </div>

    <script>
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') search();
        });
        document.getElementById('searchBtn').addEventListener('click', search);

        async function search() {
            const query = document.getElementById('searchInput').value;
            const resultsDiv = document.getElementById('results');
            const resultsContent = document.getElementById('resultsContent');
            
            resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;">🔍 Searching database...</div>';
            resultsDiv.style.display = 'block';

            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&page=1\`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    resultsContent.innerHTML = data.results.map(supplier => \`
                        <div class="supplier-card">
                            <div class="supplier-name">\${supplier.business_name || 'Business Name'}</div>
                            <div><strong>📍 Address:</strong> \${supplier.address || 'Address not available'}</div>
                            \${supplier.phone ? \`<div><strong>📞 Phone:</strong> \${supplier.phone}</div>\` : ''}
                            \${supplier.website ? \`<div><strong>🌐 Website:</strong> <a href="\${supplier.website}" target="_blank">\${supplier.website}</a></div>\` : ''}
                        </div>
                    \`).join('');
                } else {
                    resultsContent.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>No suppliers found</h3><p>Try searching for a different city or business name.</p></div>';
                }
            } catch (error) {
                resultsContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><h3>Search Error</h3><p>Database is connecting. Please try again in a moment.</p></div>';
            }
        }

        // Auto-load sample results
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('searchInput').value = '';
                search();
            }, 1000);
        });
    </script>
</body>
</html>`;
}