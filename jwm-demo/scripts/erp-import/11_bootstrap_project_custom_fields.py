#!/usr/bin/env python3
"""
11_bootstrap_project_custom_fields.py

Create the ~35 JWM-specific Custom Fields on the stock Frappe `Project`
DocType so we can land the full PMO Summary Rollup (11).xlsx into ERPNext
without losing columns that have no stock home.

This script is:
- Idempotent (skips Custom Fields that already exist by fieldname on Project).
- Non-destructive (never edits existing fields in place).
- Safe to run against live or in dry mode (controlled via IMPORT_MODE env).

Run:
    IMPORT_MODE=live python3 11_bootstrap_project_custom_fields.py

Source spec: task brief JWM1451-121 (PMO rollup seed).
"""
from __future__ import annotations
from _frappe import FrappeClient, setup_logging, FrappeError

LOG = setup_logging("./logs", "11_bootstrap_project_custom_fields")

DOCTYPE = "Project"

# Each entry: (fieldname, label, fieldtype, [options], insert_after)
# We chain insert_after so fields land in a predictable order.
CUSTOM_FIELDS = [
    # --- Identity ---
    ("custom_jwm_short_job_no",   "JWM Short Job No",          "Data",     None, "project_name"),
    ("custom_jwm_job_number",     "JWM Job Number",            "Data",     None, "custom_jwm_short_job_no"),
    ("custom_jwm_type",           "JWM Type",                  "Select",
        "\nSupply + Install\nSupply\nAMI\nOther",                      "custom_jwm_job_number"),
    ("custom_jwm_pm",             "JWM PM",                    "Data",     None, "custom_jwm_type"),
    ("custom_jwm_archived",       "JWM Archived",              "Check",    None, "custom_jwm_pm"),

    # --- Health ---
    ("custom_jwm_job_health",     "JWM Job Health",            "Select",
        "\nGreen\nAmber\nRed\nGrey",                                   "custom_jwm_archived"),
    ("custom_jwm_budget_health",  "JWM Budget Health",         "Select",
        "\nGreen\nAmber\nRed\nGrey",                                   "custom_jwm_job_health"),
    ("custom_jwm_budget_pct_spent","JWM Budget % Spent",       "Float",    None, "custom_jwm_budget_health"),

    # --- Contract & Budget ---
    ("custom_jwm_contract_value", "JWM Contract Value",        "Currency", None, "custom_jwm_budget_pct_spent"),
    ("custom_jwm_initial_budget", "JWM Initial Budget",        "Currency", None, "custom_jwm_contract_value"),
    ("custom_jwm_co_budget",      "JWM Change Order Budget",   "Currency", None, "custom_jwm_initial_budget"),
    ("custom_jwm_current_cv",     "JWM Current CV",            "Currency", None, "custom_jwm_co_budget"),
    ("custom_jwm_current_budget", "JWM Current Budget",        "Currency", None, "custom_jwm_current_cv"),
    ("custom_jwm_actual_cost",    "JWM Actual Cost",           "Currency", None, "custom_jwm_current_budget"),
    ("custom_jwm_committed_cost", "JWM Committed Cost",        "Currency", None, "custom_jwm_actual_cost"),
    ("custom_jwm_projected_spend","JWM Projected Spend",       "Currency", None, "custom_jwm_committed_cost"),
    ("custom_jwm_budget_remaining","JWM Budget Remaining",     "Currency", None, "custom_jwm_projected_spend"),
    ("custom_jwm_budget_to_allocate","JWM Budget To Allocate", "Currency", None, "custom_jwm_budget_remaining"),

    # --- Billings ---
    ("custom_jwm_cash_received",  "JWM Cash Received",         "Currency", None, "custom_jwm_budget_to_allocate"),
    ("custom_jwm_recognised_revenue","JWM Recognised Revenue", "Currency", None, "custom_jwm_cash_received"),
    ("custom_jwm_billed_to_date", "JWM Billed To Date",        "Currency", None, "custom_jwm_recognised_revenue"),
    ("custom_jwm_last_billing_date","JWM Last Billing Date",   "Date",     None, "custom_jwm_billed_to_date"),
    ("custom_jwm_left_to_bill",   "JWM Left To Bill",          "Currency", None, "custom_jwm_last_billing_date"),
    ("custom_jwm_backlog",        "JWM Backlog",               "Currency", None, "custom_jwm_left_to_bill"),
    ("custom_jwm_billing_positive","JWM Billing Positive",     "Float",    None, "custom_jwm_backlog"),
    ("custom_jwm_cash_vs_cost",   "JWM Cash vs Cost",          "Currency", None, "custom_jwm_billing_positive"),

    # --- Margin / COR ---
    ("custom_jwm_profit",         "JWM Profit",                "Currency", None, "custom_jwm_cash_vs_cost"),
    ("custom_jwm_current_margin", "JWM Current Margin",        "Percent",  None, "custom_jwm_profit"),
    ("custom_jwm_initial_margin", "JWM Initial Margin",        "Percent",  None, "custom_jwm_current_margin"),
    ("custom_jwm_markup_initial_pct","JWM Markup Initial %",   "Percent",  None, "custom_jwm_initial_margin"),
    ("custom_jwm_markup_co_pct",  "JWM Markup CO %",           "Percent",  None, "custom_jwm_markup_initial_pct"),
    ("custom_jwm_co_sell",        "JWM Change Order Sell",     "Currency", None, "custom_jwm_markup_co_pct"),
    ("custom_jwm_co_executed",    "JWM COR Executed Value",    "Currency", None, "custom_jwm_co_sell"),
    ("custom_jwm_co_submitted",   "JWM COR Submitted Value",   "Currency", None, "custom_jwm_co_executed"),
    ("custom_jwm_co_rejected",    "JWM COR Rejected Value",    "Currency", None, "custom_jwm_co_submitted"),
    ("custom_jwm_co_voided",      "JWM COR Voided Value",      "Currency", None, "custom_jwm_co_rejected"),
    ("custom_jwm_cv_minus_cost",  "JWM CV - AC - CC - PS",     "Currency", None, "custom_jwm_co_voided"),

    # --- Spectrum reconciliation ---
    ("custom_jwm_spectrum_cv",    "JWM Spectrum CV",           "Currency", None, "custom_jwm_cv_minus_cost"),
    ("custom_jwm_spectrum_delta", "JWM Spectrum minus Smartsheet","Currency", None, "custom_jwm_spectrum_cv"),
]


def custom_field_exists(fc: FrappeClient, fieldname: str) -> bool:
    """Check if a Custom Field already exists on the Project DocType."""
    rows = fc.get_list(
        "Custom Field",
        filters=[["dt", "=", DOCTYPE], ["fieldname", "=", fieldname]],
        fields=("name",),
        limit=1,
    )
    return bool(rows)


def main() -> None:
    fc = FrappeClient.from_env()
    LOG.info("connected as %s (dry_run=%s)", fc.ping(), fc.dry_run)

    created = 0
    skipped = 0
    errors = 0

    for fieldname, label, fieldtype, options, insert_after in CUSTOM_FIELDS:
        if custom_field_exists(fc, fieldname):
            skipped += 1
            LOG.info("exists, skip: %s.%s", DOCTYPE, fieldname)
            continue

        payload = {
            "doctype": "Custom Field",
            "dt": DOCTYPE,
            "fieldname": fieldname,
            "label": label,
            "fieldtype": fieldtype,
            "insert_after": insert_after,
        }
        if options is not None:
            payload["options"] = options

        try:
            fc.create("Custom Field", payload)
            created += 1
            LOG.info("created: %s.%s (%s)", DOCTYPE, fieldname, fieldtype)
        except FrappeError as e:
            errors += 1
            LOG.error("failed: %s.%s :: %s", DOCTYPE, fieldname, e)

    LOG.info(
        "done. created=%d skipped=%d errors=%d total_defined=%d stats=%s",
        created, skipped, errors, len(CUSTOM_FIELDS), fc.stats,
    )


if __name__ == "__main__":
    main()
