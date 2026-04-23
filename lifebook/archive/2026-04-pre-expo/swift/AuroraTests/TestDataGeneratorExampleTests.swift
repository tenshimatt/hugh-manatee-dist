//
//  TestDataGeneratorExampleTests.swift
//  AuroraTests
//
//  Example tests demonstrating how to use TestDataGenerator
//

import Testing
import CoreData
@testable import Aurora

/// Example tests showing various ways to use TestDataGenerator
struct TestDataGeneratorExampleTests {

    // MARK: - Basic Usage Examples

    @Test("Generate sample recordings")
    func testGenerateSampleRecordings() async throws {
        // Access pre-defined sample recordings
        let bostonRecording = TestDataGenerator.SampleRecordings.bostonChildhood
        let weddingRecording = TestDataGenerator.SampleRecordings.weddingStory
        let careerRecording = TestDataGenerator.SampleRecordings.careerStory

        // Verify sample data structure
        #expect(bostonRecording.title == "Growing Up in Boston")
        #expect(bostonRecording.duration == 15.0)
        #expect(bostonRecording.category == "Childhood")
        #expect(bostonRecording.extractedProfile != nil)

        #expect(weddingRecording.duration == 45.0)
        #expect(careerRecording.duration == 120.0)
    }

    @Test("Convert sample to SavedRecording")
    func testConvertToSavedRecording() async throws {
        // Convert sample data to SavedRecording instance
        let sample = TestDataGenerator.SampleRecordings.bostonChildhood
        let recording = sample.toSavedRecording()

        // Verify conversion
        #expect(recording.title == sample.title)
        #expect(recording.transcription == sample.transcription)
        #expect(recording.duration == sample.duration)
        #expect(recording.audioFilePath != nil)
    }

    @Test("Generate random recording")
    func testGenerateRandomRecording() async throws {
        let generator = TestDataGenerator.shared
        let recording = generator.generateRandomRecording()

        // Verify random recording has valid data
        #expect(!recording.title.isEmpty)
        #expect(!recording.transcription.isEmpty)
        #expect(recording.duration > 0)
        #expect(recording.audioFilePath != nil)
    }

    // MARK: - Core Data Integration Examples

    @Test("Seed database with sample recordings")
    func testSeedDatabase() async throws {
        // Create in-memory context for testing
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        // Seed with all 5 sample recordings
        let entities = generator.seedRecordings(in: context, includeAllSamples: true)

        // Verify all recordings were created
        #expect(entities.count == 5)
        #expect(entities[0].title == "Growing Up in Boston")
        #expect(entities[1].title == "The Day I Met Sarah")
        #expect(entities[2].title == "My Years at the Shipyard")
        #expect(entities[3].title == "Family History and Heritage")
        #expect(entities[4].title == "Test Recording - Silence")
    }

    @Test("Seed database with partial samples")
    func testSeedDatabasePartial() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        // Seed with only first 3 samples
        let entities = generator.seedRecordings(in: context, includeAllSamples: false)

        #expect(entities.count == 3)
    }

    @Test("Create sample profile")
    func testCreateSampleProfile() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        // Create profile with full data from multi-generational sample
        let profile = generator.createSampleProfile(in: context)

        // Verify profile data
        #expect(profile.fullName == "James Patrick O'Connor")
        #expect(profile.placeOfBirth == "Boston, Massachusetts")
        #expect(profile.motherFullName == "Mary Catherine O'Connor")
        #expect(profile.motherMaidenName == "Sullivan")
        #expect(profile.fatherFullName == "William Joseph O'Connor")
        #expect(profile.spouseName == "Sarah Elizabeth O'Connor")
        #expect(profile.whereMetSpouse == "St. Patrick's Cathedral")
    }

    @Test("Create custom profile")
    func testCreateCustomProfile() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        // Create custom profile data
        let customData = TestDataGenerator.ExtractedProfileData(
            fullName: "Test User",
            placeOfBirth: "New York, NY",
            motherFullName: "Test Mother"
        )

        let profile = generator.createSampleProfile(in: context, withData: customData)

        #expect(profile.fullName == "Test User")
        #expect(profile.placeOfBirth == "New York, NY")
        #expect(profile.motherFullName == "Test Mother")
    }

    // MARK: - Data Cleanup Examples

    @Test("Clear test data")
    func testClearTestData() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        // Seed data
        generator.seedRecordings(in: context, includeAllSamples: true)
        generator.createSampleProfile(in: context)

        // Clear all test data
        generator.clearAllTestData(in: context)

        // Verify data was cleared
        let recordingFetch: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        let recordings = try context.fetch(recordingFetch)
        #expect(recordings.isEmpty)

        let profileFetch: NSFetchRequest<ProfileInfoEntity> = ProfileInfoEntity.fetchRequest()
        let profiles = try context.fetch(profileFetch)
        #expect(profiles.isEmpty)
    }

    // MARK: - Helper Method Examples

    @Test("Verify recording matches sample")
    func testVerifyRecordingMatchesSample() async throws {
        let sample = TestDataGenerator.SampleRecordings.bostonChildhood
        let recording = sample.toSavedRecording()

        let matches = TestDataGenerator.verify(recording, matches: sample)
        #expect(matches == true)
    }

    @Test("Verify profile has data")
    func testVerifyProfileHasData() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        let profile = generator.createSampleProfile(in: context)
        let hasData = TestDataGenerator.verifyProfileHasData(profile)
        #expect(hasData == true)

        // Test empty profile
        let emptyProfile = ProfileInfoEntity(context: context)
        let emptyHasData = TestDataGenerator.verifyProfileHasData(emptyProfile)
        #expect(emptyHasData == false)
    }

    // MARK: - Random Data Examples

    @Test("Generate multiple random recordings")
    func testGenerateMultipleRandomRecordings() async throws {
        let generator = TestDataGenerator.shared
        let recordings = generator.generateRandomRecordings(count: 10)

        #expect(recordings.count == 10)

        // Verify each recording has valid data
        for recording in recordings {
            #expect(!recording.title.isEmpty)
            #expect(recording.duration > 0)
        }
    }

    @Test("Seed random recordings to database")
    func testSeedRandomRecordings() async throws {
        let context = TestDataGenerator.createInMemoryContext()
        let generator = TestDataGenerator.shared

        let entities = generator.seedRandomRecordings(in: context, count: 5)

        #expect(entities.count == 5)
    }

    // MARK: - Date Helper Examples

    @Test("Create specific date")
    func testCreateSpecificDate() async throws {
        let date = TestDataGenerator.DateHelper.createDate(year: 1945, month: 3, day: 15)

        #expect(date != nil)

        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: date!)
        #expect(components.year == 1945)
        #expect(components.month == 3)
        #expect(components.day == 15)
    }

    @Test("Generate date from days ago")
    func testDaysAgo() async throws {
        let date = TestDataGenerator.DateHelper.daysAgo(7)
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!

        let calendar = Calendar.current
        let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)
        let expectedComponents = calendar.dateComponents([.year, .month, .day], from: weekAgo)

        #expect(dateComponents == expectedComponents)
    }

    // MARK: - Extracted Profile Data Examples

    @Test("Verify extracted profile data from samples")
    func testExtractedProfileData() async throws {
        // Boston childhood should have partial profile data
        let bostonProfile = TestDataGenerator.SampleRecordings.bostonChildhood.extractedProfile
        #expect(bostonProfile?.placeOfBirth == "Boston, Massachusetts")
        #expect(bostonProfile?.motherFullName == "Mary O'Connor")
        #expect(bostonProfile?.fatherFullName == "William O'Connor")
        #expect(bostonProfile?.fullName == nil) // Not in transcription

        // Wedding story should have spouse data
        let weddingProfile = TestDataGenerator.SampleRecordings.weddingStory.extractedProfile
        #expect(weddingProfile?.spouseName == "Sarah O'Connor")
        #expect(weddingProfile?.whereMetSpouse == "St. Patrick's Cathedral")

        // Career story should have no profile data
        let careerProfile = TestDataGenerator.SampleRecordings.careerStory.extractedProfile
        #expect(careerProfile == nil)

        // Multi-generational should have complete profile
        let fullProfile = TestDataGenerator.SampleRecordings.multiGenerational.extractedProfile
        #expect(fullProfile?.fullName == "James Patrick O'Connor")
        #expect(fullProfile?.dateOfBirth != nil)
        #expect(fullProfile?.placeOfBirth != nil)
        #expect(fullProfile?.motherFullName != nil)
        #expect(fullProfile?.motherMaidenName != nil)
        #expect(fullProfile?.fatherFullName != nil)
        #expect(fullProfile?.spouseName != nil)
    }

    // MARK: - Convenience Extension Examples

    @Test("Use RecordingDataManager convenience methods")
    @MainActor
    func testRecordingDataManagerExtensions() async throws {
        // Note: These methods use the shared RecordingDataManager instance
        // In production tests, you might want to use a test instance

        let manager = RecordingDataManager.shared

        // Clear any existing test data
        manager.clearTestData()

        // Seed test data
        manager.seedTestData(includeAllSamples: true)

        // Verify data was seeded
        #expect(manager.savedRecordings.count >= 5)
    }
}
