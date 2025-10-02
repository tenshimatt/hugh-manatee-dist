//
//  MemoirGuideUITests.swift
//  Automated UI Tests for Bugs 31-41 and Regression Testing
//
//  Run in Xcode: Cmd+U or Product > Test
//  Run CLI: xcodebuild test -scheme MemoirGuide -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
//

import XCTest

final class MemoirGuideUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    // MARK: - Bug 31: No Audio Validation

    func testBug31_NoAudioValidationPopup() throws {
        // Given: User is on home screen
        let recordButton = app.buttons["Start recording your story"]
        XCTAssertTrue(recordButton.waitForExistence(timeout: 5))

        // When: User starts and immediately stops recording (no audio)
        recordButton.tap()
        sleep(1)

        let stopButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Stop recording'")).firstMatch
        XCTAssertTrue(stopButton.waitForExistence(timeout: 2))
        stopButton.tap()

        // Then: Alert should appear
        let alert = app.alerts["No Audio Captured"]
        XCTAssertTrue(alert.waitForExistence(timeout: 3), "No audio alert should appear")

        // And: Alert message should be correct
        let message = alert.staticTexts["We didn't capture any audio. Just letting you know, please try again when you're ready."]
        XCTAssertTrue(message.exists, "Alert message should be visible")

        // When: User taps OK
        alert.buttons["OK"].tap()

        // Then: Should stay on home screen
        let welcomeMessage = app.otherElements["Welcome message"]
        XCTAssertTrue(welcomeMessage.exists, "Should stay on home screen after alert")
    }

    // MARK: - Bug 32: AI Prompt Removed

    func testBug32_AIPromptDoesNotExist() throws {
        // Then: AI prompt should not exist on home screen
        let aiPrompt = app.otherElements["AI Conversation Guide"]
        XCTAssertFalse(aiPrompt.exists, "AI prompt should not exist on home screen")
    }

    // MARK: - Bug 33: Expanded Text Boxes

    func testBug33_ExpandedTextBoxes() throws {
        // Note: Requires actual recording to reach recording complete screen
        // This is a visual test - verify heights are 250/300 manually
        throw XCTSkip("Visual verification required - check that text boxes are taller")
    }

    // MARK: - Bugs 34-36: Camera Features

    func testBug34_CameraPreviewExists() throws {
        // Note: Will fail until files added to Xcode project
        let cameraPreview = app.otherElements.matching(NSPredicate(format: "label CONTAINS 'Camera'")).firstMatch

        if cameraPreview.exists {
            XCTAssertTrue(cameraPreview.isHittable, "Camera preview should be visible and tappable")
        } else {
            XCTFail("Bug 34 FAILED: Camera preview not found (expected until Xcode setup)")
        }
    }

    func testBug35_CameraToggle() throws {
        // Note: Will fail until files added to Xcode project
        let cameraOn = app.otherElements["Camera preview active. Tap to turn off"]

        if cameraOn.waitForExistence(timeout: 2) {
            // When: Tap to toggle off
            cameraOn.tap()

            // Then: Should show off state
            let cameraOff = app.otherElements["Camera off. Tap to turn on"]
            XCTAssertTrue(cameraOff.waitForExistence(timeout: 1), "Camera should toggle to off state")

            // When: Tap to toggle back on
            cameraOff.tap()

            // Then: Should show on state again
            XCTAssertTrue(cameraOn.waitForExistence(timeout: 1), "Camera should toggle back to on state")
        } else {
            XCTFail("Bug 35 FAILED: Camera not found (expected until Xcode setup)")
        }
    }

    func testBug36_VideoRecordingIntegration() throws {
        // Note: Requires Xcode setup + Core Data model update
        throw XCTSkip("Requires complete Xcode setup - test manually")
    }

    // MARK: - Bugs 40-41: Help Screen Updates

    func testBug40_41_HelpScreenContent() throws {
        // Given: User is on home screen
        let helpButton = app.buttons["Get help"]
        XCTAssertTrue(helpButton.exists, "Help button should exist")

        // When: User taps help
        helpButton.tap()

        // Then: New help text should be visible (Bug 40)
        let header = app.staticTexts["Hello there - let me help you out."]
        XCTAssertTrue(header.waitForExistence(timeout: 2), "New help header should be visible")

        let body = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'For now, just tell me what you need'")).firstMatch
        XCTAssertTrue(body.exists, "New help body should be visible")

        let footer = app.staticTexts["What's on your mind?"]
        XCTAssertTrue(footer.exists, "Help footer should be visible")

        // And: Text should be larger (Bug 41) - verify frame height
        let headerFrame = header.frame
        XCTAssertGreaterThan(headerFrame.height, 30, "Header should be taller due to 50% larger font")

        // When: User closes help
        app.buttons["Close"].tap()

        // Then: Should return to home screen
        let recordButton = app.buttons["Start recording your story"]
        XCTAssertTrue(recordButton.waitForExistence(timeout: 1), "Should return to home screen")
    }

    // MARK: - Regression Tests

    func testRegression_ThemeSwitcherExists() throws {
        let themeSwitcher = app.buttons["Change color theme"]
        XCTAssertTrue(themeSwitcher.exists, "Theme switcher should be visible")
    }

    func testRegression_RecordingButtonAccessible() throws {
        let recordButton = app.buttons["Start recording your story"]
        XCTAssertTrue(recordButton.exists, "Recording button should be visible")
        XCTAssertTrue(recordButton.isHittable, "Recording button should be tappable")

        // Verify minimum touch target (120pt)
        let frame = recordButton.frame
        XCTAssertGreaterThanOrEqual(frame.height, 120, "Recording button should be at least 120pt tall")
    }

    func testRegression_NavigationButtonsAccessible() throws {
        let storiesButton = app.buttons["View my stories"]
        XCTAssertTrue(storiesButton.exists, "My Stories button should be visible")

        let helpButton = app.buttons["Get help"]
        XCTAssertTrue(helpButton.exists, "Help button should be visible")
    }

    func testRegression_WelcomeMessageExists() throws {
        let welcomeMessage = app.otherElements["Welcome message"]
        XCTAssertTrue(welcomeMessage.exists, "Welcome message should be visible")
    }
}
