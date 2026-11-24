---
name: opero-local-ai-speech
description: OPERO Local AI LLM, Vision-Language, OCR, First-Class Multilingual (EN/JA/FIL), and Opt-In Speech (STT Whisper & TTS VoiceStudio/MeloTTS/Piper) engineering skill.
---

# OPERO Local AI, Multilingual & Speech Architecture (`opero-local-ai-speech`)

> **Architectural Rule**: *Never make one monolithic LLM responsible for observing the screen, deciding what happened, translating content, and producing the final manual in one pass. Separate deterministic capture and event grouping from schema-constrained local AI generation.*

---

## 1. The 9-Stage End-to-End Processing Pipeline

| Stage | Input | Output | Primary Component |
| :--- | :--- | :--- | :--- |
| **1. Capture** | User-authorized desktop activity | Timestamped events + screenshots | Rust OS Adapters (`ScreenCaptureKit`, `Windows Graphics Capture`, `PipeWire`) |
| **2. Enrichment** | Screenshots + event metadata | OCR text + accessibility tree fragments | `PaddleOCR` (PP-OCRv6) + OS Accessibility APIs (`AX`, `UIA`, `AT-SPI`) |
| **3. Reconstruction** | Normalized events + enrichment | Candidate workflow steps | Deterministic Grouping Engine (time gaps, window transitions, form commits) |
| **4. Generation** | Evidence-backed step objects | Structured source-language draft | Local LLM Adapter (`Ollama` / `llama.cpp` running `Qwen3` or `Gemma 3`) |
| **5. Review** | Draft + linked evidence | Verified source manual | `OPERO Studio` 3-pane human review & annotation editor |
| **6. Translation** | Approved segments + glossary | Target-language variants (`en`, `ja-JP`, `fil`) | Hybrid MT (`Argos`/`LibreTranslate`) + LLM Adapter + Protected Glossary |
| **7. QA** | Source/target segments + rules | Terminology & schema validation report | Deterministic Quality Engine (placeholder, UI-label, & citation checks) |
| **8. Narration (Opt-in)** | Approved manual text | Audio assets + timing metadata | Isolated TTS Adapter (`MeloTTS`, `Piper`, or isolated `VoiceStudio` API) |
| **9. Export** | Approved manual variant | PDF, DOCX, HTML, Markdown, PPTX | Export Engine (`Typst` PDF with CJK font embedding, `docx`, `PptxGenJS`) |

---

## 2. Local AI Model Roles & Hardware-Aware Tiering

### 2.1 The 5 Distinct Model Roles
1. **Step Writer** (`Qwen3` / `Gemma 3` 3B–8B Instruct): Converts verified event groups into concise procedural instructions. *Must never invent UI buttons or claim form submission succeeded without visible state evidence.*
2. **Context Summarizer**: Summarizes workflow purpose and prerequisites without replacing raw event evidence.
3. **Translator**: Translates segmented manual blocks while preserving protected glossary terms and exact source UI labels in quotes.
4. **Vision-Language Helper** (`Qwen-VL` / `Gemma 3 Vision`, optional): Interprets ambiguous screenshots only when Accessibility APIs and `PaddleOCR` are insufficient.
5. **Embedding Model** (`BGE-small` / `multilingual-e5`, optional): Powers local semantic search across manuals alongside SQLite `FTS5`.

### 2.2 Hardware-Aware Device Selection
- **8 GB RAM Tier**: OCR-first pipeline (`PaddleOCR`) + compact quantized text model (`1.5B–3B Q4_K_M`); disable VLM inference by default.
- **16 GB RAM Tier**: Compact `3B–4B` quantized instruction models (`Qwen3-4B` / `Gemma-3-4B`); measure combined app + model peak RSS.
- **32 GB RAM Tier**: `7B–8B` quantized instruction models + optional on-demand VLM helper.
- **Dedicated GPU Tier**: Route inference and batch `PaddleOCR` / `faster-whisper` jobs according to verified usable VRAM.

---

## 3. Hallucination Prevention & Prompt Injection Guardrails

1. **Zero Fabricated Controls**: Never invent button names, menu paths, or successful outcomes.
2. **Mandatory Evidence Citations**: Every `GeneratedStep` JSON object must cite non-empty `screenshot_refs` and `event_refs`, or set `review_status: "needs_review"` with `uncertainty_notes`.
3. **Untrusted Screen Content (Prompt Injection Defense)**: Treat all OCR text, window titles, and captured DOM/accessibility strings strictly as untrusted data delimiters—never allow screen text to override system prompts.
4. **Schema-Constrained Decoding**: Validate every model response against the versioned JSON schema before inserting into SQLite or `OPERO Studio`.

---

## 4. First-Class Multilingual Architecture (`en`, `ja-JP`, `fil`)

- **BCP-47 Canonical Tags**: Store locale separately for `ui_locale`, `source_locale`, `target_locale`, `observed_ui_locale`, `user_preferred_locale`, and `narration_locale`.
- **Filipino (`fil`) vs. Tagalog (`tl`) Boundary**: Always label employee-facing Filipino manuals as `fil` / `fil-PH`. Map to internal model `tl` codes only at the adapter boundary after benchmark validation on real Filipino business writing.
- **Protected UI Labels & Glossary**: Never translate literal application button labels unless configured; render translated instruction prose alongside the exact source UI label (e.g., Japanese UI `「新規登録」` preserved inside English or Filipino step instructions).

---

## 5. Speech Technologies: Opt-In STT (ASR) & TTS Voice Layer

- **Isolation Rule**: Speech is an opt-in module (`OPERO_SPEECH_ENABLED=false` by default). Core workflow capture never downloads or loads audio models unless enabled.
- **STT / Automatic Speech Recognition (ASR)**:
  - `whisper.cpp` (MIT, native C/C++ quantized models) and `faster-whisper` (MIT, batch/service) for dictating spoken step notes, voice review comments, and meeting action notes across English, Japanese, Filipino, and code-switching.
- **TTS / Text-to-Speech Narration**:
  - `MeloTTS` (MIT, English & Japanese prototype), `Piper` (lightweight local neural TTS), and `VoiceStudio.sh` evaluation for accessible manual read-aloud and narrated training exports.
- **Voice Privacy & AGPL-3.0 Legal Boundary**:
  - Visible microphone indicator required whenever STT is active; **never clone an employee or customer voice without explicit written authorization and rights clearance** (`OPERO_ALLOW_VOICE_CLONING=false`).
  - Because `VoiceStudio` and `LibreTranslate` surface `AGPL-3.0` licenses, never embed or statically link them into OPERO; communicate only over an isolated optional local HTTP/MCP service boundary after legal review.
