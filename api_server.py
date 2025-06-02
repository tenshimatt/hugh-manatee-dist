import os
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime
import uvicorn
import subprocess
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize FastAPI
app = FastAPI()

# Serve static root content like openapi.yaml and logo.png
app.mount("/", StaticFiles(directory="/home/ubuntu/pandora", html=True), name="root")

# Explicitly serve ai-plugin.json with proper headers
@app.get("/.well-known/ai-plugin.json", include_in_schema=False)
async def serve_plugin_manifest():
    return FileResponse("/home/ubuntu/pandora/.well-known/ai-plugin.json", media_type="application/json")

# Serve openapi.yaml with proper MIME
@app.get("/openapi.yaml", include_in_schema=False)
async def serve_openapi_yaml():
    return FileResponse("/home/ubuntu/pandora/openapi.yaml", media_type="application/yaml")

# Directory setup
WATCH_DIRECTORY = "/home/ubuntu/pandora/inbox"
PROCESSED_DIRECTORY = "/home/ubuntu/pandora/processed"
os.makedirs(WATCH_DIRECTORY, exist_ok=True)
os.makedirs(PROCESSED_DIRECTORY, exist_ok=True)

# API Key check
def auth(api_key: str = Header(None)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

# Main API endpoint
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

    try:
        supabase.table("execution_logs").insert({
            "command": code,
            "output": output,
            "source": "Pandora API",
            "client": "MacBook"
        }).execute()
    except Exception as e:
        print(f"[Supabase] ❌ Failed to log: {e}")

    return {
        "status": "✅ Code received",
        "filename": filename,
        "output": output.strip()
    }

# ChatGPT plugin-compatible endpoint
@app.post("/chatgpt_submit")
async def chatgpt_submit(request: Request):
    data = await request.json()
    code = data.get("code", "")

    try:
        result = subprocess.run(["python3", "-c", code], capture_output=True, text=True, timeout=15)
        output = result.stdout + result.stderr
    except Exception as e:
        output = f"[ERROR] {str(e)}"

    try:
        supabase.table("execution_logs").insert({
            "command": code,
            "output": output,
            "source": "ChatGPT Plugin",
            "client": "PluginUser"
        }).execute()
    except Exception as e:
        print(f"[Supabase] ❌ Failed to log: {e}")

    return {"output": output.strip()}

# Service status
@app.get("/status")
def status(x_api_key: str = Header(None)):
    auth(x_api_key)
    inbox_files = len([f for f in os.listdir(WATCH_DIRECTORY) if f.endswith(".py")])
    processed_files = len([f for f in os.listdir(PROCESSED_DIRECTORY) if f.endswith(".py")])
    return {
        "status": "OK",
        "inbox_files": inbox_files,
        "processed_files": processed_files
    }

# Supabase logs
@app.get("/logs")
def logs(x_api_key: str = Header(None)):
    auth(x_api_key)
    result = supabase.table("execution_logs").select("*").order("inserted_at", desc=True).limit(10).execute()
    clean_logs = []
    for row in result.data:
        if "/bin/sh:" not in row["output"]:
            clean_logs.append({
                "command": row["command"],
                "output": row["output"],
                "client": row.get("client"),
                "source": row.get("source")
            })
    return clean_logs

# Launch server
if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=5050, reload=False)
