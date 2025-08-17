export default {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js'],
  
  // ES Modules configuration
  preset: null,
  
  // Enable ES modules support in Jest
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Make sure jest globals are available
  injectGlobals: true
};