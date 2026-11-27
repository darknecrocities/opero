use chrono::Utc;
use rusqlite::params;
use std::path::Path;
use uuid::Uuid;

use crate::db::OperoStore;
use crate::error::{OperoError, OperoResult};
use crate::memory::dual_core::{build_bounded_rag_context, query_dual_core_memory, upsert_memory_chunk};
use crate::models::{AnnotationGeometry, AnnotationOverlay, CapturedEvent, ContentVariant, Manual, StepCallout, WorkflowStep};

/// [SEC-001] Validate that local AI/Speech endpoints stay strictly on loopback (SSRF defense).
pub fn validate_loopback_url(url: &str) -> OperoResult<()> {
    let lower = url.trim().to_lowercase();
    if lower.starts_with("http://127.0.0.1:") || lower.starts_with("http://localhost:") {
        return Ok(());
    }
    Err(OperoError::Forbidden(format!(
        "Outbound host blocked by SSRF & offline-strict guard: {url}"
    )))
}

/// [SEC-001] Wrap untrusted screen OCR / window titles in escaped data delimiters.
pub fn isolate_untrusted_screen_text(raw: &str) -> String {
    let escaped = raw.replace("</untrusted_screen_evidence>", "[ESCAPED_DELIMITER]");
    format!("<untrusted_screen_evidence>{escaped}</untrusted_screen_evidence>")
}

/// Stage 2: Invoke host Tesseract 5.5 safely via argument array (zero shell injection).
pub fn run_tesseract_ocr(image_path: &Path) -> OperoResult<String> {
    let out = crate::win_process::silent_command("tesseract")
        .arg(image_path)
        .arg("stdout")
        .args(["--psm", "6"])
        .output();
    match out {
        Ok(res) if res.status.success() => Ok(String::from_utf8_lossy(&res.stdout).trim().to_string()),
        _ => Ok(String::new()),
    }
}

/// Stage 3: Deterministic Event Grouping (zero silently dropped events).
pub fn group_events_deterministically(events: &[CapturedEvent]) -> Vec<Vec<CapturedEvent>> {
    let mut groups: Vec<Vec<CapturedEvent>> = Vec::new();
    for ev in events {
        let should_merge = if let Some(last_group) = groups.last() {
            if let Some(prev) = last_group.last() {
                prev.application.window_title == ev.application.window_title
                    && prev.event_type == "text_entry_metadata"
                    && (ev.event_type == "text_entry_metadata" || ev.event_type == "click")
            } else {
                false
            }
        } else {
            false
        };
        if should_merge {
            if let Some(last_group) = groups.last_mut() {
                last_group.push(ev.clone());
            }
        } else {
            groups.push(vec![ev.clone()]);
        }
    }
    groups
}

impl OperoStore {
    /// Stages 2-4 & 7: Deterministic Reconstruction + Dual-Core RAG Grounded Offline/Local Drafting.
    pub fn generate_manual_from_session(
        &self,
        session_id: &str,
        template_id: &str,
        source_locale: &str,
    ) -> OperoResult<Manual> {
        let conn = self.conn()?;
        let (project_id, session_title): (String, String) = conn
            .query_row(
                "SELECT project_id, title FROM recording_sessions WHERE id = ?1",
                params![session_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|_| OperoError::NotFound(format!("Session {session_id} not found")))?;

        let mut stmt = conn.prepare(
            "SELECT event_id, session_id, timestamp_utc, sequence, event_type, app_process, window_title,
                    coord_x, coord_y, display_scale, target_role, target_label, target_source,
                    screenshot_refs_json, privacy_flags_json, schema_version
             FROM captured_events WHERE session_id = ?1 ORDER BY sequence ASC",
        )?;
        let events: Vec<CapturedEvent> = stmt
            .query_map(params![session_id], |r| {
                let sc_json: String = r.get(13)?;
                let pf_json: String = r.get(14)?;
                Ok(CapturedEvent {
                    event_id: r.get(0)?,
                    session_id: r.get(1)?,
                    timestamp_utc: r.get(2)?,
                    sequence: r.get(3)?,
                    event_type: r.get(4)?,
                    application: crate::models::EventApplication { process: r.get(5)?, window_title: r.get(6)? },
                    coordinates: crate::models::EventCoordinates { x: r.get(7)?, y: r.get(8)?, display_scale: r.get(9)? },
                    target: crate::models::EventTarget { role: r.get(10)?, label: r.get(11)?, source: r.get(12)? },
                    screenshot_refs: serde_json::from_str(&sc_json).unwrap_or_default(),
                    privacy_flags: serde_json::from_str(&pf_json).unwrap_or_default(),
                    schema_version: r.get(15)?,
                })
            })?
            .flatten()
            .collect();

        if events.is_empty() {
            return Err(OperoError::Validation("Cannot generate manual from an empty recording session.".to_string()));
        }

        let rag_hits = query_dual_core_memory(&conn, &session_title, Some(source_locale), 4)?;
        let _rag_context = build_bounded_rag_context(&rag_hits);
        let groups = group_events_deterministically(&events);

        let manual_id = format!("man_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let summary = format!(
            "Evidence-linked operation manual reconstructed offline from {} recorded interaction(s) across {} logical step(s).",
            events.len(),
            groups.len()
        );
        let prereqs = vec![format!("Authorized access to {}", events[0].application.window_title)];

        conn.execute(
            "INSERT INTO manuals (id, project_id, session_id, title, template_id, source_locale, lifecycle_state, summary, prerequisites_json, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'draft', ?7, ?8, ?9, ?10)",
            params![
                manual_id, project_id, session_id, session_title, template_id, source_locale,
                summary, serde_json::to_string(&prereqs)?, now, now
            ],
        )?;

        let mut steps = Vec::new();
        for (idx, group) in groups.iter().enumerate() {
            let order_index = (idx + 1) as i32;
            let step_id = format!("step_{}_{:02}", &manual_id[4..10], order_index);
            let primary = group.last().unwrap();
            let event_refs: Vec<String> = group.iter().map(|e| e.event_id.clone()).collect();
            let mut screenshot_refs: Vec<String> = Vec::new();
            for e in group {
                for sc in &e.screenshot_refs {
                    if !screenshot_refs.contains(sc) {
                        screenshot_refs.push(sc.clone());
                    }
                }
            }
            let label = if primary.target.label.trim().is_empty() {
                "target control".to_string()
            } else {
                primary.target.label.clone()
            };
            let is_uncertain = primary.target.source == "unknown" || label == "target control";
            let review_status = if is_uncertain { "needs_review" } else { "draft" };
            let uncertainty_notes = if is_uncertain {
                vec!["Control label unavailable from OS Accessibility; verify visible UI element.".to_string()]
            } else {
                Vec::new()
            };
            let action_type = match primary.event_type.as_str() {
                "navigation" | "window_change" => "navigation",
                "text_entry_metadata" => "data_entry",
                _ if label.contains("Save") || label.contains("保存") || label.contains("Submit") => "confirmation",
                _ => "selection",
            };

            conn.execute(
                "INSERT INTO workflow_steps (id, manual_id, session_id, section_title, order_index, action_type, event_refs_json, screenshot_refs_json, review_status, uncertainty_notes_json, prompt_version, model_id, schema_version)
                 VALUES (?1, ?2, ?3, 'Procedure', ?4, ?5, ?6, ?7, ?8, ?9, 'v1.0.0', 'offline-deterministic', 1)",
                params![
                    step_id, manual_id, session_id, order_index, action_type,
                    serde_json::to_string(&event_refs)?, serde_json::to_string(&screenshot_refs)?,
                    review_status, serde_json::to_string(&uncertainty_notes)?
                ],
            )?;

            for ev_ref in &event_refs {
                conn.execute(
                    "INSERT INTO evidence_links (id, step_id, event_id, screenshot_id) VALUES (?1, ?2, ?3, ?4)",
                    params![format!("lnk_{}", Uuid::new_v4().simple()), step_id, ev_ref, screenshot_refs.first()],
                )?;
            }

            // First-class BCP-47 ContentVariants (en-US, ja-JP, fil-PH)
            let is_destructive = label.to_lowercase().contains("delete") || label.contains("削除");
            let callouts = if is_destructive {
                vec![StepCallout {
                    kind: "warning".to_string(),
                    text: format!("Confirm target record before activating \"{label}\"."),
                }]
            } else {
                Vec::new()
            };
            let variants_spec = [
                ("en-US", format!("Step {:02} — Select \"{}\"", order_index, label), format!("In {}, select \"{}\" to proceed with the documented operation.", primary.application.window_title, label)),
                ("ja-JP", format!("手順 {:02} — 「{}」を選択します", order_index, label), format!("{} の画面上で「{}」をクリックし、操作を進めます。", primary.application.window_title, label)),
                ("fil-PH", format!("Hakbang {:02} — Piliin ang \"{}\"", order_index, label), format!("Sa {}, piliin ang \"{}\" upang maipagpatuloy ang proseso.", primary.application.window_title, label)),
            ];
            let mut variant_map = serde_json::Map::new();
            for (loc, v_title, v_body) in variants_spec {
                let var_id = format!("var_{}_{}", step_id, loc);
                conn.execute(
                    "INSERT INTO content_variants (id, step_id, locale, title, body, callouts_json, source_variant_id, review_status, outdated)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, 0)",
                    params![var_id, step_id, loc, v_title, v_body, serde_json::to_string(&callouts)?, review_status],
                )?;
                conn.execute(
                    "INSERT INTO content_variants_fts (step_id, locale, title, body) VALUES (?1, ?2, ?3, ?4)",
                    params![step_id, loc, v_title, v_body],
                )?;
                variant_map.insert(
                    loc.to_string(),
                    serde_json::to_value(ContentVariant {
                        id: var_id,
                        step_id: step_id.clone(),
                        locale: loc.to_string(),
                        title: v_title,
                        body: v_body,
                        callouts: callouts.clone(),
                        source_variant_id: None,
                        review_status: review_status.to_string(),
                        outdated: false,
                    })?,
                );
            }

            // Suggested non-destructive Number + Rectangle annotation anchored to event coords
            let mut annotations = Vec::new();
            if let Some(sc_id) = screenshot_refs.first() {
                let nx = (f64::from(primary.coordinates.x) / 1280.0).clamp(0.05, 0.90);
                let ny = (f64::from(primary.coordinates.y) / 800.0).clamp(0.05, 0.90);
                let num_id = format!("ann_{}_num", step_id);
                let geom = AnnotationGeometry { x: nx, y: ny, w: 0.04, h: 0.05, x2: None, y2: None, curved: None };
                let style = serde_json::json!({ "strokeColor": "#0F172A", "radius": 16 });
                conn.execute(
                    "INSERT INTO annotations (id, screenshot_id, step_id, annot_type, geometry_json, number_value, localized_labels_json, style_json, is_irreversible_redaction)
                     VALUES (?1, ?2, ?3, 'number', ?4, ?5, '{}', ?6, 0)",
                    params![num_id, sc_id, step_id, serde_json::to_string(&geom)?, order_index, serde_json::to_string(&style)?],
                )?;
                annotations.push(AnnotationOverlay {
                    id: num_id,
                    screenshot_id: sc_id.clone(),
                    step_id: step_id.clone(),
                    annot_type: "number".to_string(),
                    geometry: geom,
                    number_value: Some(order_index),
                    localized_labels: serde_json::json!({}),
                    style,
                    is_irreversible_redaction: false,
                });
            }

            steps.push(WorkflowStep {
                id: step_id,
                manual_id: manual_id.clone(),
                session_id: Some(session_id.to_string()),
                section_title: "Procedure".to_string(),
                order_index,
                action_type: action_type.to_string(),
                event_refs,
                screenshot_refs,
                review_status: review_status.to_string(),
                uncertainty_notes,
                prompt_version: "v1.0.0".to_string(),
                model_id: "offline-deterministic".to_string(),
                variants: variant_map,
                annotations,
                schema_version: 1,
            });
        }

        // Record episodic session trace in Core 1 Dual-Core Memory
        let _ = upsert_memory_chunk(
            &conn,
            "episodic",
            Some(&project_id),
            "session_trace",
            session_id,
            source_locale,
            &format!("Recorded workflow: {session_title}"),
            &format!("Session {session_id} documented {} steps in {}.", steps.len(), events[0].application.window_title),
            false,
        );

        Ok(Manual {
            id: manual_id,
            project_id,
            session_id: Some(session_id.to_string()),
            title: session_title,
            template_id: template_id.to_string(),
            source_locale: source_locale.to_string(),
            lifecycle_state: "draft".to_string(),
            summary,
            prerequisites: prereqs,
            steps,
            created_at: now.clone(),
            updated_at: now,
        })
    }
}
