//
// APIClient.swift - Core API Client with retry logic and error handling
//
import Foundation

// MARK: - API Configuration
struct APIConfiguration {
    let baseURL: URL
    let apiVersion: String
    let timeoutInterval: TimeInterval
    let maxRetryAttempts: Int
    let rateLimits: RateLimitConfiguration
    
    static func production() -> APIConfiguration {
        return APIConfiguration(
            baseURL: URL(string: "https://api.openai.com")!,
            apiVersion: "v1",
            timeoutInterval: 30,
            maxRetryAttempts: 3,
            rateLimits: RateLimitConfiguration(
                requestsPerMinute: 60,
                tokensPerMinute: 60000
            )
        )
    }
    
    static func demo() -> APIConfiguration {
        return APIConfiguration(
            baseURL: URL(string: "https://demo.api.local")!,
            apiVersion: "v1",
            timeoutInterval: 5,
            maxRetryAttempts: 1,
            rateLimits: RateLimitConfiguration(
                requestsPerMinute: 100,
                tokensPerMinute: 100000
            )
        )
    }
}

struct RateLimitConfiguration {
    let requestsPerMinute: Int
    let tokensPerMinute: Int
}

// MARK: - API Errors
enum APIError: Error, LocalizedError {
    case networkError(underlying: Error)
    case httpError(statusCode: Int, data: Data?)
    case rateLimitExceeded(retryAfter: TimeInterval?)
    case authenticationFailed
    case decodingError(underlying: Error)
    case timeout
    case noData
    case invalidURL
    case unknown(underlying: Error)
    
    var isRetryable: Bool {
        switch self {
        case .networkError, .timeout:
            return true
        case .httpError(let code, _):
            return code >= 500 || code == 429
        case .rateLimitExceeded:
            return true
        default:
            return false
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .networkError, .timeout:
            return "Connection issue. Please check your internet and try again."
        case .httpError(let code, _):
            return "Server error (Code: \(code)). Please try again."
        case .rateLimitExceeded:
            return "Too many requests. Please wait a moment before trying again."
        case .authenticationFailed:
            return "Authentication failed. Please check your API key."
        case .decodingError:
            return "Failed to process server response."
        case .noData:
            return "No data received from server."
        case .invalidURL:
            return "Invalid request URL."
        case .unknown:
            return "An unexpected error occurred."
        }
    }
}

// MARK: - Retry Policy
struct RetryPolicy {
    let maxAttempts: Int
    let backoffStrategy: BackoffStrategy
    
    enum BackoffStrategy {
        case constant(delay: TimeInterval)
        case linear(baseDelay: TimeInterval)
        case exponential(baseDelay: TimeInterval, multiplier: Double)
        
        func delay(for attempt: Int) -> TimeInterval {
            switch self {
            case .constant(let delay):
                return delay
            case .linear(let baseDelay):
                return baseDelay * Double(attempt + 1)
            case .exponential(let baseDelay, let multiplier):
                return baseDelay * pow(multiplier, Double(attempt))
            }
        }
    }
    
    static var `default`: RetryPolicy {
        return RetryPolicy(
            maxAttempts: 3,
            backoffStrategy: .exponential(baseDelay: 1.0, multiplier: 2.0)
        )
    }
}

// MARK: - API Client
@MainActor
class APIClient: ObservableObject {
    private let session: URLSession
    private let configuration: APIConfiguration
    private let retryPolicy: RetryPolicy
    
    @Published var isLoading = false
    @Published var lastError: APIError?
    
    init(configuration: APIConfiguration = .production(),
         retryPolicy: RetryPolicy = .default) {
        self.configuration = configuration
        self.retryPolicy = retryPolicy
        
        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = configuration.timeoutInterval
        sessionConfig.timeoutIntervalForResource = configuration.timeoutInterval * 2
        sessionConfig.waitsForConnectivity = true
        sessionConfig.allowsCellularAccess = true
        
        self.session = URLSession(configuration: sessionConfig)
    }
    
    // MARK: - Request Execution
    func execute<T: Decodable>(_ request: APIRequest, responseType: T.Type) async throws -> T {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let data = try await executeWithRetry(request)
            return try JSONDecoder().decode(T.self, from: data)
        } catch let error as APIError {
            lastError = error
            throw error
        } catch {
            let apiError = APIError.unknown(underlying: error)
            lastError = apiError
            throw apiError
        }
    }
    
    private func executeWithRetry(_ request: APIRequest) async throws -> Data {
        var lastError: Error?
        
        for attempt in 0..<retryPolicy.maxAttempts {
            do {
                return try await performRequest(request)
            } catch let error as APIError {
                lastError = error
                
                guard error.isRetryable && attempt < retryPolicy.maxAttempts - 1 else {
                    throw error
                }
                
                let delay = retryPolicy.backoffStrategy.delay(for: attempt)
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            } catch {
                lastError = error
                
                guard attempt < retryPolicy.maxAttempts - 1 else {
                    throw APIError.unknown(underlying: error)
                }
                
                let delay = retryPolicy.backoffStrategy.delay(for: attempt)
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
        
        throw lastError ?? APIError.unknown(underlying: NSError(domain: "APIClient", code: -1))
    }
    
    private func performRequest(_ request: APIRequest) async throws -> Data {
        guard let urlRequest = try? request.buildURLRequest(baseURL: configuration.baseURL, 
                                                           apiVersion: configuration.apiVersion) else {
            throw APIError.invalidURL
        }
        
        do {
            let (data, response) = try await session.data(for: urlRequest)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.unknown(underlying: NSError(domain: "APIClient", code: -1))
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                return data
            case 401:
                throw APIError.authenticationFailed
            case 429:
                let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After")
                    .flatMap { TimeInterval($0) }
                throw APIError.rateLimitExceeded(retryAfter: retryAfter)
            default:
                throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
            }
        } catch let error as APIError {
            throw error
        } catch {
            if (error as NSError).code == NSURLErrorTimedOut {
                throw APIError.timeout
            } else {
                throw APIError.networkError(underlying: error)
            }
        }
    }
}

// MARK: - API Request Protocol
protocol APIRequest {
    var path: String { get }
    var method: HTTPMethod { get }
    var headers: [String: String]? { get }
    var body: Data? { get }
    var queryItems: [URLQueryItem]? { get }
}

extension APIRequest {
    func buildURLRequest(baseURL: URL, apiVersion: String) throws -> URLRequest {
        var components = URLComponents(url: baseURL.appendingPathComponent(apiVersion).appendingPathComponent(path), 
                                      resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems
        
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.httpBody = body
        
        // Default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Custom headers
        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        return request
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}