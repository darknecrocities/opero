use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::error::{OperoError, OperoResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PermissionSurface {
    ScreenCapture,
    Accessibility,
    Microphone,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OsPermissionItem {
    pub surface: PermissionSurface,
    pub state: String,
    pub can_prompt_natively: bool,
    pub settings_deep_link: String,
    pub guidance: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OsPermissionSnapshot {
    pub platform: String,
    pub os_version: String,
    pub bundle_id: String,
    pub screen_capture: OsPermissionItem,
    pub accessibility: OsPermissionItem,
    pub microphone: OsPermissionItem,
    pub checked_at_utc: String,
}

#[cfg(target_os = "macos")]
mod macos_ffi {
    use std::ffi::c_void;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        pub fn CGPreflightScreenCaptureAccess() -> bool;
        pub fn CGRequestScreenCaptureAccess() -> bool;
    }

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        pub fn AXIsProcessTrusted() -> bool;
        pub fn AXIsProcessTrustedWithOptions(options: *const c_void) -> bool;
        pub static kAXTrustedCheckOptionPrompt: *const c_void;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        pub static kCFBooleanTrue: *const c_void;
        pub fn CFDictionaryCreate(
            allocator: *const c_void,
            keys: *const *const c_void,
            values: *const *const c_void,
            num_values: isize,
            key_callbacks: *const c_void,
            value_callbacks: *const c_void,
        ) -> *const c_void;
        pub fn CFRelease(cf: *const c_void);
    }

    pub fn preflight_screen_capture() -> bool {
        unsafe { CGPreflightScreenCaptureAccess() }
    }

    pub fn request_screen_capture() -> bool {
        unsafe { CGRequestScreenCaptureAccess() }
    }

    pub fn preflight_accessibility() -> bool {
        unsafe { AXIsProcessTrusted() }
    }

    pub fn request_accessibility_prompt() -> bool {
        unsafe {
            let keys = [kAXTrustedCheckOptionPrompt];
            let values = [kCFBooleanTrue];
            let dict = CFDictionaryCreate(
                std::ptr::null(),
                keys.as_ptr(),
                values.as_ptr(),
                1,
                std::ptr::null(),
                std::ptr::null(),
            );
            let trusted = AXIsProcessTrustedWithOptions(dict);
            if !dict.is_null() {
                CFRelease(dict);
            }
            trusted
        }
    }
}

pub fn settings_deep_link_for_platform(platform: &str, surface: PermissionSurface) -> &'static str {
    match (platform, surface) {
        ("macos", PermissionSurface::ScreenCapture) => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
        }
        ("macos", PermissionSurface::Accessibility) => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
        }
        ("macos", PermissionSurface::Microphone) => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
        }
        ("windows", PermissionSurface::ScreenCapture) => {
            "ms-settings:privacy-graphicscaptureprogrammatic"
        }
        ("windows", PermissionSurface::Accessibility) => "ms-settings:easeofaccess-display",
        ("windows", PermissionSurface::Microphone) => "ms-settings:privacy-microphone",
        _ => "xdg-desktop-portal://org.freedesktop.portal.ScreenCast",
    }
}

pub fn detect_os_version() -> String {
    #[cfg(target_os = "macos")]
    {
        if let Ok(out) = Command::new("sw_vers").arg("-productVersion").output() {
            if out.status.success() {
                return format!("macOS {}", String::from_utf8_lossy(&out.stdout).trim());
            }
        }
        "macOS".to_string()
    }
    #[cfg(target_os = "windows")]
    {
        "Windows 10/11 (WinRT GraphicsCapture + UIA)".to_string()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        "Linux (PipeWire ScreenCast Portal + AT-SPI)".to_string()
    }
}

pub fn inspect_os_permissions(speech_enabled: bool) -> OsPermissionSnapshot {
    let platform = if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else {
        "linux"
    };

    #[cfg(target_os = "macos")]
    let (screen_granted, ax_granted) = (
        macos_ffi::preflight_screen_capture(),
        macos_ffi::preflight_accessibility(),
    );

    #[cfg(not(target_os = "macos"))]
    let (screen_granted, ax_granted) = (true, true);

    OsPermissionSnapshot {
        platform: platform.to_string(),
        os_version: detect_os_version(),
        bundle_id: "com.mmi.opero".to_string(),
        screen_capture: OsPermissionItem {
            surface: PermissionSurface::ScreenCapture,
            state: if screen_granted { "granted" } else { "denied" }.to_string(),
            can_prompt_natively: cfg!(any(target_os = "macos", target_os = "windows")),
            settings_deep_link: settings_deep_link_for_platform(platform, PermissionSurface::ScreenCapture).to_string(),
            guidance: if screen_granted {
                "Screen Recording access verified via native OS API.".to_string()
            } else if platform == "macos" {
                "Enable OPERO in System Settings > Privacy & Security > Screen & System Audio Recording, then relaunch OPERO.".to_string()
            } else {
                "Grant Windows GraphicsCaptureAccess (Programmatic/Borderless) in Privacy Settings.".to_string()
            },
        },
        accessibility: OsPermissionItem {
            surface: PermissionSurface::Accessibility,
            state: if ax_granted { "granted" } else { "denied" }.to_string(),
            can_prompt_natively: cfg!(target_os = "macos"),
            settings_deep_link: settings_deep_link_for_platform(platform, PermissionSurface::Accessibility).to_string(),
            guidance: if ax_granted {
                "Accessibility UI tree extraction active.".to_string()
            } else if platform == "macos" {
                "Enable OPERO under Privacy & Security > Accessibility to capture exact UI button labels (signed CDHash required).".to_string()
            } else {
                "UI Automation runs at Medium IL; elevated Administrator windows trigger UIPI and automatically fall back to OCR.".to_string()
            },
        },
        microphone: OsPermissionItem {
            surface: PermissionSurface::Microphone,
            state: if speech_enabled { "not_determined" } else { "disabled_by_policy" }.to_string(),
            can_prompt_natively: speech_enabled,
            settings_deep_link: settings_deep_link_for_platform(platform, PermissionSurface::Microphone).to_string(),
            guidance: if speech_enabled {
                "Opt-in speech enabled; microphone permission requested only when dictation starts.".to_string()
            } else {
                "Disabled by local privacy policy (OPERO_SPEECH_ENABLED=false). Zero microphone access requested.".to_string()
            },
        },
        checked_at_utc: Utc::now().to_rfc3339(),
    }
}

pub fn trigger_native_permission_prompt(surface: PermissionSurface, speech_enabled: bool) -> OperoResult<OsPermissionSnapshot> {
    if surface == PermissionSurface::Microphone && !speech_enabled {
        return Err(OperoError::Forbidden(
            "Microphone prompt blocked while OPERO_SPEECH_ENABLED=false ([ARCH-003]).".to_string(),
        ));
    }

    #[cfg(target_os = "macos")]
    match surface {
        PermissionSurface::ScreenCapture => {
            let _ = macos_ffi::request_screen_capture();
        }
        PermissionSurface::Accessibility => {
            let _ = macos_ffi::request_accessibility_prompt();
        }
        PermissionSurface::Microphone => {}
    }

    Ok(inspect_os_permissions(speech_enabled))
}

pub fn open_os_privacy_settings(surface: PermissionSurface) -> OperoResult<String> {
    let platform = if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else {
        "linux"
    };
    let uri = settings_deep_link_for_platform(platform, surface);

    #[cfg(target_os = "macos")]
    {
        Command::new("/usr/bin/open")
            .arg(uri)
            .status()
            .map_err(|e| OperoError::Process(format!("Failed to open macOS System Settings: {e}")))?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer.exe")
            .arg(uri)
            .status()
            .map_err(|e| OperoError::Process(format!("Failed to open Windows Settings: {e}")))?;
    }
    Ok(uri.to_string())
}
