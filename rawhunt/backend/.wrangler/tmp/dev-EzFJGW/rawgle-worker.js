var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-d8ukRv/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-d8ukRv/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/rawgle-worker.js
var rawgle_worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    if (hostname === "findrawdogfood.com" || hostname === "www.findrawdogfood.com") {
      const rawgleUrl = `https://rawgle.com${url.pathname}${url.search}`;
      return Response.redirect(rawgleUrl, 301);
    }
    if (hostname === "www.rawgle.com") {
      const canonicalUrl = `https://rawgle.com${url.pathname}${url.search}`;
      return Response.redirect(canonicalUrl, 301);
    }
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const path = url.pathname;
    try {
      if (path.startsWith("/api/")) {
        const response = await handleApiRequest(path, request, env);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      if (path.startsWith("/static/")) {
        return handleStaticAsset(path, env);
      }
      return handleMainApp(path, request, env);
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};
async function handleApiRequest(path, request, env) {
  const url = new URL(request.url);
  switch (path) {
    case "/api/search":
      return handleSearch(url.searchParams, env);
    case "/api/nearby":
      return handleNearbySearch(url.searchParams, env);
    case "/api/stats":
      return handleStats(env);
    case "/api/supplier":
      return handleSupplierDetails(url.searchParams, env);
    case "/api/location":
      return handleLocationDetection(request);
    default:
      return new Response("API endpoint not found", { status: 404 });
  }
}
__name(handleApiRequest, "handleApiRequest");
async function handleSearch(params, env) {
  const query = params.get("q") || "";
  const limit = Math.min(parseInt(params.get("limit")) || 20, 100);
  const offset = parseInt(params.get("offset")) || 0;
  try {
    const searchQuery = `
      SELECT 
        id, place_id, name, address, city, state, country,
        latitude, longitude, rating, user_ratings_total,
        phone_number, website, types, created_at
      FROM suppliers 
      WHERE (
        name LIKE ? OR 
        address LIKE ? OR 
        city LIKE ? OR
        state LIKE ? OR
        types LIKE ?
      )
      ORDER BY rating DESC, user_ratings_total DESC
      LIMIT ? OFFSET ?
    `;
    const searchPattern = query.trim() ? `%${query.trim()}%` : "%";
    const results = await env.DB.prepare(searchQuery).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset).all();
    const processedResults = results.results || [];
    return new Response(JSON.stringify({
      query,
      results: processedResults,
      total: processedResults.length,
      offset,
      limit
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
        // 1 hour cache
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: "Search failed", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleSearch, "handleSearch");
async function handleNearbySearch(params, env) {
  const lat = parseFloat(params.get("lat"));
  const lng = parseFloat(params.get("lng"));
  const radius = Math.min(parseFloat(params.get("radius")) || 25, 100);
  const limit = Math.min(parseInt(params.get("limit")) || 10, 50);
  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: "Latitude and longitude required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const nearbyQuery = `
      SELECT 
        id, place_id, name, address, city, state, country,
        latitude, longitude, rating, user_ratings_total,
        phone_number, website, types,
        (
          3959 * acos(
            cos(? * 0.017453293) * cos(latitude * 0.017453293) * 
            cos((longitude - ?) * 0.017453293) + 
            sin(? * 0.017453293) * sin(latitude * 0.017453293)
          )
        ) AS distance_miles
      FROM suppliers 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        AND (
          3959 * acos(
            cos(? * 0.017453293) * cos(latitude * 0.017453293) * 
            cos((longitude - ?) * 0.017453293) + 
            sin(? * 0.017453293) * sin(latitude * 0.017453293)
          )
        ) <= ?
      ORDER BY distance_miles ASC
      LIMIT ?
    `;
    const latRange = radius / 69;
    const lngRange = radius / (69 * Math.cos(lat * Math.PI / 180));
    const results = await env.DB.prepare(nearbyQuery).bind(
      lat,
      lng,
      lat,
      // For first distance calculation
      lat - latRange,
      lat + latRange,
      // Lat bounds
      lng - lngRange,
      lng + lngRange,
      // Lng bounds
      lat,
      lng,
      lat,
      // For WHERE clause distance calculation
      radius,
      // Already in miles
      limit
    ).all();
    const enhancedResults = results.results.map((supplier) => {
      const distance_miles = supplier.distance_miles;
      const walkingTime = distance_miles / 3 * 60;
      const drivingTime = distance_miles * 2;
      return {
        ...supplier,
        distance: {
          km: Math.round(distance_miles * 1.60934 * 10) / 10,
          miles: Math.round(distance_miles * 10) / 10,
          walking_minutes: Math.round(walkingTime),
          driving_minutes: Math.round(drivingTime)
        },
        distance_miles: Math.round(distance_miles * 10) / 10,
        transport_mode: walkingTime < 3 || distance_miles < 0.1 ? "walk" : "drive"
      };
    });
    return new Response(JSON.stringify({
      location: { lat, lng },
      radius,
      results: enhancedResults,
      total: enhancedResults.length
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800"
        // 30 min cache for location-based data
      }
    });
  } catch (error) {
    console.error("Nearby search error:", error);
    return new Response(JSON.stringify({ error: "Nearby search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleNearbySearch, "handleNearbySearch");
async function handleStats(env) {
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
      ...result,
      last_updated: (/* @__PURE__ */ new Date()).toISOString(),
      domain: "rawgle.com"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
        // 1 hour cache
      }
    });
  } catch (error) {
    console.error("Stats error:", error);
    return new Response(JSON.stringify({ error: "Stats unavailable", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleStats, "handleStats");
async function handleSupplierDetails(params, env) {
  const id = params.get("id");
  const place_id = params.get("place_id");
  if (!id && !place_id) {
    return new Response(JSON.stringify({ error: "Supplier ID or place_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const query = id ? "SELECT * FROM suppliers WHERE id = ?" : "SELECT * FROM suppliers WHERE place_id = ?";
    const result = await env.DB.prepare(query).bind(id || place_id).first();
    if (!result) {
      return new Response(JSON.stringify({ error: "Supplier not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=7200"
        // 2 hour cache for individual records
      }
    });
  } catch (error) {
    console.error("Supplier details error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch supplier details", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleSupplierDetails, "handleSupplierDetails");
async function handleLocationDetection(request) {
  const clientIP = request.headers.get("CF-Connecting-IP");
  const country = request.cf?.country;
  const region = request.cf?.region;
  const city = request.cf?.city;
  const latitude = request.cf?.latitude;
  const longitude = request.cf?.longitude;
  const timezone = request.cf?.timezone;
  return new Response(JSON.stringify({
    ip: clientIP,
    location: {
      country,
      region,
      city,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      timezone
    },
    accuracy: "city-level",
    source: "cloudflare-cf"
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleLocationDetection, "handleLocationDetection");
async function handleStaticAsset(path, env) {
  const assetPath = path.replace("/static/", "");
  const contentType = getContentType(assetPath);
  return new Response("Static asset serving not yet configured", {
    status: 404,
    headers: { "Content-Type": "text/plain" }
  });
}
__name(handleStaticAsset, "handleStaticAsset");
async function handleMainApp(path, request, env) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAWGLE - Raw Dog Food Directory | Find Local Suppliers</title>
    <meta name="description" content="RAWGLE is the ultimate directory for raw dog food suppliers. Find local BARF diet retailers, delivery services, and premium raw pet nutrition near you.">
    
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
        
        /* Header */
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
        
        .search-bar {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            max-width: 900px;
            margin: 0 auto 2rem;
        }
        
        .search-input {
            flex: 1;
            padding: 1rem;
            border: 2px solid #E8DCC6;
            border-radius: 8px;
            font-size: 1rem;
            background: white;
        }
        
        .search-button, .location-button, .route-button {
            padding: 1rem 2rem;
            background: #D4A574;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .search-button:hover, .location-button:hover, .route-button:hover {
            background: #C19A5B;
        }
        
        .location-button {
            background: #7A9B76;
        }
        
        .route-button {
            background: #B85C5C;
        }
        
        /* Two-Column Layout: 50% / 50% split */
        .main-content {
            display: grid;
            grid-template-columns: 50% 50%;
            gap: 2rem;
            margin-bottom: 2rem;
            height: 700px;
            max-width: 100%;
        }
        
        /* Left Column - Supplier Results */
        .results-column {
            background: white;
            border-radius: 8px;
            border: 2px solid #E8DCC6;
            padding: 1.5rem;
            overflow-y: auto;
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #E8DCC6;
        }
        
        .results-count {
            font-size: 1.1rem;
            font-weight: 600;
            color: #D4A574;
        }
        
        /* Right Column - Map */
        .map-column {
            background: white;
            border-radius: 8px;
            border: 2px solid #E8DCC6;
        }
        
        #map {
            height: 100%;
            width: 100%;
            border-radius: 8px;
        }
        
        /* Supplier Card */
        .supplier-card {
            background: white;
            border: 1px solid #E8DCC6;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .supplier-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
            border-color: #D4A574;
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
        
        .supplier-contact {
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
        }
        
        .contact-link {
            color: #D4A574;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .contact-link:hover {
            color: #8B6914;
        }
        
        /* Navigation Buttons */
        .navigation-buttons {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .nav-button {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.5rem 0.8rem;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: 500;
            color: white;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
        }
        
        .nav-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .nav-google {
            background: #4285F4;
        }
        
        .nav-google:hover {
            background: #3367D6;
            color: white;
        }
        
        .nav-waze {
            background: #00D4FF;
        }
        
        .nav-waze:hover {
            background: #00B8E6;
            color: white;
        }
        
        .nav-apple {
            background: #007AFF;
        }
        
        .nav-apple:hover {
            background: #0056CC;
            color: white;
        }
        
        /* Loading State */
        .loading {
            text-align: center;
            padding: 2rem;
            color: #D4A574;
        }
        
        /* Pulse animation for user location */
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 68, 68, 0);
            }
        }
        
        /* Route line styling */
        .route-line {
            stroke: #D4A574;
            stroke-width: 4;
            stroke-dasharray: 10, 10;
            animation: dash 20s linear infinite;
        }
        
        @keyframes dash {
            to {
                stroke-dashoffset: -100;
            }
        }
        
        /* Route line style */
        .route-line {
            stroke: #D4A574;
            stroke-width: 3;
            stroke-opacity: 0.8;
            stroke-dasharray: 5, 10;
            animation: dash 20s linear infinite;
        }
        
        @keyframes dash {
            to {
                stroke-dashoffset: -100;
            }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
                height: auto;
            }
            
            .map-column {
                height: 400px;
                order: -1;
            }
            
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }
            
            .search-bar {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo">RAWGLE</div>
                <div class="tagline">Raw Feeding Community</div>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <div class="main-container">
        <!-- Search Section -->
        <div class="search-section">
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Search for suppliers, city, or area..." id="searchInput">
                <button class="search-button" onclick="performSearch()">Search</button>
                <button class="location-button" onclick="useMyLocation()">Near Me</button>
                <button class="route-button" onclick="findRoute()">Route to Closest</button>
            </div>
        </div>
        
        <!-- Main Content: 50/50 Split -->
        <div class="main-content">
            <!-- Left Column: Results -->
            <div class="results-column">
                <div class="results-header">
                    <div class="results-count" id="resultsCount">Search for suppliers to see results</div>
                </div>
                <div class="results-container" id="resultsContainer">
                    <div class="loading">Enter a location or click "Near Me" to find suppliers</div>
                </div>
            </div>
            
            <!-- Right Column: Map -->
            <div class="map-column">
                <div id="map"></div>
            </div>
        </div>
    </div>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""><\/script>
    
    <script>
        let map = null;
        let markers = [];
        let userLocation = null;
        let userMarker = null;
        let routeLine = null;
        let selectedSupplier = null;
        
        // Initialize Map
        function initMap() {
            map = L.map('map').setView([39.8283, -98.5795], 4);
            
            // Using CartoDB Positron for a cleaner, less detailed look
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '\xA9 OpenStreetMap contributors \xA9 CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            // Automatically get user location on page load (GPS first, IP fallback)
            getUserLocationWithGPS();
        }
        
        // Get user location with GPS first, IP fallback
        async function getUserLocationWithGPS() {
            // First try GPS for precise location
            if (navigator.geolocation) {
                document.getElementById('resultsCount').textContent = 'Getting your precise location...';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        // Center map on user location
                        map.setView([userLocation.lat, userLocation.lng], 15); // Higher zoom for precise location
                        
                        // Add user marker
                        addUserMarker(true); // GPS = precise
                        
                        // Automatically search nearby
                        searchNearby();
                        
                        document.getElementById('resultsCount').textContent = 'Using your precise location';
                    },
                    (error) => {
                        console.log('GPS location failed, falling back to IP location:', error.message);
                        document.getElementById('resultsCount').textContent = 'GPS unavailable, using approximate location...';
                        
                        // Fall back to IP location
                        getIPLocation();
                    },
                    {
                        enableHighAccuracy: true, // Request high accuracy GPS
                        timeout: 10000, // 10 second timeout
                        maximumAge: 300000 // Accept cached position up to 5 minutes old
                    }
                );
            } else {
                console.log('Geolocation not supported, using IP location');
                document.getElementById('resultsCount').textContent = 'Using approximate location...';
                getIPLocation();
            }
        }
        
        // Get user location from IP
        async function getIPLocation() {
            try {
                const response = await fetch('/api/location');
                const data = await response.json();
                
                if (data.location && data.location.latitude && data.location.longitude) {
                    userLocation = {
                        lat: data.location.latitude,
                        lng: data.location.longitude
                    };
                    
                    // Center map on user location (lower zoom for IP-based location)
                    map.setView([userLocation.lat, userLocation.lng], 10);
                    
                    // Add user marker
                    addUserMarker(false); // IP = approximate
                    
                    // Automatically search nearby
                    await searchNearby();
                    
                    document.getElementById('resultsCount').textContent = 'Using approximate location (allow GPS for precise location)';
                }
            } catch (error) {
                console.error('IP location failed:', error);
                // Fall back to showing all suppliers
                loadAllSuppliers();
            }
        }
        
        // Add user location marker
        function addUserMarker(isPrecise = false) {
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            const popupText = isPrecise ? 'Your precise location (GPS)' : 'Your approximate location (IP-based)';
            
            userMarker = L.marker([userLocation.lat, userLocation.lng], {
                icon: createUserIcon(isPrecise)
            }).addTo(map).bindPopup(popupText);
        }
        
        // Load all suppliers on the map
        async function loadAllSuppliers() {
            try {
                const response = await fetch('/api/search?q=&limit=100');
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    displayResults(data.results, 'Showing all ' + data.results.length + ' suppliers');
                } else {
                    document.getElementById('resultsCount').textContent = 'No suppliers found in database';
                    console.error('No suppliers returned from database');
                }
            } catch (error) {
                console.error('Failed to load suppliers:', error);
                document.getElementById('resultsCount').textContent = 'Failed to load suppliers';
            }
        }
        
        // Dog bone marker icon for suppliers
        function createCustomIcon() {
            return L.divIcon({
                html: '<div style="background: #D4A574; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">\u{1F9B4}</div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18],
                className: 'custom-marker'
            });
        }
        
        // User location marker
        function createUserIcon(isPrecise = false) {
            const size = isPrecise ? 16 : 24; // Smaller for precise GPS, larger for approximate IP
            const color = isPrecise ? '#00aa00' : '#ff4444'; // Green for GPS, red for IP
            const title = isPrecise ? 'Your precise location' : 'Your approximate location';
            
            return L.divIcon({
                html: '<div style="background: ' + color + '; width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;" title="' + title + '"></div>',
                iconSize: [size, size],
                iconAnchor: [size/2, size/2],
                className: 'user-marker'
            });
        }
        
        // Get user location via GPS
        function useMyLocation() {
            if (navigator.geolocation) {
                document.getElementById('resultsCount').textContent = 'Getting precise location...';
                
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        map.setView([userLocation.lat, userLocation.lng], 13);
                        
                        // Add user marker
                        addUserMarker(true); // GPS = precise
                        
                        await searchNearby();
                    },
                    (error) => {
                        document.getElementById('resultsCount').textContent = 'GPS location denied, using IP location';
                        // Fall back to IP location
                        if (!userLocation) {
                            getIPLocation();
                        }
                    }
                );
            }
        }
        
        // Draw route line from user to supplier
        function drawRoute(supplierLat, supplierLng) {
            // Remove existing route
            if (routeLine) {
                map.removeLayer(routeLine);
            }
            
            if (!userLocation) return;
            
            // Create route line
            routeLine = L.polyline([
                [userLocation.lat, userLocation.lng],
                [supplierLat, supplierLng]
            ], {
                color: '#D4A574',
                weight: 5,
                opacity: 0.9,
                dashArray: '10, 10',
                className: 'route-line'
            }).addTo(map);
            
            // Fit map to show both points
            const bounds = L.latLngBounds([
                [userLocation.lat, userLocation.lng],
                [supplierLat, supplierLng]
            ]);
            map.fitBounds(bounds.pad(0.1));
        }
        
        // Generate navigation URLs
        function generateNavigationURLs(supplierLat, supplierLng, supplierName, supplierAddress) {
            if (!userLocation) return null;
            
            const origin = userLocation.lat + ',' + userLocation.lng;
            const destination = supplierLat + ',' + supplierLng;
            const encodedName = encodeURIComponent(supplierName);
            const encodedAddress = encodeURIComponent(supplierAddress);
            
            return {
                google: 'https://maps.google.com/maps?saddr=' + origin + '&daddr=' + destination + '&dirflg=d',
                waze: 'https://waze.com/ul?ll=' + destination + '&navigate=yes&from=' + origin,
                apple: 'http://maps.apple.com/?saddr=' + origin + '&daddr=' + destination + '&dirflg=d'
            };
        }
        
        // Generate navigation buttons HTML
        function generateNavigationButtons(supplierLat, supplierLng, supplierName, supplierAddress) {
            if (!userLocation || !supplierLat || !supplierLng) {
                return '<div class="navigation-buttons"><small style="color: #666;">Enable location for navigation</small></div>';
            }
            
            const urls = generateNavigationURLs(supplierLat, supplierLng, supplierName, supplierAddress);
            
            return '<div class="navigation-buttons">' +
                '<a href="' + urls.google + '" target="_blank" class="nav-button nav-google" onclick="event.stopPropagation();">Google</a>' +
                '<a href="' + urls.waze + '" target="_blank" class="nav-button nav-waze" onclick="event.stopPropagation();">Waze</a>' +
                '<a href="' + urls.apple + '" target="_blank" class="nav-button nav-apple" onclick="event.stopPropagation();">Apple</a>' +
            '</div>';
        }
        
        // Search functionality
        async function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;
            
            document.getElementById('resultsCount').textContent = 'Searching...';
            document.getElementById('resultsContainer').innerHTML = '<div class="loading">Searching for suppliers...</div>';
            
            try {
                const response = await fetch('/api/search?q=' + encodeURIComponent(query) + '&limit=20');
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    displayResults(data.results, 'Found ' + data.results.length + ' suppliers for "' + query + '"');
                } else {
                    document.getElementById('resultsCount').textContent = 'No results found';
                    document.getElementById('resultsContainer').innerHTML = '<div class="loading">No suppliers found. Try a different search.</div>';
                }
            } catch (error) {
                document.getElementById('resultsCount').textContent = 'Search failed';
                document.getElementById('resultsContainer').innerHTML = '<div class="loading">Search failed. Please try again.</div>';
            }
        }
        
        // Nearby search
        async function searchNearby() {
            if (!userLocation) return;
            
            document.getElementById('resultsCount').textContent = 'Finding suppliers near you...';
            document.getElementById('resultsContainer').innerHTML = '<div class="loading">Finding nearby suppliers...</div>';
            
            try {
                const response = await fetch('/api/nearby?lat=' + userLocation.lat + '&lng=' + userLocation.lng + '&radius=25&limit=15');
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    displayResults(data.results, 'Found ' + data.results.length + ' suppliers near you');
                } else {
                    document.getElementById('resultsCount').textContent = 'No nearby suppliers found';
                    document.getElementById('resultsContainer').innerHTML = '<div class="loading">No suppliers found within 25 miles.</div>';
                }
            } catch (error) {
                document.getElementById('resultsCount').textContent = 'Nearby search failed';
                document.getElementById('resultsContainer').innerHTML = '<div class="loading">Search failed. Please try again.</div>';
            }
        }
        
        // Find closest supplier and route
        async function findRoute() {
            if (!userLocation) {
                await useMyLocation();
            }
            
            if (!userLocation) {
                alert('Unable to determine your location. Please enable location services.');
                return;
            }
            
            document.getElementById('resultsCount').textContent = 'Finding closest supplier...';
            document.getElementById('resultsContainer').innerHTML = '<div class="loading">Finding closest supplier...</div>';
            
            try {
                // Get nearby suppliers (limit 1 to get the closest)
                const response = await fetch('/api/nearby?lat=' + userLocation.lat + '&lng=' + userLocation.lng + '&radius=50&limit=1');
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    const closestSupplier = data.results[0];
                    displayResults([closestSupplier], 'Closest supplier - ' + (closestSupplier.distance_miles ? Math.round(closestSupplier.distance_miles * 10) / 10 + ' miles away' : ''));
                    
                    // Automatically draw route to the closest supplier
                    if (closestSupplier.latitude && closestSupplier.longitude) {
                        drawRoute(closestSupplier.latitude, closestSupplier.longitude);
                        selectedSupplier = closestSupplier;
                        
                        // Highlight the supplier card
                        setTimeout(() => {
                            const card = document.querySelector('.supplier-card');
                            if (card) {
                                card.style.borderColor = '#D4A574';
                                card.style.borderWidth = '2px';
                            }
                        }, 100);
                    }
                } else {
                    document.getElementById('resultsCount').textContent = 'No suppliers found';
                    document.getElementById('resultsContainer').innerHTML = '<div class="loading">No suppliers found within 50 miles.</div>';
                }
            } catch (error) {
                console.error('Failed to find closest supplier:', error);
                document.getElementById('resultsCount').textContent = 'Search failed';
                document.getElementById('resultsContainer').innerHTML = '<div class="loading">Failed to find closest supplier. Please try again.</div>';
            }
        }
        
        // Display results
        function displayResults(suppliers, title) {
            document.getElementById('resultsCount').textContent = title;
            
            const container = document.getElementById('resultsContainer');
            container.innerHTML = '';
            
            // Clear existing markers
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
            
            suppliers.forEach((supplier, index) => {
                const card = document.createElement('div');
                card.className = 'supplier-card';
                card.setAttribute('data-supplier-id', supplier.id || index);
                
                let distanceInfo = '';
                if (supplier.distance) {
                    distanceInfo = '<div class="supplier-distance">\u{1F4CD} ' + supplier.distance.miles + ' miles away</div>';
                } else if (supplier.distance_miles) {
                    distanceInfo = '<div class="supplier-distance">\u{1F4CD} ' + Math.round(supplier.distance_miles * 10) / 10 + ' miles away</div>';
                }
                
                card.innerHTML = 
                    '<div class="supplier-name">' + supplier.name + '</div>' +
                    '<div class="supplier-address">' + (supplier.address || 'Address not available') + '</div>' +
                    distanceInfo +
                    '<div class="supplier-rating">\u2B50 ' + (supplier.rating || 'No rating') + ' (' + (supplier.user_ratings_total || 0) + ' reviews)</div>' +
                    '<div class="supplier-contact">' +
                        (supplier.phone_number ? '<a href="tel:' + supplier.phone_number + '" class="contact-link" onclick="event.stopPropagation();">\u{1F4DE} Call</a>' : '') +
                        (supplier.website ? '<a href="' + supplier.website + '" target="_blank" class="contact-link" onclick="event.stopPropagation();">\u{1F310} Website</a>' : '') +
                    '</div>' +
                    generateNavigationButtons(supplier.latitude, supplier.longitude, supplier.name, supplier.address || 'Address not available');
                
                // Add click handler to draw route
                card.addEventListener('click', function() {
                    if (supplier.latitude && supplier.longitude) {
                        // Remove previous selection
                        document.querySelectorAll('.supplier-card').forEach(c => c.style.borderColor = '#E8DCC6');
                        // Highlight this card
                        card.style.borderColor = '#D4A574';
                        card.style.borderWidth = '2px';
                        // Draw route
                        drawRoute(supplier.latitude, supplier.longitude);
                        selectedSupplier = supplier;
                    }
                });
                
                container.appendChild(card);
                
                // Add to map if coordinates available
                if (supplier.latitude && supplier.longitude) {
                    const marker = L.marker([supplier.latitude, supplier.longitude], {
                        icon: createCustomIcon()
                    }).addTo(map);
                    
                    let popupContent = '<strong>' + supplier.name + '</strong><br>' + (supplier.address || 'Address not available');
                    if (distanceInfo) {
                        popupContent += '<br>' + distanceInfo.replace(/<[^>]*>/g, '');
                    }
                    
                    marker.bindPopup(popupContent);
                    
                    // Add click handler to marker
                    marker.on('click', function() {
                        // Remove previous selection
                        document.querySelectorAll('.supplier-card').forEach(c => c.style.borderColor = '#E8DCC6');
                        // Find and highlight the corresponding card
                        const correspondingCard = document.querySelector('[data-supplier-id="' + (supplier.id || index) + '"]');
                        if (correspondingCard) {
                            correspondingCard.style.borderColor = '#D4A574';
                            correspondingCard.style.borderWidth = '2px';
                            correspondingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                        // Draw route
                        drawRoute(supplier.latitude, supplier.longitude);
                        selectedSupplier = supplier;
                    });
                    
                    markers.push(marker);
                }
            });
            
            // Fit map to show all markers
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            initMap();
            
            // Enter key support
            document.getElementById('searchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        });
    <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleMainApp, "handleMainApp");
function getContentType(path) {
  if (path.endsWith(".png"))
    return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg"))
    return "image/jpeg";
  if (path.endsWith(".ico"))
    return "image/x-icon";
  if (path.endsWith(".svg"))
    return "image/svg+xml";
  if (path.endsWith(".css"))
    return "text/css";
  if (path.endsWith(".js"))
    return "application/javascript";
  return "application/octet-stream";
}
__name(getContentType, "getContentType");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-d8ukRv/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = rawgle_worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-d8ukRv/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=rawgle-worker.js.map
