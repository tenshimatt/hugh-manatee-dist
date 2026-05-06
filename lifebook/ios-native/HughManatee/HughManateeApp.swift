import SwiftUI

@main
struct HughManateeApp: App {
    @AppStorage("hasProfile") private var hasProfile = false

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                if hasProfile {
                    ConversationView()
                } else {
                    OnboardingView()
                }
            }
            .tint(HughColor.accent)
        }
    }
}
