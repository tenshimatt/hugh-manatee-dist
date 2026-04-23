import SwiftUI

// MARK: - Story Detail View
struct StoryDetailView: View {
    let story: Story
    @State private var isPlaying = false
    @State private var currentRecording = 0
    @State private var recordings = [
        Recording(sessionNumber: 1, date: Date().addingTimeInterval(-86400 * 5), duration: 1200, transcript: "When I was about seven years old, we lived in a small house on Maple Street..."),
        Recording(sessionNumber: 2, date: Date().addingTimeInterval(-86400 * 4), duration: 900, transcript: "The best part about childhood was the freedom we had to explore..."),
        Recording(sessionNumber: 3, date: Date().addingTimeInterval(-86400 * 2), duration: 1500, transcript: "My mother would always make the most amazing apple pie on Sundays..."),
        Recording(sessionNumber: 4, date: Date(), duration: 600, transcript: "I remember the old oak tree in our backyard where we built a treehouse...")
    ]
    
    var totalDuration: String {
        let total = recordings.reduce(0) { $0 + $1.duration }
        let minutes = total / 60
        return "\(minutes) min"
    }
    
    var totalWords: Int {
        recordings.reduce(0) { $0 + $1.transcript.split(separator: " ").count }
    }
    
    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 15) {
                    Text(story.emoji)
                        .font(.system(size: 60))
                    
                    Text(story.title)
                        .font(DesignSystem.largeTitle)
                        .foregroundColor(DesignSystem.textPrimary)
                    
                    // Status Badge
                    Text("Draft")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.primaryTeal)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 5)
                        .background(DesignSystem.primaryTeal.opacity(0.1))
                        .cornerRadius(10)
                }
                .padding(.top, 20)
                
                // Action Buttons
                HStack(spacing: 20) {
                    Button(action: playAll) {
                        VStack(spacing: 8) {
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 50))
                            Text("Play Story")
                                .font(DesignSystem.body)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(DesignSystem.primaryTeal)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                    }
                    
                    Button(action: {}) {
                        VStack(spacing: 8) {
                            Image(systemName: "mic.circle.fill")
                                .font(.system(size: 50))
                            Text("Add Recording")
                                .font(DesignSystem.body)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(DesignSystem.recordRed)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                    }
                }
                .padding(.horizontal, DesignSystem.largePadding)
                .padding(.top, 20)
                
                // Stats
                HStack(spacing: 30) {
                    StatsItem(icon: "calendar", label: "Created", value: "5 days ago")
                    StatsItem(icon: "waveform", label: "Recordings", value: "\(recordings.count) total")
                    StatsItem(icon: "clock", label: "Duration", value: totalDuration)
                }
                .padding(.vertical, 20)
                
                // Additional Stats
                HStack(spacing: 30) {
                    StatsItem(icon: "text.alignleft", label: "Words", value: "\(totalWords)")
                    StatsItem(icon: "book", label: "Reading Time", value: "3 min")
                }
                .padding(.bottom, 20)
                
                Divider()
                    .padding(.horizontal, DesignSystem.largePadding)
                
                // Recordings List
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Recordings")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)
                            .padding(.horizontal, DesignSystem.largePadding)
                            .padding(.top, 20)
                        
                        ForEach(recordings) { recording in
                            RecordingRow(recording: recording, isPlaying: false)
                                .padding(.horizontal, DesignSystem.largePadding)
                        }
                        
                        // Bottom padding
                        Color.clear.frame(height: 100)
                    }
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }
    
    func playAll() {
        isPlaying.toggle()
        // Play all recordings
    }
}

// MARK: - Recording Model
struct Recording: Identifiable {
    let id = UUID()
    let sessionNumber: Int
    let date: Date
    let duration: Int // seconds
    let transcript: String
    
    var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }
    
    var durationString: String {
        let minutes = duration / 60
        let seconds = duration % 60
        if minutes > 0 {
            return String(format: "%02d:%02d", minutes, seconds)
        } else {
            return "\(seconds)s"
        }
    }
}

// MARK: - Recording Row
struct RecordingRow: View {
    let recording: Recording
    let isPlaying: Bool
    @State private var showTranscript = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Play button and waveform icon
                HStack(spacing: 12) {
                    Button(action: {}) {
                        Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.title2)
                            .foregroundColor(DesignSystem.primaryTeal)
                    }
                    
                    Image(systemName: "waveform")
                        .font(.body)
                        .foregroundColor(Color.orange)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Session \(recording.sessionNumber)")
                        .font(DesignSystem.body.weight(.semibold))
                        .foregroundColor(DesignSystem.textPrimary)
                    
                    Text(recording.formattedDate)
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }
                
                Spacer()
                
                Text(recording.durationString)
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
            }
            
            // Transcript preview
            if showTranscript {
                Text(recording.transcript)
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)
                    .lineLimit(3)
                    .padding(.top, 5)
            }
            
            Button(action: { showTranscript.toggle() }) {
                Text(showTranscript ? "Hide transcript" : "Show transcript")
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.primaryTeal)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }
}

// MARK: - Stats Item
struct StatsItem: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: 5) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(DesignSystem.primaryTeal)
            Text(label)
                .font(DesignSystem.caption)
                .foregroundColor(DesignSystem.textSecondary)
            Text(value)
                .font(DesignSystem.body.weight(.semibold))
                .foregroundColor(DesignSystem.textPrimary)
        }
    }
}

// MARK: - Preview
struct StoryDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            StoryDetailView(
                story: Story(
                    title: "My Childhood",
                    recordings: 12,
                    duration: 8100,
                    words: 2340,
                    emoji: "🧸"
                )
            )
        }
    }
}
