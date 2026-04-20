#!/usr/bin/env python3
"""
06_quotes.py
Best-effort import of Quote Form_*.pdf into Quotation DocType.

Extracts quote number from filename (Quote Form_14303.pdf -> 14303).
Pulls raw text via pypdf; tries to scrape customer + date + total from first page.
Attaches the PDF file to the Quotation.
"""
from __future__ import annotations
import os, re, json, pathlib, datetime, base64
from _frappe import FrappeClient, setup_logging

LOG = setup_logging("./logs", "06_quotes")
ATT = pathlib.Path(os.environ["JWM_ATTACHMENTS_DIR"])

QUOTE_RE = re.compile(r"Quote Form_(\d+)", re.I)
TOTAL_RE = re.compile(r"(?:total|grand total)[^\d$]*\$?([\d,]+\.\d{2})", re.I)
DATE_RE = re.compile(r"(\d{1,2}/\d{1,2}/\d{2,4})")
CUST_RE = re.compile(r"(?:customer|bill to|sold to)\s*[:\-]\s*([^\n]{3,80})", re.I)


def extract_text(path: pathlib.Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        LOG.error("pypdf not installed")
        return ""
    try:
        r = PdfReader(str(path))
        return "\n\n".join((p.extract_text() or "") for p in r.pages)
    except Exception as e:
        LOG.error("PDF parse %s: %s", path.name, e)
        return ""


def main():
    fc = FrappeClient.from_env()

    pdfs = sorted(ATT.glob("Quote Form_*.pdf"))
    if not pdfs:
        LOG.warning("No Quote Form_*.pdf found in %s", ATT)
        return
    for p in pdfs:
        m = QUOTE_RE.search(p.name)
        if not m:
            continue
        qnum = m.group(1)
        name = f"QUOTE-{qnum}"
        text = extract_text(p)
        total = None
        t = TOTAL_RE.search(text)
        if t:
            try:
                total = float(t.group(1).replace(",", ""))
            except Exception:
                pass
        qdate = None
        d = DATE_RE.search(text)
        if d:
            try:
                qdate = datetime.datetime.strptime(d.group(1), "%m/%d/%Y").strftime("%Y-%m-%d")
            except Exception:
                try:
                    qdate = datetime.datetime.strptime(d.group(1), "%m/%d/%y").strftime("%Y-%m-%d")
                except Exception:
                    pass
        cust = None
        c = CUST_RE.search(text)
        if c:
            cust = c.group(1).strip()[:140]

        # Ensure a placeholder customer
        customer_name = cust or "JWM Quote Customer (TBD)"
        try:
            fc.upsert(
                "Customer",
                {
                    "customer_name": customer_name,
                    "customer_type": "Company",
                    "customer_group": "Commercial",
                    "territory": "All Territories",
                },
                key_field="customer_name",
            )
        except Exception as e:
            LOG.warning("Customer %s: %s", customer_name, e)

        payload = {
            "name": name,
            "party_name": customer_name,
            "quotation_to": "Customer",
            "transaction_date": qdate or datetime.date.today().strftime("%Y-%m-%d"),
            "jwm_quote_number": qnum,
            "jwm_raw_text": text[:50000],
            "status": "Draft",
            "items": [
                {
                    "item_code": "QUOTE-LINE-PLACEHOLDER",
                    "item_name": f"Quote {qnum} line (see PDF)",
                    "description": "TODO Phase 2: parse PDF line items",
                    "qty": 1,
                    "rate": total or 0,
                    "uom": "Nos",
                }
            ],
        }
        # Ensure placeholder Item exists
        try:
            fc.upsert(
                "Item",
                {
                    "item_code": "QUOTE-LINE-PLACEHOLDER",
                    "item_name": "Quote Line Placeholder",
                    "item_group": "Services",
                    "stock_uom": "Nos",
                    "is_stock_item": 0,
                },
                key_field="item_code",
            )
        except Exception as e:
            LOG.warning("placeholder item: %s", e)

        try:
            fc.upsert("Quotation", payload, key_field="name")
        except Exception as e:
            LOG.error("Quotation %s failed: %s", name, e)
            continue

        # Attach file (only in live mode to avoid uploading on dry runs)
        if not fc.dry_run:
            try:
                with open(p, "rb") as f:
                    content = base64.b64encode(f.read()).decode()
                fc.create(
                    "File",
                    {
                        "file_name": p.name,
                        "attached_to_doctype": "Quotation",
                        "attached_to_name": name,
                        "content": content,
                        "decode": 1,
                        "is_private": 1,
                    },
                )
            except Exception as e:
                LOG.error("Attach %s to %s: %s", p.name, name, e)

    LOG.info("Stats: %s", fc.stats)
    print(json.dumps(fc.stats))


if __name__ == "__main__":
    main()
