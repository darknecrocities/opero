use opero_core::profile::MMI_TEMPLATE_IDS;

#[cfg(test)]
mod template_export_tests {
    use super::MMI_TEMPLATE_IDS;
    use crate::writers::export_manual_artifact;
    use opero_core::db::OperoStore;
    use tempfile::tempdir;

    #[test]
    fn test_all_7_mmi_templates_export_across_all_4_formats() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let p = store.create_project("MMI Templates QA", "Arron", "Operations", "en-US").unwrap();
        let exp_dir = dir.path().join("exports");

        for tpl in MMI_TEMPLATE_IDS {
            let manual = store
                .create_manual_from_template(&p.id, tpl, &format!("Sample {tpl}"), "ja-JP")
                .unwrap();
            assert_eq!(manual.template_id, *tpl);
            assert_eq!(manual.steps.len(), 2);

            for fmt in ["pdf", "docx", "html", "markdown"] {
                let art = export_manual_artifact(&manual, fmt, "ja-JP", &exp_dir, dir.path()).unwrap();
                assert!(art.byte_size > 80, "Template {tpl} -> {fmt} unexpectedly small");
                assert_eq!(art.sha256.len(), 64);
            }
        }
    }
}
