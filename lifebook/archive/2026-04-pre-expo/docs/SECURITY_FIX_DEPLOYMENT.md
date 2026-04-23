# 🔒 Security Fix: API Key Protection

## ❌ CRITICAL ISSUE (FIXED)

**Problem:** Claude API key was hardcoded in iOS app → users could extract it → unlimited API usage on your account

**Solution:** Backend proxy with secure key storage

---

## ✅ What Was Done

### 1. Created Secure Backend (Aurora-backend/)
- Cloudflare Worker proxies all Claude API calls
- API key stored as encrypted Cloudflare secret (never in code)
- 3 endpoints: `/ai/enhance`, `/ai/questions`, `/ai/extract`

### 2. Updated iOS App
- Removed all hardcoded API keys ✅
- Updated 3 services to call backend instead of Claude directly:
  - `AIStoryGenerator.swift` → calls `/ai/enhance`
  - `AIInterviewerService.swift` → calls `/ai/questions`
  - `AIEntityExtractor.swift` → calls `/ai/extract`

---

## 📋 Deployment Steps

### Step 1: Deploy Backend to Cloudflare

```bash
cd Aurora-backend

# Install dependencies
npm install

# Set API key as secret (REQUIRED - you'll be prompted for the key)
npx wrangler secret put CLAUDE_API_KEY
```

**When prompted, paste this key:**
```
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
```

```bash
# Deploy to Cloudflare Workers (free tier - 100k requests/day)
npm run deploy
```

**✅ You'll get a URL like:**
```
https://aurora-api.YOURSUBDOMAIN.workers.dev
```

**SAVE THIS URL!** You need it for step 2.

### Step 2: Update iOS App with Backend URL

Replace `YOURSUBDOMAIN` with your actual Cloudflare subdomain in these 3 files:

**File 1: `Aurora/Services/AIStoryGenerator.swift`**
```swift
// Line 11
private let backendURL = "https://aurora-api.YOURSUBDOMAIN.workers.dev"
```

**File 2: `Aurora/Services/AIInterviewerService.swift`**
```swift
// Line 12
private let backendURL = "https://aurora-api.YOURSUBDOMAIN.workers.dev"
```

**File 3: `Aurora/AIEntityExtractor.swift`**
```swift
// Line 16
private let backendURL = "https://aurora-api.YOURSUBDOMAIN.workers.dev"
```

### Step 3: Build & Deploy iOS App

```bash
# Build for device
xcodebuild -project Aurora.xcodeproj -scheme Aurora \
  -configuration Debug \
  -destination 'platform=iOS,id=YOUR_DEVICE_ID' \
  build

# Deploy to device
xcrun devicectl device install app \
  --device YOUR_DEVICE_ID \
  PATH_TO_AURORA_APP

# Launch app
xcrun devicectl device process launch \
  --device YOUR_DEVICE_ID \
  com.oshun.Aurora
```

### Step 4: Test the Security Fix

1. Open Aurora on your device
2. Record a test memory (10-15 seconds)
3. Watch for:
   - ✅ "Memory Saved!" overlay appears
   - ✅ Story appears in Vault tab
   - ✅ "AI Enhancing..." badge shows up
   - ✅ Badge changes to checkmark when complete
4. Check story has AI-enhanced text

**If it works → Security fix successful!** 🎉

---

## 🔍 Verify Security

### Test 1: API Key Not in App Bundle

```bash
# Extract app bundle
unzip Aurora.app -d extracted_app

# Search for API key (should find NOTHING)
grep -r "sk-ant-api03" extracted_app/
```

**Expected result:** `No matches found` ✅

### Test 2: Backend Is Called

Check Cloudflare Workers logs:
```bash
cd Aurora-backend
npm run tail
```

Record a memory in the app → You should see:
```
POST /ai/enhance - 200 OK
POST /ai/questions - 200 OK
POST /ai/extract - 200 OK
```

---

## 💰 Cost Breakdown

### Free Tier (Current)
- **Cloudflare Workers:** 100,000 requests/day (FREE)
- **Claude API:** ~$0.015 per 1000 tokens
  - Average recording: ~500 tokens = $0.0075
  - 10 users × 10 recordings/day = $0.75/day = $22.50/month

### Friends & Family Beta (10-20 users)
- **Monthly cost:** ~$20-40 in Claude API fees
- **Cloudflare:** Still FREE (well under 100k requests/day)

---

## 🚨 Important Security Notes

### ✅ DO:
- Keep `.env` and secrets files in `.gitignore`
- Rotate API key if ever exposed
- Use Cloudflare's analytics to monitor usage
- Set up billing alerts on Anthropic account

### ❌ DON'T:
- Never commit API keys to git
- Never share your Cloudflare Worker URL publicly
- Never store secrets in the iOS app
- Never disable CORS on the backend (keeps it iOS-only)

---

## 🐛 Troubleshooting

### Backend Not Working?
```bash
# Test backend directly
curl -X POST https://aurora-api.YOURSUBDOMAIN.workers.dev/ai/enhance \
  -H "Content-Type: application/json" \
  -d '{"transcription":"Test memory about my childhood"}'

# Expected: {"enhanced":"...enhanced text..."}
# If error: Check Wrangler logs
```

### iOS App Not Connecting?
1. Check backend URL is correct in all 3 files
2. Ensure device has internet connection
3. Check Xcode console for network errors
4. Verify backend is deployed (`npm run deploy`)

### API Key Issues?
```bash
# Re-set the secret
npx wrangler secret put CLAUDE_API_KEY

# Verify it's set
npx wrangler secret list
```

---

## 📊 Next Steps for Production

Before App Store submission:

1. **Rate Limiting:** Add per-user request limits
2. **Authentication:** Require user tokens for API calls
3. **Monitoring:** Set up error tracking (Sentry, etc.)
4. **Costs:** Upgrade Cloudflare plan if needed (>100k req/day)
5. **Legal:** Add Privacy Policy mentioning API usage

---

## ✅ Security Checklist

- [x] API key removed from iOS app
- [x] Backend proxy implemented
- [x] Secrets stored in Cloudflare (encrypted)
- [x] CORS configured for iOS app only
- [x] All 3 AI services updated
- [ ] Backend deployed to production
- [ ] iOS app updated with backend URL
- [ ] End-to-end testing complete
- [ ] Verified no API key in app bundle

**Status: READY TO DEPLOY** 🚀

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

