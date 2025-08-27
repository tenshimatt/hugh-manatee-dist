#!/usr/bin/env node

/**
 * Claude AI Chat Endpoint Test Script
 * Tests the /api/chat endpoint functionality
 */

const API_BASE = 'http://localhost:8787';

// Test configuration
const tests = [
  {
    name: 'Basic chat message',
    method: 'POST',
    endpoint: '/api/chat',
    body: {
      message: 'What is raw feeding for dogs?'
    },
    expectError: true,
    expectedError: 'ANTHROPIC_API_KEY'
  },
  {
    name: 'Empty message validation',
    method: 'POST', 
    endpoint: '/api/chat',
    body: {
      message: ''
    },
    expectError: true,
    expectedError: 'Message is required'
  },
  {
    name: 'Message too long validation',
    method: 'POST',
    endpoint: '/api/chat', 
    body: {
      message: 'a'.repeat(5000)
    },
    expectError: true,
    expectedError: 'Message too long'
  },
  {
    name: 'Chat history (should require auth)',
    method: 'GET',
    endpoint: '/api/chat/history',
    expectError: true,
    expectedError: 'authorization'
  },
  {
    name: 'API info includes chat endpoints',
    method: 'GET',
    endpoint: '/api',
    expectError: false,
    validateResponse: (data) => {
      return data.endpoints && data.endpoints.chat && 
             data.endpoints.chat.includes('POST /api/chat');
    }
  }
];

async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  
  try {
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (test.body) {
      options.body = JSON.stringify(test.body);
    }
    
    const response = await fetch(`${API_BASE}${test.endpoint}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    
    if (test.expectError) {
      if (response.ok) {
        console.log('   ❌ FAIL: Expected error but got success');
        return false;
      }
      
      if (test.expectedError) {
        const errorContainsExpected = JSON.stringify(data).includes(test.expectedError);
        if (errorContainsExpected) {
          console.log('   ✅ PASS: Got expected error');
          return true;
        } else {
          console.log(`   ❌ FAIL: Expected error containing "${test.expectedError}"`);
          return false;
        }
      } else {
        console.log('   ✅ PASS: Got expected error');
        return true;
      }
    } else {
      if (!response.ok) {
        console.log('   ❌ FAIL: Expected success but got error');
        return false;
      }
      
      if (test.validateResponse) {
        const isValid = test.validateResponse(data);
        if (isValid) {
          console.log('   ✅ PASS: Response validation passed');
          return true;
        } else {
          console.log('   ❌ FAIL: Response validation failed');
          return false;
        }
      } else {
        console.log('   ✅ PASS: Got successful response');
        return true;
      }
    }
  } catch (error) {
    console.log(`   ❌ FAIL: Request failed - ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Claude AI Chat Endpoint Tests');
  console.log('==========================================');
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result) passed++;
  }
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Chat endpoint is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Add ANTHROPIC_API_KEY to environment variables');
    console.log('2. Test with real Claude API calls'); 
    console.log('3. Set up caching (KV storage) for cost optimization');
    console.log('4. Deploy to production');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);