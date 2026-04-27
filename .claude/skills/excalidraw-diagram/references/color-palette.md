# Color Palette & Brand Style — Hugh Manatee

**This is the single source of truth for all colors and brand-specific styles.** Edit this file to retune Hugh Manatee's diagram look — everything else in the skill is universal methodology.

Hugh Manatee's brand palette (warm, calm, elder-first — matches `app/src/theme.ts`):

- Primary warm teal `#4a9e8e` (calm, trustworthy)
- Warm coral `#e8845a` (gentle accent, end/CTA)
- Soft sage `#7ab87a` (success, positive states)
- Deep berry `#c0556e` (warning, AI/LLM nodes)
- Soft sky `#6ab4d4` (secondary, informational)
- Cream bg `#fdf6ee` (warm off-white — the app background)
- Slate text `#1a2430` (dark, readable)

---

## Shape Colors (Semantic)

Colors encode meaning, not decoration. Each semantic purpose has a fill/stroke pair.

| Semantic Purpose | Fill | Stroke |
|------------------|------|--------|
| Primary/Neutral | `#4a9e8e` (warm teal) | `#1a2430` (slate) |
| Secondary | `#6ab4d4` (sky) | `#1a2430` |
| Tertiary | `#d0ebe6` (light teal) | `#1a2430` |
| Start/Trigger | `#e8845a` (coral) | `#9e4020` |
| End/Success | `#7ab87a` (sage) | `#3a6a3a` |
| Warning/Reset | `#f5ddd0` (light coral) | `#9e4020` |
| Decision | `#fef5d6` (light cream-yellow) | `#7c5a00` |
| AI/LLM (Hugh's voice) | `#c0556e` (berry) | `#722040` |
| Inactive/Disabled | `#e8e2d8` (muted cream) | `#1a2430` (use dashed stroke) |
| Error | `#f5b8b8` (light berry-red) | `#722040` |

**Rule**: Always pair a darker stroke with a lighter fill for contrast. Stick to the 5 brand hues + slate; don't introduce new colours.

---

## Text Colors (Hierarchy)

| Level | Color | Use For |
|-------|-------|---------|
| Title | `#1a2430` (slate) | Section headings, major labels |
| Subtitle | `#4a9e8e` (warm teal) | Subheadings, secondary labels |
| Body/Detail | `#5a6770` (muted slate) | Descriptions, annotations, metadata |
| On light fills | `#1a2430` | Text inside teal/sky/sage/cream shapes |
| On dark fills | `#fdf6ee` (cream) | Text inside slate/berry shapes |

---

## Evidence Artifact Colors

| Artifact | Background | Text Color |
|----------|-----------|------------|
| Code snippet | `#1a2430` (slate) | Syntax-colored |
| JSON/data example | `#1a2430` | `#7ab87a` (sage green) |
| TypeScript identifier | inherit | `#6ab4d4` (sky) |
| String literal | inherit | `#e8845a` (coral) |
| Comment | inherit | `#5a6770` |

---

## Default Stroke & Line Colors

| Element | Color |
|---------|-------|
| Arrows | Use the stroke color of the source element's semantic purpose |
| Structural lines | `#1a2430` (slate) |
| Marker dots | `#4a9e8e` (warm teal) |
| Sub-arrows / dashed connectors | `#6ab4d4` (sky) |

---

## Background

| Property | Value |
|----------|-------|
| Canvas background | `#fdf6ee` (Hugh Manatee cream — matches the app) |

---

## Surface grading

- **User-journey diagrams** — warm, human, simple. Emphasise voice turns and memory moments. No cold technical grey.
- **Data/architecture diagrams** — restrained palette, mostly slate + one accent. No decoration.
- **Security/trust diagrams** — use berry for sensitive data, sage for safe states.

Hugh Manatee's voice is "warm, calm, trustworthy" — diagrams should feel the same.
