// Enhanced FindRawDogFood Frontend with Blog Content
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
      } else if (path === '/blog/the-raw-truth-why-dogs-thrive-on-barf-diet') {
        return new Response(getBlogPostBarfDiet(), {
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

// Blog page with your article
function getBlogPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw Dog Food Blog - Expert Insights & Guides | FindRawDogFood.com</title>
    <meta name="description" content="Expert insights on raw dog feeding from 13 years of experience. BARF diet guides, tips, and real-world advice for healthier dogs.">
    ${getCommonStyles()}
</head>
<body>
    ${getHeader()}
    
    <main>
        <section class="blog-hero">
            <div class="container">
                <h1>Raw Dog Food Blog</h1>
                <p>Expert insights, tips, and guides from 13 years of raw feeding experience</p>
            </div>
        </section>

        <section class="blog-content">
            <div class="container">
                <div class="blog-grid">
                    <article class="featured-post">
                        <div class="post-image">
                            <div class="placeholder-image">🐕‍🦺</div>
                        </div>
                        <div class="post-content">
                            <span class="post-category">Featured</span>
                            <h2><a href="/blog/the-raw-truth-why-dogs-thrive-on-barf-diet">The Raw Truth: Why Dogs Thrive on a BARF Diet</a></h2>
                            <p class="post-excerpt">What Is the BARF Diet? BARF stands for Biologically Appropriate Raw Food — or Bones And Raw Food — and it's built on a simple idea: dogs are healthiest when they eat the way nature intended...</p>
                            <div class="post-meta">
                                <span class="author">By a raw-feeding expert with 13 years of real-world experience</span>
                                <span class="date">January 18, 2025</span>
                            </div>
                            <a href="/blog/the-raw-truth-why-dogs-thrive-on-barf-diet" class="read-more">Read Full Article →</a>
                        </div>
                    </article>

                    <div class="coming-soon">
                        <h3>More Expert Guides Coming Soon</h3>
                        <ul class="upcoming-posts">
                            <li>🥩 "Raw Feeding for Puppies: A Complete Starter Guide"</li>
                            <li>🦴 "Safe Bones vs. Dangerous Bones: What Every Owner Should Know"</li>
                            <li>🥕 "Vegetables in Raw Diets: What Works and What Doesn't"</li>
                            <li>💰 "Budget Raw Feeding: Quality Nutrition Without Breaking the Bank"</li>
                            <li>🏥 "Working with Your Vet: Addressing Raw Food Concerns"</li>
                        </ul>
                    </div>
                </div>

                <aside class="blog-sidebar">
                    <div class="about-author">
                        <h3>About the Author</h3>
                        <p>With over 13 years of hands-on experience in raw dog feeding, our expert has helped hundreds of dog owners transition to natural, biologically appropriate diets. From puppies to senior dogs, learn from real-world experience and proven results.</p>
                    </div>

                    <div class="newsletter-signup">
                        <h3>Stay Updated</h3>
                        <p>Get notified when new raw feeding guides are published.</p>
                        <form class="newsletter-form">
                            <input type="email" placeholder="Your email address" required>
                            <button type="submit">Subscribe</button>
                        </form>
                    </div>
                </aside>
            </div>
        </section>
    </main>

    ${getFooter()}

    <style>
        .blog-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 0;
            text-align: center;
        }
        .blog-hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .blog-hero p { font-size: 1.2rem; opacity: 0.9; }

        .blog-content { padding: 4rem 0; }
        .blog-grid { 
            display: grid; 
            grid-template-columns: 2fr 1fr; 
            gap: 3rem; 
            margin-bottom: 3rem;
        }

        .featured-post {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .featured-post:hover { transform: translateY(-5px); }

        .post-image {
            height: 200px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
        }

        .post-content { padding: 2rem; }
        .post-category {
            background: #667eea;
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .post-content h2 {
            margin: 1rem 0;
            font-size: 1.8rem;
        }
        .post-content h2 a {
            color: #2c3e50;
            text-decoration: none;
        }
        .post-content h2 a:hover { color: #667eea; }

        .post-excerpt {
            color: #666;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }

        .post-meta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            color: #888;
        }

        .read-more {
            color: #667eea;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.3s;
        }
        .read-more:hover { color: #764ba2; }

        .coming-soon {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 15px;
            border-left: 4px solid #667eea;
        }
        .upcoming-posts {
            list-style: none;
            padding: 0;
        }
        .upcoming-posts li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #eee;
            color: #666;
        }

        .blog-sidebar { display: flex; flex-direction: column; gap: 2rem; }
        .about-author, .newsletter-signup {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .newsletter-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        .newsletter-form input {
            padding: 0.8rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
        }
        .newsletter-form button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.8rem;
            border-radius: 8px;
            cursor: pointer;
        }

        @media (max-width: 768px) {
            .blog-grid { grid-template-columns: 1fr; }
        }
    </style>
</body>
</html>`;
}

// Your complete blog post
function getBlogPostBarfDiet() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Raw Truth: Why Dogs Thrive on a BARF Diet | FindRawDogFood.com</title>
    <meta name="description" content="Expert guide to BARF diet for dogs. 13 years of raw feeding experience reveals why dogs thrive on biologically appropriate raw food. Complete guide inside.">
    <meta name="keywords" content="BARF diet, raw dog food, biologically appropriate raw food, raw feeding guide, dog nutrition">
    <link rel="canonical" href="https://www.findrawdogfood.com/blog/the-raw-truth-why-dogs-thrive-on-barf-diet">
    ${getCommonStyles()}
</head>
<body>
    ${getHeader()}
    
    <main>
        <article class="blog-post">
            <header class="post-header">
                <div class="container">
                    <span class="post-category">Expert Guide</span>
                    <h1>The Raw Truth: Why Dogs Thrive on a BARF Diet</h1>
                    <div class="post-meta">
                        <span class="author">By a raw-feeding expert with 13 years of real-world experience</span>
                        <time datetime="2025-01-18">January 18, 2025</time>
                    </div>
                </div>
            </header>

            <div class="post-content">
                <div class="container">
                    <div class="content-wrapper">
                        <div class="main-content">
                            <h2>What Is the BARF Diet?</h2>
                            <p>BARF stands for <strong>Biologically Appropriate Raw Food</strong> — or <strong>Bones And Raw Food</strong> — and it's built on a simple idea: dogs are healthiest when they eat the way nature intended. That means fresh meat, bones, offal, and vegetables — not heat-processed kibble.</p>
                            
                            <p>This diet mirrors what canines have thrived on for thousands of years, long before commercial pet food existed. The goal? A healthier, more vibrant dog, supported by food that works with their body, not against it.</p>

                            <h2>Why Feed Raw?</h2>
                            <p>After over a decade of feeding dogs raw food, I've seen the transformation firsthand:</p>
                            <ul class="benefits-list">
                                <li><strong>Shinier coats</strong></li>
                                <li><strong>Cleaner teeth</strong></li>
                                <li><strong>Smaller, firmer stools</strong></li>
                                <li><strong>Fewer vet visits</strong></li>
                                <li><strong>Improved energy and mobility</strong></li>
                            </ul>
                            
                            <p>BARF isn't about being trendy — it's about getting back to the basics. Just as ultra-processed food harms human health, the same is true for dogs. Feeding raw gives your dog nutrients in their most bioavailable form, without fillers, preservatives, or artificial junk.</p>

                            <h2>What's in a Raw Diet?</h2>
                            <p>A typical BARF meal is made up of:</p>
                            <ul class="ingredient-list">
                                <li><strong>Muscle meat</strong> (e.g., chicken, beef, lamb)</li>
                                <li><strong>Raw meaty bones</strong> (e.g., chicken wings, turkey necks)</li>
                                <li><strong>Organ meats</strong> (e.g., liver, kidney)</li>
                                <li><strong>Blended vegetables and fruit</strong> (optional, but great for fibre and antioxidants)</li>
                            </ul>
                            
                            <p>You can prepare meals yourself (DIY), or buy pre-made blends from raw food suppliers.</p>

                            <div class="callout-box">
                                <h3>🔍 Find Raw Food Suppliers Near You</h3>
                                <p>Ready to start your raw feeding journey? Use our supplier search to find trusted raw dog food sources in your area.</p>
                                <a href="/search" class="cta-button">Find Suppliers →</a>
                            </div>

                            <h2>Is It Safe?</h2>
                            <p>Yes — when done right. Dogs are biologically equipped to handle bacteria that would harm humans. Their digestive systems are acidic and fast-moving, perfect for breaking down raw proteins and bones. That said:</p>
                            <ul class="safety-list">
                                <li>Always use human-grade meat</li>
                                <li>Practice safe food hygiene</li>
                                <li>Never feed cooked bones</li>
                            </ul>
                            
                            <p>In the U.S., most states allow raw pet food sales, but regulations vary — check your local laws or source directly from reputable raw pet food companies.</p>

                            <h2>At What Age Can You Start Feeding Raw?</h2>
                            <p>From as early as 8 weeks, puppies can thrive on raw — just with smaller bones and portioned nutrients. For adult and senior dogs, transitioning to raw can be life-changing. Always ease in gradually, and monitor how your dog adjusts over the first two weeks.</p>

                            <h2>Final Thoughts</h2>
                            <p>Feeding raw isn't a trend — it's a return to nature. Whether you're just exploring the idea or already seeing the benefits, BARF is one of the simplest ways to give your dog what they truly need. Trust your instincts, observe your dog, and let nature guide you.</p>

                            <div class="author-bio">
                                <h3>About the Author</h3>
                                <p>With over 13 years of hands-on experience in raw dog feeding, our expert has guided hundreds of dog owners through successful transitions to natural diets. From addressing initial concerns to celebrating long-term health improvements, this practical knowledge comes from real-world experience with dogs of all ages and breeds.</p>
                            </div>
                        </div>

                        <aside class="post-sidebar">
                            <div class="related-tools">
                                <h3>🛠️ Helpful Tools</h3>
                                <ul>
                                    <li><a href="/search">Find Local Suppliers</a></li>
                                    <li><a href="/guide">Raw Feeding Guide</a></li>
                                    <li><a href="/">Supplier Directory</a></li>
                                </ul>
                            </div>

                            <div class="quick-stats">
                                <h3>📊 By the Numbers</h3>
                                <div class="stat">
                                    <strong>13+</strong>
                                    <span>Years Experience</span>
                                </div>
                                <div class="stat">
                                    <strong>8,500+</strong>
                                    <span>Verified Suppliers</span>
                                </div>
                                <div class="stat">
                                    <strong>50</strong>
                                    <span>States Covered</span>
                                </div>
                            </div>

                            <div class="next-steps">
                                <h3>🚀 Ready to Start?</h3>
                                <p>Find trusted raw dog food suppliers in your area and begin your dog's journey to better health.</p>
                                <a href="/search" class="sidebar-cta">Search Suppliers</a>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </article>
    </main>

    ${getFooter()}

    <style>
        .post-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 0;
        }
        .post-category {
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            display: inline-block;
        }
        .post-header h1 {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }
        .post-meta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            opacity: 0.9;
        }

        .post-content { padding: 4rem 0; }
        .content-wrapper {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 4rem;
        }

        .main-content {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #333;
        }
        .main-content h2 {
            color: #2c3e50;
            margin: 2.5rem 0 1rem 0;
            font-size: 1.8rem;
        }
        .main-content p {
            margin-bottom: 1.5rem;
        }

        .benefits-list, .ingredient-list, .safety-list {
            background: #f8f9fa;
            padding: 1.5rem 2rem;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            margin: 1.5rem 0;
        }
        .benefits-list li, .ingredient-list li, .safety-list li {
            margin-bottom: 0.8rem;
        }

        .callout-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin: 3rem 0;
            border: 2px solid #667eea;
        }
        .callout-box h3 { color: #2c3e50; margin-bottom: 1rem; }
        .cta-button {
            background: #667eea;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            margin-top: 1rem;
            transition: background 0.3s;
        }
        .cta-button:hover { background: #764ba2; }

        .author-bio {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 15px;
            margin-top: 3rem;
            border-left: 4px solid #667eea;
        }

        .post-sidebar {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        .related-tools, .quick-stats, .next-steps {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .related-tools ul {
            list-style: none;
            padding: 0;
        }
        .related-tools li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #eee;
        }
        .related-tools a {
            color: #667eea;
            text-decoration: none;
        }

        .stat {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .stat strong {
            display: block;
            font-size: 2rem;
            color: #667eea;
        }
        .stat span {
            color: #666;
            font-size: 0.9rem;
        }

        .sidebar-cta {
            background: #667eea;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            display: block;
            text-align: center;
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .post-header h1 { font-size: 2rem; }
            .content-wrapper { grid-template-columns: 1fr; gap: 2rem; }
        }
    </style>
</body>
</html>`;
}

// Common styles and components
function getCommonStyles() {
  return `
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        a { color: #667eea; transition: color 0.3s; }
        a:hover { color: #764ba2; }
        
        /* Header styles */
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
        
        /* Footer styles */
        footer { 
            background: #2c3e50; 
            color: white; 
            text-align: center; 
            padding: 2rem 0; 
        }
        
        @media (max-width: 768px) {
            .nav-links { display: none; }
        }
    </style>`;
}

function getHeader() {
  return `
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
    </header>`;
}

function getFooter() {
  return `
    <footer>
        <div class="container">
            <p>&copy; 2025 FindRawDogFood.com - Your trusted guide to raw dog feeding</p>
            <p>Backed by 13 years of raw feeding experience</p>
        </div>
    </footer>`;
}

// Keep existing homepage function (truncated for brevity)
function getHomePage() {
  // Your existing homepage code here - same as before
  return `<!DOCTYPE html>...`; // Full homepage code
}

// API handlers remain the same
async function handleSearch(request, env) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || '';
  const state = url.searchParams.get('state') || '';
  const minRating = parseFloat(url.searchParams.get('minRating')) || 0;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  
  let query = `
    SELECT id, place_id, name, address, city, state, country, 
           latitude, longitude, phone_number, website, rating, 
           user_ratings_total, types
    FROM suppliers 
    WHERE rating >= ?
  `;
  let params = [minRating];
  
  if (city) {
    query += ` AND LOWER(city) LIKE LOWER(?)`;
    params.push(`%${city}%`);
  }
  
  if (state) {
    query += ` AND LOWER(state) LIKE LOWER(?)`;
    params.push(`%${state}%`);
  }
  
  query += ` ORDER BY rating DESC, user_ratings_total DESC LIMIT ?`;
  params.push(limit);
  
  const { results } = await env.DB.prepare(query).bind(...params).all();
  
  return new Response(JSON.stringify({
    success: true,
    count: results.length,
    suppliers: results.map(supplier => ({
      ...supplier,
      types: supplier.types ? JSON.parse(supplier.types) : []
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleSuppliers(request, env) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = (page - 1) * limit;
  
  const { results } = await env.DB.prepare(`
    SELECT id, place_id, name, address, city, state, country,
           latitude, longitude, phone_number, website, rating,
           user_ratings_total, types
    FROM suppliers 
    ORDER BY rating DESC, user_ratings_total DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();
  
  const { results: [{ count }] } = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM suppliers
  `).all();
  
  return new Response(JSON.stringify({
    success: true,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    },
    suppliers: results.map(supplier => ({
      ...supplier,
      types: supplier.types ? JSON.parse(supplier.types) : []
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStats(request, env) {
  const queries = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as total FROM suppliers`).first(),
    env.DB.prepare(`SELECT COUNT(DISTINCT state) as states FROM suppliers WHERE state IS NOT NULL`).first(),
    env.DB.prepare(`SELECT COUNT(DISTINCT city) as cities FROM suppliers WHERE city IS NOT NULL`).first(),
    env.DB.prepare(`SELECT AVG(rating) as avg_rating FROM suppliers WHERE rating > 0`).first(),
    env.DB.prepare(`SELECT state, COUNT(*) as count FROM suppliers WHERE state IS NOT NULL GROUP BY state ORDER BY count DESC LIMIT 10`).all()
  ]);
  
  return new Response(JSON.stringify({
    success: true,
    stats: {
      total_suppliers: queries[0].total,
      states_covered: queries[1].states,
      cities_covered: queries[2].cities,
      average_rating: Math.round(queries[3].avg_rating * 100) / 100,
      top_states: queries[4].results
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
