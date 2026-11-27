use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::OperoStore;
use crate::doc_analyzer::{AnalyzedDocument, DocumentAnnotation};
use crate::doc_analyzer_report::{build_eight_structured_sections, ReportBuildInput};
use crate::error::{OperoError, OperoResult};
use crate::memory::dual_core::{delete_memory_chunks_by_source, upsert_memory_chunk};
use crate::models::{ContentVariant, Manual, WorkflowStep};

pub const ANALYZED_DOC_RAG_SOURCE: &str = "analyzed_document";

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

    pub fn sync_analyzed_document_to_rag(&self, doc: &AnalyzedDocument) -> OperoResult<usize> {
        let conn = self.conn()?;
        let _ = delete_memory_chunks_by_source(&conn, ANALYZED_DOC_RAG_SOURCE, &doc.id)?;
        let locale = doc
            .translation_target_locale
            .as_deref()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| {
                if doc.source_language.is_empty() {
                    "en-US"
                } else {
                    doc.source_language.as_str()
                }
            });

        let mut indexed = 0usize;
        let overview_body = format!(
            "{}\n\nKey Findings:\n{}",
            doc.executive_summary,
            doc.key_findings
                .iter()
                .map(|f| format!("- {f}"))
                .collect::<Vec<_>>()
                .join("\n")
        );
        upsert_memory_chunk(
            &conn,
            "episodic",
            None,
            ANALYZED_DOC_RAG_SOURCE,
            &doc.id,
            locale,
            &format!("Document: {} ({})", doc.filename, doc.document_type),
            &overview_body,
            false,
        )?;
        indexed += 1;

        if !doc.translated_blocks.is_empty() {
            let tr_body = doc
                .translated_blocks
                .iter()
                .take(8)
                .map(|b| format!("{}\n=> {}", b.source_text, b.translated_text))
                .collect::<Vec<_>>()
                .join("\n\n");
            upsert_memory_chunk(
                &conn,
                "episodic",
                None,
                ANALYZED_DOC_RAG_SOURCE,
                &doc.id,
                locale,
                &format!("Translation: {}", doc.filename),
                &tr_body,
                false,
            )?;
            indexed += 1;
        }

        if !doc.annotations.is_empty() {
            let ann_body = doc
                .annotations
                .iter()
                .take(12)
                .map(|a| format!("#{} [{}] {}: {} ({})", a.number, a.kind, a.title, a.explanation, a.reasoning))
                .collect::<Vec<_>>()
                .join("\n");
            upsert_memory_chunk(
                &conn,
                "episodic",
                None,
                ANALYZED_DOC_RAG_SOURCE,
                &doc.id,
                locale,
                &format!("Annotations: {}", doc.filename),
                &ann_body,
                false,
            )?;
            indexed += 1;
        }

        let raw_excerpt: String = doc
            .blocks
            .iter()
            .map(|b| b.text.as_str())
            .collect::<Vec<_>>()
            .join("\n")
            .chars()
            .take(2400)
            .collect();
        if !raw_excerpt.trim().is_empty() {
            upsert_memory_chunk(
                &conn,
                "episodic",
                None,
                ANALYZED_DOC_RAG_SOURCE,
                &doc.id,
                locale,
                &format!("Content Excerpt: {}", doc.filename),
                &raw_excerpt,
                false,
            )?;
            indexed += 1;
        }

        Ok(indexed)
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
        let target = doc.translation_target_locale.as_deref().unwrap_or("en-US");
        let src_lang = if doc.source_language.is_empty() { "en-US" } else { doc.source_language.as_str() };
        doc.structured_sections = build_eight_structured_sections(&ReportBuildInput {
            filename: &doc.filename,
            file_format: &doc.file_format,
            document_type: &doc.document_type,
            source_language: src_lang,
            target_locale: target,
            word_count: doc.word_count,
            completeness_score: doc.completeness_score,
            engine_used: &doc.engine_used,
            executive_summary: &doc.executive_summary,
            key_findings: &doc.key_findings,
            blocks: &doc.blocks,
            annotations: &doc.annotations,
            translated_summary: doc.translated_summary.as_deref(),
            translated_blocks: &doc.translated_blocks,
        });
        doc.rag_indexed = true;
        doc.updated_at = Utc::now().to_rfc3339();
        self.save_analyzed_document(&doc)?;
        let _ = self.sync_analyzed_document_to_rag(&doc)?;
        Ok(doc)
    }

    pub fn delete_analyzed_document(&self, id: &str) -> OperoResult<(bool, usize)> {
        let conn = self.conn()?;
        let removed_rag = delete_memory_chunks_by_source(&conn, ANALYZED_DOC_RAG_SOURCE, id)?;
        let removed = conn.execute("DELETE FROM analyzed_documents WHERE id = ?1", params![id])?;
        let docs_dir = self.data_dir.join("documents");
        for ext in ["pdf", "docx", "doc", "md", "txt"] {
            let _ = std::fs::remove_file(docs_dir.join(format!("{id}.{ext}")));
        }
        Ok((removed > 0, removed_rag))
    }

    pub fn compile_analyzed_report_manual(&self, project_id: &str, doc_id: &str, locale: &str) -> OperoResult<Manual> {
        let doc = self.get_analyzed_document(doc_id)?;
        let manual_id = format!("man_{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let title = format!("Analysis Report: {}", doc.filename);

        let mut steps = Vec::new();
        for sec in &doc.structured_sections {
            let order = (steps.len() + 1) as i32;
            let step_id = format!("step_{}_{:02}", &manual_id[4..10], order);
            let body = format!(
                "{}\n\n{}",
                sec.summary,
                sec.items.iter().map(|i| format!("- {i}")).collect::<Vec<_>>().join("\n")
            );
            let mut variant_map = serde_json::Map::new();
            for loc in ["en-US", "ja-JP", "fil-PH"] {
                variant_map.insert(
                    loc.to_string(),
                    serde_json::to_value(ContentVariant {
                        id: format!("var_{}_{}", step_id, loc),
                        step_id: step_id.clone(),
                        locale: loc.to_string(),
                        title: format!("{:02}. {}", sec.number, sec.title),
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
                section_title: sec.title.clone(),
                order_index: order,
                action_type: "confirmation".to_string(),
                event_refs: vec![sec.id.clone()],
                screenshot_refs: Vec::new(),
                review_status: "verified".to_string(),
                uncertainty_notes: Vec::new(),
                prompt_version: "doc-analyzer-v2".to_string(),
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::doc_analyzer::analyze_document_bytes;
    use crate::memory::dual_core::query_dual_core_memory;
    use tempfile::tempdir;

    #[test]
    fn test_analyzer_auto_translate_8_sections_rag_sync_and_cascade_delete() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let ja_doc = "システム運用手順書\n1. 新規登録の手順\n管理画面で「新規登録」ボタンをクリックし、顧客名を入力してください。\n追加おすすめ：研修区分（XYZZY9988）を記入してください。\n| 項目 | 内容 |\n| 担当者 | |\n";
        let mut doc = analyze_document_bytes("ops_manual_ja.txt", ja_doc.as_bytes(), "en-US", Some("offline")).unwrap();
        assert_eq!(doc.source_language, "ja-JP");
        assert_eq!(doc.translation_target_locale.as_deref(), Some("en-US"));
        assert!(!doc.translated_blocks.is_empty());
        assert_eq!(doc.structured_sections.len(), 8);

        doc.rag_indexed = true;
        store.save_analyzed_document(&doc).unwrap();
        let indexed = store.sync_analyzed_document_to_rag(&doc).unwrap();
        assert!(indexed >= 2);

        // Pero Agent RAG must retrieve the synced document
        let conn = store.conn().unwrap();
        let hits = query_dual_core_memory(&conn, "XYZZY9988 ops_manual_ja", Some("en-US"), 5).unwrap();
        assert!(hits.iter().any(|h| h.chunk.source_id == doc.id));
        drop(conn);

        // Deleting from Document Analyzer MUST purge all chunks from Pero Agent RAG
        let (deleted, removed_rag) = store.delete_analyzed_document(&doc.id).unwrap();
        assert!(deleted);
        assert_eq!(removed_rag, indexed);

        let conn2 = store.conn().unwrap();
        let after_hits = query_dual_core_memory(&conn2, "XYZZY9988", Some("en-US"), 5).unwrap();
        assert!(after_hits.iter().all(|h| h.chunk.source_id != doc.id && !h.chunk.content.contains("XYZZY9988")));
    }
}
