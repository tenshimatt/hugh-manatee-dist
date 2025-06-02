import os
import time
import subprocess
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Watch/processed directory paths
WATCH_DIRECTORY = "/home/ubuntu/pandora/inbox"
PROCESSED_DIRECTORY = "/home/ubuntu/pandora/processed"

# Ensure directories exist
os.makedirs(WATCH_DIRECTORY, exist_ok=True)
os.makedirs(PROCESSED_DIRECTORY, exist_ok=True)

def execute_code(file_path):
    with open(file_path, 'r') as file:
        code = file.read()
    try:
        result = subprocess.run(
            code,
            shell=True,
            capture_output=True,
            text=True,
            timeout=15
        )
        output = result.stdout + result.stderr
    except Exception as e:
        output = f"[ERROR] {str(e)}"
    return code, output

def log_to_supabase(command, output):
    data = {
        "command": command,
        "output": output
    }
    supabase.table("execution_logs").insert(data).execute()

def monitor_directory():
    print("[Monitor] ✅ Started. Watching inbox...")
    processed_files = set()
    while True:
        try:
            files = [f for f in os.listdir(WATCH_DIRECTORY) if f.endswith('.py')]
            print(f"[Monitor] 📂 Found {len(files)} Python files: {files}")
            for file_name in files:
                file_path = os.path.join(WATCH_DIRECTORY, file_name)
                if file_name not in processed_files:
                    print(f"[Monitor] ▶️ Processing: {file_name}")
                    command, output = execute_code(file_path)
                    try:
                        log_to_supabase(command, output)
                        print("[Monitor] ✅ Logged to Supabase")
                    except Exception as e:
                        print(f"[Monitor] ❌ Failed to log to Supabase: {e}")
                    processed_files.add(file_name)
                    os.rename(file_path, os.path.join(PROCESSED_DIRECTORY, file_name))
                    print(f"[Monitor] ✅ Moved to processed: {file_name}")
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n[Monitor] 🔴 Stopped by user.")
            break
        except Exception as e:
            print(f"[Monitor] ❌ Error in loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    monitor_directory()
