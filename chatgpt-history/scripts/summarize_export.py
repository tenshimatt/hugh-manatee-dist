#!/usr/bin/env python3
import csv
import json
import re
import sys
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class Message:
    role: str
    text: str
    created_at: float | None = None


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    return ""


def flatten_content(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        return "\n".join(part for part in [flatten_content(v).strip() for v in value] if part)
    if isinstance(value, dict):
        if isinstance(value.get("parts"), list):
            return flatten_content(value["parts"])
        for key in ("text", "content", "result", "title", "summary"):
            if isinstance(value.get(key), str):
                return value[key]
        out = []
        for nested in value.values():
            text = flatten_content(nested).strip()
            if text:
                out.append(text)
        return "\n".join(out)
    return ""


def slugify(value: str, max_len: int = 80) -> str:
    text = re.sub(r"[^A-Za-z0-9]+", "-", value.lower()).strip("-")
    text = re.sub(r"-+", "-", text)
    return (text or "untitled")[:max_len].rstrip("-")


def iso_datetime(ts: float | None) -> str:
    if ts is None:
        return "unknown"
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def iso_date(ts: float | None) -> str:
    if ts is None:
        return "unknown-date"
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")


def read_input(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path, "r") as zf:
            with zf.open("conversations.json") as fh:
                payload = json.load(fh)
    else:
        payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and isinstance(payload.get("conversations"), list):
        payload = payload["conversations"]
    if not isinstance(payload, list):
        raise ValueError("Expected a list of conversations")
    return payload


def extract_messages(conv: dict[str, Any]) -> list[Message]:
    mapping = conv.get("mapping") or {}
    if not isinstance(mapping, dict):
        return []
    sortable = []
    for node in mapping.values():
        if not isinstance(node, dict):
            continue
        message = node.get("message")
        if not isinstance(message, dict):
            continue
        role = safe_text((message.get("author") or {}).get("role") or message.get("role") or "unknown")
        text = flatten_content(message.get("content")).strip()
        if not text:
            continue
        created = message.get("create_time") or node.get("create_time") or conv.get("update_time") or 0
        sortable.append((float(created or 0), Message(role=role, text=text, created_at=float(created or 0))))
    sortable.sort(key=lambda item: item[0])
    deduped = []
    prev = None
    for _, msg in sortable:
        key = (msg.role, msg.text)
        if key == prev:
            continue
        prev = key
        deduped.append(msg)
    return deduped


def summarize(title: str, messages: list[Message]) -> str:
    users = [m.text for m in messages if m.role == "user"]
    assistants = [m.text for m in messages if m.role == "assistant"]
    first_user = users[0] if users else ""
    last_assistant = assistants[-1] if assistants else ""
    return (
        f"Title: {title}. "
        f"Conversation contains {len(messages)} messages. "
        f"It starts with: {first_user[:220].replace(chr(10), ' ')} "
        f"It ends with: {last_assistant[:220].replace(chr(10), ' ')}"
    ).strip()


def write_outputs(conversations: list[dict[str, Any]], output_dir: Path) -> None:
    summaries_dir = output_dir / "summaries"
    transcripts_dir = output_dir / "transcripts"
    summaries_dir.mkdir(parents=True, exist_ok=True)
    transcripts_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    index_lines = [
        "# ChatGPT Conversation Summaries",
        "",
        "| Updated | Title | Messages | Summary | Transcript |",
        "|---|---|---:|---|---|",
    ]

    for i, conv in enumerate(conversations, start=1):
        conv_id = safe_text(conv.get("id") or f"conversation-{i}")
        title = safe_text(conv.get("title") or "Untitled conversation").strip() or "Untitled conversation"
        updated = float(conv.get("update_time") or conv.get("create_time") or 0)
        messages = extract_messages(conv)
        if not messages:
            continue

        stem = f"{iso_date(updated)}__{slugify(title)}__{slugify(conv_id, 12)}"
        summary_rel = Path("summaries") / f"{stem}.md"
        transcript_rel = Path("transcripts") / f"{stem}.md"

        summary_path = output_dir / summary_rel
        transcript_path = output_dir / transcript_rel

        summary_md = "\n".join([
            f"# {title}",
            "",
            "## Overview",
            summarize(title, messages),
            "",
            "## Metadata",
            f"- Conversation ID: `{conv_id}`",
            f"- Updated: {iso_datetime(updated)}",
            f"- Message count: {len(messages)}",
            "",
        ]) + "\n"

        transcript_lines = [
            f"# {title}",
            "",
            f"- Conversation ID: `{conv_id}`",
            f"- Updated: {iso_datetime(updated)}",
            f"- Message count: {len(messages)}",
            "",
        ]
        for n, msg in enumerate(messages, start=1):
            transcript_lines.extend([
                f"## {n}. {msg.role.capitalize()}",
                "",
                msg.text,
                "",
            ])
        transcript_md = "\n".join(transcript_lines)

        summary_path.write_text(summary_md, encoding="utf-8")
        transcript_path.write_text(transcript_md, encoding="utf-8")

        rows.append([
            conv_id,
            title,
            iso_datetime(updated),
            len(messages),
            str(summary_rel).replace("\\", "/"),
            str(transcript_rel).replace("\\", "/"),
        ])
        index_lines.append(
            f"| {iso_date(updated)} | {title.replace('|', '\\|')} | {len(messages)} | [summary]({str(summary_rel).replace('\\', '/')}) | [transcript]({str(transcript_rel).replace('\\', '/')}) |"
        )

    (output_dir / "index.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    with (output_dir / "summary.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["conversation_id", "title", "updated_at", "message_count", "summary_path", "transcript_path"])
        writer.writerows(rows)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: summarize_export.py <input.zip|conversations.json> <output_dir>", file=sys.stderr)
        return 2
    input_path = Path(sys.argv[1]).expanduser().resolve()
    output_dir = Path(sys.argv[2]).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    conversations = read_input(input_path)
    write_outputs(conversations, output_dir)
    print(f"Generated summaries into {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
