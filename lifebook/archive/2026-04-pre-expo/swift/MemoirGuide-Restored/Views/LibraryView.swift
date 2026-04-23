// LibraryView.swift
// Display vault (all recordings) and stories
// Designed for elderly users (65-100 years old) with clear cause-and-effect feedback

import SwiftUI
import CoreData

struct LibraryView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var coreDataManager: CoreDataManager
    @EnvironmentObject var audioPlayer: AudioPlaybackManager
    @Environment(\.managedObjectContext) var context

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \MemoirSegmentEntity.createdAt, ascending: false)],
        animation: .default)
    private var allSegments: FetchedResults<MemoirSegmentEntity>

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \ChapterEntity.chapterNumber, ascending: true)],
        animation: .default)
    private var chapters: FetchedResults<ChapterEntity>

    // Bug 6 fix: My Stories is default (0 = My Stories, 1 = Vault)
    @State private var selectedTab = 0
    @State private var showingCreateStory = false
    @State private var newStoryTitle = ""

    // Bug 2 fix: Tappable header that toggles
    @State private var headerState: HeaderState = .personal
    @State private var showHeaderTapFeedback = false

    enum HeaderState {
        case personal  // "My Memory Vault"
        case named     // "{Name}'s Memory Vault"

        func title(userName: String) -> String {
            switch self {
            case .personal: return "My Memory Vault"
            case .named: return "\(userName)'s Memory Vault"
            }
        }

        mutating func toggle() {
            self = (self == .personal) ? .named : .personal
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Bug 2 fix: Tappable header that toggles between states
                Button(action: toggleHeader) {
                    VStack(spacing: 4) {
                        Text(headerState.title(userName: getUserName()))
                            .font(.title2)
                            .foregroundColor(.charcoal)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .minimumScaleFactor(0.8)

                        // Visual feedback: Small indicator that it's tappable
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.left.arrow.right")
                                .font(.caption2)
                                .foregroundColor(.gray)
                            Text("Tap to switch")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        .opacity(showHeaderTapFeedback ? 1.0 : 0.4)
                        .animation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true), value: showHeaderTapFeedback)
                    }
                    .padding(.vertical, 12)
                    .padding(.horizontal, 20)
                    .frame(maxWidth: .infinity)
                    .background(Color.secondaryTheme.opacity(0.1))
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel("Library header. Currently showing: \(headerState.title(userName: getUserName())). Tap to toggle.")

                // Bug 3, 5, 6 fix: Bigger buttons, My Stories left, Vault right, no redundant labels
                HStack(spacing: 0) {
                    // My Stories button (left)
                    Button(action: {
                        selectTab(0)
                    }) {
                        VStack(spacing: 8) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 32))
                            Text("My Stories")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(selectedTab == 0 ? .white : .charcoal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(
                            selectedTab == 0
                                ? Color.secondaryTheme
                                : Color.secondaryTheme.opacity(0.2)
                        )
                    }
                    .accessibilityLabel("My Stories tab")
                    .accessibilityHint(selectedTab == 0 ? "Currently selected" : "Tap to view your stories")

                    // Vault button (right)
                    Button(action: {
                        selectTab(1)
                    }) {
                        VStack(spacing: 8) {
                            Image(systemName: "archivebox.fill")
                                .font(.system(size: 32))
                            Text("Vault")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(selectedTab == 1 ? .white : .charcoal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(
                            selectedTab == 1
                                ? Color.primaryTheme
                                : Color.primaryTheme.opacity(0.2)
                        )
                    }
                    .accessibilityLabel("Vault tab")
                    .accessibilityHint(selectedTab == 1 ? "Currently selected" : "Tap to view all recordings")
                }

                // Content area
                if selectedTab == 0 {
                    storiesView
                        .transition(.asymmetric(
                            insertion: .move(edge: .leading).combined(with: .opacity),
                            removal: .move(edge: .trailing).combined(with: .opacity)
                        ))
                } else {
                    vaultView
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                }
            }
            .navigationBarItems(
                leading: Button(action: {
                    provideHapticFeedback()
                    appState.currentView = .recording
                    announceNavigation("Returning to recording")
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Record")
                    }
                    .font(.body)
                    .foregroundColor(.primaryTheme)
                }
            )
            .sheet(isPresented: $showingCreateStory) {
                createStorySheet
            }
            .onAppear {
                // Start subtle animation to teach header is tappable
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    showHeaderTapFeedback = true
                }
            }
        }
    }

    // MARK: - Vault View
    private var vaultView: some View {
        ZStack {
            Color.primaryTheme.opacity(0.05).ignoresSafeArea()

            if allSegments.isEmpty {
                emptyVaultView
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(allSegments, id: \.id) { segment in
                            SegmentCard(segment: segment)
                                .padding(.horizontal)
                        }
                    }
                    .padding(.vertical, 16)
                }
            }
        }
    }

    private var emptyVaultView: some View {
        VStack(spacing: 20) {
            Image(systemName: "archivebox")
                .font(.system(size: 80))
                .foregroundColor(.primaryTheme.opacity(0.5))

            Text("Vault is Empty")
                .font(.title)
                .fontWeight(.semibold)
                .foregroundColor(.charcoal)

            Text("Start recording to save memories to your vault")
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            // Clear call-to-action
            Button(action: {
                provideHapticFeedback()
                appState.currentView = .recording
                announceNavigation("Opening recorder")
            }) {
                HStack(spacing: 12) {
                    Image(systemName: "mic.circle.fill")
                        .font(.title2)
                    Text("Start Recording")
                        .font(.title3)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 32)
                .padding(.vertical, 20)
                .background(Color.primaryTheme)
                .cornerRadius(16)
                .shadow(color: .primaryTheme.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .padding(.top, 20)
        }
        .padding()
    }

    // MARK: - Stories View
    private var storiesView: some View {
        ZStack {
            Color.secondaryTheme.opacity(0.05).ignoresSafeArea()

            if chapters.isEmpty {
                emptyStoriesView
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        // Bug 3 fix: Create button centered with "Create" on top, "New Story" below
                        Button(action: {
                            provideHapticFeedback()
                            showingCreateStory = true
                            announceNavigation("Opening create story form")
                        }) {
                            VStack(spacing: 8) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 28))

                                VStack(spacing: 4) {
                                    Text("Create")
                                        .font(.title3)
                                        .fontWeight(.semibold)
                                    Text("New Story")
                                        .font(.title3)
                                        .fontWeight(.semibold)
                                }
                            }
                            .foregroundColor(.secondaryTheme)
                            .frame(maxWidth: .infinity)
                            .frame(width: UIScreen.main.bounds.width * 0.85 * 0.85)  // 15% narrower than 85% width
                            .padding(.vertical, 20)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.secondaryTheme.opacity(0.15))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.secondaryTheme, lineWidth: 2)
                                    )
                            )
                            .shadow(color: .secondaryTheme.opacity(0.2), radius: 4, x: 0, y: 2)
                        }
                        .padding(.top, 16)
                        .accessibilityLabel("Create new story")
                        .accessibilityHint("Opens a form to create a new story")

                        // Story cards with play buttons
                        ForEach(chapters, id: \.id) { chapter in
                            StoryCard(chapter: chapter)
                                .padding(.horizontal)
                                .environmentObject(audioPlayer)
                                .environmentObject(appState)
                        }
                    }
                    .padding(.vertical)
                }
            }
        }
    }

    private var emptyStoriesView: some View {
        VStack(spacing: 40) {
            Spacer()

            Image(systemName: "book.closed")
                .font(.system(size: 80))
                .foregroundColor(.secondaryTheme)

            Text("No Stories Yet")
                .font(.title)
                .fontWeight(.semibold)
                .foregroundColor(.charcoal)

            // Elderly UX: Big, centered call-to-action
            Button(action: {
                provideHapticFeedback()
                showingCreateStory = true
                announceNavigation("Creating your first story")
            }) {
                VStack(spacing: 16) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.secondaryTheme)

                    Text("Create Your First Story")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.charcoal)
                }
                .padding(40)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.secondaryTheme.opacity(0.2))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.secondaryTheme, lineWidth: 3)
                        )
                )
                .shadow(color: .secondaryTheme.opacity(0.2), radius: 8, x: 0, y: 4)
            }
            .padding(.horizontal, 40)
            .accessibilityLabel("Create your first story")
            .accessibilityHint("Creates a new story to organize your recordings")

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Create Story Sheet
    private var createStorySheet: some View {
        NavigationView {
            VStack(spacing: 32) {
                Text("What would you like to call this story?")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .multilineTextAlignment(.center)
                    .padding(.top, 40)
                    .padding(.horizontal, 20)

                TextField("Story title (e.g. \"My Childhood\")", text: $newStoryTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(.title3)
                    .padding(.horizontal, 40)
                    .onChange(of: newStoryTitle) { _ in
                        // Visual feedback that typing is registered
                        provideHapticFeedback(.light)
                    }

                Button(action: {
                    provideHapticFeedback()
                    createStory()
                }) {
                    Text("Create Story")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                        .background(newStoryTitle.isEmpty ? Color.gray : Color.secondaryTheme)
                        .cornerRadius(16)
                        .shadow(color: newStoryTitle.isEmpty ? .clear : .secondaryTheme.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .disabled(newStoryTitle.isEmpty)
                .padding(.horizontal, 40)
                .accessibilityLabel(newStoryTitle.isEmpty ? "Create story button, disabled. Enter a title first." : "Create story button. Tap to create story named \(newStoryTitle)")

                Spacer()
            }
            .navigationTitle("New Story")
            .navigationBarItems(
                trailing: Button("Cancel") {
                    provideHapticFeedback()
                    showingCreateStory = false
                    newStoryTitle = ""
                    announceNavigation("Cancelled story creation")
                }
            )
        }
    }

    // MARK: - Helper Methods

    private func selectTab(_ tab: Int) {
        guard tab != selectedTab else { return }

        provideHapticFeedback(.medium)
        withAnimation(.easeInOut(duration: 0.3)) {
            selectedTab = tab
        }

        // Announce tab change for accessibility
        let tabName = tab == 0 ? "My Stories" : "Vault"
        announceNavigation("Switched to \(tabName)")
    }

    private func toggleHeader() {
        provideHapticFeedback(.light)
        withAnimation(.easeInOut(duration: 0.3)) {
            headerState.toggle()
        }
        announceNavigation("Switched to \(headerState.title(userName: getUserName()))")
    }

    private func getUserName() -> String {
        let userProfile = coreDataManager.getUserProfile()
        return userProfile?.name ?? "Matt"
    }

    private func createStory() {
        let userProfile = coreDataManager.getUserProfile()
        _ = coreDataManager.createChapter(title: newStoryTitle, userProfile: userProfile)

        do {
            try coreDataManager.save()
            showingCreateStory = false
            newStoryTitle = ""
            announceNavigation("Story created successfully")
        } catch {
            print("Failed to create story: \(error)")
            announceNavigation("Failed to create story")
        }
    }

    // Elderly UX: Haptic feedback for all interactions
    private func provideHapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }

    // Elderly UX: VoiceOver announcements for navigation
    private func announceNavigation(_ message: String) {
        UIAccessibility.post(notification: .announcement, argument: message)
    }
}

// MARK: - Segment Card
struct SegmentCard: View {
    let segment: MemoirSegmentEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "waveform")
                    .foregroundColor(.primaryTheme)
                    .font(.body)

                Text(segment.createdAt ?? Date(), style: .date)
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Text(segment.createdAt ?? Date(), style: .time)
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Spacer()

                Text("\(segment.wordCount) words")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }

            if let transcription = segment.transcription, !transcription.isEmpty {
                Text(transcription)
                    .font(.body)
                    .lineLimit(3)
                    .foregroundColor(.primary)
            } else {
                Text("Audio recording (no transcription)")
                    .font(.body)
                    .foregroundColor(.gray)
                    .italic()
            }

            HStack {
                Image(systemName: "clock")
                    .font(.caption)
                Text(formatDuration(segment.duration))
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Spacer()

                if segment.audioFileName != nil {
                    Image(systemName: "mic.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .gray.opacity(0.15), radius: 4, x: 0, y: 2)
    }

    private func formatDuration(_ duration: Double) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60

        if minutes > 0 {
            return String(format: "%d:%02d", minutes, seconds)
        } else {
            return String(format: "%ds", seconds)
        }
    }
}

// MARK: - Chapter Card (kept for potential future use)
struct ChapterCard: View {
    let chapter: ChapterEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Chapter header
            RoundedRectangle(cornerRadius: 10)
                .fill(LinearGradient(
                    colors: [Color(hex: "5B8BA0"), Color(hex: "4A7C59")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(height: 100)
                .overlay(
                    VStack {
                        Text("Story #\(chapter.chapterNumber)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))

                        Image(systemName: "book.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                    }
                )

            Text(chapter.title ?? "Untitled Story")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.primary)
                .lineLimit(2)

            HStack {
                Text("\(chapter.sessions?.count ?? 0) recordings")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)

                Spacer()

                Text("\(chapter.computedWordCount) words")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(15)
        .shadow(color: .gray.opacity(0.2), radius: 4, x: 0, y: 2)
    }
}
