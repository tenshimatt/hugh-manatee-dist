import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    print(f"[Agent] ✅ Created: {path}")

def run_command(cmd):
    print(f"[Agent] ▶️ Running: {cmd}")
    os.system(cmd)

# Ensure .env has API_KEY
env_path = "/home/ubuntu/pandora/.env"
if not os.path.exists(env_path):
    write_file(env_path, 'SUPABASE_URL=""\nSUPABASE_KEY=""\nAPI_KEY="supersecret123"\n')
elif "API_KEY=" not in open(env_path).read():
    with open(env_path, "a") as f:
        f.write('API_KEY="supersecret123"\n')

# --- Files to generate ---
files = {
    "/home/ubuntu/pandora/api_server.py": '''
import os
from fastapi import FastAPI, Request, Header, HTTPException
from datetime import datetime
import uvicorn
import subprocess
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
API_KEY = os.getenv("API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

WATCH_DIRECTORY = "/home/ubuntu/pandora/inbox"
PROCESSED_DIRECTORY = "/home/ubuntu/pandora/processed"
os.makedirs(WATCH_DIRECTORY, exist_ok=True)
os.makedirs(PROCESSED_DIRECTORY, exist_ok=True)

app = FastAPI()

def auth(api_key: str = Header(None)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

@app.post("/submit")
async def submit_code(request: Request, x_api_key: str = Header(None)):
    auth(x_api_key)
    payload = await request.body()
    code = payload.decode()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"submitted_{timestamp}.py"
    filepath = os.path.join(WATCH_DIRECTORY, filename)
    with open(filepath, "w") as f:
        f.write(code)

    try:
        result = subprocess.run(["python3", filepath], capture_output=True, text=True, timeout=15)
        output = result.stdout + result.stderr
    except Exception as e:
        output = f"[ERROR] {str(e)}"

    return {"status": "✅ Code received", "filename": filename, "output": output.strip()}

@app.get("/status")
def status(x_api_key: str = Header(None)):
    auth(x_api_key)
    inbox_count = len([f for f in os.listdir(WATCH_DIRECTORY) if f.endswith(".py")])
    processed_count = len([f for f in os.listdir(PROCESSED_DIRECTORY) if f.endswith(".py")])
    return {"status": "OK", "inbox_files": inbox_count, "processed_files": processed_count}

@app.get("/logs")
def logs(x_api_key: str = Header(None)):
    auth(x_api_key)
    result = supabase.table("execution_logs").select("*").order("inserted_at", desc=True).limit(5).execute()
    return [{"command": row["command"], "output": row["output"]} for row in result.data]

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=5050, reload=False)
'''
}

# --- Setup commands ---
post_setup_commands = [
    "chmod +x /home/ubuntu/pandora/api_server.py",
    ". /home/ubuntu/pandora/.venv/bin/activate && pip install fastapi uvicorn python-dotenv supabase"
]

for path, content in files.items():
    write_file(path, content)

for command in post_setup_commands:
    run_command(command)
