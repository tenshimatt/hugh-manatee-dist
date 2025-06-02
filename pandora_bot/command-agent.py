import gspread
import subprocess
import time
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# === CONFIG ===
SHEET_ID = "1QLGmWGB_yV29K7pbWEER_m3BdKDYl6sr2f2tYHDAMkY"
COMMAND_SHEET = "Command Queue"
LOG_SHEET = "Terminal Logger"
POLL_INTERVAL = 10  # seconds

# === GOOGLE AUTH SETUP ===
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
client = gspread.authorize(creds)

print("🧠 SUPERLUXE Python Agent Active...")

while True:
    try:
        # STEP 1: Load Sheets
        sheet = client.open_by_key(SHEET_ID)
        queue_ws = sheet.worksheet(COMMAND_SHEET)
        log_ws = sheet.worksheet(LOG_SHEET)

        # STEP 2: Find first 'pending' row
        records = queue_ws.get_all_records()
        pending_row = next((i+2 for i, row in enumerate(records) if row.get('Status', '').lower() == 'pending'), None)

        if not pending_row:
            print("⏸️ No pending command found. Waiting...")
            time.sleep(POLL_INTERVAL)
            continue

        row_data = queue_ws.row_values(pending_row)
        cmd = row_data[1]  # assumes 'Command' is column B
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        print(f"⚙️ Executing: {cmd}")

        # STEP 3: Run command
        try:
            result = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, universal_newlines=True)
            status = "done"
        except subprocess.CalledProcessError as e:
            result = e.output
            status = "error"

        print("📤 Logging output to sheet...")

        # STEP 4: Log to Terminal Logger
        log_ws.append_row([timestamp, cmd, result])

        # STEP 5: Update original command row to 'done' or 'error'
        queue_ws.update_cell(pending_row, 3, status)  # assumes Status is column C

    except Exception as e:
        print(f"❌ ERROR: {e}")

    time.sleep(POLL_INTERVAL)

