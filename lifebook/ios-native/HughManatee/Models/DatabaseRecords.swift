import Foundation
import GRDB

// MARK: - GRDB Record types (matching Expo SQLite schema 1:1)

struct ProfileRecord: Codable, FetchableRecord, PersistableRecord {
    var id: Int64 = 1
    var firstName: String
    var birthYear: Int?
    var hometown: String?
    var voiceId: String
    var agentId: String
    var createdAt: Int64
    var updatedAt: Int64

    enum Columns: String, ColumnExpression {
        case id, firstName, birthYear, hometown, voiceId, agentId, createdAt, updatedAt
    }

    static let databaseTableName = "profile"

    static var now: Int64 { Int64(Date().timeIntervalSince1970) }
}

struct SessionRecord: Codable, FetchableRecord, PersistableRecord {
    var id: String
    var startedAt: Int64
    var endedAt: Int64?
    var durationSec: Int?
    var title: String?
    var anchorPhrase: String?
    var audioPath: String?
    var promptVersion: String

    enum Columns: String, ColumnExpression {
        case id, startedAt, endedAt, durationSec, title, anchorPhrase, audioPath, promptVersion
    }

    static let databaseTableName = "sessions"
}

struct TurnRecord: Codable, FetchableRecord, PersistableRecord {
    var id: Int64?
    var sessionId: String
    var ordinal: Int
    var speaker: String
    var text: String
    var startedAt: Int64
    var durationMs: Int?

    enum Columns: String, ColumnExpression {
        case id, sessionId, ordinal, speaker, text, startedAt, durationMs
    }

    static let databaseTableName = "turns"
    static let session = belongsTo(SessionRecord.self)
}

struct EntityRecord: Codable, FetchableRecord, PersistableRecord {
    var id: Int64?
    var sessionId: String
    var kind: String
    var value: String
    var firstMentionedTurn: Int64?

    enum Columns: String, ColumnExpression {
        case id, sessionId, kind, value, firstMentionedTurn
    }

    static let databaseTableName = "entities"
}
