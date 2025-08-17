# API Documentation Index

This directory contains comprehensive documentation for all third-party APIs and services used in the FindRawDogFood project.

## Overview

The FindRawDogFood application integrates with multiple external services to provide a complete raw dog food supplier discovery platform with voice interface capabilities.

## Documentation Files

### 🤖 [ANTHROPIC.md](./ANTHROPIC.md)
- **Service**: Anthropic Claude API
- **Purpose**: Conversational AI for voice command processing
- **Model**: claude-3-5-sonnet-20241022
- **Usage**: Voice interface responses, natural language processing

### ☁️ [CLOUDFLARE.md](./CLOUDFLARE.md)
- **Service**: Cloudflare Workers Platform
- **Components**: Workers, D1 Database, KV Storage, R2 Object Storage
- **Purpose**: Application hosting, data storage, global distribution
- **Usage**: Main application infrastructure

### 🎙️ [ELEVENLABS.md](./ELEVENLABS.md)
- **Service**: ElevenLabs Text-to-Speech API
- **Purpose**: Convert text responses to natural-sounding audio
- **Voice**: Rachel (21m00Tcm4TlvDq8ikWAM)
- **Usage**: Voice interface audio output

### 🗺️ [GOOGLE_PLACES.md](./GOOGLE_PLACES.md)
- **Service**: Google Places API
- **Purpose**: Raw dog food supplier data collection
- **Endpoints**: Text Search, Place Details
- **Usage**: Daily scraping of supplier information

### 🎧 [OPENAI.md](./OPENAI.md)
- **Service**: OpenAI Whisper API
- **Purpose**: Speech-to-text transcription
- **Model**: whisper-1
- **Usage**: Voice interface audio input processing

## Integration Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Voice    │───▶│   OpenAI API     │───▶│  Text Output    │
│     Input       │    │   (Whisper)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Audio Output  │◀───│  ElevenLabs API  │◀───│ Anthropic API   │
│                 │    │     (TTS)        │    │   (Claude)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Cloudflare D1    │◀───│ Data Processing │
                       │   Database       │    │   & Storage     │
                       └──────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌──────────────────┐
                       │ Google Places    │
                       │    API Data      │
                       └──────────────────┘
```

## API Key Management

All APIs require secure key management:

### Environment Variables Required
```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key
# Google Places API keys are hardcoded in scraper (consider moving to env)
```

### Cloudflare Secrets
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ELEVENLABS_API_KEY
```

## Rate Limits Summary

| Service | Free Tier Limit | Implementation |
|---------|----------------|----------------|
| OpenAI Whisper | 50 requests/min | Basic error handling |
| Anthropic Claude | 5 requests/min | 150 token limit per request |
| ElevenLabs | 10,000 chars/month | 150 char limit per request |
| Google Places | 1,000 requests/day/key | Multi-key rotation system |
| Cloudflare | 100,000 requests/day | Generous limits, monitoring recommended |

## Usage Costs

### Estimated Monthly Costs (Low Usage)
- **OpenAI Whisper**: ~$5-15/month (voice transcription)
- **Anthropic Claude**: ~$10-30/month (AI responses)
- **ElevenLabs**: ~$5-22/month (voice synthesis)
- **Google Places**: Free tier sufficient for most use cases
- **Cloudflare**: Free tier covers development, ~$5-20/month for production

## Development Setup

1. **API Keys**: Obtain keys from all service providers
2. **Environment**: Set up environment variables
3. **Testing**: Use individual API documentation for testing
4. **Integration**: Follow the main application setup in CLAUDE.md

## Production Considerations

1. **Rate Limiting**: Implement proper rate limiting and retry logic
2. **Error Handling**: Comprehensive error handling for all APIs
3. **Monitoring**: Set up monitoring and alerting for API failures
4. **Cost Control**: Monitor usage to prevent unexpected charges
5. **Security**: Secure API key storage and rotation policies

## Support and Resources

- **Primary Documentation**: Each service's official documentation
- **Application Context**: See `../CLAUDE.md` for project-specific usage
- **Issues**: Check individual API status pages for service issues
- **Community**: Respective service communities and forums

## Update Schedule

This documentation should be updated when:
- API endpoints change
- New services are integrated
- Rate limits or pricing changes
- Authentication methods change
- New features are added to the application

---

*Last Updated: July 2025*
*Maintained by: FindRawDogFood Development Team*