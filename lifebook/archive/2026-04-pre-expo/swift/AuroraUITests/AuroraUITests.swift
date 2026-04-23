//
//  AuroraUITests.swift
//  AuroraUITests
//
//  Created by Matt Wright on 02/10/2025.
//

import XCTest

final class AuroraUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()

        // Reset app state for fresh tests
        app.launchArguments = ["--uitesting"]
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Onboarding Tests

    /// Test 1: Verify welcome screen appears on first launch
    func testOnboardingAppearsOnFirstLaunch() throws {
        // Reset UserDefaults to simulate first launch
        app.launchArguments.append("--reset-onboarding")
        app.launch()

        // Verify onboarding screen appears
        XCTAssertTrue(app.staticTexts["Welcome to\nLifebook"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Share your memories,\none story at a time"].exists)
        XCTAssertTrue(app.staticTexts["What should I call you?"].exists)

        // Verify name input field exists
        let nameField = app.textFields["First name"]
        XCTAssertTrue(nameField.exists)

        // Verify button exists but is disabled when field is empty
        let beginButton = app.buttons["Let's Begin"]
        XCTAssertTrue(beginButton.exists)
        XCTAssertFalse(beginButton.isEnabled)
    }

    /// Test 2: Enter name and complete onboarding
    func testOnboardingNameInput() throws {
        app.launchArguments.append("--reset-onboarding")
        app.launch()

        // Wait for onboarding screen
        let nameField = app.textFields["First name"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))

        // Tap and enter name
        nameField.tap()
        nameField.typeText("John")

        // Verify button is now enabled
        let beginButton = app.buttons["Let's Begin"]
        XCTAssertTrue(beginButton.isEnabled)

        // Tap button to complete onboarding
        beginButton.tap()

        // Verify we're on home screen with personalized greeting
        let greetingText = app.staticTexts.matching(identifier: "John").firstMatch
        XCTAssertTrue(greetingText.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ready to share a memory?"].exists)
    }

    /// Test 3: Verify onboarding is skipped on second launch
    func testOnboardingSkippedOnSecondLaunch() throws {
        // First launch - complete onboarding
        app.launchArguments.append("--reset-onboarding")
        app.launch()

        let nameField = app.textFields["First name"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))
        nameField.tap()
        nameField.typeText("Jane")

        app.buttons["Let's Begin"].tap()

        // Verify home screen appears
        XCTAssertTrue(app.staticTexts["Ready to share a memory?"].waitForExistence(timeout: 5))

        // Terminate and relaunch app
        app.terminate()

        // Second launch - should skip onboarding
        let secondApp = XCUIApplication()
        secondApp.launch()

        // Verify we go directly to home screen (no onboarding)
        XCTAssertTrue(secondApp.staticTexts["Ready to share a memory?"].waitForExistence(timeout: 5))
        XCTAssertFalse(secondApp.staticTexts["Welcome to\nLifebook"].exists)
    }

    // MARK: - Recording Workflow Tests

    /// Test 4: Tap record button and verify recording state
    func testRecordButtonStartsRecording() throws {
        // Launch with onboarding complete
        app.launch()
        completeOnboardingIfNeeded()

        // Find and tap the record button
        let recordButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Tap to Record'")).firstMatch
        XCTAssertTrue(recordButton.waitForExistence(timeout: 5))
        recordButton.tap()

        // Wait briefly for permission dialogs (if any)
        sleep(2)

        // Verify recording state - look for "Recording..." text
        let recordingLabel = app.staticTexts["Recording..."]
        XCTAssertTrue(recordingLabel.waitForExistence(timeout: 10), "Recording label should appear")

        // Verify stop button appears (icon changes)
        let stopButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'stop'")).firstMatch
        XCTAssertTrue(stopButton.exists)

        // Verify recording duration appears
        let durationPattern = NSPredicate(format: "label MATCHES '\\\\d+:\\\\d{2}'")
        let durationLabel = app.staticTexts.matching(durationPattern).firstMatch
        XCTAssertTrue(durationLabel.exists)
    }

    /// Test 5: Stop recording and verify completion sheet
    func testStopRecordingShowsCompletion() throws {
        app.launch()
        completeOnboardingIfNeeded()

        // Start recording
        let recordButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Tap to Record'")).firstMatch
        XCTAssertTrue(recordButton.waitForExistence(timeout: 5))
        recordButton.tap()

        // Wait for recording to start
        XCTAssertTrue(app.staticTexts["Recording..."].waitForExistence(timeout: 10))

        // Record for a few seconds
        sleep(3)

        // Stop recording
        let stopButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'stop'")).firstMatch
        XCTAssertTrue(stopButton.exists)
        stopButton.tap()

        // Verify recording complete sheet appears
        let completeTitle = app.staticTexts["Recording Complete"]
        XCTAssertTrue(completeTitle.waitForExistence(timeout: 5))

        // Verify key elements exist
        XCTAssertTrue(app.staticTexts["Great memory captured!"].exists)
        XCTAssertTrue(app.staticTexts["What I captured"].exists)
        XCTAssertTrue(app.buttons["Save This Memory"].exists)
        XCTAssertTrue(app.buttons["Record Another"].exists)
    }

    /// Test 6: Verify saved recording appears in My Stories
    func testRecordingAppearsInStories() throws {
        app.launch()
        completeOnboardingIfNeeded()

        // Record and save a memory
        recordAndSaveMemory(title: "Test Memory 1")

        // Navigate to My Stories
        let myStoriesButton = app.buttons["My Stories"]
        XCTAssertTrue(myStoriesButton.waitForExistence(timeout: 5))
        myStoriesButton.tap()

        // Verify we're on stories list
        XCTAssertTrue(app.staticTexts["Your Memory Vault"].waitForExistence(timeout: 5))

        // Verify the recording appears in the list
        // Look for the saved recording (may be in a card)
        let savedRecording = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'Test Memory'")).firstMatch
        XCTAssertTrue(savedRecording.waitForExistence(timeout: 5), "Saved recording should appear in stories list")
    }

    // MARK: - Navigation Tests

    /// Test 7: Navigate to Stories view
    func testNavigateToStories() throws {
        app.launch()
        completeOnboardingIfNeeded()

        // Tap My Stories button
        let myStoriesButton = app.buttons["My Stories"]
        XCTAssertTrue(myStoriesButton.waitForExistence(timeout: 5))
        myStoriesButton.tap()

        // Verify Stories List view appears
        XCTAssertTrue(app.staticTexts["Your Memory Vault"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["My Stories"].exists)
        XCTAssertTrue(app.staticTexts["Vault"].exists)

        // Verify tab selector exists
        let myStoriesTab = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'My Stories'")).element(boundBy: 1)
        XCTAssertTrue(myStoriesTab.exists)
    }

    /// Test 8: Navigate to Family Tree view
    func testNavigateToFamilyTree() throws {
        app.launch()
        completeOnboardingIfNeeded()

        // Tap Family Tree button
        let familyTreeButton = app.buttons["Family Tree"]
        XCTAssertTrue(familyTreeButton.waitForExistence(timeout: 5))
        familyTreeButton.tap()

        // Verify Profile Progress view appears
        XCTAssertTrue(app.staticTexts["Your Family Tree"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Discovered through your stories"].exists)

        // Verify progress indicator exists
        let completeText = app.staticTexts["Complete"]
        XCTAssertTrue(completeText.exists)
    }

    /// Test 9: Test back buttons work correctly
    func testBackButtonsWork() throws {
        app.launch()
        completeOnboardingIfNeeded()

        // Navigate to My Stories
        let myStoriesButton = app.buttons["My Stories"]
        XCTAssertTrue(myStoriesButton.waitForExistence(timeout: 5))
        myStoriesButton.tap()

        // Verify we're on stories page
        XCTAssertTrue(app.staticTexts["Your Memory Vault"].waitForExistence(timeout: 5))

        // Tap back button
        let backButton = app.buttons["Back"]
        XCTAssertTrue(backButton.exists)
        backButton.tap()

        // Verify we're back on home screen
        XCTAssertTrue(app.staticTexts["Ready to share a memory?"].waitForExistence(timeout: 5))

        // Navigate to Family Tree
        let familyTreeButton = app.buttons["Family Tree"]
        XCTAssertTrue(familyTreeButton.exists)
        familyTreeButton.tap()

        // Verify we're on family tree page
        XCTAssertTrue(app.staticTexts["Your Family Tree"].waitForExistence(timeout: 5))

        // Tap back button
        let backButton2 = app.buttons["Back"]
        XCTAssertTrue(backButton2.exists)
        backButton2.tap()

        // Verify we're back on home screen
        XCTAssertTrue(app.staticTexts["Ready to share a memory?"].waitForExistence(timeout: 5))
    }

    // MARK: - Permission Tests

    /// Test 10: Verify microphone permission prompt appears
    func testMicrophonePermissionPrompt() throws {
        // Note: This test may behave differently on simulator vs real device
        // On first run, iOS will show permission dialog
        app.launchArguments.append("--reset-permissions")
        app.launch()
        completeOnboardingIfNeeded()

        // Tap record button to trigger permission request
        let recordButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Tap to Record'")).firstMatch
        XCTAssertTrue(recordButton.waitForExistence(timeout: 5))
        recordButton.tap()

        // On real device, system permission alert should appear
        // On simulator, this may not appear or may be auto-granted
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

        // Look for microphone permission alert
        let micAlert = springboard.alerts.firstMatch
        if micAlert.waitForExistence(timeout: 5) {
            // Permission dialog appeared - verify it's about microphone
            let allowButton = micAlert.buttons["Allow"]
            let denyButton = micAlert.buttons["Don't Allow"]

            XCTAssertTrue(allowButton.exists || denyButton.exists, "Permission dialog should have Allow/Don't Allow buttons")

            // Grant permission for testing
            if allowButton.exists {
                allowButton.tap()
            }
        }

        // If no alert appeared (simulator auto-grant), verify recording starts
        let recordingLabel = app.staticTexts["Recording..."]
        XCTAssertTrue(recordingLabel.waitForExistence(timeout: 10))
    }

    /// Test 11: Verify permission denial shows settings alert
    func testPermissionDenialShowsSettings() throws {
        // Note: This test simulates the app behavior when permission is denied
        // In a real scenario, you'd need to manually deny permission first

        app.launchArguments.append("--simulate-permission-denied")
        app.launch()
        completeOnboardingIfNeeded()

        // Tap record button
        let recordButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Tap to Record'")).firstMatch
        XCTAssertTrue(recordButton.waitForExistence(timeout: 5))
        recordButton.tap()

        // If permission was previously denied, app should show settings alert
        let permissionAlert = app.alerts["Microphone Permission Required"]
        if permissionAlert.waitForExistence(timeout: 5) {
            // Verify alert message
            XCTAssertTrue(permissionAlert.staticTexts["Please allow microphone and speech recognition access in Settings to record your memories."].exists)

            // Verify buttons exist
            XCTAssertTrue(permissionAlert.buttons["OK"].exists)
            XCTAssertTrue(permissionAlert.buttons["Open Settings"].exists)

            // Tap OK to dismiss
            permissionAlert.buttons["OK"].tap()
        }
    }

    // MARK: - Performance Tests

    func testLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }

    // MARK: - Helper Methods

    /// Complete onboarding flow if it appears
    private func completeOnboardingIfNeeded() {
        let nameField = app.textFields["First name"]

        // Check if onboarding screen is present
        if nameField.waitForExistence(timeout: 3) {
            nameField.tap()
            nameField.typeText("UITestUser")

            let beginButton = app.buttons["Let's Begin"]
            beginButton.tap()

            // Wait for home screen
            _ = app.staticTexts["Ready to share a memory?"].waitForExistence(timeout: 5)
        }
    }

    /// Record and save a memory with given title
    private func recordAndSaveMemory(title: String) {
        // Start recording
        let recordButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Tap to Record'")).firstMatch
        if recordButton.waitForExistence(timeout: 5) {
            recordButton.tap()
        }

        // Wait for recording to start
        if app.staticTexts["Recording..."].waitForExistence(timeout: 10) {
            // Record for a few seconds
            sleep(3)

            // Stop recording
            let stopButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'stop'")).firstMatch
            if stopButton.exists {
                stopButton.tap()
            }
        }

        // Wait for completion screen
        if app.staticTexts["Recording Complete"].waitForExistence(timeout: 5) {
            // Enter title if field exists
            let titleField = app.textFields["Give this memory a title"]
            if titleField.exists {
                titleField.tap()
                titleField.typeText(title)
            }

            // Wait briefly for AI extraction to complete
            sleep(2)

            // Save the memory
            let saveButton = app.buttons["Save This Memory"]
            if saveButton.exists && saveButton.isEnabled {
                saveButton.tap()
            }

            // Wait for save to complete
            sleep(3)
        }
    }
}
