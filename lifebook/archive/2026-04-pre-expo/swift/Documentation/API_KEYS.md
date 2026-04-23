# API Key Configuration

## OpenAI API Key

### ⚠️ SECURITY WARNING
**NEVER commit API keys to version control!**

The OpenAI API key you provided has been noted but should be stored securely.

### Secure Storage Options

#### Option 1: Environment Variable (Recommended for Development)
```bash
# Add to ~/.zshrc or ~/.bash_profile
export OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
```

Then in code:
```swift
private let apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
```

#### Option 2: Keychain Services (Recommended for Production)
```swift
import Security

func saveAPIKeyToKeychain(apiKey: String) {
    let data = apiKey.data(using: .utf8)!
    let query: [String: Any] = [
        kSecClass as String: kSecClassInternetPassword,
        kSecAttrAccount as String: "OpenAI-API-Key",
        kSecAttrServer as String: "api.openai.com",
        kSecValueData as String: data
    ]
    
    SecItemDelete(query as CFDictionary) // Delete old if exists
    SecItemAdd(query as CFDictionary, nil)
}

func getAPIKeyFromKeychain() -> String? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassInternetPassword,
        kSecAttrAccount as String: "OpenAI-API-Key",
        kSecAttrServer as String: "api.openai.com",
        kSecReturnData as String: true
    ]
    
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    if status == errSecSuccess,
       let data = result as? Data {
        return String(data: data, encoding: .utf8)
    }
    return nil
}
```

#### Option 3: Configuration File (Development Only)
Create `Config.xcconfig` file (add to .gitignore):
```
OPENAI_API_KEY = sk-proj-YOUR_KEY_HERE
```

### Your API Key
Based on what you provided, store it using one of the above methods:
- Key starts with: `sk-proj-`
- Full key should be stored securely, not in code

### API Usage

#### Current Configuration
- Model: `gpt-4-turbo-preview`
- Max tokens per request: 150
- Temperature: 0.7
- Purpose: Gentle conversation guidance

#### Rate Limits
- Requests per minute: Check your OpenAI dashboard
- Tokens per minute: Check your OpenAI dashboard
- Monitor usage at: https://platform.openai.com/usage

### Cost Estimation
- GPT-4 Turbo: ~$0.01 per 1K input tokens, $0.03 per 1K output tokens
- Average session (30 minutes): ~$0.50-$1.00
- Monitor costs at: https://platform.openai.com/usage

### Best Practices

1. **Never hardcode keys in source code**
2. **Use different keys for development/production**
3. **Rotate keys regularly**
4. **Set usage limits in OpenAI dashboard**
5. **Monitor for unusual usage**

### Troubleshooting

#### Invalid API Key Error
```
Error: Incorrect API key provided
```
Solution: Verify key starts with `sk-proj-` and is complete

#### Rate Limit Error
```
Error: Rate limit exceeded
```
Solution: Implement exponential backoff or upgrade plan

#### Network Error
```
Error: Could not connect to OpenAI API
```
Solution: Check internet connection and firewall settings

### Alternative: Local AI Models

For offline capability, consider:
1. Core ML models for basic responses
2. Cached conversation templates
3. Pre-generated prompts

### Support

For API issues:
- OpenAI Support: https://help.openai.com
- API Documentation: https://platform.openai.com/docs

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

