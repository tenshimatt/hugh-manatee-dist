# 🛠️ Dashboard Troubleshooting Guide

## 🎯 **Quick Solution**

**Try the Simple Test Page First:**
```
http://localhost:8080/simple-dashboard-test.html
```
1. Enter admin token: `rawgle-admin-2025`
2. Click "Test Connection"
3. If successful, the main dashboard should work

## 🔍 **Step-by-Step Debugging**

### **Step 1: Verify Server**
```bash
cd /Users/mattwright/pandora/rawgle-platform/rawgle-pure
python3 -m http.server 8080
```
- ✅ Should show: `Serving HTTP on :: port 8080`

### **Step 2: Test Simple Connection**
Open: `http://localhost:8080/simple-dashboard-test.html`
- Enter token: `rawgle-admin-2025`
- Click "Test Connection"
- Expected: ✅ Health Check + ✅ Dashboard Access

### **Step 3: Check Browser Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors or API call logs
4. Check Network tab for failed requests

### **Step 4: Main Dashboard**
If simple test works, try: `http://localhost:8080/test-management-ui.html`
- Should auto-prompt for admin token
- Enter: `rawgle-admin-2025`
- Should load dashboard data

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Failed to fetch"**
**Cause:** Network/CORS issue
**Solution:** 
- Verify API is accessible: `curl https://rawgle-api.findrawdogfood.workers.dev/api/health`
- Check internet connection

### **Issue 2: "Authentication failed"**
**Cause:** Wrong admin token
**Solutions:**
- Use exact token: `rawgle-admin-2025`
- Clear browser storage: `localStorage.removeItem('admin-token')`
- Try simple test page first

### **Issue 3: Dashboard loads but no data**
**Cause:** Empty test data
**Expected:** This is normal - dashboard shows zero runs when no tests have been executed

### **Issue 4: Prompt keeps appearing**
**Cause:** Token not being stored
**Solutions:**
- Accept browser localStorage permissions
- Manually set token in simple test page
- Clear browser cache and try again

## 🧪 **Manual Test Commands**

### **Test API Health:**
```bash
curl https://rawgle-api.findrawdogfood.workers.dev/api/health
```
Expected: `{"status":"healthy","timestamp":"...","version":"v1"}`

### **Test Dashboard API:**
```bash
curl -H "X-Admin-Token: rawgle-admin-2025" \
     https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard
```
Expected: JSON with `timeframe`, `overview`, `trends`, etc.

### **Test CORS:**
```bash
curl -H "Origin: http://localhost:8080" \
     -H "X-Admin-Token: rawgle-admin-2025" \
     https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard -I
```
Expected: `Access-Control-Allow-Origin: *` in headers

## 🔧 **Advanced Debugging**

### **Check Browser Network Tab:**
1. Open DevTools (F12) → Network tab
2. Reload dashboard page
3. Look for:
   - ❌ Red entries (failed requests)
   - 🟡 Yellow entries (CORS issues)
   - ✅ Green entries (successful)

### **JavaScript Console Commands:**
```javascript
// Check current token
localStorage.getItem('admin-token')

// Set token manually
localStorage.setItem('admin-token', 'rawgle-admin-2025')

// Test API call directly
fetch('https://rawgle-api.findrawdogfood.workers.dev/api/health')
  .then(r => r.json())
  .then(console.log)

// Test dashboard API
fetch('https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard', {
  headers: {'X-Admin-Token': 'rawgle-admin-2025'}
}).then(r => r.json()).then(console.log)
```

## 📊 **Expected Dashboard Data Structure**

When working correctly, the dashboard API returns:
```json
{
  "timeframe": "7d",
  "overview": {
    "totalRuns": 0,
    "successRate": 0,
    "avgDuration": 0,
    "avgCoverage": 0,
    "runningTests": 0
  },
  "breakdown": {
    "byType": {},
    "bySuite": {},
    "byStatus": {"passed": 0, "failed": 0, "running": 0}
  },
  "recentFailures": [],
  "trends": [...]
}
```

## ✅ **Success Indicators**

### **Simple Test Page:**
- ✅ Health Check: API responding
- ✅ Dashboard Access: Authentication working
- ✅ Dashboard Data: JSON data received

### **Main Dashboard:**
- ✅ Loads without errors
- ✅ Shows metrics (even if zero)
- ✅ Displays trend charts
- ✅ Navigation tabs work

## 🆘 **If Still Failing**

1. **Try different browser** (Chrome, Firefox, Safari)
2. **Disable browser extensions** (ad blockers, etc.)
3. **Check browser console** for specific error messages
4. **Clear browser cache** and localStorage
5. **Verify localhost:8080** is accessible

## 📞 **Report Issues**

If dashboard still fails after following this guide:
1. Test with simple-dashboard-test.html
2. Copy browser console output
3. Copy Network tab failed requests
4. Note browser version and OS
5. Report specific error messages

**The simple test page should help isolate whether the issue is with the API, authentication, CORS, or the dashboard UI itself.**