/**
 * GoHunta Performance Testing Suite - Main Entry Point
 * Comprehensive performance testing and monitoring for the GoHunta hunting platform
 */

// Export all performance testing suites
export { default as MobilePerformanceSuite } from './mobile/mobile-performance-suite.js';
export { default as APIPerformanceSuite } from './api/api-performance-suite.js';
export { default as PWAPerformanceSuite } from './pwa/pwa-performance-suite.js';
export { default as EdgePerformanceSuite } from './edge/edge-performance-suite.js';
export { default as ScalabilityTestSuite } from './scalability/scalability-test-suite.js';

// Export benchmark runner and CI integration
export { default as PerformanceBenchmarkRunner } from './benchmarks/performance-benchmark-runner.js';
export { default as CIPerformanceTest } from './benchmarks/ci-performance-test.js';

// Export monitoring components
export { default as RealUserMonitoring, initializeRUM, getRUM } from './monitoring/rum-implementation.js';
export { default as DashboardConfig } from './monitoring/dashboard-config.js';

// Performance testing utilities
export class PerformanceTestSuite {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:8787',
      frontendBaseUrl: config.frontendBaseUrl || process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
      outputDir: config.outputDir || './performance-reports',
      suites: config.suites || ['mobile', 'api', 'pwa', 'edge', 'scalability'],
      ...config
    };
  }

  /**
   * Run all performance tests
   */
  async runAll(playwright) {
    const runner = new PerformanceBenchmarkRunner(this.config);
    return await runner.runBenchmarks(playwright);
  }

  /**
   * Run specific test suite
   */
  async runSuite(suiteName, playwright) {
    const runner = new PerformanceBenchmarkRunner({
      ...this.config,
      suites: [suiteName]
    });
    return await runner.runBenchmarks(playwright);
  }
}

// Quick test functions for CLI usage
export async function testMobilePerformance(page) {
  const suite = new MobilePerformanceSuite();
  return {
    gps: await suite.testGPSPerformance(page),
    network: await suite.test3GNetworkPerformance(page),
    battery: await suite.testBatteryOptimization(page),
    offline: await suite.testOfflinePerformance(page),
    memory: await suite.testMemoryUsageInField(page)
  };
}

export async function testAPIPerformance() {
  const suite = new APIPerformanceSuite();
  return {
    endpoints: await suite.testEndpointPerformance(),
    database: await suite.testDatabaseQueryPerformance(),
    concurrent: await suite.testConcurrentUserHandling(),
    caching: await suite.testCachingEfficiency(),
    rateLimit: await suite.testRateLimiting()
  };
}

export async function testPWAPerformance(page) {
  const suite = new PWAPerformanceSuite();
  return {
    serviceWorker: await suite.testServiceWorkerPerformance(page),
    indexedDB: await suite.testIndexedDBPerformance(page),
    backgroundSync: await suite.testBackgroundSyncPerformance(page),
    offline: await suite.testOfflineCapabilities(page)
  };
}

export async function testEdgePerformance() {
  const suite = new EdgePerformanceSuite();
  return {
    workers: await suite.testWorkerPerformance(),
    latency: await suite.testGlobalLatency(),
    caching: await suite.testEdgeCaching(),
    cdn: await suite.testCDNOptimization(),
    rural: await suite.testRuralCoverage()
  };
}

export async function testScalability() {
  const suite = new ScalabilityTestSuite();
  return {
    load: await suite.runLoadTests(),
    stress: await suite.runStressTests(),
    spike: await suite.runSpikeTests(),
    endurance: await suite.runEnduranceTests()
  };
}

// Default export
export default {
  PerformanceTestSuite,
  testMobilePerformance,
  testAPIPerformance,
  testPWAPerformance,
  testEdgePerformance,
  testScalability,
  initializeRUM
};