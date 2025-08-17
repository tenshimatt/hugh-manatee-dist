// Optimized Google Places Scraper - Reduced Duplicate Detection
// Focus on efficiency and new areas

const axios = require('axios');
const fs = require('fs');

class OptimizedScraper {
  constructor() {
    this.apiKeys = [
      {
        key: 'AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg',
        account: 'tenshimatt@gmail.com',
        dailyLimit: 1000,
        used: 190 // Current usage
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
    this.seenPlaceIds = new Set(); // Track place IDs to avoid duplicates
    
    // Load existing place IDs to avoid duplicates
    this.loadExistingPlaceIds();
    
    // More targeted, less overlapping search terms
    this.searchTerms = [
      'raw dog food store',
      'freeze dried dog food', 
      'BARF diet supplier',
      'holistic pet nutrition',
      'natural pet food market'
    ];
    
    // Focus on underrepresented areas
    this.cities = [
      // Mid-size cities with fewer pet stores
      { name: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023 },
      { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
      { name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
      { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
      { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
      { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
      { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
      { name: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.4360 },
      { name: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784 },
      { name: 'Providence', state: 'RI', lat: 41.8240, lng: -71.4128 },
      // Smaller but affluent areas (likely to have specialty pet stores)
      { name: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
      { name: 'Asheville', state: 'NC', lat: 35.5951, lng: -82.5515 },
      { name: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121 },
      { name: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012 },
      { name: 'Eugene', state: 'OR', lat: 44.0521, lng: -123.0868 }
    ];
  }
  
  loadExistingPlaceIds() {
    try {
      // Load from recent CSV files to avoid duplicates
      const files = fs.readdirSync('.').filter(f => f.startsWith('scraped_places_') && f.endsWith('.json'));
      
      for (const file of files) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        data.forEach(place => {
          if (place.place_id) {
            this.seenPlaceIds.add(place.place_id);
          }
        });
      }
      
      console.log(`📚 Loaded ${this.seenPlaceIds.size} existing place IDs to avoid duplicates`);
    } catch (error) {
      console.log('📝 Starting fresh - no existing data found');
    }
  }
  
  getCurrentApiKey() {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    if (currentKey.used >= currentKey.dailyLimit) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const nextKey = this.apiKeys[this.currentKeyIndex];
      
      if (nextKey.used >= nextKey.dailyLimit) {
        console.log(`🛑 All API keys exhausted. Total calls: ${this.getTotalCalls()}`);
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
      keyObj.used++;
      
      if (keyObj.used % 25 === 0) { // Save every 25 calls
        this.saveSession();
      }
      
      console.log(`📞 API call #${this.getTotalCalls()} - ${keyObj.account} (${keyObj.used}/${keyObj.dailyLimit})`);
      return response.data;
    } catch (error) {
      console.error(`❌ API Error:`, error.message);
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
    
    // Filter out duplicates BEFORE making detail calls
    const newPlaces = data.results.filter(place => !this.seenPlaceIds.has(place.place_id));
    
    console.log(`🔍 Found ${data.results.length} places, ${newPlaces.length} new for "${query}" in ${location}`);
    return newPlaces;
  }
  
  async getPlaceDetails(placeId) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return null;
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=name,rating,formatted_phone_number,website,formatted_address,geometry,user_ratings_total,types&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    return data?.result || null;
  }
  
  async scrapeCity(city, searchTerm) {
    console.log(`\\n🏙️  Scraping ${city.name}, ${city.state} for "${searchTerm}"`);
    
    const location = `${city.name}, ${city.state}`;
    const places = await this.searchPlaces(searchTerm, location);
    
    if (places.length === 0) {
      console.log(`⏭️  No new places found, skipping details calls`);
      return;
    }
    
    for (const place of places) {
      // Mark as seen immediately
      this.seenPlaceIds.add(place.place_id);
      
      // Get detailed information
      const details = await this.getPlaceDetails(place.place_id);
      if (!details) continue;
      
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
        raw_data: JSON.stringify(details),
        created_at: new Date().toISOString()
      };
      
      this.results.push(combinedData);
      console.log(`✅ Added: ${combinedData.name} (${combinedData.rating}⭐)`);
      
      // Rate limiting
      await this.sleep(300);
      
      // Stop if approaching limits
      if (this.getTotalCalls() >= 1800) {
        console.log(`🛑 Approaching daily limits. Stopping.`);
        return;
      }
    }
  }
  
  async scrapeAll() {
    console.log(`🚀 Starting optimized scraper`);
    console.log(`📊 Current usage: ${this.getTotalCalls()} calls`);
    console.log(`🗂️  Known places: ${this.seenPlaceIds.size}`);
    
    const startTime = Date.now();
    
    for (const city of this.cities) {
      for (const term of this.searchTerms) {
        await this.scrapeCity(city, term);
        
        if (this.getTotalCalls() >= 1800) break;
      }
      if (this.getTotalCalls() >= 1800) break;
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\\n📈 Scraping completed in ${duration}s`);
    console.log(`📊 Total API calls: ${this.getTotalCalls()}`);
    console.log(`🏪 New places found: ${this.results.length}`);
    
    this.saveResults();
    this.saveSession();
  }
  
  saveResults() {
    if (this.results.length === 0) {
      console.log('⚠️  No new results to save');
      return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `optimized_scraped_${timestamp}_${this.results.length}.csv`;
    
    const headers = Object.keys(this.results[0]);
    const csvContent = [
      headers.join(','),
      ...this.results.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 Saved ${this.results.length} new results to ${filename}`);
    
    fs.writeFileSync(filename.replace('.csv', '.json'), JSON.stringify(this.results, null, 2));
  }
  
  saveSession() {
    const sessionData = {
      apiKeys: this.apiKeys,
      currentKeyIndex: this.currentKeyIndex,
      totalResults: this.results.length,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync('session_optimized.json', JSON.stringify(sessionData, null, 2));
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
    const match = address.match(/\\b\\d{5}(-\\d{4})?\\b/);
    return match ? match[0] : '';
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run optimized scraper
async function main() {
  const scraper = new OptimizedScraper();
  await scraper.scrapeAll();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = OptimizedScraper;