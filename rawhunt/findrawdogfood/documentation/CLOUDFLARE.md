# Cloudflare Services Documentation

## Overview
The FindRawDogFood application is built on Cloudflare Workers platform and utilizes multiple Cloudflare services including D1 database, KV storage, and R2 object storage.

## Services Used

### Cloudflare Workers
- **Platform**: Serverless compute platform
- **Runtime**: V8 JavaScript engine
- **Global Network**: Deployed across Cloudflare's edge locations
- **Main Files**: `src/index.js`, various worker configurations

### Cloudflare D1 (SQLite Database)
- **Purpose**: Store raw dog food supplier data
- **Type**: Serverless SQL database based on SQLite
- **Location**: Global replication with regional primary

#### Database Configuration
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "findrawdogfood-db"
database_id = "your-database-id"
```

#### Schema (from scripts/d1-schema.sql)
```sql
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT, 
    state TEXT, 
    country TEXT,
    latitude REAL, 
    longitude REAL,
    phone_number TEXT, 
    website TEXT,
    rating REAL, 
    user_ratings_total INTEGER,
    types TEXT, 
    keyword TEXT,
    created_at TEXT
);
```

#### Usage in Code
```javascript
// Query suppliers by location
const results = await env.DB.prepare(`
  SELECT * FROM suppliers 
  WHERE city = ? AND state = ?
  ORDER BY rating DESC
`).bind(city, state).all();
```

### Cloudflare KV (Key-Value Storage)
- **Purpose**: Store voice transcripts and session data
- **Type**: Eventually consistent global key-value store
- **Use Cases**: Caching, configuration data, session storage

#### Configuration
```toml
# wrangler.toml
[[kv_namespaces]]
binding = "VOICE_TRANSCRIPTS"
id = "your-kv-namespace-id"
```

#### Usage Examples
```javascript
// Store voice transcript
await env.VOICE_TRANSCRIPTS.put(sessionId, transcript);

// Retrieve cached data
const cachedData = await env.KV_NAMESPACE.get("key");
```

### Cloudflare R2 (Object Storage)
- **Purpose**: Static asset storage (logos, images)
- **Type**: S3-compatible object storage
- **Benefits**: No egress fees, global distribution

## Environment Configurations

### Development (wrangler.toml)
```toml
name = "findrawdogfood"
main = "src/index.js"
compatibility_date = "2023-12-01"

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "findrawdogfood-db"
database_id = "local-dev-id"

[[kv_namespaces]]
binding = "VOICE_TRANSCRIPTS"
id = "dev-kv-id"
```

### Production (wrangler-production.toml)
```toml
name = "findrawdogfood-production"
main = "src/index.js"
compatibility_date = "2023-12-01"

routes = [
  { pattern = "findrawdogfood.com/*", zone_name = "findrawdogfood.com" },
  { pattern = "www.findrawdogfood.com/*", zone_name = "findrawdogfood.com" }
]

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "findrawdogfood-db"
database_id = "production-db-id"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "findrawdogfood-assets"
```

## Database Operations

### Wrangler CLI Commands
```bash
# Create database
wrangler d1 create findrawdogfood-db

# Execute SQL
wrangler d1 execute findrawdogfood-db --file=./schema.sql --remote

# Run migrations
wrangler d1 migrations apply findrawdogfood-db --remote

# Import data
wrangler d1 execute findrawdogfood-db --file=./import.sql --remote
```

### Batch Import System
The application includes an extensive batch import system for handling large datasets:

```bash
# Located in scripts/ directory
# 177 batch files: d1_batch_1.sql through d1_batch_177.sql
# Automated via scripts/import-batches.sh
```

## API Integration

### Worker Handler Structure
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Route handling
    if (url.pathname === '/api/suppliers') {
      return handleSuppliersRequest(request, env);
    }
    
    // Voice interface
    if (url.pathname === '/voice' && request.method === 'POST') {
      return handleVoiceRequest(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

### Environment Variable Access
```javascript
// Access D1 database
const results = await env.DB.prepare(query).all();

// Access KV storage
const value = await env.VOICE_TRANSCRIPTS.get(key);

// Access R2 storage
const object = await env.ASSETS.get(key);

// Access secrets
const apiKey = env.OPENAI_API_KEY;
```

## Deployment Process

### Development Deployment
```bash
# Deploy to dev environment
wrangler deploy --config wrangler.toml

# Deploy with specific environment
wrangler deploy --env development
```

### Production Deployment
```bash
# Deploy to production
wrangler deploy --config wrangler-production.toml --env production

# Custom deployment script
./deploy-production.sh
```

### Deployment Scripts
Multiple deployment scripts for different configurations:
- `deploy-production.sh`: Main production deployment
- `deploy-with-blog.sh`: Production with blog integration
- `deploy-styled-website.sh`: Enhanced UI deployment
- `deploy-rawgle.sh`: Specialized search deployment

## Performance Considerations

### D1 Database
- **Read Performance**: Optimized for read-heavy workloads
- **Write Performance**: Eventually consistent writes
- **Indexing**: Create indexes on frequently queried columns
- **Query Optimization**: Use prepared statements and bind parameters

### KV Storage
- **Consistency**: Eventually consistent (up to 60 seconds)
- **Performance**: Excellent read performance globally
- **Limitations**: 25MB value size limit, 10MB for list operations

### R2 Storage
- **Performance**: High throughput for large objects
- **CDN Integration**: Automatic caching at edge locations
- **Cost**: No egress fees, storage costs only

## Monitoring and Debugging

### Wrangler Dev
```bash
# Local development server
wrangler dev --local --persist-to ./local-storage

# Remote debugging
wrangler dev --remote
```

### Logging
```javascript
console.log('Debug info:', data);
console.error('Error occurred:', error);

// Structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Operation completed',
  data: result
}));
```

### Analytics
- **Worker Analytics**: Built-in request metrics
- **Custom Metrics**: Log custom events for analysis
- **Error Tracking**: Monitor and alert on errors

## Security Considerations

### Environment Variables
```bash
# Set secrets via Wrangler
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ELEVENLABS_API_KEY
```

### CORS Configuration
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Consider restricting in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### Rate Limiting
Consider implementing rate limiting for public endpoints:
```javascript
// Simple rate limiting example
const rateLimiter = new Map();

function checkRateLimit(clientId, limit = 100) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimiter.has(clientId)) {
    rateLimiter.set(clientId, []);
  }
  
  const requests = rateLimiter.get(clientId)
    .filter(time => time > windowStart);
  
  if (requests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  requests.push(now);
  rateLimiter.set(clientId, requests);
  return true;
}
```

## Best Practices

1. **Database Queries**: Use prepared statements and proper indexing
2. **Error Handling**: Implement comprehensive error handling
3. **Environment Separation**: Use different configurations for dev/prod
4. **Resource Limits**: Monitor and optimize resource usage
5. **Security**: Secure API keys and implement proper CORS
6. **Testing**: Use Miniflare for local testing with storage

## Related Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [KV Storage Documentation](https://developers.cloudflare.com/kv/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)