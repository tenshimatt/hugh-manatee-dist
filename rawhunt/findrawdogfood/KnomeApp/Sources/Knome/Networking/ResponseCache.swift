//
// ResponseCache.swift - Intelligent Response Caching
//
import Foundation

actor ResponseCache {
    private var cache: [String: CacheEntry] = [:]
    private let maxSize: Int
    private let defaultTTL: TimeInterval
    
    private struct CacheEntry {
        let data: Data
        let expiresAt: Date
        let lastAccessed: Date
        let hits: Int
    }
    
    init(maxSize: Int = 100, defaultTTL: TimeInterval = 300) {
        self.maxSize = maxSize
        self.defaultTTL = defaultTTL
    }
    
    // MARK: - Cache Operations
    func get<T: Decodable>(for key: String, type: T.Type) -> T? {
        cleanupExpiredEntries()
        
        guard let entry = cache[key],
              entry.expiresAt > Date() else {
            cache.removeValue(forKey: key)
            return nil
        }
        
        // Update access time and hit count
        cache[key] = CacheEntry(
            data: entry.data,
            expiresAt: entry.expiresAt,
            lastAccessed: Date(),
            hits: entry.hits + 1
        )
        
        return try? JSONDecoder().decode(T.self, from: entry.data)
    }
    
    func set<T: Encodable>(_ object: T, for key: String, ttl: TimeInterval? = nil) {
        guard let data = try? JSONEncoder().encode(object) else { return }
        
        // Clean up if cache is getting full
        if cache.count >= maxSize {
            evictLeastRecentlyUsed()
        }
        
        let effectiveTTL = ttl ?? defaultTTL
        cache[key] = CacheEntry(
            data: data,
            expiresAt: Date().addingTimeInterval(effectiveTTL),
            lastAccessed: Date(),
            hits: 0
        )
    }
    
    func remove(for key: String) {
        cache.removeValue(forKey: key)
    }
    
    func clear() {
        cache.removeAll()
    }
    
    // MARK: - Cache Management
    private func cleanupExpiredEntries() {
        let now = Date()
        cache = cache.filter { $0.value.expiresAt > now }
    }
    
    private func evictLeastRecentlyUsed() {
        guard !cache.isEmpty else { return }
        
        // Sort by access time and hits (LRU with hit count consideration)
        let sortedEntries = cache.sorted { entry1, entry2 in
            // Prioritize entries with more hits
            if entry1.value.hits != entry2.value.hits {
                return entry1.value.hits < entry2.value.hits
            }
            // Then by last access time
            return entry1.value.lastAccessed < entry2.value.lastAccessed
        }
        
        // Remove least recently used entries (keep 80% of max size)
        let toRemove = max(1, cache.count - Int(Double(maxSize) * 0.8))
        for (key, _) in sortedEntries.prefix(toRemove) {
            cache.removeValue(forKey: key)
        }
    }
    
    // MARK: - Statistics
    func getCacheStatistics() -> CacheStatistics {
        cleanupExpiredEntries()
        
        let totalSize = cache.values.reduce(0) { $0 + $1.data.count }
        let averageHits = cache.isEmpty ? 0.0 : 
            Double(cache.values.reduce(0) { $0 + $1.hits }) / Double(cache.count)
        
        return CacheStatistics(
            entryCount: cache.count,
            totalSizeBytes: totalSize,
            averageHits: averageHits,
            oldestEntry: cache.values.min { $0.lastAccessed < $1.lastAccessed }?.lastAccessed,
            newestEntry: cache.values.max { $0.lastAccessed < $1.lastAccessed }?.lastAccessed
        )
    }
}

// MARK: - Cache Statistics
struct CacheStatistics {
    let entryCount: Int
    let totalSizeBytes: Int
    let averageHits: Double
    let oldestEntry: Date?
    let newestEntry: Date?
    
    var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .binary
        return formatter.string(fromByteCount: Int64(totalSizeBytes))
    }
}

// MARK: - Cache Key Generation
extension ResponseCache {
    static func generateKey(for request: String, context: String? = nil) -> String {
        var components = [request]
        if let context = context {
            components.append(context)
        }
        
        let combined = components.joined(separator: "|")
        
        // Create a hash for the key
        if let data = combined.data(using: .utf8) {
            let hash = data.base64EncodedString()
                .replacingOccurrences(of: "/", with: "_")
                .replacingOccurrences(of: "+", with: "-")
                .prefix(32)
            return String(hash)
        }
        
        return combined
    }
}