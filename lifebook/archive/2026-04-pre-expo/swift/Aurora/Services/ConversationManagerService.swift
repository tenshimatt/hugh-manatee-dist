//
//  ConversationManagerService.swift
//  Aurora
//
//  Manages ChatGPT-style conversational interactions with Hugh
//  Handles silence detection → contextual responses → TTS playback
//

import Foundation
import Combine
import AVFoundation

/// Manages conversational flow between user and Hugh the Manatee
@MainActor
class ConversationManagerService: ObservableObject {
    static let shared = ConversationManagerService()

    // Backend URL
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    // Services
    private let hughVoice = HughVoiceService.shared
    private let voiceCommands = VoiceCommandService.shared

    // Published state
    @Published var isHughSpeaking = false
    @Published var conversationHistory: [ConversationMessage] = []
    @Published var currentContext: ConversationContext?
    @Published var conversationState: ConversationState = .listening

    // Pause detection tracking
    private var lastSpeechTimestamp: Date = Date()
    private var speechStartTimestamp: Date?

    private init() {
        print("🦭 [ConversationManager] Service initialized")
    }

    // MARK: - Public API

    /// Handle user pause (called by SilenceDetectionService)
    func handleUserPause(
        transcription: String,
        pauseType: PauseType
    ) async {
        print("🦭 [ConversationManager] User paused (\(pauseType.rawValue)): \"\(transcription.prefix(50))...\"")

        // Check for voice commands first
        if voiceCommands.containsVoiceCommand(transcription) {
            print("🦭 [ConversationManager] Voice command detected, processing...")
            await voiceCommands.processTranscription(transcription)
            // Voice command handled, don't generate conversational response
            return
        }

        // Calculate speech duration
        let speechDuration = Date().timeIntervalSince(speechStartTimestamp ?? Date())

        // Build conversation context
        let context = ConversationContext(
            transcription: transcription,
            speechDuration: speechDuration,
            pauseType: pauseType,
            recentHistory: Array(conversationHistory.suffix(5)),
            seemsComplete: determineIfComplete(transcription, pauseType)
        )

        currentContext = context

        // Short pauses: Don't respond, keep listening
        if pauseType == .short {
            print("🦭 [ConversationManager] Short pause, continuing to listen")
            return
        }

        // Generate and speak Hugh's response
        conversationState = .analyzingContext

        if let response = await generateResponse(context: context) {
            // Add user message to history
            addToHistory(speaker: .user, text: transcription)

            // Speak Hugh's response
            await speakResponse(response)

            // Add Hugh's response to history
            addToHistory(speaker: .hugh, text: response.text)

            // Save segment if needed
            if response.shouldSave {
                print("🦭 [ConversationManager] Marked for saving: Segment complete")
                conversationState = .savingSegment
                // TODO: Trigger ContinuousRecordingService.saveCurrentSegment()
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5s
            }
        }

        // Reset speech tracking
        speechStartTimestamp = Date()
        conversationState = .listening
    }

    /// Generate contextual response from Hugh
    func generateResponse(context: ConversationContext) async -> HughResponse? {
        print("🦭 [ConversationManager] Generating response for context...")

        do {
            let response = try await fetchConversationResponse(context: context)
            return response
        } catch {
            print("❌ [ConversationManager] Failed to generate response: \(error)")
            // Fallback to simple encouragement
            return HughResponse(
                text: "That's wonderful. Tell me more...",
                type: .encouragement,
                shouldSave: false
            )
        }
    }

    /// Speak Hugh's response using TTS
    func speakResponse(_ response: HughResponse) async {
        print("🦭 [ConversationManager] Hugh speaking (\(response.type.rawValue)): \"\(response.text)\"")

        conversationState = .hughResponding
        isHughSpeaking = true

        // Notify recording service to pause (if integrated)
        // TODO: pauseRecordingForHugh()

        // Speak using Hugh's voice
        await hughVoice.speak(response.text)

        // Wait for speech to complete
        while hughVoice.isSpeaking {
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1s
        }

        isHughSpeaking = false
        conversationState = .listening

        // Resume recording
        // TODO: resumeRecordingAfterHugh()

        print("🦭 [ConversationManager] Hugh finished speaking")
    }

    /// Mark speech started (for duration tracking)
    func markSpeechStarted() {
        if speechStartTimestamp == nil {
            speechStartTimestamp = Date()
        }
    }

    /// Reset conversation history
    func resetConversation() {
        print("🦭 [ConversationManager] Resetting conversation")
        conversationHistory.removeAll()
        currentContext = nil
        speechStartTimestamp = nil
        conversationState = .listening
    }

    // MARK: - Backend Communication

    /// Fetch conversational response from backend
    private func fetchConversationResponse(context: ConversationContext) async throws -> HughResponse {
        let endpoint = "\(backendURL)/ai/respond"

        guard let url = URL(string: endpoint) else {
            throw ConversationError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15 // Backend uses Claude, can take 3-5 seconds

        // Build request body
        let historyForBackend = context.recentHistory.map { msg in
            [
                "speaker": msg.speaker == .user ? "user" : "hugh",
                "text": msg.text,
                "timestamp": ISO8601DateFormatter().string(from: msg.timestamp)
            ]
        }

        let requestBody: [String: Any] = [
            "transcription": context.transcription,
            "conversationHistory": historyForBackend,
            "pauseType": context.pauseType.rawValue,
            "pauseDuration": context.pauseType == .short ? 1.5 : (context.pauseType == .medium ? 3.5 : 6.0)
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        print("🦭 [ConversationManager] Calling backend /ai/respond...")
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ConversationError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw ConversationError.apiError(statusCode: httpResponse.statusCode)
        }

        // Parse JSON response
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        guard let responseText = json?["response"] as? String,
              let responseTypeRaw = json?["responseType"] as? String,
              let shouldSave = json?["shouldSave"] as? Bool else {
            throw ConversationError.invalidResponseFormat
        }

        // Map backend response type to enum
        let responseType = ResponseType.from(string: responseTypeRaw)

        print("🦭 [ConversationManager] Backend response: \(responseType.rawValue), save=\(shouldSave)")

        return HughResponse(
            text: responseText,
            type: responseType,
            shouldSave: shouldSave
        )
    }

    // MARK: - Conversation State Management

    /// Add message to conversation history
    private func addToHistory(speaker: Speaker, text: String) {
        let message = ConversationMessage(
            id: UUID(),
            speaker: speaker,
            text: text,
            timestamp: Date()
        )

        conversationHistory.append(message)

        // Limit history to last 50 messages
        if conversationHistory.count > 50 {
            conversationHistory.removeFirst(conversationHistory.count - 50)
        }

        print("🦭 [ConversationManager] Added to history (\(speaker == .user ? "User" : "Hugh")): \"\(text.prefix(30))...\"")
    }

    /// Determine if transcription seems complete
    private func determineIfComplete(_ transcription: String, _ pauseType: PauseType) -> Bool {
        // Long pauses suggest completion
        if pauseType == .long {
            return true
        }

        // Short transcriptions are likely incomplete
        if transcription.split(separator: " ").count < 10 {
            return false
        }

        // Check for completion markers
        let completionMarkers = [
            "that's all", "that's it", "that's everything",
            "i'm done", "that's my story", "that's the story",
            "anyway", "so yeah", "well that's"
        ]

        let lowercased = transcription.lowercased()
        return completionMarkers.contains { lowercased.contains($0) }
    }
}

// MARK: - Data Structures

/// Conversation context for response generation
struct ConversationContext {
    let transcription: String
    let speechDuration: TimeInterval
    let pauseType: PauseType
    let recentHistory: [ConversationMessage]
    let seemsComplete: Bool
}

// Note: PauseType is defined in SilenceDetectionService.swift

/// Hugh's response
struct HughResponse {
    let text: String
    let type: ResponseType
    let shouldSave: Bool
}

/// Response types from Hugh
enum ResponseType: String {
    case encouragement = "encouragement"
    case question = "question"
    case topicShift = "topicShift"
    case confirmation = "confirmation"

    static func from(string: String) -> ResponseType {
        switch string.lowercased() {
        case "encouragement": return .encouragement
        case "question": return .question
        case "topicshift", "topic_shift": return .topicShift
        case "confirmation": return .confirmation
        default: return .encouragement
        }
    }
}

/// Conversation message
struct ConversationMessage: Identifiable, Codable {
    let id: UUID
    let speaker: Speaker
    let text: String
    let timestamp: Date
}

/// Speaker in conversation
enum Speaker: String, Codable {
    case user = "user"
    case hugh = "hugh"
}

/// Conversation state machine
enum ConversationState: String {
    case listening = "listening"           // User speaking
    case analyzingContext = "analyzing"    // Deciding response
    case hughResponding = "responding"     // Hugh speaking
    case savingSegment = "saving"          // Saving complete segment
}

// MARK: - Errors

enum ConversationError: LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidResponseFormat
    case apiError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid backend URL"
        case .invalidResponse:
            return "Invalid response from backend"
        case .invalidResponseFormat:
            return "Backend response format invalid"
        case .apiError(let code):
            return "Backend API error (status \(code))"
        }
    }
}
