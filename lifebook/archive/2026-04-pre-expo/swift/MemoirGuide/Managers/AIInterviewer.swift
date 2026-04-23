// AIInterviewer.swift
// AI-powered conversation guide for memoir recording

import Foundation
import Combine

@MainActor
class AIInterviewer: ObservableObject {
    @Published var currentPrompt = ""
    @Published var isThinking = false
    @Published var conversationHistory: [ConversationTurn] = []
    
    // IMPORTANT: Store API key securely in production
    // Use Keychain or environment variables, never hardcode
    private let apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
    private let apiURL = "https://api.openai.com/v1/chat/completions"
    private var cancellables = Set<AnyCancellable>()
    
    struct ConversationTurn {
        let role: String // "user" or "assistant"
        let content: String
        let timestamp: Date
    }
    
    private let systemPrompt = """
    You are a gentle, patient interviewer helping an elderly person tell their life story.
    Your role is to:
    1. Ask one simple, clear question at a time
    2. Listen with empathy and show genuine interest
    3. Gently guide them through their memories
    4. Offer encouragement when they pause
    5. Help them organize their thoughts chronologically
    6. Notice important people, places, and events they mention
    7. Ask follow-up questions to get more details about significant moments
    
    Topics to explore over time:
    - Childhood and family
    - School and education
    - First job and career
    - Love and relationships
    - Children and parenting
    - Challenges overcome
    - Proudest achievements
    - Life lessons learned
    - Advice for future generations
    
    Keep your responses short (1-2 sentences) and conversational.
    Never rush. Let them take their time.
    If they seem tired or emotional, suggest taking a break.
    """
    
    func getInitialPrompt() async -> String {
        let prompts = [
            "Hello! I'm here to help you tell your story. Let's start simple - what's your name?",
            "Welcome! I'd love to hear your story. Could you tell me your name and where you're from?",
            "Hi there! I'm here to help capture your memories. What would you like to be called?",
            "Hello! Let's begin your story. What's your name, and when were you born?"
        ]
        
        currentPrompt = prompts.randomElement() ?? prompts[0]
        
        // Add to history
        conversationHistory.append(ConversationTurn(
            role: "assistant",
            content: currentPrompt,
            timestamp: Date()
        ))
        
        return currentPrompt
    }
    
    func generateFollowUp(from userResponse: String) async throws -> String {
        isThinking = true
        defer { isThinking = false }
        
        // Add user response to history
        conversationHistory.append(ConversationTurn(
            role: "user",
            content: userResponse,
            timestamp: Date()
        ))
        
        // Detect entities for smart follow-up
        let entities = detectEntities(in: userResponse)
        
        // Build messages for API
        var messages: [[String: String]] = [
            ["role": "system", "content": systemPrompt]
        ]
        
        // Add recent history (last 10 turns to keep context manageable)
        for turn in conversationHistory.suffix(10) {
            messages.append([
                "role": turn.role,
                "content": turn.content
            ])
        }
        
        // Add context about detected entities
        if !entities.isEmpty {
            let context = "User mentioned: \(entities.joined(separator: ", ")). Consider asking more about one of these."
            messages.append(["role": "system", "content": context])
        }
        
        // Make API request
        let response = try await callOpenAI(messages: messages)
        
        currentPrompt = response
        
        // Add to history
        conversationHistory.append(ConversationTurn(
            role: "assistant",
            content: response,
            timestamp: Date()
        ))
        
        return response
    }
    
    func generateSilencePrompt(afterSeconds: TimeInterval) async -> String {
        let prompts = [
            "Take your time... there's no rush.",
            "Would you like to tell me more about that?",
            "That's interesting... what happened next?",
            "How did that make you feel?",
            "Would you like to talk about something else?",
            "Should we take a little break?",
            "Is there anything else you remember about that?",
            "Take all the time you need to gather your thoughts."
        ]
        
        if afterSeconds > 10 {
            return "Would you like to stop for now? We can continue anytime you're ready."
        } else if afterSeconds > 7 {
            return prompts.randomElement() ?? prompts[0]
        } else {
            return "" // Don't prompt too quickly
        }
    }
    
    func shouldCreateChapterBreak(after segments: [MemoirSegment]) async -> Bool {
        guard segments.count >= 3 else { return false }
        
        // Analyze last few segments for topic change
        let recentText = segments.suffix(3).map { $0.transcription }.joined(separator: " ")
        
        // Simple heuristic - look for major time transitions
        let timeMarkers = ["years later", "after that", "when I was", "in 19", "in 20", "then came", "next chapter"]
        
        for marker in timeMarkers {
            if recentText.lowercased().contains(marker) {
                return true
            }
        }
        
        // Check word count
        let totalWords = segments.reduce(0) { $0 + $1.wordCount }
        if totalWords > 2000 {
            return true // Natural break every ~2000 words
        }
        
        return false
    }
    
    private func detectEntities(in text: String) -> [String] {
        var entities: [String] = []
        
        // Simple entity detection (replace with NLP library in production)
        let words = text.split(separator: " ").map { String($0) }
        
        for (index, word) in words.enumerated() {
            // Detect names (capitalized words not at sentence start)
            if word.first?.isUppercase == true && index > 0 {
                entities.append(word)
            }
            
            // Detect years
            if word.count == 4, Int(word) != nil, word.hasPrefix("19") || word.hasPrefix("20") {
                entities.append(word)
            }
        }
        
        return Array(Set(entities)) // Remove duplicates
    }
    
    private func callOpenAI(messages: [[String: String]]) async throws -> String {
        var request = URLRequest(url: URL(string: apiURL)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "model": "gpt-4-turbo-preview",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 150
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let choices = json["choices"] as? [[String: Any]],
           let firstChoice = choices.first,
           let message = firstChoice["message"] as? [String: Any],
           let content = message["content"] as? String {
            return content.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        throw AppError.networkUnavailable
    }
    
    func generateChapterTitle(for segments: [MemoirSegment]) async -> String {
        let combinedText = segments.prefix(3).map { $0.transcription }.joined(separator: " ")
        
        let prompt = """
        Generate a short, meaningful chapter title (3-5 words) for this memoir section:
        
        \(combinedText.prefix(500))
        
        Title:
        """
        
        let messages = [
            ["role": "system", "content": "You are a memoir editor. Create concise, evocative chapter titles."],
            ["role": "user", "content": prompt]
        ]
        
        do {
            return try await callOpenAI(messages: messages)
        } catch {
            // Fallback titles
            let fallbacks = ["Early Years", "Growing Up", "New Beginnings", "Life Changes", "Looking Back"]
            return fallbacks.randomElement() ?? "Chapter"
        }
    }
}
