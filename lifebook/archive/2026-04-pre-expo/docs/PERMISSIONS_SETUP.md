# Required Permissions Setup

## Add to Info.plist (or Project Settings)

To enable real audio recording and transcription, add these privacy keys:

### Method 1: Xcode Project Settings (Recommended)
1. Open the project in Xcode
2. Select the **LifebookDemo** target
3. Go to **Info** tab
4. Click **+** to add new keys:

**NSMicrophoneUsageDescription**
```
We need access to your microphone to record your life stories and memories.
```

**NSSpeechRecognitionUsageDescription**
```
We use speech recognition to transcribe your recordings into text, making them searchable and shareable.
```

### Method 2: Manual Info.plist (if file exists)
Add these entries to Info.plist:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to record your life stories and memories.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>We use speech recognition to transcribe your recordings into text, making them searchable and shareable.</string>
```

## Testing Permissions

1. Run the app on a real device or simulator (iOS 15+)
2. Tap the record button
3. You'll see system permission dialogs
4. Grant both Microphone and Speech Recognition permissions
5. Start recording and see live transcription!

## Troubleshooting

**Permission denied:**
- Go to iPhone Settings → Privacy & Security → Microphone
- Enable for LifebookDemo
- Go to Settings → Privacy & Security → Speech Recognition
- Enable for LifebookDemo

**No transcription appearing:**
- Ensure you're speaking clearly
- Check network connection (cloud recognition is more accurate)
- Wait 2-3 seconds for recognition to start

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

