// Quick test for business API key
const axios = require('axios');

async function testBusinessKey() {
  console.log('🔑 Testing business API key (mw@samuelandcotrading.com)...\n');
  
  const apiKey = 'AIzaSyBnvRVRCE8ixANqhHCS99MQtlUBmlFr7Mk';
  
  try {
    // Test with a simple search
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=raw+dog+food+Denver+CO&` +
      `key=${apiKey}`;
    
    console.log('Making test API call...');
    const response = await axios.get(url);
    
    console.log(`Status: ${response.data.status}`);
    
    if (response.data.status === 'OK') {
      console.log(`✅ SUCCESS! Found ${response.data.results.length} results`);
      
      if (response.data.results.length > 0) {
        const first = response.data.results[0];
        console.log(`Sample result: ${first.name} - ${first.formatted_address}`);
      }
      
      console.log('\n🎉 Business API key is now working!');
      console.log('You can now run the full scraper with both keys:');
      console.log('node google-places-scraper.js');
      
    } else {
      console.log(`❌ Status: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`Error: ${response.data.error_message}`);
      }
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.log('\n🔧 To fix this:');
        console.log('1. Go to: https://console.cloud.google.com');
        console.log('2. Switch to mw@samuelandcotrading.com project');
        console.log('3. APIs & Services > Library');
        console.log('4. Search "Places API" and enable it');
        console.log('5. Also enable "Places API (New)" for future compatibility');
      }
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
  }
}

testBusinessKey().catch(console.error);
