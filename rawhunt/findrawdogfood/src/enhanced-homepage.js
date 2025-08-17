// Enhanced Homepage with Map and Search Features  
export function getEnhancedHomePage() {
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
        
        /* Features */
        .features { 
            padding: 4rem 0; 
            background: #f8f9fa;
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
            background: white;
            border-radius: 15px;
            transition: transform 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
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

        // Use user's location
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

        // Search nearby suppliers using geolocation
        async function searchNearby() {
            if (!userLocation) return;
            
            const resultsSection = document.getElementById('searchResults');
            const resultsTitle = document.getElementById('resultsTitle');
            const resultsContainer = document.getElementById('resultsContainer');
            
            resultsTitle.textContent = 'Finding suppliers near you...';
            resultsContainer.innerHTML = '';
            resultsSection.style.display = 'block';
            
            try {
                // For demo purposes, we'll search for suppliers in a large area
                // In a real implementation, you'd have a geospatial search API
                const response = await fetch('/api/suppliers?limit=50');
                const data = await response.json();
                
                if (data.success && data.suppliers.length > 0) {
                    // Filter suppliers within reasonable distance (this is a simple approximation)
                    const nearbySuppliers = data.suppliers.filter(supplier => {
                        if (!supplier.latitude || !supplier.longitude) return false;
                        
                        const distance = getDistance(
                            userLocation.lat, userLocation.lng,
                            supplier.latitude, supplier.longitude
                        );
                        
                        return distance < 100; // Within 100 miles
                    }).slice(0, 10); // Limit to 10 results
                    
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