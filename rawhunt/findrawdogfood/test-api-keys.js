// Test API keys to verify they work
const axios = require('axios');

const API_KEYS = [
  {
    key: 'AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg',
    account: 'tenshimatt@gmail.com'
  },
  {
    key: 'AIzaSyBnvRVRCE8ixANqhHCS99MQtlUBmlFr7Mk', 
    account: 'mw@samuelandcotrading.com'
  }
];

async function testApiKey(keyObj) {
  console.log(`Testing API key for ${keyObj.account}...`);
  
  try {
    // Simple text search test
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=raw+dog+food+Austin+TX&` +
      `key=${keyObj.key}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      console.log(`✅ ${keyObj.account}: Working! Found ${response.data.results.length} results`);
      
      // Show first result
      if (response.data.results.length > 0) {
        const first = response.data.results[0];
        console.log(`   Sample: ${first.name} - ${first.formatted_address}`);
      }
    } else {
      console.log(`❌ ${keyObj.account}: Error - ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Message: ${response.data.error_message}`);
      }
    }
  } catch (error) {
    console.log(`❌ ${keyObj.account}: Failed - ${error.message}`);
  }
  
  console.log('');
}

async function testAllKeys() {
  console.log('🔑 Testing Google Places API keys...\n');
  
  for (const keyObj of API_KEYS) {
    await testApiKey(keyObj);
  }
  
  console.log('Test complete! If both keys work, run: node google-places-scraper.js');
}

testAllKeys().catch(console.error);
