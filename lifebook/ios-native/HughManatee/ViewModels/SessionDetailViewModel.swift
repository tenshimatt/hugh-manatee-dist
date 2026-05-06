import SwiftUI

@Observable
final class SessionDetailViewModel {
    var session: SessionRecord?
    var turns: [TurnRecord] = []
    var isLoading = true

    private let db = DatabaseService.shared

    init(sessionId: String) {
        Task {
            do {
                session = try await db.reader.read { db in
                    try SessionRecord.fetchOne(db, key: sessionId)
                }
                turns = try await db.getTurns(sessionId: sessionId)
                isLoading = false
            } catch {
                isLoading = false
            }
        }
    }
}
