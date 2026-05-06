import SwiftUI

struct ConversationView: View {
    @State private var vm = ConversationViewModel()
    @State private var showEndDialog = false
    @State private var navigateToLibrary = false

    var body: some View {
        ZStack {
            HughColor.bgTop.ignoresSafeArea()

            // Center panel
            VStack(spacing: HughSpacing.lg) {
                Spacer()

                if vm.status == .loading || vm.status == .ready || vm.status == .ending {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(HughColor.accent)
                }

                Text(vm.statusText)
                    .font(HughFont.bodyLarge)
                    .foregroundColor(HughColor.inkSoft)
                    .multilineTextAlignment(.center)

                if vm.status == .live, let first = vm.firstTurn, vm.turnCount == 0 {
                    Text(first)
                        .font(HughFont.headingLarge)
                        .foregroundColor(HughColor.ink)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, HughSpacing.xl)
                }

                if let error = vm.error, vm.status == .error {
                    Text(error)
                        .font(HughFont.body)
                        .foregroundColor(HughColor.danger)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, HughSpacing.xl)
                }

                Spacer()
            }

            // Footer
            VStack {
                Spacer()
                HStack(spacing: HughSpacing.lg) {
                    // Memories
                    Button {
                        navigateToLibrary = true
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: "books.vertical")
                                .font(.system(size: 22))
                            Text("Memories")
                                .font(HughFont.small)
                        }
                        .foregroundColor(HughColor.inkSoft)
                    }
                    .frame(width: 72)

                    // End
                    Button {
                        showEndDialog = true
                    } label: {
                        Text(vm.status == .ending ? "Saving…" : "End")
                            .font(HughFont.label)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, HughSpacing.lg)
                            .padding(.vertical, HughSpacing.xs)
                            .background(vm.status == .ending ? HughColor.inkFaint : HughColor.accent)
                            .clipShape(Capsule())
                    }
                    .disabled(vm.status == .ending)

                    // Settings
                    NavigationLink(destination: SettingsView()) {
                        VStack(spacing: 3) {
                            Image(systemName: "gearshape")
                                .font(.system(size: 22))
                            Text("Settings")
                                .font(HughFont.small)
                        }
                        .foregroundColor(HughColor.inkSoft)
                    }
                    .frame(width: 72)
                }
                .padding(.horizontal, HughSpacing.lg)
                .padding(.bottom, HughSpacing.sm)
            }
        }
        .navigationBarHidden(true)
        .onAppear { vm.startSession() }
        .onDisappear { vm.setMuted(true) }
        .alert("End this session?", isPresented: $showEndDialog) {
            Button("Keep talking", role: .cancel) {}
            Button("End", role: .destructive) {
                vm.endSession()
                navigateToLibrary = true
            }
        } message: {
            Text("Hugh will save what you've said.")
        }
        .navigationDestination(isPresented: $navigateToLibrary) {
            LibraryView()
        }
    }
}
