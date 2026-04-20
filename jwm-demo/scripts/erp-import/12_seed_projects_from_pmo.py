#!/usr/bin/env python3
"""
12_seed_projects_from_pmo.py

Read the JWM PMO Summary Rollup (116 rows × 46 cols) and upsert each row
as an ERPNext `Project` record with the JWM custom fields populated.

Prerequisites:
  1. Run 11_bootstrap_project_custom_fields.py first.
  2. Company "JWM" must exist.

Idempotent: uses `_frappe.FrappeClient.upsert(... key_field='name')`. Records
modified by non-Administrator users are skipped (see _frappe.py).

Run:
    IMPORT_MODE=live python3 12_seed_projects_from_pmo.py
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path
from typing import Any

import openpyxl

from _frappe import FrappeClient, FrappeError, setup_logging

LOG = setup_logging("./logs", "12_seed_projects")

SRC_XLSX = (
    "/Users/mattwright/pandora/Obsidian/PROJECTS/JWM/assets/"
    "2026-04-20/PMO summary/PMO Summary Rollup (11).xlsx"
)
SHEET = "PMO Summary Rollup"
COMPANY = "JWM"

# xlsx column index (0-based) -> ERPNext field name (None = skip/derived)
#
# Keep the shape exactly as the file currently emits so we don't have to
# care about column reordering upstream.
COL_MAP: list[tuple[int, str | None, str]] = [
    # idx, field, kind
    (0,  None,                            "skip"),          # PROJECT DASHBOARD LINK
    (1,  "project_name",                  "str"),           # JOB NAME
    (2,  "custom_jwm_short_job_no",       "short_job"),     # SHORT JOB NO (used for name too)
    (3,  "custom_jwm_type",               "type_select"),
    (4,  "custom_jwm_job_health",         "health"),
    (5,  "custom_jwm_budget_health",      "health"),
    (6,  "custom_jwm_job_number",         "str"),
    (7,  None,                            "skip"),          # Job Number 2 (dedupe)
    (8,  "percent_complete",              "pct100"),        # 0..1 -> 0..100
    (9,  "expected_start_date",           "date"),
    (10, "expected_end_date",             "date"),
    (11, "custom_jwm_pm",                 "str"),
    (12, "custom_jwm_budget_pct_spent",   "float"),
    (13, "custom_jwm_contract_value",     "float"),
    (14, "custom_jwm_initial_budget",     "float"),
    (15, "custom_jwm_co_budget",          "float"),
    (16, "custom_jwm_current_cv",         "float"),
    (17, "custom_jwm_current_budget",     "float"),
    (18, "custom_jwm_actual_cost",        "float"),
    (19, "custom_jwm_committed_cost",     "float"),
    (20, "custom_jwm_projected_spend",    "float"),
    (21, "custom_jwm_budget_remaining",   "float"),
    (22, "custom_jwm_budget_to_allocate", "float"),
    (23, "custom_jwm_cash_received",      "float"),
    (24, "custom_jwm_recognised_revenue", "float"),
    (25, "custom_jwm_billed_to_date",     "float"),
    (26, "custom_jwm_last_billing_date",  "date"),
    (27, "custom_jwm_left_to_bill",       "float"),
    (28, "custom_jwm_backlog",            "float"),
    (29, None,                            "skip"),          # AMOUNT BILLED TO DATE dedupe
    (30, "custom_jwm_billing_positive",   "float"),
    (31, "custom_jwm_cash_vs_cost",       "float"),
    (32, "custom_jwm_profit",             "float"),
    (33, "custom_jwm_current_margin",     "pct100"),        # 0..1 stored as 0..100 Percent
    (34, "custom_jwm_initial_margin",     "pct100"),
    (35, "custom_jwm_markup_initial_pct", "pct100"),
    (36, "custom_jwm_markup_co_pct",      "pct100"),
    (37, "custom_jwm_co_sell",            "float"),
    (38, "custom_jwm_co_executed",        "float"),
    (39, "custom_jwm_co_submitted",       "float"),
    (40, "custom_jwm_co_rejected",        "float"),
    (41, "custom_jwm_co_voided",          "float"),
    (42, "custom_jwm_cv_minus_cost",      "float"),
    (43, "custom_jwm_spectrum_cv",        "float"),
    (44, "custom_jwm_spectrum_delta",     "float"),
    (45, "custom_jwm_archived",           "yesflag"),
]

TYPE_ALLOWED = {"Supply + Install", "Supply", "AMI", "Other"}
HEALTH_ALLOWED = {"Green", "Amber", "Red", "Grey"}


def _short_job_str(v: Any) -> str | None:
    """Coerce a SHORT JOB NO cell to a clean string (strip trailing .0)."""
    if v is None or v == "":
        return None
    if isinstance(v, float):
        return str(int(v)) if v.is_integer() else str(v)
    if isinstance(v, int):
        return str(v)
    s = str(v).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s or None


def _to_date(v: Any) -> str | None:
    if v is None or v == "":
        return None
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, dt.date):
        return v.isoformat()
    s = str(v).strip()
    # tolerate "YYYY-MM-DD" or "MM/DD/YYYY"
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d %H:%M:%S"):
        try:
            return dt.datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    LOG.warning("unparseable date: %r", v)
    return None


def _to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "").replace("$", "").strip())
    except ValueError:
        return None


def _coerce(kind: str, v: Any) -> Any:
    if v is None or (isinstance(v, str) and v.strip() == ""):
        return None
    if kind == "str":
        return str(v).strip()
    if kind == "short_job":
        return _short_job_str(v)
    if kind == "type_select":
        s = str(v).strip()
        return s if s in TYPE_ALLOWED else ("Other" if s else None)
    if kind == "health":
        s = str(v).strip().title()
        return s if s in HEALTH_ALLOWED else None
    if kind == "float":
        return _to_float(v)
    if kind == "pct100":
        f = _to_float(v)
        return None if f is None else round(f * 100.0, 4)
    if kind == "date":
        return _to_date(v)
    if kind == "yesflag":
        s = str(v).strip().lower()
        return 1 if s in {"yes", "y", "true", "1", "x"} else 0
    return v


def build_payload(row: tuple[Any, ...]) -> dict | None:
    """Turn an xlsx row into a Frappe Project payload. None if unskippable."""
    short_job = _short_job_str(row[2])
    if not short_job:
        return None

    name = f"JWM-{short_job}"
    payload: dict[str, Any] = {
        "doctype": "Project",
        "name": name,
        "company": COMPANY,
    }

    for idx, field, kind in COL_MAP:
        if field is None:
            continue
        if idx >= len(row):
            continue
        val = _coerce(kind, row[idx])
        if val is None:
            continue
        payload[field] = val

    # Ensure project_name is set (fallback to the job no if JOB NAME is blank)
    if not payload.get("project_name"):
        payload["project_name"] = name

    return payload


def main() -> None:
    fc = FrappeClient.from_env()
    LOG.info("connected as %s (dry_run=%s)", fc.ping(), fc.dry_run)

    src = Path(SRC_XLSX)
    if not src.exists():
        raise SystemExit(f"source xlsx not found: {src}")

    wb = openpyxl.load_workbook(src, data_only=True)
    ws = wb[SHEET]

    created = 0
    updated = 0
    noop = 0
    skipped = 0
    errors = 0

    # Row 1 is header; iterate rows 2..end
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not any(row):
            continue
        payload = build_payload(row)
        if payload is None:
            skipped += 1
            LOG.warning("row %d: no SHORT JOB NO, skipping (job_name=%r)",
                        row_num, row[1] if len(row) > 1 else None)
            continue

        before = fc.stats["create"], fc.stats["update"], fc.stats["noop"]
        try:
            fc.upsert("Project", payload, key_field="name")
        except FrappeError as e:
            errors += 1
            LOG.error("row %d (%s): %s", row_num, payload.get("name"), e)
            continue

        after = fc.stats["create"], fc.stats["update"], fc.stats["noop"]
        if after[0] > before[0] or fc.stats["dry_create"] > 0 and fc.dry_run and after == before:
            pass
        if after[0] > before[0]:
            created += 1
            LOG.info("row %d: created %s (%s)", row_num, payload["name"], payload.get("project_name"))
        elif after[1] > before[1]:
            updated += 1
            LOG.info("row %d: updated %s", row_num, payload["name"])
        elif after[2] > before[2]:
            noop += 1
            LOG.info("row %d: noop %s", row_num, payload["name"])
        else:
            # dry-run or other — count as created for reporting
            if fc.dry_run:
                created += 1

    LOG.info(
        "done. created=%d updated=%d noop=%d skipped=%d errors=%d stats=%s",
        created, updated, noop, skipped, errors, fc.stats,
    )


if __name__ == "__main__":
    main()
