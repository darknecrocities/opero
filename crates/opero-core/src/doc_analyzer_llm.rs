use reqwest::blocking::Client;
use std::time::Duration;

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

pub fn locale_output_instruction(locale: &str) -> (&'static str, &'static str) {
    match locale {
        "ja-JP" => (
            "Write ALL output strictly in natural, polite Japanese (です・ます調・丁寧語). Preserve quoted UI button and menu labels verbatim inside 「...」.",
            "重要: 必ず自然な日本語の敬体（です・ます調）で出力してください。UIラベルは「...」のまま保持してください。",
        ),
        "fil-PH" => (
            "Write ALL output strictly in polite, formal Filipino (Tagalog/Taglish). Preserve quoted UI labels verbatim.",
            "MAHALAGA: Isulat ang buong sagot sa magalang at malinaw na Filipino.",
        ),
        _ => (
            "Write ALL output strictly in clear, professional English, EVEN IF the source document is in Japanese or another language.",
            "IMPORTANT: Translate any Japanese/non-English content and write ALL output strictly in clear English.",
        ),
    }
}

pub fn sample_whole_document(raw: &str, max_chars: usize) -> String {
    let chars: Vec<char> = raw.chars().collect();
    if chars.len() <= max_chars {
        return raw.to_string();
    }
    let head = max_chars * 55 / 100;
    let tail = max_chars - head;
    let start: String = chars[..head].iter().collect();
    let end: String = chars[chars.len() - tail..].iter().collect();
    format!("{start}\n\n[... middle excerpt omitted ...]\n\n{end}")
}

/// Native reqwest probe against local loopback Ollama (zero curl subprocess dependency).
pub fn detect_ollama_model(preferred: Option<&str>) -> Option<String> {
    if preferred == Some("offline") {
        return None;
    }
    let client = Client::builder().timeout(Duration::from_secs(5)).build().ok()?;
    let resp = client.get(format!("{OLLAMA_LOOPBACK}/api/tags")).send().ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let val: serde_json::Value = resp.json().ok()?;
    let models = val.get("models")?.as_array()?;
    if models.is_empty() {
        return None;
    }
    if let Some(pref) = preferred {
        for m in models {
            if let Some(name) = m.get("name").and_then(|v| v.as_str()) {
                if name == pref || name.starts_with(pref.split(':').next().unwrap_or(pref)) {
                    return Some(name.to_string());
                }
            }
        }
    }
    models.first()?.get("name")?.as_str().map(str::to_string)
}

/// Calls Ollama /api/chat with structured JSON format via native reqwest (60s timeout).
pub fn call_ollama_chat_json(model: &str, system: &str, user: &str) -> Option<serde_json::Value> {
    let client = Client::builder().timeout(Duration::from_secs(60)).build().ok()?;
    let payload = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user }
        ],
        "format": "json",
        "stream": false,
        "think": false,
        "options": { "temperature": 0.2, "num_ctx": 8192, "num_predict": 768 }
    });
    let resp = client
        .post(format!("{OLLAMA_LOOPBACK}/api/chat"))
        .json(&payload)
        .send()
        .ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let outer: serde_json::Value = resp.json().ok()?;
    let content = outer
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .or_else(|| outer.get("response").and_then(|c| c.as_str()))?
        .trim();

    if let Ok(v) = serde_json::from_str::<serde_json::Value>(content) {
        return Some(v);
    }
    let start = content.find('{')?;
    let end = content.rfind('}')?;
    serde_json::from_str::<serde_json::Value>(&content[start..=end]).ok()
}

/// Interactive Pero / Local LLM Q&A grounded in any uploaded document (PDF, DOCX, MD, TXT).
pub fn ask_about_document(
    filename: &str,
    doc_text: &str,
    question: &str,
    locale: &str,
    preferred_model: Option<&str>,
) -> (String, String) {
    let (lang_rule, lang_tail) = locale_output_instruction(locale);
    let context = sample_whole_document(doc_text, 6500);

    if let Some(model) = detect_ollama_model(preferred_model) {
        if let Ok(client) = Client::builder().timeout(Duration::from_secs(60)).build() {
            let system = format!(
                "You are Pero, OPERO's helpful offline document assistant. {lang_rule}\n\
                 Answer the user's question accurately using ONLY the document provided inside <untrusted_document_content>. \
                 Use clean short paragraphs or bullet points with specific dates, numbers, names, and rules from the document. \
                 If the answer is not in the document, state that clearly."
            );
            let user = format!(
                "Document: {filename}\n\
                 <untrusted_document_content>\n{context}\n</untrusted_document_content>\n\n\
                 User question: {question}\n{lang_tail}"
            );
            let payload = serde_json::json!({
                "model": model,
                "messages": [
                    { "role": "system", "content": system },
                    { "role": "user", "content": user }
                ],
                "stream": false,
                "think": false,
                "options": { "temperature": 0.25, "num_ctx": 8192, "num_predict": 768 }
            });
            if let Ok(resp) = client.post(format!("{OLLAMA_LOOPBACK}/api/chat")).json(&payload).send() {
                if resp.status().is_success() {
                    if let Ok(val) = resp.json::<serde_json::Value>() {
                        if let Some(ans) = val.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                            let trimmed = ans.trim();
                            if !trimmed.is_empty() {
                                return (trimmed.to_string(), format!("Ollama ({model})"));
                            }
                        }
                    }
                }
            }
        }
    }

    // Grounded offline lexical fallback when Ollama is stopped
    let q_words: Vec<String> = question
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() >= 3)
        .map(str::to_string)
        .collect();
    let matched_lines: Vec<&str> = doc_text
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .filter(|l| {
            let lower = l.to_lowercase();
            q_words.iter().any(|w| lower.contains(w))
        })
        .take(5)
        .collect();

    let answer = if matched_lines.is_empty() {
        if locale == "ja-JP" {
            format!("ローカルAI（Ollama）が停止しているため、ドキュメント「{filename}」から直接一致する箇所が見つかりませんでした。Ollamaを起動して再度お試しください。")
        } else {
            format!("Local AI (Ollama) is currently offline and no exact keyword match was found in \"{filename}\". Start Ollama in Settings to ask natural-language questions.")
        }
    } else {
        format!(
            "Relevant excerpts from {filename}:\n\n{}",
            matched_lines.iter().map(|l| format!("- {l}")).collect::<Vec<_>>().join("\n")
        )
    };
    (answer, "Offline Structural Search".to_string())
}
