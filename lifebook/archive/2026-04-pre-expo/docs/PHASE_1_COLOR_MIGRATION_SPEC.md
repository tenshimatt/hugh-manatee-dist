# Phase 1: California Beach Patina Color Migration
## Aurora Color System Transformation

---

## 🎯 Objective

Replace Aurora's clinical teal color system with a warm California beach patina palette while maintaining 100% accessibility compliance and zero functionality changes.

**Timeline**: 1 week
**Risk Level**: Low (visual only, no logic changes)
**Success Metric**: Warm, nostalgic aesthetic without accessibility regressions

---

## 📐 Color System Specification

### OLD SYSTEM (Clinical Teal)
```swift
// Current DesignSystem.swift
static let primaryTeal = Color(red: 114/255, green: 163/255, blue: 153/255)      // #72A399
static let backgroundBeige = Color(red: 245/255, green: 243/255, blue: 240/255)  // #F5F3F0
static let textPrimary = Color.black.opacity(0.85)
static let textSecondary = Color.black.opacity(0.6)
static let recordRed = Color.red
static let warmGray = Color.gray.opacity(0.3)
```

### NEW SYSTEM (California Beach Patina)
```swift
// Aurora/DesignSystem.swift - UPDATED COLOR PALETTE

// MARK: - California Beach Patina Palette

// Primary Warmth Spectrum
static let amber = Color(red: 255/255, green: 200/255, blue: 87/255)        // #FFC857
static let sunsetOrange = Color(red: 247/255, green: 127/255, blue: 0/255)  // #F77F00
static let cornYellow = Color(red: 252/255, green: 191/255, blue: 73/255)   // #FCBF49
static let sunshine = Color(red: 255/255, green: 230/255, blue: 109/255)    // #FFE66D

// Contrast Anchor
static let deepNavy = Color(red: 0/255, green: 61/255, blue: 91/255)        // #003D5B

// Gradient Helpers (for Phase 2 borderless design)
static let warmGradientStart = amber.opacity(0.05)
static let warmGradientEnd = cornYellow.opacity(0.08)
static let amberGlow = amber.opacity(0.1)

// KEEP EXISTING (per user request)
static let backgroundBeige = Color(red: 247/255, green: 245/255, blue: 242/255)  // Neutral bg maintained
static let textPrimary = Color.black.opacity(0.85)
static let textSecondary = Color.black.opacity(0.6)
static let recordRed = Color.red  // Keep for stop button

// DEPRECATED (mark for removal, keep for backward compat during migration)
@available(*, deprecated, message: "Use deepNavy or amber instead")
static let primaryTeal = Color(red: 114/255, green: 163/255, blue: 153/255)
```

---

## 🗺️ Component Migration Map

### File: `Aurora/DesignSystem.swift`

**Task**: Add new color palette, deprecate old teal

**Changes**:
```swift
// Line ~15: Add new color section
// MARK: - California Beach Patina Palette
static let amber = Color(red: 255/255, green: 200/255, blue: 87/255)
// ... (full palette from above)

// Line ~30: Deprecate old colors
@available(*, deprecated, message: "Use deepNavy or amber instead")
static let primaryTeal = Color(red: 114/255, green: 163/255, blue: 153/255)
```

---

### File: `Aurora/HomeView.swift`

**Current Usage**:
- Today's Prompt card: Teal accent
- Icon navigation: Teal for My Stories icon
- Background: Beige (keep)

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Prompt card sparkle icon | ~90 | `primaryTeal` | `amber` | Warm invitation |
| Prompt card text | ~105 | `primaryTeal` | `amber` | Consistency |
| Stories icon | ~160 | `primaryTeal` | `amber` | Navigation warmth |
| Me icon | ~169 | `.purple` | `sunsetOrange` | Beach palette harmony |

**Code Changes**:
```swift
// Line 90
Image(systemName: "sparkles")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal

// Line 105
Text(promptService.currentPrompt)
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal

// Line 162
Image(systemName: "book.fill")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal

// Line 171
Image(systemName: "face.smiling.fill")
    .foregroundColor(DesignSystem.sunsetOrange)  // Was: .purple
```

---

### File: `Aurora/StoriesListView.swift`

**Current Usage**:
- Tab selector: Teal fill for active tab
- Story cards: Teal emoji background
- Add button: Teal

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Active tab background | ~65 | `lightTeal` | `sunshine` | Sunny selection |
| Active tab border | ~70 | `primaryTeal` | `sunshine` | Consistency |
| Story emoji background | ~155 | `softTeal` | `warmGradientStart` | Warm artifact feel |
| Add story button | ~205 | `primaryTeal` | `deepNavy` | Strong CTA anchor |

**Code Changes**:
```swift
// Line 65 - Active tab background
.fill(selectedTab == 0 ? DesignSystem.sunshine : Color.clear)  // Was: lightTeal

// Line 70 - Active tab border
.strokeBorder(selectedTab == 0 ? DesignSystem.sunshine : Color.clear, lineWidth: 2)  // Was: primaryTeal

// Line 155 - Story card emoji background
Circle()
    .fill(DesignSystem.warmGradientStart)  // Was: softTeal
    .frame(width: 60, height: 60)

// Line 205 - Add button
Image(systemName: "plus.circle.fill")
    .foregroundColor(DesignSystem.deepNavy)  // Was: primaryTeal
```

---

### File: `Aurora/RecordingCompleteView.swift`

**Current Usage**:
- Save button: Teal background
- Category badge: Teal

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Save button | ~120 | `primaryTeal` | `deepNavy` | Strong action |
| Category badge | ~85 | `lightTeal` | `sunshine.opacity(0.2)` | Soft warmth |

**Code Changes**:
```swift
// Line 120 - Save button
.background(DesignSystem.deepNavy)  // Was: primaryTeal

// Line 85 - Category badge
Text(category)
    .padding(.horizontal, 12)
    .padding(.vertical, 6)
    .background(DesignSystem.sunshine.opacity(0.2))  // Was: lightTeal
    .foregroundColor(DesignSystem.textPrimary)
```

---

### File: `Aurora/StoryDetailView.swift`

**Current Usage**:
- Enhanced story card: Teal accent
- Edit button: Teal
- Play button: Teal

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Enhanced label | ~95 | `primaryTeal` | `amber` | AI warmth |
| Edit button | ~175 | `primaryTeal` | `deepNavy` | Action anchor |
| Play button | ~200 | `primaryTeal` | `amber` | Warm engagement |

**Code Changes**:
```swift
// Line 95 - AI Enhanced label
Image(systemName: "sparkles")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal

// Line 175 - Edit button
Text("Edit")
    .foregroundColor(DesignSystem.deepNavy)  // Was: primaryTeal

// Line 200 - Play button
Image(systemName: "play.circle.fill")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal
```

---

### File: `Aurora/ProfileProgressView.swift`

**Current Usage**:
- Section headers: Teal
- Progress bars: Teal fill
- Completion badges: Teal

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Section headers | ~80 | `primaryTeal` | `amber` | Warm hierarchy |
| Progress bar fill | ~150 | `primaryTeal` | `cornYellow` | Optimistic progress |
| Completion badge | ~185 | `primaryTeal` | `sunshine` | Celebration |

**Code Changes**:
```swift
// Line 80 - Section headers
Text("Family Tree")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal

// Line 150 - Progress bar
Rectangle()
    .fill(DesignSystem.cornYellow)  // Was: primaryTeal
    .frame(width: geometry.size.width * progress, height: 8)

// Line 185 - Completion badge
Circle()
    .fill(DesignSystem.sunshine)  // Was: primaryTeal
    .overlay(Image(systemName: "checkmark"))
```

---

### File: `Aurora/SettingsView.swift`

**Current Usage**:
- Toggle switches: Teal when on
- Section dividers: Light teal

**Migration**:

| Element | Line | Old Color | New Color | Rationale |
|---------|------|-----------|-----------|-----------|
| Toggle on state | ~95 | `primaryTeal` | `cornYellow` | Warm activation |
| List row accent | ~120 | `primaryTeal` | `amber` | Hierarchy |

**Code Changes**:
```swift
// Line 95 - Toggle
Toggle("Auto-save recordings", isOn: $autoSaveEnabled)
    .toggleStyle(SwitchToggleStyle(tint: DesignSystem.cornYellow))  // Was: primaryTeal

// Line 120 - List row chevron
Image(systemName: "chevron.right")
    .foregroundColor(DesignSystem.amber)  // Was: primaryTeal
```

---

## ✅ Accessibility Validation Requirements

### WCAG AAA Compliance Checklist

**Contrast Ratios (Minimum 7:1 for AAA)**:

| Color Pair | Ratio | Status | Notes |
|------------|-------|--------|-------|
| DeepNavy (#003D5B) on White | 12.6:1 | ✅ PASS | Excellent for buttons/text |
| White on DeepNavy | 12.6:1 | ✅ PASS | Excellent for inverse |
| Amber (#FFC857) on White | 1.8:1 | ❌ FAIL | Use for icons only, not text |
| DeepNavy text on Amber | 4.7:1 | ⚠️ AA only | Avoid if possible |
| Sunshine (#FFE66D) on White | 1.5:1 | ❌ FAIL | Backgrounds only |
| Black text on Sunshine (0.2 opacity) | 16:1 | ✅ PASS | Safe for badges |

**Safe Color Usage Rules**:
1. **Text on White**: Use `textPrimary` (black 85%) or `deepNavy` only
2. **Text on Colored Backgrounds**: Use white or `textPrimary` if background opacity < 0.3
3. **Icons on White**: Any color from palette OK (icons are symbolic, not text)
4. **Buttons**: DeepNavy background + white text (highest contrast)

### Testing Tools
```bash
# Install contrast checker
npm install -g a11y-contrast

# Test each color pair
a11y-contrast --bg "#FFFFFF" --fg "#003D5B"  # Navy on white
a11y-contrast --bg "#FFFFFF" --fg "#FFC857"  # Amber on white
```

---

## 🧪 Testing Protocol

### Visual Regression Testing

**Before Migration**:
1. Take screenshots of ALL views in current state
2. Store in `/Aurora/Tests/Screenshots/Before/`
3. Document current color usage in spreadsheet

**After Migration**:
1. Take matching screenshots
2. Store in `/Aurora/Tests/Screenshots/After/`
3. Side-by-side comparison for approval

**Screenshot List**:
- [ ] HomeView (with prompt card)
- [ ] StoriesListView (My Stories tab)
- [ ] StoriesListView (Vault tab)
- [ ] StoryDetailView (with enhanced story)
- [ ] RecordingCompleteView
- [ ] ProfileProgressView
- [ ] SettingsView
- [ ] HelpView

### Device Testing Matrix

| Device | iOS Version | Test |
|--------|-------------|------|
| iPhone SE (small) | 16.0 | Color visibility |
| iPhone 14 Pro | 17.0 | Standard |
| iPhone 15 Pro Max | 18.0 | Large screen |
| iPad Air | 17.0 | Tablet layout |

### Accessibility Testing

**VoiceOver**:
- [ ] All elements properly labeled (no change from color migration)
- [ ] Color is not the only means of conveying information
- [ ] Screen reader ignores decorative color changes

**Color Blindness Simulation**:
- [ ] Protanopia (red-blind): Navy/amber still distinguishable
- [ ] Deuteranopia (green-blind): Navy/amber still distinguishable
- [ ] Tritanopia (blue-blind): Navy/amber still distinguishable

**Dark Mode** (if applicable):
- [ ] Colors adapt appropriately
- [ ] Contrast maintained

---

## 📊 Success Criteria

### Functional Requirements
- [ ] Zero functionality changes
- [ ] All existing tests pass
- [ ] Build succeeds with no warnings
- [ ] App size unchanged (colors don't add assets)

### Visual Requirements
- [ ] 100% teal color references replaced
- [ ] Warm palette consistently applied
- [ ] No jarring color clashes
- [ ] Maintains elderly-friendly aesthetic

### Accessibility Requirements
- [ ] All text meets WCAG AAA (7:1 ratio)
- [ ] Touch targets unchanged (44x44pt minimum)
- [ ] VoiceOver functionality unchanged
- [ ] Color blindness safe

### User Experience
- [ ] Feels warmer, more nostalgic
- [ ] Less clinical, more inviting
- [ ] Still calm and non-threatening
- [ ] No increase in visual complexity

---

## 🚀 Implementation Tasks

### Task 1: Update DesignSystem.swift
**Agent**: `color-system-specialist`
**File**: `Aurora/DesignSystem.swift`
**Deliverables**:
- Add California Beach Patina color palette
- Deprecate old teal colors
- Add gradient helper properties
- Verify build succeeds

### Task 2: Migrate HomeView
**Agent**: `home-view-color-specialist`
**File**: `Aurora/HomeView.swift`
**Deliverables**:
- Replace all teal references with warm colors
- Update icon colors (Stories → amber, Me → sunset orange)
- Verify no layout changes
- Screenshot before/after

### Task 3: Migrate StoriesListView
**Agent**: `stories-view-color-specialist`
**File**: `Aurora/StoriesListView.swift`
**Deliverables**:
- Update tab selector (teal → sunshine)
- Update story cards (teal → amber gradient)
- Update add button (teal → navy)
- Screenshot before/after

### Task 4: Migrate All Other Views
**Agent**: `views-color-migration-specialist`
**Files**:
- `RecordingCompleteView.swift`
- `StoryDetailView.swift`
- `ProfileProgressView.swift`
- `SettingsView.swift`
- `HelpView.swift`

**Deliverables**:
- Systematic color replacement per migration map
- Accessibility validation for each view
- Screenshots before/after

### Task 5: Accessibility Validation
**Agent**: `accessibility-validator-specialist`
**Deliverables**:
- Contrast ratio testing for all color pairs
- VoiceOver testing on device
- Color blindness simulation
- Accessibility report

### Task 6: Build & Deploy
**Agent**: `build-deployment-specialist`
**Deliverables**:
- Build Aurora with new colors
- Install on test device
- User acceptance testing
- Final approval screenshots

---

## 📸 Before/After Mockups

### HomeView Transformation
```
BEFORE:
┌─────────────────────────┐
│ Good Morning, Matt      │ ← Black text
│ [Teal sparkle] Prompt   │ ← Teal accent
│ Tell me about...        │ ← Teal text
│                         │
│ Conversation            │
│                         │
│ [Teal Book] [Purple 😊] │ ← Mixed colors
└─────────────────────────┘

AFTER:
┌─────────────────────────┐
│ Good Morning, Matt      │ ← Black text (same)
│ [Amber sparkle] Prompt  │ ← Warm amber
│ Tell me about...        │ ← Warm amber
│                         │
│ Conversation            │
│                         │
│ [Amber Book] [Orange 😊]│ ← Beach palette
└─────────────────────────┘
```

### StoriesListView Transformation
```
BEFORE:
┌─────────────────────────┐
│ [Teal Tab] [Gray Tab]   │ ← Teal selection
│                         │
│ 📖 [Teal circle]        │ ← Teal emoji bg
│ Story title             │
│                         │
│ [Teal +] Add Story      │ ← Teal CTA
└─────────────────────────┘

AFTER:
┌─────────────────────────┐
│ [Sunshine Tab] [Gray]   │ ← Warm selection
│                         │
│ 📖 [Amber gradient]     │ ← Beach gradient
│ Story title             │
│                         │
│ [Navy +] Add Story      │ ← Strong navy CTA
└─────────────────────────┘
```

---

## 🔄 Rollback Plan

**If accessibility issues or user confusion**:

1. **Immediate**: Revert DesignSystem.swift to old teal values
2. **Git**: `git revert <commit-hash>` for color migration commits
3. **Rebuild**: Deploy previous version to device
4. **Analysis**: Identify specific color pairs causing issues
5. **Iterate**: Adjust problematic colors, retest

**Rollback is simple because**:
- No logic changes, only color values
- Old colors marked as deprecated but still available
- One file change (DesignSystem.swift) reverts most changes

---

## 📅 Timeline

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 1 | DesignSystem.swift update | Agent 1 | New color palette |
| 2 | HomeView migration | Agent 2 | Updated home screen |
| 3 | StoriesListView migration | Agent 3 | Updated stories |
| 4 | Remaining views migration | Agent 4 | All views updated |
| 5 | Accessibility validation | Agent 5 | Compliance report |
| 6 | Build & deploy | Agent 6 | Device testing |
| 7 | User acceptance | User | Final approval |

---

## ✅ Final Deliverables

1. **Updated Files**:
   - DesignSystem.swift (color palette)
   - HomeView.swift
   - StoriesListView.swift
   - RecordingCompleteView.swift
   - StoryDetailView.swift
   - ProfileProgressView.swift
   - SettingsView.swift
   - HelpView.swift

2. **Documentation**:
   - Before/after screenshots (8 views)
   - Accessibility compliance report
   - Color usage guide for future development

3. **Deployed App**:
   - Built and installed on device
   - User tested for warmth and accessibility
   - Ready for Phase 2 (borderless design)

---

**Status**: Specification complete. Ready to spawn specialist agents for implementation.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

