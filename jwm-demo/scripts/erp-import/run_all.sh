#!/usr/bin/env bash
# run_all.sh — JWM ERPNext import orchestrator.
#
# Usage:
#   ./run_all.sh dry    # dry-run only (no writes)
#   ./run_all.sh live   # real writes
#
# Each script runs independently. If one fails we log and continue.
set -u
cd "$(dirname "$0")"

MODE="${1:-dry}"
if [[ "$MODE" != "dry" && "$MODE" != "live" ]]; then
  echo "Usage: $0 [dry|live]" >&2; exit 1
fi
export IMPORT_MODE="$MODE"

mkdir -p logs
TS="$(date +%Y%m%d-%H%M%S)"
MASTER_LOG="logs/run_all_${MODE}_${TS}.log"
echo "JWM import run: mode=$MODE ts=$TS" | tee "$MASTER_LOG"

PY="${PYTHON:-python3}"

SCRIPTS=(
  00_schema_snapshot.py
  00_bootstrap_doctypes.py
  01_customers_and_items.py
  02_workstations_and_operations.py
  03_arch_schedule.py
  04_production_schedule_proc.py
  05_daily_efficiency.py
  06_quotes.py
  07_tshop_estimator.py
  08_comments_backfill.py
)

for s in "${SCRIPTS[@]}"; do
  echo "=== $s ===" | tee -a "$MASTER_LOG"
  if $PY "$s" 2>&1 | tee -a "$MASTER_LOG"; then
    echo "OK $s" | tee -a "$MASTER_LOG"
  else
    echo "FAIL $s (continuing)" | tee -a "$MASTER_LOG"
  fi
done

echo "Done. Master log: $MASTER_LOG"
