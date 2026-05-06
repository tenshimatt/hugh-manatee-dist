import Foundation

// MARK: - Worker API Models (matching TypeScript worker.ts 1:1)

struct AgentConfigRequest: Codable {
    let first_name: String
    let birth_year: Int?
    let hometown: String?
    let voice_id: String
    let last_anchor: String?
    let preference: String?

    init(firstName: String, birthYear: Int?, hometown: String?, voiceId: String, lastAnchor: String?) {
        self.first_name = firstName
        self.birth_year = birthYear
        self.hometown = hometown
        self.voice_id = voiceId
        self.last_anchor = lastAnchor
        self.preference = nil
    }
}

struct AgentConfigResponse: Codable {
    let agent_id: String
    let conversation_token: String
    let first_turn: String
    let runtime_context: RuntimeContext
}

struct RuntimeContext: Codable {
    let seed_prompts: [String]
    let era_hooks: [String]
}

struct CollageRequest: Codable {
    let birth_year: Int?
    let hometown: String?
    let theme: String?
}

struct CollageResponse: Codable {
    let images: [CollageImage]
    let gradient: GradientColors
}

struct CollageImage: Codable {
    let url: String
    let alt: String
}

struct GradientColors: Codable {
    let from: String
    let to: String
}

struct AnchorRequest: Codable {
    let turns: [TurnPayload]
}

struct TurnPayload: Codable {
    let speaker: String
    let text: String
}

struct AnchorResponse: Codable {
    let anchor_phrase: String
    let title_suggestion: String
    let entities: [ExtractedEntity]
}

struct ExtractedEntity: Codable {
    let kind: String
    let value: String
}

struct WorkerError: Codable {
    let error: String
}

// MARK: - Voice Option

struct VoiceOption: Identifiable, Equatable {
    let id: String
    let voiceId: String
    let agentId: String
    let label: String
    let description: String

    init(voiceId: String, agentId: String, label: String, description: String) {
        self.id = voiceId
        self.voiceId = voiceId
        self.agentId = agentId
        self.label = label
        self.description = description
    }
}

let placeholderVoices: [VoiceOption] = [
    VoiceOption(voiceId: "voice-warm-female-01", agentId: "agent-warm-female-01",
                label: "Nora", description: "Warm, calm. A friend over tea."),
    VoiceOption(voiceId: "voice-warm-male-01", agentId: "agent-warm-male-01",
                label: "Arthur", description: "Steady, gentle. An older friend."),
    VoiceOption(voiceId: "voice-bright-female-01", agentId: "agent-bright-female-01",
                label: "June", description: "Brighter, curious. Asks good questions."),
]
