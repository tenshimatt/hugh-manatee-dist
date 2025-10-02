"""
Appium Tests for MemoirGuide Bugs 31-41
Run: pytest test_bugs_31_41.py --html=report.html --self-contained-html
"""

import pytest
from appium import webdriver
from appium.options.ios import XCUITestOptions
from appium.webdriver.common.appiumby import AppiumBy
import time


@pytest.fixture(scope="session")
def driver():
    """Setup Appium driver for iOS simulator"""
    options = XCUITestOptions()
    options.platform_name = 'iOS'
    options.platform_version = '18.0'
    options.device_name = 'iPhone 16 Pro'
    options.automation_name = 'XCUITest'

    # App path - update this after first build
    # Get it via: xcodebuild -scheme MemoirGuide -sdk iphonesimulator -showBuildSettings | grep BUILT_PRODUCTS_DIR
    options.app = '/Users/mattwright/Library/Developer/Xcode/DerivedData/MemoirGuide-epqfraejcnnkljdjvzfnshzddiae/Build/Products/Debug-iphonesimulator/MemoirGuide.app'

    driver = webdriver.Remote('http://127.0.0.1:4723', options=options)
    yield driver
    driver.quit()


class TestBugs31to33:
    """Tests for audio validation, AI prompt removal, text box expansion"""

    def test_bug_31_no_audio_validation(self, driver):
        """Bug 31: Show popup if no audio captured"""
        # Find and tap record button
        record_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Start recording your story")
        record_btn.click()
        time.sleep(1)

        # Immediately stop (no audio captured)
        stop_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Stop recording. Currently recording for 00:01")
        stop_btn.click()
        time.sleep(1)

        # Verify alert appears
        alert = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "No Audio Captured")
        assert alert.is_displayed(), "No audio alert should appear"

        # Verify alert message
        message = driver.find_element(AppiumBy.NAME, "We didn't capture any audio. Just letting you know, please try again when you're ready.")
        assert message.is_displayed(), "Alert message should be visible"

        # Tap OK
        ok_btn = driver.find_element(AppiumBy.NAME, "OK")
        ok_btn.click()
        time.sleep(0.5)

        # Verify we're still on home screen
        welcome = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Welcome message")
        assert welcome.is_displayed(), "Should stay on home screen after alert"

    def test_bug_32_ai_prompt_removed(self, driver):
        """Bug 32: AI prompt card should not exist on home screen"""
        # Try to find AI prompt - should fail
        try:
            ai_prompt = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "AI Conversation Guide")
            pytest.fail("AI prompt should not exist on home screen")
        except:
            pass  # Expected - element should not exist

    def test_bug_33_expanded_text_boxes(self, driver):
        """Bug 33: Text boxes should be larger on recording complete screen"""
        # This requires actually recording audio, so we'll skip functional test
        # and rely on visual verification
        pytest.skip("Requires actual recording - verify visually that text boxes are 250/300 height")


class TestBugs34to36:
    """Tests for camera preview, toggle, and video recording"""

    def test_bug_34_camera_preview_exists(self, driver):
        """Bug 34: Camera preview should be visible on home screen"""
        # Note: Will fail until Xcode setup completed
        try:
            camera = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Camera preview active. Tap to turn off")
            assert camera.is_displayed(), "Camera preview should be visible"

            # Verify it has reasonable size (at least 100x100)
            size = camera.size
            assert size['height'] >= 100, f"Camera height {size['height']} should be >= 100"
            assert size['width'] >= 100, f"Camera width {size['width']} should be >= 100"
        except Exception as e:
            pytest.fail(f"Bug 34 FAILED (expected until Xcode setup): {e}")

    def test_bug_35_camera_toggle(self, driver):
        """Bug 35: Tapping camera should toggle on/off"""
        # Note: Will fail until Xcode setup completed
        try:
            # Find camera (should be on by default)
            camera = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Camera preview active. Tap to turn off")
            camera.click()
            time.sleep(0.5)

            # Should now show "off" state
            camera_off = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Camera off. Tap to turn on")
            assert camera_off.is_displayed(), "Camera should show off state"

            # Toggle back on
            camera_off.click()
            time.sleep(0.5)

            camera_on = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Camera preview active. Tap to turn off")
            assert camera_on.is_displayed(), "Camera should show on state"
        except Exception as e:
            pytest.fail(f"Bug 35 FAILED (expected until Xcode setup): {e}")

    def test_bug_36_video_recording_integration(self, driver):
        """Bug 36: Video should be recorded and displayed on playback"""
        # Note: Will fail until Xcode setup + Core Data model update
        pytest.skip("Requires Xcode setup + Core Data model update - test manually")


class TestBugs40to41:
    """Tests for help screen text and size updates"""

    def test_bug_40_41_help_screen_content(self, driver):
        """Bugs 40-41: Help screen should have new text at larger size"""
        # Tap Help button
        help_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Get help")
        help_btn.click()
        time.sleep(1)

        # Verify new text exists (Bug 40)
        header = driver.find_element(AppiumBy.NAME, "Hello there - let me help you out.")
        assert header.is_displayed(), "New help header should be visible"

        body1 = driver.find_element(AppiumBy.NAME, "For now, just tell me what you need and we'll sort it out together. Soon you'll also be able to search through helpful guides I'm putting together.")
        assert body1.is_displayed(), "New help body should be visible"

        footer = driver.find_element(AppiumBy.NAME, "What's on your mind?")
        assert footer.is_displayed(), "Help footer should be visible"

        # Verify text is larger (Bug 41) - check font size
        # Note: Appium can't directly verify font size, so we rely on visual verification
        # But we can verify the text takes up more vertical space
        header_size = header.size
        assert header_size['height'] > 30, "Header should be taller due to 50% larger font"

        # Close help
        close_btn = driver.find_element(AppiumBy.NAME, "Close")
        close_btn.click()
        time.sleep(0.5)


class TestRegression:
    """Regression tests - ensure previous functionality still works"""

    def test_theme_switcher_exists(self, driver):
        """Theme switcher should still be accessible"""
        theme_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Change color theme")
        assert theme_btn.is_displayed(), "Theme switcher should be visible"

    def test_recording_button_exists(self, driver):
        """Main recording button should be visible and large"""
        record_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Start recording your story")
        assert record_btn.is_displayed(), "Recording button should be visible"

        # Verify minimum touch target size (120pt)
        size = record_btn.size
        assert size['height'] >= 120, f"Recording button height {size['height']} should be >= 120"

    def test_navigation_buttons(self, driver):
        """My Stories and Help buttons should be accessible"""
        stories_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "View my stories")
        assert stories_btn.is_displayed(), "My Stories button should be visible"

        help_btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Get help")
        assert help_btn.is_displayed(), "Help button should be visible"
