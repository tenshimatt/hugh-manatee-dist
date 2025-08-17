// Complete Google Places API Scraper - ALL FIELDS
// Updated to use exact Google Places API field names

const axios = require('axios');
const fs = require('fs');

class CompleteGooglePlacesScraper {
  constructor() {
    this.apiKeys = [
      {
        key: 'AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg',
        account: 'tenshimatt@gmail.com',
        dailyLimit: 1000,
        used: 0
      },
      {
        key: 'AIzaSyBnvRVRCE8ixANqhHCS99MQtlUBmlFr7Mk', 
        account: 'mw@samuelandcotrading.com',
        dailyLimit: 950,
        used: 0
      }
    ];
    
    this.currentKeyIndex = 0;
    this.results = [];
    this.searchTerm = 'raw dog food';
    
    // ALL Google Places API fields (exact field names)
    this.allPlacesFields = [
      // Basic Information
      'place_id',
      'name',
      'types',
      'formatted_address',
      'address_components',
      'adr_address',
      'vicinity',
      'geometry',
      'plus_code',
      
      // Contact Information
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'url',
      
      // Business Status & Hours
      'business_status',
      'opening_hours',
      'current_opening_hours',
      'secondary_opening_hours',
      'utc_offset',
      
      // Ratings & Reviews
      'rating',
      'user_ratings_total',
      'reviews',
      'editorial_summary',
      
      // Pricing & Services
      'price_level',
      'delivery',
      'dine_in',
      'takeout',
      'reservable',
      'serves_breakfast',
      'serves_lunch',
      'serves_dinner',
      'serves_brunch',
      'serves_beer',
      'serves_wine',
      'serves_vegetarian_food',
      'curbside_pickup',
      'wheelchair_accessible_entrance',
      
      // Visual & Media
      'photos',
      'icon',
      'icon_mask_base_uri',
      'icon_background_color'
    ].join(',');
    
    this.cities = [
      { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
      { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
      { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
      { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
      { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
      { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
      { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
      { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
      { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
      { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
      { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
      { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
      { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
      { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
      { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 }
    ];
    
    this.loadSession();
  }
  
  getCurrentApiKey() {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    if (currentKey.used >= currentKey.dailyLimit) {
      console.log(`⚠️  API key for ${currentKey.account} reached daily limit (${currentKey.used}/${currentKey.dailyLimit})`);
      
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const nextKey = this.apiKeys[this.currentKeyIndex];
      
      if (nextKey.used >= nextKey.dailyLimit) {
        console.log(`🛑 All API keys exhausted for today. Total calls made: ${this.getTotalCalls()}`);
        return null;
      }
      
      console.log(`🔄 Switching to API key: ${nextKey.account}`);
      return nextKey;
    }
    
    return currentKey;
  }
  
  getTotalCalls() {
    return this.apiKeys.reduce((total, key) => total + key.used, 0);
  }
  
  async makeApiCall(url, keyObj) {
    try {
      const response = await axios.get(url, { timeout: 15000 });
      keyObj.used++;
      
      if (keyObj.used % 25 === 0) {
        this.saveSession();
      }
      
      console.log(`📞 API call #${this.getTotalCalls()} - ${keyObj.account} (${keyObj.used}/${keyObj.dailyLimit})`);
      return response.data;
    } catch (error) {
      console.error(`❌ API Error:`, error.response?.data || error.message);
      return null;
    }
  }
  
  async searchPlaces(location) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return [];
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(this.searchTerm + ' ' + location)}&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    if (!data || !data.results) return [];
    
    console.log(`🔍 Found ${data.results.length} places for "${this.searchTerm}" in ${location}`);
    return data.results;
  }
  
  async getCompleteDetails(placeId) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return null;
    
    // ALL Google Places API fields
    const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=${this.allPlacesFields}&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    return data?.result || null;
  }
  
  processCompleteData(details, city) {
    // Helper function to safely stringify JSON data
    const safeStringify = (obj) => {
      if (!obj) return null;
      try {
        return JSON.stringify(obj);
      } catch (error) {
        console.warn('JSON stringify error:', error);
        return null;
      }
    };
    
    // Extract location data
    const location = details.geometry?.location || {};
    const lat = location.lat || null;
    const lng = location.lng || null;
    
    // Extract postal code from address components
    const postalCode = details.address_components?.find(
      component => component.types.includes('postal_code')
    )?.long_name || null;
    
    return {
      // Primary keys and basic info
      id: this.generateUUID(),
      place_id: details.place_id,
      name: details.name,
      types: safeStringify(details.types),
      
      // Address information (matching Google API field names)
      formatted_address: details.formatted_address,
      address_components: safeStringify(details.address_components),
      adr_address: details.adr_address,
      vicinity: details.vicinity,
      postal_code: postalCode,
      
      // Custom location fields (for our app)
      city: city.name,
      state: city.state,
      country: 'USA',
      
      // Geometry and location
      latitude: lat,
      longitude: lng,
      geometry: safeStringify(details.geometry),
      plus_code: safeStringify(details.plus_code),
      
      // Contact information (exact API field names)
      formatted_phone_number: details.formatted_phone_number,
      international_phone_number: details.international_phone_number,
      website: details.website,
      url: details.url, // Google Maps URL
      
      // Business status and hours
      business_status: details.business_status,
      opening_hours: safeStringify(details.opening_hours),
      current_opening_hours: safeStringify(details.current_opening_hours),
      secondary_opening_hours: safeStringify(details.secondary_opening_hours),
      utc_offset: details.utc_offset,
      
      // Ratings and reviews
      rating: details.rating || 0,
      user_ratings_total: details.user_ratings_total || 0,
      reviews: safeStringify(details.reviews),
      editorial_summary: details.editorial_summary,
      
      // Pricing and service options
      price_level: details.price_level,
      delivery: details.delivery,
      dine_in: details.dine_in,
      takeout: details.takeout,
      reservable: details.reservable,
      curbside_pickup: details.curbside_pickup,
      wheelchair_accessible_entrance: details.wheelchair_accessible_entrance,
      
      // Food service details
      serves_breakfast: details.serves_breakfast,
      serves_lunch: details.serves_lunch,
      serves_dinner: details.serves_dinner,
      serves_brunch: details.serves_brunch,
      serves_beer: details.serves_beer,
      serves_wine: details.serves_wine,
      serves_vegetarian_food: details.serves_vegetarian_food,
      
      // Visual and media
      photos: safeStringify(details.photos),
      icon: details.icon,
      icon_mask_base_uri: details.icon_mask_base_uri,
      icon_background_color: details.icon_background_color,
      
      // Metadata
      keyword: this.searchTerm,
      place_type: 'raw_dog_food_complete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      api_version: 'complete_v1.0'
    };
  }
  
  async scrapeCity(city) {
    console.log(`\n🏙️  Scraping ${city.name}, ${city.state} for COMPLETE "${this.searchTerm}" data`);
    
    const location = `${city.name}, ${city.state}`;
    const places = await this.searchPlaces(location);
    
    let cityResults = 0;
    
    for (const place of places) {
      // Check for duplicates
      const existing = this.results.find(r => r.place_id === place.place_id);
      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${place.name}`);
        continue;
      }
      
      // Get complete details with ALL fields
      const details = await this.getCompleteDetails(place.place_id);
      if (!details) continue;
      
      // Skip permanently closed businesses
      if (details.business_status === 'CLOSED_PERMANENTLY') {
        console.log(`🚫 Skipping closed business: ${details.name}`);
        continue;
      }
      
      // Process complete data
      const completeData = this.processCompleteData(details, city);
      this.results.push(completeData);
      cityResults++;
      
      const photosCount = details.photos?.length || 0;
      const reviewsCount = details.reviews?.length || 0;
      const hasHours = details.opening_hours ? '🕒' : '';
      const hasWebsite = details.website ? '🌐' : '';
      const hasPhone = details.formatted_phone_number ? '📞' : '';
      
      console.log(`✅ Complete: ${completeData.name} (${completeData.rating}⭐) ${hasHours}${hasWebsite}${hasPhone} - ${photosCount} photos, ${reviewsCount} reviews - #${cityResults} from ${city.name}`);
      
      // Rate limiting
      await this.sleep(300);
      
      // Check limits
      if (this.getTotalCalls() >= 1900) {
        console.log(`🛑 Approaching daily limits. Stopping for today.`);
        return cityResults;
      }
    }
    
    await this.sleep(500);
    return cityResults;
  }
  
  async scrapeAll() {
    console.log(`🚀 Starting COMPLETE Google Places scraper - ALL API FIELDS`);
    console.log(`🎯 Search term: "${this.searchTerm}"`);
    console.log(`🌎 Cities to cover: ${this.cities.length} locations`);
    console.log(`📊 API limits: ${this.apiKeys.map(k => `${k.account}: ${k.dailyLimit}`).join(', ')}`);
    console.log(`💎 Fields: ${this.allPlacesFields.split(',').length} complete API fields`);
    
    const startTime = Date.now();
    
    for (const city of this.cities) {
      await this.scrapeCity(city);
      
      // Progress updates
      if ((this.cities.indexOf(city) + 1) % 5 === 0) {
        const progress = Math.round(((this.cities.indexOf(city) + 1) / this.cities.length) * 100);
        console.log(`\n📈 Progress: ${progress}% complete (${this.results.length} complete suppliers, ${this.getTotalCalls()} API calls)`);
      }
      
      // Check limits
      if (this.getTotalCalls() >= 1900) {
        console.log(`\n🏁 Reached safe daily limit. Stopping for today.`);
        break;
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 COMPLETE Scraping finished in ${duration}s`);
    console.log(`📞 Total API calls: ${this.getTotalCalls()}`);
    console.log(`🏪 Complete suppliers collected: ${this.results.length}`);
    console.log(`🌎 Cities covered: ${Math.min(this.cities.length, Math.floor(this.getTotalCalls() / 60))}`);
    console.log(`💎 Data completeness: Maximum possible from Google Places API`);
    
    this.saveResults();
    this.saveSession();
  }
  
  saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `complete_raw_dog_food_suppliers_${timestamp}_${this.results.length}.csv`;
    
    if (this.results.length === 0) {
      console.log('⚠️  No results to save');
      return;
    }
    
    // CSV export
    const headers = Object.keys(this.results[0]);
    const csvContent = [
      headers.join(','),
      ...this.results.map(row => 
        headers.map(header => {
          const value = (row[header] || '').toString().replace(/"/g, '""');
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 Saved ${this.results.length} COMPLETE suppliers to ${filename}`);
    
    // JSON export for structure reference
    fs.writeFileSync(filename.replace('.csv', '.json'), JSON.stringify(this.results, null, 2));
    console.log(`📋 Complete data structure saved to ${filename.replace('.csv', '.json')}`);
    
    // Save field mapping for database schema
    this.saveFieldMapping(headers);
  }
  
  saveFieldMapping(headers) {
    const fieldMapping = {
      database_schema_sql: this.generateDatabaseSchema(headers),
      google_api_fields: this.allPlacesFields.split(','),
      csv_headers: headers,
      generated_at: new Date().toISOString()
    };
    
    fs.writeFileSync('field_mapping.json', JSON.stringify(fieldMapping, null, 2));
    console.log(`🗂️  Database schema saved to field_mapping.json`);
  }
  
  generateDatabaseSchema(headers) {
    const fieldTypes = {
      // IDs and primary keys
      'id': 'TEXT PRIMARY KEY',
      'place_id': 'TEXT UNIQUE',
      
      // Numeric fields
      'latitude': 'REAL',
      'longitude': 'REAL',
      'rating': 'REAL',
      'user_ratings_total': 'INTEGER',
      'price_level': 'INTEGER',
      'utc_offset': 'INTEGER',
      
      // Boolean fields
      'delivery': 'BOOLEAN',
      'dine_in': 'BOOLEAN',
      'takeout': 'BOOLEAN',
      'reservable': 'BOOLEAN',
      'curbside_pickup': 'BOOLEAN',
      'wheelchair_accessible_entrance': 'BOOLEAN',
      'serves_breakfast': 'BOOLEAN',
      'serves_lunch': 'BOOLEAN',
      'serves_dinner': 'BOOLEAN',
      'serves_brunch': 'BOOLEAN',
      'serves_beer': 'BOOLEAN',
      'serves_wine': 'BOOLEAN',
      'serves_vegetarian_food': 'BOOLEAN',
      
      // Everything else is TEXT
      'default': 'TEXT'
    };
    
    const columns = headers.map(header => {
      const type = fieldTypes[header] || fieldTypes.default;
      return `  ${header} ${type}`;
    }).join(',\n');
    
    return `CREATE TABLE IF NOT EXISTS suppliers_complete (\n${columns}\n);`;
  }
  
  saveSession() {
    const sessionData = {
      apiKeys: this.apiKeys,
      currentKeyIndex: this.currentKeyIndex,
      totalResults: this.results.length,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync('session_complete.json', JSON.stringify(sessionData, null, 2));
  }
  
  loadSession() {
    try {
      if (fs.existsSync('session_complete.json')) {
        const sessionData = JSON.parse(fs.readFileSync('session_complete.json', 'utf8'));
        
        const today = new Date().toDateString();
        const sessionDate = new Date(sessionData.lastUpdated).toDateString();
        
        if (today === sessionDate) {
          this.apiKeys = sessionData.apiKeys;
          this.currentKeyIndex = sessionData.currentKeyIndex;
          console.log(`📂 Loaded session: ${this.getTotalCalls()} API calls used today`);
        } else {
          console.log(`🆕 New day - resetting API call counters`);
          this.apiKeys.forEach(key => key.used = 0);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not load session, starting fresh');
    }
  }
  
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new CompleteGooglePlacesScraper();
  await scraper.scrapeAll();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteGooglePlacesScraper;
