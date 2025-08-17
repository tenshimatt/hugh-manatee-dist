//
// RateLimiter.swift - API Rate Limiting with Token Bucket Algorithm
//
import Foundation

actor RateLimiter {
    private var buckets: [RateLimitType: TokenBucket] = [:]
    
    enum RateLimitType {
        case chatCompletion
        case tokenUsage
        case embeddings
        case images
    }
    
    private struct TokenBucket {
        var tokens: Int
        var lastRefill: Date
        let capacity: Int
        let refillRate: TimeInterval // seconds per token
        let refillAmount: Int // tokens added per refill
    }
    
    init() {
        // Initialize default buckets
        buckets[.chatCompletion] = createBucket(for: .chatCompletion)
        buckets[.tokenUsage] = createBucket(for: .tokenUsage)
    }
    
    func checkLimit(for type: RateLimitType) async throws {
        guard var bucket = buckets[type] else {
            // Initialize bucket if not exists
            buckets[type] = createBucket(for: type)
            return
        }
        
        // Refill tokens based on time passed
        let now = Date()
        let timePassed = now.timeIntervalSince(bucket.lastRefill)
        let tokensToAdd = Int(timePassed / bucket.refillRate) * bucket.refillAmount
        
        if tokensToAdd > 0 {
            bucket.tokens = min(bucket.capacity, bucket.tokens + tokensToAdd)
            bucket.lastRefill = now
            buckets[type] = bucket
        }
        
        // Check if we have tokens available
        guard bucket.tokens > 0 else {
            let waitTime = bucket.refillRate
            throw APIError.rateLimitExceeded(retryAfter: waitTime)
        }
        
        // Consume a token
        bucket.tokens -= 1
        buckets[type] = bucket
    }
    
    func updateTokenUsage(_ tokensUsed: Int) async {
        guard var bucket = buckets[.tokenUsage] else { return }
        
        // Deduct tokens used (for token-based rate limiting)
        bucket.tokens = max(0, bucket.tokens - tokensUsed)
        buckets[.tokenUsage] = bucket
    }
    
    func getRemainingTokens(for type: RateLimitType) -> Int {
        return buckets[type]?.tokens ?? 0
    }
    
    func resetBucket(for type: RateLimitType) {
        buckets[type] = createBucket(for: type)
    }
    
    private func createBucket(for type: RateLimitType) -> TokenBucket {
        switch type {
        case .chatCompletion:
            // 60 requests per minute
            return TokenBucket(
                tokens: 60,
                lastRefill: Date(),
                capacity: 60,
                refillRate: 1.0, // 1 second per token
                refillAmount: 1
            )
        case .tokenUsage:
            // 60,000 tokens per minute
            return TokenBucket(
                tokens: 60000,
                lastRefill: Date(),
                capacity: 60000,
                refillRate: 0.001, // 0.001 seconds per token
                refillAmount: 60
            )
        case .embeddings:
            // 100 requests per minute
            return TokenBucket(
                tokens: 100,
                lastRefill: Date(),
                capacity: 100,
                refillRate: 0.6, // 0.6 seconds per token
                refillAmount: 1
            )
        case .images:
            // 20 requests per minute
            return TokenBucket(
                tokens: 20,
                lastRefill: Date(),
                capacity: 20,
                refillRate: 3.0, // 3 seconds per token
                refillAmount: 1
            )
        }
    }
}

// MARK: - Rate Limit Monitor
@MainActor
class RateLimitMonitor: ObservableObject {
    @Published var requestsRemaining: Int = 60
    @Published var tokensRemaining: Int = 60000
    @Published var isRateLimited: Bool = false
    @Published var nextRefreshTime: Date?
    
    private let rateLimiter: RateLimiter
    private var refreshTimer: Timer?
    
    init(rateLimiter: RateLimiter) {
        self.rateLimiter = rateLimiter
        startMonitoring()
    }
    
    private func startMonitoring() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.updateStatus()
            }
        }
    }
    
    private func updateStatus() async {
        requestsRemaining = await rateLimiter.getRemainingTokens(for: .chatCompletion)
        tokensRemaining = await rateLimiter.getRemainingTokens(for: .tokenUsage)
        isRateLimited = requestsRemaining == 0 || tokensRemaining < 100
        
        if isRateLimited {
            nextRefreshTime = Date().addingTimeInterval(1.0)
        } else {
            nextRefreshTime = nil
        }
    }
    
    deinit {
        refreshTimer?.invalidate()
    }
}