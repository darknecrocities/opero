<p align="center">
  <img src="assets/images/brand/opero-app-icon.svg" alt="OPERO Official App Icon" width="84" height="84" />
</p>

# OPERO — Your workflow. Automatically documented.

**OPERO** is a local-first AI desktop workflow documentation platform built as an internship project by **Arron Kian Parejas** for **Man Machine Interface Inc. (MMI / 株式会社マンマシンインターフェース)**.

An employee explicitly starts a recording session, performs a normal desktop procedure, and stops the session. OPERO captures time-linked screenshots and interaction metadata locally, extracts UI labels via OS Accessibility and OCR, reconstructs logical workflow steps, grounds drafting in an embedded Dual-Core Vector RAG memory, and produces an editable, illustrated manual ready for trilingual review (`en-US`, `ja-JP`, `fil-PH`) and offline export (`PDF`, `DOCX`, `HTML`, `Markdown`)—with **zero mandatory cloud AI dependency**.

---

## Core Architectural Principles

1. **Evidence Before Generated Prose**: Raw screenshots, timestamps, and extracted UI labels remain immutable; every drafted step cites `event_refs` and `screenshot_refs` or raises a `needs_review` flag.
2. **Local-First & Capture Independent of Inference**: Recording sessions persist evidence reliably in SQLite (`WAL` mode) even when local LLM runtimes (`Ollama` / `llama.cpp`) are stopped or unavailable.
3. **Human Approval Before Publication**: All AI drafts and translations start in `draft` or `needs_review` state and require explicit human verification before approved distribution.
4. **OS-Level Native Privacy & Redaction**: Explicit user-initiated recording, configurable excluded apps (`1Password`, `Bitwarden`, `Keychain Access`, `KeePassXC`), zero default raw keystroke/password capture, and irreversible `#0F172A` pixel redaction on exported artifacts.
5. **First-Class Trilingual Architecture**: Native BCP-47 `ContentVariant` modeling for English (`en-US`), Japanese (`ja-JP`), and Filipino (`fil-PH`) with MMI protected glossaries and strict `fil-PH` vs `tl` adapter isolation.

---

## Workspace & Technology Architecture

| Layer | Directory / Crate | Responsibilities |
| :--- | :--- | :--- |
| **Desktop UI** | `apps/desktop` | React 19 + TypeScript + Vite Voxt-inspired Dual-Sidebar Workspace, 3-Pane OPERO Studio, 7 non-destructive annotations, White (`#FFFFFF`) / Light Blue (`#69BCFC`) / Black (`#0F172A`) Cupertino Liquid Glass theme. |
| **Native Shell** | `apps/desktop/src-tauri` | Tauri 2 native desktop binary embedding `opero-daemon` in-process on `127.0.0.1:4317`, `Info.plist`, `Entitlements.plist`, and `.dmg` / `.exe` (NSIS) bundlers. |
| **Rust Core** | `crates/opero-core` | SQLite WAL migrations, macOS (`CoreGraphics` / `ApplicationServices` TCC FFI) & Windows (`GraphicsCaptureAccess` / UIPI) native permissions, capture + 64-bit dHash dedup, 9-stage OCR/AI pipeline, and lightweight **Dual-Core Vector RAG** (`Core 1 Episodic` + `Core 2 Semantic`, `384-dim int8` + `FTS5` RRF `< 8 MB` RAM). |
| **Export Engine** | `crates/opero-export` | Irreversible pixel redaction (`#0F172A` burn-in) + deterministic offline `PDF`, `DOCX` (OOXML ZIP), accessible `HTML`, and `Markdown` writers. |
| **Loopback API** | `crates/opero-daemon` | Local-only `127.0.0.1:4317` Axum service with RFC 7807 Problem Details, `X-Correlation-ID`, `100 KB` payload limit, and CORS origin lock. |
| **Shared Packages** | `packages/*` | `@opero/shared-types`, `@opero/document-schema`, `@opero/i18n`, `@opero/jiggicons` (64 MIT 120 Hz spring icons), and `@opero/mascot` (frameless 20-motion Pero companion + 11-bone 4-DOF rig bounds). |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js `>= 22`, `pnpm 12`, Rust `>= 1.85` (`cargo`), Python `>= 3.11` (with `Pillow`), and optional `tesseract` / `ollama`.

### 1. Environment Configuration
Copy `.env.example` to `.env` (never commit `.env`, SQLite databases, or model weights):

```bash
cp .env.example .env
pnpm install
```

### 2. Run Locally (Two-Terminal Dev Mode)

```bash
# Terminal 1 — Start the local Rust SQLite WAL + OS Permissions + Dual-Core RAG daemon
cargo run --bin opero-daemon

# Terminal 2 — Launch the Dual-Sidebar Desktop UI at http://127.0.0.1:5173
pnpm dev
```

### 3. Build Standalone Native Installers (`.dmg` & `.exe`)

```bash
# Generate macOS (.icns) & Windows (.ico) icon sets + build installers into dist-installers/
bash scripts/build_installers.sh
```

---

## Verification, Linting & Code Maintainability

```bash
# Run self-contained maintainability, 500-line ceiling, UI token & secret-leak linter
python3 scripts/check_maintainability.py --strict

# Run Rust tests, TypeScript strict check, 420 Vitest cases & live daemon integration/stress suites
bash scripts/verify_all_skills.sh

# Run Playwright 4-viewport E2E tests (375px, 768px, 1280px, 1920px)
pnpm --filter @opero/desktop test:e2e
```

---

## Project Governance & Custom Agent Skills

- **Contributing & PR Standards**: See [CONTRIBUTING.md](CONTRIBUTING.md) and `.github/PULL_REQUEST_TEMPLATE.md`.
- **Workspace Agent Rules & Custom Skills**: See [AGENTS.md](AGENTS.md) and `.agents/skills/` (`opero`, `opero-design-system`, `opero-local-ai-speech`, `opero-continuous-learning`, `opero-packaging-release`, `opero-dual-core-rag-permissions`).
- **License**: Released under the **MIT License** (English & Japanese `日本語参考訳`) in [LICENSE](LICENSE) — developed by **Arron Kian Parejas** for the **Man Machine Interface Inc. (MMI) Internship Program**.
