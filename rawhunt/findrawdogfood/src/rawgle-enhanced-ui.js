// Enhanced UI template for RAWGLE.COM with all UX improvements
export function generateEnhancedUI(path = '/') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAWGLE - Raw Dog Food Directory | Find Local Suppliers</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="RAWGLE is the ultimate directory for raw dog food suppliers. Find local BARF diet retailers, delivery services, and premium raw pet nutrition near you.">
    <meta name="keywords" content="raw dog food, BARF diet, raw pet food, dog nutrition, local suppliers, rawgle">
    
    <!-- Leaflet CSS for maps -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FDF8F0;
            color: #2C1810;
            line-height: 1.6;
        }
        
        /* Header with Sign In Button */
        .header {
            background: white;
            border-bottom: 2px solid #E8DCC6;
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo {
            font-size: 2rem;
            font-weight: 800;
            color: #D4A574;
            letter-spacing: -0.02em;
        }
        
        .tagline {
            font-size: 0.9rem;
            color: #8B6914;
        }
        
        /* Sign In Button - Small, top-right */
        .sign-in-btn {
            padding: 0.5rem 1rem;
            background: transparent;
            color: #D4A574;
            border: 1px solid #D4A574;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .sign-in-btn:hover {
            background: #D4A574;
            color: white;
        }
        
        /* Main Content */
        .main-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* Search Section */
        .search-section {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .search-container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .search-bar {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .search-input {
            flex: 1;
            padding: 1rem;
            border: 2px solid #E8DCC6;
            border-radius: 8px;
            font-size: 1rem;
            background: white;
        }
        
        .search-button {
            padding: 1rem 2rem;
            background: #D4A574;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .search-button:hover {
            background: #C19A5B;
        }
        
        /* Location Fallback */
        .location-fallback {
            display: none;
            background: white;
            border: 2px solid #D4A574;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .location-fallback.active {
            display: block;
        }
        
        .location-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #E8DCC6;
            border-radius: 6px;
            margin-bottom: 0.5rem;
        }
        
        .use-location-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
        }
        
        /* Map Container */
        #map {
            height: 400px;
            width: 100%;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 2px solid #E8DCC6;
        }
        
        /* Results Section */
        .results-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .results-count {
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .showing-count {
            color: #8B6914;
            font-size: 0.9rem;
        }
        
        /* Supplier Card */
        .supplier-card {
            background: white;
            border: 1px solid #E8DCC6;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .supplier-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .supplier-card.selected {
            border-color: #D4A574;
            background: #FFF9F2;
        }
        
        /* Checkbox System */
        .supplier-checkbox {
            position: absolute;
            top: 1rem;
            left: 1rem;
            width: 24px;
            height: 24px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            background: white;
            border: 2px solid #ccc;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        
        .supplier-checkbox:checked {
            background-color: #4CAF50;
            border-color: #4CAF50;
        }
        
        .supplier-checkbox:checked::after {
            content: '✓';
            display: block;
            text-align: center;
            color: white;
            font-size: 16px;
            line-height: 20px;
        }
        
        .supplier-checkbox:disabled {
            background-color: #f5f5f5;
            border-color: #ddd;
            cursor: not-allowed;
        }
        
        .supplier-checkbox:disabled::after {
            content: '✕';
            color: #999;
        }
        
        .supplier-content {
            margin-left: 40px;
        }
        
        .supplier-name {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2C1810;
        }
        
        .supplier-address {
            color: #666;
            margin-bottom: 0.5rem;
        }
        
        .supplier-distance {
            font-weight: 600;
            color: #D4A574;
            margin-bottom: 0.5rem;
        }
        
        .supplier-rating {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .supplier-services {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 0.5rem;
        }
        
        .service-tag {
            background: #E8DCC6;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        
        /* Load More Button */
        .load-more-container {
            text-align: center;
            margin-top: 2rem;
        }
        
        .load-more-btn {
            padding: 0.75rem 2rem;
            background: #D4A574;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .load-more-btn:hover {
            background: #C19A5B;
        }
        
        .load-more-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        /* Toast Notification */
        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1001;
        }
        
        .toast.show {
            opacity: 1;
        }
        
        /* Loading Spinner */
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #D4A574;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 0.5rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }
            
            .logo-section {
                flex-direction: column;
                text-align: center;
            }
            
            .supplier-checkbox {
                width: 44px;
                height: 44px;
            }
            
            .supplier-content {
                margin-left: 54px;
            }
            
            #map {
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <!-- Header with Sign In -->
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo">RAWGLE</div>
                <div class="tagline">Find Raw Dog Food Near You</div>
            </div>
            <button class="sign-in-btn" onclick="showSignInOptions()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Sign In
            </button>
        </div>
    </header>
    
    <!-- Main Content -->
    <div class="main-container">
        <!-- Search Section -->
        <div class="search-section">
            <div class="search-container">
                <div class="search-bar">
                    <input type="text" class="search-input" placeholder="Search for suppliers, city, or area..." id="searchInput">
                    <button class="search-button" onclick="performSearch()">Search</button>
                </div>
                
                <!-- Location Fallback -->
                <div class="location-fallback" id="locationFallback">
                    <p style="margin-bottom: 0.5rem;">Location access denied. Enter your location manually:</p>
                    <input type="text" class="location-input" id="locationInput" placeholder="Enter postcode, ZIP code, or city">
                    <button class="use-location-btn" onclick="retryGeolocation()">📍 Use My Location</button>
                </div>
            </div>
        </div>
        
        <!-- Map -->
        <div id="map"></div>
        
        <!-- Results -->
        <div id="results">
            <div class="results-header">
                <div class="results-count" id="resultsCount">Searching for suppliers near you...</div>
                <div class="showing-count" id="showingCount"></div>
            </div>
            <div class="results-container" id="resultsContainer"></div>
            <div class="load-more-container" id="loadMoreContainer" style="display: none;">
                <button class="load-more-btn" id="loadMoreBtn" onclick="loadMore()">Load More</button>
            </div>
        </div>
    </div>
    
    <!-- Toast Notification -->
    <div class="toast" id="toast"></div>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    
    <script>
        // State Management
        let map = null;
        let markers = [];
        let selectedSuppliers = [];
        let allSuppliers = [];
        let displayedCount = 5;
        let userLocation = null;
        const MAX_SELECTIONS = 3;
        const BATCH_SIZE = 5;
        
        // Initialize Map
        function initMap() {
            map = L.map('map').setView([51.505, -0.09], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Try to get user location
            getUserLocation();
        }
        
        // Enhanced marker icon (3x size)
        function createCustomIcon() {
            return L.divIcon({
                html: '<div style="background: #D4A574; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18],
                className: 'custom-marker'
            });
        }
        
        // Geolocation with fallback
        function getUserLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        map.setView([userLocation.lat, userLocation.lng], 13);
                        searchNearby();
                    },
                    (error) => {
                        handleGeolocationError(error);
                    }
                );
            } else {
                showLocationFallback("Geolocation is not supported by your browser.");
            }
        }
        
        function handleGeolocationError(error) {
            let message = "";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = "Location access denied. Please enter your location manually.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "Location unavailable. Please enter your location manually.";
                    break;
                case error.TIMEOUT:
                    message = "Location request timed out. Please enter your location manually.";
                    break;
            }
            showLocationFallback(message);
        }
        
        function showLocationFallback(message) {
            const fallback = document.getElementById('locationFallback');
            fallback.classList.add('active');
            if (message) {
                fallback.querySelector('p').textContent = message;
            }
        }
        
        function retryGeolocation() {
            getUserLocation();
        }
        
        // Search functionality
        async function searchNearby() {
            if (!userLocation) return;
            
            try {
                const response = await fetch(\`/api/nearby?lat=\${userLocation.lat}&lng=\${userLocation.lng}&radius=25&limit=50\`);
                const data = await response.json();
                
                allSuppliers = data.results || [];
                displayResults();
            } catch (error) {
                showToast('Failed to load suppliers. Please try again.');
            }
        }
        
        async function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;
            
            document.getElementById('resultsCount').textContent = 'Searching...';
            
            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&limit=50\`);
                const data = await response.json();
                
                allSuppliers = data.results || [];
                displayResults();
            } catch (error) {
                showToast('Search failed. Please try again.');
            }
        }
        
        // Display results with lazy loading
        function displayResults() {
            const container = document.getElementById('resultsContainer');
            const resultsToShow = allSuppliers.slice(0, displayedCount);
            
            // Update counts
            document.getElementById('resultsCount').textContent = \`Found \${allSuppliers.length} suppliers\`;
            document.getElementById('showingCount').textContent = \`Showing \${resultsToShow.length} of \${allSuppliers.length}\`;
            
            // Clear existing content
            container.innerHTML = '';
            clearMarkers();
            
            // Render suppliers
            resultsToShow.forEach(supplier => {
                const card = createSupplierCard(supplier);
                container.appendChild(card);
                
                // Add map marker
                if (supplier.latitude && supplier.longitude) {
                    addMarker(supplier);
                }
            });
            
            // Show/hide load more button
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            if (displayedCount < allSuppliers.length) {
                loadMoreContainer.style.display = 'block';
                document.getElementById('loadMoreBtn').textContent = 'Load More';
                document.getElementById('loadMoreBtn').disabled = false;
            } else {
                if (allSuppliers.length > BATCH_SIZE) {
                    loadMoreContainer.style.display = 'block';
                    document.getElementById('loadMoreBtn').textContent = 'No More Results';
                    document.getElementById('loadMoreBtn').disabled = true;
                } else {
                    loadMoreContainer.style.display = 'none';
                }
            }
            
            // Fit map to markers
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
        
        function createSupplierCard(supplier) {
            const card = document.createElement('div');
            card.className = 'supplier-card';
            card.id = \`supplier-\${supplier.id}\`;
            
            const isSelected = selectedSuppliers.includes(supplier.id);
            const isDisabled = !isSelected && selectedSuppliers.length >= MAX_SELECTIONS;
            
            if (isSelected) {
                card.classList.add('selected');
            }
            
            // Calculate distance if available
            let distanceText = '';
            if (supplier.distance) {
                distanceText = \`<div class="supplier-distance">\${supplier.distance.miles} miles away</div>\`;
            }
            
            card.innerHTML = \`
                <input type="checkbox" 
                    class="supplier-checkbox" 
                    id="checkbox-\${supplier.id}"
                    \${isSelected ? 'checked' : ''}
                    \${isDisabled ? 'disabled' : ''}
                    onchange="handleCheckboxChange('\${supplier.id}')">
                
                <div class="supplier-content">
                    <h3 class="supplier-name">\${supplier.name}</h3>
                    <p class="supplier-address">\${supplier.formatted_address || supplier.address}</p>
                    \${distanceText}
                    <div class="supplier-rating">
                        ⭐ \${supplier.rating || 'N/A'} (\${supplier.user_ratings_total || 0} reviews)
                    </div>
                    \${supplier.formatted_phone_number ? \`<p>📞 \${supplier.formatted_phone_number}</p>\` : ''}
                    \${supplier.website ? \`<p><a href="\${supplier.website}" target="_blank">🌐 Visit Website</a></p>\` : ''}
                    <div class="supplier-services">
                        \${supplier.delivery ? '<span class="service-tag">🚚 Delivery</span>' : ''}
                        \${supplier.takeout ? '<span class="service-tag">🛍️ Pickup</span>' : ''}
                        \${supplier.dine_in ? '<span class="service-tag">🍽️ Dine-in</span>' : ''}
                    </div>
                </div>
            \`;
            
            return card;
        }
        
        function handleCheckboxChange(supplierId) {
            const checkbox = document.getElementById(\`checkbox-\${supplierId}\`);
            
            if (checkbox.checked) {
                if (selectedSuppliers.length < MAX_SELECTIONS) {
                    selectedSuppliers.push(supplierId);
                    document.getElementById(\`supplier-\${supplierId}\`).classList.add('selected');
                } else {
                    checkbox.checked = false;
                    showToast("Only 3 listings can be selected at a time. Deselect one to choose another.");
                }
            } else {
                selectedSuppliers = selectedSuppliers.filter(id => id !== supplierId);
                document.getElementById(\`supplier-\${supplierId}\`).classList.remove('selected');
            }
            
            // Update disabled state of other checkboxes
            updateCheckboxStates();
        }
        
        function updateCheckboxStates() {
            document.querySelectorAll('.supplier-checkbox').forEach(checkbox => {
                const supplierId = checkbox.id.replace('checkbox-', '');
                if (!selectedSuppliers.includes(supplierId)) {
                    checkbox.disabled = selectedSuppliers.length >= MAX_SELECTIONS;
                }
            });
        }
        
        function loadMore() {
            displayedCount += BATCH_SIZE;
            displayResults();
        }
        
        // Map functions
        function addMarker(supplier) {
            const marker = L.marker([supplier.latitude, supplier.longitude], {
                icon: createCustomIcon()
            }).addTo(map);
            
            // Enhanced popup with distance
            let popupContent = \`<strong>\${supplier.name}</strong><br>\${supplier.formatted_address || supplier.address}\`;
            if (supplier.distance) {
                popupContent += \`<br><strong>\${supplier.distance.miles} miles away</strong>\`;
            }
            
            marker.bindPopup(popupContent);
            markers.push(marker);
        }
        
        function clearMarkers() {
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
        }
        
        // Toast notification
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        // Sign in functionality
        function showSignInOptions() {
            // For now, just show a toast
            showToast("Sign in functionality coming soon!");
        }
        
        // Manual location entry
        document.getElementById('locationInput')?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const location = e.target.value.trim();
                if (location) {
                    // In a real implementation, geocode the location
                    showToast(\`Searching near "\${location}"...\`);
                    document.getElementById('searchInput').value = location;
                    performSearch();
                }
            }
        });
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            initMap();
            
            // Enter key support for search
            document.getElementById('searchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        });
    </script>
</body>
</html>`;
}

export default generateEnhancedUI;