// ConversationManagerService.swift
// Manages conversation flow and Hugh's responses

import Foundation
import Combine

@MainActor
class ConversationManagerService: ObservableObject {
    static let shared = ConversationManagerService()

    @Published var conversationHistory: [ConversationMessage] = []
    @Published var isProcessing = false

    private let hueVoiceService = HughVoiceService.shared
    private let continuousRecording = ContinuousRecordingService.shared
    private let silenceDetection = SilenceDetectionService.shared

    // Backend API configuration
    private let backendURL = "http://localhost:3000" // Update with your backend URL
    private var silenceMonitoringTask: Task<Void, Never>?

    struct ConversationMessage: Identifiable {
        let id = UUID()
        let speaker: Speaker
        let text: String
        let timestamp: Date

        enum Speaker {
            case user
            case hugh
        }
    }

    struct ConversationContext {
        let transcription: String
        let pauseType: SilenceDetectionService.PauseType
        let conversationHistory: [ConversationMessage]
        let speechDuration: TimeInterval
    }

    enum HughResponseType {
        case encouragement
        case question
        case confirmation
        case topicShift
    }

    struct HughResponse {
        let text: String
        let type: HughResponseType
    }

    init() {}

    /// Start listening for silence events and managing conversation flow
    func startConversationFlow() async {
        print("[ConversationManagerService] Starting conversation flow...")

        // Greet user
        await greetUser()

        // Monitor silence events
        silenceMonitoringTask = Task {
            for await silenceEvent in silenceDetection.silenceEvents() {
                await handleUserPause(
                    transcription: continuousRecording.currentTranscription,
                    pauseType: silenceEvent.pauseType
                )
            }
        }
    }

    /// Stop conversation flow
    func stopConversationFlow() {
        silenceMonitoringTask?.cancel()
        silenceMonitoringTask = nil
    }

    /// Handle when user pauses speaking
    func handleUserPause(transcription: String, pauseType: SilenceDetectionService.PauseType) async {
        guard !transcription.isEmpty else { return }
        guard !isProcessing else { return }

        print("[ConversationManagerService] User paused (\(pauseType)): \(transcription)")

        // Add user's message to conversation history
        let userMessage = ConversationMessage(
            speaker: .user,
            text: transcription,
            timestamp: Date()
        )
        conversationHistory.append(userMessage)

        // Decide whether to respond based on pause type
        switch pauseType {
        case .short:
            // Don't respond to short pauses, just keep listening
            return

        case .medium:
            // Generate encouragement or follow-up question
            let context = ConversationContext(
                transcription: transcription,
                pauseType: pauseType,
                conversationHistory: conversationHistory,
                speechDuration: continuousRecording.recordingDuration
            )
            await generateAndSpeakResponse(context: context)

        case .long:
            // Save segment and suggest new topic
            await continuousRecording.saveCurrentSegment()
            let response = HughResponse(
                text: "That was wonderful. What else would you like to share today?",
                type: .topicShift
            )
            await speakResponse(response)
        }
    }

    /// Generate Hugh's response based on context
    private func generateAndSpeakResponse(context: ConversationContext) async {
        isProcessing = true

        // Generate response (call backend API or use local logic)
        let response = await generateResponse(context: context)

        // Speak the response
        await speakResponse(response)

        isProcessing = false
    }

    /// Generate Hugh's response using backend API
    private func generateResponse(context: ConversationContext) async -> HughResponse {
        // Prepare request payload
        let payload: [String: Any] = [
            "transcription": context.transcription,
            "pauseType": String(describing: context.pauseType),
            "conversationHistory": context.conversationHistory.map { [
                "speaker": $0.speaker == .user ? "user" : "hugh",
                "text": $0.text,
                "timestamp": ISO8601DateFormatter().string(from: $0.timestamp)
            ]},
            "speechDuration": context.speechDuration
        ]

        // Call backend API
        do {
            guard let url = URL(string: "\(backendURL)/api/ai/respond") else {
                return fallbackResponse(context: context)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            request.timeoutInterval = 10

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("[ConversationManagerService] Backend API error, using fallback")
                return fallbackResponse(context: context)
            }

            // Parse response
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let responseText = json["response"] as? String,
               let responseTypeString = json["responseType"] as? String {

                let responseType: HughResponseType
                switch responseTypeString {
                case "encouragement": responseType = .encouragement
                case "question": responseType = .question
                case "confirmation": responseType = .confirmation
                case "topicShift": responseType = .topicShift
                default: responseType = .encouragement
                }

                return HughResponse(text: responseText, type: responseType)
            }

        } catch {
            print("[ConversationManagerService] Failed to call backend API: \(error)")
        }

        // Fallback to local response generation
        return fallbackResponse(context: context)
    }

    /// Generate fallback response without backend
    private func fallbackResponse(context: ConversationContext) -> HughResponse {
        // Simple local logic for responses
        if context.speechDuration < 10.0 {
            return HughResponse(
                text: "That's interesting! Please, tell me more.",
                type: .encouragement
            )
        } else if context.transcription.count < 100 {
            return HughResponse(
                text: "I'm listening. What else can you tell me about that?",
                type: .question
            )
        } else {
            return HughResponse(
                text: "Thank you for sharing that memory. It sounds wonderful.",
                type: .confirmation
            )
        }
    }

    /// Speak Hugh's response
    func speakResponse(_ response: HughResponse) async {
        print("[ConversationManagerService] Hugh responding: \(response.text)")

        // Add Hugh's message to conversation history
        let hughMessage = ConversationMessage(
            speaker: .hugh,
            text: response.text,
            timestamp: Date()
        )
        conversationHistory.append(hughMessage)

        // Pause recording while Hugh speaks
        await continuousRecording.pauseForHughResponse()

        // Speak using TTS
        await hueVoiceService.speak(response.text) {
            Task { @MainActor in
                // Resume recording after Hugh finishes
                await self.continuousRecording.resumeAfterHugh()
                self.silenceDetection.reset()
            }
        }
    }

    /// Initial greeting when app opens
    private func greetUser() async {
        let greeting = "Hi! I'm Hugh, your memory companion. What's on your mind today?"
        let response = HughResponse(text: greeting, type: .encouragement)

        // Don't pause recording during initial greeting
        await hueVoiceService.speak(response.text)

        let hughMessage = ConversationMessage(
            speaker: .hugh,
            text: greeting,
            timestamp: Date()
        )
        conversationHistory.append(hughMessage)
    }

    /// Clear conversation history
    func clearHistory() {
        conversationHistory.removeAll()
    }
}
