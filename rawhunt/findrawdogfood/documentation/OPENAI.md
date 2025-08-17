# OpenAI API Documentation

## Overview
The OpenAI API provides access to speech-to-text transcription services via the Whisper model, essential for the voice interface functionality in the FindRawDogFood application.

## Authentication
- **API Key**: Required via `OPENAI_API_KEY` environment variable
- **Header**: `Authorization: Bearer $OPENAI_API_KEY`

## Endpoints Used

### Audio Transcriptions
- **Endpoint**: `https://api.openai.com/v1/audio/transcriptions`
- **Method**: POST
- **Content-Type**: `multipart/form-data`

#### Parameters
- `file`: Audio file (webm format in this application)
- `model`: `whisper-1` (required)
- `response_format`: Optional (default: json, can be text, srt, verbose_json, vtt)
- `language`: Optional language code
- `prompt`: Optional context to improve accuracy
- `temperature`: Optional (0-1, controls randomness)

#### Example Request (from codebase)
```javascript
const formData = new FormData();
formData.append('file', new Blob([audioData], { type: 'audio/webm' }), 'audio.webm');
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`
  },
  body: formData
});
```

#### Response Format
```json
{
  "text": "Transcribed text from the audio file."
}
```

## Usage in FindRawDogFood
- **File**: `src/index.js` (speechToText function)
- **Purpose**: Convert voice commands to text for the Claude voice interface
- **Audio Format**: WebM audio from browser MediaRecorder
- **Model**: whisper-1 (optimized for real-time transcription)

## Error Handling
```javascript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Whisper API failed (${response.status}): ${errorText}`);
}
```

## Rate Limits
- Default: 50 requests per minute
- File size limit: 25 MB
- Audio length limit: None specified
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm

## Best Practices
1. **Audio Quality**: Higher quality audio improves transcription accuracy
2. **File Size**: Keep files under 25MB (split larger files if needed)
3. **Language**: Specify language when known for better accuracy
4. **Context**: Use prompt parameter for domain-specific vocabulary
5. **Error Handling**: Always handle API failures gracefully

## Related Documentation
- [OpenAI Audio API Guide](https://platform.openai.com/docs/guides/speech-to-text)
- [Whisper Model Documentation](https://platform.openai.com/docs/models/whisper)
- [API Reference](https://platform.openai.com/docs/api-reference/audio)