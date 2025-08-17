# Hunta Domain Setup Guide

## Current Infrastructure Status

### ✅ Backend (Production Ready)
- **Worker URL**: `hunta-backend-prod.findrawdogfood.workers.dev`
- **Database**: `hunta-db-prod` (8a950a6b-e1c8-4ac0-97bc-ad93c75450b6)
- **KV Store**: `CACHE` (c53c6240247746f48374f5fc20af1f0c)
- **Storage**: `hunta-media-prod` R2 bucket

### ✅ Frontend (Deployed to Pages)
- **Current URL**: `3ce807a7.hunta-frontend.pages.dev`
- **Project**: `hunta-frontend`
- **Status**: Active and deployed

## Domain Configuration Tasks

### 1. Configure gohunta.com for Frontend (Cloudflare Pages)

#### Manual Steps in Cloudflare Dashboard:
1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/3e02a16d99fcee4a071c58d876dbc4ea/pages)
2. Select the `hunta-frontend` project
3. Navigate to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter `gohunta.com`
6. Follow DNS setup instructions

#### Expected DNS Configuration:
```
Type: CNAME
Name: @
Content: hunta-frontend.pages.dev
Proxy: Enabled (Orange cloud)
```

### 2. Configure API Subdomain for Backend

#### Option A: api.gohunta.com (Recommended)
Update backend `wrangler-production.toml`:
```toml
# Uncomment and configure custom domain routes
routes = [
  { pattern = "api.gohunta.com/*", zone_name = "gohunta.com" }
]
```

#### Option B: gohunta.com/api/*
Update backend `wrangler-production.toml`:
```toml
routes = [
  { pattern = "gohunta.com/api/*", zone_name = "gohunta.com" }
]
```

### 3. Update Frontend Environment Variables

After domain setup, update `/frontend/.env.production`:
```bash
VITE_API_URL=https://api.gohunta.com
# OR
VITE_API_URL=https://gohunta.com/api
```

### 4. Update Security Headers

Update `/frontend/public/_headers` CSP directive:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.gohunta.com
```

## Automated Setup Commands

### Step 1: Backend Domain Configuration
```bash
cd /Users/mattwright/pandora/gohunta.com/hunta/backend
wrangler deploy --env production
```

### Step 2: Frontend Rebuild and Deploy
```bash
cd /Users/mattwright/pandora/gohunta.com/hunta/frontend
npm run build
wrangler pages deploy dist --project-name=hunta-frontend
```

## DNS Records Required

### Primary Domain (gohunta.com)
```
Type: CNAME
Name: @
Content: hunta-frontend.pages.dev
Proxy: Enabled

Type: CNAME  
Name: www
Content: gohunta.com
Proxy: Enabled
```

### API Subdomain (api.gohunta.com)
```
Type: CNAME
Name: api
Content: hunta-backend-prod.findrawdogfood.workers.dev
Proxy: Enabled
```

## SSL Certificate

Cloudflare automatically provisions SSL certificates for:
- ✅ `gohunta.com`
- ✅ `www.gohunta.com`  
- ✅ `api.gohunta.com`

## Verification Steps

### 1. Frontend Access
- [ ] `https://gohunta.com` loads the application
- [ ] `https://www.gohunta.com` redirects to main domain
- [ ] All static assets load correctly

### 2. API Access  
- [ ] `https://api.gohunta.com/health` returns backend status
- [ ] Frontend can communicate with API
- [ ] CORS headers configured correctly

### 3. Security
- [ ] SSL certificate valid for all domains
- [ ] Security headers present
- [ ] HSTS enabled

## Troubleshooting

### Common Issues
1. **DNS Propagation Delay**: Wait 5-10 minutes after DNS changes
2. **SSL Certificate**: May take up to 24 hours to provision
3. **CORS Errors**: Update backend CORS configuration for new domain

### Debugging Commands
```bash
# Check DNS resolution
dig gohunta.com
dig api.gohunta.com

# Test SSL certificate
curl -I https://gohunta.com
curl -I https://api.gohunta.com

# Verify backend health
curl https://api.gohunta.com/health
```

## Next Steps After Domain Setup

1. **Performance Monitoring**: Set up Cloudflare Analytics
2. **CDN Optimization**: Configure cache rules
3. **Security Enhancement**: Review firewall rules
4. **Backup Strategy**: Document recovery procedures