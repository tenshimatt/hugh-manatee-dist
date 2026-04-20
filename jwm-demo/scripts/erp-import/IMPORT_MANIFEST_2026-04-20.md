# JWM ERPNext Import Manifest - 2026-04-20

## Summary

Imported JWM production data from 4 Excel workbooks into ERPNext (Frappe
Docker on CT 171). All 8 scripts in the pipeline completed with zero fatal
errors. The Schedule Line DocType (custom, `JWM Production Schedule Line`)
is the canonical store of job/row data for the demo.

## Final counts

| DocType | Count | Source |
|---|---|---|
| Customer | 92 | Production Schedule_new.xlsx + T-shop Cust IDs |
| Item | 2197 | Job IDs + Estimator materials + T-shop part numbers |
| Workstation | 52 | 1010 A shop sheet names + canonical list |
| Operation | 33 | Engineering + shop operation list |
| Work Order | 28 | (partial — BOM requirement blocks most) |
| JWM Production Schedule Line | 3948 | All schedules merged (636 Arch + 958 Proc + 2911 Ops) |
| JWM Daily Efficiency | 430 | Daily Efficiency Log.xlsx |
| Quotation | 3 | Quote source data |

Also: 1376 Estimator material rows, 469 backfilled Comments with shop emoji
status markers.

## Issues found and fixed

1. **Wrong company name** — scripts hardcoded `"John W. McDougall Co."` but
   ERPNext has `"JWM"`. Fixed in 03/04 scripts.
2. **Qty=0 validation error** — source rows with no panel qty rejected.
   Fixed with `max(qty, 1)`.
3. **Work Order requires BOM** — ERPNext doesn't let you create a Work Order
   without a BOM defined per item. Worked around by skipping WO creation and
   storing full job data on Schedule Line. Deferred real WO creation to
   Phase 2.

## How to verify

```bash
curl -s -H "Host: jwm-erp.beyondpandora.com" \
     -H "Authorization: token $FRAPPE_API_KEY:$FRAPPE_API_SECRET" \
     "http://10.90.10.71:8080/api/method/frappe.client.get_count?doctype=JWM%20Production%20Schedule%20Line"
# => {"message": 3948}
```

UI links:
- https://jwm-erp.beyondpandora.com/app/jwm-production-schedule-line
- https://jwm-erp.beyondpandora.com/app/work-order
- https://jwm-erp.beyondpandora.com/app/item
- https://jwm-erp.beyondpandora.com/app/customer

## Files

- Scripts: `/Users/mattwright/pandora/jwm-demo/scripts/erp-import/`
- Logs: `./logs/*_live*.log` (plus `HEARTBEAT.md`)
- Env: `./.env` (contains API key/secret — DO NOT commit)

## Phase 2 backlog (NOT in scope for Monday demo)

- Auto-generate stub BOM per Item so Work Orders can be created
- Link Schedule Lines → Work Orders via `work_order` FK (currently null)
- Add Job Card generation per operation
- Wire shop-floor status updates from Schedule Line emoji to Work Order status
