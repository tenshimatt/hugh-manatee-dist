import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# Path to credentials and spreadsheet details
CREDENTIALS_FILE = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "/home/ubuntu/pandora/pandora-agent-459720-8167232fb00c.json")
SPREADSHEET_ID = "1QLGmWGB_yV29K7pbWEER_m3BdKDYl6sr2f2tYHDAMkY"
TAB_NAME = "Tier5 Debug Log"

# Connect to Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
client = gspread.authorize(creds)
sheet = client.open_by_key(SPREADSHEET_ID).worksheet(TAB_NAME)

# Log entry
timestamp = datetime.utcnow().isoformat()
log_entry = [timestamp, "CI", "Deployed plugin bundle to production. ✅"]

# Append to sheet
sheet.append_row(log_entry)
print("✅ Logged to Google Sheet.")
