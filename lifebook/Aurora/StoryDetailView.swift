import SwiftUI

struct StoryDetailView: View {
    let story: Story
    @StateObject private var dataManager = RecordingDataManager.shared
    @Environment(\.dismiss) var dismiss
    @State private var showingTemporalSheet = false

    var recordings: [SavedRecording] {
        story.getRecordings(from: dataManager)
    }

    var totalWords: Int {
        recordings.reduce(0) { $0 + $1.wordCount }
    }

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button("← Stories") {
                        dismiss()
                    }
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.amber)

                    Spacer()
                }
                .padding()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Story header
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(story.emoji)
                                    .font(.system(size: 50))
                                Text(story.title)
                                    .font(DesignSystem.largeTitle)
                                    .foregroundColor(DesignSystem.textPrimary)
                            }

                            Text("\(recordings.count) recordings • \(totalWords) words")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                        }
                        .padding(.horizontal, DesignSystem.largePadding)

                        // Recordings
                        ForEach(recordings) { recording in
                            RecordingCardCompact(recording: recording)
                                .padding(.horizontal, DesignSystem.largePadding)
                        }

                        // Temporal Enhancement Button
                        Button(action: { showingTemporalSheet = true }) {
                            HStack(spacing: 8) {
                                Image(systemName: "clock.arrow.circlepath")
                                Text("Add Era Context")
                            }
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.amber)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(DesignSystem.sunshine.opacity(0.2))
                            )
                        }
                        .padding(.horizontal, DesignSystem.largePadding)
                        .padding(.top, 10)

                        // Bottom padding
                        Color.clear.frame(height: 100)
                    }
                    .padding(.top, 20)
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingTemporalSheet) {
            TemporalContextSheet(story: story) { enhancement in
                // Enhancement applied successfully
                // Aurora stores enhancements in recordings, not Story model
                // The enhancement is available in TemporalContextService.shared.lastEnhancement
                showingTemporalSheet = false
            }
        }
    }
}

struct RecordingCardCompact: View {
    let recording: SavedRecording

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(recording.title)
                .font(DesignSystem.body)
                .foregroundColor(DesignSystem.textPrimary)

            HStack {
                Text(recording.formattedDate)
                Text("•")
                Text(recording.formattedDuration)
                Text("•")
                Text("\(recording.wordCount)w")
            }
            .font(DesignSystem.caption)
            .foregroundColor(DesignSystem.textSecondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(DesignSystem.warmCardGradient)
        )
        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
    }
}
