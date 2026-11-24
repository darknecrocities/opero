use axum::{
    extract::{Path, Query, State},
    http::{HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use opero_core::db::OperoStore;
use opero_core::error::OperoError;
use opero_core::memory::dual_core::{delete_memory_chunk, get_memory_stats, query_dual_core_memory, upsert_memory_chunk};
use opero_core::permissions::{inspect_os_permissions, open_os_privacy_settings, trigger_native_permission_prompt, PermissionSurface};
use opero_export::writers::export_manual_artifact;
use serde::Deserialize;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use uuid::Uuid;

struct AppState {
    store: OperoStore,
    speech_enabled: bool,
}

struct ApiError(OperoError);

impl From<OperoError> for ApiError {
    fn from(e: OperoError) -> Self {
        Self(e)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let corr = Uuid::new_v4().to_string();
        let (status, title) = match &self.0 {
            OperoError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, "Validation Error"),
            OperoError::NotFound(_) => (StatusCode::NOT_FOUND, "Resource Not Found"),
            OperoError::Conflict(_) => (StatusCode::CONFLICT, "State Conflict"),
            OperoError::Forbidden(_) => (StatusCode::FORBIDDEN, "Security Policy Denied"),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal Local Engine Error"),
        };
        let body = serde_json::json!({
            "type": format!("https://opero.mmi.local/problems/{}", status.as_u16()),
            "title": title,
            "status": status.as_u16(),
            "detail": self.0.to_string(),
            "correlationId": corr,
        });
        let mut resp = (status, Json(body)).into_response();
        if let Ok(hv) = HeaderValue::from_str(&corr) {
            resp.headers_mut().insert("x-correlation-id", hv);
        }
        resp
    }
}

async fn health(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let conn = state.store.conn()?;
    let mem = get_memory_stats(&conn)?;
    let perms = inspect_os_permissions(state.speech_enabled);
    Ok(Json(serde_json::json!({
        "status": "ok",
        "offlineStrict": true,
        "sqliteWal": true,
        "memory": mem,
        "permissions": perms,
    })))
}

async fn list_projects(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let projects = state.store.list_projects(false)?;
    Ok(Json(serde_json::json!({ "projects": projects })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectReq {
    title: String,
    owner: String,
    department: String,
    default_locale: String,
}

async fn create_project(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateProjectReq>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let project = state.store.create_project(&req.title, &req.owner, &req.department, &req.default_locale)?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "project": project }))))
}

async fn list_sessions(State(state): State<Arc<AppState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let sessions = state.store.list_sessions()?;
    Ok(Json(serde_json::json!({ "sessions": sessions })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionReq {
    project_id: String,
    title: String,
    profile: Option<String>,
    consent_acknowledged: bool,
}

async fn start_session(
    State(state): State<Arc<AppState>>,
    Json(req): Json<StartSessionReq>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let session = state.store.start_session(
        &req.project_id,
        &req.title,
        req.profile.as_deref().unwrap_or("standard"),
        req.consent_acknowledged,
    )?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "session": session }))))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionStatusReq {
    status: String,
    active_duration_ms: Option<i64>,
}

async fn update_session_status(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<SessionStatusReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    state.store.update_session_status(&id, &req.status, req.active_duration_ms)?;
    Ok(Json(serde_json::json!({ "ok": true, "sessionId": id, "status": req.status })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecordEventReq {
    event_type: String,
    process: String,
    window_title: String,
    x: i32,
    y: i32,
    display_scale: Option<f64>,
    target_role: String,
    target_label: String,
    allow_native_screen: Option<bool>,
}

async fn record_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<RecordEventReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let rec = state.store.record_event_and_frame(
        &id,
        &req.event_type,
        &req.process,
        &req.window_title,
        req.x,
        req.y,
        req.display_scale.unwrap_or(2.0),
        &req.target_role,
        &req.target_label,
        &[],
        0.94,
        req.allow_native_screen.unwrap_or(false),
    )?;
    Ok(Json(serde_json::json!({ "captured": rec.is_some(), "result": rec })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateManualReq {
    template_id: Option<String>,
    source_locale: Option<String>,
}

async fn generate_manual(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<GenerateManualReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let manual = state.store.generate_manual_from_session(
        &id,
        req.template_id.as_deref().unwrap_or("sop"),
        req.source_locale.as_deref().unwrap_or("en-US"),
    )?;
    Ok(Json(serde_json::json!({ "manual": manual })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PermissionReq {
    surface: PermissionSurface,
}

async fn get_permissions(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(serde_json::json!({ "permissions": inspect_os_permissions(state.speech_enabled) }))
}

async fn request_permission(
    State(state): State<Arc<AppState>>,
    Json(req): Json<PermissionReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let snap = trigger_native_permission_prompt(req.surface, state.speech_enabled)?;
    Ok(Json(serde_json::json!({ "permissions": snap })))
}

async fn open_permission_settings(Json(req): Json<PermissionReq>) -> Result<Json<serde_json::Value>, ApiError> {
    let uri = open_os_privacy_settings(req.surface)?;
    Ok(Json(serde_json::json!({ "openedUri": uri })))
}

#[derive(Deserialize)]
struct MemoryQuery {
    q: String,
    locale: Option<String>,
    k: Option<usize>,
}

async fn search_memory(
    State(state): State<Arc<AppState>>,
    Query(params): Query<MemoryQuery>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let conn = state.store.conn()?;
    let hits = query_dual_core_memory(&conn, &params.q, params.locale.as_deref(), params.k.unwrap_or(6))?;
    let stats = get_memory_stats(&conn)?;
    Ok(Json(serde_json::json!({ "hits": hits, "stats": stats })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpsertMemoryReq {
    core_type: String,
    project_id: Option<String>,
    source_type: String,
    source_id: String,
    locale: String,
    title: String,
    content: String,
    pinned: Option<bool>,
}

async fn add_memory(
    State(state): State<Arc<AppState>>,
    Json(req): Json<UpsertMemoryReq>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let conn = state.store.conn()?;
    let chunk = upsert_memory_chunk(
        &conn,
        &req.core_type,
        req.project_id.as_deref(),
        &req.source_type,
        &req.source_id,
        &req.locale,
        &req.title,
        &req.content,
        req.pinned.unwrap_or(false),
    )?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "chunk": chunk }))))
}

async fn remove_memory(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let conn = state.store.conn()?;
    let deleted = delete_memory_chunk(&conn, &id)?;
    Ok(Json(serde_json::json!({ "deleted": deleted })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportReq {
    manual: opero_core::models::Manual,
    format: String,
    locale: String,
}

async fn export_manual(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ExportReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let exports_dir = state.store.data_dir.join("exports");
    let art = export_manual_artifact(&req.manual, &req.format, &req.locale, &exports_dir, &state.store.data_dir)?;
    Ok(Json(serde_json::json!({ "artifact": art })))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().json().init();
    let data_dir = std::env::var("OPERO_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./data"));
    let speech_enabled = std::env::var("OPERO_SPEECH_ENABLED").map(|v| v == "true").unwrap_or(false);
    let store = OperoStore::open(&data_dir).expect("Failed to initialize OPERO SQLite WAL store");
    let _ = store.recover_incomplete_sessions();

    let state = Arc::new(AppState { store, speech_enabled });

    let allowed_origins = [
        HeaderValue::from_static("http://localhost:5173"),
        HeaderValue::from_static("http://127.0.0.1:5173"),
        HeaderValue::from_static("tauri://localhost"),
    ];
    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/projects", get(list_projects).post(create_project))
        .route("/api/v1/sessions", get(list_sessions).post(start_session))
        .route("/api/v1/sessions/{id}/status", post(update_session_status))
        .route("/api/v1/sessions/{id}/events", post(record_event))
        .route("/api/v1/sessions/{id}/generate", post(generate_manual))
        .route("/api/v1/permissions/status", get(get_permissions))
        .route("/api/v1/permissions/request", post(request_permission))
        .route("/api/v1/permissions/open-settings", post(open_permission_settings))
        .route("/api/v1/memory", get(search_memory).post(add_memory))
        .route("/api/v1/memory/{id}", delete(remove_memory))
        .route("/api/v1/exports", post(export_manual))
        .layer(RequestBodyLimitLayer::new(1024 * 100))
        .layer(cors)
        .with_state(state);

    let port: u16 = std::env::var("OPERO_DAEMON_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(4317);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!(%addr, "OPERO local-first loopback daemon started");
    let listener = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind loopback socket");
    axum::serve(listener, app).await.expect("OPERO daemon error");
}
