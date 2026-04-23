import Foundation
import Combine
import SwiftUI

// MARK: - AI Prompt Generation Service
// Generates contextual memoir prompts based on user's recording history
@MainActor
class AIPromptService: ObservableObject {
    static let shared = AIPromptService()

    // SECURE: Backend proxy URL (no API key in app!)
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var currentPrompt: String = "Tell me about a moment that changed your life..."
    @Published var isLoading = false

    private var promptQueue: [String] = []
    private var currentIndex = 0
    private var lastRecordingTopic: String? = nil // Track last topic discussed

    // Categories for varied prompts
    private let categories = [
        "childhood", "family", "career", "travel", "relationships",
        "hobbies", "achievements", "challenges", "celebrations", "first times"
    ]

    private init() {
        // Start with fallback prompts
        loadFallbackPrompts()

        // Pre-generate AI prompts in background
        Task {
            await generateAIPrompts()
        }
    }

    // MARK: - Contextual Prompt Updates (After Recording)

    /// Update prompt after recording completion - decides whether to continue topic or try new one
    func updateAfterRecording(transcription: String) async {
        print("[AIPromptService] 🎙️ Recording completed, analyzing context...")

        // Detect topic from transcription
        let topicService = TopicDetectionService.shared
        await topicService.detectTopic(from: transcription)

        // Read detected topic from service
        let detectedTopic = topicService.currentTopic
        let confidence = topicService.topicConfidence

        print("[AIPromptService] 📊 Detected topic: \(detectedTopic) (confidence: \(confidence))")

        // Decision logic:
        // - High confidence (>0.7) and same topic = Follow-up prompts on same topic
        // - High confidence (>0.7) but different topic = Acknowledge shift, suggest continuing or new topic
        // - Low confidence (<0.7) = Suggest new topic for variety

        if confidence > 0.7 {
            if let lastTopic = lastRecordingTopic, lastTopic == detectedTopic {
                // Continue on same topic - generate follow-up prompts
                print("[AIPromptService] ↪️ Continuing on topic: \(detectedTopic)")
                await generateAIPrompts(for: detectedTopic)
            } else {
                // New topic with high confidence - acknowledge and continue
                print("[AIPromptService] 🔄 Topic shift detected: \(lastRecordingTopic ?? "none") → \(detectedTopic)")
                await generateAIPrompts(for: detectedTopic)
            }
            lastRecordingTopic = detectedTopic
        } else {
            // Low confidence - suggest new random topic for variety
            print("[AIPromptService] 🎲 Low confidence, suggesting new topic")
            let newTopic = categories.randomElement() ?? "life"
            await generateAIPrompts(for: newTopic)
            lastRecordingTopic = newTopic
        }

        // Show next prompt with animation
        rotateToNextPrompt()
    }

    private func rotateToNextPrompt() {
        guard !promptQueue.isEmpty else {
            print("[AIPromptService] ⚠️ Prompt queue is empty")
            return
        }

        currentIndex = (currentIndex + 1) % promptQueue.count

        withAnimation(.easeInOut(duration: 0.5)) {
            currentPrompt = promptQueue[currentIndex]
        }

        print("[AIPromptService] 💭 Next prompt: \(currentPrompt)")
    }

    // MARK: - Fallback Prompts (No AI Required)

    private func loadFallbackPrompts() {
        promptQueue = [
            "Tell me about a moment that changed your life...",
            "What's a memory that still makes you smile?",
            "Describe someone who influenced you deeply...",
            "Share a story about where you grew up...",
            "What's a tradition you cherish from your childhood?",
            "Tell me about a time you felt truly proud...",
            "What did a typical day look like when you were young?",
            "Share a memory about your grandparents...",
            "What was your first job like?",
            "Tell me about falling in love...",
            "What's something you wish you'd known earlier in life?",
            "Describe a place that feels like home to you...",
            "What was school like when you were growing up?",
            "Tell me about a friendship that meant a lot to you...",
            "What's a skill or hobby you loved as a child?"
        ]

        currentPrompt = promptQueue.first ?? "Tell me about your life..."
    }

    // MARK: - AI Prompt Generation

    func generateAIPrompts(for topic: String? = nil) async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Generate batch of prompts from AI (topic-specific if provided)
            let prompts = try await callBackendGeneratePrompts(topic: topic)

            await MainActor.run {
                // Append to queue (keep it fresh)
                if promptQueue.count > 20 {
                    promptQueue = Array(promptQueue.suffix(10)) + prompts
                } else {
                    promptQueue.append(contentsOf: prompts)
                }

                let topicLabel = topic ?? "general"
                print("[AIPromptService] ✨ Generated \(prompts.count) new prompts for topic: \(topicLabel). Queue size: \(promptQueue.count)")
            }
        } catch {
            print("[AIPromptService] ⚠️ Failed to generate AI prompts: \(error.localizedDescription)")
            // Fallback prompts are already loaded
        }
    }

    // Update prompts based on detected topic
    func updatePromptsForTopic(_ topic: String) async {
        print("[AIPromptService] 🎯 Updating prompts for topic: \(topic)")
        await generateAIPrompts(for: topic)
    }

    // MARK: - Backend API Call

    private func callBackendGeneratePrompts(topic: String? = nil) async throws -> [String] {
        let endpoint = "\(backendURL)/ai/prompts"
        guard let url = URL(string: endpoint) else {
            throw PromptError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Use provided topic or pick random category
        let category = topic ?? categories.randomElement() ?? "life"

        let requestBody: [String: String] = [
            "category": category
        ]

        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw PromptError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw PromptError.apiError(statusCode: httpResponse.statusCode)
        }

        struct BackendResponse: Codable {
            let prompts: [String]
            let category: String
        }

        let decoder = JSONDecoder()
        let backendResponse = try decoder.decode(BackendResponse.self, from: data)

        print("[AIPromptService] 📝 Received \(backendResponse.prompts.count) prompts for category: \(backendResponse.category)")

        return backendResponse.prompts
    }

    // MARK: - Parse Response

    private func parsePrompts(from response: String) -> [String] {
        let lines = response.components(separatedBy: .newlines)
        var prompts: [String] = []

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            // Match numbered prompts: "1. Prompt..." or "1) Prompt..."
            if let range = trimmed.range(of: "^\\d+[\\.\\)]\\s*", options: .regularExpression) {
                var prompt = trimmed.replacingCharacters(in: range, with: "")
                    .trimmingCharacters(in: .whitespaces)

                // Ensure it ends with "..." if not already
                if !prompt.hasSuffix("...") && !prompt.hasSuffix("?") {
                    prompt += "..."
                }

                if !prompt.isEmpty {
                    prompts.append(prompt)
                }
            }
        }

        // If parsing failed, return fallback
        if prompts.isEmpty {
            return [
                "Tell me about a moment that changed your life...",
                "What's a memory that makes you smile?",
                "Share a story about someone special...",
                "Describe a place that feels like home...",
                "What's something you're proud of?"
            ]
        }

        return prompts
    }

    // MARK: - Manual Refresh

    func refreshPrompts() async {
        await generateAIPrompts()
        rotateToNextPrompt()
    }

    enum PromptError: LocalizedError {
        case invalidResponse
        case apiError(statusCode: Int)

        var errorDescription: String? {
            switch self {
            case .invalidResponse:
                return "Invalid response from prompt service"
            case .apiError(let code):
                return "Prompt service error (code: \(code))"
            }
        }
    }
}
