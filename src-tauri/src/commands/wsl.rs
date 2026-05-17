use crate::error::AppResult;
use crate::models::{Distro, ExportHistoryEntry, WslStatusInfo};
use crate::services::app_data::load_export_history;
use crate::services::wsl_service;

#[tauri::command]
pub async fn list_distros() -> AppResult<Vec<Distro>> {
    wsl_service::list_distros().await
}

#[tauri::command]
pub async fn get_wsl_status() -> AppResult<WslStatusInfo> {
    wsl_service::get_wsl_status().await
}

#[tauri::command]
pub async fn start_distro(name: String) -> AppResult<()> {
    wsl_service::start_distro(&name).await
}

#[tauri::command]
pub async fn stop_distro(name: String) -> AppResult<()> {
    wsl_service::stop_distro(&name).await
}

#[tauri::command]
pub async fn shutdown_wsl() -> AppResult<()> {
    wsl_service::shutdown_wsl().await
}

#[tauri::command]
pub async fn set_default_distro(name: String) -> AppResult<()> {
    wsl_service::set_default_distro(&name).await
}

#[tauri::command]
pub async fn open_terminal(name: String) -> AppResult<()> {
    wsl_service::open_terminal(&name).await
}

#[tauri::command]
pub async fn list_online_distros() -> AppResult<Vec<String>> {
    wsl_service::list_online_distros().await
}

#[tauri::command]
pub async fn install_distro(name: String) -> AppResult<()> {
    wsl_service::install_distro(&name).await
}

#[tauri::command]
pub async fn unregister_distro(name: String) -> AppResult<()> {
    wsl_service::unregister_distro(&name).await
}

#[tauri::command]
pub async fn export_distro(name: String, path: String) -> AppResult<()> {
    wsl_service::export_distro(&name, &path).await
}

#[tauri::command]
pub async fn import_distro(
    name: String,
    install_location: String,
    tar_path: String,
) -> AppResult<()> {
    wsl_service::import_distro(&name, &install_location, &tar_path).await
}

#[tauri::command]
pub fn get_export_history() -> Vec<ExportHistoryEntry> {
    load_export_history()
}
