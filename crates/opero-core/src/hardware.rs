use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

use crate::error::{OperoError, OperoResult};
use crate::win_process::silent_command;

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";
static CACHED_RAW_HARDWARE: OnceLock<(String, usize, u64, u64, String, bool, bool)> = OnceLock::new();

/// Release 1 ISMS-approved local Ollama models (Q3/Q16 governance):
/// 1 Standard model (HP ProBook 450 G8 <=6 GB CPU-only baseline) + 1 Lighter Fallback.
pub const ALLOWED_OLLAMA_MODELS: &[&str] = &[
    "qwen2.5:3b",
    "qwen3:1.7b",
];

/// Under ISMS policy (Q3/Q16), OPERO never downloads models or runtimes automatically
/// unless an IT administrator explicitly sets `OPERO_ALLOW_MODEL_DOWNLOAD=true`.
pub fn is_auto_download_allowed() -> bool {
    std::env::var("OPERO_ALLOW_MODEL_DOWNLOAD")
        .map(|v| matches!(v.trim().to_ascii_lowercase().as_str(), "1" | "true" | "yes"))
        .unwrap_or(false)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareProfile {
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub total_ram_gb: u64,
    pub free_disk_gb: u64,
    pub gpu_name: String,
    pub has_dedicated_gpu: bool,
    pub compute_mode: String,
    pub max_model_ram_gb: f32,
    pub recommendation_reason: String,
    pub os_name: String,
    pub recommended_tier: String,
    pub recommended_model_id: String,
    pub auto_download_allowed: bool,
    pub ollama_binary_available: bool,
    pub ollama_running: bool,
    pub installed_models: Vec<String>,
}

pub fn tier_for_ram_gb(ram_gb: u64) -> (&'static str, &'static str) {
    if ram_gb >= 12 {
        ("balanced", "ollama-qwen2.5-3b")
    } else if ram_gb >= 8 {
        ("compact", "ollama-qwen3-1.7b")
    } else {
        ("offline", "offline-deterministic")
    }
}

pub fn recommend_for_hardware(
    ram_gb: u64,
    _cpu_cores: usize,
    _has_dedicated_gpu: bool,
    _is_apple_silicon: bool,
) -> (&'static str, &'static str, f32, String) {
    if ram_gb < 8 {
        return (
            "offline",
            "offline-deterministic",
            0.0,
            "Under 8 GB RAM — using zero-download built-in offline engine.".into(),
        );
    }
    if ram_gb < 12 {
        return (
            "compact",
            "ollama-qwen3-1.7b",
            2.2,
            format!("{ram_gb} GB RAM — Release 1 Lighter Fallback (Qwen3 1.7B, ~1.13 GB model RAM, Apache-2.0)."),
        );
    }
    (
        "balanced",
        "ollama-qwen2.5-3b",
        6.0,
        format!("{ram_gb} GB RAM — Release 1 Standard (Qwen2.5 3B, ~1.94 GB model RAM, Apache-2.0) runs stably within the 6 GB HP ProBook 450 G8 CPU-only ceiling."),
    )
}

pub fn validate_pull_model_tag(tag: &str) -> OperoResult<()> {
    if !ALLOWED_OLLAMA_MODELS.contains(&tag.trim()) {
        return Err(OperoError::Forbidden(format!(
            "Model tag '{}' is not in the Release 1 ISMS-approved OPERO model list (qwen2.5:3b, qwen3:1.7b).",
            tag.trim()
        )));
    }
    Ok(())
}

fn scan_disk_ollama_manifests() -> Vec<String> {
    let base = std::env::var("OLLAMA_MODELS")
        .map(std::path::PathBuf::from)
        .ok()
        .or_else(|| {
            std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .ok()
                .map(|h| std::path::PathBuf::from(h).join(".ollama").join("models"))
        });
    let Some(models_root) = base else { return Vec::new(); };
    let library_dir = models_root.join("manifests").join("registry.ollama.ai").join("library");
    let Ok(entries) = std::fs::read_dir(&library_dir) else { return Vec::new(); };
    let mut found = Vec::new();
    for entry in entries.flatten() {
        let model_name = entry.file_name().to_string_lossy().to_string();
        if let Ok(tags) = std::fs::read_dir(entry.path()) {
            for tag_entry in tags.flatten() {
                if tag_entry.path().is_file() {
                    let tag = tag_entry.file_name().to_string_lossy().to_string();
                    found.push(format!("{model_name}:{tag}"));
                }
            }
        }
    }
    found.sort();
    found
}

fn detect_installed_ollama_models() -> (bool, Vec<String>) {
    if let Some(models) = crate::ollama_runtime::list_live_ollama_models() {
        return (true, models);
    }
    (false, scan_disk_ollama_manifests())
}

#[cfg(target_os = "macos")]
fn detect_hardware_raw() -> (String, usize, u64, u64, String, bool, bool) {
    let cpu = silent_command("sysctl").args(["-n", "machdep.cpu.brand_string"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty()).unwrap_or_else(|| "Apple Silicon".into());
    let cores = silent_command("sysctl").args(["-n", "hw.ncpu"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).and_then(|s| s.trim().parse::<usize>().ok()).unwrap_or(8);
    let ram_bytes = silent_command("sysctl").args(["-n", "hw.memsize"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(16 * 1024 * 1024 * 1024);
    let ram_gb = (ram_bytes / (1024 * 1024 * 1024)).max(4);
    let free_disk_gb = silent_command("df").args(["-k", "/"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|txt| txt.lines().nth(1).and_then(|l| l.split_whitespace().nth(3)).and_then(|kb| kb.parse::<u64>().ok()).map(|kb| kb / (1024 * 1024)))
        .unwrap_or(32);
    let is_apple_silicon = cpu.contains("Apple") || cfg!(target_arch = "aarch64");
    let gpu = if is_apple_silicon { "Apple Metal Integrated GPU".into() } else { "macOS GPU".into() };
    (cpu, cores, ram_gb, free_disk_gb, gpu, false, is_apple_silicon)
}

#[cfg(target_os = "windows")]
fn detect_hardware_raw() -> (String, usize, u64, u64, String, bool, bool) {
    let cores = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4);
    let ps = "try { $c=(Get-CimInstance Win32_Processor | Select -First 1).Name; $m=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB); $d=[math]::Round((Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\").FreeSpace/1GB); $g=(Get-CimInstance Win32_VideoController | Select -ExpandProperty Name) -join '; '; Write-Output \"$c|$m|$d|$g\" } catch {}";
    if let Ok(out) = silent_command("powershell").args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps]).output() {
        let line = String::from_utf8_lossy(&out.stdout).trim().to_string();
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() == 4 {
            let cpu = if parts[0].trim().is_empty() { "Windows x64 Processor".into() } else { parts[0].trim().to_string() };
            let ram_gb = parts[1].trim().parse::<u64>().unwrap_or(16).max(4);
            let free_disk = parts[2].trim().parse::<u64>().unwrap_or(64);
            let gpu = if parts[3].trim().is_empty() { "Integrated Graphics".into() } else { parts[3].trim().to_string() };
            let low_gpu = gpu.to_lowercase();
            let dedicated = low_gpu.contains("nvidia") || low_gpu.contains("rtx") || low_gpu.contains("gtx") || low_gpu.contains("radeon rx");
            return (cpu, cores, ram_gb, free_disk, gpu, dedicated, false);
        }
    }
    let cpu = std::env::var("PROCESSOR_IDENTIFIER").unwrap_or_else(|_| "Windows x64 Processor".into());
    (cpu, cores, 16, 100, "Integrated Graphics (CPU-only)".into(), false, false)
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn detect_hardware_raw() -> (String, usize, u64, u64, String, bool, bool) {
    let cores = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4);
    ("Linux x64 Processor".into(), cores, 16, 64, "CPU-only".into(), false, false)
}

pub fn inspect_hardware_profile() -> HardwareProfile {
    inspect_hardware_profile_with_data_dir(None)
}

pub fn inspect_hardware_profile_with_data_dir(data_dir: Option<&std::path::Path>) -> HardwareProfile {
    let (cpu_name, cpu_cores, total_ram_gb, free_disk_gb, gpu_name, has_dedicated_gpu, is_apple_silicon) =
        CACHED_RAW_HARDWARE.get_or_init(detect_hardware_raw).clone();
    let (recommended_tier, recommended_model_id, max_model_ram_gb, recommendation_reason) =
        recommend_for_hardware(total_ram_gb, cpu_cores, has_dedicated_gpu, is_apple_silicon);
    let ollama_binary_available = crate::ollama_runtime::find_ollama_binary_with_data_dir(data_dir).is_some();
    let (ollama_running, installed_models) = detect_installed_ollama_models();
    let compute_mode = if has_dedicated_gpu {
        "dedicated-gpu"
    } else if is_apple_silicon {
        "metal"
    } else {
        "cpu-only"
    };
    let os_name = if cfg!(target_os = "macos") { "macOS" } else if cfg!(target_os = "windows") { "Windows" } else { "Linux" };

    HardwareProfile {
        cpu_name,
        cpu_cores,
        total_ram_gb,
        free_disk_gb,
        gpu_name,
        has_dedicated_gpu,
        compute_mode: compute_mode.into(),
        max_model_ram_gb,
        recommendation_reason,
        os_name: os_name.into(),
        recommended_tier: recommended_tier.into(),
        recommended_model_id: recommended_model_id.into(),
        auto_download_allowed: is_auto_download_allowed(),
        ollama_binary_available,
        ollama_running,
        installed_models,
    }
}

pub fn pull_curated_ollama_model(tag: &str) -> OperoResult<HardwareProfile> {
    if !is_auto_download_allowed() {
        return Err(OperoError::Forbidden(
            "ISMS policy (Q3/Q16) disables automatic model downloads. Ask IT to pre-install an approved model (qwen2.5:3b or qwen3:1.7b).".into(),
        ));
    }
    let clean = tag.trim();
    validate_pull_model_tag(clean)?;
    let bin = crate::ollama_runtime::find_ollama_binary()
        .ok_or_else(|| OperoError::Validation("Ollama CLI not available on this computer.".into()))?;
    if !detect_installed_ollama_models().0 {
        let tmp = std::env::temp_dir().join("opero-ollama");
        crate::ollama_runtime::spawn_ollama_serve(&bin, &tmp);
        for _ in 0..24 {
            std::thread::sleep(std::time::Duration::from_millis(250));
            if detect_installed_ollama_models().0 {
                break;
            }
        }
    }
    let out = silent_command(&bin)
        .args(["pull", clean])
        .env("OLLAMA_HOST", "127.0.0.1:11434")
        .output()
        .map_err(|e| OperoError::Validation(format!("Ollama CLI not available on this computer: {e}")))?;
    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(OperoError::Validation(format!("Could not download {clean}: {}", stderr.trim())));
    }
    Ok(inspect_hardware_profile())
}

pub fn delete_curated_ollama_model(tag: &str, data_dir: Option<&std::path::Path>) -> OperoResult<HardwareProfile> {
    let clean = tag.trim().to_string();
    validate_pull_model_tag(&clean)?;
    if let Some(dir) = data_dir {
        if crate::ollama_runtime::list_live_ollama_models().is_none() {
            if let Some(bin) = crate::ollama_runtime::find_ollama_binary_with_data_dir(Some(dir)) {
                crate::ollama_runtime::spawn_ollama_serve(&bin, dir);
                for _ in 0..20 {
                    std::thread::sleep(std::time::Duration::from_millis(250));
                    if crate::ollama_runtime::list_live_ollama_models().is_some() {
                        break;
                    }
                }
            }
        }
    }
    let clean_owned = clean.clone();
    let del_res = std::thread::spawn(move || -> OperoResult<()> {
        let client = reqwest::blocking::Client::builder()
            .connect_timeout(std::time::Duration::from_secs(3))
            .timeout(std::time::Duration::from_secs(20))
            .build()
            .map_err(|e| OperoError::Process(format!("HTTP client error: {e}")))?;
        let resp = client
            .delete(format!("{OLLAMA_LOOPBACK}/api/delete"))
            .json(&serde_json::json!({ "name": clean_owned }))
            .send()
            .map_err(|e| OperoError::Process(format!("Failed to contact Ollama for model deletion: {e}")))?;
        if !resp.status().is_success() && resp.status().as_u16() != 404 {
            return Err(OperoError::Validation(format!(
                "Could not delete model {clean_owned} (HTTP {})",
                resp.status()
            )));
        }
        Ok(())
    })
    .join()
    .map_err(|_| OperoError::Process("Delete thread panicked".into()))?;
    del_res?;
    Ok(inspect_hardware_profile_with_data_dir(data_dir))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_tier_mapping_and_model_allowlist() {
        assert_eq!(tier_for_ram_gb(4), ("offline", "offline-deterministic"));
        assert_eq!(tier_for_ram_gb(8), ("compact", "ollama-qwen3-1.7b"));
        assert_eq!(tier_for_ram_gb(16), ("balanced", "ollama-qwen2.5-3b"));
        assert_eq!(tier_for_ram_gb(32), ("balanced", "ollama-qwen2.5-3b"));

        // HP ProBook 450 G8 baseline: i7-1165G7 (8 threads), 16 GB RAM, Iris Xe (CPU-only, <=6 GB cap)
        let (tier, model, max_ram, reason) = recommend_for_hardware(16, 8, false, false);
        assert_eq!(tier, "balanced");
        assert_eq!(model, "ollama-qwen2.5-3b");
        assert!((max_ram - 6.0).abs() < f32::EPSILON);
        assert!(reason.contains("6 GB"));

        assert!(validate_pull_model_tag("qwen2.5:3b").is_ok());
        assert!(validate_pull_model_tag("qwen3:1.7b").is_ok());
        assert!(validate_pull_model_tag("qwen3:4b").is_err());
        assert!(validate_pull_model_tag("evil/untrusted:latest").is_err());
        assert!(!is_auto_download_allowed());
    }
}
