# Pandomagic — Optimisation Tracking

> Living record of speed + token improvements per run. Updated after each
> dogfood. Compare before/after to prove the strategic fixes actually
> moved the needle.

---

## Per-node timings across runs

Times in **seconds** unless noted. Empty = node didn't run / no data.

| Node | RAWGLE-63 (medium, baseline) | RAWGLE-62 attempt 2 (mission.md fix) | RAWGLE-62 attempt 3 (Bug 24 fix) | **RAWGLE-62 attempt 4 (all opt)** |
|---|---|---|---|---|
| prime-context | 0.039 | 0.052 | 0.047 | **0.045** |
| mission-triage | 29.8 | 25.4 | 26.1 | **16.9** ← MCP cleanup |
| gate-mission | 0.011 | 0.007 | 0.006 | **0.006** |
| prd-extend | 67 | 34.3 | 33.6 | **22.9** ← inline context, MCP |
| gate-prd | 4m9s | 52m17s | 5m21s | **55.4s** ← human approval time |
| rag-check | 57.3 | 59.1 | 1m8s | TBD |
| plan | 3m33s | 1m26s | 1m51s | TBD |
| architect-review (Opus) | 1m32s | 1m44s | 1m41s | TBD |
| security-review | 47.5 | 41.4 | 2m41s | TBD |
| excalidraw-business | 4m51s | 4m51s | 19m1s | **TBD — applicability gate** |
| excalidraw-data | 7m2s | 7m7s | 20m3s | **TBD — applicability gate** |
| excalidraw-application | 7m56s | 12m33s | 19m1s | **TBD — applicability gate** |
| excalidraw-technology | 10m52s | 11m57s | 19m15s | **TBD — applicability gate** |
| excalidraw-security | 2m7s | 2m51s | 8s | TBD |
| excalidraw-integration | 13.7 | 1m10s | 49.3s | TBD |
| gate-plan | 55.3 (timed out 120s) | 82m10s | 4m | TBD |
| plane-tickets | 1m4s | 8.1 (rate-limit) | — | TBD |
| test-first | 23m33s | 8.1 (rate-limit) | — | TBD |
| **implement** | **43m6s** (25 cycles, only iphone-15) | 8.1 (rate-limit) | — | **20m37s, 3 cycles** ← -52% wall, -88% cycles |
| validate | Failed (cross-browser scope mismatch) | Skipped | — | TBD |
| final-review | Skipped | Skipped | — | TBD |
| gate-pr | Skipped | Skipped | — | TBD |
| open-pr | Skipped | Skipped | — | TBD |

---

## Strategic fixes applied between runs

| Run | Fixes applied | Bugs found |
|---|---|---|
| **RAWGLE-63 baseline** | none | Bug 1-21 (catalogued in dogfood-bugs.md) |
| **RAWGLE-62 attempt 2** | mission.md operational-supportability category added (Bug 22) | Bug 23 (sub rate limit) |
| **RAWGLE-62 attempt 3** | Bug 24 fixed (gate-mission long-field interpolation, all gate nodes use only short alphanumeric fields, open-pr is now AI node, rag-check uses slug not summary) | rate limit re-hit at plane-tickets |
| **RAWGLE-62 attempt 4 (current)** | All 8 strategic fixes:<br>1. `disabledMcpServers` (.claude/settings.json) drops 14 unused MCP connectors<br>2. Implement sub-agent context discipline (no Read mission/PRD/governance)<br>3. Implement path-based test scope (`git ls-files --others`, not `--grep`)<br>4. Implement parallel cross-browser (`--workers=4 --project=...`)<br>5. Implement cap 10 cycles (was 25)<br>6. Implement terse reasoning (≤30 words/cycle)<br>7. BDATSI applicability gates (model decides per-feature, returns `applicable: false` if trivial)<br>8. BDATSI inline context (plan path + section + slug delivered in prompt — no Read calls)<br>+ open-pr converted to AI node | TBD |

---

## Hypothesised vs actual savings

Per the optimisation analysis, expected improvement on attempt 4 vs attempt 3:

| Phase | Expected savings | How it works |
|---|---|---|
| MCP server connection retries | -5-15s per AI node × 18 = -2-5 min | 14 unused MCPs disabled |
| BDATSI on small feature | -50% on diagram phase | Most dimensions return `applicable: false`, no full diagram generation |
| Implement test cycles | -80% per cycle | Path-based test scope = 7 tests not 140 |
| Implement cross-browser | -65% wall time | Parallel projects, not serial |
| Implement cycle bound | bounds worst case | 10 not 25 |
| Implement context per cycle | -30% per call | No Read of mission/PRD/governance |

**Predicted run-3 → run-4 wall time delta**: 60-75% faster on phases where fixes apply (BDATSI + implement). Mission-triage already showing -35% (16.9s vs 26.1s — MCP cleanup).

---

## Token usage tracking (per run)

When the harness telemetry is wired into the Pandomagic Console, per-run token totals will be auto-captured. Until then:

| Run | Subscription bucket consumed | Notes |
|---|---|---|
| RAWGLE-63 medium | ~80% of 5h bucket | All 6 BDATSI fully generated; implement loop ran 43m on Sonnet |
| RAWGLE-62 attempt 3 | ~100% of 5h bucket | BDATSI alone exhausted bucket; rate-limited at plane-tickets |
| **RAWGLE-62 attempt 4 (target)** | <50% of 5h bucket | If applicability gates work, 3-4 BDATSI return early; implement runs only 7 tests/cycle |

---

## Per-feature ballpark (post-attempt-4)

If attempt 4 succeeds end-to-end, these are the new ballparks:

| Feature size | Wall time (estimate) | Subscription bucket usage |
|---|---|---|
| Tiny (50-line UI tweak) | 15-25 min | 20-30% |
| Small (100-300 line, RAWGLE-62 size) | 25-40 min | 30-50% |
| Medium (300-800 line, RAWGLE-63 size) | 60-90 min | 60-80% |
| Large (>800 line) | 2-3 hours | May exceed bucket; consider API |

---

## Bugs catalog (cross-reference)

See [dogfood-bugs.md](dogfood-bugs.md) for the full list. Most strategic fixes
applied in attempt 4 close out Bugs 13, 18-21, 23-24.

---

**Last updated: 2026-04-29 — HUGH-35 first end-to-end run on HM. Validate failed (wrong feature + Playwright API bug). 3 new bugs catalogued.**

---

## RAWGLE-52 attempt 6 — first run on the DeepSeek first-class provider

Build: `packages/providers/src/deepseek/` registered alongside `claude` and `codex`.
Routing: per-node `provider:` field in YAML (no env override hacks).

| Node | Provider/Model | Time | Notes |
|---|---|---|---|
| prime-context | bash | 52ms | |
| mission-triage | DeepSeek Flash | **9.5s** | First real DeepSeek HTTP call |
| gate-mission | bash | 7ms | |
| classify | DeepSeek Pro | **13.6s** | Pyramid level decision |
| gate-classify | bash | 6ms | |
| prd-extend | DeepSeek Pro | **50.8s** | Includes Read of PRD |
| gate-prd | bash | 10m13s | Human approval time |
| rag-check | bash | 12s | |
| plan | DeepSeek Pro | TBD | |
| architect-review | Claude Opus 4.7 | TBD | Master brain (only Claude AI node beyond implement) |
| security-review | DeepSeek Pro | TBD | |
| BDATSI ×6 | DeepSeek Pro | TBD | |
| test-first | DeepSeek Pro | TBD | |
| implement | Claude Sonnet 4.6 | TBD | Stays Claude — tool-use loop |
| validate | bash | TBD | Smoke + regression contracts |
| final-review | DeepSeek Pro | TBD | |
| open-pr | DeepSeek Flash | TBD | |

**DeepSeek API stats:** 4 request_start events, 0 errors. Provider is talking
directly to DeepSeek's Anthropic-compat endpoint via fetch (no Anthropic
SDK in the path for worker nodes). Halt-on-fail: missing key or DeepSeek
down → workflow halts; no fallback to Claude.

---

## Bugs resolved by the first-class DeepSeek provider

- **Bug 24** (gate-* bash interpolation breaks on long fields with quotes/parens) — addressed structurally by limiting bash interpolation to short alphanumeric fields only. Long fields go through AI-node Write (or are referenced by file path).
- **Bug 25** (Claude SDK rejects `deepseek-*` model names client-side via hardcoded allowlist) — bypassed structurally by NOT using the Claude SDK for worker nodes. The `deepseek` provider speaks HTTP directly.
- **buildSubprocessEnv hack** — reverted. Was a band-aid that depended on Claude SDK accepting our env-rewritten request; now obsolete.

---

## Bug 25 — workspace pollution across runs (found in attempt 4)

The implement loop discovers new test files via `git ls-files --others --exclude-standard tests/e2e`. This works for the FIRST run on a clean workspace but **picks up untracked files from prior failed/cancelled runs**.

In attempt 4, implement saw both:
- RAWGLE-62's new tests (footer)
- Leftover RAWGLE-63's tests (Apple Sign-in) from a prior run that failed at validate

Implement tried to make BOTH pass. Failed on a known Playwright/WebKit limitation in the leftover RAWGLE-63 test (`route.fulfill cannot use redirect status 302`).

**Strategic fix options:**
1. **`git diff --name-only origin/main...HEAD`** in implement — only files added on the current branch (cleaner)
2. test-first writes a manifest of its created files → implement reads only those
3. Workspace cleanup before each run: `git clean -fd && git reset --hard origin/main` (risky — destroys WIP if any)

Option 1 + test-first manifest is the right combo — Option 1 alone breaks if implement runs before any commit on the new branch. Defer until next attempt.

---

## HUGH-35 attempt 1 — first end-to-end run on Hugh Manatee

Ticket: A11Y-01 Dynamic Type support up to XXXL across all screens.
Build: 6 Rawgle rails backported. All 13 worker nodes on DeepSeek first-class provider.

| Node | Provider/Model | Time | Notes |
|---|---|---|---|
| prime-context | bash | skip (prior) | |
| mission-triage | DeepSeek Flash | skip (prior) | |
| gate-mission | bash | skip (prior) | |
| classify | DeepSeek Pro | skip (prior) | LEVEL output = `'L1'` (Bug 24 quotes still present) |
| gate-classify | bash | skip (prior) | |
| prd-extend | DeepSeek Pro | skip (prior) | prd_section field blank (JSON parse bug) |
| gate-prd | bash | 13.5h | Human approval time (overnight wait) |
| rag-check | bash | 58s | |
| plan | DeepSeek Pro | 88s | **WRONG FEATURE** — generated web PRD editor (not Dynamic Type) |
| architect-review | Claude Opus 4.7 | 86s | |
| security-review | DeepSeek Pro | 57s | |
| excalidraw-business | DeepSeek Pro | 33s | All 6 ran in parallel |
| excalidraw-data | DeepSeek Pro | 19s | |
| excalidraw-application | DeepSeek Pro | 21s | |
| excalidraw-technology | DeepSeek Pro | 30s | |
| excalidraw-integration | DeepSeek Pro | 9.4s | |
| excalidraw-security | DeepSeek Pro | 41s | |
| gate-plan | bash | 31min | Accidentally approved by stale :approve: from gate-prd (Bug HM-C) |
| plane-tickets | DeepSeek Flash | 8.5s | |
| test-first | Claude Sonnet 4.6 | 9.1min | Wrote 3 spec files, 57 tests — but for wrong feature (web PRD editor) |
| gate-test-first | bash | 18ms | ✅ correctly found the 3 spec files |
| implement | Claude Sonnet 4.6 | 19.4min | Scaffolded Next.js app in RN repo — wrong feature |
| validate | bash | **FAILED** | 6/57 tests: `_playwright.request` private API bug; 51 passed |
| final-review | — | SKIPPED | trigger_rule (validate failed) |
| gate-pr | — | SKIPPED | |
| open-pr | — | SKIPPED | |

**Machine time (gate-prd to validate):** rag-check + plan + reviews + BDATSI + gate-plan (wait) + tickets + test-first + implement + validate ≈ 59s + 88s + 86s + 57s + 41s + ~30min wait + 8.5s + 9.1min + 19.4min + ~66s ≈ **32 min machine time** (ignoring human gates)

---

## Bugs found in HUGH-35 attempt 1

### Bug HM-A: plan node generated wrong feature (web app instead of React Native)

`plan` (DeepSeek-V4-Pro) generated a collaborative web-based PRD section editor when the ticket was about Dynamic Type in a React Native app. `test-first` followed suit (wrote web API + ProseMirror tests). `implement` scaffolded a Next.js app.

**Root cause:** RAG project b096ff1c-b752-4818-91c5-617c9cd0932b likely contains Rawgle/web content. DeepSeek confused the codebase type. The plan prompt may also lack enough CLAUDE.md grounding.

**Fixes:**
1. Audit RAG project — ensure it contains only HM content (Expo/React Native)
2. Add explicit stack constraint to plan node prompt: "This is an Expo/React Native iOS app. There is no web backend. No Next.js, no API routes."

**Status: FIXED** — commit `7def6d0` on `tenshimatt/hugh-manatee-dist`

### Bug HM-B: test-first used `(apiContext as any)._playwright.request.newContext` private API

6/57 tests failed with `TypeError: Cannot read properties of undefined (reading 'request')`. The pattern `(apiContext as any)._playwright.request.newContext` accesses a private Playwright property that doesn't exist. The correct pattern is `request.newContext()` from the `{ request }` fixture or `browser.newContext()`.

**Fix:** Add to test-first prompt: "Use `request.newContext({...})` from the standard Playwright `request` fixture. Never access `_playwright` private properties."

**Status: FIXED** — commit `7def6d0` on `tenshimatt/hugh-manatee-dist`

### Bug HM-C: gate-plan polling accepted a pre-existing :approve: from gate-prd (Bug 26)

gate-plan polled for any `:approve:` comment on the ticket and found the comment posted for gate-prd approval (which was before the gate-plan comment was posted). Approved itself without human review.

**Fix:** `wait-for-approval.sh` now captures the gate comment's own ID directly from `plane-comment.sh` stdout and uses it as `LAST_SEEN`. Previously the script did a separate fetch that could fail silently → empty `LAST_SEEN` → all prior comments scanned → stale `:approve:` accepted.

**Status: FIXED** — commit `7def6d0` on `tenshimatt/hugh-manatee-dist`

---

### Bug HM-D: architect-review Claude Code subprocess `first_event_timeout` (60s)

`architect-review` was configured `provider: claude, model: claude-opus-4-7`. The Archon harness spawns a Claude Code subprocess and waits for any stdout within 60s. Across runs 2 and 3 the subprocess produced no output at all (all 3 retries × 60s each), skipping everything from gate-plan onwards.

**Root cause:** Claude Code subprocess cold-start in a non-TTY, non-interactive environment on CT 111 consistently exceeds the 60s `first_event_timeout`. The same node completed in 86s in run 1 (warm state), but fails reliably in subsequent runs. Removing the `[1m]` extended-thinking budget (commit `cc01eaa`) did not resolve it.

**Fix:** Switch architect-review to `provider: deepseek, model: deepseek-v4-pro`. DeepSeek nodes use a direct HTTP provider (no Claude Code subprocess), so the 60s timeout cannot trigger.

**Status: FIXED** — commit `1576d6c` on `tenshimatt/hugh-manatee-dist`. Applied before run 4 (2026-04-30).

---

### Bug HM-E: test-first creates Playwright specs but no `package.json` at repo root

validate runs `bun install` at the workspace root. test-first wrote `playwright.config.ts`, `tests/e2e/`, and `node_modules/` at root but never created `package.json`, so `bun install` exited immediately with "could not find a package.json file".

Run 4 result: implement was correct (29 `maxFontSizeMultiplier={1.15}` props across all screens), but validate failed at the bun install step before tests could run.

**Fix:** Added "PACKAGE.JSON REQUIRED" instruction to `test-first` prompt: check for `package.json` at repo root; if absent, Write one with `@playwright/test` as dev dependency before writing any spec files.

**Status: FIXED** — commit `dbade06` on `tenshimatt/hugh-manatee-dist`. Run 5 triggered (2026-04-30).
