#!/usr/bin/env python3
"""Automagic Drops Processor — CT 107.

Watches /opt/PLAUD_NOTES/_drops/ for audio files dropped via the Automagic Console
web UI, and runs them through the same pipeline as WF-1a:
  Whisper → Summarise → Title Fix → Classify Tags → Write Markdown → WF-2 webhook.

One file per run. Systemd timer runs every minute.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import requests  # requires python3-requests

DROPS_DIR = Path("/opt/PLAUD_NOTES/_drops")
PROCESSED_DIR = DROPS_DIR / "_processed"
ERRORED_DIR = DROPS_DIR / "_errored"
NOTES_ROOT = Path("/opt/PLAUD_NOTES")
PROJECTS_ROOT = NOTES_ROOT / "PROJECTS"
CONFIG_PATH = NOTES_ROOT / "00 Folder Config.md"
LOCK_PATH = Path("/tmp/automagic_drops.lock")

WHISPER_URL = "http://10.90.10.46:8000/v1/audio/transcriptions"
LITELLM_URL = os.environ.get("LITELLM_BASE_URL", "http://10.90.10.23:4000") + "/v1/chat/completions"
LITELLM_KEY = os.environ.get("LITELLM_API_KEY", "sk-admin-1234")
WF2_WEBHOOK = "http://127.0.0.1:5678/webhook/classify"

MODEL = "anthropic/claude-sonnet-4-6"
CLASSIFY_MODEL = "anthropic/claude-sonnet-4-6"

AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".ogg", ".flac", ".webm", ".mp4", ".aac", ".opus"}


def log(msg: str) -> None:
    print(f"[drops] {datetime.now().isoformat(timespec='seconds')} {msg}", flush=True)


def acquire_lock() -> bool:
    try:
        fd = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return True
    except FileExistsError:
        return False


def release_lock() -> None:
    try:
        LOCK_PATH.unlink()
    except FileNotFoundError:
        pass


def next_drop() -> Path | None:
    if not DROPS_DIR.is_dir():
        return None
    files = [
        p for p in DROPS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS and not p.name.startswith(".")
    ]
    files.sort(key=lambda p: p.stat().st_mtime)
    return files[0] if files else None


def transcribe(audio: Path) -> str:
    log(f"whisper → {audio.name} ({audio.stat().st_size} bytes)")
    with audio.open("rb") as f:
        r = requests.post(
            WHISPER_URL,
            files={"file": (audio.name, f, "application/octet-stream")},
            data={"model": "Systran/faster-whisper-large-v3", "response_format": "json"},
            timeout=1800,
        )
    r.raise_for_status()
    data = r.json()
    return data.get("text") or data.get("transcript") or ""


def litellm(model: str, system: str, user: str, max_tokens: int = 1000, temperature: float = 0.3) -> str:
    r = requests.post(
        LITELLM_URL,
        headers={"Authorization": f"Bearer {LITELLM_KEY}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        },
        timeout=180,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def summarise(transcript: str) -> str:
    sys_prompt = (
        "You are a concise business-meeting summariser. Given a voice-note transcript, "
        "produce a structured Markdown summary with these sections:\n"
        "## Executive summary\n## Key points\n## Decisions\n## Action items\n## Open questions\n"
        "Use bullet points. Be specific; avoid hedging. If a section has no content, write '_None._'."
    )
    return litellm(MODEL, sys_prompt, transcript, max_tokens=2000, temperature=0.2)


def fix_title(transcript: str, original_name: str) -> str:
    sys_prompt = (
        "You generate short, specific titles for voice notes. "
        "Return ONLY the title (no quotes, no markdown, no prefixes). "
        "Max 10 words. Prefer specific subject + outcome over generic phrasing."
    )
    user = f"Original filename: {original_name}\n\nTranscript excerpt:\n{transcript[:3000]}"
    raw = litellm(MODEL, sys_prompt, user, max_tokens=60, temperature=0.3)
    title = raw.splitlines()[0].strip().strip('"').strip("'")
    title = re.sub(r"[\\/:*?\"<>|]+", " ", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title[:120] or "Untitled drop"


def classify(title: str, summary_excerpt: str) -> tuple[str | None, list[str]]:
    config = CONFIG_PATH.read_text(encoding="utf-8") if CONFIG_PATH.exists() else ""
    sys_prompt = f"""You are a precise content classifier. Determine the PRIMARY topic of a voice note by matching against the keyword→tag configuration below.

CRITICAL RULES:
- A keyword merely MENTIONED IN PASSING does NOT make that the primary tag.
- Focus on what the recording is PRIMARILY ABOUT — main subject, audience, purpose.
- Return exactly ONE primary_tag and zero or more secondary_tags.
- Tags must come from the configuration below. If nothing matches well, use null for primary_tag.

KEYWORD CONFIGURATION:
{config}

Respond ONLY with valid JSON (no markdown, no code blocks):
{{"primary_tag": "tag-name-or-null", "secondary_tags": [], "reasoning": "one sentence"}}"""
    user = f"Title: {title}\n\nSummary excerpt:\n{summary_excerpt[:4000]}"
    raw = litellm(CLASSIFY_MODEL, sys_prompt, user, max_tokens=250, temperature=0.1)
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        log(f"classify: could not parse LLM output: {cleaned[:200]}")
        return None, []
    primary = data.get("primary_tag")
    secondary = [t for t in (data.get("secondary_tags") or []) if isinstance(t, str)]
    return primary, secondary


def resolve_folder(primary_tag: str | None) -> str | None:
    if not primary_tag or not CONFIG_PATH.exists():
        return None
    text = CONFIG_PATH.read_text(encoding="utf-8")
    section = text.split("## Tag to Folder Mapping", 1)
    if len(section) < 2:
        return None
    mapping = {}
    for line in section[1].splitlines():
        m = re.match(r"\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|", line)
        if m:
            mapping[m.group(1).strip()] = m.group(2).strip()
    folder = mapping.get(primary_tag)
    if folder and (PROJECTS_ROOT / folder).is_dir():
        return folder
    return None


def build_markdown(title: str, transcript: str, summary: str, tags: list[str],
                   project_folder: str | None, source_filename: str, duration_s: float | None) -> tuple[str, str]:
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    duration_mins = round(duration_s / 60, 1) if duration_s else None

    fm_tags = ["voice-note", "plaud", "local-drop"] + [t for t in tags if t]
    frontmatter = ["---",
                   f'title: "{title.replace(chr(34), chr(39))}"',
                   f"date: {date_str}",
                   f"time: {time_str}",
                   f"source: automagic-drop",
                   f"source_file: {source_filename}",
                   f"tags: [{', '.join(fm_tags)}]"]
    if project_folder:
        frontmatter.append(f"project_folder: {project_folder}")
    if duration_mins is not None:
        frontmatter.append(f"duration_mins: {duration_mins}")
    frontmatter.append("---")
    body = (
        "\n".join(frontmatter)
        + f"\n\n# {title}\n\n"
        + summary
        + "\n\n## Full transcript\n\n"
        + transcript.strip()
        + "\n"
    )
    filename = f"{date_str} {time_str.replace(':', '')} {title}.md"
    return filename, body


def notify_wf2(filepath: str, title: str, tags: list[str], project_folder: str | None, summary: str) -> None:
    try:
        requests.post(
            WF2_WEBHOOK,
            json={
                "source": "automagic-drop",
                "filepath": filepath,
                "title": title,
                "tags": tags,
                "project_folder": project_folder,
                "executive_summary": summary.split("## Key points")[0].replace("## Executive summary", "").strip()[:2000],
            },
            timeout=30,
        )
    except Exception as e:
        log(f"wf2 webhook failed (non-fatal): {e}")


def ffprobe_duration(audio: Path) -> float | None:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "json", str(audio)],
            capture_output=True, text=True, timeout=30,
        )
        if r.returncode == 0:
            return float(json.loads(r.stdout)["format"]["duration"])
    except Exception:
        pass
    return None


def process_one(audio: Path) -> None:
    log(f"start: {audio.name}")
    duration = ffprobe_duration(audio)
    transcript = transcribe(audio)
    if not transcript.strip():
        raise RuntimeError("Whisper returned empty transcript")
    log(f"transcript: {len(transcript)} chars")

    summary = summarise(transcript)
    log("summary done")

    title = fix_title(transcript, audio.stem)
    log(f"title: {title!r}")

    summary_excerpt = "\n".join(summary.splitlines()[:60])
    primary_tag, secondary_tags = classify(title, summary_excerpt)
    log(f"tags: primary={primary_tag} secondary={secondary_tags}")

    folder = resolve_folder(primary_tag)
    log(f"folder: {folder or '(root)'}")

    tags = [t for t in ([primary_tag] if primary_tag else []) + secondary_tags if t]
    filename, body = build_markdown(title, transcript, summary, tags, folder, audio.name, duration)

    out_dir = (PROJECTS_ROOT / folder) if folder else NOTES_ROOT
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    out_path.write_text(body, encoding="utf-8")
    log(f"wrote: {out_path}")

    rel = out_path.relative_to(NOTES_ROOT).as_posix()
    notify_wf2(rel, title, tags, folder, summary)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    dest = PROCESSED_DIR / audio.name
    shutil.move(str(audio), str(dest))
    log(f"moved drop → {dest}")

    sidecar = dest.with_suffix(dest.suffix + ".result.json")
    try:
        sidecar.write_text(json.dumps({
            "markdownPath": rel,
            "title": title,
            "projectFolder": folder,
            "tags": tags,
            "finishedAt": datetime.now().isoformat(timespec="seconds"),
        }), encoding="utf-8")
    except Exception as e:
        log(f"sidecar write failed (non-fatal): {e}")


def main() -> int:
    if not acquire_lock():
        log("another run in progress; exiting")
        return 0
    try:
        drop = next_drop()
        if not drop:
            return 0
        try:
            process_one(drop)
            return 0
        except Exception as e:
            log(f"FAIL: {e}")
            ERRORED_DIR.mkdir(parents=True, exist_ok=True)
            try:
                shutil.move(str(drop), str(ERRORED_DIR / drop.name))
                (ERRORED_DIR / f"{drop.name}.error.txt").write_text(f"{datetime.now().isoformat()}\n{e}\n", encoding="utf-8")
            except Exception as move_err:
                log(f"could not move to _errored: {move_err}")
            return 1
    finally:
        release_lock()


if __name__ == "__main__":
    sys.exit(main())
