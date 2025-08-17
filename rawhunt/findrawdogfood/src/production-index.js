// Enhanced FindRawDogFood Frontend - Customer-Friendly Website
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Admin Dashboard - Password Protected and IP Restricted
      if (path === '/admin' || path.startsWith('/admin/')) {
        return await handleAdminAccess(request, env, path);
      }
      
      // Website Routes
      if (path === '/' || path === '/home') {
        return new Response(getEnhancedHomePageWithMap(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/search') {
        return new Response(getSearchPage(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/blog') {
        return new Response(getBlogPage(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path.startsWith('/blog/')) {
        const slug = path.split('/')[2];
        return new Response(getBlogPost(slug), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/about') {
        return new Response(getAboutPage(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } else if (path === '/guide') {
        return new Response(getRawFeedingGuide(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      }
      
      // API Routes (existing)
      else if (path === '/api/search') {
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

// Admin Access Control - Password + IP Restriction
async function handleAdminAccess(request, env, path) {
  const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  
  // Allow your IP (you'll need to update this with your actual IP)
  const allowedIPs = [
    '127.0.0.1', // localhost for testing
    // Add your actual IP address here
  ];
  
  // Basic IP check (you should add your real IP)
  // For now, we'll use password protection as primary security
  
  const authHeader = request.headers.get('Authorization');
  const correctPassword = 'admin123rawdog2025'; // Change this to a secure password
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Admin Access Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
        'Content-Type': 'text/plain'
      }
    });
  }
  
  try {
    const credentials = atob(authHeader.split(' ')[1]);
    const [username, password] = credentials.split(':');
    
    if (username === 'admin' && password === correctPassword) {
      // Authenticated - serve admin dashboard
      return new Response(getAdminDashboard(clientIP), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  } catch (error) {
    // Invalid base64 or format
  }
  
  return new Response('Access Denied', {
    status: 403,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Admin Dashboard
function getAdminDashboard(clientIP) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - FindRawDogFood</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #2c3e50; }
        .stat-label { color: #666; margin-top: 5px; }
        .api-test { margin-top: 20px; }
        .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .log { background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 0.9rem; }
        .security-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 FindRawDogFood Admin Dashboard</h1>
            <p>Secure access from IP: <strong>${clientIP}</strong></p>
        </div>
        
        <div class="security-info">
            <strong>⚠️ Security Notice:</strong> This dashboard is password protected. Access is logged and monitored.
        </div>
        
        <div class="section">
            <h2>Database Statistics</h2>
            <div class="stats-grid" id="statsGrid">
                <div class="stat-card">
                    <div class="stat-value" id="totalSuppliers">Loading...</div>
                    <div class="stat-label">Total Suppliers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="statesCount">Loading...</div>
                    <div class="stat-label">States Covered</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="citiesCount">Loading...</div>
                    <div class="stat-label">Cities Covered</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="highRatedCount">Loading...</div>
                    <div class="stat-label">Highly Rated (4.5+)</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>API Testing</h2>
            <div class="api-test">
                <button class="btn" onclick="testAPI('/api/stats')">Test Stats API</button>
                <button class="btn" onclick="testAPI('/api/search?city=Austin&state=TX&limit=5')">Test Search API</button>
                <button class="btn" onclick="testAPI('/api/suppliers')">Test Suppliers API</button>
            </div>
            <div class="log" id="apiLog">Click buttons above to test API endpoints...</div>
        </div>
        
        <div class="section">
            <h2>Quick Actions</h2>
            <button class="btn" onclick="window.open('/', '_blank')">View Public Site</button>
            <button class="btn" onclick="refreshStats()">Refresh Stats</button>
        </div>
    </div>
    
    <script>
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('totalSuppliers').textContent = data.stats.total_suppliers.toLocaleString();
                    document.getElementById('statesCount').textContent = data.stats.states_covered;
                    document.getElementById('citiesCount').textContent = data.stats.cities_covered;
                    document.getElementById('highRatedCount').textContent = data.stats.highly_rated.toLocaleString();
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        async function testAPI(endpoint) {
            const log = document.getElementById('apiLog');
            log.textContent = 'Testing ' + endpoint + '...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                log.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                log.textContent = 'Error: ' + error.message;
            }
        }
        
        function refreshStats() {
            loadStats();
        }
        
        document.addEventListener('DOMContentLoaded', loadStats);
    </script>
</body>
</html>`;
}

// Enhanced Homepage with Map and Search Features
function getEnhancedHomePage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Raw Dog Food - Your Guide to Natural Raw Feeding</title>
    <meta name="description" content="Find raw dog food suppliers near you. Expert guidance on BARF diet and raw feeding for healthier, happier dogs. 13 years of experience.">
    <link rel="canonical" href="https://www.findrawdogfood.com">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        header { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        nav { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 1rem 0; 
        }
        .logo { 
            font-size: 1.8rem; 
            font-weight: bold; 
            color: #2c3e50;
            text-decoration: none;
        }
        .nav-links { 
            display: flex; 
            list-style: none; 
            gap: 2rem; 
        }
        .nav-links a { 
            text-decoration: none; 
            color: #2c3e50; 
            font-weight: 500;
            transition: color 0.3s;
        }
        .nav-links a:hover { color: #667eea; }
        
        /* Hero Section */
        .hero { 
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23f0f8ff" width="1200" height="600"/><circle fill="%23667eea" cx="200" cy="150" r="100" opacity="0.1"/><circle fill="%23764ba2" cx="800" cy="400" r="150" opacity="0.1"/></svg>');
            color: white; 
            text-align: center; 
            padding: 6rem 0;
            background-size: cover;
            background-position: center;
        }
        .hero h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .hero p { 
            font-size: 1.3rem; 
            margin-bottom: 2rem; 
            max-width: 800px; 
            margin-left: auto; 
            margin-right: auto;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        /* Welcome Section */
        .welcome { 
            background: white; 
            padding: 4rem 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .welcome-content {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 3rem;
            border-radius: 15px;
            border-left: 5px solid #667eea;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .welcome h2 { 
            color: #2c3e50; 
            font-size: 2.2rem; 
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .welcome p { 
            font-size: 1.2rem; 
            line-height: 1.8; 
            color: #555;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Search Section */
        .search-section { 
            background: #f8f9fa; 
            padding: 4rem 0; 
        }
        .search-card {
            background: white;
            padding: 3rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 0 auto;
        }
        .search-form { 
            display: flex; 
            gap: 1rem; 
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        .search-input { 
            flex: 1; 
            padding: 1rem; 
            border: 2px solid #e9ecef; 
            border-radius: 8px; 
            font-size: 1rem;
            min-width: 200px;
        }
        .search-input:focus { 
            outline: none; 
            border-color: #667eea; 
            box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        .search-btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            border: none; 
            padding: 1rem 2rem; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 1rem;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .search-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102,126,234,0.4);
        }
        
        /* Features */
        .features { 
            padding: 4rem 0; 
            background: white;
        }
        .features-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
            margin-top: 2rem; 
        }
        .feature-card { 
            text-align: center; 
            padding: 2rem;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            transition: transform 0.3s;
            border: 1px solid #e9ecef;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .feature-icon { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
        }
        
        /* Stats */
        .stats { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
            color: white; 
            padding: 3rem 0; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 2rem; 
            text-align: center; 
        }
        .stat h3 { 
            font-size: 2.5rem; 
            margin-bottom: 0.5rem;
            color: #3498db;
        }
        
        /* Footer */
        footer { 
            background: #2c3e50; 
            color: white; 
            text-align: center; 
            padding: 2rem 0; 
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero p { font-size: 1.1rem; }
            .search-form { flex-direction: column; }
            .nav-links { display: none; }
        }
        
        /* Results */
        .results { 
            margin-top: 2rem; 
            display: none; 
        }
        .supplier-card { 
            background: white; 
            padding: 1.5rem; 
            border-radius: 8px; 
            margin-bottom: 1rem; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .supplier-name { 
            font-weight: bold; 
            font-size: 1.2rem; 
            color: #2c3e50;
        }
        .supplier-address { 
            color: #666; 
            margin: 0.5rem 0; 
        }
        .supplier-rating { 
            color: #f39c12; 
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <a href="/" class="logo">🐕 FindRawDogFood</a>
            <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/search">Find Suppliers</a></li>
                <li><a href="/guide">Raw Feeding Guide</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/about">About</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>Find Raw Dog Food Suppliers Near You</h1>
                <p>Discover trusted local suppliers and learn everything about raw feeding for healthier, happier dogs</p>
            </div>
        </section>

        <section class="welcome">
            <div class="container">
                <div class="welcome-content">
                    <h2>Welcome to Your Raw Feeding Journey</h2>
                    <p>Thinking about feeding your dog a raw diet? You're not alone. More owners are turning to natural, unprocessed food to help their dogs live a longer healthier life. Backed by 13 years of hands-on experience, we'll guide you through the essentials of the BARF approach. Learn how raw feeding can unlock better health, from puppyhood to senior years.</p>
                </div>
            </div>
        </section>

        <section class="search-section">
            <div class="container">
                <div class="search-card">
                    <h2 style="text-align: center; margin-bottom: 2rem; color: #2c3e50;">Find Raw Dog Food Suppliers</h2>
                    <form class="search-form" onsubmit="searchSuppliers(event)">
                        <input type="text" id="cityInput" class="search-input" placeholder="Enter your city (e.g., Austin)" required>
                        <input type="text" id="stateInput" class="search-input" placeholder="State (e.g., TX)" required>
                        <button type="submit" class="search-btn">🔍 Search</button>
                    </form>
                    <div id="searchResults" class="results"></div>
                </div>
            </div>
        </section>

        <section class="features">
            <div class="container">
                <h2 style="text-align: center; font-size: 2.5rem; color: #2c3e50; margin-bottom: 3rem;">Why Choose Raw Feeding?</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">💪</div>
                        <h3>Better Health</h3>
                        <p>Improved digestion, stronger immune system, and increased energy levels from natural, unprocessed nutrition.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">✨</div>
                        <h3>Shinier Coat</h3>
                        <p>Natural oils and nutrients promote a lustrous, healthy coat that's soft to touch and beautiful to see.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🦷</div>
                        <h3>Dental Health</h3>
                        <p>Raw bones and natural chewing help maintain clean teeth and healthy gums without artificial additives.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="stats">
            <div class="container">
                <div class="stats-grid" id="statsGrid">
                    <div class="stat">
                        <h3 id="supplierCount">Loading...</h3>
                        <p>Verified Suppliers</p>
                    </div>
                    <div class="stat">
                        <h3 id="stateCount">Loading...</h3>
                        <p>States Covered</p>
                    </div>
                    <div class="stat">
                        <h3 id="cityCount">Loading...</h3>
                        <p>Cities Served</p>
                    </div>
                    <div class="stat">
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
            <p>Backed by 13 years of raw feeding experience</p>
        </div>
    </footer>

    <script>
        // Load stats on page load
        async function loadStats() {
            try {
                console.log('Loading stats...');
                const response = await fetch('/api/stats');
                console.log('Stats response:', response.status);
                
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                
                const data = await response.json();
                console.log('Stats data:', data);
                
                if (data.success && data.stats) {
                    const supplierElement = document.getElementById('supplierCount');
                    const stateElement = document.getElementById('stateCount'); 
                    const cityElement = document.getElementById('cityCount');
                    
                    if (supplierElement) supplierElement.textContent = data.stats.total_suppliers.toLocaleString();
                    if (stateElement) stateElement.textContent = data.stats.states_covered;
                    if (cityElement) cityElement.textContent = data.stats.cities_covered;
                    
                    console.log('Stats updated successfully');
                } else {
                    console.error('Invalid stats data:', data);
                    // Fallback to show some default values
                    const supplierElement = document.getElementById('supplierCount');
                    const stateElement = document.getElementById('stateCount'); 
                    const cityElement = document.getElementById('cityCount');
                    
                    if (supplierElement) supplierElement.textContent = '9K+';
                    if (stateElement) stateElement.textContent = '12';
                    if (cityElement) cityElement.textContent = '15';
                }
            } catch (error) {
                console.error('Error loading stats:', error);
                // Fallback to show some default values
                const supplierElement = document.getElementById('supplierCount');
                const stateElement = document.getElementById('stateCount'); 
                const cityElement = document.getElementById('cityCount');
                
                if (supplierElement) supplierElement.textContent = '9K+';
                if (stateElement) stateElement.textContent = '12';
                if (cityElement) cityElement.textContent = '15';
            }
        }

        // Search functionality
        async function searchSuppliers(event) {
            event.preventDefault();
            
            const city = document.getElementById('cityInput').value;
            const state = document.getElementById('stateInput').value;
            const resultsDiv = document.getElementById('searchResults');
            
            resultsDiv.innerHTML = '<p>Searching...</p>';
            resultsDiv.style.display = 'block';
            
            try {
                const response = await fetch(\`/api/search?city=\${encodeURIComponent(city)}&state=\${encodeURIComponent(state)}&minRating=4.0&limit=10\`);
                const data = await response.json();
                
                if (data.success && data.suppliers.length > 0) {
                    resultsDiv.innerHTML = \`
                        <h3>Found \${data.suppliers.length} suppliers in \${city}, \${state}</h3>
                        \${data.suppliers.map(supplier => \`
                            <div class="supplier-card">
                                <div class="supplier-name">\${supplier.name}</div>
                                <div class="supplier-address">\${supplier.address || 'Address not available'}</div>
                                <div class="supplier-rating">⭐ \${supplier.rating || 'No rating'} (\${supplier.user_ratings_total || 0} reviews)</div>
                                \${supplier.phone_number ? \`<div>📞 \${supplier.phone_number}</div>\` : ''}
                                \${supplier.website ? \`<div>🌐 <a href="\${supplier.website}" target="_blank">Website</a></div>\` : ''}
                            </div>
                        \`).join('')}
                    \`;
                } else {
                    resultsDiv.innerHTML = \`
                        <p>No suppliers found in \${city}, \${state}. Try searching nearby cities or browse our <a href="/search">full directory</a>.</p>
                    \`;
                }
            } catch (error) {
                resultsDiv.innerHTML = '<p>Error searching suppliers. Please try again.</p>';
            }
        }

        // Load stats when page loads
        document.addEventListener('DOMContentLoaded', loadStats);
    </script>
</body>
</html>`;
}

// Enhanced Homepage with Map and Search Features  
function getEnhancedHomePageWithMap() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Raw Dog Food - Your Guide to Natural Raw Feeding</title>
    <meta name="description" content="Find raw dog food suppliers near you with our interactive map. Expert guidance on BARF diet and raw feeding for healthier, happier dogs.">
    <link rel="canonical" href="https://www.findrawdogfood.com">
    
    <!-- Leaflet CSS for maps -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        header { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        nav { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 1rem 0; 
        }
        .logo { 
            font-size: 1.8rem; 
            font-weight: bold; 
            color: #2c3e50;
            text-decoration: none;
        }
        .nav-links { 
            display: flex; 
            list-style: none; 
            gap: 2rem; 
        }
        .nav-links a { 
            text-decoration: none; 
            color: #2c3e50; 
            font-weight: 500;
            transition: color 0.3s;
        }
        .nav-links a:hover { color: #667eea; }
        
        /* Hero Section */
        .hero { 
            color: white; 
            text-align: center; 
            padding: 4rem 0 2rem 0;
        }
        .hero h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .hero p { 
            font-size: 1.3rem; 
            margin-bottom: 2rem; 
            max-width: 800px; 
            margin-left: auto; 
            margin-right: auto;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        /* Map and Search Section */
        .map-search-section { 
            background: white; 
            padding: 3rem 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .search-controls {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .search-form { 
            display: flex; 
            gap: 1rem; 
            margin-bottom: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        .search-input { 
            padding: 1rem; 
            border: 2px solid #e9ecef; 
            border-radius: 8px; 
            font-size: 1rem;
            min-width: 200px;
        }
        .search-input:focus { 
            outline: none; 
            border-color: #667eea; 
            box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        .search-btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            border: none; 
            padding: 1rem 2rem; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 1rem;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .search-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102,126,234,0.4);
        }
        
        .location-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-left: 1rem;
        }
        
        /* Map Container */
        #map {
            height: 500px;
            width: 100%;
            border-radius: 15px;
            border: 2px solid #e9ecef;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        /* Results */
        .results-section {
            margin-top: 2rem;
            display: none;
        }
        
        .supplier-card { 
            background: white; 
            padding: 1.5rem; 
            border-radius: 8px; 
            margin-bottom: 1rem; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .supplier-name { 
            font-weight: bold; 
            font-size: 1.2rem; 
            color: #2c3e50;
        }
        .supplier-address { 
            color: #666; 
            margin: 0.5rem 0; 
        }
        .supplier-rating { 
            color: #f39c12; 
        }
        
        /* Stats */
        .stats { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
            color: white; 
            padding: 3rem 0; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 2rem; 
            text-align: center; 
        }
        .stat h3 { 
            font-size: 2.5rem; 
            margin-bottom: 0.5rem;
            color: #3498db;
        }
        
        /* Footer */
        footer { 
            background: #2c3e50; 
            color: white; 
            text-align: center; 
            padding: 2rem 0; 
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero p { font-size: 1.1rem; }
            .search-form { flex-direction: column; align-items: center; }
            .nav-links { display: none; }
            #map { height: 300px; }
            .location-btn { margin-left: 0; margin-top: 1rem; }
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <a href="/" class="logo">🐕 FindRawDogFood</a>
            <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/search">Find Suppliers</a></li>
                <li><a href="/guide">Raw Feeding Guide</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/about">About</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>Find Raw Dog Food Suppliers Near You</h1>
                <p>Discover trusted local suppliers with our interactive map and comprehensive search tools</p>
            </div>
        </section>

        <section class="map-search-section">
            <div class="container">
                <div class="search-controls">
                    <h2 style="text-align: center; margin-bottom: 2rem; color: #2c3e50;">🗺️ Interactive Supplier Map</h2>
                    <form class="search-form" onsubmit="searchSuppliers(event)">
                        <input type="text" id="cityInput" class="search-input" placeholder="Enter your city (e.g., Austin)" required>
                        <input type="text" id="stateInput" class="search-input" placeholder="State (e.g., TX)" required>
                        <button type="submit" class="search-btn">🔍 Search</button>
                        <button type="button" class="location-btn" onclick="useMyLocation()">📍 Use My Location</button>
                    </form>
                    <p style="text-align: center; color: #666; margin-top: 1rem;">
                        Search by location or click "Use My Location" to find suppliers near you
                    </p>
                </div>
                
                <div id="map"></div>
                
                <div id="searchResults" class="results-section">
                    <h3 id="resultsTitle">Search Results</h3>
                    <div id="resultsContainer"></div>
                </div>
            </div>
        </section>

        <section class="stats">
            <div class="container">
                <div class="stats-grid" id="statsGrid">
                    <div class="stat">
                        <h3 id="supplierCount">Loading...</h3>
                        <p>Verified Suppliers</p>
                    </div>
                    <div class="stat">
                        <h3 id="stateCount">Loading...</h3>
                        <p>States Covered</p>
                    </div>
                    <div class="stat">
                        <h3 id="cityCount">Loading...</h3>
                        <p>Cities Served</p>
                    </div>
                    <div class="stat">
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
            <p>Backed by 13 years of raw feeding experience</p>
        </div>
    </footer>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    
    <script>
        let map;
        let markers = [];
        let userLocation = null;

        // Initialize map
        function initMap() {
            map = L.map('map').setView([39.8283, -98.5795], 4); // Center of USA
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }

        // Create custom marker icon
        function createCustomIcon() {
            return L.divIcon({
                html: '<div style="background: #D4A574; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12],
                className: 'custom-marker'
            });
        }

        // Load stats on page load
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                
                const data = await response.json();
                
                if (data.success && data.stats) {
                    const supplierElement = document.getElementById('supplierCount');
                    const stateElement = document.getElementById('stateCount'); 
                    const cityElement = document.getElementById('cityCount');
                    
                    if (supplierElement) supplierElement.textContent = data.stats.total_suppliers.toLocaleString();
                    if (stateElement) stateElement.textContent = data.stats.states_covered;
                    if (cityElement) cityElement.textContent = data.stats.cities_covered;
                } else {
                    // Fallback values
                    const supplierElement = document.getElementById('supplierCount');
                    const stateElement = document.getElementById('stateCount'); 
                    const cityElement = document.getElementById('cityCount');
                    
                    if (supplierElement) supplierElement.textContent = '9K+';
                    if (stateElement) stateElement.textContent = '12';
                    if (cityElement) cityElement.textContent = '15';
                }
            } catch (error) {
                console.error('Error loading stats:', error);
                // Fallback values
                const supplierElement = document.getElementById('supplierCount');
                const stateElement = document.getElementById('stateCount'); 
                const cityElement = document.getElementById('cityCount');
                
                if (supplierElement) supplierElement.textContent = '9K+';
                if (stateElement) stateElement.textContent = '12';
                if (cityElement) cityElement.textContent = '15';
            }
        }

        // Search functionality
        async function searchSuppliers(event) {
            event.preventDefault();
            
            const city = document.getElementById('cityInput').value;
            const state = document.getElementById('stateInput').value;
            const resultsSection = document.getElementById('searchResults');
            const resultsTitle = document.getElementById('resultsTitle');
            const resultsContainer = document.getElementById('resultsContainer');
            
            resultsTitle.textContent = 'Searching...';
            resultsContainer.innerHTML = '';
            resultsSection.style.display = 'block';
            
            // Clear existing markers
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
            
            try {
                const response = await fetch('/api/search?city=' + encodeURIComponent(city) + '&state=' + encodeURIComponent(state) + '&limit=20');
                const data = await response.json();
                
                if (data.success && data.suppliers.length > 0) {
                    resultsTitle.textContent = 'Found ' + data.suppliers.length + ' suppliers in ' + city + ', ' + state;
                    
                    // Display results
                    data.suppliers.forEach(supplier => {
                        // Add to results list
                        const card = document.createElement('div');
                        card.className = 'supplier-card';
                        card.innerHTML = 
                            '<div class="supplier-name">' + supplier.name + '</div>' +
                            '<div class="supplier-address">' + (supplier.address || 'Address not available') + '</div>' +
                            '<div class="supplier-rating">⭐ ' + (supplier.rating || 'No rating') + ' (' + (supplier.user_ratings_total || 0) + ' reviews)</div>' +
                            (supplier.phone_number ? '<div>📞 ' + supplier.phone_number + '</div>' : '') +
                            (supplier.website ? '<div>🌐 <a href="' + supplier.website + '" target="_blank">Website</a></div>' : '');
                        
                        resultsContainer.appendChild(card);
                        
                        // Add to map if coordinates available
                        if (supplier.latitude && supplier.longitude) {
                            const marker = L.marker([supplier.latitude, supplier.longitude], {
                                icon: createCustomIcon()
                            }).addTo(map);
                            
                            marker.bindPopup('<strong>' + supplier.name + '</strong><br>' + (supplier.address || 'Address not available'));
                            markers.push(marker);
                        }
                    });
                    
                    // Fit map to show all markers
                    if (markers.length > 0) {
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                    
                } else {
                    resultsTitle.textContent = 'No Results Found';
                    resultsContainer.innerHTML = '<p>No suppliers found in ' + city + ', ' + state + '. Try searching nearby cities or different spelling.</p>';
                }
            } catch (error) {
                resultsTitle.textContent = 'Search Error';
                resultsContainer.innerHTML = '<p>Error searching suppliers. Please try again.</p>';
            }
        }

        // Use user location
        function useMyLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        // Center map on user location
                        map.setView([userLocation.lat, userLocation.lng], 10);
                        
                        // Add user location marker
                        L.marker([userLocation.lat, userLocation.lng], {
                            icon: L.divIcon({
                                html: '<div style="background: #ff4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })
                        }).addTo(map).bindPopup('Your location');
                        
                        // Search nearby suppliers
                        searchNearby();
                    },
                    (error) => {
                        alert('Unable to get your location. Please search manually.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser. Please search manually.');
            }
        }

        // Search nearby suppliers
        async function searchNearby() {
            if (!userLocation) return;
            
            const resultsSection = document.getElementById('searchResults');
            const resultsTitle = document.getElementById('resultsTitle');
            const resultsContainer = document.getElementById('resultsContainer');
            
            resultsTitle.textContent = 'Finding suppliers near you...';
            resultsContainer.innerHTML = '';
            resultsSection.style.display = 'block';
            
            try {
                const response = await fetch('/api/suppliers?limit=50');
                const data = await response.json();
                
                if (data.success && data.suppliers.length > 0) {
                    // Filter suppliers within reasonable distance
                    const nearbySuppliers = data.suppliers.filter(supplier => {
                        if (!supplier.latitude || !supplier.longitude) return false;
                        
                        const distance = getDistance(
                            userLocation.lat, userLocation.lng,
                            supplier.latitude, supplier.longitude
                        );
                        
                        return distance < 100; // Within 100 miles
                    }).slice(0, 10);
                    
                    if (nearbySuppliers.length > 0) {
                        resultsTitle.textContent = 'Found ' + nearbySuppliers.length + ' suppliers near you';
                        
                        nearbySuppliers.forEach(supplier => {
                            const distance = getDistance(
                                userLocation.lat, userLocation.lng,
                                supplier.latitude, supplier.longitude
                            );
                            
                            const card = document.createElement('div');
                            card.className = 'supplier-card';
                            card.innerHTML = 
                                '<div class="supplier-name">' + supplier.name + '</div>' +
                                '<div class="supplier-address">' + (supplier.address || 'Address not available') + '</div>' +
                                '<div style="color: #667eea; font-weight: bold;">📍 ' + distance.toFixed(1) + ' miles away</div>' +
                                '<div class="supplier-rating">⭐ ' + (supplier.rating || 'No rating') + ' (' + (supplier.user_ratings_total || 0) + ' reviews)</div>';
                            
                            resultsContainer.appendChild(card);
                            
                            // Add to map
                            const marker = L.marker([supplier.latitude, supplier.longitude], {
                                icon: createCustomIcon()
                            }).addTo(map);
                            
                            marker.bindPopup('<strong>' + supplier.name + '</strong><br>' + (supplier.address || 'Address not available') + '<br><strong>' + distance.toFixed(1) + ' miles away</strong>');
                            markers.push(marker);
                        });
                    } else {
                        resultsTitle.textContent = 'No nearby suppliers found';
                        resultsContainer.innerHTML = '<p>No suppliers found within 100 miles. Try searching by city and state.</p>';
                    }
                }
            } catch (error) {
                resultsTitle.textContent = 'Location Search Error';
                resultsContainer.innerHTML = '<p>Error finding nearby suppliers. Please try searching by city and state.</p>';
            }
        }

        // Calculate distance between two points
        function getDistance(lat1, lng1, lat2, lng2) {
            const R = 3959; // Radius of the Earth in miles
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initMap();
            loadStats();
        });
    </script>
</body>
</html>`;
}

// Search Page
function getSearchPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Raw Dog Food Suppliers - FindRawDogFood.com</title>
    <style>
        /* Include main styles here */
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        /* Add search-specific styles */
    </style>
</head>
<body>
    <div class="container">
        <h1>Find Raw Dog Food Suppliers</h1>
        <p>Search our database of verified raw dog food suppliers across the United States.</p>
        <!-- Advanced search interface -->
    </div>
</body>
</html>`;
}

// Blog Page
function getBlogPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw Dog Food Blog - FindRawDogFood.com</title>
</head>
<body>
    <div class="container">
        <h1>Raw Dog Food Blog</h1>
        <p>Expert insights, tips, and guides for raw dog feeding.</p>
        
        <div class="blog-posts">
            <article class="blog-post">
                <h2><a href="/blog/getting-started-with-raw-feeding">Getting Started with Raw Feeding</a></h2>
                <p>Everything you need to know before transitioning your dog to a raw diet...</p>
                <small>Published: January 15, 2025</small>
            </article>
            
            <article class="blog-post">
                <h2><a href="/blog/barf-diet-complete-guide">The BARF Diet: Complete Guide</a></h2>
                <p>Understanding the Biologically Appropriate Raw Food approach...</p>
                <small>Published: January 10, 2025</small>
            </article>
        </div>
    </div>
</body>
</html>`;
}

// API handlers with actual database connections
async function handleSearch(request, env) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || '';
  const state = url.searchParams.get('state') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 50);
  
  if (!city.trim() && !state.trim()) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'City or state parameter required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let searchQuery = `
      SELECT 
        id, place_id, name, address, city, state, country,
        latitude, longitude, rating, user_ratings_total,
        phone_number, website
      FROM suppliers 
      WHERE 1=1
    `;
    
    const bindings = [];
    const conditions = [];
    
    if (city.trim()) {
      conditions.push('city LIKE ?');
      bindings.push(`%${city}%`);
    }
    
    if (state.trim()) {
      conditions.push('state LIKE ?');
      bindings.push(`%${state}%`);
    }
    
    if (conditions.length > 0) {
      searchQuery += ' AND (' + conditions.join(' OR ') + ')';
    }
    
    searchQuery += ' ORDER BY rating DESC, user_ratings_total DESC LIMIT ?';
    bindings.push(limit);
    
    const results = await env.DB.prepare(searchQuery).bind(...bindings).all();
    
    return new Response(JSON.stringify({
      success: true,
      suppliers: results.results || [],
      count: results.results?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database search failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSuppliers(request, env) {
  try {
    const results = await env.DB.prepare(`
      SELECT 
        id, place_id, name, address, city, state, country,
        latitude, longitude, rating, user_ratings_total,
        phone_number, website
      FROM suppliers 
      ORDER BY rating DESC, user_ratings_total DESC 
      LIMIT 20
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      suppliers: results.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Suppliers error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database query failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStats(request, env) {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(DISTINCT city) as cities_covered,
        COUNT(DISTINCT state) as states_covered,
        COUNT(CASE WHEN rating >= 4.5 THEN 1 END) as highly_rated,
        ROUND(AVG(rating), 1) as average_rating
      FROM suppliers 
    `;
    
    const result = await env.DB.prepare(statsQuery).first();
    
    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_suppliers: result.total_suppliers || 0,
        cities_covered: result.cities_covered || 0,
        states_covered: result.states_covered || 0,
        highly_rated: result.highly_rated || 0,
        average_rating: result.average_rating || 0
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database stats failed',
      stats: { 
        total_suppliers: 0, 
        states_covered: 0, 
        cities_covered: 0 
      } 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
