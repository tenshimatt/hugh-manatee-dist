// RecordingDataManager.swift
// Core Data persistence for recordings

import Foundation
import CoreData
import Combine

@MainActor
class RecordingDataManager: ObservableObject {
    static let shared = RecordingDataManager()

    @Published var savedRecordings: [SavedRecording] = []
    @Published var isLoading = false
    @Published var stories: [Story] = []

    // Core Data stack
    let persistentContainer: NSPersistentContainer

    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    private init() {
        // Create model programmatically
        let model = RecordingDataManager.createModel()
        let container = NSPersistentContainer(name: "LifebookData", managedObjectModel: model)
        container.loadPersistentStores { description, error in
            if let error = error {
                print("[RecordingDataManager] Core Data failed to load: \(error.localizedDescription)")
            }
        }
        self.persistentContainer = container
        loadAllRecordings()
        loadStories()
    }

    // Internal initializer for testing
    internal init(testContainer: NSPersistentContainer) {
        self.persistentContainer = testContainer
        loadAllRecordings()
        loadStories()
    }

    // MARK: - Setup

    private static func createModel() -> NSManagedObjectModel {
        // Create model programmatically since we don't have .xcdatamodeld file
        let model = NSManagedObjectModel()

        // Create Recording entity
        let recordingEntity = NSEntityDescription()
        recordingEntity.name = "Recording"
        recordingEntity.managedObjectClassName = NSStringFromClass(RecordingEntity.self)

        // Add attributes
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

        let aiStoryTextAttribute = NSAttributeDescription()
        aiStoryTextAttribute.name = "aiStoryText"
        aiStoryTextAttribute.attributeType = .stringAttributeType
        aiStoryTextAttribute.isOptional = true

        let editHistoryAttribute = NSAttributeDescription()
        editHistoryAttribute.name = "editHistory"
        editHistoryAttribute.attributeType = .binaryDataAttributeType
        editHistoryAttribute.isOptional = true

        let storyIdAttribute = NSAttributeDescription()
        storyIdAttribute.name = "storyId"
        storyIdAttribute.attributeType = .UUIDAttributeType
        storyIdAttribute.isOptional = true

        recordingEntity.properties = [
            idAttribute,
            titleAttribute,
            transcriptionAttribute,
            dateAttribute,
            durationAttribute,
            audioFilePathAttribute,
            categoryAttribute,
            aiStoryTextAttribute,
            editHistoryAttribute,
            storyIdAttribute
        ]

        // Create ProfileInfoEntity
        let profileEntity = NSEntityDescription()
        profileEntity.name = "ProfileInfoEntity"
        profileEntity.managedObjectClassName = NSStringFromClass(ProfileInfoEntity.self)

        // Add profile attributes
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

        let childrenNamesAttr = NSAttributeDescription()
        childrenNamesAttr.name = "childrenNames"
        childrenNamesAttr.attributeType = .stringAttributeType
        childrenNamesAttr.isOptional = true

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
            whereMetSpouseAttr,
            childrenNamesAttr
        ]

        model.entities = [recordingEntity, profileEntity]
        return model
    }

    // MARK: - Save Recording

    func saveRecording(
        title: String,
        transcription: String,
        aiStoryText: String? = nil,
        editHistory: [StoryVersion]? = nil,
        duration: TimeInterval,
        audioURL: URL?,
        category: String? = nil,
        storyId: UUID? = nil
    ) {
        let recording = RecordingEntity(context: context)
        recording.id = UUID()
        recording.title = title
        recording.transcription = transcription
        recording.aiStoryText = aiStoryText
        recording.date = Date()
        recording.duration = duration
        recording.audioFilePath = audioURL?.path
        recording.category = category
        recording.storyId = storyId

        // Encode edit history
        if let editHistory = editHistory {
            recording.editHistory = try? JSONEncoder().encode(editHistory)
        }

        do {
            try context.save()
            loadAllRecordings()
            print("[RecordingDataManager] Saved recording: \(title)")
        } catch {
            print("[RecordingDataManager] Failed to save recording: \(error.localizedDescription)")
        }
    }

    // Update AI story text for existing recording
    func updateAIStory(for recordingId: UUID, aiStoryText: String, editHistory: [StoryVersion]) {
        let fetchRequest: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", recordingId as CVarArg)

        do {
            let results = try context.fetch(fetchRequest)
            if let recording = results.first {
                recording.aiStoryText = aiStoryText
                recording.editHistory = try? JSONEncoder().encode(editHistory)
                try context.save()
                loadAllRecordings()
            }
        } catch {
            print("[RecordingDataManager] Failed to update AI story: \(error.localizedDescription)")
        }
    }

    // MARK: - Load Recordings

    func loadAllRecordings() {
        isLoading = true

        let fetchRequest: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "date", ascending: false)]

        do {
            let recordings = try context.fetch(fetchRequest)
            savedRecordings = recordings.map { recording in
                // Decode edit history if exists
                var editHistory: [StoryVersion]? = nil
                if let data = recording.editHistory {
                    editHistory = try? JSONDecoder().decode([StoryVersion].self, from: data)
                }

                return SavedRecording(
                    id: recording.id ?? UUID(),
                    title: recording.title ?? "Untitled",
                    transcription: recording.transcription ?? "",
                    aiStoryText: recording.aiStoryText,
                    editHistory: editHistory,
                    date: recording.date ?? Date(),
                    duration: recording.duration,
                    audioFilePath: recording.audioFilePath,
                    category: recording.category,
                    storyId: recording.storyId
                )
            }
            print("[RecordingDataManager] Loaded \(savedRecordings.count) recordings")
        } catch {
            print("[RecordingDataManager] Failed to load recordings: \(error.localizedDescription)")
            savedRecordings = []
        }

        isLoading = false
    }

    // MARK: - Delete Recording

    func deleteRecording(_ recording: SavedRecording) {
        let fetchRequest: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", recording.id as CVarArg)

        do {
            let results = try context.fetch(fetchRequest)
            if let recordingToDelete = results.first {
                // Delete audio file if exists
                if let audioPath = recordingToDelete.audioFilePath {
                    try? FileManager.default.removeItem(atPath: audioPath)
                }

                context.delete(recordingToDelete)
                try context.save()
                loadAllRecordings()
                print("[RecordingDataManager] Deleted recording: \(recording.title)")
            }
        } catch {
            print("[RecordingDataManager] Failed to delete recording: \(error.localizedDescription)")
        }
    }

    // MARK: - Update Recording

    func updateRecording(_ recording: SavedRecording, title: String? = nil, category: String? = nil) {
        let fetchRequest: NSFetchRequest<RecordingEntity> = RecordingEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", recording.id as CVarArg)

        do {
            let results = try context.fetch(fetchRequest)
            if let recordingToUpdate = results.first {
                if let title = title {
                    recordingToUpdate.title = title
                }
                if let category = category {
                    recordingToUpdate.category = category
                }

                try context.save()
                loadAllRecordings()
                print("[RecordingDataManager] Updated recording: \(recording.title)")
            }
        } catch {
            print("[RecordingDataManager] Failed to update recording: \(error.localizedDescription)")
        }
    }

    // MARK: - Search

    func searchRecordings(query: String) -> [SavedRecording] {
        guard !query.isEmpty else { return savedRecordings }

        return savedRecordings.filter { recording in
            recording.title.localizedCaseInsensitiveContains(query) ||
            recording.transcription.localizedCaseInsensitiveContains(query) ||
            (recording.category?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }

    // MARK: - Statistics

    var totalRecordings: Int {
        return savedRecordings.count
    }

    var totalDuration: TimeInterval {
        return savedRecordings.reduce(0) { $0 + $1.duration }
    }

    var totalWords: Int {
        return savedRecordings.reduce(0) { total, recording in
            total + recording.transcription.split(separator: " ").count
        }
    }

    // MARK: - Story Management

    func loadStories() {
        // Load from UserDefaults for now
        if let data = UserDefaults.standard.data(forKey: "stories"),
           let decoded = try? JSONDecoder().decode([Story].self, from: data) {
            stories = decoded
        }
    }

    func saveStory(_ story: Story) {
        stories.append(story)
        saveStoriesToDisk()
    }

    func updateStory(_ story: Story) {
        if let index = stories.firstIndex(where: { $0.id == story.id }) {
            stories[index] = story
            saveStoriesToDisk()
        }
    }

    func deleteStory(_ story: Story) {
        stories.removeAll { $0.id == story.id }
        saveStoriesToDisk()
    }

    private func saveStoriesToDisk() {
        if let encoded = try? JSONEncoder().encode(stories) {
            UserDefaults.standard.set(encoded, forKey: "stories")
        }
    }
}

// MARK: - Core Data Models

@objc(RecordingEntity)
class RecordingEntity: NSManagedObject {
    @NSManaged var id: UUID?
    @NSManaged var title: String?
    @NSManaged var transcription: String?
    @NSManaged var date: Date?
    @NSManaged var duration: TimeInterval
    @NSManaged var audioFilePath: String?
    @NSManaged var category: String?
    @NSManaged var aiStoryText: String?
    @NSManaged var editHistory: Data?
    @NSManaged var storyId: UUID?
}

extension RecordingEntity {
    @nonobjc class func fetchRequest() -> NSFetchRequest<RecordingEntity> {
        return NSFetchRequest<RecordingEntity>(entityName: "Recording")
    }
}

// MARK: - Swift Model

struct SavedRecording: Identifiable {
    let id: UUID
    let title: String
    let transcription: String
    var aiStoryText: String?
    var editHistory: [StoryVersion]?
    let date: Date
    let duration: TimeInterval
    let audioFilePath: String?
    let category: String?
    var storyId: UUID?

    var wordCount: Int {
        transcription.split(separator: " ").count
    }

    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    // Story categories for organization
    static let categories = [
        "Childhood",
        "Family",
        "Career",
        "Travel",
        "Relationships",
        "Hobbies",
        "Life Lessons",
        "Achievements",
        "Challenges",
        "General"
    ]
}
