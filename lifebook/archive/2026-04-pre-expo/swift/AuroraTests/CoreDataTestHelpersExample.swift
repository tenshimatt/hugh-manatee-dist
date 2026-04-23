//
//  CoreDataTestHelpersExample.swift
//  AuroraTests
//
//  Example tests demonstrating how to use CoreDataTestHelpers
//

import XCTest
import CoreData
@testable import Aurora

final class CoreDataTestHelpersExampleTests: XCTestCase {

    var testStack: CoreDataTestStack!
    var context: NSManagedObjectContext!

    override func setUp() {
        super.setUp()
        testStack = CoreDataTestStack()
        context = testStack.context
        testStack.clearAllData()
    }

    override func tearDown() {
        testStack.clearAllData()
        context = nil
        testStack = nil
        super.tearDown()
    }

    // MARK: - Profile Fixtures Examples

    func testEmptyProfileHasZeroCompletion() {
        // Given: An empty profile
        let profile = ProfileTestFixtures.emptyProfile(context: context)

        // Then: Completion should be 0%
        XCTAssertEqual(profile.completionPercentage, 0)
        XCTAssertFalse(profile.isProfileComplete)
    }

    func testPartialProfileHasFiftyPercentCompletion() {
        // Given: A partial profile
        let profile = ProfileTestFixtures.partialProfile(context: context)

        // Then: Completion should be 50%
        XCTAssertEqual(profile.completionPercentage, 50)
        XCTAssertFalse(profile.isProfileComplete)

        // And: Should have expected fields filled
        XCTAssertEqual(profile.fullName, "John Smith")
        XCTAssertNotNil(profile.dateOfBirth)
        XCTAssertEqual(profile.placeOfBirth, "New York, NY")

        // And: Should have expected fields missing
        XCTAssertNil(profile.motherFullName)
        XCTAssertNil(profile.motherMaidenName)
        XCTAssertNil(profile.fatherFullName)
    }

    func testCompleteProfileHasHundredPercentCompletion() {
        // Given: A complete profile
        let profile = ProfileTestFixtures.completeProfile(context: context)

        // Then: Completion should be 100%
        XCTAssertEqual(profile.completionPercentage, 100)
        XCTAssertTrue(profile.isProfileComplete)

        // And: All critical fields should be filled
        XCTAssertNotNil(profile.fullName)
        XCTAssertNotNil(profile.dateOfBirth)
        XCTAssertNotNil(profile.placeOfBirth)
        XCTAssertNotNil(profile.motherFullName)
        XCTAssertNotNil(profile.motherMaidenName)
        XCTAssertNotNil(profile.fatherFullName)
    }

    // MARK: - Recording Fixtures Examples

    func testChildhoodRecordingHasCorrectCategory() {
        // Given: A childhood recording
        let recording = RecordingTestFixtures.childhoodRecording(context: context)

        // Then: Should have correct category and properties
        XCTAssertEqual(recording.category, "Childhood")
        XCTAssertEqual(recording.title, "My First Day of School")
        XCTAssertEqual(recording.duration, 45.0)
    }

    func testCreateMultipleRecordings() {
        // Given: Create 5 recordings
        let recordings = RecordingTestFixtures.createMultipleRecordings(context: context, count: 5)

        // Then: Should have 5 recordings
        XCTAssertEqual(recordings.count, 5)

        // And: Each should have unique properties
        XCTAssertEqual(recordings[0].title, "Recording 1")
        XCTAssertEqual(recordings[4].title, "Recording 5")
    }

    // MARK: - Helper Functions Examples

    func testCreateTestRecordingWithDefaults() {
        // When: Creating a recording with default values
        let recording = createTestRecording(context: context)

        // Then: Should have default properties
        XCTAssertEqual(recording.title, "Test Recording")
        XCTAssertEqual(recording.duration, 120.0)
        XCTAssertNotNil(recording.id)
    }

    func testCreateTestRecordingWithCustomValues() {
        // When: Creating a recording with custom values
        let recording = createTestRecording(
            context: context,
            title: "Custom Title",
            transcription: "Custom transcription text",
            duration: 300.0
        )

        // Then: Should have custom properties
        XCTAssertEqual(recording.title, "Custom Title")
        XCTAssertEqual(recording.transcription, "Custom transcription text")
        XCTAssertEqual(recording.duration, 300.0)
    }

    func testClearAllDataRemovesEverything() {
        // Given: Some test data
        _ = createTestRecording(context: context)
        _ = createTestProfile(context: context)

        // Verify data exists
        let recordingFetch: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        let profileFetch: NSFetchRequest<ProfileInfoEntity> = ProfileInfoEntity.fetchRequest()

        let recordingsBefore = try? context.fetch(recordingFetch)
        let profilesBefore = try? context.fetch(profileFetch)

        XCTAssertEqual(recordingsBefore?.count, 1)
        XCTAssertEqual(profilesBefore?.count, 1)

        // When: Clearing all data
        clearAllData(context: context)

        // Then: All data should be removed
        let recordingsAfter = try? context.fetch(recordingFetch)
        let profilesAfter = try? context.fetch(profileFetch)

        XCTAssertEqual(recordingsAfter?.count, 0)
        XCTAssertEqual(profilesAfter?.count, 0)
    }

    // MARK: - TestStack Methods Examples

    func testTestStackCreateTestRecording() {
        // When: Using test stack to create recording
        let recording = testStack.createTestRecording(
            title: "Stack Recording",
            duration: 60.0
        )

        // Then: Recording should be saved
        XCTAssertEqual(recording.title, "Stack Recording")
        XCTAssertEqual(recording.duration, 60.0)

        // And: Should be fetchable
        let fetch: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        let results = try? context.fetch(fetch)
        XCTAssertEqual(results?.count, 1)
    }

    func testTestStackCreateTestProfile() {
        // When: Using test stack to create profile
        let profile = testStack.createTestProfile(
            fullName: "Test User",
            dateOfBirth: Date(),
            placeOfBirth: "Test City"
        )

        // Then: Profile should be saved
        XCTAssertEqual(profile.fullName, "Test User")
        XCTAssertEqual(profile.placeOfBirth, "Test City")

        // And: Should be fetchable
        let fetch: NSFetchRequest<ProfileInfoEntity> = ProfileInfoEntity.fetchRequest()
        let results = try? context.fetch(fetch)
        XCTAssertEqual(results?.count, 1)
    }
}
