import SwiftUI
import AVFoundation

// MARK: - Stories List View
struct StoriesListView: View {
    @StateObject private var dataManager = RecordingDataManager.shared
    @State private var selectedTab = 0
    @State private var selectedStory: Story? = nil
    @State private var showingStoryDetail = false
    @State private var showTreeView = false

    var allRecordings: [SavedRecording] {
        dataManager.savedRecordings
    }
    
    var body: some View {
        ZStack {
            DesignSystem.pageBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Tab Selector - Pill Style
                HStack(spacing: 16) {
                    // My Stories Tab
                    Button(action: { withAnimation(.easeInOut(duration: 0.2)) { selectedTab = 0 } }) {
                        HStack(spacing: 10) {
                            Image(systemName: "book.fill")
                                .font(.title2)
                            Text("My Stories")
                                .font(DesignSystem.buttonText)
                        }
                        .foregroundColor(selectedTab == 0 ? DesignSystem.deepNavy : DesignSystem.textSecondary)
                        .fontWeight(selectedTab == 0 ? .semibold : .regular)
                        .frame(maxWidth: .infinity)
                        .frame(height: DesignSystem.tabHeight)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(selectedTab == 0 ? DesignSystem.sunshine : Color.clear)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .accessibilityLabel("My Stories tab")
                    .accessibilityAddTraits(selectedTab == 0 ? [.isSelected] : [])

                    // Vault Tab
                    Button(action: { withAnimation(.easeInOut(duration: 0.2)) { selectedTab = 1 } }) {
                        HStack(spacing: 10) {
                            Image(systemName: "archivebox.fill")
                                .font(.title2)
                            Text("Vault")
                                .font(DesignSystem.buttonText)
                        }
                        .foregroundColor(selectedTab == 1 ? DesignSystem.deepNavy : DesignSystem.textSecondary)
                        .fontWeight(selectedTab == 1 ? .semibold : .regular)
                        .frame(maxWidth: .infinity)
                        .frame(height: DesignSystem.tabHeight)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(selectedTab == 1 ? DesignSystem.sunshine : Color.clear)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .accessibilityLabel("Vault tab")
                    .accessibilityAddTraits(selectedTab == 1 ? [.isSelected] : [])

                    // Tree view toggle (only show on Stories tab)
                    if selectedTab == 0 && !dataManager.stories.isEmpty {
                        Button(action: { showTreeView.toggle() }) {
                            Image(systemName: showTreeView ? "list.bullet" : "tree.fill")
                                .font(.title2)
                                .foregroundColor(showTreeView ? DesignSystem.deepNavy : DesignSystem.textSecondary)
                                .frame(width: 70, height: DesignSystem.tabHeight)
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(showTreeView ? DesignSystem.sunshine : Color.clear)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .background(DesignSystem.warmGray.opacity(0.3))

                    // Content Area (with bottom safe space built in)
                    if selectedTab == 0 {
                        // My Stories View - List or Tree
                        if showTreeView {
                            // Story Tree Visualization
                            StoryTreeView(dataManager: dataManager)
                        } else {
                            // Traditional List View
                            ScrollView {
                                VStack(spacing: DesignSystem.cardSpacing) {
                                    // Top padding
                                    Color.clear.frame(height: DesignSystem.scrollContentPadding)

                                    // Story Cards
                                    if dataManager.stories.isEmpty {
                                        // Empty state - Redesigned
                                        VStack(spacing: 15) {
                                            Image(systemName: "book.closed.fill")
                                                .font(.system(size: 80))
                                                .foregroundColor(DesignSystem.amber.opacity(0.4))
                                            Text("No stories yet")
                                                .font(DesignSystem.title)
                                                .foregroundColor(DesignSystem.textPrimary)
                                            Text("Create stories from your recordings!")
                                                .font(DesignSystem.body)
                                                .foregroundColor(DesignSystem.textSecondary)
                                                .multilineTextAlignment(.center)
                                                .lineSpacing(4)
                                        }
                                        .padding(48)
                                        .background(
                                            RoundedRectangle(cornerRadius: 24)
                                                .fill(DesignSystem.paleTeal)
                                        )
                                        .padding(.horizontal, 24)
                                        .padding(.top, 20)
                                    } else {
                                        ForEach(dataManager.stories) { story in
                                            StoryCard(story: story) {
                                                selectedStory = story
                                                showingStoryDetail = true
                                            }
                                            .padding(.horizontal, 24)
                                        }
                                    }

                                    // Bottom padding
                                    Color.clear.frame(height: DesignSystem.scrollContentPadding)
                                }
                            }
                        }
                    } else {
                        // Vault View - All recordings in timeline
                        ScrollView {
                            VStack(spacing: DesignSystem.cardSpacing) {
                                // Top padding
                                Color.clear.frame(height: DesignSystem.scrollContentPadding)

                                if allRecordings.isEmpty {
                                    // Empty state - Redesigned
                                    VStack(spacing: 15) {
                                        Image(systemName: "archivebox.fill")
                                            .font(.system(size: 80))
                                            .foregroundColor(DesignSystem.amber.opacity(0.4))
                                        Text("No recordings yet")
                                            .font(DesignSystem.title)
                                            .foregroundColor(DesignSystem.textPrimary)
                                        Text("Tap the record button to start!")
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .multilineTextAlignment(.center)
                                            .lineSpacing(4)
                                    }
                                    .padding(48)
                                    .background(
                                        RoundedRectangle(cornerRadius: 24)
                                            .fill(DesignSystem.paleTeal)
                                    )
                                    .padding(.horizontal, 24)
                                    .padding(.top, 20)
                                } else {
                                    ForEach(allRecordings) { recording in
                                        VaultRecordingCard(recording: recording)
                                            .padding(.horizontal, 24)
                                    }
                                }

                                // Bottom padding
                                Color.clear.frame(height: DesignSystem.scrollContentPadding)
                            }
                        }
                }
            }
        }
        .sheet(isPresented: $showingStoryDetail) {
            if let story = selectedStory {
                StoryDetailView(story: story)
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }
}

// MARK: - Story Card
struct StoryCard: View {
    let story: Story
    let onTap: () -> Void
    @StateObject private var dataManager = RecordingDataManager.shared

    var recordings: [SavedRecording] {
        story.getRecordings(from: dataManager)
    }

    var totalWords: Int {
        recordings.reduce(0) { $0 + $1.wordCount }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 15) {
                // Emoji Icon
                Text(story.emoji)
                    .font(.system(size: 44))
                    .frame(width: 64, height: 64)
                    .background(DesignSystem.warmGradientStart)
                    .cornerRadius(12)

                // Info
                VStack(alignment: .leading, spacing: 6) {
                    Text(story.title)
                        .font(DesignSystem.body.bold())
                        .foregroundColor(DesignSystem.textPrimary)
                        .lineLimit(2)

                    HStack(spacing: 15) {
                        Label("\(recordings.count)", systemImage: "mic.fill")
                        Label("\(totalWords) words", systemImage: "text.alignleft")
                    }
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                    .lineSpacing(2)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.title2)
                    .foregroundColor(DesignSystem.textSecondary.opacity(0.4))
            }
            .padding(DesignSystem.cardInternalPadding)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                    .fill(DesignSystem.warmCardGradient)
            )
            .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Back Button Component
struct BackButton: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        Button(action: { dismiss() }) {
            HStack(spacing: 5) {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
                Text("Back")
                    .font(DesignSystem.body)
            }
            .foregroundColor(DesignSystem.deepNavy)
        }
    }
}

// MARK: - Recording Card Component
struct RecordingCard: View {
    let recording: SavedRecording
    @State private var isPressed = false
    @State private var showingDetail = false

    var categoryEmoji: String {
        switch recording.category {
        case "Childhood": return "🧸"
        case "Family": return "💕"
        case "Career": return "💼"
        case "Travel": return "✈️"
        case "Relationships": return "❤️"
        case "Hobbies": return "🎨"
        case "Life Lessons": return "💡"
        case "Achievements": return "🏆"
        case "Challenges": return "💪"
        default: return "📖"
        }
    }

    var body: some View {
        HStack(spacing: 15) {
            // Category Emoji Icon
            Text(categoryEmoji)
                .font(.system(size: 40))
                .frame(width: 60, height: 60)
                .background(DesignSystem.warmGray)
                .cornerRadius(15)

            // Recording Info
            VStack(alignment: .leading, spacing: 5) {
                Text(recording.title)
                    .font(DesignSystem.buttonText)
                    .foregroundColor(DesignSystem.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 15) {
                    Label("\(recording.wordCount) words", systemImage: "text.alignleft")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)

                    Label(recording.formattedDuration, systemImage: "clock")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }
            }

            Spacer()

            // Play Button
            Image(systemName: "play.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(DesignSystem.amber)
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = false
                }
                showingDetail = true
            }
        }
        .sheet(isPresented: $showingDetail) {
            RecordingDetailView(recording: recording)
        }
    }
}

// MARK: - Vault Recording Card (Updated)
struct VaultRecordingCard: View {
    let recording: SavedRecording
    @StateObject private var dataManager = RecordingDataManager.shared
    @StateObject private var backgroundProcessor = BackgroundAIProcessor.shared
    @State private var showingEditSheet = false
    @State private var showingDetail = false
    @State private var editedTitle = ""
    @State private var editedCategory: String? = nil
    @State private var audioPlayer: AVAudioPlayer?
    @State private var isPlaying = false
    @State private var showingDeleteAlert = false
    @State private var showingFinalDeleteAlert = false

    var processingStatus: ProcessingStatus {
        backgroundProcessor.getStatus(recordingId: recording.id)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "waveform")
                    .font(.body)
                    .foregroundColor(DesignSystem.amber)

                Text(recording.formattedDate)
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)

                // AI Processing Status Indicator - Redesigned
                if processingStatus == .processing {
                    HStack(spacing: 4) {
                        ProgressView()
                            .scaleEffect(0.7)
                        Text("AI Enhancing...")
                            .font(DesignSystem.caption)
                            .foregroundColor(.orange)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(8)
                } else if processingStatus == .completed && recording.aiStoryText == nil {
                    // Just completed, show checkmark briefly
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                }

                Spacer()

                Text("\(recording.wordCount) words")
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
            }

            Text(recording.transcription)
                .font(DesignSystem.body)
                .foregroundColor(DesignSystem.textPrimary)
                .lineLimit(3)
                .lineSpacing(4)

            HStack(spacing: 16) {
                Label(recording.formattedDuration, systemImage: "clock")
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)

                Spacer()

                Button(action: togglePlayback) {
                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: DesignSystem.actionButtonSize))
                        .foregroundColor(DesignSystem.amber)
                }
                .accessibilityLabel(isPlaying ? "Pause recording" : "Play recording")

                Button(action: {
                    editedTitle = recording.title
                    editedCategory = recording.category
                    showingEditSheet = true
                }) {
                    Image(systemName: "pencil.circle.fill")
                        .font(.system(size: DesignSystem.actionButtonSize))
                        .foregroundColor(DesignSystem.deepNavy)
                }
                .accessibilityLabel("Edit recording")

                Button(action: {
                    showingDeleteAlert = true
                }) {
                    Image(systemName: "trash.circle.fill")
                        .font(.system(size: DesignSystem.actionButtonSize))
                        .foregroundColor(.red)
                }
                .accessibilityLabel("Delete recording")
            }
        }
        .padding(DesignSystem.cardInternalPadding)
        .background(
            RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                .fill(DesignSystem.warmCardGradient)
        )
        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
        .onTapGesture {
            showingDetail = true
        }
        .sheet(isPresented: $showingEditSheet) {
            EditRecordingSheet(
                recording: recording,
                title: $editedTitle,
                category: $editedCategory,
                onSave: {
                    dataManager.updateRecording(
                        recording,
                        title: editedTitle,
                        category: editedCategory
                    )
                    showingEditSheet = false
                }
            )
        }
        .sheet(isPresented: $showingDetail) {
            RecordingDetailView(recording: recording)
        }
        .alert("⚠️ Delete Precious Memory?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Continue", role: .destructive) {
                showingFinalDeleteAlert = true
            }
        } message: {
            Text("This memory is precious and contains your life story. Are you absolutely sure you want to delete it?")
        }
        .alert("🛑 Final Confirmation", isPresented: $showingFinalDeleteAlert) {
            Button("Keep Memory", role: .cancel) {}
            Button("Permanently Delete", role: .destructive) {
                dataManager.deleteRecording(recording)
            }
        } message: {
            Text("This action CANNOT be undone. Your memory will be permanently deleted forever.")
        }
    }

    func togglePlayback() {
        if isPlaying {
            audioPlayer?.pause()
            isPlaying = false
        } else {
            if audioPlayer == nil, let audioPath = recording.audioFilePath {
                // audioFilePath is already a full path, use it directly
                let audioURL = URL(fileURLWithPath: audioPath)

                // Configure audio session
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
                    try AVAudioSession.sharedInstance().setActive(true)
                } catch {
                    print("[VaultRecordingCard] Failed to configure audio session: \(error.localizedDescription)")
                    return
                }

                // Create and play audio
                do {
                    audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
                    audioPlayer?.prepareToPlay()
                    audioPlayer?.play()
                    isPlaying = true
                } catch {
                    print("[VaultRecordingCard] Failed to play audio: \(error.localizedDescription)")
                }
            } else {
                audioPlayer?.play()
                isPlaying = true
            }
        }
    }
}

// MARK: - Edit Recording Sheet
struct EditRecordingSheet: View {
    let recording: SavedRecording
    @Binding var title: String
    @Binding var category: String?
    let onSave: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Story Title") {
                    TextField("Enter title", text: $title)
                        .font(DesignSystem.body)
                }

                Section("Category") {
                    Picker("Category", selection: $category) {
                        Text("None").tag(String?.none)
                        ForEach(SavedRecording.categories, id: \.self) { cat in
                            Text(cat).tag(String?.some(cat))
                        }
                    }
                }

                Section("Recording Info") {
                    HStack {
                        Text("Date")
                        Spacer()
                        Text(recording.formattedDate)
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Duration")
                        Spacer()
                        Text(recording.formattedDuration)
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Words")
                        Spacer()
                        Text("\(recording.wordCount)")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Edit Recording")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }

                ToolbarItemGroup(placement: .keyboard) {
                    Button("Cancel") {
                        hideKeyboard()
                    }
                    .foregroundColor(DesignSystem.textSecondary)

                    Spacer()

                    Button("Save") {
                        hideKeyboard()
                        if !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            onSave()
                        }
                    }
                    .font(.headline)
                    .foregroundColor(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .gray : DesignSystem.deepNavy)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

// MARK: - Recording Detail View
struct RecordingDetailView: View {
    let recording: SavedRecording
    @Environment(\.dismiss) private var dismiss
    @State private var audioPlayer: AVAudioPlayer?
    @State private var isPlaying = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Title
                    Text(recording.title)
                        .font(.largeTitle.bold())
                        .foregroundColor(DesignSystem.textPrimary)

                    // Info Row
                    HStack(spacing: 20) {
                        Label(recording.formattedDate, systemImage: "calendar")
                        Label(recording.formattedDuration, systemImage: "clock")
                        Label("\(recording.wordCount) words", systemImage: "text.alignleft")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)

                    // Category
                    if let category = recording.category {
                        HStack {
                            Image(systemName: "tag.fill")
                            Text(category)
                        }
                        .font(.subheadline)
                        .foregroundColor(DesignSystem.deepNavy)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(DesignSystem.sunshine.opacity(0.2))
                        .cornerRadius(8)
                    }

                    Color.clear.frame(height: 24)

                    // Transcription
                    Text(recording.transcription)
                        .font(.body)
                        .foregroundColor(DesignSystem.textPrimary)
                        .lineSpacing(8)

                    // Audio Player
                    if recording.audioFilePath != nil {
                        Color.clear.frame(height: 24)

                        HStack {
                            Button(action: togglePlayback) {
                                HStack {
                                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                        .font(.largeTitle)
                                    Text(isPlaying ? "Pause" : "Play Recording")
                                        .font(.headline)
                                }
                                .foregroundColor(DesignSystem.amber)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }

    func togglePlayback() {
        if isPlaying {
            audioPlayer?.pause()
            isPlaying = false
        } else {
            if audioPlayer == nil, let audioPath = recording.audioFilePath {
                // audioFilePath is already a full path, use it directly
                let audioURL = URL(fileURLWithPath: audioPath)

                // Configure audio session
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
                    try AVAudioSession.sharedInstance().setActive(true)
                } catch {
                    print("[RecordingDetailView] Failed to configure audio session: \(error.localizedDescription)")
                    return
                }

                // Create and play audio
                do {
                    audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
                    audioPlayer?.prepareToPlay()
                    audioPlayer?.play()
                    isPlaying = true
                } catch {
                    print("[RecordingDetailView] Failed to play audio: \(error.localizedDescription)")
                }
            } else {
                audioPlayer?.play()
                isPlaying = true
            }
        }
    }
}

// MARK: - Preview
struct StoriesListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            StoriesListView()
        }
    }
}
