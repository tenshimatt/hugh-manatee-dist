// ProfileAutoPopulator.swift
// Automatically populates ProfileInfoEntity from AI extracted data

import Foundation
import Combine
import CoreData

@MainActor
class ProfileAutoPopulator: ObservableObject {
    static let shared = ProfileAutoPopulator()

    @Published var recentlyDiscovered: [String] = [] // Field names recently updated

    private init() {}

    // MARK: - Auto-Populate

    func updateProfile(with entities: ExtractedEntities, profile: ProfileInfoEntity, context: NSManagedObjectContext) -> [String] {
        var updatedFields: [String] = []

        // User's basic info
        if let fullName = entities.userInfo.fullName, profile.fullName == nil {
            profile.fullName = fullName
            updatedFields.append("Your full name")
        }

        if let dob = entities.userInfo.dateOfBirth, profile.dateOfBirth == nil {
            profile.dateOfBirth = dob
            updatedFields.append("Your date of birth")
        }

        if let birthplace = entities.userInfo.placeOfBirth, profile.placeOfBirth == nil {
            profile.placeOfBirth = birthplace
            updatedFields.append("Your birthplace")
        }

        // Mother's info
        if let motherName = entities.mother.fullName, profile.motherFullName == nil {
            profile.motherFullName = motherName
            updatedFields.append("Mother's full name")
        }

        if let maidenName = entities.mother.maidenName, profile.motherMaidenName == nil {
            profile.motherMaidenName = maidenName
            updatedFields.append("Mother's maiden name")
        }

        if let motherBirthplace = entities.mother.birthplace, profile.motherBirthplace == nil {
            profile.motherBirthplace = motherBirthplace
            updatedFields.append("Mother's birthplace")
        }

        // Father's info
        if let fatherName = entities.father.fullName, profile.fatherFullName == nil {
            profile.fatherFullName = fatherName
            updatedFields.append("Father's full name")
        }

        if let fatherBirthplace = entities.father.birthplace, profile.fatherBirthplace == nil {
            profile.fatherBirthplace = fatherBirthplace
            updatedFields.append("Father's birthplace")
        }

        // Spouse info
        if let spouseName = entities.spouse.name, profile.spouseName == nil {
            profile.spouseName = spouseName
            updatedFields.append("Spouse's name")
        }

        if let whereMet = entities.spouse.whereMet, profile.whereMetSpouse == nil {
            profile.whereMetSpouse = whereMet
            updatedFields.append("Where you met your spouse")
        }

        // People mentioned (friends, colleagues, associates, etc.)
        var peopleAdded = 0
        for person in entities.people {
            profile.addPerson(name: person.name, relationship: person.relationship, notes: person.notes)
            peopleAdded += 1
        }

        if peopleAdded > 0 {
            updatedFields.append("Mentioned \(peopleAdded) people")
        }

        // Update last modified
        if !updatedFields.isEmpty {
            profile.lastModified = Date()

            do {
                try context.save()
                recentlyDiscovered = updatedFields
                print("[ProfileAutoPopulator] Updated \(updatedFields.count) fields: \(updatedFields)")
                print("[ProfileAutoPopulator] Added \(peopleAdded) people to profile")
            } catch {
                print("[ProfileAutoPopulator] Failed to save: \(error.localizedDescription)")
            }
        }

        return updatedFields
    }

    // MARK: - Discovery Summary

    func createDiscoverySummary(from entities: ExtractedEntities, updatedFields: [String]) -> String {
        if updatedFields.isEmpty {
            return "No new genealogy information discovered in this recording."
        }

        var summary = "🎉 Discovered new information!\n\n"

        for field in updatedFields {
            summary += "• \(field)\n"
        }

        // Add other interesting findings
        if !entities.people.isEmpty {
            summary += "\n📝 Also mentioned:\n"
            for person in entities.people.prefix(3) {
                summary += "• \(person.name) (\(person.relationship))\n"
            }
        }

        if !entities.places.isEmpty {
            summary += "\n📍 Places:\n"
            for place in entities.places.prefix(3) {
                summary += "• \(place.name) - \(place.significance)\n"
            }
        }

        return summary
    }

    // MARK: - Progress Tracking

    func calculateProgress(profile: ProfileInfoEntity) -> Double {
        let criticalFields = ProfileInfoEntity.ProfileField.allCases.filter { $0.isCritical }
        let completedCount = profile.completedCriticalFields.count
        return Double(completedCount) / Double(criticalFields.count)
    }

    func getNextSuggestedPrompt(profile: ProfileInfoEntity) -> String? {
        // Check what critical info is missing
        let missingFields = ProfileInfoEntity.ProfileField.allCases.filter { field in
            field.isCritical && !profile.completedCriticalFields.contains(field)
        }

        guard let nextField = missingFields.first else {
            return nil
        }

        switch nextField {
        case .fullName:
            return "I'd love to know your full name"
        case .dateOfBirth:
            return "When were you born?"
        case .placeOfBirth:
            return "Where were you born?"
        case .motherFullName:
            return "Tell me about your mother - what was her name?"
        case .motherMaidenName:
            return "What was your mother's maiden name?"
        case .motherBirthplace:
            return "Where was your mother born?"
        case .fatherFullName:
            return "Tell me about your father - what was his name?"
        case .fatherBirthplace:
            return "Where was your father born?"
        case .spouseName:
            return "Tell me about meeting your spouse"
        case .whereMetSpouse:
            return "Where did you meet your spouse?"
        }
    }

    // MARK: - Conflict Resolution

    func detectConflicts(entities: ExtractedEntities, profile: ProfileInfoEntity) -> [DataConflict] {
        var conflicts: [DataConflict] = []

        // Check for mismatches between extracted data and existing profile

        if let extractedName = entities.userInfo.fullName,
           let existingName = profile.fullName,
           extractedName != existingName {
            conflicts.append(DataConflict(
                field: "Your full name",
                existing: existingName,
                extracted: extractedName
            ))
        }

        if let extractedDOB = entities.userInfo.dateOfBirth,
           let existingDOB = profile.dateOfBirth,
           !Calendar.current.isDate(extractedDOB, inSameDayAs: existingDOB) {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            conflicts.append(DataConflict(
                field: "Your date of birth",
                existing: formatter.string(from: existingDOB),
                extracted: formatter.string(from: extractedDOB)
            ))
        }

        // Similar checks for other fields...

        return conflicts
    }

    struct DataConflict {
        let field: String
        let existing: String
        let extracted: String
    }
}
