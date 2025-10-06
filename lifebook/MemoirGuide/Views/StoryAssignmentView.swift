// StoryAssignmentView.swift
// Post-recording screen for AI story generation and assignment to chapters

import SwiftUI
import CoreData

// MARK: - Constants

private enum Layout {
    static let buttonWidthScale: CGFloat = 0.85
    static let saveButtonScale: CGFloat = 0.85 * 0.85  // 15% smaller
    static let bottomSpacerScale: CGFloat = 0.15
    static let editButtonHeight: CGFloat = 80
    static let saveButtonHeight: CGFloat = 60
    static let iconSize: CGFloat = 48
    static let playIconSize: CGFloat = 28
    static let transcriptionHeight: CGFloat = 250
    static let storyHeight: CGFloat = 300
}

private enum Colors {
    static let activeWord = Color.orange
    static let previousWord = Color.orange.opacity(0.4)
}

// MARK: - Main View

struct StoryAssignmentView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var coreDataManager: CoreDataManager
    @EnvironmentObject var audioPlayer: AudioPlaybackManager
    @Environment(\.managedObjectContext) var context

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
    @State private var isPlayingTranscription = false
    @State private var isPlayingAIStory = false
    @State private var currentWordIndex: Int = 0

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
                    TranscriptionSection(
                        transcription: rawTranscription,
                        isPlaying: isPlayingTranscription,
                        currentWordIndex: currentWordIndex,
                        onPlayTapped: { handlePlayAudio() }
                    )

                    AIStorySection(
                        versionHistory: versionHistory,
                        isGenerating: isGenerating,
                        isPlaying: isPlayingAIStory,
                        currentWordIndex: currentWordIndex,
                        onPlayTapped: { handlePlayAudio() }
                    )

                    if !isGenerating {
                        StoryEditButtons(
                            onDetailPreservation: regenerateWithDetailPreservation,
                            onStartFresh: regenerateFresh,
                            isGenerating: isGenerating
                        )
                    }

                    AssignmentSection(
                        chapters: Array(chapters),
                        selectedChapter: $selectedChapter,
                        showingNewStoryField: $showingNewStoryField,
                        newStoryTitle: $newStoryTitle
                    )

                    SaveButton(canSave: canSave, action: saveStory)
                }
                .padding()
            }
            .navigationTitle("Recording Complete")
            .navigationBarItems(trailing: Button("Cancel") { dismiss() })
        }
        .onAppear {
            generateStory()
            updatePlayingStates()
        }
        .onChange(of: audioPlayer.isPlaying) { _ in
            updatePlayingStates()
        }
        .onChange(of: audioPlayer.currentTime) { _ in
            updateWordHighlighting()
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }

    // MARK: - Computed Properties

    private var canSave: Bool {
        !isGenerating && (selectedChapter != nil || !newStoryTitle.isEmpty)
    }

    // MARK: - Audio Playback

    private func handlePlayAudio() {
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

    private func updateWordHighlighting() {
        guard audioPlayer.currentSegment?.id == segment.id,
              audioPlayer.isPlaying,
              audioPlayer.duration > 0 else {
            currentWordIndex = 0
            return
        }

        let text = isPlayingAIStory ? versionHistory.currentVersion.text : rawTranscription
        let words = text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        let totalWords = words.count

        guard totalWords > 0 else { return }

        let progress = audioPlayer.currentTime / audioPlayer.duration
        let estimatedIndex = Int(progress * Double(totalWords))
        currentWordIndex = max(0, min(estimatedIndex, totalWords - 1))
    }

    // MARK: - AI Story Generation

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
                    versionHistory.addVersion(rawTranscription)
                }
            }
        }
    }

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

    // MARK: - Save Story

    private func saveStory() {
        let userProfile = coreDataManager.getUserProfile()

        var targetChapter = selectedChapter
        if targetChapter == nil && !newStoryTitle.isEmpty {
            targetChapter = coreDataManager.createChapter(title: newStoryTitle, userProfile: userProfile)
        }

        segment.aiStoryText = versionHistory.currentVersion.text
        segment.aiProcessed = true
        segment.aiModel = "claude-3-5-sonnet-20241022"
        segment.editHistory = versionHistory.toData()

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
}

// MARK: - Transcription Section

struct TranscriptionSection: View {
    let transcription: String
    let isPlaying: Bool
    let currentWordIndex: Int
    let onPlayTapped: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mic.fill")
                    .foregroundColor(.gray)
                Text("What I captured")
                    .font(.headline)

                Spacer()

                Button(action: onPlayTapped) {
                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: Layout.playIconSize))
                        .foregroundColor(.blue)
                }
                .accessibilityLabel(isPlaying ? "Pause audio" : "Play audio")

                Text("\(wordCount(transcription)) words")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            HighlightedTextView(
                text: transcription,
                currentWordIndex: currentWordIndex,
                isPlaying: isPlaying
            )
            .frame(height: Layout.transcriptionHeight)
            .textContainerStyle()
        }
    }

    private func wordCount(_ text: String) -> Int {
        text.split(separator: " ").count
    }
}

// MARK: - AI Story Section

struct AIStorySection: View {
    @ObservedObject var versionHistory: StoryVersionHistory
    let isGenerating: Bool
    let isPlaying: Bool
    let currentWordIndex: Int
    let onPlayTapped: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.blue)
                Text("How I heard it")
                    .font(.headline)

                Spacer()

                if isGenerating {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Button(action: onPlayTapped) {
                        Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: Layout.playIconSize))
                            .foregroundColor(.blue)
                    }
                    .accessibilityLabel(isPlaying ? "Pause audio" : "Play audio")

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
                .frame(height: Layout.storyHeight)
                .frame(maxWidth: .infinity)
                .generatingStoryStyle()
            } else {
                HighlightedTextView(
                    text: versionHistory.currentVersion.text,
                    currentWordIndex: currentWordIndex,
                    isPlaying: isPlaying
                )
                .frame(height: Layout.storyHeight)
                .generatedStoryStyle()
            }
        }
    }
}

// MARK: - Story Edit Buttons

struct StoryEditButtons: View {
    let onDetailPreservation: () -> Void
    let onStartFresh: () -> Void
    let isGenerating: Bool

    var body: some View {
        VStack(spacing: 16) {
            EditButton(
                title: "Something's missing, Fix it",
                icon: "wand.and.stars",
                color: .orange,
                action: onDetailPreservation,
                isDisabled: isGenerating,
                accessibilityHint: "Regenerate story with all details preserved, fixing only spelling and grammar"
            )

            EditButton(
                title: "Forget this and Start Fresh",
                icon: "arrow.counterclockwise.circle.fill",
                color: .blue,
                action: onStartFresh,
                isDisabled: isGenerating,
                accessibilityHint: "Regenerate story completely from the original recording"
            )
        }
    }
}

struct EditButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    let isDisabled: Bool
    let accessibilityHint: String

    var body: some View {
        Button(action: {
            action()
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }) {
            HStack(spacing: 12) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(color)
                    .multilineTextAlignment(.leading)

                Spacer()

                Image(systemName: icon)
                    .font(.system(size: Layout.iconSize))
                    .foregroundColor(color)
            }
            .padding(.horizontal, 16)
            .frame(width: UIScreen.main.bounds.width * Layout.buttonWidthScale, height: Layout.editButtonHeight)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(color.opacity(0.1))
            )
        }
        .disabled(isDisabled)
        .accessibilityLabel(title)
        .accessibilityHint(accessibilityHint)
    }
}

// MARK: - Assignment Section

struct AssignmentSection: View {
    let chapters: [ChapterEntity]
    @Binding var selectedChapter: ChapterEntity?
    @Binding var showingNewStoryField: Bool
    @Binding var newStoryTitle: String

    var body: some View {
        VStack(spacing: 16) {
            Text("Add to Story")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if !chapters.isEmpty {
                ChapterSelectionMenu(chapters: chapters, selectedChapter: $selectedChapter)

                Text("or")
                    .foregroundColor(.gray)
            }

            if showingNewStoryField {
                NewStoryField(
                    newStoryTitle: $newStoryTitle,
                    onCancel: {
                        showingNewStoryField = false
                        newStoryTitle = ""
                    }
                )
            } else {
                CreateNewStoryButton(onTap: {
                    showingNewStoryField = true
                    selectedChapter = nil
                })
            }
        }
    }
}

struct ChapterSelectionMenu: View {
    let chapters: [ChapterEntity]
    @Binding var selectedChapter: ChapterEntity?

    var body: some View {
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
    }
}

struct NewStoryField: View {
    @Binding var newStoryTitle: String
    let onCancel: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            TextField("Story title (e.g. \"My Childhood\")", text: $newStoryTitle)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .font(.title3)

            Button("Cancel") {
                onCancel()
            }
            .foregroundColor(.red)
        }
    }
}

struct CreateNewStoryButton: View {
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
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

// MARK: - Save Button

struct SaveButton: View {
    let canSave: Bool
    let action: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Button(action: action) {
                Text("Save story")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: Layout.saveButtonHeight)
                    .background(canSave ? Color.green : Color.gray)
                    .cornerRadius(16)
            }
            .disabled(!canSave)
            .frame(width: UIScreen.main.bounds.width * Layout.saveButtonScale)
            .padding(.top, 16)

            Spacer()
                .frame(height: UIScreen.main.bounds.height * Layout.bottomSpacerScale)
        }
    }
}

// MARK: - Highlighted Text View

struct HighlightedTextView: View {
    let text: String
    let currentWordIndex: Int
    let isPlaying: Bool

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    let words = text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }

                    ForEach(Array(words.enumerated()), id: \.offset) { index, word in
                        Text(word + " ")
                            .foregroundColor(wordColor(for: index))
                            .fontWeight(index == currentWordIndex && isPlaying ? .bold : .regular)
                            .id(index)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .onChange(of: currentWordIndex) { newIndex in
                    if isPlaying && newIndex < text.components(separatedBy: .whitespacesAndNewlines).filter({ !$0.isEmpty }).count {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            proxy.scrollTo(newIndex, anchor: .center)
                        }
                    }
                }
            }
        }
    }

    private func wordColor(for index: Int) -> Color {
        guard isPlaying else { return .primary }

        if index == currentWordIndex {
            return Colors.activeWord
        } else if index == currentWordIndex - 1 {
            return Colors.previousWord
        } else {
            return .primary
        }
    }
}

// MARK: - View Modifiers

extension View {
    func textContainerStyle() -> some View {
        self
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
    }

    func generatingStoryStyle() -> some View {
        self
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue.opacity(0.3), lineWidth: 2)
            )
    }

    func generatedStoryStyle() -> some View {
        self
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue.opacity(0.3), lineWidth: 2)
            )
    }
}
