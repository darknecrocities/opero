use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::OperoStore;
use crate::error::OperoResult;
use crate::meeting_notes::{list_meeting_notes, translate_text_local};
use crate::memory::dual_core::query_dual_core_memory;
use crate::ollama_runtime::{call_ollama_chat, check_ollama_status, OllamaChatMessage};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentToolCallRecord {
    pub tool: String,
    pub input: String,
    pub summary: String,
    pub ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentActionLink {
    pub kind: String,
    pub id: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMessage {
    pub id: String,
    pub thread_id: String,
    pub role: String,
    pub content: String,
    pub tool_calls: Vec<AgentToolCallRecord>,
    pub citations: Vec<String>,
    pub action_link: Option<AgentActionLink>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentThread {
    pub id: String,
    pub title: String,
    pub locale: String,
    pub updated_at: String,
    pub messages: Vec<AgentMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentChatResponse {
    pub thread_id: String,
    pub message: AgentMessage,
    pub engine_used: String,
    pub model_live: bool,
}

pub fn ensure_agent_schema(conn: &Connection) -> OperoResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS agent_threads (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            locale TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agent_messages (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            tool_calls_json TEXT NOT NULL DEFAULT '[]',
            citations_json TEXT NOT NULL DEFAULT '[]',
            action_link_json TEXT,
            created_at TEXT NOT NULL
        );",
    )?;
    Ok(())
}

pub fn list_agent_threads(store: &OperoStore) -> OperoResult<Vec<AgentThread>> {
    let conn = store.conn()?;
    ensure_agent_schema(&conn)?;
    let mut stmt = conn.prepare("SELECT id, title, locale, updated_at FROM agent_threads ORDER BY updated_at DESC LIMIT 20")?;
    let threads: Vec<(String, String, String, String)> = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)))?
        .flatten()
        .collect();

    let mut out = Vec::with_capacity(threads.len());
    for (id, title, locale, updated_at) in threads {
        let messages = load_thread_messages(&conn, &id)?;
        out.push(AgentThread { id, title, locale, updated_at, messages });
    }
    Ok(out)
}

pub fn delete_agent_thread(store: &OperoStore, thread_id: &str) -> OperoResult<()> {
    let conn = store.conn()?;
    ensure_agent_schema(&conn)?;
    conn.execute("DELETE FROM agent_messages WHERE thread_id = ?1", params![thread_id])?;
    conn.execute("DELETE FROM agent_threads WHERE id = ?1", params![thread_id])?;
    Ok(())
}

fn is_casual_greeting(prompt: &str) -> bool {
    let low = prompt.trim().to_lowercase();
    let short = low.chars().count() <= 32;
    short
        && (matches!(
            low.as_str(),
            "hi" | "hello" | "hey" | "yo" | "sup" | "good morning" | "good afternoon" | "good evening" | "thanks" | "thank you" | "kumusta" | "kamusta" | "こんにちは" | "おはよう" | "おはようございます" | "こんばんは" | "ありがとう" | "もしもし"
        ) || low.starts_with("hi ")
            || low.starts_with("hello ")
            || low.starts_with("hey "))
}

fn needs_memory_lookup(prompt: &str) -> bool {
    if is_casual_greeting(prompt) {
        return false;
    }
    let low = prompt.to_lowercase();
    low.contains("mmi")
        || low.contains("man machine")
        || low.contains("director")
        || low.contains("president")
        || low.contains("ceo")
        || low.contains("office")
        || low.contains("address")
        || low.contains("company")
        || low.contains("glossary")
        || low.contains("memory")
        || low.contains("who is")
        || low.contains("what is")
        || low.contains("where is")
        || prompt.contains("マン・マシン")
        || prompt.contains("代表")
        || prompt.contains("会社")
        || prompt.contains("役員")
        || prompt.contains("本社")
        || prompt.contains("誰")
}

pub fn run_agent_turn(
    store: &OperoStore,
    thread_id: Option<&str>,
    prompt: &str,
    locale: &str,
    preferred_model: Option<&str>,
) -> OperoResult<AgentChatResponse> {
    let clean_prompt = prompt.trim();
    let tid = thread_id
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("thr_{}", Uuid::new_v4().simple()));
    let now = Utc::now().to_rfc3339();

    let prior_history = {
        let conn = store.conn()?;
        ensure_agent_schema(&conn)?;
        let history = load_thread_messages(&conn, &tid)?;
        let title: String = clean_prompt.chars().take(48).collect();
        conn.execute(
            "INSERT INTO agent_threads (id, title, locale, updated_at) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at",
            params![tid, title, locale, now],
        )?;
        let user_msg_id = format!("msg_{}", Uuid::new_v4().simple());
        conn.execute(
            "INSERT INTO agent_messages (id, thread_id, role, content, created_at) VALUES (?1, ?2, 'user', ?3, ?4)",
            params![user_msg_id, tid, clean_prompt, now],
        )?;
        history
    };

    let mut tool_calls = Vec::new();
    let mut citations = Vec::new();
    let mut action_link: Option<AgentActionLink> = None;
    let mut grounded_facts = Vec::new();
    let low = clean_prompt.to_lowercase();

    // Tool 1: Search Dual-Core Vector RAG only when the query actually asks for knowledge/facts
    if needs_memory_lookup(clean_prompt) {
        let conn = store.conn()?;
        let hits = query_dual_core_memory(&conn, clean_prompt, None, 3)?;
        let hit_count = hits.len();
        for h in &hits {
            citations.push(h.chunk.title.clone());
            grounded_facts.push(format!("• {}: {}", h.chunk.title, h.chunk.content));
        }
        tool_calls.push(AgentToolCallRecord {
            tool: "search_knowledge".to_string(),
            input: clean_prompt.chars().take(80).collect(),
            summary: format!("Retrieved {hit_count} grounded memory chunk(s)"),
            ok: true,
        });
    }

    // Tool 2: Inspect analyzed documents
    if low.contains("doc") || low.contains("report") || low.contains("pdf") || clean_prompt.contains("ドキュメント") || clean_prompt.contains("レポート") {
        if let Ok(docs) = store.list_analyzed_documents() {
            let count = docs.len();
            if let Some(first) = docs.first() {
                grounded_facts.push(format!(
                    "• Latest Document ({}): {}% complete. {}",
                    first.filename, first.completeness_score, first.executive_summary
                ));
                action_link = Some(AgentActionLink {
                    kind: "document".to_string(),
                    id: first.id.clone(),
                    label: format!("Open {}", first.filename),
                });
            }
            tool_calls.push(AgentToolCallRecord {
                tool: "list_documents".to_string(),
                input: "recent".to_string(),
                summary: format!("Found {count} analyzed document(s)"),
                ok: true,
            });
        }
    }

    // Tool 3: Inspect compiled meeting notes
    if low.contains("meeting") || low.contains("transcript") || low.contains("sync") || clean_prompt.contains("会議") || clean_prompt.contains("議事録") || clean_prompt.contains("pulong") {
        if let Ok(meetings) = list_meeting_notes(store) {
            let count = meetings.len();
            if let Some(m) = meetings.first() {
                grounded_facts.push(format!(
                    "• Latest Meeting ({}): {} (Translated: {})",
                    m.title, m.executive_summary, m.translated_summary
                ));
                action_link = Some(AgentActionLink {
                    kind: "meeting".to_string(),
                    id: m.id.clone(),
                    label: format!("Open {}", m.title),
                });
            }
            tool_calls.push(AgentToolCallRecord {
                tool: "list_meetings".to_string(),
                input: "recent".to_string(),
                summary: format!("Found {count} recorded meeting(s)"),
                ok: true,
            });
        }
    }

    // Tool 4: Autonomously create a manual from template
    if (low.contains("create") || low.contains("draft") || clean_prompt.contains("作成") || clean_prompt.contains("gumawa"))
        && (low.contains("manual") || low.contains("sop") || low.contains("template") || clean_prompt.contains("手順書") || clean_prompt.contains("マニュアル"))
    {
        if let Ok(projects) = store.list_projects(false) {
            if let Some(proj) = projects.first() {
                let m_title = if locale == "ja-JP" {
                    "標準作業手順書（Pero作成）".to_string()
                } else {
                    "Standard Operating Procedure (Drafted by Pero)".to_string()
                };
                if let Ok(manual) = store.create_manual_from_template(&proj.id, "sop", &m_title, locale) {
                    grounded_facts.push(format!("• Created new manual \"{}\" ({}).", manual.title, manual.id));
                    action_link = Some(AgentActionLink {
                        kind: "manual".to_string(),
                        id: manual.id.clone(),
                        label: if locale == "ja-JP" { "スタジオで開く".to_string() } else { "Open in OPERO Studio".to_string() },
                    });
                    tool_calls.push(AgentToolCallRecord {
                        tool: "create_manual_from_template".to_string(),
                        input: manual.title,
                        summary: format!("Saved new manual ({}) to SQLite", manual.id),
                        ok: true,
                    });
                }
            }
        }
    }

    // Tool 5: Translate on demand
    if low.contains("translate") || clean_prompt.contains("翻訳") || clean_prompt.contains("isalin") {
        let target = if low.contains("japanese") || clean_prompt.contains("日本語") {
            "ja-JP"
        } else if low.contains("tagalog") || low.contains("filipino") {
            "fil-PH"
        } else {
            "en-US"
        };
        let (tr, _eng) = translate_text_local(clean_prompt, target, preferred_model);
        grounded_facts.push(format!("• Translation ({target}): {tr}"));
        tool_calls.push(AgentToolCallRecord {
            tool: "translate_text".to_string(),
            input: target.to_string(),
            summary: format!("Translated content into {target}"),
            ok: true,
        });
    }

    let (reply_text, engine_used, model_live) =
        synthesize_live_chat_reply(clean_prompt, locale, &prior_history, &grounded_facts, preferred_model);

    let reply_msg = AgentMessage {
        id: format!("msg_{}", Uuid::new_v4().simple()),
        thread_id: tid.clone(),
        role: "assistant".to_string(),
        content: reply_text,
        tool_calls,
        citations,
        action_link,
        created_at: Utc::now().to_rfc3339(),
    };

    let conn = store.conn()?;
    conn.execute(
        "INSERT INTO agent_messages (id, thread_id, role, content, tool_calls_json, citations_json, action_link_json, created_at)
         VALUES (?1, ?2, 'assistant', ?3, ?4, ?5, ?6, ?7)",
        params![
            reply_msg.id,
            reply_msg.thread_id,
            reply_msg.content,
            serde_json::to_string(&reply_msg.tool_calls)?,
            serde_json::to_string(&reply_msg.citations)?,
            reply_msg.action_link.as_ref().map(|a| serde_json::to_string(a).unwrap_or_default()),
            reply_msg.created_at
        ],
    )?;

    Ok(AgentChatResponse {
        thread_id: tid,
        message: reply_msg,
        engine_used,
        model_live,
    })
}

fn load_thread_messages(conn: &Connection, thread_id: &str) -> OperoResult<Vec<AgentMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, thread_id, role, content, tool_calls_json, citations_json, action_link_json, created_at
         FROM agent_messages WHERE thread_id = ?1 ORDER BY created_at ASC",
    )?;
    let rows = stmt.query_map(params![thread_id], |r| {
        let tc: String = r.get(4)?;
        let cit: String = r.get(5)?;
        let al: Option<String> = r.get(6)?;
        Ok(AgentMessage {
            id: r.get(0)?,
            thread_id: r.get(1)?,
            role: r.get(2)?,
            content: r.get(3)?,
            tool_calls: serde_json::from_str(&tc).unwrap_or_default(),
            citations: serde_json::from_str(&cit).unwrap_or_default(),
            action_link: al.and_then(|s| serde_json::from_str(&s).ok()),
            created_at: r.get(7)?,
        })
    })?;
    Ok(rows.flatten().collect())
}

fn synthesize_live_chat_reply(
    prompt: &str,
    locale: &str,
    prior_history: &[AgentMessage],
    grounded_facts: &[String],
    preferred_model: Option<&str>,
) -> (String, String, bool) {
    let rt = check_ollama_status(preferred_model);
    if let Some(live_model) = rt.active_model.as_deref() {
        let lang = match locale {
            "ja-JP" => "natural Japanese",
            "fil-PH" => "natural Filipino (Tagalog)",
            _ => "clear, friendly English",
        };
        let facts_section = if grounded_facts.is_empty() {
            String::new()
        } else {
            format!("\n\nVerified local workspace context (use accurately, never fabricate):\n{}", grounded_facts.join("\n"))
        };
        let mut messages = vec![OllamaChatMessage {
            role: "system".to_string(),
            content: format!(
                "You are Pero, OPERO's friendly, sharp local-first AI assistant for Man Machine Interface (MMI) workflows. Reply concisely and conversationally in {lang}. Never echo raw bracket tags like [Memory:].{facts_section}"
            ),
        }];
        let start = prior_history.len().saturating_sub(8);
        for m in &prior_history[start..] {
            messages.push(OllamaChatMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            });
        }
        messages.push(OllamaChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        });

        if let Some(reply) = call_ollama_chat(live_model, &messages) {
            return (reply, format!("Ollama ({live_model})"), true);
        }
    }

    // Conversational fallback when local Ollama server is not running yet
    if is_casual_greeting(prompt) {
        let msg = match locale {
            "ja-JP" => "こんにちは！OPEROのローカルAIアシスタント「Pero」です。現在はローカルモデル（Ollama）が停止中ですが、右上の「ローカルAIを起動」を押すとリアルタイム会話が有効になります。MMIの会社情報検索、議事録の要約、SOP作成もすぐにお手伝いできますよ。".to_string(),
            "fil-PH" => "Kumusta! Ako si Pero, ang iyong lokal na AI assistant sa OPERO. Naka-off pa ang lokal na Ollama model ngayon—i-click ang 'Start Local AI' sa itaas para sa live na usapan, o magtanong agad tungkol sa MMI, mga pulong, o dokumento.".to_string(),
            _ => "Hi! I'm Pero, your local-first OPERO assistant. Your local Ollama model isn't running yet—click \"Start Local AI\" above to enable live conversational replies, or ask me right now to search MMI knowledge, summarize meetings, or draft a manual.".to_string(),
        };
        return (msg, "Local Offline Helper".to_string(), false);
    }

    if !grounded_facts.is_empty() {
        let lead = match locale {
            "ja-JP" => "ローカル知識ベースから確認した情報です：\n\n",
            "fil-PH" => "Narito ang nahanap ko mula sa lokal na memorya ng OPERO:\n\n",
            _ => "Here is what I found in your local OPERO workspace:\n\n",
        };
        return (format!("{lead}{}", grounded_facts.join("\n\n")), "Local Grounded Tools".to_string(), false);
    }

    let msg = match locale {
        "ja-JP" => "自由な会話にはローカルAIモデル（Ollama）の起動が必要です。上部の「ローカルAIを起動」ボタンを押すと、Qwen3モデルで動的に回答できるようになります。".to_string(),
        "fil-PH" => "Kailangang i-start ang lokal na Ollama AI model para sa libreng usapan. I-click ang 'Start Local AI' sa itaas upang paganahin ang live na sagot mula sa Qwen3.".to_string(),
        _ => "To answer open-ended questions dynamically, start your local AI model using the \"Start Local AI\" button above (runs locally on your machine via Ollama + Qwen3).".to_string(),
    };
    (msg, "Local Offline Helper".to_string(), false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_greeting_does_not_dump_raw_memory() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let resp = run_agent_turn(&store, None, "hello", "en-US", Some("offline")).unwrap();
        assert!(!resp.message.content.contains("[Memory:"));
        assert!(resp.message.tool_calls.is_empty());
    }

    #[test]
    fn test_agent_rag_grounding_and_manual_creation_tool() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        store.create_project("MMI Ops", "Arron", "Engineering", "en-US").unwrap();

        let resp1 = run_agent_turn(
            &store,
            None,
            "Who is the Representative Director of Man Machine Interface?",
            "en-US",
            Some("offline"),
        )
        .unwrap();
        assert!(resp1.message.content.contains("Tetsuya Sekiguchi") || resp1.message.content.contains("関口"));
        assert!(!resp1.message.content.contains("[Memory:"));
        assert!(resp1.message.tool_calls.iter().any(|t| t.tool == "search_knowledge" && t.ok));

        let resp2 = run_agent_turn(
            &store,
            Some(&resp1.thread_id),
            "Create a Standard Operating Procedure manual from template",
            "en-US",
            Some("offline"),
        )
        .unwrap();
        assert!(resp2.message.tool_calls.iter().any(|t| t.tool == "create_manual_from_template" && t.ok));
        assert!(resp2.message.action_link.is_some());
    }
}
