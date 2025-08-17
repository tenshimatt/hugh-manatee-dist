#!/usr/bin/env node

/**
 * Test script to verify the search API endpoint is working correctly
 * Run this after deploying the fixed rawgle-worker.js
 */

const API_BASE_URL = 'https://rawgle-backend-working-prod.findrawdogfood.workers.dev';

async function testSearchEndpoint() {
  console.log('🔍 Testing Search API Endpoint Fix...\n');

  const testCases = [
    {
      name: 'Search for "chicago"',
      url: `${API_BASE_URL}/api/search?q=chicago&limit=10`,
      expectedToFind: 'Chicago Raw Pet Food Co.'
    },
    {
      name: 'Search for "raw"',
      url: `${API_BASE_URL}/api/search?q=raw&limit=10`,
      expectedToFind: 'raw_food'
    },
    {
      name: 'Search for "barf"',
      url: `${API_BASE_URL}/api/search?q=barf&limit=10`,
      expectedToFind: 'BARF'
    },
    {
      name: 'Empty search (should return all)',
      url: `${API_BASE_URL}/api/search?q=&limit=5`,
      expectedToFind: null
    },
    {
      name: 'Search for location "evanston"',
      url: `${API_BASE_URL}/api/search?q=evanston&limit=10`,
      expectedToFind: 'Evanston'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 ${testCase.name}:`);
      console.log(`   URL: ${testCase.url}`);
      
      const response = await fetch(testCase.url);
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`   ❌ Error: ${response.status} - ${data.error || 'Unknown error'}`);
        if (data.details) {
          console.log(`   🔍 Details: ${data.details}`);
        }
        continue;
      }
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Results: ${data.results?.length || 0} suppliers found`);
      console.log(`   🔍 Query: "${data.query}"`);
      
      if (data.results && data.results.length > 0) {
        console.log(`   📋 First result: ${data.results[0].name}`);
        console.log(`   📍 Address: ${data.results[0].address || 'N/A'}`);
        
        if (testCase.expectedToFind) {
          const found = data.results.some(result => 
            JSON.stringify(result).toLowerCase().includes(testCase.expectedToFind.toLowerCase())
          );
          console.log(`   🎯 Expected content found: ${found ? '✅ Yes' : '❌ No'}`);
        }
      } else {
        console.log(`   ⚠️  No results returned`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  // Test stats endpoint
  console.log(`\n\n📊 Testing Stats Endpoint:`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Stats working: ${data.active_suppliers || data.total_suppliers || 0} suppliers`);
    } else {
      console.log(`   ❌ Stats error: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Stats request failed: ${error.message}`);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testSearchEndpoint().catch(console.error);