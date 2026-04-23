//
//  CoreDataTestHelpers.swift
//  AuroraTests
//
//  Test utilities for Core Data testing
//

import Foundation
import CoreData
@testable import Aurora

/// Provides an in-memory Core Data stack for testing
class CoreDataTestStack {

    let persistentContainer: NSPersistentContainer
    let context: NSManagedObjectContext

    init() {
        // Create the same model that RecordingDataManager uses
        let model = CoreDataTestStack.createTestModel()

        // Create in-memory container
        let container = NSPersistentContainer(name: "TestLifebookData", managedObjectModel: model)

        // Use in-memory store for testing
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        container.persistentStoreDescriptions = [description]

        // Load stores
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Failed to load test store: \(error)")
            }
        }

        self.persistentContainer = container
        self.context = container.viewContext
    }

    private static func createTestModel() -> NSManagedObjectModel {
        let model = NSManagedObjectModel()

        // Create Recording entity (same as RecordingDataManager)
        let recordingEntity = NSEntityDescription()
        recordingEntity.name = "Recording"
        recordingEntity.managedObjectClassName = NSStringFromClass(RecordingEntity.self)

        let idAttribute = NSAttributeDescription()
        idAttribute.name = "id"
        idAttribute.attributeType = .UUIDAttributeType
        idAttribute.isOptional = false

        let titleAttribute = NSAttributeDescription()
        titleAttribute.name = "title"
        titleAttribute.attributeType = .stringAttributeType
        titleAttribute.isOptional = false

        let transcriptionAttribute = NSAttributeDescription()
        transcriptionAttribute.name = "transcription"
        transcriptionAttribute.attributeType = .stringAttributeType
        transcriptionAttribute.isOptional = false

        let dateAttribute = NSAttributeDescription()
        dateAttribute.name = "date"
        dateAttribute.attributeType = .dateAttributeType
        dateAttribute.isOptional = false

        let durationAttribute = NSAttributeDescription()
        durationAttribute.name = "duration"
        durationAttribute.attributeType = .doubleAttributeType
        durationAttribute.isOptional = false

        let audioFilePathAttribute = NSAttributeDescription()
        audioFilePathAttribute.name = "audioFilePath"
        audioFilePathAttribute.attributeType = .stringAttributeType
        audioFilePathAttribute.isOptional = true

        let categoryAttribute = NSAttributeDescription()
        categoryAttribute.name = "category"
        categoryAttribute.attributeType = .stringAttributeType
        categoryAttribute.isOptional = true

        recordingEntity.properties = [
            idAttribute,
            titleAttribute,
            transcriptionAttribute,
            dateAttribute,
            durationAttribute,
            audioFilePathAttribute,
            categoryAttribute
        ]

        // Create ProfileInfoEntity
        let profileEntity = NSEntityDescription()
        profileEntity.name = "ProfileInfoEntity"
        profileEntity.managedObjectClassName = NSStringFromClass(ProfileInfoEntity.self)

        let profileIdAttr = NSAttributeDescription()
        profileIdAttr.name = "id"
        profileIdAttr.attributeType = .UUIDAttributeType
        profileIdAttr.isOptional = true

        let lastModifiedAttr = NSAttributeDescription()
        lastModifiedAttr.name = "lastModified"
        lastModifiedAttr.attributeType = .dateAttributeType
        lastModifiedAttr.isOptional = true

        let fullNameAttr = NSAttributeDescription()
        fullNameAttr.name = "fullName"
        fullNameAttr.attributeType = .stringAttributeType
        fullNameAttr.isOptional = true

        let dateOfBirthAttr = NSAttributeDescription()
        dateOfBirthAttr.name = "dateOfBirth"
        dateOfBirthAttr.attributeType = .dateAttributeType
        dateOfBirthAttr.isOptional = true

        let placeOfBirthAttr = NSAttributeDescription()
        placeOfBirthAttr.name = "placeOfBirth"
        placeOfBirthAttr.attributeType = .stringAttributeType
        placeOfBirthAttr.isOptional = true

        let motherFullNameAttr = NSAttributeDescription()
        motherFullNameAttr.name = "motherFullName"
        motherFullNameAttr.attributeType = .stringAttributeType
        motherFullNameAttr.isOptional = true

        let motherMaidenNameAttr = NSAttributeDescription()
        motherMaidenNameAttr.name = "motherMaidenName"
        motherMaidenNameAttr.attributeType = .stringAttributeType
        motherMaidenNameAttr.isOptional = true

        let motherBirthplaceAttr = NSAttributeDescription()
        motherBirthplaceAttr.name = "motherBirthplace"
        motherBirthplaceAttr.attributeType = .stringAttributeType
        motherBirthplaceAttr.isOptional = true

        let fatherFullNameAttr = NSAttributeDescription()
        fatherFullNameAttr.name = "fatherFullName"
        fatherFullNameAttr.attributeType = .stringAttributeType
        fatherFullNameAttr.isOptional = true

        let fatherBirthplaceAttr = NSAttributeDescription()
        fatherBirthplaceAttr.name = "fatherBirthplace"
        fatherBirthplaceAttr.attributeType = .stringAttributeType
        fatherBirthplaceAttr.isOptional = true

        let spouseNameAttr = NSAttributeDescription()
        spouseNameAttr.name = "spouseName"
        spouseNameAttr.attributeType = .stringAttributeType
        spouseNameAttr.isOptional = true

        let whereMetSpouseAttr = NSAttributeDescription()
        whereMetSpouseAttr.name = "whereMetSpouse"
        whereMetSpouseAttr.attributeType = .stringAttributeType
        whereMetSpouseAttr.isOptional = true

        profileEntity.properties = [
            profileIdAttr,
            lastModifiedAttr,
            fullNameAttr,
            dateOfBirthAttr,
            placeOfBirthAttr,
            motherFullNameAttr,
            motherMaidenNameAttr,
            motherBirthplaceAttr,
            fatherFullNameAttr,
            fatherBirthplaceAttr,
            spouseNameAttr,
            whereMetSpouseAttr
        ]

        model.entities = [recordingEntity, profileEntity]
        return model
    }

    /// Clears all data from the test context
    func clearAllData() {
        // Clear recordings
        let recordingFetch: NSFetchRequest<NSFetchRequestResult> = RecordingEntity.fetchRequest()
        let recordingDelete = NSBatchDeleteRequest(fetchRequest: recordingFetch)

        do {
            try context.execute(recordingDelete)
        } catch {
            print("Failed to clear recordings: \(error)")
        }

        // Clear profiles
        let profileFetch: NSFetchRequest<NSFetchRequestResult> = ProfileInfoEntity.fetchRequest()
        let profileDelete = NSBatchDeleteRequest(fetchRequest: profileFetch)

        do {
            try context.execute(profileDelete)
        } catch {
            print("Failed to clear profiles: \(error)")
        }

        // Save changes
        do {
            try context.save()
        } catch {
            print("Failed to save after clearing: \(error)")
        }
    }

    /// Creates a test RecordingEntity in the context
    @discardableResult
    func createTestRecording(
        id: UUID = UUID(),
        title: String = "Test Recording",
        transcription: String = "This is a test transcription with some words",
        date: Date = Date(),
        duration: TimeInterval = 120.0,
        audioFilePath: String? = nil,
        category: String? = nil
    ) -> RecordingEntity {
        let recording = RecordingEntity(context: context)
        recording.id = id
        recording.title = title
        recording.transcription = transcription
        recording.date = date
        recording.duration = duration
        recording.audioFilePath = audioFilePath
        recording.category = category

        do {
            try context.save()
        } catch {
            print("Failed to save test recording: \(error)")
        }

        return recording
    }

    /// Creates a test ProfileInfoEntity in the context
    @discardableResult
    func createTestProfile(
        id: UUID = UUID(),
        fullName: String? = nil,
        dateOfBirth: Date? = nil,
        placeOfBirth: String? = nil
    ) -> ProfileInfoEntity {
        let profile = ProfileInfoEntity(context: context)
        profile.id = id
        profile.lastModified = Date()
        profile.fullName = fullName
        profile.dateOfBirth = dateOfBirth
        profile.placeOfBirth = placeOfBirth

        do {
            try context.save()
        } catch {
            print("Failed to save test profile: \(error)")
        }

        return profile
    }
}

// MARK: - Global Helper Functions

/// Creates a fresh test context (convenience function)
func createTestContext() -> NSManagedObjectContext {
    return CoreDataTestStack().context
}

/// Clears all data from a context (convenience function)
func clearAllData(context: NSManagedObjectContext) {
    // Clear recordings
    let recordingFetch: NSFetchRequest<NSFetchRequestResult> = RecordingEntity.fetchRequest()
    let recordingDelete = NSBatchDeleteRequest(fetchRequest: recordingFetch)
    try? context.execute(recordingDelete)

    // Clear profiles
    let profileFetch: NSFetchRequest<NSFetchRequestResult> = ProfileInfoEntity.fetchRequest()
    let profileDelete = NSBatchDeleteRequest(fetchRequest: profileFetch)
    try? context.execute(profileDelete)

    try? context.save()
}

/// Creates a test recording (convenience function)
@discardableResult
func createTestRecording(
    context: NSManagedObjectContext,
    title: String = "Test Recording",
    transcription: String = "This is a test transcription",
    duration: TimeInterval = 120.0
) -> RecordingEntity {
    let recording = RecordingEntity(context: context)
    recording.id = UUID()
    recording.title = title
    recording.transcription = transcription
    recording.date = Date()
    recording.duration = duration
    recording.audioFilePath = nil
    recording.category = nil

    try? context.save()
    return recording
}

/// Creates a test profile (convenience function)
@discardableResult
func createTestProfile(context: NSManagedObjectContext) -> ProfileInfoEntity {
    let profile = ProfileInfoEntity(context: context)
    profile.id = UUID()
    profile.lastModified = Date()

    try? context.save()
    return profile
}

// MARK: - Profile Test Fixtures

/// Predefined profile fixtures for common test scenarios
struct ProfileTestFixtures {

    /// Empty profile - 0% complete
    /// All critical fields are nil, resulting in 0% completion
    static func emptyProfile(context: NSManagedObjectContext) -> ProfileInfoEntity {
        let profile = ProfileInfoEntity(context: context)
        profile.id = UUID()
        profile.lastModified = Date()

        // All fields intentionally left nil
        profile.fullName = nil
        profile.dateOfBirth = nil
        profile.placeOfBirth = nil
        profile.motherFullName = nil
        profile.motherMaidenName = nil
        profile.motherBirthplace = nil
        profile.fatherFullName = nil
        profile.fatherBirthplace = nil
        profile.spouseName = nil
        profile.whereMetSpouse = nil

        try? context.save()
        return profile
    }

    /// Partial profile - approximately 50% complete
    /// Critical fields filled: 3 of 6 (fullName, dateOfBirth, placeOfBirth)
    /// Missing: motherFullName, motherMaidenName, fatherFullName
    static func partialProfile(context: NSManagedObjectContext) -> ProfileInfoEntity {
        let profile = ProfileInfoEntity(context: context)
        profile.id = UUID()
        profile.lastModified = Date()

        // Critical fields - 3 of 6 filled (50%)
        profile.fullName = "John Smith"
        profile.dateOfBirth = Calendar.current.date(from: DateComponents(year: 1950, month: 5, day: 15))
        profile.placeOfBirth = "New York, NY"

        // Missing critical fields
        profile.motherFullName = nil
        profile.motherMaidenName = nil
        profile.fatherFullName = nil

        // Optional fields left empty
        profile.motherBirthplace = nil
        profile.fatherBirthplace = nil
        profile.spouseName = nil
        profile.whereMetSpouse = nil

        try? context.save()
        return profile
    }

    /// Complete profile - 100% complete
    /// All critical fields filled, plus optional fields
    static func completeProfile(context: NSManagedObjectContext) -> ProfileInfoEntity {
        let profile = ProfileInfoEntity(context: context)
        profile.id = UUID()
        profile.lastModified = Date()

        // All critical fields completed (6 of 6)
        profile.fullName = "Margaret Elizabeth Johnson"
        profile.dateOfBirth = Calendar.current.date(from: DateComponents(year: 1945, month: 3, day: 22))
        profile.placeOfBirth = "Boston, Massachusetts"

        profile.motherFullName = "Elizabeth Marie Wilson"
        profile.motherMaidenName = "Wilson"
        profile.fatherFullName = "Robert James Johnson"

        // Optional fields (bonus)
        profile.motherBirthplace = "Portland, Maine"
        profile.fatherBirthplace = "Boston, Massachusetts"
        profile.spouseName = "David Thomas Anderson"
        profile.whereMetSpouse = "Harvard University Library"

        try? context.save()
        return profile
    }
}

// MARK: - Recording Test Fixtures

/// Predefined recording fixtures for common test scenarios
struct RecordingTestFixtures {

    /// Creates a recording about childhood
    static func childhoodRecording(context: NSManagedObjectContext) -> RecordingEntity {
        let recording = RecordingEntity(context: context)
        recording.id = UUID()
        recording.title = "My First Day of School"
        recording.transcription = "I remember walking to school for the first time. My mother held my hand tightly. I was nervous but excited to meet new friends. The teacher was very kind and welcoming."
        recording.date = Date()
        recording.duration = 45.0
        recording.category = "Childhood"
        recording.audioFilePath = nil

        try? context.save()
        return recording
    }

    /// Creates a recording about family
    static func familyRecording(context: NSManagedObjectContext) -> RecordingEntity {
        let recording = RecordingEntity(context: context)
        recording.id = UUID()
        recording.title = "Sunday Dinners with Grandma"
        recording.transcription = "Every Sunday, the whole family would gather at Grandma's house for dinner. She would cook the most amazing roast beef and her famous apple pie. Those were the best days."
        recording.date = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        recording.duration = 90.0
        recording.category = "Family"
        recording.audioFilePath = nil

        try? context.save()
        return recording
    }

    /// Creates a short recording
    static func shortRecording(context: NSManagedObjectContext) -> RecordingEntity {
        let recording = RecordingEntity(context: context)
        recording.id = UUID()
        recording.title = "Quick Memory"
        recording.transcription = "Just a quick thought I wanted to capture."
        recording.date = Date()
        recording.duration = 10.0
        recording.category = nil
        recording.audioFilePath = nil

        try? context.save()
        return recording
    }

    /// Creates a long recording
    static func longRecording(context: NSManagedObjectContext) -> RecordingEntity {
        let longText = String(repeating: "This is a very long transcription that goes on and on. ", count: 50)
        let recording = RecordingEntity(context: context)
        recording.id = UUID()
        recording.title = "Life Story - Complete"
        recording.transcription = longText
        recording.date = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
        recording.duration = 600.0
        recording.category = "Life Lessons"
        recording.audioFilePath = nil

        try? context.save()
        return recording
    }

    /// Creates multiple recordings for testing lists
    static func createMultipleRecordings(context: NSManagedObjectContext, count: Int = 5) -> [RecordingEntity] {
        var recordings: [RecordingEntity] = []
        let categories = SavedRecording.categories

        for i in 0..<count {
            let recording = RecordingEntity(context: context)
            recording.id = UUID()
            recording.title = "Recording \(i + 1)"
            recording.transcription = "This is test recording number \(i + 1)."
            recording.date = Calendar.current.date(byAdding: .day, value: -i, to: Date()) ?? Date()
            recording.duration = Double(30 + i * 10)
            recording.category = categories[i % categories.count]
            recording.audioFilePath = nil

            recordings.append(recording)
        }

        try? context.save()
        return recordings
    }
}
