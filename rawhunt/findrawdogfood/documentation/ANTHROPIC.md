# Anthropic Claude API Documentation

## Overview
The Anthropic Claude API provides conversational AI capabilities for processing voice commands and generating intelligent responses in the FindRawDogFood voice interface.

## Authentication
- **API Key**: Required via `ANTHROPIC_API_KEY` environment variable
- **Header**: `x-api-key: $ANTHROPIC_API_KEY`
- **Version Header**: `anthropic-version: 2023-06-01` (required)

## Endpoints Used

### Messages API
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Method**: POST
- **Content-Type**: `application/json`

#### Required Parameters
- `model`: Model identifier (e.g., `claude-3-5-sonnet-20241022`)
- `max_tokens`: Maximum tokens to generate (e.g., 150)
- `messages`: Array of message objects

#### Message Structure
```javascript
{
  "role": "user" | "assistant",
  "content": "Message text"
}
```

#### Example Request (from codebase)
```javascript
const requestBody = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 150,
  messages: [{ 
    role: 'user', 
    content: `Voice command: "${message}"\n\nYou are a helpful Cloudflare development assistant. Respond conversationally in under 25 words for voice output.` 
  }]
};

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify(requestBody)
});
```

#### Response Format
```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Response text from Claude"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 12,
    "output_tokens": 6
  }
}
```

## Usage in FindRawDogFood
- **File**: `src/index.js` (callClaude function)
- **Purpose**: Process voice commands and generate contextual responses
- **Model**: claude-3-5-sonnet-20241022 (balanced performance and capability)
- **Token Limit**: 150 tokens (optimized for voice responses)
- **Context**: Configured as "Cloudflare development assistant"

## Models Available
- `claude-3-opus-latest`: Most capable, higher cost
- `claude-3-5-sonnet-20241022`: Balanced performance (used in app)
- `claude-3-haiku-latest`: Fastest, most economical

## Error Handling
```javascript
if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ Claude API error:', response.status, errorText);
  throw new Error(`Claude API failed (${response.status}): ${errorText}`);
}
```

## Rate Limits
- Tier 1: 5 requests per minute, 25,000 tokens per day
- Tier 2: 50 requests per minute, 100,000 tokens per day
- Tier 3: 200 requests per minute, 500,000 tokens per day
- Higher tiers available based on usage

## Best Practices
1. **Token Management**: Monitor usage with the `usage` field in responses
2. **Context Setting**: Use system messages to set appropriate context
3. **Conversation History**: Maintain message history for multi-turn conversations
4. **Error Handling**: Implement retry logic for transient failures
5. **Response Length**: Use `max_tokens` to control response length for voice output

## Security Considerations
- Store API keys securely in environment variables
- Never log or expose API keys in client-side code
- Implement proper error handling to avoid exposing sensitive information
- Monitor usage to detect unusual patterns

## Related Documentation
- [Anthropic API Documentation](https://docs.anthropic.com/en/api/getting-started)
- [Claude Models Overview](https://docs.anthropic.com/en/docs/about-claude/models)
- [Message Batches API](https://docs.anthropic.com/en/api/messages-batches)
- [Anthropic Console](https://console.anthropic.com/)