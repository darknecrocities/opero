mod tray;

use opero_core::permissions::{
    inspect_os_permissions, open_os_privacy_settings, trigger_native_permission_prompt,
    OsPermissionSnapshot, PermissionSurface,
};
use tauri::Manager;

#[tauri::command]
fn get_os_permissions(speech_enabled: bool) -> OsPermissionSnapshot {
    inspect_os_permissions(speech_enabled)
}

#[tauri::command]
fn request_os_permission(surface: PermissionSurface, speech_enabled: bool) -> Result<OsPermissionSnapshot, String> {
    trigger_native_permission_prompt(surface, speech_enabled).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_os_settings(surface: PermissionSurface) -> Result<String, String> {
    open_os_privacy_settings(surface).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    builder
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            let speech_enabled = std::env::var("OPERO_SPEECH_ENABLED")
                .map(|v| v == "true")
                .unwrap_or(false);

            tauri::async_runtime::spawn(async move {
                opero_daemon::start_embedded_daemon(data_dir, 4317, speech_enabled).await;
            });
            tray::setup_system_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_os_permissions,
            request_os_permission,
            open_os_settings
        ])
        .run(tauri::generate_context!())
        .expect("Failed to launch OPERO Desktop");
}
