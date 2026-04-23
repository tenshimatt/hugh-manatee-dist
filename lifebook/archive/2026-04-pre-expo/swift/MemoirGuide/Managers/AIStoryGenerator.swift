// AIStoryGenerator.swift
// AI-powered story generation from raw transcriptions using Claude API

import Foundation

class AIStoryGenerator: ObservableObject {
    @Published var isProcessing = false
    @Published var error: String?

    private let apiKey: String
    private let model = "claude-3-5-sonnet-20241022"
    private let baseURL = "https://api.anthropic.com/v1/messages"

    init(apiKey: String) {
        self.apiKey = apiKey
    }

    // MARK: - Public Methods

    func generateStory(from transcription: String) async throws -> String {
        guard !transcription.isEmpty else {
            throw AIStoryError.emptyTranscription
        }

        await MainActor.run {
            isProcessing = true
            error = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        let prompt = buildPrompt(transcription: transcription)
        let response = try await callClaudeAPI(prompt: prompt)

        return response
    }

    // Bug 21: Detail preservation mode
    func generateStoryWithDetailPreservation(from transcription: String) async throws -> String {
        guard !transcription.isEmpty else {
            throw AIStoryError.emptyTranscription
        }

        await MainActor.run {
            isProcessing = true
            error = nil
        }

        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }

        let prompt = buildDetailPreservationPrompt(transcription: transcription)
        let response = try await callClaudeAPI(prompt: prompt)

        return response
    }

    // MARK: - Private Methods

    private func buildPrompt(transcription: String) -> String {
        """
        Transform this spoken memory transcription into polished, readable story text while preserving the speaker's voice and all factual details.

        Rules:
        1. Remove filler words (um, uh, like, you know, so, yeah)
        2. Fix grammar and add proper punctuation
        3. Maintain first-person perspective
        4. Keep all names, dates, places, and facts exactly as stated
        5. Organize into clear paragraphs (new paragraph every 3-5 sentences)
        6. Preserve emotional tone and personal voice
        7. Do not add information not present in the original
        8. Do not change the meaning or interpretation

        Output only the improved story text, no explanations or meta-commentary.

        TRANSCRIPTION:
        \(transcription)

        IMPROVED STORY TEXT:
        """
    }

    // Bug 21: Detail preservation prompt
    private func buildDetailPreservationPrompt(transcription: String) -> String {
        """
        Edit this spoken memory transcription with MAXIMUM DETAIL PRESERVATION. Your ONLY tasks are:

        CRITICAL RULES - DO NOT VIOLATE:
        1. PRESERVE ALL DETAIL - Do NOT summarize, condense, or remove any information
        2. Fix ONLY spelling and grammar errors
        3. Remove filler words (um, uh, like, you know, so, yeah) but keep ALL substantive content
        4. Add proper punctuation while maintaining the speaker's natural flow
        5. Maintain first-person perspective exactly as stated
        6. Keep all names, dates, places, and facts EXACTLY as the speaker stated them
        7. Add bracketed historical/factual context where the speaker's memory may differ from documented facts
           Example: "We lived in Rhodesia [historically known as Zimbabwe at that time]"
           Example: "It happened in 1985 [records suggest 1984]"
        8. Organize into clear paragraphs but NEVER cut content to do so
        9. Preserve emotional tone, personal voice, and storytelling style completely
        10. Do NOT add any new information beyond bracketed factual clarifications

        WHAT TO PRESERVE (Everything!):
        - Every detail, no matter how small
        - Tangents and side stories
        - Repeated information (the speaker may emphasize things by repetition)
        - Descriptive passages
        - Emotional expressions
        - Personal interpretations and opinions
        - All dialogue and conversations mentioned

        Output only the edited story text with maximum detail preserved, no explanations or meta-commentary.

        TRANSCRIPTION:
        \(transcription)

        DETAIL-PRESERVED STORY TEXT:
        """
    }

    private func callClaudeAPI(prompt: String) async throws -> String {
        guard let url = URL(string: baseURL) else {
            throw AIStoryError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")

        let requestBody: [String: Any] = [
            "model": model,
            "max_tokens": 2048,
            "messages": [
                [
                    "role": "user",
                    "content": prompt
                ]
            ]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIStoryError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if let errorMessage = try? JSONDecoder().decode(ClaudeErrorResponse.self, from: data) {
                throw AIStoryError.apiError(errorMessage.error.message)
            }
            throw AIStoryError.apiError("HTTP \(httpResponse.statusCode)")
        }

        let decoded = try JSONDecoder().decode(ClaudeResponse.self, from: data)

        guard let firstContent = decoded.content.first,
              case .text(let text) = firstContent else {
            throw AIStoryError.noContentInResponse
        }

        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - API Response Models

struct ClaudeResponse: Codable {
    let id: String
    let type: String
    let role: String
    let content: [ContentBlock]
    let model: String
    let stopReason: String?

    enum CodingKeys: String, CodingKey {
        case id, type, role, content, model
        case stopReason = "stop_reason"
    }
}

enum ContentBlock: Codable {
    case text(String)

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "text":
            let text = try container.decode(String.self, forKey: .text)
            self = .text(text)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown content block type: \(type)"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .text(let text):
            try container.encode("text", forKey: .type)
            try container.encode(text, forKey: .text)
        }
    }

    private enum CodingKeys: String, CodingKey {
        case type, text
    }
}

struct ClaudeErrorResponse: Codable {
    let type: String
    let error: ErrorDetail

    struct ErrorDetail: Codable {
        let type: String
        let message: String
    }
}

// MARK: - Error Types

enum AIStoryError: LocalizedError {
    case emptyTranscription
    case invalidURL
    case invalidResponse
    case noContentInResponse
    case apiError(String)

    var errorDescription: String? {
        switch self {
        case .emptyTranscription:
            return "No transcription text to process"
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from AI service"
        case .noContentInResponse:
            return "No content in AI response"
        case .apiError(let message):
            return "AI service error: \(message)"
        }
    }
}