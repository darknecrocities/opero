use axum::{
    extract::{Path, State},
    routing::{delete, get, post},
    Json, Router,
};
use opero_core::agent::{delete_agent_thread, list_agent_threads, run_agent_turn};
use opero_core::error::OperoError;
use opero_core::meeting_audio::probe_audio_capabilities;
use opero_core::meeting_notes::{
    compile_meeting_to_manual, get_meeting_note, list_meeting_notes, start_meeting_recording,
    stop_and_compile_meeting,
};
use opero_core::ollama_runtime::{check_ollama_status, ensure_ollama_runtime};
use opero_export::writers::export_manual_artifact;
use serde::Deserialize;
use std::sync::Arc;
use tower_http::limit::RequestBodyLimitLayer;

use crate::{ApiError, AppState};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentChatReq {
    thread_id: Option<String>,
    prompt: String,
    locale: Option<String>,
    preferred_model: Option<String>,
}

async fn list_threads(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let threads = list_agent_threads(&state.store)?;
    Ok(Json(serde_json::json!({ "threads": threads })))
}

async fn chat_turn(
    State(state): State<Arc<AppState>>,
    Json(req): Json<AgentChatReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if req.prompt.trim().is_empty() {
        return Err(ApiError(OperoError::Validation("Prompt cannot be empty.".to_string())));
    }
    let locale = req.locale.unwrap_or_else(|| "en-US".to_string());
    let resp = run_agent_turn(
        &state.store,
        req.thread_id.as_deref(),
        &req.prompt,
        &locale,
        req.preferred_model.as_deref(),
    )?;
    Ok(Json(serde_json::json!(resp)))
}

async fn remove_thread(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    delete_agent_thread(&state.store, &id)?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

async fn audio_capabilities(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let caps = probe_audio_capabilities(&state.store.data_dir);
    Ok(Json(serde_json::json!({ "capabilities": caps })))
}

async fn list_meetings(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let meetings = list_meeting_notes(&state.store)?;
    Ok(Json(serde_json::json!({ "meetings": meetings })))
}

async fn get_meeting(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let meeting = get_meeting_note(&state.store, &id)?
        .ok_or_else(|| ApiError(OperoError::NotFound(format!("Meeting {id} not found"))))?;
    Ok(Json(serde_json::json!({ "meeting": meeting })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartMeetingReq {
    title: Option<String>,
    audio_source: Option<String>,
    source_locale: Option<String>,
    target_locale: Option<String>,
}

async fn start_meeting(
    State(state): State<Arc<AppState>>,
    Json(req): Json<StartMeetingReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let meeting = start_meeting_recording(
        &state.store,
        req.title.as_deref().unwrap_or("Meeting Notes"),
        req.audio_source.as_deref().unwrap_or("system_and_mic"),
        req.source_locale.as_deref().unwrap_or("en-US"),
        req.target_locale.as_deref().unwrap_or("ja-JP"),
    )?;
    Ok(Json(serde_json::json!({ "meeting": meeting })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StopCompileMeetingReq {
    transcript_override: Option<String>,
    preferred_model: Option<String>,
}

async fn stop_compile_meeting(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<StopCompileMeetingReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let meeting = stop_and_compile_meeting(
        &state.store,
        &id,
        req.transcript_override.as_deref(),
        req.preferred_model.as_deref(),
    )?;
    Ok(Json(serde_json::json!({ "meeting": meeting })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportMeetingReq {
    project_id: Option<String>,
    export_format: Option<String>,
}

async fn export_meeting(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<ExportMeetingReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let project_id = if let Some(pid) = req.project_id {
        pid
    } else {
        state
            .store
            .list_projects(false)?
            .first()
            .map(|p| p.id.clone())
            .unwrap_or_else(|| "proj_default".to_string())
    };
    let manual = compile_meeting_to_manual(&state.store, &id, &project_id)?;
    let artifact = if let Some(fmt) = req.export_format.as_deref() {
        let out_dir = state.store.data_dir.join("exports");
        let art = export_manual_artifact(&manual, fmt, &manual.source_locale, &out_dir, &state.store.data_dir)?;
        Some(art)
    } else {
        None
    };
    Ok(Json(serde_json::json!({ "manual": manual, "artifact": artifact })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnsureRuntimeReq {
    model_tag: Option<String>,
    pull_if_missing: Option<bool>,
}

async fn get_runtime_status() -> Result<Json<serde_json::Value>, ApiError> {
    let status = check_ollama_status(Some("qwen3:1.7b"));
    Ok(Json(serde_json::json!({ "runtime": status })))
}

async fn post_ensure_runtime(
    State(state): State<Arc<AppState>>,
    Json(req): Json<EnsureRuntimeReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let status = ensure_ollama_runtime(
        &state.store.data_dir,
        req.model_tag.as_deref(),
        req.pull_if_missing.unwrap_or(true),
    );
    Ok(Json(serde_json::json!({ "runtime": status })))
}

pub(crate) fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/v1/models/runtime-status", get(get_runtime_status))
        .route("/api/v1/models/ensure-runtime", post(post_ensure_runtime))
        .route("/api/v1/agent/threads", get(list_threads))
        .route("/api/v1/agent/chat", post(chat_turn))
        .route("/api/v1/agent/threads/{id}", delete(remove_thread))
        .route("/api/v1/meetings/capabilities", get(audio_capabilities))
        .route("/api/v1/meetings", get(list_meetings))
        .route("/api/v1/meetings/start", post(start_meeting))
        .route("/api/v1/meetings/{id}", get(get_meeting))
        .route("/api/v1/meetings/{id}/stop-compile", post(stop_compile_meeting))
        .route("/api/v1/meetings/{id}/export", post(export_meeting))
        .layer(RequestBodyLimitLayer::new(1024 * 1024 * 2))
        .with_state(state)
}
