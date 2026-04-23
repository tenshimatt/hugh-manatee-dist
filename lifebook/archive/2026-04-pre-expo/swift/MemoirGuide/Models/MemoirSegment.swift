// MemoirSegment.swift
// Model for a single recorded segment

import Foundation
import CloudKit

struct MemoirSegment: Identifiable, Codable {
    let id: UUID
    var audioURL: URL?
    var audioCloudKitAsset: CKAsset? // Not encoded/decoded
    var transcription: String
    var aiPrompt: String
    var timestamp: Date
    var duration: TimeInterval
    var entities: EntitiesDetected
    var chapterID: String?
    
    private enum CodingKeys: String, CodingKey {
        case id, audioURL, transcription, aiPrompt, timestamp, duration, entities, chapterID
    }
    
    struct EntitiesDetected: Codable {
        var people: [String] = []
        var places: [String] = []
        var dates: [String] = []
        var emotions: [String] = []
    }
    
    var wordCount: Int {
        transcription.split(separator: " ").count
    }
    
    var record: CKRecord {
        let record = CKRecord(recordType: "MemoirSegment", recordID: CKRecord.ID(recordName: id.uuidString))
        record["transcription"] = transcription
        record["aiPrompt"] = aiPrompt
        record["timestamp"] = timestamp
        record["duration"] = duration
        record["chapterID"] = chapterID
        
        if let audioURL = audioURL {
            record["audioFile"] = CKAsset(fileURL: audioURL)
        }
        
        record["people"] = entities.people as CKRecordValue
        record["places"] = entities.places as CKRecordValue
        record["dates"] = entities.dates as CKRecordValue
        record["emotions"] = entities.emotions as CKRecordValue
        
        return record
    }
    
    init(from record: CKRecord) {
        self.id = UUID(uuidString: record.recordID.recordName) ?? UUID()
        self.transcription = record["transcription"] as? String ?? ""
        self.aiPrompt = record["aiPrompt"] as? String ?? ""
        self.timestamp = record["timestamp"] as? Date ?? Date()
        self.duration = record["duration"] as? TimeInterval ?? 0
        self.chapterID = record["chapterID"] as? String
        
        if let asset = record["audioFile"] as? CKAsset {
            self.audioURL = asset.fileURL
            self.audioCloudKitAsset = asset
        }
        
        self.entities = EntitiesDetected(
            people: record["people"] as? [String] ?? [],
            places: record["places"] as? [String] ?? [],
            dates: record["dates"] as? [String] ?? [],
            emotions: record["emotions"] as? [String] ?? []
        )
    }
    
    init(transcription: String, audioURL: URL?, aiPrompt: String, timestamp: Date = Date(), duration: TimeInterval = 0) {
        self.id = UUID()
        self.transcription = transcription
        self.audioURL = audioURL
        self.aiPrompt = aiPrompt
        self.timestamp = timestamp
        self.duration = duration
        self.entities = EntitiesDetected()
    }
}
