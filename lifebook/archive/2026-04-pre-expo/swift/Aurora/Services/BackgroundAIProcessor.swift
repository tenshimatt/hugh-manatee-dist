import Foundation
import Combine

// MARK: - Background AI Processor
// Processes AI enhancements for recordings in the background
@MainActor
class BackgroundAIProcessor: ObservableObject {
    static let shared = BackgroundAIProcessor()

    @Published var processingRecordingIds: Set<UUID> = []
    @Published var completedRecordingIds: Set<UUID> = []
    @Published var failedRecordingIds: Set<UUID> = []

    private let aiGenerator = AIStoryGenerator.shared
    private let aiInterviewer = AIInterviewerService.shared
    private let dataManager = RecordingDataManager.shared

    private init() {}

    // MARK: - Process Recording

    func processRecording(id: UUID, transcription: String) {
        // Mark as processing
        processingRecordingIds.insert(id)

        Task {
            do {
                // Generate AI enhancement
                let enhanced = try await aiGenerator.enhanceStory(from: transcription)

                // Create version history
                let originalVersion = aiGenerator.createVersion(from: transcription)
                let aiVersion = aiGenerator.createVersion(from: enhanced)
                let editHistory = [originalVersion, aiVersion]

                // Generate follow-up questions
                let questions = try? await aiInterviewer.generateFollowUpQuestions(from: transcription)

                // Update recording with AI content
                await MainActor.run {
                    dataManager.updateAIStory(
                        for: id,
                        aiStoryText: enhanced,
                        editHistory: editHistory
                    )

                    // Store follow-up questions if generated
                    if let questions = questions {
                        // Could store in UserDefaults or Core Data if needed
                        print("[BackgroundAI] Generated \(questions.count) follow-up questions for recording \(id)")
                    }

                    // Mark as complete
                    processingRecordingIds.remove(id)
                    completedRecordingIds.insert(id)

                    // Send notification
                    NotificationCenter.default.post(
                        name: .aiProcessingCompleted,
                        object: nil,
                        userInfo: ["recordingId": id]
                    )

                    print("[BackgroundAI] ✅ Completed AI processing for recording \(id)")
                }

            } catch {
                await MainActor.run {
                    processingRecordingIds.remove(id)
                    failedRecordingIds.insert(id)

                    print("[BackgroundAI] ❌ Failed AI processing for recording \(id): \(error.localizedDescription)")
                }
            }
        }
    }

    // MARK: - Batch Process

    func processMultipleRecordings(recordings: [(id: UUID, transcription: String)]) {
        for recording in recordings {
            processRecording(id: recording.id, transcription: recording.transcription)
        }
    }

    // MARK: - Status Checks

    func isProcessing(recordingId: UUID) -> Bool {
        processingRecordingIds.contains(recordingId)
    }

    func isCompleted(recordingId: UUID) -> Bool {
        completedRecordingIds.contains(recordingId)
    }

    func hasFailed(recordingId: UUID) -> Bool {
        failedRecordingIds.contains(recordingId)
    }

    func getStatus(recordingId: UUID) -> ProcessingStatus {
        if processingRecordingIds.contains(recordingId) {
            return .processing
        } else if completedRecordingIds.contains(recordingId) {
            return .completed
        } else if failedRecordingIds.contains(recordingId) {
            return .failed
        } else {
            return .pending
        }
    }

    // MARK: - Retry Failed

    func retryFailed(recordingId: UUID) {
        guard failedRecordingIds.contains(recordingId) else { return }

        // Find the recording
        if let recording = dataManager.savedRecordings.first(where: { $0.id == recordingId }) {
            failedRecordingIds.remove(recordingId)
            processRecording(id: recordingId, transcription: recording.transcription)
        }
    }

    // MARK: - Clear Completed

    func clearCompleted() {
        completedRecordingIds.removeAll()
    }
}

// MARK: - Processing Status

enum ProcessingStatus {
    case pending
    case processing
    case completed
    case failed

    var icon: String {
        switch self {
        case .pending: return "clock"
        case .processing: return "waveform.circle"
        case .completed: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.triangle.fill"
        }
    }

    var color: String {
        switch self {
        case .pending: return "gray"
        case .processing: return "orange"
        case .completed: return "green"
        case .failed: return "red"
        }
    }

    var text: String {
        switch self {
        case .pending: return "Queued"
        case .processing: return "Enhancing..."
        case .completed: return "Enhanced"
        case .failed: return "Failed"
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let aiProcessingCompleted = Notification.Name("aiProcessingCompleted")
}
