#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== [CI-1/5] Workflow YAML & pnpm/action-setup Conflict Audit ==="
python3 - <<'PY'
from pathlib import Path
import sys

wf_dir = Path(".github/workflows")
errors = []
for wf in sorted(wf_dir.glob("*.yml")):
    text = wf.read_text(encoding="utf-8")
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if "pnpm/action-setup@v4" in line:
            for nxt in lines[i + 1 : i + 5]:
                if nxt.lstrip().startswith("- "):
                    break
                if nxt.lstrip().startswith("version:"):
                    errors.append(f"{wf}:{i+1} specifies pnpm version alongside packageManager in package.json")
if errors:
    for e in errors:
        print(f"[FAIL] {e}", file=sys.stderr)
    sys.exit(1)
print(f"[PASS] Audited {len(list(wf_dir.glob('*.yml')))} workflow files — zero pnpm/action-setup conflicts.")
PY

echo "=== [CI-2/5] Maintainability, Secrets Hygiene & UI Token Lint ==="
python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --verify
python3 scripts/check_maintainability.py --strict
node --check assets/images/mascot/pero-motions/studio/*.js

echo "=== [CI-3/5] Rust Workspace Tests & Live Python Daemon Suites ==="
python3 scripts/generate_desktop_icons.py
cargo test --workspace
cargo build --bin opero-daemon
python3 -m unittest discover -s tests -p "test_*.py" -v

echo "=== [CI-4/5] TypeScript Strict Typecheck, Vitest (420 cases) & Production Build ==="
pnpm typecheck
pnpm test:vitest
pnpm --filter @opero/desktop build

echo "=== [CI-5/5] Playwright 4-Viewport E2E (Isolated Loopback Port 4318) ==="
TMP_DATA="$(mktemp -d)"
OPERO_DATA_DIR="$TMP_DATA" OPERO_DAEMON_PORT=4318 ./target/debug/opero-daemon >/tmp/opero-ci-daemon.log 2>&1 &
DAEMON_PID=$!
VITE_OPERO_DAEMON_PORT=4318 pnpm --filter @opero/desktop dev -- --host 127.0.0.1 --port 5173 >/tmp/opero-ci-vite.log 2>&1 &
VITE_PID=$!
trap 'kill $DAEMON_PID $VITE_PID 2>/dev/null || true; rm -rf "$TMP_DATA"' EXIT
for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:4318/api/v1/health >/dev/null && curl -sf http://127.0.0.1:5173 >/dev/null && break
  sleep 0.5
done
pnpm --filter @opero/desktop test:e2e

echo "[PASS] All 5 Local CI Parity Gates passed — safe to push!"
