#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist-installers"
mkdir -p "$OUT_DIR"

echo "=== [1/4] Generating Native macOS (.icns) & Windows (.ico) Icons ==="
python3 "$ROOT_DIR/scripts/generate_desktop_icons.py"

echo "=== [2/4] Building Production Frontend Bundle ==="
pnpm --filter @opero/desktop build

echo "=== [3/4] Building Native macOS .app & .dmg Installer ==="
pnpm --filter @opero/desktop tauri:build:dmg

MAC_DMG=$(find "$ROOT_DIR/target/release/bundle/dmg" -name "*.dmg" -maxdepth 2 2>/dev/null | head -n 1 || true)
if [ -n "$MAC_DMG" ]; then
  cp "$MAC_DMG" "$OUT_DIR/"
  echo "[OK] Copied macOS DMG -> $OUT_DIR/$(basename "$MAC_DMG")"
  hdiutil verify "$OUT_DIR/$(basename "$MAC_DMG")"
fi

# Prevent macOS Spotlight / LaunchServices from registering a duplicate OPERO.app inside target/
if [ -d "$ROOT_DIR/target/release/bundle/macos/OPERO.app" ]; then
  rm -rf "$ROOT_DIR/target/release/bundle/macos/OPERO.app"
fi
mkdir -p "$ROOT_DIR/target/release/bundle"
touch "$ROOT_DIR/target/release/bundle/.metadata_never_index"

echo "=== [4/4] Building Windows .exe (NSIS) Installer (if cross-toolchain available) ==="
if command -v makensis >/dev/null 2>&1 && command -v cargo-xwin >/dev/null 2>&1; then
  pnpm --filter @opero/desktop tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
  WIN_EXE=$(find "$ROOT_DIR/target/x86_64-pc-windows-msvc/release/bundle/nsis" -name "*.exe" -maxdepth 2 2>/dev/null | head -n 1 || true)
  if [ -n "$WIN_EXE" ]; then
    cp "$WIN_EXE" "$OUT_DIR/"
    echo "[OK] Copied Windows EXE -> $OUT_DIR/$(basename "$WIN_EXE")"
  fi
else
  echo "[INFO] Windows cross-toolchain (makensis + cargo-xwin) not present on host; use .github/workflows/release-installers.yml for native MSVC .exe."
fi

(cd "$OUT_DIR" && shasum -a 256 * > SHA256SUMS.txt 2>/dev/null || true)
ls -lh "$OUT_DIR"
