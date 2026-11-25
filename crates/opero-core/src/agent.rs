use chrono::{Local, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::agent_action_parser::detect_proposed_action;
use crate::agent_actions::{
    ensure_agent_actions_schema, get_agent_settings, load_action_for_message, save_pending_action,
    PendingAgentAction,
};
use crate::db::OperoStore;
use crate::error::OperoResult;
use crate::meeting_notes::{list_meeting_notes, translate_text_local};
use crate::memory::dual_core::query_dual_core_memory;
use crate::ollama_runtime::{
    call_ollama_chat_with_thinking, check_ollama_status, OllamaChatMessage,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentToolCallRecord { pub tool: String, pub input: String, pub summary: String, pub ok: bool }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentActionLink { pub kind: String, pub id: String, pub label: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMessage {
    pub id: String, pub thread_id: String, pub role: String, pub content: String,
    pub thinking: Option<String>, pub tool_calls: Vec<AgentToolCallRecord>,
    pub citations: Vec<String>, pub action_link: Option<AgentActionLink>,
    pub pending_action: Option<PendingAgentAction>, pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentThread { pub id: String, pub title: String, pub locale: String, pub updated_at: String, pub messages: Vec<AgentMessage> }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentChatResponse { pub thread_id: String, pub message: AgentMessage, pub engine_used: String, pub model_live: bool }

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
            thinking TEXT,
            tool_calls_json TEXT NOT NULL DEFAULT '[]',
            citations_json TEXT NOT NULL DEFAULT '[]',
            action_link_json TEXT,
            created_at TEXT NOT NULL
        );",
    )?;
    let _ = conn.execute("ALTER TABLE agent_messages ADD COLUMN thinking TEXT", []);
    ensure_agent_actions_schema(conn)?;
    Ok(())
}

pub fn list_agent_threads(store: &OperoStore) -> OperoResult<Vec<AgentThread>> {
    let conn = store.conn()?;
    ensure_agent_schema(&conn)?;
    let mut stmt = conn.prepare(
        "SELECT id, title, locale, updated_at FROM agent_threads ORDER BY updated_at DESC LIMIT 30",
    )?;
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
    conn.execute("DELETE FROM agent_pending_actions WHERE thread_id = ?1", params![thread_id])?;
    conn.execute("DELETE FROM agent_messages WHERE thread_id = ?1", params![thread_id])?;
    conn.execute("DELETE FROM agent_threads WHERE id = ?1", params![thread_id])?;
    Ok(())
}

pub fn detect_prompt_language(prompt: &str, fallback_locale: &str) -> &'static str {
    let has_ja_script = prompt.chars().any(|c| {
        matches!(c as u32, 0x3040..=0x309F | 0x30A0..=0x30FF | 0x4E00..=0x9FFF)
    });
    let low = prompt.to_lowercase();
    if has_ja_script || low.contains("in japanese") || low.contains("sa japanese") {
        return "ja-JP";
    }
    let tagalog_markers = [
        "kumusta", "kamusta", "magandang", "pwede", "puwede", "gumawa", "iskedyul",
        "kalendaryo", "bukas", "tulungan", "salamat", "tagalog", "filipino", "paalala",
        "pulong", "isalin", "paano", "kailangan", "ngayon", "ano ang", "sino ang",
        "saan ang", "bakit ", " po", "naman", "tayo", "ako ", "ikaw ", "paki",
    ];
    if tagalog_markers.iter().any(|m| low.contains(m)) {
        return "fil-PH";
    }
    match fallback_locale {
        "ja-JP" => "ja-JP",
        "fil-PH" => "fil-PH",
        _ => "en-US",
    }
}

fn is_casual_greeting(prompt: &str) -> bool {
    let low = prompt.trim().to_lowercase();
    let short = low.chars().count() <= 32;
    short
        && (matches!(
            low.as_str(),
            "hi" | "hello" | "hey" | "yo" | "sup" | "good morning" | "good afternoon"
                | "good evening" | "thanks" | "thank you" | "kumusta" | "kamusta"
                | "magandang umaga" | "magandang hapon" | "salamat"
                | "こんにちは" | "おはよう" | "おはようございます" | "こんばんは" | "ありがとう" | "もしもし"
        ) || low.starts_with("hi ")
            || low.starts_with("hello ")
            || low.starts_with("hey ")
            || low.starts_with("kumusta ")
            || low.starts_with("kamusta "))
}

fn needs_memory_lookup(prompt: &str) -> bool {
    if is_casual_greeting(prompt) {
        return false;
    }
    let low = prompt.to_lowercase();
    low.contains("mmi") || low.contains("man machine") || low.contains("director")
        || low.contains("president") || low.contains("ceo") || low.contains("office")
        || low.contains("address") || low.contains("company") || low.contains("glossary")
        || low.contains("memory") || low.contains("who is") || low.contains("what is")
        || low.contains("where is") || low.contains("sino") || low.contains("saan")
        || prompt.contains("マン・マシン") || prompt.contains("代表") || prompt.contains("会社")
        || prompt.contains("役員") || prompt.contains("本社") || prompt.contains("誰")
}

pub fn run_agent_turn(
    store: &OperoStore,
    thread_id: Option<&str>,
    prompt: &str,
    locale: &str,
    preferred_model: Option<&str>,
) -> OperoResult<AgentChatResponse> {
    let clean_prompt = prompt.trim();
    let reply_locale = detect_prompt_language(clean_prompt, locale);
    let settings = get_agent_settings(store)?;
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
            params![tid, title, reply_locale, now],
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
    let mut cot_steps = vec![format!("1. Detected response language: {reply_locale}")];
    let low = clean_prompt.to_lowercase();

    // Tool 1: Dual-Core Vector RAG lookup
    if needs_memory_lookup(clean_prompt) {
        let conn = store.conn()?;
        let hits = query_dual_core_memory(&conn, clean_prompt, None, 3)?;
        let hit_count = hits.len();
        for h in &hits {
            citations.push(h.chunk.title.clone());
            grounded_facts.push(format!("• {}: {}", h.chunk.title, h.chunk.content));
        }
        cot_steps.push(format!("2. Queried Dual-Core RAG memory → {hit_count} grounded chunk(s)."));
        tool_calls.push(AgentToolCallRecord {
            tool: "search_knowledge".into(),
            input: clean_prompt.chars().take(80).collect(),
            summary: format!("Retrieved {hit_count} grounded memory chunk(s)"),
            ok: true,
        });
    }

    // Tool 2: Analyzed documents
    if low.contains("doc") || low.contains("report") || low.contains("pdf") || clean_prompt.contains("ドキュメント") || clean_prompt.contains("レポート") {
        if let Ok(docs) = store.list_analyzed_documents() {
            if let Some(first) = docs.first() {
                grounded_facts.push(format!("• Latest Document ({}): {}% complete. {}", first.filename, first.completeness_score, first.executive_summary));
                action_link = Some(AgentActionLink { kind: "document".into(), id: first.id.clone(), label: format!("Open {}", first.filename) });
            }
            tool_calls.push(AgentToolCallRecord { tool: "list_documents".into(), input: "recent".into(), summary: format!("Found {} analyzed document(s)", docs.len()), ok: true });
        }
    }

    // Tool 3: Compiled meeting notes
    if low.contains("meeting") || low.contains("transcript") || low.contains("sync") || clean_prompt.contains("会議") || clean_prompt.contains("議事録") || clean_prompt.contains("pulong") {
        if let Ok(meetings) = list_meeting_notes(store) {
            if let Some(m) = meetings.first() {
                grounded_facts.push(format!("• Latest Meeting ({}): {} (Translated: {})", m.title, m.executive_summary, m.translated_summary));
                action_link = Some(AgentActionLink { kind: "meeting".into(), id: m.id.clone(), label: format!("Open {}", m.title) });
            }
            tool_calls.push(AgentToolCallRecord { tool: "list_meetings".into(), input: "recent".into(), summary: format!("Found {} recorded meeting(s)", meetings.len()), ok: true });
        }
    }

    // Tool 4: Create manual from template
    if (low.contains("create") || low.contains("draft") || clean_prompt.contains("作成") || clean_prompt.contains("gumawa"))
        && (low.contains("manual") || low.contains("sop") || low.contains("template") || clean_prompt.contains("手順書") || clean_prompt.contains("マニュアル"))
    {
        if let Ok(projects) = store.list_projects(false) {
            if let Some(proj) = projects.first() {
                let m_title = if reply_locale == "ja-JP" { "標準作業手順書（Pero作成）" } else { "Standard Operating Procedure (Drafted by Pero)" };
                if let Ok(manual) = store.create_manual_from_template(&proj.id, "sop", m_title, reply_locale) {
                    grounded_facts.push(format!("• Created new manual \"{}\" ({}).", manual.title, manual.id));
                    action_link = Some(AgentActionLink { kind: "manual".into(), id: manual.id.clone(), label: if reply_locale == "ja-JP" { "スタジオで開く".into() } else { "Open in OPERO Studio".into() } });
                    tool_calls.push(AgentToolCallRecord { tool: "create_manual_from_template".into(), input: manual.title, summary: format!("Saved new manual ({}) to SQLite", manual.id), ok: true });
                }
            }
        }
    }

    // Tool 5: Translate on demand
    if low.contains("translate") || clean_prompt.contains("翻訳") || clean_prompt.contains("isalin") {
        let target = if low.contains("japanese") || clean_prompt.contains("日本語") { "ja-JP" } else if low.contains("tagalog") || low.contains("filipino") { "fil-PH" } else { "en-US" };
        let (tr, _eng) = translate_text_local(clean_prompt, target, preferred_model);
        grounded_facts.push(format!("• Translation ({target}): {tr}"));
        tool_calls.push(AgentToolCallRecord { tool: "translate_text".into(), input: target.into(), summary: format!("Translated content into {target}"), ok: true });
    }

    // Tool 6: Human-in-the-loop OS / Calendar / Productivity Action Proposal
    let reply_msg_id = format!("msg_{}", Uuid::new_v4().simple());
    let mut pending_action: Option<PendingAgentAction> = None;
    let mut action_instruction = String::new();
    if let Some(draft) = detect_proposed_action(clean_prompt, &settings) {
        if let Some(reason) = draft.disabled_reason {
            cot_steps.push(format!("3. Action gate blocked '{}': {reason}", draft.action_type));
            grounded_facts.push(format!("• Capability Disabled: {reason}"));
            tool_calls.push(AgentToolCallRecord { tool: draft.action_type, input: draft.title, summary: reason, ok: false });
        } else {
            let act = PendingAgentAction {
                id: format!("act_{}", Uuid::new_v4().simple()),
                thread_id: tid.clone(),
                message_id: reply_msg_id.clone(),
                action_type: draft.action_type.clone(),
                title: draft.title.clone(),
                summary: draft.summary.clone(),
                target_app: draft.target_app.clone(),
                payload: draft.payload,
                status: "pending".into(),
                result_message: None,
                created_at: Utc::now().to_rfc3339(),
                executed_at: None,
            };
            let detail_line = act
                .payload
                .get("when")
                .map(|w| format!("Title: \"{}\" · When: {w} · Target: {}", act.payload.get("title").cloned().unwrap_or_else(|| act.title.clone()), act.target_app))
                .or_else(|| act.payload.get("format").map(|f| format!("Format: {f} · Title: \"{}\" · Target: {}", act.payload.get("title").cloned().unwrap_or_else(|| act.title.clone()), act.target_app)))
                .unwrap_or_else(|| format!("{} · Target: {}", act.title, act.target_app));
            cot_steps.push(format!("2. Extracted Details: {detail_line}"));
            cot_steps.push("3. Approval Gate: Capability enabled — paused in pending state awaiting Approve & Run.".into());
            action_instruction = match reply_locale {
                "fil-PH" => format!(
                    "\n\nInihanda mo ang aksyong ito ({detail_line}). Huwag sabihing tapos o naka-schedule na ito. Gamitin ang eksaktong petsa/pamagat sa itaas, sumagot nang 1-2 maikling pangungusap sa natural na Tagalog (walang raw asterisks), at hilingin sa user na i-click ang 'Approve & Run' sa ibaba."
                ),
                "ja-JP" => format!(
                    "\n\n次のアクションを準備しました（{detail_line}）。実行済みとは言わず、上記の正確な日時・タイトルを使って簡潔に日本語で案内し、下の「Approve & Run」で承認するようお願いしてください。"
                ),
                _ => format!(
                    "\n\nYou have prepared this pending action ({detail_line}). Do NOT say 'I have scheduled' or 'I have created' — say 'I have prepared'. Use the exact Title and Date/Time above without changing them, keep it to 1-2 clean sentences, and ask the user to click 'Approve & Run' below."
                ),
            };
            tool_calls.push(AgentToolCallRecord { tool: act.action_type.clone(), input: act.title.clone(), summary: "Queued for user confirmation".into(), ok: true });
            pending_action = Some(act);
        }
    }

    let (reply_text, model_thinking, engine_used, model_live) = synthesize_live_chat_reply(
        clean_prompt,
        reply_locale,
        &prior_history,
        &grounded_facts,
        &action_instruction,
        pending_action.as_ref(),
        preferred_model,
        settings.show_chain_of_thought,
    );

    let combined_thinking = if settings.show_chain_of_thought {
        let mut parts = vec![cot_steps.join("\n")];
        if let Some(mt) = model_thinking {
            parts.push(format!("Model reasoning:\n{mt}"));
        }
        Some(parts.join("\n\n"))
    } else {
        None
    };

    let reply_msg = AgentMessage {
        id: reply_msg_id,
        thread_id: tid.clone(),
        role: "assistant".into(),
        content: reply_text,
        thinking: combined_thinking,
        tool_calls,
        citations,
        action_link,
        pending_action: pending_action.clone(),
        created_at: Utc::now().to_rfc3339(),
    };

    let conn = store.conn()?;
    conn.execute(
        "INSERT INTO agent_messages (id, thread_id, role, content, thinking, tool_calls_json, citations_json, action_link_json, created_at)
         VALUES (?1, ?2, 'assistant', ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            reply_msg.id,
            reply_msg.thread_id,
            reply_msg.content,
            reply_msg.thinking,
            serde_json::to_string(&reply_msg.tool_calls)?,
            serde_json::to_string(&reply_msg.citations)?,
            reply_msg.action_link.as_ref().map(|a| serde_json::to_string(a).unwrap_or_default()),
            reply_msg.created_at
        ],
    )?;
    if let Some(act) = &pending_action {
        save_pending_action(&conn, act)?;
    }

    Ok(AgentChatResponse { thread_id: tid, message: reply_msg, engine_used, model_live })
}

fn load_thread_messages(conn: &Connection, thread_id: &str) -> OperoResult<Vec<AgentMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, thread_id, role, content, thinking, tool_calls_json, citations_json, action_link_json, created_at
         FROM agent_messages WHERE thread_id = ?1 ORDER BY created_at ASC",
    )?;
    let rows: Vec<AgentMessage> = stmt
        .query_map(params![thread_id], |r| {
            let tc: String = r.get(5)?;
            let cit: String = r.get(6)?;
            let al: Option<String> = r.get(7)?;
            Ok(AgentMessage {
                id: r.get(0)?,
                thread_id: r.get(1)?,
                role: r.get(2)?,
                content: r.get(3)?,
                thinking: r.get(4)?,
                tool_calls: serde_json::from_str(&tc).unwrap_or_default(),
                citations: serde_json::from_str(&cit).unwrap_or_default(),
                action_link: al.and_then(|s| serde_json::from_str(&s).ok()),
                pending_action: None,
                created_at: r.get(8)?,
            })
        })?
        .flatten()
        .collect();

    let mut enriched = Vec::with_capacity(rows.len());
    for mut m in rows {
        if m.role == "assistant" {
            m.pending_action = load_action_for_message(conn, &m.id)?;
        }
        enriched.push(m);
    }
    Ok(enriched)
}

#[allow(clippy::too_many_arguments)]
fn synthesize_live_chat_reply(
    prompt: &str,
    locale: &str,
    prior_history: &[AgentMessage],
    grounded_facts: &[String],
    action_instruction: &str,
    pending_action: Option<&PendingAgentAction>,
    preferred_model: Option<&str>,
    enable_thinking: bool,
) -> (String, Option<String>, String, bool) {
    let rt = check_ollama_status(preferred_model);
    if let Some(live_model) = rt.active_model.as_deref() {
        let lang_rule = match locale {
            "ja-JP" => "strictly polite Japanese (です・ます調・丁寧語). Always end sentences with です/ます/ください. NEVER use casual forms (だよ/ね/だ/〜て止め), Chinese-only idioms (分心), or awkward katakana (use 承認 instead of アプローブ)",
            "fil-PH" => "clear, natural everyday Manila Filipino / Tagalog (short, simple sentences; use Petsa/Oras/Pamagat, 'po' when polite; NEVER use Indonesian/Malay words like 'tanggal', 'hadi', 'sila' or invented words; do NOT echo the user's instruction)",
            _ => "clear, friendly English",
        };
        let facts_section = if grounded_facts.is_empty() {
            String::new()
        } else {
            format!("\n\nVerified local workspace context (use accurately, never fabricate):\n{}", grounded_facts.join("\n"))
        };
        let today_ctx = Local::now().format("%A, %Y-%m-%d %H:%M").to_string();
        let mut messages = vec![OllamaChatMessage {
            role: "system".into(),
            content: format!(
                "You are Pero, OPERO's friendly, sharp local-first AI assistant for Man Machine Interface (MMI). Current local date & time: {today_ctx}. Respond concisely in {lang_rule}. Never echo raw bracket tags like [Memory:].{facts_section}{action_instruction}"
            ),
        }];
        let start = prior_history.len().saturating_sub(8);
        for m in &prior_history[start..] {
            messages.push(OllamaChatMessage { role: m.role.clone(), content: m.content.clone() });
        }
        messages.push(OllamaChatMessage { role: "user".into(), content: prompt.into() });

        if let Some(res) = call_ollama_chat_with_thinking(live_model, &messages, enable_thinking) {
            if locale == "fil-PH" {
                if let Some(act) = pending_action {
                    let clean_fil = format!("Inihanda ko na ang \"{}\" para sa {}. Pakisuri ang detalye sa ibaba at i-click ang \"Approve & Run\" kapag handa ka nang magpatuloy.", act.title, act.target_app);
                    return (clean_fil, res.thinking, format!("Ollama ({live_model})"), true);
                }
            }
            return (res.content, res.thinking, format!("Ollama ({live_model})"), true);
        }
    }

    if let Some(act) = pending_action {
        let msg = match locale {
            "ja-JP" => format!("「{}」（{}）の実行準備ができました。内容をご確認のうえ、下の「Approve & Run」を押して承認してください。", act.title, act.target_app),
            "fil-PH" => format!("Handa na ang aksyong \"{}\" para sa {}. Pakisuri muna at i-click ang 'Approve & Run' sa ibaba bago ako magpatuloy.", act.title, act.target_app),
            _ => format!("I prepared \"{}\" for {} — please review the details below and click Approve & Run to confirm before I proceed.", act.title, act.target_app),
        };
        return (msg, None, "Local Action Planner".into(), false);
    }
    if is_casual_greeting(prompt) {
        let msg = match locale {
            "ja-JP" => "こんにちは！OPEROのローカルAIアシスタント「Pero」です。日本語・タガログ語・英語で会話やカレンダー予定作成ができます。".into(),
            "fil-PH" => "Kumusta! Ako si Pero, ang iyong lokal na AI assistant sa OPERO. Handa akong tumulong sa Tagalog, Japanese, o English.".into(),
            _ => "Hi! I'm Pero, your local-first OPERO assistant. Start Local AI above or ask me to schedule a calendar event, add a reminder, or search MMI knowledge.".into(),
        };
        return (msg, None, "Local Offline Helper".into(), false);
    }
    if !grounded_facts.is_empty() {
        let lead = match locale { "ja-JP" => "ローカル知識ベースから確認した情報です：\n\n", "fil-PH" => "Narito ang nahanap ko sa lokal na memorya ng OPERO:\n\n", _ => "Here is what I found in your local OPERO workspace:\n\n" };
        return (format!("{lead}{}", grounded_facts.join("\n\n")), None, "Local Grounded Tools".into(), false);
    }
    let msg = match locale {
        "ja-JP" => "自由な会話にはローカルAIモデル（Ollama）の起動が必要です。上部の「ローカルAIを起動」ボタンを押してください。".into(),
        "fil-PH" => "Kailangang i-start ang lokal na Ollama AI model para sa live na usapan. I-click ang 'Start Local AI' sa itaas.".into(),
        _ => "Start your local AI model using \"Start Local AI\" above for open-ended conversations via Ollama + Qwen3.".into(),
    };
    (msg, None, "Local Offline Helper".into(), false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_language_detection_and_greeting_and_pending_calendar() {
        assert_eq!(detect_prompt_language("Kumusta Pero, pwede ka bang gumawa ng iskedyul bukas?", "en-US"), "fil-PH");
        assert_eq!(detect_prompt_language("明日の10時にカレンダーへ予定を追加して", "en-US"), "ja-JP");
        assert_eq!(detect_prompt_language("Hello Pero, what is MMI?", "en-US"), "en-US");

        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        store.create_project("MMI Ops", "Arron", "Engineering", "en-US").unwrap();

        let hello = run_agent_turn(&store, None, "hello", "en-US", Some("offline")).unwrap();
        assert!(!hello.message.content.contains("[Memory:") && hello.message.tool_calls.is_empty() && hello.message.thinking.is_some());

        let rag = run_agent_turn(&store, None, "Who is the Representative Director of Man Machine Interface?", "en-US", Some("offline")).unwrap();
        assert!(rag.message.content.contains("Tetsuya Sekiguchi") || rag.message.content.contains("関口"));
        assert!(rag.message.tool_calls.iter().any(|t| t.tool == "search_knowledge" && t.ok));

        let cal = run_agent_turn(&store, Some(&rag.thread_id), "Schedule \"MMI Demo\" on Google Calendar tomorrow at 2pm", "en-US", Some("offline")).unwrap();
        let pending = cal.message.pending_action.expect("pending calendar action");
        assert_eq!((pending.status.as_str(), pending.action_type.as_str()), ("pending", "calendar_google"));
    }
}
