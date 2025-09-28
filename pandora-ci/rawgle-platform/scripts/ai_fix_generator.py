#!/usr/bin/env python3
"""
AI Fix Generator - Documentation-Driven Code Fixes
Only generates fixes from documentation files, never from todo lists or task descriptions
"""

import argparse
import json
import requests
import sys
from pathlib import Path
from typing import Dict, List, Optional


class DocumentationDrivenAI:
    """AI that ONLY writes code from documentation files"""

    def __init__(self, ollama_url: str, model_name: str):
        self.ollama_url = ollama_url
        self.model = model_name

    def generate_fix(self, failure_context: str, documentation: str) -> str:
        """Generate fix based EXCLUSIVELY on documentation"""

        prompt = f"""You are an AI developer that ONLY writes code from documentation files.
NEVER from todo lists, task descriptions, or bug reports.

CRITICAL RULES:
1. You can ONLY generate code that is explicitly described in the documentation
2. If the documentation doesn't specify how something should work, you cannot fix it
3. Never invent functionality not described in docs
4. Always follow the exact specifications in the documentation

DOCUMENTATION PROVIDED:
{documentation}

TEST FAILURE CONTEXT:
{failure_context}

Based EXCLUSIVELY on the documentation above, generate the minimal code changes needed to fix the failing tests.
If the documentation doesn't cover this scenario, respond with "INSUFFICIENT_DOCUMENTATION".

Output the fix as a git-compatible patch file."""

        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1,  # Low temperature for deterministic fixes
                "top_p": 0.9,
                "max_tokens": 4096
            },
            timeout=120
        )

        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code}")

        result = response.json()
        return result.get('response', '')


def parse_test_failures(failures_text: str) -> Dict:
    """Parse test failure output into structured format"""

    failure_info = {
        "failed_tests": [],
        "error_messages": [],
        "affected_files": set()
    }

    # Parse Jest/Mocha style output
    lines = failures_text.split('\n')
    current_test = None

    for line in lines:
        if 'FAIL' in line or '✗' in line:
            current_test = line.strip()
            failure_info["failed_tests"].append(current_test)
        elif 'Error:' in line or 'AssertionError:' in line:
            failure_info["error_messages"].append(line.strip())
        elif '.js' in line or '.ts' in line:
            # Extract file paths
            import re
            files = re.findall(r'[\w/]+\.\w+', line)
            failure_info["affected_files"].update(files)

    failure_info["affected_files"] = list(failure_info["affected_files"])
    return failure_info


def validate_fix(fix_content: str) -> bool:
    """Validate that the AI generated a proper fix"""

    if "INSUFFICIENT_DOCUMENTATION" in fix_content:
        print("ERROR: Documentation doesn't cover this test case")
        return False

    if not fix_content.strip():
        print("ERROR: Empty fix generated")
        return False

    # Check for patch file markers
    patch_markers = ['diff --git', '+++', '---', '@@']
    has_patch_format = any(marker in fix_content for marker in patch_markers)

    if not has_patch_format:
        # Try to convert to patch format if it's raw code
        print("WARNING: Fix not in patch format, attempting conversion...")
        return False

    return True


def create_git_patch(fix_content: str, failure_info: Dict) -> str:
    """Ensure fix is in proper git patch format"""

    if not fix_content.startswith('diff --git'):
        # Wrap raw code changes in patch format
        affected_file = failure_info["affected_files"][0] if failure_info["affected_files"] else "src/unknown.js"

        patch = f"""diff --git a/{affected_file} b/{affected_file}
index 0000000..1111111 100644
--- a/{affected_file}
+++ b/{affected_file}
@@ -1,1 +1,1 @@
{fix_content}"""
        return patch

    return fix_content


def main():
    parser = argparse.ArgumentParser(description='Generate AI fixes from documentation')
    parser.add_argument('--failures', required=True, help='Test failure context')
    parser.add_argument('--documentation', required=True, help='Relevant documentation')
    parser.add_argument('--model', default='qwen2.5-coder:latest', help='Model name')
    parser.add_argument('--ollama-url', default='http://pandora-ollama:11434', help='Ollama API URL')
    parser.add_argument('--output', default=None, help='Output file for patch')

    args = parser.parse_args()

    # Initialize AI
    ai = DocumentationDrivenAI(args.ollama_url, args.model)

    # Parse failures
    failure_info = parse_test_failures(args.failures)

    # Generate fix
    try:
        fix = ai.generate_fix(args.failures, args.documentation)

        if not validate_fix(fix):
            print("ERROR: Invalid fix generated", file=sys.stderr)
            sys.exit(1)

        # Ensure patch format
        patch = create_git_patch(fix, failure_info)

        # Output
        if args.output:
            Path(args.output).write_text(patch)
        else:
            print(patch)

        # Log success
        print(f"Successfully generated fix for {len(failure_info['failed_tests'])} failing tests", file=sys.stderr)

    except Exception as e:
        print(f"ERROR: Failed to generate fix: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()