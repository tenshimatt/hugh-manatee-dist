import subprocess
import datetime
import os

LOG_FILE = "/home/ubuntu/pandora/pandora_watchdog.log"
SERVICE_NAME = "pandora-api"

def log(message):
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")

def is_service_active():
    result = subprocess.run(
        ["systemctl", "is-active", SERVICE_NAME],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return result.stdout.strip() == "active"

def restart_service():
    subprocess.run(["sudo", "systemctl", "restart", SERVICE_NAME])

def main():
    if is_service_active():
        log("✅ Service is running.")
    else:
        log("❌ Service was DOWN. Restarting...")
        restart_service()
        log("🔁 Service restarted.")

if __name__ == "__main__":
    main()
