mod commands;
mod error;
mod models;
mod services;
mod util;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_distros,
            get_wsl_status,
            start_distro,
            stop_distro,
            shutdown_wsl,
            set_default_distro,
            open_terminal,
            list_online_distros,
            install_distro,
            unregister_distro,
            export_distro,
            import_distro,
            get_export_history,
            read_wslconfig,
            write_wslconfig,
            get_wslconfig_template,
            parse_wslconfig_limits,
            get_network_info,
            get_resource_usage,
            get_portproxy_command,
            get_diagnostics,
            get_logs,
            clear_logs,
            export_logs_to_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
