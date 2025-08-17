//
// AppState.swift - Global App State Management  
//
import Foundation
import SwiftUI

@MainActor
class AppState: ObservableObject {
    @Published var isSubscribed = false
    @Published var subscriptionTier: SubscriptionTier = .free
    @Published var dailyUsageMinutes = 0
    @Published var monthlyUsageMinutes = 0
    @Published var hasCompletedOnboarding = false
    @Published var selectedTab = 0
    
    // OpenAI connection status
    @Published var isConnectedToOpenAI = false
    @Published var connectionStatus = "Checking..."
    
    private let userDefaults = UserDefaults.standard
    @Published var userName: String?
    
    init() {
        loadState()
        checkOpenAIConnection()
    }
    
    private func loadState() {
        // Check for first launch
        let hasLaunchedBefore = userDefaults.bool(forKey: "hasLaunchedBefore")
        
        if !hasLaunchedBefore {
            // First launch - ensure onboarding shows
            userDefaults.set(true, forKey: "hasLaunchedBefore")
            userDefaults.set(false, forKey: "hasCompletedOnboarding")
            userDefaults.synchronize()
            hasCompletedOnboarding = false
        } else {
            // Not first launch - load saved state
            hasCompletedOnboarding = userDefaults.bool(forKey: "hasCompletedOnboarding")
        }
        
        isSubscribed = userDefaults.bool(forKey: "isSubscribed")
        dailyUsageMinutes = userDefaults.integer(forKey: "dailyUsageMinutes")
        monthlyUsageMinutes = userDefaults.integer(forKey: "monthlyUsageMinutes")
        userName = userDefaults.string(forKey: "userName")
        
        
        if let tierString = userDefaults.string(forKey: "subscriptionTier"),
           let tier = SubscriptionTier(rawValue: tierString) {
            subscriptionTier = tier
        }
    }
    
    private func saveState() {
        userDefaults.set(isSubscribed, forKey: "isSubscribed")
        userDefaults.set(dailyUsageMinutes, forKey: "dailyUsageMinutes")
        userDefaults.set(monthlyUsageMinutes, forKey: "monthlyUsageMinutes")
        userDefaults.set(hasCompletedOnboarding, forKey: "hasCompletedOnboarding")
        userDefaults.set(subscriptionTier.rawValue, forKey: "subscriptionTier")
        
        if let name = userName {
            userDefaults.set(name, forKey: "userName")
        }
        
        userDefaults.synchronize()
    }
    
    private func checkOpenAIConnection() {
        let apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
        
        if apiKey.isEmpty || apiKey == "demo-key-for-testing" {
            isConnectedToOpenAI = false
            connectionStatus = "Demo Mode"
        } else {
            isConnectedToOpenAI = true
            connectionStatus = "Connected to OpenAI"
        }
    }
    
    func updateUsage(minutes: Int) {
        dailyUsageMinutes += minutes
        monthlyUsageMinutes += minutes
        saveState()
    }
    
    func resetDailyUsage() {
        dailyUsageMinutes = 0
        saveState()
    }
    
    func completeOnboarding(name: String? = nil) {
        hasCompletedOnboarding = true
        if let name = name {
            userName = name
        }
        saveState()
    }
    
    
    func updateSubscription(isSubscribed: Bool, tier: SubscriptionTier) {
        self.subscriptionTier = tier
        self.isSubscribed = isSubscribed
        saveState()
    }
    
    func resetOnboarding() {
        hasCompletedOnboarding = false
        userName = nil
        userDefaults.set(false, forKey: "hasCompletedOnboarding")
        userDefaults.removeObject(forKey: "userName")
        userDefaults.synchronize()
    }
}
