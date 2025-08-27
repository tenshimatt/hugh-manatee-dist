# PAWS Token System - Security Architecture

## Executive Summary

PAWS (Pet Activity and Wellness System) token security architecture implements defense-in-depth security for a blockchain-like token economy focused on pet care activities, rewards, and marketplace transactions. This document outlines critical security controls to protect token integrity, prevent fraud, and secure user financial data.

## 1. Core Token Security

### Token Ledger Architecture

```typescript
// Immutable transaction ledger with cryptographic integrity
interface PAWSTransaction {
  id: string;                    // UUID v4
  from_user_id: string;         // Source account
  to_user_id: string;           // Destination account
  amount: number;               // Token amount (integer, no decimals)
  transaction_type: 'EARN' | 'SPEND' | 'TRANSFER' | 'ADMIN';
  reason: string;               // Activity description
  metadata: object;             // Activity-specific data
  hash: string;                 // SHA-256 hash of transaction
  previous_hash: string;        // Link to previous transaction
  timestamp: string;            // ISO 8601 timestamp
  signature: string;            // HMAC-SHA256 signature
}
```

### Double-Spend Prevention

**Atomic Balance Validation:**
```sql
-- Database constraint preventing negative balances
ALTER TABLE user_balances 
ADD CONSTRAINT check_non_negative_balance 
CHECK (balance >= 0);

-- Atomic transaction processing
BEGIN TRANSACTION;
  -- 1. Verify sender balance
  SELECT balance FROM user_balances WHERE user_id = ? FOR UPDATE;
  
  -- 2. Validate transaction amount
  IF sender_balance >= transaction_amount THEN
    -- 3. Update balances atomically
    UPDATE user_balances SET balance = balance - ? WHERE user_id = ?;
    UPDATE user_balances SET balance = balance + ? WHERE user_id = ?;
    
    -- 4. Record transaction
    INSERT INTO paws_transactions (...) VALUES (...);
  ELSE
    ROLLBACK;
  END IF;
COMMIT;
```

### Fraud Detection Engine

**Real-time Fraud Scoring:**
- **Velocity checks**: Max 50 tokens earned per day per user
- **Pattern analysis**: Detect automated earning attempts
- **Geolocation validation**: Flag impossible travel times
- **Device fingerprinting**: Track suspicious device changes
- **Social graph analysis**: Detect coordinated fraud rings

```typescript
interface FraudDetectionRules {
  max_daily_earnings: 50;           // Token limit per 24h
  max_transaction_frequency: 10;    // Transactions per hour
  suspicious_velocity_threshold: 5; // Rapid successive transactions
  geo_fence_validation: true;       // Location consistency checks
  device_change_lockout: 24;        // Hours before new device allowed
}
```

## 2. Authentication Security

### JWT Implementation

**Token Structure:**
```typescript
interface PAWSJWTPayload {
  sub: string;           // User ID
  email: string;         // User email
  role: 'user' | 'admin' | 'moderator';
  permissions: string[]; // Granular permissions
  device_id: string;     // Device fingerprint
  iat: number;          // Issued at
  exp: number;          // Expires (15 minutes)
  jti: string;          // JWT ID for revocation
}
```

**Security Controls:**
- **Algorithm**: RS256 (RSA with SHA-256)
- **Key rotation**: Every 90 days
- **Token expiry**: 15 minutes (access) / 7 days (refresh)
- **Refresh rotation**: New refresh token on every use
- **Blacklist management**: Revoked tokens stored in Redis

### Refresh Token Security

```typescript
// Secure refresh token implementation
class RefreshTokenManager {
  async rotateToken(currentRefreshToken: string): Promise<TokenPair> {
    // 1. Validate current refresh token
    const tokenData = await this.validateRefreshToken(currentRefreshToken);
    
    // 2. Blacklist old refresh token immediately
    await this.blacklistToken(currentRefreshToken);
    
    // 3. Generate new token pair
    const newTokens = await this.generateTokenPair(tokenData.userId);
    
    // 4. Store new refresh token hash
    await this.storeRefreshTokenHash(newTokens.refreshToken);
    
    return newTokens;
  }
}
```

### Biometric Integration

**Face ID/Touch ID Security:**
```typescript
interface BiometricConfig {
  fallback_to_passcode: false;     // Require biometric only
  invalidate_on_enrollment: true;  // New biometric invalidates tokens
  local_authentication_only: true; // No biometric data sent to server
  prompt_reason: "Verify your identity to access PAWS tokens";
}

// iOS Implementation
import LocalAuthentication

func authenticateWithBiometrics() -> Promise<Bool> {
  let context = LAContext()
  context.localizedFallbackTitle = "" // Disable passcode fallback
  
  return context.evaluatePolicy(
    .deviceOwnerAuthenticationWithBiometrics,
    localizedReason: BiometricConfig.prompt_reason
  )
}
```

## 3. Payment Security

### PCI DSS Compliance via Stripe

**Secure Payment Flow:**
```typescript
// Client-side: Tokenize payment method (PCI-compliant)
const paymentMethod = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});

// Server-side: Process payment without touching card data
const paymentIntent = await stripe.paymentIntents.create({
  amount: calculateAmount(tokenPurchase),
  currency: 'usd',
  payment_method: paymentMethod.id,
  metadata: {
    user_id: userId,
    token_amount: tokenAmount,
    purchase_type: 'PAWS_TOKENS'
  }
});
```

**Security Controls:**
- **No card storage**: All payment data handled by Stripe
- **Webhook verification**: HMAC signature validation
- **Idempotency**: Prevent duplicate charges
- **Amount validation**: Server-side price verification

### Apple Pay/Google Pay Integration

```typescript
// Apple Pay security implementation
const applePayRequest = {
  countryCode: 'US',
  currencyCode: 'USD',
  supportedNetworks: ['visa', 'masterCard', 'amex'],
  merchantCapabilities: ['supports3DS'],
  total: {
    label: 'PAWS Tokens',
    amount: tokenPurchaseAmount
  }
};

// Cryptographic payment verification
function verifyApplePayPayment(payment: ApplePayPayment): boolean {
  // 1. Verify merchant session
  // 2. Validate payment signature
  // 3. Decrypt payment data using merchant private key
  // 4. Verify transaction integrity
  return cryptographicVerification(payment);
}
```

### Financial Fraud Detection

**Real-time Risk Assessment:**
```typescript
interface PaymentRiskFactors {
  new_payment_method: boolean;      // First-time payment method
  unusual_amount: boolean;          // Outside normal purchase range
  velocity_flags: number;           // Rapid purchase attempts
  geolocation_mismatch: boolean;    // Location vs. billing address
  device_reputation: 'trusted' | 'suspicious' | 'blocked';
  purchase_pattern_anomaly: boolean; // Unusual purchasing behavior
}

class PaymentFraudDetector {
  async assessRisk(purchase: TokenPurchase): Promise<RiskScore> {
    const riskFactors = await this.analyzeRiskFactors(purchase);
    const score = this.calculateRiskScore(riskFactors);
    
    if (score > 80) {
      return { action: 'BLOCK', reason: 'High fraud risk' };
    } else if (score > 60) {
      return { action: 'REVIEW', reason: 'Manual review required' };
    } else {
      return { action: 'APPROVE', reason: 'Low risk' };
    }
  }
}
```

## 4. Mobile App Security

### Certificate Pinning

```swift
// iOS Certificate Pinning Implementation
class PAWSURLSessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, 
                   didReceive challenge: URLAuthenticationChallenge, 
                   completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        
        // 1. Get server certificate
        guard let serverTrust = challenge.protectionSpace.serverTrust,
              let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // 2. Get pinned certificate from app bundle
        guard let pinnedCertData = loadPinnedCertificate(),
              let pinnedCert = SecCertificateCreateWithData(nil, pinnedCertData) else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // 3. Compare certificates
        let serverCertData = SecCertificateCopyData(serverCertificate)
        let pinnedCertData = SecCertificateCopyData(pinnedCert)
        
        if CFEqual(serverCertData, pinnedCertData) {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            // Certificate mismatch - potential MITM attack
            logSecurityEvent("Certificate pinning failure")
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
```

### Secure Token Storage

```swift
// iOS Keychain Storage for Sensitive Data
class SecureTokenStorage {
    private let keychainService = "com.paws.tokens"
    
    func storeToken(_ token: String, for key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecValueData as String: token.data(using: .utf8)!,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess {
            logSecurityEvent("Keychain storage failure: \(status)")
        }
    }
    
    func retrieveToken(for key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecSuccess,
           let data = result as? Data,
           let token = String(data: data, encoding: .utf8) {
            return token
        }
        
        return nil
    }
}
```

### Jailbreak/Root Detection

```swift
// iOS Jailbreak Detection
class DeviceSecurityChecker {
    func isDeviceCompromised() -> Bool {
        // 1. Check for jailbreak apps
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Applications/blackra1n.app",
            "/Applications/FakeCarrier.app",
            "/Applications/Icy.app",
            "/Applications/IntelliScreen.app",
            "/Applications/MxTube.app",
            "/Applications/RockApp.app",
            "/Applications/SBSettings.app",
            "/Applications/WinterBoard.app"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        // 2. Check for suspicious file system access
        let testPath = "/private/jailbreak_test.txt"
        do {
            try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            return true // Should not be able to write here on non-jailbroken device
        } catch {
            // Expected on secure device
        }
        
        // 3. Check for Cydia URL scheme
        if let url = URL(string: "cydia://package/com.example.package") {
            return UIApplication.shared.canOpenURL(url)
        }
        
        return false
    }
    
    func handleCompromisedDevice() {
        // 1. Clear sensitive data
        SecureTokenStorage().clearAllTokens()
        
        // 2. Log security event
        logSecurityEvent("Compromised device detected")
        
        // 3. Force re-authentication
        NotificationCenter.default.post(name: .forceLogout, object: nil)
        
        // 4. Display security warning
        showSecurityAlert("Device security compromised. Please use a secure device.")
    }
}
```

## 5. Security Headers Configuration

### Cloudflare Workers Security Headers

```typescript
// Comprehensive security headers for PAWS API
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};

export default {
  async fetch(request: Request): Promise<Response> {
    const response = await handleRequest(request);
    
    // Apply security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};
```

## 6. Security Monitoring & Alerting

### Real-time Security Events

```typescript
interface SecurityEvent {
  event_type: 'LOGIN_ANOMALY' | 'FRAUD_ATTEMPT' | 'DEVICE_COMPROMISE' | 'TOKEN_MANIPULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user_id: string;
  device_id: string;
  ip_address: string;
  details: object;
  timestamp: string;
}

class SecurityMonitor {
  async logSecurityEvent(event: SecurityEvent) {
    // 1. Store in security log
    await this.storeSecurityEvent(event);
    
    // 2. Trigger real-time alerts for high/critical events
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.triggerAlert(event);
    }
    
    // 3. Update user risk score
    await this.updateUserRiskScore(event.user_id, event);
    
    // 4. Check for attack patterns
    await this.detectAttackPatterns(event);
  }
  
  async detectAttackPatterns(event: SecurityEvent) {
    // Look for coordinated attacks across multiple accounts
    const recentEvents = await this.getRecentSecurityEvents(event.event_type, '1hour');
    
    if (recentEvents.length > 10) {
      await this.triggerAlert({
        ...event,
        event_type: 'COORDINATED_ATTACK',
        severity: 'CRITICAL',
        details: { affected_accounts: recentEvents.length }
      });
    }
  }
}
```

## 7. Security Testing Framework

### Automated Security Tests

```typescript
describe('PAWS Token Security', () => {
  test('Token transaction integrity', async () => {
    const originalBalance = await getUserBalance(testUserId);
    const transaction = await createTokenTransaction({
      from_user_id: testUserId,
      to_user_id: recipientId,
      amount: 10,
      transaction_type: 'TRANSFER'
    });
    
    expect(transaction.hash).toMatch(/^[a-f0-9]{64}$/); // Valid SHA-256
    expect(await verifyTransactionIntegrity(transaction)).toBe(true);
    
    const newBalance = await getUserBalance(testUserId);
    expect(newBalance).toBe(originalBalance - 10);
  });
  
  test('Double-spend prevention', async () => {
    const initialBalance = 20;
    await setUserBalance(testUserId, initialBalance);
    
    // Attempt concurrent transactions exceeding balance
    const transactions = Promise.all([
      createTokenTransaction({ amount: 15 }),
      createTokenTransaction({ amount: 15 })
    ]);
    
    await expect(transactions).rejects.toThrow('Insufficient balance');
    
    const finalBalance = await getUserBalance(testUserId);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });
  
  test('JWT security validation', async () => {
    const token = await generateJWT(testUserId);
    
    // Test valid token
    expect(await validateJWT(token)).toBe(true);
    
    // Test tampered token
    const tamperedToken = token.slice(0, -5) + 'XXXXX';
    expect(await validateJWT(tamperedToken)).toBe(false);
    
    // Test expired token
    const expiredToken = await generateExpiredJWT(testUserId);
    expect(await validateJWT(expiredToken)).toBe(false);
  });
});
```

This security architecture provides comprehensive protection for the PAWS token system, focusing on the four critical areas you specified while maintaining practical implementation guidelines and testable security controls.