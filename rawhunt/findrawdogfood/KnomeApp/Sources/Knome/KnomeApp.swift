//
// KnomeApp.swift - Main App Entry Point - SELF-CONTAINED VERSION
//
import SwiftUI

// EMBEDDED CONFIG - No separate file needed
struct AppConfig {
    static let openAIAPIKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? 
                              Bundle.main.object(forInfoDictionaryKey: "OPENAI_API_KEY") as? String ?? ""
    
    static let enableOpenAI = !openAIAPIKey.isEmpty && openAIAPIKey != "demo-key-for-testing"
    static var isDemoMode: Bool { return !enableOpenAI }
    
    static var configurationStatus: String {
        return enableOpenAI ? "✅ OpenAI Configured" : "⚠️ Running in Demo Mode"
    }
    
    static func printStatus() {
        print("🚀 Knome App Starting")
        print("🔧 \(configurationStatus)")
    }
    
    static var isDebugBuild: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}

@main
struct KnomeApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var subscriptionManager = SubscriptionManager()
    @StateObject private var chatManager = ChatManager()
    @StateObject private var encryptionManager = EncryptionManager()
    
    init() {
        // Print status on startup
        AppConfig.printStatus()
        
        // Setup debugging if needed
        if AppConfig.isDebugBuild {
            print("🐛 Debug mode enabled")
            
            // Set up uncaught exception handler for debugging
            NSSetUncaughtExceptionHandler { exception in
                print("💥 Uncaught Exception: \(exception)")
                print("📍 Stack Trace: \(exception.callStackSymbols)")
            }
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(subscriptionManager)
                .environmentObject(chatManager)
                .environmentObject(encryptionManager)
                .onAppear {
                    // Load session data
                    chatManager.loadSessionSummary()
                    
                    // Initialize subscription and products
                    Task {
                        await subscriptionManager.loadProducts()
                        await subscriptionManager.checkSubscriptionStatus()
                    }
                }
                .onDisappear {
                    // Save any pending session data when app goes to background
                    print("📱 App going to background - saving session data")
                }
        }
    }
}
