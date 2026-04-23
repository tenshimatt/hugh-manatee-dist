import SwiftUI

// MARK: - Story Tree Visualization
// Shows interconnected life stories as a visual narrative tree
struct StoryTreeView: View {
    @ObservedObject var dataManager: RecordingDataManager
    @State private var selectedViewMode: ViewMode = .thematic
    @State private var selectedStory: Story? = nil
    @State private var showingStoryDetail = false

    enum ViewMode: String, CaseIterable {
        case thematic = "By Theme"
        case timeline = "Timeline"
    }

    var body: some View {
        VStack(spacing: 0) {
            // View Mode Picker
            Picker("View Mode", selection: $selectedViewMode) {
                ForEach(ViewMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            ScrollView {
                if dataManager.stories.isEmpty {
                    // Empty state
                    VStack(spacing: 20) {
                        Image(systemName: "tree.fill")
                            .font(.system(size: 60))
                            .foregroundColor(DesignSystem.textSecondary.opacity(0.5))
                        Text("Your Story Tree Will Grow Here")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textSecondary)
                        Text("Record memories to build your life story tree")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textSecondary.opacity(0.7))
                    }
                    .padding(.top, 60)
                } else {
                    if selectedViewMode == .thematic {
                        ThematicTreeView(
                            stories: dataManager.stories,
                            dataManager: dataManager,
                            onStoryTap: { story in
                                selectedStory = story
                                showingStoryDetail = true
                            }
                        )
                    } else {
                        TimelineTreeView(
                            stories: dataManager.stories,
                            dataManager: dataManager,
                            onStoryTap: { story in
                                selectedStory = story
                                showingStoryDetail = true
                            }
                        )
                    }
                }

                Color.clear.frame(height: 100)
            }
        }
        .sheet(isPresented: $showingStoryDetail) {
            if let story = selectedStory {
                StoryDetailView(story: story)
            }
        }
    }
}

// MARK: - Thematic Tree View
struct ThematicTreeView: View {
    let stories: [Story]
    @ObservedObject var dataManager: RecordingDataManager
    let onStoryTap: (Story) -> Void

    var storiesByCategory: [String: [Story]] {
        Dictionary(grouping: stories, by: { $0.category })
    }

    var body: some View {
        VStack(spacing: 30) {
            Text("Life Story Branches")
                .font(DesignSystem.largeTitle)
                .foregroundColor(DesignSystem.textPrimary)
                .padding(.top, 20)

            ForEach(Array(storiesByCategory.keys.sorted()), id: \.self) { category in
                CategoryBranch(
                    category: category,
                    stories: storiesByCategory[category] ?? [],
                    dataManager: dataManager,
                    onStoryTap: onStoryTap
                )
            }
        }
        .padding(.horizontal, DesignSystem.largePadding)
    }
}

// MARK: - Category Branch
struct CategoryBranch: View {
    let category: String
    let stories: [Story]
    @ObservedObject var dataManager: RecordingDataManager
    let onStoryTap: (Story) -> Void

    var categoryColor: Color {
        switch category {
        case "Childhood": return .orange
        case "Family": return .pink
        case "Career": return .blue
        case "Travel": return .purple
        case "Relationships": return .red
        case "Hobbies": return .green
        case "Life Lessons": return .yellow
        case "Achievements": return Color(red: 1.0, green: 0.84, blue: 0.0) // Gold
        case "Challenges": return .gray
        default: return DesignSystem.primaryTeal
        }
    }

    var categoryIcon: String {
        switch category {
        case "Childhood": return "figure.and.child.holdinghands"
        case "Family": return "house.fill"
        case "Career": return "briefcase.fill"
        case "Travel": return "airplane"
        case "Relationships": return "heart.fill"
        case "Hobbies": return "paintpalette.fill"
        case "Life Lessons": return "lightbulb.fill"
        case "Achievements": return "trophy.fill"
        case "Challenges": return "mountain.2.fill"
        default: return "book.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Category Header
            HStack(spacing: 12) {
                Image(systemName: categoryIcon)
                    .font(.title2)
                    .foregroundColor(categoryColor)
                    .frame(width: 40, height: 40)
                    .background(categoryColor.opacity(0.15))
                    .cornerRadius(8)

                VStack(alignment: .leading, spacing: 4) {
                    Text(category)
                        .font(DesignSystem.buttonText)
                        .foregroundColor(DesignSystem.textPrimary)

                    Text("\(stories.count) stories • \(totalWords) words")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }

                Spacer()
            }
            .padding(.bottom, 10)

            // Stories in this category with connecting lines
            ForEach(Array(stories.enumerated()), id: \.element.id) { index, story in
                HStack(spacing: 0) {
                    // Branch line
                    VStack(spacing: 0) {
                        Rectangle()
                            .fill(categoryColor.opacity(0.3))
                            .frame(width: 2, height: index == 0 ? 20 : 40)

                        Circle()
                            .fill(categoryColor)
                            .frame(width: 8, height: 8)

                        if index < stories.count - 1 {
                            Rectangle()
                                .fill(categoryColor.opacity(0.3))
                                .frame(width: 2, height: 40)
                        }
                    }
                    .padding(.trailing, 15)

                    // Story node
                    StoryNode(
                        story: story,
                        recordings: story.getRecordings(from: dataManager),
                        color: categoryColor,
                        onTap: { onStoryTap(story) }
                    )
                }
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }

    var totalWords: Int {
        stories.flatMap { $0.getRecordings(from: dataManager) }
            .reduce(0) { $0 + $1.wordCount }
    }
}

// MARK: - Story Node Component
struct StoryNode: View {
    let story: Story
    let recordings: [SavedRecording]
    let color: Color
    let onTap: () -> Void

    var totalWords: Int {
        recordings.reduce(0) { $0 + $1.wordCount }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Emoji
                Text(story.emoji)
                    .font(.system(size: 35))
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.1))
                    .cornerRadius(10)

                // Story info
                VStack(alignment: .leading, spacing: 6) {
                    Text(story.title)
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textPrimary)
                        .lineLimit(2)

                    HStack(spacing: 12) {
                        Label("\(recordings.count)", systemImage: "mic.fill")
                        Label("\(totalWords) words", systemImage: "text.alignleft")
                    }
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(color)
                    .font(.title3)
            }
            .padding(15)
            .background(color.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Timeline Tree View
struct TimelineTreeView: View {
    let stories: [Story]
    @ObservedObject var dataManager: RecordingDataManager
    let onStoryTap: (Story) -> Void

    var sortedStories: [Story] {
        stories.sorted { $0.createdAt < $1.createdAt }
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("Life Story Timeline")
                .font(DesignSystem.largeTitle)
                .foregroundColor(DesignSystem.textPrimary)
                .padding(.top, 20)

            // Timeline visualization
            VStack(spacing: 0) {
                ForEach(Array(sortedStories.enumerated()), id: \.element.id) { index, story in
                    HStack(alignment: .top, spacing: 0) {
                        // Timeline line with date marker
                        VStack(spacing: 0) {
                            if index == 0 {
                                Circle()
                                    .fill(DesignSystem.primaryTeal)
                                    .frame(width: 12, height: 12)
                            } else {
                                Rectangle()
                                    .fill(DesignSystem.primaryTeal.opacity(0.3))
                                    .frame(width: 2, height: 40)

                                Circle()
                                    .fill(DesignSystem.primaryTeal)
                                    .frame(width: 12, height: 12)
                            }

                            if index < sortedStories.count - 1 {
                                Rectangle()
                                    .fill(DesignSystem.primaryTeal.opacity(0.3))
                                    .frame(width: 2, height: 40)
                            }
                        }
                        .padding(.trailing, 20)

                        // Story card with date
                        VStack(alignment: .leading, spacing: 8) {
                            Text(formatDate(story.createdAt))
                                .font(DesignSystem.caption)
                                .foregroundColor(DesignSystem.textSecondary)

                            StoryNode(
                                story: story,
                                recordings: story.getRecordings(from: dataManager),
                                color: DesignSystem.primaryTeal,
                                onTap: { onStoryTap(story) }
                            )
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .padding(20)
            .background(Color.white)
            .cornerRadius(DesignSystem.cardCornerRadius)
            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        }
        .padding(.horizontal, DesignSystem.largePadding)
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Preview
struct StoryTreeView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            StoryTreeView(dataManager: RecordingDataManager.shared)
        }
    }
}
