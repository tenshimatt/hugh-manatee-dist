#!/usr/bin/env python3
"""
Identify which documentation files are relevant for fixing specific test failures
"""

import sys
import re
from pathlib import Path
from typing import List, Set


# Mapping of failure categories to relevant documentation
DOC_MAPPING = {
    "authentication": [
        "docs/api/authentication.md",
        "docs/architecture/security-rules.md"
    ],
    "database": [
        "docs/architecture/database-schema.md",
        "docs/architecture/redis-patterns.md"
    ],
    "api": [
        "docs/api/",  # All API docs
        "docs/architecture/security-rules.md"
    ],
    "frontend": [
        "docs/features/",  # All feature docs
        "docs/testing/test-patterns.md"
    ],
    "validation": [
        "docs/api/",
        "docs/architecture/security-rules.md"
    ],
    "authorization": [
        "docs/api/authentication.md",
        "docs/architecture/security-rules.md"
    ],
    "general": [
        "docs/testing/test-requirements.md",
        "docs/testing/test-patterns.md"
    ]
}

# Keywords to documentation mapping
KEYWORD_MAPPING = {
    "jwt": ["docs/api/authentication.md"],
    "token": ["docs/api/authentication.md"],
    "login": ["docs/api/authentication.md"],
    "pet": ["docs/features/pet-profiles.md"],
    "store": ["docs/api/store-locator.md"],
    "feeding": ["docs/api/feeding-calculator.md"],
    "blog": ["docs/features/blog-platform.md"],
    "chat": ["docs/features/ai-chat.md"],
    "postgres": ["docs/architecture/database-schema.md"],
    "redis": ["docs/architecture/redis-patterns.md"],
    "security": ["docs/architecture/security-rules.md"],
    "selenium": ["docs/testing/test-patterns.md"],
    "click": ["docs/testing/test-patterns.md"],
    "element": ["docs/testing/test-patterns.md"]
}


def extract_failure_info(failures_text: str) -> dict:
    """Extract category and keywords from failure text"""

    lines = failures_text.split('\n')
    category = "general"
    files = []
    keywords = set()

    for line in lines:
        if line.startswith("FAILURE_CATEGORY:"):
            category = line.split(":", 1)[1].strip()
        elif line.startswith("AFFECTED_FILES:"):
            files_str = line.split(":", 1)[1].strip()
            if files_str:
                files = [f.strip() for f in files_str.split(',')]

    # Extract keywords from the failure text
    failure_text_lower = failures_text.lower()
    for keyword in KEYWORD_MAPPING.keys():
        if keyword in failure_text_lower:
            keywords.add(keyword)

    return {
        "category": category,
        "files": files,
        "keywords": keywords,
        "full_text": failures_text
    }


def identify_relevant_docs(failure_info: dict) -> Set[str]:
    """Identify which documentation files should be read"""

    relevant_docs = set()

    # Add docs based on failure category
    category = failure_info["category"]
    if category in DOC_MAPPING:
        for doc_path in DOC_MAPPING[category]:
            if doc_path.endswith("/"):
                # Add all files in directory
                relevant_docs.add(doc_path)
            else:
                relevant_docs.add(doc_path)

    # Add docs based on keywords
    for keyword in failure_info["keywords"]:
        if keyword in KEYWORD_MAPPING:
            relevant_docs.update(KEYWORD_MAPPING[keyword])

    # Add docs based on affected files
    for file_path in failure_info["files"]:
        if "auth" in file_path.lower():
            relevant_docs.add("docs/api/authentication.md")
        elif "store" in file_path.lower():
            relevant_docs.add("docs/api/store-locator.md")
        elif "pet" in file_path.lower():
            relevant_docs.add("docs/features/pet-profiles.md")
        elif "feed" in file_path.lower():
            relevant_docs.add("docs/api/feeding-calculator.md")
        elif "blog" in file_path.lower():
            relevant_docs.add("docs/features/blog-platform.md")
        elif "chat" in file_path.lower():
            relevant_docs.add("docs/features/ai-chat.md")

    # Always include test requirements for any failure
    relevant_docs.add("docs/testing/test-requirements.md")

    return relevant_docs


def expand_directory_paths(doc_paths: Set[str]) -> List[str]:
    """Expand directory paths to individual files"""

    expanded_paths = []

    for doc_path in doc_paths:
        if doc_path.endswith("/"):
            # Find all .md files in directory
            try:
                base_path = Path(".")
                if base_path.exists():
                    doc_dir = base_path / doc_path
                    if doc_dir.exists():
                        for md_file in doc_dir.glob("*.md"):
                            expanded_paths.append(str(md_file))
                    else:
                        # Directory doesn't exist, skip
                        continue
                else:
                    # Add common expected files
                    if "docs/api/" in doc_path:
                        expanded_paths.extend([
                            "docs/api/authentication.md",
                            "docs/api/feeding-calculator.md",
                            "docs/api/store-locator.md"
                        ])
                    elif "docs/features/" in doc_path:
                        expanded_paths.extend([
                            "docs/features/pet-profiles.md",
                            "docs/features/blog-platform.md",
                            "docs/features/ai-chat.md"
                        ])
            except Exception:
                # Fallback to expected structure
                continue
        else:
            expanded_paths.append(doc_path)

    return list(set(expanded_paths))  # Remove duplicates


def prioritize_docs(doc_paths: List[str], failure_info: dict) -> List[str]:
    """Prioritize documentation based on relevance to failure"""

    prioritized = []

    # High priority: exact keyword matches
    for keyword in failure_info["keywords"]:
        for doc_path in doc_paths:
            if keyword in doc_path.lower() and doc_path not in prioritized:
                prioritized.append(doc_path)

    # Medium priority: category matches
    category = failure_info["category"]
    for doc_path in doc_paths:
        if category in doc_path.lower() and doc_path not in prioritized:
            prioritized.append(doc_path)

    # Low priority: everything else
    for doc_path in doc_paths:
        if doc_path not in prioritized:
            prioritized.append(doc_path)

    return prioritized


def main():
    if len(sys.argv) != 2:
        print("Usage: python identify_docs.py <failures.txt>", file=sys.stderr)
        sys.exit(1)

    failures_file = sys.argv[1]

    try:
        with open(failures_file, 'r') as f:
            failures_text = f.read()
    except FileNotFoundError:
        print(f"Error: File {failures_file} not found", file=sys.stderr)
        sys.exit(1)

    # Extract failure information
    failure_info = extract_failure_info(failures_text)

    # Identify relevant documentation
    relevant_docs = identify_relevant_docs(failure_info)

    # Expand directory paths
    doc_paths = expand_directory_paths(relevant_docs)

    # Prioritize by relevance
    prioritized_docs = prioritize_docs(doc_paths, failure_info)

    # Output prioritized list
    for doc_path in prioritized_docs:
        print(doc_path)

    # Log to stderr for debugging
    print(f"Identified {len(prioritized_docs)} relevant documentation files for {failure_info['category']} failure", file=sys.stderr)


if __name__ == "__main__":
    main()