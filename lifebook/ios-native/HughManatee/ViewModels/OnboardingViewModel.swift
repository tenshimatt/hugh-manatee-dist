import SwiftUI

@Observable
final class OnboardingViewModel {
    var firstName = ""
    var selectedVoice: VoiceOption?
    var birthYear = ""
    var hometown = ""
    var isSubmitting = false
    var error: String?

    private let db = DatabaseService.shared

    func selectVoice(_ voice: VoiceOption) {
        selectedVoice = voice
        error = nil
    }

    func completeOnboarding() -> Bool {
        guard !firstName.isBlank else {
            error = "Please enter your name"
            return false
        }

        let voice = selectedVoice ?? placeholderVoices.first!
        let birthYearInt = Int(birthYear)
        let now = ProfileRecord.now

        isSubmitting = true
        error = nil

        Task {
            let profile = ProfileRecord(
                firstName: firstName.trimmed,
                birthYear: birthYearInt,
                hometown: hometown.trimmed.ifBlankNil,
                voiceId: voice.voiceId,
                agentId: voice.agentId,
                createdAt: now,
                updatedAt: now
            )
            do {
                try await db.upsertProfile(profile)
                UserDefaults.standard.set(true, forKey: "hasProfile")
                await MainActor.run {
                    isSubmitting = false
                    // Let SwiftUI navigate — parent observes @AppStorage
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    self.error = "Couldn't save: \(error.localizedDescription)"
                }
            }
        }

        return true // triggers navigation on success via @AppStorage
    }
}

// MARK: - String helpers

extension String {
    var isBlank: Bool { trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var ifBlankNil: String? { isBlank ? nil : self }
}
