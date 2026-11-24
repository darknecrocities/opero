# OPERO — Learned Conventions & Architectural Invariants

> **Protocol**: Managed by the Conversational Learning Protocol (`opero-continuous-learning`). Every agent working in `/Users/arronkianparejas/opero` MUST read and enforce these invariants before modifying or generating any code.

---

## Design & Styling (`[UI-xxx]`)

- **[UI-001] (2026-11-22)**: Enforce OPERO's strict 3-color hierarchy: **Primary White** (`#FFFFFF` canvas), **Secondary Light Blue** (`#69BCFC` brand sky, `#F2F8FF` secondary surface, `#EBF6FF` selection wash, `#B9E0FE` sky border), and **Black Accents** (`#0F172A` primary buttons, headings, active indicators, playhead, and focus rings). Reserve Liquid Glass (`rgba(255, 255, 255, 0.74)`, `backdrop-filter: blur(24px) saturate(180%)` + 1px top specular highlight) strictly for floating capture HUDs, contextual toolbars, menus, and popovers; keep the manual document canvas solid `#FFFFFF` with a solid-surface accessibility fallback.
- **[UI-002] (2026-11-22)**: Standardize on Google Fonts: `Plus Jakarta Sans` for display headings (`-0.025em` tracking), `Inter` for UI controls and body prose, `JetBrains Mono` for event schemas/timestamps/tabular numerals (`tnum`), and `Noto Sans JP` for Japanese Kanji/Kana + Filipino/English glyph coverage.
- **[UI-003] (2026-11-22)**: Never communicate recording state, warnings, or verification status by color alone. Always pair semantic colors (`#16865B` Success/Verified, `#B7791F` Warning/Needs Review, `#C43D4B` Danger/Recording) with explicit status text and semantic icons.
- **[UI-004] (2026-11-22)**: Deploy the Pero (ORO Penguin) 20-motion 2D vector mascot only in onboarding, empty states, floating capture indicators, model setup, and generation progress—never inside dense document editing surfaces. Always honor `prefers-reduced-motion: reduce`.

- **[UI-005] (2026-11-22)**: Documentation pages must present clear explanatory prose paragraphs and clean minimal tables without raw JSON snippets or decorative badge/pill clutter.
- **[UI-006] (2026-11-22)**: Every bone in Pero Animate Studio must support constrained multi-axis placement (tx, ty, rot, scale) within safe anatomical joint bounds so limbs and props move freely without detaching.
- **[UI-007] (2026-11-24)**: Maximize use of official MIT Jiggicons (120 Hz spring Web Animations API SVGs) across all navigation, buttons, Model Router, Quick Prompt chips, and Export actions tinted strictly in OPERO Black (#0F172A) and Sky Blue (#69BCFC).
- **[UI-008] (2026-11-24)**: Use a Voxt-inspired 3-column Dual-Sidebar Workspace (Left Sessions/Modes + Center Pure White Stage with Impulse Scrubber, Split Tabs, and Docked Quick Prompt + Right Model Router, OCR/Voice, Dual-Core Memory, and Export) with frameless, natural Pero presence (zero boxed mascot cards, zero placeholders).
- **[UI-009] (2026-11-24)**: OPERO onboarding must be completely cardless (no modal boxes or bordered choice cards), using editorial frameless inputs, staggered 'Opero.' wordmark, and 5 bouncing colored progress balls across all 5 onboarding screens.
## System Architecture (`[ARCH-xxx]`)

- **[ARCH-001] (2026-11-22)**: Local-first by default and capture-independent-of-inference: recording sessions (`OPERO Capture`) must function reliably and persist raw evidence even when the local AI runtime (`Ollama` / `llama.cpp`) is stopped, missing, or incompatible.
- **[ARCH-002] (2026-11-22)**: Deterministic processing before probabilistic model output: normalize OS capture events, extract accessibility metadata and `PaddleOCR` text, and run rule-based event grouping before invoking the local LLM (`Qwen3` / `Gemma 3`).
- **[ARCH-003] (2026-11-22)**: Keep optional speech capabilities (STT via `faster-whisper` / `whisper.cpp`, TTS via `MeloTTS` / `Piper` / `VoiceStudio.sh`) isolated from core workflow capture so users who disable audio never download or run speech models.
- **[ARCH-004] (2026-11-22)**: Isolate AGPL-3.0 third-party systems (`VoiceStudio.sh`, `LibreTranslate`) behind an optional local HTTP/API boundary rather than embedding or redistributing AGPL source code inside the OPERO desktop binary without legal review.

- **[ARCH-005] (2026-11-24)**: Implement OS-level native device permission probing and direct OS prompt triggering in Rust FFI (macOS CoreGraphics CGPreflightScreenCaptureAccess/CGRequestScreenCaptureAccess + ApplicationServices AXIsProcessTrustedWithOptions; Windows GraphicsCaptureAccess + UIPI/WDA_EXCLUDEFROMCAPTURE) with native OS Settings URI deep-links.
## Persistence & Data Schemas (`[DATA-xxx]`)

- **[DATA-001] (2026-11-22)**: Treat English (`en` / `en-US`), Japanese (`ja-JP`), and Filipino (`fil` / `fil-PH`) as first-class BCP-47 document languages at the data-model level (`ContentVariant` linked to `WorkflowStep`). Never bolt translation onto an English-only schema.
- **[DATA-002] (2026-11-22)**: Never silently equate Filipino (`fil`) with Tagalog (`tl`) in user-facing labels or unverified model claims; map `fil` to internal model codes (`tl`) only at the adapter boundary after benchmark validation and protected glossary enforcement.
- **[DATA-003] (2026-11-22)**: Every generated or translated manual step must cite one or more supporting `event_refs` and `screenshot_refs`, or be explicitly flagged as `needs_review` with `uncertainty_notes`.

- **[DATA-004] (2026-11-24)**: Embed an ultra-lightweight Dual-Core LLM Memory & local RAG Vector DB directly in SQLite WAL (Core 1 Episodic User/Workflow Memory + Core 2 Semantic Approved Manuals/Glossary) using quantized int8 384-dim vectors + FTS5 BM25 fused via Reciprocal Rank Fusion (< 8 MB RAM, zero external vector daemon).
## Security & Privacy (`[SEC-xxx]`)

- **[SEC-001] (2026-11-22)**: Treat all captured screen OCR text, window titles, file paths, and LLM outputs as untrusted data (prompt-injection defense); never allow screen text to override system instructions.
- **[SEC-002] (2026-11-22)**: Never record raw keystroke content or password fields by default. Clearly distinguish reversible visual blur overlays inside OPERO Studio from irreversible pixel redaction in exported PDF/DOCX/HTML artifacts.
- **[SEC-003] (2026-11-22)**: Never commit `.env`, raw credentials, SQLite databases (`*.sqlite*`), local AI model weights (`*.gguf`, `*.bin`, `*.onnx`), or unredacted screen captures to Git.

## Tooling & Code Quality (`[TOOL-xxx]`)

- **[TOOL-001] (2026-11-22)**: Enforce a strict 500-line physical ceiling on all source files (target sweet spot: 150–300 lines), verified via `check_source_line_limits.py --show-tiers`.
