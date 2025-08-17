// Test KV Store Helper
// Provides in-memory key-value store for testing

export class TestKV {
  constructor() {
    this.data = new Map();
    this.expirations = new Map();
  }

  async put(key, value, options = {}) {
    this.data.set(key, value);
    
    // Handle expiration
    if (options.expirationTtl) {
      const expiresAt = Date.now() + (options.expirationTtl * 1000);
      this.expirations.set(key, expiresAt);
    }
    
    return Promise.resolve();
  }

  async get(key, type = 'text') {
    // Check if key has expired
    if (this.expirations.has(key)) {
      const expiresAt = this.expirations.get(key);
      if (Date.now() > expiresAt) {
        this.data.delete(key);
        this.expirations.delete(key);
        return Promise.resolve(null);
      }
    }

    const value = this.data.get(key);
    if (value === undefined) {
      return Promise.resolve(null);
    }

    if (type === 'json' && typeof value === 'string') {
      try {
        return Promise.resolve(JSON.parse(value));
      } catch (error) {
        return Promise.resolve(null);
      }
    }

    return Promise.resolve(value);
  }

  async delete(key) {
    this.data.delete(key);
    this.expirations.delete(key);
    return Promise.resolve();
  }

  async list(options = {}) {
    const keys = Array.from(this.data.keys());
    
    // Filter by prefix if specified
    if (options.prefix) {
      const filteredKeys = keys.filter(key => key.startsWith(options.prefix));
      return Promise.resolve({
        keys: filteredKeys.map(name => ({ name }))
      });
    }

    return Promise.resolve({
      keys: keys.map(name => ({ name }))
    });
  }

  // Helper method to set data directly for testing
  setData(key, value) {
    this.data.set(key, value);
  }

  // Helper method to check if key exists
  has(key) {
    return this.data.has(key);
  }

  // Helper method to get all keys
  getKeys() {
    return Array.from(this.data.keys());
  }

  // Helper method to get size
  size() {
    return this.data.size;
  }

  // Clean up expired keys (called manually in tests)
  cleanupExpired() {
    const now = Date.now();
    for (const [key, expiresAt] of this.expirations.entries()) {
      if (now > expiresAt) {
        this.data.delete(key);
        this.expirations.delete(key);
      }
    }
  }

  // Clear all data for test cleanup
  async cleanup() {
    this.data.clear();
    this.expirations.clear();
    return Promise.resolve();
  }

  // Simulate KV errors for testing error handling
  simulateError(method, error) {
    const originalMethod = this[method];
    this[method] = () => {
      throw error;
    };
    
    // Return a function to restore the original method
    return () => {
      this[method] = originalMethod;
    };
  }

  // Get statistics for testing
  getStats() {
    return {
      totalKeys: this.data.size,
      expiredKeys: Array.from(this.expirations.entries())
        .filter(([_, expiresAt]) => Date.now() > expiresAt)
        .length,
      activeKeys: this.data.size - Array.from(this.expirations.entries())
        .filter(([_, expiresAt]) => Date.now() > expiresAt)
        .length
    };
  }
}