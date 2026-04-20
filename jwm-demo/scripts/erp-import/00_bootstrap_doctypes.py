#!/usr/bin/env python3
"""
00_bootstrap_doctypes.py
Ensure custom JWM DocTypes exist:
  - JWM Daily Efficiency
  - JWM Production Schedule Line
Also adds a few Custom Fields to Work Order / Customer for JWM-specific data.

Non-destructive: checks existence, creates only if missing. Never modifies
the other existing JWM DocTypes (NCR, CAR, RMA, Overrun, Project Traveler,
Material Spec, Production Milestone, QC Checkpoint).
"""
from __future__ import annotations
import sys
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "00_bootstrap_doctypes")

MODULE = "JWM Manufacturing"

DOCTYPES = [
    {
        "doctype": "DocType",
        "name": "JWM Daily Efficiency",
        "module": MODULE,
        "custom": 1,
        "autoname": "field:efficiency_key",
        "naming_rule": "By fieldname",
        "track_changes": 1,
        "fields": [
            {"fieldname": "efficiency_key", "label": "Key", "fieldtype": "Data", "unique": 1, "reqd": 1, "in_list_view": 1, "description": "{date}-{workstation}-{shift}"},
            {"fieldname": "log_date", "label": "Date", "fieldtype": "Date", "reqd": 1, "in_list_view": 1},
            {"fieldname": "workstation", "label": "Workstation", "fieldtype": "Link", "options": "Workstation", "in_list_view": 1},
            {"fieldname": "shift", "label": "Shift", "fieldtype": "Select", "options": "1st\n2nd\n3rd", "default": "1st"},
            {"fieldname": "section_break_1", "fieldtype": "Section Break", "label": "Job"},
            {"fieldname": "job_number", "label": "Job #", "fieldtype": "Data", "in_list_view": 1},
            {"fieldname": "part_number", "label": "Part #", "fieldtype": "Data"},
            {"fieldname": "job_type", "label": "Job Type", "fieldtype": "Data"},
            {"fieldname": "column_break_1", "fieldtype": "Column Break"},
            {"fieldname": "start_time", "label": "Start Time", "fieldtype": "Time"},
            {"fieldname": "end_time", "label": "End Time", "fieldtype": "Time"},
            {"fieldname": "section_break_2", "fieldtype": "Section Break", "label": "Estimate vs Actual"},
            {"fieldname": "qty_required", "label": "Qty Required", "fieldtype": "Float"},
            {"fieldname": "qty_complete", "label": "Qty Complete", "fieldtype": "Float"},
            {"fieldname": "pct_complete", "label": "% Complete", "fieldtype": "Percent"},
            {"fieldname": "pph_estimate", "label": "PPH (Est)", "fieldtype": "Float"},
            {"fieldname": "column_break_2", "fieldtype": "Column Break"},
            {"fieldname": "pph_actual", "label": "PPH (Actual)", "fieldtype": "Float"},
            {"fieldname": "num_men", "label": "# of Men", "fieldtype": "Int"},
            {"fieldname": "section_break_3", "fieldtype": "Section Break", "label": "Raw"},
            {"fieldname": "jwm_raw_data", "label": "Raw Data (JSON)", "fieldtype": "Long Text"},
            {"fieldname": "source_file", "label": "Source File", "fieldtype": "Data"},
            {"fieldname": "source_sheet", "label": "Source Sheet", "fieldtype": "Data"},
        ],
        "permissions": [
            {"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1, "submit": 0, "report": 1, "export": 1, "print": 1, "email": 1, "share": 1},
            {"role": "Manufacturing Manager", "read": 1, "write": 1, "create": 1, "report": 1, "export": 1, "print": 1},
            {"role": "Manufacturing User", "read": 1, "write": 1, "create": 1},
        ],
    },
    {
        "doctype": "DocType",
        "name": "JWM Production Schedule Line",
        "module": MODULE,
        "custom": 1,
        "autoname": "field:schedule_key",
        "naming_rule": "By fieldname",
        "track_changes": 1,
        "fields": [
            {"fieldname": "schedule_key", "label": "Key", "fieldtype": "Data", "unique": 1, "reqd": 1, "in_list_view": 1},
            {"fieldname": "job_id", "label": "Job ID", "fieldtype": "Data", "in_list_view": 1, "reqd": 1, "description": "e.g. 24060-BM01 or 152509-2-1"},
            {"fieldname": "shop", "label": "Shop", "fieldtype": "Select", "options": "Architectural\nProcessing\nUnknown", "default": "Unknown", "in_list_view": 1},
            {"fieldname": "job_name", "label": "Job Name", "fieldtype": "Data", "in_list_view": 1},
            {"fieldname": "customer", "label": "Customer", "fieldtype": "Link", "options": "Customer"},
            {"fieldname": "column_break_1", "fieldtype": "Column Break"},
            {"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "On Track\nWarning\nOverdue\nNot Found\nUnknown", "default": "Unknown", "in_list_view": 1},
            {"fieldname": "jwm_raw_status", "label": "Raw Status", "fieldtype": "Data"},
            {"fieldname": "station", "label": "Current Station", "fieldtype": "Data"},
            {"fieldname": "ship_target", "label": "Ship Target", "fieldtype": "Date"},
            {"fieldname": "ship_actual", "label": "Ship Actual", "fieldtype": "Date"},
            {"fieldname": "section_break_1", "fieldtype": "Section Break", "label": "Quantities"},
            {"fieldname": "qty_required", "label": "Qty Required", "fieldtype": "Float"},
            {"fieldname": "qty_completed", "label": "Qty Completed", "fieldtype": "Float"},
            {"fieldname": "qty_remain", "label": "Qty Remaining", "fieldtype": "Float"},
            {"fieldname": "column_break_2", "fieldtype": "Column Break"},
            {"fieldname": "est_hours", "label": "Est Hours", "fieldtype": "Float"},
            {"fieldname": "source_row", "label": "Source Row", "fieldtype": "Int", "description": "Row index in source workbook"},
            {"fieldname": "section_break_2", "fieldtype": "Section Break", "label": "Source & Raw"},
            {"fieldname": "source_file", "label": "Source File", "fieldtype": "Data"},
            {"fieldname": "source_sheet", "label": "Source Sheet", "fieldtype": "Data"},
            {"fieldname": "work_order", "label": "Work Order", "fieldtype": "Link", "options": "Work Order"},
            {"fieldname": "jwm_raw_data", "label": "Raw Data (JSON)", "fieldtype": "Long Text"},
        ],
        "permissions": [
            {"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1, "report": 1, "export": 1, "print": 1, "email": 1, "share": 1},
            {"role": "Manufacturing Manager", "read": 1, "write": 1, "create": 1, "report": 1, "export": 1, "print": 1},
            {"role": "Manufacturing User", "read": 1, "write": 1, "create": 1},
        ],
    },
]

CUSTOM_FIELDS = [
    # Work Order extras
    {"doctype": "Custom Field", "dt": "Work Order", "fieldname": "jwm_job_id", "label": "JWM Job ID", "fieldtype": "Data", "insert_after": "status", "unique": 0, "module": MODULE},
    {"doctype": "Custom Field", "dt": "Work Order", "fieldname": "jwm_shop", "label": "JWM Shop", "fieldtype": "Select", "options": "Architectural\nProcessing\nUnknown", "insert_after": "jwm_job_id", "module": MODULE},
    {"doctype": "Custom Field", "dt": "Work Order", "fieldname": "jwm_status", "label": "JWM Status", "fieldtype": "Select", "options": "On Track\nWarning\nOverdue\nNot Found\nUnknown", "insert_after": "jwm_shop", "module": MODULE},
    {"doctype": "Custom Field", "dt": "Work Order", "fieldname": "jwm_raw_status", "label": "JWM Raw Status", "fieldtype": "Data", "insert_after": "jwm_status", "module": MODULE},
    {"doctype": "Custom Field", "dt": "Work Order", "fieldname": "jwm_raw_data", "label": "JWM Raw Data", "fieldtype": "Long Text", "insert_after": "jwm_raw_status", "module": MODULE},
    # Quotation extras
    {"doctype": "Custom Field", "dt": "Quotation", "fieldname": "jwm_quote_number", "label": "JWM Quote Number", "fieldtype": "Data", "insert_after": "status", "module": MODULE},
    {"doctype": "Custom Field", "dt": "Quotation", "fieldname": "jwm_raw_text", "label": "JWM Raw PDF Text", "fieldtype": "Long Text", "insert_after": "jwm_quote_number", "module": MODULE},
]


def main():
    fc = FrappeClient.from_env()
    LOG.info("Connected as: %s (dry=%s)", fc.ping(), fc.dry_run)

    for dt in DOCTYPES:
        existing = fc.get("DocType", dt["name"])
        if existing:
            LOG.info("DocType exists, skipping: %s", dt["name"])
        else:
            LOG.info("Creating DocType: %s", dt["name"])
            fc.create("DocType", dt)

    for cf in CUSTOM_FIELDS:
        fq = f'{cf["dt"]}-{cf["fieldname"]}'
        existing = fc.get("Custom Field", fq)
        if existing:
            LOG.info("Custom Field exists: %s", fq)
            continue
        LOG.info("Creating Custom Field: %s", fq)
        try:
            fc.create("Custom Field", cf)
        except Exception as e:
            LOG.error("Custom Field %s failed: %s", fq, e)

    LOG.info("Stats: %s", fc.stats)
    print("OK bootstrap")


if __name__ == "__main__":
    main()
