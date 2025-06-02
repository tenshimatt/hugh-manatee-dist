import os
import subprocess
import time
from datetime import datetime, timezone
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import traceback

LOG_FILE = "/home/ubuntu/superluxe/infra/kucoin-webhook/webhook.err"
COMMAND_LOG = "/home/ubuntu/pandora/tier5/tier5-actions.log"
SERVICE_NAME = "kucoin-webhook"

# === Google Sheets setup ===
SHEET_ID = "1QLGmWGB_yV29K7pbWEER_m3BdKDYl6sr2f2tYHDAMkY"
DEBUG_TAB = "Tier5 Debug Log"
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("/home/ubuntu/superluxe/infra/kucoin-webhook/credentials.json", scope)
client = gspread.authorize(creds)
debug_ws = client.open_by_key(SHEET_ID).worksheet(DEBUG_TAB)

def log_action(action):
    with open(COMMAND_LOG, "a") as f:
        f.write(f"{datetime.now(timezone.utc).isoformat()} - {action}\n")

def log_to_sheet(error, details):
    timestamp = datetime.now(timezone.utc).isoformat()
    debug_ws.append_row([timestamp, SERVICE_NAME, error, details[:1000]])

def restart_service():
    subprocess.run(["sudo", "systemctl", "restart", "kucoin-webhook.service"])

def watch_logs():
    last_size = 0
    print("👁️ Watching log for errors...")
    while True:
        try:
            if not os.path.exists(LOG_FILE):
                time.sleep(5)
                continue

            current_size = os.path.getsize(LOG_FILE)
            if current_size > last_size:
                with open(LOG_FILE, "r") as f:
                    f.seek(last_size)
                    new_data = f.read()
                    if "Traceback" in new_data or "Error" in new_data:
                        print("❌ Error detected — restarting service")
                        log_action("Detected error → Restarted kucoin-webhook.service")
                        log_to_sheet("Traceback", new_data)
                        restart_service()
                last_size = current_size
        except Exception as e:
            tb = traceback.format_exc()
            log_to_sheet("AgentError", tb)
        time.sleep(5)

if __name__ == "__main__":
    watch_logs()
