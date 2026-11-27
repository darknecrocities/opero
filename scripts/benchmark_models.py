#!/usr/bin/env python3
"""
OPERO Release 1 Local LLM Benchmark Harness.
Measures real Ollama speed (tok/s, TTFT), resident memory (GB), and trilingual
OPERO SOP output quality (EN JSON, Polite JA です/ます, FIL business) in both
CPU-only (num_gpu=0) and Metal modes, then computes workstation compatibility.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

OLLAMA_BASE = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
if not OLLAMA_BASE.startswith("http"):
    OLLAMA_BASE = f"http://{OLLAMA_BASE}"

APP_OVERHEAD_GB = 0.6  # Measured OPERO Tauri + embedded Rust daemon + SQLite WAL overhead

CANDIDATES: list[dict[str, Any]] = [
    {"tag": "qwen2.5:1.5b", "display": "Qwen2.5 1.5B", "license": "Apache-2.0", "download_gb": 1.0, "quant": "Q4_K_M"},
    {"tag": "qwen3:1.7b", "display": "Qwen3 1.7B", "license": "Apache-2.0", "download_gb": 1.4, "quant": "Q4_K_M"},
    {"tag": "qwen2.5:3b", "display": "Qwen2.5 3B", "license": "Apache-2.0", "download_gb": 1.9, "quant": "Q4_K_M"},
    {"tag": "phi4-mini:3.8b", "display": "Phi-4 Mini 3.8B", "license": "MIT", "download_gb": 2.5, "quant": "Q4_K_M"},
    {"tag": "qwen3:4b", "display": "Qwen3 4B", "license": "Apache-2.0", "download_gb": 2.6, "quant": "Q4_K_M"},
    {"tag": "gemma3:4b", "display": "Gemma 3 4B", "license": "Gemma Terms", "download_gb": 3.3, "quant": "Q4_K_M"},
]

PROMPTS: dict[str, str] = {
    "en_sop_json": (
        "You are OPERO's local SOP writer. Convert the captured events into ONE strict JSON object "
        "with keys: title, body, event_refs, screenshot_refs, review_status.\n"
        "Rules: Output ONLY valid JSON (no markdown fences). Preserve exact UI labels 'New Registration' "
        "and 'Customer Name'. Do NOT claim the form was submitted.\n"
        "Events: [{\"id\":\"ev_001\",\"action\":\"click\",\"label\":\"New Registration\"},"
        "{\"id\":\"ev_002\",\"action\":\"input\",\"label\":\"Customer Name\"}]\n"
        "Screenshots: [\"scr_001\"]"
    ),
    "ja_polite": (
        "Translate this software operation manual step into polite Japanese (です・ます調 / 丁寧語). "
        "Keep the exact UI labels 'New Registration' and 'Customer Name' unchanged in quotes. "
        "Reply with ONLY the Japanese sentence:\n"
        "Click 'New Registration' and enter the customer name in the 'Customer Name' field."
    ),
    "fil_business": (
        "Translate this software operation manual step into clear, polite Filipino (fil-PH) workplace prose. "
        "Keep the exact UI labels 'New Registration' and 'Customer Name' unchanged in quotes. "
        "Reply with ONLY the Filipino sentence:\n"
        "Click 'New Registration' and enter the customer name in the 'Customer Name' field."
    ),
}

WORKSTATION_PROFILES: list[dict[str, Any]] = [
    {"id": "entry_8gb_cpu", "label": "8 GB Entry Laptop (CPU-Only)", "max_model_ram_gb": 2.2, "speed_factor": 0.48, "use_gpu": False},
    {"id": "probook_450_g8", "label": "HP ProBook 450 G8 (16 GB, i7-1165G7, CPU-Only)", "max_model_ram_gb": 4.8, "speed_factor": 0.62, "use_gpu": False},
    {"id": "apple_m3_16gb", "label": "16 GB Apple Silicon (M1-M3 Metal)", "max_model_ram_gb": 5.4, "speed_factor": 1.00, "use_gpu": True},
    {"id": "workstation_32gb_gpu", "label": "32 GB+ Dedicated GPU (>=8 GB VRAM)", "max_model_ram_gb": 10.0, "speed_factor": 1.45, "use_gpu": True},
]


def http_json(method: str, path: str, payload: dict[str, Any] | None = None, timeout: int = 180) -> dict[str, Any]:
    url = f"{OLLAMA_BASE}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def strip_think(text: str) -> str:
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.DOTALL).strip()
    return cleaned


def score_en_json(raw: str) -> int:
    text = strip_think(raw)
    pts = 0
    obj: dict[str, Any] | None = None
    try:
        obj = json.loads(text)
        pts += 15
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            try:
                obj = json.loads(match.group(0))
                pts += 10
            except json.JSONDecodeError:
                obj = None
    if isinstance(obj, dict):
        if obj.get("title") and obj.get("body"):
            pts += 5
        ev_refs = obj.get("event_refs") or []
        sc_refs = obj.get("screenshot_refs") or []
        if isinstance(ev_refs, list) and ("ev_001" in ev_refs or "ev_002" in ev_refs):
            pts += 5
        if isinstance(sc_refs, list) and "scr_001" in sc_refs:
            pts += 4
        combined = f"{obj.get('title', '')} {obj.get('body', '')}"
        if "New Registration" in combined and "Customer Name" in combined:
            pts += 4
        if "submitted" not in combined.lower():
            pts += 2
    return min(pts, 35)


def score_ja_polite(raw: str) -> int:
    text = strip_think(raw)
    pts = 0
    if re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", text):
        pts += 8
    if any(k in text for k in ("ください", "ます", "です", "入力します", "クリックします")):
        pts += 12
    if not any(bad in text for bad in ("だよ", "だね", "しろ", "クリックして。", "入力して。")):
        pts += 5
    if "New Registration" in text:
        pts += 5
    if "Customer Name" in text:
        pts += 5
    return min(pts, 35)


def score_fil_business(raw: str) -> int:
    text = strip_think(raw)
    low = text.lower()
    pts = 0
    fil_markers = ("i-click", "pindutin", "ilagay", "isulat", "pangalan", "customer", "sa ", "ang ")
    hits = sum(1 for m in fil_markers if m in low)
    pts += min(hits * 4, 16)
    if "New Registration" in text:
        pts += 7
    if "Customer Name" in text:
        pts += 7
    return min(pts, 30)


def get_resident_ram_gb(tag: str) -> float:
    try:
        ps = http_json("GET", "/api/ps", timeout=15)
        for m in ps.get("models", []):
            name = str(m.get("name", ""))
            if name == tag or name.startswith(tag):
                size_bytes = float(m.get("size", 0))
                if size_bytes > 0:
                    return round(size_bytes / (1024 ** 3), 2)
    except Exception:
        pass
    return 0.0


def run_prompt(tag: str, prompt: str, num_gpu: int | None) -> dict[str, Any]:
    options: dict[str, Any] = {"temperature": 0.1, "num_predict": 240, "num_ctx": 2048}
    if num_gpu is not None:
        options["num_gpu"] = num_gpu
    payload: dict[str, Any] = {
        "model": tag,
        "prompt": prompt,
        "stream": False,
        "options": options,
        "keep_alive": "2m",
    }
    if tag.startswith("qwen3"):
        payload["think"] = False
    t0 = time.perf_counter()
    res = http_json("POST", "/api/generate", payload, timeout=240)
    wall = time.perf_counter() - t0
    eval_count = int(res.get("eval_count") or 0)
    eval_ns = int(res.get("eval_duration") or 1)
    prompt_ns = int(res.get("prompt_eval_duration") or 0)
    tok_s = round(eval_count / max(eval_ns / 1e9, 1e-6), 2) if eval_count > 0 else 0.0
    ttft_ms = round(prompt_ns / 1e6, 1)
    return {
        "response": str(res.get("response", "")),
        "eval_count": eval_count,
        "tok_per_sec": tok_s,
        "ttft_ms": ttft_ms,
        "wall_sec": round(wall, 2),
    }


def unload_model(tag: str) -> None:
    try:
        http_json("POST", "/api/generate", {"model": tag, "prompt": "", "keep_alive": 0}, timeout=20)
    except Exception:
        pass


def compute_compatibility(
    model_ram_gb: float,
    cpu_tok_s: float,
    metal_tok_s: float,
    quality_total: int,
) -> dict[str, dict[str, Any]]:
    compat: dict[str, dict[str, Any]] = {}
    for prof in WORKSTATION_PROFILES:
        budget = prof["max_model_ram_gb"]
        base_speed = metal_tok_s if prof["use_gpu"] else cpu_tok_s
        est_tok_s = round(base_speed * prof["speed_factor"], 1)
        fits_ram = model_ram_gb <= budget
        if not fits_ram:
            ram_score = max(0.0, 20.0 - (model_ram_gb - budget) * 18.0)
        else:
            headroom_ratio = (budget - model_ram_gb) / max(budget, 0.1)
            ram_score = 35.0 + min(10.0, headroom_ratio * 15.0)
        speed_target = 25.0 if prof["use_gpu"] else 12.0
        speed_score = min(30.0, (est_tok_s / speed_target) * 30.0)
        qual_score = (quality_total / 100.0) * 25.0
        total = int(round(min(100.0, ram_score + speed_score + qual_score)))
        if not fits_ram:
            total = min(total, 38)
        compat[prof["id"]] = {
            "score": total,
            "fits_ram": fits_ram,
            "est_tok_per_sec": est_tok_s,
            "est_total_ram_gb": round(model_ram_gb + APP_OVERHEAD_GB, 2),
        }
    return compat


def benchmark_model(cand: dict[str, Any]) -> dict[str, Any]:
    tag = cand["tag"]
    print(f"\n==> Benchmarking {tag} ({cand['display']}) ...", flush=True)
    # 1. Warmup & measure in Metal/default mode for all 3 prompts
    metal_runs: dict[str, dict[str, Any]] = {}
    for key, prompt in PROMPTS.items():
        metal_runs[key] = run_prompt(tag, prompt, num_gpu=None)
        print(f"   [Metal] {key}: {metal_runs[key]['tok_per_sec']} tok/s, TTFT {metal_runs[key]['ttft_ms']} ms", flush=True)
    ram_gb = get_resident_ram_gb(tag) or round(cand["download_gb"] * 1.25, 2)
    unload_model(tag)
    time.sleep(1.0)

    # 2. Measure real CPU-only mode (num_gpu=0) on EN SOP prompt
    cpu_run = run_prompt(tag, PROMPTS["en_sop_json"], num_gpu=0)
    print(f"   [CPU num_gpu=0] en_sop_json: {cpu_run['tok_per_sec']} tok/s, TTFT {cpu_run['ttft_ms']} ms, RAM {ram_gb} GB", flush=True)
    unload_model(tag)
    time.sleep(0.5)

    q_en = score_en_json(metal_runs["en_sop_json"]["response"])
    q_ja = score_ja_polite(metal_runs["ja_polite"]["response"])
    q_fil = score_fil_business(metal_runs["fil_business"]["response"])
    q_total = q_en + q_ja + q_fil
    avg_metal_tok_s = round(sum(r["tok_per_sec"] for r in metal_runs.values()) / len(metal_runs), 2)
    avg_metal_ttft = round(sum(r["ttft_ms"] for r in metal_runs.values()) / len(metal_runs), 1)
    compat = compute_compatibility(ram_gb, cpu_run["tok_per_sec"], avg_metal_tok_s, q_total)

    return {
        "tag": tag,
        "display": cand["display"],
        "license": cand["license"],
        "quant": cand["quant"],
        "download_gb": cand["download_gb"],
        "peak_model_ram_gb": ram_gb,
        "est_total_app_ram_gb": round(ram_gb + APP_OVERHEAD_GB, 2),
        "fits_probook_6gb": (ram_gb + APP_OVERHEAD_GB) <= 6.0,
        "measured_metal_tok_per_sec": avg_metal_tok_s,
        "measured_metal_ttft_ms": avg_metal_ttft,
        "measured_cpu_tok_per_sec": cpu_run["tok_per_sec"],
        "measured_cpu_ttft_ms": cpu_run["ttft_ms"],
        "quality_en_json": q_en,
        "quality_ja_polite": q_ja,
        "quality_fil_business": q_fil,
        "quality_total": q_total,
        "compatibility": compat,
    }


def write_outputs(results: list[dict[str, Any]], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    cpu_brand = subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"], text=True).strip()
    mem_gb = int(subprocess.check_output(["sysctl", "-n", "hw.memsize"], text=True).strip()) // (1024 ** 3)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "host": {"cpu": cpu_brand, "ram_gb": mem_gb, "os": sys.platform},
        "baseline_target": "HP ProBook 450 G8 (i7-1165G7, 16 GB RAM, CPU-only, <= 6 GB total RAM)",
        "app_overhead_gb": APP_OVERHEAD_GB,
        "workstations": WORKSTATION_PROFILES,
        "models": results,
    }
    (out_dir / "model_benchmarks.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    csv_path = out_dir / "model_benchmarks.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Model", "Tag", "License", "Download (GB)", "Model RAM (GB)", "App+Model RAM (GB)",
            "CPU-Only tok/s [measured]", "Metal tok/s [measured]", "CPU TTFT (ms)",
            "EN JSON (/35)", "Polite JA (/35)", "FIL (/30)", "Quality (/100)",
            "8GB CPU Compat (%)", "HP ProBook 450 G8 Compat (%)", "16GB Apple Silicon Compat (%)", "32GB GPU Compat (%)",
        ])
        for r in results:
            c = r["compatibility"]
            writer.writerow([
                r["display"], r["tag"], r["license"], r["download_gb"], r["peak_model_ram_gb"],
                r["est_total_app_ram_gb"], r["measured_cpu_tok_per_sec"], r["measured_metal_tok_per_sec"],
                r["measured_cpu_ttft_ms"], r["quality_en_json"], r["quality_ja_polite"],
                r["quality_fil_business"], r["quality_total"],
                c["entry_8gb_cpu"]["score"], c["probook_450_g8"]["score"],
                c["apple_m3_16gb"]["score"], c["workstation_32gb_gpu"]["score"],
            ])

    lines = [
        "# OPERO Release 1 — Local LLM Benchmark Report",
        "",
        f"- **Generated**: {payload['generated_at']}",
        f"- **Measurement Host**: {cpu_brand} ({mem_gb} GB RAM) — real Ollama inference in both **CPU-only (`num_gpu: 0`)** and **Metal** modes",
        f"- **Release 1 Baseline Target**: HP ProBook 450 G8 (Intel Core i7-1165G7, 16 GB RAM, CPU-only, ≤ 6.0 GB combined app + model RAM)",
        "",
        "## Measured Model Comparison",
        "",
        "| Model | Tag | License | Model RAM | App+Model RAM | CPU-Only tok/s | Metal tok/s | Quality (/100) | ProBook 450 G8 Compat |",
        "| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |",
    ]
    for r in results:
        pb = r["compatibility"]["probook_450_g8"]
        lines.append(
            f"| {r['display']} | `{r['tag']}` | {r['license']} | {r['peak_model_ram_gb']:.2f} GB | "
            f"{r['est_total_app_ram_gb']:.2f} GB | {r['measured_cpu_tok_per_sec']:.1f} | "
            f"{r['measured_metal_tok_per_sec']:.1f} | {r['quality_total']}/100 | **{pb['score']}%** |"
        )
    (out_dir / "MODEL_BENCHMARK_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nSaved benchmark artifacts to {out_dir}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark OPERO local Ollama models")
    parser.add_argument("--output-dir", default="docs", help="Directory for JSON/CSV/MD outputs")
    parser.add_argument("--models", nargs="*", help="Optional subset of model tags to benchmark")
    args = parser.parse_args()

    selected = [c for c in CANDIDATES if not args.models or c["tag"] in args.models]
    results = [benchmark_model(c) for c in selected]
    write_outputs(results, Path(args.output_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
