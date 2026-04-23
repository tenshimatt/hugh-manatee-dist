// AIEntityExtractor.swift
// Extracts genealogy information from transcriptions using AI

import Foundation
import Combine

@MainActor
class AIEntityExtractor: ObservableObject {
    static let shared = AIEntityExtractor()

    @Published var isExtracting = false
    @Published var lastExtraction: ExtractedEntities?

    // SECURE: Backend proxy URL (no API key in app!)
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    private init() {}

    // MARK: - Main Extraction Method

    func extractEntities(from transcription: String) async throws -> ExtractedEntities {
        isExtracting = true
        defer { isExtracting = false }

        // Call backend - it handles prompt engineering and API key
        let entities = try await callBackendExtract(transcription: transcription)

        lastExtraction = entities
        return entities
    }

    // MARK: - Prompt Building

    internal func buildExtractionPrompt(transcription: String) -> String {
        return """
        Extract genealogy and personal information from this recording transcription. Focus on:

        1. **Names**: Full names of people mentioned (user, parents, spouse, siblings, children)
        2. **Dates**: Birth dates, marriage dates, death dates, significant event dates
        3. **Places**: Birthplaces, hometowns, where people met, lived, or visited
        4. **Relationships**: How people are related (mother, father, spouse, sibling, child, friend)
        5. **Events**: Significant life events (marriage, births, career milestones, moves)

        Transcription:
        \"\"\"
        \(transcription)
        \"\"\"

        Respond ONLY with a JSON object in this exact format:
        {
          "userInfo": {
            "fullName": "string or null",
            "dateOfBirth": "YYYY-MM-DD or null",
            "placeOfBirth": "string or null"
          },
          "mother": {
            "fullName": "string or null",
            "maidenName": "string or null",
            "birthplace": "string or null"
          },
          "father": {
            "fullName": "string or null",
            "birthplace": "string or null"
          },
          "spouse": {
            "name": "string or null",
            "whereMet": "string or null"
          },
          "people": [
            {
              "name": "string",
              "relationship": "string",
              "notes": "string"
            }
          ],
          "places": [
            {
              "name": "string",
              "significance": "string",
              "yearOrPeriod": "string or null"
            }
          ],
          "events": [
            {
              "description": "string",
              "date": "YYYY-MM-DD or null",
              "place": "string or null"
            }
          ],
          "themes": ["string"],
          "suggestedCategory": "Childhood|Family|Career|Travel|Relationships|Hobbies|Life Lessons|Achievements|Challenges|General"
        }

        Rules:
        - If information is not mentioned, use null
        - Dates must be YYYY-MM-DD format or null
        - Be specific and accurate - don't guess
        - Extract maiden names separately from married names
        - Include context in "notes" fields
        - Themes should be 1-3 words each (e.g., "childhood games", "military service")
        - suggestedCategory should match one of the listed categories exactly
        """
    }

    // MARK: - API Call

    // MARK: - Backend API Call (Secure)

    private func callBackendExtract(transcription: String) async throws -> ExtractedEntities {
        let endpoint = "\(backendURL)/ai/extract"
        guard let url = URL(string: endpoint) else {
            throw ExtractionError.invalidResponse
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
            throw ExtractionError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw ExtractionError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }

        // Parse backend response
        struct BackendResponse: Codable {
            let entities: ExtractedEntities
        }

        let decoder = JSONDecoder()
        let backendResponse = try decoder.decode(BackendResponse.self, from: data)

        return backendResponse.entities
    }

    // MARK: - Response Parsing

    internal func parseExtraction(response: String) throws -> ExtractedEntities {
        // Find JSON in response (may have markdown code blocks)
        let jsonString: String
        if response.contains("```json") {
            let components = response.components(separatedBy: "```json")
            if components.count > 1 {
                let jsonPart = components[1].components(separatedBy: "```")[0]
                jsonString = jsonPart.trimmingCharacters(in: .whitespacesAndNewlines)
            } else {
                jsonString = response
            }
        } else if response.contains("```") {
            let components = response.components(separatedBy: "```")
            if components.count > 1 {
                jsonString = components[1].trimmingCharacters(in: .whitespacesAndNewlines)
            } else {
                jsonString = response
            }
        } else {
            jsonString = response
        }

        guard let data = jsonString.data(using: .utf8) else {
            throw ExtractionError.parsingFailed
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"

            if let date = formatter.date(from: dateString) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string \(dateString)"
            )
        }

        return try decoder.decode(ExtractedEntities.self, from: data)
    }

    // MARK: - Helper Methods

    func suggestNextQuestion(basedOn entities: ExtractedEntities, profile: ProfileInfoEntity?) -> String? {
        // Check what's missing and suggest questions

        if entities.userInfo.fullName == nil && profile?.fullName == nil {
            return "What's your full name?"
        }

        if entities.userInfo.dateOfBirth == nil && profile?.dateOfBirth == nil {
            return "When were you born?"
        }

        if entities.mother.fullName == nil && profile?.motherFullName == nil {
            return "Tell me about your mother - what was her name?"
        }

        if entities.father.fullName == nil && profile?.fatherFullName == nil {
            return "Tell me about your father - what was his name?"
        }

        if entities.mother.maidenName == nil && profile?.motherMaidenName == nil && profile?.motherFullName != nil {
            return "What was your mother's maiden name?"
        }

        return nil
    }

    enum ExtractionError: LocalizedError {
        case invalidResponse
        case apiError(statusCode: Int, message: String)
        case parsingFailed

        var errorDescription: String? {
            switch self {
            case .invalidResponse:
                return "Invalid response from API"
            case .apiError(let code, let message):
                return "API Error (\(code)): \(message)"
            case .parsingFailed:
                return "Failed to parse extraction results"
            }
        }
    }
}

// MARK: - Data Models

struct ExtractedEntities: Codable {
    let userInfo: UserInfo
    let mother: ParentInfo
    let father: FatherInfo
    let spouse: SpouseInfo
    let people: [Person]
    let places: [Place]
    let events: [Event]
    let themes: [String]
    let suggestedCategory: String

    struct UserInfo: Codable {
        let fullName: String?
        let dateOfBirth: Date?
        let placeOfBirth: String?
    }

    struct ParentInfo: Codable {
        let fullName: String?
        let maidenName: String?
        let birthplace: String?
    }

    struct FatherInfo: Codable {
        let fullName: String?
        let birthplace: String?
    }

    struct SpouseInfo: Codable {
        let name: String?
        let whereMet: String?
    }

    struct Person: Codable {
        let name: String
        let relationship: String
        let notes: String
    }

    struct Place: Codable {
        let name: String
        let significance: String
        let yearOrPeriod: String?
    }

    struct Event: Codable {
        let description: String
        let date: Date?
        let place: String?
    }

    var hasGenealogyInfo: Bool {
        return userInfo.fullName != nil ||
               userInfo.dateOfBirth != nil ||
               mother.fullName != nil ||
               father.fullName != nil ||
               spouse.name != nil
    }
}
