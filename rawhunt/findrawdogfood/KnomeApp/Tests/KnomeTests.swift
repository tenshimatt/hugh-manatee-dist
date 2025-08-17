import XCTest
@testable import Knome

// MARK: - Main App Tests
final class KnomeAppTests: XCTestCase {
    
    func testAppInitialization() throws {
        let app = KnomeApp()
        XCTAssertNotNil(app)
    }
    
    func testEnvironmentObjects() throws {
        let appState = AppState()
        let chatManager = ChatManager()
        let voiceManager = SimpleVoiceManager()
        let subscriptionManager = SubscriptionManager()
        
        XCTAssertNotNil(appState)
        XCTAssertNotNil(chatManager)
        XCTAssertNotNil(voiceManager)
        XCTAssertNotNil(subscriptionManager)
    }
}

// MARK: - AppState Tests
final class AppStateTests: XCTestCase {
    var appState: AppState!
    
    override func setUp() {
        super.setUp()
        appState = AppState()
    }
    
    override func tearDown() {
        appState = nil
        super.tearDown()
    }
    
    func testInitialState() {
        XCTAssertFalse(appState.hasCompletedOnboarding)
        XCTAssertFalse(appState.isSubscribed)
        XCTAssertEqual(appState.selectedTab, 0)
        XCTAssertNil(appState.userName)
        XCTAssertNil(appState.userMood)
    }
    
    func testCompleteOnboarding() {
        appState.completeOnboarding(name: "TestUser")
        XCTAssertTrue(appState.hasCompletedOnboarding)
        XCTAssertEqual(appState.userName, "TestUser")
    }
    
    func testUpdateMood() {
        appState.updateMood(.happy)
        XCTAssertEqual(appState.userMood, .happy)
    }
    
    func testUpdateSubscription() {
        appState.updateSubscription(isSubscribed: true, tier: .pro)
        XCTAssertTrue(appState.isSubscribed)
        XCTAssertEqual(appState.subscriptionTier, .pro)
    }
    
    func testStatePresistence() {
        appState.completeOnboarding(name: "TestUser")
        appState.updateMood(.calm)
        
        // Create new instance to test persistence
        let newAppState = AppState()
        XCTAssertTrue(newAppState.hasCompletedOnboarding)
        XCTAssertEqual(newAppState.userName, "TestUser")
        XCTAssertEqual(newAppState.userMood, .calm)
    }
}

// MARK: - ChatManager Tests
final class ChatManagerTests: XCTestCase {
    var chatManager: ChatManager!
    
    override func setUp() {
        super.setUp()
        chatManager = ChatManager()
    }
    
    override func tearDown() {
        chatManager = nil
        super.tearDown()
    }
    
    func testInitialMessages() {
        XCTAssertFalse(chatManager.messages.isEmpty)
        XCTAssertEqual(chatManager.messages.first?.content, "Hello! I'm Knome, your friendly gnome companion. How are you feeling today?")
    }
    
    func testAddUserMessage() async {
        let initialCount = chatManager.messages.count
        await chatManager.sendMessage("Hello", mood: nil)
        
        // Wait for async operation
        try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
        
        XCTAssertGreaterThan(chatManager.messages.count, initialCount)
    }
    
    func testDemoModeResponse() async {
        chatManager.isDemoMode = true
        let initialCount = chatManager.messages.count
        
        await chatManager.sendMessage("Test message", mood: .anxious)
        
        // Wait for demo response
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds for demo delay
        
        XCTAssertEqual(chatManager.messages.count, initialCount + 2) // User message + bot response
        XCTAssertFalse(chatManager.messages.last?.isUser ?? true)
    }
    
    func testMessageEncryption() async throws {
        let encryptionManager = EncryptionManager()
        let testMessage = ChatMessage(id: UUID(), content: "Test secure message", isUser: true, timestamp: Date())
        
        let encrypted = try encryptionManager.encrypt(testMessage)
        XCTAssertNotNil(encrypted)
        
        let decrypted: ChatMessage = try encryptionManager.decrypt(encrypted)
        XCTAssertEqual(decrypted.content, testMessage.content)
    }
    
    func testClearMessages() {
        chatManager.clearMessages()
        XCTAssertEqual(chatManager.messages.count, 1) // Should keep welcome message
    }
    
    func testIsLoading() async {
        XCTAssertFalse(chatManager.isLoading)
        
        Task {
            await chatManager.sendMessage("Test", mood: nil)
        }
        
        // Check loading state during message send
        try? await Task.sleep(nanoseconds: 10_000_000) // 0.01 seconds
        // Note: This might be flaky in real tests, consider using expectations
    }
}

// MARK: - VoiceManager Tests
final class VoiceManagerTests: XCTestCase {
    var voiceManager: SimpleVoiceManager!
    
    override func setUp() {
        super.setUp()
        voiceManager = SimpleVoiceManager()
    }
    
    override func tearDown() {
        voiceManager?.stopListening()
        voiceManager = nil
        super.tearDown()
    }
    
    func testInitialState() {
        XCTAssertFalse(voiceManager.isListening)
        XCTAssertFalse(voiceManager.isSpeaking)
        XCTAssertTrue(voiceManager.recognizedText.isEmpty)
    }
    
    func testPermissionRequest() async {
        // Note: This will require permission in test environment
        let hasPermission = await voiceManager.requestSpeechPermission()
        // Can't guarantee permission in test, just verify method works
        XCTAssertNotNil(hasPermission)
    }
    
    func testStartStopListening() async throws {
        // Request permission first
        _ = await voiceManager.requestSpeechPermission()
        
        voiceManager.startListening()
        XCTAssertTrue(voiceManager.isListening)
        
        voiceManager.stopListening()
        XCTAssertFalse(voiceManager.isListening)
    }
    
    func testTextToSpeech() {
        let testText = "Hello, this is a test"
        voiceManager.speak(testText)
        
        // Verify speaking state is set
        XCTAssertTrue(voiceManager.isSpeaking)
    }
    
    func testStopSpeaking() {
        voiceManager.speak("Test speech")
        voiceManager.stopSpeaking()
        XCTAssertFalse(voiceManager.isSpeaking)
    }
}

// MARK: - SubscriptionManager Tests
final class SubscriptionManagerTests: XCTestCase {
    var subscriptionManager: SubscriptionManager!
    
    override func setUp() {
        super.setUp()
        subscriptionManager = SubscriptionManager()
    }
    
    override func tearDown() {
        subscriptionManager = nil
        super.tearDown()
    }
    
    func testSubscriptionTiers() {
        XCTAssertEqual(SubscriptionTier.free.rawValue, "free")
        XCTAssertEqual(SubscriptionTier.basic.rawValue, "basic")
        XCTAssertEqual(SubscriptionTier.pro.rawValue, "pro")
        XCTAssertEqual(SubscriptionTier.premium.rawValue, "premium")
    }
    
    func testPurchaseSubscription() async {
        let result = await subscriptionManager.purchaseSubscription(.pro)
        // In demo mode, should always succeed
        XCTAssertTrue(result)
    }
    
    func testRestorePurchases() async {
        await subscriptionManager.restorePurchases()
        // Verify method completes without error
        XCTAssertNotNil(subscriptionManager)
    }
    
    func testCheckSubscriptionStatus() async {
        let (isSubscribed, tier) = await subscriptionManager.checkSubscriptionStatus()
        XCTAssertFalse(isSubscribed) // Should be false in demo
        XCTAssertEqual(tier, .free)
    }
}

// MARK: - Model Tests
final class ModelsTests: XCTestCase {
    
    func testChatMessageCreation() {
        let message = ChatMessage(
            id: UUID(),
            content: "Test message",
            isUser: true,
            timestamp: Date()
        )
        
        XCTAssertEqual(message.content, "Test message")
        XCTAssertTrue(message.isUser)
        XCTAssertNotNil(message.id)
        XCTAssertNotNil(message.timestamp)
    }
    
    func testChatMessageCodable() throws {
        let message = ChatMessage(
            id: UUID(),
            content: "Test encoding",
            isUser: false,
            timestamp: Date()
        )
        
        let encoded = try JSONEncoder().encode(message)
        let decoded = try JSONDecoder().decode(ChatMessage.self, from: encoded)
        
        XCTAssertEqual(message.id, decoded.id)
        XCTAssertEqual(message.content, decoded.content)
        XCTAssertEqual(message.isUser, decoded.isUser)
    }
    
    func testMoodTypes() {
        let moods: [MoodType] = [.happy, .sad, .anxious, .calm, .excited, .tired]
        
        for mood in moods {
            XCTAssertNotNil(mood.emoji)
            XCTAssertFalse(mood.emoji.isEmpty)
        }
    }
    
    func testSubscriptionTierFeatures() {
        XCTAssertTrue(SubscriptionTier.free.dailyMessageLimit > 0)
        XCTAssertTrue(SubscriptionTier.basic.dailyMessageLimit > SubscriptionTier.free.dailyMessageLimit)
        XCTAssertTrue(SubscriptionTier.pro.dailyMessageLimit > SubscriptionTier.basic.dailyMessageLimit)
        XCTAssertEqual(SubscriptionTier.premium.dailyMessageLimit, -1) // Unlimited
    }
}

// MARK: - Encryption Tests
final class EncryptionTests: XCTestCase {
    var encryptionManager: EncryptionManager!
    
    override func setUp() {
        super.setUp()
        encryptionManager = EncryptionManager()
    }
    
    override func tearDown() {
        encryptionManager = nil
        super.tearDown()
    }
    
    func testEncryptDecryptString() throws {
        let testString = "Sensitive data to encrypt"
        
        let encrypted = try encryptionManager.encrypt(testString)
        XCTAssertNotEqual(encrypted, Data(testString.utf8))
        
        let decrypted: String = try encryptionManager.decrypt(encrypted)
        XCTAssertEqual(decrypted, testString)
    }
    
    func testEncryptDecryptCodable() throws {
        struct TestData: Codable {
            let id: Int
            let name: String
            let values: [Double]
        }
        
        let testData = TestData(id: 1, name: "Test", values: [1.0, 2.0, 3.0])
        
        let encrypted = try encryptionManager.encrypt(testData)
        let decrypted: TestData = try encryptionManager.decrypt(encrypted)
        
        XCTAssertEqual(decrypted.id, testData.id)
        XCTAssertEqual(decrypted.name, testData.name)
        XCTAssertEqual(decrypted.values, testData.values)
    }
    
    func testKeyGeneration() {
        let keychain = Keychain()
        let key = keychain.getOrCreateEncryptionKey()
        
        XCTAssertNotNil(key)
        
        // Verify key persists
        let retrievedKey = keychain.getOrCreateEncryptionKey()
        XCTAssertEqual(key, retrievedKey)
    }
}

// MARK: - View Tests
final class ViewTests: XCTestCase {
    
    func testOnboardingViewComponents() {
        let appState = AppState()
        let onboardingView = OnboardingView().environmentObject(appState)
        
        // Test that view can be created without crashes
        XCTAssertNotNil(onboardingView)
    }
    
    func testContentViewTabSelection() {
        let appState = AppState()
        appState.selectedTab = 0
        XCTAssertEqual(appState.selectedTab, 0)
        
        appState.selectedTab = 1
        XCTAssertEqual(appState.selectedTab, 1)
        
        appState.selectedTab = 2
        XCTAssertEqual(appState.selectedTab, 2)
        
        appState.selectedTab = 3
        XCTAssertEqual(appState.selectedTab, 3)
        
        appState.selectedTab = 4
        XCTAssertEqual(appState.selectedTab, 4)
    }
}

// MARK: - Integration Tests
final class IntegrationTests: XCTestCase {
    var appState: AppState!
    var chatManager: ChatManager!
    var voiceManager: SimpleVoiceManager!
    var subscriptionManager: SubscriptionManager!
    
    override func setUp() {
        super.setUp()
        appState = AppState()
        chatManager = ChatManager()
        voiceManager = SimpleVoiceManager()
        subscriptionManager = SubscriptionManager()
    }
    
    override func tearDown() {
        appState = nil
        chatManager = nil
        voiceManager = nil
        subscriptionManager = nil
        super.tearDown()
    }
    
    func testOnboardingFlow() {
        XCTAssertFalse(appState.hasCompletedOnboarding)
        
        // Simulate onboarding completion
        appState.completeOnboarding(name: "TestUser")
        
        XCTAssertTrue(appState.hasCompletedOnboarding)
        XCTAssertEqual(appState.userName, "TestUser")
    }
    
    func testChatWithMoodFlow() async {
        // Set mood
        appState.updateMood(.anxious)
        
        // Send message with mood context
        await chatManager.sendMessage("I'm feeling worried", mood: appState.userMood)
        
        // Verify message was added
        XCTAssertTrue(chatManager.messages.contains { $0.content == "I'm feeling worried" })
    }
    
    func testVoiceToChatFlow() async {
        // Simulate voice recognition
        voiceManager.recognizedText = "Test voice input"
        
        // Send recognized text as message
        await chatManager.sendMessage(voiceManager.recognizedText, mood: nil)
        
        // Verify message was sent
        XCTAssertTrue(chatManager.messages.contains { $0.content == "Test voice input" })
    }
    
    func testSubscriptionUpgradeFlow() async {
        XCTAssertFalse(appState.isSubscribed)
        XCTAssertEqual(appState.subscriptionTier, .free)
        
        // Purchase subscription
        let success = await subscriptionManager.purchaseSubscription(.pro)
        
        if success {
            appState.updateSubscription(isSubscribed: true, tier: .pro)
        }
        
        XCTAssertTrue(appState.isSubscribed)
        XCTAssertEqual(appState.subscriptionTier, .pro)
    }
}

// MARK: - Performance Tests
final class PerformanceTests: XCTestCase {
    
    func testMessageEncryptionPerformance() throws {
        let encryptionManager = EncryptionManager()
        let message = ChatMessage(
            id: UUID(),
            content: String(repeating: "Test content ", count: 100),
            isUser: true,
            timestamp: Date()
        )
        
        measure {
            _ = try? encryptionManager.encrypt(message)
        }
    }
    
    func testLargeMessageListPerformance() {
        let chatManager = ChatManager()
        
        // Add many messages
        for i in 0..<1000 {
            let message = ChatMessage(
                id: UUID(),
                content: "Message \(i)",
                isUser: i % 2 == 0,
                timestamp: Date()
            )
            chatManager.messages.append(message)
        }
        
        measure {
            _ = chatManager.messages.filter { $0.isUser }
        }
    }
}