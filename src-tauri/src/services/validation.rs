use crate::error::{AppError, AppResult};
use regex::Regex;
use once_cell::sync::Lazy;

static DISTRO_NAME_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[a-zA-Z0-9._-]+$").expect("valid distro name regex"));

pub fn validate_distro_name(name: &str) -> AppResult<()> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidDistroName(name.to_string()));
    }
    if !DISTRO_NAME_RE.is_match(trimmed) {
        return Err(AppError::InvalidDistroName(name.to_string()));
    }
    Ok(())
}
