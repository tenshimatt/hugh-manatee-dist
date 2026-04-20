#!/usr/bin/env python3
"""
20_seed_engineers.py — JWM1451-86
Seed Engineering roster into ERPNext (Employee DocType).

Idempotent. Re-runs should be a no-op after first run.

Roster (from Obsidian/PROJECTS/JWM/assets/2026-04-20/Engineering/Engineering.md):
  - Paul Roberts — Engineering Executive (also manages QC). Reports: none.
  - Denis Usatenko — ACM Engineering Manager (reports to Paul) + 7 ICs
  - David Hasty — Plate & Tube Engineering Manager (reports to Paul) + 5 ICs

Creates (if missing):
  - Department "Engineering"
  - Custom Field "custom_engineering_discipline" on Employee
    (Select: "ACM" / "Plate & Tube" / "Both" / "Executive")
  - 14 Employee records, naming = employee_name
"""
from __future__ import annotations
import sys
from _frappe import FrappeClient, setup_logging, FrappeError

LOG = setup_logging("./logs", "20_seed_engineers")

COMPANY = "JWM"
DEPARTMENT = "Engineering - JWM"  # ERPNext auto-appends company abbr

# (employee_name, designation, reports_to_or_None, discipline)
ROSTER = [
    # Executive
    ("Paul Roberts", "Engineering Executive", None, "Executive"),

    # ACM branch — Denis Usatenko
    ("Denis Usatenko", "ACM Engineering Manager", "Paul Roberts", "ACM"),
    ("Vlatkovic, Nadira",        "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Stakhurskyi, Hennadii",    "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Niedfeld, Ailen",          "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Lucas, Samuel K.",         "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Hoyle, Gabriela E.",       "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Dill, William C.",         "ACM Engineer", "Denis Usatenko", "ACM"),
    ("Chambers-Douglas, Tara M.", "ACM Engineer", "Denis Usatenko", "ACM"),

    # Plate & Tube branch — David Hasty
    ("David Hasty", "Plate & Tube Engineering Manager", "Paul Roberts", "Plate & Tube"),
    ("Havens, Issiah A",        "Plate & Tube Engineer", "David Hasty", "Plate & Tube"),
    ("Jurado Carballo, Arnoldo", "Plate & Tube Engineer", "David Hasty", "Plate & Tube"),
    ("Dean, Frank W.",          "Plate & Tube Engineer", "David Hasty", "Plate & Tube"),
    ("Gambrel, Chris L.",       "Plate & Tube Engineer", "David Hasty", "Plate & Tube"),
    ("Dorsey, Jonathan",        "Plate & Tube Engineer", "David Hasty", "Plate & Tube"),
]

CUSTOM_FIELD = {
    "dt": "Employee",
    "fieldname": "custom_engineering_discipline",
    "label": "Engineering Discipline",
    "fieldtype": "Select",
    "options": "\nACM\nPlate & Tube\nBoth\nExecutive",
    "insert_after": "department",
    "module": "Custom",
}


def split_name(full: str) -> tuple[str, str]:
    """Return (first_name, last_name). Handle 'Last, First M.' and 'First Last' forms."""
    if "," in full:
        last, first = [p.strip() for p in full.split(",", 1)]
        return first, last
    parts = full.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def canonical_employee_name(full: str) -> str:
    """Match what ERPNext stores on save: '<first_name> <last_name>'."""
    first, last = split_name(full)
    return f"{first} {last}".strip()


def ensure_department(fc: FrappeClient) -> None:
    existing = fc.get("Department", DEPARTMENT)
    if existing:
        LOG.info("Department '%s' already exists — ok", DEPARTMENT)
        return
    payload = {
        "department_name": "Engineering",
        "parent_department": "All Departments",
        "company": COMPANY,
        "is_group": 0,
    }
    fc.create("Department", payload)
    LOG.info("Created Department '%s'", DEPARTMENT)


def ensure_designation(fc: FrappeClient, title: str) -> None:
    if fc.get("Designation", title):
        return
    try:
        fc.create("Designation", {"designation_name": title})
        LOG.info("Created Designation '%s'", title)
    except FrappeError as e:
        LOG.warning("Designation '%s' create failed (may already exist): %s", title, e)


def ensure_custom_field(fc: FrappeClient) -> bool:
    """Create Custom Field if missing. Returns True if it now exists."""
    # Custom Field name convention: "<DocType>-<fieldname>"
    cf_name = f"{CUSTOM_FIELD['dt']}-{CUSTOM_FIELD['fieldname']}"
    existing = fc.get("Custom Field", cf_name)
    if existing:
        LOG.info("Custom Field '%s' already exists — ok", cf_name)
        return True
    try:
        fc.create("Custom Field", CUSTOM_FIELD)
        LOG.info("Created Custom Field '%s'", cf_name)
        return True
    except FrappeError as e:
        LOG.error("Failed to create Custom Field: %s", e)
        return False


def find_employee_id(fc: FrappeClient, employee_name: str) -> str | None:
    """Return ERPNext Employee ID (HR-EMP-xxxxx) matching employee_name, or None."""
    rows = fc.get_list(
        "Employee",
        filters=[["employee_name", "=", employee_name]],
        fields=("name", "employee_name"),
        limit=1,
    )
    return rows[0]["name"] if rows else None


def upsert_employee(fc: FrappeClient, name: str, designation: str,
                    reports_to_id: str | None, discipline: str,
                    has_custom_field: bool) -> tuple[str, str | None]:
    """Returns (status, employee_id). status in {created,noop,skipped,failed}."""
    first, last = split_name(name)
    canonical = canonical_employee_name(name)
    payload = {
        "employee_name": canonical,
        "first_name": first or name,
        "last_name": last,
        "designation": designation,
        "department": DEPARTMENT,
        "company": COMPANY,
        "status": "Active",
        "gender": "Prefer not to say",
        "date_of_joining": "2020-01-01",
        "date_of_birth": "1985-01-01",
    }
    if reports_to_id:
        payload["reports_to"] = reports_to_id
    if has_custom_field:
        payload["custom_engineering_discipline"] = discipline

    # Idempotency: check by canonical name (what ERPNext stores on save).
    existing_id = find_employee_id(fc, canonical)
    if existing_id:
        LOG.info("Employee '%s' already exists as %s — skipping", canonical, existing_id)
        return ("noop", existing_id)

    try:
        result = fc.create("Employee", payload)
        new_id = result.get("name")
        LOG.info("Created Employee '%s' as %s", name, new_id)
        return ("created", new_id)
    except FrappeError as e:
        LOG.error("Failed to create Employee '%s': %s", name, e)
        return ("failed", None)


def main() -> int:
    fc = FrappeClient.from_env()
    LOG.info("Connecting as: %s (dry_run=%s)", fc.ping(), fc.dry_run)

    ensure_department(fc)
    has_cf = ensure_custom_field(fc)

    # Pre-create Designations (ERPNext LinkValidationError otherwise)
    for _, designation, _, _ in ROSTER:
        ensure_designation(fc, designation)

    stats = {"created": 0, "noop": 0, "skipped": 0, "failed": 0}
    # Map employee_name -> ERPNext Employee ID (HR-EMP-xxxxx) for reports_to resolution.
    # Order of ROSTER matters: managers first, then direct reports.
    name_to_id: dict[str, str] = {}
    for name, designation, reports_to_name, discipline in ROSTER:
        reports_to_id = name_to_id.get(reports_to_name) if reports_to_name else None
        if reports_to_name and not reports_to_id:
            # Try to resolve from ERPNext (manager may have been seeded in a prior run)
            reports_to_id = find_employee_id(fc, canonical_employee_name(reports_to_name))
            if reports_to_id:
                name_to_id[reports_to_name] = reports_to_id
            else:
                LOG.error("Can't resolve manager '%s' for '%s' — skipping", reports_to_name, name)
                stats["failed"] += 1
                continue
        status, emp_id = upsert_employee(fc, name, designation, reports_to_id, discipline, has_cf)
        stats[status] = stats.get(status, 0) + 1
        if emp_id:
            name_to_id[name] = emp_id

    LOG.info("=== Engineering roster seed complete ===")
    LOG.info("Created: %d | No-op: %d | Skipped: %d | Failed: %d",
             stats["created"], stats["noop"], stats["skipped"], stats["failed"])
    LOG.info("Frappe client stats: %s", fc.stats)

    return 0 if stats["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
