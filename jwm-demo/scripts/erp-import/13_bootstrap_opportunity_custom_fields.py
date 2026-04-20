#!/usr/bin/env python3
"""
13_bootstrap_opportunity_custom_fields.py
Bootstrap Custom Fields on the stock ERPNext `Opportunity` DocType to hold
JWM Architectural Sales pipeline columns that don't fit built-in fields.

Idempotent: checks existence via `{dt}-{fieldname}` name, creates only if missing.

Run:
    IMPORT_MODE=live python3 13_bootstrap_opportunity_custom_fields.py
"""
from __future__ import annotations
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "13_bootstrap_opportunity_custom_fields")
MODULE = "JWM Manufacturing"
DT = "Opportunity"

# Order matters: insert_after chains so fields appear in a sensible order in UI.
# We anchor the first custom field after `opportunity_amount` (a built-in, always present).
CUSTOM_FIELDS = [
    # Identity / project
    {"fieldname": "custom_jwm_project_name", "label": "JWM Project Name", "fieldtype": "Data", "insert_after": "opportunity_amount"},
    {"fieldname": "custom_jwm_bid_date", "label": "Bid Date", "fieldtype": "Date", "insert_after": "custom_jwm_project_name"},
    {"fieldname": "custom_jwm_close_date", "label": "Won / Lost Date", "fieldtype": "Date", "insert_after": "custom_jwm_bid_date"},
    {"fieldname": "custom_jwm_contract_date", "label": "Date of Contract", "fieldtype": "Date", "insert_after": "custom_jwm_close_date"},
    {"fieldname": "custom_jwm_onsite_schedule", "label": "Onsite Schedule", "fieldtype": "Date", "insert_after": "custom_jwm_contract_date"},
    {"fieldname": "custom_jwm_year", "label": "Year", "fieldtype": "Int", "insert_after": "custom_jwm_onsite_schedule"},

    # People
    {"fieldname": "custom_jwm_estimator", "label": "Estimator / Sales", "fieldtype": "Data", "insert_after": "custom_jwm_year"},
    {"fieldname": "custom_jwm_ball_in_court", "label": "Ball in Court", "fieldtype": "Data", "insert_after": "custom_jwm_estimator"},
    {"fieldname": "custom_jwm_customer_code", "label": "Customer Code", "fieldtype": "Data", "insert_after": "custom_jwm_ball_in_court"},

    # Location
    {"fieldname": "custom_jwm_city", "label": "City", "fieldtype": "Data", "insert_after": "custom_jwm_customer_code"},
    {"fieldname": "custom_jwm_state", "label": "State", "fieldtype": "Data", "insert_after": "custom_jwm_city"},
    {"fieldname": "custom_jwm_nda", "label": "NDA", "fieldtype": "Check", "insert_after": "custom_jwm_state"},

    # Scope
    {"fieldname": "custom_jwm_job_type", "label": "Job Type", "fieldtype": "Data", "insert_after": "custom_jwm_nda"},
    {"fieldname": "custom_jwm_install_type", "label": "Install Type", "fieldtype": "Data", "insert_after": "custom_jwm_job_type"},
    {"fieldname": "custom_jwm_est_vendor", "label": "Est. Vendor", "fieldtype": "Data", "insert_after": "custom_jwm_install_type"},
    {"fieldname": "custom_jwm_total_nsf", "label": "Total NSF", "fieldtype": "Float", "insert_after": "custom_jwm_est_vendor"},
    {"fieldname": "custom_jwm_scope", "label": "Scope", "fieldtype": "Small Text", "insert_after": "custom_jwm_total_nsf"},

    # Money
    {"fieldname": "custom_jwm_metal_bid_value", "label": "Metal Bid Value", "fieldtype": "Currency", "insert_after": "custom_jwm_scope"},
    {"fieldname": "custom_jwm_glazing_bid_value", "label": "Glazing Bid Value", "fieldtype": "Currency", "insert_after": "custom_jwm_metal_bid_value"},
    {"fieldname": "custom_jwm_markup_pct", "label": "Markup %", "fieldtype": "Percent", "insert_after": "custom_jwm_glazing_bid_value"},
    {"fieldname": "custom_jwm_margin_pct", "label": "Margin %", "fieldtype": "Percent", "insert_after": "custom_jwm_markup_pct"},
    {"fieldname": "custom_jwm_actual_close_value", "label": "Actual Close Value", "fieldtype": "Currency", "insert_after": "custom_jwm_margin_pct"},
    {"fieldname": "custom_jwm_forecast_close_value", "label": "Forecast Close Value", "fieldtype": "Currency", "insert_after": "custom_jwm_actual_close_value"},

    # Competing bids
    {"fieldname": "custom_jwm_bid_1", "label": "Bid 1", "fieldtype": "Currency", "insert_after": "custom_jwm_forecast_close_value"},
    {"fieldname": "custom_jwm_bid_2", "label": "Bid 2", "fieldtype": "Currency", "insert_after": "custom_jwm_bid_1"},
    {"fieldname": "custom_jwm_bid_3", "label": "Bid 3", "fieldtype": "Currency", "insert_after": "custom_jwm_bid_2"},
    {"fieldname": "custom_jwm_bid_4", "label": "Bid 4", "fieldtype": "Currency", "insert_after": "custom_jwm_bid_3"},

    # Follow-up
    {"fieldname": "custom_jwm_followup_date", "label": "Follow up Date", "fieldtype": "Date", "insert_after": "custom_jwm_bid_4"},
    {"fieldname": "custom_jwm_followup_2", "label": "Second Follow up", "fieldtype": "Date", "insert_after": "custom_jwm_followup_date"},
    {"fieldname": "custom_jwm_followup_3", "label": "Third Follow up", "fieldtype": "Date", "insert_after": "custom_jwm_followup_2"},
    {"fieldname": "custom_jwm_latest_comment", "label": "Latest Comment", "fieldtype": "Small Text", "insert_after": "custom_jwm_followup_3"},

    # Source row for traceability / dedupe
    {"fieldname": "custom_jwm_source_row", "label": "Source Row (xlsx)", "fieldtype": "Int", "insert_after": "custom_jwm_latest_comment"},
]


def main():
    fc = FrappeClient.from_env()
    LOG.info("Connected as: %s (dry=%s)", fc.ping(), fc.dry_run)

    created = 0
    exists = 0
    errs = 0
    for cf in CUSTOM_FIELDS:
        payload = {"doctype": "Custom Field", "dt": DT, "module": MODULE, **cf}
        fq = f"{DT}-{cf['fieldname']}"
        existing = fc.get("Custom Field", fq)
        if existing:
            LOG.info("Custom Field exists: %s", fq)
            exists += 1
            continue
        LOG.info("Creating Custom Field: %s (%s)", fq, cf["fieldtype"])
        try:
            fc.create("Custom Field", payload)
            created += 1
        except Exception as e:
            LOG.error("Custom Field %s failed: %s", fq, e)
            errs += 1

    LOG.info("DONE. created=%d exists=%d errors=%d stats=%s", created, exists, errs, fc.stats)
    print(f"OK bootstrap opportunity custom fields: created={created} exists={exists} errors={errs}")


if __name__ == "__main__":
    main()
