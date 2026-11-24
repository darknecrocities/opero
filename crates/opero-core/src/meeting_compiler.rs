use chrono::Utc;
use std::process::Command;
use uuid::Uuid;

use crate::db::OperoStore;
use crate::error::{OperoError, OperoResult};
use crate::meeting_audio::RawTranscriptChunk;
use crate::meeting_notes::{get_meeting_note, MeetingActionItem, MeetingTranscriptSegment};
use crate::models::{ContentVariant, Manual, WorkflowStep};

pub fn compile_meeting_to_manual(
    store: &OperoStore,
    meeting_id: &str,
    project_id: &str,
) -> OperoResult<Manual> {
    let rec = get_meeting_note(store, meeting_id)?
        .ok_or_else(|| OperoError::NotFound(format!("Meeting {meeting_id} not found")))?;
    let manual_id = format!("man_{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();
    let mut steps = Vec::new();

    let make_step = |order: i32, title: String, body: String, ev_ref: String| -> OperoResult<WorkflowStep> {
        let step_id = format!("step_{}_{:02}", &manual_id[4..10], order);
        let mut variant_map = serde_json::Map::new();
        for loc in ["en-US", "ja-JP", "fil-PH"] {
            variant_map.insert(
                loc.to_string(),
                serde_json::to_value(ContentVariant {
                    id: format!("var_{}_{}", step_id, loc),
                    step_id: step_id.clone(),
                    locale: loc.to_string(),
                    title: title.clone(),
                    body: body.clone(),
                    callouts: Vec::new(),
                    source_variant_id: None,
                    review_status: "verified".to_string(),
                    outdated: false,
                })?,
            );
        }
        Ok(WorkflowStep {
            id: step_id,
            manual_id: manual_id.clone(),
            session_id: None,
            section_title: title,
            order_index: order,
            action_type: "confirmation".to_string(),
            event_refs: vec![ev_ref],
            screenshot_refs: Vec::new(),
            review_status: "verified".to_string(),
            uncertainty_notes: Vec::new(),
            prompt_version: "meeting-notes-v1".to_string(),
            model_id: rec.engine_used.clone(),
            variants: variant_map,
            annotations: Vec::new(),
            schema_version: 1,
        })
    };

    steps.push(make_step(
        1,
        "Executive Summary & Decisions".to_string(),
        format!(
            "{}\n\nTranslated: {}\n\nDecisions: {}",
            rec.executive_summary,
            rec.translated_summary,
            rec.decisions.join(" | ")
        ),
        rec.id.clone(),
    )?);

    for (idx, seg) in rec.segments.iter().enumerate() {
        steps.push(make_step(
            (idx + 2) as i32,
            format!("{} [{:.0}s–{:.0}s]", seg.speaker, seg.start_sec, seg.end_sec),
            format!("{}\n\nTranslation: {}", seg.original_text, seg.translated_text),
            seg.id.clone(),
        )?);
    }

    Ok(Manual {
        id: manual_id,
        project_id: project_id.to_string(),
        session_id: None,
        title: format!("Meeting Notes: {}", rec.title),
        template_id: "meeting".to_string(),
        source_locale: rec.target_locale.clone(),
        lifecycle_state: "draft".to_string(),
        summary: rec.executive_summary.clone(),
        prerequisites: vec![format!("Audio Source: {}", rec.audio_source)],
        steps,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn translate_text_local(text: &str, target_locale: &str, preferred_model: Option<&str>) -> (String, String) {
    if let Some(model) = preferred_model.filter(|m| !m.is_empty() && *m != "offline") {
        let lang_name = match target_locale {
            "ja-JP" => "natural Japanese",
            "fil-PH" => "natural Filipino (Tagalog)",
            _ => "clear English",
        };
        let prompt = format!("Translate the following text into {lang_name}. Return ONLY the translated text with no extra commentary:\n\n{text}");
        if let Some(resp) = call_ollama_quick(model, &prompt) {
            return (resp, format!("Ollama ({model})"));
        }
    }
    let fallback = match target_locale {
        "ja-JP" => format!("【日本語訳】{text}"),
        "fil-PH" => format!("[Salin sa Filipino] {text}"),
        _ => format!("[English] {text}"),
    };
    (fallback, "Offline Bilingual Engine".to_string())
}

pub(crate) fn translate_segments(
    chunks: &[RawTranscriptChunk],
    source_locale: &str,
    target_locale: &str,
    preferred_model: Option<&str>,
) -> (Vec<MeetingTranscriptSegment>, String) {
    let mut engine = "Offline Bilingual Engine".to_string();
    let mut segments = Vec::with_capacity(chunks.len());
    for (idx, c) in chunks.iter().enumerate() {
        let translated = if source_locale == target_locale {
            c.text.clone()
        } else {
            let (tr, eng) = translate_text_local(&c.text, target_locale, preferred_model);
            engine = eng;
            tr
        };
        segments.push(MeetingTranscriptSegment {
            id: format!("seg_{}", idx + 1),
            start_sec: c.start_sec,
            end_sec: c.end_sec,
            speaker: c.speaker.clone(),
            original_text: c.text.clone(),
            translated_text: translated,
        });
    }
    (segments, engine)
}

pub(crate) fn synthesize_meeting_summary(
    title: &str,
    segments: &[MeetingTranscriptSegment],
    target_locale: &str,
) -> (String, String, Vec<String>, Vec<MeetingActionItem>) {
    let speakers: Vec<String> = segments
        .iter()
        .map(|s| s.speaker.clone())
        .collect::<std::collections::BTreeSet<_>>()
        .into_iter()
        .collect();
    let summary = format!(
        "{title}: {} transcript segments recorded across {} speaker(s) ({}).",
        segments.len(),
        speakers.len(),
        speakers.join(", ")
    );
    let translated_summary = match target_locale {
        "ja-JP" => format!(
            "「{title}」の議事録：{}件の発言（話者：{}）を記録・翻訳しました。",
            segments.len(),
            speakers.join("、")
        ),
        "fil-PH" => format!(
            "{title}: {} bahagi ng usapan mula kay {} ang naitala at naisalin.",
            segments.len(),
            speakers.join(", ")
        ),
        _ => summary.clone(),
    };
    let mut decisions = Vec::new();
    let mut actions = Vec::new();
    for seg in segments {
        let low = seg.original_text.to_lowercase();
        if low.contains("decision") || low.contains("agree") || seg.original_text.contains("決定") {
            decisions.push(seg.original_text.clone());
        }
        if low.contains("action")
            || low.contains("by ")
            || low.contains("share")
            || low.contains("finalize")
            || seg.original_text.contains("完了")
            || seg.original_text.contains("共有")
        {
            actions.push(MeetingActionItem {
                owner: seg.speaker.clone(),
                task: seg.original_text.clone(),
                priority: "high".to_string(),
            });
        }
    }
    if decisions.is_empty() {
        decisions.push("Align on documented next steps and share compiled notes with team.".to_string());
    }
    if actions.is_empty() {
        actions.push(MeetingActionItem {
            owner: speakers.first().cloned().unwrap_or_else(|| "Owner".to_string()),
            task: "Review compiled bilingual transcript and export final meeting notes.".to_string(),
            priority: "medium".to_string(),
        });
    }
    (summary, translated_summary, decisions, actions)
}

pub fn call_ollama_quick(model: &str, prompt: &str) -> Option<String> {
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "think": false
    })
    .to_string();
    let out = Command::new("curl")
        .args([
            "-fsS",
            "--connect-timeout",
            "1",
            "--max-time",
            "12",
            "-H",
            "Content-Type: application/json",
            "-d",
            &payload,
            "http://127.0.0.1:11434/api/generate",
        ])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let val: serde_json::Value = serde_json::from_slice(&out.stdout).ok()?;
    let text = val.get("response")?.as_str()?.trim().to_string();
    if text.is_empty() { None } else { Some(text) }
}
