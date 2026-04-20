#!/usr/bin/env python3
"""
01_customers_and_items.py
Seed Customers + Item Groups + Items (jobs) from Production Schedule_new.xlsx.

Key mapping:
  - Customer: customer_name = Job Name prefix (e.g. "Loves Blacksburg")
    We dedupe by customer_name.
  - Item: item_code = ID column (job id like "24060-BM01")
          item_name  = Job Name
          item_group = "JWM Jobs"
          description = composed from Job Address + System + Release Notes
"""
from __future__ import annotations
import os, json, pathlib
import openpyxl
from _frappe import FrappeClient, setup_logging, map_status_emoji

LOG = setup_logging("./logs", "01_customers_and_items")

ATT = pathlib.Path(os.environ["JWM_ATTACHMENTS_DIR"])
SRC = ATT / "Production Schedule_new.xlsx"
ITEM_GROUP = "JWM Jobs"


def ensure_item_group(fc: FrappeClient):
    fc.upsert(
        "Item Group",
        {
            "item_group_name": ITEM_GROUP,
            "parent_item_group": "All Item Groups",
            "is_group": 0,
        },
        key_field="item_group_name",
    )


def main():
    fc = FrappeClient.from_env()
    LOG.info("Opening %s", SRC)
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb["Production Schedule"]

    it = ws.iter_rows(values_only=True)
    headers = [h.strip() if isinstance(h, str) else h for h in next(it)]
    idx = {h: i for i, h in enumerate(headers) if h}

    ensure_item_group(fc)

    customers_seen = set()
    items_seen = set()

    for row in it:
        if not row or all(v is None for v in row):
            continue
        job_id = row[idx["ID"]] if "ID" in idx else None
        job_name = row[idx["Job Name"]] if "Job Name" in idx else None
        if not job_id or not job_name:
            continue
        job_id = str(job_id).strip()
        job_name = str(job_name).strip()

        # Customer = Job Name (JWM's job name is the customer's site name;
        # in the real world a customer LUT would map these; for the demo
        # we use job_name as customer_name)
        if job_name not in customers_seen:
            try:
                fc.upsert(
                    "Customer",
                    {
                        "customer_name": job_name,
                        "customer_type": "Company",
                        "customer_group": "Commercial",
                        "territory": "All Territories",
                    },
                    key_field="customer_name",
                )
                customers_seen.add(job_name)
            except Exception as e:
                LOG.error("Customer %s failed: %s", job_name, e)

        # Item
        if job_id in items_seen:
            continue
        items_seen.add(job_id)

        desc_parts = []
        for k in ["Job Address", "System", "Release Notes", "Description"]:
            if k in idx and row[idx[k]]:
                desc_parts.append(f"{k}: {row[idx[k]]}")
        description = "\n".join(desc_parts)[:10000]

        try:
            fc.upsert(
                "Item",
                {
                    "item_code": job_id,
                    "item_name": f"{job_id} {job_name}"[:140],
                    "item_group": ITEM_GROUP,
                    "description": description,
                    "is_stock_item": 0,
                    "include_item_in_manufacturing": 1,
                    "stock_uom": "Nos",
                },
                key_field="item_code",
            )
        except Exception as e:
            LOG.error("Item %s failed: %s", job_id, e)

    LOG.info("Customers created/updated: %d  Items: %d", len(customers_seen), len(items_seen))
    LOG.info("Stats: %s", fc.stats)
    print(json.dumps(fc.stats))


if __name__ == "__main__":
    main()
