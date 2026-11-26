use chrono::{Duration, Local, NaiveTime, Utc};
use std::collections::BTreeMap;

use crate::agent_actions::{is_capability_allowed, AgentCapabilitiesSettings};

pub struct ProposedActionDraft {
    pub action_type: String,
    pub title: String,
    pub summary: String,
    pub target_app: String,
    pub payload: BTreeMap<String, String>,
    pub disabled_reason: Option<String>,
}

fn to_title_case_if_lowercase(s: &str) -> String {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let has_upper = trimmed.chars().any(|c| c.is_uppercase());
    let has_non_ascii = trimmed.chars().any(|c| !c.is_ascii());
    if has_upper || has_non_ascii {
        return trimmed.to_string();
    }
    trimmed
        .split_whitespace()
        .map(|w| {
            let mut ch = w.chars();
            match ch.next() {
                Some(first) => format!("{}{}", first.to_uppercase(), ch.as_str()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn extract_event_window(prompt: &str) -> (String, String, String) {
    let low = prompt.to_lowercase();
    let base_date = if low.contains("day after tomorrow") || low.contains("makalawa") || prompt.contains("明後日") {
        (Local::now() + Duration::days(2)).date_naive()
    } else if low.contains("tomorrow")
        || low.contains("tommorow")
        || low.contains("tomorow")
        || low.contains("tmrw")
        || low.contains("bukas")
        || prompt.contains("明日")
    {
        (Local::now() + Duration::days(1)).date_naive()
    } else {
        Local::now().date_naive()
    };

    let (hour, minute) = parse_hour_minute(&low).unwrap_or((10, 0));
    let start_time = NaiveTime::from_hms_opt(hour, minute, 0)
        .unwrap_or_else(|| NaiveTime::from_hms_opt(10, 0, 0).unwrap());
    let start_dt = base_date.and_time(start_time);
    let end_dt = start_dt + Duration::hours(1);

    let gcal = format!("{}/{}", start_dt.format("%Y%m%dT%H%M00"), end_dt.format("%Y%m%dT%H%M00"));
    let display = format!(
        "{} · {:02}:{:02} – {:02}:{:02}",
        base_date.format("%a, %Y-%m-%d"),
        hour,
        minute,
        (hour + 1) % 24,
        minute
    );
    let ics_start = start_dt.format("%Y%m%dT%H%M00").to_string();
    (gcal, display, ics_start)
}

fn parse_hour_minute(low: &str) -> Option<(u32, u32)> {
    let bytes = low.as_bytes();
    for i in 0..bytes.len() {
        if !bytes[i].is_ascii_digit() { continue; }
        let mut j = i;
        while j < bytes.len() && bytes[j].is_ascii_digit() { j += 1; }
        let h: u32 = low[i..j].parse().ok()?;
        if h > 23 { continue; }
        if j < bytes.len() && bytes[j] == b':' && j + 2 < bytes.len() && bytes[j + 1].is_ascii_digit() {
            let m: u32 = low[j + 1..j + 3].parse().ok().unwrap_or(0);
            let mut hr = h;
            if low[(j + 3).min(low.len())..].trim_start().starts_with("pm") && hr < 12 { hr += 12; }
            return Some((hr, m.min(59)));
        }
        let tail = low[j..].trim_start();
        if tail.starts_with("pm") && h <= 12 { return Some((if h == 12 { 12 } else { h + 12 }, 0)); }
        if tail.starts_with("am") && h <= 12 { return Some((if h == 12 { 0 } else { h }, 0)); }
        if tail.starts_with("時") { return Some((h, 0)); }
    }
    None
}

fn strip_trailing_schedule_noise(raw: &str) -> String {
    let mut s = raw.trim().trim_matches(|c: char| matches!(c, '"' | '\'' | ':' | '-' | ',' | '.' | '。')).to_string();
    let cut_markers = [
        " on google calendar", " in google calendar", " on calendar", " in calendar",
        " sa google calendar", " sa kalendaryo", " for tomorrow", " for tommorow",
        " for tomorow", " tomorrow at", " tommorow at", " at ", " bukas ",
    ];
    let low = s.to_lowercase();
    for marker in cut_markers {
        if let Some(pos) = low.find(marker) {
            if pos >= 2 {
                s = s[..pos].trim().to_string();
                break;
            }
        }
    }
    s.trim_matches(|c: char| matches!(c, '"' | '\'' | ':' | '-' | ',' | '.' | '。')).to_string()
}

pub fn extract_clean_subject(prompt: &str, default_title: &str) -> String {
    // 1. Explicit quoted text ("...", 「...」, 『...』)
    for quote in ['"', '「', '『'] {
        if let Some(start) = prompt.find(quote) {
            let close = match quote { '「' => '」', '『' => '』', other => other };
            let rest = &prompt[start + quote.len_utf8()..];
            if let Some(end) = rest.find(close) {
                let candidate = rest[..end].trim();
                if !candidate.is_empty() {
                    return to_title_case_if_lowercase(&candidate.chars().take(72).collect::<String>());
                }
            }
        }
    }

    // 2. Explicit unquoted cues ("title sample meeting", "titled ...", "about ...", "para sa ...", "タイトル...")
    let low = prompt.to_lowercase();
    let cues = [
        "title:", "titled:", "title ", "titled ", "called ", "named ",
        "subject:", "subject ", "about ", "para sa ", "pamagat:", "pamagat ",
        "タイトル:", "タイトル：", "タイトルは", "件名:", "件名：",
    ];
    for cue in cues {
        if let Some(pos) = low.find(cue) {
            let after = &prompt[pos + cue.len()..];
            let cleaned = strip_trailing_schedule_noise(after);
            if cleaned.chars().count() >= 2 {
                return to_title_case_if_lowercase(&cleaned.chars().take(72).collect::<String>());
            }
        }
    }

    // 3. Fallback: strip common command boilerplate
    let cleaned = strip_trailing_schedule_noise(prompt);
    if cleaned.is_empty() { default_title.to_string() } else { cleaned.chars().take(64).collect() }
}

pub fn url_encode_component(input: &str) -> String {
    let mut out = String::with_capacity(input.len() * 2);
    for b in input.bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~') {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}

pub fn build_google_calendar_url(title: &str, dates: &str, details: &str) -> String {
    format!(
        "https://calendar.google.com/calendar/render?action=TEMPLATE&text={}&dates={}&details={}",
        url_encode_component(title),
        url_encode_component(dates),
        url_encode_component(details),
    )
}

pub fn build_ics_content(uid: &str, title: &str, start_local: &str, details: &str) -> String {
    let esc = |s: &str| s.replace('\\', "\\\\").replace(',', "\\,").replace(';', "\\;").replace('\n', "\\n");
    let dtstamp = Utc::now().format("%Y%m%dT%H%M%SZ");
    format!(
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//OPERO//Pero Agent//EN\r\nBEGIN:VEVENT\r\nUID:{uid}@opero.local\r\nDTSTAMP:{dtstamp}\r\nDTSTART:{start_local}\r\nDURATION:PT1H\r\nSUMMARY:{}\r\nDESCRIPTION:{}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",
        esc(title), esc(details),
    )
}

fn detect_doc_format(low: &str) -> Option<(&'static str, &'static str)> {
    let wants_create = low.contains("generate") || low.contains("create") || low.contains("make")
        || low.contains("export") || low.contains("build") || low.contains("write")
        || low.contains("gumawa") || low.contains("作成") || low.contains("作って");
    if !wants_create { return None; }
    if low.contains("excel") || low.contains("xlsx") || low.contains("spreadsheet") {
        Some(("xlsx", "Excel Spreadsheet (.xlsx)"))
    } else if low.contains("csv") {
        Some(("csv", "CSV Spreadsheet (.csv)"))
    } else if low.contains("pdf") {
        Some(("pdf", "PDF Document (.pdf)"))
    } else if low.contains("docx") || low.contains("word") {
        Some(("docx", "Word Document (.docx)"))
    } else if low.contains("html") {
        Some(("html", "HTML Document (.html)"))
    } else if low.contains("markdown") || low.contains(".md") {
        Some(("md", "Markdown Document (.md)"))
    } else {
        None
    }
}

pub fn detect_proposed_action(
    prompt: &str,
    settings: &AgentCapabilitiesSettings,
) -> Option<ProposedActionDraft> {
    let low = prompt.to_lowercase();

    // 1. Document / File Generation (PDF, Word, Excel, CSV, HTML, Markdown)
    if let Some((fmt, fmt_label)) = detect_doc_format(&low) {
        let subject = extract_clean_subject(prompt, "OPERO Generated Document");
        let mut payload = BTreeMap::new();
        payload.insert("title".into(), subject.clone());
        payload.insert("format".into(), fmt.to_uppercase());
        payload.insert("topic".into(), prompt.trim().to_string());
        let disabled_reason = (!is_capability_allowed(settings, "generate_document"))
            .then(|| "Document generation is disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "generate_document".into(),
            title: format!("Generate {}: {subject}", fmt.to_uppercase()),
            summary: format!("Creates a real offline {fmt_label} in your local OPERO exports folder."),
            target_app: format!("OPERO {fmt_label}"),
            payload,
            disabled_reason,
        });
    }

    // 2. Calendar scheduling (Google Calendar or Computer Calendar)
    let is_calendar = low.contains("calendar") || low.contains("schedule")
        || low.contains("iskedyul") || low.contains("kalendaryo")
        || prompt.contains("カレンダー") || prompt.contains("予定") || prompt.contains("スケジュール");
    if is_calendar {
        let is_google = low.contains("google") || prompt.contains("グーグル");
        let action_type = if is_google { "calendar_google" } else { "calendar_local" };
        let (dates, display, ics_start) = extract_event_window(prompt);
        let subject = extract_clean_subject(prompt, "OPERO Scheduled Event");
        let gcal_url = build_google_calendar_url(&subject, &dates, "Created via OPERO Pero Agent");
        let mut payload = BTreeMap::new();
        payload.insert("title".into(), subject.clone());
        payload.insert("when".into(), display.clone());
        payload.insert("dates".into(), dates);
        payload.insert("icsStart".into(), ics_start);
        payload.insert("googleUrl".into(), gcal_url);
        let disabled_reason = (!is_capability_allowed(settings, action_type))
            .then(|| "Calendar actions are disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: action_type.into(),
            title: format!("Schedule: {subject}"),
            summary: format!(
                "{} · {display} (Zero API key — one-click launch after approval)",
                if is_google { "Google Calendar" } else { "Computer Calendar (.ics)" }
            ),
            target_app: if is_google { "Google Calendar (Browser)".into() } else { "Apple Calendar / System .ics".into() },
            payload,
            disabled_reason,
        });
    }

    // 3. OS Reminder / To-Do task
    if low.contains("remind") || low.contains("reminder") || low.contains("todo") || low.contains("to-do")
        || low.contains("paalala") || prompt.contains("リマインダー") || prompt.contains("タスク追加")
    {
        let subject = extract_clean_subject(prompt, "OPERO Follow-up Reminder");
        let mut payload = BTreeMap::new();
        payload.insert("title".into(), subject.clone());
        payload.insert("due".into(), "Today".into());
        let disabled_reason = (!is_capability_allowed(settings, "reminder_local"))
            .then(|| "Reminders are disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "reminder_local".into(),
            title: format!("Add Reminder: {subject}"),
            summary: "Creates a native OS reminder and stores a local OPERO checklist copy.".into(),
            target_app: "Reminders.app / Local Tasks".into(),
            payload,
            disabled_reason,
        });
    }

    // 4. Pre-filled Email Draft (mailto:)
    if (low.contains("email") || low.contains("mail") || prompt.contains("メール"))
        && (low.contains("draft") || low.contains("send") || low.contains("write") || low.contains("compose") || low.contains("gumawa") || prompt.contains("作成") || prompt.contains("下書き"))
    {
        let subject = extract_clean_subject(prompt, "OPERO Follow-up");
        let recipient = prompt
            .split_whitespace()
            .find(|w| w.contains('@') && w.contains('.'))
            .unwrap_or("")
            .trim_matches(|c: char| !c.is_alphanumeric() && c != '@' && c != '.' && c != '-' && c != '_')
            .to_string();
        let mailto = format!(
            "mailto:{recipient}?subject={}&body={}",
            url_encode_component(&subject),
            url_encode_component("Drafted with OPERO Pero Agent.\n\n")
        );
        let mut payload = BTreeMap::new();
        payload.insert("to".into(), if recipient.is_empty() { "(choose recipient in Mail)".into() } else { recipient });
        payload.insert("subject".into(), subject.clone());
        payload.insert("mailtoUrl".into(), mailto);
        let disabled_reason = (!is_capability_allowed(settings, "email_draft"))
            .then(|| "Email draft actions are disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "email_draft".into(),
            title: format!("Draft Email: {subject}"),
            summary: "Opens your default Mail app with a pre-filled subject and body (no API key).".into(),
            target_app: "Default Mail App".into(),
            payload,
            disabled_reason,
        });
    }

    // 5. Local Markdown Note
    if (low.contains("note") || low.contains("tala") || prompt.contains("メモ"))
        && (low.contains("create") || low.contains("save") || low.contains("write") || low.contains("gumawa") || prompt.contains("作成") || prompt.contains("保存"))
    {
        let subject = extract_clean_subject(prompt, "OPERO Quick Note");
        let mut payload = BTreeMap::new();
        payload.insert("title".into(), subject.clone());
        payload.insert("body".into(), prompt.trim().to_string());
        let disabled_reason = (!is_capability_allowed(settings, "create_note"))
            .then(|| "Local Note creation is disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "create_note".into(),
            title: format!("Save Local Note: {subject}"),
            summary: "Saves a structured Markdown note into your local OPERO notes folder.".into(),
            target_app: "Local Markdown Notes".into(),
            payload,
            disabled_reason,
        });
    }

    // 6. Desktop Notification / Alert
    if low.contains("notify") || low.contains("notification") || low.contains("alert me") || prompt.contains("通知") {
        let subject = extract_clean_subject(prompt, "OPERO Notification");
        let mut payload = BTreeMap::new();
        payload.insert("title".into(), "OPERO Pero".into());
        payload.insert("body".into(), subject.clone());
        let disabled_reason = (!is_capability_allowed(settings, "desktop_notification"))
            .then(|| "Desktop notifications are disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "desktop_notification".into(),
            title: "Send Desktop Notification".into(),
            summary: format!("Displays a native OS alert: \"{subject}\""),
            target_app: "macOS / OS Notification Center".into(),
            payload,
            disabled_reason,
        });
    }

    // 7. Clipboard Copy
    if (low.contains("copy") && low.contains("clipboard")) || prompt.contains("クリップボード") {
        let subject = extract_clean_subject(prompt, prompt.trim());
        let mut payload = BTreeMap::new();
        payload.insert("text".into(), subject.clone());
        let disabled_reason = (!is_capability_allowed(settings, "clipboard_copy"))
            .then(|| "Clipboard actions are disabled in Settings → Pero Agent.".to_string());
        return Some(ProposedActionDraft {
            action_type: "clipboard_copy".into(),
            title: "Copy Text to Clipboard".into(),
            summary: "Copies the prepared snippet to your system clipboard.".into(),
            target_app: "System Clipboard".into(),
            payload,
            disabled_reason,
        });
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unquoted_title_and_tommorow_typo_parsing() {
        let cfg = AgentCapabilitiesSettings::default();
        let draft = detect_proposed_action(
            "kindly make me a schedule on google calendar for tommorow at 2pm title sample meeting",
            &cfg,
        )
        .unwrap();
        assert_eq!(draft.action_type, "calendar_google");
        assert_eq!(draft.payload.get("title").map(|s| s.as_str()), Some("Sample Meeting"));
        let tomorrow_str = (Local::now() + Duration::days(1)).format("%Y-%m-%d").to_string();
        assert!(draft.payload.get("when").unwrap().contains(&tomorrow_str));
        assert!(draft.payload.get("when").unwrap().contains("14:00"));
    }

    #[test]
    fn test_document_generation_intent_detection() {
        let cfg = AgentCapabilitiesSettings::default();
        let d_pdf = detect_proposed_action("Generate a PDF report titled MMI Safety Guide", &cfg).unwrap();
        assert_eq!(d_pdf.action_type, "generate_document");
        assert_eq!(d_pdf.payload.get("format").map(|s| s.as_str()), Some("PDF"));
        assert_eq!(d_pdf.payload.get("title").map(|s| s.as_str()), Some("MMI Safety Guide"));

        let d_xlsx = detect_proposed_action("Gumawa ng Excel spreadsheet para sa Weekly Tasks", &cfg).unwrap();
        assert_eq!(d_xlsx.action_type, "generate_document");
        assert_eq!(d_xlsx.payload.get("format").map(|s| s.as_str()), Some("XLSX"));
        assert_eq!(d_xlsx.payload.get("title").map(|s| s.as_str()), Some("Weekly Tasks"));
    }
}
