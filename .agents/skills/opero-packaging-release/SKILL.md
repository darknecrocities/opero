---
name: opero-packaging-release
description: OPERO Desktop Packaging, Tauri 2 Native .dmg/.exe Distribution, Cross-Compilation (cargo-xwin/NSIS), Native Icon Generation, and GitHub Release Governance Skill.
---

# OPERO Desktop Packaging & Release Distribution (`opero-packaging-release`)

> **Scope**: Governs standalone single-binary packaging of `apps/desktop` + `apps/desktop/src-tauri` (embedding `opero-daemon` in-process on `127.0.0.1:4317`), native macOS `.dmg` and Windows `.exe` (NSIS) generation, macOS 27 linker workarounds, and CI/CD release distribution.

---

## 1. Single-Binary Embedded Daemon Architecture

- `apps/desktop/src-tauri/src/lib.rs` spawns `opero_daemon::start_embedded_daemon(app_data_dir, 4317, speech_enabled)` inside Tauri's `setup` hook so end users double-click `OPERO.app` or `OPERO.exe` with zero separate terminal processes.
- SQLite WAL storage (`opero.sqlite3`), managed screenshots, and exports resolve under OS-standard App Data directories (`app.path().app_data_dir()`).
- `apps/desktop/src-tauri/src/main.rs` MUST retain `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` so Windows launches without a console window flash.

---

## 2. Native Icon Pipeline & Platform Metadata

1. Always generate native platform icons from the canonical brand PNG (`assets/images/brand/opero-app-icon-1024.png`):
   ```bash
   python3 scripts/generate_desktop_icons.py
   ```
   Outputs `icon.icns` (macOS Retina via `iconutil`), `icon.ico` (Windows multi-resolution `16..256px` RGBA), and standard PNG sizes in `apps/desktop/src-tauri/icons/`.
2. Keep `apps/desktop/src-tauri/Info.plist` synchronized with `NSScreenCaptureUsageDescription`, `NSAppleEventsUsageDescription`, and opt-in `NSMicrophoneUsageDescription`.

---

## 3. macOS `.dmg` & Windows `.exe` Build Rules

- **macOS 27+ Proc-Macro Linker Fix**: Retain `[profile.release.build-override]` (`opt-level = 0`, `debug = true`) in root `Cargo.toml` to prevent `ld_prime` `mis-aligned LINKEDIT string pool` errors on proc-macro `.dylib` crates during release builds while keeping the OPERO binary fully optimized.
- **macOS Local Build & Verification**:
  ```bash
  pnpm --filter @opero/desktop tauri:build:dmg
  hdiutil verify dist-installers/OPERO_1.0.0_aarch64.dmg
  codesign --verify --deep --strict --verbose=2 target/release/bundle/macos/OPERO.app
  plutil -lint target/release/bundle/macos/OPERO.app/Contents/Info.plist
  ```
- **Windows `.exe` Cross-Compilation on macOS**:
  - Requires `nsis` (`makensis`), `llvm` (`lld-link`), `rustup target add x86_64-pc-windows-msvc`, and `cargo-xwin`.
  - Build command:
    ```bash
    PATH="$HOME/.cargo/bin:/opt/homebrew/opt/llvm/bin:$PATH" \
      pnpm --filter @opero/desktop tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
    ```
- **CI/CD Distribution**: Pushing a `v*` tag triggers `.github/workflows/release-distribution.yml`, which gates on `check_maintainability.py --strict`, Rust/Vitest tests, native `macos-latest` + `windows-latest` bundles, `SHA256SUMS.txt`, and automatic GitHub Release publishing.
- **Secrets & Artifact Hygiene**: Never commit `dist-installers/`, `.dmg`, `.exe`, or signing certificates (`*.p12`, `*.pfx`) to Git (`[SEC-003]`).
