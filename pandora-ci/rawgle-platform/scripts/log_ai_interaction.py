#!/usr/bin/env python3
"""
Log AI interactions for analysis and improvement
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


def log_interaction(prompt_file: str, response_file: str, timestamp: int) -> dict:
    """Log AI prompt/response for analysis"""

    try:
        prompt = Path(prompt_file).read_text() if Path(prompt_file).exists() else ""
        response = Path(response_file).read_text() if Path(response_file).exists() else ""
    except Exception as e:
        print(f"Error reading files: {e}", file=sys.stderr)
        sys.exit(1)

    interaction_data = {
        "timestamp": timestamp,
        "iso_timestamp": datetime.fromtimestamp(timestamp).isoformat(),
        "prompt": prompt,
        "response": response,
        "prompt_length": len(prompt),
        "response_length": len(response),
        "success": "INSUFFICIENT_DOCUMENTATION" not in response
    }

    # Save to log file
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / f"ai_interaction_{timestamp}.json"
    log_file.write_text(json.dumps(interaction_data, indent=2))

    print(f"Logged interaction to {log_file}", file=sys.stderr)
    return interaction_data


def main():
    parser = argparse.ArgumentParser(description='Log AI interactions')
    parser.add_argument('--prompt', required=True, help='Prompt file')
    parser.add_argument('--response', required=True, help='Response file')
    parser.add_argument('--timestamp', required=True, type=int, help='Unix timestamp')

    args = parser.parse_args()

    interaction_data = log_interaction(args.prompt, args.response, args.timestamp)

    # Output summary for pipeline
    print(json.dumps({
        "logged": True,
        "timestamp": args.timestamp,
        "success": interaction_data["success"]
    }))


if __name__ == "__main__":
    main()