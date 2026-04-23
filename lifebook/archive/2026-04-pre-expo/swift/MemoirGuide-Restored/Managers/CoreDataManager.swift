// CoreDataManager.swift
// Core Data stack with CloudKit synchronization for Life Book

import CoreData
import CloudKit
import SwiftUI
import Combine
import OSLog

@MainActor
class CoreDataManager: ObservableObject {
    static let shared = CoreDataManager()

    private let logger = Logger(subsystem: "com.tenshimatt.memoirguide", category: "CoreData")

    // MARK: - Published Properties
    @Published var isCloudKitReady = false
    @Published var syncStatus: SyncStatus = .idle
    @Published var syncError: Error?
    @Published var lastSyncDate: Date?

    enum SyncStatus {
        case idle
        case syncing
        case error(Error)
        case success
    }

    // MARK: - Core Data Stack

    lazy var persistentContainer: NSPersistentCloudKitContainer = {
        let container = NSPersistentCloudKitContainer(name: "LifeBook")

        // Configure CloudKit - create store description if needed
        guard let storeDescription = container.persistentStoreDescriptions.first else {
            fatalError("Failed to find persistent store description. Make sure LifeBook.xcdatamodeld is included in the target.")
        }

        storeDescription.url = getStoreURL()

        // Security: Enable encryption at rest
        storeDescription.setOption(
            FileProtectionType.complete as NSObject,
            forKey: NSPersistentStoreFileProtectionKey
        )

        // CloudKit configuration
        storeDescription.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
        storeDescription.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)

        // CloudKit container configuration
        let cloudKitContainerOptions = NSPersistentCloudKitContainerOptions(
            containerIdentifier: "iCloud.com.tenshimatt.memoirguide"
        )
        storeDescription.cloudKitContainerOptions = cloudKitContainerOptions

        container.loadPersistentStores { [weak self] _, error in
            if let error = error {
                self?.logger.error("Failed to load Core Data store: \(error.localizedDescription)")
                fatalError("Core Data failed to load: \(error.localizedDescription)")
            } else {
                self?.logger.info("Core Data store loaded successfully")
                Task { @MainActor in
                    self?.isCloudKitReady = true
                    self?.setupRemoteChangeNotifications()
                }
            }
        }

        // Automatically merge changes from parent
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        return container
    }()

    var context: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    // MARK: - Initialization

    private init() {
        setupNotifications()
    }

    // MARK: - Core Data Operations

    func save() throws {
        if context.hasChanges {
            try context.save()
            logger.info("Context saved successfully")
        }
    }

    // MARK: - Entity Creation Methods

    func createMemoirSession() -> MemoirSessionEntity {
        let session = MemoirSessionEntity(context: context)
        session.id = UUID()
        session.createdAt = Date()
        session.lastModified = Date()
        session.status = "active"
        session.sessionNumber = Int16(getNextSessionNumber())
        return session
    }

    func createMemoirSegment(for session: MemoirSessionEntity,
                           transcription: String,
                           audioFileName: String?,
                           duration: Double,
                           aiPrompt: String? = nil) -> MemoirSegmentEntity {
        let segment = MemoirSegmentEntity(context: context)
        segment.id = UUID()
        segment.createdAt = Date()
        segment.lastModified = Date()
        segment.transcription = transcription
        segment.audioFileName = audioFileName
        segment.duration = duration
        segment.aiPrompt = aiPrompt
        segment.wordCount = Int16(transcription.wordCount)
        segment.sequenceNumber = Int16((session.segments?.count ?? 0) + 1)

        // Associate with session
        segment.session = session

        return segment
    }

    func createChapter(title: String, userProfile: UserProfileEntity?) -> ChapterEntity {
        let chapter = ChapterEntity(context: context)
        chapter.id = UUID()
        chapter.createdAt = Date()
        chapter.lastModified = Date()
        chapter.title = title
        chapter.status = "draft"
        chapter.chapterNumber = Int16(getNextChapterNumber(for: userProfile))
        chapter.userProfile = userProfile
        return chapter
    }

    func getUserProfile() -> UserProfileEntity? {
        let request: NSFetchRequest<UserProfileEntity> = UserProfileEntity.fetchRequest()
        request.fetchLimit = 1
        return try? context.fetch(request).first
    }

    func createUserProfile(name: String) -> UserProfileEntity {
        let profile = UserProfileEntity(context: context)
        profile.id = UUID()
        profile.createdAt = Date()
        profile.lastModified = Date()
        profile.name = name
        profile.languagePreference = "en"
        profile.preferredRecordingQuality = "high"
        profile.familyInviteCode = generateFamilyInviteCode()
        return profile
    }

    // MARK: - Query Methods

    func fetchActiveSessions() -> [MemoirSessionEntity] {
        let request: NSFetchRequest<MemoirSessionEntity> = MemoirSessionEntity.fetchRequest()
        request.predicate = NSPredicate(format: "status == %@", "active")
        request.sortDescriptors = [NSSortDescriptor(key: "lastModified", ascending: false)]
        return (try? context.fetch(request)) ?? []
    }

    func fetchChapters(for userProfile: UserProfileEntity?) -> [ChapterEntity] {
        let request: NSFetchRequest<ChapterEntity> = ChapterEntity.fetchRequest()
        if let userProfile = userProfile {
            request.predicate = NSPredicate(format: "userProfile == %@", userProfile)
        }
        request.sortDescriptors = [NSSortDescriptor(key: "chapterNumber", ascending: true)]
        return (try? context.fetch(request)) ?? []
    }

    func fetchRecentSegments(limit: Int = 10) -> [MemoirSegmentEntity] {
        let request: NSFetchRequest<MemoirSegmentEntity> = MemoirSegmentEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        request.fetchLimit = limit
        return (try? context.fetch(request)) ?? []
    }

    // MARK: - CloudKit Sync Methods

    func forceSyncWithCloudKit() async {
        guard isCloudKitReady else {
            logger.warning("CloudKit not ready for sync")
            return
        }

        await MainActor.run {
            syncStatus = .syncing
        }

        do {
            // Save any pending changes first
            try save()

            await MainActor.run {
                syncStatus = .success
                lastSyncDate = Date()
            }

        } catch {
            logger.error("CloudKit sync failed: \(error.localizedDescription)")
            await MainActor.run {
                syncStatus = .error(error)
                syncError = error
            }
        }
    }

    func checkCloudKitStatus() async -> CKAccountStatus? {
        await withCheckedContinuation { continuation in
            CKContainer(identifier: "iCloud.com.tenshimatt.memoirguide").accountStatus { status, error in
                if let error = error {
                    self.logger.error("CloudKit account status error: \(error.localizedDescription)")
                }
                continuation.resume(returning: status)
            }
        }
    }

    // MARK: - Helper Methods

    private func getStoreURL() -> URL {
        let storeURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        return storeURL.appendingPathComponent("LifeBook.sqlite")
    }

    private func getNextSessionNumber() -> Int {
        let sessions = fetchActiveSessions()
        return (sessions.map { Int($0.sessionNumber) }.max() ?? 0) + 1
    }

    private func getNextChapterNumber(for userProfile: UserProfileEntity?) -> Int {
        let chapters = fetchChapters(for: userProfile)
        return (chapters.map { Int($0.chapterNumber) }.max() ?? 0) + 1
    }

    private func generateFamilyInviteCode() -> String {
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<8).map { _ in characters.randomElement()! })
    }

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: .NSPersistentStoreRemoteChange,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.logger.info("Received remote change notification")
            self?.objectWillChange.send()
        }

        NotificationCenter.default.addObserver(
            forName: UIApplication.willTerminateNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                try? self?.save()
            }
        }
    }

    private func setupRemoteChangeNotifications() {
        logger.info("Setting up CloudKit remote change notifications")
    }
}