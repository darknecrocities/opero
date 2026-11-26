use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::error::{OperoError, OperoResult};

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

pub const ALLOWED_OLLAMA_MODELS: &[&str] = &[
    "qwen2.5:1.5b",
    "qwen3:1.7b",
    "qwen2.5:3b",
    "phi4-mini:3.8b",
    "qwen3:4b",
    "gemma3:4b",
    "qwen2.5:7b",
    "qwen3:8b",
];

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
    pub ollama_running: bool,
    pub installed_models: Vec<String>,
}

pub fn tier_for_ram_gb(ram_gb: u64) -> (&'static str, &'static str) {
    if ram_gb >= 24 {
        ("deep", "ollama-qwen3-8b")
    } else if ram_gb >= 12 {
        ("balanced", "ollama-qwen3-4b")
    } else if ram_gb >= 8 {
        ("compact", "ollama-qwen3-1.7b")
    } else {
        ("offline", "offline-deterministic")
    }
}

pub fn recommend_for_hardware(
    ram_gb: u64,
    cpu_cores: usize,
    has_dedicated_gpu: bool,
    is_apple_silicon: bool,
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
            2.5,
            format!("{ram_gb} GB RAM — compact 1.7B model fits safely under 2.5 GB RAM."),
        );
    }
    if ram_gb < 24 {
        if !has_dedicated_gpu && !is_apple_silicon {
            // Baseline MMI office PC (e.g. HP ProBook 450 G8: i7-1165G7, 16 GB RAM, Iris Xe CPU-only, <=6 GB cap)
            let (model_id, reason) = if cpu_cores <= 8 {
                (
                    "ollama-qwen2.5-3b",
                    format!(
                        "{ram_gb} GB RAM · CPU-only ({cpu_cores} threads) — Qwen2.5 3B (~2.4 GB RAM) delivers fastest EN/JA manual generation well within the 6 GB RAM ceiling."
                    ),
                )
            } else {
                (
                    "ollama-qwen3-4b",
                    format!(
                        "{ram_gb} GB RAM · CPU-only ({cpu_cores} threads) — Qwen3 4B (~3.4 GB RAM) stays well within the 6 GB RAM ceiling."
                    ),
                )
            };
            return ("balanced", model_id, 6.0, reason);
        }
        return (
            "balanced",
            "ollama-qwen3-4b",
            6.0,
            format!("{ram_gb} GB RAM with GPU/Metal acceleration — Qwen3 4B (~3.4 GB RAM) recommended."),
        );
    }
    let max_ram = if has_dedicated_gpu || is_apple_silicon { 10.0 } else { 6.0 };
    let model = if has_dedicated_gpu || is_apple_silicon { "ollama-qwen3-8b" } else { "ollama-qwen2.5-7b" };
    (
        "deep",
        model,
        max_ram,
        format!("{ram_gb} GB RAM — high-capacity tier unlocked (model RAM budget ≤ {max_ram:.0} GB)."),
    )
}

pub fn validate_pull_model_tag(tag: &str) -> OperoResult<()> {
    if !ALLOWED_OLLAMA_MODELS.contains(&tag.trim()) {
        return Err(OperoError::Forbidden(format!(
            "Model tag '{}' is not in the curated OPERO commercial-safe model catalog.",
            tag.trim()
        )));
    }
    Ok(())
}

fn detect_installed_ollama_models() -> (bool, Vec<String>) {
    let out = Command::new("curl")
        .args(["-fsS", "--max-time", "1", &format!("{OLLAMA_LOOPBACK}/api/tags")])
        .output();
    let Ok(out) = out else { return (false, Vec::new()); };
    if !out.status.success() { return (false, Vec::new()); }
    let Ok(val) = serde_json::from_slice::<serde_json::Value>(&out.stdout) else { return (true, Vec::new()); };
    let models = val
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| arr.iter().filter_map(|item| item.get("name").and_then(|n| n.as_str()).map(str::to_string)).collect())
        .unwrap_or_default();
    (true, models)
}

#[cfg(target_os = "macos")]
fn detect_hardware_raw() -> (String, usize, u64, u64, String, bool, bool) {
    let cpu = Command::new("sysctl").args(["-n", "machdep.cpu.brand_string"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty()).unwrap_or_else(|| "Apple Silicon".into());
    let cores = Command::new("sysctl").args(["-n", "hw.ncpu"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).and_then(|s| s.trim().parse::<usize>().ok()).unwrap_or(8);
    let ram_bytes = Command::new("sysctl").args(["-n", "hw.memsize"]).output().ok()
        .and_then(|o| String::from_utf8(o.stdout).ok()).and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(16 * 1024 * 1024 * 1024);
    let ram_gb = (ram_bytes / (1024 * 1024 * 1024)).max(4);
    let free_disk_gb = Command::new("df").args(["-k", "/"]).output().ok()
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
    if let Ok(out) = Command::new("powershell").args(["-NoProfile", "-Command", ps]).output() {
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
    let (cpu_name, cpu_cores, total_ram_gb, free_disk_gb, gpu_name, has_dedicated_gpu, is_apple_silicon) = detect_hardware_raw();
    let (recommended_tier, recommended_model_id, max_model_ram_gb, recommendation_reason) =
        recommend_for_hardware(total_ram_gb, cpu_cores, has_dedicated_gpu, is_apple_silicon);
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
        ollama_running,
        installed_models,
    }
}

pub fn pull_curated_ollama_model(tag: &str) -> OperoResult<HardwareProfile> {
    let clean = tag.trim();
    validate_pull_model_tag(clean)?;
    let out = Command::new("ollama").args(["pull", clean]).output()
        .map_err(|e| OperoError::Validation(format!("Ollama CLI not available on this computer: {e}")))?;
    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(OperoError::Validation(format!("Could not download {clean}: {}", stderr.trim())));
    }
    Ok(inspect_hardware_profile())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_tier_mapping_and_model_allowlist() {
        assert_eq!(tier_for_ram_gb(4), ("offline", "offline-deterministic"));
        assert_eq!(tier_for_ram_gb(8), ("compact", "ollama-qwen3-1.7b"));
        assert_eq!(tier_for_ram_gb(16), ("balanced", "ollama-qwen3-4b"));
        assert_eq!(tier_for_ram_gb(32), ("deep", "ollama-qwen3-8b"));

        // HP ProBook 450 G8 baseline: i7-1165G7 (8 threads), 16 GB RAM, Iris Xe (CPU-only, <=6 GB cap)
        let (tier, model, max_ram, reason) = recommend_for_hardware(16, 8, false, false);
        assert_eq!(tier, "balanced");
        assert_eq!(model, "ollama-qwen2.5-3b");
        assert!((max_ram - 6.0).abs() < f32::EPSILON);
        assert!(reason.contains("6 GB"));

        assert!(validate_pull_model_tag("qwen2.5:3b").is_ok());
        assert!(validate_pull_model_tag("phi4-mini:3.8b").is_ok());
        assert!(validate_pull_model_tag("qwen3:4b").is_ok());
        assert!(validate_pull_model_tag("evil/untrusted:latest").is_err());
    }
}
