//
//  TestDataGenerator.swift
//  AuroraTests
//
//  Generates realistic sample recordings for testing
//  Provides sample data for unit tests, UI tests, and manual testing
//

import Foundation
import CoreData
@testable import Aurora

/// Test data generator for creating sample recordings and profile data
class TestDataGenerator {

    // MARK: - Singleton

    static let shared = TestDataGenerator()
    private init() {}

    // MARK: - Sample Recording Definitions

    /// Collection of pre-defined test recordings matching the test plan
    struct SampleRecordings {

        /// Recording 1: Boston childhood (15s) - extracts birthplace, mother, father
        static let bostonChildhood = SampleRecordingData(
            title: "Growing Up in Boston",
            transcription: """
            I was born in Boston, Massachusetts in 1945. My mother, Mary O'Connor, \
            was the kindest woman you'd ever meet. She came from County Cork in Ireland. \
            My father, William O'Connor, worked at the shipyard. He was a hardworking man \
            who taught me the value of honest labor.
            """,
            duration: 15.0,
            category: "Childhood",
            extractedProfile: ExtractedProfileData(
                placeOfBirth: "Boston, Massachusetts",
                motherFullName: "Mary O'Connor",
                motherBirthplace: "County Cork, Ireland",
                fatherFullName: "William O'Connor"
            )
        )

        /// Recording 2: Wedding story (45s) - extracts spouse info
        static let weddingStory = SampleRecordingData(
            title: "The Day I Met Sarah",
            transcription: """
            I met my wife Sarah at a church social in 1968. She was wearing a yellow \
            dress and had the most beautiful smile. We started talking about our favorite \
            books and just clicked instantly. We met at St. Patrick's Cathedral during \
            a community event. After six months of courtship, I knew she was the one. \
            We got married in June 1969 at the same cathedral where we first met. \
            It was the happiest day of my life.
            """,
            duration: 45.0,
            category: "Relationships",
            extractedProfile: ExtractedProfileData(
                spouseName: "Sarah O'Connor",
                whereMetSpouse: "St. Patrick's Cathedral"
            )
        )

        /// Recording 3: Career story (2min) - no family info
        static let careerStory = SampleRecordingData(
            title: "My Years at the Shipyard",
            transcription: """
            I started working at the Boston Naval Shipyard in 1963, right after finishing \
            high school. Those were incredible years of learning and growth. I worked my \
            way up from an apprentice welder to a master craftsman over twenty-five years. \
            The shipyard was a place of camaraderie and pride. We built some of the finest \
            vessels that ever sailed. I remember the launch of the USS Constitution restoration \
            project in 1973. Being part of that historic work was an honor I'll never forget. \
            The smell of metal, the sound of hammers, the friendships forged in those fires - \
            those memories stay with you forever. I retired in 1988 with a gold watch and \
            more stories than I could count. The shipyard taught me discipline, precision, \
            and the importance of doing things right the first time.
            """,
            duration: 120.0,
            category: "Career",
            extractedProfile: nil
        )

        /// Recording 4: Multi-generational (90s) - full profile data
        static let multiGenerational = SampleRecordingData(
            title: "Family History and Heritage",
            transcription: """
            Let me tell you about our family history. I'm James Patrick O'Connor, \
            born on March 15th, 1945 in Boston, Massachusetts. My mother's full name \
            was Mary Catherine O'Connor, born Mary Catherine Sullivan in County Cork, \
            Ireland in 1920. She immigrated to America when she was just eighteen years old. \
            My father, William Joseph O'Connor, was born in South Boston in 1918. \
            His parents came from Galway, Ireland. I met my beautiful wife Sarah Elizabeth \
            Thompson at St. Patrick's Cathedral during a community social in 1968. \
            We were married the following year and have been blessed with three wonderful \
            children. My mother always said that family is everything, and she was right. \
            Understanding where we come from helps us know who we are.
            """,
            duration: 90.0,
            category: "Family",
            extractedProfile: ExtractedProfileData(
                fullName: "James Patrick O'Connor",
                dateOfBirth: DateHelper.createDate(year: 1945, month: 3, day: 15),
                placeOfBirth: "Boston, Massachusetts",
                motherFullName: "Mary Catherine O'Connor",
                motherMaidenName: "Sullivan",
                motherBirthplace: "County Cork, Ireland",
                fatherFullName: "William Joseph O'Connor",
                fatherBirthplace: "South Boston, Massachusetts",
                spouseName: "Sarah Elizabeth O'Connor",
                whereMetSpouse: "St. Patrick's Cathedral"
            )
        )

        /// Recording 5: Edge case (3s) - empty/silence
        static let edgeCase = SampleRecordingData(
            title: "Test Recording - Silence",
            transcription: "",
            duration: 3.0,
            category: "General",
            extractedProfile: nil
        )

        /// All sample recordings in order
        static let all: [SampleRecordingData] = [
            bostonChildhood,
            weddingStory,
            careerStory,
            multiGenerational,
            edgeCase
        ]
    }

    // MARK: - Data Structures

    /// Container for sample recording data
    struct SampleRecordingData {
        let title: String
        let transcription: String
        let duration: TimeInterval
        let category: String
        let extractedProfile: ExtractedProfileData?

        /// Generate a SavedRecording instance with custom or random date
        func toSavedRecording(date: Date = Date(), id: UUID = UUID()) -> SavedRecording {
            SavedRecording(
                id: id,
                title: title,
                transcription: transcription,
                date: date,
                duration: duration,
                audioFilePath: MockAudioFile.generatePath(),
                category: category
            )
        }
    }

    /// Container for extracted profile information
    struct ExtractedProfileData {
        var fullName: String?
        var dateOfBirth: Date?
        var placeOfBirth: String?
        var motherFullName: String?
        var motherMaidenName: String?
        var motherBirthplace: String?
        var fatherFullName: String?
        var fatherBirthplace: String?
        var spouseName: String?
        var whereMetSpouse: String?

        /// Apply this profile data to a ProfileInfoEntity
        func apply(to entity: ProfileInfoEntity) {
            entity.fullName = fullName
            entity.dateOfBirth = dateOfBirth
            entity.placeOfBirth = placeOfBirth
            entity.motherFullName = motherFullName
            entity.motherMaidenName = motherMaidenName
            entity.motherBirthplace = motherBirthplace
            entity.fatherFullName = fatherFullName
            entity.fatherBirthplace = fatherBirthplace
            entity.spouseName = spouseName
            entity.whereMetSpouse = whereMetSpouse
            entity.lastModified = Date()
        }
    }

    // MARK: - Helper Classes

    /// Mock audio file path generator
    struct MockAudioFile {
        static func generatePath() -> String {
            let filename = "recording_\(UUID().uuidString).m4a"
            let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
            return (documentsPath as NSString).appendingPathComponent(filename)
        }
    }

    /// Date generation helper
    struct DateHelper {
        static func createDate(year: Int, month: Int, day: Int) -> Date? {
            var components = DateComponents()
            components.year = year
            components.month = month
            components.day = day
            return Calendar.current.date(from: components)
        }

        static func randomDate(in range: ClosedRange<Date>) -> Date {
            let timeInterval = range.upperBound.timeIntervalSince(range.lowerBound)
            let randomInterval = TimeInterval.random(in: 0...timeInterval)
            return range.lowerBound.addingTimeInterval(randomInterval)
        }

        static func daysAgo(_ days: Int) -> Date {
            return Calendar.current.date(byAdding: .day, value: -days, to: Date())!
        }
    }

    // MARK: - Core Data Integration

    /// Seed the database with sample recordings
    /// - Parameters:
    ///   - context: The Core Data managed object context
    ///   - includeAllSamples: If true, includes all 5 sample recordings. If false, only includes first 3.
    /// - Returns: Array of created RecordingEntity objects
    @discardableResult
    func seedRecordings(in context: NSManagedObjectContext, includeAllSamples: Bool = true) -> [RecordingEntity] {
        let samplesToUse = includeAllSamples ? SampleRecordings.all : Array(SampleRecordings.all.prefix(3))
        var entities: [RecordingEntity] = []

        for (index, sample) in samplesToUse.enumerated() {
            let entity = RecordingEntity(context: context)
            entity.id = UUID()
            entity.title = sample.title
            entity.transcription = sample.transcription
            entity.date = DateHelper.daysAgo(samplesToUse.count - index)
            entity.duration = sample.duration
            entity.audioFilePath = MockAudioFile.generatePath()
            entity.category = sample.category

            entities.append(entity)
        }

        do {
            try context.save()
            print("[TestDataGenerator] Successfully seeded \(entities.count) recordings")
        } catch {
            print("[TestDataGenerator] Failed to seed recordings: \(error)")
        }

        return entities
    }

    /// Create a profile entity with sample data
    /// - Parameters:
    ///   - context: The Core Data managed object context
    ///   - withData: The profile data to use. If nil, uses multi-generational sample.
    /// - Returns: Created ProfileInfoEntity
    @discardableResult
    func createSampleProfile(
        in context: NSManagedObjectContext,
        withData profileData: ExtractedProfileData? = nil
    ) -> ProfileInfoEntity {
        let entity = ProfileInfoEntity(context: context)
        entity.id = UUID()

        let dataToUse = profileData ?? SampleRecordings.multiGenerational.extractedProfile!
        dataToUse.apply(to: entity)

        do {
            try context.save()
            print("[TestDataGenerator] Successfully created sample profile")
        } catch {
            print("[TestDataGenerator] Failed to create profile: \(error)")
        }

        return entity
    }

    /// Clear all recordings from the database
    /// - Parameter context: The Core Data managed object context
    func clearAllRecordings(in context: NSManagedObjectContext) {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = RecordingEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        do {
            try context.execute(deleteRequest)
            try context.save()
            print("[TestDataGenerator] Cleared all recordings")
        } catch {
            print("[TestDataGenerator] Failed to clear recordings: \(error)")
        }
    }

    /// Clear all profile data from the database
    /// - Parameter context: The Core Data managed object context
    func clearAllProfiles(in context: NSManagedObjectContext) {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = ProfileInfoEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        do {
            try context.execute(deleteRequest)
            try context.save()
            print("[TestDataGenerator] Cleared all profiles")
        } catch {
            print("[TestDataGenerator] Failed to clear profiles: \(error)")
        }
    }

    /// Clear all test data (recordings and profiles)
    /// - Parameter context: The Core Data managed object context
    func clearAllTestData(in context: NSManagedObjectContext) {
        clearAllRecordings(in: context)
        clearAllProfiles(in: context)
    }

    // MARK: - Random Data Generation

    /// Generate a random recording with realistic data
    /// - Returns: A SavedRecording with random but realistic values
    func generateRandomRecording() -> SavedRecording {
        let titles = [
            "My First Day at School",
            "Summer Vacation Memories",
            "Learning to Drive",
            "My First Job",
            "Moving to a New City",
            "A Special Birthday",
            "Holiday Traditions",
            "Lessons from Grandpa",
            "The Family Farm",
            "Adventures in the Navy"
        ]

        let transcriptionSnippets = [
            "I remember it like it was yesterday. The sun was shining and everyone was there.",
            "Those were different times. We didn't have much, but we had each other.",
            "Looking back now, I realize how important those moments were.",
            "My mother always said that family comes first, and she was right.",
            "The best lessons in life aren't taught in school, they're learned through experience.",
            "I wouldn't trade those memories for anything in the world.",
            "Sometimes the smallest moments turn out to be the most significant.",
            "That experience shaped who I became and how I raised my own children."
        ]

        let durations: [TimeInterval] = [10, 15, 30, 45, 60, 90, 120, 180]

        return SavedRecording(
            id: UUID(),
            title: titles.randomElement()!,
            transcription: transcriptionSnippets.randomElement()!,
            date: DateHelper.randomDate(in: DateHelper.daysAgo(365)...Date()),
            duration: durations.randomElement()!,
            audioFilePath: MockAudioFile.generatePath(),
            category: SavedRecording.categories.randomElement()
        )
    }

    /// Generate multiple random recordings
    /// - Parameter count: Number of recordings to generate
    /// - Returns: Array of SavedRecording objects
    func generateRandomRecordings(count: Int) -> [SavedRecording] {
        return (0..<count).map { _ in generateRandomRecording() }
    }

    /// Seed the database with random recordings
    /// - Parameters:
    ///   - context: The Core Data managed object context
    ///   - count: Number of random recordings to create
    /// - Returns: Array of created RecordingEntity objects
    @discardableResult
    func seedRandomRecordings(in context: NSManagedObjectContext, count: Int) -> [RecordingEntity] {
        let recordings = generateRandomRecordings(count: count)
        var entities: [RecordingEntity] = []

        for recording in recordings {
            let entity = RecordingEntity(context: context)
            entity.id = recording.id
            entity.title = recording.title
            entity.transcription = recording.transcription
            entity.date = recording.date
            entity.duration = recording.duration
            entity.audioFilePath = recording.audioFilePath
            entity.category = recording.category

            entities.append(entity)
        }

        do {
            try context.save()
            print("[TestDataGenerator] Successfully seeded \(entities.count) random recordings")
        } catch {
            print("[TestDataGenerator] Failed to seed random recordings: \(error)")
        }

        return entities
    }

    // MARK: - Test Helpers

    /// Create an in-memory context for testing (does not persist)
    /// - Returns: A temporary NSManagedObjectContext
    static func createInMemoryContext() -> NSManagedObjectContext {
        return CoreDataTestStack().context
    }

    /// Verify a recording matches expected sample data
    /// - Parameters:
    ///   - recording: The recording to verify
    ///   - sample: The expected sample data
    /// - Returns: True if recording matches sample
    static func verify(_ recording: SavedRecording, matches sample: SampleRecordingData) -> Bool {
        return recording.title == sample.title &&
               recording.transcription == sample.transcription &&
               recording.duration == sample.duration &&
               recording.category == sample.category
    }

    /// Verify a profile entity has been populated with data
    /// - Parameter profile: The profile to verify
    /// - Returns: True if profile has at least one field populated
    static func verifyProfileHasData(_ profile: ProfileInfoEntity) -> Bool {
        return profile.fullName != nil ||
               profile.placeOfBirth != nil ||
               profile.motherFullName != nil ||
               profile.fatherFullName != nil ||
               profile.spouseName != nil
    }
    // MARK: - Convenience Static Methods for Tests

    /// Get all sample recordings
    static func allSampleRecordings() -> [SampleRecordingData] {
        return SampleRecordings.all
    }

    /// Get sample recording 1 (Boston childhood)
    static func sampleRecording1() -> SampleRecordingData {
        return SampleRecordings.bostonChildhood
    }

    /// Get sample recording 2 (Wedding story)
    static func sampleRecording2() -> SampleRecordingData {
        return SampleRecordings.weddingStory
    }

    /// Get sample recording 3 (Career story)
    static func sampleRecording3() -> SampleRecordingData {
        return SampleRecordings.careerStory
    }

    /// Get sample recording 4 (Multi-generational)
    static func sampleRecording4() -> SampleRecordingData {
        return SampleRecordings.multiGenerational
    }

    /// Get sample recording 5 (Edge case)
    static func sampleRecording5() -> SampleRecordingData {
        return SampleRecordings.edgeCase
    }

    /// Special test set for statistics testing
    static func statisticsTestSet() -> [SampleRecordingData] {
        return [
            SampleRecordings.bostonChildhood,
            SampleRecordings.weddingStory,
            SampleRecordings.careerStory
        ]
    }

    /// Empty transcription test
    static func emptyTranscription() -> SampleRecordingData {
        return SampleRecordingData(
            title: "Empty Test",
            transcription: "",
            duration: 1.0,
            category: "General",
            extractedProfile: nil
        )
    }

    /// Special characters title test
    static func specialCharactersTitle() -> SampleRecordingData {
        return SampleRecordingData(
            title: "Test @#$% Special & Characters!",
            transcription: "Testing special characters in title",
            duration: 5.0,
            category: "General",
            extractedProfile: nil
        )
    }

    /// Very long transcription test
    static func veryLongTranscription() -> SampleRecordingData {
        let longText = String(repeating: "This is a very long transcription. ", count: 200)
        return SampleRecordingData(
            title: "Long Transcription Test",
            transcription: longText,
            duration: 300.0,
            category: "General",
            extractedProfile: nil
        )
    }
}

// MARK: - Convenience Extensions for Testing

extension RecordingDataManager {
    /// Convenience method to seed test data using the singleton
    func seedTestData(includeAllSamples: Bool = true) {
        TestDataGenerator.shared.seedRecordings(in: context, includeAllSamples: includeAllSamples)
    }

    /// Convenience method to clear all test data
    func clearTestData() {
        TestDataGenerator.shared.clearAllTestData(in: context)
    }
}
