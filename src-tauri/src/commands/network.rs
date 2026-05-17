use crate::error::AppResult;
use crate::models::{NetworkInfo, ResourceUsage};
use crate::services::network_service;

#[tauri::command]
pub async fn get_network_info(distro_name: Option<String>) -> AppResult<NetworkInfo> {
    network_service::get_network_info(distro_name.as_deref()).await
}

#[tauri::command]
pub async fn get_resource_usage(distro_name: String) -> AppResult<ResourceUsage> {
    network_service::get_resource_usage(&distro_name).await
}

#[tauri::command]
pub fn get_portproxy_command(listen_port: u16, connect_port: u16, connect_ip: String) -> String {
    network_service::portproxy_add_command(listen_port, connect_port, &connect_ip)
}
