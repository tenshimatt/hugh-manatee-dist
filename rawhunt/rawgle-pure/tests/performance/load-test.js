import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1'],              // Custom error rate under 10%
  },
};

// Test data
const testUsers = Array.from({ length: 1000 }, (_, i) => ({
  email: `loadtest${i}@rawgle.com`,
  password: 'LoadTest123!',
  walletAddress: `LoadWallet${i}`
}));

export function setup() {
  // Register test users
  const user = testUsers[0];
  const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (res.status === 201) {
    const data = JSON.parse(res.body);
    return { sessionToken: data.sessionToken, userId: data.userId };
  }
  
  return {};
}

export default function (data) {
  const userIndex = Math.floor(Math.random() * testUsers.length);
  const user = testUsers[userIndex];
  
  // Scenario 1: User Registration
  let registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'RegisterUser' },
  });
  
  const registerSuccess = check(registerRes, {
    'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    'register response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!registerSuccess);
  
  let sessionToken = data.sessionToken;
  let userId = data.userId;
  
  if (registerRes.status === 201) {
    const registerData = JSON.parse(registerRes.body);
    sessionToken = registerData.sessionToken;
    userId = registerData.userId;
  }
  
  sleep(1);
  
  // Scenario 2: Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'LoginUser' },
  });
  
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!loginSuccess);
  
  if (loginRes.status === 200) {
    const loginData = JSON.parse(loginRes.body);
    sessionToken = loginData.sessionToken;
  }
  
  sleep(1);
  
  // Scenario 3: Check PAWS Balance
  const balanceRes = http.get(`${BASE_URL}/api/paws/balance?userId=${userId}`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
    tags: { name: 'CheckBalance' },
  });
  
  const balanceSuccess = check(balanceRes, {
    'balance status is 200': (r) => r.status === 200,
    'balance response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!balanceSuccess);
  
  sleep(1);
  
  // Scenario 4: Create Pet Profile
  const petRes = http.post(`${BASE_URL}/api/pets/create`, JSON.stringify({
    name: `LoadPet${userIndex}`,
    breed: 'Test Breed',
    ageCategory: 'adult',
    weight: 20,
    activityLevel: 'moderate'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    tags: { name: 'CreatePet' },
  });
  
  const petSuccess = check(petRes, {
    'pet creation status is 201': (r) => r.status === 201,
    'pet response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!petSuccess);
  
  let petId;
  if (petRes.status === 201) {
    const petData = JSON.parse(petRes.body);
    petId = petData.petId;
  }
  
  sleep(1);
  
  // Scenario 5: Log Feeding
  if (petId) {
    const feedingRes = http.post(`${BASE_URL}/api/feeding/log`, JSON.stringify({
      petId: petId,
      mealTime: 'morning',
      foodType: 'dry kibble',
      quantity: '2 cups',
      logDate: new Date().toISOString().split('T')[0]
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      tags: { name: 'LogFeeding' },
    });
    
    const feedingSuccess = check(feedingRes, {
      'feeding log status is 201': (r) => r.status === 201,
      'feeding response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!feedingSuccess);
  }
  
  sleep(1);
  
  // Scenario 6: AI Medical Consultation
  if (petId) {
    const consultRes = http.post(`${BASE_URL}/api/ai-medical`, JSON.stringify({
      petId: petId,
      symptoms: 'Test symptoms for load testing'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      tags: { name: 'AIConsultation' },
    });
    
    const consultSuccess = check(consultRes, {
      'consultation status is 200': (r) => r.status === 200,
      'consultation response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!consultSuccess);
  }
  
  sleep(2);
  
  // Scenario 7: Reward PAWS
  const rewardRes = http.post(`${BASE_URL}/api/paws/reward`, JSON.stringify({
    userId: userId,
    type: 'daily_feeding',
    metadata: { petId: petId }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    tags: { name: 'RewardPAWS' },
  });
  
  const rewardSuccess = check(rewardRes, {
    'reward status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'reward response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!rewardSuccess);
  
  sleep(1);
}

export function teardown(data) {
  // Clean up test data if needed
  console.log('Load test completed');
}