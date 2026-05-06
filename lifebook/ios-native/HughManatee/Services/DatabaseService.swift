import Foundation
import GRDB

/// Local database — mirrors the Expo SQLite schema exactly.
/// GRDB handles SQLite + FTS5 + migrations.
final class DatabaseService {
    static let shared = DatabaseService()

    private var dbQueue: DatabaseQueue!

    private init() {
        do {
            let path = try FileManager.default
                .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
                .appendingPathComponent("hughmanatee.db")
                .path
            dbQueue = try DatabaseQueue(path: path)
            try migrate()
        } catch {
            fatalError("Database init failed: \(error)")
        }
    }

    // MARK: - Reader / Writer

    var reader: DatabaseReader { dbQueue }

    func write<T>(_ updates: @escaping (Database) throws -> T) async throws -> T {
        try await dbQueue.write(updates)
    }

    // MARK: - Migrations

    private func migrate() throws {
        var migrator = DatabaseMigrator()

        migrator.registerMigration("v1") { db in
            try db.execute(sql: "PRAGMA journal_mode = WAL")
            try db.execute(sql: "PRAGMA foreign_keys = ON")

            try db.create(table: "profile") { t in
                t.primaryKey("id", .integer).check { $0 == 1 }
                t.column("firstName", .text).notNull()
                t.column("birthYear", .integer)
                t.column("hometown", .text)
                t.column("voiceId", .text).notNull()
                t.column("agentId", .text).notNull()
                t.column("createdAt", .integer).notNull()
                t.column("updatedAt", .integer).notNull()
            }

            try db.create(table: "sessions") { t in
                t.column("id", .text).primaryKey()
                t.column("startedAt", .integer).notNull()
                t.column("endedAt", .integer)
                t.column("durationSec", .integer)
                t.column("title", .text)
                t.column("anchorPhrase", .text)
                t.column("audioPath", .text)
                t.column("promptVersion", .text).notNull()
            }

            try db.create(table: "turns") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("sessionId", .text).notNull().references("sessions", onDelete: .cascade)
                t.column("ordinal", .integer).notNull()
                t.column("speaker", .text).notNull().check { $0 == "user" || $0 == "hugh" }
                t.column("text", .text).notNull()
                t.column("startedAt", .integer).notNull()
                t.column("durationMs", .integer)
                t.uniqueKey(["sessionId", "ordinal"])
            }

            try db.create(indexOn: "turns", columns: ["sessionId", "ordinal"])

            try db.create(table: "entities") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("sessionId", .text).notNull().references("sessions", onDelete: .cascade)
                t.column("kind", .text).notNull().check {
                    ["person", "place", "object", "date", "event"].contains($0)
                }
                t.column("value", .text).notNull()
                t.column("firstMentionedTurn", .integer)
            }

            try db.create(indexOn: "entities", columns: ["sessionId"])

            // FTS5 on turns.text
            try db.create(virtualTable: "turns_fts", using: FTS5()) { t in
                t.synchronize(withTable: "turns")
                t.column("text")
            }
        }

        try migrator.migrate(dbQueue)
    }

    // MARK: - Profile

    func getProfile() async throws -> ProfileRecord? {
        try await dbQueue.read { db in
            try ProfileRecord.fetchOne(db, key: 1)
        }
    }

    func upsertProfile(_ profile: ProfileRecord) async throws {
        try await dbQueue.write { db in
            try profile.upsert(db)
        }
    }

    // MARK: - Sessions

    func createSession(promptVersion: String) async throws -> SessionRecord {
        let session = SessionRecord(
            id: UUID().uuidString,
            startedAt: Int64(Date().timeIntervalSince1970 * 1000),
            promptVersion: promptVersion
        )
        try await dbQueue.write { db in try session.insert(db) }
        return session
    }

    func endSession(id: String, title: String?, anchorPhrase: String?) async throws {
        try await dbQueue.write { db in
            var session = try SessionRecord.fetchOne(db, key: id)
            session?.endedAt = Int64(Date().timeIntervalSince1970 * 1000)
            session?.title = title
            session?.anchorPhrase = anchorPhrase
            if let s = session { try s.update(db) }
        }
    }

    func getSessions() async throws -> [SessionRecord] {
        try await dbQueue.read { db in
            try SessionRecord
                .filter(Column("endedAt") != nil)
                .order(Column("startedAt").desc)
                .fetchAll(db)
        }
    }

    func getLastAnchor() async throws -> String? {
        try await dbQueue.read { db in
            try SessionRecord
                .filter(Column("endedAt") != nil && Column("anchorPhrase") != nil)
                .order(Column("startedAt").desc)
                .fetchOne(db)?
                .anchorPhrase
        }
    }

    // MARK: - Turns

    func appendTurn(sessionId: String, speaker: String, text: String, ordinal: Int) async throws {
        try await dbQueue.write { db in
            var turn = TurnRecord(
                sessionId: sessionId,
                ordinal: ordinal,
                speaker: speaker,
                text: text,
                startedAt: Int64(Date().timeIntervalSince1970 * 1000)
            )
            try turn.insert(db)
        }
    }

    func getTurns(sessionId: String) async throws -> [TurnRecord] {
        try await dbQueue.read { db in
            try TurnRecord
                .filter(Column("sessionId") == sessionId)
                .order(Column("ordinal").asc)
                .fetchAll(db)
        }
    }

    // MARK: - Nuke

    func nukeAll() async throws {
        try await dbQueue.write { db in
            try db.execute(sql: "DELETE FROM entities")
            try db.execute(sql: "DELETE FROM turns")
            try db.execute(sql: "DELETE FROM sessions")
            try db.execute(sql: "DELETE FROM profile")
        }
    }
}
