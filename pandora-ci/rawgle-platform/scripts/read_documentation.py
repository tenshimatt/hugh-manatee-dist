#!/usr/bin/env python3
"""
Read and compile relevant documentation for AI consumption
"""

import sys
from pathlib import Path
from typing import List


def read_documentation_files(doc_list_file: str) -> str:
    """Read all documentation files and compile into single text"""

    try:
        with open(doc_list_file, 'r') as f:
            doc_paths = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: File {doc_list_file} not found", file=sys.stderr)
        sys.exit(1)

    compiled_docs = []
    files_read = 0

    for doc_path in doc_paths:
        doc_file = Path(doc_path)

        if doc_file.exists():
            try:
                content = doc_file.read_text(encoding='utf-8')
                compiled_docs.append(f"""
# Documentation: {doc_path}

{content}

---
""")
                files_read += 1
            except Exception as e:
                print(f"Warning: Could not read {doc_path}: {e}", file=sys.stderr)
        else:
            print(f"Warning: Documentation file not found: {doc_path}", file=sys.stderr)

    if files_read == 0:
        print("Error: No documentation files could be read", file=sys.stderr)
        sys.exit(1)

    print(f"Successfully read {files_read} documentation files", file=sys.stderr)
    return ''.join(compiled_docs)


def main():
    if len(sys.argv) != 2:
        print("Usage: python read_documentation.py <doc_list.txt>", file=sys.stderr)
        sys.exit(1)

    doc_list_file = sys.argv[1]
    documentation = read_documentation_files(doc_list_file)

    # Output combined documentation
    print(documentation)


if __name__ == "__main__":
    main()