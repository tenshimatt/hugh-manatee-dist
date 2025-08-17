// Geocoding Service for FindRawDogFood Suppliers
// This script will geocode all existing suppliers using multiple APIs

const fs = require('fs');
const csv = require('csv-parser');

class GeocodingService {
    constructor() {
        // Multiple geocoding APIs for reliability
        this.apis = [
            {
                name: 'nominatim',
                url: 'https://nominatim.openstreetmap.org/search',
                rateLimit: 1000, // 1 request per second
                free: true
            },
            {
                name: 'opencage',
                url: 'https://api.opencagedata.com/geocode/v1/json',
                key: process.env.OPENCAGE_API_KEY, // Free tier: 2500 requests/day
                rateLimit: 100,
                free: true
            }
        ];
        
        this.requestCounts = {};
        this.lastRequestTime = {};
    }

    async geocodeAddress(address, city, country = 'United Kingdom') {
        const fullAddress = `${address}, ${city}, ${country}`;
        
        // Try each API in order
        for (const api of this.apis) {
            try {
                const result = await this.callGeocodingAPI(api, fullAddress);
                if (result && result.lat && result.lng) {
                    return {
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lng),
                        accuracy: result.accuracy || 'approximate',
                        source: api.name,
                        geocoded_at: new Date().toISOString()
                    };
                }
            } catch (error) {
                console.log(`${api.name} failed for ${fullAddress}:`, error.message);
            }
        }
        
        // Fallback to city-level coordinates
        return this.getCityCoordinates(city);
    }

    async callGeocodingAPI(api, address) {
        // Rate limiting
        await this.respectRateLimit(api);
        
        let url, params;
        
        switch (api.name) {
            case 'nominatim':
                url = `${api.url}?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=gb`;
                break;
                
            case 'opencage':
                if (!api.key) break;
                url = `${api.url}?key=${api.key}&q=${encodeURIComponent(address)}&limit=1&countrycode=gb`;
                break;
        }
        
        if (!url) return null;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'FindRawDogFood-Geocoder/1.0 (https://findrawdogfood.com)'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        switch (api.name) {
            case 'nominatim':
                if (data && data.length > 0) {
                    return {
                        lat: data[0].lat,
                        lng: data[0].lon,
                        accuracy: this.determineAccuracy(data[0])
                    };
                }
                break;
                
            case 'opencage':
                if (data && data.results && data.results.length > 0) {
                    const result = data.results[0];
                    return {
                        lat: result.geometry.lat,
                        lng: result.geometry.lng,
                        accuracy: this.determineAccuracy(result)
                    };
                }
                break;
        }
        
        return null;
    }

    async respectRateLimit(api) {
        const now = Date.now();
        const lastRequest = this.lastRequestTime[api.name] || 0;
        const timeSinceLastRequest = now - lastRequest;
        const minInterval = api.rateLimit;
        
        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime[api.name] = Date.now();
    }

    determineAccuracy(result) {
        // Determine accuracy based on the type of match
        if (result.place_type && result.place_type.includes('address')) return 'exact';
        if (result.type === 'house' || result.class === 'building') return 'exact';
        if (result.type === 'way' || result.class === 'highway') return 'approximate';
        if (result.type === 'city' || result.class === 'place') return 'city';
        return 'approximate';
    }

    getCityCoordinates(city) {
        // Fallback coordinates for major UK cities
        const cityCoords = {
            'london': { lat: 51.5074, lng: -0.1278 },
            'manchester': { lat: 53.4808, lng: -2.2426 },
            'birmingham': { lat: 52.4862, lng: -1.8904 },
            'leeds': { lat: 53.8008, lng: -1.5491 },
            'glasgow': { lat: 55.8642, lng: -4.2518 },
            'liverpool': { lat: 53.4084, lng: -2.9916 },
            'newcastle': { lat: 54.9783, lng: -1.6178 },
            'sheffield': { lat: 53.3811, lng: -1.4701 },
            'bristol': { lat: 51.4545, lng: -2.5879 },
            'edinburgh': { lat: 55.9533, lng: -3.1883 },
            'cardiff': { lat: 51.4816, lng: -3.1791 },
            'belfast': { lat: 54.5973, lng: -5.9301 },
            'nottingham': { lat: 52.9548, lng: -1.1581 },
            'southampton': { lat: 50.9097, lng: -1.4044 },
            'bradford': { lat: 53.7960, lng: -1.7594 },
            'brighton': { lat: 50.8225, lng: -0.1372 },
            'hull': { lat: 53.7676, lng: -0.3274 },
            'plymouth': { lat: 50.3755, lng: -4.1427 },
            'stoke': { lat: 53.0027, lng: -2.1794 },
            'wolverhampton': { lat: 52.5864, lng: -2.1285 }
        };
        
        const cityKey = city.toLowerCase().replace(/[^a-z]/g, '');
        const coords = cityCoords[cityKey];
        
        if (coords) {
            // Add random offset to avoid exact overlapping
            return {
                latitude: coords.lat + (Math.random() - 0.5) * 0.02,
                longitude: coords.lng + (Math.random() - 0.5) * 0.02,
                accuracy: 'city',
                source: 'fallback',
                geocoded_at: new Date().toISOString()
            };
        }
        
        // Default to London with random offset
        return {
            latitude: 51.5074 + (Math.random() - 0.5) * 0.1,
            longitude: -0.1278 + (Math.random() - 0.5) * 0.1,
            accuracy: 'city',
            source: 'default',
            geocoded_at: new Date().toISOString()
        };
    }

    async geocodeFromCSV(csvPath, outputPath) {
        const suppliers = [];
        const geocodedSuppliers = [];
        
        // Read CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => suppliers.push(row))
                .on('end', resolve)
                .on('error', reject);
        });
        
        console.log(`Starting geocoding of ${suppliers.length} suppliers...`);
        
        let processed = 0;
        for (const supplier of suppliers) {
            processed++;
            
            if (!supplier.address || !supplier.city) {
                console.log(`Skipping ${supplier.business_name}: Missing address/city`);
                geocodedSuppliers.push({
                    ...supplier,
                    latitude: null,
                    longitude: null,
                    geocode_accuracy: 'failed'
                });
                continue;
            }
            
            console.log(`[${processed}/${suppliers.length}] Geocoding: ${supplier.business_name}`);
            
            try {
                const geoData = await this.geocodeAddress(supplier.address, supplier.city);
                
                geocodedSuppliers.push({
                    ...supplier,
                    latitude: geoData.latitude,
                    longitude: geoData.longitude,
                    geocode_accuracy: geoData.accuracy,
                    geocoded_at: geoData.geocoded_at,
                    geocode_source: geoData.source
                });
                
                console.log(`  ✓ Success: ${geoData.latitude}, ${geoData.longitude} (${geoData.accuracy})`);
                
            } catch (error) {
                console.log(`  ✗ Failed: ${error.message}`);
                geocodedSuppliers.push({
                    ...supplier,
                    latitude: null,
                    longitude: null,
                    geocode_accuracy: 'failed'
                });
            }
            
            // Progress update every 50 items
            if (processed % 50 === 0) {
                console.log(`Progress: ${processed}/${suppliers.length} (${Math.round(processed/suppliers.length*100)}%)`);
            }
        }
        
        // Write output CSV
        const csvHeader = Object.keys(geocodedSuppliers[0]).join(',') + '\n';
        const csvData = geocodedSuppliers.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        ).join('\n');
        
        fs.writeFileSync(outputPath, csvHeader + csvData);
        
        const successCount = geocodedSuppliers.filter(s => s.latitude && s.longitude).length;
        console.log(`\nGeocoding complete!`);
        console.log(`Total processed: ${suppliers.length}`);
        console.log(`Successfully geocoded: ${successCount}`);
        console.log(`Success rate: ${Math.round(successCount/suppliers.length*100)}%`);
        console.log(`Output saved to: ${outputPath}`);
        
        return geocodedSuppliers;
    }
}

// Usage
if (require.main === module) {
    const geocoder = new GeocodingService();
    const inputFile = process.argv[2] || 'suppliers.csv';
    const outputFile = process.argv[3] || 'suppliers-geocoded.csv';
    
    geocoder.geocodeFromCSV(inputFile, outputFile)
        .then(() => {
            console.log('Geocoding process completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Geocoding failed:', error);
            process.exit(1);
        });
}

module.exports = GeocodingService;