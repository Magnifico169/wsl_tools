use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Distro {
    pub name: String,
    pub state: DistroState,
    pub version: u8,
    pub is_default: bool,
    pub os_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DistroState {
    Running,
    Stopped,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslStatusInfo {
    pub installed: bool,
    pub default_version: Option<u8>,
    pub status_text: String,
    pub version_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInfo {
    pub ip_addresses: Vec<String>,
    pub network_mode: String,
    pub port_proxies: Vec<PortProxy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortProxy {
    pub listen_address: String,
    pub listen_port: String,
    pub connect_address: String,
    pub connect_port: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceUsage {
    pub distro_name: String,
    pub memory_used_mb: Option<f64>,
    pub memory_total_mb: Option<f64>,
    pub memory_limit_mb: Option<f64>,
    pub cpu_count: Option<u32>,
    pub processor_limit: Option<u32>,
    pub swap_limit_mb: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: String,
    pub command: String,
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsInfo {
    pub wsl_status: String,
    pub wsl_version: String,
    pub windows_version: String,
    pub features: Vec<WindowsFeature>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsFeature {
    pub name: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportHistoryEntry {
    pub distro_name: String,
    pub path: String,
    pub exported_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslConfigLimits {
    pub memory: Option<String>,
    pub processors: Option<u32>,
    pub swap: Option<String>,
    pub localhost_forwarding: Option<bool>,
}
