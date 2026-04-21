#!/usr/bin/env python3
"""
16_bootstrap_assembly_consumption.py — JWM1451-110

Creates the Server Script `JWM Assembly Part Consumption` on the
`Work Order.on_submit` event. When a Work Order is marked Completed,
walks the associated BOM and creates a Stock Entry (Material Issue)
that consumes the raw parts from Stores at the BOM-specified
per-unit quantity × the WO's produced quantity.

This wires up Chris's 2026-04-20 demo ask:

  "We have this assembly we make that has 20 different parts that go
   into it. Once they claim the top-level assembly, it'll take all
   this out of the inventory."

Idempotent — script only creates if absent, updates otherwise.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "16_bootstrap_assembly_consumption")

SCRIPT_NAME = "JWM Assembly Part Consumption"

SCRIPT_BODY = '''# JWM Assembly Part Consumption
# Triggered: Work Order after-save on a submitted document
# When status transitions to "Completed", consume the BOM parts from
# the WO's source warehouse (wip_warehouse) so inventory reflects the
# final assembly claim.

if doc.status != "Completed":
    frappe.msgprint("[JWM Assembly Consumption] Skipping — status is " + doc.status, alert=True)
elif doc.get("custom_jwm_consumed") == 1:
    frappe.msgprint("[JWM Assembly Consumption] Already consumed for this WO", alert=True)
elif not doc.bom_no:
    frappe.log_error(
        f"JWM Assembly Consumption: Work Order {doc.name} has status Completed but no BOM.",
        "JWM Assembly Consumption",
    )
else:
    bom = frappe.get_doc("BOM", doc.bom_no)
    produced = float(doc.produced_qty or doc.qty or 0)
    source_wh = doc.wip_warehouse or doc.source_warehouse
    if not source_wh:
        frappe.log_error(
            f"JWM Assembly Consumption: Work Order {doc.name} has no source/WIP warehouse.",
            "JWM Assembly Consumption",
        )
    elif produced <= 0:
        frappe.msgprint(
            "[JWM Assembly Consumption] produced_qty is 0 — nothing to consume.",
            alert=True,
        )
    else:
        se = frappe.new_doc("Stock Entry")
        se.stock_entry_type = "Material Issue"
        se.purpose = "Material Issue"
        se.from_warehouse = source_wh
        se.company = doc.company
        se.custom_jwm_source_wo = doc.name
        for line in bom.items or []:
            part_qty = float(line.qty or 0) * produced
            if part_qty <= 0:
                continue
            se.append("items", {
                "item_code": line.item_code,
                "qty": part_qty,
                "s_warehouse": line.source_warehouse or source_wh,
                "basic_rate": line.rate or 0,
                "uom": line.uom or line.stock_uom,
                "stock_uom": line.stock_uom,
            })
        if not se.items:
            frappe.msgprint(
                "[JWM Assembly Consumption] BOM had no consumable items — skipping.",
                alert=True,
            )
        else:
            se.insert(ignore_permissions=True)
            se.submit()
            frappe.db.set_value(
                "Work Order", doc.name, "custom_jwm_consumed", 1, update_modified=False,
            )
            frappe.msgprint(
                f"[JWM Assembly Consumption] Issued {len(se.items)} part(s) from {source_wh} via {se.name}.",
                alert=True,
            )
'''


def main():
    fc = FrappeClient.from_env()

    # Ensure the Custom Field exists so we can mark consumption done.
    flag_field_name = "Work Order-custom_jwm_consumed"
    existing = fc.get("Custom Field", flag_field_name)
    if existing is None:
        LOG.info("creating Custom Field Work Order.custom_jwm_consumed")
        fc.create("Custom Field", {
            "doctype": "Custom Field",
            "dt": "Work Order",
            "fieldname": "custom_jwm_consumed",
            "label": "JWM Parts Consumed",
            "fieldtype": "Check",
            "read_only": 1,
            "hidden": 0,
            "default": "0",
            "description": "Set to 1 after JWM Assembly Consumption server script has issued the BOM parts.",
            "insert_after": "produced_qty",
        })
    else:
        LOG.info("Work Order.custom_jwm_consumed already exists — skipping field create")

    # Custom Field on Stock Entry to remember the source WO (for audit).
    se_field_name = "Stock Entry-custom_jwm_source_wo"
    if fc.get("Custom Field", se_field_name) is None:
        LOG.info("creating Custom Field Stock Entry.custom_jwm_source_wo")
        fc.create("Custom Field", {
            "doctype": "Custom Field",
            "dt": "Stock Entry",
            "fieldname": "custom_jwm_source_wo",
            "label": "JWM Source Work Order",
            "fieldtype": "Link",
            "options": "Work Order",
            "read_only": 1,
            "insert_after": "stock_entry_type",
        })

    # Create or update the Server Script.
    existing_script = fc.get("Server Script", SCRIPT_NAME)
    payload = {
        "doctype": "Server Script",
        "name": SCRIPT_NAME,
        "script_type": "DocType Event",
        "reference_doctype": "Work Order",
        "doctype_event": "After Save (Submitted Document)",
        "disabled": 0,
        "script": SCRIPT_BODY,
        "module": "Custom",
    }

    if existing_script is None:
        LOG.info("creating Server Script %s", SCRIPT_NAME)
        fc.create("Server Script", payload)
    else:
        LOG.info("updating existing Server Script %s", SCRIPT_NAME)
        fc.update("Server Script", SCRIPT_NAME, payload)

    LOG.info("done. stats=%s", fc.stats)


if __name__ == "__main__":
    main()
