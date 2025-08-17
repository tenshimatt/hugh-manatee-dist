# API Setup Guide for FindRawDogFood Voice Interface

The voice interface requires API keys from several providers. Follow these steps to get them set up:

## 🔑 Required API Keys

### 1. OpenAI API Key (for Whisper Speech-to-Text)
1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Cost:** $0.006 per minute of audio

### 2. Anthropic API Key (for Claude AI)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

**Cost:** ~$0.015 per request (varies by usage)

### 3. ElevenLabs API Key (for Text-to-Speech)
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for free account
3. Go to your Profile → API Keys
4. Copy your API key

**Cost:** Free for first 10,000 characters/month

### 4. Google Places API Key (Optional - for location features)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the "Places API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key

**Cost:** Free for first 1,000 requests/day per key

## ⚙️ Setup Instructions

### Step 1: Add Keys to .dev.vars
Edit the file `/Users/mattwright/pandora/findrawdogfood/.dev.vars` and replace the placeholder values:

```env
# Replace these with your actual API keys:
OPENAI_API_KEY=sk-your-actual-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
ELEVENLABS_API_KEY=your-actual-elevenlabs-key-here
GOOGLE_PLACES_API_KEYS=your-google-key-1,your-google-key-2
```

### Step 2: Restart the Development Server
After adding the keys, restart wrangler:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd /Users/mattwright/pandora/findrawdogfood
wrangler dev --port 8787
```

### Step 3: Test the Voice Interface
1. Go to `http://localhost:8787/voice-ui`
2. Click "Start Recording"
3. Speak something like "Hello Claude"
4. The system should process your voice and respond

## 🧪 Testing Without API Keys

If you don't want to set up API keys right now, you can still test the monitoring system:

1. Visit `http://localhost:8787/test-usage`
2. This simulates API usage without making real calls
3. Then check `http://localhost:8787/monitor` to see the cost tracking

## 🔒 Security Notes

- Never commit real API keys to git
- The `.dev.vars` file is already in `.gitignore`
- For production, use Wrangler secrets: `wrangler secret put OPENAI_API_KEY`

## 💰 Cost Estimates

**Typical voice command costs:**
- 10-second recording: ~$0.001 (OpenAI)
- Claude response: ~$0.015 (Anthropic)
- Text-to-speech: Free for most usage (ElevenLabs)
- **Total per command: ~$0.016**

For 100 voice commands per day: **~$1.60/day**

## ❓ Troubleshooting

**"Incorrect API key" errors:**
1. Make sure keys are in `.dev.vars` (not `.env`)
2. Restart wrangler dev server
3. Check that keys don't have extra spaces

**"Rate limit exceeded" errors:**
- The system has built-in rate limiting
- Wait a moment and try again

**"Microphone access" errors:**
- Allow microphone permissions in your browser
- Use HTTPS or localhost (required for microphone access)

## 🎯 Ready to Use!

Once you've added the API keys and restarted the server, the full voice interface will work:

1. **Voice Input** → OpenAI Whisper (speech-to-text)
2. **AI Processing** → Anthropic Claude (conversational AI)  
3. **Voice Output** → ElevenLabs (text-to-speech)
4. **Monitoring** → Real-time cost tracking and analytics

The system will automatically track costs, implement rate limiting, and cache responses to minimize API usage!