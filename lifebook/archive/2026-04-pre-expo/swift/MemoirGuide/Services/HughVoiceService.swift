// HughVoiceService.swift
// Text-to-speech service for Hugh's voice

import Foundation
import AVFoundation

@MainActor
class HughVoiceService: NSObject, ObservableObject {
    static let shared = HughVoiceService()

    @Published var isSpeaking = false
    @Published var currentUtterance: String = ""

    private let synthesizer = AVSpeechSynthesizer()
    private var completionHandler: (() -> Void)?

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    /// Speak text using Hugh's voice characteristics
    func speak(_ text: String, completion: (() -> Void)? = nil) async {
        guard !text.isEmpty else { return }

        // Store completion handler
        self.completionHandler = completion

        // Configure audio session for playback
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try audioSession.setActive(true)
        } catch {
            print("[HughVoiceService] Failed to setup audio session: \(error)")
        }

        // Create utterance with Hugh's voice characteristics
        let utterance = AVSpeechUtterance(string: text)

        // Voice selection: Use natural US English voice
        if let voice = AVSpeechSynthesisVoice(language: "en-US") {
            utterance.voice = voice
        }

        // Voice characteristics for natural, conversational tone
        utterance.rate = 0.52 // Natural pace, slightly slower for clarity
        utterance.pitchMultiplier = 1.0 // Normal pitch
        utterance.volume = 1.0

        // Update state
        isSpeaking = true
        currentUtterance = text

        // Speak
        synthesizer.speak(utterance)
    }

    /// Stop speaking immediately
    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
        isSpeaking = false
        currentUtterance = ""
    }

    /// Pause speaking
    func pauseSpeaking() {
        synthesizer.pauseSpeaking(at: .word)
    }

    /// Resume speaking
    func resumeSpeaking() {
        synthesizer.continueSpeaking()
    }
}

// MARK: - AVSpeechSynthesizerDelegate
extension HughVoiceService: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.currentUtterance = ""
            self.completionHandler?()
            self.completionHandler = nil
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.currentUtterance = ""
            self.completionHandler = nil
        }
    }
}
