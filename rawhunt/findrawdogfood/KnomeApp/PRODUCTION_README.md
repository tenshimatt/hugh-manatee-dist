# 🧙‍♂️ Knome - Production Setup Guide

## 🚀 Quick Start (OpenAI + Voice)

**Ready to make Knome live with real AI? Here's how:**

### 1️⃣ Get Your OpenAI API Key
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Copy it (starts with `sk-...`)

### 2️⃣ Validate Your Key (Optional)
```bash
./validate_key.sh sk-your-key-here
```

### 3️⃣ Set Up Production
```bash
./setup_production.sh sk-your-key-here
```

This will:
- ✅ Configure OpenAI API key
- ✅ Generate production Xcode project  
- ✅ Open Xcode automatically
- ✅ Enable real GPT-4 responses
- ✅ Keep all voice features working

### 4️⃣ Build & Run
- Select iPhone simulator in Xcode
- Build & Run (`⌘+R`)
- Grant microphone permissions
- **Chat with real AI Knome!** 🎙️

---

## 🎯 Features Included

### 🤖 Real AI Integration
- **GPT-4** powered responses
- **Smart conversation context**
- **Session memory & summaries**
- **Fallback to demo on errors**

### 🎙️ Voice Features
- **Speech-to-text** input (tap mic)
- **Text-to-speech** output (auto-speaks responses)
- **Real-time transcription**
- **On-device processing** (privacy-first)

### 🔒 Privacy & Security
- **Encrypted local storage**
- **No audio sent to servers**
- **HIPAA-ready architecture**
- **User-controlled permissions**

---

## 💰 Cost Monitoring

**OpenAI API Usage:**
- GPT-4: ~$0.03 per 1K tokens
- Average conversation: ~$0.10-0.50
- Voice processing: **FREE** (on-device)

**Monitor usage:**
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set billing limits in OpenAI console

---

## 🎮 Demo vs Production

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| AI Responses | Mock responses | Real GPT-4 |
| Voice Input | ✅ Works | ✅ Works |
| Voice Output | ✅ Works | ✅ Works |
| Context Memory | Simple | Smart summaries |
| API Costs | Free | ~$0.10/conversation |
| Status Indicator | 🟠 DEMO | 🟢 LIVE |

---

## 🔧 Troubleshooting

**Build Errors:**
- Clean Build Folder: `⌘+Shift+K`
- Restart Xcode
- Re-run setup script

**API Issues:**
- Check key validity with `./validate_key.sh`
- Verify billing setup on OpenAI platform
- Check network connection

**Voice Issues:**
- Grant microphone permissions
- Test in iOS Settings > Privacy > Microphone
- Restart app after permission changes

---

## 📱 Ready for App Store

**Production checklist:**
- ✅ Real OpenAI integration
- ✅ Voice features complete
- ✅ Privacy permissions configured
- ✅ Error handling robust
- ✅ Usage monitoring ready

**Next steps:**
1. Get Apple Developer account
2. Update Team ID in project settings
3. Configure App Store Connect
4. Submit for review

---

**🎉 Knome is now live with OpenAI + Voice!**

*The perfect conversational AI therapist for men's mental wellness.*
