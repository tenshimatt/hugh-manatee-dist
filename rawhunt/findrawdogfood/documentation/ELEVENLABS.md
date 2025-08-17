# ElevenLabs API Documentation

## Overview
The ElevenLabs API provides high-quality text-to-speech conversion for the FindRawDogFood voice interface, converting Claude's text responses into natural-sounding audio.

## Authentication
- **API Key**: Required via `ELEVENLABS_API_KEY` environment variable
- **Header**: `xi-api-key: $ELEVENLABS_API_KEY`

## Endpoints Used

### Text-to-Speech
- **Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Method**: POST
- **Content-Type**: `application/json`

#### Voice ID Used
- **Voice ID**: `21m00Tcm4TlvDq8ikWAM` (Rachel - Natural, Calm)
- **Alternative**: Any valid ElevenLabs voice ID

#### Request Parameters
```javascript
{
  "text": "Text to convert to speech",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

#### Example Request (from codebase)
```javascript
const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
  method: 'POST',
  headers: {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': env.ELEVENLABS_API_KEY
  },
  body: JSON.stringify({
    text: text.length > 150 ? text.substring(0, 150) + "..." : text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  })
});
```

#### Response Format
- **Content-Type**: `audio/mpeg`
- **Body**: Binary audio data (MP3 format)

## Models Available
- `eleven_monolingual_v1`: High quality, English only (used in app)
- `eleven_multilingual_v1`: Supports multiple languages
- `eleven_multilingual_v2`: Latest multilingual model
- `eleven_turbo_v2`: Faster generation, good quality

## Voice Settings
- **Stability** (0.0-1.0): Controls variability in speech
  - Lower: More expressive, variable
  - Higher: More stable, consistent
- **Similarity Boost** (0.0-1.0): Enhances voice similarity
  - Lower: More creative liberty
  - Higher: Closer to original voice

## Usage in FindRawDogFood
- **File**: `src/index.js` (textToSpeech function)
- **Purpose**: Convert Claude's text responses to audio for voice interface
- **Voice**: Rachel voice (21m00Tcm4TlvDq8ikWAM)
- **Model**: eleven_monolingual_v1
- **Text Limit**: 150 characters (truncated with "..." if longer)

## Error Handling
```javascript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`ElevenLabs API failed (${response.status}): ${errorText}`);
}

return await response.arrayBuffer();
```

## Rate Limits
- **Free Tier**: 10,000 characters/month
- **Starter**: 30,000 characters/month
- **Creator**: 100,000 characters/month
- **Pro**: 500,000 characters/month
- **Scale**: 2,000,000+ characters/month

## Character Limits
- Maximum text length per request: 5,000 characters
- Recommended: Keep under 500 characters for best performance
- Current implementation: Limited to 150 characters

## Available Voices
Popular voice IDs for different use cases:
- `21m00Tcm4TlvDq8ikWAM`: Rachel (Calm, Natural)
- `AZnzlk1XvdvUeBnXmlld`: Domi (Friendly, Professional)
- `EXAVITQu4vr4xnSDxMaL`: Bella (Expressive, Warm)
- `ErXwobaYiN019PkySvjV`: Antoni (Deep, Authoritative)
- `MF3mGyEYCl7XYWbV9V6O`: Elli (Young, Energetic)

## Best Practices
1. **Text Length**: Keep text concise for voice output (under 150 characters)
2. **Voice Selection**: Choose appropriate voice for your application's tone
3. **Caching**: Cache generated audio to reduce API calls and costs
4. **Error Handling**: Implement fallback for API failures
5. **Rate Limiting**: Monitor usage to stay within quota limits

## Audio Format Options
- **MP3**: Default, good compression (used in app)
- **WAV**: Uncompressed, highest quality
- **OGG**: Open source alternative
- **PCM**: Raw audio data

## Security Considerations
- Store API keys securely in environment variables
- Monitor usage to prevent unexpected charges
- Implement proper error handling
- Consider caching frequently used audio

## Related Documentation
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Voice Library](https://elevenlabs.io/voice-library)
- [Text-to-Speech Guide](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Voice Settings Guide](https://elevenlabs.io/docs/speech-synthesis/voice-settings)