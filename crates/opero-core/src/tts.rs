use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use crate::error::{OperoError, OperoResult};
use crate::pipeline::validate_loopback_url;

const MAX_TTS_CHARS: usize = 220;

pub fn sanitize_tts_text(raw: &str) -> String {
    raw.chars()
        .filter(|c| !c.is_control() || *c == ' ')
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(MAX_TTS_CHARS)
        .collect()
}

pub fn tts_cache_key(text: &str, lang: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"opero-child-tts-v2:");
    hasher.update(lang.as_bytes());
    hasher.update(b":");
    hasher.update(text.as_bytes());
    hex::encode(hasher.finalize())
}

fn try_external_loopback_tts(text: &str, lang: &str) -> Option<Vec<u8>> {
    let url = std::env::var("OPERO_TTS_URL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "http://127.0.0.1:4320/speak".to_string());
    let trimmed = url.trim();
    if trimmed.is_empty() || validate_loopback_url(trimmed).is_err() {
        return None;
    }
    let payload = serde_json::json!({
        "text": text,
        "lang": lang,
        "style": "child",
    })
    .to_string();

    let out = Command::new("curl")
        .args([
            "-sS",
            "--connect-timeout",
            "0.25",
            "--max-time",
            "3",
            "-X",
            "POST",
            "-H",
            "Content-Type: application/json",
            "-d",
            &payload,
            trimmed,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .ok()?;
    if out.status.success() && out.stdout.len() > 256 {
        Some(out.stdout)
    } else {
        None
    }
}

#[cfg(target_os = "macos")]
fn synthesize_macos_child_mp3(cache_dir: &Path, key: &str, text: &str, lang: &str) -> OperoResult<Vec<u8>> {
    let aiff_path = cache_dir.join(format!("{key}.aiff"));
    let mp3_path = cache_dir.join(format!("{key}.mp3"));

    // macOS `say` outputs 22050 Hz mono AIFF; apply gentle warmth without harsh chipmunk pitch distortion.
    let (voice, rate, filter) = if lang.starts_with("ja") {
        (
            "Kyoko",
            "178",
            "aresample=44100,equalizer=f=240:t=q:w=1.2:g=2.0,highshelf=f=6000:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
        )
    } else {
        (
            "Samantha",
            "182",
            "aresample=44100,equalizer=f=240:t=q:w=1.2:g=2.0,highshelf=f=6000:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
        )
    };

    let say_status = Command::new("say")
        .args(["-v", voice, "-r", rate, "-o", &aiff_path.to_string_lossy(), text])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| OperoError::Process(format!("macOS say unavailable: {e}")))?;
    if !say_status.success() {
        let _ = std::fs::remove_file(&aiff_path);
        return Err(OperoError::Process("macOS say synthesis failed".to_string()));
    }

    let ffmpeg_bin = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"]
        .iter()
        .find(|p| **p == "ffmpeg" || Path::new(p).exists())
        .copied()
        .unwrap_or("ffmpeg");

    let ff_status = Command::new(ffmpeg_bin)
        .args([
            "-y",
            "-loglevel",
            "error",
            "-i",
            &aiff_path.to_string_lossy(),
            "-af",
            filter,
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "96k",
            &mp3_path.to_string_lossy(),
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

    let _ = std::fs::remove_file(&aiff_path);

    match ff_status {
        Ok(st) if st.success() => std::fs::read(&mp3_path)
            .map_err(|e| OperoError::Process(format!("Failed reading synthesized mp3: {e}"))),
        _ => Err(OperoError::Process("ffmpeg child mastering unavailable".to_string())),
    }
}

#[cfg(not(target_os = "macos"))]
fn synthesize_macos_child_mp3(_cache_dir: &Path, _key: &str, _text: &str, _lang: &str) -> OperoResult<Vec<u8>> {
    Err(OperoError::Process("Native CLI child TTS only configured on macOS; use browser speechSynthesis fallback".to_string()))
}

pub fn synthesize_child_speech(
    data_dir: &Path,
    raw_text: &str,
    raw_lang: &str,
) -> OperoResult<(Vec<u8>, &'static str)> {
    let text = sanitize_tts_text(raw_text);
    if text.is_empty() {
        return Err(OperoError::Validation("Speech text must not be empty".to_string()));
    }
    let lang = if raw_lang.starts_with("ja") { "ja-JP" } else { "en-US" };
    let cache_dir: PathBuf = data_dir.join("cache").join("tts");
    let _ = std::fs::create_dir_all(&cache_dir);

    let key = tts_cache_key(&text, lang);
    let cached_mp3 = cache_dir.join(format!("{key}.mp3"));
    if cached_mp3.exists() {
        if let Ok(bytes) = std::fs::read(&cached_mp3) {
            if bytes.len() > 256 {
                return Ok((bytes, "local-cache"));
            }
        }
    }

    if let Some(bytes) = try_external_loopback_tts(&text, lang) {
        let _ = std::fs::write(&cached_mp3, &bytes);
        return Ok((bytes, "loopback-tts"));
    }

    let bytes = synthesize_macos_child_mp3(&cache_dir, &key, &text, lang)?;
    Ok((bytes, "macos-child-tts"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tts_sanitization_and_deterministic_cache_key() {
        assert_eq!(sanitize_tts_text("  Opero!\n\t  "), "Opero!");
        let long = "a".repeat(300);
        assert_eq!(sanitize_tts_text(&long).len(), MAX_TTS_CHARS);

        let k1 = tts_cache_key("Opero!", "en-US");
        let k2 = tts_cache_key("Opero!", "en-US");
        let k3 = tts_cache_key("Opero!", "ja-JP");
        assert_eq!(k1, k2);
        assert_ne!(k1, k3);
    }

    #[test]
    fn test_tts_rejects_empty_text() {
        let dir = std::env::temp_dir().join("opero_tts_unit_test");
        let err = synthesize_child_speech(&dir, "   \n  ", "en-US").unwrap_err();
        assert!(err.to_string().contains("must not be empty"));
    }
}
