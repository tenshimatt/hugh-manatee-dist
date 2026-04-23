import Foundation
import Combine

// MARK: - AI Story Generator Service
@MainActor
class AIStoryGenerator: ObservableObject {
    static let shared = AIStoryGenerator()

    // SECURE: Backend proxy URL (no API key in app!)
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var isProcessing = false
    @Published var error: String?

    private init() {}

    // MARK: - Generate Enhanced Story

    func enhanceStory(from transcription: String) async throws -> String {
        guard !transcription.isEmpty else {
            throw AIError.emptyInput
        }

        isProcessing = true
        error = nil

        defer { isProcessing = false }

        do {
            // Send transcription to backend - it handles prompt engineering
            let response = try await callBackendEnhance(transcription: transcription)
            return response
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Backend API Call (Secure)

    private func callBackendEnhance(transcription: String) async throws -> String {
        // Call backend proxy instead of Claude directly
        let endpoint = "\(backendURL)/ai/enhance"
        guard let url = URL(string: endpoint) else {
            throw AIError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Send only transcription - backend handles prompt engineering & API key
        let requestBody: [String: String] = [
            "transcription": transcription
        ]

        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if let errorMessage = String(data: data, encoding: .utf8) {
                print("[AIStoryGenerator] Backend Error: \(errorMessage)")
            }
            throw AIError.apiError(statusCode: httpResponse.statusCode)
        }

        // Parse backend response
        struct BackendResponse: Codable {
            let enhanced: String
        }

        let decoder = JSONDecoder()
        let backendResponse = try decoder.decode(BackendResponse.self, from: data)

        return backendResponse.enhanced.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Prompt Engineering

    private func buildPrompt(transcription: String) -> String {
        return """
        You are a memoir editor helping elderly users preserve their life stories with a LIGHT editorial touch.
        Your goal: Remove speech disfluencies while keeping their authentic voice, rhythm, and conversational style.

        LIGHT-TOUCH EDITING RULES:
        1. Remove ONLY stutters and false starts: "um", "uh", "you know", "I mean", "the... the", "I was... I was"
        2. Keep colloquialisms and natural speech: "real pretty", "this kid", "literally pushed", "kind of", "sort of"
        3. Keep conversational fragments that convey emotion: "She was so pretty, and I was just this kid from the farm"
        4. Use dashes and commas to preserve the speaker's pacing and breath rhythm
        5. Keep repetition if it adds emotional emphasis: "I counted each one, like it might be the last time"
        6. Add paragraph breaks ONLY at major story shifts (sparingly - every 4-6 sentences max)
        7. Fix only obvious grammar errors; keep informal sentence structure if natural
        8. Preserve ALL names, dates, places, facts, and emotional details exactly as stated
        9. Do not elevate to formal literary prose - this should sound like cleaned-up spoken memory
        10. Do not add interpretations, metaphors, or information not present in the original

        Think: "How would this person tell this story to their grandchild?" - warm, authentic, conversational.

        Output only the lightly edited story text, no explanations or meta-commentary.

        TRANSCRIPTION:
        \(transcription)

        LIGHTLY EDITED STORY:
        """
    }

    // MARK: - Version Management

    func createVersion(from text: String) -> StoryVersion {
        let wordCount = text.split(separator: " ").count
        return StoryVersion(
            text: text,
            wordCount: wordCount
        )
    }

    // MARK: - Offline Check

    var isOnline: Bool {
        // Simple reachability check
        // In production, use Network framework
        return true
    }
}

// MARK: - Error Handling

enum AIError: LocalizedError {
    case emptyInput
    case noInternet
    case invalidResponse
    case apiError(statusCode: Int)
    case timeout

    var errorDescription: String? {
        switch self {
        case .emptyInput:
            return "No transcription to process"
        case .noInternet:
            return "No internet connection. Please try again when online."
        case .invalidResponse:
            return "Invalid response from AI service"
        case .apiError(let code):
            return "API error (code: \(code)). Please try again."
        case .timeout:
            return "Request timed out. Please try again."
        }
    }
}
