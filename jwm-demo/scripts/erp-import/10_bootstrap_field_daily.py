#!/usr/bin/env python3
"""
10_bootstrap_field_daily.py

Create the `Field Daily Report` DocType in ERPNext (module: JWM).

Per the Field Daily Report schema spec
(Obsidian/PROJECTS/JWM/20-architecture/field-daily-schema.md):
  - 26 top-level fields
  - 22 material qty/MH pairs (Other is a trio) — all conditionally visible
    via `depends_on: eval:doc.what_was_installed.includes('<type>')`
  - 1 child table: Field Daily Photo (Attach Image + caption)

Conditional visibility mirrors the 28 empirical rules:
  - has_delays == Yes                         -> delay_description
  - needs_material == Yes                     -> material_needed_description
  - has_deliveries == Yes                     -> delivery_description
  - has_injuries == Yes                       -> injured_employee, injury_description
  - layout_done_prior == Yes                  -> elevations_with_layout
  - 22 install types -> each qty/mh pair (Other -> description + qty + mh)

Non-destructive: uses upsert-style creation — only inserts if the DocType
does not exist. Run via:

    cd jwm-demo/scripts/erp-import
    ./run_all.sh   # or: python3 10_bootstrap_field_daily.py

Note: this script is committed but NOT run against live ERPNext as part of
this change set (per task directive: "Commit but DO NOT deploy").
"""
from __future__ import annotations
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "10_bootstrap_field_daily")
MODULE = "JWM Manufacturing"

INSTALL_TYPES = [
    "ACM", "Plate Panels", "Perforated Garage Panels", "Single Skin", "IMP",
    "Trespa", "Overly Roof Panels", "Genesis Panel", "Terracota Panel",
    "Mapes Canopy", "Caulking", "Corrugated / Screen Wall", "Louver",
    "Insulation", "Tubing", "Subgirt Zee", "Flashing", "Hat Channel",
    "Trim", "AWB", "Coping", "Other",
]

# Map install type -> fieldnames (qty, mh) + fieldtype for qty
MATERIAL_FIELDS = [
    ("ACM", "acm_qty", "Int", "acm_mh"),
    ("Plate Panels", "plate_panels_qty", "Int", "plate_panels_mh"),
    ("Perforated Garage Panels", "perf_garage_qty", "Int", "perf_garage_mh"),
    ("Single Skin", "single_skin_qty", "Int", "single_skin_mh"),
    ("IMP", "imp_qty", "Int", "imp_mh"),
    ("Trespa", "trespa_qty", "Int", "trespa_mh"),
    ("Overly Roof Panels", "overly_roof_qty", "Int", "overly_roof_mh"),
    ("Genesis Panel", "genesis_qty", "Int", "genesis_mh"),
    ("Terracota Panel", "terracota_qty", "Int", "terracota_mh"),
    ("Mapes Canopy", "mapes_canopy_qty", "Int", "mapes_canopy_mh"),
    ("Caulking", "caulking_lf", "Float", "caulking_mh"),
    ("Corrugated / Screen Wall", "corrugated_qty", "Int", "corrugated_mh"),
    ("Louver", "louver_qty", "Int", "louver_mh"),
    ("Insulation", "insulation_sqft", "Float", "insulation_mh"),
    ("Tubing", "tubing_lf", "Float", "tubing_mh"),
    ("Subgirt Zee", "subgirt_zee_lf", "Float", "subgirt_zee_mh"),
    ("Flashing", "flashing_lf", "Float", "flashing_mh"),
    ("Hat Channel", "hat_channel_lf", "Float", "hat_channel_mh"),
    ("Trim", "trim_lf", "Float", "trim_mh"),
    ("AWB", "awb_sqft", "Float", "awb_mh"),
    ("Coping", "coping_lf", "Float", "coping_mh"),
]


def build_material_fields():
    """Emit (qty, mh) field pairs, each with depends_on on what_was_installed."""
    out = []
    for label, qty, qty_type, mh in MATERIAL_FIELDS:
        dep = f"eval:doc.what_was_installed && doc.what_was_installed.indexOf('{label}') !== -1"
        out.append({"fieldname": f"section_break_{qty}", "fieldtype": "Section Break",
                    "label": label, "depends_on": dep, "collapsible": 1})
        out.append({"fieldname": qty, "label": f"{label} Qty", "fieldtype": qty_type,
                    "depends_on": dep})
        out.append({"fieldname": mh, "label": f"{label} MH", "fieldtype": "Float",
                    "depends_on": dep})
    # Other (trio)
    dep_other = "eval:doc.what_was_installed && doc.what_was_installed.indexOf('Other') !== -1"
    out.append({"fieldname": "section_break_other", "fieldtype": "Section Break",
                "label": "Other", "depends_on": dep_other, "collapsible": 1})
    out.append({"fieldname": "other_description", "label": "Other — Description",
                "fieldtype": "Data", "depends_on": dep_other})
    out.append({"fieldname": "other_qty", "label": "Other — Qty",
                "fieldtype": "Float", "depends_on": dep_other})
    out.append({"fieldname": "other_mh", "label": "Other — MH",
                "fieldtype": "Float", "depends_on": dep_other})
    return out


PHOTO_CHILD = {
    "doctype": "DocType",
    "name": "Field Daily Photo",
    "module": MODULE,
    "custom": 1,
    "istable": 1,
    "fields": [
        {"fieldname": "photo", "label": "Photo", "fieldtype": "Attach Image"},
        {"fieldname": "caption", "label": "Caption", "fieldtype": "Data",
         "in_list_view": 1},
    ],
}

FIELD_DAILY_REPORT = {
    "doctype": "DocType",
    "name": "Field Daily Report",
    "module": MODULE,
    "custom": 1,
    "autoname": "hash",
    "track_changes": 1,
    "fields": [
        # --- Job & Date ---
        {"fieldname": "job_number", "label": "Job #", "fieldtype": "Link",
         "options": "Project", "reqd": 1, "in_list_view": 1},
        {"fieldname": "job_name", "label": "Job Name", "fieldtype": "Data",
         "read_only": 1, "fetch_from": "job_number.project_name",
         "in_list_view": 1},
        {"fieldname": "date", "label": "Date", "fieldtype": "Date",
         "reqd": 1, "default": "Today", "in_list_view": 1},
        {"fieldname": "submitted_by", "label": "Submitter", "fieldtype": "Link",
         "options": "Employee", "reqd": 1, "in_list_view": 1},
        {"fieldname": "submitter_name", "label": "Submitter Name",
         "fieldtype": "Data", "fetch_from": "submitted_by.employee_name"},
        {"fieldname": "crew_type", "label": "Crew Type", "fieldtype": "Select",
         "options": "Subcontractor\nJWMCD Crew", "reqd": 1},
        {"fieldname": "project_manager", "label": "Project Manager",
         "fieldtype": "Link", "options": "Employee", "reqd": 1},
        # --- Narrative ---
        {"fieldname": "section_break_notes", "fieldtype": "Section Break",
         "label": "Narrative"},
        {"fieldname": "notes", "label": "Notes", "fieldtype": "Long Text",
         "reqd": 1},
        # --- Delays & Materials (2 conditionals) ---
        {"fieldname": "section_break_delays", "fieldtype": "Section Break",
         "label": "Delays & Materials"},
        {"fieldname": "has_delays", "label": "Any delays?",
         "fieldtype": "Select", "options": "Yes\nNo", "reqd": 1},
        {"fieldname": "delay_description", "label": "Delay description",
         "fieldtype": "Long Text",
         "depends_on": "eval:doc.has_delays=='Yes'",
         "mandatory_depends_on": "eval:doc.has_delays=='Yes'"},
        {"fieldname": "needs_material", "label": "Need materials?",
         "fieldtype": "Select", "options": "Yes\nNo", "reqd": 1},
        {"fieldname": "material_needed_description",
         "label": "Material needed description", "fieldtype": "Long Text",
         "depends_on": "eval:doc.needs_material=='Yes'",
         "mandatory_depends_on": "eval:doc.needs_material=='Yes'"},
        # --- Site Conditions ---
        {"fieldname": "section_break_site", "fieldtype": "Section Break",
         "label": "Site Conditions"},
        {"fieldname": "weather", "label": "Weather", "fieldtype": "Select",
         "options": "Clear\nRain\nSnow\nWind\nFog\nHot\nCold", "reqd": 1},
        {"fieldname": "total_men_onsite", "label": "Total men onsite",
         "fieldtype": "Int", "reqd": 1},
        {"fieldname": "daily_work_hours", "label": "Daily work hours",
         "fieldtype": "Float", "reqd": 1},
        # --- Deliveries & Equipment (1 conditional) ---
        {"fieldname": "section_break_deliveries", "fieldtype": "Section Break",
         "label": "Deliveries & Equipment"},
        {"fieldname": "has_deliveries", "label": "Any deliveries?",
         "fieldtype": "Select", "options": "Yes\nNo", "reqd": 1},
        {"fieldname": "delivery_description", "label": "Delivery description",
         "fieldtype": "Long Text",
         "depends_on": "eval:doc.has_deliveries=='Yes'",
         "mandatory_depends_on": "eval:doc.has_deliveries=='Yes'"},
        {"fieldname": "equipment_onsite", "label": "Equipment onsite",
         "fieldtype": "Long Text"},
        # --- Safety (2 conditionals) ---
        {"fieldname": "section_break_safety", "fieldtype": "Section Break",
         "label": "Safety"},
        {"fieldname": "has_injuries", "label": "Any injuries?",
         "fieldtype": "Select", "options": "Yes\nNo", "reqd": 1},
        {"fieldname": "injured_employee", "label": "Injured employee",
         "fieldtype": "Link", "options": "Employee",
         "depends_on": "eval:doc.has_injuries=='Yes'",
         "mandatory_depends_on": "eval:doc.has_injuries=='Yes'"},
        {"fieldname": "injury_description", "label": "Injury description",
         "fieldtype": "Long Text",
         "depends_on": "eval:doc.has_injuries=='Yes'",
         "mandatory_depends_on": "eval:doc.has_injuries=='Yes'"},
        # --- Installation (1 + 22 conditionals) ---
        {"fieldname": "section_break_install", "fieldtype": "Section Break",
         "label": "Installation"},
        {"fieldname": "layout_done_prior", "label": "Layout done prior?",
         "fieldtype": "Select", "options": "Yes\nNo", "reqd": 1},
        {"fieldname": "elevations_with_layout", "label": "Elevations with layout",
         "fieldtype": "Data",
         "depends_on": "eval:doc.layout_done_prior=='Yes'",
         "mandatory_depends_on": "eval:doc.layout_done_prior=='Yes'"},
        {"fieldname": "what_was_installed", "label": "What was installed",
         "fieldtype": "Small Text",
         "description": "Comma-separated: " + ", ".join(INSTALL_TYPES),
         "reqd": 1},
        # 22 material pairs (+ Other trio)
        *build_material_fields(),
        # --- Photos ---
        {"fieldname": "section_break_photos", "fieldtype": "Section Break",
         "label": "Photos"},
        {"fieldname": "site_photos", "label": "Site Photos",
         "fieldtype": "Table", "options": "Field Daily Photo"},
    ],
    "permissions": [
        {"role": "System Manager", "read": 1, "write": 1, "create": 1,
         "delete": 1, "report": 1, "export": 1, "print": 1, "email": 1, "share": 1},
        {"role": "Projects Manager", "read": 1, "write": 1, "create": 1,
         "report": 1, "export": 1, "print": 1},
        {"role": "Employee", "read": 1, "write": 1, "create": 1},
    ],
}


def main():
    fc = FrappeClient.from_env()

    # Child table first (parent references it).
    if fc.get("DocType", PHOTO_CHILD["name"]) is None:
        LOG.info("creating DocType Field Daily Photo")
        fc.create("DocType", PHOTO_CHILD)
    else:
        LOG.info("Field Daily Photo already exists, skipping")

    if fc.get("DocType", FIELD_DAILY_REPORT["name"]) is None:
        LOG.info("creating DocType Field Daily Report")
        fc.create("DocType", FIELD_DAILY_REPORT)
    else:
        LOG.info("Field Daily Report already exists, skipping")

    LOG.info("done. stats=%s", fc.stats)


if __name__ == "__main__":
    main()
