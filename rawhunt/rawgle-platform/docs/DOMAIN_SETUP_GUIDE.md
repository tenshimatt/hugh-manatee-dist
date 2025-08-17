# Domain Setup Guide for Rawgle Platform

This guide walks you through setting up custom domains for your Rawgle Platform deployment.

## Overview

The Rawgle Platform requires two main domains:
- **Frontend Domain**: `rawgle.com` (main application)
- **API Domain**: `api.rawgle.com` (backend API)

## Prerequisites

1. Domain purchased and registered
2. Cloudflare account with the domain added
3. Wrangler CLI authenticated
4. Deployed Workers and Pages projects

## Step 1: Add Domain to Cloudflare

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter your domain: `rawgle.com`
4. Select a plan (Free plan is sufficient for testing)
5. Update your domain's nameservers to Cloudflare's nameservers

## Step 2: Configure DNS Records

### For Frontend (Cloudflare Pages)

1. In Cloudflare dashboard, go to DNS management
2. Add the following records:

```
Type: CNAME
Name: @
Target: rawgle-frontend.pages.dev
Proxy: Enabled (Orange cloud)

Type: CNAME  
Name: www
Target: rawgle-frontend.pages.dev
Proxy: Enabled (Orange cloud)
```

### For API (Cloudflare Workers)

```
Type: CNAME
Name: api
Target: rawgle-backend-prod.workers.dev
Proxy: Enabled (Orange cloud)
```

## Step 3: Configure Custom Domain in Cloudflare Pages

1. Go to Cloudflare dashboard → Pages
2. Select your `rawgle-frontend` project
3. Click "Custom domains" tab
4. Click "Set up a custom domain"
5. Enter `rawgle.com`
6. Click "Continue"
7. Repeat for `www.rawgle.com`

## Step 4: Configure Custom Domain for Workers

### Method 1: Using Wrangler CLI

```bash
cd rawgle-backend
wrangler custom-domains put api.rawgle.com --env production
```

### Method 2: Using Cloudflare Dashboard

1. Go to Workers & Pages → rawgle-backend-prod
2. Click "Settings" → "Triggers"
3. Click "Add Custom Domain"
4. Enter `api.rawgle.com`
5. Click "Add Custom Domain"

## Step 5: Update Application Configuration

### Backend Configuration

Update `rawgle-backend/wrangler-production.toml`:

```toml
# Add custom route
[[routes]]
pattern = "api.rawgle.com/*"
zone_name = "rawgle.com"

# Update CORS origins
[vars]
ALLOWED_ORIGINS = '["https://rawgle.com", "https://www.rawgle.com"]'
```

### Frontend Configuration

Update `rawgle-frontend/.env.production`:

```env
VITE_API_URL=https://api.rawgle.com
VITE_APP_URL=https://rawgle.com
```

## Step 6: SSL/TLS Configuration

1. In Cloudflare dashboard, go to SSL/TLS
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "HTTP Strict Transport Security (HSTS)"

### Recommended SSL Settings:

```
Encryption Mode: Full (strict)
Always Use HTTPS: On
HTTP Strict Transport Security: On
Minimum TLS Version: 1.2
Opportunistic Encryption: On
TLS 1.3: On
```

## Step 7: Performance & Security Settings

### Caching Rules

1. Go to Caching → Cache Rules
2. Create rule for static assets:

```
Rule Name: Static Assets Cache
If: Hostname equals rawgle.com AND File extension equals css,js,png,jpg,jpeg,gif,ico,svg,woff,woff2
Then: Cache level = Standard, Browser TTL = 1 year, Edge TTL = 1 month
```

### Page Rules

1. Go to Rules → Page Rules
2. Create rules:

```
Rule 1: HTTPS Redirect
URL: http://*rawgle.com/*
Settings: Always Use HTTPS

Rule 2: WWW Redirect  
URL: www.rawgle.com/*
Settings: Forwarding URL (301 redirect to https://rawgle.com/$1)

Rule 3: API Caching
URL: api.rawgle.com/api/suppliers*
Settings: Cache Level = Standard, Edge TTL = 5 minutes
```

### Security Headers

1. Go to Security → Headers
2. Enable:
   - HTTP Strict Transport Security (HSTS)
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

## Step 8: Verification and Testing

### DNS Propagation Check

```bash
# Check DNS resolution
dig rawgle.com
dig api.rawgle.com

# Check from multiple locations
nslookup rawgle.com 8.8.8.8
nslookup api.rawgle.com 8.8.8.8
```

### SSL Certificate Verification

```bash
# Check SSL certificate
openssl s_client -connect rawgle.com:443 -servername rawgle.com
openssl s_client -connect api.rawgle.com:443 -servername api.rawgle.com
```

### Application Testing

```bash
# Test frontend
curl -I https://rawgle.com
curl -I https://www.rawgle.com

# Test API
curl -I https://api.rawgle.com/health
curl https://api.rawgle.com/api
```

## Step 9: Update Deployment Scripts

Update your deployment scripts to use the custom domains:

### In `orchestrate-deployment.sh`:

```bash
# Update these variables
PRODUCTION_DOMAIN="rawgle.com"
API_DOMAIN="api.rawgle.com"

# Update health checks
curl -f -s "https://${API_DOMAIN}/health"
curl -f -s "https://${PRODUCTION_DOMAIN}"
```

### In CI/CD pipeline:

```yaml
env:
  PRODUCTION_FRONTEND_URL: https://rawgle.com
  PRODUCTION_API_URL: https://api.rawgle.com
```

## Troubleshooting

### Common Issues

#### 1. DNS Not Resolving
- **Problem**: Domain doesn't resolve to Cloudflare
- **Solution**: Check nameservers, wait for propagation (up to 48 hours)

#### 2. SSL Certificate Issues
- **Problem**: SSL handshake failures
- **Solution**: Ensure "Full (strict)" SSL mode, wait for certificate provisioning

#### 3. CORS Errors
- **Problem**: Frontend can't access API
- **Solution**: Update ALLOWED_ORIGINS in backend configuration

#### 4. 522 Connection Timeout
- **Problem**: Cloudflare can't connect to origin
- **Solution**: Check Workers deployment, verify custom domain configuration

#### 5. Redirect Loops
- **Problem**: Too many redirects
- **Solution**: Check page rules, ensure consistent HTTPS configuration

### Diagnostic Commands

```bash
# Check Cloudflare zone info
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# Check DNS records
curl -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# Test Workers custom domain
wrangler custom-domains list --env production
```

## Security Considerations

### 1. CAA Records
Add Certification Authority Authorization records:

```
Type: CAA
Name: @
Value: 0 issue "digicert.com"

Type: CAA
Name: @  
Value: 0 issue "letsencrypt.org"
```

### 2. DNSSEC
Enable DNSSEC in Cloudflare dashboard for additional security.

### 3. Rate Limiting
Configure rate limiting rules for API endpoints:

```
Rule: API Rate Limiting
URL: api.rawgle.com/api/*
Threshold: 100 requests per minute per IP
Action: Block
```

## Monitoring Domain Health

### 1. SSL Certificate Expiration
Set up monitoring for SSL certificate expiration:

```bash
# Check certificate expiry
echo | openssl s_client -servername rawgle.com -connect rawgle.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. DNS Monitoring
Monitor DNS resolution times and availability.

### 3. Uptime Monitoring
Set up external monitoring for:
- https://rawgle.com
- https://api.rawgle.com/health

## Post-Setup Tasks

1. **Update Documentation**: Update all documentation with new URLs
2. **Test All Features**: Verify complete application functionality
3. **Monitor Logs**: Check for any domain-related errors
4. **Performance Testing**: Ensure custom domains don't impact performance
5. **SEO Updates**: Update search engine configurations if applicable

## Rollback Plan

If custom domain setup fails:

1. **Immediate**: Update application to use .workers.dev and .pages.dev URLs
2. **DNS**: Remove custom domain DNS records
3. **Workers**: Remove custom domain from Workers
4. **Pages**: Remove custom domain from Pages
5. **Configuration**: Revert application configuration files

## Support Resources

- [Cloudflare Pages Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [SSL/TLS Configuration](https://developers.cloudflare.com/ssl/)

## Checklist

- [ ] Domain added to Cloudflare
- [ ] DNS records configured
- [ ] Custom domain added to Pages project
- [ ] Custom domain added to Workers
- [ ] SSL/TLS configured (Full strict)
- [ ] Security headers enabled
- [ ] Caching rules configured
- [ ] Application configuration updated
- [ ] Health checks passing
- [ ] Performance verified
- [ ] Monitoring configured
- [ ] Documentation updated

---

**Note**: Domain propagation can take up to 48 hours. SSL certificate provisioning typically takes 15-30 minutes after domain verification.