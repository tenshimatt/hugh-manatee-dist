// ContentView.swift
// Main container view for the app

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var recordingManager: RecordingManager
    @EnvironmentObject var cloudKit: CloudKitManager
    @EnvironmentObject var ai: AIInterviewer

    // Note: Privacy consent flow ready - files created but need manual Xcode add
    // @AppStorage("hasAcceptedPrivacyPolicy") private var hasAcceptedPrivacyPolicy = false
    // @State private var showingPrivacyConsent = false

    var body: some View {
        ZStack {
            Color(hex: "FFFEF5")
                .ignoresSafeArea()
            
            switch appState.currentView {
            case .recording:
                AccessibleRecordingView()
            case .library:
                LibraryView()
            case .reader(let chapter):
                ReaderView(chapter: chapter)
            }
        }
        .alert(item: $appState.error) { error in
            Alert(
                title: Text("Notice"),
                message: Text(error.localizedDescription),
                dismissButton: .default(Text("OK"))
            )
        }
        // Privacy consent integration (uncomment after adding files to Xcode):
        // .fullScreenCover(isPresented: $showingPrivacyConsent) {
        //     PrivacyConsentView(isPresented: $showingPrivacyConsent)
        // }
        // .onAppear {
        //     if !hasAcceptedPrivacyPolicy {
        //         showingPrivacyConsent = true
        //     }
        // }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AppState())
            .environmentObject(RecordingManager())
            .environmentObject(CloudKitManager())
            .environmentObject(AIInterviewer())
    }
}
