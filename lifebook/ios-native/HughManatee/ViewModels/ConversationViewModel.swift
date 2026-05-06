import SwiftUI

@Observable
final class ConversationViewModel {
    enum ConvStatus {
        case loading, ready, live, ending, error
    }

    var status: ConvStatus = .loading
    var statusText = "Finding Hugh…"
    var firstTurn: String?
    var error: String?
    var turnCount = 0

    private let db = DatabaseService.shared
    private let worker = WorkerAPI.shared
    private let liveKit = LiveKitService()

    private var currentSessionId: String?
    private var turnOrdinal = 0
    private var turnsBuffer: [(speaker: String, text: String)] = []
    private var started = false
    private var ended = false
    private var turnTask: Task<Void, Never>?
    private var agentTask: Task<Void, Never>?
    private var statusTask: Task<Void, Never>?

    func startSession() {
        guard !started, !ended else { return }
        started = true

        Task {
            do {
                guard let profile = try await db.getProfile() else {
                    await setError("No profile found")
                    return
                }

                let lastAnchor = try await db.getLastAnchor()

                let cfg = try await worker.fetchAgentConfig(AgentConfigRequest(
                    firstName: profile.firstName,
                    birthYear: profile.birthYear,
                    hometown: profile.hometown,
                    voiceId: profile.voiceId,
                    lastAnchor: lastAnchor
                ))

                await MainActor.run {
                    firstTurn = cfg.first_turn
                    status = .ready
                    statusText = "Opening the mic…"
                }

                // Create session in DB
                let session = try await db.createSession(promptVersion: "agent-2026-05-06")
                currentSessionId = session.id

                // Connect LiveKit
                await liveKit.connect(token: cfg.conversation_token)

                // Collect turns
                turnTask = Task {
                    for await turn in liveKit.turns {
                        turnsBuffer.append((turn.speaker, turn.text))
                        guard let sid = currentSessionId else { continue }
                        turnOrdinal += 1
                        try? await db.appendTurn(
                            sessionId: sid,
                            speaker: turn.speaker,
                            text: turn.text,
                            ordinal: turnOrdinal
                        )
                        await MainActor.run { turnCount = turnOrdinal }
                    }
                }

                // Watch agent speaking state
                agentTask = Task {
                    while !Task.isCancelled {
                        await MainActor.run {
                            if status == .live {
                                statusText = liveKit.agentSpeaking ? "Hugh is speaking." : "Hugh is listening."
                            }
                        }
                        try? await Task.sleep(for: .milliseconds(200))
                    }
                }

                // Wait for connection
                statusTask = Task {
                    // Brief delay for LiveKit to connect
                    try? await Task.sleep(for: .seconds(1))
                    await MainActor.run {
                        if liveKit.status == .connected {
                            status = .live
                            statusText = "Hugh is listening."
                        }
                    }
                }

            } catch {
                await setError(error.localizedDescription)
            }
        }
    }

    func endSession() {
        guard !ended else { return }
        ended = true

        Task {
            await MainActor.run {
                status = .ending
                statusText = "Saving the memory…"
            }

            turnTask?.cancel()
            agentTask?.cancel()
            statusTask?.cancel()

            await liveKit.disconnect()

            guard let sid = currentSessionId else { return }

            var title: String? = nil
            var anchor: String? = nil

            let tail = turnsBuffer.suffix(10)
            if !tail.isEmpty {
                let payload = AnchorRequest(turns: tail.map {
                    TurnPayload(speaker: $0.speaker, text: $0.text)
                })
                if let anchorRes = try? await worker.fetchSessionAnchor(payload) {
                    title = anchorRes.title_suggestion
                    anchor = anchorRes.anchor_phrase
                }
            }

            try? await db.endSession(id: sid, title: title, anchorPhrase: anchor)
        }
    }

    func setMuted(_ muted: Bool) {
        liveKit.setMuted(muted)
    }

    @MainActor
    private func setError(_ msg: String) {
        status = .error
        statusText = "Couldn't reach Hugh."
        error = msg
    }
}
