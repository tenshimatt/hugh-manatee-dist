// StoryAssignmentView.swift
// Post-recording screen for AI story generation and assignment to chapters

import SwiftUI
import CoreData
import AVKit

struct StoryAssignmentView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var coreDataManager: CoreDataManager
    @EnvironmentObject var audioPlayer: AudioPlaybackManager
    @Environment(\.managedObjectContext) var context

    // Bug 36: Video player for segments with video
    @StateObject private var videoPlayerManager = VideoPlayerManager()

    let segment: MemoirSegmentEntity
    let rawTranscription: String

    @StateObject private var aiGenerator: AIStoryGenerator
    @StateObject private var versionHistory: StoryVersionHistory

    @State private var isGenerating = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var selectedChapter: ChapterEntity?
    @State private var showingNewStoryField = false
    @State private var newStoryTitle = ""

    // Bug 25 & 26: Audio playback states
    @State private var isPlayingTranscription = false
    @State private var isPlayingAIStory = false

    // Bug 28 & 29: Word highlighting state
    @State private var currentWordIndex: Int = 0
    @State private var scrollToWordID: UUID?

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \ChapterEntity.chapterNumber, ascending: true)],
        animation: .default)
    private var chapters: FetchedResults<ChapterEntity>

    init(segment: MemoirSegmentEntity, rawTranscription: String, apiKey: String) {
        self.segment = segment
        self.rawTranscription = rawTranscription
        _aiGenerator = StateObject(wrappedValue: AIStoryGenerator(apiKey: apiKey))
        _versionHistory = StateObject(wrappedValue: StoryVersionHistory(initialText: rawTranscription))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Bug 36: Video preview (only if video exists)
                    if segment.hasVideo {
                        videoSection
                    }

                    // Original Transcription
                    transcriptionSection

                    // AI Generated Story
                    aiStorySection

                    // Undo/Redo Buttons
                    if !isGenerating {
                        undoRedoButtons
                    }

                    // Story Assignment
                    assignmentSection

                    // Save Button
                    saveButton
                }
                .padding()
            }
            .navigationTitle("Recording Complete")
            .navigationBarItems(trailing: Button("Cancel") {
                dismiss()
            })
        }
        .onAppear {
            generateStory()
            updatePlayingStates()

            // Bug 36: Setup video player if video exists
            if segment.hasVideo, let videoURL = segment.videoURL {
                videoPlayerManager.setupPlayer(with: videoURL)
            }
        }
        .onChange(of: audioPlayer.isPlaying) { _ in
            updatePlayingStates()
            syncVideoPlayback()
        }
        .onChange(of: audioPlayer.currentTime) { _ in
            updateWordHighlighting()
            syncVideoTime()
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }

    // MARK: - Video Section (Bug 36)

    private var videoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "video.fill")
                    .foregroundColor(.purple)
                Text("Video Recording")
                    .font(.headline)

                Spacer()
            }

            if let player = videoPlayerManager.player {
                VideoPlayer(player: player)
                    .frame(height: 200)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.purple.opacity(0.3), lineWidth: 2)
                    )
                    .disabled(true) // Prevent manual controls, sync with audio
            }
        }
    }

    // MARK: - Transcription Section

    private var transcriptionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Bug 30: Horizontal layout for icons
            HStack {
                Image(systemName: "mic.fill")
                    .foregroundColor(.gray)
                Text("What I captured")  // Bug 7 fix
                    .font(.headline)

                Spacer()

                // Bug 30: Play audio button (left position)
                Button(action: handlePlayTranscription) {
                    Image(systemName: isPlayingTranscription ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.blue)
                }
                .accessibilityLabel(isPlayingTranscription ? "Pause audio" : "Play audio")

                Text("\(wordCount(rawTranscription)) words")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            // Bug 28 & 29: Highlighted text with auto-scroll
            // Bug 33: Increased height to fill space (was 150, now 250)
            HighlightedTextView(
                text: rawTranscription,
                currentWordIndex: currentWordIndex,
                isPlaying: isPlayingTranscription
            )
            .frame(height: 250)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
        }
    }

    // MARK: - AI Story Section

    private var aiStorySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Bug 30: Horizontal layout for icons
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.blue)
                Text("How I heard it")  // Bug 8 fix
                    .font(.headline)

                Spacer()

                if isGenerating {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    // Bug 30: Play audio button (left position)
                    Button(action: handlePlayAIStory) {
                        Image(systemName: isPlayingAIStory ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.blue)
                    }
                    .accessibilityLabel(isPlayingAIStory ? "Pause audio" : "Play audio")

                    Text("\(versionHistory.currentVersion.wordCount) words")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }

            if isGenerating {
                VStack(spacing: 16) {
                    ProgressView()
                    Text("Generating story...")
                        .foregroundColor(.gray)
                }
                .frame(height: 300)
                .frame(maxWidth: .infinity)
                .background(Color.white)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                )
            } else {
                // Bug 28 & 29: Highlighted text with auto-scroll
                // Bug 33: Increased height to fill space (was 200, now 300)
                HighlightedTextView(
                    text: versionHistory.currentVersion.text,
                    currentWordIndex: currentWordIndex,
                    isPlaying: isPlayingAIStory
                )
                .frame(height: 300)
                .background(Color.white)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                )
            }
        }
    }

    // MARK: - Story Edit Buttons (Bugs 21-24)

    private var undoRedoButtons: some View {
        VStack(spacing: 16) {
            // Bug 21: "Something's missing, Fix it" button
            Button(action: {
                regenerateWithDetailPreservation()
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }) {
                HStack(spacing: 12) {
                    Text("Something's missing, Fix it")
                        .font(.headline)
                        .foregroundColor(.orange)
                        .multilineTextAlignment(.leading)

                    Spacer()

                    // Bug 24: Icon on right, 48pt size
                    Image(systemName: "wand.and.stars")
                        .font(.system(size: 48))
                        .foregroundColor(.orange)
                }
                .padding(.horizontal, 16)
                .frame(width: UIScreen.main.bounds.width * 0.85, height: 80)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.orange.opacity(0.1))
                )
            }
            .disabled(isGenerating)
            .accessibilityLabel("Something's missing, Fix it")
            .accessibilityHint("Regenerate story with all details preserved, fixing only spelling and grammar")

            // Bug 22: "Forget this and Start Fresh" (was Redo)
            // Bug 23: Undo button deleted
            Button(action: {
                regenerateFresh()
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }) {
                HStack(spacing: 12) {
                    Text("Forget this and Start Fresh")
                        .font(.headline)
                        .foregroundColor(.blue)
                        .multilineTextAlignment(.leading)

                    Spacer()

                    // Bug 24: Icon on right, 48pt size
                    Image(systemName: "arrow.counterclockwise.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                }
                .padding(.horizontal, 16)
                .frame(width: UIScreen.main.bounds.width * 0.85, height: 80)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.blue.opacity(0.1))
                )
            }
            .disabled(isGenerating)
            .accessibilityLabel("Forget this and Start Fresh")
            .accessibilityHint("Regenerate story completely from the original recording")
        }
    }

    // MARK: - Assignment Section

    private var assignmentSection: some View {
        VStack(spacing: 16) {
            Text("Add to Story")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Existing stories dropdown
            if !chapters.isEmpty {
                Menu {
                    ForEach(chapters, id: \.id) { chapter in
                        Button(action: {
                            selectedChapter = chapter
                        }) {
                            Text(chapter.title ?? "Untitled")
                        }
                    }
                } label: {
                    HStack {
                        Text(selectedChapter?.title ?? "Select Existing Story")
                            .foregroundColor(selectedChapter == nil ? .gray : .primary)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .foregroundColor(.gray)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                    )
                }
                .frame(maxWidth: .infinity)

                Text("or")
                    .foregroundColor(.gray)
            }

            // Create new story
            if showingNewStoryField {
                VStack(spacing: 12) {
                    TextField("Story title (e.g. \"My Childhood\")", text: $newStoryTitle)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.title3)

                    Button("Cancel") {
                        showingNewStoryField = false
                        newStoryTitle = ""
                    }
                    .foregroundColor(.red)
                }
            } else {
                Button(action: {
                    showingNewStoryField = true
                    selectedChapter = nil
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)

                        VStack(spacing: 4) {
                            Text("Create")
                                .font(.title3)
                                .fontWeight(.semibold)
                            Text("New Story")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.blue.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                            )
                    )
                }
            }
        }
    }

    // MARK: - Save Button

    private var saveButton: some View {
        VStack(spacing: 0) {
            // Bug 1 fix: 15% smaller button, Bug 6: sentence case
            Button(action: saveStory) {
                Text("Save story")
                    .font(.title2)  // iOS system font
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(canSave ? Color.green : Color.gray)
                    .cornerRadius(16)
            }
            .disabled(!canSave)
            .frame(width: UIScreen.main.bounds.width * 0.85 * 0.85)  // 15% smaller than standard button
            .padding(.top, 16)

            // Bug 2 fix: 15% white space below button for easier tapping
            Spacer()
                .frame(height: UIScreen.main.bounds.height * 0.15)
        }
    }

    // MARK: - Helper Properties

    private var canSave: Bool {
        !isGenerating && (selectedChapter != nil || !newStoryTitle.isEmpty)
    }

    // MARK: - Actions

    private func generateStory() {
        isGenerating = true

        Task {
            do {
                let generatedStory = try await aiGenerator.generateStory(from: rawTranscription)

                await MainActor.run {
                    versionHistory.addVersion(generatedStory)
                    isGenerating = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isGenerating = false
                    // Use raw transcription as fallback
                    versionHistory.addVersion(rawTranscription)
                }
            }
        }
    }

    // Bug 21: Regenerate with detail preservation
    private func regenerateWithDetailPreservation() {
        isGenerating = true

        Task {
            do {
                let detailedStory = try await aiGenerator.generateStoryWithDetailPreservation(from: rawTranscription)

                await MainActor.run {
                    versionHistory.addVersion(detailedStory)
                    isGenerating = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isGenerating = false
                }
            }
        }
    }

    // Bug 22: Regenerate completely fresh
    private func regenerateFresh() {
        isGenerating = true

        Task {
            do {
                let freshStory = try await aiGenerator.generateStory(from: rawTranscription)

                await MainActor.run {
                    versionHistory.addVersion(freshStory)
                    isGenerating = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isGenerating = false
                }
            }
        }
    }

    // Bug 25: Handle play/pause for transcription audio
    private func handlePlayTranscription() {
        let isCurrentSegment = audioPlayer.currentSegment?.id == segment.id

        if isCurrentSegment && audioPlayer.isPlaying {
            audioPlayer.pause()
        } else if isCurrentSegment && !audioPlayer.isPlaying {
            audioPlayer.resume()
        } else {
            Task {
                await audioPlayer.playSegment(segment)
            }
        }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    // Bug 26: Handle play/pause for AI story audio (same source)
    private func handlePlayAIStory() {
        let isCurrentSegment = audioPlayer.currentSegment?.id == segment.id

        if isCurrentSegment && audioPlayer.isPlaying {
            audioPlayer.pause()
        } else if isCurrentSegment && !audioPlayer.isPlaying {
            audioPlayer.resume()
        } else {
            Task {
                await audioPlayer.playSegment(segment)
            }
        }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    private func updatePlayingStates() {
        let isCurrentSegment = audioPlayer.currentSegment?.id == segment.id
        isPlayingTranscription = isCurrentSegment && audioPlayer.isPlaying
        isPlayingAIStory = isCurrentSegment && audioPlayer.isPlaying
    }

    // Bug 36: Sync video playback with audio
    private func syncVideoPlayback() {
        guard audioPlayer.currentSegment?.id == segment.id else { return }

        if audioPlayer.isPlaying {
            videoPlayerManager.play()
        } else {
            videoPlayerManager.pause()
        }
    }

    // Bug 36: Sync video time with audio time
    private func syncVideoTime() {
        guard audioPlayer.currentSegment?.id == segment.id,
              audioPlayer.isPlaying else { return }

        videoPlayerManager.seek(to: audioPlayer.currentTime)
    }

    // Bug 28 & 29: Update word highlighting based on playback time
    private func updateWordHighlighting() {
        guard audioPlayer.currentSegment?.id == segment.id,
              audioPlayer.isPlaying,
              audioPlayer.duration > 0 else {
            currentWordIndex = 0
            return
        }

        // Determine which text to use for word count
        let text = isPlayingAIStory ? versionHistory.currentVersion.text : rawTranscription
        let words = text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        let totalWords = words.count

        guard totalWords > 0 else { return }

        // Estimate word index based on playback progress
        // Simple linear interpolation: currentTime / duration * totalWords
        let progress = audioPlayer.currentTime / audioPlayer.duration
        let estimatedIndex = Int(progress * Double(totalWords))

        // Clamp to valid range
        currentWordIndex = max(0, min(estimatedIndex, totalWords - 1))
    }

    private func saveStory() {
        let userProfile = coreDataManager.getUserProfile()

        // Create new story if needed
        var targetChapter = selectedChapter
        if targetChapter == nil && !newStoryTitle.isEmpty {
            targetChapter = coreDataManager.createChapter(title: newStoryTitle, userProfile: userProfile)
        }

        // Update segment with AI story text
        segment.aiStoryText = versionHistory.currentVersion.text
        segment.aiProcessed = true
        segment.aiModel = "claude-3-5-sonnet-20241022"
        segment.editHistory = versionHistory.toData()

        // Link segment's session to chapter
        if let chapter = targetChapter, let session = segment.session {
            session.chapter = chapter
        }

        do {
            try coreDataManager.save()
            dismiss()
        } catch {
            errorMessage = "Failed to save story: \(error.localizedDescription)"
            showError = true
        }
    }

    private func wordCount(_ text: String) -> Int {
        text.split(separator: " ").count
    }
}

// MARK: - Highlighted Text View (Bugs 28 & 29)

struct HighlightedTextView: View {
    let text: String
    let currentWordIndex: Int
    let isPlaying: Bool

    // Bug 28 & 29: Orange colors from palette
    private let activeWordColor = Color.orange // Bug 28: Actively spoken word
    private let previousWordColor = Color.orange.opacity(0.4) // Bug 29: Previous word (pale orange)

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                let words = text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }

                // Use FlowLayout-style wrapped text with individual word views
                WrappedHStack(words: words, currentWordIndex: currentWordIndex, isPlaying: isPlaying)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .onChange(of: currentWordIndex) { newIndex in
                        // Bug 29: Auto-scroll to keep current word in view
                        if isPlaying && newIndex < words.count {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                proxy.scrollTo(newIndex, anchor: .center)
                            }
                        }
                    }
            }
        }
    }
}

// Custom view to display words with wrapping and highlighting
struct WrappedHStack: View {
    let words: [String]
    let currentWordIndex: Int
    let isPlaying: Bool

    // Bug 28 & 29: Orange colors
    private let activeWordColor = Color.orange
    private let previousWordColor = Color.orange.opacity(0.4)

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(Array(words.enumerated()), id: \.offset) { index, word in
                Text(word + " ")
                    .foregroundColor(wordColor(for: index))
                    .fontWeight(index == currentWordIndex && isPlaying ? .bold : .regular)
                    .id(index) // Bug 29: ID for scrolling
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func wordColor(for index: Int) -> Color {
        guard isPlaying else { return .primary }

        if index == currentWordIndex {
            return activeWordColor // Bug 28: Current word
        } else if index == currentWordIndex - 1 {
            return previousWordColor // Bug 29: Previous word
        } else {
            return .primary
        }
    }
}