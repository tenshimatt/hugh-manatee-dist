"""JWM Chris Ball re-seed: real customer data (Vanderlande, Nissan, Ariens).

Creates 3 new Customers, their Items, BOMs, Sales Orders, Work Orders, and
real Operations (short-code names matching JWM's Tshop Estimator phase codes).

Idempotent. Safe to re-run. Never deletes. Checks-then-inserts pattern
matching fullseed.py / gap_fill.py.

Run: bench --site jwm-erp.beyondpandora.com execute jwm_manufacturing.chris_seed.run
"""
import frappe
from frappe.utils import nowdate, add_days

COMPANY = "JWM"
ABBR = "JWM"
WH_STORES = f"Stores - {ABBR}"
WH_WIP = f"Work In Progress - {ABBR}"
WH_FG = f"Finished Goods - {ABBR}"


def _log(msg):
    print(f"  {msg}")


# ---------------- 1. Operations (short-code phase codes) ----------------

OPERATIONS = [
    # (short_code, full_description)
    ("FL",   "Flat Laser"),
    ("FM",   "Forming / Press Brake"),
    ("QA",   "Quality Assurance"),
    ("TL",   "Tube Laser"),
    ("TB",   "Tube Bending"),
    ("WELD", "Welding"),
    ("MCH",  "Machining"),
    ("HWD",  "Hardware Install"),
    ("FIN",  "Finishing"),
]


def ensure_operations():
    created = 0
    for code, desc in OPERATIONS:
        if frappe.db.exists("Operation", code):
            _log(f"Operation exists: {code}")
            continue
        op = frappe.new_doc("Operation")
        op.name = code
        op.description = desc
        op.insert(ignore_permissions=True)
        created += 1
        _log(f"Operation created: {code} ({desc})")
    return created


# ---------------- 2. Customers ----------------

CUSTOMERS = [
    # (name, group, territory, country_hint)
    ("Vanderlande Industries Inc.", "Commercial", "United States", "USA — Marietta GA"),
    ("Nissan North America",        "Commercial", "United States", "USA — Franklin TN"),
    ("Ariens Company",              "Commercial", "United States", "USA — Brillion WI"),
]


def ensure_customers():
    created = 0
    for name, group, territory, note in CUSTOMERS:
        if frappe.db.exists("Customer", name):
            _log(f"Customer exists: {name}")
            continue
        cust = frappe.new_doc("Customer")
        cust.customer_name = name
        cust.customer_type = "Company"
        # customer_group may not exist; skip if missing
        if frappe.db.exists("Customer Group", group):
            cust.customer_group = group
        if frappe.db.exists("Territory", territory):
            cust.territory = territory
        cust.customer_details = note
        cust.insert(ignore_permissions=True)
        created += 1
        _log(f"Customer created: {name}")
    return created


# ---------------- 3. Items ----------------

# (code, name, item_group, uom, standard_rate)
ITEMS = [
    # Vanderlande — Quote 14303 (collapsed)
    ("JWM-11646-A", "028765-057-00750BRG Bracket (Vanderlande)",  "Products", "Pc", 39.11),
    ("JWM-11646-B", "028765-058-00750A1O Bracket (Vanderlande)",  "Products", "Pc", 39.11),

    # Nissan — Quote 14425 (HQ exterior railing bracket)
    ("JWM-NSN-BRK-01", "Nissan HQ Exterior Railing Bracket", "Products", "Pc", 227.16),

    # Ariens — Part 30270901 Rev B (7ga HRPO snowblower panel)
    ("JWM-ARN-30270901", "Ariens Part 30270901 Rev B — 7ga HRPO A1011 Panel", "Products", "Pc", 143.75),

    # Raw materials
    ("RM-HRPO-7GA-A1011", "HR P&O Sheet 7GA 48x76 A1011 CS B", "Raw Material", "Sheet", 89.20),
    ("RM-SS304-12GA-SHT", "SS 304 Sheet 12GA 48x120",          "Raw Material", "Sheet", 142.00),
    ("RM-CRATING",        "Export Crating (lot)",              "Raw Material", "Each", 3.00),
]


def ensure_items():
    created = 0
    for code, name, group, uom, rate in ITEMS:
        if frappe.db.exists("Item", code):
            _log(f"Item exists: {code}")
            continue
        doc = frappe.new_doc("Item")
        doc.item_code = code
        doc.item_name = name
        doc.item_group = group
        doc.stock_uom = uom
        doc.is_stock_item = 1
        doc.include_item_in_manufacturing = 1
        doc.default_material_request_type = "Purchase" if group == "Raw Material" else "Manufacture"
        if rate and rate > 0:
            doc.standard_rate = rate
            doc.valuation_rate = rate
        doc.append("item_defaults", {
            "company": COMPANY,
            "default_warehouse": WH_STORES if group == "Raw Material" else WH_FG,
        })
        doc.insert(ignore_permissions=True)
        created += 1
        _log(f"Item created: {code}")
    return created


# ---------------- 4. BOMs ----------------

BOMS = [
    # (fg_code, components=[(item, qty)], operations=[(op, time_min, ws)])
    ("JWM-11646-A", [("RM-SS304-12GA-SHT", 0.25)],
        [("FL", 0.8, "Flat Laser 1"), ("FM", 0.5, "Press Brake 1"), ("QA", 0.1, "QC")]),
    ("JWM-11646-B", [("RM-SS304-12GA-SHT", 0.25)],
        [("FL", 0.8, "Flat Laser 1"), ("FM", 0.5, "Press Brake 1"), ("QA", 0.1, "QC")]),
    ("JWM-NSN-BRK-01", [("RM-SS304-12GA-SHT", 0.18)],
        [("FL", 1.0, "Flat Laser 2"), ("FM", 1.0, "Press Brake 1"),
         ("WELD", 2.0, "Weld Bay A"), ("QA", 0.2, "QC")]),
    ("JWM-ARN-30270901", [("RM-HRPO-7GA-A1011", 1.0), ("RM-CRATING", 1.0)],
        [("FL", 7.0, "Flat Laser 2"), ("FM", 17.7, "Press Brake 1"), ("QA", 0.1, "QC")]),
]


def ensure_boms():
    created = 0
    for fg, raws, ops in BOMS:
        existing = frappe.db.get_value("BOM",
            {"item": fg, "is_default": 1, "docstatus": 1}, "name")
        if existing:
            _log(f"BOM exists: {fg} -> {existing}")
            continue
        if not frappe.db.exists("Item", fg):
            _log(f"BOM skip (item missing): {fg}")
            continue
        bom = frappe.new_doc("BOM")
        bom.item = fg
        bom.quantity = 1
        bom.is_default = 1
        bom.is_active = 1
        bom.company = COMPANY
        bom.with_operations = 1
        for rm, qty in raws:
            if frappe.db.exists("Item", rm):
                bom.append("items", {"item_code": rm, "qty": qty})
        for op_code, time_min, ws in ops:
            if not frappe.db.exists("Operation", op_code):
                continue
            row = {"operation": op_code, "time_in_mins": time_min}
            if ws and frappe.db.exists("Workstation", ws):
                row["workstation"] = ws
            bom.append("operations", row)
        bom.insert(ignore_permissions=True)
        bom.submit()
        created += 1
        _log(f"BOM created: {fg} -> {bom.name}")
    return created


# ---------------- 5. Sales Orders + Work Orders (real jobs) ----------------

# (customer, division, po_no, delivery_days_out, items=[(item, qty, rate)])
SALES_ORDERS = [
    # Vanderlande — Quote 14303 collapsed per user guidance:
    #   1800 × JWM-11646-A + 900 × JWM-11646-B  (= $105,597)
    ("Vanderlande Industries Inc.", "Processing", "VDL-PO-14303", 45,
     [("JWM-11646-A", 1800, 39.11), ("JWM-11646-B", 900, 39.11)]),
    # Nissan — Quote 14425 (48 EA brackets)
    ("Nissan North America", "Architectural", "NSN-PO-14425", 21,
     [("JWM-NSN-BRK-01", 48, 227.16)]),
    # Ariens — single representative SO (latest job 152768)
    ("Ariens Company", "Processing", "ARN-SO-152768", 5,
     [("JWM-ARN-30270901", 50, 143.75)]),
]


def ensure_sales_orders():
    created = []
    for customer, division, po_no, delivery_offset, items in SALES_ORDERS:
        # idempotency: match on po_no
        existing = frappe.db.get_value("Sales Order",
            {"customer": customer, "po_no": po_no, "docstatus": ["<", 2]}, "name")
        if existing:
            _log(f"SO exists ({customer} / {po_no}): {existing}")
            created.append(existing)
            continue
        if not frappe.db.exists("Customer", customer):
            _log(f"SO skip (customer missing): {customer}")
            continue
        so = frappe.new_doc("Sales Order")
        so.customer = customer
        so.company = COMPANY
        so.po_no = po_no
        so.transaction_date = nowdate()
        so.delivery_date = add_days(nowdate(), delivery_offset)
        if frappe.db.has_column("Sales Order", "jwm_division"):
            so.jwm_division = division
        for item_code, qty, rate in items:
            if not frappe.db.exists("Item", item_code):
                continue
            so.append("items", {
                "item_code": item_code,
                "qty": qty,
                "rate": rate,
                "delivery_date": add_days(nowdate(), delivery_offset),
                "warehouse": WH_FG,
            })
        so.insert(ignore_permissions=True)
        so.submit()
        created.append(so.name)
        _log(f"SO created: {so.name} ({customer} / {po_no})")
    return created


# Ariens historical jobs — 5 most-recent Work Orders (bypass SO, direct to WO)
# Real actuals from Production Detail PDF (as of 4/15/2026)
ARIENS_JOBS = [
    # (wo_name_hint, po_no, qty, start, due, completed, eff_pct, fl_actual, fm_actual, status)
    ("ARN-WO-152571", "SO-152571", 50, "2026-01-20", "2026-02-13", "2026-02-28", 40.99, 11.98, 17.08, "Completed"),
    ("ARN-WO-152615", "SO-152615", 50, "2026-01-28", "2026-02-23", "2026-02-28", 45.14, 15.30, 15.20, "Completed"),
    ("ARN-WO-152660", "SO-152660", 50, "2026-02-12", "2026-03-09", "2026-03-25", 35.16, 11.57, 25.59, "Completed"),
    ("ARN-WO-152717", "SO-152717", 50, "2026-03-01", "2026-03-30", None,         49.29, 12.70, 26.97, "In Process"),
    ("ARN-WO-152768", "SO-152768", 50, "2026-03-15", "2026-04-14", "2026-04-15", 41.55,  4.91, 12.55, "Completed"),
]


def ensure_ariens_work_orders():
    """Create 5 real Ariens Work Orders with actual hours baked in.

    Uses po_no on a parent Sales Order for each (so historical jobs show up in
    reports). Idempotent on (customer, po_no).
    """
    customer = "Ariens Company"
    if not frappe.db.exists("Customer", customer):
        _log("Ariens missing, skipping historical jobs")
        return 0
    item = "JWM-ARN-30270901"
    bom = frappe.db.get_value("BOM",
        {"item": item, "is_default": 1, "docstatus": 1}, "name")
    if not bom:
        _log(f"Ariens BOM missing for {item}, skipping")
        return 0

    created = 0
    for wo_hint, po_no, qty, start, due, completed, eff, fl_act, fm_act, status in ARIENS_JOBS:
        # SO-level idempotency
        so_existing = frappe.db.get_value("Sales Order",
            {"customer": customer, "po_no": po_no, "docstatus": ["<", 2]}, "name")
        if so_existing:
            so_name = so_existing
            _log(f"Ariens SO exists ({po_no}): {so_name}")
        else:
            so = frappe.new_doc("Sales Order")
            so.customer = customer
            so.company = COMPANY
            so.po_no = po_no
            so.transaction_date = start
            so.delivery_date = due
            if frappe.db.has_column("Sales Order", "jwm_division"):
                so.jwm_division = "Processing"
            so.append("items", {
                "item_code": item,
                "qty": qty,
                "rate": 143.75,
                "delivery_date": due,
                "warehouse": WH_FG,
            })
            so.insert(ignore_permissions=True)
            so.submit()
            so_name = so.name
            _log(f"Ariens SO created: {so_name} ({po_no})")

        # WO-level idempotency
        existing_wo = frappe.db.get_value("Work Order",
            {"sales_order": so_name, "production_item": item}, "name")
        if existing_wo:
            _log(f"Ariens WO exists: {existing_wo}")
            continue
        wo = frappe.new_doc("Work Order")
        wo.production_item = item
        wo.bom_no = bom
        wo.qty = qty
        wo.company = COMPANY
        wo.sales_order = so_name
        wo.fg_warehouse = WH_FG
        wo.wip_warehouse = WH_WIP
        wo.source_warehouse = WH_STORES
        wo.planned_start_date = f"{start} 08:00:00"
        wo.expected_delivery_date = due
        if frappe.db.has_column("Work Order", "jwm_division"):
            wo.jwm_division = "Processing"
            wo.jwm_baseline_date = due
            wo.jwm_revised_date = completed or due
        wo.insert(ignore_permissions=True)
        try:
            wo.submit()
        except Exception as e:
            _log(f"Ariens WO submit fail ({po_no}): {e}")
            continue

        # Patch the operations rows with REAL actual_time so eff% tells the
        # same story as the efficiency-events dashboard. planned_operating_cost
        # stays unchanged — ratio actual vs planned drives eff%.
        # (operation rows on Work Order are inherited from BOM)
        wo_doc = frappe.get_doc("Work Order", wo.name)
        for op_row in wo_doc.operations:
            if op_row.operation == "FL":
                # actual_operation_time is in minutes; fl_act is hours from PDF
                op_row.actual_operation_time = fl_act * 60
            elif op_row.operation == "FM":
                op_row.actual_operation_time = fm_act * 60
            # QA stays at 0 (matches PDF)
        wo_doc.db_update()
        for op_row in wo_doc.operations:
            op_row.db_update()

        created += 1
        _log(f"Ariens WO created: {wo.name} (eff target {eff}%, FL {fl_act}h / FM {fm_act}h)")
    return created


def ensure_wos_for_real_sos(so_names):
    """Create Work Orders for Vanderlande + Nissan SOs (if not Ariens)."""
    created = 0
    for so_name in so_names:
        so = frappe.get_doc("Sales Order", so_name)
        if so.customer == "Ariens Company":
            continue  # handled separately
        for item in so.items:
            existing = frappe.db.get_value("Work Order",
                {"sales_order": so.name, "production_item": item.item_code}, "name")
            if existing:
                _log(f"WO exists: {existing} ({item.item_code})")
                continue
            bom_no = frappe.db.get_value("BOM",
                {"item": item.item_code, "is_default": 1, "docstatus": 1}, "name")
            if not bom_no:
                _log(f"No BOM for {item.item_code}, skip")
                continue
            wo = frappe.new_doc("Work Order")
            wo.production_item = item.item_code
            wo.bom_no = bom_no
            wo.qty = item.qty
            wo.company = COMPANY
            wo.sales_order = so.name
            wo.fg_warehouse = WH_FG
            wo.wip_warehouse = WH_WIP
            wo.source_warehouse = WH_STORES
            wo.planned_start_date = nowdate() + " 08:00:00"
            wo.expected_delivery_date = so.delivery_date
            if frappe.db.has_column("Work Order", "jwm_division"):
                wo.jwm_division = getattr(so, "jwm_division", None) or "Processing"
                wo.jwm_baseline_date = so.delivery_date
                wo.jwm_revised_date = so.delivery_date
            wo.insert(ignore_permissions=True)
            try:
                wo.submit()
            except Exception as e:
                _log(f"WO submit failed for {item.item_code}: {e}")
                continue
            created += 1
            _log(f"WO created: {wo.name} ({item.item_code} x{item.qty})")
    return created


# ---------------- Entrypoint ----------------

def run():
    print("\n== JWM chris_seed.run ==")
    print("\n-- 1. Operations --")
    ensure_operations()
    print("\n-- 2. Customers --")
    ensure_customers()
    print("\n-- 3. Items --")
    ensure_items()
    print("\n-- 4. BOMs --")
    ensure_boms()
    print("\n-- 5. Sales Orders (Vanderlande, Nissan, Ariens latest) --")
    sos = ensure_sales_orders()
    print("\n-- 6. Work Orders (Vanderlande + Nissan) --")
    ensure_wos_for_real_sos(sos)
    print("\n-- 7. Ariens historical Work Orders (5 real jobs) --")
    ensure_ariens_work_orders()
    frappe.db.commit()
    print("\n== chris_seed complete ==\n")
