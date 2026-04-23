# SilenceDetectionService Usage Guide

## Overview
The `SilenceDetectionService` monitors audio levels from an `AVAudioRecorder` instance and detects when the user pauses speaking. It emits silence events via an `AsyncStream` when silence is detected for a configurable duration.

## Quick Start

### 1. Start Monitoring

```swift
import AVFoundation

// Ensure your AVAudioRecorder has metering enabled
audioRecorder.isMeteringEnabled = true

// Start monitoring
let silenceDetector = SilenceDetectionService.shared
silenceDetector.startMonitoring(audioRecorder: audioRecorder)
```

### 2. Listen for Silence Events

```swift
// Listen for silence events in a Task
Task {
    for await event in silenceDetector.silenceEvents() {
        print("Silence detected: \(event.pauseType)")
        print("Duration: \(event.pauseDuration)s")
        print("Level: \(event.averageLevel) dB")

        // Handle based on pause type
        switch event.pauseType {
        case .short:
            // 1-2 seconds: breathing pause, ignore
            break
        case .medium:
            // 3-4 seconds: user finished thought, Hugh should respond
            await handleMediumPause(event)
        case .long:
            // 5+ seconds: user needs prompting or save segment
            await handleLongPause(event)
        }
    }
}
```

### 3. Stop Monitoring

```swift
silenceDetector.stopMonitoring()
```

## Configuration

### Adjust Silence Threshold

```swift
// Default: -50.0 dB
silenceDetector.updateSilenceThreshold(-45.0) // More sensitive (detects quieter sounds as silence)
silenceDetector.updateSilenceThreshold(-55.0) // Less sensitive (requires quieter sounds for silence)
```

### Adjust Silence Duration

```swift
// Default: 3.0 seconds
silenceDetector.updateSilenceDuration(2.0) // Trigger events faster
silenceDetector.updateSilenceDuration(4.0) // Wait longer before triggering
```

## Published Properties

### Monitor Real-Time State

```swift
// In your SwiftUI View
@ObservedObject var silenceDetector = SilenceDetectionService.shared

var body: some View {
    VStack {
        // Show current audio level
        Text("Level: \(silenceDetector.currentAudioLevel, specifier: "%.1f") dB")

        // Show silence indicator
        if silenceDetector.isSilent {
            Image(systemName: "speaker.slash.fill")
                .foregroundColor(.orange)
        }
    }
}
```

## Integration Example: Continuous Recording

```swift
class ContinuousRecordingService: ObservableObject {
    private let silenceDetector = SilenceDetectionService.shared
    private var audioRecorder: AVAudioRecorder?
    private var silenceTask: Task<Void, Never>?

    func startContinuousRecording() async throws {
        // Setup audio recorder with metering
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        let url = URL(fileURLWithPath: "/tmp/recording.m4a")
        audioRecorder = try AVAudioRecorder(url: url, settings: settings)
        audioRecorder?.isMeteringEnabled = true
        audioRecorder?.record()

        // Start silence detection
        silenceDetector.startMonitoring(audioRecorder: audioRecorder!)

        // Listen for silence events
        silenceTask = Task {
            for await event in silenceDetector.silenceEvents() {
                await handleSilenceEvent(event)
            }
        }
    }

    func stopContinuousRecording() {
        silenceDetector.stopMonitoring()
        silenceTask?.cancel()
        audioRecorder?.stop()
    }

    private func handleSilenceEvent(_ event: SilenceEvent) async {
        switch event.pauseType {
        case .medium:
            // User finished thought - Hugh should respond
            print("🦭 Hugh should respond now")
            // await conversationManager.generateResponse()
        case .long:
            // Save current segment
            print("💾 Saving conversation segment")
            // await saveCurrentSegment()
        default:
            break
        }
    }
}
```

## Event Stream Properties

### SilenceEvent Structure

```swift
struct SilenceEvent {
    let id: UUID                    // Unique event ID
    let timestamp: Date             // When silence was detected
    let pauseDuration: TimeInterval // How long the silence lasted (in seconds)
    let averageLevel: Float         // Average audio level during silence (dB)
    let pauseType: PauseType        // Classification: .short, .medium, or .long

    var description: String         // Human-readable description
}
```

### PauseType Classification

- **`.short`**: 1-2 seconds - Breathing pause, typically not actionable
- **`.medium`**: 3-4 seconds - User finished thought, good time for Hugh to respond
- **`.long`**: 5+ seconds - User may need prompting, or segment should be saved

## Audio Level Monitoring

The service samples audio levels every 100ms by default. Each sample:

1. Calls `audioRecorder.updateMeters()`
2. Reads `audioRecorder.averagePower(forChannel: 0)`
3. Compares level to `silenceThreshold`
4. Tracks silence duration
5. Emits event when duration exceeds `silenceDuration`

## Important Notes

### Metering Must Be Enabled

```swift
// REQUIRED: Enable metering before monitoring
audioRecorder.isMeteringEnabled = true
```

### Thread Safety

The service is marked with `@MainActor`, ensuring all operations happen on the main thread. This makes it safe to update UI from within the service.

### State Management

- `resetState()`: Clears silence detection state (useful when conversation restarts)
- `stopMonitoring()`: Stops monitoring and cleans up resources
- The service automatically resets when audio levels go back above threshold

## Debugging

The service includes extensive logging with the prefix `🔇 [SilenceDetection]`:

```
🔇 [SilenceDetection] Service initialized
🔇 [SilenceDetection] Started monitoring (threshold: -50.0 dB, duration: 3.0s)
🔇 [SilenceDetection] Silence started (level: -55.2 dB)
🔇 [SilenceDetection] Silence detected: medium pause (3.2s, -54.8 dB)
🔇 [SilenceDetection] Silence ended after 4.1s (level: -35.4 dB)
🔇 [SilenceDetection] Stopped monitoring
```

## Best Practices

1. **Start monitoring only when recording**: Don't monitor when not recording to save resources
2. **Handle events asynchronously**: Use Task/async-await for event handling
3. **Adjust thresholds for environment**: Noisier environments may need higher thresholds
4. **Test pause types**: Different users may need different duration settings
5. **Clean up properly**: Always call `stopMonitoring()` when done

## Integration with Conversation Manager

```swift
class ConversationManagerService: ObservableObject {
    private let silenceDetector = SilenceDetectionService.shared
    private let hughVoice = HughVoiceService.shared

    func handleUserPause(event: SilenceEvent) async {
        guard event.pauseType == .medium || event.pauseType == .long else {
            return
        }

        // Pause recording while Hugh responds
        await pauseRecording()

        // Generate and speak Hugh's response
        let response = await generateResponse(context: currentContext)
        await hughVoice.speak(response.text)

        // Resume recording
        await resumeRecording()
    }
}
```

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
