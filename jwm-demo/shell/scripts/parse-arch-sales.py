#!/usr/bin/env python3
"""Parse JWMCD Arch Sales xlsx → canned/arch-sales.json.

Maps all 48 cols to compact camelCase. Dates → ISO, percentages kept 0..1.
Skips rows with blank Project Name.
"""
import json
import sys
from datetime import datetime, date
from pathlib import Path

import openpyxl

SRC = Path("/Users/mattwright/pandora/Obsidian/PROJECTS/JWM/assets/2026-04-20/Arch Sales/JWMCD Arch Sales (3).xlsx")
DST = Path("/Users/mattwright/pandora/jwm-demo/shell/lib/canned/arch-sales.json")

# Column index (0-based) → target key. Matches the spec in the research doc.
COL_MAP = {
    0: "projectName",
    1: "stage",
    2: "receivedDate",
    3: "bidDate",
    4: "closeProbability",
    5: "totalBidValue",
    6: "estimator",
    7: "ballInCourt",
    8: "city",
    9: "state",
    10: "contactName",
    11: "nda",
    12: "company",
    13: "companyHelper",
    14: "customerCode",
    15: "wonLostDate",
    16: "contactPhone",
    17: "jobType",
    18: "installType",
    19: "estVendor",
    20: "onsiteSchedule",
    21: "metalBidValue",
    22: "glazingBidValue",
    23: "markup",
    24: "margin",
    25: "totalNsf",
    26: "tasks",
    27: "dateOfContract",
    28: "actualCloseValue",
    29: "forecastCloseValue",
    30: "scope",
    31: "bid1",
    32: "bid2",
    33: "bid3",
    34: "bid4",
    35: "followUpDate",
    36: "avgSoldGp",
    37: "sumAvgSoldGp",
    38: "avgClosedGp",
    39: "sumAvgClosedGp",
    40: "avgWipGp",
    41: "sumAvgWipGp",
    42: "avgPaymentDays",
    43: "year",
    44: "comments",
    45: "thirdFollowUp",
    46: "latestComment",
    47: "secondFollowUp",
}

DATE_KEYS = {
    "receivedDate", "bidDate", "wonLostDate", "dateOfContract",
    "followUpDate", "thirdFollowUp", "secondFollowUp",
}
NUM_KEYS = {
    "closeProbability", "totalBidValue", "metalBidValue", "glazingBidValue",
    "markup", "margin", "totalNsf", "actualCloseValue", "forecastCloseValue",
    "bid1", "bid2", "bid3", "bid4",
    "avgSoldGp", "sumAvgSoldGp", "avgClosedGp", "sumAvgClosedGp",
    "avgWipGp", "sumAvgWipGp", "avgPaymentDays", "year",
}


def coerce_date(v):
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    # Some cells come in as strings — best effort ISO.
    s = str(v).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return s  # keep raw


def coerce_num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v) if isinstance(v, float) else v
    s = str(v).strip().replace(",", "").replace("$", "").replace("%", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def coerce_str(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["JWMCD Arch Sales"]
    rows = ws.iter_rows(values_only=True)
    next(rows)  # skip header

    out = []
    for r in rows:
        if not r:
            continue
        project_name = r[0] if len(r) > 0 else None
        if project_name is None or str(project_name).strip() == "":
            continue

        rec = {}
        for idx, key in COL_MAP.items():
            if idx >= len(r):
                rec[key] = None
                continue
            v = r[idx]
            if key in DATE_KEYS:
                rec[key] = coerce_date(v)
            elif key in NUM_KEYS:
                rec[key] = coerce_num(v)
            else:
                rec[key] = coerce_str(v)

        # Year coercion to int when possible.
        if rec.get("year") is not None:
            try:
                rec["year"] = int(rec["year"])
            except (TypeError, ValueError):
                rec["year"] = None

        out.append(rec)

    DST.parent.mkdir(parents=True, exist_ok=True)
    with DST.open("w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"wrote {len(out)} rows → {DST}", file=sys.stderr)


if __name__ == "__main__":
    main()
