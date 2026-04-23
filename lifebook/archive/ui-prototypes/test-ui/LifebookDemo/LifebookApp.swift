import SwiftUI

@main
struct LifebookApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.light) // Force light mode for seniors
        }
    }
}
