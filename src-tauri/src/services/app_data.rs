use crate::models::ExportHistoryEntry;
use std::fs;
use std::path::PathBuf;

pub fn app_data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("wsl-tools")
}

pub fn ensure_app_data() -> std::io::Result<PathBuf> {
    let dir = app_data_dir();
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn history_path() -> PathBuf {
    app_data_dir().join("export-history.json")
}

pub fn load_export_history() -> Vec<ExportHistoryEntry> {
    let path = history_path();
    if !path.exists() {
        return Vec::new();
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_export_history(entries: &[ExportHistoryEntry]) -> std::io::Result<()> {
    ensure_app_data()?;
    let json = serde_json::to_string_pretty(entries)?;
    fs::write(history_path(), json)
}

pub fn append_export_history(entry: ExportHistoryEntry) -> std::io::Result<()> {
    let mut entries = load_export_history();
    entries.insert(0, entry);
    entries.truncate(20);
    save_export_history(&entries)
}
