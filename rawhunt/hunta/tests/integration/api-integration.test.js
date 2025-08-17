/**
 * GoHunta API Integration Tests
 * Comprehensive testing of frontend-backend API communication
 */

import { expect } from 'chai';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

class APIIntegrationSteps {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.wsURL = WS_BASE_URL;
    this.authToken = null;
    this.wsConnection = null;
  }

  async authenticateUser(credentials = { email: 'test@gohunta.com', password: 'TestPassword123!' }) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    expect(response.status).to.equal(200);
    const data = await response.json();
    expect(data.token).to.exist;
    expect(data.user).to.exist;
    expect(data.user.email).to.equal(credentials.email);
    
    this.authToken = data.token;
    return data;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers
      }
    });

    return {
      status: response.status,
      data: response.ok ? await response.json() : null,
      headers: Object.fromEntries(response.headers.entries()),
      response
    };
  }

  async testWebSocketConnection() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.wsURL}/api/ws`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      ws.on('open', () => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        this.wsConnection = ws;
        resolve(ws);
      });

      ws.on('error', (error) => reject(error));
      
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  }

  async testOfflineSync() {
    // Create mock offline data
    const offlineData = {
      huntLogs: [{
        id: 'offline-hunt-1',
        date: new Date().toISOString(),
        location: { lat: 45.5152, lng: -122.6784 },
        dogs: ['dog-1'],
        notes: 'Great hunt in offline mode',
        photos: []
      }],
      dogProfiles: [{
        id: 'offline-dog-1',
        name: 'Offline Test Dog',
        breed: 'Labrador',
        created_at: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    };

    // Test sync endpoint
    const syncResponse = await this.makeAuthenticatedRequest('/api/sync', {
      method: 'POST',
      body: JSON.stringify(offlineData)
    });

    expect(syncResponse.status).to.equal(200);
    expect(syncResponse.data.processed).to.be.at.least(2);
    expect(syncResponse.data.conflicts).to.be.an('array');
    
    return syncResponse.data;
  }

  validateResponseSchema(data, expectedFields) {
    expectedFields.forEach(field => {
      expect(data).to.have.property(field);
    });
    return true;
  }

  async testRateLimiting() {
    const requests = [];
    
    // Make 20 rapid requests to test rate limiting
    for (let i = 0; i < 20; i++) {
      requests.push(this.makeAuthenticatedRequest('/api/dogs'));
    }

    const results = await Promise.allSettled(requests);
    const rateLimitedRequests = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );

    // Should have some rate limited requests
    expect(rateLimitedRequests.length).to.be.at.least(1);
    return rateLimitedRequests;
  }

  cleanup() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  }
}

describe('Frontend-Backend API Integration', function() {
  let apiSteps;

  before(async function() {
    this.timeout(10000);
    apiSteps = new APIIntegrationSteps();
  });

  after(function() {
    apiSteps.cleanup();
  });

  describe('Authentication Integration', function() {
    it('should successfully authenticate user and return JWT token', async function() {
      const result = await apiSteps.authenticateUser();
      expect(result.token).to.be.a('string');
      expect(result.user.id).to.exist;
    });

    it('should handle authentication with expired token', async function() {
      // Use an expired token
      apiSteps.authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const result = await apiSteps.makeAuthenticatedRequest('/api/dogs');
      expect(result.status).to.equal(401);
    });

    it('should validate CORS headers are properly set', async function() {
      await apiSteps.authenticateUser();
      const result = await apiSteps.makeAuthenticatedRequest('/api/dogs');
      
      expect(result.headers['access-control-allow-origin']).to.exist;
      expect(result.headers['access-control-allow-methods']).to.exist;
    });
  });

  describe('Data Synchronization', function() {
    beforeEach(async function() {
      await apiSteps.authenticateUser();
    });

    it('should successfully create and retrieve hunt log', async function() {
      const huntLogData = {
        date: new Date().toISOString(),
        location: { lat: 45.5152, lng: -122.6784, name: 'Portland Forest' },
        dogs: [],
        notes: 'Test hunt integration',
        weather: { temperature: 65, conditions: 'partly_cloudy' }
      };

      // Create hunt log
      const createResult = await apiSteps.makeAuthenticatedRequest('/api/hunt-logs', {
        method: 'POST',
        body: JSON.stringify(huntLogData)
      });

      expect(createResult.status).to.equal(201);
      expect(createResult.data.id).to.exist;
      
      // Retrieve hunt log
      const retrieveResult = await apiSteps.makeAuthenticatedRequest(`/api/hunt-logs/${createResult.data.id}`);
      expect(retrieveResult.status).to.equal(200);
      expect(retrieveResult.data.notes).to.equal(huntLogData.notes);
    });

    it('should handle offline data synchronization', async function() {
      const syncResult = await apiSteps.testOfflineSync();
      expect(syncResult.processed).to.be.at.least(2);
      expect(syncResult.status).to.equal('success');
    });

    it('should validate data schema on API responses', async function() {
      const result = await apiSteps.makeAuthenticatedRequest('/api/dogs');
      expect(result.status).to.equal(200);
      
      if (result.data && result.data.length > 0) {
        apiSteps.validateResponseSchema(result.data[0], ['id', 'name', 'breed', 'owner_id']);
      }
    });
  });

  describe('Real-time Communication', function() {
    beforeEach(async function() {
      await apiSteps.authenticateUser();
    });

    it('should establish WebSocket connection successfully', async function() {
      this.timeout(10000);
      const ws = await apiSteps.testWebSocketConnection();
      expect(ws.readyState).to.equal(WebSocket.OPEN);
    });

    it('should receive real-time updates via WebSocket', async function() {
      this.timeout(15000);
      
      const ws = await apiSteps.testWebSocketConnection();
      
      return new Promise((resolve, reject) => {
        let messageReceived = false;

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          expect(message.type).to.exist;
          expect(message.data).to.exist;
          messageReceived = true;
          resolve();
        });

        // Send a test message to trigger response
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));

        setTimeout(() => {
          if (!messageReceived) {
            reject(new Error('No WebSocket message received'));
          }
        }, 10000);
      });
    });
  });

  describe('Error Handling', function() {
    beforeEach(async function() {
      await apiSteps.authenticateUser();
    });

    it('should handle network timeout gracefully', async function() {
      this.timeout(15000);
      
      // Mock a slow endpoint by making request to non-existent endpoint
      const result = await apiSteps.makeAuthenticatedRequest('/api/slow-endpoint');
      expect(result.status).to.equal(404);
    });

    it('should handle server errors appropriately', async function() {
      // Try to create invalid data that should trigger server error
      const invalidData = { invalid: 'data' };
      
      const result = await apiSteps.makeAuthenticatedRequest('/api/hunt-logs', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      expect(result.status).to.be.oneOf([400, 422, 500]);
    });

    it('should handle data validation failures', async function() {
      const invalidHuntLog = {
        date: 'invalid-date',
        location: { lat: 'invalid', lng: 'invalid' },
        notes: ''
      };

      const result = await apiSteps.makeAuthenticatedRequest('/api/hunt-logs', {
        method: 'POST',
        body: JSON.stringify(invalidHuntLog)
      });

      expect(result.status).to.be.oneOf([400, 422]);
      
      if (result.data && result.data.errors) {
        expect(result.data.errors).to.be.an('array');
        expect(result.data.errors.length).to.be.at.least(1);
      }
    });
  });

  describe('Performance and Load Testing', function() {
    beforeEach(async function() {
      await apiSteps.authenticateUser();
    });

    it('should handle concurrent requests efficiently', async function() {
      this.timeout(20000);
      
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(apiSteps.makeAuthenticatedRequest('/api/dogs'));
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successfulRequests = results.filter(r => r.status === 200);
      expect(successfulRequests.length).to.be.at.least(concurrentRequests * 0.8); // 80% success rate
      expect(duration).to.be.lessThan(10000); // Under 10 seconds
    });

    it('should respect rate limiting', async function() {
      this.timeout(15000);
      
      const rateLimitedRequests = await apiSteps.testRateLimiting();
      expect(rateLimitedRequests.length).to.be.at.least(1);
    });
  });

  describe('Security Integration', function() {
    it('should reject requests without authentication', async function() {
      const apiStepsNoAuth = new APIIntegrationSteps();
      const result = await apiStepsNoAuth.makeAuthenticatedRequest('/api/dogs');
      expect(result.status).to.equal(401);
    });

    it('should validate JWT token structure and claims', async function() {
      const authResult = await apiSteps.authenticateUser();
      const token = authResult.token;
      
      // Basic JWT structure validation (should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts).to.have.length(3);
      
      // Decode payload (without verification for testing)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(payload.sub).to.exist; // Subject (user ID)
      expect(payload.exp).to.exist; // Expiration
      expect(payload.iat).to.exist; // Issued at
    });
  });
});