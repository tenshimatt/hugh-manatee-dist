// Updated FindRawDogFood with improved layout and search
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      if (path === '/' || path === '/home') {
        return new Response(getHomePage(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/blog/the-raw-truth-why-dogs-thrive-on-barf-diet') {
        return new Response(getBlogPost(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/blog') {
        return new Response(getBlogPage(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/api/search') {
        return await handleSearch(request, env);
      } else if (path === '/api/suppliers') {
        return await handleSuppliers(request, env);
      } else if (path === '/api/stats') {
        return await handleStats(request, env);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

function getHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Raw Dog Food - Your Guide to Natural Raw Feeding</title>
    <meta name="description" content="Find raw dog food suppliers near you. Expert guidance on BARF diet and raw feeding for healthier, happier dogs.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #fafafa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        header { background: white; border-bottom: 1px solid #e5e5e5; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; height: 70px; }
        .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #333; font-weight: 600; font-size: 1.4rem; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #8B7355 0%, #A0916B 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; }
        .nav-links { display: flex; list-style: none; gap: 2rem; margin: 0; padding: 0; }
        .nav-links a { text-decoration: none; color: #666; font-weight: 500; transition: color 0.3s; padding: 0.5rem 0; }
        .nav-links a:hover { color: #8B7355; }
        
        /* Compact Hero Section */
        .hero { background: white; padding: 2rem 0; border-bottom: 1px solid #e5e5e5; }
        .hero .container { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        .hero-content h1 { font-size: 2rem; font-weight: 700; color: #333; margin-bottom: 1.5rem; line-height: 1.2; }
        
        /* Search and Learn More Layout */
        .hero-actions { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-top: 1rem; }
        .search-widget { flex: 1; background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border: 1px solid #e5e5e5; }
        .learn-more-section { display: flex; align-items: center; }
        .cta-button { background: #8B7355; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.3s; white-space: nowrap; }
        .cta-button:hover { background: #7A6348; }
        
        .search-input-group { display: flex; }
        .search-input { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 6px 0 0 6px; font-size: 1rem; outline: none; }
        .search-input:focus { border-color: #8B7355; box-shadow: 0 0 0 2px rgba(139,115,85,0.1); }
        .search-btn { background: #8B7355; color: white; border: none; padding: 12px 20px; border-radius: 0 6px 6px 0; cursor: pointer; font-size: 1rem; }
        .search-btn:hover { background: #7A6348; }
        
        .map-container { background: #f0f0f0; border-radius: 12px; height: 400px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e5e5; }
        .map-placeholder { text-align: center; color: #666; }
        
        /* Scrollable Search Results - Same Height as Map */
        .search-results { 
            margin-top: 1rem; 
            background: white; 
            border-radius: 8px; 
            border: 1px solid #e5e5e5; 
            display: none;
            height: 400px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .search-results h3 { 
            padding: 1rem; 
            background: #f8f9fa; 
            margin: 0; 
            border-bottom: 1px solid #e5e5e5;
            flex-shrink: 0;
        }
        .suppliers-list { 
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #8B7355 #f0f0f0;
        }
        .suppliers-list::-webkit-scrollbar { width: 8px; }
        .suppliers-list::-webkit-scrollbar-track { background: #f0f0f0; }
        .suppliers-list::-webkit-scrollbar-thumb { background: #8B7355; border-radius: 4px; }
        .suppliers-list::-webkit-scrollbar-thumb:hover { background: #7A6348; }
        
        .supplier-card { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
        .supplier-card:last-child { border-bottom: none; }
        .supplier-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
        .supplier-header h4 { color: #333; font-size: 1rem; margin: 0; }
        .supplier-rating { color: #8B7355; font-size: 0.9rem; white-space: nowrap; }
        .supplier-details p { margin: 0.25rem 0; font-size: 0.9rem; color: #666; }
        .supplier-website a { color: #8B7355; text-decoration: none; }
        .view-all { 
            padding: 1rem; 
            text-align: center; 
            background: #f8f9fa; 
            border-top: 1px solid #e5e5e5;
            flex-shrink: 0;
        }
        .view-all-btn { color: #8B7355; text-decoration: none; font-weight: 500; }
        
        .stats-section { background: #f8f9fa; padding: 3rem 0; border-top: 1px solid #e5e5e5; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; }
        .stat-card { text-align: center; padding: 1.5rem; background: white; border-radius: 8px; border: 1px solid #e5e5e5; }
        .stat-card h3 { font-size: 2.5rem; color: #8B7355; margin-bottom: 0.5rem; }
        .stat-card p { color: #666; font-weight: 500; }
        
        footer { background: #333; color: white; padding: 2rem 0; text-align: center; }
        
        @media (max-width: 768px) {
            .hero .container { grid-template-columns: 1fr; gap: 2rem; }
            .hero-content h1 { font-size: 1.8rem; }
            .hero-actions { flex-direction: column; gap: 1rem; }
            .nav-links { gap: 1rem; }
        }
        
        .loading { text-align: center; padding: 2rem; color: #666; }
        .no-results { text-align: center; padding: 2rem; color: #666; }
        .error { text-align: center; padding: 2rem; color: #d32f2f; background: #ffebee; border-radius: 4px; margin: 1rem; }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <a href="/" class="logo">
                <div class="logo-icon">🐕</div>
                FindRawDogFood
            </a>
            <ul class="nav-links">
                <li><a href="/blog/the-raw-truth-why-dogs-thrive-on-barf-diet">Raw Feeding Guide</a></li>
                <li><a href="/blog">Blog</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <div class="container">
                <div class="hero-content">
                    <h1>Welcome to Your Raw Feeding Journey</h1>
                    <p>Thinking about feeding your dog a raw diet? You're not alone. More owners are turning to natural, unprocessed food to help their dogs live a longer healthier life. Backed by 13 years of hands-on experience, we'll guide you through the essentials of the BARF approach. Learn how raw feeding can unlock better health, from puppyhood to senior years.</p>
                    
                    <div class="hero-actions">
                        <div class="search-widget">
                            <form onsubmit="searchSuppliers(event)">
                                <div class="search-input-group">
                                    <input type="text" id="locationInput" placeholder="Search for anything (business name, city, area...)" class="search-input">
                                    <button type="submit" class="search-btn">🔍</button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="learn-more-section">
                            <a href="/blog/the-raw-truth-why-dogs-thrive-on-barf-diet" class="cta-button">Learn More</a>
                        </div>
                    </div>
                    
                    <div id="searchResults" class="search-results"></div>
                </div>
                
                <div class="map-container">
                    <div class="map-placeholder">
                        <p>📍 Interactive map coming soon</p>
                        <p>Currently showing <span id="supplierCount">8,500+</span> verified suppliers</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="stats-section">
            <div class="container">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3 id="totalSuppliers">8,500+</h3>
                        <p>Verified Suppliers</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="statesCovered">50</h3>
                        <p>States Covered</p>
                    </div>
                    <div class="stat-card">
                        <h3 id="citiesCovered">500+</h3>
                        <p>Cities Served</p>
                    </div>
                    <div class="stat-card">
                        <h3>13+</h3>
                        <p>Years Experience</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2025 FindRawDogFood.com - Your trusted guide to raw dog feeding</p>
        </div>
    </footer>

    <script>
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('supplierCount').textContent = data.stats.total_suppliers.toLocaleString() + '+';
                    document.getElementById('totalSuppliers').textContent = data.stats.total_suppliers.toLocaleString() + '+';
                    document.getElementById('statesCovered').textContent = data.stats.states_covered;
                    document.getElementById('citiesCovered').textContent = data.stats.cities_covered + '+';
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function searchSuppliers(event) {
            event.preventDefault();
            const searchTerm = document.getElementById('locationInput').value;
            const resultsDiv = document.getElementById('searchResults');
            
            if (!searchTerm.trim()) return;
            
            resultsDiv.innerHTML = '<div class="loading">Searching suppliers...</div>';
            resultsDiv.style.display = 'flex';
            
            try {
                // Universal search - works for city, business name, or any term
                let searchUrl = '/api/search?limit=20&minRating=3.0&q=' + encodeURIComponent(searchTerm);
                
                const response = await fetch(searchUrl);
                const data = await response.json();
                
                if (data.success && data.suppliers.length > 0) {
                    renderSearchResults(data.suppliers, searchTerm);
                } else {
                    resultsDiv.innerHTML = '<div class="no-results"><h3>No suppliers found for "' + searchTerm + '"</h3><p>Try searching for a different term, city, or business name.</p></div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error searching suppliers. Please try again.</div>';
            }
        }

        function renderSearchResults(suppliers, searchTerm) {
            const resultsDiv = document.getElementById('searchResults');
            
            resultsDiv.innerHTML = 
                '<h3>Found ' + suppliers.length + ' suppliers for "' + searchTerm + '"</h3>' +
                '<div class="suppliers-list">' +
                    suppliers.map(supplier => 
                        '<div class="supplier-card">' +
                            '<div class="supplier-header">' +
                                '<h4>' + supplier.name + '</h4>' +
                                '<div class="supplier-rating">' + 
                                    (supplier.rating ? '⭐ ' + supplier.rating : '') + 
                                    (supplier.user_ratings_total ? ' (' + supplier.user_ratings_total + ')' : '') + 
                                '</div>' +
                            '</div>' +
                            '<div class="supplier-details">' +
                                '<p class="supplier-address">' + (supplier.address || (supplier.city + ', ' + supplier.state)) + '</p>' +
                                (supplier.phone_number ? '<p class="supplier-phone">📞 ' + supplier.phone_number + '</p>' : '') +
                                (supplier.website ? '<p class="supplier-website"><a href="' + supplier.website + '" target="_blank">🌐 Visit Website</a></p>' : '') +
                            '</div>' +
                        '</div>'
                    ).join('') +
                '</div>' +
                '<div class="view-all">' +
                    '<a href="/suppliers" class="view-all-btn">View All Suppliers →</a>' +
                '</div>';
        }

        document.addEventListener('DOMContentLoaded', loadStats);
    </script>
</body>
</html>`;
}

function getBlogPage() {
  return `<!DOCTYPE html><html><head><title>Blog - FindRawDogFood</title></head><body><h1>Raw Dog Food Blog</h1><p>Expert insights coming soon...</p></body></html>`;
}

function getBlogPost() {
  return `<!DOCTYPE html><html><head><title>The Raw Truth - FindRawDogFood</title></head><body><h1>The Raw Truth: Why Dogs Thrive on a BARF Diet</h1><p>Your complete blog post here...</p></body></html>`;
}

async function handleSearch(request, env) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || '';
  const state = url.searchParams.get('state') || '';
  const query = url.searchParams.get('q') || '';  // Universal search parameter
  const minRating = parseFloat(url.searchParams.get('minRating')) || 0;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  
  let sql = `SELECT id, place_id, name, address, city, state, country, latitude, longitude, phone_number, website, rating, user_ratings_total, types FROM suppliers WHERE rating >= ?`;
  let params = [minRating];
  
  // Universal search - searches across name, city, state, address
  if (query) {
    sql += ` AND (LOWER(name) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))`;
    const searchPattern = `%${query}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  } else {
    // Legacy city/state search
    if (city) {
      sql += ` AND LOWER(city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }
    if (state) {
      sql += ` AND LOWER(state) LIKE LOWER(?)`;
      params.push(`%${state}%`);
    }
  }
  
  sql += ` ORDER BY rating DESC, user_ratings_total DESC LIMIT ?`;
  params.push(limit);
  
  try {
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify({
      success: true,
      count: results.length,
      suppliers: results.map(supplier => ({
        ...supplier,
        types: supplier.types ? JSON.parse(supplier.types) : []
      }))
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Search failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleSuppliers(request, env) {
  return new Response(JSON.stringify({ success: true, suppliers: [] }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleStats(request, env) {
  try {
    const queries = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as total FROM suppliers`).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT state) as states FROM suppliers WHERE state IS NOT NULL`).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT city) as cities FROM suppliers WHERE city IS NOT NULL`).first()
    ]);
    
    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_suppliers: queries[0].total,
        states_covered: queries[1].states,
        cities_covered: queries[2].cities,
        average_rating: 4.5
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({
      success: true,
      stats: { total_suppliers: 8500, states_covered: 50, cities_covered: 500, average_rating: 4.5 }
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}
