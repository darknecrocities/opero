use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use crate::error::{OperoError, OperoResult};
use crate::hardware::{inspect_hardware_profile_with_data_dir, validate_pull_model_tag, HardwareProfile};
use crate::ollama_runtime::{
    find_ollama_binary_with_data_dir, list_live_ollama_models, spawn_ollama_serve,
};

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelPullJobStatus {
    pub job_id: String,
    pub model_tag: String,
    pub phase: String,
    pub status_text: String,
    pub completed_bytes: u64,
    pub total_bytes: u64,
    pub percent: Option<f32>,
    pub speed_bytes_per_sec: Option<u64>,
    pub error: Option<String>,
    pub hardware: Option<HardwareProfile>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct OllamaPullEvent {
    pub status: String,
    pub completed: u64,
    pub total: u64,
    pub percent: Option<f32>,
}

pub fn parse_ollama_pull_line(line: &str) -> Result<Option<OllamaPullEvent>, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    let val: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| format!("Invalid Ollama stream JSON: {e}"))?;
    if let Some(err) = val.get("error").and_then(|e| e.as_str()) {
        return Err(err.to_string());
    }
    let status = val
        .get("status")
        .and_then(|s| s.as_str())
        .unwrap_or("pulling")
        .to_string();
    let completed = val.get("completed").and_then(|n| n.as_u64()).unwrap_or(0);
    let total = val.get("total").and_then(|n| n.as_u64()).unwrap_or(0);
    let percent = if total > 0 {
        Some(((completed as f64 / total as f64) * 100.0).clamp(0.0, 100.0) as f32)
    } else {
        None
    };
    Ok(Some(OllamaPullEvent {
        status,
        completed,
        total,
        percent,
    }))
}

fn download_file_with_progress(
    url: &str,
    dest: &Path,
    on_chunk: &mut dyn FnMut(u64, u64, Option<u64>),
) -> OperoResult<()> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let client = reqwest::blocking::Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(600))
        .user_agent("OPERO-Desktop/1.0")
        .build()
        .map_err(|e| OperoError::Process(format!("HTTP client error: {e}")))?;
    let mut resp = client
        .get(url)
        .send()
        .map_err(|e| OperoError::Process(format!("Failed to download Ollama runtime: {e}")))?;
    if !resp.status().is_success() {
        return Err(OperoError::Process(format!(
            "Ollama download server returned HTTP {}",
            resp.status()
        )));
    }
    let total = resp.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(dest)?;
    let mut buf = [0u8; 65536];
    let mut completed: u64 = 0;
    let started = Instant::now();
    let mut last_emit = Instant::now();

    loop {
        let n = resp
            .read(&mut buf)
            .map_err(|e| OperoError::Process(format!("Download interrupted: {e}")))?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n])?;
        completed += n as u64;
        if last_emit.elapsed() >= Duration::from_millis(120) || (total > 0 && completed >= total) {
            let secs = started.elapsed().as_secs_f64().max(0.05);
            let speed = Some((completed as f64 / secs) as u64);
            on_chunk(completed, total, speed);
            last_emit = Instant::now();
        }
    }
    file.flush()?;
    let secs = started.elapsed().as_secs_f64().max(0.05);
    on_chunk(completed, total.max(completed), Some((completed as f64 / secs) as u64));
    Ok(())
}

#[cfg(target_os = "windows")]
fn install_ollama_automatically(
    data_dir: &Path,
    on_progress: &mut dyn FnMut(&str, u64, u64, Option<u64>),
) -> OperoResult<PathBuf> {
    let installer = data_dir.join("downloads").join("OllamaSetup.exe");
    on_progress("Downloading Ollama for Windows...", 0, 0, None);
    download_file_with_progress(
        "https://ollama.com/download/OllamaSetup.exe",
        &installer,
        &mut |done, total, speed| {
            on_progress("Downloading Ollama for Windows...", done, total, speed);
        },
    )?;

    on_progress("Installing Ollama runtime on Windows...", 0, 0, None);
    let status = crate::win_process::silent_command(&installer)
        .args(["/VERYSILENT", "/NORESTART", "/CURRENTUSER"])
        .status()
        .map_err(|e| OperoError::Process(format!("Failed to launch Ollama installer: {e}")))?;
    let _ = std::fs::remove_file(&installer);
    if !status.success() {
        return Err(OperoError::Process(format!(
            "Ollama Windows installer exited with status {status}"
        )));
    }

    for _ in 0..30 {
        if let Some(bin) = find_ollama_binary_with_data_dir(Some(data_dir)) {
            return Ok(bin);
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    Err(OperoError::Process(
        "Ollama finished installing, but ollama.exe could not be located.".into(),
    ))
}

#[cfg(target_os = "macos")]
fn install_ollama_automatically(
    data_dir: &Path,
    on_progress: &mut dyn FnMut(&str, u64, u64, Option<u64>),
) -> OperoResult<PathBuf> {
    use std::os::unix::fs::PermissionsExt;

    let archive_path = data_dir.join("downloads").join("Ollama-darwin.zip");
    on_progress("Downloading Ollama for macOS...", 0, 0, None);
    download_file_with_progress(
        "https://ollama.com/download/Ollama-darwin.zip",
        &archive_path,
        &mut |done, total, speed| {
            on_progress("Downloading Ollama for macOS...", done, total, speed);
        },
    )?;

    on_progress("Extracting Ollama runtime...", 0, 0, None);
    let extract_dir = data_dir.join("ollama-app");
    std::fs::create_dir_all(&extract_dir)?;
    let file = std::fs::File::open(&archive_path)?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| OperoError::Process(format!("Invalid Ollama macOS zip archive: {e}")))?;
    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| OperoError::Process(format!("Zip entry error: {e}")))?;
        let Some(rel) = entry.enclosed_name().map(|p| p.to_path_buf()) else {
            continue;
        };
        let out_path = extract_dir.join(rel);
        if entry.is_dir() {
            std::fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut out = std::fs::File::create(&out_path)?;
            std::io::copy(&mut entry, &mut out)?;
            if let Some(mode) = entry.unix_mode() {
                let _ = std::fs::set_permissions(&out_path, std::fs::Permissions::from_mode(mode));
            }
        }
    }
    let _ = std::fs::remove_file(&archive_path);

    let bin = extract_dir
        .join("Ollama.app")
        .join("Contents")
        .join("Resources")
        .join("ollama");
    if bin.exists() {
        let _ = std::fs::set_permissions(&bin, std::fs::Permissions::from_mode(0o755));
        return Ok(bin);
    }
    find_ollama_binary_with_data_dir(Some(data_dir)).ok_or_else(|| {
        OperoError::Process("Extracted Ollama for macOS, but could not locate ollama binary.".into())
    })
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn install_ollama_automatically(
    _data_dir: &Path,
    _on_progress: &mut dyn FnMut(&str, u64, u64, Option<u64>),
) -> OperoResult<PathBuf> {
    Err(OperoError::Validation(
        "Automatic Ollama installation is supported on Windows and macOS. Install via https://ollama.com/install.sh.".into(),
    ))
}

fn stream_ollama_pull_http(
    tag: &str,
    on_event: &mut dyn FnMut(OllamaPullEvent, Option<u64>),
) -> OperoResult<()> {
    let client = reqwest::blocking::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| OperoError::Process(format!("HTTP client error: {e}")))?;
    let resp = client
        .post(format!("{OLLAMA_LOOPBACK}/api/pull"))
        .json(&serde_json::json!({ "name": tag, "stream": true }))
        .send()
        .map_err(|e| OperoError::Process(format!("Could not reach local Ollama server: {e}")))?;
    if !resp.status().is_success() {
        return Err(OperoError::Process(format!(
            "Local Ollama pull returned HTTP {}",
            resp.status()
        )));
    }

    let reader = BufReader::new(resp);
    let mut layer_started = Instant::now();
    let mut layer_total: u64 = 0;
    let mut layer_base: u64 = 0;

    for line_res in reader.lines() {
        let line = line_res.map_err(|e| OperoError::Process(format!("Stream read error: {e}")))?;
        let ev = parse_ollama_pull_line(&line).map_err(OperoError::Validation)?;
        let Some(event) = ev else { continue };
        let speed = if event.total > 0 {
            if event.total != layer_total || event.completed < layer_base {
                layer_total = event.total;
                layer_base = event.completed;
                layer_started = Instant::now();
                None
            } else {
                let elapsed = layer_started.elapsed().as_secs_f64();
                if elapsed >= 0.25 && event.completed > layer_base {
                    Some(((event.completed - layer_base) as f64 / elapsed) as u64)
                } else {
                    None
                }
            }
        } else {
            None
        };
        on_event(event, speed);
    }
    Ok(())
}

pub fn run_automated_model_pull(
    data_dir: &Path,
    job_id: &str,
    tag: &str,
    mut on_update: impl FnMut(ModelPullJobStatus),
) {
    let clean = tag.trim().to_string();
    let make_status = |phase: &str, text: &str, done: u64, total: u64, pct: Option<f32>, speed: Option<u64>, err: Option<String>, hw: Option<HardwareProfile>| ModelPullJobStatus {
        job_id: job_id.to_string(),
        model_tag: clean.clone(),
        phase: phase.to_string(),
        status_text: text.to_string(),
        completed_bytes: done,
        total_bytes: total,
        percent: pct,
        speed_bytes_per_sec: speed,
        error: err,
        hardware: hw,
    };

    if !crate::hardware::is_auto_download_allowed() {
        on_update(make_status(
            "failed",
            "Automatic model download disabled by ISMS policy",
            0,
            0,
            None,
            None,
            Some("ISMS policy (Q3/Q16) blocks automatic model downloads. Ask IT to pre-install an approved model (qwen2.5:3b or qwen3:1.7b).".into()),
            None,
        ));
        return;
    }

    if let Err(e) = validate_pull_model_tag(&clean) {
        on_update(make_status("failed", "Unsupported model tag", 0, 0, None, None, Some(e.to_string()), None));
        return;
    }

    on_update(make_status("checking_runtime", "Checking local Ollama runtime...", 0, 0, None, None, None, None));

    let bin = match find_ollama_binary_with_data_dir(Some(data_dir)) {
        Some(b) => b,
        None => {
            let res = install_ollama_automatically(data_dir, &mut |text, done, total, speed| {
                let pct = if total > 0 {
                    Some(((done as f64 / total as f64) * 100.0).clamp(0.0, 100.0) as f32)
                } else {
                    None
                };
                on_update(make_status("installing_ollama", text, done, total, pct, speed, None, None));
            });
            match res {
                Ok(b) => b,
                Err(e) => {
                    on_update(make_status("failed", "Ollama installation failed", 0, 0, None, None, Some(e.to_string()), None));
                    return;
                }
            }
        }
    };

    if list_live_ollama_models().is_none() {
        on_update(make_status("starting_ollama", "Starting local Ollama server...", 0, 0, None, None, None, None));
        spawn_ollama_serve(&bin, data_dir);
        let mut ready = false;
        for _ in 0..40 {
            std::thread::sleep(Duration::from_millis(300));
            if list_live_ollama_models().is_some() {
                ready = true;
                break;
            }
        }
        if !ready {
            on_update(make_status(
                "failed",
                "Local Ollama did not respond",
                0,
                0,
                None,
                None,
                Some("Ollama was started but did not respond on 127.0.0.1:11434.".into()),
                None,
            ));
            return;
        }
    }

    on_update(make_status("pulling_model", &format!("Requesting {clean} manifest..."), 0, 0, None, None, None, None));

    let pull_res = stream_ollama_pull_http(&clean, &mut |ev, speed| {
        let lower = ev.status.to_lowercase();
        let phase = if lower.contains("verify") || lower.contains("writing") || lower.contains("success") {
            "verifying"
        } else {
            "pulling_model"
        };
        on_update(make_status(phase, &ev.status, ev.completed, ev.total, ev.percent, speed, None, None));
    });

    if let Err(e) = pull_res {
        on_update(make_status("failed", "Model download failed", 0, 0, None, None, Some(e.to_string()), None));
        return;
    }

    let hw = inspect_hardware_profile_with_data_dir(Some(data_dir));
    on_update(make_status("completed", &format!("Downloaded {clean}"), 0, 0, Some(100.0), None, None, Some(hw)));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ollama_pull_ndjson_lines() {
        let manifest = parse_ollama_pull_line(r#"{"status":"pulling manifest"}"#).unwrap().unwrap();
        assert_eq!(manifest.status, "pulling manifest");
        assert_eq!(manifest.percent, None);

        let chunk = parse_ollama_pull_line(
            r#"{"status":"pulling 6a0746a1ec1a","digest":"sha256:abc","total":1000,"completed":250}"#,
        )
        .unwrap()
        .unwrap();
        assert_eq!(chunk.completed, 250);
        assert_eq!(chunk.total, 1000);
        assert!((chunk.percent.unwrap() - 25.0).abs() < 0.01);

        let err = parse_ollama_pull_line(r#"{"error":"pull model manifest: file does not exist"}"#);
        assert!(err.is_err());
    }
}
