---
title: ADR-003 — A Shop / T Shop naming (not A-Sharp / T-Sharp)
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-003: Canonical division labels are "A Shop" and "T Shop"

## Context

JWM's two divisions:

| Code | Shop | Function |
|---|---|---|
| 1010 | A Shop | Architectural |
| 1040 | T Shop | Processing (started with a Tube laser) |

Whisper-1 and gpt-4o-transcribe both consistently mishear "T Shop" as "T-Sharp" and "A Shop" as "A-Sharp" — they're near-homophones. Matt's 2026-04-19 PLAUD transcript has the misheard form throughout the verbatim. If the wrong label leaks into DocType names, Item Groups, or UI copy, it's embarrassing and confusing to the JWM team.

## Decision

**Canonical labels: A Shop / T Shop.** Anywhere division names appear (sidebars, DocType names, Item Groups, tooltips, docs), use these exact forms. PLAUD transcripts are flagged but preserved verbatim; structured analysis sections are corrected.

## Consequences

- Search-replace `Sharp` → `Shop` when reading any transcript (except unrelated words).
- Safe automated step: grep new artefacts for `A-Sharp` / `T-Sharp` before commit.
- No refactor required — all live DocTypes + UI already use correct form.

## Date

2026-04-19

## Status

Accepted
