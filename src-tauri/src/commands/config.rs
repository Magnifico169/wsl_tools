use crate::error::AppResult;
use crate::models::WslConfigLimits;
use crate::services::config_service;

#[tauri::command]
pub fn read_wslconfig() -> AppResult<String> {
    config_service::read_wslconfig()
}

#[tauri::command]
pub fn write_wslconfig(content: String) -> AppResult<()> {
    config_service::write_wslconfig(&content)
}

#[tauri::command]
pub fn get_wslconfig_template() -> String {
    config_service::default_wslconfig_template()
}

#[tauri::command]
pub fn parse_wslconfig_limits(content: String) -> WslConfigLimits {
    config_service::parse_limits(&content)
}
