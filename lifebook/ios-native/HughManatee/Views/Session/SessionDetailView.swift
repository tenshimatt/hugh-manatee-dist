import SwiftUI

struct SessionDetailView: View {
    let sessionId: String
    @State private var vm: SessionDetailViewModel?

    var body: some View {
        Group {
            if let vm = vm {
                if vm.isLoading {
                    ProgressView().tint(HughColor.accent)
                } else {
                    ScrollView {
                        LazyVStack(spacing: HughSpacing.md) {
                            ForEach(vm.turns, id: \.id) { turn in
                                TurnBubble(turn: turn)
                            }
                        }
                        .padding()
                    }
                    .background(HughColor.bgTop)
                }
            } else {
                ProgressView().tint(HughColor.accent)
            }
        }
        .navigationTitle(vm?.session?.title ?? "Memory")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if vm == nil { vm = SessionDetailViewModel(sessionId: sessionId) }
        }
    }
}

struct TurnBubble: View {
    let turn: TurnRecord
    private var isHugh: Bool { turn.speaker == "hugh" }

    var body: some View {
        HStack {
            if isHugh { Spacer(minLength: 60) }

            VStack(alignment: isHugh ? .leading : .trailing, spacing: 4) {
                Text(isHugh ? "Hugh" : "You")
                    .font(HughFont.caption)
                    .foregroundColor(isHugh ? HughColor.inkSoft : HughColor.accent)

                Text(turn.text)
                    .font(HughFont.body)
                    .foregroundColor(HughColor.ink)
            }
            .padding(HughSpacing.md)
            .background(isHugh ? HughColor.surfaceAlt : HughColor.accent.opacity(0.12))
            .clipShape(
                RoundedRectangle(cornerRadius: 16)
            )

            if !isHugh { Spacer(minLength: 60) }
        }
        .padding(.horizontal)
    }
}
