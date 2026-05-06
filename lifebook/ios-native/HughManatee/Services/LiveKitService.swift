import Foundation
import LiveKit
import SwiftUI

/// ElevenLabs Conversational AI via LiveKit WebRTC.
/// The Worker fetches a conversation_token which is a LiveKit access token.
@Observable
final class LiveKitService {
    enum Status: Equatable {
        case idle
        case connecting
        case connected
        case disconnected(String?)
        case error(String)
    }

    struct TurnMessage {
        let speaker: String  // "user" | "hugh"
        let text: String
    }

    private(set) var status: Status = .idle
    private(set) var agentSpeaking = false
    private var room: Room?
    private var turnContinuation: AsyncStream<TurnMessage>.Continuation?
    private(set) var turns: AsyncStream<TurnMessage>!

    init() {
        var continuation: AsyncStream<TurnMessage>.Continuation!
        turns = AsyncStream { continuation = $0 }
        self.turnContinuation = continuation
    }

    @MainActor
    func connect(token: String) async {
        status = .connecting

        do {
            let newRoom = Room()

            newRoom.add(delegate: self)

            try await newRoom.connect(
                url: "wss://api.elevenlabs.io",
                token: token,
                connectOptions: ConnectOptions(
                    autoSubscribe: true
                )
            )

            room = newRoom
            status = .connected
        } catch {
            status = .error(error.localizedDescription)
        }
    }

    func setMuted(_ muted: Bool) {
        guard let participant = room?.localParticipant else { return }
        Task {
            for pub in participant.trackPublications.values {
                if let audioPub = pub as? LocalAudioTrackPublication {
                    try? await audioPub.setEnabled(!muted)
                }
            }
        }
    }

    @MainActor
    func disconnect() async {
        await room?.disconnect()
        room = nil
        status = .disconnected(nil)
    }
}

// MARK: - RoomDelegate

extension LiveKitService: RoomDelegate {
    func room(_ room: Room, didDisconnectWithError error: Error?) {
        Task { @MainActor in
            status = .disconnected(error?.localizedDescription)
        }
    }

    func room(_ room: Room, participant: RemoteParticipant, didSubscribeTrack publication: RemoteTrackPublication) {
        if publication.kind == .audio {
            Task { @MainActor in
                agentSpeaking = true
            }
        }
    }

    func room(_ room: Room, participant: RemoteParticipant, didUnsubscribeTrack publication: RemoteTrackPublication) {
        if publication.kind == .audio {
            Task { @MainActor in
                agentSpeaking = false
            }
        }
    }

    func room(_ room: Room, participant: RemoteParticipant, didReceiveData data: Data, forTopic topic: String) {
        if let text = String(data: data, encoding: .utf8), !text.isEmpty {
            let speaker = participant.identity.stringValue.hasPrefix("agent") ? "hugh" : "user"
            turnContinuation?.yield(TurnMessage(speaker: speaker, text: text))
        }
    }

    func room(_ room: Room, participant: LocalParticipant, didPublishTrack publication: LocalTrackPublication) {}
    func room(_ room: Room, participant: RemoteParticipant, didPublishTrack publication: RemoteTrackPublication) {}
    func room(_ room: Room, participant: LocalParticipant, didUnpublishTrack publication: LocalTrackPublication) {}
    func room(_ room: Room, participant: RemoteParticipant, didUnpublishTrack publication: RemoteTrackPublication) {}
    func roomDidConnect(_ room: Room) {}
}
