import SwiftUI

@Observable
final class LibraryViewModel {
    var sessions: [SessionRecord] = []
    var isLoading = true

    private let db = DatabaseService.shared

    func loadSessions() async {
        do {
            sessions = try await db.getSessions()
            isLoading = false
        } catch {
            isLoading = false
        }
    }
}
