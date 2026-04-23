import Foundation
import Combine

// MARK: - AI Interviewer Service
// Generates warm, curious follow-up questions to help users remember more details
@MainActor
class AIInterviewerService: ObservableObject {
    static let shared = AIInterviewerService()

    // SECURE: Backend proxy URL (no API key in app!)
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var isProcessing = false
    @Published var error: String?

    private init() {}

    // MARK: - Generate Follow-up Questions

    func generateFollowUpQuestions(from transcription: String) async throws -> [String] {
        guard !transcription.isEmpty else {
            throw AIInterviewerError.emptyInput
        }

        isProcessing = true
        error = nil
        defer { isProcessing = false }

        do {
            // Call backend - it handles prompt engineering and API key
            return try await callBackendQuestions(transcription: transcription)
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Backend API Call (Secure)

    private func callBackendQuestions(transcription: String) async throws -> [String] {
        let endpoint = "\(backendURL)/ai/questions"
        guard let url = URL(string: endpoint) else {
            throw AIInterviewerError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let requestBody: [String: String] = [
            "transcription": transcription
        ]

        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIInterviewerError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if let errorMessage = String(data: data, encoding: .utf8) {
                print("[AIInterviewerService] Backend Error: \(errorMessage)")
            }
            throw AIInterviewerError.apiError(statusCode: httpResponse.statusCode)
        }

        // Parse backend response
        struct BackendResponse: Codable {
            let questions: [String]
        }

        let decoder = JSONDecoder()
        let backendResponse = try decoder.decode(BackendResponse.self, from: data)

        return backendResponse.questions
    }

    // MARK: - Prompt Engineering

    private func buildInterviewPrompt(transcription: String) -> String {
        return """
        You are a warm, curious grandchild interviewing your beloved grandparent about their life memories.
        They just shared this memory with you:

        "\(transcription)"

        Your task: Generate 3-5 gentle, conversational follow-up questions to help them remember MORE vivid details.

        QUESTION GUIDELINES:
        1. Reference their story directly: "You mentioned the dance hall..." or "When you saw her..."
        2. Ask for ONE specific sensory or emotional detail per question
        3. Use warm, conversational language like you're having tea together
        4. Focus on: sights, sounds, smells, emotions, exact words spoken, facial expressions, colors, textures
        5. Help them visualize the moment more clearly
        6. Keep questions short and easy to understand (elderly-friendly)
        7. Never ask yes/no questions - always open-ended

        AREAS TO EXPLORE:
        - 🎨 Sensory: "What colors do you remember?" "What did it smell like?"
        - 💭 Emotions: "How did that make you feel?" "What were you thinking right then?"
        - 👥 People: "What did they look like?" "What exactly did they say?"
        - 📍 Setting: "Can you describe the room?" "What sounds do you remember?"
        - ❤️ Significance: "Why do you think you remember this so clearly?" "What made that moment special?"

        OUTPUT FORMAT:
        Return ONLY the questions, one per line, numbered 1-5.
        Each question should feel like a loving grandchild asking to hear more.

        EXAMPLE OUTPUT:
        1. What was she wearing? Can you describe her dress?
        2. What song was playing when you first saw her?
        3. How did you feel when your eyes met?
        4. What did her voice sound like?
        5. Do you remember what the dance hall looked like that night?

        Now generate 3-5 questions for their memory:
        """
    }

    // MARK: - Parse Response

    private func parseQuestions(from response: String) -> [String] {
        // Split by lines and filter numbered questions
        let lines = response.components(separatedBy: .newlines)
        var questions: [String] = []

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            // Match numbered questions: "1. Question?" or "1) Question?"
            if let range = trimmed.range(of: "^\\d+[\\.\\)]\\s*", options: .regularExpression) {
                let question = trimmed.replacingCharacters(in: range, with: "")
                    .trimmingCharacters(in: .whitespaces)
                if !question.isEmpty {
                    questions.append(question)
                }
            }
        }

        // Limit to 5 questions
        return Array(questions.prefix(5))
    }
}

// MARK: - Error Handling

enum AIInterviewerError: LocalizedError {
    case emptyInput
    case noInternet
    case invalidResponse
    case apiError(statusCode: Int)
    case timeout

    var errorDescription: String? {
        switch self {
        case .emptyInput:
            return "No memory to analyze"
        case .noInternet:
            return "No internet connection. Please try again when online."
        case .invalidResponse:
            return "Invalid response from AI interviewer"
        case .apiError(let code):
            return "AI interviewer error (code: \(code)). Please try again."
        case .timeout:
            return "Request timed out. Please try again."
        }
    }
}
