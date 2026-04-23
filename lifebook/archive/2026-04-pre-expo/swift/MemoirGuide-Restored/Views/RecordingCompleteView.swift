import SwiftUI
import AVFoundation

// MARK: - Recording Complete View
struct RecordingCompleteView: View {
    let transcription: String
    var audioURL: URL? = nil
    var duration: TimeInterval = 0

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var coreDataManager: CoreDataManager
    @State private var isPlaying = false
    @State private var showingSaveSuccess = false
    @State private var currentWord = 0
    @State private var storyTitle = ""
    @State private var audioPlayer: AVAudioPlayer?

    var canSave: Bool {
        !transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button("Cancel") {
                        dismiss()
                    }
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textSecondary)

                    Spacer()

                    Text("Recording Complete")
                        .font(DesignSystem.title)
                        .foregroundColor(DesignSystem.textPrimary)
                        .accessibilityIdentifier("recordingCompleteTitle")

                    Spacer()

                    // Invisible placeholder for balance
                    Text("Cancel")
                        .font(DesignSystem.body)
                        .foregroundColor(.clear)
                }
                .padding()

                ScrollView {
                    VStack(spacing: 25) {
                        // Success Icon
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)
                            .padding(.top, 20)

                        Text("Great memory captured!")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)

                        // What I Captured Section
                        VStack(alignment: .leading, spacing: 15) {
                            HStack {
                                Image(systemName: "mic.fill")
                                    .font(.body)
                                    .foregroundColor(DesignSystem.primaryTeal)
                                Text("What I captured")
                                    .font(DesignSystem.buttonText)
                                    .foregroundColor(DesignSystem.textPrimary)

                                Spacer()

                                Text("\(transcription.split(separator: " ").count) words")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)

                                Button(action: togglePlayback) {
                                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                        .font(.system(size: 35))
                                        .foregroundColor(DesignSystem.primaryTeal)
                                }
                            }

                            // Transcription with word highlighting
                            TranscriptionView(
                                text: transcription,
                                currentWord: currentWord,
                                isPlaying: isPlaying
                            )
                        }
                        .padding(20)
                        .background(Color.white)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)

                        // Enhanced version preview
                        VStack(alignment: .leading, spacing: 15) {
                            HStack {
                                Image(systemName: "sparkles")
                                    .font(.body)
                                    .foregroundColor(Color.orange)
                                Text("Enhanced version")
                                    .font(DesignSystem.buttonText)
                                    .foregroundColor(DesignSystem.textPrimary)

                                Spacer()

                                Text("Coming soon")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }

                            Text(transcription)
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textPrimary)
                                .lineSpacing(5)
                        }
                        .padding(20)
                        .background(Color.white)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)

                        // Add to Story Section
                        VStack(spacing: 15) {
                            Text("Add to story")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)

                            // Story Title Input
                            TextField("Give this memory a title", text: $storyTitle)
                                .font(DesignSystem.body)
                                .padding()
                                .frame(height: 55)
                                .background(Color.white)
                                .cornerRadius(DesignSystem.cardCornerRadius)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                                .accessibilityIdentifier("storyTitleTextField")
                                .onAppear {
                                    if storyTitle.isEmpty && !transcription.isEmpty {
                                        // Auto-generate title from transcription
                                        let cleanedTranscription = transcription.trimmingCharacters(in: .whitespacesAndNewlines)
                                        if cleanedTranscription.count > 50 {
                                            storyTitle = String(cleanedTranscription.prefix(50)) + "..."
                                        } else {
                                            storyTitle = cleanedTranscription
                                        }
                                    }
                                }
                        }

                        // Action Buttons
                        VStack(spacing: 15) {
                            Button(action: saveStory) {
                                Text("Save This Memory")
                                    .font(DesignSystem.buttonText)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: DesignSystem.primaryButtonHeight)
                                    .background(canSave ? DesignSystem.primaryTeal : Color.gray)
                                    .cornerRadius(DesignSystem.cornerRadius)
                            }
                            .disabled(!canSave)
                            .accessibilityIdentifier("saveMemoryButton")

                            Button(action: {
                                dismiss()
                            }) {
                                Text("Record Another")
                                    .font(DesignSystem.body)
                                    .foregroundColor(DesignSystem.primaryTeal)
                            }
                            .accessibilityIdentifier("recordAnotherButton")
                        }
                        .padding(.bottom, 30)
                    }
                    .padding(.horizontal, DesignSystem.largePadding)
                }
            }

            // Success overlay
            if showingSaveSuccess {
                SaveSuccessOverlay()
                    .transition(.scale.combined(with: .opacity))
                    .zIndex(1)
            }
        }
    }

    func togglePlayback() {
        if isPlaying {
            // Pause playback
            audioPlayer?.pause()
            isPlaying = false
        } else {
            // Start or resume playback
            guard let audioURL = audioURL else {
                print("[RecordingCompleteView] No audio URL available")
                return
            }

            if audioPlayer == nil {
                // Configure audio session
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
                    try AVAudioSession.sharedInstance().setActive(true)
                } catch {
                    print("[RecordingCompleteView] Failed to configure audio session: \(error.localizedDescription)")
                    return
                }

                // Create audio player
                do {
                    audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
                    audioPlayer?.prepareToPlay()
                } catch {
                    print("[RecordingCompleteView] Failed to create audio player: \(error.localizedDescription)")
                    return
                }
            }

            // Play audio
            audioPlayer?.play()
            isPlaying = true

            // Start word highlighting simulation alongside audio
            simulatePlayback()
        }
    }

    func simulatePlayback() {
        let words = transcription.split(separator: " ")
        currentWord = 0

        Timer.scheduledTimer(withTimeInterval: 0.3, repeats: true) { timer in
            if currentWord < words.count && isPlaying {
                currentWord += 1
            } else {
                timer.invalidate()
                currentWord = 0
            }
        }
    }

    func saveStory() {
        // Validate we have content to save
        guard !transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            print("[RecordingCompleteView] Cannot save - empty transcription")
            return
        }

        // Use transcription first 50 chars as title if none provided
        let finalTitle = storyTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?
            String(transcription.prefix(50)) + "..." :
            storyTitle.trimmingCharacters(in: .whitespacesAndNewlines)

        // Save to Core Data
        Task { @MainActor in
            do {
                // Create a new session
                let session = coreDataManager.createMemoirSession()

                // Create a segment with the recording
                let audioFileName = audioURL?.lastPathComponent
                _ = coreDataManager.createMemoirSegment(
                    for: session,
                    transcription: transcription,
                    audioFileName: audioFileName,
                    duration: duration,
                    aiPrompt: nil
                )

                // Save to Core Data
                try coreDataManager.save()

                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()

                withAnimation(.spring()) {
                    showingSaveSuccess = true
                }

                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    dismiss()
                }
            } catch {
                print("[RecordingCompleteView] Failed to save: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - Transcription View with Word Highlighting
struct TranscriptionView: View {
    let text: String
    let currentWord: Int
    let isPlaying: Bool

    var words: [String] {
        text.split(separator: " ").map(String.init)
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                Text(attributedText)
                    .font(DesignSystem.body)
                    .lineSpacing(5)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxHeight: 150)
            .onChange(of: currentWord) { newValue in
                if isPlaying && newValue > 0 {
                    withAnimation {
                        proxy.scrollTo(newValue, anchor: .center)
                    }
                }
            }
        }
    }

    var attributedText: AttributedString {
        var result = AttributedString()

        for (index, word) in words.enumerated() {
            var wordAttr = AttributedString(word + " ")

            if isPlaying {
                if index == currentWord {
                    // Current word - orange
                    wordAttr.foregroundColor = Color.orange
                    wordAttr.backgroundColor = Color.orange.opacity(0.1)
                } else if index == currentWord - 1 {
                    // Previous word - pale orange
                    wordAttr.foregroundColor = Color.orange.opacity(0.6)
                } else if index < currentWord {
                    // Already read - gray
                    wordAttr.foregroundColor = DesignSystem.textSecondary
                } else {
                    // Not yet read
                    wordAttr.foregroundColor = DesignSystem.textPrimary
                }
            } else {
                wordAttr.foregroundColor = DesignSystem.textPrimary
            }

            result.append(wordAttr)
        }

        return result
    }
}

// MARK: - Save Success Overlay
struct SaveSuccessOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)

                Text("Memory Saved!")
                    .font(DesignSystem.largeTitle)
                    .foregroundColor(.white)
            }
            .padding(40)
            .background(DesignSystem.primaryTeal)
            .cornerRadius(DesignSystem.cornerRadius)
        }
    }
}

// MARK: - Preview
struct RecordingCompleteView_Previews: PreviewProvider {
    static var previews: some View {
        RecordingCompleteView(
            transcription: "Today I want to tell you about when I was young, we used to play marbles in the schoolyard. It was such a simple game, but we had so much fun.",
            duration: 45.0
        )
        .environmentObject(CoreDataManager.shared)
    }
}
