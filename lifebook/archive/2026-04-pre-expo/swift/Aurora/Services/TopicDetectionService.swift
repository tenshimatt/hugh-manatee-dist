import Foundation
import Combine

// MARK: - Topic Detection Service
// Analyzes transcription to detect conversation topic and adapt prompts
@MainActor
class TopicDetectionService: ObservableObject {
    static let shared = TopicDetectionService()

    // SECURE: Backend proxy URL (no API key in app!)
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var currentTopic: String = "life"
    @Published var topicConfidence: Double = 0.0
    @Published var isDetecting = false

    // Cache to avoid redundant API calls
    private var lastTranscription: String = ""
    private var lastDetectionTime: Date = .distantPast
    private let minDetectionInterval: TimeInterval = 30.0 // Detect every 30 seconds

    private init() {}

    // MARK: - Topic Detection

    func detectTopic(from transcription: String) async {
        // Skip if transcription is too short
        guard transcription.count > 50 else { return }

        // Skip if we just detected recently (throttle)
        let timeSinceLastDetection = Date().timeIntervalSince(lastDetectionTime)
        guard timeSinceLastDetection >= minDetectionInterval else { return }

        // Skip if transcription hasn't changed much
        let similarity = calculateSimilarity(lastTranscription, transcription)
        guard similarity < 0.8 else { return } // Less than 80% similar = new content

        isDetecting = true
        defer { isDetecting = false }

        do {
            let result = try await callBackendDetectTopic(transcription: transcription)

            await MainActor.run {
                currentTopic = result.topic
                topicConfidence = result.confidence
                lastTranscription = transcription
                lastDetectionTime = Date()

                print("[TopicDetection] 🎯 Detected topic: \(result.topic) (confidence: \(Int(result.confidence * 100))%)")
            }
        } catch {
            print("[TopicDetection] ⚠️ Failed to detect topic: \(error.localizedDescription)")
        }
    }

    // MARK: - Backend API Call

    private func callBackendDetectTopic(transcription: String) async throws -> TopicResult {
        let endpoint = "\(backendURL)/ai/detect-topic"
        guard let url = URL(string: endpoint) else {
            throw TopicError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10.0 // Quick timeout for live detection

        let requestBody: [String: String] = [
            "transcription": transcription
        ]

        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TopicError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw TopicError.apiError(statusCode: httpResponse.statusCode)
        }

        struct BackendResponse: Codable {
            let topic: String
            let confidence: Double
            let keywords: [String]?
        }

        let decoder = JSONDecoder()
        let backendResponse = try decoder.decode(BackendResponse.self, from: data)

        return TopicResult(
            topic: backendResponse.topic,
            confidence: backendResponse.confidence,
            keywords: backendResponse.keywords ?? []
        )
    }

    // MARK: - Helper Functions

    private func calculateSimilarity(_ str1: String, _ str2: String) -> Double {
        let words1 = Set(str1.lowercased().split(separator: " "))
        let words2 = Set(str2.lowercased().split(separator: " "))

        let intersection = words1.intersection(words2)
        let union = words1.union(words2)

        guard !union.isEmpty else { return 0 }

        return Double(intersection.count) / Double(union.count)
    }

    // MARK: - Reset

    func reset() {
        currentTopic = "life"
        topicConfidence = 0.0
        lastTranscription = ""
        lastDetectionTime = .distantPast
    }

    // MARK: - Types

    struct TopicResult {
        let topic: String
        let confidence: Double
        let keywords: [String]
    }

    enum TopicError: LocalizedError {
        case invalidResponse
        case apiError(statusCode: Int)

        var errorDescription: String? {
            switch self {
            case .invalidResponse:
                return "Invalid response from topic detection"
            case .apiError(let code):
                return "Topic detection error (code: \(code))"
            }
        }
    }
}
