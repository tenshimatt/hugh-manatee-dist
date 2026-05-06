import SwiftUI

@Observable
final class SettingsViewModel {
    var profile: ProfileRecord?
    var isEditing = false
    var editFirstName = ""
    var editBirthYear = ""
    var editHometown = ""
    var showVoicePicker = false
    var selectedVoice: VoiceOption?
    var showDeleteConfirm = false
    var isSaving = false

    private let db = DatabaseService.shared

    init() {
        Task {
            profile = try? await db.getProfile()
            if let p = profile {
                selectedVoice = placeholderVoices.first { $0.voiceId == p.voiceId }
            }
        }
    }

    func startEditing() {
        guard let p = profile else { return }
        editFirstName = p.firstName
        editBirthYear = p.birthYear.map(String.init) ?? ""
        editHometown = p.hometown ?? ""
        isEditing = true
    }

    func cancelEditing() { isEditing = false }

    func saveProfile() {
        guard let p = profile, !editFirstName.isBlank else { return }
        isSaving = true
        Task {
            let updated = ProfileRecord(
                id: p.id,
                firstName: editFirstName.trimmed,
                birthYear: Int(editBirthYear),
                hometown: editHometown.ifBlankNil,
                voiceId: p.voiceId,
                agentId: p.agentId,
                createdAt: p.createdAt,
                updatedAt: ProfileRecord.now
            )
            try? await db.upsertProfile(updated)
            await MainActor.run {
                profile = updated
                isEditing = false
                isSaving = false
            }
        }
    }

    func selectVoice(_ voice: VoiceOption) {
        Task {
            guard var p = profile else { return }
            p.voiceId = voice.voiceId
            p.agentId = voice.agentId
            p.updatedAt = ProfileRecord.now
            try? await db.upsertProfile(p)
            await MainActor.run {
                profile = p
                selectedVoice = voice
                showVoicePicker = false
            }
        }
    }

    func deleteAll() {
        Task {
            try? await db.nukeAll()
            UserDefaults.standard.set(false, forKey: "hasProfile")
        }
    }
}
