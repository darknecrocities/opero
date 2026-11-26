use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaRuntimeStatus {
    pub running: bool,
    pub binary_available: bool,
    pub installed_models: Vec<String>,
    pub active_model: Option<String>,
    pub active_model_ready: bool,
    pub guidance: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
}

pub fn find_ollama_binary() -> Option<PathBuf> {
    find_ollama_binary_with_data_dir(None)
}

pub fn find_ollama_binary_with_data_dir(data_dir: Option<&Path>) -> Option<PathBuf> {
    if let Some(dir) = data_dir {
        let app_local_mac = dir
            .join("ollama-app")
            .join("Ollama.app")
            .join("Contents")
            .join("Resources")
            .join("ollama");
        if app_local_mac.exists() {
            return Some(app_local_mac);
        }
        let app_local_win = dir.join("ollama-bin").join("ollama.exe");
        if app_local_win.exists() {
            return Some(app_local_win);
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(local_app) = std::env::var("LOCALAPPDATA") {
            let p = PathBuf::from(local_app).join("Programs").join("Ollama").join("ollama.exe");
            if p.exists() {
                return Some(p);
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let user_app = PathBuf::from(home)
                .join("Applications")
                .join("Ollama.app")
                .join("Contents")
                .join("Resources")
                .join("ollama");
            if user_app.exists() {
                return Some(user_app);
            }
        }
    }

    let candidates = [
        "/usr/local/bin/ollama",
        "/opt/homebrew/bin/ollama",
        "/Applications/Ollama.app/Contents/Resources/ollama",
    ];
    for c in candidates {
        let p = PathBuf::from(c);
        if p.exists() {
            return Some(p);
        }
    }
    let mut cmd = Command::new(if cfg!(target_os = "windows") { "where" } else { "which" });
    cmd.arg("ollama").stdout(Stdio::piped()).stderr(Stdio::null());
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let out = cmd.output().ok()?;
    if !out.status.success() {
        return None;
    }
    let line = String::from_utf8_lossy(&out.stdout).lines().next()?.trim().to_string();
    if line.is_empty() { None } else { Some(PathBuf::from(line)) }
}

pub fn spawn_ollama_serve(bin: &Path, data_dir: &Path) {
    let mut cmd = Command::new(bin);
    cmd.arg("serve")
        .env("OLLAMA_HOST", "127.0.0.1:11434")
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    let has_user_home = std::env::var("HOME").is_ok() || std::env::var("USERPROFILE").is_ok();
    if !has_user_home {
        let ollama_home = data_dir.join("ollama-home");
        let models_dir = data_dir.join("ollama-models");
        let _ = std::fs::create_dir_all(&ollama_home);
        let _ = std::fs::create_dir_all(&models_dir);
        cmd.env("HOME", &ollama_home).env("OLLAMA_MODELS", &models_dir);
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let _ = cmd.spawn();
}

pub fn list_live_ollama_models() -> Option<Vec<String>> {
    std::thread::spawn(|| {
        let client = reqwest::blocking::Client::builder()
            .connect_timeout(Duration::from_millis(800))
            .timeout(Duration::from_secs(2))
            .build()
            .ok()?;
        let resp = client.get(format!("{OLLAMA_LOOPBACK}/api/tags")).send().ok()?;
        if !resp.status().is_success() {
            return None;
        }
        let val: serde_json::Value = resp.json().ok()?;
        let models = val
            .get("models")?
            .as_array()?
            .iter()
            .filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
            .collect();
        Some(models)
    })
    .join()
    .ok()
    .flatten()
}

pub fn check_ollama_status(preferred_model: Option<&str>) -> OllamaRuntimeStatus {
    let binary_available = find_ollama_binary().is_some();
    if preferred_model == Some("offline") {
        return OllamaRuntimeStatus {
            running: false,
            binary_available,
            installed_models: Vec::new(),
            active_model: None,
            active_model_ready: false,
            guidance: "Built-In Offline mode selected.".to_string(),
        };
    }
    let pref = preferred_model.filter(|m| !m.is_empty());

    if let Some(installed) = list_live_ollama_models() {
        let active_model = pref
            .and_then(|p| {
                installed
                    .iter()
                    .find(|m| m.eq_ignore_ascii_case(p) || m.starts_with(&format!("{p}:")))
                    .cloned()
            })
            .or_else(|| installed.first().cloned());
        let ready = active_model.is_some();
        let guidance = if ready {
            format!("Local Ollama live with {}", active_model.as_deref().unwrap_or("model"))
        } else {
            "Ollama is running, but no model is downloaded yet. Pull Qwen3 Compact (qwen3:1.7b) to start chatting.".to_string()
        };
        return OllamaRuntimeStatus {
            running: true,
            binary_available,
            installed_models: installed,
            active_model,
            active_model_ready: ready,
            guidance,
        };
    }

    let guidance = if binary_available {
        "Local Ollama server is stopped. Click Start Local AI to launch it automatically in OPERO's local model store.".to_string()
    } else {
        "Install Ollama (ollama.com) to enable live local LLM conversations.".to_string()
    };

    OllamaRuntimeStatus {
        running: false,
        binary_available,
        installed_models: Vec::new(),
        active_model: None,
        active_model_ready: false,
        guidance,
    }
}

pub fn is_allowed_model_tag(tag: &str) -> bool {
    crate::hardware::ALLOWED_OLLAMA_MODELS.contains(&tag.trim())
}

pub fn ensure_ollama_runtime(data_dir: &Path, model_tag: Option<&str>, pull_if_missing: bool) -> OllamaRuntimeStatus {
    let target_tag = model_tag
        .filter(|t| is_allowed_model_tag(t))
        .unwrap_or("qwen3:1.7b");

    let mut status = check_ollama_status(Some(target_tag));
    if !status.running {
        if let Some(bin) = find_ollama_binary_with_data_dir(Some(data_dir)) {
            spawn_ollama_serve(&bin, data_dir);

            for _ in 0..24 {
                std::thread::sleep(Duration::from_millis(250));
                status = check_ollama_status(Some(target_tag));
                if status.running {
                    break;
                }
            }
        }
    }

    if status.running && !status.active_model_ready && pull_if_missing {
        if let Some(bin) = find_ollama_binary_with_data_dir(Some(data_dir)) {
            let mut cmd = Command::new(&bin);
            cmd.args(["pull", target_tag])
                .env("OLLAMA_HOST", "127.0.0.1:11434")
                .stdout(Stdio::null())
                .stderr(Stdio::null());
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000);
            }
            let _ = cmd.status();
            status = check_ollama_status(Some(target_tag));
        }
    }

    status
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaChatResult {
    pub content: String,
    pub thinking: Option<String>,
}

pub fn split_think_tags(raw: &str) -> (String, Option<String>) {
    if let (Some(start), Some(end)) = (raw.find("<think>"), raw.find("</think>")) {
        if end > start + 7 {
            let thought = raw[start + 7..end].trim().to_string();
            let before = raw[..start].trim();
            let after = raw[end + 8..].trim();
            let clean = [before, after]
                .into_iter()
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
                .join("\n\n");
            return (clean, if thought.is_empty() { None } else { Some(thought) });
        }
    }
    (raw.trim().to_string(), None)
}

fn model_supports_thinking(model: &str) -> bool {
    let lower = model.to_lowercase();
    lower.contains("qwen3") || lower.contains("deepseek-r1")
}

pub fn call_ollama_chat_with_thinking(
    model: &str,
    messages: &[OllamaChatMessage],
    enable_thinking: bool,
) -> Option<OllamaChatResult> {
    let model_owned = model.to_string();
    let msgs_owned = messages.to_vec();
    let val: serde_json::Value = std::thread::spawn(move || {
        let use_think = enable_thinking && model_supports_thinking(&model_owned);
        let timeout_secs = if use_think { 45 } else { 30 };
        let client = reqwest::blocking::Client::builder()
            .connect_timeout(Duration::from_secs(2))
            .timeout(Duration::from_secs(timeout_secs))
            .build()
            .ok()?;

        let mut payload = serde_json::json!({
            "model": model_owned,
            "messages": msgs_owned,
            "stream": false,
            "options": {
                "temperature": 0.35,
                "top_p": 0.9
            }
        });
        if use_think {
            payload["think"] = serde_json::Value::Bool(true);
        }

        let mut resp = client
            .post(format!("{OLLAMA_LOOPBACK}/api/chat"))
            .json(&payload)
            .send()
            .ok()?;

        if !resp.status().is_success() && use_think {
            if let Some(obj) = payload.as_object_mut() {
                obj.remove("think");
            }
            resp = client
                .post(format!("{OLLAMA_LOOPBACK}/api/chat"))
                .json(&payload)
                .send()
                .ok()?;
        }

        if !resp.status().is_success() {
            return None;
        }
        resp.json().ok()
    })
    .join()
    .ok()
    .flatten()?;
    let raw_content = val
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .or_else(|| val.get("response").and_then(|r| r.as_str()))?
        .trim()
        .to_string();
    let api_thinking = val
        .get("message")
        .and_then(|m| m.get("thinking"))
        .and_then(|t| t.as_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let (clean_content, tag_thinking) = split_think_tags(&raw_content);
    let thinking = api_thinking.or(tag_thinking);
    if clean_content.is_empty() {
        return None;
    }
    Some(OllamaChatResult {
        content: clean_content,
        thinking,
    })
}

pub fn call_ollama_chat(model: &str, messages: &[OllamaChatMessage]) -> Option<String> {
    call_ollama_chat_with_thinking(model, messages, false).map(|r| r.content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_allowlist_and_status_probe_never_panics() {
        assert!(is_allowed_model_tag("qwen3:1.7b"));
        assert!(is_allowed_model_tag("gemma3:4b"));
        assert!(!is_allowed_model_tag("evil:latest; rm -rf /"));
        let st = check_ollama_status(Some("qwen3:1.7b"));
        assert!(!st.guidance.is_empty());
    }
}
