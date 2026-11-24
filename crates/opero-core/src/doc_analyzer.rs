use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::process::Command;
use uuid::Uuid;

use crate::doc_parser::{extract_document_bytes, DocumentBlock, ParsedDocumentPayload};
use crate::error::OperoResult;

const OLLAMA_LOOPBACK: &str = "http://127.0.0.1:11434";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentAnnotation {
    pub id: String,
    pub number: usize,
    pub kind: String,
    pub source: String,
    pub block_id: Option<String>,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub target_x: Option<f64>,
    pub target_y: Option<f64>,
    pub title: String,
    pub excerpt: String,
    pub explanation: String,
    pub reasoning: String,
    pub suggested_fix: Option<String>,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzedDocument {
    pub id: String,
    pub filename: String,
    pub file_format: String,
    pub byte_size: usize,
    pub sha256: String,
    pub word_count: usize,
    pub detected_languages: Vec<String>,
    pub document_type: String,
    pub engine_used: String,
    pub executive_summary: String,
    pub key_findings: Vec<String>,
    pub completeness_score: u8,
    pub blocks: Vec<DocumentBlock>,
    pub annotations: Vec<DocumentAnnotation>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionExplanation {
    pub engine_used: String,
    pub title: String,
    pub explanation: String,
    pub reasoning: String,
    pub suggested_fix: Option<String>,
    pub severity: String,
}

fn detect_ollama_model(preferred: Option<&str>) -> Option<String> {
    if preferred == Some("offline") {
        return None;
    }
    let out = Command::new("curl")
        .args(["-fsS", "--max-time", "1", &format!("{OLLAMA_LOOPBACK}/api/tags")])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let val: serde_json::Value = serde_json::from_slice(&out.stdout).ok()?;
    let models = val.get("models")?.as_array()?;
    if models.is_empty() {
        return None;
    }
    if let Some(pref) = preferred {
        for m in models {
            if let Some(name) = m.get("name").and_then(|v| v.as_str()) {
                if name == pref || name.starts_with(pref.split(':').next().unwrap_or(pref)) {
                    return Some(name.to_string());
                }
            }
        }
    }
    models.first()?.get("name")?.as_str().map(str::to_string)
}

fn call_ollama_json(model: &str, prompt: &str) -> Option<serde_json::Value> {
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": false,
        "think": false,
        "options": { "temperature": 0.2, "num_predict": 512 }
    });
    let body = serde_json::to_string(&payload).ok()?;
    let out = Command::new("curl")
        .args([
            "-fsS",
            "--max-time",
            "18",
            "-X",
            "POST",
            "-H",
            "Content-Type: application/json",
            "-d",
            &body,
            &format!("{OLLAMA_LOOPBACK}/api/generate"),
        ])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let outer: serde_json::Value = serde_json::from_slice(&out.stdout).ok()?;
    let response_text = outer.get("response")?.as_str()?;
    serde_json::from_str::<serde_json::Value>(response_text).ok()
}

fn infer_document_type(raw: &str) -> String {
    let lower = raw.to_lowercase();
    if lower.contains("internship report") || raw.contains("インターンシップ日報") {
        "Bilingual Internship Daily Report".to_string()
    } else if lower.contains("standard operating procedure") || lower.contains("sop") {
        "Standard Operating Procedure (SOP)".to_string()
    } else if lower.contains("troubleshoot") || lower.contains("incident") {
        "Troubleshooting & Incident Runbook".to_string()
    } else if lower.contains("contract") || lower.contains("agreement") {
        "Policy / Formal Agreement".to_string()
    } else {
        "Structured Operational Document".to_string()
    }
}

fn build_auto_annotations(blocks: &[DocumentBlock]) -> Vec<DocumentAnnotation> {
    let mut anns = Vec::new();
    let mut last_heading = String::from("Document Section");

    for blk in blocks {
        if blk.kind == "heading" {
            last_heading = blk.text.clone();
            continue;
        }
        let lower = format!("{} {}", last_heading, blk.text).to_lowercase();
        let (should_mark, kind, severity, explanation, reasoning, fix) = if blk.kind == "note" || blk.text.contains("追加おすすめ") {
            (
                true,
                "arrow",
                "suggestion",
                "Inline editorial recommendation highlighting an extra classification field.".to_string(),
                "Adding a Training Type (研修区分) categorizes hours into Japanese Language, Technical OJT, or Documentation, making academic and HR credit audits clearer.",
                Some("Add a structured Training Type dropdown or checkbox row directly under Section 4.".to_string()),
            )
        } else if blk.kind == "table" && blk.blank_cell_count > 0 {
            let is_dtr = lower.contains("time record") || lower.contains("dtr") || lower.contains("出退勤");
            let is_sig = lower.contains("signature") || lower.contains("署名");
            let (exp, reas, sug) = if is_dtr {
                (
                    format!("Daily Time Record table contains {} unfilled cell(s).", blk.blank_cell_count),
                    "Philippine CHED academic credit verification requires Time In, Time Out, Break, Total Hours, and Work Location to be completed daily.",
                    "Fill in exact timestamps and compute total working hours before supervisor review.",
                )
            } else if is_sig {
                (
                    format!("Sign-off block has {} blank signature/date field(s).", blk.blank_cell_count),
                    "Without both intern and supervisor signatures/stamps (印), the report lacks formal compliance sign-off.",
                    "Obtain both Intern and Supervisor signatures and date stamps before archiving.",
                )
            } else {
                (
                    format!("Structured table under '{}' has {} empty cell(s).", last_heading, blk.blank_cell_count),
                    "Incomplete metadata or task rows reduce traceability during weekly progress and compliance audits.",
                    "Populate every required cell using concise, active-verb entries.",
                )
            };
            (true, "box", "missing", exp, reas, Some(sug.to_string()))
        } else if lower.contains("ched") || lower.contains("reflection") || lower.contains("issues") {
            (
                true,
                "arrow",
                "info",
                format!("Key narrative section: '{}'.", last_heading),
                "Captures qualitative blockers, reflections, or compliance requirements that numeric tables alone do not convey.",
                Some("Include concrete examples and next-day follow-up items.".to_string()),
            )
        } else {
            (false, "box", "info", String::new(), "", None)
        };

        if should_mark && anns.len() < 8 {
            let num = anns.len() + 1;
            let excerpt: String = blk.text.chars().take(160).collect();
            anns.push(DocumentAnnotation {
                id: format!("ann_{}", Uuid::new_v4().simple()),
                number: num,
                kind: kind.to_string(),
                source: "ai".to_string(),
                block_id: Some(blk.id.clone()),
                x: 6.0,
                y: blk.y_pct,
                w: 88.0,
                h: blk.h_pct,
                target_x: if kind == "arrow" { Some(18.0) } else { None },
                target_y: if kind == "arrow" { Some((blk.y_pct + 2.0).min(96.0)) } else { None },
                title: last_heading.clone(),
                excerpt,
                explanation,
                reasoning: reasoning.to_string(),
                suggested_fix: fix,
                severity: severity.to_string(),
            });
        }
    }
    anns
}

pub fn analyze_document_bytes(
    filename: &str,
    bytes: &[u8],
    locale: &str,
    preferred_model: Option<&str>,
) -> OperoResult<AnalyzedDocument> {
    let parsed: ParsedDocumentPayload = extract_document_bytes(filename, bytes)?;
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let sha256 = hex::encode(hasher.finalize());

    let doc_type = infer_document_type(&parsed.raw_text);
    let annotations = build_auto_annotations(&parsed.blocks);

    let total_cells: usize = parsed.blocks.iter().map(|b| b.rows.iter().map(Vec::len).sum::<usize>()).sum();
    let blank_cells: usize = parsed.blocks.iter().map(|b| b.blank_cell_count).sum();
    let completeness_score: u8 = if total_cells == 0 {
        85
    } else {
        (((total_cells.saturating_sub(blank_cells)) * 100) / total_cells).min(100) as u8
    };

    let headings: Vec<String> = parsed
        .blocks
        .iter()
        .filter(|b| b.kind == "heading")
        .map(|b| b.text.clone())
        .collect();

    let mut engine_used = "Offline Structural & Bilingual Engine".to_string();
    let mut executive_summary = format!(
        "{doc_type} with {} structured block(s), {} section heading(s), and {} word(s) across {}. Detected {} blank table cell(s) ({completeness_score}% filled) and generated {} grounded visual annotation(s) with reasoning.",
        parsed.blocks.len(),
        headings.len(),
        parsed.word_count,
        parsed.detected_languages.join(" / "),
        blank_cells,
        annotations.len()
    );
    let mut key_findings = vec![
        format!("Detected languages: {}", parsed.detected_languages.join(", ")),
        format!("Structured sections: {} headings, {} tables", headings.len(), parsed.blocks.iter().filter(|b| b.kind == "table").count()),
        format!("Form completeness: {}% ({} blank cells requiring input)", completeness_score, blank_cells),
    ];
    if parsed.raw_text.contains("追加おすすめ") {
        key_findings.push("Editorial suggestion detected: 'Training Type / 研修区分' recommended under Section 4 to document educational hours.".to_string());
    }

    if let Some(model) = detect_ollama_model(preferred_model) {
        let preview: String = parsed.raw_text.chars().take(2800).collect();
        let prompt = format!(
            "Analyze this document in locale {locale}. Return ONLY JSON with keys: executiveSummary (string, 2-3 sentences), keyFindings (array of 3-5 short strings). Document:\n{preview}"
        );
        if let Some(resp) = call_ollama_json(&model, &prompt) {
            if let Some(sum) = resp.get("executiveSummary").and_then(|v| v.as_str()) {
                if !sum.trim().is_empty() {
                    executive_summary = sum.trim().to_string();
                    engine_used = format!("Ollama ({model})");
                }
            }
            if let Some(arr) = resp.get("keyFindings").and_then(|v| v.as_array()) {
                let parsed_findings: Vec<String> = arr
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.trim().to_string()))
                    .filter(|s| !s.is_empty())
                    .take(6)
                    .collect();
                if !parsed_findings.is_empty() {
                    key_findings = parsed_findings;
                }
            }
        }
    }

    let now = Utc::now().to_rfc3339();
    Ok(AnalyzedDocument {
        id: format!("doc_{}", Uuid::new_v4().simple()),
        filename: filename.to_string(),
        file_format: parsed.format,
        byte_size: bytes.len(),
        sha256,
        word_count: parsed.word_count,
        detected_languages: parsed.detected_languages,
        document_type: doc_type,
        engine_used,
        executive_summary,
        key_findings,
        completeness_score,
        blocks: parsed.blocks,
        annotations,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn explain_cropped_region(
    excerpt: &str,
    context_title: &str,
    kind: &str,
    locale: &str,
    preferred_model: Option<&str>,
) -> RegionExplanation {
    let clean_excerpt = excerpt.trim();
    if let Some(model) = detect_ollama_model(preferred_model) {
        let prompt = format!(
            "Explain this cropped document region in locale {locale}. Return ONLY JSON with keys: title, explanation, reasoning, suggestedFix, severity (info|suggestion|missing). Section: {context_title}. Excerpt:\n{clean_excerpt}"
        );
        if let Some(resp) = call_ollama_json(&model, &prompt) {
            if let (Some(exp), Some(reas)) = (
                resp.get("explanation").and_then(|v| v.as_str()),
                resp.get("reasoning").and_then(|v| v.as_str()),
            ) {
                return RegionExplanation {
                    engine_used: format!("Ollama ({model})"),
                    title: resp.get("title").and_then(|v| v.as_str()).unwrap_or(context_title).to_string(),
                    explanation: exp.to_string(),
                    reasoning: reas.to_string(),
                    suggested_fix: resp.get("suggestedFix").and_then(|v| v.as_str()).map(str::to_string),
                    severity: resp.get("severity").and_then(|v| v.as_str()).unwrap_or("info").to_string(),
                };
            }
        }
    }

    let lower = clean_excerpt.to_lowercase();
    let (severity, explanation, reasoning, fix) = if clean_excerpt.contains("追加おすすめ") || lower.contains("training type") {
        (
            "suggestion",
            "Recommends adding a 'Training Type / 研修区分' tag (Japanese Language, Business Culture, Technical OJT, Reflection, Documentation).".to_string(),
            "Categorizing training hours makes it straightforward to justify educational vs. operational hours during university and HR evaluations.",
            Some("Include a Training Type column or checklist in the final template.".to_string()),
        )
    } else if lower.contains("ched") || lower.contains("time in") || lower.contains("出退勤") {
        (
            "missing",
            "Captures daily attendance timestamps, break duration, total hours, and work location.".to_string(),
            "Required by Philippine CHED guidelines for academic credit verification; missing entries can invalidate credited OJT hours.",
            Some("Record exact Time In/Out and break minutes before supervisor approval.".to_string()),
        )
    } else if lower.contains("signature") || lower.contains("署名") {
        (
            "missing",
            "Formal acknowledgment block for both intern and supervisor signatures/stamps (印).".to_string(),
            "Establishes verifiable human sign-off and date-stamped accountability for the submitted report.",
            Some("Ensure both signatures and dates are filled prior to archiving.".to_string()),
        )
    } else {
        (
            "info",
            format!("Focused {kind} excerpt from '{}' ({} words).", context_title, clean_excerpt.split_whitespace().count()),
            "Isolating this section allows reviewers to verify specific terminology, completeness, and bilingual accuracy independently.",
            Some("Review wording for clarity and confirm all referenced fields are populated.".to_string()),
        )
    };

    RegionExplanation {
        engine_used: "Offline Structural & Bilingual Engine".to_string(),
        title: if context_title.trim().is_empty() { "Selected Region".to_string() } else { context_title.to_string() },
        explanation: explanation.to_string(),
        reasoning: reasoning.to_string(),
        suggested_fix: fix,
        severity: severity.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_bilingual_report_and_crop_reasoning() {
        let sample = "Daily Internship Report\nインターンシップ日報\n1. Basic Information / 基本情報\n| Name | | Date | |\n2. Daily Time Record (DTR) / 出退勤記録\nRequired for Philippine CHED guidelines.\n| Time In | Time Out | Total Hours |\n| | | |\n4. Technical Notes & Learning\n追加おすすめ\nTraining Type / 研修区分\n8. Signatures / 署名・承認欄\n| Intern Signature | | Supervisor Signature | |\n";
        let doc = analyze_document_bytes("daily_report.txt", sample.as_bytes(), "en-US", Some("offline")).unwrap();
        assert_eq!(doc.file_format, "txt");
        assert!(doc.detected_languages.contains(&"en-US".to_string()));
        assert!(doc.detected_languages.contains(&"ja-JP".to_string()));
        assert!(!doc.annotations.is_empty());
        assert!(doc.annotations.iter().any(|a| a.kind == "arrow" && a.severity == "suggestion"));
        assert!(doc.annotations.iter().any(|a| a.kind == "box" && a.severity == "missing"));

        let exp = explain_cropped_region("追加おすすめ Training Type / 研修区分", "Section 4", "crop", "en-US", Some("offline"));
        assert_eq!(exp.severity, "suggestion");
        assert!(exp.reasoning.contains("hours"));
    }
}
