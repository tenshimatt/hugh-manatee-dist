// Enhanced Google Places Scraper - Maximum Data Extraction
// Same API cost, 10x more valuable data!

const axios = require('axios');
const fs = require('fs');

class EnhancedGooglePlacesScraper {
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
    
    // ALL available fields - same API cost!
    this.allAvailableFields = [
      // Basic info
      'name', 'place_id', 'formatted_address', 'geometry', 
      'vicinity', 'adr_address', 'plus_code',
      
      // Contact & website
      'formatted_phone_number', 'international_phone_number', 
      'website', 'url',
      
      // Business details
      'business_status', 'opening_hours', 'current_opening_hours',
      'secondary_opening_hours', 'utc_offset', 'price_level',
      'wheelchair_accessible_entrance',
      
      // Ratings & reviews
      'rating', 'user_ratings_total', 'reviews',
      
      // Categories & features
      'types', 'editorial_summary',
      
      // Service options
      'delivery', 'dine_in', 'takeout', 'reservable',
      'curbside_pickup',
      
      // Food service details
      'serves_breakfast', 'serves_lunch', 'serves_dinner',
      'serves_brunch', 'serves_beer', 'serves_wine',
      'serves_vegetarian_food',
      
      // Visual assets
      'photos', 'icon', 'icon_mask_base_uri', 'icon_background_color'
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
  
  async getEnhancedPlaceDetails(placeId) {
    const keyObj = this.getCurrentApiKey();
    if (!keyObj) return null;
    
    // 🎉 ALL FIELDS for same price!
    const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=${this.allAvailableFields}&` +
      `key=${keyObj.key}`;
    
    const data = await this.makeApiCall(url, keyObj);
    return data?.result || null;
  }
  
  processEnhancedData(details, city) {
    // Extract rich data from ALL available fields
    const photos = details.photos?.map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      // Can generate full URL: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${key}`
      html_attributions: photo.html_attributions
    })) || [];
    
    const reviews = details.reviews?.map(review => ({
      author_name: review.author_name,
      author_url: review.author_url,
      language: review.language,
      profile_photo_url: review.profile_photo_url,
      rating: review.rating,
      relative_time_description: review.relative_time_description,
      text: review.text,
      time: review.time
    })) || [];
    
    const hours = details.opening_hours ? {
      open_now: details.opening_hours.open_now,
      periods: details.opening_hours.periods,
      weekday_text: details.opening_hours.weekday_text
    } : null;
    
    const currentHours = details.current_opening_hours ? {
      open_now: details.current_opening_hours.open_now,
      periods: details.current_opening_hours.periods,
      weekday_text: details.current_opening_hours.weekday_text
    } : null;
    
    // Rich service information
    const services = {
      delivery: details.delivery,
      dine_in: details.dine_in,
      takeout: details.takeout,
      reservable: details.reservable,
      curbside_pickup: details.curbside_pickup,
      wheelchair_accessible: details.wheelchair_accessible_entrance
    };
    
    const foodServices = {
      serves_breakfast: details.serves_breakfast,
      serves_lunch: details.serves_lunch,
      serves_dinner: details.serves_dinner,
      serves_brunch: details.serves_brunch,
      serves_beer: details.serves_beer,
      serves_wine: details.serves_wine,
      serves_vegetarian_food: details.serves_vegetarian_food
    };
    
    return {
      // Basic info
      id: this.generateUUID(),
      place_id: details.place_id,
      name: details.name,
      formatted_address: details.formatted_address,
      vicinity: details.vicinity,
      adr_address: details.adr_address,
      plus_code: details.plus_code ? JSON.stringify(details.plus_code) : null,
      
      // Location
      city: city.name,
      state: city.state,
      country: 'USA',
      latitude: details.geometry?.location?.lat,
      longitude: details.geometry?.location?.lng,
      
      // Contact
      phone_number: details.formatted_phone_number,
      international_phone_number: details.international_phone_number,
      website: details.website,
      google_url: details.url,
      
      // Business details
      business_status: details.business_status,
      rating: details.rating || 0,
      user_ratings_total: details.user_ratings_total || 0,
      price_level: details.price_level,
      utc_offset: details.utc_offset,
      
      // Hours (JSON strings for complex data)
      opening_hours: hours ? JSON.stringify(hours) : null,
      current_opening_hours: currentHours ? JSON.stringify(currentHours) : null,
      secondary_opening_hours: details.secondary_opening_hours ? JSON.stringify(details.secondary_opening_hours) : null,
      
      // Services & features
      services: JSON.stringify(services),
      food_services: JSON.stringify(foodServices),
      
      // Content
      types: JSON.stringify(details.types || []),
      editorial_summary: details.editorial_summary,
      
      // Visual assets
      icon: details.icon,
      icon_mask_base_uri: details.icon_mask_base_uri,
      icon_background_color: details.icon_background_color,
      photos: JSON.stringify(photos),
      
      // Reviews (store up to 5 most recent)
      reviews: JSON.stringify(reviews.slice(0, 5)),
      
      // Metadata
      keyword: this.searchTerm,
      place_type: 'raw_dog_food_enhanced',
      created_at: new Date().toISOString(),
      enhanced_data_version: '2.0'
    };
  }
  
  async scrapeCity(city) {
    console.log(`\n🏙️  Scraping ${city.name}, ${city.state} for ENHANCED "${this.searchTerm}" data`);
    
    const location = `${city.name}, ${city.state}`;
    const places = await this.searchPlaces(location);
    
    let cityResults = 0;
    
    for (const place of places) {
      // Check if we already have this place
      const existing = this.results.find(r => r.place_id === place.place_id);
      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${place.name}`);
        continue;
      }
      
      // Get ENHANCED details with ALL fields
      const details = await this.getEnhancedPlaceDetails(place.place_id);
      if (!details) continue;
      
      // Skip permanently closed businesses
      if (details.business_status === 'CLOSED_PERMANENTLY') {
        console.log(`🚫 Skipping closed business: ${details.name}`);
        continue;
      }
      
      // Process and store enhanced data
      const enhancedData = this.processEnhancedData(details, city);
      
      this.results.push(enhancedData);
      cityResults++;
      
      const photosCount = details.photos?.length || 0;
      const reviewsCount = details.reviews?.length || 0;
      
      console.log(`✅ Enhanced: ${enhancedData.name} (${enhancedData.rating}⭐) - ${photosCount} photos, ${reviewsCount} reviews - #${cityResults} from ${city.name}`);
      
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
    console.log(`🚀 Starting ENHANCED Google Places scraper - ALL FIELDS EXTRACTION`);
    console.log(`🎯 Search term: "${this.searchTerm}"`);
    console.log(`🌎 Cities to cover: ${this.cities.length} locations`);
    console.log(`📊 API limits: ${this.apiKeys.map(k => `${k.account}: ${k.dailyLimit}`).join(', ')}`);
    console.log(`💎 Extracting: Photos, Reviews, Hours, Services, Contact, and MORE!`);
    
    const startTime = Date.now();
    let totalCityResults = 0;
    
    for (const city of this.cities) {
      const cityResults = await this.scrapeCity(city);
      totalCityResults += cityResults;
      
      // Progress update every 5 cities
      if ((this.cities.indexOf(city) + 1) % 5 === 0) {
        const progress = Math.round(((this.cities.indexOf(city) + 1) / this.cities.length) * 100);
        console.log(`\n📈 Progress: ${progress}% complete (${this.results.length} ENHANCED suppliers found, ${this.getTotalCalls()} API calls used)`);
      }
      
      // Check limits
      const totalCalls = this.getTotalCalls();
      if (totalCalls >= 1900) {
        console.log(`\n🏁 Reached safe daily limit (${totalCalls} calls). Stopping for today.`);
        break;
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 ENHANCED Scraping completed in ${duration}s`);
    console.log(`📞 Total API calls: ${this.getTotalCalls()}`);
    console.log(`🏪 Enhanced raw dog food suppliers: ${this.results.length}`);
    console.log(`🌎 Cities successfully scraped: ${Math.min(this.cities.length, Math.floor(this.getTotalCalls() / 60))}`);
    console.log(`💎 Data richness: Photos, Reviews, Hours, Services, Contact Info`);
    console.log(`💰 Same API cost, 10x more valuable data!`);
    
    this.saveResults();
    this.saveSession();
  }
  
  saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `enhanced_raw_dog_food_suppliers_${timestamp}_${this.results.length}.csv`;
    
    if (this.results.length === 0) {
      console.log('⚠️  No results to save');
      return;
    }
    
    // Convert to CSV with enhanced fields
    const headers = Object.keys(this.results[0]);
    const csvContent = [
      headers.join(','),
      ...this.results.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 Saved ${this.results.length} ENHANCED suppliers to ${filename}`);
    
    // Save as JSON to see rich data structure
    fs.writeFileSync(filename.replace('.csv', '.json'), JSON.stringify(this.results, null, 2));
    console.log(`📋 Rich data structure saved to ${filename.replace('.csv', '.json')}`);
  }
  
  saveSession() {
    const sessionData = {
      apiKeys: this.apiKeys,
      currentKeyIndex: this.currentKeyIndex,
      totalResults: this.results.length,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync('session_enhanced.json', JSON.stringify(sessionData, null, 2));
  }
  
  loadSession() {
    try {
      if (fs.existsSync('session_enhanced.json')) {
        const sessionData = JSON.parse(fs.readFileSync('session_enhanced.json', 'utf8'));
        
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

// Run the enhanced scraper
async function main() {
  const scraper = new EnhancedGooglePlacesScraper();
  await scraper.scrapeAll();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedGooglePlacesScraper;
