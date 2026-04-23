# Phase 3: Temporal Narrative Enhancement System
## Aurora - "Remembering and Rebuilding" Era Contextualization

---

## 🎯 Vision Statement

**Transform Aurora from a recording device into a time machine.**

Users don't just capture memories—they **reconstruct the world those memories lived in**. Hugh becomes a temporal storyteller, weaving personal recollections into the cultural, visual, and emotional fabric of their era.

**Inspiration**: WALL-E's themes of preserving artifacts, reconstructing lost worlds, and rebuilding connections to the past.

---

## 🏗️ Core Concept Architecture

### Phase 1: Story Extraction Protocol

**Guided Information Gathering During/After Recording**:

1. **Temporal Anchor**: "When did this story take place? (Year/Decade)"
2. **Geographic Context**: "Where did this unfold?"
3. **Cast of Characters**: "Who were the key people involved?"
4. **Narrative Arc**: "What happened - beginning, middle, end?"
5. **Emotional Resonance**: "What feelings/themes dominated?"

### Phase 2: Temporal Contextualization Engine

**Decade DNA Mapping**:

**1970s Framework**:
- Visual Palette: Earth tones, wood paneling, avocado green, harvest gold, macramé
- Cultural Markers: Watergate, disco emergence, oil crisis, bicentennial
- Technology Snapshot: Rotary phones, 8-track tapes, Pong, nascent computing
- Social Climate: Post-Vietnam reflection, environmental awakening, women's liberation
- Aesthetic: Shag carpets, station wagons, bell-bottoms, lava lamps

**1960s Framework**:
- Visual Language: Psychedelic patterns, space-age design, mod fashion
- Historical Anchors: Moon landing, civil rights, counterculture, Beatles
- Aesthetic Markers: Go-go boots, beehive hair, chrome diners, Formica
- Collective Mood: Revolutionary optimism mixed with Cold War tension

**1950s Framework**:
- Visual Palette: Pastel pinks, mint greens, chrome accents, Formica counters
- Cultural Markers: Eisenhower era, Korean War, suburbanization, TV boom
- Technology: Black & white TV, tail-fin cars, jukeboxes, rotary phones
- Social Climate: Post-war optimism, conformity, nuclear family ideal

**1980s Framework**:
- Visual Language: Neon colors, geometric patterns, MTV aesthetic
- Cultural Markers: Reagan era, Cold War end, yuppie culture, MTV launch
- Technology: VCRs, Walkmans, early PCs, arcade games
- Social Climate: Materialism, excess, pop culture explosion

### Phase 3: Implementation Methodology

**Search Query Optimization**:
```
[Decade] + [Location] + contextual elements:
- "1983 suburban kitchen appliances"
- "Manhattan office building 1975 interior"
- "High school gymnasium dance 1967"
```

**Narrative Weaving Technique**:
1. **Macro Context**: Set the historical stage (2-3 sentences)
2. **Micro Environment**: Zoom into specific settings (2-3 sentences)
3. **Personal Layer**: Individual experiences within the zeitgeist
4. **Sensory Details**: Period-accurate textures, sounds, brands

---

## 📋 Technical Implementation

### Backend: Temporal Context Endpoint

**File**: `Aurora-backend/src/index.js`

**New Endpoint**: `POST /ai/contextualize`

```javascript
// Route: POST /ai/contextualize
if (url.pathname === '/ai/contextualize') {
    return handleTemporalContext(request, env);
}

async function handleTemporalContext(request, env) {
    const { transcription, year, location, keywords } = await request.json();

    if (!year) {
        // No temporal info - return original transcription
        return jsonResponse({
            enhancedNarrative: transcription,
            decade: null,
            culturalMarkers: []
        });
    }

    const prompt = buildTemporalContextPrompt(transcription, year, location);
    const response = await callClaude(prompt, env.CLAUDE_API_KEY);

    // Parse response
    const result = JSON.parse(response);

    return jsonResponse({
        enhancedNarrative: result.enhancedStory,
        decade: determineDecade(year),
        culturalMarkers: result.markers,
        visualPalette: result.visualDescription
    });
}

function buildTemporalContextPrompt(transcription, year, location) {
    const decade = Math.floor(year / 10) * 10;

    return `You are a narrative historian reconstructing memories with rich temporal context.

USER'S MEMORY:
"${transcription}"

TEMPORAL ANCHORS:
- Year: ${year}
- Decade: ${decade}s
- Location: ${location || "Not specified"}

YOUR TASK:
Rewrite this memory as a multi-layered narrative in 4 sections:

1. MACRO CONTEXT (2-3 sentences):
Set the historical stage - what was happening in the ${decade}s?
- Major events: presidencies, wars, cultural shifts
- Music/entertainment: what was on the radio, in theaters
- Collective mood: optimism vs. tension, cultural zeitgeist

2. MICRO ENVIRONMENT (3-4 sentences):
Describe the specific setting with period-accurate details:
- Visual palette: colors, patterns, materials popular in ${decade}s
  (e.g., 1970s: earth tones, wood paneling, shag carpets)
- Technology snapshot: phones, cars, appliances of the era
- Ambient details: brands, sounds, textures people remember
  (e.g., 1960s: chrome diners, Formica counters, transistor radios)

3. PERSONAL NARRATIVE (4-6 sentences):
Preserve the user's story but weave in sensory period details:
- Keep the original meaning and emotions
- Add specific visual details (what colors, what fabrics)
- Include sounds (what music, what car engines)
- Reference period-specific items (brands, products, cultural touchstones)

4. SENSORY TOUCHPOINTS (5-7 specific details):
List concrete, evocative details:
- What music was on the radio? (specific songs/artists from ${year})
- What did kitchens/cars/clothes look like? (specific styles)
- What brands/products were everywhere? (Coca-Cola ads, specific cars)
- What colors dominated the era?
- What textures/materials were common? (vinyl, Formica, wood paneling)

STYLE GUIDE:
- Warm, nostalgic but not cloying
- Specific > vague: "wood-paneled station wagon" not "old car"
- Mix high/low culture: Beatles AND grocery store muzak
- Keep user's voice central - enhance, don't replace
- Use present tense for immediacy: "The radio plays..." not "played"

OUTPUT FORMAT (JSON):
{
  "enhancedStory": "Full rewritten narrative incorporating all 4 sections seamlessly",
  "markers": ["cultural touchstone 1", "cultural touchstone 2", ...],
  "visualDescription": "Brief color/aesthetic summary for ${decade}s"
}

EXAMPLE (1965):
enhancedStory: "It's 1965, and America is caught between Leave It to Beaver optimism and Vietnam War anxiety. The Beatles have just played Ed Sullivan, and everything feels possible yet precarious.

The high school gymnasium is a time capsule of mid-60s Americana: mint green walls, polished hardwood floors reflecting fluorescent lights, fold-out bleachers pushed against walls plastered with Go Tigers! banners. A record player in the corner spins 45s—The Supremes, The Beach Boys, maybe some Motown if the chaperones aren't looking.

You're wearing your best dress—the one with the Peter Pan collar and A-line skirt that swishes when you walk—and he's in a narrow tie and Brylcreemed hair. The DJ announces 'My Girl' by The Temptations, and when he asks you to dance, the gymnasium lights suddenly feel softer, more forgiving. His hand on your waist is tentative, respectful in that way boys were taught back then.

Around you: girls in bouffant hairdos and kitten heels, boys in letter jackets smelling of Old Spice, the smell of gym floor wax mixed with Aqua Net hairspray. Someone's transistor radio plays The Rolling Stones during the punch break."

IMPORTANT: Return ONLY valid JSON. No extra text.`;
}

function determineDecade(year) {
    return Math.floor(year / 10) * 10;
}
```

---

### iOS: Temporal Context Service

**File**: `Aurora/Services/TemporalContextService.swift` (NEW)

```swift
import Foundation

class TemporalContextService: ObservableObject {
    static let shared = TemporalContextService()

    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    @Published var isEnhancing = false
    @Published var lastEnhancement: TemporalEnhancement?

    struct TemporalContext {
        let year: Int?
        let location: String?
        let keywords: [String]
    }

    struct TemporalEnhancement: Codable {
        let enhancedNarrative: String
        let decade: Int?
        let culturalMarkers: [String]
        let visualPalette: String?
    }

    func enhanceWithTemporalContext(
        transcription: String,
        context: TemporalContext
    ) async throws -> TemporalEnhancement {
        guard let year = context.year else {
            // No temporal info - return original
            return TemporalEnhancement(
                enhancedNarrative: transcription,
                decade: nil,
                culturalMarkers: [],
                visualPalette: nil
            )
        }

        isEnhancing = true
        defer { isEnhancing = false }

        let endpoint = "\(backendURL)/ai/contextualize"
        guard let url = URL(string: endpoint) else {
            throw TemporalError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60 // Temporal context can take time

        let requestBody: [String: Any] = [
            "transcription": transcription,
            "year": year,
            "location": context.location ?? "",
            "keywords": context.keywords
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw TemporalError.apiError
        }

        let result = try JSONDecoder().decode(TemporalEnhancement.self, from: data)

        await MainActor.run {
            self.lastEnhancement = result
        }

        return result
    }
}

enum TemporalError: LocalizedError {
    case invalidURL
    case apiError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid temporal context URL"
        case .apiError: return "Temporal context service error"
        }
    }
}
```

---

### iOS: Temporal Context Sheet UI

**File**: `Aurora/Views/TemporalContextSheet.swift` (NEW)

```swift
import SwiftUI

struct TemporalContextSheet: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var temporalService = TemporalContextService.shared

    let story: Story
    let onEnhance: (TemporalContextService.TemporalEnhancement) -> Void

    @State private var selectedYear: Int = Calendar.current.component(.year, from: Date())
    @State private var location: String = ""
    @State private var isEnhancing = false

    // Decade picker data
    let decades = Array(stride(from: 1920, through: 2020, by: 10))

    var body: some View {
        NavigationView {
            ZStack {
                DesignSystem.backgroundBeige
                    .ignoresSafeArea()

                VStack(spacing: 24) {
                    // Header with WALL-E inspiration
                    VStack(spacing: 8) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 48))
                            .foregroundColor(DesignSystem.amber)

                        Text("Reconstruct the Era")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)

                        Text("Help me paint the world your memory lived in")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)

                    // Year/Decade Picker
                    VStack(alignment: .leading, spacing: 12) {
                        Text("When did this happen?")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)

                        Picker("Year", selection: $selectedYear) {
                            ForEach(1920...2024, id: \.self) { year in
                                Text(String(year))
                                    .tag(year)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 150)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(DesignSystem.warmCardGradient)
                        )
                    }
                    .padding(.horizontal, 24)

                    // Location (Optional)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Where? (Optional)")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)

                        TextField("e.g., Brooklyn, New York", text: $location)
                            .textFieldStyle(.plain)
                            .font(DesignSystem.body)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(DesignSystem.whiteSubtleGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 4, y: 2)
                    }
                    .padding(.horizontal, 24)

                    Spacer()

                    // Action Buttons
                    VStack(spacing: 12) {
                        // Enhance Button
                        Button(action: enhanceStory) {
                            HStack(spacing: 12) {
                                if isEnhancing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "sparkles")
                                    Text("Reconstruct This Memory")
                                }
                            }
                            .font(DesignSystem.buttonText)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 60)
                            .background(DesignSystem.deepNavy)
                            .cornerRadius(DesignSystem.cornerRadius)
                            .shadow(color: DesignSystem.deepNavy.opacity(0.3), radius: 8, y: 4)
                        }
                        .disabled(isEnhancing)

                        // Skip Button
                        Button(action: { dismiss() }) {
                            Text("Skip for Now")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
        }
    }

    func enhanceStory() {
        isEnhancing = true

        Task {
            do {
                let context = TemporalContextService.TemporalContext(
                    year: selectedYear,
                    location: location.isEmpty ? nil : location,
                    keywords: []
                )

                let enhancement = try await temporalService.enhanceWithTemporalContext(
                    transcription: story.transcription ?? "",
                    context: context
                )

                await MainActor.run {
                    onEnhance(enhancement)
                    dismiss()
                }
            } catch {
                print("❌ [TemporalContext] Enhancement failed: \(error)")
                await MainActor.run {
                    isEnhancing = false
                }
            }
        }
    }
}
```

---

### Integration into Story Flow

**File**: `Aurora/StoryDetailView.swift`

Add button to trigger temporal enhancement:

```swift
// After story title/content display
Button(action: { showingTemporalSheet = true }) {
    HStack(spacing: 8) {
        Image(systemName: "clock.arrow.circlepath")
        Text("Add Era Context")
    }
    .font(DesignSystem.body)
    .foregroundColor(DesignSystem.amber)
    .padding()
    .background(
        RoundedRectangle(cornerRadius: 12)
            .fill(DesignSystem.sunshine.opacity(0.2))
    )
}
.sheet(isPresented: $showingTemporalSheet) {
    TemporalContextSheet(story: story) { enhancement in
        // Update story with enhanced narrative
        story.aiStoryText = enhancement.enhancedNarrative
        story.culturalMarkers = enhancement.culturalMarkers
        story.decade = enhancement.decade
    }
}
```

---

## 🧪 Testing Strategy

### Backend Testing

**Test Case 1: 1970s Story**
```json
POST /ai/contextualize
{
  "transcription": "I remember my first car, a blue station wagon.",
  "year": 1975,
  "location": "suburban Ohio"
}

Expected:
- References wood paneling, earth tones
- Mentions oil crisis context
- Describes 1970s car aesthetic
- Includes period music/culture
```

**Test Case 2: 1960s Story**
```json
POST /ai/contextualize
{
  "transcription": "We went to the drive-in on Saturday nights.",
  "year": 1963,
  "location": "Los Angeles"
}

Expected:
- Moon race context
- Chrome and Formica aesthetics
- Early 60s car culture
- Beach Boys era references
```

### iOS Testing

1. **UI Flow**: Story → Tap "Add Era Context" → Sheet appears
2. **Decade Picker**: Large touch targets, easy year selection
3. **Optional Location**: Works with and without location
4. **Enhancement**: Loading state, success state
5. **Story Update**: Enhanced narrative replaces original

---

## 📊 Success Metrics

- [ ] Backend `/ai/contextualize` endpoint deployed
- [ ] TemporalContextService implemented
- [ ] TemporalContextSheet UI complete
- [ ] Integration into story flow working
- [ ] User testing: Enhanced stories feel richer and more evocative
- [ ] 40%+ adoption rate for temporal enhancement

---

## 🚀 Implementation Tasks

### Task 1: Backend Temporal Context Endpoint
**Agent**: `backend-temporal-specialist`
- Add `/ai/contextualize` route
- Implement Claude prompt for era reconstruction
- Deploy to Cloudflare Workers

### Task 2: iOS Temporal Context Service
**Agent**: `ios-temporal-service-specialist`
- Create TemporalContextService.swift
- Implement backend integration
- Add error handling

### Task 3: Temporal Context Sheet UI
**Agent**: `ios-temporal-ui-specialist`
- Create TemporalContextSheet.swift
- Design decade picker UI
- Implement enhancement flow

### Task 4: Story Integration
**Agent**: `story-integration-specialist`
- Update StoryDetailView
- Add enhancement button
- Wire up sheet presentation

### Task 5: Build & Test
**Agent**: `deployment-specialist`
- Build complete system
- Deploy backend
- Test on device

---

**Status**: Specification ready for agent implementation

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

