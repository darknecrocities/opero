use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post},
    Json, Router,
};
use opero_core::agent::{delete_agent_thread, list_agent_threads, run_agent_turn};
use opero_core::agent_actions::{
    approve_and_execute_action, cancel_pending_action, get_agent_settings, save_agent_settings,
    AgentCapabilitiesSettings,
};
use opero_core::error::OperoError;
use opero_core::meeting_audio::probe_audio_capabilities;
use opero_core::meeting_notes::{
    compile_meeting_to_manual, get_meeting_note, list_meeting_notes, start_meeting_recording,
    stop_and_compile_meeting,
};
use opero_core::ollama_runtime::{
    check_ollama_status_with_data_dir, ensure_ollama_ready_for_inference, ensure_ollama_runtime,
};
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
    let thread_id = req.thread_id;
    let prompt = req.prompt;
    let preferred = req.preferred_model;
    let st = Arc::clone(&state);
    let resp = tokio::task::spawn_blocking(move || {
        run_agent_turn(
            &st.store,
            thread_id.as_deref(),
            &prompt,
            &locale,
            preferred.as_deref(),
        )
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Agent chat task failed: {e}"))))??;
    Ok(Json(serde_json::json!(resp)))
}

async fn remove_thread(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    delete_agent_thread(&state.store, &id)?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

async fn fetch_agent_settings(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let settings = get_agent_settings(&state.store)?;
    Ok(Json(serde_json::json!({ "settings": settings })))
}

async fn update_agent_settings(
    State(state): State<Arc<AppState>>,
    Json(req): Json<AgentCapabilitiesSettings>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let settings = save_agent_settings(&state.store, req)?;
    Ok(Json(serde_json::json!({ "settings": settings })))
}

async fn approve_action(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let action = approve_and_execute_action(&state.store, &id)?;
    Ok(Json(serde_json::json!({ "action": action })))
}

async fn cancel_action(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let action = cancel_pending_action(&state.store, &id)?;
    Ok(Json(serde_json::json!({ "action": action })))
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
    let st = Arc::clone(&state);
    let transcript = req.transcript_override;
    let preferred = req.preferred_model;
    let meeting = tokio::task::spawn_blocking(move || {
        if preferred.as_deref().is_some_and(|m| !m.is_empty() && m != "offline") {
            let _ = ensure_ollama_ready_for_inference(&st.store.data_dir, preferred.as_deref());
        }
        stop_and_compile_meeting(&st.store, &id, transcript.as_deref(), preferred.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Meeting compile task failed: {e}"))))??;
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
struct RuntimeStatusQuery {
    model_tag: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnsureRuntimeReq {
    model_tag: Option<String>,
    pull_if_missing: Option<bool>,
}

async fn get_runtime_status(
    State(state): State<Arc<AppState>>,
    Query(query): Query<RuntimeStatusQuery>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let data_dir = state.store.data_dir.clone();
    let tag = query.model_tag;
    let status = tokio::task::spawn_blocking(move || {
        check_ollama_status_with_data_dir(Some(&data_dir), tag.as_deref())
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Runtime status task failed: {e}"))))?;
    Ok(Json(serde_json::json!({ "runtime": status })))
}

async fn post_ensure_runtime(
    State(state): State<Arc<AppState>>,
    Json(req): Json<EnsureRuntimeReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let data_dir = state.store.data_dir.clone();
    let tag = req.model_tag;
    let pull = req.pull_if_missing.unwrap_or(false);
    let status = tokio::task::spawn_blocking(move || {
        ensure_ollama_runtime(&data_dir, tag.as_deref(), pull)
    })
    .await
    .map_err(|e| ApiError(OperoError::Process(format!("Ensure runtime task failed: {e}"))))?;
    Ok(Json(serde_json::json!({ "runtime": status })))
}

pub(crate) fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/v1/models/runtime-status", get(get_runtime_status))
        .route("/api/v1/models/ensure-runtime", post(post_ensure_runtime))
        .route("/api/v1/agent/threads", get(list_threads))
        .route("/api/v1/agent/chat", post(chat_turn))
        .route("/api/v1/agent/threads/{id}", delete(remove_thread))
        .route("/api/v1/agent/settings", get(fetch_agent_settings).put(update_agent_settings))
        .route("/api/v1/agent/actions/{id}/approve", post(approve_action))
        .route("/api/v1/agent/actions/{id}/cancel", post(cancel_action))
        .route("/api/v1/meetings/capabilities", get(audio_capabilities))
        .route("/api/v1/meetings", get(list_meetings))
        .route("/api/v1/meetings/start", post(start_meeting))
        .route("/api/v1/meetings/{id}", get(get_meeting))
        .route("/api/v1/meetings/{id}/stop-compile", post(stop_compile_meeting))
        .route("/api/v1/meetings/{id}/export", post(export_meeting))
        .layer(RequestBodyLimitLayer::new(1024 * 1024 * 2))
        .with_state(state)
}
