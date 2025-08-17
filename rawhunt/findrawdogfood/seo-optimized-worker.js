// Complete SEO-Optimized FindRawDogFood Cloudflare Worker
// Deploy this to replace your current worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env);
    }

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
        results,
        page,
        hasMore: results.length === limit
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Not Found', { status: 404 });
}

async function generateSitemap(origin, env) {
  try {
    // Get sample of cities for sitemap
    const { results: cities } = await env.FINDRAWDOGFOOD_DB.prepare(`
      SELECT DISTINCT city FROM suppliers 
      WHERE city IS NOT NULL AND city != '' 
      ORDER BY city LIMIT 100
    `).all();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/blog/raw-truth-why-dogs-thrive-barf-diet</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${cities.map(city => `  <url>
    <loc>${origin}/location/${encodeURIComponent(city.city.toLowerCase().replace(/\s+/g, '-'))}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    return new Response('Error generating sitemap', { status: 500 });
  }
}

async function generateLocationPage(location, origin, env) {
  const cityName = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  try {
    const { results } = await env.FINDRAWDOGFOOD_DB.prepare(`
      SELECT * FROM suppliers 
      WHERE city LIKE ? 
      ORDER BY business_name 
      LIMIT 50
    `).bind(`%${cityName}%`).all();

    const count = results.length;
    
    return new Response(generateLocationHTML(cityName, results, count, origin), {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response('Error loading location', { status: 500 });
  }
}

function generateLocationHTML(cityName, suppliers, count, origin) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw Dog Food Suppliers in ${cityName} | Find Raw Dog Food</title>
    <meta name="description" content="Find ${count} raw dog food suppliers in ${cityName}. Discover local BARF diet providers, raw pet food stores, and quality suppliers near you.">
    
    <!-- Schema.org for Location -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Raw Dog Food Suppliers in ${cityName}",
      "description": "Comprehensive directory of raw dog food suppliers in ${cityName}",
      "numberOfItems": ${count},
      "itemListElement": [
        ${suppliers.slice(0, 10).map((supplier, index) => `{
          "@type": "LocalBusiness",
          "position": ${index + 1},
          "name": "${supplier.business_name}",
          "address": "${supplier.address}",
          "telephone": "${supplier.phone || ''}"
        }`).join(',')}
      ]
    }
    </script>
    
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; font-size: 2.5em; margin-bottom: 10px; }
        .supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .supplier-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
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
            <p>Found ${count} quality raw dog food suppliers in ${cityName}</p>
        </div>
        
        <div class="supplier-grid">
            ${suppliers.map(supplier => `
                <div class="supplier-card">
                    <div class="supplier-name">${supplier.business_name}</div>
                    <div><strong>Address:</strong> ${supplier.address}</div>
                    ${supplier.phone ? `<div><strong>Phone:</strong> ${supplier.phone}</div>` : ''}
                    ${supplier.website ? `<div><strong>Website:</strong> <a href="${supplier.website}" target="_blank">Visit Website</a></div>` : ''}
                </div>
            `).join('')}
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
    <meta name="description" content="Discover 8,500+ raw dog food suppliers across the UK. Find BARF diet providers, raw pet food stores, and quality suppliers near you. Expert-curated directory.">
    <meta name="keywords" content="raw dog food, BARF diet, raw pet food, dog food suppliers, natural dog food, raw feeding, pet nutrition">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Find Raw Dog Food - UK's Largest Raw Dog Food Directory">
    <meta property="og:description" content="Discover 8,500+ raw dog food suppliers across the UK. Expert-curated directory with 13 years of raw feeding experience.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${origin}">
    <meta property="og:image" content="${origin}/images/golden-retriever-raw-food.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Find Raw Dog Food - UK's Largest Directory">
    <meta name="twitter:description" content="8,500+ raw dog food suppliers. Expert-curated directory.">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Find Raw Dog Food",
      "description": "UK's largest directory of raw dog food suppliers",
      "url": "${origin}",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "${origin}?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "author": {
        "@type": "Organization",
        "name": "Find Raw Dog Food",
        "description": "Expert raw dog food directory with 13 years of raw feeding experience"
      }
    }
    </script>
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MW66CRSLYX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MW66CRSLYX');
    </script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            color: #333; 
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px 20px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            color: #2c3e50;
            font-size: 3em;
            margin-bottom: 15px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .header p {
            color: #7f8c8d;
            font-size: 1.3em;
            max-width: 600px;
            margin: 0 auto 20px;
            line-height: 1.6;
        }
        
        .trust-indicator {
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            margin-top: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        
        .search-container {
            background: white;
            margin: 30px auto;
            max-width: 700px;
            border-radius: 50px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .search-box {
            display: flex;
            align-items: center;
            padding: 5px;
        }
        
        #searchInput {
            flex: 1;
            border: none;
            padding: 20px 25px;
            font-size: 18px;
            outline: none;
            background: transparent;
        }
        
        #searchBtn {
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            padding: 18px 30px;
            border-radius: 45px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-right: 5px;
        }
        
        #searchBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
        }
        
        .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .results-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-height: 600px;
            overflow-y: auto;
        }
        
        .supplier-card {
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            margin: 20px 0;
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #e74c3c;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .supplier-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }
        
        .supplier-name {
            font-size: 1.4em;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 12px;
        }
        
        .supplier-details {
            color: #555;
            line-height: 1.6;
        }
        
        .supplier-details strong {
            color: #e74c3c;
        }
        
        .pagination {
            text-align: center;
            margin: 30px 0;
        }
        
        .pagination button {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 25px;
            margin: 0 10px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .pagination button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }
        
        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .blog-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            margin: 40px 0;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        
        .blog-title {
            color: #2c3e50;
            font-size: 2.2em;
            margin-bottom: 20px;
            font-weight: 700;
        }
        
        .blog-content {
            color: #555;
            line-height: 1.8;
            font-size: 1.1em;
        }
        
        .blog-content h3 {
            color: #e74c3c;
            margin: 25px 0 15px;
            font-size: 1.3em;
        }
        
        .blog-content ul {
            margin: 15px 0 15px 30px;
        }
        
        .blog-content li {
            margin: 8px 0;
        }
        
        .expert-badge {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
            font-size: 1.2em;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2.2em; }
            .search-container { margin: 20px 15px; }
            .main-content { padding: 20px 15px; }
            .results-container, .blog-section { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 Find Raw Dog Food</h1>
        <p>The UK's most comprehensive directory of raw dog food suppliers</p>
        <div class="trust-indicator">✓ 8,500+ Verified Suppliers | 13 Years Raw Feeding Experience</div>
    </div>

    <div class="main-content">
        <div class="search-container">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search by business name, city, or area..." />
                <button id="searchBtn">🔍 Search</button>
            </div>
        </div>

        <div id="results" class="results-container" style="display: none;">
            <div id="resultsContent"></div>
            <div class="pagination">
                <button id="prevBtn" onclick="changePage(-1)">← Previous</button>
                <span id="pageInfo"></span>
                <button id="nextBtn" onclick="changePage(1)">Next →</button>
            </div>
        </div>

        <div class="blog-section">
            <h2 class="blog-title">The Raw Truth: Why Dogs Thrive on a BARF Diet</h2>
            <div class="expert-badge">🏆 Written by raw feeding expert with 13 years experience</div>
            <div class="blog-content">
                <p>After 13 years of raw feeding and helping thousands of dog owners transition to natural diets, I've witnessed remarkable transformations. The BARF (Biologically Appropriate Raw Food) diet isn't just a trend—it's a return to what dogs evolved to eat.</p>

                <h3>🌟 The Science Behind Raw Feeding</h3>
                <p>Dogs' digestive systems remain virtually unchanged from their wolf ancestors. Their short digestive tract and highly acidic stomach (pH 1-2) are specifically designed to process raw meat, bones, and organs efficiently. This biological fact forms the foundation of successful raw feeding.</p>

                <h3>💪 Health Benefits I've Observed</h3>
                <ul>
                    <li><strong>Improved Dental Health:</strong> Raw bones naturally clean teeth, eliminating the need for dental procedures in most cases</li>
                    <li><strong>Enhanced Coat Condition:</strong> Natural oils and nutrients create lustrous, healthy coats</li>
                    <li><strong>Better Digestion:</strong> Smaller, firmer stools with reduced odor</li>
                    <li><strong>Increased Energy:</strong> More sustained energy levels without the crashes associated with high-carb kibble</li>
                    <li><strong>Weight Management:</strong> Natural portion control and metabolism regulation</li>
                    <li><strong>Reduced Allergies:</strong> Elimination of processed additives often resolves food sensitivities</li>
                </ul>

                <h3>🥩 What Makes Quality Raw Dog Food</h3>
                <p>Not all raw food is created equal. Here's what to look for in suppliers:</p>
                <ul>
                    <li><strong>Human-grade ingredients:</strong> Meat suitable for human consumption ensures quality</li>
                    <li><strong>Proper ratio:</strong> 80% meat, 10% bone, 10% organs (5% liver, 5% other organs)</li>
                    <li><strong>Variety:</strong> Rotation of different protein sources provides complete nutrition</li>
                    <li><strong>Safe handling:</strong> Proper freezing and packaging to maintain freshness</li>
                    <li><strong>Transparency:</strong> Clear sourcing information and ingredient lists</li>
                </ul>

                <h3>🔍 How to Choose the Right Supplier</h3>
                <p>Our directory features vetted suppliers across the UK, but here are key questions to ask:</p>
                <ul>
                    <li>Do they provide nutritional analysis of their products?</li>
                    <li>Can they trace the source of their ingredients?</li>
                    <li>Do they offer transition guidance for new raw feeders?</li>
                    <li>Are their facilities regularly inspected?</li>
                    <li>Do they have knowledgeable staff who understand raw feeding?</li>
                </ul>

                <h3>📈 The Raw Feeding Revolution</h3>
                <p>Raw feeding has evolved from a niche practice to a mainstream movement. With over 35% of UK dog owners now incorporating some raw food into their pets' diets, the demand for quality suppliers has never been higher. This directory represents the most comprehensive collection of raw dog food suppliers in the UK, curated through years of industry experience and community recommendations.</p>

                <p><strong>Ready to find the perfect raw food supplier for your dog?</strong> Use our search above to discover quality providers in your area. Every supplier in our database has been researched and verified to ensure you're getting the best options for your furry family member.</p>
            </div>
        </div>
    </div>

    <script>
        let currentPage = 1;
        let currentQuery = '';
        let hasMore = false;

        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });

        document.getElementById('searchBtn').addEventListener('click', search);

        function search() {
            const query = document.getElementById('searchInput').value;
            currentQuery = query;
            currentPage = 1;
            performSearch();
        }

        function changePage(direction) {
            currentPage += direction;
            performSearch();
        }

        async function performSearch() {
            const resultsDiv = document.getElementById('results');
            const resultsContent = document.getElementById('resultsContent');
            
            resultsContent.innerHTML = '<div class="loading">🔍 Searching our database of 8,500+ suppliers...</div>';
            resultsDiv.style.display = 'block';

            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(currentQuery)}&page=\${currentPage}\`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    resultsContent.innerHTML = data.results.map(supplier => \`
                        <div class="supplier-card">
                            <div class="supplier-name">\${supplier.business_name}</div>
                            <div class="supplier-details">
                                <div><strong>📍 Address:</strong> \${supplier.address}</div>
                                \${supplier.phone ? \`<div><strong>📞 Phone:</strong> \${supplier.phone}</div>\` : ''}
                                \${supplier.website ? \`<div><strong>🌐 Website:</strong> <a href="\${supplier.website}" target="_blank" style="color: #e74c3c; text-decoration: none;">\${supplier.website}</a></div>\` : ''}
                            </div>
                        </div>
                    \`).join('');

                    hasMore = data.hasMore;
                    updatePagination();
                } else {
                    resultsContent.innerHTML = \`
                        <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                            <h3>No suppliers found</h3>
                            <p>Try searching for a different city, business name, or area.</p>
                            <p>Our database includes suppliers across England, Scotland, Wales, and Northern Ireland.</p>
                        </div>
                    \`;
                }
            } catch (error) {
                resultsContent.innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: #e74c3c;">
                        <h3>Search Error</h3>
                        <p>Unable to search at the moment. Please try again.</p>
                    </div>
                \`;
            }
        }

        function updatePagination() {
            document.getElementById('prevBtn').disabled = currentPage === 1;
            document.getElementById('nextBtn').disabled = !hasMore;
            document.getElementById('pageInfo').textContent = \`Page \${currentPage}\`;
        }

        // Load initial random sample
        window.addEventListener('load', () => {
            currentQuery = '';
            performSearch();
        });
    </script>
</body>
</html>`;
}