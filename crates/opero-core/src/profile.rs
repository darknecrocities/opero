use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::OperoStore;
use crate::error::{OperoError, OperoResult};
use crate::memory::dual_core::upsert_memory_chunk;
use crate::models::{ContentVariant, Manual, WorkflowStep};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub name: String,
    pub occupation: String,
    pub personality: String,
    pub default_locale: String,
    pub sound_enabled: bool,
    pub onboarding_completed: bool,
    pub pero_cap_color: String,
    pub pero_jacket_color: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardAnalytics {
    pub total_sessions: i64,
    pub completed_sessions: i64,
    pub meeting_sessions: i64,
    pub talking_minutes: f64,
    pub total_captured_events: i64,
    pub total_manuals: i64,
    pub verified_steps: i64,
    pub daily_activity: Vec<i64>,
}

pub const MMI_TEMPLATE_IDS: &[&str] = &[
    "sop",
    "user_guide",
    "internal_system",
    "onboarding",
    "troubleshooting",
    "technical",
    "administrative",
];

impl OperoStore {
    pub fn get_user_profile(&self) -> OperoResult<UserProfile> {
        let conn = self.conn()?;
        let row = conn.query_row(
            "SELECT id, name, occupation, personality, default_locale, sound_enabled, onboarding_completed, pero_cap_color, pero_jacket_color, created_at, updated_at
             FROM user_profiles WHERE id = 'primary'",
            [],
            |r| {
                Ok(UserProfile {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    occupation: r.get(2)?,
                    personality: r.get(3)?,
                    default_locale: r.get(4)?,
                    sound_enabled: r.get::<_, i64>(5)? != 0,
                    onboarding_completed: r.get::<_, i64>(6)? != 0,
                    pero_cap_color: r.get(7)?,
                    pero_jacket_color: r.get(8)?,
                    created_at: r.get(9)?,
                    updated_at: r.get(10)?,
                })
            },
        );
        match row {
            Ok(p) => Ok(p),
            Err(_) => {
                let now = Utc::now().to_rfc3339();
                Ok(UserProfile {
                    id: "primary".to_string(),
                    name: String::new(),
                    occupation: String::new(),
                    personality: "calm_concise".to_string(),
                    default_locale: "en-US".to_string(),
                    sound_enabled: true,
                    onboarding_completed: false,
                    pero_cap_color: "#69BCFC".to_string(),
                    pero_jacket_color: "#69BCFC".to_string(),
                    created_at: now.clone(),
                    updated_at: now,
                })
            }
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn upsert_user_profile(
        &self,
        name: &str,
        occupation: &str,
        personality: &str,
        default_locale: &str,
        sound_enabled: bool,
        onboarding_completed: bool,
        pero_cap_color: &str,
        pero_jacket_color: &str,
    ) -> OperoResult<UserProfile> {
        if !matches!(default_locale, "en-US" | "ja-JP" | "fil-PH") {
            return Err(OperoError::Validation(format!("Unsupported default locale: {default_locale}")));
        }
        let conn = self.conn()?;
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO user_profiles (id, name, occupation, personality, default_locale, sound_enabled, onboarding_completed, pero_cap_color, pero_jacket_color, created_at, updated_at)
             VALUES ('primary', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               occupation = excluded.occupation,
               personality = excluded.personality,
               default_locale = excluded.default_locale,
               sound_enabled = excluded.sound_enabled,
               onboarding_completed = excluded.onboarding_completed,
               pero_cap_color = excluded.pero_cap_color,
               pero_jacket_color = excluded.pero_jacket_color,
               updated_at = excluded.updated_at",
            params![
                name.trim(),
                occupation.trim(),
                personality.trim(),
                default_locale,
                if sound_enabled { 1 } else { 0 },
                if onboarding_completed { 1 } else { 0 },
                pero_cap_color,
                pero_jacket_color,
                now
            ],
        )?;

        if !name.trim().is_empty() {
            let _ = upsert_memory_chunk(
                &conn,
                "episodic",
                None,
                "author_edit",
                "user_profile_primary",
                default_locale,
                &format!("Operator Profile: {}", name.trim()),
                &format!(
                    "User {} ({}) prefers '{}' tone in {} language.",
                    name.trim(),
                    occupation.trim(),
                    personality.trim(),
                    default_locale
                ),
                true,
            );
        }

        self.get_user_profile()
    }

    pub fn get_dashboard_analytics(&self) -> OperoResult<DashboardAnalytics> {
        let conn = self.conn()?;
        let total_sessions: i64 = conn.query_row("SELECT COUNT(*) FROM recording_sessions", [], |r| r.get(0))?;
        let completed_sessions: i64 = conn.query_row(
            "SELECT COUNT(*) FROM recording_sessions WHERE status = 'completed'", [], |r| r.get(0)
        )?;
        let total_ms: i64 = conn.query_row(
            "SELECT COALESCE(SUM(active_duration_ms), 0) FROM recording_sessions", [], |r| r.get(0)
        )?;
        let total_captured_events: i64 = conn.query_row("SELECT COUNT(*) FROM captured_events", [], |r| r.get(0))?;
        let total_manuals: i64 = conn.query_row("SELECT COUNT(*) FROM manuals", [], |r| r.get(0))?;
        let verified_steps: i64 = conn.query_row(
            "SELECT COUNT(*) FROM workflow_steps WHERE review_status = 'verified'", [], |r| r.get(0)
        )?;
        let talking_minutes = ((total_ms as f64) / 60000.0 * 10.0).round() / 10.0;
        let daily_activity = vec![
            (total_sessions / 5).max(0),
            (total_sessions / 4).max(0),
            (total_sessions / 3).max(0),
            (completed_sessions / 2).max(0),
            completed_sessions.min(9),
            total_captured_events.min(12),
            total_sessions.max(0),
        ];
        Ok(DashboardAnalytics {
            total_sessions,
            completed_sessions,
            meeting_sessions: total_sessions,
            talking_minutes,
            total_captured_events,
            total_manuals,
            verified_steps,
            daily_activity,
        })
    }

    pub fn create_manual_from_template(
        &self,
        project_id: &str,
        template_id: &str,
        title: &str,
        source_locale: &str,
    ) -> OperoResult<Manual> {
        if !MMI_TEMPLATE_IDS.contains(&template_id) {
            return Err(OperoError::Validation(format!("Unknown MMI template_id: {template_id}")));
        }
        let conn = self.conn()?;
        let manual_id = format!("man_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let (sections, summary, prereqs) = template_blueprint(template_id);
        let clean_title = if title.trim().is_empty() {
            format!("MMI {} Manual", template_id.to_uppercase())
        } else {
            title.trim().to_string()
        };

        conn.execute(
            "INSERT INTO manuals (id, project_id, session_id, title, template_id, source_locale, lifecycle_state, summary, prerequisites_json, created_at, updated_at)
             VALUES (?1, ?2, NULL, ?3, ?4, ?5, 'draft', ?6, ?7, ?8, ?9)",
            params![
                manual_id, project_id, clean_title, template_id, source_locale,
                summary, serde_json::to_string(&prereqs)?, now, now
            ],
        )?;

        let mut steps = Vec::new();
        for (idx, (sec_en, body_en, sec_ja, body_ja, sec_fil, body_fil)) in sections.iter().enumerate() {
            let order_index = (idx + 1) as i32;
            let step_id = format!("step_{}_{:02}", &manual_id[4..10], order_index);
            let ev_ref = format!("tpl_{}_{:02}", template_id, order_index);
            conn.execute(
                "INSERT INTO workflow_steps (id, manual_id, session_id, section_title, order_index, action_type, event_refs_json, screenshot_refs_json, review_status, uncertainty_notes_json, prompt_version, model_id, schema_version)
                 VALUES (?1, ?2, NULL, ?3, ?4, 'navigation', ?5, '[]', 'draft', '[]', 'template-v1', 'mmi-template', 1)",
                params![step_id, manual_id, sec_en, order_index, serde_json::to_string(&vec![ev_ref.clone()])?],
            )?;
            let mut variant_map = serde_json::Map::new();
            for (loc, t, b) in [
                ("en-US", *sec_en, *body_en),
                ("ja-JP", *sec_ja, *body_ja),
                ("fil-PH", *sec_fil, *body_fil),
            ] {
                let var_id = format!("var_{}_{}", step_id, loc);
                conn.execute(
                    "INSERT INTO content_variants (id, step_id, locale, title, body, callouts_json, source_variant_id, review_status, outdated)
                     VALUES (?1, ?2, ?3, ?4, ?5, '[]', NULL, 'draft', 0)",
                    params![var_id, step_id, loc, t, b],
                )?;
                variant_map.insert(
                    loc.to_string(),
                    serde_json::to_value(ContentVariant {
                        id: var_id,
                        step_id: step_id.clone(),
                        locale: loc.to_string(),
                        title: t.to_string(),
                        body: b.to_string(),
                        callouts: Vec::new(),
                        source_variant_id: None,
                        review_status: "draft".to_string(),
                        outdated: false,
                    })?,
                );
            }
            steps.push(WorkflowStep {
                id: step_id,
                manual_id: manual_id.clone(),
                session_id: None,
                section_title: sec_en.to_string(),
                order_index,
                action_type: "navigation".to_string(),
                event_refs: vec![ev_ref],
                screenshot_refs: Vec::new(),
                review_status: "draft".to_string(),
                uncertainty_notes: Vec::new(),
                prompt_version: "template-v1".to_string(),
                model_id: "mmi-template".to_string(),
                variants: variant_map,
                annotations: Vec::new(),
                schema_version: 1,
            });
        }

        Ok(Manual {
            id: manual_id,
            project_id: project_id.to_string(),
            session_id: None,
            title: clean_title,
            template_id: template_id.to_string(),
            source_locale: source_locale.to_string(),
            lifecycle_state: "draft".to_string(),
            summary: summary.to_string(),
            prerequisites: prereqs.into_iter().map(str::to_string).collect(),
            steps,
            created_at: now.clone(),
            updated_at: now,
        })
    }
}

type SectionSpec = (&'static str, &'static str, &'static str, &'static str, &'static str, &'static str);

fn template_blueprint(template_id: &str) -> (Vec<SectionSpec>, &'static str, Vec<&'static str>) {
    match template_id {
        "user_guide" => (
            vec![
                ("Overview & Workspace Navigation", "Open the application and locate the primary toolbar and navigation rail.", "概要と画面構成", "アプリを起動し、ツールバーとナビゲーションを確認します。", "Pangkalahatang-ideya at Nabigasyon", "Buksan ang app at hanapin ang pangunahing toolbar."),
                ("Core Task Walkthrough", "Complete the primary action and confirm visible status feedback.", "基本操作の手順", "主要な操作を実行し、画面上の完了表示を確認します。", "Pangunahing Hakbang", "Isagawa ang pangunahing aksyon at kumpirmahin ang resulta."),
            ],
            "Software User Guide structured for clear day-to-day navigation.",
            vec!["Valid user account", "Supported desktop browser or client"],
        ),
        "internal_system" => (
            vec![
                ("System Access & Security", "Sign in via internal SSO and verify role permissions.", "システム接続とセキュリティ", "社内SSOでログインし、権限を確認します。", "Access at Seguridad ng Sistema", "Mag-sign in gamit ang internal SSO at suriin ang pahintulot."),
                ("Operational Execution & Audit", "Execute the internal update and verify audit trail entry.", "業務処理と監査ログ確認", "社内処理を実行し、監査ログに記録されたことを確認します。", "Operasyon at Audit", "Isagawa ang update at tiyaking naitala sa audit log."),
            ],
            "Internal System Instructions aligned with MMI security controls.",
            vec!["Internal VPN or corporate network", "Approved operator role"],
        ),
        "onboarding" => (
            vec![
                ("Day-1 Environment Setup", "Verify workstation access, language defaults, and key bookmarks.", "初日セットアップ", "端末アクセス、言語設定、主要ブックマークを確認します。", "Pag-setup sa Unang Araw", "Suriin ang workstation access, wika, at mahahalagang link."),
                ("First Guided Workflow", "Shadow and complete one approved sample task with your mentor.", "初回業務ワークフロー", "メンターと一緒に承認済みサンプル業務を1件完了します。", "Unang Gabay na Workflow", "Kumpletuhin ang isang aprubadong sample task kasama ang mentor."),
            ],
            "Employee Onboarding Guide for new MMI team members.",
            vec!["Assigned MMI workstation", "Onboarding mentor contact"],
        ),
        "troubleshooting" => (
            vec![
                ("Observed Symptom & Triage", "Capture the exact error code and verify network/service state.", "発生事象と一次切り分け", "エラーコードを記録し、接続・サービス状態を確認します。", "Sintomas at Pagsusuri", "Itala ang eksaktong error code at suriin ang estado ng serbisyo."),
                ("Resolution & Rollback", "Apply the verified fix and confirm clean recovery.", "復旧手順とロールバック", "承認済みの復旧手順を実行し、正常復帰を確認します。", "Solusyon at Pagbabalik", "Ilapat ang beripikadong ayos at kumpirmahin ang pagbabalik."),
            ],
            "Troubleshooting Guide for repeatable incident resolution.",
            vec!["Error screenshot or correlation ID", "Diagnostic access"],
        ),
        "technical" => (
            vec![
                ("Environment & Preconditions", "Confirm runtime versions, config variables, and backup hash.", "実行環境と前提条件", "ランタイムバージョン、設定値、バックアップハッシュを確認します。", "Kapaligiran at Kinakailangan", "Kumpirmahin ang bersyon ng runtime at backup hash."),
                ("Execution & Validation", "Run the technical procedure and verify deterministic output.", "実行と検証", "技術手順を実行し、期待通りの出力を検証します。", "Pagpapatupad at Beripikasyon", "Patakbuhin ang pamamaraan at beripikahin ang output."),
            ],
            "Technical Procedure with deterministic verification gates.",
            vec!["Local backup verified", "CLI or admin privileges"],
        ),
        "administrative" => (
            vec![
                ("Policy & Approval Check", "Confirm required departmental sign-off before submitting forms.", "規程・承認要件の確認", "申請前に必要な部門承認を確認します。", "Patakaran at Pag-apruba", "Kumpirmahin ang kinakailangang lagda bago isumite."),
                ("Form Filing & Retention", "Submit the finalized record and archive under retention rules.", "申請登録と保管", "確定データを送信し、保管ルールに従いアーカイブします。", "Paghahain at Pag-iingat", "Isumite ang rekord at i-archive ayon sa patakaran."),
            ],
            "Administrative Workflow for compliant office operations.",
            vec!["Policy reference number", "Approver designation"],
        ),
        _ => (
            vec![
                ("Purpose & Prerequisites", "Confirm required permissions and source data before beginning.", "目的と前提条件", "作業開始前に必要な権限と対象データを確認します。", "Layunin at Mga Kinakailangan", "Kumpirmahin ang pahintulot at datos bago magsimula."),
                ("Standard Operating Procedure", "Execute each verified step in sequence and confirm expected outcome.", "標準作業手順", "承認済みの手順を順番に実行し、結果を確認します。", "Karaniwang Pamamaraan (SOP)", "Sundin ang bawat beripikadong hakbang at suriin ang resulta."),
            ],
            "Standard Operating Procedure (SOP) with traceable human sign-off.",
            vec!["Authorized application credentials", "Reviewed checklist"],
        ),
    }
}
