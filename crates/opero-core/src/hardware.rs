use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::error::{OperoError, OperoResult};

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

pub const ALLOWED_OLLAMA_MODELS: &[&str] = &[
    "qwen3:1.7b",
    "qwen3:4b",
    "gemma3:4b",
    "qwen3:8b",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareProfile {
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub total_ram_gb: u64,
    pub free_disk_gb: u64,
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

pub fn validate_pull_model_tag(tag: &str) -> OperoResult<()> {
    if !ALLOWED_OLLAMA_MODELS.contains(&tag.trim()) {
        return Err(OperoError::Forbidden(format!(
            "Model tag '{}' is not in the curated OPERO local model catalog.",
            tag.trim()
        )));
    }
    Ok(())
}

fn detect_installed_ollama_models() -> (bool, Vec<String>) {
    let out = Command::new("curl")
        .args(["-fsS", "--max-time", "1", &format!("{OLLAMA_LOOPBACK}/api/tags")])
        .output();
    let Ok(out) = out else {
        return (false, Vec::new());
    };
    if !out.status.success() {
        return (false, Vec::new());
    }
    let Ok(val) = serde_json::from_slice::<serde_json::Value>(&out.stdout) else {
        return (true, Vec::new());
    };
    let models = val
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|item| item.get("name").and_then(|n| n.as_str()).map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    (true, models)
}

#[cfg(target_os = "macos")]
fn detect_cpu_ram_disk() -> (String, usize, u64, u64) {
    let cpu = Command::new("sysctl")
        .args(["-n", "machdep.cpu.brand_string"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Apple Silicon".to_string());

    let cores = Command::new("sysctl")
        .args(["-n", "hw.ncpu"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.trim().parse::<usize>().ok())
        .unwrap_or(8);

    let ram_bytes = Command::new("sysctl")
        .args(["-n", "hw.memsize"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(16 * 1024 * 1024 * 1024);
    let ram_gb = (ram_bytes / (1024 * 1024 * 1024)).max(4);

    let free_disk_gb = Command::new("df")
        .args(["-k", "/"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|txt| {
            txt.lines()
                .nth(1)
                .and_then(|line| line.split_whitespace().nth(3))
                .and_then(|kb| kb.parse::<u64>().ok())
                .map(|kb| kb / (1024 * 1024))
        })
        .unwrap_or(32);

    (cpu, cores, ram_gb, free_disk_gb)
}

#[cfg(not(target_os = "macos"))]
fn detect_cpu_ram_disk() -> (String, usize, u64, u64) {
    let cores = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);
    let cpu = std::env::var("PROCESSOR_IDENTIFIER").unwrap_or_else(|_| "Desktop Processor".to_string());
    (cpu, cores, 16, 40)
}

pub fn inspect_hardware_profile() -> HardwareProfile {
    let (cpu_name, cpu_cores, total_ram_gb, free_disk_gb) = detect_cpu_ram_disk();
    let (recommended_tier, recommended_model_id) = tier_for_ram_gb(total_ram_gb);
    let (ollama_running, installed_models) = detect_installed_ollama_models();
    let os_name = if cfg!(target_os = "macos") {
        "macOS"
    } else if cfg!(target_os = "windows") {
        "Windows"
    } else {
        "Linux"
    };

    HardwareProfile {
        cpu_name,
        cpu_cores,
        total_ram_gb,
        free_disk_gb,
        os_name: os_name.to_string(),
        recommended_tier: recommended_tier.to_string(),
        recommended_model_id: recommended_model_id.to_string(),
        ollama_running,
        installed_models,
    }
}

pub fn pull_curated_ollama_model(tag: &str) -> OperoResult<HardwareProfile> {
    let clean = tag.trim();
    validate_pull_model_tag(clean)?;
    let out = Command::new("ollama")
        .args(["pull", clean])
        .output()
        .map_err(|e| OperoError::Validation(format!("Ollama CLI not available on this computer: {e}")))?;
    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(OperoError::Validation(format!(
            "Could not download {clean}: {}",
            stderr.trim()
        )));
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

        assert!(validate_pull_model_tag("qwen3:1.7b").is_ok());
        assert!(validate_pull_model_tag("qwen3:4b").is_ok());
        assert!(validate_pull_model_tag("gemma3:4b").is_ok());
        assert!(validate_pull_model_tag("evil/untrusted:latest").is_err());
    }
}
