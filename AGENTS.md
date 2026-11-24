# OPERO Workspace Agent Instructions (`AGENTS.md`)

All AI agents and subagents operating inside `/Users/arronkianparejas/opero` MUST follow these workspace rules:

## 1. Pre-Flight Continuous Learning & Invariant Check
1. Always read [.agents/learned_conventions.md](file:///Users/arronkianparejas/opero/.agents/learned_conventions.md) before modifying or creating files.
2. When the user provides a design correction, architectural decision, or glossary rule, persist it immediately using:
   ```bash
   python3 .agents/skills/opero-continuous-learning/scripts/record_learning.py --category <UI|ARCH|API|DATA|SEC|TOOL> --text "<rule>"
   ```

## 2. Mount Custom Project Skills by Task Domain
- **Core Product, Data Entities & Monorepo Architecture**: Read [.agents/skills/opero/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero/SKILL.md).
- **UI Theme, Liquid Glass, Google Fonts, Pero Mascot & Studio Annotations**: Read [.agents/skills/opero-design-system/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero-design-system/SKILL.md).
- **Local AI LLM (`Qwen3`/`Gemma 3`), `PaddleOCR`, Multilingual (`en`/`ja-JP`/`fil`), and Speech (`whisper.cpp`/`MeloTTS`/`VoiceStudio`)**: Read [.agents/skills/opero-local-ai-speech/SKILL.md](file:///Users/arronkianparejas/opero/.agents/skills/opero-local-ai-speech/SKILL.md).

## 3. Secrets Hygiene & 500-Line Source Ceiling
- **Secrets Protection**: Never commit `.env`, API keys, SQLite databases (`*.sqlite*`), local AI model weights (`*.gguf`, `*.bin`, `*.onnx`), or raw screen captures. Keep [.gitignore](file:///Users/arronkianparejas/opero/.gitignore) and [.env.example](file:///Users/arronkianparejas/opero/.env.example) synchronized.
- **500-Line Physical Limit**: Every source file must stay strictly under 500 lines (target sweet spot: 150–300 lines). Decompose growing modules into focused domain slices.
