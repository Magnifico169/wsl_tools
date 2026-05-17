use crate::error::AppResult;
use crate::models::{DiagnosticsInfo, LogEntry};
use crate::services::diagnostics_service;
use crate::services::process_runner;
use std::fs;

#[tauri::command]
pub async fn get_diagnostics() -> AppResult<DiagnosticsInfo> {
    diagnostics_service::get_diagnostics().await
}

#[tauri::command]
pub fn get_logs() -> Vec<LogEntry> {
    process_runner::get_logs()
}

#[tauri::command]
pub fn clear_logs() {
    process_runner::clear_logs();
}

#[tauri::command]
pub fn export_logs_to_file(path: String) -> AppResult<()> {
    let logs = process_runner::get_logs();
    let mut content = String::new();
    for log in logs {
        content.push_str(&format!(
            "[{}] {} ({})\nSTDOUT:\n{}\nSTDERR:\n{}\n\n",
            log.timestamp,
            log.command,
            if log.success { "OK" } else { "FAIL" },
            log.stdout,
            log.stderr
        ));
    }
    fs::write(path, content).map_err(crate::error::AppError::Io)?;
    Ok(())
}
