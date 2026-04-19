# Shop-Overhaul Phase 1 — Completion Report

**Branch:** `feat/jwm-demo` (local only — not pushed)
**Date:** 2026-04-17
**Scope:** Items 1-6 of the approved Phase-1 slice. Phase-2 items are stubbed, not faked.

---

## Commits landed

All six on `feat/jwm-demo`, newest first:

| Hash | One-liner |
|------|-----------|
| `f047a54` | docs: add shop-overhaul screenshot runner + update demo runbook |
| `afedfa9` | feat(anomaly): surface active anomaly on /shop + workstation kiosk |
| `8ef54e8` | feat(erf): add Engineering Release Form queue, detail, new-ERF pages |
| `61ce481` | feat(shop): kiosk polling + inline handoff modal on Complete |
| `4b06ffd` | feat(shop): add /shop overview page and /shop/lead Phase-2 stub |
| `3e75677` | feat(chrome): reorder sidebar for shop-first demo + anomaly bell in TopBar |

`bun run build` passed cleanly after every commit (verified).

---

## Routes added or changed

| Route | Status | Notes |
|-------|--------|-------|
| `/shop` | **Working** | New overview. Live ERPNext pull per workstation; falls through to canned on error. Anomaly banner + highlighted card. Upstream/In-flight/Downstream context row. |
| `/shop/[workstation]` | **Working** (enhanced) | Added 5s SWR-style polling on the queue, inline HandoffModal on Complete, anomaly banner when slug matches. |
| `/shop/lead` | **Stub** | Phase-2 Gantt. Clean single-screen stub, describes scope, links back. No fake Gantt. |
| `/erf` | **Working** | Pending queue, 3 summary tiles, Released section. Pending sorted urgent-first then by target date. |
| `/erf/new` | **Working** | Full form. "Help me fill this" button wired to canned `/api/erf/ai-fill` pattern-matcher. |
| `/erf/[id]` | **Working** | Detail + Release-to-Shop button (wires to `/api/erf/[id]/release` which stubs a WO id). |
| `/dashboard` | **Unchanged** | Still available in sidebar, still works. KPIs + anomaly modal untouched. |
| `/estimator`, `/planner/[wo]`, `/qc`, `/admin` | **Unchanged** | Not touched. |
| **Landing post-login** | **Changed** | Callback URL now `/shop` (was `/dashboard`). Both sign-in paths updated (Authentik + stub). |

### API routes added

| Route | Purpose |
|-------|---------|
| `GET /api/erf` | List ERFs (in-memory store) |
| `POST /api/erf` | Create ERF |
| `GET /api/erf/[id]` | Fetch ERF |
| `PATCH /api/erf/[id]` | Update ERF (status, etc.) |
| `POST /api/erf/[id]/release` | Flip to Released + stub a WO id |
| `POST /api/erf/ai-fill` | Canned pattern-match for the "Help me fill this" button |

---

## Files touched

### New files
- `jwm-demo/shell/app/(app)/shop/page.tsx`
- `jwm-demo/shell/app/(app)/shop/lead/page.tsx`
- `jwm-demo/shell/app/(app)/erf/page.tsx`
- `jwm-demo/shell/app/(app)/erf/new/page.tsx`
- `jwm-demo/shell/app/(app)/erf/[id]/page.tsx`
- `jwm-demo/shell/app/(app)/erf/[id]/ReleaseActions.tsx`
- `jwm-demo/shell/app/api/erf/route.ts`
- `jwm-demo/shell/app/api/erf/[id]/route.ts`
- `jwm-demo/shell/app/api/erf/[id]/release/route.ts`
- `jwm-demo/shell/app/api/erf/ai-fill/route.ts`
- `jwm-demo/shell/lib/canned/erf.ts`
- `jwm-demo/shell/scripts/shot-shop-overhaul.ts`

### Edited files
- `jwm-demo/shell/components/chrome/Sidebar.tsx` (reorder + ERF + Lead sub-link)
- `jwm-demo/shell/components/chrome/TopBar.tsx` (anomaly bell + pop-over)
- `jwm-demo/shell/app/(app)/shop/[workstation]/page.tsx` (pass anomaly down)
- `jwm-demo/shell/app/(app)/shop/[workstation]/ShopFloorClient.tsx` (polling, handoff, anomaly banner)
- `jwm-demo/shell/app/page.tsx` (login callback → `/shop`)
- `jwm-demo/shell/middleware.ts` (protect `/erf`)
- `jwm-demo/shell/app/globals.css` (added `.jwm-input` utility)
- `jwm-demo/docs/demo-runbook.md` (header note, Minute 1-3, Minute 5.5-6.5, Minute 7-9)

---

## Known TODOs (Phase 2 / 3)

| Tag | Item | Where |
|-----|------|-------|
| Phase 2 | Wire "Help me fill this" to LiteLLM `/api/ai/query` with an ERF-specific system prompt. | `shell/app/api/erf/ai-fill/route.ts` (TODO comment at top) |
| Phase 2 | Replace in-memory ERF store with an ERPNext custom DocType. | `shell/lib/canned/erf.ts` (doc comment at top) |
| Phase 2 | Wire HandoffModal confirmation to a real ERPNext Job Card transition + Shop Floor Log entry. | `shell/app/(app)/shop/[workstation]/ShopFloorClient.tsx` (HandoffModal doc comment) |
| Phase 2 | Ship the `/shop/lead` Gantt (rows per workstation, blocks per Job Card, drag-to-reschedule, operator assignment, skills matrix, anomaly inlay). | `shell/app/(app)/shop/lead/page.tsx` |
| Phase 2 | Offline-capable kiosk via service worker + IndexedDB write queue. Currently using 5s SWR polling. | `ShopFloorClient.tsx` useEffect (doc comment) |
| Phase 2 | Real column on the anomaly payload identifying the workstation slug — today all three surfaces (TopBar, /shop, kiosk) re-derive it from a title substring match. | `TopBar.tsx` `anomalyToSlug`, `shop/page.tsx` `anomalySlug`, `shop/[workstation]/page.tsx` |
| Phase 2 | `/api/erf/[id]/release` should trigger a real ERPNext Work Order creation via `/api/wo/create` passing line items as BOM children. | `shell/app/api/erf/[id]/release/route.ts` |

---

## Tests run

- `bun run build` after every commit — **clean** on all 6.
- Playwright screenshot runner end-to-end — **all 7 PNGs written**:
  - `01-shop-overview.png` — confirms sidebar reorder, anomaly banner, live ERPNext chip, flagged Flat Laser #2.
  - `02-shop-kiosk-flat-laser-2.png` — confirms in-kiosk anomaly banner with hypothesis.
  - `03-shop-lead-stub.png` — confirms Phase-2 stub renders cleanly.
  - `04-erf-queue.png` — confirms ERF queue with summary tiles + blocker surfacing.
  - `05-erf-new.png` — confirms new-ERF form layout.
  - `06-erf-detail-ready.png` — confirms detail + Release-to-Shop action strip.
  - `07-dashboard-unchanged.png` — confirms Dashboard still rendering.
- Manual smoke check via the screenshots: anomaly fires, ERF queue populates, kiosk banner appears.

### Not tested (flagged for Matt to verify)

- ERF release end-to-end click — UI flow works, but I did not click through in the browser manually (confirmed by reading the code + PATCH/POST routes).
- "Help me fill this" — the canned endpoint was not exercised by the screenshot run. Worth clicking through at `/erf/new` to confirm population.
- Anomaly bell pop-over in TopBar — renders on every screenshot (bell is visible) but pop-over click was not screenshotted.
- HandoffModal flow on a real job card (eg. Press Brake #1 which has real canned cards).

---

## Specific things for Matt to verify on return

1. `bun run dev` from `jwm-demo/shell`, open `http://localhost:3100/`.
2. Sign in (either path) → **lands on `/shop`**, not `/dashboard`. Confirm.
3. Verify **TopBar bell** pulses (amber) and clicking it opens the pop-over with "Open workstation" → `/shop/flat-laser-2`.
4. Go to **`/erf`**. Click **ERF-2026-0047** (Opryland, Ready to Release). Scroll to the action strip, click **Release to shop**. Confirm status flips, WO id appears.
5. Go to **`/erf/new`**. Type customer "Nissan HQ", project "exterior railing". Click **Help me fill this** → confirm form auto-populates with baluster/top rail/base plate line items + "URGENT" priority.
6. Go to **`/shop/press-brake-1`** (has real canned cards). Tap a card → tap **Start** → tap **Complete** → handoff modal opens → tap **Weld Bay A** → success toast appears, card disappears.
7. Confirm **`/shop/lead`** renders cleanly as a Phase-2 stub (no 404, no broken Gantt).
8. Confirm **Dashboard / Estimator / Planner / QC / Admin / Ask John chat** are all still working.
9. Review screenshots in `shell/screenshots/shop-overhaul/` — they're gitignored, so not in any commit.

### Things I deliberately did not do

- Not pushed to remote (`git push`). Per your instruction.
- Not deployed to CT 120. Per your instruction.
- No service worker / SQL.js / IndexedDB / PPR. SWR polling in its place with doc comments.
- No real LLM wiring on the "Help me fill this" button. Canned, with TODO.
- No fake Gantt on `/shop/lead`. Clean stub only.

---

## Demo narrative status

When you run `bun run dev` and sign in, you should be able to walk through exactly what was asked:

1. Land on `/shop` — see live queues + anomaly banner.
2. Click workstation cards → drill into kiosk.
3. Flip to `/erf` → see pending queue, submit new ERF, release one.
4. See anomaly bell in TopBar + `/shop/flat-laser-2` pattern (banner + gold card + kiosk banner).

The updated demo-runbook.md reflects the new flow in Minutes 1-3, 5.5-6.5, and 7-9.
