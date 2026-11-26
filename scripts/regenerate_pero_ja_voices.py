#!/usr/bin/env python3
"""Regenerate OPERO's 7 bundled polite Japanese (です・ます調) onboarding voiceover MP3s
using Kokoro-82M (Apache 2.0, voice jf_alpha) with the same warm EQ filter as start_kokoro_tts.sh.

Run via:
  uv run --with "kokoro>=0.9.4" --with "misaki[ja]" --with "soundfile" \
    --with "fugashi" --with "unidic-lite" --with "jaconv" --with "mojimoji" \
    python3 scripts/regenerate_pero_ja_voices.py
"""
import os
import subprocess
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
import unidic
import unidic_lite

unidic.DICDIR = unidic_lite.DICDIR
from kokoro import KPipeline  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "audio" / "pero"
OUT_DIR.mkdir(parents=True, exist_ok=True)

POLITE_JA_LINES = [
    (0, "こんにちは、ペロです。オペロへようこそ。"),
    (1, "こんにちは。お名前を教えていただけますでしょうか？"),
    (2, "どのようなお仕事を担当されていますか？"),
    (3, "承知いたしました。丁寧で簡潔なスタイルでお話しします。"),
    (4, "英語・日本語・フィリピン語の3言語に対応しています。"),
    (5, "ご安心ください。すべてこの端末内のみで安全に保護いたします。"),
    (6, "準備が整いました。いつでも始められます。"),
]

WARM_FILTER = (
    "aresample=44100,"
    "equalizer=f=240:t=q:w=1.2:g=2.5,"
    "highshelf=f=6000:g=-2.0,"
    "acompressor=threshold=-20dB:ratio=2.2:attack=15:release=180,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)


def main() -> None:
    default_hf = str(Path.home() / "Library" / "Application Support" / "OPERO" / "hf-cache")
    cur_hf = os.environ.get("HF_HOME", "")
    if not cur_hf or not os.access(Path(cur_hf).parent, os.W_OK):
        os.environ["HF_HOME"] = default_hf
        os.environ["HUGGINGFACE_HUB_CACHE"] = str(Path(default_hf) / "hub")
    pipe = KPipeline(lang_code="j", repo_id="hexgrad/Kokoro-82M")
    for step, text in POLITE_JA_LINES:
        chunks = [audio for _, _, audio in pipe(text, voice="jf_alpha", speed=0.84)]
        if not chunks:
            raise RuntimeError(f"Kokoro returned empty audio for step {step}")
        wav = np.concatenate(chunks)
        out_mp3 = OUT_DIR / f"step-{step}-ja.mp3"
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wf:
            wav_path = wf.name
        try:
            sf.write(wav_path, wav, 24000)
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                    "-af", WARM_FILTER,
                    "-codec:a", "libmp3lame", "-b:a", "128k",
                    str(out_mp3),
                ],
                check=True,
            )
            print(f"[OK] {out_mp3.name} ({out_mp3.stat().st_size} B) <- {text}")
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)


if __name__ == "__main__":
    main()
