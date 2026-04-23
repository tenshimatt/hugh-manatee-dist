// Chapter.swift
// Model for memoir chapters

import Foundation
import CloudKit

struct Chapter: Identifiable, Codable {
    let id: UUID
    var title: String
    var segments: [String] // Segment IDs
    var coverImageURL: URL?
    var timelineDates: [Date]
    var summary: String
    var orderIndex: Int
    
    var record: CKRecord {
        let record = CKRecord(recordType: "Chapter", recordID: CKRecord.ID(recordName: id.uuidString))
        record["title"] = title
        record["segments"] = segments as CKRecordValue
        record["summary"] = summary
        record["orderIndex"] = orderIndex
        record["timelineDates"] = timelineDates as CKRecordValue
        return record
    }
    
    init(from record: CKRecord) {
        self.id = UUID(uuidString: record.recordID.recordName) ?? UUID()
        self.title = record["title"] as? String ?? "Untitled"
        self.segments = record["segments"] as? [String] ?? []
        self.summary = record["summary"] as? String ?? ""
        self.orderIndex = record["orderIndex"] as? Int ?? 0
        self.timelineDates = record["timelineDates"] as? [Date] ?? []
    }
    
    init(title: String, orderIndex: Int) {
        self.id = UUID()
        self.title = title
        self.orderIndex = orderIndex
        self.segments = []
        self.summary = ""
        self.timelineDates = []
    }
}
