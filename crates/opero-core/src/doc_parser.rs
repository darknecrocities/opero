use serde::{Deserialize, Serialize};
use std::io::{Cursor, Read};
use std::process::Command;

use crate::error::{OperoError, OperoResult};

pub const MAX_ANALYZER_FILE_BYTES: usize = 5 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentBlock {
    pub id: String,
    pub kind: String,
    pub title: Option<String>,
    pub text: String,
    pub rows: Vec<Vec<String>>,
    pub blank_cell_count: usize,
    pub y_pct: f64,
    pub h_pct: f64,
}

#[derive(Debug, Clone)]
pub struct ParsedDocumentPayload {
    pub format: String,
    pub raw_text: String,
    pub blocks: Vec<DocumentBlock>,
    pub word_count: usize,
    pub detected_languages: Vec<String>,
}

pub fn extract_document_bytes(filename: &str, bytes: &[u8]) -> OperoResult<ParsedDocumentPayload> {
    if bytes.is_empty() {
        return Err(OperoError::Validation("Uploaded document is empty.".to_string()));
    }
    if bytes.len() > MAX_ANALYZER_FILE_BYTES {
        return Err(OperoError::Validation(format!(
            "Document exceeds maximum allowed size of {} MB.",
            MAX_ANALYZER_FILE_BYTES / (1024 * 1024)
        )));
    }

    let lower = filename.to_lowercase();
    let (format, raw_text) = if lower.ends_with(".docx") {
        if bytes.len() < 4 || &bytes[0..2] != b"PK" {
            return Err(OperoError::Validation("Invalid DOCX magic bytes (expected ZIP/PK header).".to_string()));
        }
        ("docx".to_string(), extract_docx_text(bytes)?)
    } else if lower.ends_with(".pdf") {
        if bytes.len() < 5 || &bytes[0..5] != b"%PDF-" {
            return Err(OperoError::Validation("Invalid PDF magic bytes (expected %PDF- header).".to_string()));
        }
        ("pdf".to_string(), extract_pdf_text(bytes)?)
    } else if lower.ends_with(".doc") {
        ("doc".to_string(), extract_legacy_doc_text(bytes)?)
    } else if lower.ends_with(".md") || lower.ends_with(".txt") || !lower.contains('.') {
        let fmt = if lower.ends_with(".md") { "markdown" } else { "txt" };
        let text = String::from_utf8(bytes.to_vec())
            .map_err(|_| OperoError::Validation("Text file must be valid UTF-8.".to_string()))?;
        (fmt.to_string(), text)
    } else {
        return Err(OperoError::Validation(
            "Unsupported document format. Supported: .pdf, .docx, .doc, .txt, .md".to_string(),
        ));
    };

    let blocks = structure_text_into_blocks(&raw_text);
    let word_count = raw_text.split_whitespace().count();
    let detected_languages = detect_languages(&raw_text);

    Ok(ParsedDocumentPayload {
        format,
        raw_text,
        blocks,
        word_count,
        detected_languages,
    })
}

fn extract_docx_text(bytes: &[u8]) -> OperoResult<String> {
    let reader = Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(reader)
        .map_err(|e| OperoError::Validation(format!("Failed to open DOCX archive: {e}")))?;
    let mut doc_xml = String::new();
    archive
        .by_name("word/document.xml")
        .map_err(|_| OperoError::Validation("DOCX missing word/document.xml".to_string()))?
        .read_to_string(&mut doc_xml)?;

    let mut out = Vec::new();
    for para in doc_xml.split("</w:p>") {
        let text = strip_xml_tags(para);
        let trimmed = text.trim();
        if !trimmed.is_empty() {
            out.push(trimmed.to_string());
        }
    }
    Ok(out.join("\n"))
}

fn strip_xml_tags(input: &str) -> String {
    let mut res = String::with_capacity(input.len());
    let mut in_tag = false;
    for ch in input.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => res.push(ch),
            _ => {}
        }
    }
    res.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
}

fn extract_pdf_text(bytes: &[u8]) -> OperoResult<String> {
    // 1. Try local python3 + pypdf when present (handles compressed FlateDecode streams cleanly)
    let tmp = std::env::temp_dir().join(format!("opero-pdf-{}.pdf", uuid::Uuid::new_v4().simple()));
    if std::fs::write(&tmp, bytes).is_ok() {
        let py = Command::new("python3")
            .args([
                "-c",
                "import sys, pypdf; r=pypdf.PdfReader(sys.argv[1]); print('\\n'.join((p.extract_text() or '') for p in r.pages))",
                tmp.to_string_lossy().as_ref(),
            ])
            .output();
        let _ = std::fs::remove_file(&tmp);
        if let Ok(out) = py {
            if out.status.success() {
                let txt = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !txt.is_empty() {
                    return Ok(txt);
                }
            }
        }
    }

    // 2. Pure-Rust fallback extracting uncompressed PDF literal strings inside (...) Tj / TJ operators
    let lossy = String::from_utf8_lossy(bytes);
    let mut extracted = Vec::new();
    let mut buf = String::new();
    let mut depth = 0usize;
    let mut escaped = false;
    for ch in lossy.chars() {
        if escaped {
            buf.push(ch);
            escaped = false;
            continue;
        }
        if ch == '\\' && depth > 0 {
            escaped = true;
            continue;
        }
        if ch == '(' {
            if depth > 0 {
                buf.push(ch);
            }
            depth += 1;
        } else if ch == ')' && depth > 0 {
            depth -= 1;
            if depth == 0 {
                let s = buf.trim();
                if s.len() >= 2 && s.chars().any(|c| c.is_alphanumeric()) {
                    extracted.push(s.to_string());
                }
                buf.clear();
            } else {
                buf.push(ch);
            }
        } else if depth > 0 {
            buf.push(ch);
        }
    }

    if extracted.is_empty() {
        return Err(OperoError::Validation(
            "PDF contains no extractable text (scanned/image-only PDF).".to_string(),
        ));
    }
    Ok(extracted.join("\n"))
}

fn extract_legacy_doc_text(bytes: &[u8]) -> OperoResult<String> {
    if let Ok(utf8) = String::from_utf8(bytes.to_vec()) {
        if utf8.chars().filter(|c| c.is_control() && !c.is_whitespace()).count() < 8 {
            return Ok(utf8);
        }
    }
    let tmp = std::env::temp_dir().join(format!("opero-doc-{}.doc", uuid::Uuid::new_v4().simple()));
    std::fs::write(&tmp, bytes)?;
    let res = Command::new("textutil")
        .args(["-convert", "txt", "-stdout", tmp.to_string_lossy().as_ref()])
        .output();
    let _ = std::fs::remove_file(&tmp);
    match res {
        Ok(out) if out.status.success() => Ok(String::from_utf8_lossy(&out.stdout).to_string()),
        _ => Err(OperoError::Validation(
            "Unable to decode legacy .doc binary on this platform; save as .docx or .pdf.".to_string(),
        )),
    }
}

pub fn structure_text_into_blocks(raw_text: &str) -> Vec<DocumentBlock> {
    let lines: Vec<&str> = raw_text.lines().collect();
    let mut blocks: Vec<DocumentBlock> = Vec::new();
    let mut i = 0usize;

    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() {
            i += 1;
            continue;
        }

        // Markdown / pipe table block
        if line.starts_with('|') && line.ends_with('|') {
            let mut rows = Vec::new();
            let mut blank_cells = 0usize;
            while i < lines.len() {
                let row_line = lines[i].trim();
                if !(row_line.starts_with('|') && row_line.ends_with('|')) {
                    break;
                }
                let cells: Vec<String> = row_line
                    .trim_matches('|')
                    .split('|')
                    .map(|c| c.trim().to_string())
                    .collect();
                let is_sep = cells.iter().all(|c| !c.is_empty() && c.chars().all(|ch| ch == '-' || ch == ':'));
                if !is_sep {
                    blank_cells += cells.iter().filter(|c| c.is_empty()).count();
                    rows.push(cells);
                }
                i += 1;
            }
            let text = rows.iter().map(|r| r.join(" | ")).collect::<Vec<_>>().join("\n");
            blocks.push(DocumentBlock {
                id: format!("blk_{:02}", blocks.len() + 1),
                kind: "table".to_string(),
                title: rows.first().and_then(|r| r.first()).cloned(),
                text,
                rows,
                blank_cell_count: blank_cells,
                y_pct: 0.0,
                h_pct: 0.0,
            });
            continue;
        }

        // Numbered section heading or markdown heading
        let is_numbered = line.chars().next().is_some_and(|c| c.is_ascii_digit())
            && line.contains(". ")
            && line.len() <= 110;
        let is_heading = line.starts_with('#') || is_numbered || (blocks.is_empty() && line.len() <= 72);
        let is_note = line.contains("追加おすすめ") || line.starts_with("Note:") || line.starts_with("※");

        if is_heading {
            blocks.push(DocumentBlock {
                id: format!("blk_{:02}", blocks.len() + 1),
                kind: "heading".to_string(),
                title: Some(line.trim_start_matches('#').trim().to_string()),
                text: line.trim_start_matches('#').trim().to_string(),
                rows: Vec::new(),
                blank_cell_count: 0,
                y_pct: 0.0,
                h_pct: 0.0,
            });
            i += 1;
            continue;
        }

        // Paragraph or callout note block
        let mut para = vec![line.to_string()];
        i += 1;
        while i < lines.len() {
            let nxt = lines[i].trim();
            if nxt.is_empty()
                || (nxt.starts_with('|') && nxt.ends_with('|'))
                || nxt.starts_with('#')
                || (nxt.chars().next().is_some_and(|c| c.is_ascii_digit()) && nxt.contains(". "))
            {
                break;
            }
            para.push(nxt.to_string());
            i += 1;
        }
        let joined = para.join("\n");
        blocks.push(DocumentBlock {
            id: format!("blk_{:02}", blocks.len() + 1),
            kind: if is_note || joined.contains("追加おすすめ") {
                "note".to_string()
            } else {
                "paragraph".to_string()
            },
            title: None,
            text: joined,
            rows: Vec::new(),
            blank_cell_count: 0,
            y_pct: 0.0,
            h_pct: 0.0,
        });
    }

    // Assign normalized vertical coordinates for overlay alignment
    let total = blocks.len().max(1) as f64;
    let slot = 92.0 / total;
    for (idx, blk) in blocks.iter_mut().enumerate() {
        blk.y_pct = (4.0 + (idx as f64) * slot).min(94.0);
        blk.h_pct = (slot * 0.86).clamp(5.0, 22.0);
    }
    blocks
}

pub fn detect_languages(text: &str) -> Vec<String> {
    let mut langs = Vec::new();
    let has_ascii_words = text.chars().filter(|c| c.is_ascii_alphabetic()).count() > 10;
    let has_jp = text
        .chars()
        .any(|c| ('\u{3040}'..='\u{30FF}').contains(&c) || ('\u{4E00}'..='\u{9FFF}').contains(&c));
    let lower = text.to_lowercase();
    let has_fil = ["ang ", "mga ", "hakbang", "trabaho", "ulat"].iter().any(|k| lower.contains(k));

    if has_ascii_words {
        langs.push("en-US".to_string());
    }
    if has_jp {
        langs.push("ja-JP".to_string());
    }
    if has_fil {
        langs.push("fil-PH".to_string());
    }
    if langs.is_empty() {
        langs.push("en-US".to_string());
    }
    langs
}
