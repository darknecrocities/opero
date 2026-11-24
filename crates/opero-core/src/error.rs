use thiserror::Error;

#[derive(Debug, Error)]
pub enum OperoError {
    #[error("Database error: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Conflict: {0}")]
    Conflict(String),
    #[error("Security policy violation: {0}")]
    Forbidden(String),
    #[error("External process error: {0}")]
    Process(String),
}

pub type OperoResult<T> = Result<T, OperoError>;
