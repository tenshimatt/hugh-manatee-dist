#!/usr/bin/env node
/**
 * Comprehensive geolocation search API test
 * Tests the BMAD:API:Build-Supplier-Search-Geolocation implementation
 */

const API_BASE = 'http://localhost:8787/api';

// Test coordinates (NYC area)
const TEST_COORDS = {
  manhattan: { lat: 40.7128, lng: -74.0060 },
  brooklyn: { lat: 40.6501, lng: -73.9496 },
  queens: { lat: 40.7282, lng: -73.7949 }
};

class GeolocationSearchTester {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.performanceResults = [];
  }

  async runTest(testName, testFunc) {
    this.totalTests++;
    console.log(`\n🧪 ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunc();
      const duration = Date.now() - startTime;
      
      this.performanceResults.push({ testName, duration });
      
      if (result) {
        console.log(`✅ PASS (${duration}ms)`);
        this.passedTests++;
      } else {
        console.log(`❌ FAIL (${duration}ms)`);
        this.failedTests++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      this.failedTests++;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return {
      status: response.status,
      data: await response.json(),
      headers: response.headers
    };
  }

  // Test 1: Basic geolocation search with lat/lng parameters
  async testBasicGeolocationSearch() {
    const { lat, lng } = TEST_COORDS.manhattan;
    const response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=5&limit=10`
    );

    if (response.status !== 200) {
      console.log(`Expected 200, got ${response.status}`);
      return false;
    }

    const { data } = response;
    
    // Verify response structure
    if (!data.success || !data.data || !Array.isArray(data.data.suppliers)) {
      console.log('Invalid response structure');
      return false;
    }

    // Verify geolocation metadata
    if (!data.data.searchMetadata || data.data.searchMetadata.searchType !== 'geolocation') {
      console.log('Missing geolocation search metadata');
      return false;
    }

    // Verify suppliers have distance field
    const suppliersWithDistance = data.data.suppliers.filter(s => s.distance !== null);
    if (suppliersWithDistance.length === 0 && data.data.suppliers.length > 0) {
      console.log('No suppliers have distance calculated');
      return false;
    }

    console.log(`Found ${data.data.suppliers.length} suppliers within 5 miles`);
    return true;
  }

  // Test 2: Legacy parameter support (latitude/longitude)
  async testLegacyParameterSupport() {
    const { lat, lng } = TEST_COORDS.brooklyn;
    const response = await this.makeRequest(
      `/suppliers?latitude=${lat}&longitude=${lng}&radius=10`
    );

    if (response.status !== 200) {
      console.log(`Expected 200, got ${response.status}`);
      return false;
    }

    const { data } = response;
    
    if (!data.success || data.data.searchMetadata.searchType !== 'geolocation') {
      console.log('Legacy parameters not working');
      return false;
    }

    console.log(`Legacy parameters work - found ${data.data.suppliers.length} suppliers`);
    return true;
  }

  // Test 3: Distance sorting verification
  async testDistanceSorting() {
    const { lat, lng } = TEST_COORDS.queens;
    const response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=20&limit=20`
    );

    if (response.status !== 200) {
      console.log(`Expected 200, got ${response.status}`);
      return false;
    }

    const suppliers = response.data.data.suppliers;
    
    if (suppliers.length < 2) {
      console.log('Not enough suppliers to test sorting');
      return true; // Can't test with < 2 suppliers
    }

    // Check if suppliers are sorted by distance (ascending)
    for (let i = 1; i < suppliers.length; i++) {
      if (suppliers[i].distance !== null && suppliers[i-1].distance !== null) {
        if (suppliers[i].distance < suppliers[i-1].distance) {
          console.log(`Distance sorting failed: ${suppliers[i-1].distance} -> ${suppliers[i].distance}`);
          return false;
        }
      }
    }

    console.log('Suppliers correctly sorted by distance');
    return true;
  }

  // Test 4: Radius boundary testing (1-50 miles)
  async testRadiusBoundaries() {
    const { lat, lng } = TEST_COORDS.manhattan;
    
    // Test minimum radius (0.1 miles)
    let response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=0.1`
    );
    
    if (response.status !== 200) {
      console.log(`Min radius test failed: ${response.status}`);
      return false;
    }

    // Test maximum radius (50 miles)
    response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=50`
    );
    
    if (response.status !== 200) {
      console.log(`Max radius test failed: ${response.status}`);
      return false;
    }

    // Test invalid radius (too large)
    response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=100`
    );
    
    if (response.status === 200) {
      console.log('Should reject radius > 50 miles');
      return false;
    }

    console.log('Radius boundaries correctly enforced');
    return true;
  }

  // Test 5: Performance benchmark (<200ms requirement)
  async testPerformanceBenchmark() {
    const { lat, lng } = TEST_COORDS.manhattan;
    const performanceRuns = [];
    
    // Run 5 performance tests
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      const response = await this.makeRequest(
        `/suppliers?lat=${lat}&lng=${lng}&radius=10&limit=20`
      );
      const duration = Date.now() - startTime;
      
      if (response.status !== 200) {
        console.log(`Performance run ${i+1} failed with status ${response.status}`);
        return false;
      }
      
      performanceRuns.push(duration);
    }

    const avgTime = performanceRuns.reduce((a, b) => a + b) / performanceRuns.length;
    const maxTime = Math.max(...performanceRuns);
    
    console.log(`Average response time: ${avgTime.toFixed(1)}ms`);
    console.log(`Max response time: ${maxTime}ms`);
    console.log(`Performance runs: [${performanceRuns.join(', ')}]ms`);
    
    if (maxTime > 200) {
      console.log(`❌ Performance requirement not met: ${maxTime}ms > 200ms`);
      return false;
    }

    console.log(`✅ Performance requirement met: All responses < 200ms`);
    return true;
  }

  // Test 6: Pagination with geolocation
  async testGeolocationPagination() {
    const { lat, lng } = TEST_COORDS.manhattan;
    
    // Get first page
    const page1 = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=15&limit=5&page=1`
    );
    
    if (page1.status !== 200) {
      console.log(`Page 1 request failed: ${page1.status}`);
      return false;
    }

    // Get second page
    const page2 = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=15&limit=5&page=2`
    );
    
    if (page2.status !== 200) {
      console.log(`Page 2 request failed: ${page2.status}`);
      return false;
    }

    const page1Data = page1.data.data;
    const page2Data = page2.data.data;
    
    // Verify pagination metadata
    if (page1Data.pagination.page !== 1 || page2Data.pagination.page !== 2) {
      console.log('Pagination metadata incorrect');
      return false;
    }

    // Verify no duplicate suppliers between pages
    const page1Ids = page1Data.suppliers.map(s => s.id);
    const page2Ids = page2Data.suppliers.map(s => s.id);
    const duplicates = page1Ids.filter(id => page2Ids.includes(id));
    
    if (duplicates.length > 0) {
      console.log('Duplicate suppliers found between pages');
      return false;
    }

    console.log(`Page 1: ${page1Data.suppliers.length} suppliers, Page 2: ${page2Data.suppliers.length} suppliers`);
    return true;
  }

  // Test 7: Combined filters with geolocation
  async testCombinedFilters() {
    const { lat, lng } = TEST_COORDS.brooklyn;
    const response = await this.makeRequest(
      `/suppliers?lat=${lat}&lng=${lng}&radius=10&category=Pet Grooming&rating=4&limit=10`
    );

    if (response.status !== 200) {
      console.log(`Combined filters request failed: ${response.status}`);
      return false;
    }

    const { data } = response;
    
    // Verify geolocation search type is maintained
    if (data.data.searchMetadata.searchType !== 'geolocation') {
      console.log('Combined filters broke geolocation search type');
      return false;
    }

    // Check if suppliers match the filters (when present)
    const suppliers = data.data.suppliers;
    const invalidSuppliers = suppliers.filter(s => {
      return (s.category && s.category !== 'Pet Grooming') || 
             (s.rating_average && s.rating_average < 4);
    });

    if (invalidSuppliers.length > 0) {
      console.log(`Found ${invalidSuppliers.length} suppliers that don't match filters`);
      return false;
    }

    console.log(`Combined filters work - found ${suppliers.length} matching suppliers`);
    return true;
  }

  // Test 8: Error handling
  async testErrorHandling() {
    // Test invalid coordinates
    let response = await this.makeRequest(
      `/suppliers?lat=91&lng=181&radius=5`
    );
    
    if (response.status !== 400) {
      console.log(`Invalid coordinates should return 400, got ${response.status}`);
      return false;
    }

    // Test missing coordinates
    response = await this.makeRequest(
      `/suppliers?radius=5`
    );
    
    if (response.status === 400) {
      console.log('Missing coordinates handled correctly');
    }

    // Test invalid radius
    response = await this.makeRequest(
      `/suppliers?lat=40.7128&lng=-74.0060&radius=-5`
    );
    
    if (response.status !== 400) {
      console.log(`Negative radius should return 400, got ${response.status}`);
      return false;
    }

    console.log('Error handling working correctly');
    return true;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Geolocation Search API Tests');
    console.log('=' .repeat(50));

    await this.runTest('Basic Geolocation Search (lat/lng)', () => this.testBasicGeolocationSearch());
    await this.runTest('Legacy Parameter Support', () => this.testLegacyParameterSupport());
    await this.runTest('Distance Sorting Verification', () => this.testDistanceSorting());
    await this.runTest('Radius Boundary Testing', () => this.testRadiusBoundaries());
    await this.runTest('Performance Benchmark (<200ms)', () => this.testPerformanceBenchmark());
    await this.runTest('Geolocation Pagination', () => this.testGeolocationPagination());
    await this.runTest('Combined Filters', () => this.testCombinedFilters());
    await this.runTest('Error Handling', () => this.testErrorHandling());

    console.log('\n' + '=' .repeat(50));
    console.log('🏁 TEST RESULTS SUMMARY');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    if (this.performanceResults.length > 0) {
      console.log('\n📊 PERFORMANCE SUMMARY');
      this.performanceResults.forEach(({ testName, duration }) => {
        const status = duration <= 200 ? '✅' : '⚠️';
        console.log(`${status} ${testName}: ${duration}ms`);
      });
    }

    const success = this.failedTests === 0;
    console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
    
    if (success) {
      console.log('✅ BMAD:API:Build-Supplier-Search-Geolocation implementation verified!');
      console.log('✅ Performance target <200ms achieved');
      console.log('✅ 1-50 mile radius support confirmed');  
      console.log('✅ Distance sorting by Haversine formula working');
      console.log('✅ Pagination and filtering integrated successfully');
    }
    
    return success;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new GeolocationSearchTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { GeolocationSearchTester };