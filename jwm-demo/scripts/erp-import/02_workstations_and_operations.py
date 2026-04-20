#!/usr/bin/env python3
"""
02_workstations_and_operations.py
Seed Workstations + Operations from the column names on Production Schedule
(where station flags live), plus the A-shop sheet names and Daily Efficiency
sheet names.
"""
from __future__ import annotations
import os, pathlib, json
import openpyxl
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "02_workstations_and_operations")
ATT = pathlib.Path(os.environ["JWM_ATTACHMENTS_DIR"])

# Canonical stations, from Production Schedule columns + Daily Efficiency sheets
STATIONS = [
    "LO", "Sketch", "CNC", "Prog CNC", "Vendor Cut",
    "Flat Laser", "Tube Laser", "Prog Laser", "Punch", "Prog Punch",
    "Roll", "Shear", "Cidan", "Mill", "Prog Mill",
    "Extrusion Saw", "1st Manual", "Brake", "Prog Brake", "2nd Manual",
    "Weld", "Robot Weld", "Prog Robot Weld", "Metal Finish", "CNB",
    "Fab", "Assembly", "Tube Bender", "Band Saw", "5030",
    "Level", "Finish", "PEM", "ASM", "Form", "Titus Weld", "MacGyver Weld",
    "Grind", "MA", "RW",
]

OPERATIONS = [
    # Architectural shop
    ("LO", "Layout / Sketch preparation"),
    ("Sketch", "Engineering sketch"),
    ("CNC", "CNC routing (AXYZ)"),
    ("Flat Laser", "Flat laser cut"),
    ("Tube Laser", "Tube laser cut"),
    ("Punch", "Punch press"),
    ("Roll", "Rolling"),
    ("Shear", "Shearing"),
    ("Cidan", "Cidan folder"),
    ("Brake", "Press brake"),
    ("Weld", "Manual weld"),
    ("Robot Weld", "Robotic weld"),
    ("Metal Finish", "Metal finishing"),
    ("Fab", "Fabrication"),
    ("Assembly", "Assembly"),
    # T-shop / Processing
    ("Form", "Forming"),
    ("PEM", "PEM hardware install"),
    ("Grind", "Grinding"),
    ("MA", "Machining"),
    ("Level", "Leveling"),
    ("Finish", "Finishing"),
]


def main():
    fc = FrappeClient.from_env()

    # Workstation Type "JWM Default"
    try:
        fc.upsert(
            "Workstation Type",
            {"name": "JWM Default", "workstation_type": "JWM Default"},
            key_field="name",
        )
    except Exception as e:
        LOG.warning("Workstation Type seed skipped: %s", e)

    for s in STATIONS:
        try:
            fc.upsert(
                "Workstation",
                {
                    "workstation_name": s,
                    "production_capacity": 1,
                    "hour_rate": 50,
                },
                key_field="workstation_name",
            )
        except Exception as e:
            LOG.error("Workstation %s failed: %s", s, e)

    for name, desc in OPERATIONS:
        try:
            fc.upsert(
                "Operation",
                {"name": name, "description": desc},
                key_field="name",
            )
        except Exception as e:
            LOG.error("Operation %s failed: %s", name, e)

    LOG.info("Stats: %s", fc.stats)
    print(json.dumps(fc.stats))


if __name__ == "__main__":
    main()
