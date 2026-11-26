use reqwest::blocking::Client;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Once;
use std::time::Duration;

use crate::error::{OperoError, OperoResult};
use crate::pipeline::validate_loopback_url;
use crate::win_process::silent_command;

const MAX_TTS_CHARS: usize = 220;
static KOKORO_AUTOSTART: Once = Once::new();

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

pub fn normalize_tts_lang(raw_lang: &str) -> &'static str {
    let lower = raw_lang.to_lowercase();
    if lower.starts_with("ja") {
        "ja-JP"
    } else if lower.starts_with("fil") || lower.starts_with("tl") {
        "fil-PH"
    } else {
        "en-US"
    }
}

pub fn normalize_tts_tone(raw_tone: Option<&str>) -> &'static str {
    match raw_tone.unwrap_or("calm_concise").trim() {
        "friendly_guide" => "friendly_guide",
        "technical_direct" => "technical_direct",
        "formal_sop" => "formal_sop",
        _ => "calm_concise",
    }
}

pub fn tts_cache_key(text: &str, lang: &str) -> String {
    tts_cache_key_with_tone(text, lang, None)
}

pub fn tts_cache_key_with_tone(text: &str, lang: &str, tone: Option<&str>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"opero-child-tts-v4-neural:");
    hasher.update(lang.as_bytes());
    hasher.update(b":");
    hasher.update(normalize_tts_tone(tone).as_bytes());
    hasher.update(b":");
    hasher.update(text.as_bytes());
    hex::encode(hasher.finalize())
}

fn prosody_for_tone(tone: &str) -> (&'static str, &'static str) {
    match tone {
        "friendly_guide" => ("+4%", "+3Hz"),
        "technical_direct" => ("+6%", "-2Hz"),
        "formal_sop" => ("-6%", "-2Hz"),
        _ => ("-4%", "-1Hz"),
    }
}

fn edge_voice_for_lang(lang: &str) -> (&'static str, &'static str) {
    match lang {
        "ja-JP" => (
            "ja-JP-NanamiNeural",
            "asetrate=24000*1.11,aresample=44100,atempo=0.90,equalizer=f=260:t=q:w=1.2:g=2.0,highshelf=f=6500:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
        ),
        "fil-PH" => (
            "fil-PH-BlessicaNeural",
            "asetrate=24000*1.08,aresample=44100,atempo=0.93,equalizer=f=260:t=q:w=1.2:g=2.0,highshelf=f=6500:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
        ),
        _ => (
            "en-US-AnaNeural",
            "equalizer=f=260:t=q:w=1.2:g=2.0,highshelf=f=6500:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
        ),
    }
}

fn maybe_autostart_kokoro_server() {
    #[cfg(target_os = "macos")]
    KOKORO_AUTOSTART.call_once(|| {
        let candidates = [
            PathBuf::from("scripts/start_kokoro_tts.sh"),
            PathBuf::from("/Users/arronkianparejas/opero/scripts/start_kokoro_tts.sh"),
        ];
        if let Some(script) = candidates.into_iter().find(|p| p.exists()) {
            let _ = silent_command("/bin/bash")
                .arg(script)
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn();
        }
    });
    #[cfg(not(target_os = "macos"))]
    KOKORO_AUTOSTART.call_once(|| {});
}

fn try_external_loopback_tts(text: &str, lang: &str, tone: &str) -> Option<Vec<u8>> {
    let url = std::env::var("OPERO_TTS_URL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "http://127.0.0.1:4320/speak".to_string());
    let trimmed = url.trim().to_string();
    if trimmed.is_empty() || validate_loopback_url(&trimmed).is_err() {
        return None;
    }
    let payload = serde_json::json!({
        "text": text,
        "lang": lang,
        "tone": tone,
        "style": "child",
    });

    let bytes = std::thread::spawn(move || -> Option<Vec<u8>> {
        let client = Client::builder()
            .connect_timeout(Duration::from_millis(350))
            .timeout(Duration::from_secs(10))
            .build()
            .ok()?;
        let resp = client.post(&trimmed).json(&payload).send().ok()?;
        if !resp.status().is_success() {
            return None;
        }
        let b = resp.bytes().ok()?;
        if b.len() > 256 { Some(b.to_vec()) } else { None }
    })
    .join()
    .ok()
    .flatten();

    if bytes.is_some() {
        return bytes;
    }
    maybe_autostart_kokoro_server();
    None
}

fn find_python_for_edge_tts() -> Option<&'static str> {
    let candidates: &[&str] = if cfg!(target_os = "windows") {
        &["py", "python", "python3"]
    } else {
        &["python3", "python"]
    };
    for bin in candidates {
        let ok = silent_command(bin)
            .args(["-c", "import edge_tts"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
        if ok {
            return Some(bin);
        }
    }
    None
}

fn try_edge_neural_mp3(
    cache_dir: &Path,
    key: &str,
    text: &str,
    lang: &str,
    tone: &str,
) -> Option<Vec<u8>> {
    let py_bin = find_python_for_edge_tts()?;
    let (voice, filter) = edge_voice_for_lang(lang);
    let (rate, pitch) = prosody_for_tone(tone);
    let raw_mp3 = cache_dir.join(format!("{key}.raw.mp3"));
    let final_mp3 = cache_dir.join(format!("{key}.mp3"));

    let script = "import asyncio, sys, edge_tts; asyncio.run(edge_tts.Communicate(sys.argv[1], sys.argv[2], rate=sys.argv[3], pitch=sys.argv[4]).save(sys.argv[5]))";
    let status = silent_command(py_bin)
        .args(["-c", script, text, voice, rate, pitch, &raw_mp3.to_string_lossy()])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .ok()?;
    if !status.success() || !raw_mp3.exists() {
        let _ = std::fs::remove_file(&raw_mp3);
        return None;
    }

    let ffmpeg_bin = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"]
        .iter()
        .find(|p| **p == "ffmpeg" || Path::new(p).exists())
        .copied()
        .unwrap_or("ffmpeg");

    let mastered = silent_command(ffmpeg_bin)
        .args([
            "-y",
            "-loglevel",
            "error",
            "-i",
            &raw_mp3.to_string_lossy(),
            "-af",
            filter,
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "112k",
            &final_mp3.to_string_lossy(),
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false);

    if mastered && final_mp3.exists() {
        let _ = std::fs::remove_file(&raw_mp3);
        if let Ok(bytes) = std::fs::read(&final_mp3) {
            if bytes.len() > 256 {
                return Some(bytes);
            }
        }
    }

    if let Ok(raw_bytes) = std::fs::read(&raw_mp3) {
        let _ = std::fs::rename(&raw_mp3, &final_mp3);
        if raw_bytes.len() > 256 {
            return Some(raw_bytes);
        }
    }
    let _ = std::fs::remove_file(&raw_mp3);
    None
}

#[cfg(target_os = "macos")]
fn synthesize_macos_child_mp3(cache_dir: &Path, key: &str, text: &str, lang: &str) -> OperoResult<Vec<u8>> {
    let aiff_path = cache_dir.join(format!("{key}.aiff"));
    let mp3_path = cache_dir.join(format!("{key}.mp3"));

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

    let say_status = silent_command("say")
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

    let ff_status = silent_command(ffmpeg_bin)
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
    Err(OperoError::Process("Offline neural TTS unavailable; falling back to bundled Pero clips".to_string()))
}

pub fn synthesize_child_speech(
    data_dir: &Path,
    raw_text: &str,
    raw_lang: &str,
) -> OperoResult<(Vec<u8>, &'static str)> {
    synthesize_child_speech_with_tone(data_dir, raw_text, raw_lang, None)
}

pub fn synthesize_child_speech_with_tone(
    data_dir: &Path,
    raw_text: &str,
    raw_lang: &str,
    raw_tone: Option<&str>,
) -> OperoResult<(Vec<u8>, &'static str)> {
    let text = sanitize_tts_text(raw_text);
    if text.is_empty() {
        return Err(OperoError::Validation("Speech text must not be empty".to_string()));
    }
    let lang = normalize_tts_lang(raw_lang);
    let tone = normalize_tts_tone(raw_tone);
    let cache_dir: PathBuf = data_dir.join("cache").join("tts");
    let _ = std::fs::create_dir_all(&cache_dir);

    let key = tts_cache_key_with_tone(&text, lang, Some(tone));
    let cached_mp3 = cache_dir.join(format!("{key}.mp3"));
    if cached_mp3.exists() {
        if let Ok(bytes) = std::fs::read(&cached_mp3) {
            if bytes.len() > 256 {
                return Ok((bytes, "local-cache"));
            }
        }
    }

    if let Some(bytes) = try_external_loopback_tts(&text, lang, tone) {
        let _ = std::fs::write(&cached_mp3, &bytes);
        return Ok((bytes, "loopback-tts"));
    }

    if let Some(bytes) = try_edge_neural_mp3(&cache_dir, &key, &text, lang, tone) {
        return Ok((bytes, "edge-neural"));
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
        let k4 = tts_cache_key_with_tone("Opero!", "en-US", Some("formal_sop"));
        assert_eq!(k1, k2);
        assert_ne!(k1, k3);
        assert_ne!(k1, k4);
        assert_eq!(normalize_tts_lang("fil-PH"), "fil-PH");
    }

    #[test]
    fn test_tts_rejects_empty_text() {
        let dir = std::env::temp_dir().join("opero_tts_unit_test");
        let err = synthesize_child_speech(&dir, "   \n  ", "en-US").unwrap_err();
        assert!(err.to_string().contains("must not be empty"));
    }
}
