
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_logs(limit=5):
    response = supabase.table("execution_logs").select("*").order("inserted_at", desc=True).limit(limit).execute()
    return response.data

if __name__ == "__main__":
    logs = fetch_logs()
    for idx, log in enumerate(logs):
        print(f"\n--- Log {idx + 1} ---")
        print(f"Command:\n{log['command']}")
        print(f"Output:\n{log['output']}")
