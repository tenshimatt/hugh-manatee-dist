/**
 * Comprehensive Live API Test Suite for Rawgle Platform
 * Tests all endpoints against the deployed API at https://rawgle-api.findrawdogfood.workers.dev
 * 
 * Test Categories:
 * 1. Health and System Status
 * 2. Authentication Flow
 * 3. PAWS System
 * 4. Pet Management
 * 5. AI Medical Consultations
 * 6. NFT System
 * 7. Analytics and Reporting
 * 8. Rate Limiting and Security
 */

const API_BASE_URL = 'https://rawgle-api.findrawdogfood.workers.dev';

// Test configuration
const CONFIG = {
    timeout: 30000,
    maxRetries: 3,
    testUser: {
        email: `test-${Date.now()}@rawgle-test.com`,
        password: 'TestPass123!',
        walletAddress: '11111111111111111111111111111111' // Mock Solana address
    }
};

// Test results storage
let testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    details: []
};

// Authentication storage for session tests
let authTokens = {
    sessionToken: null,
    userId: null
};

/**
 * HTTP Client with error handling and retries
 */
class APIClient {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Rawgle-Live-API-Test/1.0',
                ...options.headers
            },
            ...options
        };

        let lastError;
        
        for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
            try {
                console.log(`[${attempt}/${CONFIG.maxRetries}] ${config.method} ${url}`);
                
                const response = await fetch(url, config);
                const responseText = await response.text();
                
                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                } catch {
                    responseData = { rawResponse: responseText };
                }

                return {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    data: responseData,
                    ok: response.ok
                };
            } catch (error) {
                lastError = error;
                console.log(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < CONFIG.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`All ${CONFIG.maxRetries} attempts failed. Last error: ${lastError.message}`);
    }
}

/**
 * Test utilities
 */
function logTest(name, status, details = '') {
    const timestamp = new Date().toISOString();
    const result = {
        name,
        status,
        details,
        timestamp
    };
    
    testResults.details.push(result);
    
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${name} - PASSED ${details}`);
    } else if (status === 'FAIL') {
        testResults.failed++;
        console.log(`❌ ${name} - FAILED ${details}`);
        testResults.errors.push({ name, details });
    } else if (status === 'SKIP') {
        testResults.skipped++;
        console.log(`⏭️  ${name} - SKIPPED ${details}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 1. HEALTH AND SYSTEM STATUS TESTS
 */
async function testHealthEndpoints() {
    console.log('\n🏥 Testing Health and System Status...');
    
    // Test basic health check
    try {
        const response = await APIClient.request('/api/health');
        assert(response.ok, `Health check failed with status ${response.status}`);
        assert(response.data.status === 'healthy', 'Health status is not healthy');
        assert(response.data.timestamp, 'Health response missing timestamp');
        assert(response.data.version, 'Health response missing version');
        
        logTest('Basic Health Check', 'PASS', `Status: ${response.data.status}, Version: ${response.data.version}`);
    } catch (error) {
        logTest('Basic Health Check', 'FAIL', error.message);
    }
    
    // Test database health check
    try {
        const response = await APIClient.request('/api/health/db');
        assert(response.ok, `DB health check failed with status ${response.status}`);
        assert(response.data.status === 'healthy', 'Database status is not healthy');
        assert(response.data.database === 'connected', 'Database is not connected');
        
        logTest('Database Health Check', 'PASS', `Database: ${response.data.database}`);
    } catch (error) {
        logTest('Database Health Check', 'FAIL', error.message);
    }
    
    // Test CORS headers
    try {
        const response = await APIClient.request('/api/health', { method: 'OPTIONS' });
        assert(response.status === 200 || response.status === 204, 'CORS preflight failed');
        assert(response.headers['access-control-allow-origin'], 'Missing CORS origin header');
        assert(response.headers['access-control-allow-methods'], 'Missing CORS methods header');
        
        logTest('CORS Headers Test', 'PASS', 'All required CORS headers present');
    } catch (error) {
        logTest('CORS Headers Test', 'FAIL', error.message);
    }
}

/**
 * 2. AUTHENTICATION FLOW TESTS
 */
async function testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    // Test user registration
    try {
        const registerData = {
            email: CONFIG.testUser.email,
            password: CONFIG.testUser.password,
            walletAddress: CONFIG.testUser.walletAddress
        };
        
        const response = await APIClient.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        assert(response.status === 201, `Registration failed with status ${response.status}`);
        assert(response.data.userId, 'Registration response missing userId');
        assert(response.data.sessionToken, 'Registration response missing sessionToken');
        assert(response.data.pawsBalance >= 0, 'Registration response missing pawsBalance');
        assert(response.data.email === CONFIG.testUser.email.toLowerCase(), 'Email mismatch in response');
        
        // Store auth info for subsequent tests
        authTokens.sessionToken = response.data.sessionToken;
        authTokens.userId = response.data.userId;
        
        logTest('User Registration', 'PASS', `User ID: ${response.data.userId}, PAWS: ${response.data.pawsBalance}`);
    } catch (error) {
        logTest('User Registration', 'FAIL', error.message);
    }
    
    // Test session validation
    if (authTokens.sessionToken) {
        try {
            const response = await APIClient.request('/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authTokens.sessionToken}`
                }
            });
            
            assert(response.ok, `Session validation failed with status ${response.status}`);
            assert(response.data.valid === true, 'Session validation returned invalid');
            assert(response.data.userId === authTokens.userId, 'User ID mismatch in validation');
            
            logTest('Session Validation', 'PASS', `Valid session for user ${response.data.userId}`);
        } catch (error) {
            logTest('Session Validation', 'FAIL', error.message);
        }
    } else {
        logTest('Session Validation', 'SKIP', 'No session token available from registration');
    }
    
    // Test logout
    if (authTokens.sessionToken) {
        try {
            const response = await APIClient.request('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authTokens.sessionToken}`
                }
            });
            
            assert(response.ok, `Logout failed with status ${response.status}`);
            assert(response.data.message, 'Logout response missing message');
            
            logTest('User Logout', 'PASS', response.data.message);
        } catch (error) {
            logTest('User Logout', 'FAIL', error.message);
        }
    } else {
        logTest('User Logout', 'SKIP', 'No session token available');
    }
    
    // Test login after logout
    try {
        const loginData = {
            email: CONFIG.testUser.email,
            password: CONFIG.testUser.password
        };
        
        const response = await APIClient.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        
        assert(response.ok, `Login failed with status ${response.status}`);
        assert(response.data.sessionToken, 'Login response missing sessionToken');
        assert(response.data.userId === authTokens.userId, 'User ID mismatch in login');
        
        // Update session token for subsequent tests
        authTokens.sessionToken = response.data.sessionToken;
        
        logTest('User Login', 'PASS', `Successfully logged in user ${response.data.userId}`);
    } catch (error) {
        logTest('User Login', 'FAIL', error.message);
    }
    
    // Test invalid credentials
    try {
        const invalidLoginData = {
            email: CONFIG.testUser.email,
            password: 'WrongPassword123!'
        };
        
        const response = await APIClient.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(invalidLoginData)
        });
        
        assert(!response.ok, 'Login with invalid credentials should fail');
        assert(response.status === 401, `Expected 401, got ${response.status}`);
        assert(response.data.error, 'Error response should contain error message');
        
        logTest('Invalid Credentials Test', 'PASS', 'Correctly rejected invalid credentials');
    } catch (error) {
        logTest('Invalid Credentials Test', 'FAIL', error.message);
    }
    
    // Test wallet linking
    if (authTokens.sessionToken) {
        try {
            const walletData = {
                walletAddress: '22222222222222222222222222222222', // Different mock wallet
                signature: 'mock_signature_for_testing_purposes'
            };
            
            const response = await APIClient.request('/api/auth/link-wallet', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authTokens.sessionToken}`
                },
                body: JSON.stringify(walletData)
            });
            
            assert(response.ok, `Wallet linking failed with status ${response.status}`);
            assert(response.data.walletLinked === true, 'Wallet linking not confirmed');
            assert(response.data.walletAddress === walletData.walletAddress, 'Wallet address mismatch');
            
            logTest('Wallet Linking', 'PASS', `Linked wallet: ${response.data.walletAddress}`);
        } catch (error) {
            logTest('Wallet Linking', 'FAIL', error.message);
        }
    } else {
        logTest('Wallet Linking', 'SKIP', 'No valid session token');
    }
}

/**
 * 3. PAWS SYSTEM TESTS
 */
async function testPAWSSystem() {
    console.log('\n🐾 Testing PAWS System...');
    
    if (!authTokens.sessionToken) {
        logTest('PAWS Balance Retrieval', 'SKIP', 'No authentication token');
        logTest('PAWS Reward Distribution', 'SKIP', 'No authentication token');
        logTest('PAWS Transfer Operations', 'SKIP', 'No authentication token');
        return;
    }
    
    // Test PAWS balance retrieval
    try {
        const response = await APIClient.request('/api/paws/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `PAWS balance request failed with status ${response.status}`);
        assert(typeof response.data.balance === 'number', 'PAWS balance is not a number');
        assert(response.data.balance >= 0, 'PAWS balance should not be negative');
        
        logTest('PAWS Balance Retrieval', 'PASS', `Balance: ${response.data.balance} PAWS`);
    } catch (error) {
        logTest('PAWS Balance Retrieval', 'FAIL', error.message);
    }
    
    // Test PAWS transaction history
    try {
        const response = await APIClient.request('/api/paws/transactions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `PAWS transactions request failed with status ${response.status}`);
        assert(Array.isArray(response.data.transactions), 'Transactions should be an array');
        
        logTest('PAWS Transaction History', 'PASS', `Found ${response.data.transactions.length} transactions`);
    } catch (error) {
        logTest('PAWS Transaction History', 'FAIL', error.message);
    }
    
    // Test PAWS reward claiming
    try {
        const rewardData = {
            action: 'daily_checkin',
            amount: 10
        };
        
        const response = await APIClient.request('/api/paws/claim', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify(rewardData)
        });
        
        // This might succeed or fail depending on business logic
        if (response.ok) {
            assert(response.data.amount >= 0, 'Claimed amount should be non-negative');
            logTest('PAWS Reward Claiming', 'PASS', `Claimed ${response.data.amount} PAWS`);
        } else if (response.status === 429 || response.status === 400) {
            // Rate limited or already claimed today - acceptable
            logTest('PAWS Reward Claiming', 'PASS', `Properly handled: ${response.data.error}`);
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        logTest('PAWS Reward Claiming', 'FAIL', error.message);
    }
}

/**
 * 4. PET MANAGEMENT TESTS
 */
async function testPetManagement() {
    console.log('\n🐕 Testing Pet Management...');
    
    if (!authTokens.sessionToken) {
        logTest('Pet Profile Creation', 'SKIP', 'No authentication token');
        logTest('Pet Profile Retrieval', 'SKIP', 'No authentication token');
        logTest('Pet Profile Update', 'SKIP', 'No authentication token');
        return;
    }
    
    let petId = null;
    
    // Test pet profile creation
    try {
        const petData = {
            name: 'Test Dog Buddy',
            breed: 'Golden Retriever',
            age: 3,
            weight: 65,
            activityLevel: 'high',
            healthConditions: [],
            dietaryRestrictions: []
        };
        
        const response = await APIClient.request('/api/pets/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify(petData)
        });
        
        assert(response.ok, `Pet creation failed with status ${response.status}`);
        assert(response.data.petId, 'Pet creation response missing petId');
        assert(response.data.name === petData.name, 'Pet name mismatch');
        
        petId = response.data.petId;
        logTest('Pet Profile Creation', 'PASS', `Created pet: ${response.data.name} (ID: ${petId})`);
    } catch (error) {
        logTest('Pet Profile Creation', 'FAIL', error.message);
    }
    
    // Test pet profile retrieval
    if (petId) {
        try {
            const response = await APIClient.request(`/api/pets/${petId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authTokens.sessionToken}`
                }
            });
            
            assert(response.ok, `Pet retrieval failed with status ${response.status}`);
            assert(response.data.id === petId, 'Pet ID mismatch');
            assert(response.data.name, 'Pet name missing');
            assert(response.data.breed, 'Pet breed missing');
            
            logTest('Pet Profile Retrieval', 'PASS', `Retrieved pet: ${response.data.name}`);
        } catch (error) {
            logTest('Pet Profile Retrieval', 'FAIL', error.message);
        }
        
        // Test pet profile update
        try {
            const updateData = {
                weight: 70,
                notes: 'Updated weight after vet visit'
            };
            
            const response = await APIClient.request(`/api/pets/${petId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authTokens.sessionToken}`
                },
                body: JSON.stringify(updateData)
            });
            
            assert(response.ok, `Pet update failed with status ${response.status}`);
            assert(response.data.updated === true, 'Pet update not confirmed');
            
            logTest('Pet Profile Update', 'PASS', `Updated pet weight to ${updateData.weight}lbs`);
        } catch (error) {
            logTest('Pet Profile Update', 'FAIL', error.message);
        }
    } else {
        logTest('Pet Profile Retrieval', 'SKIP', 'No pet ID available');
        logTest('Pet Profile Update', 'SKIP', 'No pet ID available');
    }
    
    // Test pet list retrieval
    try {
        const response = await APIClient.request('/api/pets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `Pet list retrieval failed with status ${response.status}`);
        assert(Array.isArray(response.data.pets), 'Pets should be an array');
        
        logTest('Pet List Retrieval', 'PASS', `Found ${response.data.pets.length} pets`);
    } catch (error) {
        logTest('Pet List Retrieval', 'FAIL', error.message);
    }
}

/**
 * 5. AI MEDICAL CONSULTATION TESTS
 */
async function testAIMedicalConsultations() {
    console.log('\n🏥 Testing AI Medical Consultations...');
    
    if (!authTokens.sessionToken) {
        logTest('AI Health Assessment', 'SKIP', 'No authentication token');
        logTest('Emergency Detection', 'SKIP', 'No authentication token');
        return;
    }
    
    // Test basic health assessment
    try {
        const consultationData = {
            petId: 'test-pet-id',
            symptoms: ['lethargy', 'loss of appetite'],
            urgency: 'medium',
            description: 'My dog has been sleeping more than usual and eating less for the past 2 days.'
        };
        
        const response = await APIClient.request('/api/ai-medical/consultation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify(consultationData)
        });
        
        assert(response.ok, `AI consultation failed with status ${response.status}`);
        assert(response.data.consultationId, 'Consultation ID missing');
        assert(response.data.assessment, 'AI assessment missing');
        assert(response.data.recommendations, 'Recommendations missing');
        
        logTest('AI Health Assessment', 'PASS', `Consultation ID: ${response.data.consultationId}`);
    } catch (error) {
        logTest('AI Health Assessment', 'FAIL', error.message);
    }
    
    // Test emergency detection
    try {
        const emergencyData = {
            petId: 'test-pet-id',
            symptoms: ['difficulty breathing', 'collapse', 'blue gums'],
            urgency: 'critical',
            description: 'EMERGENCY: My dog collapsed and is having trouble breathing!'
        };
        
        const response = await APIClient.request('/api/ai-medical/consultation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify(emergencyData)
        });
        
        assert(response.ok, `Emergency consultation failed with status ${response.status}`);
        assert(response.data.emergency === true, 'Emergency not detected');
        assert(response.data.urgency === 'critical', 'Emergency urgency not properly set');
        
        logTest('Emergency Detection', 'PASS', 'Emergency properly detected and flagged');
    } catch (error) {
        logTest('Emergency Detection', 'FAIL', error.message);
    }
    
    // Test consultation history
    try {
        const response = await APIClient.request('/api/ai-medical/history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `Consultation history failed with status ${response.status}`);
        assert(Array.isArray(response.data.consultations), 'Consultations should be an array');
        
        logTest('Consultation History', 'PASS', `Found ${response.data.consultations.length} consultations`);
    } catch (error) {
        logTest('Consultation History', 'FAIL', error.message);
    }
}

/**
 * 6. NFT SYSTEM TESTS
 */
async function testNFTSystem() {
    console.log('\n🎨 Testing NFT System...');
    
    if (!authTokens.sessionToken) {
        logTest('NFT Minting', 'SKIP', 'No authentication token');
        logTest('NFT Collection Retrieval', 'SKIP', 'No authentication token');
        return;
    }
    
    // Test NFT minting
    try {
        const mintData = {
            petId: 'test-pet-id',
            type: 'memorial',
            metadata: {
                name: 'Buddy Memorial NFT',
                description: 'In loving memory of Buddy',
                traits: ['loyal', 'playful', 'beloved']
            }
        };
        
        const response = await APIClient.request('/api/nft/mint', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify(mintData)
        });
        
        assert(response.ok, `NFT minting failed with status ${response.status}`);
        assert(response.data.mintAddress, 'Mint address missing');
        assert(response.data.metadata, 'NFT metadata missing');
        
        logTest('NFT Minting', 'PASS', `Minted NFT: ${response.data.mintAddress}`);
    } catch (error) {
        logTest('NFT Minting', 'FAIL', error.message);
    }
    
    // Test NFT collection retrieval
    try {
        const response = await APIClient.request('/api/nft/collection', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `NFT collection retrieval failed with status ${response.status}`);
        assert(Array.isArray(response.data.nfts), 'NFTs should be an array');
        
        logTest('NFT Collection Retrieval', 'PASS', `Found ${response.data.nfts.length} NFTs`);
    } catch (error) {
        logTest('NFT Collection Retrieval', 'FAIL', error.message);
    }
    
    // Test NFT metadata retrieval
    try {
        const response = await APIClient.request('/api/nft/metadata/test-mint-address', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        // This might return 404 if no NFT exists, which is acceptable
        if (response.ok) {
            assert(response.data.metadata, 'NFT metadata missing');
            logTest('NFT Metadata Retrieval', 'PASS', 'Successfully retrieved NFT metadata');
        } else if (response.status === 404) {
            logTest('NFT Metadata Retrieval', 'PASS', 'Correctly returned 404 for non-existent NFT');
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        logTest('NFT Metadata Retrieval', 'FAIL', error.message);
    }
}

/**
 * 7. ANALYTICS AND REPORTING TESTS
 */
async function testAnalyticsAndReporting() {
    console.log('\n📊 Testing Analytics and Reporting...');
    
    if (!authTokens.sessionToken) {
        logTest('Usage Metrics', 'SKIP', 'No authentication token');
        logTest('System Analytics', 'SKIP', 'No authentication token');
        return;
    }
    
    // Test usage metrics
    try {
        const response = await APIClient.request('/api/analytics/usage', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `Usage metrics failed with status ${response.status}`);
        assert(response.data.metrics, 'Usage metrics missing');
        
        logTest('Usage Metrics', 'PASS', 'Successfully retrieved usage metrics');
    } catch (error) {
        logTest('Usage Metrics', 'FAIL', error.message);
    }
    
    // Test system analytics
    try {
        const response = await APIClient.request('/api/analytics/system', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            }
        });
        
        assert(response.ok, `System analytics failed with status ${response.status}`);
        assert(response.data.analytics, 'System analytics missing');
        
        logTest('System Analytics', 'PASS', 'Successfully retrieved system analytics');
    } catch (error) {
        logTest('System Analytics', 'FAIL', error.message);
    }
    
    // Test daily report generation
    try {
        const response = await APIClient.request('/api/analytics/daily-report', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authTokens.sessionToken}`
            },
            body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
        });
        
        // This might return different status codes based on implementation
        if (response.ok) {
            logTest('Daily Report Generation', 'PASS', 'Successfully generated daily report');
        } else if (response.status === 202) {
            logTest('Daily Report Generation', 'PASS', 'Daily report generation queued');
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        logTest('Daily Report Generation', 'FAIL', error.message);
    }
}

/**
 * 8. RATE LIMITING AND SECURITY TESTS
 */
async function testRateLimitingAndSecurity() {
    console.log('\n🛡️ Testing Rate Limiting and Security...');
    
    // Test rate limiting on health endpoint
    try {
        let successCount = 0;
        let rateLimitHit = false;
        
        for (let i = 0; i < 15; i++) {
            try {
                const response = await APIClient.request('/api/health', { method: 'GET' });
                if (response.status === 429) {
                    rateLimitHit = true;
                    break;
                }
                if (response.ok) successCount++;
            } catch (error) {
                // Continue testing even if some requests fail
            }
            
            // Small delay between requests
            await sleep(100);
        }
        
        if (rateLimitHit) {
            logTest('Rate Limiting', 'PASS', `Rate limit triggered after ${successCount} requests`);
        } else {
            logTest('Rate Limiting', 'PASS', `Processed ${successCount} requests without rate limiting`);
        }
    } catch (error) {
        logTest('Rate Limiting', 'FAIL', error.message);
    }
    
    // Test authentication required endpoints
    try {
        const response = await APIClient.request('/api/paws/balance', { method: 'GET' });
        assert(!response.ok, 'Protected endpoint should require authentication');
        assert(response.status === 401, `Expected 401, got ${response.status}`);
        
        logTest('Authentication Required', 'PASS', 'Protected endpoints properly require authentication');
    } catch (error) {
        logTest('Authentication Required', 'FAIL', error.message);
    }
    
    // Test invalid JWT token
    try {
        const response = await APIClient.request('/api/paws/balance', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid-token-123'
            }
        });
        
        assert(!response.ok, 'Invalid token should be rejected');
        assert(response.status === 401, `Expected 401, got ${response.status}`);
        
        logTest('Invalid Token Rejection', 'PASS', 'Invalid tokens properly rejected');
    } catch (error) {
        logTest('Invalid Token Rejection', 'FAIL', error.message);
    }
    
    // Test malformed requests
    try {
        const response = await APIClient.request('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid-json-body'
        });
        
        assert(!response.ok, 'Malformed JSON should be rejected');
        assert(response.status === 400, `Expected 400, got ${response.status}`);
        
        logTest('Malformed Request Rejection', 'PASS', 'Malformed requests properly rejected');
    } catch (error) {
        logTest('Malformed Request Rejection', 'FAIL', error.message);
    }
}

/**
 * MAIN TEST RUNNER
 */
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Live API Tests for Rawgle Platform');
    console.log(`📍 Testing API at: ${API_BASE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    
    const startTime = Date.now();
    
    try {
        // Run all test suites
        await testHealthEndpoints();
        await testAuthenticationFlow();
        await testPAWSSystem();
        await testPetManagement();
        await testAIMedicalConsultations();
        await testNFTSystem();
        await testAnalyticsAndReporting();
        await testRateLimitingAndSecurity();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        testResults.errors.push({ name: 'Test Suite', details: error.message });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Generate test report
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️  Skipped: ${testResults.skipped}`);
    console.log(`⏱️  Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.errors.forEach(error => {
            console.log(`   • ${error.name}: ${error.details}`);
        });
    }
    
    // Generate detailed report
    const report = {
        summary: {
            apiBaseUrl: API_BASE_URL,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: duration,
            passed: testResults.passed,
            failed: testResults.failed,
            skipped: testResults.skipped,
            successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
        },
        details: testResults.details,
        errors: testResults.errors,
        recommendations: generateRecommendations()
    };
    
    return report;
}

/**
 * GENERATE RECOMMENDATIONS
 */
function generateRecommendations() {
    const recommendations = [];
    
    if (testResults.failed > 0) {
        recommendations.push({
            category: 'Critical Issues',
            priority: 'High',
            description: `${testResults.failed} tests failed. Review error details and fix failing endpoints.`
        });
    }
    
    if (testResults.errors.some(e => e.name.includes('Health'))) {
        recommendations.push({
            category: 'Infrastructure',
            priority: 'High',
            description: 'Health check endpoints are failing. Verify database connectivity and basic API functionality.'
        });
    }
    
    if (testResults.errors.some(e => e.name.includes('Auth'))) {
        recommendations.push({
            category: 'Security',
            priority: 'High',
            description: 'Authentication system has issues. Verify JWT implementation and session management.'
        });
    }
    
    if (testResults.errors.some(e => e.name.includes('Rate Limit'))) {
        recommendations.push({
            category: 'Performance',
            priority: 'Medium',
            description: 'Rate limiting may need adjustment. Review rate limiting configuration and thresholds.'
        });
    }
    
    if (testResults.skipped > testResults.passed / 2) {
        recommendations.push({
            category: 'Test Coverage',
            priority: 'Medium',
            description: 'Many tests were skipped due to authentication failures. Fix auth flow to enable full testing.'
        });
    }
    
    // Add positive recommendations
    if (testResults.passed > testResults.failed) {
        recommendations.push({
            category: 'Success',
            priority: 'Info',
            description: `API is functioning well with ${testResults.passed} passing tests. Continue monitoring and maintenance.`
        });
    }
    
    return recommendations;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, APIClient, CONFIG };
}

// Auto-run if executed directly
if (typeof window === 'undefined' && require.main === module) {
    runAllTests()
        .then(report => {
            console.log('\n💾 Full test report available in return value');
            process.exit(testResults.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        });
}