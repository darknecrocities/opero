use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::error::{OperoError, OperoResult};
use crate::memory::embedder::{cosine_similarity_quantized, embed_text_f32, quantize_i8, EMBED_DIMS};

pub const RRF_K: f64 = 60.0;
pub const MAX_CONTEXT_CHARS: usize = 4800; // ~1,200 tokens

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryChunk {
    pub id: String,
    pub core_type: String,
    pub project_id: Option<String>,
    pub source_type: String,
    pub source_id: String,
    pub locale: String,
    pub title: String,
    pub content: String,
    pub verified_boost: f64,
    pub pinned: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchHit {
    pub chunk: MemoryChunk,
    pub rrf_score: f64,
    pub lexical_rank: Option<usize>,
    pub vector_rank: Option<usize>,
    pub cosine_similarity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DualCoreMemoryStats {
    pub episodic_count: i64,
    pub semantic_count: i64,
    pub vector_count: i64,
    pub embedding_model: String,
    pub embedding_dims: usize,
    pub estimated_ram_bytes: usize,
}

pub fn sanitize_for_memory(input: &str) -> String {
    let lower = input.to_lowercase();
    let mut cleaned = input.to_string();
    for secret_prefix in ["bearer ", "sk-", "ghp_", "password="] {
        if let Some(pos) = lower.find(secret_prefix) {
            cleaned.replace_range(pos.., "[REDACTED_SECRET]");
            break;
        }
    }
    cleaned.replace("</untrusted_screen_evidence>", "[ESCAPED]")
}

pub fn upsert_memory_chunk(
    conn: &Connection,
    core_type: &str,
    project_id: Option<&str>,
    source_type: &str,
    source_id: &str,
    locale: &str,
    title: &str,
    content: &str,
    pinned: bool,
) -> OperoResult<MemoryChunk> {
    if core_type != "episodic" && core_type != "semantic" {
        return Err(OperoError::Validation(format!("Invalid memory core_type: {core_type}")));
    }
    let clean_title = sanitize_for_memory(title);
    let clean_content = sanitize_for_memory(content);
    let verified_boost = if core_type == "semantic" { 1.35 } else { 1.0 };
    let id = format!("mem_{}", Uuid::new_v4().simple());
    let created_at = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO memory_chunks (id, core_type, project_id, source_type, source_id, locale, title, content, verified_boost, pinned, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            id, core_type, project_id, source_type, source_id, locale,
            clean_title, clean_content, verified_boost, if pinned { 1 } else { 0 }, created_at
        ],
    )?;

    conn.execute(
        "INSERT INTO memory_chunks_fts (chunk_id, title, content) VALUES (?1, ?2, ?3)",
        params![id, clean_title, clean_content],
    )?;

    let combined = format!("{clean_title}\n{clean_content}");
    let f32_vec = embed_text_f32(&combined);
    let q = quantize_i8(&f32_vec, "opero-rust-trigram-384-i8");

    conn.execute(
        "INSERT INTO memory_vectors (chunk_id, dims, scale, norm, quantized_vec, embedding_model)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, q.dims as i64, q.scale as f64, q.norm as f64, q.bytes, q.model_name],
    )?;

    Ok(MemoryChunk {
        id,
        core_type: core_type.to_string(),
        project_id: project_id.map(str::to_string),
        source_type: source_type.to_string(),
        source_id: source_id.to_string(),
        locale: locale.to_string(),
        title: clean_title,
        content: clean_content,
        verified_boost,
        pinned,
        created_at,
    })
}

pub fn delete_memory_chunk(conn: &Connection, chunk_id: &str) -> OperoResult<bool> {
    conn.execute("DELETE FROM memory_chunks_fts WHERE chunk_id = ?1", params![chunk_id])?;
    conn.execute("DELETE FROM memory_vectors WHERE chunk_id = ?1", params![chunk_id])?;
    let changed = conn.execute("DELETE FROM memory_chunks WHERE id = ?1", params![chunk_id])?;
    Ok(changed > 0)
}

/// Atomically deletes all memory chunks, FTS5 rows, and quantized vectors linked to
/// a specific `(source_type, source_id)` pair so Pero Agent immediately forgets deleted documents.
pub fn delete_memory_chunks_by_source(
    conn: &Connection,
    source_type: &str,
    source_id: &str,
) -> OperoResult<usize> {
    let mut stmt = conn.prepare(
        "SELECT id FROM memory_chunks WHERE source_type = ?1 AND source_id = ?2",
    )?;
    let ids: Vec<String> = stmt
        .query_map(params![source_type, source_id], |r| r.get::<_, String>(0))?
        .filter_map(Result::ok)
        .collect();
    let mut removed = 0usize;
    for cid in &ids {
        conn.execute("DELETE FROM memory_chunks_fts WHERE chunk_id = ?1", params![cid])?;
        conn.execute("DELETE FROM memory_vectors WHERE chunk_id = ?1", params![cid])?;
        removed += conn.execute("DELETE FROM memory_chunks WHERE id = ?1", params![cid])?;
    }
    Ok(removed)
}

pub fn query_dual_core_memory(
    conn: &Connection,
    query: &str,
    locale_boost: Option<&str>,
    top_k: usize,
) -> OperoResult<Vec<MemorySearchHit>> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    // 1. Lexical FTS5 BM25 pass
    let mut lexical_ranks: HashMap<String, usize> = HashMap::new();
    let fts_tokens: Vec<String> = trimmed
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| s.chars().count() >= 2)
        .map(|s| format!("\"{}\"", s.replace('"', "")))
        .collect();
    if !fts_tokens.is_empty() {
        let fts_query = fts_tokens.join(" OR ");
        if let Ok(mut stmt) = conn.prepare(
            "SELECT chunk_id FROM memory_chunks_fts WHERE memory_chunks_fts MATCH ?1 ORDER BY bm25(memory_chunks_fts) LIMIT 50",
        ) {
            if let Ok(rows) = stmt.query_map(params![fts_query], |row| row.get::<_, String>(0)) {
                for (rank, cid) in rows.flatten().enumerate() {
                    lexical_ranks.insert(cid, rank + 1);
                }
            }
        }
    }

    // 2. Quantized Vector Cosine pass
    let q_vec = embed_text_f32(trimmed);
    let mut stmt = conn.prepare(
        "SELECT c.id, c.core_type, c.project_id, c.source_type, c.source_id, c.locale,
                c.title, c.content, c.verified_boost, c.pinned, c.created_at,
                v.dims, v.scale, v.norm, v.quantized_vec
         FROM memory_chunks c
         JOIN memory_vectors v ON v.chunk_id = c.id",
    )?;

    let mut candidates: Vec<(MemoryChunk, f32)> = Vec::new();
    let rows = stmt.query_map([], |row| {
        let chunk = MemoryChunk {
            id: row.get(0)?,
            core_type: row.get(1)?,
            project_id: row.get(2)?,
            source_type: row.get(3)?,
            source_id: row.get(4)?,
            locale: row.get(5)?,
            title: row.get(6)?,
            content: row.get(7)?,
            verified_boost: row.get(8)?,
            pinned: row.get::<_, i64>(9)? != 0,
            created_at: row.get(10)?,
        };
        let dims: i64 = row.get(11)?;
        let scale: f64 = row.get(12)?;
        let norm: f64 = row.get(13)?;
        let bytes: Vec<u8> = row.get(14)?;
        Ok((chunk, dims as usize, scale as f32, norm as f32, bytes))
    })?;

    for item in rows.flatten() {
        let (chunk, dims, scale, norm, bytes) = item;
        if dims != EMBED_DIMS || bytes.len() != EMBED_DIMS {
            continue;
        }
        let cos = cosine_similarity_quantized(&q_vec, &bytes, scale, norm);
        candidates.push((chunk, cos));
    }

    candidates.sort_by(|a, b| b.1.total_cmp(&a.1));

    // 3. Reciprocal Rank Fusion (RRF k=60) + Recency Decay + Semantic Boost + Locale Boost
    let now = Utc::now();
    let mut hits: Vec<MemorySearchHit> = candidates
        .into_iter()
        .enumerate()
        .map(|(v_idx, (chunk, cos))| {
            let vector_rank = Some(v_idx + 1);
            let lexical_rank = lexical_ranks.get(&chunk.id).copied();
            let mut rrf = 1.0 / (RRF_K + (v_idx as f64 + 1.0));
            if let Some(lr) = lexical_rank {
                rrf += 1.25 / (RRF_K + lr as f64);
            }
            let age_days = DateTime::parse_from_rfc3339(&chunk.created_at)
                .map(|dt| (now - dt.with_timezone(&Utc)).num_days().max(0) as f64)
                .unwrap_or(0.0);
            let recency = if chunk.core_type == "episodic" && !chunk.pinned {
                (-age_days / 45.0).exp().max(0.45)
            } else {
                1.0
            };
            let pin_boost = if chunk.pinned { 1.12 } else { 1.0 };
            let loc_boost = if locale_boost.is_some_and(|l| l == chunk.locale) { 1.15 } else { 1.0 };
            let score = rrf * chunk.verified_boost * recency * pin_boost * loc_boost + (cos.max(0.0) as f64 * 0.045);
            MemorySearchHit {
                chunk,
                rrf_score: score,
                lexical_rank,
                vector_rank,
                cosine_similarity: cos,
            }
        })
        .collect();

    hits.sort_by(|a, b| b.rrf_score.total_cmp(&a.rrf_score).then_with(|| a.chunk.id.cmp(&b.chunk.id)));
    hits.truncate(top_k);
    Ok(hits)
}

pub fn build_bounded_rag_context(hits: &[MemorySearchHit]) -> String {
    let mut out = String::from("<dual_core_memory>\n");
    for h in hits {
        let entry = format!(
            "[{}|{}|{}] {}: {}\n",
            h.chunk.id, h.chunk.core_type, h.chunk.locale, h.chunk.title, h.chunk.content
        );
        if out.len() + entry.len() > MAX_CONTEXT_CHARS {
            break;
        }
        out.push_str(&entry);
    }
    out.push_str("</dual_core_memory>");
    out
}

pub fn get_memory_stats(conn: &Connection) -> OperoResult<DualCoreMemoryStats> {
    let episodic_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM memory_chunks WHERE core_type = 'episodic'", [], |r| r.get(0)
    )?;
    let semantic_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM memory_chunks WHERE core_type = 'semantic'", [], |r| r.get(0)
    )?;
    let vector_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM memory_vectors", [], |r| r.get(0)
    )?;
    Ok(DualCoreMemoryStats {
        episodic_count,
        semantic_count,
        vector_count,
        embedding_model: "opero-rust-trigram-384-i8".to_string(),
        embedding_dims: EMBED_DIMS,
        estimated_ram_bytes: (vector_count as usize) * (EMBED_DIMS + 64),
    })
}
