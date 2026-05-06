import Foundation

/// Thin client for the Hugh Manatee Cloudflare Worker.
/// Mirrors app/src/services/worker.ts 1:1.
final class WorkerAPI {
    static let shared = WorkerAPI()

    private let baseURL = "https://hugh-manatee-worker.findrawdogfood.workers.dev"
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private init() {}

    func fetchAgentConfig(_ req: AgentConfigRequest) async throws -> AgentConfigResponse {
        return try await post("/agent/config", body: req)
    }

    func fetchCollageImages(_ req: CollageRequest) async throws -> CollageResponse {
        return try await post("/collage/images", body: req)
    }

    func fetchSessionAnchor(_ req: AnchorRequest) async throws -> AnchorResponse {
        return try await post("/session/anchor", body: req)
    }

    private func post<T: Codable, R: Codable>(_ path: String, body: T) async throws -> R {
        let url = URL(string: "\(baseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw WorkerError.invalidResponse
        }

        guard (200...299).contains(http.statusCode) else {
            let err = try? decoder.decode(WorkerError.self, from: data)
            throw WorkerError.httpError(status: http.statusCode, message: err?.error ?? "Unknown")
        }

        return try decoder.decode(R.self, from: data)
    }

    enum WorkerError: Error, LocalizedError {
        case invalidResponse
        case httpError(status: Int, message: String)

        var errorDescription: String? {
            switch self {
            case .invalidResponse: return "Couldn't reach Hugh's server."
            case .httpError(let status, let msg): return "Server error (\(status)): \(msg)"
            }
        }
    }
}
