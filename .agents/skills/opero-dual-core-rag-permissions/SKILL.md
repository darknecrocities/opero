---
name: opero-dual-core-rag-permissions
description: OPERO SQLite-Embedded Dual-Core Vector RAG Memory (Episodic + Semantic RRF < 8 MB RAM) and Native OS-Level Device Permission FFI (macOS TCC CoreGraphics/ApplicationServices & Windows GraphicsCaptureAccess/UIPI) Engineering Skill.
---

# OPERO Dual-Core Vector RAG & Native OS Permissions (`opero-dual-core-rag-permissions`)

> **Scope**: Governs `crates/opero-core/src/memory/` (lightweight local Dual-Core RAG inside `opero.sqlite3`) and `crates/opero-core/src/permissions/` (direct OS-level device permission probing, prompting, and settings deep-linking).

---

## 1. Lightweight Dual-Core Vector RAG Invariants (`[DATA-004]`)

- **Single-File Zero-Daemon Design**: Never introduce external Docker/Python vector databases (Chroma, Qdrant, Milvus). All memory lives inside `opero.sqlite3` (`WAL` mode) across three tables:
  1. `memory_chunks` (`core_type IN ('episodic', 'semantic')`, `locale IN ('en-US','ja-JP','fil-PH')`, `verified_boost`, `pinned`).
  2. `memory_chunks_fts` (`FTS5` `unicode61` lexical index for exact UI labels, Kanji compounds, and error codes).
  3. `memory_vectors` (`384-dim` scalar-quantized `int8` BLOB = `384 bytes/chunk` + `scale` + `norm`).
- **Dual-Core Separation**:
  - **Core 1 (`episodic`)**: Stores user workflow traces and author phrasing preferences with smooth exponential time-decay (unless `pinned = true`).
  - **Core 2 (`semantic`)**: Stores verified organizational knowledge—approved manuals, templates, and MMI glossaries—with `1.35x` verified boost.
- **Anti-Poisoning Quarantine (`[SEC-001]`)**: Never promote unverified raw screen OCR into `semantic` memory; strip secret prefixes (`Bearer `, `sk-`, `ghp_`, `password=`) and escape `</untrusted_screen_evidence>` before indexing.
- **Hybrid Fusion & Budget**: Fuse `FTS5` BM25 + quantized cosine similarity via **Reciprocal Rank Fusion (`RRF`, $k = 60$)** and bound injected LLM context strictly to `<= 4,800` chars (`~1,200` tokens). Maintain `< 8 MB` total RAM footprint.

---

## 2. Native OS-Level Device Permission Architecture (`[ARCH-005]`)

| Platform | Screen Recording | Accessibility / UI Tree | Settings Deep-Link |
| :--- | :--- | :--- | :--- |
| **macOS (TCC)** | `CoreGraphics` FFI: `CGPreflightScreenCaptureAccess()` (silent check) & `CGRequestScreenCaptureAccess()` (native prompt; relaunch required after System Settings toggle). | `ApplicationServices` FFI: `AXIsProcessTrusted()` & `AXIsProcessTrustedWithOptions({ kAXTrustedCheckOptionPrompt: true })` (bound to `com.mmi.opero` + `CDHash`). | `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture` & `?Privacy_Accessibility` |
| **Windows 10/11** | WinRT `GraphicsCaptureAccess::RequestAccessAsync` (`Programmatic` / `Borderless`); handle `WDA_EXCLUDEFROMCAPTURE` protected surfaces cleanly. | `IUIAutomation` (`Medium IL`); detect **UIPI** (`E_ACCESSDENIED` on elevated Admin `HWND`s / UAC Secure Desktop) and fall back to OCR safely. | `ms-settings:privacy-graphicscaptureprogrammatic`, `ms-settings:privacy-microphone` |

- **Opt-In Microphone Guard (`[ARCH-003]`)**: While `OPERO_SPEECH_ENABLED=false`, microphone permission MUST report `disabled_by_policy` and `POST /api/v1/permissions/request` for `microphone` MUST return `403 Forbidden`.
- **Command Injection Safety**: `open_os_privacy_settings` MUST accept strictly the typed `PermissionSurface` enum and map to a compile-time allowlist of OS URIs (never arbitrary user strings).
