# Appium Test Setup - Quick Start

## 1. Install Appium
```bash
npm install -g appium
appium driver install xcuitest
```

## 2. Install Python Dependencies
```bash
cd tests/appium
pip install -r requirements.txt
```

## 3. Update App Path in Test File
```bash
# Get your app path
xcodebuild -scheme MemoirGuide -sdk iphonesimulator -showBuildSettings | grep BUILT_PRODUCTS_DIR

# Edit test_bugs_31_41.py line 21 with your path
# Example: /Users/you/Library/Developer/Xcode/DerivedData/MemoirGuide-.../Debug-iphonesimulator/MemoirGuide.app
```

## 4. Start Appium Server (Terminal 1)
```bash
appium
```
Leave this running.

## 5. Build App (Terminal 2)
```bash
cd /Users/mattwright/pandora/lifebook
xcodebuild -scheme MemoirGuide -sdk iphonesimulator -configuration Debug
```

## 6. Run Tests (Terminal 2)
```bash
cd tests/appium
pytest test_bugs_31_41.py --html=report.html --self-contained-html -v
```

## 7. Check Results

**Open:** `report.html` in browser

**Expected Results (Current State):**
- ✅ Bug 31: PASS (no-audio validation works)
- ✅ Bug 32: PASS (AI prompt removed)
- ⏭️ Bug 33: SKIPPED (visual verification needed)
- ❌ Bug 34: FAIL (camera files not in Xcode project)
- ❌ Bug 35: FAIL (camera files not in Xcode project)
- ⏭️ Bug 36: SKIPPED (needs Xcode + Core Data update)
- ✅ Bug 40-41: PASS (help screen updated)
- ✅ Regression tests: PASS

**Send me the report.html or paste terminal output.**
