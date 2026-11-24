use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use opero_core::doc_analyzer::{analyze_document_bytes, explain_cropped_region, DocumentAnnotation};
use opero_core::error::OperoError;
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

    let doc = analyze_document_bytes(
        &req.filename,
        &bytes,
        req.locale.as_deref().unwrap_or("en-US"),
        req.preferred_model.as_deref(),
    )?;
    state.store.save_analyzed_document(&doc)?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "document": doc }))))
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
    let explanation = explain_cropped_region(
        &req.excerpt,
        req.context_title.as_deref().unwrap_or("Selected Region"),
        req.kind.as_deref().unwrap_or("crop"),
        req.locale.as_deref().unwrap_or("en-US"),
        req.preferred_model.as_deref(),
    );
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

pub(crate) fn router(state: Arc<AppState>) -> Router {
    let ingest_route = Router::new()
        .route("/api/v1/analyzer/ingest", post(ingest_document))
        .layer(RequestBodyLimitLayer::new(1024 * 1024 * 8))
        .with_state(state.clone());

    Router::new()
        .route("/api/v1/analyzer/documents", get(list_documents))
        .route("/api/v1/analyzer/explain-region", post(explain_region))
        .route("/api/v1/analyzer/documents/{id}/annotations", put(save_annotations))
        .route("/api/v1/analyzer/documents/{id}/report", post(compile_report))
        .with_state(state)
        .merge(ingest_route)
}
