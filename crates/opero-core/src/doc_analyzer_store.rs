use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::OperoStore;
use crate::doc_analyzer::{AnalyzedDocument, DocumentAnnotation};
use crate::error::{OperoError, OperoResult};
use crate::models::{ContentVariant, Manual, WorkflowStep};

impl OperoStore {
    pub fn save_analyzed_document(&self, doc: &AnalyzedDocument) -> OperoResult<()> {
        let conn = self.conn()?;
        let json = serde_json::to_string(doc)?;
        conn.execute(
            "INSERT INTO analyzed_documents (id, filename, file_format, byte_size, sha256, engine_used, document_json, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO UPDATE SET document_json = excluded.document_json, updated_at = excluded.updated_at",
            params![
                doc.id,
                doc.filename,
                doc.file_format,
                doc.byte_size as i64,
                doc.sha256,
                doc.engine_used,
                json,
                doc.created_at,
                doc.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn list_analyzed_documents(&self) -> OperoResult<Vec<AnalyzedDocument>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare("SELECT document_json FROM analyzed_documents ORDER BY updated_at DESC LIMIT 30")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        let mut out = Vec::new();
        for row in rows {
            if let Ok(doc) = serde_json::from_str::<AnalyzedDocument>(&row?) {
                out.push(doc);
            }
        }
        Ok(out)
    }

    pub fn get_analyzed_document(&self, id: &str) -> OperoResult<AnalyzedDocument> {
        let conn = self.conn()?;
        let json: String = conn
            .query_row("SELECT document_json FROM analyzed_documents WHERE id = ?1", params![id], |r| r.get(0))
            .map_err(|_| OperoError::NotFound(format!("Analyzed document not found: {id}")))?;
        Ok(serde_json::from_str(&json)?)
    }

    pub fn update_analyzed_annotations(&self, id: &str, annotations: Vec<DocumentAnnotation>) -> OperoResult<AnalyzedDocument> {
        let mut doc = self.get_analyzed_document(id)?;
        doc.annotations = annotations;
        doc.updated_at = Utc::now().to_rfc3339();
        self.save_analyzed_document(&doc)?;
        Ok(doc)
    }

    pub fn delete_analyzed_document(&self, id: &str) -> OperoResult<bool> {
        let conn = self.conn()?;
        let removed = conn.execute("DELETE FROM analyzed_documents WHERE id = ?1", params![id])?;
        let docs_dir = self.data_dir.join("documents");
        for ext in ["pdf", "docx", "doc", "md", "txt"] {
            let _ = std::fs::remove_file(docs_dir.join(format!("{id}.{ext}")));
        }
        Ok(removed > 0)
    }

    pub fn compile_analyzed_report_manual(&self, project_id: &str, doc_id: &str, locale: &str) -> OperoResult<Manual> {
        let doc = self.get_analyzed_document(doc_id)?;
        let manual_id = format!("man_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let title = format!("Analysis Report: {}", doc.filename);

        let mut steps = Vec::new();
        for (idx, ann) in doc.annotations.iter().enumerate() {
            let order = (idx + 1) as i32;
            let step_id = format!("step_{}_{:02}", &manual_id[4..10], order);
            let body = format!(
                "[{} · {}] {}\n\nReasoning: {}\n\nExcerpt: \"{}\"{}",
                ann.kind.to_uppercase(),
                ann.severity.to_uppercase(),
                ann.explanation,
                ann.reasoning,
                ann.excerpt,
                ann.suggested_fix
                    .as_ref()
                    .map(|f| format!("\n\nRecommendation: {f}"))
                    .unwrap_or_default()
            );
            let mut variant_map = serde_json::Map::new();
            for loc in ["en-US", "ja-JP", "fil-PH"] {
                variant_map.insert(
                    loc.to_string(),
                    serde_json::to_value(ContentVariant {
                        id: format!("var_{}_{}", step_id, loc),
                        step_id: step_id.clone(),
                        locale: loc.to_string(),
                        title: format!("{}. {}", ann.number, ann.title),
                        body: body.clone(),
                        callouts: Vec::new(),
                        source_variant_id: None,
                        review_status: "verified".to_string(),
                        outdated: false,
                    })?,
                );
            }
            steps.push(WorkflowStep {
                id: step_id,
                manual_id: manual_id.clone(),
                session_id: None,
                section_title: ann.title.clone(),
                order_index: order,
                action_type: "confirmation".to_string(),
                event_refs: vec![ann.id.clone()],
                screenshot_refs: Vec::new(),
                review_status: "verified".to_string(),
                uncertainty_notes: Vec::new(),
                prompt_version: "doc-analyzer-v1".to_string(),
                model_id: doc.engine_used.clone(),
                variants: variant_map,
                annotations: Vec::new(),
                schema_version: 1,
            });
        }

        Ok(Manual {
            id: manual_id,
            project_id: project_id.to_string(),
            session_id: None,
            title,
            template_id: "technical".to_string(),
            source_locale: locale.to_string(),
            lifecycle_state: "draft".to_string(),
            summary: doc.executive_summary,
            prerequisites: doc.key_findings,
            steps,
            created_at: now.clone(),
            updated_at: now,
        })
    }
}
