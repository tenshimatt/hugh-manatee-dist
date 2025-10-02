# Testing Strategy - MemoirGuide

## Two-Tier Testing Approach

### Tier 1: XCUITest (Native iOS) - Primary
**Use for:** Automated regression testing in Xcode
**Run via:** Xcode (⌘U) or CLI
**Benefits:** Native, fast, integrated with Xcode, no external dependencies
**Location:** `MemoirGuide/Tests/MemoirGuideUITests.swift`

```bash
# Run all tests
xcodebuild test -scheme MemoirGuide -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# Run specific test
xcodebuild test -scheme MemoirGuide -destination 'platform=iOS Simulator,name=iPhone 16 Pro' -only-testing:MemoirGuideUITests/MemoirGuideUITests/testBug31_NoAudioValidationPopup
```

### Tier 2: Appium (Python) - Secondary
**Use for:** Cross-platform testing, CI/CD integration, detailed reporting
**Run via:** pytest
**Benefits:** Better reporting, easier to run remotely, works with any language
**Location:** `tests/appium/test_bugs_31_41.py`

```bash
cd tests/appium
pytest test_bugs_31_41.py --html=report.html --self-contained-html -v
```

## Current Test Coverage

### ✅ Implemented & Passing
- **Bug 31**: No-audio validation popup
- **Bug 32**: AI prompt removed from home screen
- **Bug 40-41**: Help screen text and size updates
- **Regression**: Theme switcher, recording button, navigation

### ⏭️ Skipped (Visual Verification Needed)
- **Bug 33**: Expanded text boxes (requires visual check of 250/300 heights)

### ❌ Expected to Fail (Until Xcode Setup)
- **Bug 34**: Camera preview exists
- **Bug 35**: Camera toggle functionality
- **Bug 36**: Video recording integration

## Test Execution Workflow

### Before Each Commit:
```bash
# 1. Run XCUITests in Xcode
⌘U

# 2. If all pass, commit
git add .
git commit -m "..."

# 3. If any fail, fix and repeat
```

### Weekly Full Test:
```bash
# 1. Run both test suites
xcodebuild test -scheme MemoirGuide -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
cd tests/appium && pytest test_bugs_31_41.py --html=report.html -v

# 2. Review HTML report
open tests/appium/report.html

# 3. Document any new failures
```

## Adding New Tests

### For New Bug Fix:
```swift
// Add to MemoirGuideUITests.swift
func testBug42_YourFeature() throws {
    // Given: Initial state
    // When: User action
    // Then: Expected result
    XCTAssertTrue(...)
}
```

### For New Feature:
```swift
// Create new test class
final class FeatureXTests: XCTestCase {
    // ... tests
}
```

## Test Maintenance

### When UI Changes:
1. Update accessibility IDs in code
2. Update test selectors
3. Re-run all tests
4. Update expected values

### When Test Fails:
1. Check if it's a real bug (test caught regression ✅)
2. OR test needs updating (UI changed ⚠️)
3. Fix code or test accordingly
4. Verify fix with manual testing
5. Re-run test suite

## CI/CD Integration (Future)

```yaml
# .github/workflows/test.yml
name: UI Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: xcodebuild test -scheme MemoirGuide -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
```
