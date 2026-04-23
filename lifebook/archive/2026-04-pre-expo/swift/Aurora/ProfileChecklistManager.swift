// ProfileChecklistManager.swift
// Manages user profile genealogy checklist

import Foundation
import CoreData
import Combine

@MainActor
class ProfileChecklistManager: ObservableObject {
    static let shared = ProfileChecklistManager()

    @Published var profileInfo: ProfileInfoEntity?
    @Published var isLoading = false

    let coreDataManager = RecordingDataManager.shared

    var context: NSManagedObjectContext {
        return coreDataManager.context
    }

    private init() {
        loadProfile()
    }

    // MARK: - Load Profile

    func loadProfile() {
        isLoading = true

        let fetchRequest: NSFetchRequest<ProfileInfoEntity> = ProfileInfoEntity.fetchRequest()
        fetchRequest.fetchLimit = 1

        do {
            let results = try context.fetch(fetchRequest)

            if let existing = results.first {
                profileInfo = existing
            } else {
                // Create new profile if none exists
                createNewProfile()
            }
        } catch {
            print("[ProfileChecklistManager] Failed to fetch profile: \(error)")
            createNewProfile()
        }

        isLoading = false
    }

    // MARK: - Create New Profile

    private func createNewProfile() {
        let newProfile = ProfileInfoEntity(context: context)
        newProfile.id = UUID()
        newProfile.lastModified = Date()

        do {
            try context.save()
            profileInfo = newProfile
            print("[ProfileChecklistManager] Created new profile")
        } catch {
            print("[ProfileChecklistManager] Failed to create profile: \(error)")
        }
    }

    // MARK: - Update Field

    func updateField(_ field: ProfileInfoEntity.ProfileField, value: Any?) {
        guard let profile = profileInfo else {
            print("[ProfileChecklistManager] No profile loaded")
            return
        }

        profile.updateField(field, value: value)

        do {
            try context.save()
            // Trigger UI update
            objectWillChange.send()
            print("[ProfileChecklistManager] Updated field: \(field.rawValue)")
        } catch {
            print("[ProfileChecklistManager] Failed to save field update: \(error)")
        }
    }

    // MARK: - Computed Properties

    var completionPercentage: Int {
        return profileInfo?.completionPercentage ?? 0
    }

    var isProfileComplete: Bool {
        return profileInfo?.isProfileComplete ?? false
    }

    var criticalChecklistItems: [ProfileInfoEntity.ChecklistItem] {
        return profileInfo?.criticalChecklistItems ?? []
    }

    var allChecklistItems: [ProfileInfoEntity.ChecklistItem] {
        return profileInfo?.allChecklistItems ?? []
    }

    // MARK: - Progress Status

    var progressColor: String {
        let percentage = completionPercentage

        if percentage == 100 {
            return "green"
        } else if percentage >= 50 {
            return "yellow"
        } else {
            return "red"
        }
    }

    var progressMessage: String {
        let percentage = completionPercentage

        if percentage == 100 {
            return "Profile Complete! 🎉"
        } else if percentage >= 75 {
            return "Almost there! Just a few more details."
        } else if percentage >= 50 {
            return "Great progress! Keep going."
        } else if percentage >= 25 {
            return "Good start! Let's add more information."
        } else {
            return "Let's get started with your family history."
        }
    }

    // MARK: - Validation

    func validateField(_ field: ProfileInfoEntity.ProfileField, value: Any?) -> String? {
        switch field {
        case .dateOfBirth:
            guard let date = value as? Date else {
                return "Please select a valid date"
            }

            // Check if date is in the future
            if date > Date() {
                return "Date of birth cannot be in the future"
            }

            // Check if user is at least 50 years old (elderly user app)
            let calendar = Calendar.current
            if let age = calendar.dateComponents([.year], from: date, to: Date()).year, age < 50 {
                return "This app is designed for users 50 and older"
            }

        case .fullName, .placeOfBirth, .motherFullName, .motherMaidenName,
             .motherBirthplace, .fatherFullName, .fatherBirthplace,
             .spouseName, .whereMetSpouse:
            guard let text = value as? String,
                  !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                return "This field cannot be empty"
            }

            // Minimum length check for names
            if [.fullName, .motherFullName, .fatherFullName, .spouseName].contains(field) {
                if text.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
                    return "Name must be at least 2 characters"
                }
            }
        }

        return nil // Valid
    }
}
