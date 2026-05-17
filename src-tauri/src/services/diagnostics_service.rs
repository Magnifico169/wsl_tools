use crate::error::AppResult;
use crate::models::{DiagnosticsInfo, WindowsFeature};
use crate::services::process_runner::run_program_allow_failure;

pub async fn get_diagnostics() -> AppResult<DiagnosticsInfo> {
    let wsl_status = run_program_allow_failure("wsl", &["--status"])
        .await
        .map(|o| o.text())
        .unwrap_or_else(|_| "н/д".to_string());

    let wsl_version = run_program_allow_failure("wsl", &["--version"])
        .await
        .map(|o| o.text())
        .unwrap_or_else(|_| "н/д".to_string());

    let windows_version = run_program_allow_failure("cmd", &["/C", "ver"])
        .await
        .map(|o| o.text().trim().to_string())
        .unwrap_or_else(|_| "н/д".to_string());

    let features = get_wsl_features().await.unwrap_or_default();

    Ok(DiagnosticsInfo {
        wsl_status,
        wsl_version,
        windows_version,
        features,
    })
}

async fn get_wsl_features() -> AppResult<Vec<WindowsFeature>> {
    let script = r#"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Get-WindowsOptionalFeature -Online |
  Where-Object { $_.FeatureName -match 'Microsoft-Windows-Subsystem-Linux|VirtualMachinePlatform' } |
  Select-Object FeatureName, State |
  ConvertTo-Json -Compress
"#;

    let output = run_program_allow_failure(
        "powershell",
        &["-NoProfile", "-OutputFormat", "Text", "-Command", script],
    )
    .await?;

    let json = output.text();
    if json.trim().is_empty() {
        return Ok(Vec::new());
    }

    #[derive(serde::Deserialize)]
    struct PsFeature {
        #[serde(rename = "FeatureName")]
        name: String,
        #[serde(rename = "State")]
        state: serde_json::Value,
    }

    let parsed: Result<serde_json::Value, _> = serde_json::from_str(json.trim());
    let mut features = Vec::new();

    if let Ok(value) = parsed {
        let items = match value {
            serde_json::Value::Array(arr) => arr,
            obj @ serde_json::Value::Object(_) => vec![obj],
            _ => vec![],
        };
        for item in items {
            if let Ok(f) = serde_json::from_value::<PsFeature>(item) {
                let state = match f.state {
                    serde_json::Value::Number(n) => n.to_string(),
                    serde_json::Value::String(s) => s,
                    other => other.to_string(),
                };
                features.push(WindowsFeature {
                    name: f.name,
                    state,
                });
            }
        }
    }

    Ok(features)
}
