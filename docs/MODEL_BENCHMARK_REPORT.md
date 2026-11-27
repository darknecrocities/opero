# OPERO Release 1 — Local LLM Benchmark Report

- **Generated**: 2026-11-27T01:46:49.122226+00:00
- **Measurement Host**: Apple M3 (16 GB RAM) — real Ollama inference in both **CPU-only (`num_gpu: 0`)** and **Metal** modes
- **Release 1 Baseline Target**: HP ProBook 450 G8 (Intel Core i7-1165G7, 16 GB RAM, CPU-only, ≤ 6.0 GB combined app + model RAM)

## Measured Model Comparison

| Model | Tag | License | Model RAM | App+Model RAM | CPU-Only tok/s | Metal tok/s | Quality (/100) | ProBook 450 G8 Compat |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Qwen2.5 1.5B | `qwen2.5:1.5b` | Apache-2.0 | 1.03 GB | 1.63 GB | 62.8 | 79.5 | 87/100 | **97%** |
| Qwen3 1.7B | `qwen3:1.7b` | Apache-2.0 | 1.13 GB | 1.73 GB | 52.2 | 66.0 | 90/100 | **98%** |
| Qwen2.5 3B | `qwen2.5:3b` | Apache-2.0 | 1.94 GB | 2.54 GB | 33.1 | 38.6 | 90/100 | **96%** |
| Phi-4 Mini 3.8B | `phi4-mini:3.8b` | MIT | 2.64 GB | 3.24 GB | 25.1 | 31.1 | 91/100 | **94%** |
| Qwen3 4B | `qwen3:4b` | Apache-2.0 | 2.68 GB | 3.28 GB | 20.4 | 27.5 | 53/100 | **85%** |
| Gemma 3 4B | `gemma3:4b` | Gemma Terms | 2.17 GB | 2.77 GB | 22.5 | 28.7 | 100/100 | **98%** |
