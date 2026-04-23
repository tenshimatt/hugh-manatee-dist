// MemoirSession.swift
// Model for a recording session

import Foundation
import CloudKit

struct MemoirSession: Identifiable, Codable {
    let id: UUID
    var startTime: Date
    var segments: [MemoirSegment]
    var currentChapterID: String?
    var status: SessionStatus
    var totalWordCount: Int
    var lastActiveDate: Date
    
    enum SessionStatus: String, Codable {
        case active, paused, complete
    }
    
    var record: CKRecord {
        let record = CKRecord(recordType: "MemoirSession", recordID: CKRecord.ID(recordName: id.uuidString))
        record["startTime"] = startTime
        record["status"] = status.rawValue
        record["totalWordCount"] = totalWordCount
        record["lastActiveDate"] = lastActiveDate
        record["currentChapterID"] = currentChapterID
        return record
    }
    
    init(from record: CKRecord) {
        self.id = UUID(uuidString: record.recordID.recordName) ?? UUID()
        self.startTime = record["startTime"] as? Date ?? Date()
        self.status = SessionStatus(rawValue: record["status"] as? String ?? "") ?? .active
        self.totalWordCount = record["totalWordCount"] as? Int ?? 0
        self.lastActiveDate = record["lastActiveDate"] as? Date ?? Date()
        self.currentChapterID = record["currentChapterID"] as? String
        self.segments = [] // Initialize segments array
    }
    
    init(startTime: Date = Date()) {
        self.id = UUID()
        self.startTime = startTime
        self.lastActiveDate = startTime
        self.segments = []
        self.status = .active
        self.totalWordCount = 0
    }
}
