#!/usr/bin/env python3
"""
Snapshot current ERPNext state for reference before/after import.
Writes 00_schema_snapshot.md.
"""
from __future__ import annotations
import os, json, pathlib, datetime
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "00_schema_snapshot")
OUT = pathlib.Path(__file__).parent / "00_schema_snapshot.md"

DOCTYPES_TO_COUNT = [
    "Customer", "Item", "Item Group", "Workstation", "Operation",
    "Work Order", "Quotation", "BOM", "Warehouse", "Company",
    "JWM CAR", "JWM Overrun Allocation", "Material Spec", "NCR",
    "Production Milestone", "Project Traveler", "QC Checkpoint", "RMA",
    "JWM Daily Efficiency", "JWM Production Schedule Line",
]


def main():
    fc = FrappeClient.from_env()
    logged_in = fc.ping()

    lines = []
    lines.append("# JWM ERPNext Schema Snapshot")
    lines.append(f"Generated: {datetime.datetime.now().isoformat()}")
    lines.append(f"User: {logged_in}  Site: {os.getenv('FRAPPE_SITE')}")
    lines.append("")
    lines.append("## Record Counts")
    lines.append("| DocType | Count |")
    lines.append("|---|---:|")
    for dt in DOCTYPES_TO_COUNT:
        try:
            rows = fc.get_list(dt, fields=("name",), limit=1)
            # get count via head
            import requests
            r = fc._request(
                "GET",
                "/api/method/frappe.client.get_count",
                params={"doctype": dt},
            )
            c = r.json().get("message", "?") if r.ok else "err"
            lines.append(f"| {dt} | {c} |")
        except Exception as e:
            lines.append(f"| {dt} | ERR: {e} |")

    lines.append("")
    lines.append("## JWM Module DocTypes")
    rows = fc.get_list(
        "DocType",
        filters=[["module", "=", "JWM Manufacturing"]],
        fields=("name", "custom", "istable"),
        limit=50,
    )
    for r in rows:
        lines.append(f"- {r['name']}  (custom={r.get('custom')}, table={r.get('istable')})")

    OUT.write_text("\n".join(lines))
    LOG.info("Wrote %s", OUT)


if __name__ == "__main__":
    main()
