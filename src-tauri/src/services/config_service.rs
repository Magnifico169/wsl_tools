use crate::error::{AppError, AppResult};
use crate::models::WslConfigLimits;
use std::fs;
use std::path::PathBuf;

pub fn wslconfig_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".wslconfig")
}

pub fn read_wslconfig() -> AppResult<String> {
    let path = wslconfig_path();
    if !path.exists() {
        return Ok(default_wslconfig_template());
    }
    fs::read_to_string(&path).map_err(AppError::Io)
}

pub fn write_wslconfig(content: &str) -> AppResult<()> {
    validate_wslconfig(content)?;
    fs::write(wslconfig_path(), content).map_err(AppError::Io)?;
    Ok(())
}

pub fn default_wslconfig_template() -> String {
    r#"[wsl2]
memory=4GB
processors=4
swap=8GB
localhostForwarding=true
"#
    .to_string()
}

pub fn validate_wslconfig(content: &str) -> AppResult<()> {
    let mut in_section = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with(';') {
            continue;
        }
        if trimmed.starts_with('[') {
            if !trimmed.ends_with(']') {
                return Err(AppError::Other(format!("Некорректная секция: {trimmed}")));
            }
            in_section = true;
            continue;
        }
        if !in_section && trimmed.contains('=') {
            // allow key=value before any section
        }
        if trimmed.contains('=') {
            let parts: Vec<&str> = trimmed.splitn(2, '=').collect();
            if parts.len() != 2 || parts[0].trim().is_empty() {
                return Err(AppError::Other(format!("Некорректная строка: {trimmed}")));
            }
        } else {
            return Err(AppError::Other(format!("Некорректная строка: {trimmed}")));
        }
    }
    Ok(())
}

pub fn parse_limits(content: &str) -> WslConfigLimits {
    let mut limits = WslConfigLimits {
        memory: None,
        processors: None,
        swap: None,
        localhost_forwarding: None,
    };

    let mut in_wsl2 = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.eq_ignore_ascii_case("[wsl2]") {
            in_wsl2 = true;
            continue;
        }
        if trimmed.starts_with('[') {
            in_wsl2 = false;
            continue;
        }
        if !in_wsl2 {
            continue;
        }
        if let Some((key, value)) = trimmed.split_once('=') {
            let key = key.trim().to_lowercase();
            let value = value.trim();
            match key.as_str() {
                "memory" => limits.memory = Some(value.to_string()),
                "processors" => {
                    limits.processors = value.parse().ok();
                }
                "swap" => limits.swap = Some(value.to_string()),
                "localhostforwarding" => {
                    limits.localhost_forwarding = Some(value.eq_ignore_ascii_case("true"));
                }
                _ => {}
            }
        }
    }

    limits
}

fn parse_memory_to_mb(s: &str) -> Option<f64> {
    let s = s.trim().to_uppercase();
    if let Some(num) = s.strip_suffix("GB") {
        return num.trim().parse::<f64>().ok().map(|n| n * 1024.0);
    }
    if let Some(num) = s.strip_suffix("MB") {
        return num.trim().parse().ok();
    }
    s.parse().ok()
}

pub fn memory_limit_mb(content: &str) -> Option<f64> {
    parse_limits(content)
        .memory
        .as_deref()
        .and_then(parse_memory_to_mb)
}
