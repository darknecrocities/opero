use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

use crate::doc_analyzer::{AnalyzedDocument, DocumentAnnotation};
use crate::doc_analyzer_translate::TranslatedBlock;
use crate::doc_parser::DocumentBlock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructuredReportSection {
    pub id: String,
    pub number: u8,
    pub title: String,
    pub summary: String,
    pub items: Vec<String>,
}

fn extract_glossary_terms(blocks: &[DocumentBlock]) -> Vec<String> {
    let mut terms = BTreeSet::new();
    for blk in blocks {
        for segment in blk.text.split(['\n', '|', '・', '、']) {
            let trimmed = segment.trim();
            if trimmed.contains('/') && trimmed.chars().count() >= 5 && trimmed.chars().count() <= 64 {
                terms.insert(trimmed.to_string());
            }
        }
        for tok in blk.text.split_whitespace() {
            let clean = tok.trim_matches(|c: char| !c.is_alphanumeric() && c != '-' && c != '_');
            if clean.len() >= 2 && clean.len() <= 10 && clean.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '-') && clean.chars().any(|c| c.is_ascii_uppercase()) {
                terms.insert(clean.to_string());
            }
        }
    }
    let mut out: Vec<String> = terms.into_iter().take(10).collect();
    if out.is_empty() {
        out.push("No specialized acronyms or bilingual glossary pairs detected.".to_string());
    }
    out
}

pub struct ReportBuildInput<'a> {
    pub filename: &'a str,
    pub file_format: &'a str,
    pub document_type: &'a str,
    pub source_language: &'a str,
    pub target_locale: &'a str,
    pub word_count: usize,
    pub completeness_score: u8,
    pub engine_used: &'a str,
    pub executive_summary: &'a str,
    pub key_findings: &'a [String],
    pub blocks: &'a [DocumentBlock],
    pub annotations: &'a [DocumentAnnotation],
    pub translated_summary: Option<&'a str>,
    pub translated_blocks: &'a [TranslatedBlock],
}

pub fn build_eight_structured_sections(inp: &ReportBuildInput<'_>) -> Vec<StructuredReportSection> {
    let filename = inp.filename;
    let document_type = inp.document_type;
    let source_language = inp.source_language;
    let target_locale = inp.target_locale;
    let completeness_score = inp.completeness_score;
    let word_count = inp.word_count;
    let executive_summary = inp.executive_summary;
    let key_findings = inp.key_findings;
    let blocks = inp.blocks;
    let annotations = inp.annotations;
    let translated_summary = inp.translated_summary;
    let translated_blocks = inp.translated_blocks;
    let heading_count = blocks.iter().filter(|b| b.kind == "heading").count();
    let table_count = blocks.iter().filter(|b| b.kind == "table").count();
    let blank_cells: usize = blocks.iter().map(|b| b.blank_cell_count).sum();

    let sec1 = StructuredReportSection {
        id: "overview".to_string(),
        number: 1,
        title: "Executive Overview & Metadata".to_string(),
        summary: executive_summary.to_string(),
        items: vec![
            format!("File: {filename} · Classification: {document_type}"),
            format!("Primary Source Language: {source_language} · Target Locale: {target_locale}"),
            format!("Length: {word_count} words · {heading_count} headings · {table_count} tables · Completeness: {completeness_score}%"),
        ],
    };

    let sec2_items: Vec<String> = if translated_blocks.is_empty() {
        vec![format!("Document is already in {source_language}; no automatic cross-language translation was required.")]
    } else {
        translated_blocks
            .iter()
            .take(6)
            .map(|tb| format!("{} -> {}", tb.source_text.chars().take(72).collect::<String>(), tb.translated_text.chars().take(160).collect::<String>()))
            .collect()
    };
    let sec2 = StructuredReportSection {
        id: "translation".to_string(),
        number: 2,
        title: "Automatic Language Detection & Translation".to_string(),
        summary: translated_summary.map(str::to_string).unwrap_or_else(|| {
            if source_language == target_locale {
                format!("Detected {source_language} matching active target locale ({target_locale}).")
            } else {
                format!("Auto-detected {source_language} content and prepared {target_locale} translation for {} block(s).", translated_blocks.len())
            }
        }),
        items: sec2_items,
    };

    let sec3 = StructuredReportSection {
        id: "key_findings".to_string(),
        number: 3,
        title: "Key Findings & Extracted Facts".to_string(),
        summary: format!("{} key operational fact(s) extracted from the document.", key_findings.len()),
        items: if key_findings.is_empty() {
            vec!["No discrete key findings extracted.".to_string()]
        } else {
            key_findings.to_vec()
        },
    };

    let mut action_items: Vec<String> = annotations
        .iter()
        .filter_map(|a| a.suggested_fix.as_ref().map(|fix| format!("[{}] {}: {fix}", a.severity.to_uppercase(), a.title)))
        .collect();
    if action_items.is_empty() {
        action_items.push("Review highlighted sections and confirm accuracy before sharing or exporting.".to_string());
    }
    let sec4 = StructuredReportSection {
        id: "action_items".to_string(),
        number: 4,
        title: "Action Items & Required Next Steps".to_string(),
        summary: format!("{} recommended follow-up action(s) derived from document analysis.", action_items.len()),
        items: action_items,
    };

    let mut risk_items: Vec<String> = annotations
        .iter()
        .filter(|a| a.severity == "missing" || a.severity == "suggestion")
        .map(|a| format!("[{}] {} — {}", a.severity.to_uppercase(), a.title, a.explanation))
        .collect();
    if blank_cells > 0 {
        risk_items.insert(0, format!("{blank_cells} unfilled table cell(s) detected across structured tables."));
    }
    if risk_items.is_empty() {
        risk_items.push("No missing table cells or compliance warnings detected.".to_string());
    }
    let sec5 = StructuredReportSection {
        id: "risks_gaps".to_string(),
        number: 5,
        title: "Risks, Missing Fields & Compliance Gaps".to_string(),
        summary: format!("Completeness score {completeness_score}% with {blank_cells} blank cell(s)."),
        items: risk_items,
    };

    let glossary_terms = extract_glossary_terms(blocks);
    let sec6 = StructuredReportSection {
        id: "glossary_terms".to_string(),
        number: 6,
        title: "Terminology & Protected Glossary Terms".to_string(),
        summary: "Domain acronyms and bilingual labels preserved verbatim during translation.".to_string(),
        items: glossary_terms,
    };

    let mut outline: Vec<String> = blocks
        .iter()
        .filter(|b| b.kind == "heading" || b.kind == "table")
        .take(10)
        .map(|b| format!("[{}] {}", b.kind.to_uppercase(), b.text.chars().take(100).collect::<String>()))
        .collect();
    if outline.is_empty() {
        outline.push(format!("{} sequential body paragraph(s) parsed.", blocks.len()));
    }
    let sec7 = StructuredReportSection {
        id: "structure_outline".to_string(),
        number: 7,
        title: "Document Structure & Section Breakdown".to_string(),
        summary: format!("Parsed {} total blocks ({heading_count} headings, {table_count} tables).", blocks.len()),
        items: outline,
    };

    let ann_items: Vec<String> = if annotations.is_empty() {
        vec!["No manual or AI annotations placed yet. Use Box, Arrow, or Crop on the canvas to explain any region.".to_string()]
    } else {
        annotations
            .iter()
            .map(|a| format!("#{} [{} · {}] {} — {}", a.number, a.kind.to_uppercase(), a.source.to_uppercase(), a.title, a.explanation))
            .collect()
    };
    let sec8 = StructuredReportSection {
        id: "annotations_log".to_string(),
        number: 8,
        title: "Manual & AI Annotations Log".to_string(),
        summary: format!("{} total annotation(s) saved in history and synced with Pero Agent.", annotations.len()),
        items: ann_items,
    };

    vec![sec1, sec2, sec3, sec4, sec5, sec6, sec7, sec8]
}

pub fn render_structured_report_markdown(doc: &AnalyzedDocument) -> String {
    let mut md = String::new();
    md.push_str(&format!("# Document Analysis Report: {}\n\n", doc.filename));
    md.push_str(&format!(
        "- **Document Type**: {}\n- **Primary Source Language**: {}\n- **Engine**: {}\n- **Completeness**: {}%\n- **Word Count**: {}\n- **SHA-256**: `{}`\n\n",
        doc.document_type, doc.source_language, doc.engine_used, doc.completeness_score, doc.word_count, doc.sha256
    ));
    for sec in &doc.structured_sections {
        md.push_str(&format!("## {:02}. {}\n\n{}\n\n", sec.number, sec.title, sec.summary));
        for item in &sec.items {
            md.push_str(&format!("- {item}\n"));
        }
        md.push('\n');
    }
    md
}
