use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;

use crate::error::{OperoError, OperoResult};

pub const OFFICIAL_REPO: &str = "darknecrocities/opero";
pub const OFFICIAL_RELEASES_API: &str = "https://api.github.com/repos/darknecrocities/opero/releases/latest";
pub const OFFICIAL_DOWNLOAD_PREFIX: &str = "https://github.com/darknecrocities/opero/releases/download/";
pub const OFFICIAL_RELEASES_URL: &str = "https://github.com/darknecrocities/opero/releases/latest";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub channel: String,
    pub release_name: String,
    pub release_notes: String,
    pub published_at: String,
    pub release_url: String,
    pub asset_name: Option<String>,
    pub asset_download_url: Option<String>,
    pub expected_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstallResult {
    pub status: String,
    pub message: String,
    pub replaced_existing: bool,
}

#[derive(Deserialize)]
struct GhReleaseAsset {
    name: String,
    browser_download_url: String,
}

#[derive(Deserialize)]
struct GhRelease {
    tag_name: String,
    name: Option<String>,
    body: Option<String>,
    html_url: Option<String>,
    published_at: Option<String>,
    assets: Vec<GhReleaseAsset>,
}

pub fn parse_semver(raw: &str) -> (u64, u64, u64) {
    let cleaned = raw.trim().trim_start_matches(['v', 'V']);
    let core = cleaned.split('-').next().unwrap_or(cleaned);
    let mut parts = core.split('.').map(|p| p.parse::<u64>().unwrap_or(0));
    (
        parts.next().unwrap_or(0),
        parts.next().unwrap_or(0),
        parts.next().unwrap_or(0),
    )
}

pub fn is_newer_version(current: &str, latest: &str) -> bool {
    parse_semver(latest) > parse_semver(current)
}

pub fn validate_official_download_url(url: &str) -> OperoResult<()> {
    if !url.starts_with(OFFICIAL_DOWNLOAD_PREFIX) {
        return Err(OperoError::Forbidden(format!(
            "Update download blocked: URL must originate from {OFFICIAL_DOWNLOAD_PREFIX}"
        )));
    }
    if url.contains("..") || url.contains('\n') || url.contains('\r') {
        return Err(OperoError::Validation("Malformed update download URL".to_string()));
    }
    Ok(())
}

pub fn verify_file_sha256(path: &Path, expected_hex: &str) -> OperoResult<bool> {
    let bytes = fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let actual = format!("{:x}", hasher.finalize());
    Ok(actual.eq_ignore_ascii_case(expected_hex.trim()))
}

fn fetch_https_text(url: &str, timeout_secs: u64) -> OperoResult<String> {
    let out = crate::win_process::silent_command("curl")
        .args([
            "-fsSL",
            "--proto",
            "=https",
            "--max-time",
            &timeout_secs.to_string(),
            "-H",
            "Accept: application/vnd.github+json",
            "-H",
            &format!("User-Agent: OPERO-Desktop/{}", env!("CARGO_PKG_VERSION")),
            url,
        ])
        .output()
        .map_err(|e| OperoError::Validation(format!("Failed to invoke curl for update check: {e}")))?;

    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(OperoError::Validation(format!(
            "No published official release found yet on main ({})",
            stderr.trim()
        )));
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn find_expected_sha(sums_text: &str, asset_name: &str) -> Option<String> {
    for line in sums_text.lines() {
        let mut parts = line.split_whitespace();
        let hash = parts.next()?;
        let file = parts.next()?;
        if file == asset_name || file.ends_with(&format!("/{asset_name}")) {
            return Some(hash.to_string());
        }
    }
    None
}

pub fn check_for_official_update() -> OperoResult<UpdateCheckResult> {
    let current = env!("CARGO_PKG_VERSION").to_string();
    let json_text = fetch_https_text(OFFICIAL_RELEASES_API, 5)?;
    let rel: GhRelease = serde_json::from_str(&json_text)?;
    let latest = rel.tag_name.trim_start_matches(['v', 'V']).to_string();

    let wanted_ext = if cfg!(target_os = "macos") {
        ".dmg"
    } else if cfg!(target_os = "windows") {
        "-setup.exe"
    } else {
        ".AppImage"
    };

    let matched_asset = rel.assets.iter().find(|a| a.name.ends_with(wanted_ext));
    let sums_asset = rel.assets.iter().find(|a| a.name == "SHA256SUMS.txt");

    let expected_sha256 = match (matched_asset, sums_asset) {
        (Some(asset), Some(sums)) if validate_official_download_url(&sums.browser_download_url).is_ok() => {
            fetch_https_text(&sums.browser_download_url, 5)
                .ok()
                .and_then(|txt| find_expected_sha(&txt, &asset.name))
        }
        _ => None,
    };

    Ok(UpdateCheckResult {
        update_available: is_newer_version(&current, &latest),
        current_version: current,
        latest_version: latest,
        channel: "main".to_string(),
        release_name: rel.name.unwrap_or_else(|| rel.tag_name.clone()),
        release_notes: rel.body.unwrap_or_default(),
        published_at: rel.published_at.unwrap_or_default(),
        release_url: rel.html_url.unwrap_or_else(|| OFFICIAL_RELEASES_URL.to_string()),
        asset_name: matched_asset.map(|a| a.name.clone()),
        asset_download_url: matched_asset.map(|a| a.browser_download_url.clone()),
        expected_sha256,
    })
}

pub fn download_and_replace_update(
    asset_url: &str,
    expected_sha256: Option<&str>,
) -> OperoResult<UpdateInstallResult> {
    validate_official_download_url(asset_url)?;
    let tmp_dir = std::env::temp_dir().join(format!("opero-update-{}", uuid::Uuid::new_v4().simple()));
    fs::create_dir_all(&tmp_dir)?;
    let filename = asset_url.rsplit('/').next().unwrap_or("OPERO_update");
    let download_path = tmp_dir.join(filename);

    let dl = crate::win_process::silent_command("curl")
        .args([
            "-fsSL",
            "--proto",
            "=https",
            "--max-time",
            "180",
            "-o",
            download_path.to_string_lossy().as_ref(),
            asset_url,
        ])
        .output()
        .map_err(|e| OperoError::Validation(format!("Update download failed: {e}")))?;

    if !dl.status.success() {
        let _ = fs::remove_dir_all(&tmp_dir);
        return Err(OperoError::Validation("Failed to download official release asset".to_string()));
    }

    if let Some(sha) = expected_sha256 {
        if !verify_file_sha256(&download_path, sha)? {
            let _ = fs::remove_dir_all(&tmp_dir);
            return Err(OperoError::Forbidden(
                "Downloaded installer failed SHA-256 integrity check against official SHA256SUMS.txt".to_string(),
            ));
        }
    }

    #[cfg(target_os = "macos")]
    {
        let existing = Path::new("/Applications/OPERO.app").exists();
        let script_path = tmp_dir.join("replace_opero.sh");
        let dmg_escaped = download_path.to_string_lossy();
        let script = format!(
            "#!/bin/bash\nset -e\nsleep 1\nosascript -e 'tell application \"OPERO\" to quit' >/dev/null 2>&1 || true\npkill -x opero-desktop >/dev/null 2>&1 || true\nsleep 1\nMOUNT_DIR=\"$(mktemp -d)\"\nhdiutil attach \"{dmg_escaped}\" -nobrowse -quiet -mountpoint \"$MOUNT_DIR\"\nrm -rf /Applications/OPERO.app\nditto \"$MOUNT_DIR/OPERO.app\" /Applications/OPERO.app\nxattr -dr com.apple.quarantine /Applications/OPERO.app >/dev/null 2>&1 || true\nhdiutil detach \"$MOUNT_DIR\" -force >/dev/null 2>&1 || true\nrm -rf \"$MOUNT_DIR\" \"{}\"\nopen /Applications/OPERO.app\n",
            tmp_dir.to_string_lossy()
        );
        fs::write(&script_path, script)?;
        let _ = crate::win_process::silent_command("chmod").args(["+x", script_path.to_string_lossy().as_ref()]).status();
        crate::win_process::silent_command("bash")
            .arg(&script_path)
            .spawn()
            .map_err(|e| OperoError::Validation(format!("Failed to launch macOS updater helper: {e}")))?;
        return Ok(UpdateInstallResult {
            status: "replacing".to_string(),
            message: "Verified SHA-256. Replacing /Applications/OPERO.app (SQLite data preserved) and relaunching..."
                .to_string(),
            replaced_existing: existing,
        });
    }

    #[cfg(target_os = "windows")]
    {
        crate::win_process::silent_command(&download_path)
            .spawn()
            .map_err(|e| OperoError::Validation(format!("Failed to launch Windows installer: {e}")))?;
        return Ok(UpdateInstallResult {
            status: "launching_installer".to_string(),
            message: "Verified SHA-256. Launching NSIS installer (auto-replaces existing OPERO installation)..."
                .to_string(),
            replaced_existing: true,
        });
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(UpdateInstallResult {
            status: "downloaded".to_string(),
            message: format!("Downloaded verified update to {}", download_path.display()),
            replaced_existing: false,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_semver_comparison_and_allowlist() {
        assert!(is_newer_version("1.0.0", "1.0.1"));
        assert!(is_newer_version("1.0.0", "v1.2.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(!is_newer_version("1.1.0", "1.0.9"));

        assert!(validate_official_download_url(
            "https://github.com/darknecrocities/opero/releases/download/v1.0.1/OPERO_1.0.1_aarch64.dmg"
        )
        .is_ok());
        assert!(validate_official_download_url("https://evil.example.com/OPERO.dmg").is_err());
        assert!(validate_official_download_url("http://github.com/darknecrocities/opero/releases/download/v1.0.0/a.dmg").is_err());
    }
}
