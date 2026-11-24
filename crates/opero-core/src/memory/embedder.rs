/// Ultra-lightweight 384-dimensional local embedder requiring 0 MB external model weights.
/// Combines UTF-8 character trigrams (supports Japanese Kanji/Kana, Filipino, and English)
/// with word-token feature hashing, L2-normalized and scalar-quantized to int8 (384 bytes/chunk).
pub const EMBED_DIMS: usize = 384;

#[derive(Debug, Clone)]
pub struct QuantizedEmbedding {
    pub dims: usize,
    pub scale: f32,
    pub norm: f32,
    pub bytes: Vec<u8>,
    pub model_name: String,
}

fn fnv1a_hash(bytes: &[u8], seed: u64) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325 ^ seed;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

pub fn embed_text_f32(text: &str) -> Vec<f32> {
    let mut vec = vec![0.0_f32; EMBED_DIMS];
    let normalized = text.trim().to_lowercase();
    if normalized.is_empty() {
        return vec;
    }

    // 1. Word-level tokens (weight 1.5)
    for token in normalized
        .split(|c: char| !c.is_alphanumeric())
        .filter(|t| !t.is_empty())
    {
        let h = fnv1a_hash(token.as_bytes(), 0x1111_2222);
        let idx = (h as usize) % EMBED_DIMS;
        let sign = if (h >> 63) == 0 { 1.0_f32 } else { -1.0_f32 };
        vec[idx] += sign * 1.5;
    }

    // 2. Character bigrams & trigrams (critical for Japanese Kanji/Kana & Filipino affixes)
    let chars: Vec<char> = normalized.chars().filter(|c| !c.is_whitespace()).collect();
    for win_len in [2_usize, 3_usize] {
        if chars.len() < win_len {
            continue;
        }
        let weight = if win_len == 3 { 1.0_f32 } else { 0.7_f32 };
        for window in chars.windows(win_len) {
            let mut buf = [0u8; 12];
            let mut pos = 0;
            for &ch in window {
                let encoded = ch.encode_utf8(&mut buf[pos..]);
                pos += encoded.len();
            }
            let h = fnv1a_hash(&buf[..pos], win_len as u64 * 0x9e37_79b9);
            let idx = (h as usize) % EMBED_DIMS;
            let sign = if (h >> 63) == 0 { 1.0_f32 } else { -1.0_f32 };
            vec[idx] += sign * weight;
        }
    }

    let norm = vec.iter().map(|v| v * v).sum::<f32>().sqrt();
    if norm > 0.0 {
        for v in &mut vec {
            *v /= norm;
        }
    }
    vec
}

pub fn quantize_i8(vec: &[f32], model_name: &str) -> QuantizedEmbedding {
    let max_abs = vec.iter().fold(0.0_f32, |acc, &v| acc.max(v.abs()));
    let scale = if max_abs > 0.0 { max_abs / 127.0 } else { 1.0 };
    let mut bytes = Vec::with_capacity(vec.len());
    let mut norm_sq = 0.0_f32;
    for &v in vec {
        let q = (v / scale).round().clamp(-127.0, 127.0) as i8;
        let recon = (q as f32) * scale;
        norm_sq += recon * recon;
        bytes.push(q as u8);
    }
    QuantizedEmbedding {
        dims: vec.len(),
        scale,
        norm: norm_sq.sqrt(),
        bytes,
        model_name: model_name.to_string(),
    }
}

pub fn cosine_similarity_quantized(query: &[f32], stored_bytes: &[u8], scale: f32, stored_norm: f32) -> f32 {
    if query.len() != stored_bytes.len() || stored_norm <= 0.0 {
        return 0.0;
    }
    let query_norm = query.iter().map(|v| v * v).sum::<f32>().sqrt();
    if query_norm <= 0.0 {
        return 0.0;
    }
    let mut dot = 0.0_f32;
    for (&q_val, &s_byte) in query.iter().zip(stored_bytes.iter()) {
        dot += q_val * ((s_byte as i8) as f32 * scale);
    }
    (dot / (query_norm * stored_norm)).clamp(-1.0, 1.0)
}
