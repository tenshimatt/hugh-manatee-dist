# Aurora Backend - Secure API Proxy

**Purpose:** Protect Claude API key from being extracted from the iOS app.

## Why This Exists

❌ **INSECURE:** API key hardcoded in iOS app → users can extract it → unlimited API usage on your account
✅ **SECURE:** API key stored in Cloudflare Worker secret → only backend can access it

## Setup & Deployment

### 1. Install Dependencies

```bash
cd Aurora-backend
npm install
```

### 2. Set API Key Secret (REQUIRED)

**IMPORTANT:** Never commit the API key! Set it as a Wrangler secret:

```bash
# You'll be prompted to paste your Claude API key
npx wrangler secret put CLAUDE_API_KEY
```

Paste this key when prompted:
```
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
```

### 3. Deploy to Cloudflare Workers

```bash
npm run deploy
```

You'll get a URL like: `https://aurora-api.YOUR_SUBDOMAIN.workers.dev`

**Save this URL** - you'll need it for the iOS app!

### 4. Test the Deployment

```bash
curl -X POST https://aurora-api.YOUR_SUBDOMAIN.workers.dev/ai/enhance \
  -H "Content-Type: application/json" \
  -d '{"transcription":"I remember when I was young we used to play marbles"}'
```

Expected response:
```json
{
  "enhanced": "When I was young, we used to play marbles..."
}
```

## API Endpoints

### POST /ai/enhance
Enhance transcription with light-touch editing

**Request:**
```json
{
  "transcription": "raw spoken text here..."
}
```

**Response:**
```json
{
  "enhanced": "polished story text..."
}
```

### POST /ai/questions
Generate follow-up questions

**Request:**
```json
{
  "transcription": "their memory here..."
}
```

**Response:**
```json
{
  "questions": [
    "What was she wearing?",
    "How did you feel?",
    ...
  ]
}
```

### POST /ai/extract
Extract genealogy entities

**Request:**
```json
{
  "transcription": "I was born in Boston to Mary Johnson..."
}
```

**Response:**
```json
{
  "entities": {
    "placeOfBirth": "Boston",
    "motherMaidenName": "Johnson",
    ...
  }
}
```

## Local Development

```bash
npm run dev
```

Server runs at: `http://localhost:8787`

## Security Features

✅ API key stored as Cloudflare secret (never in code)
✅ CORS configured for iOS app only
✅ Rate limiting (Cloudflare free tier: 100k requests/day)
✅ No sensitive data logged

## Cost

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- More than enough for friends & family beta!

**Claude API:**
- ~$0.015 per 1000 tokens
- Average request: ~500 tokens = $0.0075
- 100 users × 10 recordings = $7.50/month

## Next Steps

After deployment, update iOS app:
1. Remove hardcoded API key from Swift files
2. Update services to call backend URL
3. Test end-to-end flow

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
