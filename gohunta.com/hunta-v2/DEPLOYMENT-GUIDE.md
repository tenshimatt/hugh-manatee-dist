# 🚀 Hunta Deployment Guide - Custom Domain Setup

## Current Deployment Status

**Frontend**: https://b47415d8.gohunta.pages.dev  
**Backend**: https://gohunta-backend.findrawdogfood.workers.dev  
**Status**: ✅ Fully functional and ready for custom domain

## 🌐 Domain Setup for gohunta.com

### Understanding Cloudflare's System

When Cloudflare asks for an IP address, you need to use their special "dummy" IPs that activate their proxy:

### Step 1: DNS Records Setup

Add these records in your DNS provider (or Cloudflare if domain is there):

#### For Root Domain (gohunta.com)
```
Type: A
Name: @ (or blank)
IP Address: 192.0.2.1
Proxy: ON (if using Cloudflare)
TTL: Auto
```

#### For WWW
```
Type: CNAME
Name: www
Target: gohunta.com
Proxy: ON (if using Cloudflare)
TTL: Auto
```

### Step 2: Connect to Cloudflare Pages

1. **In Cloudflare Dashboard:**
   - Go to **Pages**
   - Select your `gohunta` project
   - Click **Custom domains** tab
   - Click **Set up a custom domain**
   - Enter `gohunta.com`
   - Click **Continue**

2. **Cloudflare will verify the domain and set it up automatically**

### Step 3: Update Frontend API URL

Since we're moving to production domain, update the frontend to use relative API paths:

```javascript
// In App.jsx, change:
const API_BASE = 'https://gohunta-backend.findrawdogfood.workers.dev'

// To:
const API_BASE = '/api'  // This will use same domain
```

### Step 4: Configure Worker Routes

In your `wrangler-gohunta.toml`, ensure these routes:

```toml
routes = [
  { pattern = "gohunta.com/api/*", zone_name = "gohunta.com" },
  { pattern = "www.gohunta.com/api/*", zone_name = "gohunta.com" }
]
```

## 🔧 Why These IP Addresses?

- **192.0.2.1** - This is a special IP that tells Cloudflare to proxy the traffic
- **Do NOT use:** Regular IPs like your server's IP
- **These IPs activate:** Cloudflare's CDN, DDoS protection, and routing

## 📝 Alternative: If Domain is NOT on Cloudflare

If your domain is with another registrar (GoDaddy, Namecheap, etc.):

### Option A: Transfer to Cloudflare (Recommended)
1. Add site to Cloudflare
2. Change nameservers at your registrar to Cloudflare's
3. Wait for propagation (5 min - 24 hours)
4. Then follow steps above

### Option B: Stay with Current Provider
You cannot use Cloudflare Pages with external DNS. You must:
1. Add the domain to Cloudflare (free)
2. Update nameservers
3. Then configure as above

## 🚨 Common Issues & Solutions

### "Invalid IP address"
- Use exactly: `192.0.2.1`
- Make sure no typos
- Ensure Proxy is ON (orange cloud)

### "Domain not connecting"
- DNS propagation can take up to 24 hours
- Check with: `dig gohunta.com`
- Verify nameservers if moved to Cloudflare

### "API not working on custom domain"
- Make sure Worker routes are configured
- Update frontend to use relative paths
- Check CORS headers in backend

## ✅ Final Checklist

- [ ] Domain added to Cloudflare account
- [ ] A record created with 192.0.2.1
- [ ] Custom domain added to Pages project
- [ ] Worker routes configured for /api/*
- [ ] Frontend updated to use relative API paths
- [ ] DNS propagation complete (check with dig/nslookup)
- [ ] Test all functionality on new domain

## 🎯 Expected Result

Once configured:
- `https://gohunta.com` → Your React frontend
- `https://gohunta.com/api/*` → Your Worker backend
- `https://www.gohunta.com` → Redirects to main domain

## Need Help?

1. Check DNS propagation: https://www.whatsmydns.net/
2. Cloudflare Status: https://www.cloudflarestatus.com/
3. Try clearing browser cache and cookies
4. Check browser console for errors

---

**Note**: The special IP `192.0.2.1` is part of the 192.0.2.0/24 range reserved for documentation (RFC 5737). Cloudflare uses this to identify domains that should be proxied through their network.