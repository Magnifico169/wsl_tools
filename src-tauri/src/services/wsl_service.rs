use crate::error::{map_distro_error, AppError, AppResult};
use crate::models::{Distro, DistroState, ExportHistoryEntry, WslStatusInfo};
use crate::services::app_data::append_export_history;
use crate::services::process_runner::{run_program_allow_failure, run_wsl, spawn_hidden};
use crate::services::validation::validate_distro_name;
use regex::Regex;
use std::path::Path;

pub fn parse_distro_list(output: &str) -> Vec<Distro> {
    let mut distros = Vec::new();
    let version_re = Regex::new(r"^\s*(\*?)\s*(\S+)\s+(Running|Stopped)\s+(\d+)\s*$").ok();
    let legacy_re = Regex::new(r"^\s*(\*?)\s*(\S+)\s+(Running|Stopped)\s*$").ok();

    for line in output.lines() {
        let line = line.trim();
        if line.is_empty()
            || line.starts_with("NAME")
            || line.starts_with("---")
            || line.contains("Windows Subsystem")
        {
            continue;
        }

        if let Some(re) = &version_re {
            if let Some(caps) = re.captures(line) {
                let is_default = caps.get(1).map(|m| !m.as_str().is_empty()).unwrap_or(false);
                let name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
                let state = parse_state(caps.get(3).map(|m| m.as_str()).unwrap_or(""));
                let version: u8 = caps
                    .get(4)
                    .and_then(|m| m.as_str().parse().ok())
                    .unwrap_or(2);
                distros.push(Distro {
                    name,
                    state,
                    version,
                    is_default,
                    os_version: None,
                });
                continue;
            }
        }

        if let Some(re) = &legacy_re {
            if let Some(caps) = re.captures(line) {
                let is_default = caps.get(1).map(|m| !m.as_str().is_empty()).unwrap_or(false);
                let name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
                let state = parse_state(caps.get(3).map(|m| m.as_str()).unwrap_or(""));
                distros.push(Distro {
                    name,
                    state,
                    version: 2,
                    is_default,
                    os_version: None,
                });
            }
        }
    }

    distros
}

fn parse_state(s: &str) -> DistroState {
    match s.to_lowercase().as_str() {
        "running" => DistroState::Running,
        "stopped" => DistroState::Stopped,
        _ => DistroState::Unknown,
    }
}

pub async fn list_distros() -> AppResult<Vec<Distro>> {
    let output = run_wsl(&["--list", "--verbose"], false).await?;
    let mut distros = parse_distro_list(&output.text());

    for distro in &mut distros {
        if distro.state == DistroState::Running {
            distro.os_version = fetch_os_version(&distro.name).await.ok();
        }
    }

    Ok(distros)
}

async fn fetch_os_version(name: &str) -> AppResult<String> {
    let out = run_wsl(
        &[
            "-d",
            name,
            "--",
            "sh",
            "-c",
            "cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"'",
        ],
        false,
    )
    .await?;
    Ok(out.text().trim().to_string())
}

pub async fn get_wsl_status() -> AppResult<WslStatusInfo> {
    let status = run_program_allow_failure("wsl", &["--status"]).await;
    let version = run_program_allow_failure("wsl", &["--version"]).await;

    let installed = status.is_ok() || version.is_ok();
    let status_text = status
        .map(|o| o.text())
        .unwrap_or_else(|_| "WSL недоступен".to_string());
    let version_text = version.map(|o| o.text()).unwrap_or_default();

    let default_version = version_text
        .lines()
        .find(|l| l.to_lowercase().contains("default version"))
        .and_then(|l| l.chars().find(|c| c.is_ascii_digit()))
        .map(|c| c.to_digit(10).unwrap_or(2) as u8);

    Ok(WslStatusInfo {
        installed,
        default_version,
        status_text,
        version_text,
    })
}

pub async fn start_distro(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    run_wsl(&["-d", name, "--", "true"], false)
        .await
        .map_err(|e| map_distro_error(name, e))?;
    Ok(())
}

pub async fn stop_distro(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    run_wsl(&["--terminate", name], false)
        .await
        .map_err(|e| map_distro_error(name, e))?;
    Ok(())
}

pub async fn shutdown_wsl() -> AppResult<()> {
    run_wsl(&["--shutdown"], false).await?;
    Ok(())
}

pub async fn set_default_distro(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    run_wsl(&["--set-default", name], false)
        .await
        .map_err(|e| map_distro_error(name, e))?;
    Ok(())
}

pub async fn list_online_distros() -> AppResult<Vec<String>> {
    let output = run_wsl(&["--list", "--online"], false).await?;
    let mut names = Vec::new();
    for line in output.text().lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("NAME") || line.starts_with("---") {
            continue;
        }
        if let Some(name) = line.split_whitespace().next() {
            names.push(name.to_string());
        }
    }
    Ok(names)
}

pub async fn install_distro(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    run_wsl(&["--install", "-d", name, "--no-launch"], true).await?;
    Ok(())
}

pub async fn unregister_distro(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    run_wsl(&["--unregister", name], false)
        .await
        .map_err(|e| map_distro_error(name, e))?;
    Ok(())
}

pub async fn export_distro(name: &str, path: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    if path.trim().is_empty() {
        return Err(AppError::Other("Путь экспорта не указан".to_string()));
    }
    run_wsl(&["--export", name, path], true)
        .await
        .map_err(|e| map_distro_error(name, e))?;
    append_export_history(ExportHistoryEntry {
        distro_name: name.to_string(),
        path: path.to_string(),
        exported_at: chrono::Utc::now().to_rfc3339(),
    })
    .map_err(|e| AppError::Io(e))?;
    Ok(())
}

pub async fn import_distro(name: &str, install_location: &str, tar_path: &str) -> AppResult<()> {
    validate_distro_name(name)?;
    if !Path::new(tar_path).exists() {
        return Err(AppError::Other(format!("Файл не найден: {tar_path}")));
    }
    run_wsl(
        &[
            "--import",
            name,
            install_location,
            tar_path,
            "--version",
            "2",
        ],
        true,
    )
    .await?;
    Ok(())
}

pub async fn open_terminal(name: &str) -> AppResult<()> {
    validate_distro_name(name)?;

    if spawn_hidden("wt", &["-w", "0", "new-tab", "wsl", "-d", name])
        .await
        .is_ok()
    {
        return Ok(());
    }

    if spawn_hidden("cmd", &["/C", "start", "", "wt", "wsl", "-d", name])
        .await
        .is_ok()
    {
        return Ok(());
    }

    Err(AppError::Other(
        "Не удалось открыть Windows Terminal. Установите wt.exe из Microsoft Store.".to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_verbose_list() {
        let sample = r"
  NAME      STATE           VERSION
* Ubuntu    Running         2
  Debian    Stopped         2
";
        let distros = parse_distro_list(sample);
        assert_eq!(distros.len(), 2);
        assert!(distros[0].is_default);
        assert_eq!(distros[0].name, "Ubuntu");
        assert_eq!(distros[0].state, DistroState::Running);
    }
}
