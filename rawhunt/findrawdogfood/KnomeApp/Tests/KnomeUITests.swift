import XCTest

final class KnomeUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Onboarding Tests
    
    func testOnboardingScreenAppears() throws {
        // The onboarding screen should appear on first launch
        let welcomeText = app.staticTexts["Welcome to Knome"]
        XCTAssertTrue(welcomeText.exists, "Onboarding welcome text should be visible")
        
        let nameField = app.textFields["nameField"]
        XCTAssertTrue(nameField.exists, "Name input field should be visible")
        
        let continueButton = app.buttons["Continue"]
        XCTAssertTrue(continueButton.exists, "Continue button should be visible")
    }
    
    func testOnboardingRequiresName() throws {
        let continueButton = app.buttons["Continue"]
        continueButton.tap()
        
        // Should still be on onboarding screen
        let welcomeText = app.staticTexts["Welcome to Knome"]
        XCTAssertTrue(welcomeText.exists, "Should remain on onboarding without name")
    }
    
    func testCompleteOnboarding() throws {
        let nameField = app.textFields["nameField"]
        nameField.tap()
        nameField.typeText("Test User")
        
        let continueButton = app.buttons["Continue"]
        continueButton.tap()
        
        // Should navigate to main app
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 2), "Tab bar should appear after onboarding")
    }
    
    // MARK: - Tab Navigation Tests
    
    func testTabNavigation() throws {
        completeOnboardingIfNeeded()
        
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.exists)
        
        // Test Chat tab
        tabBar.buttons["Chat"].tap()
        XCTAssertTrue(app.navigationBars["Chat"].exists)
        
        // Test Journal tab
        tabBar.buttons["Journal"].tap()
        XCTAssertTrue(app.navigationBars["Journal"].exists)
        
        // Test Mood tab
        tabBar.buttons["Mood"].tap()
        XCTAssertTrue(app.navigationBars["Mood Tracker"].exists)
        
        // Test FAQ tab
        tabBar.buttons["FAQ"].tap()
        XCTAssertTrue(app.navigationBars["FAQ"].exists)
        
        // Test More tab
        tabBar.buttons["More"].tap()
        XCTAssertTrue(app.navigationBars["More"].exists)
    }
    
    // MARK: - Chat Tests
    
    func testSendMessage() throws {
        completeOnboardingIfNeeded()
        navigateToChat()
        
        let messageField = app.textFields["messageInput"]
        XCTAssertTrue(messageField.exists)
        
        messageField.tap()
        messageField.typeText("Hello Knome")
        
        let sendButton = app.buttons["sendButton"]
        sendButton.tap()
        
        // Verify message appears in chat
        let sentMessage = app.staticTexts["Hello Knome"]
        XCTAssertTrue(sentMessage.waitForExistence(timeout: 2))
        
        // Wait for bot response
        let loadingIndicator = app.activityIndicators.firstMatch
        if loadingIndicator.exists {
            XCTAssertTrue(loadingIndicator.waitForNonExistence(timeout: 5))
        }
    }
    
    func testVoiceInput() throws {
        completeOnboardingIfNeeded()
        navigateToChat()
        
        let voiceButton = app.buttons["voiceButton"]
        XCTAssertTrue(voiceButton.exists)
        
        voiceButton.tap()
        
        // Check if permission dialog appears (first time only)
        let permissionAlert = app.alerts.firstMatch
        if permissionAlert.waitForExistence(timeout: 2) {
            permissionAlert.buttons["OK"].tap()
        }
        
        // Verify voice recording UI appears
        let recordingIndicator = app.otherElements["recordingIndicator"]
        if recordingIndicator.exists {
            // Stop recording
            voiceButton.tap()
            XCTAssertFalse(recordingIndicator.exists)
        }
    }
    
    func testClearChat() throws {
        completeOnboardingIfNeeded()
        navigateToChat()
        
        // Send a message first
        sendTestMessage("Test message")
        
        // Clear chat
        let moreButton = app.navigationBars["Chat"].buttons["More"]
        if moreButton.exists {
            moreButton.tap()
            
            let clearButton = app.buttons["Clear Chat"]
            clearButton.tap()
            
            let confirmButton = app.alerts.firstMatch.buttons["Clear"]
            confirmButton.tap()
            
            // Verify chat is cleared (except welcome message)
            let messages = app.scrollViews.firstMatch.staticTexts
            XCTAssertEqual(messages.count, 1) // Only welcome message
        }
    }
    
    // MARK: - Mood Tracking Tests
    
    func testSelectMood() throws {
        completeOnboardingIfNeeded()
        navigateToMoodTracker()
        
        let happyMood = app.buttons["happy_mood"]
        XCTAssertTrue(happyMood.exists)
        happyMood.tap()
        
        // Verify mood is selected
        XCTAssertTrue(happyMood.isSelected)
        
        // Try selecting different mood
        let calmMood = app.buttons["calm_mood"]
        calmMood.tap()
        
        XCTAssertTrue(calmMood.isSelected)
        XCTAssertFalse(happyMood.isSelected)
    }
    
    func testMoodHistory() throws {
        completeOnboardingIfNeeded()
        navigateToMoodTracker()
        
        // Select a mood
        let happyMood = app.buttons["happy_mood"]
        happyMood.tap()
        
        // Check if mood appears in history
        let historySection = app.otherElements["moodHistory"]
        if historySection.exists {
            let todayMood = historySection.staticTexts.firstMatch
            XCTAssertTrue(todayMood.exists)
        }
    }
    
    // MARK: - Journal Tests
    
    func testCreateJournalEntry() throws {
        completeOnboardingIfNeeded()
        navigateToJournal()
        
        let newEntryButton = app.buttons["New Entry"]
        XCTAssertTrue(newEntryButton.exists)
        newEntryButton.tap()
        
        let textView = app.textViews["journalTextView"]
        XCTAssertTrue(textView.exists)
        
        textView.tap()
        textView.typeText("Today was a good day. I felt calm and productive.")
        
        let saveButton = app.buttons["Save"]
        saveButton.tap()
        
        // Verify entry is saved
        let savedEntry = app.cells.firstMatch
        XCTAssertTrue(savedEntry.waitForExistence(timeout: 2))
    }
    
    func testEditJournalEntry() throws {
        completeOnboardingIfNeeded()
        navigateToJournal()
        
        // Create an entry first
        createTestJournalEntry()
        
        // Tap on the entry to edit
        let entry = app.cells.firstMatch
        entry.tap()
        
        let textView = app.textViews["journalTextView"]
        textView.tap()
        
        // Clear and add new text
        textView.doubleTap()
        app.menuItems["Select All"].tap()
        textView.typeText("Updated journal entry")
        
        let saveButton = app.buttons["Save"]
        saveButton.tap()
        
        // Verify update
        XCTAssertTrue(app.staticTexts["Updated journal entry"].exists)
    }
    
    // MARK: - Subscription Tests
    
    func testSubscriptionScreen() throws {
        completeOnboardingIfNeeded()
        navigateToMore()
        
        let subscriptionButton = app.buttons["Subscription"]
        subscriptionButton.tap()
        
        // Verify subscription tiers are displayed
        XCTAssertTrue(app.staticTexts["Free"].exists)
        XCTAssertTrue(app.staticTexts["Basic"].exists)
        XCTAssertTrue(app.staticTexts["Pro"].exists)
        XCTAssertTrue(app.staticTexts["Premium"].exists)
    }
    
    func testPurchaseSubscription() throws {
        completeOnboardingIfNeeded()
        navigateToMore()
        
        app.buttons["Subscription"].tap()
        
        let proButton = app.buttons["Subscribe to Pro"]
        XCTAssertTrue(proButton.exists)
        proButton.tap()
        
        // In demo mode, should show success
        let successAlert = app.alerts.firstMatch
        if successAlert.waitForExistence(timeout: 3) {
            successAlert.buttons["OK"].tap()
        }
    }
    
    // MARK: - Settings Tests
    
    func testPrivacyPolicy() throws {
        completeOnboardingIfNeeded()
        navigateToMore()
        
        let privacyButton = app.buttons["Privacy Policy"]
        privacyButton.tap()
        
        XCTAssertTrue(app.navigationBars["Privacy Policy"].exists)
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'privacy'")).firstMatch.exists)
    }
    
    func testNotificationSettings() throws {
        completeOnboardingIfNeeded()
        navigateToMore()
        
        let notificationsSwitch = app.switches["notificationsToggle"]
        if notificationsSwitch.exists {
            let initialValue = notificationsSwitch.value as? String == "1"
            notificationsSwitch.tap()
            
            let newValue = notificationsSwitch.value as? String == "1"
            XCTAssertNotEqual(initialValue, newValue)
        }
    }
    
    // MARK: - Accessibility Tests
    
    func testVoiceOverSupport() throws {
        completeOnboardingIfNeeded()
        
        // Enable VoiceOver for testing
        app.launchArguments.append("-UIAccessibilityVoiceOverEnabled")
        app.launch()
        
        // Test main elements have accessibility labels
        let chatTab = app.tabBars.buttons["Chat"]
        XCTAssertNotNil(chatTab.label)
        XCTAssertFalse(chatTab.label.isEmpty)
        
        navigateToChat()
        
        let messageInput = app.textFields["messageInput"]
        XCTAssertNotNil(messageInput.label)
        XCTAssertNotNil(messageInput.hint)
    }
    
    func testDynamicType() throws {
        // Test with larger text size
        app.launchArguments.append("-UIPreferredContentSizeCategoryName")
        app.launchArguments.append("UICTContentSizeCategoryAccessibilityXL")
        app.launch()
        
        completeOnboardingIfNeeded()
        
        // Verify UI adapts to larger text
        let chatTab = app.tabBars.buttons["Chat"]
        chatTab.tap()
        
        // Text should still be visible and not truncated
        let welcomeMessage = app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'Hello'")).firstMatch
        XCTAssertTrue(welcomeMessage.isHittable)
    }
    
    // MARK: - Error Handling Tests
    
    func testNetworkErrorHandling() throws {
        // Launch app in offline mode
        app.launchArguments.append("-OFFLINE_MODE")
        app.launch()
        
        completeOnboardingIfNeeded()
        navigateToChat()
        
        sendTestMessage("Test offline")
        
        // Should show error or offline message
        let errorMessage = app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'offline' OR label CONTAINS 'connection'")).firstMatch
        XCTAssertTrue(errorMessage.waitForExistence(timeout: 3))
    }
    
    // MARK: - Helper Methods
    
    private func completeOnboardingIfNeeded() {
        let welcomeText = app.staticTexts["Welcome to Knome"]
        if welcomeText.exists {
            let nameField = app.textFields["nameField"]
            nameField.tap()
            nameField.typeText("Test User")
            
            app.buttons["Continue"].tap()
            
            // Wait for main app to load
            _ = app.tabBars.firstMatch.waitForExistence(timeout: 2)
        }
    }
    
    private func navigateToChat() {
        app.tabBars.buttons["Chat"].tap()
    }
    
    private func navigateToJournal() {
        app.tabBars.buttons["Journal"].tap()
    }
    
    private func navigateToMoodTracker() {
        app.tabBars.buttons["Mood"].tap()
    }
    
    private func navigateToMore() {
        app.tabBars.buttons["More"].tap()
    }
    
    private func sendTestMessage(_ message: String) {
        let messageField = app.textFields["messageInput"]
        messageField.tap()
        messageField.typeText(message)
        app.buttons["sendButton"].tap()
    }
    
    private func createTestJournalEntry() {
        let newEntryButton = app.buttons["New Entry"]
        if newEntryButton.exists {
            newEntryButton.tap()
            
            let textView = app.textViews["journalTextView"]
            textView.tap()
            textView.typeText("Test journal entry")
            
            app.buttons["Save"].tap()
        }
    }
    
    // MARK: - Launch Performance Test
    
    func testLaunchPerformance() throws {
        if #available(iOS 15.0, *) {
            measure(metrics: [XCTApplicationLaunchMetric()]) {
                XCUIApplication().launch()
            }
        }
    }
}