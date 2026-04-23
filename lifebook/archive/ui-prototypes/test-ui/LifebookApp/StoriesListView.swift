import SwiftUI

// MARK: - Stories List View
struct StoriesListView: View {
    @State private var selectedTab = 0
    @State private var stories = [
        Story(title: "My Childhood", recordings: 12, duration: 8100, words: 2340, emoji: "🧸"),
        Story(title: "Meeting Your Grandma", recordings: 8, duration: 5400, words: 1560, emoji: "💕"),
        Story(title: "Our First Home", recordings: 5, duration: 2700, words: 845, emoji: "🏠"),
        Story(title: "My Career", recordings: 15, duration: 10800, words: 3200, emoji: "💼"),
        Story(title: "Family Vacations", recordings: 7, duration: 4200, words: 1230, emoji: "✈️")
    ]
    
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
                            .background(selectedTab == 0 ? DesignSystem.primaryTeal : Color.clear)
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
                            .background(selectedTab == 1 ? DesignSystem.primaryTeal : Color.clear)
                        }
                    }
                    .background(Color.white)
                    .cornerRadius(DesignSystem.cardCornerRadius)
                    .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                    .padding(.horizontal, DesignSystem.largePadding)
                }
                .padding(.top, 20)
                .padding(.bottom, 10)
                
                if selectedTab == 0 {
                    // My Stories View
                    ScrollView {
                        VStack(spacing: 15) {
                            // Create New Story Button
                            Button(action: {}) {
                                HStack {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.title2)
                                    Text("Create New Story")
                                        .font(DesignSystem.buttonText)
                                }
                                .foregroundColor(DesignSystem.primaryTeal)
                                .frame(maxWidth: .infinity)
                                .frame(height: 70)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [5]))
                                        .foregroundColor(DesignSystem.primaryTeal)
                                )
                                .cornerRadius(DesignSystem.cardCornerRadius)
                            }
                            .padding(.horizontal, DesignSystem.largePadding)
                            .padding(.top, 10)
                            
                            // Story Cards
                            ForEach(stories) { story in
                                NavigationLink(destination: StoryDetailView(story: story)) {
                                    StoryCard(story: story)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                            .padding(.horizontal, DesignSystem.largePadding)
                            
                            // Bottom padding
                            Color.clear.frame(height: 100)
                        }
                    }
                } else {
                    // Vault View
                    VaultView()
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }
}

// MARK: - Story Model
struct Story: Identifiable {
    let id = UUID()
    let title: String
    let recordings: Int
    let duration: Int // in seconds
    let words: Int
    let emoji: String
    
    var durationString: String {
        let hours = duration / 3600
        let minutes = (duration % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Story Card Component
struct StoryCard: View {
    let story: Story
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: 15) {
            // Emoji Icon
            Text(story.emoji)
                .font(.system(size: 40))
                .frame(width: 60, height: 60)
                .background(DesignSystem.warmGray)
                .cornerRadius(15)
            
            // Story Info
            VStack(alignment: .leading, spacing: 5) {
                Text(story.title)
                    .font(DesignSystem.buttonText)
                    .foregroundColor(DesignSystem.textPrimary)
                
                HStack(spacing: 15) {
                    Label("\(story.recordings)", systemImage: "waveform")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                    
                    Label(story.durationString, systemImage: "clock")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }
            }
            
            Spacer()
            
            // Play Button
            Image(systemName: "play.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(DesignSystem.primaryTeal)
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
            }
        }
    }
}

// MARK: - Vault View
struct VaultView: View {
    @State private var recordings = [
        VaultRecording(date: Date(), words: 74, duration: 30),
        VaultRecording(date: Date().addingTimeInterval(-3600), words: 156, duration: 65),
        VaultRecording(date: Date().addingTimeInterval(-7200), words: 2, duration: 3),
        VaultRecording(date: Date().addingTimeInterval(-86400), words: 0, duration: 1)
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 15) {
                ForEach(recordings) { recording in
                    VaultRecordingCard(recording: recording)
                }
                .padding(.horizontal, DesignSystem.largePadding)
                
                // Bottom padding
                Color.clear.frame(height: 100)
            }
            .padding(.top, 10)
        }
    }
}

// MARK: - Vault Recording Model
struct VaultRecording: Identifiable {
    let id = UUID()
    let date: Date
    let words: Int
    let duration: Int
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMMM yyyy h:mm a"
        return formatter.string(from: date)
    }
    
    var transcriptionPreview: String {
        if words == 0 {
            return "Audio recording (no transcription)"
        } else if words == 2 {
            return "Testing testing"
        } else if words == 74 {
            return "But when it's gonna have a break now OK please my sweetie let's have a break put it and come and talk to us we're having a pro..."
        } else {
            return "This is a longer recording with more content that shows how the preview text would look in the interface..."
        }
    }
}

// MARK: - Vault Recording Card
struct VaultRecordingCard: View {
    let recording: VaultRecording
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "waveform")
                    .font(.body)
                    .foregroundColor(DesignSystem.primaryTeal)
                
                Text(recording.formattedDate)
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                
                Spacer()
                
                Text("\(recording.words) words")
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
            }
            
            Text(recording.transcriptionPreview)
                .font(DesignSystem.body)
                .foregroundColor(DesignSystem.textPrimary)
                .lineLimit(2)
            
            HStack {
                Label("\(recording.duration)s", systemImage: "clock")
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "play.circle.fill")
                        .font(.title2)
                        .foregroundColor(DesignSystem.primaryTeal)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
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
            .foregroundColor(DesignSystem.primaryTeal)
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
