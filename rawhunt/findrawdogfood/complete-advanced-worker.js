        .controls { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; margin-bottom: 30px; backdrop-filter: blur(10px); }
        .search-container { margin-bottom: 20px; }
        .search-box { display: flex; background: white; border-radius: 50px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        #searchInput { flex: 1; border: none; padding: 20px 25px; font-size: 18px; outline: none; }
        #searchBtn { background: #e74c3c; color: white; border: none; padding: 18px 30px; cursor: pointer; font-weight: 600; }
        
        .filter-controls { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
        .category-filters { display: flex; gap: 10px; flex-wrap: wrap; }
        .category-btn { background: #ecf0f1; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.9em; transition: all 0.3s ease; }
        .category-btn.active { background: #3498db; color: white; }
        .category-btn:hover { background: #bdc3c7; }
        .category-btn.active:hover { background: #2980b9; }
        
        .location-controls { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
        .location-info { background: #27ae60; color: white; padding: 10px 20px; border-radius: 20px; font-weight: 600; }
        #findNearbyBtn { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
        #findNearbyBtn:hover { background: #2980b9; transform: translateY(-2px); }
        #radiusSlider { width: 150px; }
        
        .sort-controls { display: flex; gap: 10px; align-items: center; }
        #sortSelect { padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; }
        
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .map-container { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); }
        #map { height: 600px; border-radius: 15px; }
        
        .results-container { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; backdrop-filter: blur(10px); }
        .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .results-count { color: #7f8c8d; font-size: 0.9em; }
        
        .supplier-card { background: white; margin: 15px 0; padding: 20px; border-radius: 15px; border-left: 5px solid #e74c3c; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease; }
        .supplier-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        .supplier-card.highlighted { border-left-color: #f39c12; background: #fff3cd; }
        .supplier-card.premium { border-left-color: #8e44ad; background: linear-gradient(145deg, #fff, #f8f9fa); }
        
        .supplier-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .supplier-name { font-size: 1.3em; font-weight: bold; color: #2c3e50; }
        .supplier-badges { display: flex; gap: 8px; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75em; font-weight: 600; }
        .badge.premium { background: #8e44ad; color: white; }
        .badge.delivery { background: #27ae60; color: white; }
        .badge.specialist { background: #e67e22; color: white; }
        
        .supplier-details { color: #555; line-height: 1.6; }
        .supplier-distance { color: #27ae60; font-weight: 600; font-size: 0.9em; margin-bottom: 5px; }
        .supplier-rating { color: #f39c12; font-weight: bold; margin-top: 5px; }
        
        .loading { text-align: center; padding: 40px; color: #7f8c8d; }
        .no-results { text-align: center; padding: 40px; color: #7f8c8d; }
        
        @media (max-width: 968px) {
            .content-grid { grid-template-columns: 1fr; }
            .filter-controls { justify-content: center; }
            .header h1 { font-size: 2.2em; }
            #map { height: 400px; }
        }
        
        .cluster-marker { background: #3498db; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 Find Raw Dog Food</h1>
        <p>Interactive map • 8,500+ suppliers • Real-time location tracking</p>
    </div>

    <div class="main-content">
        <div class="controls">
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Search by business name, city, or area..." />
                    <button id="searchBtn">🔍 Search</button>
                </div>
            </div>
            
            <div class="filter-controls">
                <div class="category-filters" id="categoryFilters">
                    <!-- Categories loaded dynamically -->
                </div>
                
                <div class="sort-controls">
                    <label>Sort by:</label>
                    <select id="sortSelect">
                        <option value="relevance">Relevance</option>
                        <option value="distance">Distance</option>
                        <option value="rating">Rating</option>
                        <option value="name">Name A-Z</option>
                    </select>
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
                <div class="results-header">
                    <h3>Suppliers</h3>
                    <div class="results-count" id="resultsCount">Loading...</div>
                </div>
                <div id="resultsContent">
                    <div class="loading">🔍 Loading suppliers...</div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map, userLocation, suppliersData = [], markersLayer, clustersLayer;
        let currentRadius = 25, currentCategory = 'all', currentSort = 'relevance';
        let sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

        function initMap(lat = 51.5074, lng = -0.1278) {
            map = L.map('map').setView([lat, lng], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            markersLayer = L.layerGroup().addTo(map);
            clustersLayer = L.layerGroup().addTo(map);
            
            userLocation = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map).bindPopup('Your Location');
            
            map.on('zoomend', handleMapZoom);
        }

        function handleMapZoom() {
            const zoom = map.getZoom();
            if (suppliersData.length > 0) {
                updateMapMarkers(zoom < 12);
            }
        }

        async function loadCategories() {
            try {
                const response = await fetch('/api/categories');
                const categories = await response.json();
                
                const filtersDiv = document.getElementById('categoryFilters');
                filtersDiv.innerHTML = categories.map(cat => 
                    \`<button class="category-btn \${cat.id === 'all' ? 'active' : ''}" data-category="\${cat.id}">
                        \${cat.icon} \${cat.name} (\${cat.count})
                    </button>\`
                ).join('');
                
                filtersDiv.querySelectorAll('.category-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentCategory = btn.dataset.category;
                        filtersDiv.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        findNearbySuppliers();
                    });
                });
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        async function getUserLocation() {
            try {
                const response = await fetch('/api/location');
                const data = await response.json();
                
                document.getElementById('locationInfo').textContent = 
                    \`📍 \${data.city}, \${data.region}\`;
                
                initMap(data.latitude, data.longitude);
                
                trackEvent('location_detected', null, null, {
                    lat: data.latitude,
                    lng: data.longitude,
                    city: data.city
                });
                
                return { lat: data.latitude, lng: data.longitude };
            } catch (error) {
                console.error('Error getting location:', error);
                initMap();
                return { lat: 51.5074, lng: -0.1278 };
            }
        }

        async function findNearbySuppliers() {
            const userPos = userLocation.getLatLng();
            const resultsContent = document.getElementById('resultsContent');
            const resultsCount = document.getElementById('resultsCount');
            
            resultsContent.innerHTML = '<div class="loading">🔍 Finding suppliers near you...</div>';
            resultsCount.textContent = 'Searching...';

            try {
                const zoom = map.getZoom();
                const response = await fetch(\`/api/nearby?lat=\${userPos.lat}&lng=\${userPos.lng}&radius=\${currentRadius}&category=\${currentCategory}&cluster=true&zoom=\${zoom}\`);
                const data = await response.json();

                suppliersData = [...(data.results || []), ...(data.clusters || [])];
                
                updateMapMarkers(zoom < 12, data.clusters || []);
                displaySuppliersList(data.results || []);
                
                resultsCount.textContent = \`\${data.total || 0} suppliers found\`;
                
                const circle = L.circle([userPos.lat, userPos.lng], {
                    radius: currentRadius * 1000,
                    fillColor: '#3498db',
                    fillOpacity: 0.1,
                    color: '#3498db',
                    weight: 2
                }).addTo(map);
                
                trackEvent('nearby_search', null, \`radius:\${currentRadius},category:\${currentCategory}\`, {
                    lat: userPos.lat,
                    lng: userPos.lng
                });
                
            } catch (error) {
                resultsContent.innerHTML = '<div class="no-results">❌ Error finding suppliers. Please try again.</div>';
                resultsCount.textContent = 'Error';
            }
        }

        function updateMapMarkers(enableClustering, clusters = []) {
            markersLayer.clearLayers();
            clustersLayer.clearLayers();
            
            if (enableClustering && clusters.length > 0) {
                clusters.forEach((cluster) => {
                    const marker = L.marker([cluster.latitude, cluster.longitude], {
                        icon: L.divIcon({
                            className: 'cluster-marker',
                            html: cluster.count.toString(),
                            iconSize: [40, 40],
                            iconAnchor: [20, 20]
                        })
                    }).addTo(clustersLayer);
                    
                    marker.bindPopup(\`
                        <strong>\${cluster.count} suppliers in this area</strong><br>
                        <small>Zoom in to see individual suppliers</small>
                    \`);
                    
                    marker.on('click', () => {
                        map.setView([cluster.latitude, cluster.longitude], map.getZoom() + 2);
                    });
                });
            } else {
                suppliersData.filter(s => s.latitude && s.longitude).forEach((supplier, index) => {
                    const marker = L.marker([supplier.latitude, supplier.longitude]).addTo(markersLayer);
                    
                    marker.bindPopup(\`
                        <strong>\${supplier.business_name}</strong><br>
                        \${supplier.premium_listing ? '✨ <em>Featured</em><br>' : ''}
                        \${supplier.address}<br>
                        \${supplier.phone ? \`📞 \${supplier.phone}<br>\` : ''}
                        \${supplier.website ? \`<a href="\${supplier.website}" target="_blank">Visit Website</a>\` : ''}
                        \${supplier.rating ? \`<br>⭐ \${supplier.rating.toFixed(1)}/5\` : ''}
                    \`);
                    
                    marker.on('click', () => {
                        highlightSupplier(index);
                        trackEvent('marker_click', supplier.id || supplier.business_name);
                    });
                });
            }
        }

        function displaySuppliersList(suppliers) {
            const resultsContent = document.getElementById('resultsContent');
            
            if (suppliers.length === 0) {
                resultsContent.innerHTML = '<div class="no-results"><h3>No suppliers found</h3><p>Try increasing the search radius or changing filters.</p></div>';
                return;
            }

            resultsContent.innerHTML = suppliers.map((supplier, index) => {
                const badges = [];
                if (supplier.premium_listing) badges.push('<span class="badge premium">✨ Featured</span>');
                if (supplier.delivery_available) badges.push('<span class="badge delivery">🚚 Delivery</span>');
                if (supplier.supplier_type === 'specialist') badges.push('<span class="badge specialist">🥩 Specialist</span>');
                
                return \`
                    <div class="supplier-card \${supplier.premium_listing ? 'premium' : ''}" onclick="highlightSupplier(\${index})" data-index="\${index}">
                        <div class="supplier-header">
                            <div class="supplier-name">\${supplier.business_name || 'Business Name'}</div>
                            <div class="supplier-badges">\${badges.join('')}</div>
                        </div>
                        \${supplier.distance && supplier.distance < 999 ? \`<div class="supplier-distance">📍 ~\${Math.round(supplier.distance)} km away</div>\` : ''}
                        \${supplier.rating ? \`<div class="supplier-rating">⭐ \${supplier.rating.toFixed(1)}/5 (\${supplier.review_count || 0} reviews)</div>\` : ''}
                        <div class="supplier-details">
                            <div><strong>📍 Address:</strong> \${supplier.address || 'Address not available'}</div>
                            \${supplier.phone ? \`<div><strong>📞 Phone:</strong> \${supplier.phone}</div>\` : ''}
                            \${supplier.website ? \`<div><strong>🌐 Website:</strong> <a href="\${supplier.website}" target="_blank" onclick="event.stopPropagation()">\${supplier.website}</a></div>\` : ''}
                            \${supplier.description ? \`<div><strong>About:</strong> \${supplier.description}</div>\` : ''}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function highlightSupplier(index) {
            document.querySelectorAll('.supplier-card').forEach(card => {
                card.classList.remove('highlighted');
            });
            
            const card = document.querySelector(\`[data-index="\${index}"]\`);
            if (card) {
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        async function search() {
            const query = document.getElementById('searchInput').value;
            const resultsContent = document.getElementById('resultsContent');
            const resultsCount = document.getElementById('resultsCount');
            
            resultsContent.innerHTML = '<div class="loading">🔍 Searching database...</div>';
            resultsCount.textContent = 'Searching...';

            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&page=1&category=\${currentCategory}&sort=\${currentSort}\`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    suppliersData = data.results;
                    displaySuppliersList(data.results);
                    updateMapMarkers(false);
                    resultsCount.textContent = \`\${data.results.length} suppliers found\`;
                    
                    trackEvent('search', null, query);
                } else {
                    resultsContent.innerHTML = '<div class="no-results"><h3>No suppliers found</h3><p>Try a different search term or location.</p></div>';
                    resultsCount.textContent = '0 suppliers found';
                }
            } catch (error) {
                resultsContent.innerHTML = '<div class="no-results">❌ Search error. Please try again.</div>';
                resultsCount.textContent = 'Error';
            }
        }

        async function trackEvent(eventType, supplierId, query, location) {
            try {
                await fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: eventType,
                        supplier_id: supplierId,
                        search_query: query,
                        user_location: location,
                        session_id: sessionId,
                        referrer: document.referrer
                    })
                });
            } catch (error) {
                // Silent fail for analytics
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
        
        document.getElementById('sortSelect').addEventListener('change', function(e) {
            currentSort = e.target.value;
            if (suppliersData.length > 0) {
                search();
            }
        });

        // Initialize on page load
        window.addEventListener('load', async () => {
            await getUserLocation();
            await loadCategories();
            
            setTimeout(() => {
                findNearbySuppliers();
            }, 1000);
        });
    </script>
</body>
</html>`;
}