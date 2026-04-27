# Hugh Manatee — Pyramid Levels

> The architectural impact pyramid. Every incoming Plane ticket gets
> classified at L1-L5; each level has its own workflow lane and a set
> of contract tests that MUST stay green.

> **Last reviewed:** 2026-04-27 — initial. Iterate as we discover
> contracts in practice.

---

## L5 — Platform / Infrastructure

**Definition.** Changes that swap a runtime, framework, host, or
fundamental dependency. Months of work, not days. Cannot be safely
automated; halts Pandomagic and escalates to human ADR.

**Examples (would trigger L5):**
- Expo → bare React Native or native Swift
- expo-sqlite → cloud DB / Supabase
- ElevenLabs Conversational AI → different voice provider
- Cloudflare Worker → different backend host
- expo-router → React Navigation

**Contract tests at L5:** none specific to Hugh Manatee yet — L5 changes
write their own contracts as part of the migration ADR.

**Pandomagic behaviour at L5:** halt + label `pandomagic-escalation-required`
on the Plane ticket + post a comment requesting an ADR in
`Obsidian/PROJECTS/Hugh Manatee/30-decisions/`.

---

## L4 — Architecture Contract

**Definition.** Changes that touch a documented architectural pattern
the rest of the codebase relies on. Adding/modifying these promises
breaks downstream code. Full Pandomagic chain runs, contract tests at
this level mandatory.

**Contracts at L4 for Hugh Manatee:**

| Contract | Source | Test |
|---|---|---|
| Every screen wrapped in `<SafeAreaView>` | PRD §4.1 | `tests/contracts/safe-area-view.spec.ts` |
| Sticky footer uses `useSafeAreaInsets` + `paddingBottom: Math.max(insets.bottom, spacing.md)` | PRD §4.1 | `tests/contracts/sticky-footer-insets.spec.ts` |
| `maxFontSizeMultiplier={1.15}` on all Text/TextInput | PRD §4.1 | `tests/contracts/font-size-multiplier.spec.ts` |
| Mic mutes on navigate away (gated on status === "live") | PRD §4.1, §5 | `tests/contracts/mic-mute-on-navigate.spec.ts` |
| `nukeDb()` called before `clearProfile()` in delete-all | PRD §4.1 | `tests/contracts/nuke-before-clear.spec.ts` |
| `ConversationProvider` wraps conversation screen; hooks only called after status === "live" | PRD §4.1 | `tests/contracts/conversation-provider.spec.ts` |
| Minimum 44pt touch target on all interactive elements | PRD §7 | `tests/contracts/touch-targets.spec.ts` |

**Pandomagic behaviour at L4:** full 25-node chain, BDATSI all
applicable, architect-review on Opus, contract tests at L4 + above must
pass before gate-pr.

---

## L3 — Major Code

**Definition.** Cross-cutting feature work that doesn't change an
architecture contract but does add new surface area. New screen, new
SQLite schema migration, new Worker endpoint, new ElevenLabs agent config.

**Examples (would trigger L3):**
- New screen (e.g. memory detail with audio playback)
- New SQLite schema migration
- New Cloudflare Worker route
- New onboarding step
- Cross-cutting feature touching ≥3 components

**Pandomagic behaviour at L3:** standard chain, BDATSI mostly applicable,
architect-review on Opus, contract tests at L4 + above must pass.

**Test scope at L3:** new feature tests + L4 contracts + smoke.

---

## L2 — Minor Code

**Definition.** Single-component additions. New CTA, copy on existing
screen, form field, toggle, voice label text. Doesn't cross architectural
boundaries.

**Examples (would trigger L2):**
- New button on existing screen
- Copy change in onboarding
- Voice picker label update
- Settings option addition
- New version footer

**Pandomagic behaviour at L2:** light chain — drop architect-review,
BDATSI mostly `applicable=false`, security-review only if API keys/PII touched.

**Test scope at L2:** feature tests + smoke. Contract tests run via CI
on the PR (regression safety net).

---

## L1 — Tests / Cosmetic

**Definition.** Changes that don't touch source behaviour. Style tweak
using existing tokens, inline copy fix, lint fix, test coverage addition.

**Examples (would trigger L1):**
- Typo fix in copy
- Spacing adjustment using existing theme token
- Add test for existing untested function
- Lint/format fix

**Pandomagic behaviour at L1:** ultra-light — mission-triage → implement
→ smoke → open-pr. Skip plan, BDATSI, all reviews, regression tests.

**Test scope at L1:** smoke only.

---

## Cascade rule

A change at level N must keep all contract tests at levels N AND ABOVE
green. Higher levels are stricter.

| Change at | Tests that MUST pass |
|---|---|
| L1 | smoke |
| L2 | smoke + L4 contracts |
| L3 | smoke + L4 contracts + new feature tests |
| L4 | smoke + L4 contracts + new feature tests + the contract this change adds/modifies |
| L5 | escalate; ADR-driven test plan |

---

## Classifier output schema

The `classify` workflow node reads this file + the feature description
and outputs:

```json
{
  "level": "L2",
  "category": "minor-code",
  "contracts_touched": ["SafeAreaView", "touch-targets"],
  "regression_must_pass": [
    "tests/contracts/safe-area-view.spec.ts",
    "tests/contracts/touch-targets.spec.ts",
    "tests/smoke/"
  ],
  "workflow_lane": "L2-minor",
  "confidence": "high",
  "notes": "Settings toggle. Doesn't cross architectural boundaries."
}
```

Downstream nodes read `$classify.output.level` and `$classify.output.regression_must_pass`
to scope their behaviour and tests.
