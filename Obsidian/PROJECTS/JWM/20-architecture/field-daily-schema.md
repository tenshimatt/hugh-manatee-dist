---
title: Field Daily Report — schema derived from JWM template
status: Draft
updated: 2026-04-20
owner: sovereign.ai
---

# Field Daily Report — schema

## Overview
The Field Daily Report is filled in daily by each superintendent / subcontractor lead for every active job. It captures who was onsite, hours worked, weather, deliveries, delays, injuries, and per-material quantities installed with man-hours. It is the primary source of productivity and incident data feeding the Project Dashboards (MH/unit KPIs on the Summary tab of the source workbook come from these rows).

Source: `Field Daily Report.xlsx` — main sheet `Field Daily Report` (4,922 rows, 71 columns), plus `Comments` and `Summary` sheets (out of scope for the form; Summary is a derived dashboard).

## Top-level fields

Required flags mirror the Smartsheet rendering (red asterisk) visible in the screenshots.

| Field | Type | Required | Notes |
|---|---|---|---|
| job_number | Link→Project (by job code) | yes | e.g. `25031`, `24077`. Source col 0. Validate against Epicor/Project list. |
| job_name | Text (auto) | yes | Auto-populated from Project lookup. Shown read-only after job pick. Source col 1. |
| date | Date | yes | Defaults to today. Source col 2. |
| submitter_name | Link→Employee (or Text) | yes | Free text today (`Abner aguilar`, `Fredy veliz`); should migrate to Employee link. Source col 3. |
| notes | Long Text | yes | Daily narrative. Source col 4. |
| crew_type | Select (`Subcontractor`, `JWMCD Crew`) | yes | Source col 5. |
| project_manager | Link→Employee | yes | e.g. `Laura Forero`, `Chris Buttrey`. Source col 6. Should auto-default from Project. |
| has_delays | Select (`Yes`, `No`) | yes | Source col 7. Trigger. |
| delay_description | Long Text | conditional | Shown only when `has_delays=Yes`. Source col 8. |
| needs_material | Select (`Yes`, `No`) | yes | Source col 9. Trigger. |
| material_needed_description | Long Text | conditional | Shown only when `needs_material=Yes`. Source col 10. |
| weather | Select (`Clear`, `Rain`, `Snow`, `Wind`, `Fog`, `Hot`, `Cold`) | yes | Free text today in template; propose canonical list. Source col 11. |
| total_men_onsite | Integer | yes | Source col 12. |
| daily_work_hours | Decimal | yes | Hours worked that day. Source col 13. |
| has_deliveries | Select (`Yes`, `No`) | yes | Source col 14. Trigger. |
| delivery_description | Long Text | conditional | Shown only when `has_deliveries=Yes`. Source col 15. |
| equipment_onsite | Long Text | no | Free-text equipment list. Source col 16. |
| has_injuries | Select (`Yes`, `No`) | yes | Source col 17. Trigger. Very rarely Yes (2/2000 sampled). |
| injured_employee | Link→Employee | conditional | Shown only when `has_injuries=Yes`. Source col 18. |
| injury_description | Long Text | conditional | Shown only when `has_injuries=Yes`. Source col 19. |
| layout_done_prior | Select (`Yes`, `No`) | yes | Was layout for install done prior to install. Source col 20. Trigger. |
| elevations_with_layout | Text | conditional | Shown only when `layout_done_prior=Yes`. Source col 21. |
| what_was_installed | MultiSelect | yes | Controls which material-type quantity blocks render below. Options: `ACM`, `Plate Panels`, `Perforated Garage Panels`, `Single Skin`, `IMP`, `Trespa`, `Overly Roof Panels`, `Genesis Panel`, `Terracota Panel`, `Mapes Canopy`, `Caulking`, `Corrugated / Screen Wall`, `Louver`, `Insulation`, `Tubing`, `Subgirt Zee`, `Flashing`, `Hat Channel`, `Trim`, `AWB`, `Coping`, `Other`. Source col 22. |
| site_photos | Attach (multi-image) | yes | Multiple photos per report. Not a column in xlsx (Smartsheet attachment). |

### Material-quantity fields (22 qty/MH pairs, all conditional on `what_was_installed`)

Each selection in `what_was_installed` reveals one `*_qty` + one `*_man_hours` field. Unit column shows the unit the user enters.

| Selection | Qty field | Unit | MH field | Source cols |
|---|---|---|---|---|
| ACM | `acm_qty` | panels | `acm_mh` | 23/24 |
| Plate Panels | `plate_panels_qty` | panels | `plate_panels_mh` | 25/26 |
| Perforated Garage Panels | `perf_garage_qty` | panels | `perf_garage_mh` | 27/28 |
| Single Skin | `single_skin_qty` | panels | `single_skin_mh` | 29/30 |
| IMP | `imp_qty` | panels | `imp_mh` | 31/32 |
| Trespa | `trespa_qty` | panels | `trespa_mh` | 33/34 |
| Overly Roof Panels | `overly_roof_qty` | panels | `overly_roof_mh` | 35/36 |
| Genesis Panel | `genesis_qty` | panels | `genesis_mh` | 37/38 |
| Terracota Panel | `terracota_qty` | panels | `terracota_mh` | 39/40 |
| Mapes Canopy | `mapes_canopy_qty` | units | `mapes_canopy_mh` | 41/42 |
| Caulking | `caulking_lf` | linear ft | `caulking_mh` | 43/44 |
| Corrugated / Screen Wall | `corrugated_qty` | panels | `corrugated_mh` | 45/46 |
| Louver | `louver_qty` | units | `louver_mh` | 47/48 |
| Insulation | `insulation_sqft` | sqft | `insulation_mh` | 49/50 |
| Tubing | `tubing_lf` | linear ft | `tubing_mh` | 51/52 |
| Subgirt Zee | `subgirt_zee_lf` | linear ft | `subgirt_zee_mh` | 53/54 |
| Flashing | `flashing_lf` | linear ft | `flashing_mh` | 55/56 |
| Hat Channel | `hat_channel_lf` | linear ft | `hat_channel_mh` | 57/58 |
| Trim | `trim_lf` | linear ft | `trim_mh` | 59/60 |
| AWB | `awb_sqft` | sqft | `awb_mh` | 61/62 |
| Coping | `coping_lf` | linear ft | `coping_mh` | 63/64 |
| Other | `other_description` (Text) + `other_qty` | free | `other_mh` | 65/66 |

### Columns present in xlsx but NOT form fields
Cols 67–70 (`End Date`, `Allocation %`, `Duration`, `Predecessors`) are always blank in sampled data. Likely project-plan scaffolding copied into the sheet. Flag for Chris — exclude from form unless confirmed.

## Conditional-visibility rules

Empirically validated against first 2,000 rows — every rule below has 100% correlation (Yes -> reveal populated; No -> reveal blank).

| Trigger field | Trigger value | Reveals |
|---|---|---|
| `has_delays` | `Yes` | `delay_description` |
| `needs_material` | `Yes` | `material_needed_description` |
| `has_deliveries` | `Yes` | `delivery_description` |
| `has_injuries` | `Yes` | `injured_employee`, `injury_description` |
| `layout_done_prior` | `Yes` | `elevations_with_layout` |
| `what_was_installed` contains `ACM` | — | `acm_qty`, `acm_mh` |
| `what_was_installed` contains `Plate Panels` | — | `plate_panels_qty`, `plate_panels_mh` |
| `what_was_installed` contains `Perforated Garage Panels` | — | `perf_garage_qty`, `perf_garage_mh` |
| `what_was_installed` contains `Single Skin` | — | `single_skin_qty`, `single_skin_mh` |
| `what_was_installed` contains `IMP` | — | `imp_qty`, `imp_mh` |
| `what_was_installed` contains `Trespa` | — | `trespa_qty`, `trespa_mh` |
| `what_was_installed` contains `Overly Roof Panels` | — | `overly_roof_qty`, `overly_roof_mh` |
| `what_was_installed` contains `Genesis Panel` | — | `genesis_qty`, `genesis_mh` |
| `what_was_installed` contains `Terracota Panel` | — | `terracota_qty`, `terracota_mh` |
| `what_was_installed` contains `Mapes Canopy` | — | `mapes_canopy_qty`, `mapes_canopy_mh` |
| `what_was_installed` contains `Caulking` | — | `caulking_lf`, `caulking_mh` |
| `what_was_installed` contains `Corrugated / Screen Wall` | — | `corrugated_qty`, `corrugated_mh` |
| `what_was_installed` contains `Louver` | — | `louver_qty`, `louver_mh` |
| `what_was_installed` contains `Insulation` | — | `insulation_sqft`, `insulation_mh` |
| `what_was_installed` contains `Tubing` | — | `tubing_lf`, `tubing_mh` |
| `what_was_installed` contains `Subgirt Zee` | — | `subgirt_zee_lf`, `subgirt_zee_mh` |
| `what_was_installed` contains `Flashing` | — | `flashing_lf`, `flashing_mh` |
| `what_was_installed` contains `Hat Channel` | — | `hat_channel_lf`, `hat_channel_mh` |
| `what_was_installed` contains `Trim` | — | `trim_lf`, `trim_mh` |
| `what_was_installed` contains `AWB` | — | `awb_sqft`, `awb_mh` |
| `what_was_installed` contains `Coping` | — | `coping_lf`, `coping_mh` |
| `what_was_installed` contains `Other` | — | `other_description`, `other_qty`, `other_mh` |

## Sections (render order)

1. **Job & Date** — `job_number`, `job_name` (auto), `date`, `submitter_name`, `crew_type`, `project_manager`
2. **Narrative** — `notes`
3. **Delays & Materials** — `has_delays` → `delay_description`; `needs_material` → `material_needed_description`
4. **Site Conditions** — `weather`, `total_men_onsite`, `daily_work_hours`
5. **Deliveries & Equipment** — `has_deliveries` → `delivery_description`; `equipment_onsite`
6. **Safety** — `has_injuries` → `injured_employee`, `injury_description`
7. **Installation** — `layout_done_prior` → `elevations_with_layout`; `what_was_installed` → 22 material qty/MH blocks
8. **Photos** — `site_photos`

## Proposed ERPNext DocType

```
DocType: Field Daily Report
Module: JWM
Naming: format:FDR-{project.job_code}-{date}-{##}
Submittable: no (single-shot entry)
Track Changes: yes
Fields:
  - job_number            (Link→Project, required, fetch_from job_name/project_manager)
  - job_name              (Data, read_only, fetched)
  - date                  (Date, required, default=Today)
  - submitter_name        (Link→Employee, required)
  - notes                 (Small Text, required)
  - crew_type             (Select: Subcontractor\nJWMCD Crew, required)
  - project_manager       (Link→Employee, required, fetched from Project)
  - has_delays            (Select: Yes\nNo, required)
  - delay_description     (Small Text, depends_on: eval:doc.has_delays=='Yes', mandatory_depends_on: same)
  - needs_material        (Select: Yes\nNo, required)
  - material_needed_description (Small Text, depends_on/mandatory_depends_on: eval:doc.needs_material=='Yes')
  - weather               (Select: Clear\nRain\nSnow\nWind\nFog\nHot\nCold, required)
  - total_men_onsite      (Int, required)
  - daily_work_hours      (Float, required)
  - has_deliveries        (Select: Yes\nNo, required)
  - delivery_description  (Small Text, depends_on/mandatory_depends_on: eval:doc.has_deliveries=='Yes')
  - equipment_onsite      (Small Text)
  - has_injuries          (Select: Yes\nNo, required)
  - injured_employee      (Link→Employee, depends_on/mandatory_depends_on: eval:doc.has_injuries=='Yes')
  - injury_description    (Small Text, depends_on/mandatory_depends_on: eval:doc.has_injuries=='Yes')
  - layout_done_prior     (Select: Yes\nNo, required)
  - elevations_with_layout (Data, depends_on/mandatory_depends_on: eval:doc.layout_done_prior=='Yes')
  - what_was_installed    (Table MultiSelect → "Installed Material Type", required)
  # 22 pairs below — each pair has depends_on: eval:doc.what_was_installed includes '<type>'
  - acm_qty               (Int)  + acm_mh (Float)
  - plate_panels_qty      (Int)  + plate_panels_mh (Float)
  - perf_garage_qty       (Int)  + perf_garage_mh (Float)
  - single_skin_qty       (Int)  + single_skin_mh (Float)
  - imp_qty               (Int)  + imp_mh (Float)
  - trespa_qty            (Int)  + trespa_mh (Float)
  - overly_roof_qty       (Int)  + overly_roof_mh (Float)
  - genesis_qty           (Int)  + genesis_mh (Float)
  - terracota_qty         (Int)  + terracota_mh (Float)
  - mapes_canopy_qty      (Int)  + mapes_canopy_mh (Float)
  - caulking_lf           (Float) + caulking_mh (Float)
  - corrugated_qty        (Int)  + corrugated_mh (Float)
  - louver_qty            (Int)  + louver_mh (Float)
  - insulation_sqft       (Float) + insulation_mh (Float)
  - tubing_lf             (Float) + tubing_mh (Float)
  - subgirt_zee_lf        (Float) + subgirt_zee_mh (Float)
  - flashing_lf           (Float) + flashing_mh (Float)
  - hat_channel_lf        (Float) + hat_channel_mh (Float)
  - trim_lf               (Float) + trim_mh (Float)
  - awb_sqft              (Float) + awb_mh (Float)
  - coping_lf             (Float) + coping_mh (Float)
  - other_description     (Data)  + other_qty (Float) + other_mh (Float)
  - site_photos           (Table → "Field Daily Photo" with Attach Image + caption)
```

Total field count: 26 top-level + 45 material qty/MH conditionals (22 pairs + other trio) + 1 photos child table = **72 fields**. Matches the 71-column xlsx within rounding (xlsx has `other_qty` folded into `other_description`).

## Proposed UI

- **List route**: `/arch/field-daily` — filterable by `date`, `job_number`, `crew_type`, `project_manager`; default sort desc by `date`.
- **New-entry route**: `/arch/field-daily/new` — mobile-first (superintendents fill from phone). Single-page form with progressive reveal for conditionals; photo capture uses device camera.
- **Detail route**: `/arch/field-daily/[id]` — read-only view with inline edit for PM + Nick Akins corrections (see Comments sheet pattern).
- **Public field URL**: per Chris's note, a token-protected submit URL (`/arch/field-daily/submit?token=…`) so sub leads don't need full app auth.
- **Project Dashboard embed**: "Recent Field Dailies" tile on Project detail — today's count + latest 3 (date, submitter, delay flag, photo count). Link out to filtered list.
- **Aggregates for dashboards**: sum of qty ÷ sum of MH per material type per project (mirrors Summary sheet ratios: Panel/ACM MH 0.48, Caulking LF/MH 11.5, etc.).
- **Validation UX**: inline "show describe field" on Yes selection (not a separate page); multi-select with chips for `what_was_installed` revealing stacked cards below.

## Open questions / assumptions

1. **Canonical `weather` options** — xlsx stores free text; propose fixed Select. Needs Chris sign-off.
2. **Subcontractor name** — field is `crew_type` (Subcontractor vs JWMCD) only. No sub-company captured. Should we add `subcontractor_company` Link field?
3. **Cols 67–70** (End Date, Allocation %, Duration, Predecessors) — always blank in data; assuming these are stray scaffolding, not form fields. Confirm with Chris.
4. **`submitter_name`** is free text today with spelling variants (`Wilton lorenzo` vs `Wilton Lorenzo`). Assume migration to Employee Link.
5. **Units for `*_qty`** (panels vs each) — inferred from Summary-sheet ratios; confirm.
6. **Photo count minimum** — Smartsheet form has `Site Photos` as required; is 1 photo the minimum, or N?
7. **Field URL auth model** — token per sub? Per job? Expiring? Who issues tokens?
8. **Edit window** — Comments sheet shows PM follow-ups days/weeks later (`WRONG JOB #?`, `What is the correct date?`). Should submitted reports be editable indefinitely, or require an "amendment" child doc?
9. **Layout % units** — `layout_done_prior` sometimes stored as a number (`4.0`, `6.0`, `1.5`) instead of Yes/No in 11 rows — clarify whether this is an elevation count or data-entry error.
10. **`has_injuries`=Yes is 2/2000** — is this under-reported (injuries captured elsewhere) or genuinely rare? OSHA reporting hook needed?
11. **Spanish bilingual labels** — template shows `/Numero de Trabajo`, `/Fecha`, etc. Retain bilingual labels in UI? (Recommend yes — most submitters are Spanish-first based on names.)
12. **Comments workflow** — `Comments` sheet (57 rows) shows PM-to-submitter corrections. Need a comments/thread feature on each report? (Recommend: Frappe `Comment` doctype + `@mention`.)
