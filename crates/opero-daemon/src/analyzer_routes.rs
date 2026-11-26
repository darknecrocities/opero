use axum::{
    extract::{Path, State},
    http::{header, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use opero_core::doc_analyzer::{
    analyze_document_bytes, explain_cropped_region, summarize_text_with_ollama, DocumentAnnotation,
};
use opero_core::doc_analyzer_llm::ask_about_document;
use opero_core::error::OperoError;
use opero_core::hardware::{inspect_hardware_profile, pull_curated_ollama_model};
use opero_core::memory::dual_core::get_memory_stats;
use opero_core::memory::mmi_knowledge::seed_mmi_public_knowledge;
use opero_export::writers::export_manual_artifact;
use serde::Deserialize;
use std::sync::Arc;
use tower_http::limit::RequestBodyLimitLayer;

use crate::{ApiError, AppState};

async fn list_documents(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let documents = state.store.list_analyzed_documents()?;
    Ok(Json(serde_json::json!({ "documents": documents })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct IngestDocReq {
    filename: String,
    content_base64: Option<String>,
    raw_text: Option<String>,
    locale: Option<String>,
    preferred_model: Option<String>,
}

async fn ingest_document(
    State(state): State<Arc<AppState>>,
    Json(req): Json<IngestDocReq>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let bytes = if let Some(b64) = req.content_base64 {
        B64.decode(b64.trim())
            .map_err(|e| OperoError::Validation(format!("Invalid base64 document payload: {e}")))?
    } else if let Some(txt) = req.raw_text {
        txt.into_bytes()
    } else {
        return Err(ApiError(OperoError::Validation(
            "Provide either contentBase64 or rawText.".to_string(),
        )));
    };

    let filename = req.filename.clone();
    let locale = req.locale.unwrap_or_else(|| "en-US".to_string());
    let preferred = req.preferred_model.clone();
    let bytes_for_parse = bytes.clone();
    let doc = tokio::task::spawn_blocking(move || {
        analyze_document_bytes(&filename, &bytes_for_parse, &locale, preferred.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Document analysis task failed: {e}"))))??;

    // Persist original file bytes for visual PDF/document preview
    let docs_dir = state.store.data_dir.join("documents");
    let _ = std::fs::create_dir_all(&docs_dir);
    let ext = match doc.file_format.as_str() {
        "pdf" => "pdf",
        "docx" => "docx",
        "doc" => "doc",
        "markdown" => "md",
        _ => "txt",
    };
    let _ = std::fs::write(docs_dir.join(format!("{}.{ext}", doc.id)), &bytes);

    state.store.save_analyzed_document(&doc)?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "document": doc }))))
}

async fn get_document_file(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Response {
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return ApiError(OperoError::Validation("Invalid document ID.".to_string())).into_response();
    }
    let docs_dir = state.store.data_dir.join("documents");
    for (ext, mime) in [
        ("pdf", "application/pdf"),
        ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("md", "text/markdown; charset=utf-8"),
        ("txt", "text/plain; charset=utf-8"),
    ] {
        let p = docs_dir.join(format!("{id}.{ext}"));
        if let Ok(bytes) = std::fs::read(&p) {
            return (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, HeaderValue::from_static(mime)),
                    (header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff")),
                    (header::CACHE_CONTROL, HeaderValue::from_static("private, max-age=300")),
                ],
                bytes,
            )
                .into_response();
        }
    }
    ApiError(OperoError::NotFound(format!("Stored file for document {id} not found."))).into_response()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExplainRegionReq {
    excerpt: String,
    context_title: Option<String>,
    kind: Option<String>,
    locale: Option<String>,
    preferred_model: Option<String>,
}

async fn explain_region(Json(req): Json<ExplainRegionReq>) -> Result<Json<serde_json::Value>, ApiError> {
    if req.excerpt.trim().is_empty() {
        return Err(ApiError(OperoError::Validation("Selected excerpt cannot be empty.".to_string())));
    }
    let excerpt = req.excerpt;
    let context_title = req.context_title.unwrap_or_else(|| "Selected Region".to_string());
    let kind = req.kind.unwrap_or_else(|| "crop".to_string());
    let locale = req.locale.unwrap_or_else(|| "en-US".to_string());
    let preferred = req.preferred_model;
    let explanation = tokio::task::spawn_blocking(move || {
        explain_cropped_region(&excerpt, &context_title, &kind, &locale, preferred.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Explain region task failed: {e}"))))?;
    Ok(Json(serde_json::json!({ "explanation": explanation })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateAnnotationsReq {
    annotations: Vec<DocumentAnnotation>,
}

async fn save_annotations(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateAnnotationsReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let document = state.store.update_analyzed_annotations(&id, req.annotations)?;
    Ok(Json(serde_json::json!({ "document": document })))
}

async fn delete_document(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return Err(ApiError(OperoError::Validation("Invalid document ID.".to_string())));
    }
    let deleted = state.store.delete_analyzed_document(&id)?;
    Ok(Json(serde_json::json!({ "deleted": deleted })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReanalyzeDocReq {
    locale: Option<String>,
    preferred_model: Option<String>,
}

async fn reanalyze_document(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<ReanalyzeDocReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let mut doc = state.store.get_analyzed_document(&id)?;
    let full_text = doc.blocks.iter().map(|b| b.text.as_str()).collect::<Vec<_>>().join("\n");
    let locale = req.locale.unwrap_or_else(|| "en-US".to_string());
    let pref = req.preferred_model.clone();
    let res = tokio::task::spawn_blocking(move || {
        summarize_text_with_ollama(&full_text, &locale, pref.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Reanalyze task failed: {e}"))))?;

    if let Some((engine, summary, findings)) = res {
        doc.engine_used = engine;
        doc.executive_summary = summary;
        if !findings.is_empty() {
            doc.key_findings = findings;
        }
        state.store.save_analyzed_document(&doc)?;
    }
    Ok(Json(serde_json::json!({ "document": doc })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AskDocumentReq {
    question: String,
    locale: Option<String>,
    preferred_model: Option<String>,
}

async fn ask_document(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<AskDocumentReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if req.question.trim().is_empty() {
        return Err(ApiError(OperoError::Validation("Question cannot be empty.".to_string())));
    }
    let doc = state.store.get_analyzed_document(&id)?;
    let full_text = doc.blocks.iter().map(|b| b.text.as_str()).collect::<Vec<_>>().join("\n");
    let filename = doc.filename.clone();
    let question = req.question.trim().to_string();
    let locale = req.locale.unwrap_or_else(|| "en-US".to_string());
    let pref = req.preferred_model.clone();
    let (answer, engine_used) = tokio::task::spawn_blocking(move || {
        ask_about_document(&filename, &full_text, &question, &locale, pref.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Document Q&A task failed: {e}"))))?;

    Ok(Json(serde_json::json!({ "answer": answer, "engineUsed": engine_used })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompileReportReq {
    project_id: Option<String>,
    locale: Option<String>,
    export_format: Option<String>,
}

async fn compile_report(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CompileReportReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let project_id = match req.project_id {
        Some(pid) if !pid.trim().is_empty() => pid,
        _ => {
            let projects = state.store.list_projects(false)?;
            if let Some(first) = projects.first() {
                first.id.clone()
            } else {
                state
                    .store
                    .create_project("OPERO Workspace", "MMI Operator", "Operations", "en-US")?
                    .id
            }
        }
    };
    let locale = req.locale.as_deref().unwrap_or("en-US");
    let manual = state.store.compile_analyzed_report_manual(&project_id, &id, locale)?;
    let artifact = if let Some(fmt) = req.export_format.as_deref() {
        let exports_dir = state.store.data_dir.join("exports");
        Some(export_manual_artifact(&manual, fmt, locale, &exports_dir, &state.store.data_dir)?)
    } else {
        None
    };
    Ok(Json(serde_json::json!({ "manual": manual, "artifact": artifact })))
}

async fn get_hardware() -> Json<serde_json::Value> {
    let hardware = inspect_hardware_profile();
    Json(serde_json::json!({ "hardware": hardware }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PullModelReq {
    model_tag: String,
}

async fn pull_model(Json(req): Json<PullModelReq>) -> Result<Json<serde_json::Value>, ApiError> {
    let tag = req.model_tag.clone();
    let hardware = tokio::task::spawn_blocking(move || pull_curated_ollama_model(&tag))
        .await
        .map_err(|e| ApiError(OperoError::Validation(format!("Model download task failed: {e}"))))??;
    Ok(Json(serde_json::json!({ "hardware": hardware })))
}

async fn seed_mmi_memory(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let conn = state.store.conn()?;
    let inserted = seed_mmi_public_knowledge(&conn)?;
    let stats = get_memory_stats(&conn)?;
    Ok(Json(serde_json::json!({ "inserted": inserted, "stats": stats })))
}

pub(crate) fn router(state: Arc<AppState>) -> Router {
    let ingest_route = Router::new()
        .route("/api/v1/analyzer/ingest", post(ingest_document))
        .layer(RequestBodyLimitLayer::new(1024 * 1024 * 8))
        .with_state(state.clone());

    Router::new()
        .route("/api/v1/system/hardware", get(get_hardware))
        .route("/api/v1/models/pull", post(pull_model))
        .route("/api/v1/memory/seed-mmi", post(seed_mmi_memory))
        .route("/api/v1/analyzer/documents", get(list_documents))
        .route("/api/v1/analyzer/documents/{id}", delete(delete_document))
        .route("/api/v1/analyzer/documents/{id}/file", get(get_document_file))
        .route("/api/v1/analyzer/documents/{id}/reanalyze", post(reanalyze_document))
        .route("/api/v1/analyzer/documents/{id}/ask", post(ask_document))
        .route("/api/v1/analyzer/explain-region", post(explain_region))
        .route("/api/v1/analyzer/documents/{id}/annotations", put(save_annotations))
        .route("/api/v1/analyzer/documents/{id}/report", post(compile_report))
        .with_state(state)
        .merge(ingest_route)
}
