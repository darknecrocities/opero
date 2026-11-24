use std::path::PathBuf;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().json().init();
    let data_dir = std::env::var("OPERO_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./data"));
    let speech_enabled = std::env::var("OPERO_SPEECH_ENABLED")
        .map(|v| v == "true")
        .unwrap_or(false);
    let port: u16 = std::env::var("OPERO_DAEMON_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(4317);

    opero_daemon::start_embedded_daemon(data_dir, port, speech_enabled).await;
}
