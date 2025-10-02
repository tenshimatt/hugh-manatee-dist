// CloudKitManager.swift
// Handles CloudKit sync and data persistence

import CloudKit
import Combine
import UIKit

@MainActor
class CloudKitManager: ObservableObject {
    @Published var isSyncing = false
    @Published var syncStatus: SyncStatus = .idle
    @Published var offlineQueue: [MemoirSegment] = []

    private let container: CKContainer
    private let privateDatabase: CKDatabase
    private var syncTimer: Timer?
    private let queue = DispatchQueue(label: "cloudkit.queue", attributes: .concurrent)

    enum SyncStatus {
        case idle, syncing, success, error(String)
    }

    init(container: CKContainer = CKContainer(identifier: "iCloud.com.tenshimatt.memoirguide")) {
        self.container = container
        self.privateDatabase = container.privateCloudDatabase
        setupSubscriptions()
        startSyncTimer()
        checkiCloudStatus()
    }

    // MARK: - Save Operations

    func save(_ segment: MemoirSegment) async throws {
        // Check network
        guard await isNetworkAvailable() else {
            await MainActor.run {
                offlineQueue.append(segment)
            }
            throw AppError.networkUnavailable
        }

        await MainActor.run {
            isSyncing = true
        }
        defer {
            Task { @MainActor in
                isSyncing = false
            }
        }

        do {
            let record = segment.record
            _ = try await privateDatabase.save(record)
            await MainActor.run {
                syncStatus = .success
            }
        } catch {
            await MainActor.run {
                offlineQueue.append(segment)
                syncStatus = .error(error.localizedDescription)
            }
            throw error
        }
    }

    func save(_ session: MemoirSession) async throws {
        let record = session.record
        _ = try await privateDatabase.save(record)
    }

    func save(_ chapter: Chapter) async throws {
        let record = chapter.record
        _ = try await privateDatabase.save(record)
    }

    // MARK: - Fetch Operations

    func fetchLatestSession() async throws -> MemoirSession? {
        let predicate = NSPredicate(value: true)
        let query = CKQuery(recordType: "MemoirSession", predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "lastActiveDate", ascending: false)]

        let results = try await privateDatabase.records(matching: query, resultsLimit: 1)

        return results.matchResults.compactMap { _, result in
            try? result.get()
        }.first.map { MemoirSession(from: $0) }
    }

    func fetchSegments(for sessionID: String? = nil, limit: Int = 50) async throws -> [MemoirSegment] {
        let predicate: NSPredicate
        if let sessionID = sessionID {
            predicate = NSPredicate(format: "sessionID == %@", sessionID)
        } else {
            predicate = NSPredicate(value: true)
        }

        let query = CKQuery(recordType: "MemoirSegment", predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]

        let results = try await privateDatabase.records(matching: query, resultsLimit: limit)

        return results.matchResults.compactMap { _, result in
            try? result.get()
        }.map { MemoirSegment(from: $0) }
    }

    func fetchChapters() async throws -> [Chapter] {
        let predicate = NSPredicate(value: true)
        let query = CKQuery(recordType: "Chapter", predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "orderIndex", ascending: true)]

        let results = try await privateDatabase.records(matching: query)

        return results.matchResults.compactMap { _, result in
            try? result.get()
        }.map { Chapter(from: $0) }
    }

    // MARK: - Sync Operations

    func syncOfflineQueue() async {
        guard !offlineQueue.isEmpty, await isNetworkAvailable() else { return }

        await MainActor.run {
            isSyncing = true
        }
        defer {
            Task { @MainActor in
                isSyncing = false
            }
        }

        for segment in offlineQueue {
            do {
                try await save(segment)
                await MainActor.run {
                    offlineQueue.removeAll { $0.id == segment.id }
                }
            } catch {
                print("Failed to sync segment: \(error)")
                break // Stop if one fails, try again later
            }
        }
    }

    private func startSyncTimer() {
        syncTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task {
                await self.syncOfflineQueue()
            }
        }
    }

    // MARK: - Subscriptions

    private func setupSubscriptions() {
        // Subscribe to changes in segments
        let subscription = CKQuerySubscription(
            recordType: "MemoirSegment",
            predicate: NSPredicate(value: true),
            options: [.firesOnRecordCreation, .firesOnRecordUpdate]
        )

        let notification = CKSubscription.NotificationInfo()
        notification.shouldSendContentAvailable = true
        subscription.notificationInfo = notification

        privateDatabase.save(subscription) { _, error in
            if let error = error {
                print("Failed to setup subscription: \(error)")
            }
        }
    }

    // MARK: - Utilities

    private func isNetworkAvailable() async -> Bool {
        // Simple reachability check
        do {
            let url = URL(string: "https://www.apple.com")!
            let (_, response) = try await URLSession.shared.data(from: url)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            return false
        }
    }

    private func checkiCloudStatus() {
        container.accountStatus { status, error in
            switch status {
            case .available:
                print("iCloud available")
            case .noAccount:
                print("No iCloud account")
                Task { @MainActor in
                    self.syncStatus = .error("Please sign in to iCloud")
                }
            case .restricted, .couldNotDetermine:
                print("iCloud restricted or unavailable")
            default:
                break
            }
        }
    }

    // MARK: - Export

    func exportToPDF(chapters: [Chapter]) async throws -> URL {
        // Create PDF from chapters
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792))

        let data = renderer.pdfData { context in
            for chapter in chapters {
                context.beginPage()

                // Title
                let titleAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 24)
                ]
                chapter.title.draw(at: CGPoint(x: 50, y: 50), withAttributes: titleAttributes)

                // Content (would need to fetch segments)
                // This is simplified - real implementation would format properly
            }
        }

        let url = FileManager.default.temporaryDirectory.appendingPathComponent("memoir.pdf")
        try data.write(to: url)

        return url
    }
}