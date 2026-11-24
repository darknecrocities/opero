use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn setup_system_tray(app: &App) -> tauri::Result<()> {
    let open_dashboard = MenuItem::with_id(app, "open_dashboard", "Open Dashboard", true, None::<&str>)?;
    let toggle_capture = MenuItem::with_id(app, "toggle_capture", "Start / Pause Capture", true, None::<&str>)?;
    let snap_frame = MenuItem::with_id(app, "snap_frame", "Snap Frame Now", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let open_templates = MenuItem::with_id(app, "open_templates", "MMI Templates", true, None::<&str>)?;
    let open_settings = MenuItem::with_id(app, "open_settings", "Settings", true, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit_opero = MenuItem::with_id(app, "quit_opero", "Quit OPERO", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &open_dashboard,
            &toggle_capture,
            &snap_frame,
            &sep1,
            &open_templates,
            &open_settings,
            &sep2,
            &quit_opero,
        ],
    )?;

    let icon = Image::from_bytes(include_bytes!("../icons/tray-icon.png"))?;

    let mut builder = TrayIconBuilder::with_id("opero-quickbar")
        .icon(icon)
        .tooltip("OPERO Quick Actions")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            if id == "quit_opero" {
                app.exit(0);
                return;
            }
            show_main_window(app);
            let _ = app.emit("opero://tray-action", id);
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Right,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }

    builder.build(app)?;
    Ok(())
}
