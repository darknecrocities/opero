#!/usr/bin/env bash
set -euo pipefail

# Optional ElevenLabs-grade Local Neural TTS Server for OPERO (Kokoro-82M, Apache 2.0)
# Runs strictly on loopback http://127.0.0.1:4320/speak — auto-detected by opero-core/src/tts.rs.
# Usage: bash scripts/start_kokoro_tts.sh

PORT="${OPERO_KOKORO_PORT:-4320}"
echo "Starting OPERO Kokoro-82M (Apache 2.0) local neural child-voice server on http://127.0.0.1:${PORT}/speak ..."

uv run --with "kokoro>=0.9.4" --with "misaki[ja]" --with "soundfile" --with "fastapi" --with "uvicorn" python3 - <<'PY'
import io
import os
import subprocess
import tempfile
import soundfile as sf
from fastapi import FastAPI, Response
from pydantic import BaseModel
from kokoro import KPipeline
import uvicorn

app = FastAPI(title="OPERO Local Kokoro-82M Child TTS")
pipelines = {}

def get_pipeline(lang_code: str) -> KPipeline:
    if lang_code not in pipelines:
        pipelines[lang_code] = KPipeline(lang_code=lang_code)
    return pipelines[lang_code]

class SpeakReq(BaseModel):
    text: str
    lang: str = "en-US"
    style: str = "child"

@app.post("/speak")
def speak(req: SpeakReq):
    is_ja = req.lang.lower().startswith("ja")
    lang_code = "j" if is_ja else "a"
    voice = "jf_alpha" if is_ja else "af_sky"
    pipe = get_pipeline(lang_code)
    chunks = [audio for _, _, audio in pipe(req.text, voice=voice, speed=1.08)]
    if not chunks:
        return Response(status_code=500)
    import numpy as np
    wav = np.concatenate(chunks)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wf:
        sf.write(wf.name, wav, 24000)
        wav_path = wf.name
    mp3_path = wav_path.replace(".wav", ".mp3")
    # Subtle child formant lift (+14% EN / +18% JA) on 24kHz Kokoro audio
    mult = "1.18" if is_ja else "1.14"
    tempo = "0.90" if is_ja else "0.92"
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                "-af", f"asetrate=24000*{mult},aresample=44100,atempo={tempo},volume=1.25",
                "-codec:a", "libmp3lame", "-b:a", "96k", mp3_path,
            ],
            check=True,
        )
        with open(mp3_path, "rb") as f:
            data = f.read()
        return Response(content=data, media_type="audio/mpeg")
    finally:
        for p in (wav_path, mp3_path):
            if os.path.exists(p):
                os.remove(p)

uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("OPERO_KOKORO_PORT", "4320")))
PY
