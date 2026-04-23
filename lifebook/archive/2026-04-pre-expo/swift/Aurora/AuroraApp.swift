import SwiftUI

@main
struct AuroraApp: App {
    init() {
        // Support for UI testing - reset app state if needed
        if CommandLine.arguments.contains("--reset-onboarding") {
            UserDefaults.standard.removeObject(forKey: "hasCompletedOnboarding")
            UserDefaults.standard.removeObject(forKey: "userName")
        }

        // For UI testing - mark that we're in test mode
        if CommandLine.arguments.contains("--uitesting") {
            // Can set additional test configuration here
            UserDefaults.standard.set(true, forKey: "isUITesting")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.light) // Force light mode for seniors
        }
    }
}
