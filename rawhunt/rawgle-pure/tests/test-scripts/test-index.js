// Complete Test Suite Index
// This file maps all test scripts for the Rawgle Testing Portal

export const testIndex = [
  // Infrastructure Tests (001-007)
  { id: '001', name: 'API Health Check', category: 'Infrastructure', priority: 'Critical', file: '001-api-health.js' },
  { id: '002', name: 'CORS Validation', category: 'Security', priority: 'High', file: '002-cors-validation.js' },
  { id: '003', name: 'Authentication System', category: 'Security', priority: 'Critical', file: '003-authentication.js' },
  { id: '004', name: 'Dashboard Functionality', category: 'Functionality', priority: 'High', file: '004-dashboard-functionality.js' },
  { id: '005', name: 'User Story: Authentication Flow', category: 'User Stories', priority: 'High', file: '005-user-story-auth.js' },
  { id: '006', name: 'Infrastructure Validation', category: 'Infrastructure', priority: 'Critical', file: '006-infrastructure-validation.js' },
  { id: '007', name: 'Quick Health Check', category: 'Infrastructure', priority: 'Critical', file: '007-quick-health-check.js' },
  
  // PAWS Basic Tests (008-010)
  { id: '008', name: 'PAWS Balance Management', category: 'Functionality', priority: 'High', file: '008-paws-balance-management.js' },
  { id: '009', name: 'PAWS Rewards System', category: 'Functionality', priority: 'High', file: '009-paws-rewards-system.js' },
  { id: '010', name: 'Daily Limits & Anti-Bot Protection', category: 'Security', priority: 'High', file: '010-daily-limits-antibot.js' },
  
  // Authentication Tests (011-024)
  { id: '011', name: 'User Registration', category: 'Authentication', priority: 'Critical', file: '011-user-registration.js' },
  { id: '012', name: 'Duplicate Email Prevention', category: 'Authentication', priority: 'High', file: '012-duplicate-email-prevention.js' },
  { id: '013', name: 'Password Strength Validation', category: 'Authentication', priority: 'High', file: '013-password-strength.js' },
  { id: '014', name: 'Email Format Validation', category: 'Authentication', priority: 'Medium', file: '014-email-validation.js' },
  { id: '015', name: 'User Login', category: 'Authentication', priority: 'Critical', file: '015-user-login.js' },
  { id: '016', name: 'Invalid Credentials Handling', category: 'Authentication', priority: 'High', file: '016-invalid-credentials.js' },
  { id: '017', name: 'Login Rate Limiting', category: 'Authentication', priority: 'High', file: '017-login-rate-limiting.js' },
  { id: '018', name: 'Session Token Creation', category: 'Authentication', priority: 'Critical', file: '018-session-token-creation.js' },
  { id: '019', name: 'Session Logout', category: 'Authentication', priority: 'High', file: '019-session-logout.js' },
  { id: '020', name: 'Session Expiration', category: 'Authentication', priority: 'Medium', file: '020-session-expiration.js' },
  { id: '021', name: 'Solana Wallet Linking', category: 'Authentication', priority: 'High', file: '021-wallet-linking.js' },
  { id: '022', name: 'Duplicate Wallet Prevention', category: 'Authentication', priority: 'Medium', file: '022-duplicate-wallet.js' },
  { id: '023', name: 'Password Reset Flow', category: 'Authentication', priority: 'High', file: '023-password-reset.js' },
  { id: '024', name: 'Two-Factor Authentication', category: 'Authentication', priority: 'Medium', file: '024-two-factor-auth.js' },
  
  // PAWS Cryptocurrency Tests (025-043)
  { id: '025', name: 'PAWS Balance Retrieval', category: 'PAWS', priority: 'Critical', file: '025-paws-balance-retrieval.js' },
  { id: '026', name: 'Non-Existent User Balance', category: 'PAWS', priority: 'Medium', file: '026-nonexistent-user-balance.js' },
  { id: '027', name: 'Profile Completion Rewards', category: 'PAWS', priority: 'High', file: '027-profile-completion-rewards.js' },
  { id: '028', name: 'Daily Feeding Rewards', category: 'PAWS', priority: 'High', file: '028-daily-feeding-rewards.js' },
  { id: '029', name: 'Weekly Consistency Bonus', category: 'PAWS', priority: 'Medium', file: '029-weekly-consistency-bonus.js' },
  { id: '030', name: 'Monthly Health Report Rewards', category: 'PAWS', priority: 'Medium', file: '030-monthly-health-rewards.js' },
  { id: '031', name: 'Invalid Reward Type Rejection', category: 'PAWS', priority: 'Low', file: '031-invalid-reward-rejection.js' },
  { id: '032', name: 'Daily Earning Limits', category: 'PAWS', priority: 'High', file: '032-daily-earning-limits.js' },
  { id: '033', name: 'Bot Behavior Detection', category: 'PAWS', priority: 'Critical', file: '033-bot-detection.js' },
  { id: '034', name: 'Legitimate Rapid Actions', category: 'PAWS', priority: 'Medium', file: '034-legitimate-rapid-actions.js' },
  { id: '035', name: 'Daily Limit Reset', category: 'PAWS', priority: 'Medium', file: '035-daily-limit-reset.js' },
  { id: '036', name: 'PAWS Transfer Between Users', category: 'PAWS', priority: 'High', file: '036-paws-transfer.js' },
  { id: '037', name: 'Insufficient Balance Transfer', category: 'PAWS', priority: 'High', file: '037-insufficient-balance.js' },
  { id: '038', name: 'Negative Transfer Prevention', category: 'PAWS', priority: 'High', file: '038-negative-transfer.js' },
  { id: '039', name: 'Self-Transfer Prevention', category: 'PAWS', priority: 'Low', file: '039-self-transfer.js' },
  { id: '040', name: 'PAWS Blockchain Minting', category: 'PAWS', priority: 'High', file: '040-blockchain-minting.js' },
  { id: '041', name: 'Admin Minting Privileges', category: 'PAWS', priority: 'Critical', file: '041-admin-minting.js' },
  { id: '042', name: 'Transaction History Retrieval', category: 'PAWS', priority: 'Medium', file: '042-transaction-history.js' },
  { id: '043', name: 'Subscriber Multipliers', category: 'PAWS', priority: 'Medium', file: '043-subscriber-multipliers.js' },
  
  // AI Medical Tests (044-058)
  { id: '044', name: 'Basic Health Assessment', category: 'AI Medical', priority: 'High', file: '044-basic-health-assessment.js' },
  { id: '045', name: 'Emergency Symptom Detection', category: 'AI Medical', priority: 'Critical', file: '045-emergency-symptoms.js' },
  { id: '046', name: 'Pet History Context Analysis', category: 'AI Medical', priority: 'High', file: '046-history-context.js' },
  { id: '047', name: 'Visual Symptom Analysis', category: 'AI Medical', priority: 'High', file: '047-visual-analysis.js' },
  { id: '048', name: 'Required Field Validation', category: 'AI Medical', priority: 'Medium', file: '048-field-validation.js' },
  { id: '049', name: 'Non-Existent Pet Handling', category: 'AI Medical', priority: 'Low', file: '049-nonexistent-pet.js' },
  { id: '050', name: 'Consultation History Retrieval', category: 'AI Medical', priority: 'Medium', file: '050-consultation-history.js' },
  { id: '051', name: 'Date Range Filtering', category: 'AI Medical', priority: 'Low', file: '051-date-filtering.js' },
  { id: '052', name: 'Emergency Alert Queuing', category: 'AI Medical', priority: 'Critical', file: '052-emergency-alerts.js' },
  { id: '053', name: 'Non-Emergency Alert Prevention', category: 'AI Medical', priority: 'Medium', file: '053-nonemergency-alerts.js' },
  { id: '054', name: 'AI Model Failure Handling', category: 'AI Medical', priority: 'High', file: '054-ai-failure-handling.js' },
  { id: '055', name: 'Malformed AI Response Parsing', category: 'AI Medical', priority: 'Medium', file: '055-malformed-response.js' },
  { id: '056', name: 'Confidence Threshold Application', category: 'AI Medical', priority: 'Medium', file: '056-confidence-thresholds.js' },
  { id: '057', name: 'R2 Image Storage', category: 'AI Medical', priority: 'Medium', file: '057-image-storage.js' },
  { id: '058', name: 'Consultation Image Retrieval', category: 'AI Medical', priority: 'Medium', file: '058-image-retrieval.js' },
  
  // NFT Tests (059-078)
  { id: '059', name: 'NFT Minting for Subscribers', category: 'NFT', priority: 'High', file: '059-nft-subscriber-minting.js' },
  { id: '060', name: 'NFT Pricing for Free Users', category: 'NFT', priority: 'Medium', file: '060-nft-free-user-pricing.js' },
  { id: '061', name: 'Insufficient PAWS for NFT', category: 'NFT', priority: 'High', file: '061-insufficient-paws-nft.js' },
  { id: '062', name: 'NFT Metadata Generation', category: 'NFT', priority: 'High', file: '062-nft-metadata.js' },
  { id: '063', name: 'Memorial Mode NFTs', category: 'NFT', priority: 'Medium', file: '063-memorial-nfts.js' },
  { id: '064', name: 'Duplicate NFT Prevention', category: 'NFT', priority: 'High', file: '064-duplicate-nft.js' },
  { id: '065', name: 'NFT Queue Processing', category: 'NFT', priority: 'Medium', file: '065-nft-queue.js' },
  { id: '066', name: 'Queue Failure Handling', category: 'NFT', priority: 'Medium', file: '066-queue-failures.js' },
  { id: '067', name: 'NFT Collection Retrieval', category: 'NFT', priority: 'Medium', file: '067-nft-collection.js' },
  { id: '068', name: 'Legacy Status Filtering', category: 'NFT', priority: 'Low', file: '068-legacy-filtering.js' },
  { id: '069', name: 'NFT Transfer Initiation', category: 'NFT', priority: 'High', file: '069-nft-transfer.js' },
  { id: '070', name: 'NFT Ownership Verification', category: 'NFT', priority: 'Critical', file: '070-ownership-verification.js' },
  { id: '071', name: 'NFT Holder Benefits', category: 'NFT', priority: 'Medium', file: '071-holder-benefits.js' },
  { id: '072', name: 'NFT Marketplace Listing', category: 'NFT', priority: 'High', file: '072-marketplace-listing.js' },
  { id: '073', name: 'Marketplace Listings Retrieval', category: 'NFT', priority: 'Medium', file: '073-marketplace-retrieval.js' },
  { id: '074', name: 'NFT Purchase from Marketplace', category: 'NFT', priority: 'High', file: '074-marketplace-purchase.js' },
  { id: '075', name: 'Memorial Metadata Updates', category: 'NFT', priority: 'Low', file: '075-memorial-updates.js' },
  { id: '076', name: 'Unauthorized Metadata Prevention', category: 'NFT', priority: 'High', file: '076-unauthorized-metadata.js' },
  { id: '077', name: 'NFT Minting Statistics', category: 'NFT', priority: 'Low', file: '077-minting-statistics.js' },
  { id: '078', name: 'User NFT Analytics', category: 'NFT', priority: 'Low', file: '078-user-nft-analytics.js' },
  
  // Security Tests (079-102)
  { id: '079', name: 'SQL Injection Prevention', category: 'Security', priority: 'Critical', file: '079-sql-injection.js' },
  { id: '080', name: 'Pet Profile SQL Injection', category: 'Security', priority: 'Critical', file: '080-pet-sql-injection.js' },
  { id: '081', name: 'AI Consultation Input Sanitization', category: 'Security', priority: 'High', file: '081-ai-input-sanitization.js' },
  { id: '082', name: 'Weak Password Rejection', category: 'Security', priority: 'High', file: '082-weak-passwords.js' },
  { id: '083', name: 'Login Attempt Rate Limiting', category: 'Security', priority: 'Critical', file: '083-login-rate-limit.js' },
  { id: '084', name: 'JWT Token Validation', category: 'Security', priority: 'Critical', file: '084-jwt-validation.js' },
  { id: '085', name: 'Session Fixation Prevention', category: 'Security', priority: 'High', file: '085-session-fixation.js' },
  { id: '086', name: 'Cross-User Pet Access Prevention', category: 'Security', priority: 'Critical', file: '086-pet-access-control.js' },
  { id: '087', name: 'Unauthorized PAWS Transfer Prevention', category: 'Security', priority: 'Critical', file: '087-unauthorized-paws.js' },
  { id: '088', name: 'Admin Operation Validation', category: 'Security', priority: 'Critical', file: '088-admin-validation.js' },
  { id: '089', name: 'Privilege Escalation Prevention', category: 'Security', priority: 'Critical', file: '089-privilege-escalation.js' },
  { id: '090', name: 'Input Data Type Validation', category: 'Security', priority: 'High', file: '090-data-type-validation.js' },
  { id: '091', name: 'File Upload Sanitization', category: 'Security', priority: 'High', file: '091-file-upload.js' },
  { id: '092', name: 'Payload Size Limiting', category: 'Security', priority: 'Medium', file: '092-payload-limits.js' },
  { id: '093', name: 'Email Format Security', category: 'Security', priority: 'Medium', file: '093-email-security.js' },
  { id: '094', name: 'HTML Escaping in Content', category: 'Security', priority: 'High', file: '094-html-escaping.js' },
  { id: '095', name: 'API Response Sanitization', category: 'Security', priority: 'High', file: '095-response-sanitization.js' },
  { id: '096', name: 'CORS Header Validation', category: 'Security', priority: 'High', file: '096-cors-headers.js' },
  { id: '097', name: 'Security Headers Verification', category: 'Security', priority: 'High', file: '097-security-headers.js' },
  { id: '098', name: 'Solana Address Validation', category: 'Security', priority: 'Medium', file: '098-solana-validation.js' },
  { id: '099', name: 'Wallet Signature Replay Prevention', category: 'Security', priority: 'High', file: '099-signature-replay.js' },
  { id: '100', name: 'Resource Enumeration Prevention', category: 'Security', priority: 'Medium', file: '100-resource-enumeration.js' },
  { id: '101', name: 'Session Timeout Implementation', category: 'Security', priority: 'Medium', file: '101-session-timeout.js' },
  { id: '102', name: 'Directory Traversal Prevention', category: 'Security', priority: 'Critical', file: '102-directory-traversal.js' },
  
  // Integration Tests (103-119)
  { id: '103', name: 'User Registration & Welcome Bonus', category: 'Integration', priority: 'High', file: '103-registration-bonus.js' },
  { id: '104', name: 'Pet Profile Creation', category: 'Integration', priority: 'High', file: '104-pet-profile-creation.js' },
  { id: '105', name: 'Profile Completion PAWS Earning', category: 'Integration', priority: 'Medium', file: '105-profile-paws-earning.js' },
  { id: '106', name: 'Daily Feeding Logging', category: 'Integration', priority: 'High', file: '106-daily-feeding-log.js' },
  { id: '107', name: 'AI Medical Consultation Flow', category: 'Integration', priority: 'High', file: '107-ai-consultation-flow.js' },
  { id: '108', name: 'NFT Minting for Pet', category: 'Integration', priority: 'Medium', file: '108-pet-nft-minting.js' },
  { id: '109', name: 'Analytics Dashboard Check', category: 'Integration', priority: 'Medium', file: '109-analytics-dashboard.js' },
  { id: '110', name: 'Subscription Upgrade', category: 'Integration', priority: 'High', file: '110-subscription-upgrade.js' },
  { id: '111', name: 'Subscription Benefits Application', category: 'Integration', priority: 'Medium', file: '111-subscription-benefits.js' },
  { id: '112', name: 'Weekly Feeding Consistency', category: 'Integration', priority: 'Medium', file: '112-weekly-consistency.js' },
  { id: '113', name: 'Concurrent Request Handling', category: 'Integration', priority: 'High', file: '113-concurrent-requests.js' },
  { id: '114', name: 'Database Failure Recovery', category: 'Integration', priority: 'Critical', file: '114-database-recovery.js' },
  { id: '115', name: 'Malformed Request Handling', category: 'Integration', priority: 'High', file: '115-malformed-requests.js' },
  { id: '116', name: 'Rate Limiting Enforcement', category: 'Integration', priority: 'High', file: '116-rate-limit-enforcement.js' },
  { id: '117', name: 'Transactional Integrity', category: 'Integration', priority: 'Critical', file: '117-transaction-integrity.js' },
  { id: '118', name: 'Orphaned Records Handling', category: 'Integration', priority: 'Medium', file: '118-orphaned-records.js' },
  { id: '119', name: 'Cron Job Processing', category: 'Integration', priority: 'Medium', file: '119-cron-processing.js' },
  
  // Performance Tests (120-125)
  { id: '120', name: 'API Response Time', category: 'Performance', priority: 'High', file: '120-response-time.js' },
  { id: '121', name: 'Concurrent User Load', category: 'Performance', priority: 'High', file: '121-concurrent-load.js' },
  { id: '122', name: 'Database Query Performance', category: 'Performance', priority: 'High', file: '122-database-performance.js' },
  { id: '123', name: 'Image Upload Performance', category: 'Performance', priority: 'Medium', file: '123-image-upload.js' },
  { id: '124', name: 'Queue Processing Speed', category: 'Performance', priority: 'Medium', file: '124-queue-performance.js' },
  { id: '125', name: 'Cache Effectiveness', category: 'Performance', priority: 'Medium', file: '125-cache-effectiveness.js' }
];

// Export categories for filtering
export const testCategories = [
  'Infrastructure',
  'Security', 
  'Functionality',
  'User Stories',
  'Authentication',
  'PAWS',
  'AI Medical',
  'NFT',
  'Integration',
  'Performance'
];

// Export priority levels
export const testPriorities = [
  'Critical',
  'High',
  'Medium', 
  'Low'
];

// Helper function to get tests by category
export function getTestsByCategory(category) {
  return testIndex.filter(test => test.category === category);
}

// Helper function to get tests by priority
export function getTestsByPriority(priority) {
  return testIndex.filter(test => test.priority === priority);
}

// Helper function to get test by ID
export function getTestById(id) {
  return testIndex.find(test => test.id === id);
}

// Get total test count
export function getTotalTestCount() {
  return testIndex.length;
}

// Get test statistics
export function getTestStatistics() {
  const stats = {
    total: testIndex.length,
    byCategory: {},
    byPriority: {}
  };
  
  testCategories.forEach(cat => {
    stats.byCategory[cat] = testIndex.filter(t => t.category === cat).length;
  });
  
  testPriorities.forEach(pri => {
    stats.byPriority[pri] = testIndex.filter(t => t.priority === pri).length;
  });
  
  return stats;
}