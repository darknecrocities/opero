#!/usr/bin/env python3
"""
OPERO Continuous Learning Protocol (CLP) CLI Recorder & Pre-Flight Verifier.
Manages persisted invariants in .agents/learned_conventions.md.
"""
import argparse
import datetime
import pathlib
import re
import sys

VALID_CATEGORIES = {
    "UI": "Design & Styling (`[UI-xxx]`)",
    "ARCH": "System Architecture (`[ARCH-xxx]`)",
    "API": "API & IPC Contracts (`[API-xxx]`)",
    "DATA": "Persistence & Data Schemas (`[DATA-xxx]`)",
    "SEC": "Security & Privacy (`[SEC-xxx]`)",
    "TOOL": "Tooling & Code Quality (`[TOOL-xxx]`)",
}

ENTRY_PATTERN = re.compile(r"^- \*\*\[([A-Z]+)-(\d{3})\] \((\d{4}-\d{2}-\d{2})\)\*\*: (.+)$")


def get_repo_root() -> pathlib.Path:
    return pathlib.Path(__file__).resolve().parents[4]


def get_conventions_path() -> pathlib.Path:
    return get_repo_root() / ".agents" / "learned_conventions.md"


def parse_entries(content: str) -> list[dict]:
    entries = []
    for line in content.splitlines():
        match = ENTRY_PATTERN.match(line.strip())
        if match:
            entries.append({
                "category": match.group(1),
                "number": int(match.group(2)),
                "code": f"{match.group(1)}-{match.group(2)}",
                "date": match.group(3),
                "text": match.group(4).strip(),
            })
    return entries


def list_entries(category_filter: str | None = None) -> int:
    path = get_conventions_path()
    if not path.exists():
        print(f"ERROR: {path} does not exist.", file=sys.stderr)
        return 1
    entries = parse_entries(path.read_text(encoding="utf-8"))
    if category_filter:
        entries = [e for e in entries if e["category"] == category_filter.upper()]
    print(f"OPERO Learned Conventions ({len(entries)} active):")
    for e in entries:
        print(f"  [{e['code']}] ({e['date']}) {e['text']}")
    return 0


def record_entry(category: str, text: str) -> int:
    cat = category.upper()
    if cat not in VALID_CATEGORIES:
        print(f"ERROR: Invalid category '{cat}'. Choose from: {', '.join(VALID_CATEGORIES)}", file=sys.stderr)
        return 1
    clean_text = " ".join(text.strip().split())
    if not clean_text:
        print("ERROR: Convention text cannot be empty.", file=sys.stderr)
        return 1

    path = get_conventions_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    content = path.read_text(encoding="utf-8") if path.exists() else "# OPERO — Learned Conventions & Architectural Invariants\n"
    entries = parse_entries(content)

    for e in entries:
        if e["text"].lower() == clean_text.lower():
            print(f"SKIP: Duplicate convention already recorded as [{e['code']}].")
            return 0

    cat_numbers = [e["number"] for e in entries if e["category"] == cat]
    next_num = (max(cat_numbers) + 1) if cat_numbers else 1
    today = datetime.date.today().isoformat()
    code = f"{cat}-{next_num:03d}"
    new_line = f"- **[{code}] ({today})**: {clean_text}"

    header = f"## {VALID_CATEGORIES[cat]}"
    if header in content:
        lines = content.splitlines()
        insert_idx = len(lines)
        in_section = False
        for idx, line in enumerate(lines):
            if line.strip() == header:
                in_section = True
                insert_idx = idx + 1
            elif in_section and line.startswith("## "):
                insert_idx = idx
                break
            elif in_section and line.strip():
                insert_idx = idx + 1
        lines.insert(insert_idx, new_line)
        updated = "\n".join(lines) + "\n"
    else:
        updated = content.rstrip() + f"\n\n{header}\n\n{new_line}\n"

    path.write_text(updated, encoding="utf-8")
    print(f"RECORDED: [{code}] ({today}) -> {clean_text}")
    return 0


def verify_workspace() -> int:
    root = get_repo_root()
    conv_path = get_conventions_path()
    gitignore_path = root / ".gitignore"
    env_example_path = root / ".env.example"
    errors = []

    if not conv_path.exists():
        errors.append("Missing .agents/learned_conventions.md")
    else:
        entries = parse_entries(conv_path.read_text(encoding="utf-8"))
        if len(entries) < 5:
            errors.append(f"Expected >= 5 baseline conventions, found {len(entries)}")

    if not gitignore_path.exists():
        errors.append("Missing .gitignore at repository root")
    else:
        gi_text = gitignore_path.read_text(encoding="utf-8")
        for pattern in (".env", "!.env.example", "*.sqlite", "*.gguf"):
            if pattern not in gi_text:
                errors.append(f".gitignore missing required rule: {pattern}")

    if not env_example_path.exists():
        errors.append("Missing .env.example at repository root")

    if errors:
        for err in errors:
            print(f"FAIL: {err}", file=sys.stderr)
        return 1

    print(f"PASS: OPERO Continuous Learning & Repo Hygiene verified ({len(entries)} invariants active).")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="OPERO Continuous Learning Protocol CLI")
    parser.add_argument("--category", choices=list(VALID_CATEGORIES.keys()), help="Invariant category code")
    parser.add_argument("--text", help="Learned convention text to persist")
    parser.add_argument("--list", action="store_true", help="List recorded conventions")
    parser.add_argument("--verify", action="store_true", help="Verify CLP and secrets hygiene")
    args = parser.parse_args()

    if args.verify:
        return verify_workspace()
    if args.list:
        return list_entries(args.category)
    if args.category and args.text:
        return record_entry(args.category, args.text)
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
