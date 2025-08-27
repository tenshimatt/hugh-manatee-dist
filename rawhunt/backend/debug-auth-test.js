/**
 * Authentication Debug Test
 * This script tests the authentication endpoints to identify specific failures
 */

async function testAuthEndpoints() {
  const baseUrl = 'https://rawgle-backend.findrawdogfood.workers.dev';
  
  console.log('🔍 Testing Rawgle Authentication System...\n');
  
  // Test 1: Health Check
  console.log('1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ Health check: ${healthData.status} (${healthResponse.status})`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return; // Exit if basic connectivity fails
  }
  
  // Test 2: Registration
  console.log('\n2. Testing user registration...');
  const testUser = {
    email: `testuser-${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890'
  };
  
  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    console.log(`Status: ${registerResponse.status}`);
    console.log(`Response:`, registerData);
    
    if (registerResponse.ok && registerData.success) {
      console.log('✅ Registration successful');
      
      // Store token for further testing
      const token = registerData.data.token;
      
      // Test 3: Login with the same user
      console.log('\n3. Testing user login...');
      try {
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
          })
        });
        
        const loginData = await loginResponse.json();
        console.log(`Login Status: ${loginResponse.status}`);
        console.log(`Login Response:`, loginData);
        
        if (loginResponse.ok && loginData.success) {
          console.log('✅ Login successful');
          
          // Test 4: GET /api/auth/me
          console.log('\n4. Testing profile endpoint...');
          const profileResponse = await fetch(`${baseUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const profileData = await profileResponse.json();
          console.log(`Profile Status: ${profileResponse.status}`);
          console.log(`Profile Response:`, profileData);
          
          if (profileResponse.ok) {
            console.log('✅ Profile retrieval successful');
          } else {
            console.log('❌ Profile retrieval failed');
          }
          
        } else {
          console.log('❌ Login failed');
        }
        
      } catch (error) {
        console.log(`❌ Login error: ${error.message}`);
      }
      
    } else {
      console.log('❌ Registration failed');
    }
    
  } catch (error) {
    console.log(`❌ Registration error: ${error.message}`);
  }
  
  // Test 5: Invalid login
  console.log('\n5. Testing invalid login...');
  try {
    const invalidLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });
    
    const invalidLoginData = await invalidLoginResponse.json();
    console.log(`Invalid login Status: ${invalidLoginResponse.status}`);
    console.log(`Invalid login Response:`, invalidLoginData);
    
    if (invalidLoginResponse.status === 401) {
      console.log('✅ Invalid login properly rejected');
    } else {
      console.log('❌ Invalid login handling incorrect');
    }
    
  } catch (error) {
    console.log(`❌ Invalid login test error: ${error.message}`);
  }
  
  console.log('\n🔍 Authentication testing complete.');
}

// Run the test
testAuthEndpoints().catch(console.error);