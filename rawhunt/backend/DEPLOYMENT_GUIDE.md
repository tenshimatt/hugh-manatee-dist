# Rawgle Backend Deployment Guide

## 🚀 Quick Start Deployment

### 1. Prerequisites Setup
```bash
# Install Cloudflare Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify login
wrangler whoami
```

### 2. Database Creation
```bash
# Create D1 database
wrangler d1 create rawgle-db

# Copy the database ID from output and update wrangler.toml
# Replace "your-database-id" with the actual ID
```

### 3. Environment Configuration
Update `wrangler.toml` with your settings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "rawgle-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"  # Replace this

[vars]
JWT_SECRET = "your-secure-jwt-secret-min-32-chars"  # Change this!
BCRYPT_ROUNDS = "12"
RATE_LIMIT_WINDOW = "60"
RATE_LIMIT_MAX_REQUESTS = "100"
PAWS_EARNING_RATES = '{"order_completion": 10, "review_submission": 5, "referral": 25}'
```

### 4. Database Migrations
```bash
# Run migrations to create tables
wrangler d1 migrations apply rawgle-db
```

### 5. Deploy
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production

# Or deploy to staging
./deploy.sh staging
```

### 6. Verify Deployment
```bash
# Check health endpoint
curl https://your-worker-url.workers.dev/health

# Test API info
curl https://your-worker-url.workers.dev/api

# Monitor logs
wrangler tail
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Deploy Worker
```bash
wrangler deploy
```

### 4. Apply Database Migrations
```bash
wrangler d1 migrations apply rawgle-db
```

## 🌍 Environment-Specific Configuration

### Production Environment
```toml
[env.production]
name = "rawgle-backend-prod"

[env.production.vars]
JWT_SECRET = "super-secure-production-secret-key"
ENVIRONMENT = "production"
```

### Staging Environment
```toml
[env.staging]
name = "rawgle-backend-staging"

[env.staging.vars]
JWT_SECRET = "staging-secret-key"
ENVIRONMENT = "staging"
```

## 📊 Database Setup Details

### Create Database
```bash
wrangler d1 create rawgle-db
```

Expected output:
```
✅ Successfully created DB 'rawgle-db'

[[d1_databases]]
binding = "DB"
database_name = "rawgle-db"
database_id = "12345678-1234-1234-1234-123456789012"
```

### Update wrangler.toml
Copy the database configuration to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "rawgle-db"
database_id = "12345678-1234-1234-1234-123456789012"  # Your actual ID
```

### Run Migrations
```bash
# For production
wrangler d1 migrations apply rawgle-db --env production

# For staging
wrangler d1 migrations apply rawgle-db --env staging

# For local development
wrangler d1 migrations apply rawgle-db --local
```

## 🔐 Security Configuration

### 1. JWT Secret
Generate a secure secret:
```bash
# Generate 32-byte random secret
openssl rand -hex 32
```

### 2. CORS Origins
Update the allowed origins in `src/middleware/cors.js`:
```javascript
const corsOptions = {
  origin: [
    'https://rawgle.app',           # Your production domain
    'https://www.rawgle.app',       # Your www domain
    'https://app.rawgle.com',       # Your app subdomain
    'http://localhost:3000',        # Local development
    'http://localhost:5173'         # Vite dev server
  ],
  // ...
};
```

### 3. Rate Limiting
Configure rate limits in `wrangler.toml`:
```toml
[vars]
RATE_LIMIT_WINDOW = "60"           # 60 seconds
RATE_LIMIT_MAX_REQUESTS = "100"    # 100 requests per window
```

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-worker-url.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "v1",
  "environment": "production"
}
```

### API Info
```bash
curl https://your-worker-url.workers.dev/api
```

### Test Authentication
```bash
# Register new user
curl -X POST https://your-worker-url.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 📋 Post-Deployment Checklist

- [ ] Health endpoint responds with 200
- [ ] Database tables created successfully
- [ ] Authentication endpoints working
- [ ] CORS configured for your domains
- [ ] Rate limiting active
- [ ] JWT secret is secure and unique
- [ ] Error logging working
- [ ] Performance metrics collecting

## 🔍 Monitoring & Debugging

### View Logs
```bash
# Tail live logs
wrangler tail

# Tail logs for specific environment
wrangler tail --env production
```

### Database Queries
```bash
# Execute SQL queries
wrangler d1 execute rawgle-db --command "SELECT COUNT(*) FROM users"

# Interactive SQL
wrangler d1 execute rawgle-db --command "SELECT * FROM users LIMIT 5"
```

### Performance Monitoring
- Monitor response times through Cloudflare dashboard
- Set up alerts for error rates
- Track database query performance

## 🆘 Troubleshooting

### Common Issues

1. **Database ID Missing**
   - Error: `DB is not defined`
   - Solution: Update `database_id` in `wrangler.toml`

2. **JWT Secret Not Set**
   - Error: JWT generation fails
   - Solution: Set secure `JWT_SECRET` in vars

3. **CORS Errors**
   - Error: Cross-origin requests blocked
   - Solution: Add your domain to allowed origins

4. **Migration Errors**
   - Error: Table already exists
   - Solution: Check migration status with `wrangler d1 migrations list`

### Reset Database
```bash
# Drop and recreate (WARNING: Data loss!)
wrangler d1 execute rawgle-db --command "DROP TABLE IF EXISTS users"
wrangler d1 migrations apply rawgle-db
```

## 🔄 Updates & Maintenance

### Update Code
```bash
git pull origin main
npm install
npm test
./deploy.sh production
```

### Database Updates
```bash
# Create new migration
echo "ALTER TABLE users ADD COLUMN new_field TEXT;" > migrations/0002_add_new_field.sql

# Apply migration
wrangler d1 migrations apply rawgle-db
```

### Rollback
```bash
# Rollback to previous version
wrangler rollback
```

## 📞 Support

If you encounter issues:
1. Check the logs: `wrangler tail`
2. Verify configuration in `wrangler.toml`
3. Test locally: `wrangler dev`
4. Review error messages for specific guidance

---

**Base URL**: `https://your-worker-url.workers.dev`
**API Documentation**: `https://your-worker-url.workers.dev/api`
**Health Check**: `https://your-worker-url.workers.dev/health`