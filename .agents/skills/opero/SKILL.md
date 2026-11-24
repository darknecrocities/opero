---
name: opero
description: Master engineering domain skill, architectural invariants, data boundaries, and verification checklist for OPERO — MMI's Local-First AI Workflow Documentation System.
---

# OPERO Domain Engineering Standard (`opero`)

> **Core Product Promise**: *Capture once. Understand the workflow. Generate a manual. Review and publish.*  
> **Architecture**: Tauri 2 + Rust (Native OS Capture, Event Queue, SQLite/SQLCipher) + React/TypeScript (`OPERO Studio`) + Pluggable Local AI (`Ollama` / `llama.cpp`, `PaddleOCR`, Opt-in `Whisper` / `MeloTTS`)  
> **Primary Design System**: Minimalistic White-First (`#FFFFFF`) + Liquid Glass Floating Chrome (`rgba(255,255,255,0.72)`) + Pero Light Blue (`#69BCFC`) & Accent Blue (`#247BFA`) + Google Fonts  
> **Multilingual Foundation**: First-Class BCP-47 (`en-US`, `ja-JP`, `fil-PH`) Content Variants

---

## 1. Non-Negotiable Product & Architectural Principles

1. **Evidence Before Generated Prose**: Screenshots, timestamped event metadata, and extracted OS accessibility / OCR labels remain the immutable source of truth. Every generated instruction must cite `event_refs` and `screenshot_refs`.
2. **Local-First by Default**: Capture, OCR, event grouping, manual drafting, translation, and PDF/DOCX export must execute locally without requiring external cloud AI services.
3. **Human Approval Before Publication**: All AI-generated and translated output is a draft (`draft` or `needs_review`). Never publish without explicit human verification (`verified`).
4. **Capture Independent of Inference**: Recording sessions (`OPERO Capture`) must continue functioning reliably even if the local AI runtime (`Ollama` / `llama.cpp`) is stopped, missing, or incompatible.
5. **Privacy by Design**: Recording is explicitly user-initiated, visibly indicated, pausable, and governed by application/window exclusions. Never capture raw typed passwords or keystrokes by default. Distinguish reversible visual blur from irreversible export redaction.
6. **Progressive Complexity**: Prove the local capture-to-manual vertical slice (Release 1 `OPERO Desktop`) before adding multi-user collaboration (Release 2 `OPERO Workspace`) or workflow diffing (Release 3 `OPERO Intelligence`).

---

## 2. Specialized OPERO Sub-Skills

| Skill Path | Domain Scope |
| :--- | :--- |
| [.agents/skills/opero-design-system/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero-design-system/SKILL.md) | Minimalistic White-First + Liquid Glass tokens, Google Fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`, `Noto Sans JP`), Pero 20-motion mascot rig, and 7 annotation types. |
| [.agents/skills/opero-local-ai-speech/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero-local-ai-speech/SKILL.md) | 9-Stage pipeline, hardware-aware RAM tiers, `Qwen3`/`Gemma 3` model roles, `PaddleOCR`, BCP-47 EN/JA/FIL schemas, and opt-in STT (`whisper.cpp`) / TTS (`MeloTTS`, `VoiceStudio`). |
| [.agents/skills/opero-continuous-learning/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero-continuous-learning/SKILL.md) | Conversational Learning Protocol (CLP) managing [.agents/learned_conventions.md](file:///Users/arronkianparejas/opero/.agents/learned_conventions.md) via `record_learning.py`. |

---

## 3. Repository & Target Monorepo Architecture

```text
opero/
├── .agents/
│   ├── learned_conventions.md            # Persisted project invariants ([UI], [ARCH], [DATA], [SEC], [TOOL])
│   └── skills/                           # Custom OPERO agent skills
├── assets/
│   ├── docs/                             # MMI Concept, Architecture Blueprint & Research PDFs
│   └── images/mascot/pero-motions/       # Pero 2D Rig, 20 Animated SVGs/PNGs, React components & Motion Studio
│       ├── index.html                    # 4-Tab Studio: Library | Animate Studio | Design System | Docs & Blueprint
│       ├── studio/                       # Modular CSS & JS engines (< 500 lines per file)
│       └── app-code/                     # Drop-in React/TypeScript <PeroMascot /> & <PeroStateMascot />
├── apps/desktop/                         # Tauri 2 + React/TypeScript (Dashboard, Capture Center, OPERO Studio, Settings)
│   └── src-tauri/                        # Rust core (OS capture adapters, event normalization, SQLite/SQLCipher)
├── ai-engine/                            # Pluggable OCR, deterministic grouping, local LLM/VLM, translation, STT/TTS
└── packages/                             # shared-types, ui, document-schema, export-engine (Typst PDF, DOCX, HTML, MD)
```

---

## 4. Core Data Entities (SQLite + Managed Assets)

1. `Project` (`id`, `title`, `owner`, `department`, `default_locale`, `glossary_id`)
2. `RecordingSession` (`id`, `project_id`, `started_at`, `ended_at`, `capture_profile`, `status`)
3. `CapturedEvent` (`id`, `session_id`, `timestamp_utc`, `sequence`, `event_type`, `application`, `coordinates`, `target`, `screenshot_refs`, `privacy_flags`)
4. `Screenshot` (`id`, `session_id`, `relative_path`, `timestamp`, `dimensions`, `hash`, `redaction_state`)
5. `WorkflowStep` (`id`, `session_id`, `order`, `action_type`, `evidence_refs`, `review_status`, `uncertainty_notes`)
6. `ContentVariant` (`id`, `step_id`, `locale`, `title`, `body`, `source_variant_id`, `review_status`)
7. `Annotation` (`id`, `screenshot_id`, `type`, `geometry`, `label`, `style`, `is_irreversible_redaction`)
8. `TranslationJob` (`id`, `source_locale`, `target_locale`, `model_id`, `glossary_version`, `reviewer_id`, `status`)
9. `GlossaryTerm` (`id`, `source_term`, `locale`, `preferred_term`, `forbidden_variants`, `context`)
10. `ModelProfile` (`id`, `runtime`, `model_name`, `revision`, `quantization`, `license_ref`, `capabilities`)
11. `AudioAsset` (`id`, `content_variant_id`, `locale`, `voice_id`, `model_id`, `file_path`, `consent_ref`)
12. `ManualVersion` (`id`, `manual_id`, `version`, `author`, `timestamp`, `change_summary`, `schema_version`)

---

## 5. Mandatory Verification Checklist

Before declaring any task complete:
```bash
# 1. Pre-flight learned conventions & secrets hygiene check
python3 /Users/arronkianparejas/opero/.agents/skills/opero-continuous-learning/scripts/record_learning.py --verify

# 2. Enforce 500-line physical source ceiling
python3 /Users/arronkianparejas/.gemini/config/plugins/skill-builder/skills/world-class-engineering/scripts/check_source_line_limits.py --path /Users/arronkianparejas/opero --show-tiers

# 3. Validate Motion Studio JavaScript modules
node --check /Users/arronkianparejas/opero/assets/images/mascot/pero-motions/studio/*.js

# 4. Audit UI tokens & anti-slop hygiene
python3 /Users/arronkianparejas/.gemini/config/plugins/skill-builder/skills/ui/scripts/verify_ui_tokens.py --path /Users/arronkianparejas/opero/assets/images/mascot/pero-motions
```
