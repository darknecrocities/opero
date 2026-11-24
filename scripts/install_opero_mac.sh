#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DMG_PATH="${1:-$REPO_ROOT/dist-installers/OPERO_1.0.0_aarch64.dmg}"
TARGET_APP="/Applications/OPERO.app"

if [[ ! -f "$DMG_PATH" ]]; then
  echo "[ERROR] DMG not found: $DMG_PATH" >&2
  exit 1
fi

echo "=== [1/5] Stopping any running OPERO instance ==="
osascript -e 'tell application "OPERO" to quit' >/dev/null 2>&1 || true
pkill -x opero-desktop >/dev/null 2>&1 || true
sleep 1

echo "=== [2/5] Unmounting stale OPERO DMG volumes ==="
for vol in /Volumes/OPERO*; do
  if [[ -d "$vol" ]]; then
    hdiutil detach "$vol" -force >/dev/null 2>&1 || true
  fi
done

echo "=== [3/5] Mounting $DMG_PATH and replacing $TARGET_APP ==="
MOUNT_DIR="$(mktemp -d)"
cleanup() {
  hdiutil detach "$MOUNT_DIR" -force >/dev/null 2>&1 || true
  rmdir "$MOUNT_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT

hdiutil attach "$DMG_PATH" -nobrowse -quiet -mountpoint "$MOUNT_DIR"
if [[ ! -d "$MOUNT_DIR/OPERO.app" ]]; then
  echo "[ERROR] OPERO.app missing inside DMG" >&2
  exit 1
fi

if [[ -d "$TARGET_APP" ]]; then
  echo "Detected existing $TARGET_APP — removing old app binary (user SQLite data preserved)..."
  rm -rf "$TARGET_APP"
fi

ditto "$MOUNT_DIR/OPERO.app" "$TARGET_APP"
xattr -dr com.apple.quarantine "$TARGET_APP" >/dev/null 2>&1 || true

echo "=== [4/5] Cleaning duplicate workspace bundle & refreshing LaunchServices ==="
if [[ -d "$REPO_ROOT/target/release/bundle/macos/OPERO.app" ]]; then
  rm -rf "$REPO_ROOT/target/release/bundle/macos/OPERO.app"
fi
mkdir -p "$REPO_ROOT/target/release/bundle"
touch "$REPO_ROOT/target/release/bundle/.metadata_never_index"

LSREG="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if [[ -x "$LSREG" ]]; then
  "$LSREG" -f "$TARGET_APP" >/dev/null 2>&1 || true
fi

echo "=== [5/5] Verifying single OPERO installation ==="
echo "[OK] Installed single clean copy at $TARGET_APP"
