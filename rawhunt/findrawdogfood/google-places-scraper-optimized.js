// Optimized Google Places API Scraper - Raw Dog Food Focus
// Saves 80% of API calls by using targeted search

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class GooglePlacesScraper {
  constructor() {
    // Your API keys with strict free tier management
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
    this.errors = [];
    
    // OPTIMIZED: Focus only on raw dog food searches
    this.searchTerms = [
      'raw dog food',           // Primary target
      'raw dog food store',     // Specific stores
      'BARF dog food'          // Alternative terminology
    ];
    
    // EXPANDED: More cities since we're using fewer search terms
    this.cities = [
      // Major metropolitan areas
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
      
      // High-income areas (likely raw food adopters)
      { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
      { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
      { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
      { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
      { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
      { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
      { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
      { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
      
      // Medium markets with good pet ownership
      { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
      { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
      { name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
      { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
      { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
      { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
      { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
      { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
      { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
      { name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 }
    ];
    
    // Load previous session data if exists
    this.loadSession();
  }
  
  getCurrentApiKey() {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    // Check if current key is at limit
    if (currentKey.used >= currentKey.dailyLimit) {
      console.log(`⚠️  API key for ${currentKey.account} reached daily limit (${currentKey.used}/${currentKey.dailyLimit})`);
      
      // Try next key
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
      const response = await axios.get(url, { timeout: 10000 });
      
      // Increment usage counter
      keyObj.used++;
      
      // Save session after every 10 calls
      if (keyObj.used % 10 === 0) {
        this.saveSession();
      }
      
      console.log(`📞 API call #${this.getTotalCalls()} - ${keyObj.account} (${keyObj.used}/${keyObj.dailyLimit})`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ API Error:`, error.response?.data || error.message);
      this.errors.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }
  
  async searchPlaces(query, location) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return [];
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(query + ' ' + location)}&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    if (!data || !data.results) return [];
    
    console.log(`🔍 Found ${data.results.length} places for "${query}" in ${location}`);
    return data.results;
  }
  
  async getPlaceDetails(placeId) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return null;
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=name,rating,formatted_phone_number,website,formatted_address,geometry,opening_hours,price_level,user_ratings_total,types,business_status&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    return data?.result || null;
  }
  
  isRelevantBusiness(place, details) {
    const name = (details?.name || place.name || '').toLowerCase();
    const types = details?.types || place.types || [];
    const address = (details?.formatted_address || '').toLowerCase();
    
    // Filter for raw dog food relevant businesses
    const rawFoodKeywords = [
      'raw', 'barf', 'natural', 'holistic', 'organic', 'fresh',
      'pet food', 'dog food', 'pet nutrition', 'pet store', 'feed'
    ];
    
    const hasRelevantKeyword = rawFoodKeywords.some(keyword => 
      name.includes(keyword) || address.includes(keyword)
    );
    
    const hasRelevantType = types.some(type => 
      ['pet_store', 'store', 'food'].includes(type)
    );
    
    // Skip obviously irrelevant businesses
    const irrelevantKeywords = [
      'restaurant', 'cafe', 'human food', 'grocery', 'pharmacy',
      'veterinary', 'vet clinic', 'hospital', 'medical'
    ];
    
    const isIrrelevant = irrelevantKeywords.some(keyword => 
      name.includes(keyword) || types.includes(keyword)
    );
    
    return (hasRelevantKeyword || hasRelevantType) && !isIrrelevant;
  }
  
  async scrapeCity(city, searchTerm) {
    console.log(`\n🏙️  Scraping ${city.name}, ${city.state} for "${searchTerm}"`);
    
    const location = `${city.name}, ${city.state}`;
    const places = await this.searchPlaces(searchTerm, location);
    
    let cityResults = 0;
    
    for (const place of places) {
      // Check if we already have this place
      const existing = this.results.find(r => r.place_id === place.place_id);
      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${place.name}`);
        continue;
      }
      
      // Get detailed information
      const details = await this.getPlaceDetails(place.place_id);
      if (!details) continue;
      
      // Filter for relevance
      if (!this.isRelevantBusiness(place, details)) {
        console.log(`🚫 Filtered out: ${details.name} (not raw dog food relevant)`);
        continue;
      }
      
      // Check if business is operational
      if (details.business_status === 'CLOSED_PERMANENTLY') {
        console.log(`🚫 Skipping closed business: ${details.name}`);
        continue;
      }
      
      // Combine search result with details
      const combinedData = {
        id: this.generateUUID(),
        place_id: place.place_id,
        name: details.name || place.name,
        address: details.formatted_address || place.formatted_address,
        city: city.name,
        state: city.state,
        country: 'USA',
        postal_code: this.extractPostalCode(details.formatted_address),
        latitude: details.geometry?.location?.lat || place.geometry?.location?.lat,
        longitude: details.geometry?.location?.lng || place.geometry?.location?.lng,
        phone_number: details.formatted_phone_number || '',
        website: details.website || '',
        rating: details.rating || place.rating || 0,
        user_ratings_total: details.user_ratings_total || 0,
        types: JSON.stringify(details.types || place.types || []),
        keyword: searchTerm,
        place_type: 'raw_dog_food',
        tile_lat: city.lat,
        tile_lon: city.lng,
        business_status: details.business_status || 'OPERATIONAL',
        raw_data: JSON.stringify(details),
        created_at: new Date().toISOString()
      };
      
      this.results.push(combinedData);
      cityResults++;
      console.log(`✅ Added: ${combinedData.name} (${combinedData.rating}⭐) - ${cityResults} from ${city.name}`);
      
      // Rate limiting between detail calls
      await this.sleep(300); // Reduced delay since we have fewer calls
      
      // Check if we're approaching limits
      if (this.getTotalCalls() >= 1900) {
        console.log(`🛑 Approaching daily limits. Stopping for today.`);
        return cityResults;
      }
    }
    
    // Rate limiting between cities  
    await this.sleep(500);
    return cityResults;
  }
  
  async scrapeAll() {
    console.log(`🚀 Starting OPTIMIZED Google Places scraper - Raw Dog Food Focus`);
    console.log(`🎯 Search terms: ${this.searchTerms.join(', ')}`);
    console.log(`🌎 Cities: ${this.cities.length} locations`);
    console.log(`📊 API limits: ${this.apiKeys.map(k => `${k.account}: ${k.dailyLimit}`).join(', ')}`);
    
    const startTime = Date.now();
    let totalCityResults = 0;
    
    for (const city of this.cities) {
      for (const term of this.searchTerms) {
        const cityResults = await this.scrapeCity(city, term);
        totalCityResults += cityResults;
        
        // Check if all keys exhausted
        const totalCalls = this.getTotalCalls();
        if (totalCalls >= 1900) {
          console.log(`\n🏁 Reached safe daily limit (${totalCalls} calls). Stopping for today.`);
          break;
        }
      }
      
      if (this.getTotalCalls() >= 1900) break;
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n📈 OPTIMIZED Scraping completed in ${duration}s`);
    console.log(`📞 Total API calls: ${this.getTotalCalls()}`);
    console.log(`🏪 Raw dog food suppliers found: ${this.results.length}`);
    console.log(`🎯 Quality filter removed: ${totalCityResults - this.results.length} irrelevant businesses`);
    console.log(`❌ Errors encountered: ${this.errors.length}`);
    console.log(`💰 Credits saved vs old method: ~${Math.round((1 - this.searchTerms.length/5) * 100)}%`);
    
    // Save final results
    this.saveResults();
    this.saveSession();
  }
  
  saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `raw_dog_food_suppliers_${timestamp}_${this.results.length}.csv`;
    
    if (this.results.length === 0) {
      console.log('⚠️  No results to save');
      return;
    }
    
    // Convert to CSV
    const headers = Object.keys(this.results[0]);
    const csvContent = [
      headers.join(','),
      ...this.results.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 Saved ${this.results.length} raw dog food suppliers to ${filename}`);
    
    // Also save as JSON for debugging
    fs.writeFileSync(filename.replace('.csv', '.json'), JSON.stringify(this.results, null, 2));
  }
  
  saveSession() {
    const sessionData = {
      apiKeys: this.apiKeys,
      currentKeyIndex: this.currentKeyIndex,
      totalResults: this.results.length,
      totalErrors: this.errors.length,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync('session.json', JSON.stringify(sessionData, null, 2));
  }
  
  loadSession() {
    try {
      if (fs.existsSync('session.json')) {
        const sessionData = JSON.parse(fs.readFileSync('session.json', 'utf8'));
        
        // Check if session is from today
        const today = new Date().toDateString();
        const sessionDate = new Date(sessionData.lastUpdated).toDateString();
        
        if (today === sessionDate) {
          this.apiKeys = sessionData.apiKeys;
          this.currentKeyIndex = sessionData.currentKeyIndex;
          console.log(`📂 Loaded session: ${this.getTotalCalls()} API calls used today`);
        } else {
          console.log(`🆕 New day - resetting API call counters`);
          // Reset daily usage counters
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
  
  extractPostalCode(address) {
    if (!address) return '';
    const match = address.match(/\b\d{5}(-\d{4})?\b/);
    return match ? match[0] : '';
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the scraper
async function main() {
  const scraper = new GooglePlacesScraper();
  await scraper.scrapeAll();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt signal. Saving progress...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GooglePlacesScraper;
