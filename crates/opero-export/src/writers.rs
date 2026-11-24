use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use opero_core::error::{OperoError, OperoResult};
use opero_core::models::Manual;
use sha2::{Digest, Sha256};
use std::io::Write;
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::redactor::render_irreversibly_redacted_png;

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportArtifact {
    pub format: String,
    pub locale: String,
    pub file_path: String,
    pub sha256: String,
    pub byte_size: usize,
    pub is_draft_watermarked: bool,
}

pub fn sanitize_filename(title: &str) -> String {
    let mut slug = String::new();
    for ch in title.chars() {
        if ch.is_alphanumeric() || ch == '-' || ch == '_' {
            slug.push(ch);
        } else if ch.is_whitespace() || ch == ':' || ch == '/' || ch == '\\' {
            if !slug.ends_with('-') {
                slug.push('-');
            }
        }
    }
    let trimmed = slug.trim_matches('-');
    if trimmed.is_empty() { "opero-manual".to_string() } else { trimmed.to_string() }
}

fn escape_xml(s: &str) -> String {
    s.chars()
        .filter(|&c| c >= ' ' || c == '\n' || c == '\t')
        .collect::<String>()
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn step_text(manual: &Manual, idx: usize, locale: &str) -> (String, String) {
    let step = &manual.steps[idx];
    if let Some(v) = step.variants.get(locale).or_else(|| step.variants.get(&manual.source_locale)) {
        let t = v.get("title").and_then(|x| x.as_str()).unwrap_or("Untitled Step").to_string();
        let b = v.get("body").and_then(|x| x.as_str()).unwrap_or("").to_string();
        return (t, b);
    }
    (format!("Step {:02}", step.order_index), String::new())
}

pub fn export_manual_artifact(
    manual: &Manual,
    format: &str,
    locale: &str,
    exports_dir: &Path,
    data_dir: &Path,
) -> OperoResult<ExportArtifact> {
    if manual.steps.is_empty() {
        return Err(OperoError::Validation("Manual must contain at least one step to export.".to_string()));
    }
    std::fs::create_dir_all(exports_dir)?;
    let slug = sanitize_filename(&manual.title);
    let is_draft = manual.lifecycle_state != "approved";

    let (ext, bytes): (&str, Vec<u8>) = match format {
        "markdown" | "md" => ("md", build_markdown(manual, locale, is_draft)),
        "html" => ("html", build_html(manual, locale, is_draft, data_dir)),
        "docx" => ("docx", build_docx(manual, locale, is_draft)),
        "pdf" => ("pdf", build_pdf(manual, locale, is_draft)),
        other => return Err(OperoError::Validation(format!("Unsupported export format: {other}"))),
    };

    let filename = format!("{slug}-{locale}.{ext}");
    let out_path: PathBuf = exports_dir.join(&filename);
    let tmp_path = out_path.with_extension(format!("{ext}.tmp"));
    std::fs::write(&tmp_path, &bytes)?;
    std::fs::rename(&tmp_path, &out_path)?;

    let sha256 = hex::encode(Sha256::digest(&bytes));
    Ok(ExportArtifact {
        format: format.to_string(),
        locale: locale.to_string(),
        file_path: out_path.to_string_lossy().to_string(),
        sha256,
        byte_size: bytes.len(),
        is_draft_watermarked: is_draft,
    })
}

fn build_markdown(manual: &Manual, locale: &str, is_draft: bool) -> Vec<u8> {
    let mut md = String::new();
    if is_draft {
        md.push_str("> **DRAFT — UNVERIFIED**: Pending human approval before MMI publication.\n\n");
    }
    md.push_str(&format!("# {}\n\n", manual.title.replace("javascript:", "")));
    md.push_str(&format!("- **Locale**: `{locale}` | **Template**: `{}` | **State**: `{}`\n\n", manual.template_id, manual.lifecycle_state));
    md.push_str(&format!("{}\n\n", manual.summary));
    for i in 0..manual.steps.len() {
        let (title, body) = step_text(manual, i, locale);
        let step = &manual.steps[i];
        md.push_str(&format!("## {}\n\n{}\n\n", title.replace("javascript:", ""), body.replace("javascript:", "")));
        md.push_str(&format!("_Evidence_: `{}`\n\n", step.event_refs.join(", ")));
    }
    md.into_bytes()
}

fn build_html(manual: &Manual, locale: &str, is_draft: bool, data_dir: &Path) -> Vec<u8> {
    let mut sections = String::new();
    for i in 0..manual.steps.len() {
        let (title, body) = step_text(manual, i, locale);
        let step = &manual.steps[i];
        let mut img_tag = String::new();
        if let Some(sc_id) = step.screenshot_refs.first() {
            if let Some(sess_id) = &manual.session_id {
                let candidate = data_dir.join("sessions").join(sess_id).join("frames").join(format!("{sc_id}.png"));
                if candidate.exists() {
                    if let Ok(redacted_png) = render_irreversibly_redacted_png(&candidate, &step.annotations) {
                        img_tag = format!(
                            "<figure><img src=\"data:image/png;base64,{}\" alt=\"{}\" style=\"max-width:100%;border:1px solid #E2EAF2;border-radius:8px;\" /></figure>",
                            B64.encode(redacted_png),
                            escape_xml(&title)
                        );
                    }
                }
            }
        }
        sections.push_str(&format!(
            "<article style=\"margin:24px 0;padding:18px;border:1px solid #E2EAF2;border-radius:10px;background:#FFFFFF;\"><h2>{}</h2><p>{}</p>{}<p style=\"font-size:12px;color:#526071;font-family:monospace;\">Evidence: {}</p></article>",
            escape_xml(&title),
            escape_xml(&body),
            img_tag,
            escape_xml(&step.event_refs.join(", "))
        ));
    }
    let banner = if is_draft {
        "<div style=\"padding:10px 14px;background:#FEF3C7;border:1px solid #B7791F;color:#0F172A;border-radius:8px;margin-bottom:18px;\"><strong>DRAFT — UNVERIFIED</strong> · Human review required before publication.</div>"
    } else {
        ""
    };
    let html = format!(
        "<!doctype html><html lang=\"{}\"><head><meta charset=\"utf-8\"/><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src data:; style-src 'unsafe-inline';\"/><title>{}</title></head><body style=\"margin:0;padding:32px;background:#FFFFFF;color:#0F172A;font-family:'Inter','Noto Sans JP',sans-serif;\"><main style=\"max-width:780px;margin:0 auto;\">{}<h1>{}</h1><p style=\"color:#526071;\">{}</p>{}<footer style=\"margin-top:32px;border-top:1px solid #E2EAF2;padding-top:12px;font-size:12px;color:#526071;\">Generated Offline by OPERO · Manual {} · Locale {}</footer></main></body></html>",
        escape_xml(locale),
        escape_xml(&manual.title),
        banner,
        escape_xml(&manual.title),
        escape_xml(&manual.summary),
        sections,
        escape_xml(&manual.id),
        escape_xml(locale)
    );
    html.into_bytes()
}

fn build_docx(manual: &Manual, locale: &str, is_draft: bool) -> Vec<u8> {
    let mut buf = std::io::Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buf);
        let opts = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

        let _ = zip.start_file("[Content_Types].xml", opts);
        let _ = zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>"#);

        let _ = zip.start_file("_rels/.rels", opts);
        let _ = zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>"#);

        let mut body_xml = String::new();
        if is_draft {
            body_xml.push_str("<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>DRAFT — UNVERIFIED (Pending MMI Human Review)</w:t></w:r></w:p>");
        }
        body_xml.push_str(&format!(
            "<w:p><w:r><w:rPr><w:rFonts w:ascii=\"Inter\" w:eastAsia=\"Noto Sans JP\"/><w:b/><w:sz w:val=\"32\"/></w:rPr><w:t>{}</w:t></w:r></w:p>",
            escape_xml(&manual.title)
        ));
        for i in 0..manual.steps.len() {
            let (title, body) = step_text(manual, i, locale);
            body_xml.push_str(&format!(
                "<w:p><w:r><w:rPr><w:rFonts w:ascii=\"Inter\" w:eastAsia=\"Noto Sans JP\"/><w:b/></w:rPr><w:t>{}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:rFonts w:ascii=\"Inter\" w:eastAsia=\"Noto Sans JP\"/></w:rPr><w:t>{}</w:t></w:r></w:p>",
                escape_xml(&title),
                escape_xml(&body)
            ));
        }

        let doc_xml = format!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{}</w:body></w:document>"#,
            body_xml
        );
        let _ = zip.start_file("word/document.xml", opts);
        let _ = zip.write_all(doc_xml.as_bytes());
        let _ = zip.finish();
    }
    buf.into_inner()
}

fn pdf_escape(s: &str) -> String {
    s.chars()
        .map(|c| if c.is_ascii() && c >= ' ' { c } else { ' ' })
        .collect::<String>()
        .replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)")
}

fn build_pdf(manual: &Manual, locale: &str, is_draft: bool) -> Vec<u8> {
    let mut lines: Vec<String> = Vec::new();
    if is_draft {
        lines.push("DRAFT - UNVERIFIED (Pending MMI Review)".to_string());
    }
    lines.push(format!("OPERO Manual: {} [{}]", manual.title, locale));
    lines.push(format!("ID: {} | Template: {} | Status: {}", manual.id, manual.template_id, manual.lifecycle_state));
    lines.push("----------------------------------------------------------------".to_string());
    for i in 0..manual.steps.len() {
        let (title, body) = step_text(manual, i, locale);
        let step = &manual.steps[i];
        lines.push(format!("{}. {}", i + 1, title));
        lines.push(format!("   {}", body));
        lines.push(format!("   Evidence: {}", step.event_refs.join(", ")));
    }
    lines.push("Generated Offline by OPERO (Local-First)".to_string());

    let mut stream = String::from("BT\n/F1 11 Tf\n50 760 Td\n15 TL\n");
    for line in &lines {
        stream.push_str(&format!("({}) Tj T*\n", pdf_escape(line)));
    }
    stream.push_str("ET\n");

    let mut pdf = Vec::<u8>::new();
    pdf.extend_from_slice(b"%PDF-1.4\n");
    let mut offsets = vec![0_usize];

    let objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".to_string(),
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".to_string(),
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n".to_string(),
        format!("4 0 obj\n<< /Length {} >>\nstream\n{}endstream\nendobj\n", stream.len(), stream),
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".to_string(),
    ];

    for obj in &objects {
        offsets.push(pdf.len());
        pdf.extend_from_slice(obj.as_bytes());
    }
    let xref_pos = pdf.len();
    pdf.extend_from_slice(format!("xref\n0 {}\n0000000000 65535 f \n", offsets.len()).as_bytes());
    for off in offsets.iter().skip(1) {
        pdf.extend_from_slice(format!("{off:010} 00000 n \n").as_bytes());
    }
    pdf.extend_from_slice(
        format!("trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n", offsets.len()).as_bytes(),
    );
    pdf
}
