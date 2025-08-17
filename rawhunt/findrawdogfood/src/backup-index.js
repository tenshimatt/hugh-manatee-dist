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
      // Website Routes
      if (path === '/' || path === '/home') {
        return new Response(getHomePage(), {
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

// Enhanced Homepage with your content
function getHomePage() {
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
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('supplierCount').textContent = data.stats.total_suppliers.toLocaleString();
                    document.getElementById('stateCount').textContent = data.stats.states_covered;
                    document.getElementById('cityCount').textContent = data.stats.cities_covered;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
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

// Keep existing API handlers (handleSearch, handleSuppliers, handleStats)
async function handleSearch(request, env) {
  // Your existing search code
  return new Response(JSON.stringify({ success: true, suppliers: [] }));
}

async function handleSuppliers(request, env) {
  // Your existing suppliers code
  return new Response(JSON.stringify({ success: true, suppliers: [] }));
}

async function handleStats(request, env) {
  // Your existing stats code
  return new Response(JSON.stringify({ 
    success: true, 
    stats: { 
      total_suppliers: 8500, 
      states_covered: 50, 
      cities_covered: 500 
    } 
  }));
}
