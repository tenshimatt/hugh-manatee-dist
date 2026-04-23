# Frontend Quick Reference - MemoirGuide Backend API

**For Aurora UI Implementation**

---

## Importing Managers

```swift
import SwiftUI

// In your View
@StateObject private var recordingManager = RecordingManager()
@StateObject private var coreData = CoreDataManager.shared
@StateObject private var playback = AudioPlaybackManager.shared
@StateObject private var profile = ProfileChecklistManager.shared
@StateObject private var themeManager = ThemeManager.shared
@StateObject private var appState = AppState()
```

---

## Recording View Bindings

### Start/Stop Recording

```swift
Button("Record") {
    Task {
        do {
            try await recordingManager.startRecording()
        } catch {
            // Handle error
            print("Recording failed: \(error)")
        }
    }
}
.disabled(recordingManager.isRecording)

Button("Stop") {
    Task {
        let segment = await recordingManager.stopRecording()
        // segment is now saved to Core Data
    }
}
.disabled(!recordingManager.isRecording)
```

### Display Recording State

```swift
VStack {
    // Transcription
    Text(recordingManager.currentTranscription)
        .font(.body)

    // Duration
    Text(formatDuration(recordingManager.recordingDuration))
        .font(.title)

    // Audio level meter
    ProgressView(value: Double(recordingManager.audioLevel), total: 1.0)
        .progressViewStyle(.linear)

    // Auto-save indicator
    if let lastSave = recordingManager.lastAutoSave {
        Text("Last saved: \(lastSave.timeAgoDisplay())")
            .font(.caption)
            .foregroundColor(.secondary)
    }

    // Error display
    if let error = recordingManager.recordingError {
        Text(error)
            .foregroundColor(.red)
            .font(.caption)
    }
}
```

---

## Library View Data Fetching

### Fetch Chapters

```swift
struct LibraryView: View {
    @StateObject private var coreData = CoreDataManager.shared
    @FetchRequest(
        entity: ChapterEntity.entity(),
        sortDescriptors: [NSSortDescriptor(key: "chapterNumber", ascending: true)]
    ) var chapters: FetchedResults<ChapterEntity>

    var body: some View {
        List(chapters) { chapter in
            ChapterRow(chapter: chapter)
        }
    }
}
```

### Chapter Card Data

```swift
struct ChapterRow: View {
    let chapter: ChapterEntity

    var body: some View {
        VStack(alignment: .leading) {
            Text(chapter.chapterTitle)
                .font(.headline)

            HStack {
                Text("\(chapter.computedWordCount) words")
                Text(chapter.formattedDuration)

                if chapter.isShared {
                    Image(systemName: "person.2")
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)

            Text(chapter.chapterStatus.displayName)
                .font(.caption)
                .foregroundColor(statusColor(chapter.chapterStatus))
        }
    }

    func statusColor(_ status: ChapterEntity.ChapterStatus) -> Color {
        switch status {
        case .draft: return .orange
        case .review: return .yellow
        case .published: return .green
        case .archived: return .gray
        }
    }
}
```

### Sync Status Indicator

```swift
struct SyncStatusView: View {
    @StateObject private var coreData = CoreDataManager.shared

    var body: some View {
        HStack {
            switch coreData.syncStatus {
            case .idle:
                Image(systemName: "checkmark.icloud")
                    .foregroundColor(.green)
            case .syncing:
                ProgressView()
                Text("Syncing...")
            case .success:
                Image(systemName: "checkmark.icloud.fill")
                    .foregroundColor(.green)
            case .error(let error):
                Image(systemName: "exclamationmark.icloud")
                    .foregroundColor(.red)
                Text(error.localizedDescription)
                    .font(.caption)
            }

            if let lastSync = coreData.lastSyncDate {
                Text("Last sync: \(lastSync.timeAgoDisplay())")
                    .font(.caption2)
            }
        }
    }
}
```

---

## Reader/Playback View

### Playback Controls

```swift
struct PlaybackView: View {
    @StateObject private var playback = AudioPlaybackManager.shared
    let segment: MemoirSegmentEntity

    var body: some View {
        VStack {
            // Play/Pause button
            Button(action: {
                if playback.isPlaying {
                    playback.pause()
                } else if playback.currentSegment == segment {
                    playback.resume()
                } else {
                    Task {
                        await playback.playSegment(segment)
                    }
                }
            }) {
                Image(systemName: playback.isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 44))
            }
            .disabled(playback.isLoading)

            // Progress bar
            VStack {
                Slider(
                    value: Binding(
                        get: { playback.currentTime },
                        set: { playback.seek(to: $0) }
                    ),
                    in: 0...playback.duration
                )

                HStack {
                    Text(playback.formatTime(playback.currentTime))
                    Spacer()
                    Text(playback.formatTime(playback.remainingTime))
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            // Skip buttons
            HStack(spacing: 40) {
                Button(action: { playback.skipBackward(10) }) {
                    Image(systemName: "gobackward.10")
                }

                Button(action: { playback.skipForward(10) }) {
                    Image(systemName: "goforward.10")
                }
            }
            .font(.title2)

            // Playback speed
            Menu {
                Button("0.5x") { playback.setPlaybackRate(0.5) }
                Button("1.0x") { playback.setPlaybackRate(1.0) }
                Button("1.5x") { playback.setPlaybackRate(1.5) }
                Button("2.0x") { playback.setPlaybackRate(2.0) }
            } label: {
                Text("\(playback.playbackRate, specifier: "%.1f")x")
            }

            // Volume
            VStack {
                Text("Volume")
                Slider(
                    value: Binding(
                        get: { playback.volume },
                        set: { playback.setVolume($0) }
                    ),
                    in: 0...1
                )
            }

            // Error display
            if let error = playback.error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding()
    }
}
```

---

## Profile Checklist View

### Progress Display

```swift
struct ProfileChecklistView: View {
    @StateObject private var profile = ProfileChecklistManager.shared

    var body: some View {
        VStack {
            // Progress circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)

                Circle()
                    .trim(from: 0, to: Double(profile.completionPercentage) / 100.0)
                    .stroke(
                        Color(profile.progressColor == "red" ? .red :
                              profile.progressColor == "yellow" ? .yellow : .green),
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                Text("\(profile.completionPercentage)%")
                    .font(.largeTitle)
                    .bold()
            }
            .frame(width: 200, height: 200)

            Text(profile.progressMessage)
                .font(.headline)
                .padding()

            // Checklist items
            List(profile.allChecklistItems, id: \.field) { item in
                ChecklistItemRow(item: item)
            }
        }
    }
}
```

### Checklist Item Row

```swift
struct ChecklistItemRow: View {
    @StateObject private var profile = ProfileChecklistManager.shared
    let item: ProfileInfoEntity.ChecklistItem
    @State private var editedValue: String = ""
    @State private var showError: String?

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(item.isCompleted ? .green :
                                   (item.isCritical ? .red : .gray))

                VStack(alignment: .leading) {
                    Text(item.title)
                        .font(.headline)
                    Text(item.subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Input field based on field type
            if item.field == .dateOfBirth {
                DatePicker(
                    "Select date",
                    selection: Binding(
                        get: { profile.profileInfo?.dateOfBirth ?? Date() },
                        set: { updateField(item.field, value: $0) }
                    ),
                    displayedComponents: .date
                )
            } else {
                TextField("Enter \(item.title.lowercased())", text: $editedValue)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit {
                        updateField(item.field, value: editedValue)
                    }
            }

            if let error = showError {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding(.vertical, 8)
    }

    func updateField(_ field: ProfileInfoEntity.ProfileField, value: Any?) {
        // Validate first
        if let error = profile.validateField(field, value: value) {
            showError = error
        } else {
            showError = nil
            profile.updateField(field, value: value)
        }
    }
}
```

---

## Theme Switching

### Theme Picker

```swift
struct ThemePicker: View {
    @StateObject private var themeManager = ThemeManager.shared

    var body: some View {
        Menu {
            ForEach(ThemeManager.themes, id: \.id) { theme in
                Button(action: {
                    themeManager.currentTheme = theme
                }) {
                    HStack {
                        Text(theme.name)
                        if themeManager.currentTheme.id == theme.id {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack {
                Circle()
                    .fill(themeManager.currentTheme.primary)
                    .frame(width: 20, height: 20)
                Text(themeManager.currentTheme.name)
            }
        }
    }
}
```

### Apply Theme to View

```swift
struct MainView: View {
    @StateObject private var themeManager = ThemeManager.shared

    var body: some View {
        NavigationView {
            VStack {
                // Your content
            }
            .themedBackground() // Applies theme background
            .themedCard() // Applies theme surface with shadow
        }
        .environment(\.appTheme, themeManager.currentTheme)
    }
}
```

### Use Theme Colors

```swift
struct ThemedButton: View {
    @Environment(\.appTheme) var theme
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .foregroundColor(theme.textPrimary)
                .padding()
                .background(theme.primary)
                .cornerRadius(12)
        }
    }
}
```

---

## Error Handling

### Display AppError

```swift
struct ErrorView: View {
    let error: AppError

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: error.category.icon)
                .font(.system(size: 60))
                .foregroundColor(.red)

            Text(error.errorDescription ?? "Unknown error")
                .font(.headline)
                .multilineTextAlignment(.center)

            if let reason = error.failureReason {
                Text(reason)
                    .font(.body)
                    .foregroundColor(.secondary)
            }

            if let suggestion = error.recoverySuggestion {
                Text(suggestion)
                    .font(.callout)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
            }

            if error.requiresUserAction {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}
```

---

## Utility Functions

### Format Duration

```swift
func formatDuration(_ duration: TimeInterval) -> String {
    let hours = Int(duration) / 3600
    let minutes = Int(duration) % 3600 / 60
    let seconds = Int(duration) % 60

    if hours > 0 {
        return String(format: "%d:%02d:%02d", hours, minutes, seconds)
    } else {
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
```

### Time Ago Display

```swift
extension Date {
    func timeAgoDisplay() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}
```

---

## Common Patterns

### Loading State

```swift
if recordingManager.isRecording {
    ProgressView("Recording...")
} else {
    Button("Start Recording") {
        Task {
            try await recordingManager.startRecording()
        }
    }
}
```

### Conditional Display

```swift
if playback.isPlaying {
    // Show playing UI
} else if playback.isLoading {
    ProgressView()
} else {
    // Show play button
}
```

### Fetch Request with Core Data

```swift
@FetchRequest(
    entity: MemoirSegmentEntity.entity(),
    sortDescriptors: [NSSortDescriptor(key: "createdAt", ascending: false)],
    predicate: NSPredicate(format: "transcription != nil AND transcription != ''")
) var segments: FetchedResults<MemoirSegmentEntity>
```

---

## Important Notes

1. **All managers use @MainActor** - UI updates happen automatically on main thread
2. **Use async/await for manager methods** - Don't use completion handlers
3. **Bind to @Published properties** - SwiftUI will automatically update
4. **Use .shared for singletons** - CoreDataManager, AudioPlaybackManager, ProfileChecklistManager
5. **Theme is available via Environment** - Use `@Environment(\.appTheme)`

---

## Need Help?

Refer to `/Users/mattwright/pandora/lifebook/MemoirGuide-Restored/BACKEND_INTEGRATION_REPORT.md` for complete API documentation.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
