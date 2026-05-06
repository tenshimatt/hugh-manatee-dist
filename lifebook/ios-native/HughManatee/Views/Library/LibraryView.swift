import SwiftUI

struct LibraryView: View {
    @State private var vm = LibraryViewModel()

    var body: some View {
        Group {
            if vm.isLoading {
                ProgressView()
                    .tint(HughColor.accent)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(HughColor.bgTop)
            } else if vm.sessions.isEmpty {
                VStack(spacing: HughSpacing.md) {
                    Text("No memories yet.\nStart a conversation with Hugh.")
                        .font(HughFont.bodyLarge)
                        .foregroundColor(HughColor.inkSoft)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(HughColor.bgTop)
            } else {
                List(vm.sessions) { session in
                    NavigationLink(destination: SessionDetailView(sessionId: session.id)) {
                        SessionRow(session: session)
                    }
                    .listRowBackground(HughColor.surface)
                    .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
                .background(HughColor.bgTop)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Memories")
        .task { await vm.loadSessions() }
    }
}

struct SessionRow: View {
    let session: SessionRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(session.title ?? "Untitled")
                .font(HughFont.body)
                .foregroundColor(HughColor.ink)

            if let anchor = session.anchorPhrase {
                Text(anchor)
                    .font(HughFont.caption)
                    .foregroundColor(HughColor.inkSoft)
                    .lineLimit(1)
            }

            Text(formatDate(session.startedAt))
                .font(HughFont.caption)
                .foregroundColor(HughColor.inkSoft)
        }
        .padding(.vertical, HughSpacing.sm)
    }

    private func formatDate(_ ms: Int64) -> String {
        let date = Date(timeIntervalSince1970: Double(ms) / 1000)
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f.string(from: date)
    }
}
