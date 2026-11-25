use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};
use uuid::Uuid;

use crate::agent_action_parser::build_ics_content;
use crate::agent_doc_gen::generate_agent_document;
use crate::db::OperoStore;
use crate::error::{OperoError, OperoResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentCapabilitiesSettings {
    pub enabled: bool,
    pub require_confirmation: bool,
    pub show_chain_of_thought: bool,
    pub calendar_enabled: bool,
    pub reminders_enabled: bool,
    pub email_draft_enabled: bool,
    pub notes_enabled: bool,
    pub notifications_enabled: bool,
    pub clipboard_open_enabled: bool,
}

impl Default for AgentCapabilitiesSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            require_confirmation: true,
            show_chain_of_thought: true,
            calendar_enabled: true,
            reminders_enabled: true,
            email_draft_enabled: true,
            notes_enabled: true,
            notifications_enabled: true,
            clipboard_open_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingAgentAction {
    pub id: String,
    pub thread_id: String,
    pub message_id: String,
    pub action_type: String,
    pub title: String,
    pub summary: String,
    pub target_app: String,
    pub payload: BTreeMap<String, String>,
    pub status: String,
    pub result_message: Option<String>,
    pub created_at: String,
    pub executed_at: Option<String>,
}

pub fn ensure_agent_actions_schema(conn: &Connection) -> OperoResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS agent_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            settings_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agent_pending_actions (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            target_app TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL,
            result_message TEXT,
            created_at TEXT NOT NULL,
            executed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS agent_reminders (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            due_label TEXT NOT NULL,
            created_at TEXT NOT NULL
        );",
    )?;
    Ok(())
}

pub fn get_agent_settings(store: &OperoStore) -> OperoResult<AgentCapabilitiesSettings> {
    let conn = store.conn()?;
    ensure_agent_actions_schema(&conn)?;
    let raw: Option<String> = conn
        .query_row("SELECT settings_json FROM agent_settings WHERE id = 1", [], |r| r.get(0))
        .ok();
    Ok(raw.and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default())
}

pub fn save_agent_settings(
    store: &OperoStore,
    mut settings: AgentCapabilitiesSettings,
) -> OperoResult<AgentCapabilitiesSettings> {
    settings.require_confirmation = true;
    let conn = store.conn()?;
    ensure_agent_actions_schema(&conn)?;
    let json = serde_json::to_string(&settings)?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO agent_settings (id, settings_json, updated_at) VALUES (1, ?1, ?2)
         ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at",
        params![json, now],
    )?;
    Ok(settings)
}

pub fn save_pending_action(conn: &Connection, action: &PendingAgentAction) -> OperoResult<()> {
    ensure_agent_actions_schema(conn)?;
    conn.execute(
        "INSERT INTO agent_pending_actions
         (id, thread_id, message_id, action_type, title, summary, target_app, payload_json, status, result_message, created_at, executed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            action.id, action.thread_id, action.message_id, action.action_type,
            action.title, action.summary, action.target_app,
            serde_json::to_string(&action.payload)?,
            action.status, action.result_message, action.created_at, action.executed_at
        ],
    )?;
    Ok(())
}

pub fn load_action_for_message(conn: &Connection, message_id: &str) -> OperoResult<Option<PendingAgentAction>> {
    ensure_agent_actions_schema(conn)?;
    let mut stmt = conn.prepare(
        "SELECT id, thread_id, message_id, action_type, title, summary, target_app, payload_json, status, result_message, created_at, executed_at
         FROM agent_pending_actions WHERE message_id = ?1 LIMIT 1",
    )?;
    let mut rows = stmt.query_map(params![message_id], row_to_action)?;
    Ok(rows.next().and_then(|r| r.ok()))
}

fn load_action_by_id(conn: &Connection, action_id: &str) -> OperoResult<PendingAgentAction> {
    ensure_agent_actions_schema(conn)?;
    conn.query_row(
        "SELECT id, thread_id, message_id, action_type, title, summary, target_app, payload_json, status, result_message, created_at, executed_at
         FROM agent_pending_actions WHERE id = ?1",
        params![action_id],
        row_to_action,
    )
    .map_err(|_| OperoError::NotFound(format!("Agent action {action_id} not found")))
}

fn row_to_action(r: &rusqlite::Row<'_>) -> rusqlite::Result<PendingAgentAction> {
    let payload_str: String = r.get(7)?;
    Ok(PendingAgentAction {
        id: r.get(0)?,
        thread_id: r.get(1)?,
        message_id: r.get(2)?,
        action_type: r.get(3)?,
        title: r.get(4)?,
        summary: r.get(5)?,
        target_app: r.get(6)?,
        payload: serde_json::from_str(&payload_str).unwrap_or_default(),
        status: r.get(8)?,
        result_message: r.get(9)?,
        created_at: r.get(10)?,
        executed_at: r.get(11)?,
    })
}

pub fn is_capability_allowed(settings: &AgentCapabilitiesSettings, action_type: &str) -> bool {
    if !settings.enabled {
        return false;
    }
    match action_type {
        "calendar_google" | "calendar_local" => settings.calendar_enabled,
        "reminder_local" => settings.reminders_enabled,
        "email_draft" => settings.email_draft_enabled,
        "create_note" | "generate_document" => settings.notes_enabled,
        "desktop_notification" => settings.notifications_enabled,
        "clipboard_copy" | "open_url" => settings.clipboard_open_enabled,
        _ => false,
    }
}

fn is_safe_external_url(url: &str) -> bool {
    let low = url.to_lowercase();
    if !(low.starts_with("https://") || low.starts_with("mailto:")) {
        return false;
    }
    !low.contains("169.254.169.254") && !low.contains("localhost") && !low.contains("127.0.0.1")
}

fn open_os_target(target: &str) -> Result<(), String> {
    if cfg!(target_os = "macos") {
        Command::new("open").arg(target).stdout(Stdio::null()).stderr(Stdio::null()).spawn()
            .map_err(|e| format!("Failed to launch target: {e}"))?;
    } else if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", "start", "", target]).stdout(Stdio::null()).stderr(Stdio::null()).spawn()
            .map_err(|e| format!("Failed to launch target: {e}"))?;
    }
    Ok(())
}

pub fn approve_and_execute_action(store: &OperoStore, action_id: &str) -> OperoResult<PendingAgentAction> {
    let settings = get_agent_settings(store)?;
    let conn = store.conn()?;
    let mut action = load_action_by_id(&conn, action_id)?;
    if action.status == "executed" {
        return Ok(action);
    }
    if !is_capability_allowed(&settings, &action.action_type) {
        return Err(OperoError::Validation(
            "This agent capability is currently disabled in Settings → Pero Agent.".to_string(),
        ));
    }

    let now = Utc::now().to_rfc3339();
    match execute_action_side_effect(&store.data_dir, &conn, &action) {
        Ok(msg) => {
            action.status = "executed".into();
            action.result_message = Some(msg);
            action.executed_at = Some(now);
        }
        Err(err) => {
            action.status = "failed".into();
            action.result_message = Some(err);
            action.executed_at = Some(now);
        }
    }
    conn.execute(
        "UPDATE agent_pending_actions SET status = ?1, result_message = ?2, executed_at = ?3 WHERE id = ?4",
        params![action.status, action.result_message, action.executed_at, action.id],
    )?;
    Ok(action)
}

pub fn cancel_pending_action(store: &OperoStore, action_id: &str) -> OperoResult<PendingAgentAction> {
    let conn = store.conn()?;
    let mut action = load_action_by_id(&conn, action_id)?;
    action.status = "cancelled".into();
    action.result_message = Some("Cancelled by user before execution.".into());
    action.executed_at = Some(Utc::now().to_rfc3339());
    conn.execute(
        "UPDATE agent_pending_actions SET status = ?1, result_message = ?2, executed_at = ?3 WHERE id = ?4",
        params![action.status, action.result_message, action.executed_at, action.id],
    )?;
    Ok(action)
}

fn execute_action_side_effect(
    data_dir: &Path,
    conn: &Connection,
    action: &PendingAgentAction,
) -> Result<String, String> {
    let skip_open = std::env::var("OPERO_SKIP_OS_OPEN").is_ok();
    match action.action_type.as_str() {
        "calendar_google" => {
            let url = action.payload.get("googleUrl").cloned().unwrap_or_default();
            if !is_safe_external_url(&url) {
                return Err("Invalid Google Calendar URL.".into());
            }
            if !skip_open { open_os_target(&url)?; }
            Ok("Opened pre-filled Google Calendar event in your browser.".into())
        }
        "calendar_local" => {
            let cal_dir = data_dir.join("calendar-events");
            std::fs::create_dir_all(&cal_dir).map_err(|e| e.to_string())?;
            let path = cal_dir.join(format!("{}.ics", action.id));
            let title = action.payload.get("title").map(|s| s.as_str()).unwrap_or("OPERO Event");
            let start = action.payload.get("icsStart").map(|s| s.as_str()).unwrap_or("20261126T100000");
            std::fs::write(&path, build_ics_content(&action.id, title, start, "Scheduled via OPERO Pero Agent")).map_err(|e| e.to_string())?;
            if !skip_open { open_os_target(&path.to_string_lossy())?; }
            Ok(format!("Created & opened calendar invite: {}", path.display()))
        }
        "reminder_local" => {
            let title = action.payload.get("title").map(|s| s.as_str()).unwrap_or("OPERO Reminder");
            let due = action.payload.get("due").map(|s| s.as_str()).unwrap_or("Today");
            let rem_id = format!("rem_{}", Uuid::new_v4().simple());
            let _ = conn.execute(
                "INSERT INTO agent_reminders (id, title, due_label, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![rem_id, title, due, Utc::now().to_rfc3339()],
            );
            if cfg!(target_os = "macos") && !skip_open {
                let _ = Command::new("osascript")
                    .args(["-e", "on run argv\ntell application \"Reminders\" to make new reminder with properties {name:(item 1 of argv)}\nend run", title])
                    .stdout(Stdio::null()).stderr(Stdio::null()).spawn();
            }
            Ok(format!("Saved reminder \"{title}\" ({rem_id})."))
        }
        "email_draft" => {
            let url = action.payload.get("mailtoUrl").cloned().unwrap_or_default();
            if !is_safe_external_url(&url) { return Err("Invalid mailto URI.".into()); }
            if !skip_open { open_os_target(&url)?; }
            Ok("Opened pre-filled email draft in your default Mail app.".into())
        }
        "create_note" => {
            let notes_dir = data_dir.join("notes");
            std::fs::create_dir_all(&notes_dir).map_err(|e| e.to_string())?;
            let path = notes_dir.join(format!("{}.md", action.id));
            let title = action.payload.get("title").map(|s| s.as_str()).unwrap_or("OPERO Note");
            let body = action.payload.get("body").map(|s| s.as_str()).unwrap_or("");
            std::fs::write(&path, format!("# {title}\n\nCreated: {}\n\n{body}\n", Utc::now().to_rfc3339())).map_err(|e| e.to_string())?;
            Ok(format!("Saved Markdown note to {}", path.display()))
        }
        "generate_document" => {
            let fmt = action.payload.get("format").map(|s| s.as_str()).unwrap_or("pdf");
            let title = action.payload.get("title").map(|s| s.as_str()).unwrap_or("OPERO Document");
            let topic = action.payload.get("topic").map(|s| s.as_str()).unwrap_or(title);
            let (path, bytes) = generate_agent_document(data_dir, &action.id, fmt, title, topic)?;
            if cfg!(target_os = "macos") && !skip_open {
                let _ = Command::new("open").args(["-R", &path.to_string_lossy()]).stdout(Stdio::null()).stderr(Stdio::null()).spawn();
            }
            Ok(format!("Generated {} ({} bytes) → {}", fmt.to_uppercase(), bytes, path.display()))
        }
        "desktop_notification" => {
            let title = action.payload.get("title").map(|s| s.as_str()).unwrap_or("OPERO Pero");
            let body = action.payload.get("body").map(|s| s.as_str()).unwrap_or("Reminder");
            if cfg!(target_os = "macos") && !skip_open {
                let _ = Command::new("osascript")
                    .args(["-e", "on run argv\ndisplay notification (item 2 of argv) with title (item 1 of argv)\nend run", title, body])
                    .stdout(Stdio::null()).stderr(Stdio::null()).spawn();
            }
            Ok(format!("Sent desktop notification: \"{body}\""))
        }
        "clipboard_copy" => {
            let text = action.payload.get("text").map(|s| s.as_str()).unwrap_or("");
            if cfg!(target_os = "macos") && !skip_open {
                if let Ok(mut child) = Command::new("pbcopy").stdin(Stdio::piped()).spawn() {
                    if let Some(mut stdin) = child.stdin.take() { let _ = stdin.write_all(text.as_bytes()); }
                    let _ = child.wait();
                }
            }
            Ok("Copied text to system clipboard.".into())
        }
        "open_url" => {
            let url = action.payload.get("url").cloned().unwrap_or_default();
            if !is_safe_external_url(&url) { return Err("Blocked unsafe URL.".into()); }
            if !skip_open { open_os_target(&url)?; }
            Ok(format!("Opened {url}"))
        }
        other => Err(format!("Unsupported action type: {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_action_parser::{build_google_calendar_url, detect_proposed_action};
    use tempfile::tempdir;

    #[test]
    fn test_calendar_url_and_ics_generation() {
        let url = build_google_calendar_url("MMI Sync", "20261126T100000/20261126T110000", "Team review");
        assert!(url.starts_with("https://calendar.google.com/calendar/render?action=TEMPLATE"));
        let ics = build_ics_content("act_1", "MMI Sync", "20261126T100000", "Team review");
        assert!(ics.contains("BEGIN:VEVENT") && ics.contains("SUMMARY:MMI Sync"));
    }

    #[test]
    fn test_settings_gating_and_approval_flow() {
        std::env::set_var("OPERO_SKIP_OS_OPEN", "1");
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let mut settings = get_agent_settings(&store).unwrap();
        settings.calendar_enabled = false;
        save_agent_settings(&store, settings.clone()).unwrap();
        assert!(detect_proposed_action("Schedule a Google Calendar meeting tomorrow at 2pm", &settings).unwrap().disabled_reason.is_some());

        settings.calendar_enabled = true;
        save_agent_settings(&store, settings.clone()).unwrap();
        let draft = detect_proposed_action("Schedule a local calendar event tomorrow at 3pm", &settings).unwrap();
        let act = PendingAgentAction {
            id: "act_test1".into(), thread_id: "thr_1".into(), message_id: "msg_1".into(),
            action_type: draft.action_type, title: draft.title, summary: draft.summary,
            target_app: draft.target_app, payload: draft.payload, status: "pending".into(),
            result_message: None, created_at: Utc::now().to_rfc3339(), executed_at: None,
        };
        save_pending_action(&store.conn().unwrap(), &act).unwrap();
        let done = approve_and_execute_action(&store, "act_test1").unwrap();
        assert_eq!(done.status, "executed");
        assert!(dir.path().join("calendar-events/act_test1.ics").exists());
    }
}
