# Bugs 31-36 Implementation - Setup Instructions

## ⚠️ IMPORTANT: Manual Xcode Steps Required

The code for Bugs 31-36 has been written, but **3 critical steps must be completed in Xcode** before the build will succeed:

---

## Step 1: Add New Swift Files to Xcode Project

The following new files were created but are not yet part of the Xcode project target:

1. **MemoirGuide/Managers/CameraManager.swift** (Bug 34-36: Camera & video recording)
2. **MemoirGuide/Views/CameraPreviewView.swift** (Bug 34: Live camera preview)
3. **MemoirGuide/Views/VideoPlayerManager.swift** (Bug 36: Video playback)

### How to Add Them:

1. Open `MemoirGuide.xcodeproj` in Xcode
2. Right-click on the **Managers** folder in Project Navigator
3. Select "Add Files to MemoirGuide..."
4. Navigate to and select `CameraManager.swift`
5. Ensure "Add to targets: MemoirGuide" is **checked**
6. Click "Add"
7. Repeat for **Views** folder with `CameraPreviewView.swift` and `VideoPlayerManager.swift`

---

## Step 2: Update Core Data Model

### Add Video Support to MemoirSegment Entity:

1. Open `LifeBook.xcdatamodeld` in Xcode
2. Select the **MemoirSegment** entity in the left panel
3. Click **+** in the Attributes section (bottom panel)
4. Add these two attributes:

| Attribute Name | Type | Optional | Default |
|---|---|---|---|
| `videoFileName` | String | ✅ Yes | - |
| `videoFileSize` | Integer 64 | ❌ No | 0 |

5. **Save** the model file (⌘S)

---

## Step 3: Add Camera Usage Description to Info.plist

1. Open `Info.plist` in Xcode
2. Add a new entry:
   - **Key**: `Privacy - Camera Usage Description`
   - **Type**: String
   - **Value**: "We need camera access to record video alongside your story audio."

---

## Summary of Changes

### Bug 31: No Audio Validation ✅
- **File**: `AccessibleRecordingView.swift`
- **Change**: Added validation to check if audio was captured before navigating to recording complete screen
- **Behavior**: Shows alert "We didn't capture any audio..." if transcription empty or duration < 1 second

### Bug 32: Remove AI Prompt Card ✅
- **Files**: `AccessibleRecordingView.swift`
- **Change**: Removed AI conversation prompt card from home screen
- **Behavior**: AI prompt section no longer displays

### Bug 33: Expand Text Boxes ✅
- **File**: `StoryAssignmentView.swift`
- **Change**: Increased text box heights to fill space
  - "What I captured": 150 → 250 height
  - "How I heard it": 200 → 300 height

### Bug 34: Live Camera Preview ⚠️
- **New Files**: `CameraManager.swift`, `CameraPreviewView.swift`
- **Modified**: `AccessibleRecordingView.swift`, `MemoirGuideApp.swift`, `AppError.swift`
- **Behavior**: Shows live camera feed where AI prompt was
- **Requires**: Manual Xcode steps above

### Bug 35: Camera Toggle ⚠️
- **Files**: Same as Bug 34
- **Behavior**: Tap camera preview to toggle on/off (shows gray background when off)
- **Requires**: Manual Xcode steps above

### Bug 36: Video Recording & Playback ⚠️
- **New Files**: `VideoPlayerManager.swift`
- **Modified**: `CoreDataEntities.swift`, `RecordingManager.swift`, `StoryAssignmentView.swift`
- **Behavior**:
  - Records video alongside audio when camera enabled
  - Saves video to `SecureVideo/` directory
  - Shows video player on playback screen ONLY if video exists
  - Syncs video playback with audio playback
- **Requires**: Manual Xcode steps above

---

## After Completing Xcode Steps:

1. Clean Build Folder: **Product → Clean Build Folder** (⇧⌘K)
2. Build: **Product → Build** (⌘B)
3. Run on device/simulator

---

## Troubleshooting

### Build Error: "Cannot find type 'CameraManager'"
→ Complete **Step 1** above (add files to project)

### Build Error: "Unrecognized selector 'videoFileName'"
→ Complete **Step 2** above (update Core Data model)

### Runtime: Camera not showing
→ Complete **Step 3** above (add camera permission to Info.plist)

---

## Git Commits

All code changes are committed on branch `003-create-a-comprehensive`:
- `b21ed5a` - Bug 31: No-audio validation
- `b5bd8dc` - Bug 32: Remove AI prompt card
- `0e175f5` - Bug 33: Expand text boxes
- `[next]` - Bugs 34-36: Camera & video features (this commit)
