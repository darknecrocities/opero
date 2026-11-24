pub mod redactor;
pub mod writers;

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};
    use opero_core::db::OperoStore;
    use opero_core::models::{AnnotationGeometry, AnnotationOverlay};
    use tempfile::tempdir;

    #[test]
    fn test_irreversible_pixel_redaction_destroys_secret_pixels() {
        let dir = tempdir().unwrap();
        let src = dir.path().join("raw.png");
        let img = ImageBuffer::from_pixel(200, 120, Rgba([250_u8, 40, 40, 255]));
        img.save(&src).unwrap();

        let ann = AnnotationOverlay {
            id: "ann_1".to_string(),
            screenshot_id: "sc_001".to_string(),
            step_id: "step_1".to_string(),
            annot_type: "blur".to_string(),
            geometry: AnnotationGeometry { x: 0.25, y: 0.25, w: 0.5, h: 0.5, x2: None, y2: None, curved: None },
            number_value: None,
            localized_labels: serde_json::json!({}),
            style: serde_json::json!({}),
            is_irreversible_redaction: true,
        };

        let out_png = redactor::render_irreversibly_redacted_png(&src, &[ann]).unwrap();
        let decoded = image::load_from_memory(&out_png).unwrap().to_rgba8();
        // Inside redacted region: permanently #0F172A (15, 23, 42)
        assert_eq!(decoded.get_pixel(100, 60).0, [15, 23, 42, 255]);
        // Outside redacted region: untouched
        assert_eq!(decoded.get_pixel(5, 5).0, [250, 40, 40, 255]);
        // Original source file on disk remains intact for Studio
        let orig = image::open(&src).unwrap().to_rgba8();
        assert_eq!(orig.get_pixel(100, 60).0, [250, 40, 40, 255]);
    }

    #[test]
    fn test_offline_exports_pdf_docx_html_markdown() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let p = store.create_project("Export Corp", "Author", "Ops", "ja-JP").unwrap();
        let s = store.start_session(&p.id, "在庫登録マニュアル", "standard", true).unwrap();
        store.record_event_and_frame(&s.id, "click", "Safari", "在庫管理ポータル", 420, 200, 2.0, "AXButton", "新規登録", &[], 0.99, false).unwrap();
        store.update_session_status(&s.id, "completed", Some(2000)).unwrap();
        let manual = store.generate_manual_from_session(&s.id, "sop", "ja-JP").unwrap();

        let exp_dir = dir.path().join("exports");
        for fmt in ["pdf", "docx", "html", "markdown"] {
            let art = writers::export_manual_artifact(&manual, fmt, "ja-JP", &exp_dir, dir.path()).unwrap();
            assert!(art.byte_size > 40);
            assert!(art.is_draft_watermarked);
            assert_eq!(art.sha256.len(), 64);
        }
    }
}
