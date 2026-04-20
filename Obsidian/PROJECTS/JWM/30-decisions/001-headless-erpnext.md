---
title: ADR-001 — Headless ERPNext
status: Built
updated: 2026-04-20
owner: sovereign.ai
---

# ADR-001: ERPNext as headless backend, Next.js shell as the UI

## Context

JWM's team will use a manufacturing ERP every day. ERPNext's stock Frappe UI is powerful but its usability for shop-floor / PM / ops personas lags against Smartsheet + Excel — which is what JWM has been using as a hand-rolled MES. Archer's proposal leans on Smartsheet Control Center UX. We need to beat both.

## Decision

Run ERPNext as the **headless backend of record** (DocTypes, Work Orders, accounting, etc.). Build a **custom Next.js shell** (`jwm-demo`) as the everyday UI that every role actually opens. Chris confirmed 2026-04-19: the custom shell IS the long-term system, not a prototype.

## Consequences

- Every data model decision must be Frappe-native (DocType-based) so the shell stays thin.
- Frappe REST API + token auth is the only integration surface — no direct DB access from shell.
- We own the UX entirely — no ERPNext workspace refactors required.
- Phase 2+ features extend the shell, not the Frappe desk.

## Date

2026-04-19

## Status

Accepted
