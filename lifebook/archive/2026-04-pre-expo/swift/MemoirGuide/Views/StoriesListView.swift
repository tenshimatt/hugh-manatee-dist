import SwiftUI
import CoreData

// MARK: - Stories List View
struct StoriesListView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var coreDataManager: CoreDataManager
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \MemoirSessionEntity.createdAt, ascending: false)],
        animation: .default
    ) private var sessions: FetchedResults<MemoirSessionEntity>

    @State private var selectedTab = 0

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header with toggle
                VStack(spacing: 20) {
                    Text("Your Memory Vault")
                        .font(DesignSystem.largeTitle)
                        .foregroundColor(DesignSystem.textPrimary)
                        .accessibilityIdentifier("memoryVaultTitle")

                    // Tab Selector
                    HStack(spacing: 0) {
                        Button(action: { selectedTab = 0 }) {
                            HStack {
                                Image(systemName: "book.fill")
                                Text("My Stories")
                            }
                            .font(DesignSystem.body)
                            .foregroundColor(selectedTab == 0 ? .white : DesignSystem.textSecondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(selectedTab == 0 ? DesignSystem.sunshine : Color.clear)
                        }

                        Button(action: { selectedTab = 1 }) {
                            HStack {
                                Image(systemName: "archivebox.fill")
                                Text("Vault")
                            }
                            .font(DesignSystem.body)
                            .foregroundColor(selectedTab == 1 ? .white : DesignSystem.textSecondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(selectedTab == 1 ? DesignSystem.sunshine : Color.clear)
                        }
                    }
                    .background(Color.white)
                    .cornerRadius(DesignSystem.cardCornerRadius)
                    .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                    .padding(.horizontal, DesignSystem.largePadding)
                }
                .padding(.top, 20)
                .padding(.bottom, 10)

                // Content based on selected tab
                ScrollView {
                    VStack(spacing: 15) {
                        if sessions.isEmpty {
                            // Empty state
                            VStack(spacing: 15) {
                                Image(systemName: selectedTab == 0 ? "book.closed.fill" : "archivebox.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(DesignSystem.textSecondary.opacity(0.5))
                                Text("No recordings yet")
                                    .font(DesignSystem.title)
                                    .foregroundColor(DesignSystem.textSecondary)
                                Text("Start recording your memories!")
                                    .font(DesignSystem.body)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }
                            .padding(.top, 60)
                        } else {
                            ForEach(sessions, id: \.id) { session in
                                SessionCard(session: session)
                                    .padding(.horizontal, DesignSystem.largePadding)
                            }
                        }

                        // Bottom padding
                        Color.clear.frame(height: 100)
                    }
                    .padding(.top, 10)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: Button(action: { dismiss() }) {
            HStack(spacing: 8) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20, weight: .medium))
                Text("Back")
                    .font(DesignSystem.body)
            }
            .foregroundColor(DesignSystem.sunshine)
        })
    }
}

// MARK: - Session Card Component
struct SessionCard: View {
    @ObservedObject var session: MemoirSessionEntity
    @State private var showingDetail = false
    @State private var isPlaying = false

    var emoji: String {
        // Assign emoji based on word count or session number
        let emojis = ["📖", "🎤", "💭", "✨", "🌟", "💫", "🎯", "🎨", "🎭", "🎪"]
        return emojis[Int(session.sessionNumber) % emojis.count]
    }

    var title: String {
        // Get first segment's transcription as title
        if let firstSegment = session.segmentsArray.first,
           let transcription = firstSegment.transcription {
            let cleaned = transcription.trimmingCharacters(in: .whitespacesAndNewlines)
            return cleaned.count > 50 ? String(cleaned.prefix(50)) + "..." : cleaned
        }
        return "Memory #\(session.sessionNumber)"
    }

    var body: some View {
        Button(action: { showingDetail = true }) {
            HStack(spacing: 15) {
                // Emoji Icon
                Text(emoji)
                    .font(.system(size: 40))
                    .frame(width: 60, height: 60)
                    .background(DesignSystem.sunshine.opacity(0.1))
                    .cornerRadius(12)

                // Info
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textPrimary)
                        .lineLimit(2)

                    HStack(spacing: 15) {
                        Label("\(session.segmentsArray.count)", systemImage: "mic.fill")
                        Label("\(session.totalWordCount) words", systemImage: "text.alignleft")
                        if let date = session.createdAt {
                            Label(formatDate(date), systemImage: "calendar")
                        }
                    }
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                }

                Spacer()

                // Play button
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 35))
                    .foregroundColor(DesignSystem.sunshine)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(DesignSystem.cardCornerRadius)
            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showingDetail) {
            SessionDetailView(session: session)
        }
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }
}

// MARK: - Session Detail View
struct SessionDetailView: View {
    @ObservedObject var session: MemoirSessionEntity
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var coreDataManager: CoreDataManager
    @State private var showingDeleteAlert = false
    @State private var showingFinalDeleteAlert = false

    var fullTranscription: String {
        session.segmentsArray
            .compactMap { $0.transcription }
            .joined(separator: "\n\n")
    }

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button("Close") {
                        dismiss()
                    }
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textSecondary)

                    Spacer()

                    Text("Memory Details")
                        .font(DesignSystem.title)
                        .foregroundColor(DesignSystem.textPrimary)

                    Spacer()

                    Button(action: { showingDeleteAlert = true }) {
                        Image(systemName: "trash")
                            .font(.title3)
                            .foregroundColor(.red)
                    }
                }
                .padding()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Stats
                        HStack(spacing: 20) {
                            StatBox(
                                title: "Segments",
                                value: "\(session.segmentsArray.count)",
                                icon: "mic.fill"
                            )
                            StatBox(
                                title: "Words",
                                value: "\(session.totalWordCount)",
                                icon: "text.alignleft"
                            )
                            if let date = session.createdAt {
                                StatBox(
                                    title: "Date",
                                    value: formatFullDate(date),
                                    icon: "calendar"
                                )
                            }
                        }

                        // Full Transcription
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Transcription")
                                .font(DesignSystem.buttonText)
                                .foregroundColor(DesignSystem.textPrimary)

                            Text(fullTranscription)
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textPrimary)
                                .lineSpacing(5)
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                    }
                    .padding(DesignSystem.largePadding)
                }
            }
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
                deleteSession()
            }
        } message: {
            Text("This action CANNOT be undone. Your memory will be permanently deleted forever.")
        }
    }

    func formatFullDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    func deleteSession() {
        coreDataManager.context.delete(session)
        do {
            try coreDataManager.save()
            dismiss()
        } catch {
            print("[SessionDetailView] Failed to delete: \(error)")
        }
    }
}

// MARK: - Stat Box Component
struct StatBox: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(DesignSystem.sunshine)

            Text(value)
                .font(DesignSystem.buttonText)
                .foregroundColor(DesignSystem.textPrimary)

            Text(title)
                .font(DesignSystem.caption)
                .foregroundColor(DesignSystem.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }
}

// MARK: - Preview
struct StoriesListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            StoriesListView()
                .environmentObject(CoreDataManager.shared)
        }
    }
}
