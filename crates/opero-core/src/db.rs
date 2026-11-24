use chrono::Utc;
use rusqlite::{params, Connection};
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::error::{OperoError, OperoResult};
use crate::memory::dual_core::upsert_memory_chunk;
use crate::models::{GlossaryTerm, Project, RecordingSession};

const INITIAL_SQL: &str = include_str!("../migrations/001_initial_schema.sql");

pub struct OperoStore {
    pub db_path: PathBuf,
    pub data_dir: PathBuf,
}

impl OperoStore {
    pub fn open(data_dir: &Path) -> OperoResult<Self> {
        std::fs::create_dir_all(data_dir)?;
        std::fs::create_dir_all(data_dir.join("sessions"))?;
        std::fs::create_dir_all(data_dir.join("exports"))?;
        let db_path = data_dir.join("opero.sqlite3");
        let store = Self {
            db_path,
            data_dir: data_dir.to_path_buf(),
        };
        let conn = store.conn()?;
        conn.execute_batch(INITIAL_SQL)?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, ?1)",
            params![Utc::now().to_rfc3339()],
        )?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&store.db_path, std::fs::Permissions::from_mode(0o600));
        }
        store.seed_defaults(&conn)?;
        Ok(store)
    }

    pub fn conn(&self) -> OperoResult<Connection> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute_batch(
            "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON; PRAGMA busy_timeout = 5000;",
        )?;
        Ok(conn)
    }

    fn seed_defaults(&self, conn: &Connection) -> OperoResult<()> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM glossary_terms", [], |r| r.get(0))?;
        if count == 0 {
            let defaults = [
                ("gl-save-ja", "Save", "ja-JP", "保存", "[\"セーブ\"]", "Preserve quoted UI label."),
                ("gl-save-fil", "Save", "fil-PH", "I-save", "[\"Iligtas\"]", "MMI approved procedural Filipino."),
                ("gl-dash-ja", "Dashboard", "ja-JP", "ダッシュボード", "[]", "Standard UI label."),
                ("gl-dash-fil", "Dashboard", "fil-PH", "Dashboard", "[\"Pisara\"]", "Keep English product label."),
                ("gl-submit-ja", "Submit", "ja-JP", "送信", "[]", "Form submission verb."),
                ("gl-submit-fil", "Submit", "fil-PH", "Isumite", "[\"Ipasa na lang\"]", "Formal operational verb."),
            ];
            for (id, src, loc, pref, forb, ctx) in defaults {
                conn.execute(
                    "INSERT OR IGNORE INTO glossary_terms (id, source_term, locale, preferred_term, forbidden_variants_json, context, glossary_version)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
                    params![id, src, loc, pref, forb, ctx],
                )?;
                let _ = upsert_memory_chunk(
                    conn,
                    "semantic",
                    None,
                    "glossary",
                    id,
                    loc,
                    &format!("MMI Glossary: {src} -> {pref}"),
                    &format!("Preferred {loc} translation for \"{src}\" is \"{pref}\". {ctx}"),
                    true,
                );
            }
        }
        Ok(())
    }

    pub fn create_project(
        &self,
        title: &str,
        owner: &str,
        department: &str,
        default_locale: &str,
    ) -> OperoResult<Project> {
        let clean_title = title.trim();
        if clean_title.is_empty() || clean_title.chars().count() > 200 {
            return Err(OperoError::Validation("Project title must be 1..200 characters.".to_string()));
        }
        if !matches!(default_locale, "en-US" | "ja-JP" | "fil-PH") {
            return Err(OperoError::Validation(format!("Unsupported default locale: {default_locale}")));
        }
        let id = format!("proj_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let conn = self.conn()?;
        conn.execute(
            "INSERT INTO projects (id, title, owner, department, default_locale, glossary_id, archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'mmi-default-v1', 0, ?6, ?7)",
            params![id, clean_title, owner.trim(), department.trim(), default_locale, now, now],
        )?;
        self.log_audit(&conn, Some(&id), owner, "project.created", clean_title)?;
        Ok(Project {
            id,
            title: clean_title.to_string(),
            owner: owner.trim().to_string(),
            department: department.trim().to_string(),
            default_locale: default_locale.to_string(),
            glossary_id: Some("mmi-default-v1".to_string()),
            archived: false,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_projects(&self, include_archived: bool) -> OperoResult<Vec<Project>> {
        let conn = self.conn()?;
        let sql = if include_archived {
            "SELECT id, title, owner, department, default_locale, glossary_id, archived, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        } else {
            "SELECT id, title, owner, department, default_locale, glossary_id, archived, created_at, updated_at FROM projects WHERE archived = 0 ORDER BY updated_at DESC"
        };
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([], |r| {
            Ok(Project {
                id: r.get(0)?,
                title: r.get(1)?,
                owner: r.get(2)?,
                department: r.get(3)?,
                default_locale: r.get(4)?,
                glossary_id: r.get(5)?,
                archived: r.get::<_, i64>(6)? != 0,
                created_at: r.get(7)?,
                updated_at: r.get(8)?,
            })
        })?;
        Ok(rows.flatten().collect())
    }

    pub fn list_sessions(&self) -> OperoResult<Vec<RecordingSession>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare(
            "SELECT s.id, s.project_id, s.title, s.started_at, s.ended_at, s.active_duration_ms,
                    s.status, s.capture_profile, s.app_version, s.consent_acknowledged_at,
                    (SELECT COUNT(*) FROM captured_events e WHERE e.session_id = s.id),
                    (SELECT COUNT(*) FROM screenshots sc WHERE sc.session_id = s.id)
             FROM recording_sessions s ORDER BY s.started_at DESC",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(RecordingSession {
                id: r.get(0)?,
                project_id: r.get(1)?,
                title: r.get(2)?,
                started_at: r.get(3)?,
                ended_at: r.get(4)?,
                active_duration_ms: r.get(5)?,
                status: r.get(6)?,
                capture_profile: r.get(7)?,
                app_version: r.get(8)?,
                consent_acknowledged_at: r.get(9)?,
                event_count: r.get(10)?,
                screenshot_count: r.get(11)?,
            })
        })?;
        Ok(rows.flatten().collect())
    }

    pub fn list_glossary(&self) -> OperoResult<Vec<GlossaryTerm>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare(
            "SELECT id, source_term, locale, preferred_term, forbidden_variants_json, context, glossary_version
             FROM glossary_terms ORDER BY source_term ASC, locale ASC",
        )?;
        let rows = stmt.query_map([], |r| {
            let forb_json: String = r.get(4)?;
            let forbidden_variants: Vec<String> = serde_json::from_str(&forb_json).unwrap_or_default();
            Ok(GlossaryTerm {
                id: r.get(0)?,
                source_term: r.get(1)?,
                locale: r.get(2)?,
                preferred_term: r.get(3)?,
                forbidden_variants,
                context: r.get(5)?,
                glossary_version: r.get(6)?,
            })
        })?;
        Ok(rows.flatten().collect())
    }

    pub fn recover_incomplete_sessions(&self) -> OperoResult<usize> {
        let conn = self.conn()?;
        let updated = conn.execute(
            "UPDATE recording_sessions SET status = 'incomplete_recovered' WHERE status = 'recording'",
            [],
        )?;
        Ok(updated)
    }

    pub fn log_audit(&self, conn: &Connection, project_id: Option<&str>, actor: &str, action: &str, detail: &str) -> OperoResult<()> {
        let id = format!("aud_{}", Uuid::new_v4().simple());
        conn.execute(
            "INSERT INTO audit_logs (id, project_id, actor, action, detail, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, project_id, actor, action, detail, Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }
}
