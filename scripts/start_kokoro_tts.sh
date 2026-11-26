#!/usr/bin/env bash
set -euo pipefail

# Local Neural Child-Voice TTS Server for OPERO (Kokoro-82M, Apache 2.0)
# Runs strictly on loopback http://127.0.0.1:4320/speak — auto-started by opero-core/src/tts.rs.
# Usage: bash scripts/start_kokoro_tts.sh

PORT="${OPERO_KOKORO_PORT:-4320}"
DEFAULT_HF="$HOME/Library/Application Support/OPERO/hf-cache"
mkdir -p "$DEFAULT_HF/hub"
export HF_HOME="$DEFAULT_HF"
export HUGGINGFACE_HUB_CACHE="$DEFAULT_HF/hub"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

echo "Starting OPERO Kokoro-82M (Apache 2.0) neural child-voice server on http://127.0.0.1:${PORT}/speak ..."

uv run --with "kokoro>=0.9.4" --with "misaki[ja]" --with "soundfile" --with "fugashi" --with "unidic-lite" --with "jaconv" --with "mojimoji" --with "fastapi" --with "uvicorn" python3 - <<'PY'
import os
import subprocess
import tempfile
import numpy as np
import soundfile as sf
import unidic, unidic_lite
unidic.DICDIR = unidic_lite.DICDIR
from fastapi import FastAPI, Response
from pydantic import BaseModel
from kokoro import KPipeline
import uvicorn

app = FastAPI(title="OPERO Local Kokoro-82M Neural Child TTS")
pipelines = {}

def get_pipeline(lang_code: str) -> KPipeline:
    if lang_code not in pipelines:
        pipelines[lang_code] = KPipeline(lang_code=lang_code, repo_id="hexgrad/Kokoro-82M")
    return pipelines[lang_code]

class SpeakReq(BaseModel):
    text: str
    lang: str = "en-US"
    style: str = "child"

@app.get("/health")
def health():
    return {"status": "ok", "engine": "kokoro-82m-child"}

@app.post("/speak")
def speak(req: SpeakReq):
    is_ja = req.lang.lower().startswith("ja")
    lang_code = "j" if is_ja else "a"
    # Youthful, bright mascot voices: jf_nezumi (JA) & af_sky (EN)
    voice = "jf_nezumi" if is_ja else "af_sky"
    pace = 0.90 if is_ja else 0.94
    pipe = get_pipeline(lang_code)
    chunks = [audio for _, _, audio in pipe(req.text, voice=voice, speed=pace)]
    if not chunks:
        return Response(status_code=500)
    wav = np.concatenate(chunks)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wf:
        sf.write(wf.name, wav, 24000)
        wav_path = wf.name
    mp3_path = wav_path.replace(".wav", ".mp3")
    # Gentle natural child formant lift (+10% pitch, tempo-compensated) + warm EQ — zero robotic artifacts
    child_filter = (
        "asetrate=24000*1.11,aresample=44100,atempo=0.90,"
        "equalizer=f=260:t=q:w=1.2:g=2.0,"
        "highshelf=f=6500:g=-1.5,"
        "loudnorm=I=-16:TP=-1.5:LRA=11"
    )
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                "-af", child_filter,
                "-codec:a", "libmp3lame", "-b:a", "128k", mp3_path,
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
