import Foundation

// MARK: - Story Model
struct Story: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var emoji: String
    var category: String
    var recordingIds: [UUID]  // References to SavedRecording IDs
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        title: String,
        emoji: String,
        category: String,
        recordingIds: [UUID] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.emoji = emoji
        self.category = category
        self.recordingIds = recordingIds
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    // Computed properties
    var recordingCount: Int {
        recordingIds.count
    }

    // Helper to get recordings from data manager
    func getRecordings(from dataManager: RecordingDataManager) -> [SavedRecording] {
        dataManager.savedRecordings.filter { recordingIds.contains($0.id) }
    }

    var totalWords: Int {
        // Calculate from recordings when needed
        0  // Computed in view layer
    }

    var totalDuration: TimeInterval {
        // Calculate from recordings when needed
        0  // Computed in view layer
    }

    static let emojis = ["📖", "🎤", "💭", "✨", "🌟", "💫", "🎯", "🎨", "🎭", "🎪", "🏆", "💡", "❤️", "🌈", "⭐️", "🎵", "📚", "🌺", "🦋", "🎁"]
}

// MARK: - Story Version (for Undo/Redo)
struct StoryVersion: Identifiable, Codable {
    let id: UUID
    let text: String
    let timestamp: Date
    let wordCount: Int

    init(
        id: UUID = UUID(),
        text: String,
        timestamp: Date = Date(),
        wordCount: Int
    ) {
        self.id = id
        self.text = text
        self.timestamp = timestamp
        self.wordCount = wordCount
    }
}
