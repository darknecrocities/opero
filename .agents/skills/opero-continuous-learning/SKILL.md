---
name: opero-continuous-learning
description: Continuous Conversational Learning Protocol (CLP) skill for the OPERO repository. Records, validates, and enforces user corrections and project invariants in .agents/learned_conventions.md.
---

# OPERO Continuous Conversational Learning (`opero-continuous-learning`)

> **Philosophy**: *Mistakes happen once; repeating them is unacceptable. Absorb developer feedback immediately, persist invariants to `.agents/learned_conventions.md`, and verify compliance before every change.*

This skill enforces the **Conversational Learning Protocol (CLP)** across all agent turns and subagents working inside `/Users/arronkianparejas/opero`.

---

## 1. Pre-Flight Enforcement Workflow

Before creating or editing any file in the OPERO workspace:
1. Read [.agents/learned_conventions.md](file:///Users/arronkianparejas/opero/.agents/learned_conventions.md).
2. Audit your planned changes against every `[UI-xxx]`, `[ARCH-xxx]`, `[DATA-xxx]`, `[SEC-xxx]`, and `[TOOL-xxx]` invariant.
3. Run the verification CLI to ensure the convention registry and repository hygiene are intact:
   ```bash
   python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --verify
   ```

---

## 2. When to Record a New Learned Invariant

Trigger `record_learning.py` immediately whenever:
- **User Design or Theme Refinement**: The user adjusts color tokens, glassmorphism intensity, font stacks, or layout proportions.
- **Architectural Boundary Decision**: Stakeholder or developer locks an OS capture adapter, local LLM model family, OCR engine, or STT/TTS boundary.
- **Multilingual / Glossary Rule**: A protected MMI glossary term or EN/JA/FIL phrasing rule is established.
- **Bug Fix or Environment Quirk**: A non-obvious root cause is fixed so future agents never re-introduce the regression.

---

## 3. Recording & Auditing CLI Usage

```bash
# Record a new learned convention (auto-increments ID and deduplicates)
python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py \
  --category UI \
  --text "Keep floating Liquid Glass blur at 24px saturate 180% with solid #FFFFFF document canvas"

# List all active OPERO conventions by category
python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --list

# Filter conventions by category (UI, ARCH, API, DATA, SEC, TOOL)
python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --list --category ARCH

# Run pre-flight repository & convention health check
python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --verify
```
