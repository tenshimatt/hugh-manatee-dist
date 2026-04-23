//
//  VoiceCommandService.swift
//  Aurora
//
//  Detects voice commands for adjusting Hugh's voice conversationally
//

import Foundation
import Combine

/// Service that detects voice commands in user transcriptions
@MainActor
class VoiceCommandService: ObservableObject {
    static let shared = VoiceCommandService()

    private let hughVoice = HughVoiceService.shared

    private init() {}

    /// Process transcription for voice commands
    func processTranscription(_ text: String) async {
        let lowercased = text.lowercased()

        // Speed adjustments
        if lowercased.contains("too fast") || lowercased.contains("slow down") || lowercased.contains("slower") {
            await hughVoice.slowDown()
            return
        }

        if lowercased.contains("too slow") || lowercased.contains("faster") || lowercased.contains("speed up") {
            await hughVoice.speedUp()
            return
        }

        // Voice changes
        if lowercased.contains("deeper") || lowercased.contains("lower voice") || lowercased.contains("deeper voice") {
            await hughVoice.changeToDeeper()
            return
        }

        if lowercased.contains("higher") || lowercased.contains("lighter") || lowercased.contains("lighter voice") {
            await hughVoice.changeToLighter()
            return
        }

        if lowercased.contains("clearer") || lowercased.contains("more clear") {
            await hughVoice.changeToClearer()
            return
        }

        if lowercased.contains("softer") || lowercased.contains("gentler") || lowercased.contains("gentle voice") {
            await hughVoice.changeToSofter()
            return
        }

        if lowercased.contains("different voice") || lowercased.contains("another voice") || lowercased.contains("change voice") {
            await hughVoice.cycleVoice()
            return
        }

        // Confirmation phrases
        if (lowercased.contains("that's better") ||
            lowercased.contains("that's good") ||
            lowercased.contains("yes that's") ||
            lowercased.contains("perfect")) &&
            (lowercased.contains("voice") || lowercased.contains("speed")) {
            await hughVoice.confirmPreference()
            return
        }
    }

    /// Check if text contains a voice command
    func containsVoiceCommand(_ text: String) -> Bool {
        let lowercased = text.lowercased()

        let commands = [
            "too fast", "slow down", "slower",
            "too slow", "faster", "speed up",
            "deeper", "lower voice",
            "higher", "lighter",
            "clearer", "more clear",
            "softer", "gentler",
            "different voice", "another voice", "change voice"
        ]

        return commands.contains { lowercased.contains($0) }
    }
}
