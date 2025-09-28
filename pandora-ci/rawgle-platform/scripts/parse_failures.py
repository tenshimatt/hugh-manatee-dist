#!/usr/bin/env python3
"""
Parse test failures and extract meaningful context for AI fixing
"""

import json
import sys
import re
from typing import Dict, List


def parse_jest_failures(test_results: Dict) -> str:
    """Parse Jest test results JSON format"""

    failure_context = []

    if "testResults" in test_results:
        for test_file in test_results["testResults"]:
            if test_file.get("status") == "failed":
                file_path = test_file.get("name", "unknown")
                failure_context.append(f"FAILED FILE: {file_path}")

                for assertion in test_file.get("assertionResults", []):
                    if assertion.get("status") == "failed":
                        test_name = assertion.get("fullName", "unknown test")
                        failure_context.append(f"FAILED TEST: {test_name}")

                        # Get failure message
                        failure_messages = assertion.get("failureMessages", [])
                        for msg in failure_messages:
                            # Clean up stack traces and focus on the error
                            lines = msg.split('\n')
                            error_line = lines[0] if lines else msg
                            failure_context.append(f"ERROR: {error_line}")

    return '\n'.join(failure_context)


def parse_mocha_failures(test_results: Dict) -> str:
    """Parse Mocha test results format"""

    failure_context = []

    if "failures" in test_results:
        for failure in test_results["failures"]:
            test_title = failure.get("title", "unknown test")
            error_message = failure.get("err", {}).get("message", "")

            failure_context.append(f"FAILED TEST: {test_title}")
            failure_context.append(f"ERROR: {error_message}")

    return '\n'.join(failure_context)


def parse_selenium_failures(test_results: Dict) -> str:
    """Parse Selenium/WebDriver test failures"""

    failure_context = []

    # Look for common Selenium error patterns
    if "message" in test_results:
        message = test_results["message"]

        # Extract meaningful error info
        if "element not found" in message.lower():
            failure_context.append("SELENIUM ERROR: Element not found - selector may be wrong")
        elif "timeout" in message.lower():
            failure_context.append("SELENIUM ERROR: Timeout - page may not be loading correctly")
        elif "click" in message.lower():
            failure_context.append("SELENIUM ERROR: Click failed - element may not be clickable")
        else:
            failure_context.append(f"SELENIUM ERROR: {message}")

    return '\n'.join(failure_context)


def extract_file_references(failure_text: str) -> List[str]:
    """Extract file paths and line numbers from failure text"""

    # Regex patterns for common file references
    patterns = [
        r'at .+ \((.+):(\d+):(\d+)\)',  # Stack trace format
        r'(.+\.(?:js|ts|jsx|tsx)):(\d+):(\d+)',  # File:line:column
        r'in (.+\.(?:js|ts|jsx|tsx))',  # "in filename"
    ]

    files = set()
    for pattern in patterns:
        matches = re.findall(pattern, failure_text)
        for match in matches:
            if isinstance(match, tuple):
                files.add(match[0])
            else:
                files.add(match)

    return list(files)


def categorize_failure_type(failure_text: str) -> str:
    """Categorize the type of failure to help with documentation selection"""

    failure_lower = failure_text.lower()

    if any(keyword in failure_lower for keyword in ['authentication', 'auth', 'login', 'jwt', 'token']):
        return "authentication"
    elif any(keyword in failure_lower for keyword in ['database', 'sql', 'postgres', 'query']):
        return "database"
    elif any(keyword in failure_lower for keyword in ['api', 'endpoint', 'request', 'response']):
        return "api"
    elif any(keyword in failure_lower for keyword in ['ui', 'element', 'click', 'form', 'button']):
        return "frontend"
    elif any(keyword in failure_lower for keyword in ['validation', 'schema', 'required']):
        return "validation"
    elif any(keyword in failure_lower for keyword in ['permission', 'access', 'forbidden']):
        return "authorization"
    else:
        return "general"


def main():
    if len(sys.argv) != 2:
        print("Usage: python parse_failures.py <test_results.json>", file=sys.stderr)
        sys.exit(1)

    results_file = sys.argv[1]

    try:
        with open(results_file, 'r') as f:
            test_results = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {results_file} not found", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {results_file}: {e}", file=sys.stderr)
        sys.exit(1)

    # Try different parsing strategies based on test framework
    failure_context = ""

    # Jest format
    if "testResults" in test_results:
        failure_context = parse_jest_failures(test_results)

    # Mocha format
    elif "failures" in test_results:
        failure_context = parse_mocha_failures(test_results)

    # Generic format
    elif "message" in test_results:
        failure_context = parse_selenium_failures(test_results)

    # Fallback - try to extract any meaningful info
    else:
        failure_context = json.dumps(test_results, indent=2)[:500]  # First 500 chars

    if failure_context:
        # Add metadata
        files = extract_file_references(failure_context)
        category = categorize_failure_type(failure_context)

        output = f"""FAILURE_CATEGORY: {category}
AFFECTED_FILES: {', '.join(files)}

{failure_context}"""

        print(output)
    else:
        print("No test failures found in results", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()