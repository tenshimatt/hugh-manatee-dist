// Google Places API Multi-Key Scraper
// Manages 2 API keys with free tier limits (1000 calls/day each)

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class GooglePlacesScraper {
  constructor() {
    // API keys from environment variables with strict free tier management
    const googleApiKeys = process.env.GOOGLE_PLACES_API_KEYS ? 
      process.env.GOOGLE_PLACES_API_KEYS.split(',') : [];
    
    if (googleApiKeys.length === 0) {
      throw new Error('GOOGLE_PLACES_API_KEYS environment variable is required. Set as comma-separated list of keys.');
    }

    this.apiKeys = googleApiKeys.map((key, index) => ({
      key: key.trim(),
      account: `account_${index + 1}`,
      dailyLimit: 1000, // Standard free tier limit
      used: 0
    }));
    
    this.currentKeyIndex = 0;
    this.results = [];
    this.errors = [];
    
    // Search configuration
    this.searchTerms = [
      'raw dog food store',
      'pet nutrition center', 
      'holistic pet food',
      'natural dog food shop',
      'raw pet food supplier'
    ];
    
    // Top US cities for targeted search
    this.cities = [
      { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
      { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
      { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
      { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
      { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
      { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
      { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
      { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
      { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
      { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
      { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 }
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
      `fields=name,rating,formatted_phone_number,website,formatted_address,geometry,opening_hours,price_level,user_ratings_total,types&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    return data?.result || null;
  }
  
  async scrapeCity(city, searchTerm) {
    console.log(`\n🏙️  Scraping ${city.name}, ${city.state} for "${searchTerm}"`);
    
    const location = `${city.name}, ${city.state}`;
    const places = await this.searchPlaces(searchTerm, location);
    
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
        place_type: 'pet_store',
        tile_lat: city.lat,
        tile_lon: city.lng,
        raw_data: JSON.stringify(details),
        created_at: new Date().toISOString()
      };
      
      this.results.push(combinedData);
      console.log(`✅ Added: ${combinedData.name} (${combinedData.rating}⭐)`);
      
      // Rate limiting between detail calls
      await this.sleep(500);
      
      // Check if we're approaching limits
      if (this.getTotalCalls() >= 1900) { // Leave buffer before 2000 total
        console.log(`🛑 Approaching daily limits. Stopping for today.`);
        return;
      }
    }
    
    // Rate limiting between cities
    await this.sleep(1000);
  }
  
  async scrapeAll() {
    console.log(`🚀 Starting Google Places scraper with ${this.apiKeys.length} API keys`);
    console.log(`📊 Daily limits: ${this.apiKeys.map(k => `${k.account}: ${k.dailyLimit}`).join(', ')}`);
    
    const startTime = Date.now();
    
    for (const city of this.cities) {
      for (const term of this.searchTerms) {
        await this.scrapeCity(city, term);
        
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
    
    console.log(`\n📈 Scraping completed in ${duration}s`);
    console.log(`📊 Total API calls: ${this.getTotalCalls()}`);
    console.log(`🏪 Total places found: ${this.results.length}`);
    console.log(`❌ Errors encountered: ${this.errors.length}`);
    
    // Save final results
    this.saveResults();
    this.saveSession();
  }
  
  saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `scraped_places_${timestamp}_${this.results.length}.csv`;
    
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
    console.log(`💾 Saved ${this.results.length} results to ${filename}`);
    
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
