# 🚀 Quick Reference - FindRawDogFood v1.0.0

## 🌐 Live URLs
| Service | URL | Status |
|---------|-----|--------|
| **Main Site** | https://findrawdogfood.com | ✅ Live |
| **Admin Dashboard** | https://findrawdogfood.com/admin | 🔐 Auth Required |
| **Rawgle Site** | https://rawgle.com | ✅ Live |
| **API Stats** | https://findrawdogfood.com/api/stats | ✅ Live |

## 🔐 Admin Access
```
URL: https://findrawdogfood.com/admin
Username: admin  
Password: admin123rawdog2025
```

## ⚡ Deployment Commands

### Deploy FindRawDogFood
```bash
wrangler deploy --config wrangler-production.toml --env production
```

### Deploy Rawgle  
```bash
wrangler deploy --config wrangler-rawgle.toml --env production
```

### Restore This Version
```bash
git checkout v1.0.0-stable
# Then run deploy commands above
```

## 🧪 Health Check Commands

### Quick Tests
```bash
# Test main site
curl -s https://findrawdogfood.com | grep "Interactive Supplier Map"

# Test API  
curl -s https://findrawdogfood.com/api/stats

# Test admin (will show auth required)
curl -s https://findrawdogfood.com/admin
```

### Expected Results
- Main site: Should return HTML with "Interactive Supplier Map"
- API: Should return JSON with 9,136+ suppliers
- Admin: Should return "Admin Access Required"

## 📊 Current Database Stats
- **Suppliers:** 9,136
- **States:** 12  
- **Cities:** 15
- **Highly Rated:** 4,201
- **Average Rating:** 4.5

## 🎯 Key Features
- ✅ Interactive map with Leaflet.js
- ✅ Search by city/state  
- ✅ Geolocation support
- ✅ Mobile responsive
- ✅ Secure admin dashboard
- ✅ Real-time database
- ✅ Distance calculations

## 🔧 Technical Stack
- **Platform:** Cloudflare Workers
- **Database:** D1 (SQLite)
- **Map:** Leaflet.js + OpenStreetMap
- **Security:** HTTP Basic Auth
- **Domains:** findrawdogfood.com + rawgle.com

---
**Version:** v1.0.0-stable | **Date:** July 26, 2025