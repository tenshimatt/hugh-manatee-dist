//
//  RecordingDataManagerTests.swift
//  AuroraTests
//
//  Comprehensive unit tests for RecordingDataManager
//

import Testing
import Foundation
import CoreData
@testable import Aurora

@MainActor
struct RecordingDataManagerTests {

    // MARK: - Test Setup

    /// Creates a test instance of RecordingDataManager with in-memory storage
    func createTestManager() -> RecordingDataManager {
        let testStack = CoreDataTestStack()
        return RecordingDataManager(testContainer: testStack.persistentContainer)
    }

    // MARK: - Core Data Model Tests

    @Test("Core Data model entities exist")
    func testCoreDataModelEntities() async throws {
        let manager = createTestManager()
        let model = manager.persistentContainer.managedObjectModel

        // Verify Recording entity exists
        let recordingEntity = model.entitiesByName["Recording"]
        #expect(recordingEntity != nil, "Recording entity should exist in the model")

        // Verify ProfileInfoEntity exists
        let profileEntity = model.entitiesByName["ProfileInfoEntity"]
        #expect(profileEntity != nil, "ProfileInfoEntity should exist in the model")

        // Verify Recording entity has all required attributes
        let recordingAttributes = recordingEntity?.attributesByName
        #expect(recordingAttributes?["id"] != nil, "Recording should have id attribute")
        #expect(recordingAttributes?["title"] != nil, "Recording should have title attribute")
        #expect(recordingAttributes?["transcription"] != nil, "Recording should have transcription attribute")
        #expect(recordingAttributes?["date"] != nil, "Recording should have date attribute")
        #expect(recordingAttributes?["duration"] != nil, "Recording should have duration attribute")
        #expect(recordingAttributes?["audioFilePath"] != nil, "Recording should have audioFilePath attribute")
        #expect(recordingAttributes?["category"] != nil, "Recording should have category attribute")
    }

    // MARK: - Save Recording Tests

    @Test("Save recording creates and persists recording")
    func testSaveRecording() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        // Initial state should be empty
        #expect(manager.savedRecordings.isEmpty, "Manager should start with no recordings")

        // Save a recording
        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        // Verify recording was saved
        #expect(manager.savedRecordings.count == 1, "Should have 1 recording after save")

        let saved = manager.savedRecordings[0]
        #expect(saved.title == sample.title, "Title should match")
        #expect(saved.transcription == sample.transcription, "Transcription should match")
        #expect(saved.duration == sample.duration, "Duration should match")
        #expect(saved.category == sample.category, "Category should match")
        #expect(saved.audioFilePath == nil, "Audio file path should be nil when no URL provided")
    }

    @Test("Save recording with audio URL stores path")
    func testSaveRecordingWithAudioURL() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording2()
        let audioURL = URL(fileURLWithPath: "/tmp/test_audio.m4a")

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: audioURL,
            category: sample.category
        )

        #expect(manager.savedRecordings.count == 1)
        let saved = manager.savedRecordings[0]
        #expect(saved.audioFilePath == audioURL.path, "Audio file path should be stored")
    }

    @Test("Save multiple recordings")
    func testSaveMultipleRecordings() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        #expect(manager.savedRecordings.count == samples.count, "Should have saved all recordings")
    }

    // MARK: - Load Recordings Tests

    @Test("Load all recordings fetches all recordings sorted by date")
    func testLoadAllRecordingsSortedByDate() async throws {
        let testStack = CoreDataTestStack()
        let manager = RecordingDataManager(testContainer: testStack.persistentContainer)

        // Create recordings with specific dates
        let calendar = Calendar.current
        let now = Date()

        let oldest = testStack.createTestRecording(
            title: "Oldest",
            date: calendar.date(byAdding: .day, value: -30, to: now)!
        )
        let middle = testStack.createTestRecording(
            title: "Middle",
            date: calendar.date(byAdding: .day, value: -15, to: now)!
        )
        let newest = testStack.createTestRecording(
            title: "Newest",
            date: now
        )

        // Load recordings
        manager.loadAllRecordings()

        // Verify sorting (newest first)
        #expect(manager.savedRecordings.count == 3, "Should have 3 recordings")
        #expect(manager.savedRecordings[0].title == "Newest", "First should be newest")
        #expect(manager.savedRecordings[1].title == "Middle", "Second should be middle")
        #expect(manager.savedRecordings[2].title == "Oldest", "Third should be oldest")
    }

    @Test("Load recordings sets isLoading flag")
    func testLoadRecordingsIsLoadingFlag() async throws {
        let manager = createTestManager()

        // Initially loading should be false
        #expect(manager.isLoading == false, "Should not be loading initially")

        // After loadAllRecordings completes, should be false again
        manager.loadAllRecordings()
        #expect(manager.isLoading == false, "Should not be loading after load completes")
    }

    @Test("Load recordings handles empty database")
    func testLoadRecordingsEmptyDatabase() async throws {
        let manager = createTestManager()

        manager.loadAllRecordings()

        #expect(manager.savedRecordings.isEmpty, "Should have no recordings in empty database")
        #expect(manager.isLoading == false, "Should not be loading")
    }

    // MARK: - Delete Recording Tests

    @Test("Delete recording removes recording and audio file")
    func testDeleteRecording() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        // Create a temporary audio file
        let tempDir = FileManager.default.temporaryDirectory
        let audioURL = tempDir.appendingPathComponent("test_delete_audio.m4a")
        FileManager.default.createFile(atPath: audioURL.path, contents: Data("test".utf8))

        // Save recording with audio file
        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: audioURL,
            category: sample.category
        )

        #expect(manager.savedRecordings.count == 1, "Should have 1 recording")
        #expect(FileManager.default.fileExists(atPath: audioURL.path), "Audio file should exist")

        // Delete recording
        let recordingToDelete = manager.savedRecordings[0]
        manager.deleteRecording(recordingToDelete)

        // Verify deletion
        #expect(manager.savedRecordings.isEmpty, "Recording should be deleted")
        #expect(!FileManager.default.fileExists(atPath: audioURL.path), "Audio file should be deleted")
    }

    @Test("Delete recording without audio file")
    func testDeleteRecordingWithoutAudioFile() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        #expect(manager.savedRecordings.count == 1)

        let recordingToDelete = manager.savedRecordings[0]
        manager.deleteRecording(recordingToDelete)

        #expect(manager.savedRecordings.isEmpty, "Recording should be deleted")
    }

    @Test("Delete one of multiple recordings")
    func testDeleteOneRecordingFromMultiple() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        // Save multiple recordings
        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let initialCount = manager.savedRecordings.count
        #expect(initialCount == samples.count)

        // Delete the middle one
        let recordingToDelete = manager.savedRecordings[2]
        manager.deleteRecording(recordingToDelete)

        #expect(manager.savedRecordings.count == initialCount - 1, "Should have one less recording")
        #expect(!manager.savedRecordings.contains(where: { $0.id == recordingToDelete.id }),
                "Deleted recording should not be in list")
    }

    // MARK: - Update Recording Tests

    @Test("Update recording title")
    func testUpdateRecordingTitle() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        let recording = manager.savedRecordings[0]
        let newTitle = "Updated Title"

        manager.updateRecording(recording, title: newTitle, category: nil)

        #expect(manager.savedRecordings[0].title == newTitle, "Title should be updated")
        #expect(manager.savedRecordings[0].transcription == sample.transcription,
                "Transcription should remain unchanged")
    }

    @Test("Update recording category")
    func testUpdateRecordingCategory() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        let recording = manager.savedRecordings[0]
        let newCategory = "Travel"

        manager.updateRecording(recording, title: nil, category: newCategory)

        #expect(manager.savedRecordings[0].category == newCategory, "Category should be updated")
        #expect(manager.savedRecordings[0].title == sample.title,
                "Title should remain unchanged")
    }

    @Test("Update recording title and category")
    func testUpdateRecordingTitleAndCategory() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        let recording = manager.savedRecordings[0]
        let newTitle = "Brand New Title"
        let newCategory = "Achievements"

        manager.updateRecording(recording, title: newTitle, category: newCategory)

        #expect(manager.savedRecordings[0].title == newTitle, "Title should be updated")
        #expect(manager.savedRecordings[0].category == newCategory, "Category should be updated")
    }

    // MARK: - Search Recording Tests

    @Test("Search recordings by title")
    func testSearchRecordingsByTitle() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let results = manager.searchRecordings(query: "School")

        #expect(results.count == 1, "Should find 1 recording with 'School' in title")
        #expect(results[0].title.contains("School"), "Result should contain 'School'")
    }

    @Test("Search recordings by transcription")
    func testSearchRecordingsByTranscription() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let results = manager.searchRecordings(query: "dance")

        #expect(results.count == 1, "Should find 1 recording with 'dance' in transcription")
        #expect(results[0].transcription.localizedCaseInsensitiveContains("dance"),
                "Result transcription should contain 'dance'")
    }

    @Test("Search recordings by category")
    func testSearchRecordingsByCategory() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let results = manager.searchRecordings(query: "Family")

        #expect(results.count == 1, "Should find 1 recording with 'Family' category")
        #expect(results[0].category == "Family", "Result should have Family category")
    }

    @Test("Search recordings case insensitive")
    func testSearchRecordingsCaseInsensitive() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.sampleRecording1()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        let results1 = manager.searchRecordings(query: "school")
        let results2 = manager.searchRecordings(query: "SCHOOL")
        let results3 = manager.searchRecordings(query: "ScHoOl")

        #expect(results1.count == 1, "Lowercase search should find recording")
        #expect(results2.count == 1, "Uppercase search should find recording")
        #expect(results3.count == 1, "Mixed case search should find recording")
    }

    @Test("Search recordings with empty query returns all")
    func testSearchRecordingsEmptyQuery() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let results = manager.searchRecordings(query: "")

        #expect(results.count == samples.count, "Empty query should return all recordings")
    }

    @Test("Search recordings with no matches returns empty")
    func testSearchRecordingsNoMatches() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        let results = manager.searchRecordings(query: "xyz123nonexistent")

        #expect(results.isEmpty, "Search with no matches should return empty array")
    }

    // MARK: - Statistics Tests

    @Test("Total recordings count")
    func testTotalRecordings() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.allSampleRecordings()

        #expect(manager.totalRecordings == 0, "Should start with 0 recordings")

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        #expect(manager.totalRecordings == samples.count,
                "Total recordings should match saved count")
    }

    @Test("Total duration calculation")
    func testTotalDuration() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.statisticsTestSet()

        var expectedDuration: TimeInterval = 0
        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
            expectedDuration += sample.duration
        }

        #expect(manager.totalDuration == expectedDuration,
                "Total duration should be sum of all recording durations")
        #expect(manager.totalDuration == 60.0,
                "Total duration should be 60 seconds (10+20+30)")
    }

    @Test("Total words calculation")
    func testTotalWords() async throws {
        let manager = createTestManager()
        let samples = TestDataGenerator.statisticsTestSet()

        for sample in samples {
            manager.saveRecording(
                title: sample.title,
                transcription: sample.transcription,
                duration: sample.duration,
                audioURL: nil,
                category: sample.category
            )
        }

        // Statistics test set has: 5 + 10 + 15 = 30 words
        #expect(manager.totalWords == 30,
                "Total words should be 30 (5+10+15)")
    }

    @Test("Statistics with empty recordings")
    func testStatisticsWithEmptyRecordings() async throws {
        let manager = createTestManager()

        #expect(manager.totalRecordings == 0, "Total recordings should be 0")
        #expect(manager.totalDuration == 0, "Total duration should be 0")
        #expect(manager.totalWords == 0, "Total words should be 0")
    }

    @Test("Statistics with empty transcription")
    func testStatisticsWithEmptyTranscription() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.emptyTranscription()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        #expect(manager.totalRecordings == 1, "Should have 1 recording")
        #expect(manager.totalDuration == sample.duration, "Duration should be recorded")
        #expect(manager.totalWords == 0, "Empty transcription should have 0 words")
    }

    // MARK: - Edge Case Tests

    @Test("Handle special characters in title")
    func testSpecialCharactersInTitle() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.specialCharactersTitle()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        #expect(manager.savedRecordings.count == 1)
        #expect(manager.savedRecordings[0].title == sample.title,
                "Should preserve special characters in title")
    }

    @Test("Handle very long transcription")
    func testVeryLongTranscription() async throws {
        let manager = createTestManager()
        let sample = TestDataGenerator.veryLongTranscription()

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        #expect(manager.savedRecordings.count == 1)
        #expect(manager.savedRecordings[0].transcription == sample.transcription,
                "Should handle very long transcriptions")
    }

    @Test("SavedRecording computed properties")
    func testSavedRecordingComputedProperties() async throws {
        let (manager, testStack) = createTestManager()
        let sample = TestDataGenerator.SampleRecordings.bostonChildhood

        manager.saveRecording(
            title: sample.title,
            transcription: sample.transcription,
            duration: sample.duration,
            audioURL: nil,
            category: sample.category
        )

        let recording = manager.savedRecordings[0]

        // Test wordCount
        let expectedWords = sample.transcription.split(separator: " ").count
        #expect(recording.wordCount == expectedWords, "Word count should match")

        // Test formattedDuration
        let minutes = Int(sample.duration) / 60
        let seconds = Int(sample.duration) % 60
        let expectedFormat = String(format: "%d:%02d", minutes, seconds)
        #expect(recording.formattedDuration == expectedFormat, "Duration format should match")

        // Test formattedDate
        #expect(!recording.formattedDate.isEmpty, "Formatted date should not be empty")
    }
}
