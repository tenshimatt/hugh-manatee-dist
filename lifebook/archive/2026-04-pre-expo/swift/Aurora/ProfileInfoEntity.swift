// ProfileInfoEntity.swift
// Core Data entity for user's genealogy profile

import Foundation
import CoreData

@objc(ProfileInfoEntity)
public class ProfileInfoEntity: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var lastModified: Date?

    // User's basic info
    @NSManaged public var fullName: String?
    @NSManaged public var dateOfBirth: Date?
    @NSManaged public var placeOfBirth: String?

    // Mother's info
    @NSManaged public var motherFullName: String?
    @NSManaged public var motherMaidenName: String?
    @NSManaged public var motherBirthplace: String?

    // Father's info
    @NSManaged public var fatherFullName: String?
    @NSManaged public var fatherBirthplace: String?

    // Spouse info (optional)
    @NSManaged public var spouseName: String?
    @NSManaged public var whereMetSpouse: String?

    // Children (comma-separated names)
    @NSManaged public var childrenNames: String?

    // People mentioned (JSON-encoded array of PersonMention)
    @NSManaged public var peopleData: String?

    // Helper computed property for children array
    var children: [String] {
        guard let names = childrenNames?.trimmingCharacters(in: .whitespacesAndNewlines), !names.isEmpty else {
            return []
        }
        return names.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    // Helper computed property for people array
    var people: [PersonMention] {
        get {
            guard let data = peopleData?.data(using: .utf8) else { return [] }
            return (try? JSONDecoder().decode([PersonMention].self, from: data)) ?? []
        }
        set {
            peopleData = (try? JSONEncoder().encode(newValue)).flatMap { String(data: $0, encoding: .utf8) }
        }
    }

    // Add a person if not already in list
    func addPerson(name: String, relationship: String, notes: String?) {
        var currentPeople = people

        // Check if person already exists (by name)
        if !currentPeople.contains(where: { $0.name.lowercased() == name.lowercased() }) {
            currentPeople.append(PersonMention(name: name, relationship: relationship, notes: notes))
            people = currentPeople
            lastModified = Date()
        }
    }

    enum ProfileField: String, CaseIterable {
        case fullName = "Your full name"
        case dateOfBirth = "Your date of birth"
        case placeOfBirth = "Where you were born"
        case motherFullName = "Mother's full name"
        case motherMaidenName = "Mother's maiden name"
        case motherBirthplace = "Mother's birthplace"
        case fatherFullName = "Father's full name"
        case fatherBirthplace = "Father's birthplace"
        case spouseName = "Spouse's name"
        case whereMetSpouse = "Where you met your spouse"

        var isCritical: Bool {
            switch self {
            case .fullName, .dateOfBirth, .placeOfBirth,
                 .motherFullName, .motherMaidenName,
                 .fatherFullName:
                return true
            case .motherBirthplace, .fatherBirthplace,
                 .spouseName, .whereMetSpouse:
                return false
            }
        }

        var subtitle: String {
            switch self {
            case .fullName:
                return "Your complete legal name"
            case .dateOfBirth:
                return "When you were born"
            case .placeOfBirth:
                return "City or town where you were born"
            case .motherFullName:
                return "Your mother's full name"
            case .motherMaidenName:
                return "Her name before marriage"
            case .motherBirthplace:
                return "Where your mother was born"
            case .fatherFullName:
                return "Your father's full name"
            case .fatherBirthplace:
                return "Where your father was born"
            case .spouseName:
                return "Your spouse's name"
            case .whereMetSpouse:
                return "Where you first met"
            }
        }
    }

    struct ChecklistItem {
        let field: ProfileField
        let title: String
        let subtitle: String
        let isCompleted: Bool
        let isCritical: Bool
    }

    var completionPercentage: Int {
        let total = ProfileField.allCases.filter { $0.isCritical }.count
        let completed = completedCriticalFields.count
        return Int((Double(completed) / Double(total)) * 100)
    }

    var completionPercentageDouble: Double {
        let total = ProfileField.allCases.filter { $0.isCritical }.count
        let completed = completedCriticalFields.count
        return Double(completed) / Double(total)
    }

    var completedCriticalFields: [ProfileField] {
        ProfileField.allCases.filter { field in
            field.isCritical && isFieldCompleted(field)
        }
    }

    var allChecklistItems: [ChecklistItem] {
        ProfileField.allCases.map { field in
            ChecklistItem(
                field: field,
                title: field.rawValue,
                subtitle: field.subtitle,
                isCompleted: isFieldCompleted(field),
                isCritical: field.isCritical
            )
        }
    }

    var criticalChecklistItems: [ChecklistItem] {
        allChecklistItems.filter { $0.isCritical }
    }

    var isProfileComplete: Bool {
        return completionPercentage == 100
    }

    // Field completion checks
    func isFieldCompleted(_ field: ProfileField) -> Bool {
        switch field {
        case .fullName:
            return fullName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .dateOfBirth:
            return dateOfBirth != nil
        case .placeOfBirth:
            return placeOfBirth?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .motherFullName:
            return motherFullName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .motherMaidenName:
            return motherMaidenName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .motherBirthplace:
            return motherBirthplace?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .fatherFullName:
            return fatherFullName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .fatherBirthplace:
            return fatherBirthplace?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .spouseName:
            return spouseName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        case .whereMetSpouse:
            return whereMetSpouse?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        }
    }

    // Update methods
    func updateField(_ field: ProfileField, value: Any?) {
        switch field {
        case .fullName:
            fullName = value as? String
        case .dateOfBirth:
            dateOfBirth = value as? Date
        case .placeOfBirth:
            placeOfBirth = value as? String
        case .motherFullName:
            motherFullName = value as? String
        case .motherMaidenName:
            motherMaidenName = value as? String
        case .motherBirthplace:
            motherBirthplace = value as? String
        case .fatherFullName:
            fatherFullName = value as? String
        case .fatherBirthplace:
            fatherBirthplace = value as? String
        case .spouseName:
            spouseName = value as? String
        case .whereMetSpouse:
            whereMetSpouse = value as? String
        }
        lastModified = Date()
    }

    func getValue(for field: ProfileField) -> Any? {
        switch field {
        case .fullName: return fullName
        case .dateOfBirth: return dateOfBirth
        case .placeOfBirth: return placeOfBirth
        case .motherFullName: return motherFullName
        case .motherMaidenName: return motherMaidenName
        case .motherBirthplace: return motherBirthplace
        case .fatherFullName: return fatherFullName
        case .fatherBirthplace: return fatherBirthplace
        case .spouseName: return spouseName
        case .whereMetSpouse: return whereMetSpouse
        }
    }
}

extension ProfileInfoEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<ProfileInfoEntity> {
        return NSFetchRequest<ProfileInfoEntity>(entityName: "ProfileInfoEntity")
    }
}

// MARK: - Person Mention Model
struct PersonMention: Codable, Identifiable {
    var id: String { name }
    let name: String
    let relationship: String
    let notes: String?
}
