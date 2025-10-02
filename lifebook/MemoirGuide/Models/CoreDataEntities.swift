// CoreDataEntities.swift
// Core Data entity extensions and convenience methods

import CoreData
import Foundation
import CloudKit

// MARK: - MemoirSessionEntity Extension

@objc(MemoirSessionEntity)
public class MemoirSessionEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MemoirSessionEntity> {
        return NSFetchRequest<MemoirSessionEntity>(entityName: "MemoirSession")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var sessionNumber: Int16
    @NSManaged public var status: String?
    @NSManaged public var duration: Double
    @NSManaged public var totalWordCount: Int32
    @NSManaged public var chapter: ChapterEntity?
    @NSManaged public var segments: NSSet?
    
    // Computed properties
    var segmentsArray: [MemoirSegmentEntity] {
        let set = segments as? Set<MemoirSegmentEntity> ?? []
        return set.sorted { $0.sequenceNumber < $1.sequenceNumber }
    }
    
    var sessionStatus: SessionStatus {
        get { SessionStatus(rawValue: status ?? "active") ?? .active }
        set { status = newValue.rawValue }
    }
    
    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        let seconds = Int(duration) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
    
    enum SessionStatus: String, CaseIterable {
        case active, paused, completed
        
        var displayName: String {
            switch self {
            case .active: return "Recording"
            case .paused: return "Paused"
            case .completed: return "Completed"
            }
        }
    }
    
    // Convenience methods
    func addSegment(_ segment: MemoirSegmentEntity) {
        addToSegments(segment)
        updateTotalWordCount()
        lastModified = Date()
    }
    
    func removeSegment(_ segment: MemoirSegmentEntity) {
        removeFromSegments(segment)
        updateTotalWordCount()
        lastModified = Date()
    }
    
    private func updateTotalWordCount() {
        totalWordCount = Int32(segmentsArray.reduce(0) { $0 + Int($1.wordCount) })
    }
}

// MARK: - Core Data Generated Methods

extension MemoirSessionEntity {
    @objc(addSegmentsObject:)
    @NSManaged public func addToSegments(_ value: MemoirSegmentEntity)

    @objc(removeSegmentsObject:)
    @NSManaged public func removeFromSegments(_ value: MemoirSegmentEntity)

    @objc(addSegments:)
    @NSManaged public func addToSegments(_ values: NSSet)

    @objc(removeSegments:)
    @NSManaged public func removeFromSegments(_ values: NSSet)
}

// MARK: - MemoirSegmentEntity Extension

@objc(MemoirSegmentEntity)
public class MemoirSegmentEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MemoirSegmentEntity> {
        return NSFetchRequest<MemoirSegmentEntity>(entityName: "MemoirSegment")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var transcription: String?
    @NSManaged public var audioFileName: String?
    @NSManaged public var audioFileSize: Int64
    @NSManaged public var duration: Double
    @NSManaged public var wordCount: Int16
    @NSManaged public var sequenceNumber: Int16
    @NSManaged public var aiPrompt: String?
    @NSManaged public var aiStoryText: String?
    @NSManaged public var aiProcessed: Bool
    @NSManaged public var aiModel: String?
    @NSManaged public var editHistory: Data?
    @NSManaged public var confidence: Float
    @NSManaged public var isAutoSave: Bool
    @NSManaged public var session: MemoirSessionEntity?
    
    // Computed properties
    var transcriptionText: String {
        return transcription ?? ""
    }
    
    var audioURL: URL? {
        guard let fileName = audioFileName else { return nil }
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!

        // Check secure directory first (new recordings)
        let secureDirectory = documentsURL.appendingPathComponent("SecureAudio", isDirectory: true)
        let secureURL = secureDirectory.appendingPathComponent(fileName)
        if FileManager.default.fileExists(atPath: secureURL.path) {
            return secureURL
        }

        // Fall back to old location (legacy recordings)
        let legacyURL = documentsURL.appendingPathComponent(fileName)
        if FileManager.default.fileExists(atPath: legacyURL.path) {
            return legacyURL
        }

        // Return secure path for new files (even if doesn't exist yet)
        return secureURL
    }
    
    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    var confidencePercentage: Int {
        return Int(confidence * 100)
    }
    
    var hasAudio: Bool {
        return audioFileName != nil && audioURL?.isFileExists == true
    }
    
    // Convenience methods
    func updateWordCount() {
        wordCount = Int16(transcriptionText.wordCount)
        lastModified = Date()
    }
    
    func setAudioFile(url: URL) {
        audioFileName = url.lastPathComponent
        
        // Get file size
        if let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
           let fileSize = attributes[.size] as? Int64 {
            audioFileSize = fileSize
        }
        
        lastModified = Date()
    }
}

// MARK: - ChapterEntity Extension

@objc(ChapterEntity)
public class ChapterEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<ChapterEntity> {
        return NSFetchRequest<ChapterEntity>(entityName: "Chapter")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var title: String?
    @NSManaged public var chapterNumber: Int16
    @NSManaged public var status: String?
    @NSManaged public var aiGeneratedSummary: String?
    @NSManaged public var tags: String?
    @NSManaged public var timePeriod: String?
    @NSManaged public var totalDuration: Double
    @NSManaged public var totalWordCount: Int32
    @NSManaged public var estimatedReadingTime: Int16
    @NSManaged public var userProfile: UserProfileEntity?
    @NSManaged public var sessions: NSSet?
    @NSManaged public var sharedWith: NSSet?
    
    // Computed properties
    var chapterTitle: String {
        return title ?? "Chapter \\(chapterNumber)"
    }
    
    var sessionsArray: [MemoirSessionEntity] {
        let set = sessions as? Set<MemoirSessionEntity> ?? []
        return set.sorted { $0.sessionNumber < $1.sessionNumber }
    }
    
    var familyMembersArray: [FamilyMemberEntity] {
        let set = sharedWith as? Set<FamilyMemberEntity> ?? []
        return set.sorted { ($0.name ?? "") < ($1.name ?? "") }
    }
    
    var chapterStatus: ChapterStatus {
        get { ChapterStatus(rawValue: status ?? "draft") ?? .draft }
        set { status = newValue.rawValue }
    }
    
    var tagsArray: [String] {
        get { tags?.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) } ?? [] }
        set { tags = newValue.joined(separator: ", ") }
    }
    
    // Computed totalWordCount that sums all segments from all sessions
    var computedWordCount: Int {
        return sessionsArray.reduce(0) { total, session in
            total + session.segmentsArray.reduce(0) { $0 + Int($1.wordCount) }
        }
    }

    // Computed totalDuration that sums all segments from all sessions
    var computedDuration: Double {
        return sessionsArray.reduce(0.0) { total, session in
            total + session.segmentsArray.reduce(0.0) { $0 + $1.duration }
        }
    }

    var formattedDuration: String {
        let duration = computedDuration
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60

        if hours > 0 {
            return String(format: "%dh %dm", hours, minutes)
        } else if minutes > 0 {
            return String(format: "%dm", minutes)
        } else {
            let seconds = Int(duration) % 60
            return String(format: "%ds", seconds)
        }
    }
    
    var isShared: Bool {
        return (sharedWith?.count ?? 0) > 0
    }
    
    enum ChapterStatus: String, CaseIterable {
        case draft, review, published, archived
        
        var displayName: String {
            switch self {
            case .draft: return "Draft"
            case .review: return "Review"
            case .published: return "Published"
            case .archived: return "Archived"
            }
        }
    }
    
    // Convenience methods
    func addSession(_ session: MemoirSessionEntity) {
        addToSessions(session)
        updateTotals()
    }
    
    func shareWith(_ familyMember: FamilyMemberEntity) {
        addToSharedWith(familyMember)
        lastModified = Date()
    }
    
    func unshareWith(_ familyMember: FamilyMemberEntity) {
        removeFromSharedWith(familyMember)
        lastModified = Date()
    }
    
    private func updateTotals() {
        totalDuration = sessionsArray.reduce(0) { $0 + $1.duration }
        totalWordCount = sessionsArray.reduce(0) { $0 + $1.totalWordCount }
        estimatedReadingTime = Int16(totalWordCount / 250) // Average reading speed
        lastModified = Date()
    }
}

// MARK: - Core Data Generated Methods for Chapter

extension ChapterEntity {
    @objc(addSessionsObject:)
    @NSManaged public func addToSessions(_ value: MemoirSessionEntity)

    @objc(removeSessionsObject:)
    @NSManaged public func removeFromSessions(_ value: MemoirSessionEntity)

    @objc(addSessions:)
    @NSManaged public func addToSessions(_ values: NSSet)

    @objc(removeSessions:)
    @NSManaged public func removeFromSessions(_ values: NSSet)
    
    @objc(addSharedWithObject:)
    @NSManaged public func addToSharedWith(_ value: FamilyMemberEntity)

    @objc(removeSharedWithObject:)
    @NSManaged public func removeFromSharedWith(_ value: FamilyMemberEntity)

    @objc(addSharedWith:)
    @NSManaged public func addToSharedWith(_ values: NSSet)

    @objc(removeSharedWith:)
    @NSManaged public func removeFromSharedWith(_ values: NSSet)
}

// MARK: - UserProfileEntity Extension

@objc(UserProfileEntity)
public class UserProfileEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<UserProfileEntity> {
        return NSFetchRequest<UserProfileEntity>(entityName: "UserProfile")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var name: String?
    @NSManaged public var languagePreference: String?
    @NSManaged public var preferredRecordingQuality: String?
    @NSManaged public var accessibilitySettings: String?
    @NSManaged public var privacySettings: String?
    @NSManaged public var familyInviteCode: String?
    @NSManaged public var totalRecordingTime: Double
    @NSManaged public var chapters: NSSet?
    @NSManaged public var familyMembers: NSSet?
    
    // Computed properties
    var displayName: String {
        return name ?? "Life Book User"
    }
    
    var chaptersArray: [ChapterEntity] {
        let set = chapters as? Set<ChapterEntity> ?? []
        return set.sorted { $0.chapterNumber < $1.chapterNumber }
    }
    
    var familyMembersArray: [FamilyMemberEntity] {
        let set = familyMembers as? Set<FamilyMemberEntity> ?? []
        return set.sorted { ($0.name ?? "") < ($1.name ?? "") }
    }
    
    var formattedTotalRecordingTime: String {
        let hours = Int(totalRecordingTime) / 3600
        let minutes = Int(totalRecordingTime) % 3600 / 60
        return String(format: "%dh %dm", hours, minutes)
    }
    
    // Convenience methods
    func addRecordingTime(_ duration: Double) {
        totalRecordingTime += duration
        lastModified = Date()
    }
}

// MARK: - FamilyMemberEntity Extension

@objc(FamilyMemberEntity)
public class FamilyMemberEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<FamilyMemberEntity> {
        return NSFetchRequest<FamilyMemberEntity>(entityName: "FamilyMember")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var name: String?
    @NSManaged public var relationship: String?
    @NSManaged public var contactEmail: String?
    @NSManaged public var invitationStatus: String?
    @NSManaged public var userProfile: UserProfileEntity?
    @NSManaged public var sharedChapters: NSSet?
    
    // Computed properties
    var displayName: String {
        return name ?? "Family Member"
    }
    
    var inviteStatus: InvitationStatus {
        get { InvitationStatus(rawValue: invitationStatus ?? "pending") ?? .pending }
        set { invitationStatus = newValue.rawValue }
    }
    
    enum InvitationStatus: String, CaseIterable {
        case pending, accepted, declined, expired
        
        var displayName: String {
            switch self {
            case .pending: return "Pending"
            case .accepted: return "Accepted"
            case .declined: return "Declined"
            case .expired: return "Expired"
            }
        }
    }
}

// MARK: - AIConversationContextEntity Extension

@objc(AIConversationContextEntity)
public class AIConversationContextEntity: NSManagedObject {
    
    @nonobjc public class func fetchRequest() -> NSFetchRequest<AIConversationContextEntity> {
        return NSFetchRequest<AIConversationContextEntity>(entityName: "AIConversationContext")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var conversationHistory: String?
    @NSManaged public var currentTopics: String?
    @NSManaged public var lastPrompt: String?
    @NSManaged public var successfulPrompts: String?
    @NSManaged public var userResponsePatterns: String?
    @NSManaged public var preferredQuestionStyle: String?
    
    // Helper methods for JSON serialization
    var conversationHistoryArray: [String] {
        get {
            guard let history = conversationHistory,
                  let data = history.data(using: .utf8) else { return [] }
            return (try? JSONDecoder().decode([String].self, from: data)) ?? []
        }
        set {
            conversationHistory = try? String(data: JSONEncoder().encode(newValue), encoding: .utf8)
            lastModified = Date()
        }
    }
    
    var currentTopicsArray: [String] {
        get {
            guard let topics = currentTopics,
                  let data = topics.data(using: .utf8) else { return [] }
            return (try? JSONDecoder().decode([String].self, from: data)) ?? []
        }
        set {
            currentTopics = try? String(data: JSONEncoder().encode(newValue), encoding: .utf8)
            lastModified = Date()
        }
    }
}

// MARK: - URL Extension

extension URL {
    var isFileExists: Bool {
        return FileManager.default.fileExists(atPath: self.path)
    }
}