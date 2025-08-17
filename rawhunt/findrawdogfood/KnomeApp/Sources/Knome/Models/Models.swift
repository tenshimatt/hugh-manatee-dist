//
// Models.swift - Data Models - COMPLETE SELF-CONTAINED VERSION
//
import Foundation

struct ChatMessage: Identifiable, Codable, Equatable {
    let id: UUID
    let content: String
    let isUser: Bool
    let timestamp: Date
    
    init(id: UUID = UUID(), content: String, isUser: Bool, timestamp: Date = Date()) {
        self.id = id
        self.content = content
        self.isUser = isUser
        self.timestamp = timestamp
    }
    
    init(content: String, isUser: Bool) {
        self.id = UUID()
        self.content = content
        self.isUser = isUser
        self.timestamp = Date()
    }
    
    // Convenience computed properties
    var role: MessageRole {
        return isUser ? .user : .assistant
    }
    
    var isAssistant: Bool {
        return !isUser
    }
    
    // Equatable conformance (exclude timestamp and id for comparison)
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        return lhs.content == rhs.content && lhs.isUser == rhs.isUser
    }
}

// Message roles for OpenAI integration
enum MessageRole: String, Codable, CaseIterable {
    case user = "user"
    case assistant = "assistant"
    case system = "system"
    
    var displayName: String {
        switch self {
        case .user:
            return "You"
        case .assistant:
            return "Knome"
        case .system:
            return "System"
        }
    }
    
    var icon: String {
        switch self {
        case .user:
            return "person.circle.fill"
        case .assistant:
            return "brain.head.profile"
        case .system:
            return "gear.circle.fill"
        }
    }
}

// Extensions for convenience
extension ChatMessage {
    static func user(_ content: String) -> ChatMessage {
        return ChatMessage(content: content, isUser: true)
    }
    
    static func assistant(_ content: String) -> ChatMessage {
        return ChatMessage(content: content, isUser: false)
    }
}

struct User: Codable {
    let id: UUID
    var subscriptionTier: SubscriptionTier
    var dailyUsageMinutes: Int
    var monthlyUsageMinutes: Int
}

enum SubscriptionTier: String, CaseIterable, Codable {
    case free = "free"
    case basic = "basic"
    case pro = "pro"
    case premium = "premium"
    
    var dailyMessageLimit: Int {
        switch self {
        case .free: return 10
        case .basic: return 50
        case .pro: return 200
        case .premium: return -1 // Unlimited
        }
    }
    
    var dailyLimit: Int {
        switch self {
        case .free: return 0
        case .basic: return 5
        case .pro: return 15
        case .premium: return Int.max
        }
    }
    
    var monthlyLimit: Int {
        switch self {
        case .free: return 0
        case .basic: return 150
        case .pro: return 450
        case .premium: return Int.max
        }
    }
    
    var price: String {
        switch self {
        case .free: return "Free"
        case .basic: return "$4.99/month"
        case .pro: return "$9.99/month"
        case .premium: return "$19.99/month"
        }
    }
}


struct JournalEntry: Identifiable, Codable {
    let id: UUID
    let content: String
    let timestamp: Date
    
    init(content: String) {
        self.id = UUID()
        self.content = content
        self.timestamp = Date()
    }
}

// Array extensions for message handling
extension Array where Element == ChatMessage {
    var userMessages: [ChatMessage] {
        return self.filter { $0.isUser }
    }
    
    var assistantMessages: [ChatMessage] {
        return self.filter { $0.isAssistant }
    }
    
    var conversationHistory: String {
        return self.map { "\($0.role.displayName): \($0.content)" }.joined(separator: "\n\n")
    }
}
