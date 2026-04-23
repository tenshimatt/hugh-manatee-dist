import SwiftUI
import AVFoundation

// MARK: - Recording Complete View
struct RecordingCompleteView: View {
    let transcription: String
    var audioURL: URL? = nil
    var duration: TimeInterval = 0

    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = RecordingDataManager.shared
    @StateObject private var extractor = AIEntityExtractor.shared
    @StateObject private var populator = ProfileAutoPopulator.shared
    @StateObject private var profileManager = ProfileChecklistManager.shared
    @StateObject private var aiGenerator = AIStoryGenerator.shared
    @StateObject private var aiInterviewer = AIInterviewerService.shared
    @StateObject private var hughVoice = HughVoiceService.shared
    @State private var isPlaying = false
    @State private var showingSaveSuccess = false
    @State private var followUpQuestions: [String] = []
    @State private var isGeneratingQuestions = false
    @State private var selectedCategory: String? = nil
    @State private var currentWord = 0
    @State private var storyTitle = ""
    @State private var isExtracting = false
    @State private var extractedEntities: ExtractedEntities? = nil
    @State private var discoveredFields: [String] = []
    @State private var audioPlayer: AVAudioPlayer?
    @State private var showingValidationAlert = false

    // AI Enhancement State
    @State private var aiStoryText: String? = nil
    @State private var undoStack: [StoryVersion] = []
    @State private var redoStack: [StoryVersion] = []
    @State private var currentVersionIndex = 0
    @State private var isGeneratingAI = false
    @State private var selectedStory: Story? = nil
    @State private var showingCreateStory = false

    var canSave: Bool {
        !transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !storyTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
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
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "mic.fill")
                                        .font(.body)
                                        .foregroundColor(DesignSystem.amber)
                                    Text("I captured")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                HStack {
                                    Text("\(transcription.split(separator: " ").count) words")
                                        .font(DesignSystem.caption)
                                        .foregroundColor(DesignSystem.textSecondary)

                                    Spacer()

                                    Button(action: togglePlayback) {
                                        Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                            .font(.system(size: 35))
                                            .foregroundColor(DesignSystem.amber)
                                    }
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
                        .background(
                            RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                .fill(DesignSystem.warmCardGradient)
                        )
                        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        
                        // AI Enhanced version
                        VStack(alignment: .leading, spacing: 15) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .font(.body)
                                        .foregroundColor(Color.orange)
                                    Text("✨ Edited version")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                HStack {
                                    if let aiText = aiStoryText {
                                        Text("\(aiText.split(separator: " ").count) words")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                    } else if isGeneratingAI {
                                        Text("AI is enhancing...")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                    } else {
                                        Text("Ready")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                    }

                                    Spacer()
                                }
                            }

                            // AI Story Display
                            ScrollView {
                                if isGeneratingAI {
                                    VStack(spacing: 15) {
                                        ProgressView()
                                            .scaleEffect(1.5)
                                        Text("🤖 Generating enhanced version...")
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 120)
                                } else if let aiText = aiStoryText {
                                    Text(aiText)
                                        .font(DesignSystem.body)
                                        .foregroundColor(DesignSystem.textPrimary)
                                        .lineSpacing(5)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                } else {
                                    Text(transcription)
                                        .font(DesignSystem.body)
                                        .foregroundColor(DesignSystem.textSecondary.opacity(0.5))
                                        .lineSpacing(5)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            .frame(maxHeight: 150)

                            // Undo/Redo Buttons
                            if aiStoryText != nil {
                                HStack(spacing: 20) {
                                    // Undo Button
                                    Button(action: undo) {
                                        Text("↶")
                                            .font(.system(size: 40))
                                            .foregroundColor(canUndo ? DesignSystem.amber : Color.gray)
                                            .frame(width: 80, height: 80)
                                            .background(
                                                RoundedRectangle(cornerRadius: 12)
                                                    .fill(canUndo ? DesignSystem.warmCardGradient : DesignSystem.whiteSubtleGradient)
                                            )
                                            .shadow(color: canUndo ? DesignSystem.amberGlow : Color.clear, radius: 6, y: 3)
                                    }
                                    .disabled(!canUndo)
                                    .accessibilityLabel("Undo")

                                    // Redo Button
                                    Button(action: redo) {
                                        Text("↷")
                                            .font(.system(size: 40))
                                            .foregroundColor(canRedo ? DesignSystem.amber : Color.gray)
                                            .frame(width: 80, height: 80)
                                            .background(
                                                RoundedRectangle(cornerRadius: 12)
                                                    .fill(canRedo ? DesignSystem.warmCardGradient : DesignSystem.whiteSubtleGradient)
                                            )
                                            .shadow(color: canRedo ? DesignSystem.amberGlow : Color.clear, radius: 6, y: 3)
                                    }
                                    .disabled(!canRedo)
                                    .accessibilityLabel("Redo")

                                    Spacer()
                                }
                            }
                        }
                        .padding(20)
                        .background(
                            RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                .fill(DesignSystem.warmCardGradient)
                        )
                        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)

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
                                .background(
                                    RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                        .fill(DesignSystem.whiteSubtleGradient)
                                )
                                .shadow(color: DesignSystem.amberGlow.opacity(0.3), radius: 4, y: 2)
                                .accessibilityIdentifier("storyTitleTextField")
                                .onAppear {
                                    // AI-recommended title from transcription
                                    if storyTitle.isEmpty && !transcription.isEmpty {
                                        let cleanedTranscription = transcription.trimmingCharacters(in: .whitespacesAndNewlines)
                                        if cleanedTranscription.count > 30 {
                                            storyTitle = String(cleanedTranscription.prefix(30)) + "..."
                                        } else {
                                            storyTitle = cleanedTranscription
                                        }
                                    }
                                }

                            // Story selection (if stories exist)
                            if !dataManager.stories.isEmpty {
                                Menu {
                                    ForEach(dataManager.stories) { story in
                                        Button("\(story.emoji) \(story.title)") {
                                            selectedStory = story
                                        }
                                    }
                                } label: {
                                    HStack {
                                        if let selected = selectedStory {
                                            Text("\(selected.emoji) \(selected.title)")
                                                .foregroundColor(DesignSystem.textPrimary)
                                        } else {
                                            Text("Select a story (optional)")
                                                .foregroundColor(DesignSystem.textSecondary)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.down")
                                            .foregroundColor(DesignSystem.textSecondary)
                                    }
                                    .font(DesignSystem.body)
                                    .padding()
                                    .frame(height: 55)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(DesignSystem.whiteSubtleGradient)
                                    )
                                    .shadow(color: DesignSystem.amberGlow.opacity(0.3), radius: 4, y: 2)
                                }
                            }

                            // Create new story button
                            Button(action: { showingCreateStory = true }) {
                                HStack {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.title3)
                                    Text("Create New Story")
                                        .font(DesignSystem.body)
                                }
                                .foregroundColor(DesignSystem.deepNavy)
                                .frame(maxWidth: .infinity)
                                .frame(height: 55)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(DesignSystem.whiteSubtleGradient)
                                )
                                .shadow(color: DesignSystem.deepNavy.opacity(0.2), radius: 6, y: 3)
                            }
                        }

                        // AI Interviewer - Follow-up Questions
                        if isGeneratingQuestions {
                            VStack(spacing: 10) {
                                ProgressView()
                                    .scaleEffect(1.2)
                                Text("🤔 Thinking of follow-up questions...")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .fill(DesignSystem.warmCardGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        } else if !followUpQuestions.isEmpty {
                            VStack(alignment: .leading, spacing: 15) {
                                HStack {
                                    Image(systemName: "bubble.left.and.bubble.right.fill")
                                        .foregroundColor(.purple)
                                    Text("Tell me more...")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                ForEach(Array(followUpQuestions.enumerated()), id: \.offset) { index, question in
                                    Button(action: {
                                        // TODO: Continue recording with this question
                                        print("Tapped question: \(question)")
                                    }) {
                                        HStack(spacing: 12) {
                                            Text("\(index + 1)")
                                                .font(DesignSystem.body)
                                                .foregroundColor(.white)
                                                .frame(width: 30, height: 30)
                                                .background(.purple)
                                                .cornerRadius(15)

                                            Text(question)
                                                .font(DesignSystem.body)
                                                .foregroundColor(DesignSystem.textPrimary)
                                                .multilineTextAlignment(.leading)
                                                .frame(maxWidth: .infinity, alignment: .leading)

                                            Image(systemName: "mic.circle.fill")
                                                .font(.title2)
                                                .foregroundColor(.purple)
                                        }
                                        .padding()
                                        .background(
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(
                                                    LinearGradient(
                                                        colors: [Color.purple.opacity(0.1), Color.purple.opacity(0.15)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                        )
                                        .shadow(color: Color.purple.opacity(0.2), radius: 6, y: 3)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }

                                Text("💡 Tap a question to record more details")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary.opacity(0.7))
                                    .italic()
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .fill(DesignSystem.warmCardGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        }

                        // AI Extraction Status
                        if isExtracting {
                            VStack(spacing: 10) {
                                ProgressView()
                                    .scaleEffect(1.2)
                                Text("AI is analyzing your story...")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .fill(DesignSystem.warmCardGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        }

                        // Discovered Information Preview
                        if let entities = extractedEntities, !discoveredFields.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .foregroundColor(.orange)
                                    Text("AI Discovered")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                ForEach(discoveredFields, id: \.self) { field in
                                    HStack {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                        Text(field)
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textPrimary)
                                    }
                                }

                                if !entities.themes.isEmpty {
                                    HStack {
                                        Text("Themes:")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                        ForEach(entities.themes.prefix(3), id: \.self) { theme in
                                            Text(theme)
                                                .font(DesignSystem.caption)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .fill(DesignSystem.sunshine)
                                                )
                                                .shadow(color: DesignSystem.sunshine.opacity(0.3), radius: 4, y: 2)
                                        }
                                    }
                                }
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.green.opacity(0.08), Color.green.opacity(0.12)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                            )
                            .shadow(color: Color.green.opacity(0.2), radius: 8, y: 4)
                        }

                        // Action Buttons
                        VStack(spacing: 15) {
                            Button(action: saveStory) {
                                Text(isExtracting ? "Analyzing..." : "Save This Memory")
                                    .font(DesignSystem.buttonText)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: DesignSystem.primaryButtonHeight)
                                    .background(
                                        RoundedRectangle(cornerRadius: DesignSystem.cornerRadius)
                                            .fill((isExtracting || !canSave) ? Color.gray : DesignSystem.deepNavy)
                                    )
                                    .shadow(color: (isExtracting || !canSave) ? Color.clear : DesignSystem.deepNavy.opacity(0.3), radius: 8, y: 4)
                            }
                            .disabled(isExtracting || !canSave)
                            .accessibilityIdentifier("saveMemoryButton")

                            Button(action: {
                                dismiss()
                            }) {
                                Text("Record Another")
                                    .font(DesignSystem.body)
                                    .foregroundColor(DesignSystem.deepNavy)
                            }
                            .accessibilityIdentifier("recordAnotherButton")
                        }
                        .padding(.bottom, 30)
                    }
                    .padding(.horizontal, DesignSystem.largePadding)
                }
                .scrollDismissesKeyboard(.interactively)
            }

            // Success overlay
            if showingSaveSuccess {
                SaveSuccessOverlay()
                    .transition(.scale.combined(with: .opacity))
                    .zIndex(1)
            }
        }
        .alert("Title Required", isPresented: $showingValidationAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Please give your memory a title before saving.")
        }
        .sheet(isPresented: $showingCreateStory) {
            CreateStorySheet(stories: $dataManager.stories) { newStory in
                dataManager.saveStory(newStory)
                selectedStory = newStory
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Button("Cancel") {
                    hideKeyboard()
                }
                .foregroundColor(DesignSystem.textSecondary)

                Spacer()

                Button("Save Memory") {
                    hideKeyboard()
                    if canSave {
                        saveStory()
                    }
                }
                .font(.headline)
                .foregroundColor(canSave ? DesignSystem.deepNavy : .gray)
                .disabled(!canSave)
            }
        }
        .task {
            // Generate AI enhancement on appear
            if aiStoryText == nil && !transcription.isEmpty {
                await generateAIEnhancement()
            }

            // Generate follow-up questions
            await generateFollowUpQuestions()
        }
        .onAppear {
            startAIExtraction()
        }
    }
    
    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
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
                    audioPlayer?.delegate = nil
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
        guard let player = audioPlayer, duration > 0 else { return }

        currentWord = 0
        let wordsPerSecond = Double(words.count) / duration

        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            if isPlaying, let currentTime = self.audioPlayer?.currentTime {
                // Calculate which word should be highlighted based on actual playback time
                let expectedWord = Int(currentTime * wordsPerSecond)
                if expectedWord < words.count {
                    self.currentWord = expectedWord
                } else {
                    self.currentWord = words.count - 1
                }
            } else {
                timer.invalidate()
                self.currentWord = 0
                self.isPlaying = false
            }
        }
    }
    
    func startAIExtraction() {
        guard !transcription.isEmpty else { return }

        isExtracting = true

        Task {
            do {
                let entities = try await extractor.extractEntities(from: transcription)

                await MainActor.run {
                    extractedEntities = entities
                    isExtracting = false

                    // Auto-set category from AI suggestion
                    if selectedCategory == nil {
                        selectedCategory = entities.suggestedCategory
                    }

                    // Auto-populate profile if genealogy info found
                    if entities.hasGenealogyInfo, let profile = profileManager.profileInfo {
                        let updated = populator.updateProfile(
                            with: entities,
                            profile: profile,
                            context: profileManager.coreDataManager.context
                        )
                        discoveredFields = updated

                        if !updated.isEmpty {
                            print("[RecordingComplete] Discovered: \(updated.joined(separator: ", "))")
                        }
                    }
                }
            } catch {
                await MainActor.run {
                    isExtracting = false
                    print("[RecordingComplete] Extraction error: \(error.localizedDescription)")
                    // Continue without extraction - user can still save
                }
            }
        }
    }

    // MARK: - AI Enhancement

    func generateAIEnhancement() async {
        isGeneratingAI = true

        do {
            let enhanced = try await aiGenerator.enhanceStory(from: transcription)

            await MainActor.run {
                // Create version history: [0: original, 1: AI enhanced]
                let originalVersion = aiGenerator.createVersion(from: transcription)
                let aiVersion = aiGenerator.createVersion(from: enhanced)

                undoStack = [originalVersion, aiVersion]
                currentVersionIndex = 1  // Currently showing AI version
                redoStack = []
                aiStoryText = enhanced
                isGeneratingAI = false

                print("[RecordingComplete] AI enhancement complete - undo available")
            }
        } catch {
            await MainActor.run {
                isGeneratingAI = false
                // Fallback to original transcription
                let originalVersion = aiGenerator.createVersion(from: transcription)
                undoStack = [originalVersion]
                currentVersionIndex = 0
                redoStack = []
                aiStoryText = transcription

                print("[RecordingComplete] AI enhancement error: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - AI Interviewer - Follow-up Questions

    func generateFollowUpQuestions() async {
        guard !transcription.isEmpty else { return }

        isGeneratingQuestions = true

        do {
            let questions = try await aiInterviewer.generateFollowUpQuestions(from: transcription)

            await MainActor.run {
                followUpQuestions = questions
                isGeneratingQuestions = false
                print("[RecordingComplete] Generated \(questions.count) follow-up questions")
            }

            // Hugh reads the first follow-up question
            if let firstQuestion = questions.first {
                await hughVoice.askQuestion(firstQuestion)
            }
        } catch {
            await MainActor.run {
                isGeneratingQuestions = false
                followUpQuestions = []
                print("[RecordingComplete] Follow-up questions error: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Undo/Redo Logic

    var canUndo: Bool {
        currentVersionIndex > 0
    }

    var canRedo: Bool {
        !redoStack.isEmpty
    }

    func undo() {
        guard currentVersionIndex > 0 else { return }

        if let currentText = aiStoryText {
            let currentVersion = aiGenerator.createVersion(from: currentText)
            redoStack.append(currentVersion)
        }

        currentVersionIndex -= 1
        aiStoryText = undoStack[currentVersionIndex].text

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }

    func redo() {
        guard !redoStack.isEmpty else { return }

        let version = redoStack.removeLast()
        currentVersionIndex += 1

        if currentVersionIndex >= undoStack.count {
            undoStack.append(version)
        }

        aiStoryText = version.text

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }

    // MARK: - Save Story

    func saveStory() {
        // Validate we have content to save
        guard !transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            print("[RecordingCompleteView] Cannot save - empty transcription")
            return
        }

        // Validate title is not empty
        guard !storyTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            showingValidationAlert = true
            return
        }

        let finalTitle = storyTitle.trimmingCharacters(in: .whitespacesAndNewlines)

        // Use AI-suggested category if not manually selected
        let finalCategory = selectedCategory ?? extractedEntities?.suggestedCategory

        // Save to database with AI enhanced version and edit history
        dataManager.saveRecording(
            title: finalTitle,
            transcription: transcription,
            aiStoryText: aiStoryText,
            editHistory: undoStack.isEmpty ? nil : undoStack,
            duration: duration,
            audioURL: audioURL,
            category: finalCategory,
            storyId: selectedStory?.id
        )

        // Update story's recording list if story was selected, OR auto-create new story
        if var story = selectedStory {
            // Get the saved recording ID (last one added)
            if let lastRecording = dataManager.savedRecordings.first {
                story.recordingIds.append(lastRecording.id)
                dataManager.updateStory(story)
            }
        } else {
            // AUTO-CREATE NEW STORY when none selected
            if let lastRecording = dataManager.savedRecordings.first {
                let newStory = Story(
                    title: finalTitle,
                    emoji: "📖",
                    category: finalCategory ?? "General",
                    recordingIds: [lastRecording.id]
                )
                dataManager.saveStory(newStory)
                selectedStory = newStory
                print("[RecordingComplete] Auto-created story: \(finalTitle)")
            }
        }

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()

        withAnimation(.spring()) {
            showingSaveSuccess = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            dismiss()
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
            .background(DesignSystem.deepNavy)
            .cornerRadius(DesignSystem.cornerRadius)
        }
    }
}

// MARK: - Preview
struct RecordingCompleteView_Previews: PreviewProvider {
    static var previews: some View {
        RecordingCompleteView(transcription: "Today I want to tell you about when I was young, we used to play marbles in the schoolyard. It was such a simple game, but we had so much fun.")
    }
}
