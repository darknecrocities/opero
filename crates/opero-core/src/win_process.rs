use std::ffi::OsStr;
use std::process::Command;

/// Creates a `std::process::Command` that suppresses console/PowerShell window creation
/// on Windows (`CREATE_NO_WINDOW = 0x08000000`) while remaining a zero-cost pass-through
/// on macOS and Linux.
pub fn silent_command<S: AsRef<OsStr>>(program: S) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    cmd
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_silent_command_builder_constructs_cleanly() {
        let cmd = silent_command("echo");
        assert_eq!(cmd.get_program(), "echo");
    }

    #[test]
    fn test_no_unwrapped_windows_command_new_in_opero_core() {
        let src_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
        let allowed_raw = [
            "win_process.rs",
            "capture.rs",           // macOS-only /usr/sbin/screencapture
            "permissions",          // macOS open/sw_vers + Windows explorer.exe GUI settings
        ];
        let mut offenders = Vec::new();
        for entry in walk_rs_files(&src_dir) {
            let rel = entry.strip_prefix(&src_dir).unwrap_or(&entry).to_string_lossy().replace('\\', "/");
            if allowed_raw.iter().any(|a| rel == *a || rel.starts_with(&format!("{a}/"))) {
                continue;
            }
            if let Ok(content) = std::fs::read_to_string(&entry) {
                for (idx, line) in content.lines().enumerate() {
                    if line.contains("Command::new(") {
                        offenders.push(format!("{rel}:{}: {}", idx + 1, line.trim()));
                    }
                }
            }
        }
        assert!(
            offenders.is_empty(),
            "Found raw Command::new() calls in opero-core that can flash Windows console windows (use crate::win_process::silent_command instead):\n{}",
            offenders.join("\n")
        );
    }

    fn walk_rs_files(dir: &Path) -> Vec<std::path::PathBuf> {
        let mut out = Vec::new();
        if let Ok(entries) = std::fs::read_dir(dir) {
            for e in entries.flatten() {
                let p = e.path();
                if p.is_dir() {
                    out.extend(walk_rs_files(&p));
                } else if p.extension().and_then(|s| s.to_str()) == Some("rs") {
                    out.push(p);
                }
            }
        }
        out
    }
}
