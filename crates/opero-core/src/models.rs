use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub title: String,
    pub owner: String,
    pub department: String,
    pub default_locale: String,
    pub glossary_id: Option<String>,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingSession {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub active_duration_ms: i64,
    pub status: String,
    pub capture_profile: String,
    pub app_version: String,
    pub consent_acknowledged_at: String,
    pub event_count: i64,
    pub screenshot_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapturedEvent {
    pub event_id: String,
    pub session_id: String,
    pub timestamp_utc: String,
    pub sequence: i64,
    pub event_type: String,
    pub application: EventApplication,
    pub coordinates: EventCoordinates,
    pub target: EventTarget,
    pub screenshot_refs: Vec<String>,
    pub privacy_flags: Vec<String>,
    pub schema_version: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventApplication {
    pub process: String,
    pub window_title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventCoordinates {
    pub x: i32,
    pub y: i32,
    pub display_scale: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventTarget {
    pub role: String,
    pub label: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenshotAsset {
    pub id: String,
    pub session_id: String,
    pub relative_path: String,
    pub timestamp_utc: String,
    pub width: u32,
    pub height: u32,
    pub display_scale: f64,
    pub sha256: String,
    pub dhash: String,
    pub redaction_state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnnotationGeometry {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x2: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y2: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub curved: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnnotationOverlay {
    pub id: String,
    pub screenshot_id: String,
    pub step_id: String,
    #[serde(rename = "type")]
    pub annot_type: String,
    pub geometry: AnnotationGeometry,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number_value: Option<i32>,
    pub localized_labels: serde_json::Value,
    pub style: serde_json::Value,
    pub is_irreversible_redaction: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StepCallout {
    pub kind: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentVariant {
    pub id: String,
    pub step_id: String,
    pub locale: String,
    pub title: String,
    pub body: String,
    pub callouts: Vec<StepCallout>,
    pub source_variant_id: Option<String>,
    pub review_status: String,
    pub outdated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStep {
    pub id: String,
    pub manual_id: String,
    pub session_id: Option<String>,
    pub section_title: String,
    pub order_index: i32,
    pub action_type: String,
    pub event_refs: Vec<String>,
    pub screenshot_refs: Vec<String>,
    pub review_status: String,
    pub uncertainty_notes: Vec<String>,
    pub prompt_version: String,
    pub model_id: String,
    pub variants: serde_json::Map<String, serde_json::Value>,
    pub annotations: Vec<AnnotationOverlay>,
    pub schema_version: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manual {
    pub id: String,
    pub project_id: String,
    pub session_id: Option<String>,
    pub title: String,
    pub template_id: String,
    pub source_locale: String,
    pub lifecycle_state: String,
    pub summary: String,
    pub prerequisites: Vec<String>,
    pub steps: Vec<WorkflowStep>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlossaryTerm {
    pub id: String,
    pub source_term: String,
    pub locale: String,
    pub preferred_term: String,
    pub forbidden_variants: Vec<String>,
    pub context: String,
    pub glossary_version: i32,
}
