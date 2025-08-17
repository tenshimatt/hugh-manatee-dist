//
// OpenAIService.swift - OpenAI API Service Layer
//
import Foundation

// MARK: - OpenAI Models
struct ChatCompletionRequest: Encodable {
    let model: String
    let messages: [ChatCompletionMessage]
    let temperature: Double?
    let maxTokens: Int?
    let stream: Bool?
    
    enum CodingKeys: String, CodingKey {
        case model
        case messages
        case temperature
        case maxTokens = "max_tokens"
        case stream
    }
}

struct ChatCompletionMessage: Codable {
    let role: String
    let content: String
}

struct ChatCompletionResponse: Decodable {
    let id: String
    let object: String
    let created: Int
    let model: String
    let choices: [Choice]
    let usage: Usage?
    
    struct Choice: Decodable {
        let index: Int
        let message: ChatCompletionMessage
        let finishReason: String?
        
        enum CodingKeys: String, CodingKey {
            case index
            case message
            case finishReason = "finish_reason"
        }
    }
    
    struct Usage: Decodable {
        let promptTokens: Int
        let completionTokens: Int
        let totalTokens: Int
        
        enum CodingKeys: String, CodingKey {
            case promptTokens = "prompt_tokens"
            case completionTokens = "completion_tokens"
            case totalTokens = "total_tokens"
        }
    }
}

// MARK: - Chat Context
struct ChatContext {
    let messages: [ChatMessage]
    let sessionSummary: String
    let userPreferences: UserPreferences?
}

struct UserPreferences: Codable {
    let preferredName: String?
    let communicationStyle: CommunicationStyle
    let topics: [String]
    
    enum CommunicationStyle: String, Codable {
        case casual = "casual"
        case formal = "formal"
        case supportive = "supportive"
        case direct = "direct"
    }
}

// MARK: - OpenAI Service Protocol
protocol ChatServiceProtocol {
    func sendMessage(_ content: String, context: ChatContext) async throws -> ChatCompletionResponse
}

// MARK: - OpenAI Service Implementation
@MainActor
class OpenAIService: ObservableObject, ChatServiceProtocol {
    private let apiClient: APIClient
    private let rateLimiter: RateLimiter
    private let cache: ResponseCache
    private let apiKey: String
    
    init(apiKey: String, configuration: APIConfiguration = .production()) {
        self.apiKey = apiKey
        self.apiClient = APIClient(configuration: configuration)
        self.rateLimiter = RateLimiter()
        self.cache = ResponseCache()
    }
    
    func sendMessage(_ content: String, context: ChatContext) async throws -> ChatCompletionResponse {
        // Check rate limits
        try await rateLimiter.checkLimit(for: .chatCompletion)
        
        // Build messages array
        var messages = [ChatCompletionMessage]()
        
        // System message with persona and context
        let systemMessage = buildSystemMessage(context: context)
        messages.append(ChatCompletionMessage(role: "system", content: systemMessage))
        
        // Add conversation history (limit to last 10 messages for context window)
        let recentMessages = Array(context.messages.suffix(10))
        for message in recentMessages {
            messages.append(ChatCompletionMessage(
                role: message.isUser ? "user" : "assistant",
                content: message.content
            ))
        }
        
        // Add current message
        messages.append(ChatCompletionMessage(role: "user", content: content))
        
        // Create request
        let request = ChatCompletionAPIRequest(
            apiKey: apiKey,
            model: "gpt-4-turbo-preview",
            messages: messages,
            temperature: 0.7,
            maxTokens: 500
        )
        
        // Execute request
        let response = try await apiClient.execute(request, responseType: ChatCompletionResponse.self)
        
        // Update rate limiter with token usage
        if let usage = response.usage {
            await rateLimiter.updateTokenUsage(usage.totalTokens)
        }
        
        return response
    }
    
    private func buildSystemMessage(context: ChatContext) -> String {
        var systemMessage = """
        You are Knome, a wise, empathetic digital gnome therapist. You specialize in men's mental wellness, particularly men aged 40-55. Your personality is:
        - Warm, non-judgmental, and trustworthy
        - Uses gentle humor when appropriate
        - Focuses on practical solutions and emotional support
        - Maintains professional boundaries while being approachable
        - Never provides medical advice, but offers coping strategies
        - Encourages seeking professional help when needed
        
        For crisis situations, immediately provide:
        - National Suicide Prevention Lifeline: 988
        - Crisis Text Line: Text HOME to 741741
        - Encourage immediate professional help
        
        Keep responses conversational, typically 2-3 sentences unless more detail is specifically requested.
        """
        
        
        if !context.sessionSummary.isEmpty {
            systemMessage += "\n\nPrevious session context: \(context.sessionSummary)"
        }
        
        if let preferences = context.userPreferences {
            if let name = preferences.preferredName {
                systemMessage += "\n\nAddress the user as \(name)."
            }
            systemMessage += "\nCommunication style preference: \(preferences.communicationStyle.rawValue)"
        }
        
        return systemMessage
    }
}

// MARK: - API Request Implementation
struct ChatCompletionAPIRequest: APIRequest {
    let apiKey: String
    let model: String
    let messages: [ChatCompletionMessage]
    let temperature: Double?
    let maxTokens: Int?
    
    var path: String {
        return "chat/completions"
    }
    
    var method: HTTPMethod {
        return .post
    }
    
    var headers: [String: String]? {
        return ["Authorization": "Bearer \(apiKey)"]
    }
    
    var body: Data? {
        let request = ChatCompletionRequest(
            model: model,
            messages: messages,
            temperature: temperature,
            maxTokens: maxTokens,
            stream: false
        )
        return try? JSONEncoder().encode(request)
    }
    
    var queryItems: [URLQueryItem]? {
        return nil
    }
}