import Foundation
import Combine

class TemporalContextService: ObservableObject {
    static let shared = TemporalContextService()

    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var isEnhancing = false
    @Published var lastEnhancement: TemporalEnhancement?

    struct TemporalContext {
        let year: Int?
        let location: String?
        let keywords: [String]
    }

    struct TemporalEnhancement: Codable {
        let enhancedNarrative: String
        let decade: Int?
        let culturalMarkers: [String]
        let visualPalette: String?
    }

    func enhanceWithTemporalContext(
        transcription: String,
        context: TemporalContext
    ) async throws -> TemporalEnhancement {
        guard let year = context.year else {
            // No temporal info - return original
            return TemporalEnhancement(
                enhancedNarrative: transcription,
                decade: nil,
                culturalMarkers: [],
                visualPalette: nil
            )
        }

        isEnhancing = true
        defer { isEnhancing = false }

        let endpoint = "\(backendURL)/ai/contextualize"
        guard let url = URL(string: endpoint) else {
            throw TemporalError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60 // Temporal context can take time

        let requestBody: [String: Any] = [
            "transcription": transcription,
            "year": year,
            "location": context.location ?? "",
            "keywords": context.keywords
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw TemporalError.apiError
        }

        let result = try JSONDecoder().decode(TemporalEnhancement.self, from: data)

        await MainActor.run {
            self.lastEnhancement = result
        }

        return result
    }
}

enum TemporalError: LocalizedError {
    case invalidURL
    case apiError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid temporal context URL"
        case .apiError: return "Temporal context service error"
        }
    }
}
