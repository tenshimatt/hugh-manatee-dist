//
// ChatManager_Fallback.swift - Fallback version without OpenAI import
//
import Foundation

class ChatManager: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false
    @Published var sessionSummary: String = ""
    
    private let encryptionManager = EncryptionManager()
    
    init() {
        print("🚀 ChatManager initialized in fallback mode")
        print("⚠️ OpenAI package not available - using demo responses only")
    }
    
    func sendMessage(_ content: String) async {
        let userMessage = ChatMessage(content: content, isUser: true)
        await MainActor.run {
            messages.append(userMessage)
            isLoading = true
        }
        
        await handleDemoResponse()
    }
    
    private func handleDemoResponse() async {
        try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 second delay
        
        let demoResponses = [
            "Hello! I'm Knome, your digital wellness companion. I'm here to listen and support you.",
            "That sounds like you're going through a lot. How are you feeling about everything right now?",
            "I understand. It's completely normal to feel that way. What would help you feel a bit better today?",
            "Remember, you're not alone in this. Taking small steps is perfectly okay. What's one small thing that usually makes you smile?",
            "Thank you for sharing that with me. Your feelings are valid, and it's brave of you to talk about them.",
            "That's a great insight! Sometimes just recognizing how we feel is the first step toward feeling better."
        ]
        
        let response = demoResponses.randomElement() ?? "I hear you. Tell me more about that."
        
        let assistantMessage = ChatMessage(content: response, isUser: false)
        await MainActor.run {
            messages.append(assistantMessage)
            isLoading = false
        }
    }
    
    func loadSessionSummary() {
        sessionSummary = encryptionManager.loadSessionSummary() ?? ""
        if !sessionSummary.isEmpty {
            print("📝 Loaded session summary: \(sessionSummary.prefix(50))...")
        }
    }
    
    func clearMessages() {
        messages.removeAll()
        print("🗑️ Cleared all messages")
    }
    
    func exportConversation() -> String {
        return messages.map { "\($0.isUser ? "User" : "Knome"): \($0.content)" }.joined(separator: "\n\n")
    }
}
