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
    let out = Command::new(if cfg!(target_os = "windows") { "where" } else { "which" })
        .arg("ollama")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let line = String::from_utf8_lossy(&out.stdout).lines().next()?.trim().to_string();
    if line.is_empty() { None } else { Some(PathBuf::from(line)) }
}

pub fn list_live_ollama_models() -> Option<Vec<String>> {
    let out = Command::new("curl")
        .args(["-fsS", "--connect-timeout", "1", "--max-time", "2", &format!("{OLLAMA_LOOPBACK}/api/tags")])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let val: serde_json::Value = serde_json::from_slice(&out.stdout).ok()?;
    let models = val
        .get("models")?
        .as_array()?
        .iter()
        .filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
        .collect();
    Some(models)
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
        if let Some(bin) = find_ollama_binary() {
            let ollama_home = data_dir.join("ollama-home");
            let models_dir = data_dir.join("ollama-models");
            let _ = std::fs::create_dir_all(&ollama_home);
            let _ = std::fs::create_dir_all(&models_dir);
            let _ = Command::new(&bin)
                .arg("serve")
                .env("HOME", &ollama_home)
                .env("OLLAMA_MODELS", &models_dir)
                .env("OLLAMA_HOST", "127.0.0.1:11434")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn();

            for _ in 0..16 {
                std::thread::sleep(Duration::from_millis(250));
                status = check_ollama_status(Some(target_tag));
                if status.running {
                    break;
                }
            }
        }
    }

    if status.running && !status.active_model_ready && pull_if_missing {
        if let Some(bin) = find_ollama_binary() {
            let ollama_home = data_dir.join("ollama-home");
            let _ = std::fs::create_dir_all(&ollama_home);
            let _ = Command::new(&bin)
                .args(["pull", target_tag])
                .env("HOME", &ollama_home)
                .env("OLLAMA_HOST", "127.0.0.1:11434")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
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

pub fn call_ollama_chat_with_thinking(
    model: &str,
    messages: &[OllamaChatMessage],
    enable_thinking: bool,
) -> Option<OllamaChatResult> {
    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": false,
        "think": enable_thinking,
        "options": {
            "temperature": 0.35,
            "top_p": 0.9
        }
    })
    .to_string();

    let max_time = if enable_thinking { "40" } else { "25" };
    let out = Command::new("curl")
        .args([
            "-fsS",
            "--connect-timeout",
            "1",
            "--max-time",
            max_time,
            "-H",
            "Content-Type: application/json",
            "-d",
            &payload,
            &format!("{OLLAMA_LOOPBACK}/api/chat"),
        ])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let val: serde_json::Value = serde_json::from_slice(&out.stdout).ok()?;
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
