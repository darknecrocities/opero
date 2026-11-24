PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  department TEXT NOT NULL,
  default_locale TEXT NOT NULL CHECK(default_locale IN ('en-US','ja-JP','fil-PH')),
  glossary_id TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recording_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  active_duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('ready','recording','paused','completed','incomplete_recovered')),
  capture_profile TEXT NOT NULL DEFAULT 'standard',
  app_version TEXT NOT NULL DEFAULT '1.0.0',
  consent_acknowledged_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES recording_sessions(id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  timestamp_utc TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  display_scale REAL NOT NULL DEFAULT 1.0,
  sha256 TEXT NOT NULL,
  dhash TEXT NOT NULL,
  redaction_state TEXT NOT NULL DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS captured_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES recording_sessions(id) ON DELETE CASCADE,
  timestamp_utc TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  app_process TEXT NOT NULL,
  window_title TEXT NOT NULL,
  coord_x INTEGER NOT NULL,
  coord_y INTEGER NOT NULL,
  display_scale REAL NOT NULL DEFAULT 1.0,
  target_role TEXT NOT NULL,
  target_label TEXT NOT NULL,
  target_source TEXT NOT NULL,
  screenshot_refs_json TEXT NOT NULL,
  privacy_flags_json TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS manuals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES recording_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'sop',
  source_locale TEXT NOT NULL CHECK(source_locale IN ('en-US','ja-JP','fil-PH')),
  lifecycle_state TEXT NOT NULL DEFAULT 'draft' CHECK(lifecycle_state IN ('draft','in_review','approved','superseded','withdrawn')),
  summary TEXT NOT NULL DEFAULT '',
  prerequisites_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  session_id TEXT,
  section_title TEXT NOT NULL DEFAULT 'Procedure',
  order_index INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  event_refs_json TEXT NOT NULL,
  screenshot_refs_json TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','needs_review','verified','rejected')),
  uncertainty_notes_json TEXT NOT NULL DEFAULT '[]',
  prompt_version TEXT NOT NULL DEFAULT 'v1.0.0',
  model_id TEXT NOT NULL DEFAULT 'offline-deterministic',
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS content_variants (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK(locale IN ('en-US','ja-JP','fil-PH')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  callouts_json TEXT NOT NULL DEFAULT '[]',
  source_variant_id TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft',
  outdated INTEGER NOT NULL DEFAULT 0,
  UNIQUE(step_id, locale)
);

CREATE VIRTUAL TABLE IF NOT EXISTS content_variants_fts USING fts5(
  step_id UNINDEXED,
  locale UNINDEXED,
  title,
  body,
  tokenize='unicode61'
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  event_id TEXT,
  screenshot_id TEXT
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  screenshot_id TEXT NOT NULL,
  step_id TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  annot_type TEXT NOT NULL CHECK(annot_type IN ('number','arrow','rect','blur','crop','label','spotlight')),
  geometry_json TEXT NOT NULL,
  number_value INTEGER,
  localized_labels_json TEXT NOT NULL DEFAULT '{}',
  style_json TEXT NOT NULL DEFAULT '{}',
  is_irreversible_redaction INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS manual_versions (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  author TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS glossary_terms (
  id TEXT PRIMARY KEY,
  source_term TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('en-US','ja-JP','fil-PH')),
  preferred_term TEXT NOT NULL,
  forbidden_variants_json TEXT NOT NULL DEFAULT '[]',
  context TEXT NOT NULL DEFAULT '',
  glossary_version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(source_term, locale, context)
);

CREATE TABLE IF NOT EXISTS translation_jobs (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  source_locale TEXT NOT NULL,
  target_locale TEXT NOT NULL,
  model_id TEXT NOT NULL,
  glossary_version INTEGER NOT NULL,
  reviewer_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_profiles (
  id TEXT PRIMARY KEY,
  runtime TEXT NOT NULL,
  model_name TEXT NOT NULL,
  revision TEXT NOT NULL,
  quantization TEXT NOT NULL,
  ram_tier_gb INTEGER NOT NULL,
  license_ref TEXT NOT NULL,
  capabilities_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  research_only INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audio_assets (
  id TEXT PRIMARY KEY,
  content_variant_id TEXT NOT NULL REFERENCES content_variants(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  consent_ref TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS export_records (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  format TEXT NOT NULL,
  locale TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================================================
-- LIGHTWEIGHT DUAL-CORE LLM MEMORY & LOCAL VECTOR RAG DB (SQLite-Embedded)
-- Core 1: Episodic (user edits, recent workflows, phrasing preferences)
-- Core 2: Semantic (approved manuals, MMI glossaries, templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS memory_chunks (
  id TEXT PRIMARY KEY,
  core_type TEXT NOT NULL CHECK(core_type IN ('episodic','semantic')),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('en-US','ja-JP','fil-PH')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  verified_boost REAL NOT NULL DEFAULT 1.0,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_chunks_fts USING fts5(
  chunk_id UNINDEXED,
  title,
  content,
  tokenize='unicode61'
);

CREATE TABLE IF NOT EXISTS memory_vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES memory_chunks(id) ON DELETE CASCADE,
  dims INTEGER NOT NULL,
  scale REAL NOT NULL,
  norm REAL NOT NULL,
  quantized_vec BLOB NOT NULL,
  embedding_model TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_session_seq ON captured_events(session_id, sequence);
CREATE INDEX IF NOT EXISTS idx_steps_manual_order ON workflow_steps(manual_id, order_index);
CREATE INDEX IF NOT EXISTS idx_memory_core_project ON memory_chunks(core_type, project_id);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  name TEXT NOT NULL DEFAULT '',
  occupation TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT 'calm_concise',
  default_locale TEXT NOT NULL DEFAULT 'en-US' CHECK(default_locale IN ('en-US','ja-JP','fil-PH')),
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  pero_cap_color TEXT NOT NULL DEFAULT '#69BCFC',
  pero_jacket_color TEXT NOT NULL DEFAULT '#69BCFC',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
