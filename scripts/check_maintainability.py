#!/usr/bin/env python3
"""
OPERO Self-Contained Code Maintainability, UI Token & Security Hygiene Linter.
Runs identically on local workstations and GitHub Actions runners with zero external deps.
"""

import argparse
import os
from pathlib import Path
import re
import sys
from typing import Dict, List

IGNORED_DIRS = {
    ".git", "node_modules", "dist", "build", "target", ".venv", "venv",
    "__pycache__", "dist-installers", "test-results", "playwright-report", "gen",
}
SOURCE_EXTS = {".rs", ".ts", ".tsx", ".js", ".jsx", ".py"}
UI_EXTS = {".tsx", ".jsx", ".html"}

EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001F6FF\U0001F900-\U0001F9FF\U0001F600-\U0001F64F\U00002702-\U000027B0]"
)
INTERACTIVE_RE = re.compile(r"<(button|a|h[1-6]|nav)[^>]*>(.*?)</\1>", re.IGNORECASE | re.DOTALL)
BUTTON_RE = re.compile(r"<button\b([^>]*)>", re.IGNORECASE)
SLOP_RULES = [
    (re.compile(r"img\.shields\.io"), "Decorative shields.io badge violates anti-slop rule"),
    (re.compile(r"bg-gradient-to-r\s+from-purple-500", re.IGNORECASE), "Neon purple gradient violates OPERO 3-color palette"),
    (re.compile(r"//\s*set\s+\w+\s+to\s+(?:true|false)", re.IGNORECASE), "Obvious restatement comment detected"),
]
SECRET_RE = re.compile(r"(?:api_key|secret_key|password)\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]", re.IGNORECASE)


def audit_repo(root: Path) -> Dict[str, object]:
    violations: List[str] = []
    warnings: List[str] = []
    scanned = 0

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
        for fname in filenames:
            fpath = Path(dirpath) / fname
            rel = str(fpath.relative_to(root))
            ext = fpath.suffix.lower()
            if ext not in SOURCE_EXTS and ext not in UI_EXTS:
                continue
            text = fpath.read_text(encoding="utf-8", errors="ignore")
            lines = text.splitlines()
            scanned += 1

            # 1. 500-line physical source ceiling
            if ext in SOURCE_EXTS:
                if len(lines) > 500:
                    violations.append(f"[LINE-CEILING] {rel}: {len(lines)} lines (> 500)")
                elif len(lines) > 350:
                    warnings.append(f"[LINE-WARN] {rel}: {len(lines)} lines (351-500 warning zone)")

            # 2. Anti-slop & secret checks (skip self linter & test fixtures)
            if not rel.startswith("tests/") and rel != "scripts/check_maintainability.py":
                for pat, msg in SLOP_RULES:
                    if pat.search(text):
                        violations.append(f"[ANTI-SLOP] {rel}: {msg}")
                if SECRET_RE.search(text):
                    violations.append(f"[SECRET-RISK] {rel}: Possible hardcoded secret literal")

            # 3. UI token & button semantics audit
            if ext in UI_EXTS and not rel.startswith(".agents/"):
                for m in INTERACTIVE_RE.finditer(text):
                    if EMOJI_RE.search(m.group(2)):
                        line_no = text[:m.start()].count("\n") + 1
                        violations.append(f"[UI-EMOJI] {rel}:{line_no}: Raw emoji inside <{m.group(1)}>")
                for m in BUTTON_RE.finditer(text):
                    if "type=" not in m.group(1).lower():
                        line_no = text[:m.start()].count("\n") + 1
                        violations.append(f"[UI-BUTTON-TYPE] {rel}:{line_no}: <button> missing explicit type attribute")

    return {"scanned": scanned, "warnings": warnings, "violations": violations}


def main() -> int:
    parser = argparse.ArgumentParser(description="OPERO Code Maintainability & Hygiene Linter")
    parser.add_argument("--path", default=".", help="Repository root")
    parser.add_argument("--strict", action="store_true", help="Exit 1 on any violation")
    args = parser.parse_args()

    res = audit_repo(Path(args.path).resolve())
    print(f"=== OPERO Maintainability & Lint Audit ({res['scanned']} files scanned) ===")
    for w in res["warnings"]:
        print(f"  ! {w}")
    if not res["violations"]:
        print("[PASS] Zero maintainability, UI token, anti-slop, or secret violations.")
        return 0

    print(f"[FAIL] Found {len(res['violations'])} violation(s):")
    for v in res["violations"]:
        print(f"  - {v}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
