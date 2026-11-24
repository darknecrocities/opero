#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== [1/7] OPERO Learned Conventions & Secrets Hygiene ==="
python3 "$ROOT_DIR/.agents/skills/opero-continuous-learning/scripts/record_learning.py" --verify

echo "=== [2/7] 500-Line Physical Source Ceiling ==="
python3 /Users/arronkianparejas/.gemini/config/plugins/skill-builder/skills/world-class-engineering/scripts/check_source_line_limits.py --path "$ROOT_DIR" --show-tiers

echo "=== [3/7] UI Tokens, Button Semantics & Zero Raw Emoji Audit ==="
python3 /Users/arronkianparejas/.gemini/config/plugins/skill-builder/skills/ui/scripts/verify_ui_tokens.py --path "$ROOT_DIR" --strict

echo "=== [4/7] Pero Motion Studio JS Syntax Verification ==="
node --check "$ROOT_DIR/assets/images/mascot/pero-motions/studio/"*.js

echo "=== [5/7] Rust Core, OS Permissions FFI, Dual-Core RAG & Export Tests ==="
cargo test --workspace
cargo build --bin opero-daemon

echo "=== [6/7] TypeScript Strict Typecheck, Vitest Suites (420 cases) & Desktop Build ==="
pnpm typecheck
pnpm test:vitest
pnpm --filter @opero/desktop build

echo "=== [7/7] Live Rust Daemon Integration & Security Suites (Python unittest) ==="
python3 -m unittest discover -s "$ROOT_DIR/tests" -p "test_*.py" -v

echo "[PASS] All 7 OPERO verification gates passed."
