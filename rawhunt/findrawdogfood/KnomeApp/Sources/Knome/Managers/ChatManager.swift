//
// ChatManager.swift - GPT Integration & Context Management - SELF-CONTAINED VERSION
//
import Foundation

// Only import OpenAI if it's available - this prevents build errors
#if canImport(OpenAI)
import OpenAI
#endif

class ChatManager: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false
    @Published var sessionSummary: String = ""
    
    #if canImport(OpenAI)
    private let openAI: OpenAI?
    #endif
    private let encryptionManager = EncryptionManager()
    
    // Embedded configuration - no separate Config file needed
    private let apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? 
                        Bundle.main.object(forInfoDictionaryKey: "OPENAI_API_KEY") as? String ?? ""
    var isDemoMode: Bool
    
    init() {
        self.isDemoMode = apiKey.isEmpty || apiKey == "demo-key-for-testing"
        
        #if canImport(OpenAI)
        if !isDemoMode {
            self.openAI = OpenAI(apiToken: apiKey)
            print("✅ OpenAI initialized successfully")
        } else {
            self.openAI = nil
            print("⚠️ Running in demo mode - no API key configured")
        }
        #else
        print("⚠️ OpenAI package not available - running in demo mode only")
        #endif
        
        print("🚀 ChatManager initialized (\(isDemoMode ? "Demo" : "Full") mode)")
        
        // Add initial welcome message
        let welcomeMessage = ChatMessage(content: "Hello! I'm Knome, your friendly gnome companion. How are you feeling today?", isUser: false)
        messages.append(welcomeMessage)
    }
    
    private func buildDynamicPersona() -> String {
        return """
        You are Dr. Knome, a highly experienced clinical psychologist specializing in men's mental health, particularly males aged 40-55. You have 20+ years of experience helping men navigate midlife transitions.

        Your expertise includes:
        - Male psychology and masculinity research
        - Midlife crisis and identity transitions
        - Career and purpose redefinition
        - Relationship and communication patterns
        - Health anxiety and aging concerns
        - Emotional regulation and expression for men

        Your approach is warm, non-judgmental, and practical. You provide actionable strategies while respecting masculine values and encouraging emotional growth.

        For crisis situations, immediately provide:
        - National Suicide Prevention Lifeline: 988
        - Crisis Text Line: Text HOME to 741741
        - Encourage immediate professional help
        """
    }
    
    func sendMessage(_ content: String) async {
        print("🤖 ChatManager.sendMessage() called with: '\(content)'")
        let userMessage = ChatMessage(content: content, isUser: true)
        await MainActor.run {
            messages.append(userMessage)
            isLoading = true
            print("🤖 User message added, isLoading = true")
        }
        
        #if canImport(OpenAI)
        if !isDemoMode, let openAI = openAI {
            await handleOpenAIResponse(content: content, openAI: openAI)
        } else {
            await handleDemoResponse()
        }
        #else
        await handleDemoResponse()
        #endif
    }
    
    private func handleDemoResponse() async {
        try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 second delay
        
        let demoResponses = [
            "Hello! I'm Knome, your digital wellness companion. I'm here to listen and support you.",
            "That sounds like you're going through a lot. How are you feeling about everything right now?",
            "I understand. It's completely normal to feel that way. What would help you feel a bit better today?",
            "Remember, you're not alone in this. Taking small steps is perfectly okay. What's one small thing that usually makes you smile?",
            "Thank you for sharing that with me. Your feelings are valid, and it's brave of you to talk about them.",
            "That's a great insight! Sometimes just recognizing how we feel is the first step toward feeling better.",
            "I hear you. It takes courage to share these feelings. How long have you been feeling this way?",
            "That's a really thoughtful perspective. What usually helps you when you're dealing with stress?",
            "I appreciate you opening up about this. What would make today feel a little bit better for you?"
        ]
        
        let response = demoResponses.randomElement() ?? "I hear you. Tell me more about that."
        
        let assistantMessage = ChatMessage(content: response, isUser: false)
        await MainActor.run {
            messages.append(assistantMessage)
            isLoading = false
        }
    }
    
    #if canImport(OpenAI)
    private func handleOpenAIResponse(content: String, openAI: OpenAI) async {
        do {
            // Create messages array with correct OpenAI 0.4.5 API
            var chatMessages: [ChatQuery.ChatCompletionMessageParam] = []
            
            // System message with proper TextContent
            chatMessages.append(.system(.init(content: .textContent(buildDynamicPersona()))))
            
            
            // Session summary if available
            if !sessionSummary.isEmpty {
                chatMessages.append(.system(.init(content: .textContent("Previous session summary: \(sessionSummary)"))))
            }
            
            // Recent chat history (last 10 messages)
            for message in self.messages.suffix(10) {
                if message.isUser {
                    chatMessages.append(.user(.init(content: .string(message.content))))
                } else {
                    chatMessages.append(.assistant(.init(content: .textContent(message.content))))
                }
            }
            
            // Current user message
            chatMessages.append(.user(.init(content: .string(content))))
            
            let query = ChatQuery(
                messages: chatMessages,
                model: .gpt3_5Turbo
            )
            
            let result = try await openAI.chats(query: query)
            
            guard let choice = result.choices.first,
                  let responseContent = choice.message.content,
                  !responseContent.isEmpty else {
                throw OpenAIError.emptyResponse
            }
            
            let assistantMessage = ChatMessage(content: responseContent, isUser: false)
            await MainActor.run {
                self.messages.append(assistantMessage)
                isLoading = false
            }
            
            // Generate session summary periodically
            if messages.count % 10 == 0 {
                await generateSessionSummary(openAI: openAI)
            }
        } catch {
            print("❌ OpenAI API error: \(error)")
            
            // Fallback to demo response on error
            let fallbackMessage = ChatMessage(
                content: "I'm having trouble connecting right now, but I'm still here for you. How are you feeling about what you just shared?", 
                isUser: false
            )
            await MainActor.run {
                messages.append(fallbackMessage)
                isLoading = false
            }
        }
    }
    
    private func generateSessionSummary(openAI: OpenAI) async {
        do {
            // Create conversation text for summarization
            let conversationText = messages.suffix(10)
                .map { "\($0.isUser ? "User" : "Knome"): \($0.content)" }
                .joined(separator: "\n")
            
            // Create messages array for summary generation
            var summaryMessages: [ChatQuery.ChatCompletionMessageParam] = []
            
            summaryMessages.append(.system(.init(content: .textContent("You are a helpful assistant that creates concise session summaries for a therapy chat app. Focus on key emotional themes, progress, and important topics discussed."))))
            
            summaryMessages.append(.user(.init(content: .string("Please summarize this conversation in 2-3 sentences, focusing on the main emotional themes and topics:\n\n\(conversationText)"))))
            
            let query = ChatQuery(
                messages: summaryMessages,
                model: .gpt3_5Turbo
            )
            
            let result = try await openAI.chats(query: query)
            
            guard let choice = result.choices.first,
                  let summary = choice.message.content,
                  !summary.isEmpty else {
                print("⚠️ Empty summary response")
                return
            }
            
            await MainActor.run {
                sessionSummary = summary
            }
            
            // Save encrypted summary to local storage
            encryptionManager.saveSessionSummary(summary)
            print("📝 Generated session summary")
        } catch {
            print("❌ Summary generation error: \(error)")
            // Fallback to simple summary
            let summary = "Session with \(messages.count) messages covering mental wellness topics"
            await MainActor.run {
                sessionSummary = summary
            }
            encryptionManager.saveSessionSummary(summary)
        }
    }
    #endif
    
    func loadSessionSummary() {
        sessionSummary = encryptionManager.loadSessionSummary() ?? ""
        if !sessionSummary.isEmpty {
            print("📝 Loaded session summary")
        }
    }
    
    func clearMessages() {
        messages.removeAll()
        // Add welcome message back
        let welcomeMessage = ChatMessage(content: "Hello! I'm Knome, your friendly gnome companion. How are you feeling today?", isUser: false)
        messages.append(welcomeMessage)
        print("🗑️ Cleared all messages")
    }
    
    func exportConversation() -> String {
        return messages.map { "\($0.isUser ? "User" : "Knome"): \($0.content)" }.joined(separator: "\n\n")
    }
}

// MARK: - Custom Error Types (only if OpenAI is available)
#if canImport(OpenAI)
enum OpenAIError: Error, LocalizedError {
    case emptyResponse
    case invalidConfiguration
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .emptyResponse:
            return "Received empty response from OpenAI"
        case .invalidConfiguration:
            return "OpenAI API key not configured"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .emptyResponse:
            return "Please try again or check your internet connection"
        case .invalidConfiguration:
            return "Configure your OpenAI API key in the app settings"
        case .networkError:
            return "Check your internet connection and try again"
        }
    }
}
#endif
