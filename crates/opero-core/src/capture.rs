use chrono::Utc;
use image::{imageops::FilterType, ImageBuffer, Rgba};
use rusqlite::params;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::process::Command;
use uuid::Uuid;

use crate::db::OperoStore;
use crate::error::{OperoError, OperoResult};
use crate::models::{CapturedEvent, EventApplication, EventCoordinates, EventTarget, RecordingSession, ScreenshotAsset};

pub const DEFAULT_EXCLUDED_APPS: &[&str] = &["1password", "bitwarden", "keychain access", "keepassxc"];

pub fn is_excluded_window(process: &str, window_title: &str, custom_exclusions: &[String]) -> bool {
    let p_low = process.to_lowercase();
    let w_low = window_title.to_lowercase();
    for def in DEFAULT_EXCLUDED_APPS {
        if p_low.contains(def) || w_low.contains(def) {
            return true;
        }
    }
    for rule in custom_exclusions {
        let r = rule.trim().to_lowercase();
        if !r.is_empty() && (p_low.contains(&r) || w_low.contains(&r)) {
            return true;
        }
    }
    false
}

/// 64-bit difference hash (dHash) over 9x8 grayscale thumbnail for frame deduplication.
pub fn compute_dhash(img: &image::DynamicImage) -> u64 {
    let gray = img.resize_exact(9, 8, FilterType::Triangle).to_luma8();
    let mut hash: u64 = 0;
    for y in 0..8 {
        for x in 0..8 {
            let left = gray.get_pixel(x, y)[0];
            let right = gray.get_pixel(x + 1, y)[0];
            if left > right {
                hash |= 1_u64 << (y * 8 + x);
            }
        }
    }
    hash
}

pub fn dhash_similarity(a: u64, b: u64) -> f64 {
    let hamming = (a ^ b).count_ones();
    1.0 - (f64::from(hamming) / 64.0)
}

pub fn validate_safe_relative_path(base_dir: &Path, rel_path: &str) -> OperoResult<PathBuf> {
    if rel_path.contains("..") || Path::new(rel_path).is_absolute() {
        return Err(OperoError::Forbidden("Path traversal blocked by workspace sandbox.".to_string()));
    }
    let joined = base_dir.join(rel_path);
    Ok(joined)
}

pub fn synthesize_portal_frame(width: u32, height: u32, seed: u8) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut img = ImageBuffer::from_pixel(width, height, Rgba([255, 255, 255, 255]));
    for y in 0..height.min(52) {
        for x in 0..width {
            img.put_pixel(x, y, Rgba([244, 249, 255, 255]));
        }
    }
    let btn_x = (width / 2).saturating_sub(60);
    let btn_y = (height / 2).saturating_sub(20).saturating_add(u32::from(seed % 4) * 18);
    for y in btn_y..btn_y.saturating_add(40).min(height) {
        for x in btn_x..btn_x.saturating_add(140).min(width) {
            img.put_pixel(x, y, Rgba([15, 23, 42, 255]));
        }
    }
    img
}

pub fn capture_os_frame_or_fallback(out_path: &Path, seed: u8, allow_native_screen: bool) -> OperoResult<(u32, u32)> {
    let tmp_path = out_path.with_extension("png.tmp");
    if allow_native_screen && cfg!(target_os = "macos") {
        let status = Command::new("/usr/sbin/screencapture")
            .args(["-x", "-t", "png"])
            .arg(&tmp_path)
            .status();
        if let Ok(st) = status {
            if st.success() && tmp_path.exists() {
                if let Ok(img) = image::open(&tmp_path) {
                    std::fs::rename(&tmp_path, out_path)?;
                    return Ok((img.width(), img.height()));
                }
            }
        }
        let _ = std::fs::remove_file(&tmp_path);
    }
    let synthetic = synthesize_portal_frame(1280, 800, seed);
    synthetic
        .save_with_format(&tmp_path, image::ImageFormat::Png)
        .map_err(|e| OperoError::Process(format!("PNG encode failed: {e}")))?;
    std::fs::rename(&tmp_path, out_path)?;
    Ok((1280, 800))
}

impl OperoStore {
    pub fn start_session(
        &self,
        project_id: &str,
        title: &str,
        profile: &str,
        consent_acknowledged: bool,
    ) -> OperoResult<RecordingSession> {
        if !consent_acknowledged {
            return Err(OperoError::Validation("Explicit recording consent must be acknowledged.".to_string()));
        }
        let conn = self.conn()?;
        let active: i64 = conn.query_row(
            "SELECT COUNT(*) FROM recording_sessions WHERE status = 'recording'", [], |r| r.get(0)
        )?;
        if active > 0 {
            return Err(OperoError::Conflict("An active recording session is already in progress.".to_string()));
        }
        let id = format!("sess_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        std::fs::create_dir_all(self.data_dir.join("sessions").join(&id).join("frames"))?;
        conn.execute(
            "INSERT INTO recording_sessions (id, project_id, title, started_at, ended_at, active_duration_ms, status, capture_profile, app_version, consent_acknowledged_at)
             VALUES (?1, ?2, ?3, ?4, NULL, 0, 'recording', ?5, '1.0.0', ?6)",
            params![id, project_id, title.trim(), now, profile, now],
        )?;
        Ok(RecordingSession {
            id,
            project_id: project_id.to_string(),
            title: title.trim().to_string(),
            started_at: now.clone(),
            ended_at: None,
            active_duration_ms: 0,
            status: "recording".to_string(),
            capture_profile: profile.to_string(),
            app_version: "1.0.0".to_string(),
            consent_acknowledged_at: now,
            event_count: 0,
            screenshot_count: 0,
        })
    }

    pub fn update_session_status(&self, session_id: &str, status: &str, duration_ms: Option<i64>) -> OperoResult<()> {
        let conn = self.conn()?;
        let ended_at = if status == "completed" { Some(Utc::now().to_rfc3339()) } else { None };
        let changed = conn.execute(
            "UPDATE recording_sessions SET status = ?1, ended_at = COALESCE(?2, ended_at), active_duration_ms = COALESCE(?3, active_duration_ms) WHERE id = ?4",
            params![status, ended_at, duration_ms, session_id],
        )?;
        if changed == 0 {
            return Err(OperoError::NotFound(format!("Session {session_id} not found")));
        }
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn record_event_and_frame(
        &self,
        session_id: &str,
        event_type: &str,
        process: &str,
        window_title: &str,
        x: i32,
        y: i32,
        display_scale: f64,
        target_role: &str,
        target_label: &str,
        custom_exclusions: &[String],
        dedup_threshold: f64,
        allow_native_screen: bool,
    ) -> OperoResult<Option<(CapturedEvent, ScreenshotAsset)>> {
        let conn = self.conn()?;
        let status: String = conn.query_row(
            "SELECT status FROM recording_sessions WHERE id = ?1",
            params![session_id],
            |r| r.get(0),
        ).map_err(|_| OperoError::NotFound(format!("Session {session_id} not found")))?;

        if status != "recording" {
            return Ok(None); // Strictly drop events when paused or stopped
        }
        if is_excluded_window(process, window_title, custom_exclusions) {
            return Ok(None); // Privacy exclusion active
        }

        let seq: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sequence), 0) + 1 FROM captured_events WHERE session_id = ?1",
            params![session_id],
            |r| r.get(0),
        )?;

        let is_secure_field = target_role.to_lowercase().contains("secure") || target_role.to_lowercase().contains("password");
        let safe_label = if is_secure_field {
            "[MASKED_PASSWORD_FIELD]".to_string()
        } else {
            target_label.to_string()
        };
        let privacy_flags = if is_secure_field { vec!["masked".to_string()] } else { Vec::new() };

        let sc_id = format!("sc_{:03}", seq);
        let rel_path = format!("sessions/{session_id}/frames/{sc_id}.png");
        let abs_path = self.data_dir.join(&rel_path);
        if let Some(parent) = abs_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let (width, height) = capture_os_frame_or_fallback(&abs_path, (seq % 250) as u8, allow_native_screen)?;
        let raw_bytes = std::fs::read(&abs_path)?;
        let sha256 = hex::encode(Sha256::digest(&raw_bytes));
        let img = image::load_from_memory(&raw_bytes).map_err(|e| OperoError::Process(e.to_string()))?;
        let dhash_u64 = compute_dhash(&img);
        let dhash_hex = format!("{dhash_u64:016x}");

        // Check perceptual hash deduplication against latest screenshot
        let prev: Option<(String, String)> = conn.query_row(
            "SELECT id, dhash FROM screenshots WHERE session_id = ?1 ORDER BY rowid DESC LIMIT 1",
            params![session_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        ).ok();

        let final_sc = if let Some((prev_id, prev_dhash)) = prev {
            let prev_u64 = u64::from_str_radix(&prev_dhash, 16).unwrap_or(0);
            if dhash_similarity(prev_u64, dhash_u64) >= dedup_threshold {
                let _ = std::fs::remove_file(&abs_path);
                conn.query_row(
                    "SELECT id, session_id, relative_path, timestamp_utc, width, height, display_scale, sha256, dhash, redaction_state
                     FROM screenshots WHERE id = ?1",
                    params![prev_id],
                    |r| Ok(ScreenshotAsset {
                        id: r.get(0)?, session_id: r.get(1)?, relative_path: r.get(2)?,
                        timestamp_utc: r.get(3)?, width: r.get(4)?, height: r.get(5)?,
                        display_scale: r.get(6)?, sha256: r.get(7)?, dhash: r.get(8)?, redaction_state: r.get(9)?,
                    }),
                )?
            } else {
                self.insert_screenshot(&conn, &sc_id, session_id, &rel_path, width, height, display_scale, &sha256, &dhash_hex)?
            }
        } else {
            self.insert_screenshot(&conn, &sc_id, session_id, &rel_path, width, height, display_scale, &sha256, &dhash_hex)?
        };

        let event_id = format!("ev_{:03}", seq);
        let now = Utc::now().to_rfc3339();
        let sc_refs = vec![final_sc.id.clone()];
        conn.execute(
            "INSERT INTO captured_events (event_id, session_id, timestamp_utc, sequence, event_type, app_process, window_title, coord_x, coord_y, display_scale, target_role, target_label, target_source, screenshot_refs_json, privacy_flags_json, schema_version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 'accessibility', ?13, ?14, 1)",
            params![
                event_id, session_id, now, seq, event_type, process, window_title,
                x, y, display_scale, target_role, safe_label,
                serde_json::to_string(&sc_refs)?, serde_json::to_string(&privacy_flags)?
            ],
        )?;

        Ok(Some((
            CapturedEvent {
                event_id,
                session_id: session_id.to_string(),
                timestamp_utc: now,
                sequence: seq,
                event_type: event_type.to_string(),
                application: EventApplication { process: process.to_string(), window_title: window_title.to_string() },
                coordinates: EventCoordinates { x, y, display_scale },
                target: EventTarget { role: target_role.to_string(), label: safe_label, source: "accessibility".to_string() },
                screenshot_refs: sc_refs,
                privacy_flags,
                schema_version: 1,
            },
            final_sc,
        )))
    }

    #[allow(clippy::too_many_arguments)]
    fn insert_screenshot(
        &self,
        conn: &rusqlite::Connection,
        id: &str,
        session_id: &str,
        rel_path: &str,
        width: u32,
        height: u32,
        display_scale: f64,
        sha256: &str,
        dhash: &str,
    ) -> OperoResult<ScreenshotAsset> {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO screenshots (id, session_id, relative_path, timestamp_utc, width, height, display_scale, sha256, dhash, redaction_state)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'none')",
            params![id, session_id, rel_path, now, width, height, display_scale, sha256, dhash],
        )?;
        Ok(ScreenshotAsset {
            id: id.to_string(),
            session_id: session_id.to_string(),
            relative_path: rel_path.to_string(),
            timestamp_utc: now,
            width,
            height,
            display_scale,
            sha256: sha256.to_string(),
            dhash: dhash.to_string(),
            redaction_state: "none".to_string(),
        })
    }
}
