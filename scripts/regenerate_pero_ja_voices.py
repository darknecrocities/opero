#!/usr/bin/env python3
"""Regenerate OPERO's bundled neural child-voice onboarding MP3s (EN af_sky & polite JA jf_nezumi)
using Kokoro-82M (Apache 2.0) with the exact same child-voice filter as start_kokoro_tts.sh.
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

CHILD_EN_LINES = [
    (0, "Ooh, hi there! I'm Pero — welcome to Opero."),
    (1, "Ooh, hi! What should I call you?"),
    (2, "Ooh, what kind of work do you do?"),
    (3, "Got it — I'll speak in a Calm and Concise tone."),
    (4, "Whenever you're ready — I speak English, Japanese, and Filipino."),
    (5, "Don't worry — everything stays private right here on your device."),
    (6, "Yay! Everything is ready whenever you are."),
]

CHILD_FILTER = (
    "asetrate=24000*1.11,aresample=44100,atempo=0.90,"
    "equalizer=f=260:t=q:w=1.2:g=2.0,"
    "highshelf=f=6500:g=-1.5,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)


def synth_batch(pipe: KPipeline, lines: list[tuple[int, str]], voice: str, speed: float, suffix: str) -> None:
    for step, text in lines:
        chunks = [audio for _, _, audio in pipe(text, voice=voice, speed=speed)]
        if not chunks:
            raise RuntimeError(f"Kokoro returned empty audio for step {step} ({suffix})")
        wav = np.concatenate(chunks)
        out_mp3 = OUT_DIR / f"step-{step}-{suffix}.mp3"
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wf:
            wav_path = wf.name
        try:
            sf.write(wav_path, wav, 24000)
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                    "-af", CHILD_FILTER,
                    "-codec:a", "libmp3lame", "-b:a", "128k",
                    str(out_mp3),
                ],
                check=True,
            )
            print(f"[OK] {out_mp3.name} ({out_mp3.stat().st_size} B) <- {text}")
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)


def main() -> None:
    default_hf = str(Path.home() / "Library" / "Application Support" / "OPERO" / "hf-cache")
    os.environ["HF_HOME"] = default_hf
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(Path(default_hf) / "hub")

    pipe_ja = KPipeline(lang_code="j", repo_id="hexgrad/Kokoro-82M")
    synth_batch(pipe_ja, POLITE_JA_LINES, voice="jf_nezumi", speed=0.90, suffix="ja")

    pipe_en = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    synth_batch(pipe_en, CHILD_EN_LINES, voice="af_sky", speed=0.94, suffix="en")


if __name__ == "__main__":
    main()
